// Small outlined icons (24×24, currentColor), matching the app's outlined icon style.
const PATHS = {
  rx: 'M8 3h6l4 4v14H6V3h2zm6 0v4h4M9 12h6M9 16h4',
  family:
    'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-1A3.5 3.5 0 0 0 8 18.5V20M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 20v-1a3 3 0 0 0-2-2.8M17 6.2a2.6 2.6 0 0 1 0 4.8M5 20v-1a3 3 0 0 1 2-2.8M7 6.2a2.6 2.6 0 0 0 0 4.8',
  box: 'M4 8l8-4 8 4v8l-8 4-8-4V8zm0 0l8 4 8-4M12 12v8',
  chart: 'M4 19h16M7 15l3-4 3 2 4-6',
  chat: 'M5 5h14v10H9l-4 4V5zm4 5h.01M12 10h.01M15 10h.01',
  easy: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-4 9.5l2.5 2.5L16 9.5',
  phone: 'M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z',
  whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20zm5-11.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 1a5 5 0 0 1-2.5-2.5l1-1-1-2L9 8.5z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
