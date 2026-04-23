'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { canManageContent } from '@/lib/roles'
import { buildLoginHref } from '@/lib/auth'

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
    router.push(buildLoginHref(pathname))
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
  const role = user.profile?.role ?? null
  const canManageOwnContent = canManageContent(role)

  return (
    <div className="relative z-[80]" ref={menuRef}>
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
        <div className="absolute top-[calc(100%+12px)] right-0 z-[300] flex w-[min(280px,calc(100vw-32px))] flex-col border border-white/15 bg-black text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] max-[767px]:fixed max-[767px]:top-[84px] max-[767px]:right-4 max-[767px]:left-4 max-[767px]:w-auto">
          <div className="px-5 pt-4 pb-3 flex flex-col gap-0.5">
            <span className="text-[15px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</span>
            <span className="text-[13px] font-normal text-white/55 whitespace-nowrap overflow-hidden text-ellipsis">{user.email}</span>
          </div>
          <div className="h-px bg-[rgba(255,255,241,0.12)]" />
          <Link href="/account/settings" className="block px-5 py-3 font-sans text-[15px] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-white/10" onClick={() => setOpen(false)}>
            {t('account.menu.settings')}
          </Link>
          {canManageOwnContent && (
            <>
              <Link href="/account/lectures" className="block px-5 py-3 font-sans text-[15px] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-white/10" onClick={() => setOpen(false)}>
                {t('account.menu.myLectures')}
              </Link>
              <Link href="/account/events" className="block px-5 py-3 font-sans text-[15px] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-white/10" onClick={() => setOpen(false)}>
                {t('account.menu.myEvents')}
              </Link>
              <div className="h-px bg-[rgba(255,255,241,0.12)]" />
              <Link href="/account/lectures/new" className="block px-5 py-3 font-sans text-[15px] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-white/10" onClick={() => setOpen(false)}>
                {t('account.menu.addLecture')}
              </Link>
              <Link href="/account/events/new" className="block px-5 py-3 font-sans text-[15px] font-normal text-white no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-white/10" onClick={() => setOpen(false)}>
                {t('account.menu.addEvent')}
              </Link>
            </>
          )}
          {user.profile?.role === 'admin' && (
            <>
              <div className="h-px bg-[rgba(255,255,241,0.12)]" />
              <Link href="/admin" className="block px-5 py-3 font-sans text-[15px] font-normal text-orange no-underline bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-white/10" onClick={() => setOpen(false)}>
                {t('account.menu.admin')}
              </Link>
            </>
          )}
          <div className="h-px bg-[rgba(255,255,241,0.12)]" />
          <button
            type="button"
            className="block px-5 py-3 font-sans text-[15px] font-normal text-red bg-transparent border-none cursor-pointer text-left w-full transition-colors duration-150 whitespace-nowrap hover:bg-white/10 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
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
