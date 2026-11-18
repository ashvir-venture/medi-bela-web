import { notFound } from 'next/navigation'
import { isLang } from '@/i18n'
import { pageMetadata } from '@/lib/metadata'
import { LegalPage } from '@/components/layout/LegalPage'
import { terms } from '@/content/legal/terms'

// DRAFT: needs legal review for Bangladesh.
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return pageMetadata(lang, 'terms/', { title: terms[lang].title, description: terms[lang].intro })
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <LegalPage doc={terms[lang]} lang={lang} />
}
