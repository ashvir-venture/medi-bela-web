-- Medi-Bela admin snippets. MANUAL ONLY: run one block at a time in Supabase → SQL Editor
-- (or: bash scripts/db.sh psql). These run as the database owner and bypass RLS.
-- Phone numbers and real names are personal data: never paste results into public places.

-- ============================================================
-- 1. Open / close the contest
-- ============================================================
-- Close now (start_attempt fails with contest_closed; the leaderboard stays visible):
update public.contest_settings set is_open = false;

-- Or close automatically at a time (Bangladesh time):
-- update public.contest_settings set closes_at = '2026-12-31 23:59:59+06';

-- Re-open:
-- update public.contest_settings set is_open = true, closes_at = null;

-- Current settings:
select * from public.contest_settings;

-- ============================================================
-- 2. Before picking winners: finish attempts that were abandoned
--    (unanswered questions = 0; same rule as get_my_status)
-- ============================================================
update public.attempt_answers aa
   set answered_at = now(), chosen_key = null, is_correct = false, points = 0,
       elapsed_ms = (select seconds_per_question * 1000 from public.contest_settings where id = 1)
  from public.attempts a
 where a.id = aa.attempt_id and a.status = 'in_progress' and aa.answered_at is null
   and a.play_date < public.bd_today();
select private.finalize_attempt(id)
  from public.attempts where status = 'in_progress' and play_date < public.bd_today();

-- ============================================================
-- 3. TOP 3 WINNERS with contact details (leaderboard ordering)
-- ============================================================
select row_number() over (order by b.best_score desc, b.completed_at asc) as rank,
       b.display_name, b.best_score, b.completed_at,
       p.full_name, '+' || u.phone as phone, b.attempt_id
  from public.v_best_attempts b
  join public.profiles p on p.id = b.user_id
  join auth.users u on u.id = b.user_id
 order by b.best_score desc, b.completed_at asc
 limit 3;

-- Top 20 (to have runners-up ready):
select row_number() over (order by best_score desc, completed_at asc) as rank, display_name, best_score, completed_at
  from public.v_best_attempts order by best_score desc, completed_at asc limit 20;

-- ============================================================
-- 4. Flagged attempts (an answer under min_human_ms) with their answers
-- ============================================================
select a.id as attempt_id, p.display_name, p.full_name, '+' || p.phone as phone,
       a.play_date, a.total_score, a.completed_at,
       aa.position, q.difficulty, aa.chosen_key, aa.is_correct, aa.elapsed_ms, aa.points, aa.flagged
  from public.attempts a
  join public.profiles p on p.id = a.user_id
  join public.attempt_answers aa on aa.attempt_id = a.id
  join public.questions q on q.id = aa.question_id
 where a.flagged
 order by a.completed_at desc, aa.position;

-- Clear a flag after review (the attempt then counts; its fast answers stay at 0 points):
-- update public.attempts set flagged = false where id = '<attempt id>';

-- Same phone pattern / many accounts check: accounts created per hour (spikes = possible abuse)
select date_trunc('hour', created_at) as hour, count(*) from public.profiles group by 1 order by 1 desc limit 48;

-- ============================================================
-- 5. Disqualify / reinstate a player (hidden from the leaderboard, cannot start attempts)
-- ============================================================
-- update public.profiles set disqualified = true  where display_name = '<nickname>';
-- update public.profiles set disqualified = false where display_name = '<nickname>';

-- ============================================================
-- 6. Waitlist and consents
-- ============================================================
select count(*) filter (where consent_waitlist)  as waitlist,
       count(*) filter (where onboarded_at is not null) as players,
       count(*) filter (where consent_research) as research_ok,
       count(*) as accounts
  from public.profiles;

-- Waitlist export (for the launch SMS):
select full_name, '+' || phone as phone, language, consent_research, consent_at
  from public.profiles where consent_waitlist order by consent_at;

-- ============================================================
-- 7. Poll results by option
-- ============================================================
select p.sort, p.text_en, o->>'key' as option_key, o->>'en' as option_en,
       count(r.id) as answers
  from public.polls p
  cross join lateral jsonb_array_elements(p.options) o
  left join public.poll_responses r on r.poll_id = p.id and r.option_key = o->>'key'
 group by p.sort, p.id, p.text_en, o
 order by p.sort, option_key;

-- ============================================================
-- 8. Questions: add more / switch off
-- ============================================================
-- insert into public.questions (difficulty, text_en, text_bn, options, correct_key, explanation_en, explanation_bn, source_section)
-- values ('easy', '...', '...', '[{"key":"a","en":"...","bn":"..."},{"key":"b",...},{"key":"c",...},{"key":"d",...}]', 'a', '...', '...', '<app CLAUDE.md heading>');
-- update public.questions set active = false where id = '<question id>';
select difficulty, count(*) filter (where active) as active, count(*) as total from public.questions group by 1;

-- How often each question was answered correctly (spot ambiguous ones):
select q.difficulty, left(q.text_en, 60) as question, count(aa.id) as served,
       round(100.0 * avg(case when aa.is_correct then 1 else 0 end), 1) as pct_correct
  from public.questions q left join public.attempt_answers aa on aa.question_id = q.id and aa.answered_at is not null
 group by q.id order by q.difficulty, pct_correct;

-- ============================================================
-- 9. CSV exports (run in psql; writes files on YOUR computer). Weekly backup.
-- ============================================================
-- \copy (select * from public.profiles)         to 'profiles.csv'        csv header
-- \copy (select * from public.attempts)         to 'attempts.csv'        csv header
-- \copy (select * from public.attempt_answers)  to 'attempt_answers.csv' csv header
-- \copy (select * from public.poll_responses)   to 'poll_responses.csv'  csv header
-- \copy (select * from public.questions)        to 'questions.csv'       csv header
-- \copy (select * from public.polls)            to 'polls.csv'           csv header
-- \copy (select * from public.contest_settings) to 'contest_settings.csv' csv header

-- ============================================================
-- 10. Delete a person's data on request (removes them everywhere: cascades from auth.users)
-- ============================================================
-- delete from auth.users where phone = '8801XXXXXXXXX';
