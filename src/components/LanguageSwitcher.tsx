'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [switching, setSwitching] = useState(false)
  const currentLang = i18n.language.startsWith('en') ? 'en' : 'uk'

  const toggleLanguage = () => {
    if (switching) return
    const newLang = currentLang === 'uk' ? 'en' : 'uk'
    setSwitching(true)
    window.localStorage.setItem('i18nextLng', newLang)
    document.cookie = `i18nextLng=${newLang}; path=/; max-age=31536000; sameSite=lax`
    void i18n.changeLanguage(newLang).finally(() => {
      window.location.reload()
    })
  }

  return (
    <button
      type="button"
      className="flex items-center gap-1 bg-transparent border-none font-sans text-[clamp(14px,1.4vw,20px)] text-inherit cursor-pointer px-2 py-1 transition-opacity duration-200 hover:opacity-70 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
      onClick={toggleLanguage}
      disabled={switching}
      aria-busy={switching}
      aria-label="Switch language"
    >
      <span className={currentLang === 'uk' ? 'font-bold underline' : ''}>
        {t('language.uk')}
      </span>
      <span className="opacity-50">/</span>
      <span className={currentLang === 'en' ? 'font-bold underline' : ''}>
        {t('language.en')}
      </span>
    </button>
  )
}
