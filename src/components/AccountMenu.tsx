'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

type AccountMenuProps = {
  variant?: 'light' | 'dark'
}

export default function AccountMenu({ variant = 'light' }: AccountMenuProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleLogout() {
    await signOut()
    setOpen(false)
    router.push('/')
  }

  if (!user || !user.profile) {
    return (
      <Link
        href="/login"
        className={`text-[clamp(14px,1.4vw,20px)] font-normal no-underline transition-opacity duration-150 hover:underline ${variant === 'dark' ? 'text-white' : 'text-black'}`}
      >
        {t('account.menu.signIn')}
      </Link>
    )
  }

  const initial = user.profile.name.charAt(0).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="bg-transparent border-none cursor-pointer p-0 flex items-center transition-opacity duration-150 hover:opacity-75"
        onClick={() => setOpen(v => !v)}
        aria-label="Account menu"
      >
        <span
          className={`w-[clamp(28px,2.2vw,36px)] h-[clamp(28px,2.2vw,36px)] rounded-full flex items-center justify-center text-[clamp(12px,1.1vw,17px)] font-bold ${variant === 'dark' ? 'border border-white text-white' : 'border border-black text-black'}`}
          style={{ borderWidth: '1.5px' }}
        >
          {initial}
        </span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+12px)] right-0 min-w-[220px] bg-black text-white flex flex-col z-[200] max-[767px]:fixed max-[767px]:top-auto max-[767px]:right-0 max-[767px]:left-0 max-[767px]:min-w-full">
          <div className="px-6 pt-[14px] pb-3 flex flex-col gap-0.5">
            <span className="text-[clamp(13px,1.2vw,18px)] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{user.profile.name}</span>
            <span className="text-[clamp(11px,1vw,14px)] font-normal text-white opacity-50 whitespace-nowrap overflow-hidden text-ellipsis">{user.email}</span>
          </div>
          <div className="h-px bg-[rgba(255,255,241,0.12)]" />
          <Link href="/account/settings" className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)]" onClick={() => setOpen(false)}>
            {t('account.menu.settings')}
          </Link>
          <Link href="/account/lectures" className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)]" onClick={() => setOpen(false)}>
            {t('account.menu.myLectures')}
          </Link>
          <Link href="/account/events" className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)]" onClick={() => setOpen(false)}>
            {t('account.menu.myEvents')}
          </Link>
          <div className="h-px bg-[rgba(255,255,241,0.12)]" />
          <Link href="/account/lectures/new" className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)]" onClick={() => setOpen(false)}>
            {t('account.menu.addLecture')}
          </Link>
          <Link href="/account/events/new" className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)]" onClick={() => setOpen(false)}>
            {t('account.menu.addEvent')}
          </Link>
          {user.profile.role === 'admin' && (
            <>
              <div className="h-px bg-[rgba(255,255,241,0.12)]" />
              <Link href="/admin" className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-orange no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)]" onClick={() => setOpen(false)}>
                {t('account.menu.admin')}
              </Link>
            </>
          )}
          <div className="h-px bg-[rgba(255,255,241,0.12)]" />
          <button className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-red bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)]" onClick={handleLogout}>
            {t('account.menu.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
