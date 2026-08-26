import { useCallback, useEffect, useState } from 'react'
import { fetchWarningsByCustomer, countActiveWarnings, createWarning, dismissWarning, deleteWarning } from '../services/warnings'

export function useWarnings(customerId) {
  const [warnings, setWarnings] = useState([])
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!customerId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const [list, count] = await Promise.all([
        fetchWarningsByCustomer(customerId),
        countActiveWarnings(customerId),
      ])
      setWarnings(list)
      setActiveCount(count)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => { refresh() }, [refresh])

  const addWarning = useCallback(async (payload) => {
    const created = await createWarning(payload)
    setWarnings((prev) => [created, ...prev])
    setActiveCount((prev) => prev + 1)
    return created
  }, [])

  const dismiss = useCallback(async (warningId, dismissed_by) => {
    await dismissWarning(warningId, dismissed_by)
    setWarnings((prev) => prev.map((w) => w.id === warningId ? { ...w, dismissed: true, dismissed_at: new Date().toISOString() } : w))
    setActiveCount((prev) => Math.max(0, prev - 1))
  }, [])

  const remove = useCallback(async (warningId) => {
    await deleteWarning(warningId)
    setWarnings((prev) => prev.filter((w) => w.id !== warningId))
    setActiveCount((prev) => Math.max(0, prev - 1))
  }, [])

  return { warnings, activeCount, loading, error, refresh, addWarning, dismiss, remove }
}
