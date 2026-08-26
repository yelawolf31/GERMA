export const VALID_LATITUDE_RANGE = { min: -90, max: 90 }
export const VALID_LONGITUDE_RANGE = { min: -180, max: 180 }

export function required(value) {
  return value != null && String(value).trim().length > 0
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isPhone(value) {
  if (!value) return true
  const cleaned = String(value).replace(/[\s\-().]/g, '')
  return /^\+?\d{8,15}$/.test(cleaned)
}

export function isLatitude(value) {
  const num = Number(value)
  return !Number.isNaN(num) && num >= VALID_LATITUDE_RANGE.min && num <= VALID_LATITUDE_RANGE.max
}

export function isLongitude(value) {
  const num = Number(value)
  return !Number.isNaN(num) && num >= VALID_LONGITUDE_RANGE.min && num <= VALID_LONGITUDE_RANGE.max
}

export function isCoordinate(latitude, longitude) {
  return isLatitude(latitude) && isLongitude(longitude)
}

/**
 * Validate a customer form.
 * @returns {{ valid: boolean, errors: Record<string,string> }}
 */
export function validateCustomer(form, t) {
  const errors = {}
  if (!required(form.name)) errors.name = t('common.required')
  if (!required(form.wilaya)) errors.wilaya = t('common.required')
  if (!required(form.commune)) errors.commune = t('common.required')
  if (form.phone && !isPhone(form.phone)) errors.phone = t('common.invalidPhone')
  if (form.latitude != null && form.latitude !== '' && !isLatitude(form.latitude)) {
    errors.latitude = t('common.required')
  }
  if (form.longitude != null && form.longitude !== '' && !isLongitude(form.longitude)) {
    errors.longitude = t('common.required')
  }
  if ((form.latitude == null || form.latitude === '') && (form.longitude == null || form.longitude === '')) {
    // location can be empty on purpose; a warning is shown but it is not a hard failure
  } else if (!isCoordinate(form.latitude, form.longitude)) {
    errors.latitude = t('customers.locationRequired')
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate a refrigerator form.
 */
export function validateRefrigerator(form, t) {
  const errors = {}
  if (!required(form.customer_id)) errors.customer_id = t('common.required')
  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate a visit form.
 */
export function validateVisit(form, t) {
  const errors = {}
  if (!required(form.refrigerator_condition)) errors.refrigerator_condition = t('common.required')
  if (!required(form.cleanliness)) errors.cleanliness = t('common.required')
  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate an issue form.
 */
export function validateIssue(form, t) {
  const errors = {}
  if (!required(form.customer_id)) errors.customer_id = t('common.required')
  if (!required(form.issue_type)) errors.issue_type = t('common.required')
  if (!required(form.priority)) errors.priority = t('common.required')
  if (!required(form.description)) errors.description = t('common.required')
  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate the login form.
 */
export function validateLogin(form, t) {
  const errors = {}
  if (!required(form.email)) errors.email = t('common.required')
  else if (!isEmail(form.email)) errors.email = t('common.invalidEmail')
  if (!required(form.password)) errors.password = t('common.required')
  return { valid: Object.keys(errors).length === 0, errors }
}
