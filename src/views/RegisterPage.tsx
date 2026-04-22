'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/AuthContext'
import { evaluatePasswordStrength } from '../lib/password-strength'

export default function RegisterPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const { signUp, signInWithGoogle } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; passwordConfirm?: string; form?: string
  }>({})
  const rawRedirectParam = searchParams.get('redirect')
  const redirectParam = rawRedirectParam?.startsWith('/') && !rawRedirectParam.startsWith('//') ? rawRedirectParam : null
  const loginHref = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'

  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password])
  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm
  const strengthLabel = passwordStrength.level === 'strong'
    ? t('auth.password.strong')
    : passwordStrength.level === 'medium'
      ? t('auth.password.medium')
      : t('auth.password.weak')
  const strengthColorClass = passwordStrength.level === 'strong'
    ? 'bg-green'
    : passwordStrength.level === 'medium'
      ? 'bg-orange'
      : 'bg-red'
  const strengthWidth = `${Math.max(passwordStrength.score, 1) * 20}%`

  function validate() {
    const e: typeof errors = {}
    if (!name.trim()) e.name = t('auth.register.errorRequired')
    if (!email.trim()) e.email = t('auth.register.errorRequired')
    if (!password) e.password = t('auth.register.errorRequired')
    else if (!passwordStrength.isStrong) e.password = t('auth.register.errorPasswordWeak')
    if (!passwordConfirm) e.passwordConfirm = t('auth.register.errorRequired')
    else if (password !== passwordConfirm) e.passwordConfirm = t('auth.register.errorPasswordMismatch')
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (submitting || googleLoading) return
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSubmitting(true)
    const result = await signUp(email.trim(), password, name.trim())
    setSubmitting(false)
    if (result.error) {
      setErrors({ form: t('auth.register.errorGeneric') })
      return
    }
    setSubmitted(true)
  }

  async function handleGoogleRegistration() {
    if (googleLoading || submitting) return
    const redirect = redirectParam ?? '/'
    setGoogleLoading(true)
    const result = await signInWithGoogle(redirect)
    setGoogleLoading(false)
    if (result.error) {
      setErrors({ form: t('auth.register.errorOAuth') })
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar variant="light" />
        <main className="flex-1 flex items-center justify-center px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
          <div className="w-full max-w-[480px] text-center">
            <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal uppercase text-black mb-6">
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
      <main className="flex-1 grid grid-cols-[minmax(0,0.9fr)_minmax(360px,560px)] border-t border-black max-[900px]:grid-cols-1">
        <section
          className="relative flex min-h-[calc(100dvh-92px)] flex-col justify-between overflow-hidden bg-black bg-cover bg-center px-[clamp(20px,5vw,72px)] py-[clamp(48px,7vw,96px)] text-white max-[900px]:min-h-[360px] max-[900px]:gap-14"
          style={{ backgroundImage: 'url(/images/header-image.png)' }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10 text-[clamp(48px,10vw,132px)] leading-none font-bold italic">15x4</div>
          <div className="relative z-10 max-w-[620px]">
            <p className="mb-4 text-[clamp(13px,1.2vw,18px)] uppercase text-white/65">{t('footer.tagline')}</p>
            <h1 className="text-[clamp(30px,4vw,64px)] leading-[0.95] font-normal uppercase">{t('auth.register.title')}</h1>
          </div>
        </section>

        <section className="px-[clamp(16px,4vw,56px)] py-[clamp(32px,5vw,72px)] flex items-center">
        <div className="w-full">
          <div className="grid grid-cols-2 border border-black mb-8">
            <Link href={loginHref} className="px-4 py-3 text-black text-center uppercase no-underline text-[clamp(13px,1.1vw,16px)] hover:bg-black/5">
              {t('auth.register.loginLink')}
            </Link>
            <span className="px-4 py-3 bg-black text-white text-center uppercase text-[clamp(13px,1.1vw,16px)]">{t('auth.register.submitBtn')}</span>
          </div>

          {errors.form && (
            <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{errors.form}</p>
          )}

          <button
            type="button"
            onClick={handleGoogleRegistration}
            disabled={googleLoading || submitting}
            aria-busy={googleLoading}
            className="px-6 py-4 bg-white text-black border border-black font-sans text-[clamp(14px,1.2vw,18px)] font-normal uppercase cursor-pointer w-full transition-colors duration-200 hover:bg-black hover:text-white flex items-center justify-center gap-3 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
          >
            <span className="text-[18px] leading-none font-bold" aria-hidden="true">G</span>
            {googleLoading ? t('auth.register.googleLoading') : t('auth.register.googleBtn')}
          </button>

          <div className="flex items-center gap-4 my-7">
            <div className="h-px bg-black/30 flex-1" />
            <span className="text-[clamp(11px,1vw,14px)] uppercase text-black/50">{t('auth.login.or')}</span>
            <div className="h-px bg-black/30 flex-1" />
          </div>

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
              <div className="flex flex-col gap-2">
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                />
                {password && (
                  <>
                    <p className="text-[clamp(12px,1vw,16px)] text-black/80">
                      {t('auth.register.passwordStrength')}: <span className="uppercase">{strengthLabel}</span>
                    </p>
                    <div className="h-1.5 bg-black/10 w-full">
                      <div
                        className={`h-full transition-all duration-200 ${strengthColorClass}`}
                        style={{ width: strengthWidth }}
                      />
                    </div>
                    <p className="text-[clamp(12px,1vw,16px)] text-black/60">
                      {t('auth.register.passwordRequirements')}
                    </p>
                  </>
                )}
              </div>
            </FormField>

            <FormField label={t('auth.register.passwordConfirmLabel')} error={errors.passwordConfirm}>
              <div className="flex flex-col gap-2">
                <PasswordInput
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  autoComplete="new-password"
                />
                {passwordConfirm && (
                  <p className={`text-[clamp(12px,1vw,16px)] ${passwordsMatch ? 'text-green' : 'text-red'}`}>
                    {passwordsMatch ? t('auth.register.passwordsMatch') : t('auth.register.passwordsMismatch')}
                  </p>
                )}
              </div>
            </FormField>

            <button
              type="submit"
              disabled={submitting || googleLoading}
              aria-busy={submitting}
              className="mt-2 px-6 py-4 bg-black text-white border-none font-sans text-[clamp(14px,1.2vw,18px)] font-normal uppercase cursor-pointer w-full transition-opacity duration-200 hover:opacity-85 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
            >
              {submitting ? t('auth.register.submitting') : t('auth.register.submitBtn')}
            </button>
          </form>
        </div>
        </section>
      </main>
    </div>
  )
}
