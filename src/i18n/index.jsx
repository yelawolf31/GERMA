import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { fr } from './fr'
import { ar } from './ar'
import { en } from './en'

const translations = { fr, ar, en }
const SUPPORTED = ['fr', 'ar', 'en']

const TranslationContext = createContext(null)

function resolveKey(dict, key) {
  return key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dict)
}

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem('germa-lang')
      return SUPPORTED.includes(stored) ? stored : 'fr'
    } catch {
      return 'fr'
    }
  })

  const t = useCallback(
    (key, vars) => {
      const current = translations[language] || fr
      let value = resolveKey(current, key)
      if (value == null) value = resolveKey(fr, key)
      if (value == null) return key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replaceAll(`{${k}}`, v)
        })
      }
      return value
    },
    [language],
  )

  const changeLanguage = useCallback((lang) => {
    if (!SUPPORTED.includes(lang)) return
    setLanguage(lang)
    try {
      localStorage.setItem('germa-lang', lang)
    } catch {
      // ignore storage errors
    }
  }, [])

  const value = useMemo(
    () => ({ language, changeLanguage, t, dir: language === 'ar' ? 'rtl' : 'ltr' }),
    [language, changeLanguage, t],
  )

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) throw new Error('useTranslation must be used within TranslationProvider')
  return context
}
