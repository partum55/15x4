'use client'

import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const router = useRouter()
  const currentLang = i18n.language.startsWith('en') ? 'en' : 'uk'

  const toggleLanguage = () => {
    const newLang = currentLang === 'uk' ? 'en' : 'uk'
    window.localStorage.setItem('i18nextLng', newLang)
    void i18n.changeLanguage(newLang).then(() => {
      router.refresh()
    })
  }

  return (
    <button
      className="flex items-center gap-1 bg-transparent border-none font-sans text-[clamp(14px,1.4vw,20px)] text-inherit cursor-pointer px-2 py-1 transition-opacity duration-200 hover:opacity-70"
      onClick={toggleLanguage}
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
