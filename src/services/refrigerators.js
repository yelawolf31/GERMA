import { supabase } from '../lib/supabase'

const REFRIGERATOR_SELECT = `
  *,
  customer:customers(name, wilaya, commune, latitude, longitude, status)
`

export async function fetchRefrigerators({ customerId = null, search = null } = {}) {
  let query = supabase.from('refrigerators').select(REFRIGERATOR_SELECT).order('serial_number')

  if (customerId) query = query.eq('customer_id', customerId)
  if (search) query = query.or(`serial_number.ilike.%${search}%,model.ilike.%${search}%`)

  const { data, error } = await query
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
  const { data, error } = await supabase
    .from('refrigerators')
    .insert({
      customer_id: payload.customer_id,
      serial_number: payload.serial_number || null,
      model: payload.model || null,
      installation_date: payload.installation_date || null,
      status: payload.status || 'working',
      notes: payload.notes || null,
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
  const updates = {}
  if (payload.serial_number !== undefined) updates.serial_number = payload.serial_number
  if (payload.model !== undefined) updates.model = payload.model
  if (payload.installation_date !== undefined) updates.installation_date = payload.installation_date
  if (payload.notes !== undefined) updates.notes = payload.notes
  if (payload.status !== undefined) updates.status = payload.status

  const { data, error } = await supabase.from('refrigerators').update(updates).eq('id', id).select().single()
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
