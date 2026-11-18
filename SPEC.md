# Medi-Bela: Pre-launch Website + "Play & Win" Game (v2)

You are building the pre-launch website for **Medi-Bela**, a healthcare app, plus a login-gated quiz game that runs until the app launches. Read this whole document before writing code. Ask me before assuming anything marked **[TBD]**.

## 0. Source of truth for content

- The app's own **`CLAUDE.md`** (in the Medi-Bela app repo, Medi-Bela/CLAUDE.md) is the **only** source for feature descriptions, landing-page copy, and quiz questions/answers. There is no FEATURES.md.
- **Use only current, updated information.** Skip anything marked deprecated, removed, planned, TODO, experimental or contradicted by a newer section. If the app code is available, cross-check against it. If a feature's status is unclear, **do not use it**; list it in `CONTENT_NOTES.md` and ask me.
- Never invent features, numbers, claims or medical statements.
- Produce `CONTENT_NOTES.md`: which CLAUDE.md sections were used, which were skipped and why, and open questions.
- Every question stores `source_section` (the CLAUDE.md heading that proves the answer) so answers can be re-verified. Re-check all content against CLAUDE.md again at the end (Phase 6), because the app may change before launch.
- `/public/assets` (logo, brand colors, screenshots) will be added later. Build with clearly marked placeholders; keep every brand value in one tokens file.

## 1. Product summary

- **Purpose:** introduce Medi-Bela, collect a waitlist, and drive attention with a **daily quiz contest**.
- **Audience:** mainly Bangladesh, mostly mobile, often slow connections. Bangla and English are both first-class.
- **Public vs login:** the whole website (landing, rules, privacy, terms, public leaderboard) is **public with no login prompt**. **Only the game and join waitlist requires authentication.**
- **Contest:** a signed-in player gets **one attempt per day**. Each attempt is **5 random questions** scored on correctness and speed. A player's **best single attempt** counts. At app launch the **top 3 scores** win a prize. Optional polls collect UX/feature feedback.
- **Waitlist:** signing in with Google to play, plus ticking the consent box, puts the person on the waitlist. There is no separate email-only signup. **[TBD: confirm; an email-only waitlist would hold unverified addresses.]**
- **Prize: Just say attractive, eligibility: nothing

## 2. Hard constraints

- **No custom backend, no server of our own.** Static Next.js export + **Supabase** (Auth, Postgres, RLS, SQL functions) + **Web3Forms** for the contact form only. No Next.js API routes, server actions, middleware or SSR.
- **The app sends no emails to users.** Authentication is **Google OAuth only**. No email OTP, magic link, password, SMS, or SMTP setup.
- All scoring, timing, question selection and the daily limit are enforced **in the database**. The browser is untrusted.
- Correct answers must **never** reach the client before the question is answered.
- Never expose the Supabase `service_role` key anywhere.
- Mobile-first, fast on 3G/4G, accessible (keyboard focus, contrast, `prefers-reduced-motion`).
- Bangla and English everywhere, including questions and error messages.

## 3. Tech stack

- **Next.js** (latest stable, App Router) + **TypeScript**, configured with `output: 'export'` (static HTML). Set `images.unoptimized: true` and pre-optimize images to AVIF/WebP yourself.
- **Routing/i18n:** `app/[lang]/...` with `generateStaticParams` for `bn` and `en`: `/[lang]`, `/[lang]/play`, `/[lang]/rules`, `/[lang]/privacy`, `/[lang]/terms`, `/[lang]/auth/callback`. Root `/` is a tiny client page that redirects to the saved/preferred language (default `bn`). Add `hreflang` alternates and per-language metadata. Dictionaries in `src/i18n/bn.json` and `en.json`.
- **Rendering split:** landing, rules, privacy, terms are server components (static HTML). Only `play`, the auth callback, the leaderboard widget and animation components are client components.
- **Animation:** GSAP + ScrollTrigger inside client components using `gsap.context()` with proper cleanup (React strict mode safe), lazy-loaded below the fold, honoring `prefers-reduced-motion`.
- **Supabase:** `@supabase/supabase-js` v2 in client components, PKCE flow, session in browser storage. No `@supabase/ssr` is needed for a static export.
- **Migrations:** Supabase CLI in `supabase/migrations/`.
- **Hosting:** Cloudflare Pages, Netlify or Vercel (static). Provide a `_headers` file with a CSP allowing only self, Supabase, Web3Forms, Google fonts if used and Google sign-in. Note the tradeoff that Next's inline hydration scripts need hashes or `'unsafe-inline'` for scripts, and document your choice.
- **Env vars** (`.env.example`, never commit real values): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_WEB3FORMS_KEY`, `NEXT_PUBLIC_LAUNCHED` (`false`).
- **Tests:** SQL test script for the database (section 11) and Playwright for key UI flows with the auth layer stubbed.

## 4. Game rules (authoritative)

| Rule | Value |
|---|---|
| Attempts | 1 per player per **Bangladesh calendar day** (Asia/Dhaka, UTC+6); resets 00:00 BDT |
| Question pool | 13 seeded (5 easy, 5 medium, 3 hard); admin can add more |
| Per attempt | 5 random: **2 easy + 2 medium + 1 hard** (same difficulty mix for everyone) |
| Repeat avoidance | prefer questions the player has seen least, then random |
| Time per question | 20 s (`seconds_per_question`, configurable) |
| Wrong answer / timeout | 0 points |
| Correct answer | `points = floor(500 + 500 * (1 - eff / limit))`, `eff = clamp(elapsed - grace, 1000 ms, limit)` |
| Grace | 800 ms not counted (mobile latency) |
| Max per question | 975. **100% is impossible by design** |
| Max per attempt | 4875 |
| Too fast | answers under 700 ms are flagged and score 0 |
| Late | beyond `limit + grace + 1500 ms` tolerance counts as timeout |
| Leaderboard | best completed, unflagged attempt per player |
| Tie-break | earlier `completed_at` of the best attempt |
| Abandoned attempt | still uses the day's attempt; unanswered questions expire to 0 |
| After the last question | optional unscored feedback polls |

UI shows **points and rank, never a percentage**.

## 5. Supabase and Google configuration (document every step in `SUPABASE_SETUP.md`)

I will create the accounts; you give exact click-by-click instructions.

**Supabase project**
1. Region: Mumbai (`ap-south-1`) or Singapore (`ap-southeast-1`); recommend after a latency check.
2. Auth providers: **Google enabled**; Email provider **disabled**; Phone **off**; **Anonymous sign-ins disabled**. Disable email confirmations since no email flow exists.
3. URL configuration: Site URL = production domain. Redirect URLs allow-list: `https://<domain>/**`, the preview domain pattern, and `http://localhost:3000/**`.
4. Keys: only the **publishable/anon** key goes in the frontend.

**Google Cloud Console**
1. Create a project; configure the **OAuth consent screen**: app name "Medi-Bela", logo, support email, authorized domain, privacy policy and terms links (our pages). Scopes: only `openid`, `email`, `profile` (non-sensitive).
2. **Publish the consent screen to "In production".** If left in Testing, only listed test users can sign in and their sessions expire. This is a very common launch-day mistake.
3. Create an **OAuth client ID (Web application)**. Authorized JavaScript origins: production domain and `http://localhost:3000`. Authorized redirect URI: the Supabase callback `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Paste Client ID and Secret into Supabase, Auth, Providers, Google.
5. Note that the Google consent screen may show the Supabase project domain unless a paid custom auth domain is used. Mention it as a known cosmetic limitation.

**Operational notes to include in the guide**
- Google blocks sign-in inside in-app browsers (Facebook, Messenger, Instagram and similar webviews with a `disallowed_useragent` error), and many Bangladeshi visitors will arrive from those. **Detect in-app browsers** (user-agent checks like FBAN/FBAV/Instagram/Line) and show a bilingual "Open in Chrome / your browser" screen with a copy-link button instead of a broken Google error.
- One Google account = one player. Multiple Gmail accounts can still be created by a determined cheater, so rely on the flagged-attempt review process and the contest rules (right to disqualify). Players without a Google account cannot play; this is accepted.
- Free-tier projects can pause after inactivity and have limited backups. Document it, check current plan limits before launch, and schedule weekly CSV exports.

## 6. Database design (migrations)

Run order: `001_schema.sql` → `002_security.sql` → `003_functions.sql` → `004_seed.sql`. Manual admin snippets in `supabase/admin_queries.sql`.

### 6.1 Schema

```sql
create extension if not exists pgcrypto;

create table public.contest_settings (
  id int primary key default 1 check (id = 1),
  is_open boolean not null default true,
  closes_at timestamptz,
  seconds_per_question int not null default 20,
  grace_ms int not null default 800,
  network_tolerance_ms int not null default 1500,
  min_human_ms int not null default 700
);
insert into public.contest_settings default values;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 2 and 24),
  language text not null default 'bn' check (language in ('bn','en')),
  consent_waitlist boolean not null default false,
  consent_research boolean not null default false,
  consent_at timestamptz,
  onboarded_at timestamptz,
  disqualified boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index profiles_display_name_key on public.profiles (lower(display_name));

create table public.blocked_words (word text primary key);   -- small profanity/impersonation list

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  text_en text not null,
  text_bn text not null,
  options jsonb not null,          -- [{"key":"a","en":"...","bn":"..."}, ... 4 items]
  correct_key text not null,
  explanation_en text,
  explanation_bn text,
  source_section text,             -- CLAUDE.md heading that proves the answer
  active boolean not null default true
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  play_date date not null,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  current_position int not null default 1,
  total_score int not null default 0,
  total_time_ms int,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  flagged boolean not null default false,
  unique (user_id, play_date)
);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  position int not null check (position between 1 and 5),
  question_id uuid not null references public.questions(id),
  served_at timestamptz,
  answered_at timestamptz,
  chosen_key text,
  is_correct boolean,
  elapsed_ms int,
  points int not null default 0,
  flagged boolean not null default false,
  unique (attempt_id, position)
);

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  text_en text not null,
  text_bn text not null,
  options jsonb not null,
  sort int not null default 0,
  active boolean not null default true
);

create table public.poll_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, poll_id)
);

create index on public.attempt_answers (attempt_id);
create index on public.attempts (user_id, status);

-- Empty profile row created on first Google sign-in.
-- The Google real name and avatar stay private in auth.users and are NEVER shown publicly.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.bd_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Dhaka')::date $$;
```

### 6.2 Security (RLS and privileges)

Principle: **clients touch almost nothing directly; everything goes through `security definer` functions.**

```sql
alter table public.contest_settings enable row level security;
alter table public.profiles         enable row level security;
alter table public.blocked_words    enable row level security;
alter table public.questions        enable row level security;
alter table public.attempts         enable row level security;
alter table public.attempt_answers  enable row level security;
alter table public.polls            enable row level security;
alter table public.poll_responses   enable row level security;

revoke all on all tables in schema public from anon, authenticated;

create policy "own profile read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select on public.profiles to authenticated;
grant update (language) on public.profiles to authenticated;  -- everything else via complete_profile()

create policy "active polls" on public.polls for select to authenticated using (active);
grant select on public.polls to authenticated;
-- all other tables: NO policies, NO grants.
```

Revoke `execute` on every function from `public`, `anon`, `authenticated`, then grant only the RPCs in 6.3. Create internal view `public.v_best_attempts` (best completed, unflagged attempt per **onboarded, non-disqualified** user) and revoke API access to it; only functions read it.

### 6.3 Functions (RPC): exact behavior

All are `security definer`, `set search_path = public`, require `auth.uid()` (except `get_leaderboard`), and raise clear error codes the frontend maps to friendly bilingual messages.

1. **`complete_profile(p_display_name text, p_language text, p_consent_waitlist boolean, p_consent_research boolean)`**: one-time onboarding after the first Google login. Errors: `already_onboarded`, `consent_required` (waitlist/contest consent must be true), `invalid_name` (2–24 chars; letters in Bangla/Latin, digits, space, `_`, `.`; reject URLs, `@`, `.com`), `name_not_allowed` (matches `blocked_words`), `name_taken` (case-insensitive unique; catch unique violation). Sets `consent_at` and `onboarded_at`. The display name cannot be changed afterwards.
2. **`start_attempt() returns uuid`**: errors `not_authenticated`, `profile_incomplete`, `contest_closed` (switch off or past `closes_at`), `disqualified`, `not_enough_questions`. If an attempt exists for `(uid, bd_today())`, return its id. Otherwise insert the attempt and 5 `attempt_answers` rows: 2 easy + 2 medium + 1 hard from active questions, ranked by `(times seen by this user asc, random())` per difficulty, positions in random order. Handle the unique-violation race by returning the existing row.
3. **`get_current_question(p_attempt uuid) returns jsonb`**: verify ownership. If completed return `{status:'completed', total_score, total_time_ms}`. Loop: take the row at `current_position`; set `served_at = now()` **once** if null (refresh never resets the timer); if `now()` is past `served_at + limit + grace + tolerance`, **expire it** (0 points), advance, finalize if last, and loop. Return `{status:'in_progress', position, total:5, question:{id,text_en,text_bn,options}, remaining_ms, seconds_limit}`. **Never** include `correct_key` or the explanation.
4. **`submit_answer(p_attempt uuid, p_position int, p_key text) returns jsonb`**: lock attempt and row (`for update`). Errors `not_found`, `already_completed`, `wrong_position`, `invalid_state`, `invalid_option`. Compute `elapsed` server-side, apply section 4 rules, save, advance. After position 5 set `status='completed'`, `total_score=sum(points)`, `total_time_ms=sum(elapsed)`, `completed_at=now()`, `flagged=bool_or(flagged)`. Return `{is_correct, correct_key, points, elapsed_ms, explanation_en, explanation_bn, finished, total_score}`.
5. **`get_my_status() returns jsonb`**: `{onboarded, display_name, played_today, attempt_id, attempt_status, best_score, my_rank, next_reset_at}`; `next_reset_at` is the next 00:00 Asia/Dhaka.
6. **`get_leaderboard(p_limit int default 50)`** returns `rank, display_name, best_score, completed_at`, ordered by `best_score desc, completed_at asc`, max 100 rows. **Granted to `anon` and `authenticated`** so the public site can show it. Display names only, never emails or Google names.
7. **`get_polls() returns jsonb`** (active, not yet answered) and **`submit_poll(p_poll uuid, p_key text)`** (validates option, one response per poll).

Grants: `complete_profile`, `start_attempt`, `get_current_question`, `submit_answer`, `get_my_status`, `get_polls`, `submit_poll` → `authenticated`. `get_leaderboard` → `anon, authenticated`.

### 6.4 Seed content (from the app's CLAUDE.md only)

- **13 bilingual questions** (5 easy, 5 medium, 3 hard), 4 options each, one unambiguous correct answer, short explanation, `source_section` filled. They must be answerable by someone who read the landing page, which is built from the same CLAUDE.md content, plus a few basic healthcare common-sense ones. No contestable or outdated facts.
- **6 feedback polls** (e.g. preferred notification style, which home-screen button they would tap first, most wanted feature), drawn from real current app UI/features. Unscored, optional.
- Bangla must read naturally, not like literal translation. Mark every Bangla string `-- REVIEW` for my native-speaker review before launch.
- The client shuffles option order for display; keys stay stable.

### 6.5 Admin queries (`supabase/admin_queries.sql`, manual)

Commented, ready-to-run snippets: close the contest (`update contest_settings set is_open=false`); **top 3 winners** with Google email (join `auth.users`) using the leaderboard ordering; list flagged attempts with answers; clear a flag; disqualify a user; count waitlist/consents; CSV exports of all tables; poll results by option.

## 7. Frontend behavior

### 7.1 Public landing (`/[lang]`)

Sections: **Hero** (value proposition, primary CTA "Join the waitlist & play", language toggle) → **What is Medi-Bela** → **Features** (from CLAUDE.md, current only) → **How it works** (3 steps) → **App screenshots** (placeholder slots) → **Play & Win** (prize, rule summary, public live top-5 leaderboard) → **FAQ** → **Contact** → **Footer** (rules, privacy, terms, socials).

- No login prompt anywhere except after pressing a play/waitlist CTA, which goes to `/[lang]/play`.
- `NEXT_PUBLIC_LAUNCHED=false` shows the waitlist/play CTA; `true` swaps it for store download badges.

### 7.2 Contact form (Web3Forms)

Name, email, message; hidden access key, hidden honeypot (`botcheck`), client validation, loading/success/error states in both languages, and Web3Forms' own captcha option if enabled. **Never collect symptoms or sensitive medical data on the site.**

### 7.3 Game flow (`/[lang]/play`)

1. **Gate:** not signed in → "Continue with Google" button (the only login option). If an in-app browser is detected, show the "open in your browser" helper instead. Callback at `/[lang]/auth/callback` completes the session and returns to `/[lang]/play`.
2. **Onboarding (first login only):** choose a **public nickname** (explain it appears on the leaderboard; discourage real names), language, tick the required consent (contest + waitlist), optional research-feedback consent, then call `complete_profile`. Block everything else until done.
3. **Lobby:** `get_my_status()`. Already played today → score, rank, countdown to `next_reset_at`, leaderboard. Otherwise show 3-line rules and **Start**.
4. **Question screen:** one question at a time from `get_current_question`. Large tap targets, animated countdown ring, decaying points indicator. The **client timer is cosmetic**; server `remaining_ms` is truth. Lock options on first tap, call `submit_answer`, reveal right/wrong with explanation and points count-up, then Next.
5. **Resume:** refreshing mid-attempt re-calls `get_current_question`; the timer continues from the server value and overdue questions auto-expire.
6. **Result:** total points (count-up), rank, total time, top-10 leaderboard with the player highlighted, optional skippable polls, then "Come back tomorrow" with the reset countdown.
7. Handle every error code with a clear bilingual message saying what to do next (contest closed, already played, offline, expired session, profile incomplete, name taken).
8. The client-side route guard is only UX. Real protection is the RPCs.

### 7.4 i18n

Toggle persists in `localStorage`, defaults from `navigator.language`. Use a proper Bangla font (Hind Siliguri or Noto Sans/Serif Bengali), line-height about 1.7, subsetted, `font-display: swap`, and verify there are no fallback glyphs. Use Latin digits for scores and timers.

## 8. Design direction

Premium, classic, visually strong. Calm and trustworthy, never clinical or stocky.

- **Tokens first:** `src/styles/tokens.css` for colors, type scale, spacing, radii. Until I supply brand colors use a deliberate placeholder palette (deep ink-navy, warm white, one confident accent) clearly flagged as temporary.
- **Typography carries the personality:** a refined display face for English headlines paired with a Bangla face of matching weight and contrast. Avoid generic defaults and avoid highlighting one word in every headline.
- **One signature moment:** a hero **ECG/heartbeat line** that draws across the screen on load and settles into the headline. Everything else quiet and disciplined.
- **Classic motion, sparingly:** one orchestrated hero sequence, tasteful scroll reveals on features, smooth page transitions, polished button/card interactions, meaningful game animations (timer ring, answer reveal, score count-up).
- **Layout:** generous spacing, strong grid, large screenshot slots, consistent radii, no stack of identical cards.
- **Quality floor:** responsive from 320px, visible keyboard focus, AA contrast, reduced-motion respected, small JS bundles, explicit image dimensions, Lighthouse mobile performance 90+.
- Per-language `<title>`, meta description, Open Graph/Twitter cards, favicon, `404` page, sitemap and robots.

## 9. Legal and trust pages

Bilingual drafts of `rules`, `privacy`, `terms`. Rules: prize, eligibility, dates, scoring, tie-break, one attempt per day, right to disqualify cheating or duplicate accounts, how winners are contacted (via their Google email), contest closing at app launch. Privacy: what is collected (Google email and account id, nickname, answers, consents), why, retention, deletion requests, contact. Mark all legal text **"DRAFT: needs legal review for Bangladesh"** in a comment.

## 10. Build phases (stop and show me after each)

1. **Plan:** restate this spec, list assumptions and questions, read the app's CLAUDE.md, write `CONTENT_NOTES.md`, propose the file tree. Wait for my OK.
2. **Landing page:** full design, bilingual, animated, public, placeholders for assets, working contact form.
3. **Supabase + Google auth:** migrations 001–004 and `SUPABASE_SETUP.md` (section 5, click by click), plus the SQL test script.
4. **Game + leaderboard:** auth gate, in-app-browser handling, onboarding, all RPCs, every error state.
5. **Content:** seed 13 questions and 6 polls from CLAUDE.md, bilingual, with `-- REVIEW` markers.
6. **Hardening and handoff:** tests, security review, content re-sync check against CLAUDE.md, `DEPLOY.md`, and `LAUNCH_RUNBOOK.md` (close contest, pick winners, review flags, announce, set `NEXT_PUBLIC_LAUNCHED=true`).

## 11. Acceptance criteria

**Scoring and fairness**
- Max per question 975 and per attempt 4875; no path reaches 5000.
- A correct answer at the 1 s floor gives 975; at the full limit 500; wrong or late 0.
- Refreshing mid-question never resets or extends the timer.
- A second attempt on the same Bangladesh day is impossible, even via direct RPC calls or two devices.
- An abandoned attempt still consumes the day's attempt and expires unanswered questions to 0.
- Every attempt is exactly 2 easy + 2 medium + 1 hard.
- Answers under 700 ms are flagged and excluded from the leaderboard until reviewed.

**Security**
- With the anon key and a logged-in session, direct reads of `questions`, `attempts`, `attempt_answers`, `poll_responses`, `contest_settings`, `blocked_words` return nothing or are denied.
- The correct answer never appears in any response before `submit_answer`.
- A user cannot change `disqualified`, `onboarded_at`, consent flags after onboarding, scores, or another user's data.
- No email or Google name appears in `get_leaderboard`.
- `service_role` appears nowhere in the repo or build output.

**Product**
- The whole site except `/play` is usable with no login.
- Google login works end to end in production, with the consent screen published, and shows the in-app-browser helper inside Facebook/Messenger webviews.
- A player cannot start an attempt before completing onboarding with the consent box ticked.
- No code path sends an email to a user.
- Full flow works in Bangla and English on a 360px phone and on desktop.
- Contact form reaches my inbox and the honeypot blocks bots.
- Setting `is_open=false` makes `start_attempt` fail with a friendly message while the leaderboard stays visible.

**Tests:** SQL script (simulating users via `request.jwt.claims`) covering scoring math, daily limit, timeout expiry, difficulty mix, RLS denial, onboarding rules and tie-break ordering; Playwright for the public pages, language toggle, and the game UI with auth stubbed; plus a manual QA checklist.

## 12. Working agreements

- Plain, readable, well-named code; comment anything non-obvious, especially the SQL.
- No secrets in git; use `.env.example`.
- If a requirement here is technically unsafe or impossible, stop and tell me instead of silently changing it.
- When a **[TBD]** blocks you, ask; otherwise choose a sensible default, state it, and keep moving.