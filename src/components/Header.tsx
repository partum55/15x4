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
      <div className="absolute top-0 left-0 right-0 z-10">
        <Navbar variant="dark" />
      </div>

      <h1 className="absolute top-[39.6%] left-0 w-full text-center text-[clamp(28px,5.3vw,80px)] font-normal leading-[1.225] tracking-[-0.04em] text-white px-[clamp(16px,3.2vw,48px)]">
        <span className="font-bold italic">{t('header.title')}</span>
        <span className="font-light uppercase">{t('header.subtitle')}</span>
      </h1>

      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[min(750px,80%)] flex flex-col gap-5 max-[767px]:w-[90%] max-[767px]:bottom-[5%]">
        <p className="text-[clamp(14px,1.6vw,24px)] font-normal italic text-white leading-[1.2]">{t('header.tagline')}</p>
        <p className="text-[clamp(14px,1.6vw,24px)] font-normal text-white leading-[1.2]">{t('header.description')}</p>
      </div>
    </header>
  )
}
