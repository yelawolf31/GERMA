-- ============================================================
-- 016_client_warnings.sql
-- Client warning system:
--   - Supervisors issue warnings during visits
--   - Warnings are per-customer (not per-refrigerator)
--   - At3 warnings: flag only (no auto-status change)
--   - Admin can dismiss warnings
-- ============================================================

-- -----------------------------------------------------------
-- 1. client_warnings table
-- -----------------------------------------------------------
create table public.client_warnings (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  visit_id     uuid references public.visits(id) on delete set null,
  reason       text not null,
  issued_by    uuid not null references public.profiles(id) on delete restrict,
  dismissed    boolean not null default false,
  dismissed_by uuid references public.profiles(id),
  dismissed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -----------------------------------------------------------
-- 2. Indexes
-- -----------------------------------------------------------
create index idx_client_warnings_customer on public.client_warnings(customer_id);
create index idx_client_warnings_active on public.client_warnings(customer_id) where not dismissed;

-- -----------------------------------------------------------
-- 3. updated_at trigger
-- -----------------------------------------------------------
create trigger client_warnings_set_updated_at
  before update on public.client_warnings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------
-- 4. RLS policies
-- -----------------------------------------------------------
alter table public.client_warnings enable row level security;

-- SELECT: all authenticated
create policy "client_warnings_select_all"
  on public.client_warnings for select
  to authenticated
  using (true);

-- INSERT: supervisor or admin, issued_by must be self
create policy "client_warnings_insert"
  on public.client_warnings for insert
  to authenticated
  with check (issued_by = auth.uid());

-- UPDATE: admin only (for dismiss)
create policy "client_warnings_update_admin"
  on public.client_warnings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: admin only
create policy "client_warnings_delete_admin"
  on public.client_warnings for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------
-- 5. Audit triggers (log warning creation + dismissal)
-- -----------------------------------------------------------
create or replace function public.audit_client_warning_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'CREATE',
    'client_warning',
    NEW.id,
    null,
    jsonb_build_object(
      'customer_id', NEW.customer_id,
      'visit_id', NEW.visit_id,
      'reason', NEW.reason,
      'issued_by', NEW.issued_by
    )
  );
  return NEW;
end;
$$;

create trigger audit_client_warning_insert
  after insert on public.client_warnings
  for each row execute function public.audit_client_warning_insert();

create or replace function public.audit_client_warning_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if OLD.dismissed = false and NEW.dismissed = true then
    perform public.log_audit(
      'UPDATE',
      'client_warning',
      NEW.id,
      jsonb_build_object('dismissed', false),
      jsonb_build_object(
        'dismissed', true,
        'dismissed_by', NEW.dismissed_by,
        'dismissed_at', NEW.dismissed_at
      )
    );
  end if;
  return NEW;
end;
$$;

create trigger audit_client_warning_update
  after update on public.client_warnings
  for each row execute function public.audit_client_warning_update();
