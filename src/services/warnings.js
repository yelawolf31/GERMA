import { supabase } from '../lib/supabase'

/**
 * Fetch all warnings for a customer (active + dismissed), newest first.
 */
export async function fetchWarningsByCustomer(customerId) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase
    .from('client_warnings')
    .select('*, issued_by_user:profiles!client_warnings_issued_by_fkey(full_name), dismissed_by_user:profiles!client_warnings_dismissed_by_fkey(full_name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Count active (non-dismissed) warnings for a customer.
 */
export async function countActiveWarnings(customerId) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { count, error } = await supabase
    .from('client_warnings')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('dismissed', false)
  if (error) throw new Error(error.message)
  return count || 0
}

/**
 * Create a warning for a customer.
 */
export async function createWarning({ customer_id, visit_id, reason, issued_by }) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase
    .from('client_warnings')
    .insert({
      customer_id,
      visit_id: visit_id || null,
      reason,
      issued_by,
    })
    .select('*, issued_by_user:profiles!client_warnings_issued_by_fkey(full_name)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Dismiss a warning (admin only).
 */
export async function dismissWarning(warningId, dismissed_by) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase
    .from('client_warnings')
    .update({
      dismissed: true,
      dismissed_by,
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', warningId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Delete a warning (admin only).
 */
export async function deleteWarning(warningId) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { error } = await supabase
    .from('client_warnings')
    .delete()
    .eq('id', warningId)
  if (error) throw new Error(error.message)
}
