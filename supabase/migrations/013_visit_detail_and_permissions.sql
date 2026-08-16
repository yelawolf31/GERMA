-- ============================================================
-- 013_visit_detail_and_permissions.sql
-- Adds refrigerator_id to visits, tightens RLS so supervisors
-- only see their own visits/photos, and adds audit triggers
-- for photo upload and deletion.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Add refrigerator_id to visits (nullable FK)
-- -----------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'visits' and column_name = 'refrigerator_id'
  ) then
    alter table public.visits
      add column refrigerator_id uuid references public.refrigerators(id) on delete set null;
    create index idx_visits_refrigerator_id on public.visits(refrigerator_id);
  end if;
end $$;

-- -----------------------------------------------------------
-- 2. Tighten visits RLS — supervisors see only their own visits
-- -----------------------------------------------------------
drop policy if exists "Visits are readable by authenticated users" on public.visits;
drop policy if exists "Visits readable by owner or admin" on public.visits;

create policy "Visits readable by owner or admin"
  on public.visits for select
  to authenticated
  using (
    public.is_admin() or supervisor_id = auth.uid()
  );

-- -----------------------------------------------------------
-- 3. Tighten visit_photos RLS — supervisors see only their
--    own visits' photos
-- -----------------------------------------------------------
drop policy if exists "Visit photos are readable by authenticated users" on public.visit_photos;
drop policy if exists "Visit photos readable by owner or admin" on public.visit_photos;

create policy "Visit photos readable by owner or admin"
  on public.visit_photos for select
  to authenticated
  using (
    public.is_admin()
    or visit_id in (
      select id from public.visits where supervisor_id = auth.uid()
    )
  );

-- -----------------------------------------------------------
-- 4. Audit trigger: visit photo uploaded
-- -----------------------------------------------------------
create or replace function public.audit_visit_photo_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'photo_upload',
    'visit_photo',
    NEW.id,
    null,
    jsonb_build_object(
      'visit_id', NEW.visit_id,
      'path', NEW.path,
      'bucket', NEW.bucket
    )
  );
  return NEW;
end;
$$;

drop trigger if exists visit_photos_audit_insert on public.visit_photos;
create trigger visit_photos_audit_insert
  after insert on public.visit_photos
  for each row execute function public.audit_visit_photo_insert();

-- -----------------------------------------------------------
-- 5. Audit trigger: visit photo deleted
-- -----------------------------------------------------------
create or replace function public.audit_visit_photo_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'photo_delete',
    'visit_photo',
    OLD.id,
    jsonb_build_object(
      'visit_id', OLD.visit_id,
      'path', OLD.path,
      'bucket', OLD.bucket
    ),
    null
  );
  return OLD;
end;
$$;

drop trigger if exists visit_photos_audit_delete on public.visit_photos;
create trigger visit_photos_audit_delete
  after delete on public.visit_photos
  for each row execute function public.audit_visit_photo_delete();
