// Builds the static site against a FAKE Supabase project for Playwright.
// The tests intercept every request to https://stub.supabase.co, so no real data is touched.
// Rebuild with your real .env.local values (npm run build) before deploying.
import { spawnSync } from 'node:child_process'

const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: 'https://stub.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'stub-publishable-key',
  NEXT_PUBLIC_WEB3FORMS_KEY: 'stub-web3forms-key',
  NEXT_PUBLIC_LAUNCHED: 'false',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:4173',
}
const r = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], { env, stdio: 'inherit' })
if (r.status !== 0) process.exit(r.status ?? 1)
const f = spawnSync(process.execPath, ['scripts/fix-export-segments.mjs'], { stdio: 'inherit' })
process.exit(f.status ?? 1)
