-- ============================================================
-- 011_fix_auth_seed_users.sql
-- Repair the demo users created by 010_seed_data.sql.
--
-- The seed inserted rows directly into auth.users, leaving NULL in
-- string columns that GoTrue expects to be empty strings, and without
-- a matching auth.identities row. As a result, password sign-in fails
-- with "Database error querying schema".
--
-- This migration:
--   1. converts the nullable string columns to '' for the demo users,
--   2. inserts the matching email/password identities GoTrue expects.
-- It is a safe no-op on databases where the seed wasn't run.
-- ============================================================

-- 1) NULL string columns -> '' (only text-ish columns; timestamps stay null)
update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where email in ('admin@germa.dz', 'supervisor@germa.dz');

-- 2) Identity rows (GoTrue needs them for email/password sign-in).
--    `email` is a generated column, populated from identity_data.
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  u.id,
  u.id,
  jsonb_build_object('sub', u.id, 'email', u.email),
  'email',
  u.email,
  now(), now(), now()
from auth.users u
where u.email in ('admin@germa.dz', 'supervisor@germa.dz')
on conflict (id) do nothing;
