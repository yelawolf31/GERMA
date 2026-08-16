-- ============================================================
-- 012_security_hardening.sql
-- Security fixes: privilege escalation, CORS, input validation,
-- field whitelisting, storage MIME checks.
-- ============================================================

-- 1. Fix privilege escalation: handle_new_user() trigger MUST NOT
--    read role from raw_user_meta_data. Always default to 'supervisor'.
--    Only the create-user Edge Function (using service role) may
--    set admin role after creation.
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
    'supervisor'  -- ALWAYS default; never trust client-supplied role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Add audit triggers for customer UPDATE and DELETE (gap in 007)
create or replace function public.audit_customer_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  changes jsonb := '{}'::jsonb;
  old_changes jsonb := '{}'::jsonb;
begin
  if new.name is distinct from old.name then
    old_changes := jsonb_set(old_changes, '{name}', to_jsonb(old.name));
    changes := jsonb_set(changes, '{name}', to_jsonb(new.name));
  end if;
  if new.status is distinct from old.status then
    old_changes := jsonb_set(old_changes, '{status}', to_jsonb(old.status));
    changes := jsonb_set(changes, '{status}', to_jsonb(new.status));
  end if;
  if new.phone is distinct from old.phone then
    old_changes := jsonb_set(old_changes, '{phone}', to_jsonb(old.phone));
    changes := jsonb_set(changes, '{phone}', to_jsonb(new.phone));
  end if;
  if new.address is distinct from old.address then
    old_changes := jsonb_set(old_changes, '{address}', to_jsonb(old.address));
    changes := jsonb_set(changes, '{address}', to_jsonb(new.address));
  end if;
  if new.wilaya is distinct from old.wilaya then
    old_changes := jsonb_set(old_changes, '{wilaya}', to_jsonb(old.wilaya));
    changes := jsonb_set(changes, '{wilaya}', to_jsonb(new.wilaya));
  end if;
  if new.commune is distinct from old.commune then
    old_changes := jsonb_set(old_changes, '{commune}', to_jsonb(old.commune));
    changes := jsonb_set(changes, '{commune}', to_jsonb(new.commune));
  end if;

  if changes <> '{}'::jsonb then
    perform public.log_audit('UPDATE', 'customer', new.id,
      case when old_changes = '{}'::jsonb then null else old_changes end,
      changes
    );
  end if;
  return new;
end;
$$;

drop trigger if exists customers_audit_update on public.customers;
create trigger customers_audit_update
  after update on public.customers
  for each row execute function public.audit_customer_update();

create or replace function public.audit_customer_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('DELETE', 'customer', old.id, to_jsonb(old), null);
  return old;
end;
$$;

drop trigger if exists customers_audit_delete on public.customers;
create trigger customers_audit_delete
  after delete on public.customers
  for each row execute function public.audit_customer_delete();

-- 3. Add audit trigger for refrigerator DELETE
create or replace function public.audit_refrigerator_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('DELETE', 'refrigerator', old.id, to_jsonb(old), null);
  return old;
end;
$$;

drop trigger if exists refrigerators_audit_delete on public.refrigerators;
create trigger refrigerators_audit_delete
  after delete on public.refrigerators
  for each row execute function public.audit_refrigerator_delete();

-- 4. Add audit trigger for issue DELETE
create or replace function public.audit_issue_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('DELETE', 'issue', old.id, to_jsonb(old), null);
  return old;
end;
$$;

drop trigger if exists issues_audit_delete on public.issues;
create trigger issues_audit_delete
  after delete on public.issues
  for each row execute function public.audit_issue_delete();

-- 5. Ensure the serial_number column on refrigerators is UNIQUE
--    (prevents duplicate serial numbers).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'refrigerators_serial_number_unique'
  ) THEN
    ALTER TABLE public.refrigerators
      ADD CONSTRAINT refrigerators_serial_number_unique
      UNIQUE (serial_number);
  END IF;
END $$;
