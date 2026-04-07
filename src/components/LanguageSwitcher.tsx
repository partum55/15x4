import { useTranslation } from 'react-i18next'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const currentLang = i18n.language

  const toggleLanguage = () => {
    const newLang = currentLang === 'uk' ? 'en' : 'uk'
    i18n.changeLanguage(newLang)
  }

  return (
    <button 
      className="language-switcher" 
      onClick={toggleLanguage}
      aria-label="Switch language"
    >
      <span className={currentLang === 'uk' ? 'language-switcher__active' : ''}>
        {t('language.uk')}
      </span>
      <span className="language-switcher__separator">/</span>
      <span className={currentLang === 'en' ? 'language-switcher__active' : ''}>
        {t('language.en')}
      </span>
    </button>
  )
}
