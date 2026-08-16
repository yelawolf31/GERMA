// ============================================================
// supabase/functions/create-user/index.ts
// Edge Function that lets an ADMIN create auth users.
// Called from the frontend (src/services/users.js) via
// supabase.functions.invoke('create-user').
//
// It uses the service role to:
//   1. verify the caller is an admin (profiles.role = 'admin'),
//   2. create the auth user (email confirmed),
//   3. upsert the linked profile row.
//
// Deploy:  supabase functions deploy create-user
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const ALLOWED_ROLES = ['admin', 'supervisor']
const PASSWORD_MIN_LENGTH = 8

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

  const email = String(raw.email ?? '').trim().toLowerCase()
  const password = String(raw.password ?? '')
  const full_name = String(raw.full_name ?? '').trim()
  const role = String(raw.role ?? '').trim()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Adresse email invalide' }
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères` }
  }
  if (!full_name) {
    return { error: 'Le nom complet est requis' }
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return { error: `Rôle invalide (autorisé : ${ALLOWED_ROLES.join(', ')})` }
  }

  return { value: { email, password, full_name, role } }
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
    console.error('create-user: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
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
  const { email, password, full_name, role } = input.value

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // --- 1. Verify the caller is an admin ----------------------
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

  // --- 2. Create the auth user (email auto-confirmed) ---------
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  })

  if (createError || !created?.user) {
    const message =
      createError?.message?.includes('already registered') || createError?.code === 'user_already_exists'
        ? 'Un compte existe déjà avec cet email'
        : createError?.message || "Échec de la création de l'utilisateur"
    return json({ error: message }, 400, corsHeaders)
  }

  // --- 3. Upsert the linked profile ---------------------------
  const { error: upsertError } = await adminClient.from('profiles').upsert(
    { id: created.user.id, full_name, email, role },
    { onConflict: 'id' }
  )

  if (upsertError) {
    console.error('create-user: profile upsert failed', upsertError.message)
  }

  return json({
    user_id: created.user.id,
    email: created.user.email,
    role,
  })
})
