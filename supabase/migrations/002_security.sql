-- 002_security.sql: RLS and privileges.
-- Principle: clients touch almost nothing directly; everything goes through
-- security definer functions (003_functions.sql) that check auth.uid().

alter table public.contest_settings enable row level security;
alter table public.profiles         enable row level security;
alter table public.blocked_words    enable row level security;
alter table public.questions        enable row level security;
alter table public.attempts         enable row level security;
alter table public.attempt_answers  enable row level security;
alter table public.polls            enable row level security;
alter table public.poll_responses   enable row level security;

-- Supabase grants everything on new objects to anon/authenticated by default. Undo that,
-- for what exists now and for anything created later in this schema by this role.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- A signed-in user may read their own profile and change only its language.
create policy "own profile read"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
grant select on public.profiles to authenticated;
grant update (language) on public.profiles to authenticated;   -- everything else via complete_profile() / join_waitlist()

-- Active polls are readable by signed-in users (they hold no secrets).
create policy "active polls" on public.polls for select to authenticated using (active);
grant select on public.polls to authenticated;

-- All other tables: NO policies, NO grants (direct reads/writes are denied).

-- Best completed, unflagged attempt per onboarded, non-disqualified player.
-- Internal: only security definer functions read it.
create view public.v_best_attempts as
select distinct on (a.user_id)
  a.user_id,
  p.display_name,
  a.id as attempt_id,
  a.total_score as best_score,
  a.completed_at
from public.attempts a
join public.profiles p on p.id = a.user_id
where a.status = 'completed'
  and not a.flagged
  and p.onboarded_at is not null
  and not p.disqualified
order by a.user_id, a.total_score desc, a.completed_at asc;

revoke all on public.v_best_attempts from public, anon, authenticated;
