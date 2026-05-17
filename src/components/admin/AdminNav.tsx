'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'

export default function AdminNav() {
  const { t } = useTranslation()
  const pathname = usePathname()

  const links = [
    { href: '/admin', label: t('admin.nav.dashboard'), exact: true },
    { href: '/admin/users', label: t('admin.nav.users') },
    { href: '/admin/lectures', label: t('admin.nav.lectures') },
    { href: '/admin/events', label: t('admin.nav.events') },
  ]

  return (
    <nav className="flex flex-wrap gap-4 mb-12 border-b border-black pb-4">
      {links.map(({ href, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`text-[clamp(14px,1.3vw,20px)] no-underline hover:underline ${
              isActive ? 'font-bold text-red' : 'text-black'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
