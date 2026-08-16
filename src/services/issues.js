import { supabase } from '../lib/supabase'

const ISSUE_SELECT = `
  *,
  customer:customers(id, name, wilaya, commune, latitude, longitude),
  refrigerator:refrigerators(id, serial_number, model),
  reporter:profiles(id, full_name)
`

const VALID_TYPES = ['cooling_problem', 'electrical_problem', 'door_problem', 'lighting_problem', 'cleanliness_problem', 'other']
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical']
const VALID_STATUSES = ['open', 'in_progress', 'resolved']
const MAX_STRING_LENGTH = 500

function sanitize(str) {
  if (typeof str !== 'string') return null
  const trimmed = str.trim()
  return trimmed.length > MAX_STRING_LENGTH ? trimmed.slice(0, MAX_STRING_LENGTH) : trimmed
}

function validateIssuePayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload')
  const sanitized = {}
  if (!partial || payload.customer_id !== undefined) {
    if (!payload.customer_id && !partial) throw new Error('Customer is required')
    sanitized.customer_id = payload.customer_id
  }
  if (payload.refrigerator_id !== undefined) sanitized.refrigerator_id = payload.refrigerator_id || null
  if (payload.issue_type !== undefined) {
    if (!VALID_TYPES.includes(payload.issue_type) && !partial) throw new Error('Invalid issue type')
    sanitized.issue_type = payload.issue_type
  }
  if (payload.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(payload.priority) && !partial) throw new Error('Invalid priority')
    sanitized.priority = payload.priority
  }
  if (payload.status !== undefined) {
    if (!VALID_STATUSES.includes(payload.status)) throw new Error('Invalid status')
    sanitized.status = payload.status
  }
  if (payload.description !== undefined) sanitized.description = sanitize(payload.description)
  return sanitized
}

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
  const validated = validateIssuePayload(payload)
  const { data, error } = await supabase
    .from('issues')
    .insert({
      customer_id: validated.customer_id,
      refrigerator_id: validated.refrigerator_id || null,
      issue_type: validated.issue_type,
      priority: validated.priority,
      description: validated.description || null,
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
  const validated = validateIssuePayload(payload, { partial: true })
  if (validated.status === 'resolved') validated.resolved_at = new Date().toISOString()

  const { data, error } = await supabase.from('issues').update(validated).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteIssue(id) {
  const { error } = await supabase.from('issues').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}
