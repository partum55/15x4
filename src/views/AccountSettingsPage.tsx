'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { api } from '../lib/api'

export default function AccountSettingsPage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const patch: { name?: string; password?: string } = { name: name.trim() || user?.name }
    if (password) patch.password = password
    await api.updateAccount(patch)
    setPassword('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 flex items-start justify-center px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[480px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">{t('account.settings.title')}</h1>

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
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('account.settings.passwordHint')}
                autoComplete="new-password"
              />
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
