-- 003_functions.sql: every game rule lives here. The browser is untrusted.
--
-- Errors are raised with the error CODE as the message (e.g. raise exception 'name_taken');
-- the frontend maps codes to bilingual text (src/lib/errors.ts, src/i18n/*.json).
--
-- Public RPCs (schema public, granted at the bottom):
--   complete_profile, join_waitlist, start_attempt, get_current_question, submit_answer,
--   get_my_status, get_polls, submit_poll  -> authenticated
--   get_leaderboard                         -> anon, authenticated
-- Internal helpers live in schema "private", which the API cannot reach.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------

-- The caller's user id, or error not_authenticated.
create or replace function private.require_uid() returns uuid
language plpgsql stable set search_path = '' as $$
declare v uuid := auth.uid();
begin
  if v is null then raise exception 'not_authenticated'; end if;
  return v;
end $$;

-- Milliseconds between two timestamps (integer).
create or replace function private.ms_between(p_from timestamptz, p_to timestamptz) returns int
language sql immutable set search_path = '' as $$
  select floor(extract(epoch from (p_to - p_from)) * 1000)::int
$$;

-- Close an attempt: totals come from its answers. Unanswered/expired questions count
-- the full time limit in total_time_ms. flagged = any answer flagged.
create or replace function private.finalize_attempt(p_attempt uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_limit int;
begin
  select seconds_per_question * 1000 into v_limit from public.contest_settings where id = 1;
  update public.attempts a set
    status = 'completed',
    current_position = 5,
    total_score = s.score,
    total_time_ms = s.time_ms,
    completed_at = now(),
    flagged = s.flagged
  from (
    select coalesce(sum(points), 0)::int as score,
           coalesce(sum(coalesce(elapsed_ms, v_limit)), 0)::int as time_ms,
           coalesce(bool_or(flagged), false) as flagged
    from public.attempt_answers where attempt_id = p_attempt
  ) s
  where a.id = p_attempt and a.status = 'in_progress';
end $$;

-- Move to the next question, or finalize after question 5.
create or replace function private.advance_attempt(p_attempt uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_pos int;
begin
  select current_position into v_pos from public.attempts where id = p_attempt;
  if v_pos >= 5 then
    perform private.finalize_attempt(p_attempt);
  else
    update public.attempts set current_position = current_position + 1 where id = p_attempt;
  end if;
end $$;

-- Record a question as timed out: 0 points, full time.
create or replace function private.expire_answer(p_answer uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_limit int;
begin
  select seconds_per_question * 1000 into v_limit from public.contest_settings where id = 1;
  update public.attempt_answers
     set answered_at = now(), chosen_key = null, is_correct = false, elapsed_ms = v_limit, points = 0
   where id = p_answer and answered_at is null;
end $$;

-- An attempt left unfinished on an earlier Bangladesh day: every remaining question
-- expires to 0 and the attempt is finalized (it still used that day's try).
create or replace function private.settle_if_stale(p_attempt uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_limit int;
begin
  if exists (select 1 from public.attempts
             where id = p_attempt and status = 'in_progress' and play_date < public.bd_today()) then
    select seconds_per_question * 1000 into v_limit from public.contest_settings where id = 1;
    update public.attempt_answers
       set answered_at = now(), chosen_key = null, is_correct = false, elapsed_ms = v_limit, points = 0
     where attempt_id = p_attempt and answered_at is null;
    perform private.finalize_attempt(p_attempt);
  end if;
end $$;

-- Options without anything secret: only key / en / bn.
create or replace function private.public_options(p_options jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('key', o->>'key', 'en', o->>'en', 'bn', o->>'bn')), '[]'::jsonb)
  from jsonb_array_elements(p_options) o
$$;

-- ---------------------------------------------------------------------------
-- 1. complete_profile: one-time nickname + consent (game onboarding)
-- ---------------------------------------------------------------------------
create or replace function public.complete_profile(
  p_display_name text,
  p_language text,
  p_consent_waitlist boolean,
  p_consent_research boolean
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  -- trim and collapse runs of spaces
  v_name text := regexp_replace(btrim(coalesce(p_display_name, '')), '\s+', ' ', 'g');
  v_onboarded timestamptz;
begin
  select onboarded_at into v_onboarded from public.profiles where id = v_uid for update;
  if not found then
    insert into public.profiles (id) values (v_uid);
  elsif v_onboarded is not null then
    raise exception 'already_onboarded';
  end if;

  if coalesce(p_consent_waitlist, false) is not true then raise exception 'consent_required'; end if;
  if p_language is null or p_language not in ('bn', 'en') then raise exception 'invalid_language'; end if;

  -- 2-24 chars: Bangla (U+0980-U+09FF, plus ZWJ/ZWNJ used in Bangla words) or Latin letters,
  -- digits, space, _ and . ; at least one letter; no URLs, e-mail or ".." tricks.
  if v_name !~ '^[A-Za-z0-9ঀ-৿‌‍ _.]{2,24}$'
     or v_name !~ '[A-Za-zঀ-৿]'
     or v_name ~* '(https?|www\.|\.(com|net|org|bd|io|xyz|info|me|app)(\.|$|\s))'
     or v_name ~ '\.\.'
  then
    raise exception 'invalid_name';
  end if;

  -- Profanity / impersonation list, compared without spaces, dots or underscores.
  if exists (
    select 1 from public.blocked_words b
    where position(b.word in lower(regexp_replace(v_name, '[ ._]', '', 'g'))) > 0
  ) then
    raise exception 'name_not_allowed';
  end if;

  begin
    update public.profiles set
      display_name = v_name,
      language = p_language,
      consent_waitlist = true,
      consent_research = consent_research or coalesce(p_consent_research, false),
      consent_at = coalesce(consent_at, now()),
      onboarded_at = now()
    where id = v_uid;
  exception when unique_violation then
    raise exception 'name_taken';
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 1b. join_waitlist: waitlist without playing (name + phone already on the profile)
-- ---------------------------------------------------------------------------
create or replace function public.join_waitlist(p_language text, p_consent_research boolean default false)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_already boolean;
begin
  if p_language is null or p_language not in ('bn', 'en') then raise exception 'invalid_language'; end if;

  select consent_waitlist into v_already from public.profiles where id = v_uid for update;
  if not found then
    insert into public.profiles (id) values (v_uid);
    v_already := false;
  end if;
  if v_already then
    return jsonb_build_object('joined', true, 'already', true);
  end if;

  update public.profiles set
    consent_waitlist = true,
    consent_research = consent_research or coalesce(p_consent_research, false),
    consent_at = coalesce(consent_at, now()),
    language = p_language
  where id = v_uid;
  return jsonb_build_object('joined', true, 'already', false);
end $$;

-- ---------------------------------------------------------------------------
-- 2. start_attempt: today's attempt (create once: 2 easy + 2 medium + 1 hard)
-- ---------------------------------------------------------------------------
create or replace function public.start_attempt() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_today date := public.bd_today();
  v_profile public.profiles;
  v_settings public.contest_settings;
  v_id uuid;
begin
  select * into v_profile from public.profiles where id = v_uid;
  if not found or v_profile.onboarded_at is null then raise exception 'profile_incomplete'; end if;
  if v_profile.disqualified then raise exception 'disqualified'; end if;

  -- Already have today's attempt (in progress or done): return it, never a second one.
  select id into v_id from public.attempts where user_id = v_uid and play_date = v_today;
  if found then return v_id; end if;

  select * into v_settings from public.contest_settings where id = 1;
  if not v_settings.is_open or (v_settings.closes_at is not null and now() >= v_settings.closes_at) then
    raise exception 'contest_closed';
  end if;

  if (select count(*) from public.questions where active and difficulty = 'easy') < 2
     or (select count(*) from public.questions where active and difficulty = 'medium') < 2
     or (select count(*) from public.questions where active and difficulty = 'hard') < 1 then
    raise exception 'not_enough_questions';
  end if;

  -- The unique (user_id, play_date) constraint settles races (two taps, two devices).
  insert into public.attempts (user_id, play_date) values (v_uid, v_today)
  on conflict (user_id, play_date) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.attempts where user_id = v_uid and play_date = v_today;
    return v_id;
  end if;

  -- Per difficulty, prefer questions this player has seen least, then random.
  -- Then shuffle the 5 picks into random positions.
  insert into public.attempt_answers (attempt_id, position, question_id)
  select v_id, row_number() over (order by random()), picked.id
  from (
    select r.id
    from (
      select q.id, q.difficulty,
             row_number() over (partition by q.difficulty order by coalesce(seen.n, 0), random()) as rn
      from public.questions q
      left join (
        select aa.question_id, count(*) as n
        from public.attempt_answers aa
        join public.attempts a on a.id = aa.attempt_id
        where a.user_id = v_uid
        group by aa.question_id
      ) seen on seen.question_id = q.id
      where q.active
    ) r
    where (r.difficulty in ('easy', 'medium') and r.rn <= 2) or (r.difficulty = 'hard' and r.rn <= 1)
  ) picked;

  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- 3. get_current_question: never includes correct_key or explanations
-- ---------------------------------------------------------------------------
create or replace function public.get_current_question(p_attempt uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_attempt public.attempts;
  v_answer public.attempt_answers;
  v_question public.questions;
  v_settings public.contest_settings;
  v_limit int;
  v_elapsed int;
begin
  select * into v_attempt from public.attempts where id = p_attempt for update;
  if not found or v_attempt.user_id <> v_uid then raise exception 'not_found'; end if;

  select * into v_settings from public.contest_settings where id = 1;
  v_limit := v_settings.seconds_per_question * 1000;

  perform private.settle_if_stale(p_attempt);
  select * into v_attempt from public.attempts where id = p_attempt;

  loop
    if v_attempt.status = 'completed' then
      return jsonb_build_object('status', 'completed',
                                'total_score', v_attempt.total_score,
                                'total_time_ms', v_attempt.total_time_ms);
    end if;

    select * into v_answer from public.attempt_answers
     where attempt_id = p_attempt and position = v_attempt.current_position
     for update;

    if v_answer.answered_at is not null then
      -- Defensive: already answered but not advanced.
      perform private.advance_attempt(p_attempt);
    else
      -- Start the clock ONCE. A refresh reads the same served_at, so it never resets the timer.
      if v_answer.served_at is null then
        update public.attempt_answers set served_at = now() where id = v_answer.id;
        v_answer.served_at := now();
      end if;

      v_elapsed := private.ms_between(v_answer.served_at, now());

      if v_elapsed > v_limit + v_settings.grace_ms + v_settings.network_tolerance_ms then
        -- Overdue (closed tab, lost connection...): 0 points, go to the next one.
        perform private.expire_answer(v_answer.id);
        perform private.advance_attempt(p_attempt);
      else
        select * into v_question from public.questions where id = v_answer.question_id;
        return jsonb_build_object(
          'status', 'in_progress',
          'position', v_attempt.current_position,
          'total', 5,
          'question', jsonb_build_object(
            'id', v_question.id,
            'text_en', v_question.text_en,
            'text_bn', v_question.text_bn,
            'options', private.public_options(v_question.options)
          ),
          'remaining_ms', greatest(v_limit - v_elapsed, 0),
          'seconds_limit', v_settings.seconds_per_question
        );
      end if;
    end if;

    select * into v_attempt from public.attempts where id = p_attempt;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. submit_answer: scoring (SPEC section 4). p_key = null means "time ran out".
-- ---------------------------------------------------------------------------
create or replace function public.submit_answer(p_attempt uuid, p_position int, p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_attempt public.attempts;
  v_answer public.attempt_answers;
  v_question public.questions;
  v_settings public.contest_settings;
  v_limit int;
  v_elapsed int;
  v_eff int;
  v_late boolean;
  v_too_fast boolean;
  v_correct boolean;
  v_points int := 0;
  v_total int;
begin
  select * into v_attempt from public.attempts where id = p_attempt for update;
  if not found or v_attempt.user_id <> v_uid then raise exception 'not_found'; end if;

  if v_attempt.status = 'in_progress' and v_attempt.play_date < public.bd_today() then
    perform private.settle_if_stale(p_attempt);
    raise exception 'already_completed';
  end if;
  if v_attempt.status = 'completed' then raise exception 'already_completed'; end if;
  if p_position is distinct from v_attempt.current_position then raise exception 'wrong_position'; end if;

  select * into v_answer from public.attempt_answers
   where attempt_id = p_attempt and position = p_position
   for update;
  if not found or v_answer.served_at is null or v_answer.answered_at is not null then
    raise exception 'invalid_state';
  end if;

  select * into v_question from public.questions where id = v_answer.question_id;
  if p_key is not null and not (v_question.options @> jsonb_build_array(jsonb_build_object('key', p_key))) then
    raise exception 'invalid_option';
  end if;

  select * into v_settings from public.contest_settings where id = 1;
  v_limit := v_settings.seconds_per_question * 1000;

  -- Time is measured here, on the server, from served_at.
  v_elapsed := private.ms_between(v_answer.served_at, now());
  v_late := v_elapsed > v_limit + v_settings.grace_ms + v_settings.network_tolerance_ms;
  v_too_fast := p_key is not null and v_elapsed < v_settings.min_human_ms;
  v_correct := p_key is not null and p_key = v_question.correct_key and not v_late;

  -- points = floor(500 + 500 * (1 - eff / limit)), eff = clamp(elapsed - grace, 1000, limit)
  -- => max 975 per question (eff >= 1000 ms), 500 at the limit. Too fast / late / wrong = 0.
  if v_correct and not v_too_fast then
    v_eff := least(greatest(v_elapsed - v_settings.grace_ms, 1000), v_limit);
    v_points := floor(500 + 500 * (1 - v_eff::numeric / v_limit))::int;
  end if;

  update public.attempt_answers set
    answered_at = now(),
    chosen_key = p_key,
    is_correct = v_correct,
    elapsed_ms = case when p_key is null or v_late then v_limit else least(v_elapsed, v_limit) end,
    points = v_points,
    flagged = v_too_fast
  where id = v_answer.id;

  perform private.advance_attempt(p_attempt);
  select * into v_attempt from public.attempts where id = p_attempt;
  select coalesce(sum(points), 0)::int into v_total from public.attempt_answers where attempt_id = p_attempt;

  return jsonb_build_object(
    'is_correct', v_correct,
    'correct_key', v_question.correct_key,
    'points', v_points,
    'elapsed_ms', v_elapsed,
    'too_fast', v_too_fast,
    'late', v_late or p_key is null,
    'explanation_en', v_question.explanation_en,
    'explanation_bn', v_question.explanation_bn,
    'finished', v_attempt.status = 'completed',
    'total_score', v_total
  );
end $$;

-- ---------------------------------------------------------------------------
-- 5. get_my_status
-- ---------------------------------------------------------------------------
create or replace function public.get_my_status() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_profile public.profiles;
  v_settings public.contest_settings;
  v_today public.attempts;
  v_stale uuid;
  v_best int;
  v_rank int;
begin
  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    insert into public.profiles (id) values (v_uid) returning * into v_profile;
  end if;

  -- Finish off attempts abandoned on earlier days so their points count.
  for v_stale in
    select id from public.attempts where user_id = v_uid and status = 'in_progress' and play_date < public.bd_today()
  loop
    perform private.settle_if_stale(v_stale);
  end loop;

  select * into v_today from public.attempts where user_id = v_uid and play_date = public.bd_today();
  select best_score into v_best from public.v_best_attempts where user_id = v_uid;
  select r.rn into v_rank from (
    select user_id, row_number() over (order by best_score desc, completed_at asc)::int as rn
    from public.v_best_attempts
  ) r where r.user_id = v_uid;
  select * into v_settings from public.contest_settings where id = 1;

  return jsonb_build_object(
    'onboarded', v_profile.onboarded_at is not null,
    'waitlisted', v_profile.consent_waitlist,
    'display_name', v_profile.display_name,
    'full_name', v_profile.full_name,
    'language', v_profile.language,
    'phone', v_profile.phone,
    'played_today', v_today.id is not null,
    'attempt_id', v_today.id,
    'attempt_status', v_today.status,
    'today_score', case when v_today.status = 'completed' then v_today.total_score end,
    'best_score', v_best,
    'my_rank', v_rank,
    'next_reset_at', ((public.bd_today() + 1)::timestamp at time zone 'Asia/Dhaka'),
    'contest_open', v_settings.is_open and (v_settings.closes_at is null or now() < v_settings.closes_at)
  );
end $$;

-- ---------------------------------------------------------------------------
-- 6. get_leaderboard: public (anon). Nicknames and scores only.
-- ---------------------------------------------------------------------------
create or replace function public.get_leaderboard(p_limit int default 50)
returns table (rank int, display_name text, best_score int, completed_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select (row_number() over (order by b.best_score desc, b.completed_at asc))::int,
         b.display_name, b.best_score, b.completed_at
  from public.v_best_attempts b
  order by b.best_score desc, b.completed_at asc
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
$$;

-- ---------------------------------------------------------------------------
-- 7. Polls (optional, unscored)
-- ---------------------------------------------------------------------------
create or replace function public.get_polls() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := private.require_uid();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', p.id, 'text_en', p.text_en, 'text_bn', p.text_bn,
             'options', private.public_options(p.options)) order by p.sort, p.id)
    from public.polls p
    where p.active
      and not exists (select 1 from public.poll_responses r where r.poll_id = p.id and r.user_id = v_uid)
  ), '[]'::jsonb);
end $$;

create or replace function public.submit_poll(p_poll uuid, p_key text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_options jsonb;
begin
  select options into v_options from public.polls where id = p_poll and active;
  if not found then raise exception 'not_found'; end if;
  if p_key is null or not (v_options @> jsonb_build_array(jsonb_build_object('key', p_key))) then
    raise exception 'invalid_option';
  end if;
  insert into public.poll_responses (user_id, poll_id, option_key)
  values (v_uid, p_poll, p_key)
  on conflict (user_id, poll_id) do nothing;   -- one response per poll
end $$;

-- ---------------------------------------------------------------------------
-- Privileges: nothing is callable unless granted here.
-- ---------------------------------------------------------------------------
revoke execute on function
  public.handle_new_user(),
  public.handle_user_phone_change(),
  public.bd_today(),
  public.complete_profile(text, text, boolean, boolean),
  public.join_waitlist(text, boolean),
  public.start_attempt(),
  public.get_current_question(uuid),
  public.submit_answer(uuid, int, text),
  public.get_my_status(),
  public.get_leaderboard(int),
  public.get_polls(),
  public.submit_poll(uuid, text)
from public, anon, authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;

grant execute on function
  public.complete_profile(text, text, boolean, boolean),
  public.join_waitlist(text, boolean),
  public.start_attempt(),
  public.get_current_question(uuid),
  public.submit_answer(uuid, int, text),
  public.get_my_status(),
  public.get_polls(),
  public.submit_poll(uuid, text)
to authenticated;

grant execute on function public.get_leaderboard(int) to anon, authenticated;
