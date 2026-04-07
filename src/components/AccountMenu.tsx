import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCurrentUser, logout } from '../auth'
import './AccountMenu.css'

type AccountMenuProps = {
  variant?: 'light' | 'dark'
}

export default function AccountMenu({ variant = 'light' }: AccountMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const user = getCurrentUser()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/')
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className={`account-menu__signin account-menu__signin--${variant}`}
      >
        {t('account.menu.signIn')}
      </Link>
    )
  }

  const initial = user.name.charAt(0).toUpperCase()

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        className={`account-menu__trigger account-menu__trigger--${variant}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Account menu"
      >
        <span className="account-menu__icon">{initial}</span>
      </button>

      {open && (
        <div className="account-menu__dropdown">
          <div className="account-menu__user">
            <span className="account-menu__user-name">{user.name}</span>
            <span className="account-menu__user-email">{user.email}</span>
          </div>
          <div className="account-menu__divider" />
          <Link to="/account/settings" className="account-menu__item" onClick={() => setOpen(false)}>
            {t('account.menu.settings')}
          </Link>
          <Link to="/account/lectures" className="account-menu__item" onClick={() => setOpen(false)}>
            {t('account.menu.myLectures')}
          </Link>
          <Link to="/account/events" className="account-menu__item" onClick={() => setOpen(false)}>
            {t('account.menu.myEvents')}
          </Link>
          <div className="account-menu__divider" />
          <Link to="/account/lectures/new" className="account-menu__item" onClick={() => setOpen(false)}>
            {t('account.menu.addLecture')}
          </Link>
          <Link to="/account/events/new" className="account-menu__item" onClick={() => setOpen(false)}>
            {t('account.menu.addEvent')}
          </Link>
          <div className="account-menu__divider" />
          <button className="account-menu__item account-menu__item--logout" onClick={handleLogout}>
            {t('account.menu.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
