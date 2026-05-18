'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import type { Event } from '@/lib/api'
import AppLayout from '../components/AppLayout'
import ArrowIcon from '../components/ArrowIcon'
import LectureCard from '../components/LectureCard'
import LoadingBlock from '../components/ui/LoadingBlock'
import { api } from '../lib/api'
import { formatEventDate, formatEventTime, getEventPhase } from '../lib/date-time'
import { useLocalizedFetch } from '../hooks/useLocalizedFetch'

export default function EventDetailPage() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const id = params?.id
  const bonesMode = searchParams.get('bones') === '1'

  const { data: event, loading, textRefreshing, hasLoaded } = useLocalizedFetch<Event | null>(
    async () => {
      if (!id) return null
      const data = await api.getEvent(id) as Event & { error?: string }
      return data?.error ? null : (data as Event)
    },
    [id],
    { enabled: !bonesMode && Boolean(id) },
  )

  const skeletonLoading = bonesMode || loading
  const textSkeletonLoading = textRefreshing
  const contentTextLoading = skeletonLoading || textSkeletonLoading

  if (!bonesMode && hasLoaded && !event) {
    return (
      <AppLayout hideJoin>
        <main className="content-shell py-16">
          <Link href="/events" className="mb-8 inline-block text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            ← {t('eventDetail.back')}
          </Link>
          <p className="text-[clamp(22px,2.4vw,36px)]">{t('eventDetail.notFound')}</p>
        </main>
      </AppLayout>
    )
  }

  const description = event?.description ?? ''
  const lectures = event?.lectures ?? []
  const registerHref = event?.registrationUrl?.trim()
  const photosHref = event?.eventPhotosUrl?.trim()
  const eventPhase = event ? getEventPhase(event.date, event.time) : 'upcoming'
  const registrationAvailable = Boolean(registerHref) && eventPhase === 'upcoming'
  const photosAvailable = Boolean(photosHref) && eventPhase === 'past'
  const activeRegisterClassName = "flex h-[69px] min-w-[220px] items-center justify-center gap-[10px] bg-black px-6 py-5 text-[clamp(16px,1.6vw,24px)] text-white no-underline transition-opacity duration-200 hover:opacity-85 max-[767px]:w-full"
  const disabledRegisterClassName = "flex h-[69px] min-w-[220px] cursor-not-allowed items-center justify-center gap-[10px] border border-black px-6 py-5 text-[clamp(16px,1.6vw,24px)] opacity-40 max-[767px]:w-full"
  const eventAction = registrationAvailable && registerHref ? (
    <a
      href={registerHref}
      target="_blank"
      rel="noopener noreferrer"
      className={activeRegisterClassName}
    >
      <span>{t('eventDetail.register')}</span>
      <ArrowIcon />
    </a>
  ) : eventPhase === 'live' ? (
    <span className={disabledRegisterClassName} aria-disabled="true">
      <span>{t('eventDetail.ongoing')}</span>
    </span>
  ) : photosAvailable && photosHref ? (
    <a
      href={photosHref}
      target="_blank"
      rel="noopener noreferrer"
      className={activeRegisterClassName}
    >
      <span>{t('eventDetail.photos')}</span>
      <ArrowIcon />
    </a>
  ) : null

  return (
    <AppLayout hideJoin>
      <div className="min-h-[720px]">
        <main>
            <section className="content-shell grid grid-cols-[1fr_minmax(320px,49%)] gap-9 border-b border-black py-[clamp(28px,4.2vw,64px)] max-[900px]:grid-cols-1">
              <div className="flex min-h-[clamp(360px,38vw,548px)] flex-col justify-between gap-10 max-[900px]:min-h-0">
                <div className="flex flex-col gap-8">
                  <Link href="/events" className="w-fit text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
                    ← {t('eventDetail.back')}
                  </Link>

                  <div className="flex flex-col gap-5">
                    {contentTextLoading ? (
                      <div className="flex max-w-[690px] flex-col gap-3">
                        <LoadingBlock className="h-[clamp(34px,5.6vw,96px)] w-[min(68vw,440px)]" />
                        <LoadingBlock className="h-7 w-40" />
                        <LoadingBlock className="h-10 w-full" />
                        <LoadingBlock className="h-10 w-4/5" />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-2">
                          <h1 className="text-[clamp(34px,5.6vw,96px)] font-normal uppercase leading-[0.95] tracking-[-0.04em] text-orange">
                            {event?.title}
                          </h1>
                          {/* <p className="text-[clamp(18px,1.8vw,28px)] font-normal uppercase leading-[1.05] tracking-[-0.03em] text-black">
                            [{event ? formatEventDate(event.date, true) : ''}]
                          </p> */}
                        </div>
                        <p className="max-w-[690px] text-[clamp(22px,2.4vw,36px)] font-normal uppercase leading-[1.12] tracking-[-0.04em]">
                          {event?.city}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid max-w-[690px] grid-cols-3 gap-6 border-t border-black pt-6 max-[767px]:grid-cols-1">
                  <div>
                    <p className="mb-2 text-[13px] uppercase opacity-55">{t('eventDetail.date')}</p>
                    {contentTextLoading ? (
                      <LoadingBlock className="h-7 w-28" />
                    ) : (
                      <p className="text-[clamp(18px,1.6vw,24px)]">{event ? formatEventDate(event.date, true) : ''}</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-[13px] uppercase opacity-55">{t('eventDetail.time')}</p>
                    {contentTextLoading ? (
                      <LoadingBlock className="h-7 w-20" />
                    ) : (
                      <p className="text-[clamp(18px,1.6vw,24px)]">{event ? formatEventTime(event.time) : ''}</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-[13px] uppercase opacity-55">{t('eventDetail.talks')}</p>
                    {contentTextLoading ? (
                      <LoadingBlock className="h-7 w-12" />
                    ) : (
                      <p className="text-[clamp(18px,1.6vw,24px)]">{lectures.length}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {skeletonLoading ? (
                  <LoadingBlock className="aspect-[1.12/1] w-full" />
                ) : event?.image ? (
                  <Image
                    src={event.image}
                    alt={`${event.city} ${formatEventDate(event.date, true)}`}
                    width={1200}
                    height={900}
                    priority
                    sizes="(max-width: 900px) 100vw, 50vw"
                    className="block aspect-[1.12/1] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[1.12/1] w-full bg-red" />
                )}

                <div className="grid grid-cols-[1fr_auto] gap-6 max-[767px]:grid-cols-1">
                  {contentTextLoading ? (
                    <div className="flex flex-col gap-3">
                      <LoadingBlock className="h-6 w-full" />
                      <LoadingBlock className="h-6 w-4/5" />
                    </div>
                  ) : (
                    <p className="text-[clamp(15px,1.4vw,20px)] leading-[1.35]">{event?.location}</p>
                  )}
                  {skeletonLoading ? (
                    <LoadingBlock className="h-[69px] min-w-[220px] max-[767px]:w-full" />
                  ) : eventAction}
                </div>
              </div>
            </section>

            {(skeletonLoading || description) && (
              <section className="content-shell border-b border-black py-[clamp(32px,4.2vw,64px)]">
                <div className="grid grid-cols-[minmax(220px,327px)_minmax(0,1fr)] gap-9 max-[900px]:grid-cols-1">
                  <h2 className="text-[clamp(22px,2.4vw,36px)] font-normal uppercase leading-[1.15]">
                    <span className="text-red">{'//'}</span> {t('eventDetail.about')}
                  </h2>
                  {contentTextLoading ? (
                    <div className="flex max-w-[960px] flex-col gap-3">
                      <LoadingBlock className="h-6 w-full" />
                      <LoadingBlock className="h-6 w-11/12" />
                      <LoadingBlock className="h-6 w-4/5" />
                      <LoadingBlock className="h-6 w-2/3" />
                    </div>
                  ) : description && (
                    <p className="max-w-[960px] text-[clamp(15px,1.4vw,20px)] leading-[1.35]">{description}</p>
                  )}
                </div>
              </section>
            )}

            {(skeletonLoading || description || lectures.length > 0) && (
              <section className="content-shell py-[clamp(32px,4.2vw,64px)]">
                <h2 className="mb-6 text-[clamp(22px,2.4vw,36px)] font-normal uppercase leading-[1.15]">
                  <span className="text-red">{'//'}</span> {t('eventDetail.talks')}
                </h2>
                {skeletonLoading ? (
                  <div className="grid grid-cols-2 gap-x-9 gap-y-6 max-[1199px]:gap-x-6 max-[767px]:grid-cols-1">
                    <LectureCard loading variant="compact" />
                    <LectureCard loading variant="compact" />
                    <LectureCard loading variant="compact" />
                    <LectureCard loading variant="compact" />
                  </div>
                ) : lectures.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-9 gap-y-6 max-[1199px]:gap-x-6 max-[767px]:grid-cols-1">
                    {lectures.map((lecture) => (
                      <LectureCard key={lecture.id} lecture={lecture} variant="compact" textLoading={textSkeletonLoading} />
                    ))}
                  </div>
                ) : (
                  <p className="border-t border-black py-8 text-[clamp(15px,1.4vw,20px)] opacity-60">
                    {t('eventDetail.noTalks')}
                  </p>
                )}
              </section>
            )}

            {!skeletonLoading && !description && lectures.length === 0 && (
              <section className="content-shell py-[clamp(32px,4.2vw,64px)]">
                <div className="border-t border-black py-8">
                  <p className="text-[clamp(15px,1.4vw,20px)] opacity-60">{t('eventDetail.noTalks')}</p>
                </div>
              </section>
            )}

            <section className="content-shell pb-[clamp(32px,4.2vw,64px)]">
              <div className="flex items-center justify-between gap-6 border-t border-black pt-6 max-[767px]:flex-col max-[767px]:items-stretch">
                {contentTextLoading ? (
                  <LoadingBlock className="h-7 w-72 max-w-full" />
                ) : (
                  <p className="text-[clamp(18px,1.6vw,24px)] uppercase tracking-[-0.04em]">
                    [{event ? formatEventDate(event.date, true) : ''}]
                  </p>
                )}
                <div className="flex gap-6 max-[767px]:flex-col max-[767px]:gap-4">
                  <Link
                    href="/events"
                    className="flex h-[69px] min-w-[220px] items-center justify-center border border-red px-6 py-5 text-[clamp(16px,1.6vw,24px)] text-black no-underline transition-colors duration-200 hover:bg-red hover:text-white max-[767px]:w-full"
                  >
                    {t('eventDetail.back')}
                  </Link>
                  {skeletonLoading ? (
                    <LoadingBlock className="h-[69px] min-w-[220px] max-[767px]:w-full" />
                  ) : eventAction}
                </div>
              </div>
            </section>
          </main>
      </div>
    </AppLayout>
  )
}
