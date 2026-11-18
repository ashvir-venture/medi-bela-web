# Deploy

The site is a **static export** (`out/`). No server, no API routes. Any static host works;
**Cloudflare Pages** is recommended (free, fast in South Asia, reads `public/_headers`).

## Environment variables (set on the host, Production and Preview)

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qfybqbpwawhesrravxfj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → Publishable |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | web3forms.com → access key (sent to the email you register there) |
| `NEXT_PUBLIC_LAUNCHED` | `false` until the app is on Google Play |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (no trailing slash) |
| `NODE_VERSION` | `22` |

`SUPABASE_DB_URL` is **local only** (migrations/tests). Never add it to the host.

## Cloudflare Pages

1. Push this repo to GitHub (private is fine).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Framework preset: **None**. Build command: `npm run build`. Output directory: `out`.
4. Add the environment variables above → Save and Deploy.
5. Custom domains → add your domain. Then set the same domain in Supabase → Authentication →
   URL Configuration → Site URL.
6. `public/_headers` is copied into `out/` and applied automatically (CSP, HSTS, caching).

Netlify: same build command and `out` folder; `_headers` works the same way.
Vercel: framework "Other", output `out`; copy the headers from `public/_headers` into a
`vercel.json` `headers` block.

## Content Security Policy

`public/_headers` allows only: this site, the Supabase project (HTTPS + WSS), and
`api.web3forms.com`. Fonts are self-hosted by `next/font`, so no Google Fonts domains.

Choice: **`script-src 'self' 'unsafe-inline'`**. Next's static export inlines small hydration
scripts whose content changes every build; hashing them would need a post-build step that rewrites
`_headers` each deploy. The risk is low here: no user-generated HTML is rendered, no third-party
scripts load, and `connect-src` is a strict allow-list. If you move Supabase projects, update the
project ref in `connect-src`.

## Windows builds

`npm run build` runs `scripts/fix-export-segments.mjs` after `next build`. It works around a
Next 16 bug on Windows (segment prefetch files written into nested folders). On Linux hosts it
does nothing.

## After every deploy

- Open `/bn/` and `/en/`, the leaderboard loads (or says it opens soon).
- `/en/play/`: create a test account, play, then delete it (`admin_queries.sql` §10).
- Send one contact form message and check the inbox.
- Re-run `bash scripts/db.sh test` after any database change.
