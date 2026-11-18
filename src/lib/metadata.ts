import type { Metadata } from 'next'
import { site } from '@/config/site'
import { getDict, type Lang } from '@/i18n'

/**
 * Per-language metadata with canonical + hreflang alternates.
 * `path` is the part after the language, e.g. '' for the landing page or 'rules/'.
 */
export function pageMetadata(
  lang: Lang,
  path: string,
  opts: { title?: string; description?: string; noindex?: boolean } = {},
): Metadata {
  const dict = getDict(lang)
  const description = opts.description ?? dict.meta.description
  const url = `/${lang}/${path}`
  const title = opts.title ? `${opts.title} · Medi-Bela` : dict.meta.title
  return {
    metadataBase: new URL(site.url),
    title,
    description,
    alternates: {
      canonical: url,
      languages: { bn: `/bn/${path}`, en: `/en/${path}`, 'x-default': `/bn/${path}` },
    },
    openGraph: {
      type: 'website',
      siteName: 'Medi-Bela',
      title,
      description,
      url,
      locale: lang === 'bn' ? 'bn_BD' : 'en_US',
      alternateLocale: lang === 'bn' ? ['en_US'] : ['bn_BD'],
      images: [{ url: `/og/og-${lang}.png`, width: 1200, height: 630, alt: dict.meta.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og/og-${lang}.png`],
    },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  }
}
