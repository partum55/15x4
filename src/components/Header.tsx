'use client'

import { useTranslation } from 'react-i18next'
import Navbar from './Navbar'

export default function Header() {
  const { t } = useTranslation()

  return (
    <header
      id="home-hero"
      className="relative w-full h-[clamp(480px,65vw,982px)] bg-cover bg-center bg-no-repeat text-white max-[767px]:h-[clamp(360px,80vw,520px)]"
      style={{ backgroundImage: `url(/images/header-image.png)` }}
    >
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navbar variant="dark" />
      </div>
      <h1 className="content-shell absolute top-[39.6%] left-1/2 z-10 -translate-x-1/2 text-center text-[clamp(28px,5.3vw,80px)] font-normal leading-[1.225] tracking-[-0.04em] text-white max-[767px]:top-[34%]">
        <span className="font-bold italic">{t('header.title')}</span>
        <span className="font-light uppercase">{t('header.subtitle')}</span>
      </h1>
      <div className="absolute bottom-[8%] left-1/2 z-10 flex w-[min(750px,80%)] -translate-x-1/2 flex-col items-center gap-5 text-center max-[767px]:bottom-[5%] max-[767px]:w-[90%]">
        <p className="text-[clamp(14px,1.6vw,24px)] font-normal italic text-white leading-[1.2]">
          {t('header.tagline')}
        </p>
        <p className="text-[clamp(14px,1.6vw,24px)] font-normal text-white leading-[1.2]">
          {t('header.description')}
        </p>
      </div>
    </header>
  )
}
