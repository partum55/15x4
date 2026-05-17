'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="page min-h-screen items-center justify-center flex flex-col gap-8">
      <p className="text-[clamp(14px,1.4vw,20px)] text-black opacity-60 uppercase tracking-widest">
        {t('errors.somethingWrong')}
      </p>
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={reset}
          className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white"
        >
          {t('errors.tryAgain')}
        </button>
        <Link
          href="/"
          className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase no-underline transition-colors duration-200 hover:bg-black hover:text-white"
        >
          {t('errors.goHome')}
        </Link>
      </div>
    </div>
  )
}
