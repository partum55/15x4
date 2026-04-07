'use client'

import { useEffect, useState, useRef, startTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import { useCurrentUser } from '../hooks/useCurrentUser'

export default function ConfirmEmailPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useCurrentUser()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'pending' | 'confirming' | 'success' | 'error'>(() => 
    token ? 'confirming' : 'pending'
  )
  const hasRun = useRef(false)

  useEffect(() => {
    if (!token || hasRun.current) return
    hasRun.current = true

    const controller = new AbortController()

    fetch('/api/auth/confirm-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        startTransition(() => {
          if (data.ok) {
            setStatus('success')
            setTimeout(() => router.push('/wait-approval'), 2000)
          } else {
            setStatus('error')
          }
        })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          startTransition(() => setStatus('error'))
        }
      })

    return () => controller.abort()
  }, [token, router])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 flex items-center justify-center px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[480px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">
            {t('auth.confirmEmail.title')}
          </h1>

          <div className="text-black mb-6">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="10" width="40" height="28" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 10l20 16 20-16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {status === 'confirming' && (
            <p className="text-[clamp(15px,1.4vw,22px)] font-normal text-black leading-[1.5] mb-8">
              {t('auth.confirmEmail.confirming')}
            </p>
          )}

          {status === 'success' && (
            <p className="text-[clamp(15px,1.4vw,22px)] font-normal text-green leading-[1.5] mb-8">
              {t('auth.confirmEmail.success')}
            </p>
          )}

          {status === 'error' && (
            <p className="text-[clamp(15px,1.4vw,22px)] font-normal text-red leading-[1.5] mb-8">
              {t('auth.confirmEmail.error')}
            </p>
          )}

          {status === 'pending' && !token && (
            <p className="text-[clamp(15px,1.4vw,22px)] font-normal text-black leading-[1.5] mb-8 max-w-[420px]">
              {t('auth.confirmEmail.message', { email: user?.email ?? '' })}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
