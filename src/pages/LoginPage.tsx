import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import { login, getCurrentUser } from '../auth'
import './LoginPage.css'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = t('auth.login.errorRequired')
    if (!password) e.password = t('auth.login.errorRequired')
    return e
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const result = login(email.trim(), password)
    if (!result.ok) {
      setErrors({ form: t('auth.login.errorInvalid') })
      return
    }

    const user = getCurrentUser()
    if (!user) return
    if (user.status === 'pending_email') navigate('/confirm-email')
    else if (user.status === 'pending_approval') navigate('/wait-approval')
    else navigate('/')
  }

  return (
    <div className="auth-page">
      <Navbar variant="light" />
      <main className="auth-page__main">
        <div className="auth-page__container">
          <h1 className="auth-page__title">{t('auth.login.title')}</h1>

          {errors.form && <p className="auth-page__form-error">{errors.form}</p>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <FormField label={t('auth.login.emailLabel')} error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </FormField>

            <FormField label={t('auth.login.passwordLabel')} error={errors.password}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </FormField>

            <button type="submit" className="auth-form__submit">
              {t('auth.login.submitBtn')}
            </button>
          </form>

          <p className="auth-page__switch">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="auth-page__switch-link">
              {t('auth.login.register')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
