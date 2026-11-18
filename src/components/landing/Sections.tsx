/* eslint-disable @next/next/no-img-element -- static export: images are pre-sized files */
import Link from 'next/link'
import { site } from '@/config/site'
import type { Dict, Lang } from '@/i18n'
import { appContacts, appPublic } from '@/content/app-public'
import { Icon, type IconName } from './Icons'
import { PhoneSlot } from './PhoneSlot'
import { Reveal } from './Reveal'
import { Leaderboard } from '@/components/game/Leaderboard'
import { ContactForm } from './ContactForm'

// Landing copy comes from src/i18n/*.json (written only from the app's CLAUDE.md, see
// CONTENT_NOTES.md) and, for About us / contacts, from the app's own public-pages.json
// (src/content/app-public.ts). Never add feature claims here directly.

const FEATURE_ICONS: IconName[] = ['rx', 'family', 'box', 'chart', 'chat', 'easy']

export function About({ lang, dict }: { lang: Lang; dict: Dict }) {
  const a = appPublic[lang]
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <Reveal className="container about-grid">
        <div data-reveal>
          <p className="eyebrow">{a.aboutTitle}</p>
          <p className="about-label">{a.missionLabel}</p>
          <h2 id="about-title" className="about-statement">
            {a.mission}
          </h2>
          <p className="vision-chip">
            <span>{a.visionLabel}</span>
            <strong>{a.vision}</strong>
          </p>
          <p className="about-intro">{dict.about.p1}</p>
        </div>
        <div className="about-body" data-reveal>
          <h3 className="about-sub">{a.goalsHeading}</h3>
          <ol className="goals">
            {a.goals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ol>
          <h3 className="about-sub" style={{ marginTop: 'var(--sp-7)' }}>
            {a.teamHeading}
          </h3>
          <div className="team">
            {a.team.map((m) => (
              <Link key={m.name} className="team-card" href={`/${lang}/about/`}>
                <img src={m.photo} alt="" width={56} height={56} loading="lazy" decoding="async" />
                <span>
                  <strong>{m.name}</strong>
                  <small>{m.field}</small>
                </span>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 'var(--sp-5)' }}>
            <Link href={`/${lang}/about/`} className="text-link">
              {dict.about.teamLink} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </Reveal>
    </section>
  )
}

export function Features({ dict }: { dict: Dict }) {
  const f = dict.features
  return (
    <section id="features" className="section section-tint" aria-labelledby="features-title">
      <Reveal className="container">
        <div className="section-head" data-reveal>
          <p className="eyebrow">{f.eyebrow}</p>
          <h2 id="features-title" className="section-title">
            {f.title}
          </h2>
        </div>

        <article className="feature-lead on-dark" data-reveal>
          <PhoneSlot shot={site.reminderScreenshot} label={f.leadScreen} placeholder={dict.screens.placeholder} />
          <div>
            <h3>{f.leadTitle}</h3>
            <p>{f.leadText}</p>
            <ul className="ring-steps">
              {f.leadSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </article>

        <ol className="feature-list">
          {f.items.map((item, i) => (
            <li key={item.title} className="feature-item" data-reveal>
              <span className="feature-icon" aria-hidden="true">
                <Icon name={FEATURE_ICONS[i] ?? 'rx'} />
              </span>
              <span className="feature-num num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}

export function HowItWorks({ dict }: { dict: Dict }) {
  const h = dict.how
  return (
    <section id="how" className="section" aria-labelledby="how-title">
      <Reveal className="container">
        <div className="section-head" data-reveal>
          <p className="eyebrow">{h.eyebrow}</p>
          <h2 id="how-title" className="section-title">
            {h.title}
          </h2>
        </div>
        <ol className="steps">
          {h.steps.map((s, i) => (
            <li key={s.title} className="step" data-reveal>
              <span className="step-num num" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}

export function Screenshots({ dict }: { dict: Dict }) {
  const s = dict.screens
  return (
    <section id="screens" className="section section-tint" aria-labelledby="screens-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id="screens-title" className="section-title">
            {s.title}
          </h2>
        </div>
        <div className="shots" tabIndex={0} role="region" aria-label={s.title}>
          {s.items.map((label, i) => (
            <figure key={label}>
              <PhoneSlot shot={site.screenshots[i]} label={label} placeholder={s.placeholder} width={220} />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PlayWin({ lang, dict }: { lang: Lang; dict: Dict }) {
  const p = dict.play
  return (
    <section id="play" className="section section-dark on-dark" aria-labelledby="play-title">
      <div className="container play-grid">
        <div>
          <p className="eyebrow">{p.eyebrow}</p>
          <h2 id="play-title" className="section-title">
            {site.launched ? dict.launched.contestOver : p.title}
          </h2>
          <p className="section-lede">{p.lede}</p>
          <div className="prize">
            <div className="prize-medals" aria-hidden="true">
              <span className="medal medal-1 num">1</span>
              <span className="medal medal-2 num">2</span>
              <span className="medal medal-3 num">3</span>
            </div>
            <p>{p.prize}</p>
          </div>
          <ul className="rule-list">
            {p.rules.map((r) => (
              <li key={r.b}>
                <span>
                  <strong>{r.b}</strong> {r.t}
                </span>
              </li>
            ))}
          </ul>
          <div className="play-ctas">
            {!site.launched && (
              <Link href={`/${lang}/play/`} className="btn btn-accent btn-lg">
                {p.ctaPlay} <span className="arrow" aria-hidden="true">→</span>
              </Link>
            )}
            <Link href={`/${lang}/rules/`} className="btn btn-ghost-light btn-lg">
              {p.ctaRules}
            </Link>
          </div>
        </div>
        <Leaderboard t={p} limit={5} />
      </div>
    </section>
  )
}

export function Faq({ dict }: { dict: Dict }) {
  const f = dict.faq
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className="container faq-grid">
        <div>
          <p className="eyebrow">{f.eyebrow}</p>
          <h2 id="faq-title" className="section-title">
            {f.title}
          </h2>
        </div>
        <div className="faq-list">
          {f.items.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>
                {item.q}
                <span className="faq-icon" aria-hidden="true" />
              </summary>
              <p className="faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Contact({ lang, dict }: { lang: Lang; dict: Dict }) {
  const c = dict.contact
  const app = appPublic[lang]
  return (
    <section id="contact" className="section section-tint" aria-labelledby="contact-title">
      <div className="container contact-grid">
        <div>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2 id="contact-title" className="section-title">
            {c.title}
          </h2>
          <p className="section-lede">{c.lede}</p>
          <p className="notice" role="note">
            <span aria-hidden="true">⚠</span>
            <span>{c.notice}</span>
          </p>
          <div className="contacts" aria-label={app.contactHeading}>
            {appContacts.map((n) => (
              <div key={n.display} className="contact-row">
                <span className="num">{n.display}</span>
                <a className="btn btn-outline btn-sm" href={n.tel}>
                  <Icon name="phone" size={18} /> {app.callLabel}
                </a>
                <a className="btn btn-outline btn-sm" href={n.whatsapp} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={18} /> {app.whatsappLabel}
                </a>
              </div>
            ))}
          </div>
        </div>
        <ContactForm dict={c} />
      </div>
    </section>
  )
}
