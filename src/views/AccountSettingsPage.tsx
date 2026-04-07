'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import PasswordInput from '../components/PasswordInput'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { createClient } from '../lib/supabase/client'
import { evaluatePasswordStrength } from '../lib/password-strength'

export default function AccountSettingsPage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const { refresh } = useAuth()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password])
  const passwordsMatch = password.length > 0 && passwordConfirm.length > 0 && password === passwordConfirm
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

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')

    if (passwordConfirm && !password) {
      setError(t('account.settings.errorPasswordRequired'))
      return
    }

    if (password) {
      if (!passwordConfirm) {
        setError(t('account.settings.errorPasswordConfirmRequired'))
        return
      }

      if (password !== passwordConfirm) {
        setError(t('account.settings.errorPasswordMismatch'))
        return
      }

      if (!passwordStrength.isStrong) {
        setError(t('account.settings.errorPasswordWeak'))
        return
      }
    }

    try {
      // Update name in profiles
      const newName = name.trim() || user?.name
      if (newName && newName !== user?.name) {
        await api.updateProfile({ name: newName })
        await refresh()
      }

      // Update password via Supabase Auth
      if (password) {
        const { error: pwError } = await supabase.auth.updateUser({ password })
        if (pwError) {
          setError(t('account.settings.errorPasswordUpdate'))
          return
        }
      }

      setPassword('')
      setPasswordConfirm('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError(t('account.settings.errorSave'))
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 flex items-start justify-center px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[480px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">{t('account.settings.title')}</h1>

          {error && (
            <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{error}</p>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <FormField label={t('account.settings.nameLabel')}>
              <input
                type="text"
                value={name || user?.name || ''}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </FormField>

            <FormField label={t('account.settings.emailLabel')}>
              <input type="email" value={user?.email ?? ''} readOnly className="opacity-50 cursor-not-allowed" />
            </FormField>

            <FormField label={t('account.settings.passwordLabel')}>
              <div className="flex flex-col gap-2">
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder={t('account.settings.passwordHint')}
                  autoComplete="new-password"
                />
                {password && (
                  <>
                    <p className="text-[clamp(12px,1vw,16px)] text-black/80">
                      {t('account.settings.passwordStrength')}: <span className="uppercase">{strengthLabel}</span>
                    </p>
                    <div className="h-1.5 bg-black/10 w-full">
                      <div
                        className={`h-full transition-all duration-200 ${strengthColorClass}`}
                        style={{ width: strengthWidth }}
                      />
                    </div>
                    <p className="text-[clamp(12px,1vw,16px)] text-black/60">
                      {t('account.settings.passwordRequirements')}
                    </p>
                  </>
                )}
              </div>
            </FormField>

            <FormField label={t('account.settings.passwordConfirmLabel')}>
              <div className="flex flex-col gap-2">
                <PasswordInput
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  autoComplete="new-password"
                />
                {passwordConfirm && (
                  <p className={`text-[clamp(12px,1vw,16px)] ${passwordsMatch ? 'text-green' : 'text-red'}`}>
                    {passwordsMatch ? t('account.settings.passwordsMatch') : t('account.settings.passwordsMismatch')}
                  </p>
                )}
              </div>
            </FormField>

            <div className="flex items-center gap-4 mt-2">
              <button
                type="submit"
                className="px-6 py-4 bg-black text-white border-none font-sans text-[clamp(14px,1.4vw,20px)] font-normal uppercase cursor-pointer transition-opacity duration-200 hover:opacity-85 flex-shrink-0 w-auto"
              >
                {t('account.settings.saveBtn')}
              </button>
              {saved && (
                <span className="text-[clamp(13px,1.2vw,18px)] text-black opacity-60">
                  {t('account.settings.savedMessage')}
                </span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
