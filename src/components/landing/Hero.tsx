import Link from 'next/link'
import { site } from '@/config/site'
import type { Dict, Lang } from '@/i18n'
import { PhoneSlot } from './PhoneSlot'
import { StoreBadge } from './StoreBadge'

/**
 * ECG trace in a 1440×200 box: a calm baseline with three heartbeats. The middle beat
 * sits under the headline. Drawn with stroke-dashoffset (pathLength=1), CSS only; after
 * the draw, a bright blip keeps travelling along it like a patient monitor.
 */
const ECG_PATH =
  'M0 120 H250 l14 -8 l12 8 H330 l10 14 l14 -96 l16 122 l12 -48 l9 8 H470 l22 -16 l20 16 H620 ' +
  'l14 -8 l12 8 H700 l10 14 l14 -110 l16 136 l12 -52 l9 10 H860 l22 -16 l20 16 H1010 ' +
  'l14 -8 l12 8 H1090 l10 14 l14 -80 l16 104 l12 -40 l9 2 H1230 l22 -14 l20 14 H1440'

export function Hero({ lang, dict }: { lang: Lang; dict: Dict }) {
  const h = dict.hero
  return (
    <section className="hero on-dark" aria-labelledby="hero-title">
      <div className="hero-aurora" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <svg className="hero-ecg" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
        <path className="ecg-glow" d={ECG_PATH} pathLength={1} />
        <path className="ecg-line" d={ECG_PATH} pathLength={1} vectorEffect="non-scaling-stroke" />
        <path className="ecg-blip" d={ECG_PATH} pathLength={1} vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="container hero-inner">
        <div>
          <p className="eyebrow hero-rise" data-step="1">
            {site.launched ? dict.launched.eyebrow : h.eyebrow}
          </p>
          <h1 id="hero-title" className="hero-title hero-rise" data-step="2">
            {h.titleA} <em>{h.titleB}</em>
          </h1>
          <p className="hero-lede hero-rise" data-step="3">
            {h.lede}
          </p>
          <div className="hero-ctas hero-rise" data-step="4">
            {site.launched ? (
              <StoreBadge dict={dict} />
            ) : (
              <>
                <Link href={`/${lang}/play/`} className="btn btn-accent btn-lg btn-shine">
                  {h.ctaPlay} <span className="arrow" aria-hidden="true">→</span>
                </Link>
                <Link href={`/${lang}/waitlist/`} className="btn btn-ghost-light btn-lg">
                  {h.ctaWaitlist}
                </Link>
              </>
            )}
          </div>
          {!site.launched && (
            <p className="hero-note hero-rise" data-step="5">
              {h.note}
            </p>
          )}
        </div>
        <div className="hero-visual hero-rise" data-step="3">
          <div className="hero-phones">
            <div className="phone-back">
              <PhoneSlot shot={site.heroBackScreenshot} label={h.screenBackLabel} placeholder={dict.screens.placeholder} width={200} />
            </div>
            <div className="phone-front">
              <PhoneSlot shot={site.heroScreenshot} label={h.screenLabel} placeholder={dict.screens.placeholder} width={240} priority />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
