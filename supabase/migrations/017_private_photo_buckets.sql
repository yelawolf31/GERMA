-- ============================================================
-- 017_private_photo_buckets.sql
-- Make the issue-photos, customer-photos and refrigerator-photos
-- buckets private so photo binaries are only reachable via
-- short-lived signed URLs by authenticated users.
--
-- Before this migration only the visit-photos bucket was private;
-- the other three were public with predictable object paths, which
-- meant any unauthenticated visitor with a guessable path could
-- fetch a photo directly. This closes that exposure.
--
-- Security model (mirrors the visit-photos model from 014):
--   - buckets are private (no anonymous object read)
--   - authenticated users may select objects in these buckets
--   - upload/update/delete remain owner-or-admin (from 008)
--   - the app now generates signed URLs instead of public URLs
--
-- The public_url columns on the photo reference tables are kept for
-- backward compatibility but are no longer written by the frontend.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Make the three non-visit buckets private
-- -----------------------------------------------------------
update storage.buckets
set public = false
where id in ('issue-photos', 'customer-photos', 'refrigerator-photos');

-- -----------------------------------------------------------
-- 2. Replace the broad public read policy on non-visit buckets
--    with one restricted to authenticated users.
-- -----------------------------------------------------------
drop policy if exists "Authenticated users can read non-visit buckets" on storage.objects;

create policy "Authenticated users can read private photo buckets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('issue-photos', 'customer-photos', 'refrigerator-photos')
  );

-- -----------------------------------------------------------
-- 3. Guard: refuse any future attempt to set these buckets public
--    via the anon role. (The insert policy from 008 already limits
--    uploads to authenticated owners.)
-- -----------------------------------------------------------
