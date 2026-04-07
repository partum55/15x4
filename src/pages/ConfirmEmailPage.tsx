import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import { getCurrentUser, confirmEmail } from '../auth'
import './ConfirmEmailPage.css'

export default function ConfirmEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = getCurrentUser()

  function handleDevConfirm() {
    if (user) {
      confirmEmail(user.id)
      navigate('/wait-approval')
    }
  }

  return (
    <div className="auth-page">
      <Navbar variant="light" />
      <main className="auth-page__main">
        <div className="auth-page__container">
          <h1 className="auth-page__title">{t('auth.confirmEmail.title')}</h1>

          <div className="confirm-email__icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="10" width="40" height="28" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 10l20 16 20-16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          <p className="confirm-email__message">
            {t('auth.confirmEmail.message', { email: user?.email ?? '' })}
          </p>

          <button className="confirm-email__dev-link" onClick={handleDevConfirm}>
            {t('auth.confirmEmail.devHint')}
          </button>
        </div>
      </main>
    </div>
  )
}
