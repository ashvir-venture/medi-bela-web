-- 001_schema.sql: tables, sign-up trigger, Bangladesh "today".
--
-- Sign-in is Supabase Auth phone + password (no SMS yet: phone confirmations are OFF;
-- see SUPABASE_SETUP.md). The person's real name and phone number are copied into
-- profiles.full_name / profiles.phone for the waitlist and for contacting winners.
-- They are PRIVATE: only the person themselves (RLS) and admin SQL can read them.
-- The public leaderboard shows display_name (a nickname) only.

create extension if not exists pgcrypto;

-- One-row settings table (id is always 1).
create table public.contest_settings (
  id int primary key default 1 check (id = 1),
  is_open boolean not null default true,
  closes_at timestamptz,                       -- optional automatic close
  seconds_per_question int not null default 20,
  grace_ms int not null default 800,           -- not counted (mobile latency)
  network_tolerance_ms int not null default 1500,
  min_human_ms int not null default 700        -- faster than this = flagged, 0 points
);
insert into public.contest_settings default values;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) between 2 and 60),  -- private
  phone text,                                                                            -- private, E.164 without '+', from auth.users
  display_name text check (char_length(display_name) between 2 and 24),                 -- public nickname
  language text not null default 'bn' check (language in ('bn','en')),
  consent_waitlist boolean not null default false,
  consent_research boolean not null default false,
  consent_at timestamptz,
  onboarded_at timestamptz,   -- set once the nickname is chosen (game only)
  disqualified boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index profiles_display_name_key on public.profiles (lower(display_name));
create index profiles_waitlist_idx on public.profiles (consent_waitlist) where consent_waitlist;

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
  source_section text,             -- app CLAUDE.md heading that proves the answer
  active boolean not null default true,
  constraint questions_options_shape check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  constraint questions_correct_key_in_options check (options @> jsonb_build_array(jsonb_build_object('key', correct_key)))
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  play_date date not null,          -- Bangladesh calendar day
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  current_position int not null default 1,
  total_score int not null default 0,
  total_time_ms int,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  flagged boolean not null default false,
  unique (user_id, play_date)       -- the daily limit, enforced by the database
);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  position int not null check (position between 1 and 5),
  question_id uuid not null references public.questions(id),
  served_at timestamptz,            -- set ONCE when first shown; refresh never resets it
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
  options jsonb not null,           -- [{"key":"a","en":"...","bn":"..."}, ...]
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
create index on public.attempt_answers (question_id);
create index on public.attempts (user_id, status);
create index on public.attempts (status, flagged, total_score desc, completed_at);

-- Profile row created on sign-up, with the name typed on the sign-up form
-- (user metadata "full_name") and the phone number from Supabase Auth.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text := nullif(btrim(left(coalesce(new.raw_user_meta_data->>'full_name', ''), 60)), '');
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, case when char_length(v_name) >= 2 then v_name end, new.phone);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep profiles.phone in step if the phone on the account ever changes (e.g. later SMS flows).
create or replace function public.handle_user_phone_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set phone = new.phone where id = new.id;
  return new;
end $$;

create trigger on_auth_user_phone_changed after update of phone on auth.users
for each row when (old.phone is distinct from new.phone)
execute function public.handle_user_phone_change();

-- "Today" in Bangladesh (Asia/Dhaka, UTC+6, no DST). The daily limit resets at 00:00 BDT.
create or replace function public.bd_today() returns date
language sql stable set search_path = public as $$ select (now() at time zone 'Asia/Dhaka')::date $$;
