-- ============================================================
-- 020_orphan_report_placeholders.sql
-- Refine the orphan photo report so Storage's internal
-- ".emptyFolderPlaceholder" markers are not reported as photos.
-- ============================================================

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
      and o.name not like '%/.emptyFolderPlaceholder'
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
