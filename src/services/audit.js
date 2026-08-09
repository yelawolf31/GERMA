import { supabase } from '../lib/supabase'

const AUDIT_SELECT = `
  *,
  user:profiles(id, full_name)
`

/**
 * Fetch audit log entries (admin only — RLS enforced).
 */
export async function fetchAuditLogs({ limit = 100, entityType = null } = {}) {
  let query = supabase
    .from('audit_logs')
    .select(AUDIT_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entityType) query = query.eq('entity_type', entityType)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}
