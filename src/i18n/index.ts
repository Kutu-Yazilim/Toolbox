import { en } from "./locales/en"
import { tr } from "./locales/tr"

export type Locale = "en" | "tr"
export type Translations = typeof en

export const translations: Record<Locale, Translations> = { en, tr }

export function getTranslations(locale: Locale): Translations {
  return translations[locale] ?? translations.en
}
