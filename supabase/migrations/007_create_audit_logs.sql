-- ============================================================
-- 007_create_audit_logs.sql
-- Audit records are written ONLY by SECURITY DEFINER database
-- triggers. No client role can INSERT/UPDATE/DELETE audit_logs
-- (no RLS policies for those operations), and admins can only
-- SELECT them.
-- ============================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete restrict,
  -- nullable: system/seed writes have no auth.uid()
  action text not null,          -- CREATE | UPDATE | DELETE
  entity_type text not null,     -- customer | refrigerator | visit | issue | ...
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_type_idx on public.audit_logs (entity_type);
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);

-- -----------------------------------------------------------
-- Core logging function (SECURITY DEFINER, bypasses RLS).
-- Never callable by the client API; used by triggers only.
-- -----------------------------------------------------------
create or replace function public.log_audit(
  action text,
  entity_type text,
  entity_id uuid,
  old_data jsonb default null,
  new_data jsonb default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  values (auth.uid(), action, entity_type, entity_id, old_data, new_data);
end;
$$;

-- Revoke direct usage from the client roles: triggers only.
revoke execute on function public.log_audit(text, text, uuid, jsonb, jsonb) from anon, authenticated;

-- -----------------------------------------------------------
-- Trigger: customer created
-- -----------------------------------------------------------
create or replace function public.audit_customer_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('CREATE', 'customer', new.id, null, to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists customers_audit_insert on public.customers;
create trigger customers_audit_insert
  after insert on public.customers
  for each row execute function public.audit_customer_insert();

-- -----------------------------------------------------------
-- Trigger: refrigerator created
-- -----------------------------------------------------------
create or replace function public.audit_refrigerator_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('CREATE', 'refrigerator', new.id, null, to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists refrigerators_audit_insert on public.refrigerators;
create trigger refrigerators_audit_insert
  after insert on public.refrigerators
  for each row execute function public.audit_refrigerator_insert();

-- -----------------------------------------------------------
-- Trigger: refrigerator status changed
-- -----------------------------------------------------------
create or replace function public.audit_refrigerator_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    perform public.log_audit(
      'UPDATE',
      'refrigerator',
      new.id,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists refrigerators_audit_status on public.refrigerators;
create trigger refrigerators_audit_status
  after update of status on public.refrigerators
  for each row execute function public.audit_refrigerator_status();

-- -----------------------------------------------------------
-- Trigger: visit created
-- -----------------------------------------------------------
create or replace function public.audit_visit_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('CREATE', 'visit', new.id, null,
    jsonb_build_object(
      'customer_id', new.customer_id,
      'refrigerator_condition', new.refrigerator_condition,
      'cleanliness', new.cleanliness
    )
  );
  return new;
end;
$$;

drop trigger if exists visits_audit_insert on public.visits;
create trigger visits_audit_insert
  after insert on public.visits
  for each row execute function public.audit_visit_insert();

-- -----------------------------------------------------------
-- Trigger: issue created
-- -----------------------------------------------------------
create or replace function public.audit_issue_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('CREATE', 'issue', new.id, null, to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists issues_audit_insert on public.issues;
create trigger issues_audit_insert
  after insert on public.issues
  for each row execute function public.audit_issue_insert();

-- -----------------------------------------------------------
-- Trigger: issue updated (status / priority / description)
-- -----------------------------------------------------------
create or replace function public.audit_issue_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  changes jsonb := '{}'::jsonb;
  old_changes jsonb := '{}'::jsonb;
begin
  if new.status is distinct from old.status then
    old_changes := jsonb_set(old_changes, '{status}', to_jsonb(old.status));
    changes := jsonb_set(changes, '{status}', to_jsonb(new.status));
  end if;
  if new.priority is distinct from old.priority then
    old_changes := jsonb_set(old_changes, '{priority}', to_jsonb(old.priority));
    changes := jsonb_set(changes, '{priority}', to_jsonb(new.priority));
  end if;
  if new.description is distinct from old.description then
    old_changes := jsonb_set(old_changes, '{description}', to_jsonb(old.description));
    changes := jsonb_set(changes, '{description}', to_jsonb(new.description));
  end if;

  if changes <> '{}'::jsonb then
    perform public.log_audit('UPDATE', 'issue', new.id,
      case when old_changes = '{}'::jsonb then null else old_changes end,
      changes
    );
  end if;
  return new;
end;
$$;

drop trigger if exists issues_audit_update on public.issues;
create trigger issues_audit_update
  after update on public.issues
  for each row execute function public.audit_issue_update();
