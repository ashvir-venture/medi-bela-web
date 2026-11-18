'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fmt, formatNumber, type Lang } from '@/i18n'
import { toErrorCode } from '@/lib/errors'
import { api, formatDuration, type MyStatus } from '@/lib/game'
import { Leaderboard } from './Leaderboard'
import { Onboarding } from './Onboarding'
import { Polls } from './Polls'
import { QuestionView } from './QuestionView'
import { AuthGate, CountUp, Countdown, ErrorNote, GameCard, Loading, friendlyError, type GameDict } from './GameParts'
import { useAuth } from './useAuth'

type View =
  | { k: 'status' }
  | { k: 'error'; text: string }
  | { k: 'onboarding'; status: MyStatus }
  | { k: 'lobby'; status: MyStatus }
  | { k: 'playing'; attemptId: string }
  | { k: 'result'; total: number; timeMs: number }

/**
 * /[lang]/play: gate → onboarding → lobby → questions → result (+ polls).
 * The client-side flow is only UX; every rule is enforced by the database RPCs.
 */
export function PlayApp({ lang, t }: { lang: Lang; t: GameDict }) {
  const auth = useAuth()
  const router = useRouter()
  const [view, setView] = useState<View>({ k: 'status' })
  const [status, setStatus] = useState<MyStatus | null>(null)

  const sb = auth.status === 'signed_in' ? auth.sb : null

  const refresh = useCallback(async () => {
    if (!sb) return
    try {
      const s = await api.myStatus(sb)
      setStatus(s)
      if (!s.onboarded) setView({ k: 'onboarding', status: s })
      else setView({ k: 'lobby', status: s })
    } catch (err) {
      const code = toErrorCode(err)
      if (code === 'session_expired' || code === 'not_authenticated') await sb.auth.signOut()
      else setView({ k: 'error', text: friendlyError(t, err) })
    }
  }, [sb, t])

  useEffect(() => {
    // Load the player's status from the database once signed in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sb) void refresh()
  }, [sb, refresh])

  const sessionEnded = useCallback(() => {
    void sb?.auth.signOut()
  }, [sb])

  const finished = useCallback(
    (total: number, timeMs: number) => {
      setView({ k: 'result', total, timeMs })
      // Pull rank/best for the result screen.
      if (sb) void api.myStatus(sb).then(setStatus).catch(() => undefined)
    },
    [sb],
  )

  if (auth.status === 'loading') return <Loading label={t.game.loading} />
  if (auth.status === 'not_configured') return <GameCard><ErrorNote text={t.errors.not_configured} /></GameCard>
  if (auth.status === 'signed_out') {
    return <AuthGate sb={auth.sb} t={t} title={t.game.gate.title} body={t.game.gate.body} />
  }

  const signOut = (
    <button type="button" className="link-btn" onClick={() => void auth.sb.auth.signOut()}>
      {t.game.signOut}
    </button>
  )

  switch (view.k) {
    case 'status':
      return <Loading label={t.game.loading} />
    case 'error':
      return (
        <GameCard>
          <ErrorNote
            text={view.text}
            action={
              <button className="btn btn-outline btn-sm" onClick={() => void refresh()}>
                ↻
              </button>
            }
          />
        </GameCard>
      )
    case 'onboarding':
      return (
        <Onboarding
          sb={auth.sb}
          lang={lang}
          t={t}
          status={view.status}
          onDone={(chosen) => {
            if (chosen !== lang) router.push(`/${chosen}/play/`)
            else void refresh()
          }}
        />
      )
    case 'lobby':
      return (
        <Lobby
          sb={auth.sb}
          lang={lang}
          t={t}
          status={view.status}
          onPlay={(attemptId) => setView({ k: 'playing', attemptId })}
          onRefresh={() => void refresh()}
          signOut={signOut}
        />
      )
    case 'playing':
      return (
        <QuestionView
          sb={auth.sb}
          lang={lang}
          t={t}
          attemptId={view.attemptId}
          onFinished={finished}
          onSessionEnded={sessionEnded}
        />
      )
    case 'result':
      return (
        <GameCard wide>
          <p className="eyebrow">{t.game.result.title}</p>
          <p className="result-score">
            <CountUp value={view.total} duration={1400} /> <small>{t.game.result.points}</small>
          </p>
          <dl className="stats">
            <div>
              <dt>{t.game.result.time}</dt>
              <dd className="num">{formatDuration(view.timeMs)}</dd>
            </div>
            <div>
              <dt>{t.game.result.rank}</dt>
              <dd className="num">{status?.my_rank ? `#${status.my_rank}` : t.game.lobby.noRank}</dd>
            </div>
            <div>
              <dt>{t.game.result.best}</dt>
              <dd className="num">{status?.best_score != null ? formatNumber(status.best_score) : '–'}</dd>
            </div>
          </dl>
          <Polls sb={auth.sb} lang={lang} t={t} />
          <Leaderboard t={t.play} limit={10} highlightName={status?.display_name} title={t.game.result.top10} />
          <div className="come-back">
            <p>{t.game.result.comeBack}</p>
            {status && (
              <p className="game-hint">
                {t.game.result.nextIn} <Countdown to={status.next_reset_at} onDone={() => void refresh()} />
              </p>
            )}
          </div>
          <div className="game-footer">
            <Link href={`/${lang}/`}>{t.game.back}</Link>
            {signOut}
          </div>
        </GameCard>
      )
  }
}

function Lobby({
  sb,
  lang,
  t,
  status,
  onPlay,
  onRefresh,
  signOut,
}: {
  sb: SupabaseClient
  lang: Lang
  t: GameDict
  status: MyStatus
  onPlay: (attemptId: string) => void
  onRefresh: () => void
  signOut: React.ReactNode
}) {
  const l = t.game.lobby
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const id = await api.startAttempt(sb)
      onPlay(id)
    } catch (err) {
      setError(friendlyError(t, err))
      setBusy(false)
    }
  }

  const inProgress = status.attempt_status === 'in_progress' && status.attempt_id
  const playedToday = status.played_today && status.attempt_status === 'completed'

  return (
    <GameCard wide>
      <p className="eyebrow">{fmt(l.hello, { name: status.display_name ?? '' })}</p>

      {inProgress ? (
        <>
          <h1 className="game-title">{l.readyTitle}</h1>
          <p className="game-body">{l.resumeNote}</p>
          <button type="button" className="btn btn-accent btn-lg btn-block" onClick={() => onPlay(status.attempt_id!)}>
            {l.resume} <span className="arrow" aria-hidden="true">→</span>
          </button>
        </>
      ) : playedToday ? (
        <>
          <h1 className="game-title">{l.playedTitle}</h1>
          <dl className="stats">
            <div>
              <dt>{l.todayScore}</dt>
              <dd className="num">{formatNumber(status.today_score ?? 0)}</dd>
            </div>
            <div>
              <dt>{l.best}</dt>
              <dd className="num">{status.best_score != null ? formatNumber(status.best_score) : '–'}</dd>
            </div>
            <div>
              <dt>{l.rank}</dt>
              <dd className="num">{status.my_rank ? `#${status.my_rank}` : l.noRank}</dd>
            </div>
          </dl>
          <p className="game-hint">
            {l.nextIn} <Countdown to={status.next_reset_at} onDone={onRefresh} />
          </p>
        </>
      ) : !status.contest_open ? (
        <>
          <h1 className="game-title">{l.closedTitle}</h1>
          <p className="game-body">{l.closedBody}</p>
        </>
      ) : (
        <>
          <h1 className="game-title">{l.readyTitle}</h1>
          <ul className="lobby-rules">
            {l.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {error && <ErrorNote text={error} />}
          <button type="button" className="btn btn-accent btn-lg btn-block" onClick={start} disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" /> {l.starting}
              </>
            ) : (
              <>
                {l.start} <span className="arrow" aria-hidden="true">→</span>
              </>
            )}
          </button>
        </>
      )}

      <div style={{ marginTop: 'var(--sp-6)' }}>
        <Leaderboard t={t.play} limit={10} highlightName={status.display_name} title={t.game.result.top10} />
      </div>

      <div className="game-footer">
        <Link href={`/${lang}/`}>{t.game.back}</Link>
        {signOut}
      </div>
    </GameCard>
  )
}
