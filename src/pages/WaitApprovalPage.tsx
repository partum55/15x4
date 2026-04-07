import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import { logout, approveCurrentUser } from '../auth'
import './WaitApprovalPage.css'

export default function WaitApprovalPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleDevApprove() {
    approveCurrentUser()
    navigate('/')
  }

  return (
    <div className="auth-page">
      <Navbar variant="light" />
      <main className="auth-page__main">
        <div className="auth-page__container">
          <h1 className="auth-page__title">{t('auth.waitApproval.title')}</h1>

          <div className="wait-approval__icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="1.5" />
              <path d="M24 14v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              <circle cx="24" cy="33" r="1" fill="currentColor" />
            </svg>
          </div>

          <p className="wait-approval__message">
            {t('auth.waitApproval.message')}
          </p>

          <button className="wait-approval__logout-btn" onClick={handleLogout}>
            {t('auth.waitApproval.logout')}
          </button>

          <button className="wait-approval__dev-link" onClick={handleDevApprove}>
            {t('auth.waitApproval.devApprove')}
          </button>
        </div>
      </main>
    </div>
  )
}
