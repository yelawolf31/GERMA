import { supabase } from '../lib/supabase'

const MAX_STRING_LENGTH = 500

function sanitize(str) {
  if (typeof str !== 'string') return null
  const trimmed = str.trim()
  return trimmed.length > MAX_STRING_LENGTH ? trimmed.slice(0, MAX_STRING_LENGTH) : trimmed
}

function validateProductPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload')
  return {
    name: sanitize(payload.name) || null,
    code: sanitize(payload.code),
    category: sanitize(payload.category),
    image_url: sanitize(payload.image_url),
    is_active: payload.is_active !== false,
  }
}

export async function fetchProducts({ activeOnly = true } = {}) {
  let query = supabase.from('products').select('*').order('name')
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function createProduct(payload) {
  const validated = validateProductPayload(payload)
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: validated.name,
      code: validated.code,
      category: validated.category,
      image_url: validated.image_url,
      is_active: validated.is_active,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProduct(id, payload) {
  const updates = {}
  if (payload.name !== undefined) updates.name = sanitize(payload.name)
  if (payload.code !== undefined) updates.code = sanitize(payload.code)
  if (payload.category !== undefined) updates.category = sanitize(payload.category)
  if (payload.image_url !== undefined) updates.image_url = sanitize(payload.image_url)
  if (payload.is_active !== undefined) updates.is_active = payload.is_active

  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}
