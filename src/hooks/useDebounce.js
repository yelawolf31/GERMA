import { useEffect, useState } from 'react'

/**
 * Debounce any changing value.
 * @param {*} value
 * @param {number} delay in ms
 * @returns {*} the debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
