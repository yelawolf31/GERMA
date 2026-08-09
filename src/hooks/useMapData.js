import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCustomerMarkerStatus, getMarkerColor } from '../utils/markerStatus'
import { startOfDaysAgo } from '../utils/format'

/**
 * Fetch and assemble enriched customer data for the map and dashboard:
 * each customer gains `refrigerators`, `lastVisitAt`, `openIssueCount`,
 * `markerStatus` and `markerColor`.
 */
export function useMapData() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [customerResult, refrigResult, visitResult, issueResult] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('refrigerators').select('id, customer_id, serial_number, model, status'),
        supabase.from('visits').select('id, customer_id, visited_at').gte('visited_at', startOfDaysAgo(90).toISOString()),
        supabase.from('issues').select('id, customer_id, status'),
      ])

      if (customerResult.error) throw new Error(customerResult.error.message)
      if (refrigResult.error) throw new Error(refrigResult.error.message)
      if (visitResult.error) throw new Error(visitResult.error.message)
      if (issueResult.error) throw new Error(issueResult.error.message)

      const refrigeratorsByCustomer = {}
      refrigResult.data.forEach((ref) => {
        ;(refrigeratorsByCustomer[ref.customer_id] ||= []).push(ref)
      })

      const lastVisitByCustomer = {}
      visitResult.data.forEach((visit) => {
        const current = lastVisitByCustomer[visit.customer_id]
        if (!current || new Date(visit.visited_at) > new Date(current)) {
          lastVisitByCustomer[visit.customer_id] = visit.visited_at
        }
      })

      const openIssuesByCustomer = {}
      issueResult.data
        .filter((issue) => issue.status === 'open' || issue.status === 'in_progress')
        .forEach((issue) => {
          openIssuesByCustomer[issue.customer_id] = (openIssuesByCustomer[issue.customer_id] || 0) + 1
        })

      const enriched = customerResult.data.map((customer) => {
        const customerRefrigerators = refrigeratorsByCustomer[customer.id] || []
        const markerStatus = getCustomerMarkerStatus(customer, customerRefrigerators)
        return {
          ...customer,
          refrigerators: customerRefrigerators,
          lastVisitAt: lastVisitByCustomer[customer.id] || null,
          openIssueCount: openIssuesByCustomer[customer.id] || 0,
          markerStatus,
          markerColor: getMarkerColor(markerStatus),
        }
      })

      setCustomers(enriched)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return useMemo(() => ({ customers, loading, error, refresh }), [customers, loading, error, refresh])
}
