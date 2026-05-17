'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import FormField from '@/components/FormField'
import PasswordInput from '@/components/PasswordInput'
import { useAuth } from '@/context/AuthContext'

interface ReauthModalProps {
  onConfirm: (password: string) => Promise<void>
  onCancel: () => void
  title?: string
}

export default function ReauthModal({ onConfirm, onCancel, title }: ReauthModalProps) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !password) return
    
    setSubmitting(true)
    setError('')
    try {
      await onConfirm(password)
    } catch (err: any) {
      setError(err.message || t('auth.login.errorInvalidPassword'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-black w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
        <h2 className="text-[clamp(20px,2vw,28px)] font-normal uppercase mb-4">
          {title || t('admin.users.reauthTitle', { defaultValue: 'Підтвердіть пароль' })}
        </h2>
        <p className="text-[clamp(13px,1.2vw,18px)] text-black/60 mb-8">
          {t('admin.users.reauthDescription', { defaultValue: 'Для виконання цієї дії необхідно підтвердити ваш пароль адміністратора.' })}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FormField label={t('auth.login.passwordLabel')} error={error} required>
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              autoFocus
            />
          </FormField>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-black bg-white text-black uppercase text-[clamp(12px,1.1vw,16px)] hover:bg-black/5"
            >
              {t('common.cancel', { defaultValue: 'Скасувати' })}
            </button>
            <button
              type="submit"
              disabled={submitting || !password}
              className="flex-1 px-6 py-3 bg-black text-white border-none uppercase text-[clamp(12px,1.1vw,16px)] hover:opacity-85 disabled:opacity-50"
            >
              {submitting ? '...' : t('common.confirm', { defaultValue: 'Підтвердити' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
