import { CUSTOMER_STATUSES, REFRIGERATOR_STATUSES, MARKER_COLORS } from '../constants/statuses'

export const MARKER_STATUS = {
  BROKEN: 'broken',
  NEEDS_MAINTENANCE: 'needs_maintenance',
  WORKING: 'working',
  NO_REFRIGERATOR: 'no_refrigerator',
  INACTIVE: 'inactive',
}

/**
 * Determine the marker status for a customer based on its refrigerators.
 *
 * Priority: inactive > broken > needs_maintenance > working > no refrigerator.
 *
 * A customer with any broken refrigerator is RED, even if it also has
 * working ones. Refrigerators with status "removed" are ignored.
 *
 * @param {{ status?: string }} customer
 * @param {Array<{ status?: string }>} refrigerators
 * @returns {string} one of MARKER_STATUS
 */
export function getCustomerMarkerStatus(customer, refrigerators = []) {
  if (!customer || customer.status === CUSTOMER_STATUSES.INACTIVE) {
    return MARKER_STATUS.INACTIVE
  }

  const activeRefrigerators = refrigerators.filter(
    (ref) => ref && ref.status !== REFRIGERATOR_STATUSES.REMOVED,
  )

  if (activeRefrigerators.some((ref) => ref.status === REFRIGERATOR_STATUSES.BROKEN)) {
    return MARKER_STATUS.BROKEN
  }
  if (activeRefrigerators.some((ref) => ref.status === REFRIGERATOR_STATUSES.NEEDS_MAINTENANCE)) {
    return MARKER_STATUS.NEEDS_MAINTENANCE
  }
  if (activeRefrigerators.length > 0) {
    return MARKER_STATUS.WORKING
  }
  return MARKER_STATUS.NO_REFRIGERATOR
}

/**
 * Get the hex color for a marker status.
 * @param {string} status one of MARKER_STATUS
 * @returns {string}
 */
export function getMarkerColor(status) {
  switch (status) {
    case MARKER_STATUS.BROKEN:
      return MARKER_COLORS.BROKEN
    case MARKER_STATUS.NEEDS_MAINTENANCE:
      return MARKER_COLORS.NEEDS_MAINTENANCE
    case MARKER_STATUS.WORKING:
      return MARKER_COLORS.WORKING
    case MARKER_STATUS.INACTIVE:
      return MARKER_COLORS.INACTIVE
    case MARKER_STATUS.NO_REFRIGERATOR:
    default:
      return MARKER_COLORS.NO_REFRIGERATOR
  }
}

/**
 * Return an ordered list of distinct statuses for a list of customers.
 */
export function summarizeMarkerStatuses(customers) {
  const counts = {}
  customers.forEach((customer) => {
    const status = customer.markerStatus || MARKER_STATUS.NO_REFRIGERATOR
    counts[status] = (counts[status] || 0) + 1
  })
  return counts
}
