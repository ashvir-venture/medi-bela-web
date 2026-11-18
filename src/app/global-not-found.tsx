import Link from 'next/link'
import type { Metadata } from 'next'
import '@/styles/globals.css'
import { fontVariables } from '@/styles/fonts'
import { getDict } from '@/i18n'
import { BrandMark } from '@/components/layout/BrandMark'

export const metadata: Metadata = {
  title: '404 · Medi-Bela',
  robots: { index: false },
}

// One bilingual 404 for every unmatched URL (two root layouts, so no layout wraps this).
export default function GlobalNotFound() {
  const bn = getDict('bn').notFound
  const en = getDict('en').notFound
  return (
    <html lang="bn" className={fontVariables}>
      <body>
        <main className="section-dark not-found">
          <div className="container not-found-inner">
            <BrandMark size={56} />
            <p className="not-found-code num">404</p>
            <div>
              <h1>{bn.title}</h1>
              <p lang="en" className="not-found-en">
                {en.title}
              </p>
            </div>
            <p className="not-found-actions">
              <Link className="btn btn-accent" href="/bn/">
                {bn.home}
              </Link>
              <Link className="btn btn-ghost-light" href="/en/" lang="en">
                {en.home}
              </Link>
            </p>
          </div>
        </main>
      </body>
    </html>
  )
}
