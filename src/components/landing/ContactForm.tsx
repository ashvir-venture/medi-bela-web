'use client'

import { useState } from 'react'
import type { Dict } from '@/i18n'

type Status = 'idle' | 'sending' | 'success' | 'error' | 'not_configured'
type Errors = Partial<Record<'name' | 'email' | 'message', string>>

const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Contact form → Web3Forms (the only third party that receives form data).
 * Name, email, message only: never symptoms or medical details (SPEC §7.2).
 * Bots: hidden "botcheck" honeypot, also honoured server-side by Web3Forms.
 */
export function ContactForm({ dict }: { dict: Dict['contact'] }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Errors>({})

  function validate(data: FormData): Errors {
    const e: Errors = {}
    if (String(data.get('name') || '').trim().length < 2) e.name = dict.nameRequired
    if (!EMAIL_RE.test(String(data.get('email') || '').trim())) e.email = dict.emailInvalid
    if (String(data.get('message') || '').trim().length < 10) e.message = dict.messageShort
    return e
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const found = validate(data)
    setErrors(found)
    if (Object.keys(found).length) {
      const first = form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)
      first?.focus()
      return
    }
    // A filled honeypot means a bot: pretend success, send nothing.
    if (data.get('botcheck')) {
      setStatus('success')
      return
    }
    if (!ACCESS_KEY) {
      setStatus('not_configured')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: 'Medi-Bela website: new message',
          from_name: 'Medi-Bela website',
          name: String(data.get('name')).trim(),
          email: String(data.get('email')).trim(),
          message: String(data.get('message')).trim(),
          botcheck: false,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { success?: boolean }
      if (res.ok && json.success) {
        setStatus('success')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const sending = status === 'sending'

  return (
    <form className="form" noValidate onSubmit={onSubmit} aria-describedby="contact-status">
      <div className="field">
        <label htmlFor="cf-name">{dict.name}</label>
        <input
          id="cf-name"
          name="name"
          className="input"
          autoComplete="name"
          maxLength={80}
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? 'cf-name-err' : undefined}
        />
        {errors.name && (
          <span id="cf-name-err" className="field-error">
            {errors.name}
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor="cf-email">{dict.email}</label>
        <input
          id="cf-email"
          name="email"
          type="email"
          inputMode="email"
          className="input"
          autoComplete="email"
          maxLength={120}
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'cf-email-err' : undefined}
        />
        {errors.email && (
          <span id="cf-email-err" className="field-error">
            {errors.email}
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor="cf-message">{dict.message}</label>
        <textarea
          id="cf-message"
          name="message"
          className="input"
          maxLength={2000}
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={errors.message ? 'cf-message-err' : 'cf-message-hint'}
        />
        <span id="cf-message-hint" className="field-hint">
          {dict.notice}
        </span>
        {errors.message && (
          <span id="cf-message-err" className="field-error">
            {errors.message}
          </span>
        )}
      </div>

      {/* Honeypot: hidden from people and screen readers, bots fill it. */}
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave empty
          <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div id="contact-status" aria-live="polite">
        {status === 'success' && <p className="alert alert-ok">{dict.success}</p>}
        {status === 'error' && <p className="alert alert-bad">{dict.error}</p>}
        {status === 'not_configured' && <p className="alert alert-bad">{dict.notConfigured}</p>}
      </div>

      <button type="submit" className="btn btn-accent btn-lg" disabled={sending}>
        {sending ? (
          <>
            <span className="spinner" aria-hidden="true" /> {dict.sending}
          </>
        ) : (
          dict.send
        )}
      </button>
    </form>
  )
}
