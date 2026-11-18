'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LANG_STORAGE_KEY, LANGS, type Lang } from '@/i18n'

const LABELS: Record<Lang, string> = { bn: 'বাংলা', en: 'EN' }

/** Switches to the same page in the other language and remembers the choice. */
export function LangToggle({ lang, label }: { lang: Lang; label: string }) {
  const pathname = usePathname() || `/${lang}/`
  const rest = pathname.replace(/^\/(bn|en)(?=\/|$)/, '') || '/'

  function remember(next: Lang) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      // Storage blocked: the switch still works, it just isn't remembered.
    }
  }

  return (
    <nav className="lang-toggle" aria-label={label}>
      {LANGS.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          lang={l}
          aria-current={l === lang ? 'true' : undefined}
          onClick={() => remember(l)}
          prefetch={false}
        >
          {LABELS[l]}
        </Link>
      ))}
    </nav>
  )
}
