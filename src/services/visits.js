import { supabase } from '../lib/supabase'

const VISIT_SELECT = `
  *,
  customer:customers(id, name, wilaya, commune),
  supervisor:profiles(id, full_name)
`

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
  const { data, error } = await supabase
    .from('visits')
    .insert({
      customer_id: payload.customer_id,
      visited_at: payload.visited_at || new Date().toISOString(),
      refrigerator_condition: payload.refrigerator_condition,
      cleanliness: payload.cleanliness,
      notes: payload.notes || null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
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
