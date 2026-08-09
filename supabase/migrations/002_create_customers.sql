-- ============================================================
-- 002_create_customers.sql
-- ============================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text,
  phone text,
  address text,
  wilaya text,
  commune text,
  latitude double precision
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  longitude double precision
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null
);

-- Frequently searched/filtered fields
create index if not exists customers_name_idx on public.customers (name);
create index if not exists customers_wilaya_idx on public.customers (wilaya);
create index if not exists customers_commune_idx on public.customers (commune);
create index if not exists customers_status_idx on public.customers (status);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();
