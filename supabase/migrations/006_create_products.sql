-- ============================================================
-- 006_create_products.sql
-- Standalone catalog of Germa products.
-- IMPORTANT: no relationship to customers in this version.
-- ============================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  category text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_code_idx on public.products (code);
create index if not exists products_is_active_idx on public.products (is_active);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
