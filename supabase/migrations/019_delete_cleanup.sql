-- ============================================================
-- 019_delete_cleanup.sql
-- 1. Closes the audit-log gap for deleted visits and client
--    warnings (triggers also fire on FK cascade deletes).
-- 2. Adds an admin-only report of storage objects that no longer
--    have a reference row (orphaned photo binaries).
--
-- No new tables. Functions are explicitly granted/revoked to stay
-- compatible with Supabase's post-2026-10-30 default privileges.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Audit trigger: visit deleted (including customer cascades)
-- -----------------------------------------------------------
create or replace function public.audit_visit_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('DELETE', 'visit', old.id, to_jsonb(old), null);
  return old;
end;
$$;

drop trigger if exists visits_audit_delete on public.visits;
create trigger visits_audit_delete
  after delete on public.visits
  for each row execute function public.audit_visit_delete();

-- -----------------------------------------------------------
-- 2. Audit trigger: client warning deleted (including cascades)
-- -----------------------------------------------------------
create or replace function public.audit_client_warning_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('DELETE', 'client_warning', old.id, to_jsonb(old), null);
  return old;
end;
$$;

drop trigger if exists client_warnings_audit_delete on public.client_warnings;
create trigger client_warnings_audit_delete
  after delete on public.client_warnings
  for each row execute function public.audit_client_warning_delete();

-- Trigger functions are never callable by clients.
revoke execute on function public.audit_visit_delete() from anon, authenticated;
revoke execute on function public.audit_client_warning_delete() from anon, authenticated;

-- -----------------------------------------------------------
-- 3. Orphan photo report (admin only)
--    Returns storage objects whose (bucket_id, name) is not
--    referenced by any photo table. Deleting the returned
--    objects through the Storage API removes the binaries.
-- -----------------------------------------------------------
create or replace function public.orphan_photo_objects()
returns table (bucket_id text, object_name text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;

  return query
    select o.bucket_id, o.name
    from storage.objects o
    where o.bucket_id in ('visit-photos', 'issue-photos', 'customer-photos', 'refrigerator-photos')
      and not exists (
        select 1 from public.visit_photos p
        where p.bucket = o.bucket_id and p.path = o.name
      )
      and not exists (
        select 1 from public.issue_photos p
        where p.bucket = o.bucket_id and p.path = o.name
      )
      and not exists (
        select 1 from public.customer_photos p
        where p.bucket = o.bucket_id and p.path = o.name
      )
      and not exists (
        select 1 from public.refrigerator_photos p
        where p.bucket = o.bucket_id and p.path = o.name
      );
end;
$$;

revoke all on function public.orphan_photo_objects() from public, anon;
grant execute on function public.orphan_photo_objects() to authenticated, service_role;
