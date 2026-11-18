/* eslint-disable @next/next/no-img-element -- static export: pre-sized team photos */
import { notFound } from 'next/navigation'
import { getDict, isLang } from '@/i18n'
import { pageMetadata } from '@/lib/metadata'
import { appContacts, appPublic } from '@/content/app-public'
import { Icon } from '@/components/landing/Icons'

// About us: the app's own text (docs/content/public-pages.json → src/content/app-public.ts).
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) return {}
  const m = getDict(lang).meta
  return pageMetadata(lang, 'about/', { title: m.aboutTitle, description: m.aboutDescription })
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const a = appPublic[lang]

  return (
    <article>
      <header className="page-hero on-dark">
        <div className="container">
          <p className="eyebrow">{a.aboutTitle}</p>
          <p className="about-label">{a.missionLabel}</p>
          <h1>{a.mission}</h1>
          <p className="vision-chip">
            <span>{a.visionLabel}</span>
            <strong>{a.vision}</strong>
          </p>
        </div>
      </header>
      <div className="container">
        <div className="prose" style={{ maxWidth: '56rem' }}>
          <h2>{a.goalsHeading}</h2>
          <ol className="goals">
            {a.goals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ol>

          <h2>{a.teamHeading}</h2>
          <div className="team team-lg">
            {a.team.map((m) => (
              <div key={m.name} className="team-card">
                <img src={m.photo} alt={m.name} width={88} height={88} loading="lazy" decoding="async" />
                <span>
                  <strong>{m.name}</strong>
                  <small>{m.field}</small>
                  <small>{m.university}</small>
                  <a className="text-link" href={m.facebook} target="_blank" rel="noopener noreferrer">
                    {a.facebookLabel} <span aria-hidden="true">↗</span>
                  </a>
                </span>
              </div>
            ))}
          </div>

          <h2>{a.contactHeading}</h2>
          <div className="contacts">
            {appContacts.map((n) => (
              <div key={n.display} className="contact-row">
                <span className="num">{n.display}</span>
                <a className="btn btn-outline btn-sm" href={n.tel}>
                  <Icon name="phone" size={18} /> {a.callLabel}
                </a>
                <a className="btn btn-outline btn-sm" href={n.whatsapp} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={18} /> {a.whatsappLabel}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
