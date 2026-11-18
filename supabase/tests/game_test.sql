-- Database tests for the Medi-Bela game. Runs inside ONE transaction and ROLLS BACK,
-- so it leaves no data behind (safe on a dev project; prefer a disposable one).
--
--   bash scripts/db.sh test        (or: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/game_test.sql)
--
-- Users are simulated with request.jwt.claims (what auth.uid() reads), and RLS with
-- "set local role authenticated / anon". now() is fixed inside a transaction, so answer
-- times are simulated by moving served_at into the past.
-- Any failed check raises an exception (the run stops with a non-zero exit).

\set ON_ERROR_STOP on
begin;

-- ---------- helpers ----------
create function pg_temp.as_user(p uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true)
$$;

create function pg_temp.check(p_ok boolean, p_name text) returns void language plpgsql as $$
begin
  if p_ok is not true then raise exception 'FAIL: %', p_name; end if;
  raise notice 'ok   %', p_name;
end $$;

-- Runs SQL that must fail with an error whose message contains p_expect.
create function pg_temp.expect_error(p_sql text, p_expect text, p_name text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(p_expect in sqlerrm) > 0 then
      raise notice 'ok   % (%)', p_name, sqlerrm;
      return;
    end if;
    raise exception 'FAIL: % expected "%" got "%"', p_name, p_expect, sqlerrm;
  end;
  raise exception 'FAIL: % expected error "%" but it succeeded', p_name, p_expect;
end $$;

-- Correct key of the question at a position.
create function pg_temp.key_at(p_attempt uuid, p_pos int, p_correct boolean) returns text language sql as $$
  select case when p_correct then q.correct_key
              else (select o->>'key' from jsonb_array_elements(q.options) o where o->>'key' <> q.correct_key limit 1) end
  from public.attempt_answers aa join public.questions q on q.id = aa.question_id
  where aa.attempt_id = p_attempt and aa.position = p_pos
$$;

-- Serve the current question, pretend it was served p_ms ago, answer it.
create function pg_temp.answer(p_attempt uuid, p_ms int, p_correct boolean) returns jsonb language plpgsql as $$
declare v_pos int; v_q jsonb;
begin
  v_q := public.get_current_question(p_attempt);
  v_pos := (v_q->>'position')::int;
  update public.attempt_answers set served_at = now() - make_interval(secs => p_ms / 1000.0)
   where attempt_id = p_attempt and position = v_pos;
  return public.submit_answer(p_attempt, v_pos, pg_temp.key_at(p_attempt, v_pos, p_correct));
end $$;

-- ---------- users (phone sign-up creates profiles via trigger) ----------
insert into auth.users (id, aud, role, phone, raw_user_meta_data, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', '8801711111111', '{"full_name":"Test One"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', '8801722222222', '{"full_name":"Test Two"}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', '8801733333333', '{"full_name":"Test Three"}', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', '8801744444444', '{"full_name":"Test Four"}', now(), now());

select pg_temp.check(
  (select full_name = 'Test One' and phone = '8801711111111' from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'sign-up trigger copies name and phone into profiles');

-- ---------- onboarding rules ----------
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select pg_temp.expect_error('select public.start_attempt()', 'profile_incomplete', 'cannot start before onboarding');
select pg_temp.expect_error($$select public.complete_profile('a', 'en', true, false)$$, 'invalid_name', 'name too short');
select pg_temp.expect_error($$select public.complete_profile('www.win.com', 'en', true, false)$$, 'invalid_name', 'URL rejected');
select pg_temp.expect_error($$select public.complete_profile('me@x', 'en', true, false)$$, 'invalid_name', '@ rejected');
select pg_temp.expect_error($$select public.complete_profile('Medi Bela Team', 'en', true, false)$$, 'name_not_allowed', 'impersonation blocked');
select pg_temp.expect_error($$select public.complete_profile('Rahim', 'en', false, false)$$, 'consent_required', 'consent required');
select public.complete_profile('রহিম_01', 'bn', true, true);
select pg_temp.check((select onboarded_at is not null and consent_waitlist and consent_research and display_name = 'রহিম_01'
                      from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'Bangla nickname accepted, consents saved');
select pg_temp.expect_error($$select public.complete_profile('Another', 'en', true, false)$$, 'already_onboarded', 'nickname cannot change');

select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select pg_temp.expect_error($$select public.complete_profile('রহিম_01', 'en', true, false)$$, 'name_taken', 'nickname unique');
select public.complete_profile('Karim', 'en', true, false);
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select pg_temp.expect_error($$select public.complete_profile('KARIM', 'en', true, false)$$, 'name_taken', 'nickname unique ignoring case');
select public.complete_profile('Sumi', 'bn', true, false);

-- waitlist without playing
select pg_temp.as_user('44444444-4444-4444-4444-444444444444');
select pg_temp.check((public.join_waitlist('bn', false)->>'already')::boolean = false, 'join_waitlist joins');
select pg_temp.check((public.join_waitlist('bn', false)->>'already')::boolean = true, 'join_waitlist is idempotent');
select pg_temp.check((select consent_waitlist and onboarded_at is null from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
                     'waitlist does not onboard for the game');

-- ---------- attempt, difficulty mix, no answer leak, timer ----------
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
create temp table t_a as select public.start_attempt() as id;

select pg_temp.check((select count(*) = 5 from public.attempt_answers where attempt_id = (select id from t_a)), '5 questions per attempt');
select pg_temp.check((
  select count(*) filter (where q.difficulty = 'easy') = 2
     and count(*) filter (where q.difficulty = 'medium') = 2
     and count(*) filter (where q.difficulty = 'hard') = 1
  from public.attempt_answers aa join public.questions q on q.id = aa.question_id
  where aa.attempt_id = (select id from t_a)), 'mix is 2 easy + 2 medium + 1 hard');
select pg_temp.check(public.start_attempt() = (select id from t_a), 'second start_attempt same day returns the same attempt');

select pg_temp.check((select public.get_current_question(id)::text not like '%correct_key%'
                         and public.get_current_question(id)::text not like '%explanation%' from t_a),
                     'get_current_question never includes correct_key or explanation');

-- Refresh never resets the timer: served 5 s ago, a refresh still says 15 s left.
update public.attempt_answers set served_at = now() - interval '5 seconds'
 where attempt_id = (select id from t_a) and position = 1;
select pg_temp.check((select (public.get_current_question(id)->>'remaining_ms')::int = 15000 from t_a), 'refresh keeps the timer (15000 ms left)');
select pg_temp.check((select served_at = now() - interval '5 seconds' from public.attempt_answers
                      where attempt_id = (select id from t_a) and position = 1), 'served_at unchanged by refresh');

-- ---------- scoring ----------
-- Q1: correct at 1.8 s -> eff = max(1800-800,1000) = 1000 -> 975 (the maximum).
select pg_temp.check((select (pg_temp.answer(id, 1800, true)->>'points')::int = 975 from t_a), 'correct at 1 s floor = 975');
-- Q2: correct at 20.8 s -> eff = 20000 -> 500.
select pg_temp.check((select (pg_temp.answer(id, 20800, true)->>'points')::int = 500 from t_a), 'correct at the full limit = 500');
-- Q3: wrong -> 0
select pg_temp.check((select (pg_temp.answer(id, 3000, false)->>'points')::int = 0 from t_a), 'wrong answer = 0');
-- Q4: correct but 300 ms -> flagged, 0
select pg_temp.check((select (r->>'points')::int = 0 and (r->>'too_fast')::boolean from (select pg_temp.answer(id, 300, true) r from t_a) x),
                     'under 700 ms = flagged, 0 points');
-- Q5: correct but 25 s (> 20 + 0.8 + 1.5) -> late, 0
select pg_temp.check((select (r->>'points')::int = 0 and (r->>'late')::boolean and (r->>'finished')::boolean
                      from (select pg_temp.answer(id, 25000, true) r from t_a) x), 'late answer = 0, attempt finished');

select pg_temp.check((select status = 'completed' and total_score = 1475 and flagged from public.attempts where id = (select id from t_a)),
                     'total = 975 + 500 and attempt flagged');
select pg_temp.expect_error($$select public.submit_answer((select id from t_a), 5, 'a')$$, 'already_completed', 'cannot answer after completion');
select pg_temp.check((select count(*) = 0 from public.get_leaderboard(100) where display_name = 'রহিম_01'), 'flagged attempt not on leaderboard');
select pg_temp.check(
  (select floor(500 + 500 * (1 - 1000::numeric / 20000))::int * 5 = 4875), 'max per attempt 4875 (5000 impossible)');

-- ---------- timeout expiry ----------
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
create temp table t_b as select public.start_attempt() as id;
select public.get_current_question(id) from t_b;
update public.attempt_answers set served_at = now() - interval '30 seconds'
 where attempt_id = (select id from t_b) and position = 1;
select pg_temp.check((select (public.get_current_question(id)->>'position')::int = 2 from t_b), 'overdue question expires, moves to next');
select pg_temp.check((select points = 0 and is_correct = false and answered_at is not null from public.attempt_answers
                      where attempt_id = (select id from t_b) and position = 1), 'expired question scores 0');
select pg_temp.expect_error($$select public.submit_answer((select id from t_b), 1, 'a')$$, 'wrong_position', 'cannot answer an expired question');
-- Finish Karim: 4 correct answers at 3 s each.
select pg_temp.answer(id, 3000, true) from t_b;
select pg_temp.answer(id, 3000, true) from t_b;
select pg_temp.answer(id, 3000, true) from t_b;
select pg_temp.answer(id, 3000, true) from t_b;
select pg_temp.check((select status = 'completed' and not flagged and total_score = 4 * 945 from public.attempts where id = (select id from t_b)),
                     'Karim: 4 x 945 (3 s answers)');

-- ---------- abandoned attempt from an earlier day ----------
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
create temp table t_c as select public.start_attempt() as id;
select pg_temp.answer(id, 3000, true) from t_c;                       -- 945 points on Q1, then abandon
update public.attempts set play_date = public.bd_today() - 1, started_at = now() - interval '1 day' where id = (select id from t_c);
select public.get_my_status();
select pg_temp.check((select status = 'completed' and total_score = 945 from public.attempts where id = (select id from t_c)),
                     'abandoned attempt is finalized next day, unanswered = 0');
select pg_temp.check((select count(*) = 4 from public.attempt_answers where attempt_id = (select id from t_c) and points = 0 and answered_at is not null),
                     'its unanswered questions expired');
-- A new day: a new attempt is allowed (and only one).
select pg_temp.check((select public.start_attempt() <> id from t_c), 'new Bangladesh day = new attempt');
select pg_temp.check((select count(*) = 2 from public.attempts where user_id = '33333333-3333-3333-3333-333333333333'), 'one attempt per day');

-- ---------- tie-break ----------
-- Give Sumi's old attempt the same score as Karim but an EARLIER completion time.
update public.attempts set total_score = 4 * 945, completed_at = now() - interval '2 hours' where id = (select id from t_c);
select pg_temp.check((select display_name = 'Sumi' from public.get_leaderboard(10) where rank = 1), 'tie: earlier completed_at ranks first');
select pg_temp.check((select display_name = 'Karim' from public.get_leaderboard(10) where rank = 2), 'tie: later one second');

-- ---------- status ----------
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select pg_temp.check((select (s->>'played_today')::boolean and (s->>'my_rank')::int = 2 and (s->>'best_score')::int = 3780
                      and (s->>'next_reset_at') is not null from (select public.get_my_status() s) x), 'get_my_status');

-- ---------- polls ----------
select pg_temp.check(jsonb_array_length(public.get_polls()) = 6, '6 polls offered');
select pg_temp.expect_error($$select public.submit_poll((select id from public.polls where sort = 1), 'z')$$, 'invalid_option', 'poll option validated');
select public.submit_poll((select id from public.polls where sort = 1), 'a');
select public.submit_poll((select id from public.polls where sort = 1), 'b');   -- second response ignored
select pg_temp.check(jsonb_array_length(public.get_polls()) = 5, 'answered poll not offered again');
select pg_temp.check((select count(*) = 1 from public.poll_responses where user_id = '22222222-2222-2222-2222-222222222222'), 'one response per poll');

-- ---------- RLS / privileges as a real signed-in client ----------
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
set local role authenticated;
select pg_temp.expect_error('select * from public.questions', 'permission denied', 'questions not readable');
select pg_temp.expect_error('select * from public.attempts', 'permission denied', 'attempts not readable');
select pg_temp.expect_error('select * from public.attempt_answers', 'permission denied', 'attempt_answers not readable');
select pg_temp.expect_error('select * from public.poll_responses', 'permission denied', 'poll_responses not readable');
select pg_temp.expect_error('select * from public.contest_settings', 'permission denied', 'contest_settings not readable');
select pg_temp.expect_error('select * from public.blocked_words', 'permission denied', 'blocked_words not readable');
select pg_temp.expect_error('select * from public.v_best_attempts', 'permission denied', 'v_best_attempts not readable');
select pg_temp.expect_error('insert into public.attempts (user_id, play_date) values (auth.uid(), current_date + 5)', 'permission denied', 'cannot insert attempts');
select pg_temp.expect_error('update public.attempts set total_score = 4875', 'permission denied', 'cannot change scores');
select pg_temp.expect_error('update public.profiles set disqualified = false', 'permission denied', 'cannot change disqualified');
select pg_temp.expect_error('update public.profiles set consent_research = true', 'permission denied', 'cannot change consents');
select pg_temp.expect_error('update public.profiles set onboarded_at = null', 'permission denied', 'cannot change onboarded_at');
select pg_temp.expect_error('select private.finalize_attempt(gen_random_uuid())', 'permission denied', 'private helpers not callable');
select pg_temp.check((select count(*) = 1 from public.profiles), 'profiles: only own row visible');
update public.profiles set language = 'bn';   -- the one allowed column
select pg_temp.check((select count(*) = 0 from public.get_leaderboard(10) l
                      where l::text like '%8801%' or l::text like '%Test %'), 'leaderboard has no phone or real name');
select pg_temp.expect_error($$select public.get_current_question((select id from public.attempts limit 1))$$, 'permission denied',
                            'other users'' attempts unreachable');
reset role;
-- another user's attempt id via RPC = not_found
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select pg_temp.expect_error($$select public.get_current_question((select id from t_a))$$, 'not_found', 'cannot open someone else''s attempt');

set local role anon;
select pg_temp.check((select count(*) >= 1 from public.get_leaderboard(5)), 'anon can read the leaderboard');
select pg_temp.expect_error('select public.start_attempt()', 'permission denied', 'anon cannot start');
select pg_temp.expect_error('select * from public.profiles', 'permission denied', 'anon cannot read profiles');
reset role;

-- ---------- contest closed ----------
update public.contest_settings set is_open = false;
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
update public.attempts set play_date = public.bd_today() - 3 where id = (select id from t_a);   -- free up "today"
select pg_temp.expect_error('select public.start_attempt()', 'contest_closed', 'closed contest: start fails');
select pg_temp.check((select count(*) >= 1 from public.get_leaderboard(10)), 'closed contest: leaderboard still visible');
select pg_temp.check(not (public.get_my_status()->>'contest_open')::boolean, 'status shows contest closed');

-- ---------- disqualified ----------
update public.contest_settings set is_open = true;
update public.profiles set disqualified = true where display_name = 'Sumi';
select pg_temp.check((select count(*) = 0 from public.get_leaderboard(10) where display_name = 'Sumi'), 'disqualified player hidden');
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
update public.attempts set play_date = public.bd_today() - 2 where user_id = '33333333-3333-3333-3333-333333333333' and play_date = public.bd_today();
select pg_temp.expect_error('select public.start_attempt()', 'disqualified', 'disqualified cannot start');

\echo 'ALL DATABASE TESTS PASSED (rolling back)'
rollback;
