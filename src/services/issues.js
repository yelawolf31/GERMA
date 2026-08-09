import { supabase } from '../lib/supabase'

const ISSUE_SELECT = `
  *,
  customer:customers(id, name, wilaya, commune, latitude, longitude),
  refrigerator:refrigerators(id, serial_number, model),
  reporter:profiles(id, full_name)
`

export async function fetchIssues({ status = null, priority = null, customerId = null } = {}) {
  let query = supabase.from('issues').select(ISSUE_SELECT).order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (customerId) query = query.eq('customer_id', customerId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchOpenIssues() {
  return fetchIssues({ status: 'open' })
}

/**
 * Create an issue. reported_by defaults to auth.uid() via RLS default.
 */
export async function createIssue(payload) {
  const { data, error } = await supabase
    .from('issues')
    .insert({
      customer_id: payload.customer_id,
      refrigerator_id: payload.refrigerator_id || null,
      issue_type: payload.issue_type,
      priority: payload.priority,
      description: payload.description || null,
      status: 'open',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Update issue status / details. Admin or (optionally) supervisor.
 */
export async function updateIssue(id, payload) {
  const updates = {}
  if (payload.status !== undefined) updates.status = payload.status
  if (payload.priority !== undefined) updates.priority = payload.priority
  if (payload.description !== undefined) updates.description = payload.description
  if (payload.issue_type !== undefined) updates.issue_type = payload.issue_type
  if (updates.status === 'resolved') updates.resolved_at = new Date().toISOString()

  const { data, error } = await supabase.from('issues').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteIssue(id) {
  const { error } = await supabase.from('issues').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}
