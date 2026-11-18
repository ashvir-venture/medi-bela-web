import type { NextConfig } from 'next'

// Static export only: no server, no API routes, no middleware (SPEC §2).
const nextConfig: NextConfig = {
  output: 'export',
  // Every page becomes folder/index.html, which every static host serves without rewrites.
  trailingSlash: true,
  // No image server in a static export; images are pre-optimized (AVIF/WebP) by hand.
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Two root layouts ((root) for "/" and [lang]) need a global 404 page.
    globalNotFound: true,
  },
}

export default nextConfig
