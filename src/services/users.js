import { supabase } from '../lib/supabase'

const EDGE_FUNCTION = 'create-user'

/**
 * Create an auth user + profile via the Supabase Edge Function.
 * The edge function validates the caller's admin role using the service role.
 *
 * @param {{ email: string, password: string, full_name: string, role: string }} payload
 * @returns {Promise<{ user_id: string, email: string, role: string }>}
 */
export async function createUserByAdmin(payload) {
  if (!supabase) throw new Error('Supabase non configuré')

  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION, {
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
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Update a user's profile (own name, or admin may update role).
 */
export async function updateProfile(id, updates) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}
