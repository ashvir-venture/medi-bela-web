import { notFound } from 'next/navigation'
import { getDict, isLang } from '@/i18n'
import { pageMetadata } from '@/lib/metadata'
import { PlayApp } from '@/components/game/PlayApp'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return pageMetadata(lang, 'play/', { title: getDict(lang).meta.playTitle })
}

// Static shell; everything inside is a client component talking to Supabase RPCs.
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const dict = getDict(lang)
  return (
    <section className="game-page">
      <div className="container">
        <PlayApp lang={lang} t={{ game: dict.game, errors: dict.errors, play: dict.play }} />
      </div>
    </section>
  )
}
