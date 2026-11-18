/* eslint-disable @next/next/no-img-element -- static export: no image optimizer */
import { site } from '@/config/site'

/** The Medi-Bela logo mark (from the app) on a white disc, so it reads on the dark site. */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <span className="brand-badge" style={{ width: size, height: size }} aria-hidden="true">
      <img src={site.logo.mark} alt="" width={size} height={size} decoding="async" />
    </span>
  )
}
