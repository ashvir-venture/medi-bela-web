# Content notes

Where the website's words and quiz content come from, what was left out, and what still needs a decision.

- **Source:** the app's `Claude.md` (`../Medi-Bela/Claude.md`), app commit `32cd472`, 2026-11-18. A snapshot is in [docs/app-CLAUDE.md](docs/app-CLAUDE.md). Re-copy it before Phase 5 (content) and Phase 6 (re-sync check).
- **Headings:** the app file has only coarse headings (`1. Project overview`, `5. Architecture to preserve`, ...). Most features live in bullet lines under `1. Project overview`. So `source_section` will name the heading plus the bullet's label, for example `1. Project overview › Alarm-style medicine reminders`.
- **Code cross-check:** the app code is next door. In Phase 5 I will check screen labels (Home buttons, Settings names) against `mobile/lib` before using them in polls.
- **Status rule used:** a feature is **usable** if it is described as current 0.1.0 behaviour or "code done" in Rounds 1–17, and nothing newer contradicts it. Round 18 and the "Owner's second list" are marked "Not yet on a phone" and have an open client approval, so they are **held** until you decide (Q3 below).

## Used (landing copy, FAQ, quiz)

| Topic | App section | Use |
|---|---|---|
| What Medi-Bela is: medicine-adherence and family-care app for Bangladesh, for patients, families and pharmacists | 1. Project overview (intro) | Hero, "What is Medi-Bela" |
| Upload a prescription photo → a pharmacist checks and prepares it (or sends it back with a note) → you confirm → daily reminders are made | 1 › 0.1.0 does (first bullet), Re-upload | How it works, feature, quiz |
| Add your own medicines; change times and meal timing | 1 › My medicines | Feature |
| Alarm-style reminders that ring like an alarm, work with the app closed, Taken / Later buttons, neutral lock-screen text (no medicine names) | 1 › Alarm-style medicine reminders, Round 13 full-screen reminders, 6 › Medical privacy | Feature, quiz |
| Family care: a family caregiver, shared medicine status, family alerted when a dose is missed, "Hide from family" | 1 › Family care, Caregiver, 5 › Privacy flag | Feature, quiz |
| Medicine box: count of medicines left, notice when running low | 1 › Round 13 (medicine box) | Feature, quiz |
| Health readings and records: sugar, blood pressure, weight, and more; doctor visits and test reminders | 1 › Health records, Rounds 15–16, Round 12 test reminders | Feature |
| Doctor's PDF (30 days of doses and readings; English only) | 1 › Rounds 15–16 | Feature (minor) |
| AI assistant: general health information only; never diagnoses, never names a medicine for your problem, never gives a dose | 1 › AI assistant, 5 › AI is advisory only | Feature, FAQ, quiz |
| Pharmacist-reviewed AI health suggestions (never automatic) | 1 › AI health suggestions | Trust line, quiz |
| Health notices: written by pharmacists, approved by an admin, can be limited to your division | 1 › Notices | Feature (minor) |
| Bangla and English; new installs open in Bangla | 1 › Bilingual, Round 14 (Bangla first) | Feature, quiz |
| Easy mode (big text, one big Taken, call the caregiver, 999); text size Normal / Large / Larger; dark mode | 1 › Round 14, Dark mode | Accessibility feature, quiz |
| Works offline, syncs when back online | 5 › Offline-first mobile | Feature, FAQ |
| App sign-in is by phone number (the website uses Google only for the game) | 1 › Account tools | FAQ (to avoid confusion) |
| Delete account (personal data erased) | 1 › Account tools | FAQ / privacy line |

## Skipped and why

| Item | App section | Why |
|---|---|---|
| Exact reminder timings (4 rings, 15 min apart, backstop push, family alert minute) | 1 › Alarm-style reminders, 5 › Backstop push, 7 | Contradictory (backstop +15 vs +30; family alert +50 vs `DOSE_MISSED_GRACE_MINUTES` default 62) and user-adjustable since Round 14. Copy will say "rings again, then tells your family" without numbers. |
| Crisis levels (BP 180/120, sugar below 3.0) and emergency sheets | 1 › Rounds 15–16 | Medical thresholds: not for marketing or a quiz. |
| Condition-specific care texts (cancer, low sugar) | 1 › Rounds 15–16 | Marked as Claude's drafts, not approved. |
| Management web panel, admin analytics, audit log, rate limits, tech stack, jobs | 1, 2, 5 | Staff/internal, not user-facing. |
| Sponsored ad banner | 9 | Out of scope per owner. |
| Round 18 (one font, fingerprint lock, Add medicine 2.0, "only when needed" medicines, in-app prescription camera, max 2 photos, caregiver View/Manage permissions, anonymous-data consent) | 1 › Round 18, 10 | "Not yet on a phone"; new privacy line awaits client approval. **Held, see Q3.** |
| Owner's second list (notification colours, strip colour, condition colours, family relationship) | 10 | "Not yet on a phone"; visual details. **Held.** |
| Voice questions, share a notice, change history, first-use tips | 1 › Round 17 | Code done but very new; minor. Could be used if you say yes in Q3. |
| Store availability / release date | 9 (release signed with debug key) | App not on Play Store yet. Store badges stay placeholders. |
| Anything about iOS | 2 (Flutter, only Android notes) | Only Android is described (reminder setup, release notes). Copy will not promise iPhone. **See Q4.** |

## Decisions (owner, 2026-11-18)

- Phase 1 defaults approved: Google-only waitlist, Round 17/18 features held, Android only, new separate Supabase project in Singapore, placeholders for domain/socials/contact email, no age limit (flagged for legal review), contest ends at app launch.
- **Separate "Join the waitlist" button** next to "Play & win". It goes to `/[lang]/waitlist`: Google sign-in → consent box → saved, with no game needed. It stores the person's **Google name and email** in our database, the same as for players (private: never on the leaderboard, admin queries only). Phase 3 adds `full_name` and `email` to `profiles` (filled by the sign-up trigger from `auth.users`) and a `join_waitlist()` RPC. This changes spec §1 "no separate signup" and §6.1 "Google name stays in auth.users" only in that the name is now copied into a private column; it is still never shown publicly.
- All Bangla strings in `src/i18n/bn.json` and the legal pages need native-speaker review (`-- REVIEW`).

## Decisions (owner, 2026-11-19)

- **Sign-in is mobile number + password** (Supabase Auth phone provider), replacing Google
  everywhere: play, waitlist, winner contact (phone call/SMS instead of Google email). SMS
  verification and reset come later with the app's SMS gateway (SUPABASE_SETUP.md §6).
  The in-app-browser helper and the OAuth callback page were removed (not needed without Google).
  Profiles store the typed name (`full_name`) and `phone`, privately.
- Database: the owner's Supabase project `qfybqbpwawhesrravxfj` (Tokyo). Migrations 001–005 applied
  2026-11-19; `supabase/tests/game_test.sql` passes (69 checks).
- **Screenshots** captured from the pinned demo artifacts "Rafi's Medi-Bela" (caregiver: Home,
  Family, Health) and "Abba's Medi-Bela" (patient: Today's medicine, Reminder) via
  `scripts/capture-screens.mjs`. Note: the demo's reminder shows "10 minutes later" for Later,
  while the app notes say the Later delay is user-set (default 15). The image is the owner's
  design, so it is used as is; the site's own text gives no number.
- **About us, Privacy & terms and contact numbers** come word for word from the app's
  `docs/content/public-pages.json` (generated into `src/content/app-public.ts` by
  `scripts/sync-app-content.py`). Privacy/terms pages show the app's text first, then the website's
  own contest/waitlist draft. Logo, favicon and team photos are the app's files.
- **Not used from public-pages.json:** the Support "how to" and FAQ. They say Later = 30 min,
  "twice at most", Done, and SMS password reset, which contradict the app's CLAUDE.md
  (15-minute rings, Taken / Later). Ask: should the app's Support text be updated?
- **Look:** the site now uses the app's dark palette (navy + teal), darker and more animated
  (aurora light, ECG monitor blip, floating phones, shimmer CTA, hover glows, scroll progress),
  all off under reduced motion.

## Phase 6 re-sync check (2026-11-19)

The app's `Claude.md` is unchanged since the snapshot (commit `32cd472`), so all 13 questions and
6 polls stay valid. Re-run before launch: compare `docs/app-CLAUDE.md` with `../Medi-Bela/Claude.md`,
re-check every `source_section` in `supabase/migrations/004_seed.sql`, and re-run
`python scripts/sync-app-content.py`.

## Open questions (current)

1. Prize details and contest start date (rules say "attractive prize", ends at app launch).
2. Done 2026-11-21: domain medi-bela-web.vercel.app, no public email (contact form only), Facebook link set.
3. Region: keep Tokyo or move to Singapore before launch (cheap now; see SUPABASE_SETUP.md).
4. Should the app's Support text (Later 30 min) be corrected? (see above)
5. Native-speaker review of all Bangla, legal review of rules/privacy/terms.

## Earlier open questions (answered with defaults, kept for the record)

1. **Copy of app notes:** I copied the app's `Claude.md` into `docs/app-CLAUDE.md` (dated snapshot). OK to keep it that way and re-copy at Phase 5 and 6?
2. **Waitlist [TBD]:** Google sign-in + consent box = on the waitlist, no email-only form. I recommend keeping it that way.
3. **Round 18 / Round 17 features:** may the landing page mention fingerprint lock, the in-app prescription camera, "only when needed" medicines and voice questions, or wait until they are tested on a phone?
4. **Platforms:** Android only at launch? Copy will say "Android app" unless you say iPhone too.
5. **Supabase project:** use a **new, separate** Supabase project for the website (recommended; the app's database is Prisma-managed and holds patient data), region Singapore (same as the app).
6. **Domain, hosting, socials, support email:** production domain? Cloudflare Pages OK? Social links for the footer? Contact email shown on privacy/rules pages?
7. **Prize text:** "an attractive prize" for each of the top 3, no eligibility limits (per spec). Minimum age? Contests and data consent usually need 18+ (or a guardian's consent). Default: say nothing extra, and flag it in the legal-review note.
8. **Contest dates:** start date, and is the end "the day the app launches on the Play Store" with no fixed date?
9. **Healthcare common-sense questions:** I'll keep them non-clinical (e.g. "Who should you ask before changing a dose?") and avoid numbers or treatment advice.
