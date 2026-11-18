import { Hind_Siliguri, Newsreader, Noto_Serif_Bengali } from 'next/font/google'

// next/font downloads these at build time and serves them from our own origin,
// subsetted, with font-display: swap. No request ever goes to Google Fonts at runtime,
// so the CSP can keep font-src 'self'.

/** English display face: refined, high-contrast serif for headlines. */
export const newsreader = Newsreader({
  subsets: ['latin'],
  weight: 'variable',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-newsreader',
})

/** Bangla display face: serif of matching weight and contrast for Bangla headlines. */
export const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ['bengali'],
  weight: 'variable',
  display: 'swap',
  variable: '--font-noto-serif-bn',
  // Only needed on Bangla pages; the browser fetches it when Bangla text needs it.
  preload: false,
})

/** Body face for both scripts (same family the Medi-Bela app bundles). */
export const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-hind',
})

export const fontVariables = `${newsreader.variable} ${notoSerifBengali.variable} ${hind.variable}`
