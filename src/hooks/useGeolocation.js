import { useCallback, useState } from 'react'

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
}

/**
 * Geolocation helper with explicit error handling.
 * Returns { position, error, loading, getCurrentPosition, isSupported }.
 */
export function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const getCurrentPosition = useCallback(
    () =>
      new Promise((resolve) => {
        if (!isSupported) {
          setError({ code: 'unsupported', message: 'Geolocation not supported' })
          setLoading(false)
          resolve(null)
          return
        }
        setLoading(true)
        setError(null)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const nextPosition = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }
            setPosition(nextPosition)
            setLoading(false)
            resolve(nextPosition)
          },
          (err) => {
            const code =
              err.code === err.PERMISSION_DENIED
                ? 'permission_denied'
                : err.code === err.TIMEOUT
                  ? 'timeout'
                  : 'unavailable'
            setError({ code, message: err.message })
            setLoading(false)
            resolve(null)
          },
          { ...DEFAULT_OPTIONS, ...options },
        )
      }),
    [isSupported, options],
  )

  const clear = useCallback(() => {
    setPosition(null)
    setError(null)
  }, [])

  return { position, error, loading, getCurrentPosition, clear, isSupported }
}
