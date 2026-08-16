import { supabase } from '../lib/supabase'

const CUSTOMER_SELECT = `
  *,
  created_by:profiles(id, full_name)
`

const VALID_STATUSES = ['active', 'inactive']
const MAX_STRING_LENGTH = 500

function sanitize(str) {
  if (typeof str !== 'string') return null
  const trimmed = str.trim()
  return trimmed.length > MAX_STRING_LENGTH ? trimmed.slice(0, MAX_STRING_LENGTH) : trimmed
}

function validateCustomerPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload')
  const sanitized = {}
  if (!partial || payload.name !== undefined) {
    const name = sanitize(payload.name)
    if (!name && !partial) throw new Error('Name is required')
    sanitized.name = name
  }
  if (payload.business_type !== undefined) sanitized.business_type = sanitize(payload.business_type)
  if (payload.phone !== undefined) sanitized.phone = sanitize(payload.phone)
  if (payload.address !== undefined) sanitized.address = sanitize(payload.address)
  if (payload.wilaya !== undefined) sanitized.wilaya = sanitize(payload.wilaya)
  if (payload.commune !== undefined) sanitized.commune = sanitize(payload.commune)
  if (payload.latitude !== undefined) {
    const lat = Number(payload.latitude)
    if (payload.latitude != null && (isNaN(lat) || lat < -90 || lat > 90)) throw new Error('Invalid latitude')
    sanitized.latitude = payload.latitude != null ? lat : null
  }
  if (payload.longitude !== undefined) {
    const lng = Number(payload.longitude)
    if (payload.longitude != null && (isNaN(lng) || lng < -180 || lng > 180)) throw new Error('Invalid longitude')
    sanitized.longitude = payload.longitude != null ? lng : null
  }
  if (payload.status !== undefined) {
    if (!VALID_STATUSES.includes(payload.status)) throw new Error('Invalid status')
    sanitized.status = payload.status
  }
  if (payload.notes !== undefined) sanitized.notes = sanitize(payload.notes)
  return sanitized
}

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
  const validated = validateCustomerPayload(payload)
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: validated.name,
      business_type: validated.business_type || null,
      phone: validated.phone || null,
      address: validated.address || null,
      wilaya: validated.wilaya || null,
      commune: validated.commune || null,
      latitude: validated.latitude ?? null,
      longitude: validated.longitude ?? null,
      status: validated.status || 'active',
      notes: validated.notes || null,
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
  const validated = validateCustomerPayload(payload, { partial: true })

  const { data, error } = await supabase.from('customers').update(validated).eq('id', id).select().single()
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
