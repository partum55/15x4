'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Skeleton } from 'boneyard-js/react'
import LoadingBlock from './ui/LoadingBlock'
import EventPhaseAction from './EventPhaseAction'
import type { Event } from '@/lib/api'
import { api } from '../lib/api'
import { formatEventDate, formatEventTime, getEventPhase, getEventStartTimestamp } from '../lib/date-time'
import { useLocalizedFetch } from '../hooks/useLocalizedFetch'
import { useAuth } from '../context/AuthContext'
import { findCityOption } from '../constants/cities'
import { TEXT_BONE_SNAPSHOT } from '@/lib/boneyard'

function normalizeCity(value?: string | null) {
  const city = findCityOption(value)
  return city?.id ?? value?.trim().toLocaleLowerCase('uk') ?? ''
}

function eventTimestamp(event: Event) {
  return getEventStartTimestamp(event.date, event.time) ?? Number.POSITIVE_INFINITY
}

function matchesCity(event: Event, city: string) {
  return (
    normalizeCity(event.city) === city ||
    normalizeCity(event.cityUk) === city ||
    normalizeCity(event.cityEn) === city
  )
}

export default function UpcomingEvents() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState('')
  const [citySelectionTouched, setCitySelectionTouched] = useState(false)
  const { data, loading: skeletonLoading, textRefreshing: textSkeletonLoading } = useLocalizedFetch<{ events: Event[]; fetchedAt: number }>(
    async () => {
      const list = await api.getEvents()
      return { events: Array.isArray(list) ? list : [], fetchedAt: Date.now() }
    },
  )
  const rawEvents = data?.events
  const now = data?.fetchedAt ?? 0
  const loading = skeletonLoading

  const upcomingEvents = useMemo(() => {
    if (!now || !rawEvents) return []
    return rawEvents
      .filter((event) => {
        const ts = eventTimestamp(event)
        return Number.isFinite(ts) && getEventPhase(event.date, event.time, now) !== 'past'
      })
      .sort((a, b) => eventTimestamp(a) - eventTimestamp(b))
  }, [rawEvents, now])

  const availableCities = useMemo(() => {
    const seen = new Map<string, string>()
    for (const event of upcomingEvents) {
      const key = normalizeCity(event.cityUk) || normalizeCity(event.cityEn)
      if (key && !seen.has(key)) {
        seen.set(key, event.city)
      }
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }))
  }, [upcomingEvents])

  const defaultCity = user?.profile?.city ? normalizeCity(user.profile.city) : ''
  const activeCity = citySelectionTouched ? selectedCity : defaultCity
  const dropdownValue = availableCities.some((c) => c.value === activeCity)
    ? activeCity
    : ''

  const visibleEvents = useMemo(() => {
    if (upcomingEvents.length === 0) return []

    if (!activeCity) return upcomingEvents.slice(0, 1)

    const cityFiltered = upcomingEvents.filter((event) => matchesCity(event, activeCity))
    return cityFiltered.length > 0 ? cityFiltered.slice(0, 1) : upcomingEvents.slice(0, 1)
  }, [upcomingEvents, activeCity])

  return (
    <Skeleton name="home-upcoming-events" loading={skeletonLoading} className="min-h-[420px]" snapshotConfig={TEXT_BONE_SNAPSHOT}>
      <section className="pt-[clamp(32px,4.2vw,64px)]" id="events">
        <div className="content-shell">
          <div className="ml-[clamp(0px,25.6%,363px)] mb-6 max-[1199px]:ml-0 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <h2 className="text-[clamp(22px,2.4vw,36px)] font-normal text-black leading-[1.2]">
              <span className="text-red">{'//'}</span> {t('upcomingEvents.title')}
            </h2>

            {availableCities.length > 1 && (
              <div className="flex items-center gap-1 text-[clamp(13px,1.3vw,20px)] font-normal text-black">
                <span className="text-red">[</span>
                <select
                  value={dropdownValue}
                  onChange={(e) => {
                    setSelectedCity(e.target.value)
                    setCitySelectionTouched(true)
                  }}
                  className="ui-select ui-select--inline"
                >
                  <option value="">{t('upcomingEvents.allCities')}</option>
                  {availableCities.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <span className="text-red">]</span>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {visibleEvents.length === 0 && !loading ? (
              <>
                <div className="w-full h-px bg-black" />
                <p className="py-8 text-[clamp(13px,1.3vw,20px)] font-normal text-black/50">
                  {t('upcomingEvents.noEvents')}
                </p>
              </>
            ) : (
              visibleEvents.map((event) => (
                    <div key={event.id}>
                      <div className="w-full h-px bg-black" />
                      <div
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            const el = e.target as HTMLElement
                            if (el.closest('a')) return
                            router.push(`/events/${event.id}`)
                          }
                        }}
                        onClick={(e) => {
                          const el = e.target as HTMLElement
                          if (el.closest('a')) return
                          router.push(`/events/${event.id}`)
                        }}
                        className="flex min-h-[290px] items-stretch gap-9 max-[1199px]:gap-6 max-[900px]:grid max-[900px]:grid-cols-[minmax(220px,327px)_1fr] max-[767px]:flex max-[767px]:flex-col max-[767px]:min-h-0 cursor-pointer"
                      >
                    {/* Col 1: info */}
                    <div className="flex w-[clamp(220px,23.1%,327px)] flex-shrink-0 flex-col justify-between py-6 max-[900px]:w-full max-[767px]:pb-4">
                      <div className="flex flex-col gap-6">
                        {textSkeletonLoading ? (
                          <>
                            <LoadingBlock className="h-7 w-56 max-w-full" />
                            <LoadingBlock className="h-14 w-full" />
                            <LoadingBlock className="h-5 w-20" />
                          </>
                        ) : (
                          <>
                            <p className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em]">{event.city} [{formatEventDate(event.date, true)}]</p>
                            <p className="text-[clamp(13px,1.3vw,20px)] font-normal leading-[1.35]">{event.location}</p>
                            <p className="text-[clamp(13px,1.3vw,20px)] font-normal">{formatEventTime(event.time)}</p>
                          </>
                        )}
                      </div>
                      <div className="mt-6">
                        <EventPhaseAction
                          date={event.date}
                          time={event.time}
                          registrationUrl={event.registrationUrl}
                          eventPhotosUrl={event.eventPhotosUrl}
                          labels={{
                            register: t('upcomingEvents.register'),
                            ongoing: t('upcomingEvents.ongoing'),
                            photos: t('upcomingEvents.photos'),
                          }}
                          now={now}
                          fullWidth
                        />
                      </div>
                    </div>

                    {/* Col 2: image */}
                    <Link
                      href={`/events/${event.id}`}
                      className="w-[clamp(220px,23.1%,327px)] flex-shrink-0 max-[900px]:order-3 max-[900px]:w-full max-[767px]:order-none"
                    >
                      <Image
                        src={event.image}
                        alt={t('upcomingEvents.imageAlt', { city: event.city })}
                        width={327}
                        height={290}
                        priority
                        sizes="(max-width: 767px) 100vw, 327px"
                        className="block h-full min-h-[290px] w-full object-cover max-[900px]:h-[220px] max-[900px]:min-h-0"
                      />
                    </Link>

                    {/* Col 3: talks */}
                    <div className="flex min-w-0 flex-1 flex-col gap-5 py-6 max-[900px]:col-start-2 max-[900px]:row-span-2 max-[767px]:w-full max-[767px]:gap-3 max-[767px]:pt-4">
                      {textSkeletonLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="flex items-baseline justify-between gap-4">
                            <LoadingBlock className="h-6 w-3/5" />
                            <LoadingBlock className="h-5 w-1/4" />
                          </div>
                        ))
                      ) : (event.lectures ?? []).slice(0, 4).map((lecture) => (
                        <Link
                          key={lecture.id}
                          href={`/lectures/${lecture.id}`}
                          className="group flex items-baseline justify-between gap-4 text-black no-underline transition-colors duration-200 hover:text-red"
                        >
                          <span className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-clamp-1 text-[clamp(14px,1.6vw,24px)] font-normal">{lecture.title}</span>
                          </span>
                          <span className="max-w-[40%] flex-shrink-0 overflow-hidden text-right">
                            <span className="text-clamp-1 text-[clamp(12px,1.3vw,20px)] font-normal">{lecture.author}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="w-full h-px bg-black" />
          </div>
        </div>
      </section>
    </Skeleton>
  )
}
