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
  const { signIn, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const callbackError = searchParams.get('error') === 'auth_callback_error' ? t('auth.login.errorOAuth') : ''
  const formError = errors.form ?? callbackError
  const rawRedirectParam = searchParams.get('redirect')
  const redirectParam = rawRedirectParam?.startsWith('/') && !rawRedirectParam.startsWith('//') ? rawRedirectParam : null
  const registerHref = redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = t('auth.login.errorRequired')
    if (!password) e.password = t('auth.login.errorRequired')
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (submitting || googleLoading) return
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSubmitting(true)
    const result = await signIn(email.trim(), password)
    setSubmitting(false)
    if (result.error) {
      setErrors({ form: t('auth.login.errorInvalid') })
      return
    }

    const redirect = redirectParam ?? '/'
    router.push(redirect)
    router.refresh()
  }

  async function handleGoogleLogin() {
    if (googleLoading || submitting) return
    const redirect = redirectParam ?? '/'
    setGoogleLoading(true)
    const result = await signInWithGoogle(redirect)
    setGoogleLoading(false)
    if (result.error) {
      setErrors({ form: t('auth.login.errorOAuth') })
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 grid grid-cols-[minmax(0,0.9fr)_minmax(360px,520px)] border-t border-black max-[900px]:grid-cols-1">
        <section
          className="relative flex min-h-[calc(100dvh-92px)] flex-col justify-between overflow-hidden bg-black bg-cover bg-center px-[clamp(20px,5vw,72px)] py-[clamp(48px,7vw,96px)] text-white max-[900px]:min-h-[360px] max-[900px]:gap-14"
          style={{ backgroundImage: 'url(/images/header-image.png)' }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10 text-[clamp(48px,10vw,132px)] leading-none font-bold italic">15x4</div>
          <div className="relative z-10 max-w-[620px]">
            <p className="mb-4 text-[clamp(13px,1.2vw,18px)] uppercase text-white/65">{t('footer.tagline')}</p>
            <h1 className="text-[clamp(30px,4vw,64px)] leading-[0.95] font-normal uppercase">{t('auth.login.title')}</h1>
          </div>
        </section>

        <section className="px-[clamp(16px,4vw,56px)] py-[clamp(32px,5vw,72px)] flex items-center">
          <div className="w-full">
            <div className="grid grid-cols-2 border border-black mb-8">
              <span className="px-4 py-3 bg-black text-white text-center uppercase text-[clamp(13px,1.1vw,16px)]">{t('auth.login.submitBtn')}</span>
              <Link href={registerHref} className="px-4 py-3 text-black text-center uppercase no-underline text-[clamp(13px,1.1vw,16px)] hover:bg-black/5">
                {t('auth.login.register')}
              </Link>
            </div>

            {formError && (
              <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{formError}</p>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || submitting}
              aria-busy={googleLoading}
              className="px-6 py-4 bg-white text-black border border-black font-sans text-[clamp(14px,1.2vw,18px)] font-normal uppercase cursor-pointer w-full transition-colors duration-200 hover:bg-black hover:text-white flex items-center justify-center gap-3 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
            >
              <span className="text-[18px] leading-none font-bold" aria-hidden="true">G</span>
              {googleLoading ? t('auth.login.googleLoading') : t('auth.login.googleBtn')}
            </button>

            <div className="flex items-center gap-4 my-7">
              <div className="h-px bg-black/30 flex-1" />
              <span className="text-[clamp(11px,1vw,14px)] uppercase text-black/50">{t('auth.login.or')}</span>
              <div className="h-px bg-black/30 flex-1" />
            </div>

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
                disabled={submitting || googleLoading}
                aria-busy={submitting}
                className="mt-2 px-6 py-4 bg-black text-white border-none font-sans text-[clamp(14px,1.2vw,18px)] font-normal uppercase cursor-pointer w-full transition-opacity duration-200 hover:opacity-85 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
              >
                {submitting ? t('auth.login.submitting') : t('auth.login.submitBtn')}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
