import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import AccountMenu from './AccountMenu'
import './Navbar.css'

type NavbarProps = {
  variant?: 'light' | 'dark'
}

export default function Navbar({ variant = 'light' }: NavbarProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const links = [
    { to: '/events', label: t('nav.events') },
    { to: '/lectures', label: t('nav.lectures') },
    { to: '/about-us', label: t('nav.about') },
  ]

  return (
    <nav className={`navbar navbar--${variant}`}>
      <Link to="/" className="navbar__logo">{t('nav.logo')}</Link>
      <div className="navbar__links">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`navbar__link${pathname === to ? ' navbar__link--active' : ''}`}
          >
            {label}
          </Link>
        ))}
        <LanguageSwitcher />
        <AccountMenu variant={variant} />
      </div>
    </nav>
  )
}
