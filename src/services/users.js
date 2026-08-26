import { supabase } from '../lib/supabase'

/**
 * Create an auth user + profile via the Supabase Edge Function.
 * The edge function validates the caller's admin role using the service role.
 *
 * @param {{ email: string, password: string, full_name: string, role: string }} payload
 * @returns {Promise<{ user_id: string, email: string, role: string }>}
 */
export async function createUserByAdmin(payload) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,
      role: payload.role,
    },
  })
  if (error) throw new Error(error.message || "Échec de la création de l'utilisateur")
  if (data?.error) throw new Error(data.error)
  return data
}

/**
 * List users (profiles) — admin only via RLS + UI guard.
 */
export async function fetchUserProfiles() {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Fetch a single user profile by ID.
 */
export async function fetchUserProfile(id) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Update a user's profile via Edge Function (admin only).
 * Can update full_name and/or role.
 */
export async function updateUserByAdmin(userId, updates) {
  if (!supabase) throw new Error('Supabase non configuré')
  const body = { user_id: userId }
  if (updates.full_name !== undefined) body.full_name = updates.full_name
  if (updates.role !== undefined) body.role = updates.role
  const { data, error } = await supabase.functions.invoke('update-user', { body })
  if (error) throw new Error(error.message || 'Échec de la mise à jour')
  if (data?.error) throw new Error(data.error)
  return data
}

/**
 * Delete an auth user + profile via Edge Function (admin only).
 */
export async function deleteUserByAdmin(userId) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { user_id: userId },
  })
  if (error) throw new Error(error.message || 'Échec de la suppression')
  if (data?.error) throw new Error(data.error)
  return data
}

/**
 * Reset a user's password via Edge Function (admin only).
 */
export async function resetUserPassword(userId, newPassword) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase.functions.invoke('reset-password', {
    body: { user_id: userId, new_password: newPassword },
  })
  if (error) throw new Error(error.message || 'Échec de la réinitialisation')
  if (data?.error) throw new Error(data.error)
  return data
}

/**
 * Update a user's own profile (name).
 * Used by Settings page — uses client-side RLS (own profile only).
 */
export async function updateProfile(id, updates) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}
