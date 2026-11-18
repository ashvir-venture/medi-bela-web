import type { Viewport } from 'next'
import { notFound } from 'next/navigation'
import '@/styles/globals.css'
import { fontVariables } from '@/styles/fonts'
import { getDict, isLang, LANGS } from '@/i18n'
import { pageMetadata } from '@/lib/metadata'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

// Only /bn and /en exist; anything else is the global 404.
export const dynamicParams = false

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLang(lang) ? pageMetadata(lang, '') : {}
}

export const viewport: Viewport = {
  themeColor: '#0b1626',
  width: 'device-width',
  initialScale: 1,
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const dict = getDict(lang)

  return (
    <html lang={lang} className={fontVariables}>
      <body>
        <a className="skip-link" href="#main">
          {dict.nav.skip}
        </a>
        <SiteHeader lang={lang} dict={dict} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter lang={lang} dict={dict} />
      </body>
    </html>
  )
}
