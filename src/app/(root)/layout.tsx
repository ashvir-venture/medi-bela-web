import type { Metadata } from 'next'
import '@/styles/globals.css'
import { site } from '@/config/site'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: 'Medi-Bela',
  description: 'Medi-Bela: medicine reminders and family care for Bangladesh.',
  alternates: { languages: { bn: '/bn/', en: '/en/', 'x-default': '/bn/' } },
}

// Root "/" only redirects to /bn/ or /en/, so it gets its own tiny root layout.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  )
}
