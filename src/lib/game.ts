import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from './errors'

// Typed wrappers around the database RPCs (supabase/migrations/003_functions.sql).
// The browser is untrusted: these only ask; every rule is enforced in the database.

export type LocalizedOption = { key: string; en: string; bn: string }

export type MyStatus = {
  onboarded: boolean
  waitlisted: boolean
  display_name: string | null
  full_name: string | null
  language: 'bn' | 'en'
  phone: string | null
  played_today: boolean
  attempt_id: string | null
  attempt_status: 'in_progress' | 'completed' | null
  today_score: number | null
  best_score: number | null
  my_rank: number | null
  next_reset_at: string
  contest_open: boolean
}

export type CurrentQuestion =
  | { status: 'completed'; total_score: number; total_time_ms: number }
  | {
      status: 'in_progress'
      position: number
      total: number
      question: { id: string; text_en: string; text_bn: string; options: LocalizedOption[] }
      remaining_ms: number
      seconds_limit: number
    }

export type AnswerResult = {
  is_correct: boolean
  correct_key: string
  points: number
  elapsed_ms: number
  too_fast: boolean
  late: boolean
  explanation_en: string | null
  explanation_bn: string | null
  finished: boolean
  total_score: number
}

export type LeaderRow = { rank: number; display_name: string; best_score: number; completed_at: string }

export type Poll = { id: string; text_en: string; text_bn: string; options: LocalizedOption[] }

async function rpc<T>(sb: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb.rpc(fn, args)
  if (error) throw error
  return data as T
}

export const api = {
  myStatus: (sb: SupabaseClient) => rpc<MyStatus>(sb, 'get_my_status'),
  completeProfile: (
    sb: SupabaseClient,
    a: { name: string; language: 'bn' | 'en'; consentWaitlist: boolean; consentResearch: boolean },
  ) =>
    rpc<void>(sb, 'complete_profile', {
      p_display_name: a.name,
      p_language: a.language,
      p_consent_waitlist: a.consentWaitlist,
      p_consent_research: a.consentResearch,
    }),
  joinWaitlist: (sb: SupabaseClient, a: { language: 'bn' | 'en'; consentResearch: boolean }) =>
    rpc<{ joined: boolean; already: boolean }>(sb, 'join_waitlist', {
      p_language: a.language,
      p_consent_research: a.consentResearch,
    }),
  startAttempt: (sb: SupabaseClient) => rpc<string>(sb, 'start_attempt'),
  currentQuestion: (sb: SupabaseClient, attemptId: string) =>
    rpc<CurrentQuestion>(sb, 'get_current_question', { p_attempt: attemptId }),
  /** key = null means "time ran out on my screen": scores 0 and reveals the answer. */
  submitAnswer: (sb: SupabaseClient, attemptId: string, position: number, key: string | null) =>
    rpc<AnswerResult>(sb, 'submit_answer', { p_attempt: attemptId, p_position: position, p_key: key }),
  leaderboard: (sb: SupabaseClient, limit: number) =>
    rpc<LeaderRow[]>(sb, 'get_leaderboard', { p_limit: limit }),
  polls: (sb: SupabaseClient) => rpc<Poll[]>(sb, 'get_polls'),
  submitPoll: (sb: SupabaseClient, pollId: string, key: string) =>
    rpc<void>(sb, 'submit_poll', { p_poll: pollId, p_key: key }),
}

export function assertClient(sb: SupabaseClient | null): SupabaseClient {
  if (!sb) throw new AppError('not_configured')
  return sb
}

/** Fisher–Yates shuffle for display order only; option keys stay stable. */
export function shuffled<T>(items: readonly T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Live points preview, same formula as the database (cosmetic only). */
export function previewPoints(elapsedMs: number, limitMs: number, graceMs = 800): number {
  const eff = Math.min(Math.max(elapsedMs - graceMs, 1000), limitMs)
  return Math.floor(500 + 500 * (1 - eff / limitMs))
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
