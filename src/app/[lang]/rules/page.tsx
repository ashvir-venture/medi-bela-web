import { notFound } from 'next/navigation'
import { isLang } from '@/i18n'
import { pageMetadata } from '@/lib/metadata'
import { LegalPage } from '@/components/layout/LegalPage'
import { rules } from '@/content/legal/rules'

// DRAFT: needs legal review for Bangladesh.
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return pageMetadata(lang, 'rules/', { title: rules[lang].title, description: rules[lang].intro })
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <LegalPage doc={rules[lang]} lang={lang} />
}
