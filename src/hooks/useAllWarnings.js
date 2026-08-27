import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAllWarnings } from '../services/warnings'

/**
 * Fetch all warnings across customers (active + dismissed).
 */
export function useAllWarnings() {
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllWarnings()
      setWarnings(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return useMemo(() => ({ warnings, loading, error, refresh }), [warnings, loading, error, refresh])
}