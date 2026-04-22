'use client'

import i18n from 'i18next'
import { useEffect } from 'react'
import { initReactI18next, I18nextProvider } from 'react-i18next'
import uk from '../locales/uk.json'
import en from '../locales/en.json'

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: { uk: { translation: uk }, en: { translation: en } },
      lng: 'uk',
      fallbackLng: 'uk',
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    })
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = window.localStorage.getItem('i18nextLng')
    const nextLang = stored?.startsWith('en') ? 'en' : stored?.startsWith('uk') ? 'uk' : null
    if (nextLang && i18n.language !== nextLang) {
      void i18n.changeLanguage(nextLang)
    }
    if (nextLang) {
      document.cookie = `i18nextLng=${nextLang}; path=/; max-age=31536000; sameSite=lax`
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
