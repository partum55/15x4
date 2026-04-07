'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import ArrowIcon from './ArrowIcon'
import type { Event } from '@/lib/api'
import { api } from '../lib/api'

export default function UpcomingEvents() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
  }, [])

  const visibleEvents = Array.isArray(events) ? events : []

  return (
    <section className="pt-[clamp(32px,4.2vw,64px)]" id="events">
      <div className="px-[clamp(16px,3.2vw,48px)]">
        <h2 className="text-[clamp(22px,2.4vw,36px)] font-normal text-black ml-[clamp(0px,25.6%,363px)] mb-6 leading-[1.2] max-[1199px]:ml-0">
          <span className="text-red">{'//'}</span> {t('upcomingEvents.title')}
        </h2>

        <div className="flex flex-col">
          {visibleEvents.map((event) => (
            <div key={event.id}>
              <div className="w-full h-px bg-black" />
              <div className="flex items-start min-h-[290px] max-[767px]:flex-col max-[767px]:min-h-0">
                {/* Col 1: info */}
                <div className="flex-[0_0_clamp(200px,23.1%,327px)] pt-6 pb-6 flex flex-col justify-between max-[1199px]:flex-[0_0_280px] max-[767px]:flex-none max-[767px]:w-full max-[767px]:pb-4">
                  <p className="text-[clamp(16px,1.6vw,24px)] font-normal mb-4">{event.city.toUpperCase()} [{event.date}]</p>
                  <p className="text-[clamp(13px,1.3vw,20px)] font-normal leading-[1.4] mb-4">{event.location}</p>
                  <p className="text-[clamp(13px,1.3vw,20px)] font-normal mb-4">{event.time}</p>
                  <Link
                    href={`/events/${event.id}`}
                    className="w-full h-[69px] px-6 py-5 bg-black text-white border-none cursor-pointer flex items-center justify-between font-sans text-[clamp(16px,1.6vw,24px)] font-normal no-underline"
                  >
                    <span>{t('upcomingEvents.register')}</span>
                    <ArrowIcon />
                  </Link>
                </div>

                {/* Col 2: image */}
                <Link
                  href={`/events/${event.id}`}
                  className="flex-[0_0_clamp(200px,23.1%,327px)] max-[1199px]:hidden max-[767px]:block max-[767px]:w-full max-[767px]:flex-none"
                >
                  <Image
                    src={event.image}
                    alt={`Подія 15x4 у ${event.city}`}
                    width={327}
                    height={290}
                    unoptimized
                    className="w-full h-[290px] object-cover block max-[767px]:h-[220px]"
                  />
                </Link>

                {/* Col 3: talks */}
                <div className="flex-1 ml-[clamp(16px,5.1%,72px)] pt-[57px] flex flex-col min-w-0 max-[1199px]:ml-6 max-[1199px]:pt-6 max-[767px]:ml-0 max-[767px]:pt-4 max-[767px]:w-full">
                  {(event.lectures ?? []).map((lecture) => (
                    <div key={lecture.id} className="flex justify-between items-baseline py-[15px] gap-2">
                      <span className="text-[clamp(14px,1.6vw,24px)] font-normal flex-1 min-w-0">{lecture.title}</span>
                      <span className="text-[clamp(12px,1.3vw,20px)] font-normal text-right whitespace-nowrap flex-shrink-0">{lecture.author}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div className="w-full h-px bg-black" />
        </div>
      </div>
    </section>
  )
}
