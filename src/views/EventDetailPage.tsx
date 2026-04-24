'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { Skeleton } from 'boneyard-js/react'
import type { Event } from '@/lib/api'
import ArrowIcon from '../components/ArrowIcon'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LectureCard from '../components/LectureCard'
import { api } from '../lib/api'
import { formatEventDate, formatEventTime } from '../lib/date-time'
import { useMinimumSkeleton } from '../hooks/useMinimumSkeleton'

function eventDescription(event: Event, language: string) {
  if (language.startsWith('en')) {
    return event.descriptionEn || event.descriptionUk || ''
  }

  return event.descriptionUk || event.descriptionEn || ''
}

export default function EventDetailPage() {
  const { t, i18n } = useTranslation()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const id = params?.id
  const bonesMode = searchParams.get('bones') === '1'
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(!bonesMode)
  const skeletonLoading = useMinimumSkeleton(bonesMode || loading)

  useEffect(() => {
    if (!id) return

    if (bonesMode) return

    let isMounted = true

    api.getEvent(id)
      .then((data: Event & { error?: string }) => {
        if (!isMounted) return
        if (!data.error) {
          setEvent(data)
        } else {
          setEvent(null)
        }
      })
      .catch(() => {
        if (!isMounted) return
        setEvent(null)
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id, bonesMode, i18n.language])

  if (!bonesMode && !loading && !event) {
    return (
      <div className="page">
        <Navbar />
        <main className="content-shell py-16">
          <Link href="/events" className="mb-8 inline-block text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            ← {t('eventDetail.back')}
          </Link>
          <p className="text-[clamp(22px,2.4vw,36px)]">{t('eventDetail.notFound')}</p>
        </main>
        <Footer />
      </div>
    )
  }

  const description = event ? eventDescription(event, i18n.language) : ''
  const lectures = event?.lectures ?? []
  const registerHref = event?.registrationUrl?.trim()

  return (
    <div className="page">
      <Navbar />

      <Skeleton name="page-event-detail" loading={skeletonLoading} className="min-h-[720px]">
        {event && (
          <main>
            <section className="content-shell grid grid-cols-[1fr_minmax(320px,49%)] gap-9 border-b border-black py-[clamp(28px,4.2vw,64px)] max-[900px]:grid-cols-1">
              <div className="flex min-h-[clamp(360px,38vw,548px)] flex-col justify-between gap-10 max-[900px]:min-h-0">
                <div className="flex flex-col gap-8">
                  <Link href="/events" className="w-fit text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
                    ← {t('eventDetail.back')}
                  </Link>

                  <div className="flex flex-col gap-5">
                    <h1 className="text-[clamp(34px,5.6vw,96px)] font-normal uppercase leading-[0.95] tracking-[-0.04em]">
                      <span className="text-red">{'//'}</span> {event.city}
                    </h1>
                    <p className="max-w-[690px] text-[clamp(22px,2.4vw,36px)] font-normal uppercase leading-[1.12] tracking-[-0.04em]">
                      {event.title}
                    </p>
                  </div>
                </div>

                <div className="grid max-w-[690px] grid-cols-3 gap-6 border-t border-black pt-6 max-[767px]:grid-cols-1">
                  <div>
                    <p className="mb-2 text-[13px] uppercase opacity-55">{t('eventDetail.date')}</p>
                    <p className="text-[clamp(18px,1.6vw,24px)]">{formatEventDate(event.date)}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-[13px] uppercase opacity-55">{t('eventDetail.time')}</p>
                    <p className="text-[clamp(18px,1.6vw,24px)]">{formatEventTime(event.time)}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-[13px] uppercase opacity-55">{t('eventDetail.talks')}</p>
                    <p className="text-[clamp(18px,1.6vw,24px)]">{lectures.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {event.image ? (
                  <Image
                    src={event.image}
                    alt={`${event.city} ${formatEventDate(event.date)}`}
                    width={1200}
                    height={900}
                    unoptimized
                    className="block aspect-[1.12/1] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[1.12/1] w-full bg-red" />
                )}

                <div className="grid grid-cols-[1fr_auto] gap-6 max-[767px]:grid-cols-1">
                  <p className="text-[clamp(15px,1.4vw,20px)] leading-[1.35]">{event.location}</p>
                  {registerHref ? (
                    <a
                      href={registerHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-[69px] min-w-[220px] items-center justify-center gap-[10px] bg-black px-6 py-5 text-[clamp(16px,1.6vw,24px)] text-white no-underline transition-opacity duration-200 hover:opacity-85 max-[767px]:w-full"
                    >
                      <span>{t('eventDetail.register')}</span>
                      <ArrowIcon />
                    </a>
                  ) : (
                    <span className="flex h-[69px] min-w-[220px] items-center justify-center border border-black px-6 py-5 text-[clamp(16px,1.6vw,24px)] opacity-50 max-[767px]:w-full">
                      {t('eventDetail.registrationSoon')}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {(description || lectures.length > 0) && (
              <section className="content-shell grid grid-cols-[minmax(220px,327px)_1fr] gap-9 py-[clamp(32px,4.2vw,64px)] max-[900px]:grid-cols-1">
                <div className="flex flex-col gap-5">
                  <h2 className="text-[clamp(22px,2.4vw,36px)] font-normal uppercase leading-[1.15]">
                    <span className="text-red">{'//'}</span> {t('eventDetail.about')}
                  </h2>
                  {description && (
                    <p className="text-[clamp(15px,1.4vw,20px)] leading-[1.35]">{description}</p>
                  )}
                </div>

                <div>
                  <h2 className="mb-3 text-[clamp(22px,2.4vw,36px)] font-normal uppercase leading-[1.15]">
                    <span className="text-red">{'//'}</span> {t('eventDetail.talks')}
                  </h2>
                  {lectures.length > 0 ? (
                    <div>
                      {lectures.map((lecture) => (
                        <LectureCard key={lecture.id} lecture={lecture} variant="detail" />
                      ))}
                      <div className="h-px w-full bg-black" />
                    </div>
                  ) : (
                    <p className="border-t border-black py-8 text-[clamp(15px,1.4vw,20px)] opacity-60">
                      {t('eventDetail.noTalks')}
                    </p>
                  )}
                </div>
              </section>
            )}

            {!description && lectures.length === 0 && (
              <section className="content-shell py-[clamp(32px,4.2vw,64px)]">
                <div className="border-t border-black py-8">
                  <p className="text-[clamp(15px,1.4vw,20px)] opacity-60">{t('eventDetail.noTalks')}</p>
                </div>
              </section>
            )}

            <section className="content-shell pb-[clamp(32px,4.2vw,64px)]">
              <div className="flex items-center justify-between gap-6 border-t border-black pt-6 max-[767px]:flex-col max-[767px]:items-stretch">
                <p className="text-[clamp(18px,1.6vw,24px)] uppercase tracking-[-0.04em]">
                  {event.city} [{formatEventDate(event.date)}]
                </p>
                <div className="flex gap-6 max-[767px]:flex-col max-[767px]:gap-4">
                  <Link
                    href="/events"
                    className="flex h-[69px] min-w-[220px] items-center justify-center border border-red px-6 py-5 text-[clamp(16px,1.6vw,24px)] text-black no-underline transition-colors duration-200 hover:bg-red hover:text-white max-[767px]:w-full"
                  >
                    {t('eventDetail.back')}
                  </Link>
                  {registerHref && (
                    <a
                      href={registerHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-[69px] min-w-[220px] items-center justify-center gap-[10px] bg-black px-6 py-5 text-[clamp(16px,1.6vw,24px)] text-white no-underline transition-opacity duration-200 hover:opacity-85 max-[767px]:w-full"
                    >
                      <span>{t('eventDetail.register')}</span>
                      <ArrowIcon />
                    </a>
                  )}
                </div>
              </div>
            </section>
          </main>
        )}

        <Footer />
      </Skeleton>
    </div>
  )
}
