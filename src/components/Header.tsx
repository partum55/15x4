import { useTranslation } from 'react-i18next'
import Navbar from './Navbar'
import './Header.css'

export default function Header() {
  const { t } = useTranslation()

  return (
    <header
      className="header"
      style={{ backgroundImage: `url(/images/header-image.png)` }}
    >
      <Navbar variant="dark" />

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
