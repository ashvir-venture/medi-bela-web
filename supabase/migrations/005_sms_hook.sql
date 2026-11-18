-- 005_sms_hook.sql: Supabase Auth "Send SMS" hook, ready for the SMS gateway (not used yet).
--
-- Today: phone confirmations are OFF, so Supabase never asks for an SMS and this hook is not
-- called. It exists so the Phone provider can be enabled without a Twilio/Vonage account
-- (Auth → Hooks → Send SMS → Postgres → public.send_sms_hook), and so SMS verification /
-- password reset can be switched on later by filling in the body below; no website change needed.
--
-- Later (same HTTP SMS gateway as the app, backend/src/auth/sms.service.ts):
--   1. create extension if not exists pg_net;  store the gateway key in Vault, never in SQL.
--   2. replace the body with net.http_post(...) to the gateway using event->'user'->>'phone'
--      and event->'sms'->>'otp', then turn on "Confirm phone" in Auth → Providers → Phone.

create or replace function public.send_sms_hook(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  -- Deliberately a no-op: never log event (it contains the one-time code and phone number).
  return '{}'::jsonb;
end $$;

-- Only Supabase Auth may call it.
revoke execute on function public.send_sms_hook(jsonb) from public, anon, authenticated;
grant execute on function public.send_sms_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
