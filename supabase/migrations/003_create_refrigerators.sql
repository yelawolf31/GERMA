-- ============================================================
-- 003_create_refrigerators.sql
-- A refrigerator belongs to exactly one customer.
-- No GPS on refrigerators: location = customer location.
-- ============================================================

create table if not exists public.refrigerators (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  serial_number text,
  model text,
  status text not null default 'working'
    check (status in ('working', 'needs_maintenance', 'broken', 'removed')),
  installation_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null
);

create index if not exists refrigerators_customer_id_idx on public.refrigerators (customer_id);
create index if not exists refrigerators_serial_number_idx on public.refrigerators (serial_number);
create index if not exists refrigerators_status_idx on public.refrigerators (status);

drop trigger if exists refrigerators_set_updated_at on public.refrigerators;
create trigger refrigerators_set_updated_at
  before update on public.refrigerators
  for each row execute function public.set_updated_at();
