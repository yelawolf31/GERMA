-- ============================================================
-- 005_create_issues.sql
-- ============================================================

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  refrigerator_id uuid references public.refrigerators (id) on delete set null,
  reported_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  issue_type text not null
    check (issue_type in (
      'cooling_problem',
      'electrical_problem',
      'door_problem',
      'lighting_problem',
      'cleanliness_problem',
      'other'
    )),
  priority text not null
    check (priority in ('low', 'medium', 'high', 'critical')),
  description text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists issues_customer_id_idx on public.issues (customer_id);
create index if not exists issues_refrigerator_id_idx on public.issues (refrigerator_id);
create index if not exists issues_status_idx on public.issues (status);
create index if not exists issues_priority_idx on public.issues (priority);

drop trigger if exists issues_set_updated_at on public.issues;
create trigger issues_set_updated_at
  before update on public.issues
  for each row execute function public.set_updated_at();
