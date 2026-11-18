/**
 * Bangladeshi mobile numbers. People type them many ways: 01712345678, +880 1712-345678,
 * 8801712345678, or with Bangla digits (০১৭১২৩৪৫৬৭৮). All become E.164: +8801712345678.
 * Supabase Auth stores the phone without the "+" (8801712345678).
 */
const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯'

export function toLatinDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)))
}

/** Returns +8801XXXXXXXXX, or null when it is not a valid Bangladeshi mobile number. */
export function normalizeBdPhone(input: string): string | null {
  let digits = toLatinDigits(input).replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) digits = digits.slice(1)
  if (digits.startsWith('00880')) digits = digits.slice(2)
  if (digits.startsWith('880')) digits = digits.slice(3)
  if (digits.startsWith('1') && digits.length === 10) digits = `0${digits}`
  // Operator prefixes 013-019; 11 digits in total.
  return /^01[3-9]\d{8}$/.test(digits) ? `+88${digits}` : null
}

/** 8801712345678 / +8801712345678 → 01712-345678 (for showing a person their own number). */
export function formatBdPhone(stored: string | null | undefined): string {
  if (!stored) return ''
  const local = stored.replace(/^\+?88/, '')
  return local.length === 11 ? `${local.slice(0, 5)}-${local.slice(5)}` : stored
}
