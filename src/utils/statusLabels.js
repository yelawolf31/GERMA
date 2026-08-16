import { REFRIGERATOR_STATUSES, REFRIGERATOR_CONDITIONS, CLEANLINESS_LEVELS, CUSTOMER_STATUSES } from '../constants/statuses'

/**
 * Centralized translation keys for refrigerator statuses.
 * All components should use this instead of building keys dynamically.
 * This prevents raw keys from appearing when translations are missing.
 */
export const REFRIGERATOR_STATUS_KEYS = {
  [REFRIGERATOR_STATUSES.WORKING]: 'refrigerators.working',
  [REFRIGERATOR_STATUSES.NEEDS_MAINTENANCE]: 'refrigerators.needs_maintenance',
  [REFRIGERATOR_STATUSES.BROKEN]: 'refrigerators.broken',
  [REFRIGERATOR_STATUSES.REMOVED]: 'refrigerators.removed',
}

export const REFRIGERATOR_CONDITION_KEYS = {
  [REFRIGERATOR_CONDITIONS.WORKING]: 'refrigerators.working',
  [REFRIGERATOR_CONDITIONS.NEEDS_MAINTENANCE]: 'refrigerators.needs_maintenance',
  [REFRIGERATOR_CONDITIONS.BROKEN]: 'refrigerators.broken',
}

export const CLEANLINESS_KEYS = {
  [CLEANLINESS_LEVELS.GOOD]: 'visits.good',
  [CLEANLINESS_LEVELS.MEDIUM]: 'visits.medium',
  [CLEANLINESS_LEVELS.BAD]: 'visits.bad',
}

export const CUSTOMER_STATUS_KEYS = {
  [CUSTOMER_STATUSES.ACTIVE]: 'customers.active',
  [CUSTOMER_STATUSES.INACTIVE]: 'customers.inactive',
}

/**
 * Get the translation key for a refrigerator status.
 * Falls back to 'refrigerators.status' if the status is unknown.
 */
export function getRefrigeratorStatusKey(status) {
  return REFRIGERATOR_STATUS_KEYS[status] || 'refrigerators.status'
}

/**
 * Get the translation key for a refrigerator condition.
 */
export function getRefrigeratorConditionKey(condition) {
  return REFRIGERATOR_CONDITION_KEYS[condition] || 'refrigerators.status'
}

/**
 * Get the translation key for a cleanliness level.
 */
export function getCleanlinessKey(level) {
  return CLEANLINESS_KEYS[level] || 'visits.cleanliness'
}

/**
 * Get the translation key for a customer status.
 */
export function getCustomerStatusKey(status) {
  return CUSTOMER_STATUS_KEYS[status] || 'customers.status'
}
