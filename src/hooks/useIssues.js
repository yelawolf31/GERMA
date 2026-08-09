import { useCallback, useEffect, useState } from 'react'
import {
  fetchIssues,
  createIssue,
  updateIssue,
  deleteIssue,
  fetchOpenIssues,
} from '../services/issues'

export function useIssues() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchIssues()
      setIssues(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addIssue = useCallback(async (payload) => {
    const created = await createIssue(payload)
    setIssues((prev) => [created, ...prev])
    return created
  }, [])

  const editIssue = useCallback(async (id, payload) => {
    const updated = await updateIssue(id, payload)
    setIssues((prev) => prev.map((i) => (i.id === id ? updated : i)))
    return updated
  }, [])

  const removeIssue = useCallback(async (id) => {
    await deleteIssue(id)
    setIssues((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const queryIssues = useCallback(async (filters) => {
    return fetchIssues(filters)
  }, [])

  const loadOpenIssues = useCallback(async () => {
    return fetchOpenIssues()
  }, [])

  return {
    issues,
    loading,
    error,
    refresh,
    addIssue,
    editIssue,
    removeIssue,
    queryIssues,
    loadOpenIssues,
  }
}
