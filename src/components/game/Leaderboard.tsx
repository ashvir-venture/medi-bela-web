'use client'

import { useEffect, useRef, useState } from 'react'
import { formatNumber, type Dict } from '@/i18n'
import { api, type LeaderRow } from '@/lib/game'
import { getSupabase, supabaseConfigured } from '@/lib/supabase'

type State = { kind: 'loading' } | { kind: 'ready'; rows: LeaderRow[] } | { kind: 'error' } | { kind: 'soon' }

const REFRESH_MS = 60_000

/**
 * Public leaderboard (get_leaderboard is granted to anon): display names and scores only.
 * Loads when scrolled into view and refreshes every minute while the tab is visible.
 */
export function Leaderboard({
  t: p,
  limit,
  highlightName,
  title,
}: {
  t: Dict['play']
  limit: number
  highlightName?: string | null
  title?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<State>(supabaseConfigured ? { kind: 'loading' } : { kind: 'soon' })

  useEffect(() => {
    if (!supabaseConfigured || !ref.current) return
    let timer: ReturnType<typeof setInterval> | undefined
    let alive = true

    async function load() {
      if (document.visibilityState === 'hidden') return
      try {
        const sb = await getSupabase()
        if (!sb) return
        const rows = await api.leaderboard(sb, limit)
        if (alive) setState({ kind: 'ready', rows: rows ?? [] })
      } catch {
        if (alive) setState((s) => (s.kind === 'ready' ? s : { kind: 'error' }))
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          void load()
          timer = setInterval(load, REFRESH_MS)
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(ref.current)

    return () => {
      alive = false
      io.disconnect()
      if (timer) clearInterval(timer)
    }
  }, [limit])

  return (
    <div className="board" ref={ref}>
      <div className="board-head">
        <h3>{title ?? p.boardTitle}</h3>
        {state.kind === 'ready' && <span className="live-dot">{p.boardLive}</span>}
      </div>

      {state.kind === 'loading' && (
        <div aria-busy="true" style={{ display: 'grid', gap: 'var(--sp-4)', padding: 'var(--sp-3)' }}>
          {Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
            <span key={i} className="skeleton" style={{ width: `${90 - i * 9}%` }} />
          ))}
        </div>
      )}
      {state.kind === 'soon' && <p className="board-empty">{p.boardSoon}</p>}
      {state.kind === 'error' && <p className="board-empty">{p.boardError}</p>}
      {state.kind === 'ready' && state.rows.length === 0 && <p className="board-empty">{p.boardEmpty}</p>}
      {state.kind === 'ready' && state.rows.length > 0 && (
        <ol className="board-list" aria-label={title ?? p.boardTitle}>
          {state.rows.map((r) => {
            const me = !!highlightName && r.display_name === highlightName
            return (
              <li key={r.rank} className={`board-row${me ? ' is-me' : ''}`} aria-current={me ? 'true' : undefined}>
                <span className="board-rank num">{r.rank}</span>
                <span className="board-name">
                  {r.display_name}
                  {me && <span className="sr-only"> ({p.you})</span>}
                </span>
                <span className="board-score num">
                  {formatNumber(r.best_score)} <small>{p.pts}</small>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
