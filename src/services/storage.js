import { supabase } from '../lib/supabase'

export const BUCKETS = {
  VISIT_PHOTOS: 'visit-photos',
  ISSUE_PHOTOS: 'issue-photos',
  CUSTOMER_PHOTOS: 'customer-photos',
  REFRIGERATOR_PHOTOS: 'refrigerator-photos',
}

const BUCKET_NAMES = Object.values(BUCKETS)

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
 * Get the public URL for a storage path.
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl || ''
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
 */
export async function uploadVisitPhotos(visitId, files) {
  const records = []
  for (const file of files) {
    const path = await uploadFile(BUCKETS.VISIT_PHOTOS, visitId, file)
    const publicUrl = getPublicUrl(BUCKETS.VISIT_PHOTOS, path)
    const { data, error } = await supabase
      .from('visit_photos')
      .insert({ visit_id: visitId, bucket: BUCKETS.VISIT_PHOTOS, path, public_url: publicUrl })
      .select()
      .single()
    if (error) {
      // Roll back the uploaded file if the reference could not be saved
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
