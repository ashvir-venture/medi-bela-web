'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lang } from '@/i18n'
import { toErrorCode, type ErrorCode } from '@/lib/errors'
import { api, type MyStatus } from '@/lib/game'
import { ErrorNote, GameCard, type GameDict } from './GameParts'

// Same rule as complete_profile() in the database (the database is the real check).
const NAME_RE = /^[A-Za-z0-9ঀ-৿ _.]{2,24}$/
const NAME_FIELD_ERRORS: ErrorCode[] = ['invalid_name', 'name_not_allowed', 'name_taken']

/** First login only: public nickname, language, required consent, optional research consent. */
export function Onboarding({
  sb,
  lang,
  t,
  status,
  onDone,
}: {
  sb: SupabaseClient
  lang: Lang
  t: GameDict
  status: MyStatus
  onDone: (language: Lang) => void
}) {
  const o = t.game.onboarding
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<Lang>(lang)
  const [consent, setConsent] = useState(status.waitlisted)
  const [research, setResearch] = useState(false)
  const [busy, setBusy] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setNameError(null)
    setFormError(null)
    const trimmed = name.trim().replace(/\s+/g, ' ')
    if (!NAME_RE.test(trimmed) || /https?|www|@|\.(com|net|org|bd|io|xyz)\b/i.test(trimmed)) {
      setNameError(t.errors.invalid_name)
      return
    }
    if (!consent) {
      setFormError(t.errors.consent_required)
      return
    }
    setBusy(true)
    try {
      await api.completeProfile(sb, { name: trimmed, language, consentWaitlist: consent, consentResearch: research })
      onDone(language)
    } catch (err) {
      const code = toErrorCode(err)
      if (code === 'already_onboarded') return onDone(language)
      if (NAME_FIELD_ERRORS.includes(code)) setNameError(t.errors[code])
      else setFormError(t.errors[code])
      setBusy(false)
    }
  }

  return (
    <GameCard>
      <h1 className="game-title">{o.title}</h1>
      <p className="game-body">{o.body}</p>
      <form className="game-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="ob-name">{o.nickname}</label>
          <input
            id="ob-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            autoComplete="nickname"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={nameError ? 'true' : undefined}
            aria-describedby="ob-name-hint ob-name-err"
          />
          <span id="ob-name-hint" className="field-hint">
            {o.nicknameHint} {o.nicknameFixed}
          </span>
          {nameError && (
            <span id="ob-name-err" className="field-error" role="alert">
              {nameError}
            </span>
          )}
        </div>

        <fieldset className="field seg-field">
          <legend className="label">{o.language}</legend>
          <div className="seg">
            {(['bn', 'en'] as const).map((l) => (
              <label key={l} className="seg-opt">
                <input type="radio" name="language" value={l} checked={language === l} onChange={() => setLanguage(l)} />
                <span lang={l}>{l === 'bn' ? 'বাংলা' : 'English'}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          <span>
            {o.consentContest}{' '}
            <Link href={`/${lang}/rules/`} target="_blank">
              {o.rulesLink}
            </Link>
          </span>
        </label>
        <label className="check">
          <input type="checkbox" checked={research} onChange={(e) => setResearch(e.target.checked)} />
          <span>{o.consentResearch}</span>
        </label>

        {formError && <ErrorNote text={formError} />}

        <button type="submit" className="btn btn-accent btn-lg btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {o.submit}
        </button>
      </form>
    </GameCard>
  )
}
