import { supabase } from '../lib/supabase'

export const BUCKETS = {
  VISIT_PHOTOS: 'visit-photos',
  ISSUE_PHOTOS: 'issue-photos',
  CUSTOMER_PHOTOS: 'customer-photos',
  REFRIGERATOR_PHOTOS: 'refrigerator-photos',
}

const BUCKET_NAMES = Object.values(BUCKETS)

const SIGNED_URL_EXPIRY = 3600

/**
 * Upload a file to a bucket. Returns the storage path.
 * @param {string} bucket
 * @param {string} folder e.g. "visit-id"
 * @param {File|Blob} file
 * @returns {Promise<string>} storage path
 */
export async function uploadFile(bucket, folder, file, onProgress) {
  if (!BUCKET_NAMES.includes(bucket)) throw new Error(`Bucket invalide: ${bucket}`)

  const extension = (file.name || 'photo').split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  if (onProgress) onProgress(100)
  return path
}

/**
 * Get the public URL for a storage path (non-visit buckets only).
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl || ''
}

/**
 * Create a short-lived signed URL for a private bucket path.
 * @param {string} bucket
 * @param {string} path
 * @param {number} expiry seconds
 * @returns {Promise<string>} signed URL
 */
export async function createSignedUrl(bucket, path, expiry = SIGNED_URL_EXPIRY) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiry)
  if (error) throw new Error(error.message)
  return data?.signedUrl || ''
}

/**
 * Create signed URLs for multiple photos (batch).
 * @param {Array<{bucket: string, path: string}>} photos
 * @param {number} expiry seconds
 * @returns {Promise<Map<string, string>>} path -> signedUrl
 */
export async function createSignedUrls(photos, expiry = SIGNED_URL_EXPIRY) {
  if (!photos.length) return new Map()

  const results = await Promise.allSettled(
    photos.map(async (photo) => {
      const url = await createSignedUrl(photo.bucket, photo.path, expiry)
      return { path: photo.path, url }
    }),
  )

  const urlMap = new Map()
  for (const result of results) {
    if (result.status === 'fulfilled') {
      urlMap.set(result.value.path, result.value.url)
    }
  }
  return urlMap
}

/**
 * Remove a file from a bucket.
 */
export async function removeFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(error.message)
  return true
}

/**
 * Upload one or more images for a visit, save references, return photo records.
 * Does not store public_url — signed URLs are generated on the fly.
 */
export async function uploadVisitPhotos(visitId, files) {
  const records = []
  for (const file of files) {
    const path = await uploadFile(BUCKETS.VISIT_PHOTOS, visitId, file)
    const { data, error } = await supabase
      .from('visit_photos')
      .insert({ visit_id: visitId, bucket: BUCKETS.VISIT_PHOTOS, path })
      .select()
      .single()
    if (error) {
      await removeFile(BUCKETS.VISIT_PHOTOS, path).catch(() => {})
      throw new Error(error.message)
    }
    records.push(data)
  }
  return records
}

export async function uploadIssuePhotos(issueId, files) {
  const records = []
  for (const file of files) {
    const path = await uploadFile(BUCKETS.ISSUE_PHOTOS, issueId, file)
    const publicUrl = getPublicUrl(BUCKETS.ISSUE_PHOTOS, path)
    const { data, error } = await supabase
      .from('issue_photos')
      .insert({ issue_id: issueId, bucket: BUCKETS.ISSUE_PHOTOS, path, public_url: publicUrl })
      .select()
      .single()
    if (error) {
      await removeFile(BUCKETS.ISSUE_PHOTOS, path).catch(() => {})
      throw new Error(error.message)
    }
    records.push(data)
  }
  return records
}

export async function fetchVisitPhotos(visitId) {
  const { data, error } = await supabase
    .from('visit_photos')
    .select('*')
    .eq('visit_id', visitId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchIssuePhotos(issueId) {
  const { data, error } = await supabase
    .from('issue_photos')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data || []
}

export async function deleteVisitPhoto(photoId, path) {
  await removeFile(BUCKETS.VISIT_PHOTOS, path)
  const { error } = await supabase.from('visit_photos').delete().eq('id', photoId)
  if (error) throw new Error(error.message)
  return true
}

export async function deleteIssuePhoto(photoId, path) {
  await removeFile(BUCKETS.ISSUE_PHOTOS, path)
  const { error } = await supabase.from('issue_photos').delete().eq('id', photoId)
  if (error) throw new Error(error.message)
  return true
}

export async function uploadCustomerPhotos(customerId, files) {
  const records = []
  for (const file of files) {
    const path = await uploadFile(BUCKETS.CUSTOMER_PHOTOS, customerId, file)
    const publicUrl = getPublicUrl(BUCKETS.CUSTOMER_PHOTOS, path)
    const { data, error } = await supabase
      .from('customer_photos')
      .insert({ customer_id: customerId, bucket: BUCKETS.CUSTOMER_PHOTOS, path, public_url: publicUrl })
      .select()
      .single()
    if (error) {
      await removeFile(BUCKETS.CUSTOMER_PHOTOS, path).catch(() => {})
      throw new Error(error.message)
    }
    records.push(data)
  }
  return records
}

export async function fetchCustomerPhotos(customerId) {
  const { data, error } = await supabase
    .from('customer_photos')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data || []
}

export async function deleteCustomerPhoto(photoId, path) {
  await removeFile(BUCKETS.CUSTOMER_PHOTOS, path)
  const { error } = await supabase.from('customer_photos').delete().eq('id', photoId)
  if (error) throw new Error(error.message)
  return true
}

export async function uploadRefrigeratorPhotos(refrigeratorId, files) {
  const records = []
  for (const file of files) {
    const path = await uploadFile(BUCKETS.REFRIGERATOR_PHOTOS, refrigeratorId, file)
    const publicUrl = getPublicUrl(BUCKETS.REFRIGERATOR_PHOTOS, path)
    const { data, error } = await supabase
      .from('refrigerator_photos')
      .insert({ refrigerator_id: refrigeratorId, bucket: BUCKETS.REFRIGERATOR_PHOTOS, path, public_url: publicUrl })
      .select()
      .single()
    if (error) {
      await removeFile(BUCKETS.REFRIGERATOR_PHOTOS, path).catch(() => {})
      throw new Error(error.message)
    }
    records.push(data)
  }
  return records
}

export async function fetchRefrigeratorPhotos(refrigeratorId) {
  const { data, error } = await supabase
    .from('refrigerator_photos')
    .select('*')
    .eq('refrigerator_id', refrigeratorId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data || []
}

export async function deleteRefrigeratorPhoto(photoId, path) {
  await removeFile(BUCKETS.REFRIGERATOR_PHOTOS, path)
  const { error } = await supabase.from('refrigerator_photos').delete().eq('id', photoId)
  if (error) throw new Error(error.message)
  return true
}
