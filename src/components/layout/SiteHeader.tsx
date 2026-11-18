import Link from 'next/link'
import { site } from '@/config/site'
import type { Dict, Lang } from '@/i18n'
import { BrandMark } from './BrandMark'
import { LangToggle } from './LangToggle'
import { MobileMenu } from './MobileMenu'

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
  const cta = site.launched ? undefined : { href: `/${lang}/play/`, label: dict.nav.playCta }

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
          {cta && (
            <Link href={cta.href} className="btn btn-accent btn-sm header-cta">
              {cta.label}
            </Link>
          )}
          <MobileMenu links={links} cta={cta} openLabel={dict.nav.menu} closeLabel={dict.nav.closeMenu} />
        </div>
      </div>
      <span className="scroll-progress" aria-hidden="true" />
    </header>
  )
}
