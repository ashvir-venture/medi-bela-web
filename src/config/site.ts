/**
 * Site-wide settings that are not colors (colors live in src/styles/tokens.css).
 * PLACEHOLDER values are marked; replace them before launch.
 */
export const site = {
  /** Production origin, no trailing slash. Set NEXT_PUBLIC_SITE_URL. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://medi-bela-web.vercel.app').replace(/\/$/, ''),
  /** false = waitlist / play buttons; true = store download badges (SPEC §7.1). */
  launched: process.env.NEXT_PUBLIC_LAUNCHED === 'true',
  /** PLACEHOLDER: Play Store listing once published. */
  playStoreUrl: 'https://play.google.com/store/apps/details?id=PLACEHOLDER',
  /** Social profiles; empty url = hidden. */
  socials: [
    { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61596355804101' },
    { name: 'YouTube', url: '' },
    { name: 'LinkedIn', url: '' },
  ],
  /**
   * App screenshots (WebP, 540×1170) captured from the owner's pinned demo artifacts
   * "Rafi's / Abba's Medi-Bela" by scripts/capture-screens.mjs. Order matches screens.items
   * in the dictionaries: Home, Today's medicine, Reminder, Family, Health.
   * Empty src = clearly marked placeholder.
   */
  screenshots: [
    { src: '/assets/screens/home.webp', width: 540, height: 1170 },
    { src: '/assets/screens/today.webp', width: 540, height: 1170 },
    { src: '/assets/screens/reminder.webp', width: 540, height: 1170 },
    { src: '/assets/screens/family.webp', width: 540, height: 1170 },
    { src: '/assets/screens/health.webp', width: 540, height: 1170 },
  ],
  heroScreenshot: { src: '/assets/screens/home.webp', width: 540, height: 1170 },
  heroBackScreenshot: { src: '/assets/screens/today.webp', width: 540, height: 1170 },
  reminderScreenshot: { src: '/assets/screens/reminder.webp', width: 540, height: 1170 },
  logo: { mark: '/assets/brand/logo-mark.png', en: '/assets/brand/logo-en.png', bn: '/assets/brand/logo-bn.png' },
} as const

export const contest = {
  secondsPerQuestion: 20,
  questionsPerAttempt: 5,
  maxPerQuestion: 975,
  maxPerAttempt: 4875,
} as const
