'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'

const DISMISS_KEY = 'profile-city-dismissed'

export default function ProfileCompletionBanner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem(DISMISS_KEY) === '1'
  })
  const visible = Boolean(user && !user.profile?.city && !pathname.startsWith('/account') && !dismissed)

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-4 bg-black text-white px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] max-w-[min(480px,calc(100vw-32px))] w-full">
      <p className="text-[13px] font-normal leading-snug flex-1">
        {t('profile.completionPrompt')}{' '}
        <Link
          href="/account/settings"
          className="underline underline-offset-2 text-white hover:text-white/75 transition-colors"
          onClick={handleDismiss}
        >
          {t('profile.completionLink')}
        </Link>
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-white/50 hover:text-white transition-colors text-xl leading-none flex-shrink-0 cursor-pointer bg-transparent border-none p-0"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
