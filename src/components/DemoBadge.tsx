'use client'

import { useTranslation } from 'react-i18next'

// Demo branch: always-visible notice that this deployment runs on mock data.
export default function DemoBadge() {
  const { t } = useTranslation()

  return (
    <div className="fixed bottom-3 right-3 z-[260] max-w-[min(300px,calc(100vw-24px))] bg-black text-white px-3.5 py-2.5 text-[12px] leading-snug shadow-[0_4px_16px_rgba(0,0,0,0.35)] pointer-events-none">
      <strong className="font-bold tracking-wide">{t('demo.title')}</strong> — {t('demo.text')}
    </div>
  )
}
