import imageCompression from 'browser-image-compression'

const DEFAULT_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.8,
}

/**
 * Compress an image file before upload to reduce storage usage.
 * Falls back to the original file if compression fails.
 * @param {File} file
 * @param {object} [options]
 * @returns {Promise<File>}
 */
export async function compressImage(file, options = {}) {
  try {
    const compressed = await imageCompression(file, { ...DEFAULT_OPTIONS, ...options })
    // Keep a sensible min size — don't downscale tiny files
    if (compressed.size >= file.size) return file
    return compressed
  } catch {
    return file
  }
}

/**
 * Create a client-side preview URL for a file.
 * @param {File} file
 * @returns {string}
 */
export function createObjectUrl(file) {
  return URL.createObjectURL(file)
}

/**
 * Release an object URL.
 */
export function revokeObjectUrl(url) {
  if (url) URL.revokeObjectURL(url)
}

/**
 * Convert a file to a data URL (used for simple canvas captures).
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
