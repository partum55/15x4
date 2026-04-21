'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = t('auth.login.errorRequired')
    if (!password) e.password = t('auth.login.errorRequired')
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const result = await signIn(email.trim(), password)
    if (result.error) {
      setErrors({ form: t('auth.login.errorInvalid') })
      return
    }

    const redirect = searchParams.get('redirect') ?? '/'
    router.push(redirect)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 flex items-center justify-center px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[480px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">{t('auth.login.title')}</h1>

          {errors.form && (
            <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{errors.form}</p>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <FormField label={t('auth.login.emailLabel')} error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </FormField>

            <FormField label={t('auth.login.passwordLabel')} error={errors.password}>
              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
            </FormField>

            <button
              type="submit"
              className="mt-2 px-6 py-4 bg-black text-white border-none font-sans text-[clamp(14px,1.4vw,20px)] font-normal uppercase cursor-pointer w-full transition-opacity duration-200 hover:opacity-85"
            >
              {t('auth.login.submitBtn')}
            </button>
          </form>

          <p className="mt-6 text-[clamp(13px,1.2vw,18px)] text-black">
            {t('auth.login.noAccount')}{' '}
            <Link href="/register" className="text-red no-underline hover:underline">
              {t('auth.login.register')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
