'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'en' | 'nl'

type LanguageContextValue = {
  language: Language
  locale: string
  setLanguage: (language: Language) => void
}

const LANGUAGE_STORAGE_KEY = 'devhub-language'

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (saved === 'en' || saved === 'nl') {
      setLanguageState(saved)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    locale: language === 'nl' ? 'nl-NL' : 'en-US',
    setLanguage: setLanguageState,
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
