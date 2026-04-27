'use client'

import { useTranslation } from 'react-i18next'
import ArrowIcon from './ArrowIcon'

export default function JoinSection() {
  const { t } = useTranslation()
  const LECTURE_IDEA_URL = process.env.LECTURE_IDEA_URL
  const JOIN_FORM_URL = process.env.JOIN_FORM_URL

  return (
    <section className="py-[clamp(32px,4.2vw,64px)]">
      <div className="content-shell">
        <h2 className="mb-[43px] ml-[calc(25%+33px)] text-[clamp(22px,2.4vw,36px)] font-normal uppercase leading-[1.2] text-black max-[1199px]:ml-0 max-[767px]:mb-6">
          <span className="text-red">¡</span> {t('join.title')} <span className="text-red">!</span>
        </h2>

        <div className="grid grid-cols-4 items-start gap-9 max-[1199px]:grid-cols-2 max-[767px]:grid-cols-1 max-[767px]:gap-4">
          <p className="min-w-0 text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.2] text-black">
            {t('join.ideaText')}
          </p>
          <a
            href={LECTURE_IDEA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[69px] w-full cursor-pointer items-center justify-center gap-[10px] border-none bg-black px-6 py-5 font-sans text-[clamp(14px,1.6vw,24px)] font-normal text-white transition-opacity duration-200 hover:opacity-85 max-[767px]:justify-between no-underline"
          >
              <span>{t('join.ideaButton')}</span>
              <ArrowIcon />
          </a>

          <p className="min-w-0 text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.2] text-black">
            {t('join.speakerText')}
          </p>
          <a
            href={JOIN_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[69px] w-full cursor-pointer items-center justify-center gap-[10px] border-none bg-red px-6 py-5 font-sans text-[clamp(14px,1.6vw,24px)] font-normal text-white transition-opacity duration-200 hover:opacity-85 max-[767px]:justify-between no-underline"
          >
              <span>{t('join.speakerButton')}</span>
              <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  )
}
