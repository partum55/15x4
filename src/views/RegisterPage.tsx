'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { signUp } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; passwordConfirm?: string; form?: string
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

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const result = await signUp(email.trim(), password, name.trim())
    if (result.error) {
      setErrors({ form: result.error })
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar variant="light" />
        <main className="flex-1 flex items-center justify-center px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
          <div className="w-full max-w-[480px] text-center">
            <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-6">
              {t('auth.register.checkEmail')}
            </h1>
            <p className="text-[clamp(14px,1.4vw,20px)] text-black/70">
              {t('auth.register.confirmationSent')}
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 flex items-center justify-center px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[480px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">{t('auth.register.title')}</h1>

          {errors.form && (
            <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{errors.form}</p>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
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

            <button
              type="submit"
              className="mt-2 px-6 py-4 bg-black text-white border-none font-sans text-[clamp(14px,1.4vw,20px)] font-normal uppercase cursor-pointer w-full transition-opacity duration-200 hover:opacity-85"
            >
              {t('auth.register.submitBtn')}
            </button>
          </form>

          <p className="mt-6 text-[clamp(13px,1.2vw,18px)] text-black">
            {t('auth.register.hasAccount')}{' '}
            <Link href="/login" className="text-red no-underline hover:underline">
              {t('auth.register.loginLink')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
