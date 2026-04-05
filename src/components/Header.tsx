import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import './Header.css'

export default function Header() {
  const { t } = useTranslation()

  return (
    <header
      className="header"
      style={{ backgroundImage: `url(/images/header-image.png)` }}
    >
      <nav className="header__nav">
        <Link to="/" className="header__logo">{t('nav.logo')}</Link>
        <div className="header__links">
          <Link to="/events" className="header__link">{t('nav.events')}</Link>
          <Link to="/lectures" className="header__link">{t('nav.lectures')}</Link>
          <Link to="/about-us" className="header__link">{t('nav.about')}</Link>
          <LanguageSwitcher />
        </div>
      </nav>

      <h1 className="header__title">
        <span className="header__title-bold">{t('header.title')}</span>
        <span className="header__title-light">{t('header.subtitle')}</span>
      </h1>

      <div className="header__description">
        <p className="header__tagline">{t('header.tagline')}</p>
        <p className="header__desc-text">{t('header.description')}</p>
      </div>
    </header>
  )
}
