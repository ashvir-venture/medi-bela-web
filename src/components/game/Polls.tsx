'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fmt, type Lang } from '@/i18n'
import { api, type Poll } from '@/lib/game'
import type { GameDict } from './GameParts'

/** Optional, unscored feedback polls after the last question. One at a time, skippable. */
export function Polls({ sb, lang, t }: { sb: SupabaseClient; lang: Lang; t: GameDict }) {
  const p = t.game.polls
  const [polls, setPolls] = useState<Poll[] | null>(null)
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .polls(sb)
      .then((rows) => alive && setPolls(rows ?? []))
      .catch(() => alive && setPolls([])) // polls are optional: fail silently
    return () => {
      alive = false
    }
  }, [sb])

  if (!polls || polls.length === 0) return null
  if (done || index >= polls.length) {
    return (
      <section className="polls" aria-live="polite">
        <p className="polls-thanks">{p.thanks}</p>
      </section>
    )
  }

  const poll = polls[index]

  async function answer(key: string) {
    setBusy(true)
    try {
      await api.submitPoll(sb, poll.id, key)
    } catch {
      // Ignore: an optional poll must never block the player.
    }
    setBusy(false)
    setIndex((i) => i + 1)
  }

  return (
    <section className="polls" aria-labelledby="polls-title">
      <div className="polls-head">
        <div>
          <h2 id="polls-title">{p.title}</h2>
          <p className="game-hint">{p.body}</p>
        </div>
        <span className="num polls-count">{fmt(p.of, { n: index + 1, total: polls.length })}</span>
      </div>
      <p className="polls-q">{lang === 'bn' ? poll.text_bn : poll.text_en}</p>
      <div className="polls-options">
        {poll.options.map((o) => (
          <button key={o.key} type="button" className="btn btn-outline" disabled={busy} onClick={() => void answer(o.key)}>
            {lang === 'bn' ? o.bn : o.en}
          </button>
        ))}
      </div>
      <div className="polls-skip">
        <button type="button" className="link-btn" onClick={() => setIndex((i) => i + 1)}>
          {p.skip}
        </button>
        <button type="button" className="link-btn" onClick={() => setDone(true)}>
          {p.skipAll}
        </button>
      </div>
    </section>
  )
}
