import { supabase } from '../lib/supabase'

const REFRIGERATOR_SELECT = `
  *,
  customer:customers(name, wilaya, commune, latitude, longitude, status)
`

const VALID_STATUSES = ['working', 'needs_maintenance', 'broken', 'removed']
const MAX_STRING_LENGTH = 500

function sanitize(str) {
  if (typeof str !== 'string') return null
  const trimmed = str.trim()
  return trimmed.length > MAX_STRING_LENGTH ? trimmed.slice(0, MAX_STRING_LENGTH) : trimmed
}

function validateRefrigeratorPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload')
  const sanitized = {}
  if (!partial || payload.customer_id !== undefined) {
    if (!payload.customer_id && !partial) throw new Error('Customer is required')
    sanitized.customer_id = payload.customer_id
  }
  if (payload.serial_number !== undefined) sanitized.serial_number = sanitize(payload.serial_number)
  if (payload.model !== undefined) sanitized.model = sanitize(payload.model)
  if (payload.installation_date !== undefined) sanitized.installation_date = payload.installation_date
  if (payload.notes !== undefined) sanitized.notes = sanitize(payload.notes)
  if (payload.status !== undefined) {
    if (!VALID_STATUSES.includes(payload.status)) throw new Error('Invalid status')
    sanitized.status = payload.status
  }
  return sanitized
}

export async function fetchRefrigerators({ customerId = null, search = null } = {}) {
  let query = supabase.from('refrigerators').select(REFRIGERATOR_SELECT).order('serial_number')

  if (customerId) query = query.eq('customer_id', customerId)
  if (search) query = query.or(`serial_number.ilike.%${search}%,model.ilike.%${search}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Lightweight global search across refrigerators (serial number or model).
 */
export async function searchRefrigerators(query, limit = 6) {
  const q = (query || '').trim()
  if (!q) return []
  const { data, error } = await supabase
    .from('refrigerators')
    .select('id, serial_number, model, status, customer:customers(id, name)')
    .or(`serial_number.ilike.%${q}%,model.ilike.%${q}%`)
    .order('serial_number')
    .limit(limit)
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchRefrigeratorsByCustomer(customerId) {
  const { data, error } = await supabase
    .from('refrigerators')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchRefrigeratorById(id) {
  const { data, error } = await supabase
    .from('refrigerators')
    .select(REFRIGERATOR_SELECT)
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Create a refrigerator. Audit logging is handled by a DB trigger.
 */
export async function createRefrigerator(payload) {
  const validated = validateRefrigeratorPayload(payload)
  const { data, error } = await supabase
    .from('refrigerators')
    .insert({
      customer_id: validated.customer_id,
      serial_number: validated.serial_number || null,
      model: validated.model || null,
      installation_date: validated.installation_date || null,
      status: validated.status || 'working',
      notes: validated.notes || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Update non-status fields. Admin only (RLS enforced).
 */
export async function updateRefrigerator(id, payload) {
  const validated = validateRefrigeratorPayload(payload, { partial: true })

  const { data, error } = await supabase.from('refrigerators').update(validated).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Change only the refrigerator status. Allowed for supervisor and admin.
 * Audit logging is handled by a DB trigger.
 */
export async function updateRefrigeratorStatus(id, status) {
  const { data, error } = await supabase
    .from('refrigerators')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteRefrigerator(id) {
  const { error } = await supabase.from('refrigerators').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

/**
 * Build a map from refrigerator id -> customer id (or null).
 */
export function mapRefrigeratorToCustomer(refrigerators) {
  const map = {}
  refrigerators.forEach((ref) => {
    map[ref.customer_id] = map[ref.customer_id] || []
    map[ref.customer_id].push(ref)
  })
  return map
}
