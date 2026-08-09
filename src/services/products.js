import { supabase } from '../lib/supabase'

export async function fetchProducts({ activeOnly = true } = {}) {
  let query = supabase.from('products').select('*').order('name')
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function createProduct(payload) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: payload.name,
      code: payload.code || null,
      category: payload.category || null,
      image_url: payload.image_url || null,
      is_active: payload.is_active !== false,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}
