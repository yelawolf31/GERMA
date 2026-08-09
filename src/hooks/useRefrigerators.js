import { useCallback, useEffect, useState } from 'react'
import {
  fetchRefrigerators,
  fetchRefrigeratorsByCustomer,
  createRefrigerator,
  updateRefrigerator,
  updateRefrigeratorStatus,
  deleteRefrigerator,
} from '../services/refrigerators'

export function useRefrigerators() {
  const [refrigerators, setRefrigerators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchRefrigerators()
      setRefrigerators(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addRefrigerator = useCallback(async (payload) => {
    const created = await createRefrigerator(payload)
    setRefrigerators((prev) => [created, ...prev])
    return created
  }, [])

  const editRefrigerator = useCallback(async (id, payload) => {
    const updated = await updateRefrigerator(id, payload)
    setRefrigerators((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }, [])

  const changeStatus = useCallback(async (id, status) => {
    const updated = await updateRefrigeratorStatus(id, status)
    setRefrigerators((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }, [])

  const removeRefrigerator = useCallback(async (id) => {
    await deleteRefrigerator(id)
    setRefrigerators((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return {
    refrigerators,
    loading,
    error,
    refresh,
    addRefrigerator,
    editRefrigerator,
    changeStatus,
    removeRefrigerator,
    getByCustomer: fetchRefrigeratorsByCustomer,
  }
}
