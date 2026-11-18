import Link from 'next/link'
import { site } from '@/config/site'
import type { Dict, Lang } from '@/i18n'
/* eslint-disable @next/next/no-img-element -- static export */

export function SiteFooter({ lang, dict }: { lang: Lang; dict: Dict }) {
  const f = dict.footer
  const socials = site.socials.filter((s) => s.url)
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer on-dark">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href={`/${lang}/`} aria-label="Medi-Bela">
              <img
                className="footer-logo"
                src={lang === 'bn' ? site.logo.bn : site.logo.en}
                alt="Medi-Bela"
                width={150}
                height={82}
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p style={{ marginTop: 'var(--sp-3)', maxWidth: '22rem' }}>{f.tagline}</p>
          </div>
          <div>
            <p className="footer-title">{f.contest}</p>
            <ul className="footer-links">
              {!site.launched && (
                <>
                  <li>
                    <Link href={`/${lang}/play/`}>{f.play}</Link>
                  </li>
                  <li>
                    <Link href={`/${lang}/waitlist/`}>{f.waitlist}</Link>
                  </li>
                </>
              )}
              <li>
                <Link href={`/${lang}/rules/`}>{f.rules}</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="footer-title">{f.legal}</p>
            <ul className="footer-links">
              <li>
                <Link href={`/${lang}/about/`}>{dict.nav.aboutUs}</Link>
              </li>
              <li>
                <Link href={`/${lang}/privacy/`}>{f.privacy}</Link>
              </li>
              <li>
                <Link href={`/${lang}/terms/`}>{f.terms}</Link>
              </li>
            </ul>
            <p className="footer-title" style={{ marginTop: 'var(--sp-5)' }}>
              {f.follow}
            </p>
            {socials.length ? (
              <ul className="footer-links">
                {socials.map((s) => (
                  <li key={s.name}>
                    <a href={s.url} rel="noopener noreferrer" target="_blank">
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{f.socialSoon}</p>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © <span className="num">{year}</span> Medi-Bela. {f.rights}
          </p>
          <p>{f.disclaimer}</p>
        </div>
      </div>
    </footer>
  )
}
