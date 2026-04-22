'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

function InstagramIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Instagram">
      <rect x="1" y="1" width="28" height="28" rx="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="22.5" cy="7.5" r="1.25" fill="currentColor" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="31" height="25" viewBox="0 0 31 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="YouTube">
      <path
        d="M30.3 4.2C29.9 2.7 28.8 1.5 27.3 1.1 24.9 0.5 15.5 0.5 15.5 0.5s-9.4 0-11.8.6C2.2 1.5 1.1 2.7.7 4.2.1 6.6.1 12.2.1 12.2s0 5.6.6 8.1c.4 1.5 1.5 2.7 3 3.1 2.4.6 11.8.6 11.8.6s9.4 0 11.8-.6c1.5-.4 2.6-1.6 3-3.1.6-2.5.6-8.1.6-8.1s0-5.6-.6-8z"
        stroke="currentColor" strokeWidth="1" fill="none"
      />
      <path d="M12.5 17.5l8-5.3-8-5.3v10.6z" fill="currentColor" />
    </svg>
  )
}

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="w-full min-h-[267px] bg-black text-white py-[clamp(24px,3.2vw,48px)] max-[767px]:min-h-0">
      <div className="content-shell flex items-start justify-between gap-6 max-[767px]:flex-col max-[767px]:gap-8">
        {/* Column 1: nav + copyright */}
        <div className="flex-[0_0_22%] min-w-0 flex flex-col justify-between min-h-[171px] max-[1199px]:flex-[0_0_18%] max-[767px]:flex-none max-[767px]:w-full max-[767px]:min-h-0">
          <nav className="flex flex-col gap-3">
            <Link href="/events" className="text-[clamp(16px,1.6vw,24px)] font-normal text-white no-underline leading-[1.2] hover:underline">{t('nav.events')}</Link>
            <Link href="/lectures" className="text-[clamp(16px,1.6vw,24px)] font-normal text-white no-underline leading-[1.2] hover:underline">{t('nav.lectures')}</Link>
            <Link href="/about-us" className="text-[clamp(16px,1.6vw,24px)] font-normal text-white no-underline leading-[1.2] hover:underline">{t('nav.about')}</Link>
          </nav>
          <p className="text-[clamp(13px,1.3vw,20px)] font-normal text-white mt-6 max-[767px]:mt-4">{t('footer.copyright')}</p>
        </div>

        {/* Column 2: big logo */}
        <div className="flex-1 min-w-0 flex flex-col items-center pt-[30px] gap-[10px] max-[767px]:flex-none max-[767px]:w-full max-[767px]:items-center max-[767px]:pt-0">
          <p className="text-[clamp(56px,6.3vw,96px)] font-bold text-white leading-none text-center max-[1199px]:text-[clamp(40px,5vw,72px)] max-[767px]:text-[72px]">15x4</p>
          <p className="text-[clamp(13px,1.6vw,24px)] font-normal text-white text-center">{t('footer.tagline')}</p>
        </div>

        {/* Column 3: contact */}
        <div className="flex-[0_0_22%] min-w-0 flex flex-col justify-between min-h-[171px] max-[1199px]:flex-[0_0_18%] max-[767px]:flex-none max-[767px]:w-full max-[767px]:min-h-0">
          <div className="flex flex-col gap-3">
            <p className="text-[clamp(16px,1.6vw,24px)] font-normal text-white">{t('footer.contactLabel')}</p>
            <a href="mailto:example@gmail.com" className="text-[clamp(14px,1.6vw,24px)] font-normal text-white no-underline break-all hover:underline">example@gmail.com</a>
          </div>
          <div className="flex items-center gap-6 text-white mt-6 max-[767px]:mt-4">
            <a href="#instagram" className="text-white flex items-center" aria-label="Instagram"><InstagramIcon /></a>
            <a href="#youtube" className="text-white flex items-center" aria-label="YouTube"><YouTubeIcon /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
