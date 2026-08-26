import { supabase } from '../lib/supabase'

const AUDIT_SELECT = `
  *,
  user:profiles(id, full_name)
`

/**
 * Fetch audit log entries (admin only — RLS enforced).
 * Supports filtering and pagination.
 */
export async function fetchAuditLogs({
  limit = 20,
  offset = 0,
  entityType = null,
  action = null,
  userId = null,
  dateFrom = null,
  dateTo = null,
  search = null,
} = {}) {
  let query = supabase
    .from('audit_logs')
    .select(AUDIT_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (entityType) query = query.eq('entity_type', entityType)
  if (action) query = query.eq('action', action)
  if (userId) query = query.eq('user_id', userId)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) {
    const end = new Date(dateTo)
    end.setUTCHours(23, 59, 59, 999)
    query = query.lte('created_at', end.toISOString())
  }
  if (search) {
    query = query.or(`entity_id.eq.${search},new_data->>'email'.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { logs: data || [], total: count || 0 }
}
