import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES } from '../constants/roles'

const AuthContext = createContext(null)

async function fetchProfile(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) return null
  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null)
      return
    }
    const fetched = await fetchProfile(user.id)
    setProfile(fetched)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setInitialized(true)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return
      setSession(currentSession)
      if (currentSession?.user) await loadProfile(currentSession.user)
      setLoading(false)
      setInitialized(true)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      if (newSession?.user) loadProfile(newSession.user)
    })

    return () => {
      mounted = false
      subscription?.subscription?.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user)
  }, [session, loadProfile])

  const updateProfileName = useCallback(
    async (fullName) => {
      if (!session?.user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', session.user.id)
      if (error) throw new Error(error.message)
      await loadProfile(session.user)
    },
    [session, loadProfile],
  )

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      role: profile?.role || null,
      isAdmin: profile?.role === ROLES.ADMIN,
      isSupervisor: profile?.role === ROLES.SUPERVISOR,
      loading,
      initialized,
      signIn,
      signOut,
      refreshProfile,
      updateProfileName,
    }),
    [session, profile, loading, initialized, signIn, signOut, refreshProfile, updateProfileName],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
