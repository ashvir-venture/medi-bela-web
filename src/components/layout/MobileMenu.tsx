'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type NavLink = { href: string; label: string }

/** Hamburger + drop-down panel for narrow screens. Hidden on wide screens by CSS. */
export function MobileMenu({
  links,
  cta,
  openLabel,
  closeLabel,
}: {
  links: NavLink[]
  cta?: NavLink
  openLabel: string
  closeLabel: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close when the page changes (adjust state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const wide = window.matchMedia('(min-width: 1100px)')
    function onWide() {
      if (wide.matches) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    wide.addEventListener('change', onWide)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
      wide.removeEventListener('change', onWide)
    }
  }, [open])

  return (
    <div className="mobile-menu" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={`menu-btn${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <nav id="mobile-menu-panel" className={`menu-panel${open ? ' is-open' : ''}`} aria-label={openLabel} hidden={!open}>
        <div className="container menu-panel-inner">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          {cta && (
            <Link href={cta.href} className="btn btn-accent btn-block menu-cta" onClick={() => setOpen(false)}>
              {cta.label}
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}
