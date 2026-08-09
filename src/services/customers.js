import { supabase } from '../lib/supabase'

const CUSTOMER_SELECT = `
  *,
  created_by:profiles(id, full_name)
`

export async function fetchCustomers({ search = null, status = null } = {}) {
  let query = supabase.from('customers').select(CUSTOMER_SELECT).order('name')

  if (search) query = query.ilike('name', `%${search}%`)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Fetch a single customer including creator name.
 */
export async function fetchCustomerById(id) {
  const { data, error } = await supabase
    .from('customers')
    .select(CUSTOMER_SELECT)
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Create a customer. Audit logging is handled by a DB trigger.
 */
export async function createCustomer(payload) {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: payload.name,
      business_type: payload.business_type || null,
      phone: payload.phone || null,
      address: payload.address || null,
      wilaya: payload.wilaya || null,
      commune: payload.commune || null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      status: payload.status || 'active',
      notes: payload.notes || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Update a customer. Admin only (RLS enforced).
 */
export async function updateCustomer(id, payload) {
  const updates = {}
  if (payload.name !== undefined) updates.name = payload.name
  if (payload.business_type !== undefined) updates.business_type = payload.business_type
  if (payload.phone !== undefined) updates.phone = payload.phone
  if (payload.address !== undefined) updates.address = payload.address
  if (payload.wilaya !== undefined) updates.wilaya = payload.wilaya
  if (payload.commune !== undefined) updates.commune = payload.commune
  if (payload.latitude !== undefined) updates.latitude = payload.latitude
  if (payload.longitude !== undefined) updates.longitude = payload.longitude
  if (payload.status !== undefined) updates.status = payload.status
  if (payload.notes !== undefined) updates.notes = payload.notes

  const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Delete a customer. Admin only (RLS enforced).
 */
export async function deleteCustomer(id) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}
