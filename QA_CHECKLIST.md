# Manual QA checklist

Test on a real Android phone (360px wide, Chrome, slow 3G in DevTools once) and on desktop.
Do every item in **Bangla and English**.

## Public site (no login anywhere)
- [ ] `/` goes to `/bn/` (or `/en/` if the browser is English / last choice was English).
- [ ] Language toggle keeps the same page and is remembered after closing the tab.
- [ ] Hero ECG line draws, the blip runs along it; headline and buttons rise in.
- [ ] With "Reduce motion" on (Android: Remove animations), everything is static and readable.
- [ ] All 5 app screenshots show; nothing scrolls sideways at 320px.
- [ ] About us shows mission, vision, goals, team photos, Call / WhatsApp numbers work.
- [ ] Rules / Privacy / Terms open; Privacy and Terms start with the app's own text.
- [ ] Unknown URL shows the bilingual 404.
- [ ] Keyboard only: Tab shows a visible focus ring everywhere; FAQ opens with Enter.
- [ ] Contact form: empty → errors; valid → success message; email arrives in your inbox.

## Account and game
- [ ] Play: wrong phone format shows an error; `01712-345678`, `+880 1712 345678` and Bangla digits work.
- [ ] Create account → nickname screen; real name never appears on the leaderboard.
- [ ] Same number again → "already has an account, sign in"; wrong password → clear error.
- [ ] Nickname: taken / `admin` / URL / 1 letter are rejected with the right message.
- [ ] Start → 5 questions; timer ring and points count down; refresh mid-question keeps the timer.
- [ ] Wait past 20 s → "Time's up", correct answer shown, 0 points.
- [ ] Result: points (never a %), rank, top 10 with you highlighted, polls skippable, countdown to midnight BDT.
- [ ] Second try the same day → "You've played today"; on another phone too.
- [ ] Close the contest (admin SQL) → friendly "contest closed", leaderboard still visible.
- [ ] Waitlist page: sign up, tick consent → "You're on the list" with your number.
- [ ] Facebook/Messenger in-app browser: sign-up and play work (no Google redirect any more).

## Before launch
- [ ] Native-speaker review of every Bangla string (`-- REVIEW` in `004_seed.sql`, `src/i18n/bn.json`, legal pages).
- [ ] Legal review of rules, privacy and terms for Bangladesh.
- [ ] Supabase settings match SUPABASE_SETUP.md; `bash scripts/db.sh test` passes.
- [ ] Lighthouse mobile on `/bn/`: Performance 90+, Accessibility 95+.
