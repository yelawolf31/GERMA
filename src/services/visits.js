import { supabase } from '../lib/supabase'

const VISIT_SELECT = `
  *,
  customer:customers(id, name, wilaya, commune),
  supervisor:profiles(id, full_name)
`

const VALID_CONDITIONS = ['good', 'medium', 'bad']
const VALID_CLEANLINESS = ['good', 'medium', 'bad']
const MAX_STRING_LENGTH = 500

function sanitize(str) {
  if (typeof str !== 'string') return null
  const trimmed = str.trim()
  return trimmed.length > MAX_STRING_LENGTH ? trimmed.slice(0, MAX_STRING_LENGTH) : trimmed
}

function validateVisitPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload')
  if (!payload.customer_id) throw new Error('Customer is required')
  if (payload.refrigerator_condition && !VALID_CONDITIONS.includes(payload.refrigerator_condition)) {
    throw new Error('Invalid refrigerator condition')
  }
  if (payload.cleanliness && !VALID_CLEANLINESS.includes(payload.cleanliness)) {
    throw new Error('Invalid cleanliness value')
  }
  if (payload.latitude != null) {
    const lat = Number(payload.latitude)
    if (isNaN(lat) || lat < -90 || lat > 90) throw new Error('Invalid latitude')
  }
  if (payload.longitude != null) {
    const lng = Number(payload.longitude)
    if (isNaN(lng) || lng < -180 || lng > 180) throw new Error('Invalid longitude')
  }
  return {
    customer_id: payload.customer_id,
    visited_at: payload.visited_at || new Date().toISOString(),
    refrigerator_condition: payload.refrigerator_condition,
    cleanliness: payload.cleanliness,
    notes: sanitize(payload.notes),
    latitude: payload.latitude != null ? Number(payload.latitude) : null,
    longitude: payload.longitude != null ? Number(payload.longitude) : null,
  }
}

export async function fetchVisits({ customerId = null, supervisorId = null, from = null, to = null } = {}) {
  let query = supabase.from('visits').select(VISIT_SELECT).order('visited_at', { ascending: false })

  if (customerId) query = query.eq('customer_id', customerId)
  if (supervisorId) query = query.eq('supervisor_id', supervisorId)
  if (from) query = query.gte('visited_at', from.toISOString())
  if (to) query = query.lte('visited_at', to.toISOString())

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Create a visit. The current user is set as supervisor via RLS default
 * (supervisor_id defaults to auth.uid()). Audit is DB-triggered.
 */
export async function createVisit(payload) {
  const validated = validateVisitPayload(payload)
  const { data, error } = await supabase
    .from('visits')
    .insert({
      customer_id: validated.customer_id,
      visited_at: validated.visited_at,
      refrigerator_condition: validated.refrigerator_condition,
      cleanliness: validated.cleanliness,
      notes: validated.notes,
      latitude: validated.latitude,
      longitude: validated.longitude,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Fetch visits for the dashboard (grouped counts).
 */
export async function fetchVisitStats() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('visits')
    .select('id, supervisor_id, visited_at')
    .gte('visited_at', start.toISOString())
  if (error) throw new Error(error.message)
  return data || []
}

const VISIT_DETAIL_SELECT = `
  *,
  customer:customers(id, name, phone, wilaya, commune, latitude, longitude),
  supervisor:profiles(id, full_name)
`

export async function fetchVisitById(id) {
  if (!id) throw new Error('Visit ID is required')
  const { data, error } = await supabase
    .from('visits')
    .select(VISIT_DETAIL_SELECT)
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}
