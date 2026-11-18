# Launch runbook (end of the contest)

Run these in order on launch day. SQL is in `supabase/admin_queries.sql` (Supabase → SQL Editor).

1. **Announce** the closing time on the site/socials a few days before.
2. **Close the contest** (§1): `update public.contest_settings set is_open = false;`
   New tries now fail with "The contest is closed"; the leaderboard stays visible.
3. **Finish abandoned attempts** (§2) so every try that was started counts its answered points.
4. **Review flagged attempts** (§4). Clear a flag only if the fast answers look human (e.g. one
   lucky tap); the fast answers still score 0. Check the "accounts per hour" query for bursts of
   sign-ups and disqualify obvious duplicate accounts (§5).
5. **Pick the top 3** (§3: rank, nickname, score, real name, phone). Save the result privately.
6. **Verify each winner by phone call** to the registered number: confirm the name and that the
   number is theirs. No answer within 14 days → next player in the Top 20 list (rules §8).
7. **Announce winners** by nickname only (never real names or numbers without their OK).
8. **Export everything** (§9 `\copy` lines) and keep the CSVs private.
9. **Switch the site to "launched"**:
   - `src/config/site.ts` → `playStoreUrl` = the real Play Store link.
   - Host env var `NEXT_PUBLIC_LAUNCHED=true` → redeploy. Play/waitlist buttons become the Google
     Play badge and the Play & Win section says the quiz has ended.
10. **Tell the waitlist** (§6 export) by SMS or phone, using only people with `consent_waitlist`.
11. **Data retention**: 6 months after launch, delete or anonymise contest data
    (privacy policy). Example: `delete from auth.users;` removes every account and cascades.
