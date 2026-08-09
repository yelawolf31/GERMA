-- ============================================================
-- 008_create_storage_buckets.sql
-- Photo buckets + photo reference tables + storage policies.
-- Only metadata is stored in PostgreSQL; binaries live in
-- Supabase Storage.
-- ============================================================

-- -----------------------------------------------------------
-- Buckets
-- Public buckets: the frontend stores a persistent `public_url`
-- (getPublicUrl) at upload time; private buckets would require
-- short-lived signed URLs. Content is low-sensitivity field photos.
-- -----------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('visit-photos', 'visit-photos', true),
  ('issue-photos', 'issue-photos', true),
  ('customer-photos', 'customer-photos', true),
  ('refrigerator-photos', 'refrigerator-photos', true)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- Photo reference tables
-- -----------------------------------------------------------
create table if not exists public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  bucket text not null,
  path text not null,
  public_url text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists visit_photos_visit_id_idx on public.visit_photos (visit_id);

create table if not exists public.issue_photos (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  bucket text not null,
  path text not null,
  public_url text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists issue_photos_issue_id_idx on public.issue_photos (issue_id);

-- -----------------------------------------------------------
-- Storage object policies
-- -----------------------------------------------------------
drop policy if exists "Authenticated users can read objects" on storage.objects;
create policy "Authenticated users can read objects"
  on storage.objects for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('visit-photos', 'issue-photos', 'customer-photos', 'refrigerator-photos')
    and owner = auth.uid()
  );

drop policy if exists "Users can update own objects" on storage.objects;
create policy "Users can update own objects"
  on storage.objects for update
  to authenticated
  using (owner = auth.uid());

drop policy if exists "Owners or admins can delete objects" on storage.objects;
create policy "Owners or admins can delete objects"
  on storage.objects for delete
  to authenticated
  using (owner = auth.uid() or public.is_admin());
