-- ============================================================
-- 004_create_visits.sql
-- A visit is immutable once recorded (no UPDATE/DELETE policies).
-- latitude/longitude = the supervisor's location at record time.
-- ============================================================

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  supervisor_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  visited_at timestamptz not null default now(),
  refrigerator_condition text
    check (refrigerator_condition in ('working', 'needs_maintenance', 'broken')),
  cleanliness text
    check (cleanliness in ('good', 'medium', 'bad')),
  notes text,
  latitude double precision
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  longitude double precision
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  created_at timestamptz not null default now()
);

create index if not exists visits_customer_id_idx on public.visits (customer_id);
create index if not exists visits_supervisor_id_idx on public.visits (supervisor_id);
create index if not exists visits_visited_at_idx on public.visits (visited_at);
