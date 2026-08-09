import { useCallback, useEffect, useState } from 'react'
import {
  fetchCustomers,
  fetchCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../services/customers'

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCustomers()
      setCustomers(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addCustomer = useCallback(async (payload) => {
    const created = await createCustomer(payload)
    setCustomers((prev) => [created, ...prev])
    return created
  }, [])

  const editCustomer = useCallback(async (id, payload) => {
    const updated = await updateCustomer(id, payload)
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }, [])

  const removeCustomer = useCallback(async (id) => {
    await deleteCustomer(id)
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return {
    customers,
    loading,
    error,
    refresh,
    addCustomer,
    editCustomer,
    removeCustomer,
    getById: fetchCustomerById,
  }
}
