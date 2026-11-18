'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Dict } from '@/i18n'
import { errorText, toErrorCode } from '@/lib/errors'
import { formatDuration } from '@/lib/game'
import { normalizeBdPhone } from '@/lib/phone'
import { signInWithPhone, signUpWithPhone } from './useAuth'

export type GameDict = Pick<Dict, 'game' | 'errors' | 'play'>

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Card wrapper used by every game screen. */
export function GameCard({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`game-card${wide ? ' game-card-wide' : ''}`}>{children}</div>
}

export function Loading({ label }: { label: string }) {
  return (
    <GameCard>
      <div className="game-loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </GameCard>
  )
}

export function ErrorNote({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="alert alert-bad" role="alert">
      <p>{text}</p>
      {action && <div style={{ marginTop: 'var(--sp-3)' }}>{action}</div>}
    </div>
  )
}

type FieldErrors = Partial<Record<'name' | 'phone' | 'password', string>>

/**
 * Mobile number + password: "Create account" or "Sign in". The only way to sign in.
 * SMS verification and SMS password reset come later (SUPABASE_SETUP.md).
 */
export function AuthGate({
  sb,
  t,
  title,
  body,
}: {
  sb: SupabaseClient
  t: GameDict
  title: string
  body: string
}) {
  const g = t.game.gate
  const id = useId()
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: FieldErrors = {}
    const e164 = normalizeBdPhone(phone)
    const cleanName = name.trim().replace(/\s+/g, ' ')
    if (mode === 'signup' && (cleanName.length < 2 || cleanName.length > 60)) errs.name = t.errors.name_required
    if (!e164) errs.phone = t.errors.invalid_phone
    if (password.length < 8 || password.length > 72) errs.password = t.errors.weak_password
    setFieldErrors(errs)
    setFormError(null)
    if (Object.keys(errs).length || !e164) return

    setBusy(true)
    try {
      if (mode === 'signup') await signUpWithPhone(sb, e164, password, cleanName)
      else await signInWithPhone(sb, e164, password)
      // useAuth's onAuthStateChange moves the page on; nothing else to do here.
    } catch (err) {
      const code = toErrorCode(err)
      if (code === 'phone_taken') {
        setMode('signin')
        setFormError(t.errors.phone_taken)
      } else if (code === 'invalid_phone') setFieldErrors({ phone: t.errors.invalid_phone })
      else if (code === 'weak_password') setFieldErrors({ password: t.errors.weak_password })
      else setFormError(errorText(t.errors, err))
      setBusy(false)
    }
  }

  function switchMode(next: 'signup' | 'signin') {
    setMode(next)
    setFieldErrors({})
    setFormError(null)
  }

  return (
    <GameCard>
      <h1 className="game-title">{title}</h1>
      <p className="game-body">{body}</p>

      <div className="auth-tabs" role="tablist" aria-label={title}>
        {(['signup', 'signin'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`auth-tab${mode === m ? ' is-active' : ''}`}
            onClick={() => switchMode(m)}
          >
            {m === 'signup' ? g.tabSignUp : g.tabSignIn}
          </button>
        ))}
      </div>

      <form className="game-form" onSubmit={submit} noValidate role="tabpanel">
        {mode === 'signup' && (
          <div className="field">
            <label htmlFor={`${id}-name`}>{g.fullName}</label>
            <input
              id={`${id}-name`}
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={60}
              aria-invalid={fieldErrors.name ? 'true' : undefined}
              aria-describedby={`${id}-name-hint`}
            />
            <span id={`${id}-name-hint`} className="field-hint">
              {g.fullNameHint}
            </span>
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
          </div>
        )}

        <div className="field">
          <label htmlFor={`${id}-phone`}>{g.phone}</label>
          <input
            id={`${id}-phone`}
            className="input num"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel-national"
            placeholder="01XXXXXXXXX"
            maxLength={20}
            aria-invalid={fieldErrors.phone ? 'true' : undefined}
            aria-describedby={`${id}-phone-hint`}
          />
          <span id={`${id}-phone-hint`} className="field-hint">
            {g.phoneHint}
          </span>
          {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
        </div>

        <div className="field">
          <label htmlFor={`${id}-pw`}>{g.password}</label>
          <div className="input-with-btn">
            <input
              id={`${id}-pw`}
              className="input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              maxLength={72}
              aria-invalid={fieldErrors.password ? 'true' : undefined}
              aria-describedby={`${id}-pw-hint`}
            />
            <button
              type="button"
              className="input-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-controls={`${id}-pw`}
            >
              {showPassword ? g.hide : g.show}
            </button>
          </div>
          {mode === 'signup' && (
            <span id={`${id}-pw-hint`} className="field-hint">
              {g.passwordHint}
            </span>
          )}
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </div>

        {formError && <ErrorNote text={formError} />}

        <button type="submit" className="btn btn-accent btn-lg btn-block" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden="true" /> {g.working}
            </>
          ) : mode === 'signup' ? (
            g.submitSignUp
          ) : (
            g.submitSignIn
          )}
        </button>
        {mode === 'signin' && <p className="field-hint">{g.forgot}</p>}
      </form>
      <p className="game-hint">{g.note}</p>
    </GameCard>
  )
}

/** Counts down to an ISO time (next midnight in Bangladesh), Latin digits. */
export function Countdown({ to, onDone }: { to: string; onDone?: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(to).getTime() - Date.now()))
  const doneRef = useRef(onDone)

  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    const target = new Date(to).getTime()
    const id = setInterval(() => {
      const ms = Math.max(0, target - Date.now())
      setLeft(ms)
      if (ms === 0) {
        clearInterval(id)
        doneRef.current?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [to])

  return (
    <span className="num countdown" role="timer" aria-live="off">
      {formatDuration(left)}
    </span>
  )
}

/** Animated number count-up (instant under reduced motion). */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)
    if (prefersReducedMotion() || value === 0) {
      el.textContent = fmt(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      el.textContent = fmt(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    // Starts at 0; the effect writes the animated text directly (no re-render per frame).
    <span ref={ref} className="num">
      0
    </span>
  )
}

export function friendlyError(t: GameDict, err: unknown) {
  return errorText(t.errors, err)
}
