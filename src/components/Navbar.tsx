'use client'

import { useEffect, useState } from 'react'
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
  const isHomePage = pathname === '/'
  const isHomeHeroNavbar = variant === 'dark' && isHomePage
  const [isPastHomeHero, setIsPastHomeHero] = useState(false)

  useEffect(() => {
    if (!isHomeHeroNavbar) {
      return
    }

    const handleScroll = () => {
      const heroElement = document.getElementById('home-hero')
      const heroHeight = heroElement?.offsetHeight ?? 0
      const switchOffset = 80
      setIsPastHomeHero(window.scrollY >= Math.max(heroHeight - switchOffset, 0))
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isHomeHeroNavbar])

  const effectiveVariant: 'light' | 'dark' = isHomeHeroNavbar && isPastHomeHero ? 'light' : variant
  const navColorClasses = isHomeHeroNavbar && !isPastHomeHero
    ? 'text-white bg-transparent'
    : effectiveVariant === 'dark'
      ? 'text-white bg-black'
      : 'text-black bg-[var(--color-white)] border-b border-black/10'

  const links = [
    { to: '/events', label: t('nav.events') },
    { to: '/lectures', label: t('nav.lectures') },
    { to: '/about-us', label: t('nav.about') },
  ]

  return (
    <nav
      className={`${isHomeHeroNavbar ? 'fixed top-0 left-0 right-0' : 'sticky top-0'} z-50 py-[clamp(20px,2.6vw,40px)] ${navColorClasses}`}
    >
      <div className="content-shell flex items-center justify-between">
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
          <AccountMenu variant={effectiveVariant} />
        </div>
      </div>
    </nav>
  )
}
