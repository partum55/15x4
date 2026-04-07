'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import type { Event } from '../data/events'
import ArrowIcon from '../components/ArrowIcon'
import AccountMenu from '../components/AccountMenu'
import Footer from '../components/Footer'
import { api } from '../lib/api'

export default function EventDetailPage() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [event, setEvent] = useState<Event | null>(null)

  useEffect(() => {
    if (!id) return
    api.getEvent(id).then((data: Event & { error?: string }) => {
      if (!data.error) setEvent(data)
    })
  }, [id])

  if (!event) {
    return (
      <div className="page">
        <nav className="inner-nav">
          <Link href="/" className="inner-nav__logo">15x4</Link>
          <div className="inner-nav__right">
            <Link href="/events" className="inner-nav__back">← {t('eventDetail.back')}</Link>
            <AccountMenu variant="light" />
          </div>
        </nav>
        <div className="px-[clamp(16px,3.2vw,48px)] py-16 text-2xl">{t('eventDetail.notFound')}</div>
      </div>
    )
  }

  return (
    <div className="page">
      <nav className="inner-nav">
        <Link href="/" className="inner-nav__logo">15x4</Link>
        <Link href="/events" className="inner-nav__back">← {t('eventDetail.back')}</Link>
      </nav>

      <main>
        <Image
          src={event.image}
          alt={`${event.city}`}
          width={1600}
          height={900}
          unoptimized
          className="w-full h-[clamp(240px,40vw,560px)] object-cover block"
        />

        <div className="grid grid-cols-2 gap-16 px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4vw,64px)] max-[767px]:grid-cols-1 max-[767px]:gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-[clamp(28px,4vw,60px)] font-normal uppercase">{event.city}</h1>
            <div className="flex gap-6 text-[clamp(14px,1.4vw,20px)]">
              <span>[{event.date}]</span>
              <span>{event.time}</span>
            </div>
            <p className="text-[clamp(13px,1.2vw,18px)] leading-[1.4] opacity-70">{event.location}</p>
            {event.registrationUrl && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[10px] mt-2 px-6 py-3 border border-black text-[clamp(13px,1.2vw,18px)] bg-transparent w-fit transition-colors duration-200 hover:bg-black hover:text-white"
              >
                <span>{t('eventDetail.register')}</span>
                <ArrowIcon />
              </a>
            )}
          </div>

          <div>
            <h2 className="text-[clamp(18px,2vw,28px)] font-normal mb-6">
              <span className="text-red">{'//'}</span> {t('eventDetail.talks')}
            </h2>
            <div>
              {event.lectures.map((lecture, i) => (
                <div key={i} className="pt-5">
                  <div className="w-full h-px bg-black mb-5" />
                  <p className="text-[clamp(14px,1.4vw,20px)] font-medium mb-1.5">{lecture.title}</p>
                  <p className="text-[clamp(13px,1.2vw,18px)] opacity-60">{lecture.author}</p>
                </div>
              ))}
              <div className="w-full h-px bg-black mt-5" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
