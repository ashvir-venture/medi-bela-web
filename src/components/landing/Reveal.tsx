'use client'

import { useEffect, useRef } from 'react'

/**
 * Quiet scroll reveals for [data-reveal] children (GSAP + ScrollTrigger).
 * - GSAP is imported lazily, so it never blocks the first paint.
 * - Only elements still below the fold are hidden, so nothing visible ever blinks.
 * - gsap.context() + revert() cleans up fully (safe under React strict mode).
 * - prefers-reduced-motion: does nothing; content is simply there.
 */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    let ctx: { revert: () => void } | undefined

    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        const all = gsap.utils.toArray<HTMLElement>('[data-reveal]', root)
        const below = all.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.95)
        if (!below.length) return
        gsap.set(below, { autoAlpha: 0, y: 28 })
        ScrollTrigger.batch(below, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09, overwrite: true }),
        })
      }, root)
    })

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
