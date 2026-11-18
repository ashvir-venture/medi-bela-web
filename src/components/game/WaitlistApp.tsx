'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { fmt, type Lang } from '@/i18n'
import { toErrorCode } from '@/lib/errors'
import { api, type MyStatus } from '@/lib/game'
import { formatBdPhone } from '@/lib/phone'
import { AuthGate, ErrorNote, GameCard, Loading, friendlyError, type GameDict } from './GameParts'
import { useAuth } from './useAuth'

/**
 * /[lang]/waitlist: account (mobile + password) + consent puts the person on the waitlist without
 * playing. Their name and mobile number are copied (privately) into profiles by the sign-up trigger.
 */
export function WaitlistApp({ lang, t }: { lang: Lang; t: GameDict }) {
  const auth = useAuth()
  const w = t.game.waitlist
  const [status, setStatus] = useState<MyStatus | null>(null)
  const [consent, setConsent] = useState(false)
  const [research, setResearch] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sb = auth.status === 'signed_in' ? auth.sb : null

  const load = useCallback(async () => {
    if (!sb) return
    try {
      setStatus(await api.myStatus(sb))
    } catch (err) {
      const code = toErrorCode(err)
      if (code === 'session_expired' || code === 'not_authenticated') await sb.auth.signOut()
      else setError(friendlyError(t, err))
    }
  }, [sb, t])

  useEffect(() => {
    // Load waitlist status from the database once signed in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sb) void load()
  }, [sb, load])

  if (auth.status === 'loading') return <Loading label={t.game.loading} />
  if (auth.status === 'not_configured') return <GameCard><ErrorNote text={t.errors.not_configured} /></GameCard>
  if (auth.status === 'signed_out') {
    return <AuthGate sb={auth.sb} t={t} title={w.title} body={w.body} />
  }
  if (!status) {
    return error ? (
      <GameCard>
        <ErrorNote text={error} />
      </GameCard>
    ) : (
      <Loading label={t.game.loading} />
    )
  }

  const signOut = (
    <button type="button" className="link-btn" onClick={() => void auth.sb.auth.signOut()}>
      {t.game.signOut}
    </button>
  )

  if (status.waitlisted) {
    return (
      <GameCard>
        <div className="game-icon game-icon-ok" aria-hidden="true">
          ✓
        </div>
        <h1 className="game-title">{w.doneTitle}</h1>
        <p className="game-body">{fmt(w.doneBody, { phone: formatBdPhone(status.phone) })}</p>
        <div className="game-actions">
          <Link href={`/${lang}/play/`} className="btn btn-accent btn-lg btn-block">
            {w.playToo} <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="game-footer">
          <Link href={`/${lang}/`}>{t.game.back}</Link>
          {signOut}
        </div>
      </GameCard>
    )
  }

  async function join(e: React.FormEvent) {
    e.preventDefault()
    if (!sb) return
    if (!consent) {
      setError(t.errors.consent_required)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.joinWaitlist(sb, { language: lang, consentResearch: research })
      await load()
    } catch (err) {
      setError(friendlyError(t, err))
    }
    setBusy(false)
  }

  return (
    <GameCard>
      <h1 className="game-title">{w.title}</h1>
      <p className="game-body">{w.body}</p>
      <form className="game-form" onSubmit={join} noValidate>
        <label className="check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          <span>{w.consent}</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={research} onChange={(e) => setResearch(e.target.checked)} />
          <span>{w.consentResearch}</span>
        </label>
        {error && <ErrorNote text={error} />}
        <button type="submit" className="btn btn-accent btn-lg btn-block" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden="true" /> {w.joining}
            </>
          ) : (
            w.join
          )}
        </button>
      </form>
      <div className="game-footer">
        <Link href={`/${lang}/`}>{t.game.back}</Link>
        {signOut}
      </div>
    </GameCard>
  )
}
