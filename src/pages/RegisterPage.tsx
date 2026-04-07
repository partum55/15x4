import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import { register } from '../auth'
import './LoginPage.css'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; passwordConfirm?: string
  }>({})

  function validate() {
    const e: typeof errors = {}
    if (!name.trim()) e.name = t('auth.register.errorRequired')
    if (!email.trim()) e.email = t('auth.register.errorRequired')
    if (!password) e.password = t('auth.register.errorRequired')
    else if (password.length < 8) e.password = t('auth.register.errorPasswordShort')
    if (password !== passwordConfirm) e.passwordConfirm = t('auth.register.errorPasswordMismatch')
    return e
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const result = register(email.trim(), name.trim(), password)
    if (!result.ok) {
      setErrors({ email: t('auth.register.errorEmailTaken') })
      return
    }
    navigate('/confirm-email')
  }

  return (
    <div className="auth-page">
      <Navbar variant="light" />
      <main className="auth-page__main">
        <div className="auth-page__container">
          <h1 className="auth-page__title">{t('auth.register.title')}</h1>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <FormField label={t('auth.register.nameLabel')} error={errors.name}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </FormField>

            <FormField label={t('auth.register.emailLabel')} error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </FormField>

            <FormField label={t('auth.register.passwordLabel')} error={errors.password}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </FormField>

            <FormField label={t('auth.register.passwordConfirmLabel')} error={errors.passwordConfirm}>
              <input
                type="password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </FormField>

            <button type="submit" className="auth-form__submit">
              {t('auth.register.submitBtn')}
            </button>
          </form>

          <p className="auth-page__switch">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="auth-page__switch-link">
              {t('auth.register.loginLink')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
