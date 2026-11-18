import type { Lang } from '@/i18n'

/** A section, or (with `group`) a divider heading that groups the sections after it. */
export type LegalSection = { h: string; p?: string[]; ul?: string[]; group?: boolean }
export type LegalDoc = { title: string; intro: string; updated: string; draft: string; sections: LegalSection[] }

/** Renders a legal/text page from plain data (server component, static HTML). */
export function LegalPage({ doc, lang }: { doc: LegalDoc; lang: Lang }) {
  return (
    <article lang={lang}>
      <header className="page-hero on-dark">
        <div className="container">
          <h1>{doc.title}</h1>
          <p>{doc.intro}</p>
          <p className="num" style={{ fontSize: 'var(--fs-sm)' }}>
            {doc.updated}
          </p>
          <span className="draft-banner">{doc.draft}</span>
        </div>
      </header>
      <div className="container">
        <div className="prose">
          {doc.sections.map((s) =>
            s.group ? (
              <p key={s.h} className="legal-group">
                {s.h}
              </p>
            ) : (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.ul && (
                <ul>
                  {s.ul.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              {s.p?.map((t) => <p key={t}>{t}</p>)}
            </section>
            ),
          )}
        </div>
      </div>
    </article>
  )
}
