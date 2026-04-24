'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Skeleton } from 'boneyard-js/react'
import ArrowIcon from './ArrowIcon'
import type { Event } from '@/lib/api'
import { api } from '../lib/api'
import { formatEventDate, formatEventTime } from '../lib/date-time'
import { useMinimumSkeleton } from '../hooks/useMinimumSkeleton'

export default function UpcomingEvents() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const skeletonLoading = useMinimumSkeleton(loading)

  useEffect(() => {
    let isMounted = true

    api
      .getEvents()
      .then((data) => {
        if (!isMounted) return
        setEvents(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!isMounted) return
        setEvents([])
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const visibleEvents = Array.isArray(events) ? events.slice(0, 1) : []

  return (
    <Skeleton name="home-upcoming-events" loading={skeletonLoading} className="min-h-[420px]">
      <section className="pt-[clamp(32px,4.2vw,64px)]" id="events">
        <div className="content-shell">
          <h2 className="text-[clamp(22px,2.4vw,36px)] font-normal text-black ml-[clamp(0px,25.6%,363px)] mb-6 leading-[1.2] max-[1199px]:ml-0">
            <span className="text-red">{'//'}</span> {t('upcomingEvents.title')}
          </h2>

          <div className="flex flex-col">
            {visibleEvents.map((event) => (
              <div key={event.id}>
                <div className="w-full h-px bg-black" />
                <div className="flex min-h-[290px] items-stretch gap-9 max-[1199px]:gap-6 max-[900px]:grid max-[900px]:grid-cols-[minmax(220px,327px)_1fr] max-[767px]:flex max-[767px]:flex-col max-[767px]:min-h-0">
                  {/* Col 1: info */}
                  <div className="flex w-[clamp(220px,23.1%,327px)] flex-shrink-0 flex-col justify-between py-6 max-[900px]:w-full max-[767px]:pb-4">
                    <div className="flex flex-col gap-6">
                      <p className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em]">{event.city} [{formatEventDate(event.date)}]</p>
                      <p className="text-[clamp(13px,1.3vw,20px)] font-normal leading-[1.35]">{event.location}</p>
                      <p className="text-[clamp(13px,1.3vw,20px)] font-normal">{formatEventTime(event.time)}</p>
                    </div>
                    {event.registrationUrl?.trim().startsWith('http') ? (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 flex h-[69px] w-full items-center justify-center gap-[10px] bg-black px-6 py-5 font-sans text-[clamp(16px,1.6vw,24px)] font-normal text-white no-underline transition-opacity duration-200 hover:opacity-85 max-[767px]:justify-between"
                      >
                        <span>{t('upcomingEvents.register')}</span>
                        <ArrowIcon />
                      </a>
                    ) : (
                      <Link
                        href={`/events/${event.id}`}
                        className="mt-6 flex h-[69px] w-full items-center justify-center gap-[10px] bg-black px-6 py-5 font-sans text-[clamp(16px,1.6vw,24px)] font-normal text-white no-underline transition-opacity duration-200 hover:opacity-85 max-[767px]:justify-between"
                      >
                        <span>{t('upcomingEvents.register')}</span>
                        <ArrowIcon />
                      </Link>
                    )}
                  </div>

                  {/* Col 2: image */}
                  <Link
                    href={`/events/${event.id}`}
                    className="w-[clamp(220px,23.1%,327px)] flex-shrink-0 max-[900px]:order-3 max-[900px]:w-full max-[767px]:order-none"
                  >
                    <Image
                      src={event.image}
                      alt={`Подія 15x4 у ${event.city}`}
                      width={327}
                      height={290}
                      unoptimized
                      className="block h-full min-h-[290px] w-full object-cover max-[900px]:h-[220px] max-[900px]:min-h-0"
                    />
                  </Link>

                  {/* Col 3: talks */}
                  <div className="flex min-w-0 flex-1 flex-col gap-5 py-6 max-[900px]:col-start-2 max-[900px]:row-span-2 max-[767px]:w-full max-[767px]:gap-3 max-[767px]:pt-4">
                    {(event.lectures ?? []).slice(0, 4).map((lecture) => (
                      <Link
                        key={lecture.id}
                        href={`/lectures/${lecture.id}`}
                        className="group flex items-baseline justify-between gap-4 text-black no-underline transition-colors duration-200 hover:text-red"
                      >
                        <span className="text-clamp-1 min-w-0 flex-1 text-[clamp(14px,1.6vw,24px)] font-normal">{lecture.title}</span>
                        <span className="text-clamp-1 max-w-[40%] flex-shrink-0 text-right text-[clamp(12px,1.3vw,20px)] font-normal">{lecture.author}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="w-full h-px bg-black" />
          </div>
        </div>
      </section>
    </Skeleton>
  )
}
