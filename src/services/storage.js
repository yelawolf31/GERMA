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
    const { data, error } = await supabase
      .from('issue_photos')
      .insert({ issue_id: issueId, bucket: BUCKETS.ISSUE_PHOTOS, path })
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
    const { data, error } = await supabase
      .from('customer_photos')
      .insert({ customer_id: customerId, bucket: BUCKETS.CUSTOMER_PHOTOS, path })
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
    const { data, error } = await supabase
      .from('refrigerator_photos')
      .insert({ refrigerator_id: refrigeratorId, bucket: BUCKETS.REFRIGERATOR_PHOTOS, path })
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

// ---------------------------------------------------------------------------
// Bulk cleanup helpers.
// Deleting an entity cascades its photo *rows* but never the binaries in
// Storage, so callers collect the paths first, delete the entity, then purge
// the files through the Storage API.
// ---------------------------------------------------------------------------

const REMOVE_BATCH_SIZE = 100

/** Split a list into fixed-size batches (PostgREST/Storage limits). */
export function chunkArray(items, size = REMOVE_BATCH_SIZE) {
  if (!Array.isArray(items) || size <= 0) return []
  const batches = []
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size))
  return batches
}

/** Group `{bucket, path}` records by bucket and de-duplicate paths. */
export function groupPhotoFilesByBucket(photos) {
  const grouped = {}
  for (const photo of photos || []) {
    if (!photo || !BUCKET_NAMES.includes(photo.bucket) || !photo.path) continue
    if (!grouped[photo.bucket]) grouped[photo.bucket] = []
    grouped[photo.bucket].push(photo.path)
  }
  for (const bucket of Object.keys(grouped)) {
    grouped[bucket] = [...new Set(grouped[bucket])]
  }
  return grouped
}

/**
 * Remove photo binaries from Storage. Best-effort: one failing batch never
 * blocks the others, and the caller's database delete has already happened.
 */
export async function purgePhotoFiles(photos) {
  const grouped = groupPhotoFilesByBucket(photos)
  let removed = 0
  for (const [bucket, paths] of Object.entries(grouped)) {
    for (const batch of chunkArray(paths)) {
      const { data, error } = await supabase.storage.from(bucket).remove(batch)
      if (error) continue
      removed += data?.length ?? batch.length
    }
  }
  return removed
}

async function selectIds(table, column, value) {
  const { data, error } = await supabase.from(table).select('id').eq(column, value)
  if (error) throw new Error(error.message)
  return (data || []).map((row) => row.id)
}

async function selectPhotoFiles(table, column, ids) {
  if (!ids || ids.length === 0) return []
  const files = []
  for (const batch of chunkArray(ids)) {
    const { data, error } = await supabase.from(table).select('bucket, path').in(column, batch)
    if (error) throw new Error(error.message)
    files.push(...(data || []))
  }
  return files
}

/** All photo files attached to a customer (including its visits/issues/fridges). */
export async function collectCustomerPhotoFiles(customerId) {
  const [customerPhotos, visitIds, issueIds, refrigeratorIds] = await Promise.all([
    selectPhotoFiles('customer_photos', 'customer_id', [customerId]),
    selectIds('visits', 'customer_id', customerId),
    selectIds('issues', 'customer_id', customerId),
    selectIds('refrigerators', 'customer_id', customerId),
  ])

  const [visitPhotos, issuePhotos, refrigeratorPhotos] = await Promise.all([
    selectPhotoFiles('visit_photos', 'visit_id', visitIds),
    selectPhotoFiles('issue_photos', 'issue_id', issueIds),
    selectPhotoFiles('refrigerator_photos', 'refrigerator_id', refrigeratorIds),
  ])

  return [...customerPhotos, ...visitPhotos, ...issuePhotos, ...refrigeratorPhotos]
}

/** Photo files attached to a refrigerator (its visits/issues are kept). */
export async function collectRefrigeratorPhotoFiles(refrigeratorId) {
  return selectPhotoFiles('refrigerator_photos', 'refrigerator_id', [refrigeratorId])
}

/** Photo files attached to an issue. */
export async function collectIssuePhotoFiles(issueId) {
  return selectPhotoFiles('issue_photos', 'issue_id', [issueId])
}

/** Admin-only: list Storage objects that no photo row references. */
export async function findOrphanPhotoFiles() {
  const { data, error } = await supabase.rpc('orphan_photo_objects')
  if (error) throw new Error(error.message)
  return data || []
}

/** Admin-only: delete Storage objects returned by findOrphanPhotoFiles(). */
export async function purgeOrphanPhotoFiles(objects) {
  const files = (objects || []).map((item) => ({ bucket: item.bucket_id, path: item.object_name }))
  return purgePhotoFiles(files)
}
