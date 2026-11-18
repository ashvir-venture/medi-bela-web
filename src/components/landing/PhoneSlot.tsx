/* eslint-disable @next/next/no-img-element -- static export: images are pre-optimized, no next/image server */

type Shot = { readonly src: string; readonly width: number; readonly height: number }

/**
 * A phone frame holding an app screenshot. With no `src` it shows a clearly marked
 * placeholder (SPEC: assets arrive later in /public/assets).
 */
export function PhoneSlot({
  shot,
  label,
  placeholder,
  width = 260,
  priority = false,
}: {
  shot: Shot
  label: string
  placeholder: string
  width?: number
  priority?: boolean
}) {
  return (
    <div className="phone" style={{ ['--w' as string]: `${width}px` }}>
      <div className="phone-screen">
        {shot.src ? (
          <img
            src={shot.src}
            alt={label}
            width={shot.width}
            height={shot.height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
          />
        ) : (
          <div className="placeholder-slot" role="img" aria-label={`${label}: ${placeholder}`}>
            <span className="placeholder-tag">Placeholder</span>
            <strong>{label}</strong>
            <span>{placeholder}</span>
          </div>
        )}
      </div>
    </div>
  )
}
