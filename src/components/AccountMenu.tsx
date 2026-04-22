'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { canManageContent } from '@/lib/roles'

type AccountMenuProps = {
  variant?: 'light' | 'dark'
}

function UserOutlineIcon({ variant }: { variant: 'light' | 'dark' }) {
  const stroke = variant === 'dark' ? '#ffffff' : '#000000'

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" stroke={stroke} strokeWidth="1.8" />
      <path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function AccountMenu({ variant = 'light' }: AccountMenuProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, loading, signOut } = useAuth()

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
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await signOut()
      setOpen(false)
      router.push('/')
    } finally {
      setLoggingOut(false)
    }
  }

  function handleLoginClick() {
    const redirect = pathname && !pathname.startsWith('/login') && !pathname.startsWith('/register')
      ? `?redirect=${encodeURIComponent(pathname)}`
      : ''
    router.push(`/login${redirect}`)
  }

  if (loading) {
    return (
      <span
        className={`w-[clamp(28px,2.2vw,36px)] h-[clamp(28px,2.2vw,36px)] rounded-full block animate-pulse ${variant === 'dark' ? 'border border-white/60' : 'border border-black/40'}`}
        style={{ borderWidth: '1.5px' }}
        aria-hidden="true"
      />
    )
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleLoginClick}
        aria-label={t('account.menu.signIn')}
        className="relative z-[70] bg-transparent border-none cursor-pointer p-1 flex items-center transition-opacity duration-150 hover:opacity-75"
      >
        <span
          className={`w-[clamp(28px,2.2vw,36px)] h-[clamp(28px,2.2vw,36px)] rounded-full flex items-center justify-center ${variant === 'dark' ? 'border border-white text-white' : 'border border-black text-black'}`}
          style={{ borderWidth: '1.5px' }}
        >
          <UserOutlineIcon variant={variant} />
        </span>
      </button>
    )
  }

  const displayName = user.profile?.name ?? user.email
  const initial = displayName.charAt(0).toUpperCase()
  const canManageOwnContent = canManageContent(user.profile?.role)

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="relative z-[70] bg-transparent border-none cursor-pointer p-1 flex items-center transition-opacity duration-150 hover:opacity-75"
        onClick={() => setOpen(v => !v)}
        aria-label="Account menu"
        aria-expanded={open}
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
            <span className="text-[clamp(13px,1.2vw,18px)] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</span>
            <span className="text-[clamp(11px,1vw,14px)] font-normal text-white opacity-50 whitespace-nowrap overflow-hidden text-ellipsis">{user.email}</span>
          </div>
          <div className="h-px bg-[rgba(255,255,241,0.12)]" />
          <Link href="/account/settings" className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)]" onClick={() => setOpen(false)}>
            {t('account.menu.settings')}
          </Link>
          {canManageOwnContent && (
            <>
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
            </>
          )}
          {user.profile?.role === 'admin' && (
            <>
              <div className="h-px bg-[rgba(255,255,241,0.12)]" />
              <Link href="/admin" className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-orange no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)]" onClick={() => setOpen(false)}>
                {t('account.menu.admin')}
              </Link>
            </>
          )}
          <div className="h-px bg-[rgba(255,255,241,0.12)]" />
          <button
            type="button"
            className="block px-6 py-3 font-sans text-[clamp(13px,1.2vw,18px)] font-normal text-red bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-[rgba(255,255,241,0.08)] disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-busy={loggingOut}
          >
            {loggingOut ? `${t('account.menu.logout')}...` : t('account.menu.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
