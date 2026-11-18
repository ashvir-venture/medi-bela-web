'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fmt, type Lang } from '@/i18n'
import { toErrorCode } from '@/lib/errors'
import { api, previewPoints, shuffled, type AnswerResult, type CurrentQuestion } from '@/lib/game'
import { contest } from '@/config/site'
import { CountUp, ErrorNote, GameCard, Loading, friendlyError, type GameDict } from './GameParts'

type InProgress = Extract<CurrentQuestion, { status: 'in_progress' }>

const RING_R = 44
const RING_C = 2 * Math.PI * RING_R

/**
 * One question at a time. The on-screen timer is cosmetic: the server's served_at is the
 * truth, and remaining_ms from get_current_question sets where the ring starts, so a refresh
 * continues instead of restarting.
 */
export function QuestionView({
  sb,
  lang,
  t,
  attemptId,
  onFinished,
  onSessionEnded,
}: {
  sb: SupabaseClient
  lang: Lang
  t: GameDict
  attemptId: string
  onFinished: (total: number, timeMs: number) => void
  onSessionEnded: () => void
}) {
  const q = t.game.question
  const [current, setCurrent] = useState<InProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [locked, setLocked] = useState(false)

  const ringRef = useRef<SVGCircleElement>(null)
  const secRef = useRef<HTMLSpanElement>(null)
  const ptsRef = useRef<HTMLSpanElement>(null)
  const lockedRef = useRef(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api.currentQuestion(sb, attemptId)
      if (data.status === 'completed') {
        onFinished(data.total_score, data.total_time_ms)
        return
      }
      lockedRef.current = false
      setLocked(false)
      setChosen(null)
      setResult(null)
      setTimedOut(false)
      setCurrent(data)
    } catch (err) {
      const code = toErrorCode(err)
      if (code === 'session_expired' || code === 'not_authenticated') onSessionEnded()
      else setError(friendlyError(t, err))
    }
  }, [sb, attemptId, onFinished, onSessionEnded, t])

  useEffect(() => {
    // Initial fetch of the current question from the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const submit = useCallback(
    async (key: string | null) => {
      if (!current || lockedRef.current) return
      lockedRef.current = true // lock options on first tap (ref: no double submit before re-render)
      setLocked(true)
      setChosen(key)
      try {
        const res = await api.submitAnswer(sb, attemptId, current.position, key)
        setResult(res)
      } catch (err) {
        const code = toErrorCode(err)
        if (code === 'wrong_position' || code === 'invalid_state' || code === 'already_completed') {
          // The server moved on (e.g. the question expired); show where it really is.
          void load()
        } else if (code === 'session_expired' || code === 'not_authenticated') {
          onSessionEnded()
        } else {
          lockedRef.current = false
          setLocked(false)
          setChosen(null)
          setError(friendlyError(t, err))
        }
      }
    },
    [current, sb, attemptId, load, onSessionEnded, t],
  )

  // Cosmetic countdown ring + decaying points, written straight to the DOM each frame.
  useEffect(() => {
    if (!current || result) return
    const limit = current.seconds_limit * 1000
    const started = performance.now()
    const startRemaining = current.remaining_ms
    let raf = 0
    const tick = (now: number) => {
      const remaining = Math.max(0, startRemaining - (now - started))
      const elapsed = limit - remaining
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING_C * (1 - remaining / limit))
      if (secRef.current) secRef.current.textContent = String(Math.ceil(remaining / 1000))
      if (ptsRef.current) ptsRef.current.textContent = String(previewPoints(elapsed, limit))
      if (remaining <= 0) {
        setTimedOut(true)
        void submit(null) // time's up on screen: record 0 and reveal the answer
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [current, result, submit])

  const options = useMemo(() => (current ? shuffled(current.question.options) : []), [current])

  if (error && !current) {
    return (
      <GameCard>
        <ErrorNote
          text={error}
          action={
            <button className="btn btn-outline btn-sm" onClick={() => void load()}>
              ↻
            </button>
          }
        />
      </GameCard>
    )
  }
  if (!current) return <Loading label={t.game.loading} />

  const text = lang === 'bn' ? current.question.text_bn : current.question.text_en
  const explanation = result ? (lang === 'bn' ? result.explanation_bn : result.explanation_en) : null

  function optionState(key: string) {
    if (!result) return chosen === key ? 'is-chosen' : ''
    if (key === result.correct_key) return 'is-correct'
    if (key === chosen) return 'is-wrong'
    return 'is-dim'
  }

  return (
    <GameCard wide>
      <div className="q-top">
        <div className="q-progress">
          <span className="q-count num">
            {fmt(q.of, { n: current.position, total: current.total })}
          </span>
          <ol className="q-dots" aria-hidden="true">
            {Array.from({ length: current.total }).map((_, i) => (
              <li key={i} className={i + 1 < current.position ? 'done' : i + 1 === current.position ? 'now' : ''} />
            ))}
          </ol>
        </div>
        <div className="q-timer" aria-hidden={!!result}>
          <svg viewBox="0 0 100 100" className="q-ring" aria-hidden="true">
            <circle cx="50" cy="50" r={RING_R} className="q-ring-track" />
            <circle
              ref={ringRef}
              cx="50"
              cy="50"
              r={RING_R}
              className="q-ring-bar"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - current.remaining_ms / (current.seconds_limit * 1000))}
            />
          </svg>
          <span className="q-sec num">
            <span ref={secRef}>{Math.ceil(current.remaining_ms / 1000)}</span>
            <small>{q.seconds}</small>
          </span>
        </div>
      </div>

      {!result && (
        <p className="q-points num" aria-hidden="true">
          +<span ref={ptsRef}>{contest.maxPerQuestion}</span>
        </p>
      )}

      <h1 className="q-text" id="q-text">
        {text}
      </h1>

      <div className="q-options" role="group" aria-labelledby="q-text" aria-label={q.options}>
        {options.map((o, i) => (
          <button
            key={o.key}
            type="button"
            className={`q-option ${optionState(o.key)}`}
            onClick={() => void submit(o.key)}
            disabled={locked || !!result}
            aria-pressed={chosen === o.key}
          >
            <span className="q-letter" aria-hidden="true">
              {'ABCD'[i]}
            </span>
            <span>{lang === 'bn' ? o.bn : o.en}</span>
          </button>
        ))}
      </div>

      {!result && chosen !== null && (
        <p className="game-hint" role="status">
          <span className="spinner" aria-hidden="true" /> {q.submitting}
        </p>
      )}
      {error && current && <ErrorNote text={error} />}

      {result && (
        <div className={`q-reveal ${result.is_correct && result.points > 0 ? 'ok' : 'bad'}`} role="status" aria-live="assertive">
          <div className="q-reveal-head">
            <strong>
              {result.too_fast
                ? q.wrong
                : result.is_correct
                  ? q.correct
                  : timedOut || chosen === null
                    ? q.timeUp
                    : q.wrong}
            </strong>
            <span className="q-reveal-pts">
              +<CountUp value={result.points} duration={700} /> {t.play.pts}
            </span>
          </div>
          {result.too_fast && <p>{q.tooFast}</p>}
          {result.late && !result.too_fast && chosen !== null && <p>{q.late}</p>}
          {!result.is_correct && (
            <p>
              {q.correctWas}{' '}
              <strong>
                {(() => {
                  const o = current.question.options.find((x) => x.key === result.correct_key)
                  return o ? (lang === 'bn' ? o.bn : o.en) : ''
                })()}
              </strong>
            </p>
          )}
          {explanation && <p className="q-explain">{explanation}</p>}
          <button
            type="button"
            className="btn btn-accent btn-lg btn-block"
            autoFocus
            onClick={() => void load()}
          >
            {result.finished ? q.finish : q.next} <span className="arrow" aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </GameCard>
  )
}
