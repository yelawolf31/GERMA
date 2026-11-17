-- ============================================================
-- 018_explicit_grants.sql
-- Explicit, least-privilege GRANTs for every public table and
-- the functions the client is allowed to call.
--
-- Why this migration exists:
--   Migration 001 used the blanket statement
--     grant all on all tables in schema public to anon, authenticated, service_role;
--   which (a) granted the anonymous role full table privileges and
--   (b) only applied to tables that existed at that moment.
--
--   Supabase's new default-privileges behaviour (effective
--   2026-10-30) no longer auto-exposes newly created tables to the
--   Data API roles. Tables therefore need explicit GRANTs, and the
--   legacy blanket grants to `anon` must be removed.
--
-- Principle:
--   - anon         : NO access to public tables/functions (login is
--                    done through GoTrue, not PostgREST).
--   - authenticated: only the verbs each table's RLS policies allow.
--   - service_role : only what the Edge Functions actually need.
--   Row Level Security remains the row-level boundary; these grants
--   are the statement-level boundary.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Remove the legacy blanket grants
-- -----------------------------------------------------------
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

-- Re-assert schema usage for the roles that legitimately need it.
grant usage on schema public to authenticated, service_role;

-- -----------------------------------------------------------
-- 2. Table grants (least privilege)
--    RLS policies (009/016) decide which rows/columns are visible.
-- -----------------------------------------------------------

-- profiles: read all (RLS: team directory), update own or admin.
grant select, update on public.profiles to authenticated;
-- Edge Functions (create-user/update-user) upsert profiles with the
-- service role. No DELETE: profiles are removed by FK cascade.
grant select, insert, update on public.profiles to service_role;

-- customers
grant select, insert, update, delete on public.customers to authenticated;
grant select on public.customers to service_role;

-- refrigerators
grant select, insert, update, delete on public.refrigerators to authenticated;
grant select on public.refrigerators to service_role;

-- visits (immutable: no UPDATE/DELETE policies exist)
grant select, insert on public.visits to authenticated;
grant select, insert on public.visits to service_role;

-- issues
grant select, insert, update, delete on public.issues to authenticated;
grant select on public.issues to service_role;

-- products
grant select, insert, update, delete on public.products to authenticated;
grant select on public.products to service_role;

-- audit_logs (read-only for clients; rows are written by SECURITY
-- DEFINER triggers only, never by the client)
grant select on public.audit_logs to authenticated;
grant select on public.audit_logs to service_role;

-- photo reference tables
grant select, insert, delete on public.visit_photos        to authenticated;
grant select, insert, delete on public.issue_photos        to authenticated;
grant select, insert, delete on public.customer_photos     to authenticated;
grant select, insert, delete on public.refrigerator_photos to authenticated;
grant select on public.visit_photos        to service_role;
grant select on public.issue_photos        to service_role;
grant select on public.customer_photos     to service_role;
grant select on public.refrigerator_photos to service_role;

-- client_warnings
grant select, insert, update, delete on public.client_warnings to authenticated;
grant select on public.client_warnings to service_role;

-- -----------------------------------------------------------
-- 3. Function execution grants
-- -----------------------------------------------------------
-- Helpers referenced directly inside RLS policies must be runnable
-- by the querying role.
grant execute on function public.current_user_role() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;

-- Client-callable RPC (frontend logs LOGIN/LOGOUT).
grant execute on function public.log_auth_event(text) to authenticated, service_role;

-- log_audit is trigger-only: never callable by clients.
revoke execute on function public.log_audit(text, text, uuid, jsonb, jsonb) from anon, authenticated;

-- Trigger / SECURITY DEFINER internals must not be client-callable.
revoke execute on function public.handle_new_user()                    from anon, authenticated;
revoke execute on function public.protect_profile_role()               from anon, authenticated;
revoke execute on function public.protect_refrigerator_update()        from anon, authenticated;
revoke execute on function public.set_updated_at()                     from anon, authenticated;

-- -----------------------------------------------------------
-- 4. Future objects: never auto-expose to anon
--    New tables must add their own explicit GRANTs + RLS, as this
--    migration does. Revoking the default keeps the anonymous role
--    out even if a future migration forgets a REVOKE.
-- -----------------------------------------------------------
alter default privileges for role postgres in schema public revoke all on tables    from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke all on functions from anon;
