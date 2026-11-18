import type { Dict } from '@/i18n'

/** Error codes raised by the database functions (supabase/migrations/003_functions.sql) plus client-side ones. */
export type ErrorCode = keyof Dict['errors']

const KNOWN = new Set<string>([
  // database RPCs
  'not_authenticated',
  'profile_incomplete',
  'contest_closed',
  'disqualified',
  'not_enough_questions',
  'already_onboarded',
  'consent_required',
  'invalid_name',
  'name_not_allowed',
  'name_taken',
  'invalid_language',
  'not_found',
  'already_completed',
  'wrong_position',
  'invalid_state',
  'invalid_option',
])

// Supabase Auth error codes (error.code) → ours.
const AUTH_CODES: Record<string, ErrorCode> = {
  user_already_exists: 'phone_taken',
  phone_exists: 'phone_taken',
  invalid_credentials: 'invalid_credentials',
  weak_password: 'weak_password',
  validation_failed: 'invalid_phone',
  over_request_rate_limit: 'rate_limited',
  over_sms_send_rate_limit: 'rate_limited',
  signup_disabled: 'signup_closed',
  phone_provider_disabled: 'signup_closed',
  phone_not_confirmed: 'verification_needed',
  sms_send_failed: 'verification_needed',
  session_expired: 'session_expired',
  session_not_found: 'session_expired',
  refresh_token_not_found: 'session_expired',
}

export class AppError extends Error {
  constructor(public code: ErrorCode) {
    super(code)
    this.name = 'AppError'
  }
}

/** Turns anything thrown by supabase-js / fetch into one of our codes. */
export function toErrorCode(err: unknown): ErrorCode {
  if (err instanceof AppError) return err.code
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline'
  const e = err as { message?: string; code?: string; status?: number } | null
  const message = (e?.message || '').trim()
  // Our functions raise the code itself as the message, e.g. raise exception 'name_taken'.
  if (KNOWN.has(message)) return message as ErrorCode
  if (e?.code && AUTH_CODES[e.code]) return AUTH_CODES[e.code]
  if (/invalid login credentials/i.test(message)) return 'invalid_credentials'
  if (/already registered/i.test(message)) return 'phone_taken'
  if (e?.status === 429) return 'rate_limited'
  if (e?.code === 'PGRST301' || e?.status === 401 || /jwt/i.test(message)) return 'session_expired'
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(message)) return 'offline'
  return 'generic'
}

export function errorText(errors: Dict['errors'], err: unknown): string {
  return errors[toErrorCode(err)]
}
