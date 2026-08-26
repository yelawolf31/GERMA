import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const ALLOWED_ROLES = ['admin', 'supervisor']

const ALLOWED_ORIGINS = [
  'https://germa-ebon.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
]

function getCorsHeaders(origin: string | null) {
  const allowed = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(body, status = 200, corsHeaders = getCorsHeaders(null), headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...headers },
  })
}

function validateInput(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Requête invalide' }
  }
  const user_id = String(raw.user_id ?? '').trim()
  const full_name = raw.full_name !== undefined ? String(raw.full_name).trim() : undefined
  const role = raw.role !== undefined ? String(raw.role).trim() : undefined

  if (!user_id) {
    return { error: 'Identifiant utilisateur requis' }
  }
  if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
    return { error: `Rôle invalide (autorisé : ${ALLOWED_ROLES.join(', ')})` }
  }
  if (full_name !== undefined && !full_name) {
    return { error: 'Le nom complet ne peut pas être vide' }
  }

  return { value: { user_id, full_name, role } }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Méthode non autorisée' }, 405, corsHeaders)
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('update-user: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
    return json({ error: 'Configuration du serveur manquante' }, 500, corsHeaders)
  }

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!jwt) {
    return json({ error: 'Non authentifié' }, 401, corsHeaders)
  }

  const input = validateInput(await req.json().catch(() => null))
  if (input.error) {
    return json({ error: input.error }, 400, corsHeaders)
  }
  const { user_id, full_name, role } = input.value

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: caller, error: callerError } = await adminClient.auth.getUser(jwt)
  if (callerError || !caller?.user) {
    return json({ error: 'Session invalide ou expirée' }, 401, corsHeaders)
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.user.id)
    .maybeSingle()

  if (profileError || profile?.role !== 'admin') {
    return json({ error: 'Accès refusé : administrateur requis' }, 403, corsHeaders)
  }

  const updates: Record<string, string> = {}
  if (full_name !== undefined) updates.full_name = full_name
  if (role !== undefined) updates.role = role

  if (Object.keys(updates).length === 0) {
    return json({ error: 'Aucun champ à modifier' }, 400, corsHeaders)
  }

  const { data: updated, error: updateError } = await adminClient
    .from('profiles')
    .update(updates)
    .eq('id', user_id)
    .select('id, full_name, email, role, created_at')
    .single()

  if (updateError) {
    return json({ error: updateError.message || 'Échec de la mise à jour' }, 400, corsHeaders)
  }

  return json({ profile: updated })
})
