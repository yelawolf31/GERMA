/**
 * Count active (non-dismissed) warnings per customer.
 * @param {Array} warnings client_warnings rows
 * @returns {Object} { customerId: activeCount }
 */
export function countWarningsByCustomer(warnings) {
  const counts = {}
  for (const warning of warnings || []) {
    if (warning.dismissed) continue
    const id = warning.customer_id
    counts[id] = (counts[id] || 0) + 1
  }
  return counts
}