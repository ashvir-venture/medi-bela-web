import Link from 'next/link'
import { site } from '@/config/site'
import type { Dict, Lang } from '@/i18n'
import { BrandMark } from './BrandMark'
import { LangToggle } from './LangToggle'

export function SiteHeader({ lang, dict }: { lang: Lang; dict: Dict }) {
  const home = `/${lang}/`
  const links = [
    { href: `/${lang}/about/`, label: dict.nav.aboutUs },
    { href: `${home}#features`, label: dict.nav.features },
    { href: `${home}#how`, label: dict.nav.how },
    { href: `${home}#play`, label: dict.nav.play },
    { href: `${home}#faq`, label: dict.nav.faq },
    { href: `${home}#contact`, label: dict.nav.contact },
  ]

  return (
    <header className="site-header on-dark">
      <div className="container header-inner">
        <Link href={home} className="brand" aria-label="Medi-Bela, home">
          <BrandMark />
          <span>Medi-Bela</span>
        </Link>
        <nav className="header-nav" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <LangToggle lang={lang} label={dict.nav.language} />
          {!site.launched && (
            <Link href={`/${lang}/play/`} className="btn btn-accent btn-sm header-cta">
              {dict.nav.playCta}
            </Link>
          )}
        </div>
      </div>
      <span className="scroll-progress" aria-hidden="true" />
    </header>
  )
}
