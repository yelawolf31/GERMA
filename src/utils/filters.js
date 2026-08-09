import { CUSTOMER_STATUSES, REFRIGERATOR_STATUSES } from '../constants/statuses'
import { isToday, startOfDaysAgo, isTodayOrAfter } from './format'

export const VISIT_FILTERS = {
  VISITED_TODAY: 'visited_today',
  NOT_VISITED_TODAY: 'not_visited_today',
  NOT_VISITED_7_DAYS: 'not_visited_7_days',
}

export function createDefaultMapFilters() {
  return {
    refrigeratorStatus: [],
    customerStatus: [],
    visits: [],
    hasOpenIssues: false,
  }
}

/**
 * A customer is considered to match a refrigerator-status filter if any of its
 * refrigerators has one of the selected statuses. If none are selected, the
 * filter is ignored.
 */
function matchesRefrigeratorStatus(customer, selected) {
  if (!selected || selected.length === 0) return true
  if (!customer.refrigerators || customer.refrigerators.length === 0) return false
  return customer.refrigerators.some((ref) => selected.includes(ref.status))
}

/**
 * A customer matches a customer-status filter if its own status is in the
 * selected list. If none are selected, the filter is ignored.
 */
function matchesCustomerStatus(customer, selected) {
  if (!selected || selected.length === 0) return true
  return selected.includes(customer.status)
}

function matchesVisits(customer, selected) {
  if (!selected || selected.length === 0) return true
  const lastVisit = customer.lastVisitAt

  // A customer "visited today" has a visit today. All other visit filters
  // refer to customers that have not been visited today.
  if (selected.includes(VISIT_FILTERS.VISITED_TODAY) && isToday(lastVisit)) return true
  if (selected.includes(VISIT_FILTERS.NOT_VISITED_TODAY) && !isToday(lastVisit)) return true
  if (
    selected.includes(VISIT_FILTERS.NOT_VISITED_7_DAYS) &&
    (!lastVisit || !isTodayOrAfter(startOfDaysAgo(7)) || new Date(lastVisit) < startOfDaysAgo(7))
  ) {
    return true
  }
  return false
}

function matchesOpenIssues(customer, hasOpenIssues) {
  if (!hasOpenIssues) return true
  return (customer.openIssueCount || 0) > 0
}

/**
 * Apply all map filters to a list of customers (AND semantics).
 * @param {Array} customers each with `.refrigerators`, `.lastVisitAt`, `.openIssueCount`
 * @param {object} filters from createDefaultMapFilters()
 * @returns {Array}
 */
export function applyCustomerFilters(customers, filters) {
  if (!filters) return customers
  return customers.filter((customer) => {
    if (!matchesRefrigeratorStatus(customer, filters.refrigeratorStatus)) return false
    if (!matchesCustomerStatus(customer, filters.customerStatus)) return false
    if (!matchesVisits(customer, filters.visits)) return false
    if (!matchesOpenIssues(customer, filters.hasOpenIssues)) return false
    return true
  })
}

/**
 * Search a customer by name, phone, address, wilaya, commune or any of its
 * refrigerator serial numbers.
 * @returns {boolean}
 */
export function matchesCustomerSearch(customer, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true

  const haystack = [
    customer.name,
    customer.phone,
    customer.address,
    customer.wilaya,
    customer.commune,
    ...(customer.refrigerators || []).map((ref) => ref.serial_number),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())

  return haystack.some((value) => value.includes(q))
}

/**
 * Filter and search customers. Applies filters then search.
 */
export function filterAndSearchCustomers(customers, filters, query) {
  return applyCustomerFilters(customers, filters).filter((customer) =>
    matchesCustomerSearch(customer, query),
  )
}

export { CUSTOMER_STATUSES, REFRIGERATOR_STATUSES }
