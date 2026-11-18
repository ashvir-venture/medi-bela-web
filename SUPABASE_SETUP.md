# Supabase setup (click by click)

Sign-in is **mobile number + password** (Supabase Auth, Phone provider). There is **no SMS yet**:
phone confirmations stay OFF until the SMS gateway is connected (section 6). The website never
sends email or SMS to anyone.

Project in use: ref **`qfybqbpwawhesrravxfj`**, region **Tokyo (ap-northeast-1)**.

> Region note: Singapore (`ap-southeast-1`, where the app's database is) or Mumbai is closer to
> Bangladesh than Tokyo (roughly 40–80 ms less per request). The database is still almost empty,
> so moving now is cheap: create a new project in Singapore, run `bash scripts/db.sh migrate`
> against it, and update the URL/key in `.env.local`, the host's env vars and `public/_headers`.

## 1. Database (already done for this project)

Migrations `supabase/migrations/001–005` were applied on 2026-11-19 and the test suite passed
(69 checks). For a fresh project:

1. Put the connection string in `.env.local` as `SUPABASE_DB_URL`
   (Project Settings → Database → Connection string → **Session pooler**, port 5432).
2. Run:
   ```bash
   bash scripts/db.sh migrate
   ```
3. Check everything:
   ```bash
   bash scripts/db.sh test
   ```
   It runs in one transaction and rolls back, so it leaves no data. Ends with `ALL DATABASE TESTS PASSED`.

## 2. Authentication → Sign In / Providers

1. **Allow new users to sign up**: ON.
2. **Email**: open it → turn **Enable Email provider** OFF → Save.
3. **Phone**: open it → turn **Enable Phone provider** ON.
   - **Enable phone confirmations**: OFF (no SMS gateway yet).
   - **SMS provider**: if the form insists on a provider, first do step 4 (Send SMS hook), then
     come back. With the hook enabled Supabase does not need Twilio/Vonage.
   - Save.
4. **Authentication → Auth Hooks → Send SMS hook** → Add hook → type **Postgres** →
   schema `public`, function `send_sms_hook` → Enable → Save. (It does nothing today; see section 6.)
5. **Anonymous sign-ins**: OFF. All social providers (Google, etc.): OFF.

## 3. Authentication → other settings

1. **Password requirements** (Sign In / Providers → Email/Phone, or Auth → Policies, depending on the dashboard
   version): **Minimum password length 8**. The website also enforces 8–72.
2. **Rate limits** (Authentication → Rate Limits): "Sign-ups and sign-ins" per 5 minutes per IP:
   lower from the default to about **10–15** to slow down bulk fake accounts.
3. **URL Configuration**: Site URL = your production domain (e.g. `https://medi-bela.com`).
   Phone/password needs no redirect URLs.
4. **Attack Protection → CAPTCHA** (recommended before a big launch push): Cloudflare Turnstile.
   Needs a small website change (pass `captchaToken` on sign-up/sign-in) and a CSP update;
   not built yet.

## 4. API keys and Data API

1. **Project Settings → API Keys** → copy the **Publishable** key (`sb_publishable_…`, or the legacy
   `anon` key) into `.env.local` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and into the host's env vars.
2. **Never** use the secret / `service_role` key anywhere in this project.
3. **Data API**: exposed schemas = `public` (default). Do **not** add `private`.

## 5. Operations

- **Free plan pauses** a project after about a week without activity. Visits to the site keep it
  awake (the leaderboard calls the API), but check before launch day and consider the Pro plan for
  the contest period (daily backups, no pausing). Check current plan limits in the dashboard.
- **Backups**: free plan has no point-in-time restore. Export weekly with the `\copy` lines in
  `supabase/admin_queries.sql` (section 9) and keep the CSVs somewhere private.
- **Admin work** (close contest, winners, flags, waitlist export): `supabase/admin_queries.sql`.

## 6. Known limits without SMS, and switching SMS on later

Without SMS verification:
- Anyone can register **any** number, including someone else's, and a determined cheater can make
  several accounts with made-up numbers. Mitigations in place: per-IP rate limits, too-fast answers
  flagged, the contest rules (one person, own number, right to disqualify), and **winners are
  verified by calling the number** (LAUNCH_RUNBOOK.md).
- Forgotten passwords can't be reset by the user (no reset screen for now); they can write in via
  the contact form. An admin can delete the account (`admin_queries.sql` §10) so they can sign up again.

To add SMS (same HTTP gateway as the app):
1. Database → Extensions → enable `pg_net`. Store the gateway key in **Vault** (never in SQL files).
2. Replace the body of `public.send_sms_hook(event jsonb)` (migration 005) with a `net.http_post`
   call to the gateway using `event->'user'->>'phone'` and `event->'sms'->>'otp'`.
3. Turn **Enable phone confirmations** ON.
4. Website change (not built yet): after `signUp`, show a 6-digit code screen and call
   `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`; add "Forgot password" with
   `signInWithOtp` / `updateUser({ password })`. `src/components/game/useAuth.ts` already throws
   `verification_needed` when sign-up returns no session, so nothing breaks before that screen exists.
