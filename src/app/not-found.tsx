'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="page min-h-screen items-center justify-center flex flex-col gap-8">
      <p className="text-[clamp(80px,10vw,140px)] font-bold leading-none tracking-tight">404</p>
      <p className="text-[clamp(14px,1.4vw,20px)] text-black opacity-60 uppercase tracking-widest">
        {t('errors.notFound')}
      </p>
      <Link
        href="/"
        className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase no-underline transition-colors duration-200 hover:bg-black hover:text-white"
      >
        {t('errors.goHome')}
      </Link>
    </div>
  )
}
