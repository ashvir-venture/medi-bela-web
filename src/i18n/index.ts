import bn from './bn.json'
import en from './en.json'

export const LANGS = ['bn', 'en'] as const
export type Lang = (typeof LANGS)[number]
export const DEFAULT_LANG: Lang = 'bn'
/** localStorage key that remembers the visitor's language choice. */
export const LANG_STORAGE_KEY = 'mb-lang'

export type Dict = typeof en

// Bangla must have the same shape as English; this line fails the type check if a key is missing.
const bnTyped: Dict = bn
const dictionaries: Record<Lang, Dict> = { en, bn: bnTyped }

export function isLang(value: unknown): value is Lang {
  return value === 'bn' || value === 'en'
}

export function getDict(lang: Lang): Dict {
  return dictionaries[lang]
}

/** Replace {name}-style placeholders. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`))
}

/** Latin digits for scores and timers in both languages (SPEC §7.4). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}
