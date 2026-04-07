'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function WaitApprovalPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { logout } = useAuth()

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 flex items-center justify-center px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[480px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">{t('auth.waitApproval.title')}</h1>

          <div className="text-black mb-6">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="1.5" />
              <path d="M24 14v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              <circle cx="24" cy="33" r="1" fill="currentColor" />
            </svg>
          </div>

          <p className="text-[clamp(15px,1.4vw,22px)] font-normal text-black leading-[1.5] mb-8 max-w-[420px]">
            {t('auth.waitApproval.message')}
          </p>

          <button
            className="inline-block px-8 py-[14px] bg-black text-white border-none font-sans text-[clamp(14px,1.3vw,20px)] font-normal uppercase cursor-pointer transition-opacity duration-200 hover:opacity-85"
            onClick={handleLogout}
          >
            {t('auth.waitApproval.logout')}
          </button>
        </div>
      </main>
    </div>
  )
}
