// Generates PLACEHOLDER Open Graph images (1200×630) into public/og/.
//   node scripts/make-og.mjs
// Text is English in both images: the image renderer cannot shape Bangla conjuncts.
// Replace with designed images once brand assets arrive. Colors mirror src/styles/tokens.css.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { ImageResponse } from 'next/og.js'
import React from 'react'

const h = React.createElement
const INK = '#050c16'
const PULSE = '#5cc8d4'
const PAPER = '#e8eef6'
const LOGO = `data:image/png;base64,${(await readFile('public/assets/brand/logo-mark.png')).toString('base64')}`
const MUTED = '#a9b6c8'

function card(subtitle) {
  return h(
    'div',
    { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: `radial-gradient(circle at 85% 10%, rgba(92,200,212,0.25), transparent 55%), ${INK}`, padding: 72, color: PAPER } },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 20 } },
      h('img', { src: LOGO, width: 72, height: 72, style: { borderRadius: 36, background: '#fff' } }),
      h('div', { style: { fontSize: 44, fontWeight: 700 } }, 'Medi-Bela'),
    ),
    h(
      'svg',
      { width: 1056, height: 120, viewBox: '0 0 1056 120' },
      h('path', {
        d: 'M0 70 H300 l12 18 l18 -80 l20 100 l14 -38 H560 l12 18 l18 -60 l20 80 l14 -38 H1056',
        fill: 'none',
        stroke: PULSE,
        strokeWidth: 5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
    ),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      h('div', { style: { fontSize: 60, lineHeight: 1.1 } }, 'Every dose, on time. Your family, close by.'),
      h('div', { style: { fontSize: 30, color: MUTED } }, subtitle),
    ),
  )
}

await mkdir('public/og', { recursive: true })
for (const [lang, subtitle] of [
  ['en', 'Medicine reminders and family care for Bangladesh · Play & Win'],
  ['bn', 'Bangla & English · Medicine reminders and family care · Play & Win'],
]) {
  const res = new ImageResponse(card(subtitle), { width: 1200, height: 630 })
  await writeFile(`public/og/og-${lang}.png`, Buffer.from(await res.arrayBuffer()))
  console.log(`public/og/og-${lang}.png`)
}
