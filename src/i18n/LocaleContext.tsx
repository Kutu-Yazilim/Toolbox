"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Locale, Translations } from "./index"
import { translations } from "./index"

type LocaleContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  t: translations.en,
})

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null
    if (stored && (stored === "en" || stored === "tr")) {
      setLocaleState(stored)
    } else {
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith("tr")) {
        setLocaleState("tr")
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("locale", l)
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
