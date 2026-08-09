import { useCallback, useEffect, useState } from 'react'
import { fetchVisits, createVisit, fetchVisitStats } from '../services/visits'
import { startOfToday } from '../utils/format'

export function useVisits() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchVisits()
      setVisits(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addVisit = useCallback(async (payload) => {
    const created = await createVisit(payload)
    setVisits((prev) => [created, ...prev])
    return created
  }, [])

  const queryVisits = useCallback(async (filters) => {
    return fetchVisits(filters)
  }, [])

  const loadTodayStats = useCallback(async () => {
    return fetchVisitStats()
  }, [])

  return { visits, loading, error, refresh, addVisit, queryVisits, loadTodayStats }
}

/**
 * Count visits since start of today.
 */
export function countTodayVisits(visits) {
  const start = startOfToday()
  return visits.filter((visit) => new Date(visit.visited_at) >= start).length
}
