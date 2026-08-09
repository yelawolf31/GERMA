-- ============================================================
-- 009_create_rls_policies.sql
-- Row Level Security for every table.
-- The database itself enforces permissions; the UI only hides
-- what the database already rejects.
--
-- Summary:
--   profiles    : SELECT all authenticated; UPDATE own or admin
--   customers   : SELECT/INSERT all; UPDATE/DELETE admin
--   refrigerators: SELECT/INSERT all; status-only UPDATE for
--                  supervisor; full UPDATE/DELETE admin
--   visits      : SELECT/INSERT all; never UPDATE/DELETE
--   issues      : SELECT/INSERT all; UPDATE/DELETE admin
--   products    : SELECT all; UPDATE/DELETE admin
--   audit_logs  : SELECT admin only; no writes by clients
--   visit_photos / issue_photos: SELECT all; INSERT all;
--                  DELETE owner or admin
-- ============================================================

-- -----------------------------------------------------------
-- profiles
-- -----------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role is not distinct from old.role);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------
-- customers
-- -----------------------------------------------------------
alter table public.customers enable row level security;

drop policy if exists "Customers are readable by authenticated users" on public.customers;
create policy "Customers are readable by authenticated users"
  on public.customers for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create customers" on public.customers;
create policy "Authenticated users can create customers"
  on public.customers for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Admins can update customers" on public.customers;
create policy "Admins can update customers"
  on public.customers for update
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can delete customers" on public.customers;
create policy "Admins can delete customers"
  on public.customers for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------
-- refrigerators
-- -----------------------------------------------------------
alter table public.refrigerators enable row level security;

drop policy if exists "Refrigerators are readable by authenticated users" on public.refrigerators;
create policy "Refrigerators are readable by authenticated users"
  on public.refrigerators for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create refrigerators" on public.refrigerators;
create policy "Authenticated users can create refrigerators"
  on public.refrigerators for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Admins can update refrigerators" on public.refrigerators;
create policy "Admins can update refrigerators"
  on public.refrigerators for update
  to authenticated
  using (public.is_admin());

-- Supervisors may ONLY change `status`. Every other column must
-- remain identical to its old value, otherwise the row is rejected.
drop policy if exists "Supervisors can update refrigerator status" on public.refrigerators;
create policy "Supervisors can update refrigerator status"
  on public.refrigerators for update
  to authenticated
  using (not public.is_admin())
  with check (
    not public.is_admin()
    and status is distinct from old.status
    and customer_id = old.customer_id
    and serial_number is not distinct from old.serial_number
    and model is not distinct from old.model
    and installation_date is not distinct from old.installation_date
    and created_by is not distinct from old.created_by
    and created_at is not distinct from old.created_at
  );

drop policy if exists "Admins can delete refrigerators" on public.refrigerators;
create policy "Admins can delete refrigerators"
  on public.refrigerators for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------
-- visits (immutable: no update / delete policies)
-- -----------------------------------------------------------
alter table public.visits enable row level security;

drop policy if exists "Visits are readable by authenticated users" on public.visits;
create policy "Visits are readable by authenticated users"
  on public.visits for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create visits" on public.visits;
create policy "Authenticated users can create visits"
  on public.visits for insert
  to authenticated
  with check (supervisor_id = auth.uid());

-- -----------------------------------------------------------
-- issues
-- -----------------------------------------------------------
alter table public.issues enable row level security;

drop policy if exists "Issues are readable by authenticated users" on public.issues;
create policy "Issues are readable by authenticated users"
  on public.issues for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create issues" on public.issues;
create policy "Authenticated users can create issues"
  on public.issues for insert
  to authenticated
  with check (reported_by = auth.uid());

drop policy if exists "Admins can update issues" on public.issues;
create policy "Admins can update issues"
  on public.issues for update
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can delete issues" on public.issues;
create policy "Admins can delete issues"
  on public.issues for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------
-- products
-- -----------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "Products are readable by authenticated users" on public.products;
create policy "Products are readable by authenticated users"
  on public.products for select
  to authenticated
  using (true);

drop policy if exists "Admins can create products" on public.products;
create policy "Admins can create products"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------
-- audit_logs (admin read only; writes come from DB triggers)
-- -----------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------
-- visit_photos
-- -----------------------------------------------------------
alter table public.visit_photos enable row level security;

drop policy if exists "Visit photos are readable by authenticated users" on public.visit_photos;
create policy "Visit photos are readable by authenticated users"
  on public.visit_photos for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can add visit photos" on public.visit_photos;
create policy "Authenticated users can add visit photos"
  on public.visit_photos for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Owners or admins can delete visit photos" on public.visit_photos;
create policy "Owners or admins can delete visit photos"
  on public.visit_photos for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- -----------------------------------------------------------
-- issue_photos
-- -----------------------------------------------------------
alter table public.issue_photos enable row level security;

drop policy if exists "Issue photos are readable by authenticated users" on public.issue_photos;
create policy "Issue photos are readable by authenticated users"
  on public.issue_photos for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can add issue photos" on public.issue_photos;
create policy "Authenticated users can add issue photos"
  on public.issue_photos for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Owners or admins can delete issue photos" on public.issue_photos;
create policy "Owners or admins can delete issue photos"
  on public.issue_photos for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());
