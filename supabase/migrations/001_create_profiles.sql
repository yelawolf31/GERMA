-- ============================================================
-- 001_create_profiles.sql
-- Profiles linked to auth.users + role helpers.
-- Run order: 001 -> 002 -> ... -> 010
-- ============================================================

-- Base grants so the Supabase client can access public tables.
-- RLS (enabled later) remains the real security boundary.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- -----------------------------------------------------------
-- profiles
-- -----------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  role text not null default 'supervisor'
    check (role in ('admin', 'supervisor')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- Auto-create a profile whenever a new auth user is created.
-- Does not overwrite an existing profile so the edge function
-- (which inserts first with the correct role) wins.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'supervisor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------
-- Role helper functions (used by RLS policies).
-- -----------------------------------------------------------

-- Returns the current user's role from their profile.
create or replace function public.current_user_role()
returns text
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Returns true if the current user is an admin.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select public.current_user_role() = 'admin';
$$;

-- Shared updated_at trigger function.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
