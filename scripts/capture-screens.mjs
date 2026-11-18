// Captures app screenshots from the owner's pinned demo artifact ("Rafi's Medi-Bela")
// and writes optimized WebP files to public/assets/screens/.
//
//   node scripts/capture-screens.mjs <rafi.html> <abba.html>         # writes the website screenshots
//   node scripts/capture-screens.mjs <demo.html> --list               # list the demo's screens
//   node scripts/capture-screens.mjs <demo.html> --probe <dir> a,b,c  # PNG previews of screens
//
// Get the HTML with the Artifact tool (read) from the two pinned demos:
//   Rafi's Medi-Bela (caregiver) https://claude.ai/artifact/4pMkLHTA4WzdVykuPTqLSk
//   Abba's Medi-Bela (patient)   https://claude.ai/artifact/LdqxbR7Ej8dbBPWYBwNzez
// Each demo is one self-rendering HTML page; screens are opened through its own go(<screen>)
// router. Uses the installed Microsoft Edge via Playwright.
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const [, , demoPath, secondArg, ...rest] = process.argv
if (!demoPath) {
  console.error('usage: node scripts/capture-screens.mjs <rafi.html> <abba.html> | <demo.html> --list | --probe dir a,b')
  process.exit(2)
}
const flags = [secondArg, ...rest].filter(Boolean)
const abbaPath = secondArg && !secondArg.startsWith('--') ? secondArg : null

// website file -> which demo (caregiver Rafi or patient Abba) and which screen
const SHOTS = [
  { file: 'home', demo: 'rafi', screen: 'home' },
  { file: 'today', demo: 'abba', screen: 'meds' },
  { file: 'reminder', demo: 'abba', screen: 'alarm' },
  { file: 'family', demo: 'rafi', screen: 'family' },
  { file: 'health', demo: 'rafi', screen: 'health' },
]

const W = 390
const H = 844 // phone viewport (CSS px); output is 2x for sharpness, then resized to 540×1170

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge' })

async function open(path) {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: 'light' })
  await p.goto(pathToFileURL(resolve(path)).href)
  await p.waitForTimeout(1200)
  // Signed-in state, Bangla UI (the app is Bangla first).
  await p.evaluate(() => {
    S.logged = true  
  })
  return p
}

const page = await open(demoPath)
const pages = { rafi: page, abba: abbaPath ? await open(abbaPath) : page }

if (flags.includes('--list')) {
  console.log(await page.evaluate(() => Object.keys(SC).join(' ')))  
  await browser.close()
  process.exit(0)
}

const probeIdx = flags.indexOf('--probe')
const probeDir = probeIdx >= 0 ? flags[probeIdx + 1] : null
const list = probeDir ? (flags[probeIdx + 2] || '').split(',').filter(Boolean).map((s) => ({ file: s, screen: s })) : SHOTS
const outDir = probeDir || 'public/assets/screens'
await mkdir(outDir, { recursive: true })

for (const shot of list) {
  const pg = pages[shot.demo || 'rafi']
  await pg.evaluate((s) => go(s), shot.screen)  
  await pg.waitForTimeout(700)
  await pg.evaluate(() => window.scrollTo(0, 0))
  const png = await pg.screenshot({ type: 'png' })
  if (probeDir) {
    await writeFile(`${outDir}/${shot.file}.png`, png)
  } else {
    // Encode to WebP at 540×1170 inside the browser (no image tooling needed).
    const webp = await pg.evaluate(async (b64) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const c = document.createElement('canvas')
      c.width = 540
      c.height = 1170
      c.getContext('2d').drawImage(img, 0, 0, 540, 1170)
      return c.toDataURL('image/webp', 0.82).split(',')[1]
    }, png.toString('base64'))
    await writeFile(`${outDir}/${shot.file}.webp`, Buffer.from(webp, 'base64'))
  }
  console.log(`${outDir}/${shot.file}`)
}
await browser.close()
