# Medi-Bela website

Pre-launch site for the Medi-Bela app (Bangla + English) with a waitlist and a daily
"Play & Win" quiz. Static Next.js export + Supabase (Auth, Postgres, RLS, RPCs) + Web3Forms.
No custom backend. Spec: [SPEC.md](SPEC.md). Content sources: [CONTENT_NOTES.md](CONTENT_NOTES.md).

## Commands

```bash
npm install
cp .env.example .env.local      # fill in values
npm run dev                     # http://localhost:3000
npm run build                   # static site in out/
npm run serve                   # serve out/ on :3000
npm run lint && npm run typecheck
npm run test:e2e                # Playwright (Supabase stubbed; uses installed Edge)
bash scripts/db.sh migrate      # apply supabase/migrations to SUPABASE_DB_URL (fresh DB)
bash scripts/db.sh test         # database tests (rolls back)
python scripts/sync-app-content.py   # re-copy About / Privacy & terms / contacts from the app
node scripts/capture-screens.mjs <rafi.html> <abba.html>   # re-capture app screenshots
npm run og                      # regenerate Open Graph images
```

## Map

- `src/app/[lang]/` pages: landing, about, rules, privacy, terms, play, waitlist. `(root)/` redirects `/`.
- `src/components/landing|game|layout/`, `src/lib/` (Supabase client, RPC wrappers, errors, phone).
- `src/i18n/{bn,en}.json` all UI text; `src/content/` legal drafts + generated app text.
- `src/styles/tokens.css` every colour/size (app's dark palette); `premium.css` depth and motion.
- `supabase/migrations/` 001 schema · 002 RLS · 003 game RPCs · 004 seed · 005 SMS hook.
- Docs: [SUPABASE_SETUP.md](SUPABASE_SETUP.md), [DEPLOY.md](DEPLOY.md),
  [LAUNCH_RUNBOOK.md](LAUNCH_RUNBOOK.md), [QA_CHECKLIST.md](QA_CHECKLIST.md),
  admin SQL in [supabase/admin_queries.sql](supabase/admin_queries.sql).
