'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

function InstagramIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M15 22.5C19.1421 22.5 22.5 19.1421 22.5 15C22.5 10.8579 19.1421 7.5 15 7.5C10.8579 7.5 7.5 10.8579 7.5 15C7.5 19.1421 10.8579 22.5 15 22.5ZM15 20C17.7614 20 20 17.7614 20 15C20 12.2386 17.7614 10 15 10C12.2386 10 10 12.2386 10 15C10 17.7614 12.2386 20 15 20Z" fill="#FFFFF1"/>
      <path d="M22.5 6.25C21.8096 6.25 21.25 6.80965 21.25 7.5C21.25 8.19035 21.8096 8.75 22.5 8.75C23.1904 8.75 23.75 8.19035 23.75 7.5C23.75 6.80965 23.1904 6.25 22.5 6.25Z" fill="#FFFFF1"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M2.06745 5.34508C1.25 6.94941 1.25 9.04961 1.25 13.25V16.75C1.25 20.9504 1.25 23.0506 2.06745 24.6549C2.7865 26.0661 3.93385 27.2135 5.34508 27.9325C6.94941 28.75 9.04961 28.75 13.25 28.75H16.75C20.9504 28.75 23.0506 28.75 24.6549 27.9325C26.0661 27.2135 27.2135 26.0661 27.9325 24.6549C28.75 23.0506 28.75 20.9504 28.75 16.75V13.25C28.75 9.04961 28.75 6.94941 27.9325 5.34508C27.2135 3.93385 26.0661 2.7865 24.6549 2.06745C23.0506 1.25 20.9504 1.25 16.75 1.25H13.25C9.04961 1.25 6.94941 1.25 5.34508 2.06745C3.93385 2.7865 2.7865 3.93385 2.06745 5.34508ZM16.75 3.75H13.25C11.1086 3.75 9.65281 3.75195 8.5276 3.84387C7.43155 3.93342 6.87105 4.09574 6.48005 4.29496C5.53924 4.77434 4.77434 5.53924 4.29496 6.48005C4.09574 6.87105 3.93342 7.43155 3.84387 8.5276C3.75195 9.65281 3.75 11.1086 3.75 13.25V16.75C3.75 18.8915 3.75195 20.3471 3.84387 21.4724C3.93342 22.5685 4.09574 23.129 4.29496 23.52C4.77434 24.4608 5.53924 25.2256 6.48005 25.705C6.87105 25.9042 7.43155 26.0666 8.5276 26.1561C9.65281 26.248 11.1086 26.25 13.25 26.25H16.75C18.8915 26.25 20.3471 26.248 21.4724 26.1561C22.5685 26.0666 23.129 25.9042 23.52 25.705C24.4608 25.2256 25.2256 24.4608 25.705 23.52C25.9042 23.129 26.0666 22.5685 26.1561 21.4724C26.248 20.3471 26.25 18.8915 26.25 16.75V13.25C26.25 11.1086 26.248 9.65281 26.1561 8.5276C26.0666 7.43155 25.9042 6.87105 25.705 6.48005C25.2256 5.53924 24.4608 4.77434 23.52 4.29496C23.129 4.09574 22.5685 3.93342 21.4724 3.84387C20.3471 3.75195 18.8915 3.75 16.75 3.75Z" fill="#FFFFF1"/>
    </svg>

  )
}

function YouTubeIcon() {
  return (
    <svg width="33" height="26" viewBox="0 0 33 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.6025 0.25C29.1914 0.250035 32.083 3.36093 32.083 7.14941V18.3398C32.083 22.1283 29.1914 25.2392 25.6025 25.2393H6.73047C3.14174 25.239 0.25 22.1289 0.25 18.3398V7.14941L0.258789 6.7959C0.431798 3.16927 3.25387 0.250218 6.73047 0.25H25.6025ZM6.73047 2.11035C4.15348 2.11058 2.0293 4.35623 2.0293 7.14941V18.3408C2.0293 21.134 4.15348 23.3787 6.73047 23.3789H25.6025C28.1797 23.3789 30.3047 21.1348 30.3047 18.3408V7.14941C30.3047 4.35611 28.1797 2.11039 25.6025 2.11035H6.73047Z" fill="#FFFFF1" stroke="#FFFFF1" strokeWidth="0.5"/>
      <path d="M11.9626 6.7583C12.2523 6.59254 12.6089 6.59487 12.8953 6.76221L22.3201 12.2827L22.4216 12.3521C22.6468 12.5272 22.781 12.798 22.781 13.0864C22.781 13.4168 22.6048 13.7226 22.3201 13.8892L12.8953 19.4087H12.8943C12.7499 19.4928 12.5883 19.5356 12.4255 19.5356C12.266 19.5356 12.106 19.4945 11.9626 19.4126H11.9617C11.6733 19.2469 11.495 18.9386 11.4949 18.606V7.56494C11.495 7.23142 11.6735 6.92393 11.9626 6.7583ZM13.3552 16.9819L20.0085 13.0845L13.3552 9.18701V16.9819Z" fill="#FFFFF1" stroke="#FFFFF1" strokeWidth="0.5"/>
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
          <p className="text-[clamp(56px,6.3vw,96px)] font-bold italic text-white leading-none text-center max-[1199px]:text-[clamp(40px,5vw,72px)] max-[767px]:text-[72px]">15x4</p>
          <p className="text-[clamp(13px,1.6vw,24px)] font-normal text-white text-center">{t('footer.tagline')}</p>
        </div>

        {/* Column 3: contact */}
        <div className="flex-[0_0_22%] min-w-0 flex flex-col justify-between min-h-[171px] max-[1199px]:flex-[0_0_18%] max-[767px]:flex-none max-[767px]:w-full max-[767px]:min-h-0">
          <div className="flex flex-col gap-3">
            <p className="text-[clamp(16px,1.6vw,24px)] font-normal text-white">{t('footer.contactLabel')}</p>
            <a href="mailto:example@gmail.com" className="text-[clamp(14px,1.6vw,24px)] font-normal text-white no-underline break-all hover:underline">example@gmail.com</a>
          </div>
          <div className="flex items-center gap-6 text-white mt-6 max-[767px]:mt-4">
            <a href="#instagram" className="text-white flex items-center border-2 border-transparent rounded-md p-0.5 hover:border-[#FFFFF1]" aria-label="Instagram"><InstagramIcon /></a>
            <a href="#youtube" className="text-white flex items-center border-2 border-transparent rounded-md p-0.5 hover:border-[#FFFFF1]" aria-label="YouTube"><YouTubeIcon /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
