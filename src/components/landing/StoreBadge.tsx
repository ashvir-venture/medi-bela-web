import { site } from '@/config/site'
import type { Dict } from '@/i18n'

/** Shown instead of the waitlist/play buttons once NEXT_PUBLIC_LAUNCHED=true. */
export function StoreBadge({ dict }: { dict: Dict }) {
  return (
    <div className="store-badges">
      <a className="store-badge" href={site.playStoreUrl} rel="noopener noreferrer" target="_blank">
        <svg width="24" height="26" viewBox="0 0 24 26" aria-hidden="true">
          <path d="M1 1l13 12L1 25c-.6-.3-1-1-1-1.8V2.8C0 2 .4 1.3 1 1z" fill="#34a853" />
          <path d="M18 9l-4 4-13-12c.5-.3 1.2-.3 1.9.1L18 9z" fill="#4285f4" />
          <path d="M18 17L2.9 24.9c-.7.4-1.4.4-1.9.1l13-12 4 4z" fill="#ea4335" />
          <path d="M22.8 11.4c1.2.7 1.2 2.5 0 3.2L18 17l-4-4 4-4 4.8 2.4z" fill="#fbbc04" />
        </svg>
        <span>
          <small>{dict.launched.store}</small>
          {dict.launched.storeName}
        </span>
      </a>
    </div>
  )
}
