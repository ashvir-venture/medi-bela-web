'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { DEFAULT_LANG, isLang, LANG_STORAGE_KEY } from '@/i18n'

/** The saved language, else the browser's, else Bangla. */
function preferredLang() {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    // Storage can be blocked (private mode); fall through.
  }
  const browser = (navigator.languages?.[0] || navigator.language || '').toLowerCase()
  return browser.startsWith('en') ? 'en' : DEFAULT_LANG
}

export default function RootRedirect() {
  useEffect(() => {
    window.location.replace(`/${preferredLang()}/${window.location.hash}`)
  }, [])

  return (
    <main style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/bn/" />
      </noscript>
      <p style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/bn/">বাংলা</Link>
        <Link href="/en/">English</Link>
      </p>
    </main>
  )
}
