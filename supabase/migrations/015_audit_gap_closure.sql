-- ============================================================
-- 015_audit_gap_closure.sql
-- Closes all audit log gaps:
--   1. Issue photo audit triggers
--   2. Profile update audit trigger
--   3. Refrigerator full update audit (beyond just status)
--   4. Product audit triggers (INSERT/UPDATE/DELETE)
--   5. Enrich visit INSERT audit with all fields
--   6. Customer/refrigerator photo reference tables + RLS + triggers
--   7. Auth event logging function (LOGIN/LOGOUT from frontend)
-- ============================================================

-- -----------------------------------------------------------
-- 1. Issue photo audit triggers (mirrors visit_photos in 013)
-- -----------------------------------------------------------
create or replace function public.audit_issue_photo_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'photo_upload',
    'issue_photo',
    NEW.id,
    null,
    jsonb_build_object(
      'issue_id', NEW.issue_id,
      'path', NEW.path,
      'bucket', NEW.bucket
    )
  );
  return NEW;
end;
$$;

drop trigger if exists issue_photos_audit_insert on public.issue_photos;
create trigger issue_photos_audit_insert
  after insert on public.issue_photos
  for each row execute function public.audit_issue_photo_insert();

create or replace function public.audit_issue_photo_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'photo_delete',
    'issue_photo',
    OLD.id,
    jsonb_build_object(
      'issue_id', OLD.issue_id,
      'path', OLD.path,
      'bucket', OLD.bucket
    ),
    null
  );
  return OLD;
end;
$$;

drop trigger if exists issue_photos_audit_delete on public.issue_photos;
create trigger issue_photos_audit_delete
  after delete on public.issue_photos
  for each row execute function public.audit_issue_photo_delete();

-- -----------------------------------------------------------
-- 2. Profile update audit trigger
-- -----------------------------------------------------------
create or replace function public.audit_profile_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  changes jsonb := '{}'::jsonb;
  old_changes jsonb := '{}'::jsonb;
begin
  if new.full_name is distinct from old.full_name then
    old_changes := jsonb_set(old_changes, '{full_name}', to_jsonb(old.full_name));
    changes := jsonb_set(changes, '{full_name}', to_jsonb(new.full_name));
  end if;
  if new.role is distinct from old.role then
    old_changes := jsonb_set(old_changes, '{role}', to_jsonb(old.role));
    changes := jsonb_set(changes, '{role}', to_jsonb(new.role));
  end if;

  if changes <> '{}'::jsonb then
    perform public.log_audit('UPDATE', 'profile', new.id,
      case when old_changes = '{}'::jsonb then null else old_changes end,
      changes
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_audit_update on public.profiles;
create trigger profiles_audit_update
  after update on public.profiles
  for each row execute function public.audit_profile_update();

-- -----------------------------------------------------------
-- 3. Refrigerator full update audit (tracks all editable fields)
--    Replaces the narrow status-only trigger from 007
-- -----------------------------------------------------------
create or replace function public.audit_refrigerator_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  changes jsonb := '{}'::jsonb;
  old_changes jsonb := '{}'::jsonb;
begin
  if new.serial_number is distinct from old.serial_number then
    old_changes := jsonb_set(old_changes, '{serial_number}', to_jsonb(old.serial_number));
    changes := jsonb_set(changes, '{serial_number}', to_jsonb(new.serial_number));
  end if;
  if new.model is distinct from old.model then
    old_changes := jsonb_set(old_changes, '{model}', to_jsonb(old.model));
    changes := jsonb_set(changes, '{model}', to_jsonb(new.model));
  end if;
  if new.status is distinct from old.status then
    old_changes := jsonb_set(old_changes, '{status}', to_jsonb(old.status));
    changes := jsonb_set(changes, '{status}', to_jsonb(new.status));
  end if;
  if new.notes is distinct from old.notes then
    old_changes := jsonb_set(old_changes, '{notes}', to_jsonb(old.notes));
    changes := jsonb_set(changes, '{notes}', to_jsonb(new.notes));
  end if;
  if new.installation_date is distinct from old.installation_date then
    old_changes := jsonb_set(old_changes, '{installation_date}', to_jsonb(old.installation_date));
    changes := jsonb_set(changes, '{installation_date}', to_jsonb(new.installation_date));
  end if;
  if new.customer_id is distinct from old.customer_id then
    old_changes := jsonb_set(old_changes, '{customer_id}', to_jsonb(old.customer_id));
    changes := jsonb_set(changes, '{customer_id}', to_jsonb(new.customer_id));
  end if;

  if changes <> '{}'::jsonb then
    perform public.log_audit('UPDATE', 'refrigerator', new.id,
      case when old_changes = '{}'::jsonb then null else old_changes end,
      changes
    );
  end if;
  return new;
end;
$$;

-- Replace the old narrow status-only trigger
drop trigger if exists refrigerators_audit_status on public.refrigerators;
create trigger refrigerators_audit_update
  after update on public.refrigerators
  for each row execute function public.audit_refrigerator_update();

-- -----------------------------------------------------------
-- 4. Product audit triggers
-- -----------------------------------------------------------
create or replace function public.audit_product_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('CREATE', 'product', new.id, null, to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists products_audit_insert on public.products;
create trigger products_audit_insert
  after insert on public.products
  for each row execute function public.audit_product_insert();

create or replace function public.audit_product_update()
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
  if new.code is distinct from old.code then
    old_changes := jsonb_set(old_changes, '{code}', to_jsonb(old.code));
    changes := jsonb_set(changes, '{code}', to_jsonb(new.code));
  end if;
  if new.category is distinct from old.category then
    old_changes := jsonb_set(old_changes, '{category}', to_jsonb(old.category));
    changes := jsonb_set(changes, '{category}', to_jsonb(new.category));
  end if;
  if new.is_active is distinct from old.is_active then
    old_changes := jsonb_set(old_changes, '{is_active}', to_jsonb(old.is_active));
    changes := jsonb_set(changes, '{is_active}', to_jsonb(new.is_active));
  end if;

  if changes <> '{}'::jsonb then
    perform public.log_audit('UPDATE', 'product', new.id,
      case when old_changes = '{}'::jsonb then null else old_changes end,
      changes
    );
  end if;
  return new;
end;
$$;

drop trigger if exists products_audit_update on public.products;
create trigger products_audit_update
  after update on public.products
  for each row execute function public.audit_product_update();

create or replace function public.audit_product_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit('DELETE', 'product', old.id, to_jsonb(old), null);
  return old;
end;
$$;

drop trigger if exists products_audit_delete on public.products;
create trigger products_audit_delete
  after delete on public.products
  for each row execute function public.audit_product_delete();

-- -----------------------------------------------------------
-- 5. Enrich visit INSERT audit with all fields
--    Replaces the narrow trigger from 007
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
      'supervisor_id', new.supervisor_id,
      'refrigerator_id', new.refrigerator_id,
      'refrigerator_condition', new.refrigerator_condition,
      'cleanliness', new.cleanliness,
      'notes', new.notes,
      'latitude', new.latitude,
      'longitude', new.longitude,
      'visited_at', new.visited_at
    )
  );
  return new;
end;
$$;

-- -----------------------------------------------------------
-- 6. Customer & refrigerator photo reference tables + RLS + triggers
-- -----------------------------------------------------------

-- 6a. customer_photos table
create table if not exists public.customer_photos (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  bucket text not null,
  path text not null,
  public_url text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_photos_customer_id on public.customer_photos(customer_id);

alter table public.customer_photos enable row level security;

drop policy if exists "Customer photos readable by authenticated" on public.customer_photos;
create policy "Customer photos readable by authenticated"
  on public.customer_photos for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can add customer photos" on public.customer_photos;
create policy "Authenticated users can add customer photos"
  on public.customer_photos for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Owners or admins can delete customer photos" on public.customer_photos;
create policy "Owners or admins can delete customer photos"
  on public.customer_photos for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- 6b. refrigerator_photos table
create table if not exists public.refrigerator_photos (
  id uuid primary key default gen_random_uuid(),
  refrigerator_id uuid not null references public.refrigerators(id) on delete cascade,
  bucket text not null,
  path text not null,
  public_url text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_refrigerator_photos_refrigerator_id on public.refrigerator_photos(refrigerator_id);

alter table public.refrigerator_photos enable row level security;

drop policy if exists "Refrigerator photos readable by authenticated" on public.refrigerator_photos;
create policy "Refrigerator photos readable by authenticated"
  on public.refrigerator_photos for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can add refrigerator photos" on public.refrigerator_photos;
create policy "Authenticated users can add refrigerator photos"
  on public.refrigerator_photos for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Owners or admins can delete refrigerator photos" on public.refrigerator_photos;
create policy "Owners or admins can delete refrigerator photos"
  on public.refrigerator_photos for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- 6c. Audit triggers for customer_photos
create or replace function public.audit_customer_photo_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'photo_upload',
    'customer_photo',
    NEW.id,
    null,
    jsonb_build_object(
      'customer_id', NEW.customer_id,
      'path', NEW.path,
      'bucket', NEW.bucket
    )
  );
  return NEW;
end;
$$;

drop trigger if exists customer_photos_audit_insert on public.customer_photos;
create trigger customer_photos_audit_insert
  after insert on public.customer_photos
  for each row execute function public.audit_customer_photo_insert();

create or replace function public.audit_customer_photo_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'photo_delete',
    'customer_photo',
    OLD.id,
    jsonb_build_object(
      'customer_id', OLD.customer_id,
      'path', OLD.path,
      'bucket', OLD.bucket
    ),
    null
  );
  return OLD;
end;
$$;

drop trigger if exists customer_photos_audit_delete on public.customer_photos;
create trigger customer_photos_audit_delete
  after delete on public.customer_photos
  for each row execute function public.audit_customer_photo_delete();

-- 6d. Audit triggers for refrigerator_photos
create or replace function public.audit_refrigerator_photo_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'photo_upload',
    'refrigerator_photo',
    NEW.id,
    null,
    jsonb_build_object(
      'refrigerator_id', NEW.refrigerator_id,
      'path', NEW.path,
      'bucket', NEW.bucket
    )
  );
  return NEW;
end;
$$;

drop trigger if exists refrigerator_photos_audit_insert on public.refrigerator_photos;
create trigger refrigerator_photos_audit_insert
  after insert on public.refrigerator_photos
  for each row execute function public.audit_refrigerator_photo_insert();

create or replace function public.audit_refrigerator_photo_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'photo_delete',
    'refrigerator_photo',
    OLD.id,
    jsonb_build_object(
      'refrigerator_id', OLD.refrigerator_id,
      'path', OLD.path,
      'bucket', OLD.bucket
    ),
    null
  );
  return OLD;
end;
$$;

drop trigger if exists refrigerator_photos_audit_delete on public.refrigerator_photos;
create trigger refrigerator_photos_audit_delete
  after delete on public.refrigerator_photos
  for each row execute function public.audit_refrigerator_photo_delete();

-- -----------------------------------------------------------
-- 7. Auth event logging (LOGIN/LOGOUT from frontend)
--    SECURITY DEFINER so only this function can insert auth events.
--    Restricted to LOGIN/LOGOUT action types only.
-- -----------------------------------------------------------
create or replace function public.log_auth_event(action text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if action not in ('LOGIN', 'LOGOUT') then
    raise exception 'Invalid auth action: %', action;
  end if;
  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  values (
    auth.uid(),
    action,
    'auth',
    auth.uid(),
    jsonb_build_object(
      'email', coalesce((select email from auth.users where id = auth.uid()), ''),
      'at', now()
    )
  );
end;
$$;

grant execute on function public.log_auth_event(text) to authenticated;
