-- ============================================================
-- 014_private_visit_photos.sql
-- Make the visit-photos bucket private so photos are only
-- accessible via short-lived signed URLs for authorized users.
--
-- Security model:
--   - Admins: full access to all visit photos
--   - Supervisors: read access only to their own visits' photos
--   - Storage path guessing: prevented by RLS on storage.objects
--   - Service-role key: never exposed to frontend code
--
-- Existing uploaded photos are preserved. The public_url column
-- is kept for backward compatibility but is no longer used;
-- signed URLs are generated on the fly.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Make visit-photos bucket private
-- -----------------------------------------------------------
update storage.buckets
set public = false
where id = 'visit-photos';

-- -----------------------------------------------------------
-- 2. Drop the broad authenticated-read storage policy that
--    allowed any authenticated user to read any object
-- -----------------------------------------------------------
drop policy if exists "Authenticated users can read objects" on storage.objects;

-- -----------------------------------------------------------
-- 3. Restrict storage read access for visit-photos:
--    - Admins can read all visit photos
--    - Supervisors can read photos for their own visits
-- -----------------------------------------------------------
create policy "Authorized users can read visit photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'visit-photos'
    and (
      public.is_admin()
      or name like auth.uid() || '/%'
      or exists (
        select 1 from public.visit_photos vp
        join public.visits v on v.id = vp.visit_id
        where vp.path = storage.objects.name
          and v.supervisor_id = auth.uid()
      )
    )
  );

-- Allow authenticated users to read issue-photos, customer-photos,
-- refrigerator-photos (non-sensitive field photos, kept public).
create policy "Authenticated users can read non-visit buckets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('issue-photos', 'customer-photos', 'refrigerator-photos')
  );

-- -----------------------------------------------------------
-- 4. Add signed_url column to visit_photos for caching
--    (optional optimization — frontend generates on the fly)
-- -----------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'visit_photos' and column_name = 'signed_url'
  ) then
    alter table public.visit_photos
      add column signed_url text;
  end if;
end $$;
