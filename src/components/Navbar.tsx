'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import AccountMenu from './AccountMenu'

type NavbarProps = {
  variant?: 'light' | 'dark'
}

export default function Navbar({ variant = 'light' }: NavbarProps) {
  const { t } = useTranslation()
  const pathname = usePathname()

  const links = [
    { to: '/events', label: t('nav.events') },
    { to: '/lectures', label: t('nav.lectures') },
    { to: '/about-us', label: t('nav.about') },
  ]

  return (
    <nav className={`flex items-center justify-between py-[clamp(20px,2.6vw,40px)] px-[clamp(16px,3.2vw,48px)] ${variant === 'dark' ? 'text-white' : 'text-black'}`}>
      <Link
        href="/"
        className="text-[clamp(18px,1.6vw,24px)] font-bold italic leading-none whitespace-nowrap no-underline text-inherit"
      >
        {t('nav.logo')}
      </Link>
      <div className="flex items-center justify-between w-[min(690px,46%)] gap-4 md:w-[min(500px,55%)] max-[767px]:w-auto max-[767px]:gap-4">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            href={to}
            className={`text-[clamp(14px,1.6vw,24px)] font-normal leading-none whitespace-nowrap no-underline text-inherit hover:underline ${pathname === to ? 'text-red underline' : ''}`}
          >
            {label}
          </Link>
        ))}
        <LanguageSwitcher />
        <AccountMenu variant={variant} />
      </div>
    </nav>
  )
}
