import { notFound } from 'next/navigation'
import { getDict, isLang } from '@/i18n'
import { Hero } from '@/components/landing/Hero'
import { About, Contact, Faq, Features, HowItWorks, PlayWin, Screenshots } from '@/components/landing/Sections'

// Static HTML (server component). Only the leaderboard, reveals and contact form hydrate.
export default async function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const dict = getDict(lang)

  return (
    <>
      <Hero lang={lang} dict={dict} />
      <About lang={lang} dict={dict} />
      <Features dict={dict} />
      <HowItWorks dict={dict} />
      <Screenshots dict={dict} />
      <PlayWin lang={lang} dict={dict} />
      <Faq dict={dict} />
      <Contact lang={lang} dict={dict} />
    </>
  )
}
