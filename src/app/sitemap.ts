import type { MetadataRoute } from 'next'
import { site } from '@/config/site'
import { LANGS } from '@/i18n'

export const dynamic = 'force-static'

// Public, indexable pages only (play / waitlist / auth are app screens).
const PATHS = ['', 'about/', 'rules/', 'privacy/', 'terms/']

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.flatMap((path) =>
    LANGS.map((lang) => ({
      url: `${site.url}/${lang}/${path}`,
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.5,
      alternates: {
        languages: Object.fromEntries(LANGS.map((l) => [l, `${site.url}/${l}/${path}`])),
      },
    })),
  )
}
