'use client'

import { useTranslation } from 'react-i18next'
import ArrowIcon from './ArrowIcon'

export default function JoinSection() {
  const { t } = useTranslation()

  return (
    <section className="py-[clamp(32px,4.2vw,64px)]">
      <div className="px-[clamp(16px,3.2vw,48px)]">
        <h2 className="text-[clamp(22px,2.4vw,36px)] font-normal text-black uppercase ml-[clamp(0px,25.6%,363px)] mb-[43px] leading-[1.2] max-[1199px]:ml-0 max-[767px]:ml-0 max-[767px]:mb-6">
          <span className="text-red">¡</span> {t('join.title')} <span className="text-red">!</span>
        </h2>

        <div className="flex items-start gap-0 max-[767px]:flex-col max-[767px]:gap-8">
          <div className="flex-1 flex items-start gap-6 min-w-0 max-[767px]:flex-col max-[767px]:gap-4 max-[767px]:w-full">
            <p className="flex-1 min-w-0 text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.2] text-black">{t('join.ideaText')}</p>
            <button className="flex-[0_0_clamp(180px,23.1%,327px)] h-[69px] px-6 py-5 border-none cursor-pointer flex items-center justify-between font-sans text-[clamp(14px,1.6vw,24px)] font-normal text-white bg-black max-[1199px]:flex-[0_0_220px] max-[1199px]:text-lg max-[767px]:flex-none max-[767px]:w-full max-[767px]:h-auto max-[767px]:py-4">
              <span>{t('join.ideaButton')}</span>
              <ArrowIcon />
            </button>
          </div>

          <div className="flex-1 flex items-start gap-6 min-w-0 max-[767px]:flex-col max-[767px]:gap-4 max-[767px]:w-full">
            <p className="flex-1 min-w-0 text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.2] text-black">{t('join.speakerText')}</p>
            <button className="flex-[0_0_clamp(180px,23.1%,327px)] h-[69px] px-6 py-5 border-none cursor-pointer flex items-center justify-between font-sans text-[clamp(14px,1.6vw,24px)] font-normal text-white bg-red max-[1199px]:flex-[0_0_220px] max-[1199px]:text-lg max-[767px]:flex-none max-[767px]:w-full max-[767px]:h-auto max-[767px]:py-4">
              <span>{t('join.speakerButton')}</span>
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
