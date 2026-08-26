import { useCallback, useEffect, useState } from 'react'
import { fetchVisits, createVisit } from '../services/visits'

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

  return { visits, loading, error, refresh, addVisit, queryVisits }
}
