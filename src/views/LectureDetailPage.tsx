'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import { Skeleton } from 'boneyard-js/react'
import type { Lecture, EventLecture } from '@/lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api } from '../lib/api'
import { CATEGORY_BORDER_CLASS as badgeBorderClass } from '../constants/colors'
import { useMinimumSkeleton } from '../hooks/useMinimumSkeleton'
import { resolveLectureVideo } from '../lib/lecture-video'
import { TEXT_BONE_SNAPSHOT } from '@/lib/boneyard'

function LoadingBlock({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse bg-black/10 ${className}`} />
}

export default function LectureDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en' : 'uk'
  const previousLocaleRef = useRef(locale)
  const hasLoadedRef = useRef(false)
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const id = params?.id
  const bonesMode = searchParams.get('bones') === '1'
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [related, setRelated] = useState<EventLecture[]>([])
  const [loading, setLoading] = useState(!bonesMode)
  const [textRefreshing, setTextRefreshing] = useState(false)
  const skeletonLoading = useMinimumSkeleton(bonesMode || loading)
  const textSkeletonLoading = useMinimumSkeleton(textRefreshing, 350)
  const [videoErrorLectureId, setVideoErrorLectureId] = useState<string | null>(null)
  const lectureCategoryLabel = lecture
    ? t(`lectureCategories.${lecture.category}`, { defaultValue: lecture.category })
    : ''
  const resolvedVideo = lecture ? resolveLectureVideo(lecture.videoUrl) : null
  const hasVideoError = lecture ? videoErrorLectureId === lecture.id : false

  useEffect(() => {
    if (!id) return
    if (bonesMode) return

    let isMounted = true
    const isLocaleRefresh = hasLoadedRef.current && previousLocaleRef.current !== locale
    previousLocaleRef.current = locale
    const pendingTimer = window.setTimeout(() => {
      if (!isMounted) return
      if (isLocaleRefresh) setTextRefreshing(true)
      else setLoading(true)
    }, 0)

    api.getLecture(id)
      .then(async (lectureData) => {
        if (!isMounted) return

        if (lectureData && !('error' in lectureData)) {
          setLecture(lectureData as Lecture)

          try {
            const eventData = await api.getEvent((lectureData as Lecture).eventId)
            if (isMounted && eventData && !('error' in eventData) && eventData.lectures) {
              setRelated(eventData.lectures)
            }
          } catch {
            // related stays empty
          }
        } else {
          setLecture(null)
          setRelated([])
        }
      })
      .catch(() => {
        if (!isMounted) return
        if (!isLocaleRefresh) {
          setLecture(null)
          setRelated([])
        }
      })
      .finally(() => {
        if (isMounted) {
          hasLoadedRef.current = true
          setLoading(false)
          setTextRefreshing(false)
        }
      })

    return () => {
      isMounted = false
      window.clearTimeout(pendingTimer)
    }
  }, [id, bonesMode, locale])

  if (!bonesMode && !loading && !lecture) {
    return (
      <div className="page min-h-screen">
        <Navbar />
        <main className="content-shell border-t border-black py-16 text-2xl">{t('lectureDetail.notFound')}</main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page min-h-screen">
      <Navbar />

      <Skeleton name="page-lecture-detail" loading={skeletonLoading} className="min-h-[720px]" snapshotConfig={TEXT_BONE_SNAPSHOT}>
        {lecture && (
          <main className="content-shell border-t border-black pt-[clamp(28px,4.2vw,64px)] pb-[clamp(48px,6vw,96px)]">

            {/* Back to lectures */}
            <Link
              href="/lectures"
              className="mb-[clamp(20px,2.4vw,36px)] inline-block w-fit text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline"
            >
              ← {t('lectureDetail.back')}
            </Link>

            {/* Title */}
            <h1 className="text-[clamp(24px,3.2vw,48px)] font-bold text-center uppercase tracking-[0.03em] mb-[clamp(24px,3vw,48px)] leading-[1.1]">
              {textSkeletonLoading ? (
                <LoadingBlock className="mx-auto h-[1em] w-[min(72vw,680px)]" />
              ) : lecture.title.toUpperCase()}
            </h1>

            {/* Hero: media + meta */}
            <div className="grid grid-cols-[58%_1fr] gap-[clamp(24px,3vw,48px)] mb-[clamp(32px,4vw,64px)] items-start max-[1023px]:grid-cols-1">
              <div>
                {resolvedVideo && !hasVideoError ? (
                  resolvedVideo.kind === 'iframe' ? (
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
                      <iframe
                        src={resolvedVideo.src}
                        title={lecture.title}
                        className="absolute inset-0 block h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
                      <video
                        className="absolute inset-0 block h-full w-full object-cover"
                        controls
                        playsInline
                        onError={() => setVideoErrorLectureId(lecture.id)}
                      >
                        <source src={resolvedVideo.src} />
                      </video>
                    </div>
                  )
                ) : (
                  <>
                    <Image
                      src={lecture.image}
                      alt={lecture.title}
                      width={1200}
                      height={900}
                      priority
                      quality={80}
                      sizes="(max-width: 1023px) 100vw, 58vw"
                      className="w-full aspect-[4/3] object-cover block max-[1023px]:aspect-[16/9]"
                    />
                    {hasVideoError && (
                      <p className="mt-4 border border-black/20 px-4 py-3 text-[clamp(12px,1.2vw,17px)] text-black/60">
                        {t('lectureDetail.videoUnavailable', { defaultValue: 'Video is unavailable.' })}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-5 pt-1">
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`inline-flex items-center px-5 py-[7px] text-[clamp(12px,1.2vw,18px)] font-normal border leading-none whitespace-nowrap ${badgeBorderClass[lecture.categoryColor] || 'border-red'}`}
                  >
                    {textSkeletonLoading ? <LoadingBlock className="h-4 w-24 bg-black/10" /> : lectureCategoryLabel}
                  </span>
                </div>
                <p className="text-[clamp(13px,1.3vw,20px)] leading-[1.55]">
                  {textSkeletonLoading ? (
                    <span className="flex flex-col gap-3">
                      <LoadingBlock className="h-5 w-full" />
                      <LoadingBlock className="h-5 w-11/12" />
                      <LoadingBlock className="h-5 w-4/5" />
                      <LoadingBlock className="h-5 w-2/3" />
                    </span>
                  ) : lecture.summary}
                </p>
                {lecture.videoUrl && !resolvedVideo && (
                  <a
                    href={lecture.videoUrl}
                    className="text-[clamp(12px,1.2vw,17px)] text-orange no-underline hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {lecture.videoUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-black my-[clamp(32px,4vw,56px)]" />

            {/* About author + materials */}
            <div className="grid grid-cols-2 gap-[clamp(32px,6vw,96px)] max-[1023px]:grid-cols-1 max-[1023px]:gap-[clamp(32px,4vw,48px)]">
              <section>
                <h2 className="text-[clamp(16px,1.8vw,26px)] font-normal uppercase mb-[clamp(20px,2.4vw,36px)] tracking-[0.02em]">
                  <span className="text-red">{'//'}</span> {t('lectureDetail.aboutAuthor')}
                </h2>
                <div className="grid grid-cols-[auto_1fr] gap-8 items-start max-[767px]:grid-cols-1 max-[767px]:gap-5">
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <p className="text-[clamp(12px,1.2vw,17px)] font-bold text-orange tracking-[0.04em] mb-1">
                      {textSkeletonLoading ? <LoadingBlock className="h-5 w-32" /> : lecture.author.toUpperCase()}
                    </p>
                  </div>
                  {lecture.authorBio && (
                    <p className="text-[clamp(13px,1.3vw,19px)] leading-[1.55]">
                      {textSkeletonLoading ? (
                        <span className="flex flex-col gap-3">
                          <LoadingBlock className="h-5 w-full" />
                          <LoadingBlock className="h-5 w-11/12" />
                          <LoadingBlock className="h-5 w-3/4" />
                        </span>
                      ) : lecture.authorBio}
                    </p>
                  )}
                </div>
              </section>

              {(lecture.presentationUrl || (lecture.sources && lecture.sources.length > 0)) && (
                <section>
                  <h2 className="text-[clamp(16px,1.8vw,26px)] font-normal uppercase mb-[clamp(20px,2.4vw,36px)] tracking-[0.02em]">
                    <span className="text-red">{'//'}</span> {t('lectureDetail.additionalMaterials')}
                  </h2>
                  <div className="flex flex-col gap-8">
                    {lecture.presentationUrl && (
                      <div className="flex flex-col gap-3">
                        <p className="text-[clamp(12px,1.1vw,16px)] uppercase tracking-[0.04em] text-black/55">
                          {t('lectureDetail.presentation')}
                        </p>
                        <a
                          href={lecture.presentationUrl}
                          className="text-[clamp(13px,1.3vw,19px)] text-orange no-underline hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {lecture.presentationUrl.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}

                    {lecture.sources && lecture.sources.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <p className="text-[clamp(12px,1.1vw,16px)] uppercase tracking-[0.04em] text-black/55">
                          {t('lectureDetail.additionalSources')}
                        </p>
                        <ol className="list-none flex flex-col gap-3 p-0" style={{ counterReset: 'sources' }}>
                          {lecture.sources.map((s, i) => (
                            <li
                              key={i}
                              className="text-[clamp(13px,1.3vw,19px)] leading-[1.4] flex gap-2"
                              style={{ counterIncrement: 'sources' }}
                            >
                              <span className="flex-shrink-0">{i + 1}.</span>
                              {s.url ? (
                                <>
                                  {s.name.split('–')[0]}
                                  {s.name.includes('–') && '– '}
                                  <a
                                    href={s.url}
                                    className="text-orange no-underline hover:underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {s.url.replace(/^https?:\/\//, '')}
                                  </a>
                                </>
                              ) : (
                                s.name
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Other lectures from same event */}
            {related.length > 0 && (
              <>
                <div className="w-full h-px bg-black my-[clamp(32px,4vw,56px)]" />
                <section>
                  <h2 className="text-[clamp(16px,1.8vw,26px)] font-normal uppercase mb-[clamp(20px,2.4vw,36px)] tracking-[0.02em]">
                    <span className="text-red">{'//'}</span> {t('lectureDetail.aboutEvent')}
                  </h2>
                  <div className="grid grid-cols-4 gap-0 border-y border-black max-[1023px]:grid-cols-2">
                    {related.map((r) => {
                      const isCurrent = r.id === id
                      const title = locale === 'en' ? (r.titleEn || r.titleUk || r.title) : (r.titleUk || r.titleEn || r.title)
                      const author = locale === 'en' ? (r.authorEn || r.authorUk || r.author) : (r.authorUk || r.authorEn || r.author)

                      const cardContent = (
                        <>
                          <div className="relative mb-3">
                            <Image
                              src={r.image}
                              alt={title}
                              width={900}
                              height={600}
                              sizes="(max-width: 1023px) 50vw, 25vw"
                              className={`w-full aspect-[3/2] object-cover block transition-opacity duration-200 ${isCurrent ? '' : 'hover:opacity-85'}`}
                            />
                            <span
                              className={`absolute top-2 left-2 text-[clamp(10px,1vw,14px)] px-[10px] py-1 bg-white border leading-none ${badgeBorderClass[r.categoryColor] || 'border-red'}`}
                            >
                              {t(`lectureCategories.${r.category}`, { defaultValue: r.category })}
                            </span>
                          </div>
                          <p className="text-[clamp(11px,1.1vw,15px)] font-normal uppercase tracking-[0.02em] leading-[1.3] mb-1.5 px-3">
                            {title.toUpperCase()}
                          </p>
                          <p className="text-[clamp(10px,1vw,14px)] opacity-60 px-3">
                            {author}
                          </p>
                        </>
                      )

                      if (isCurrent) {
                        return (
                          <div
                            key={r.id}
                            aria-current="page"
                            className="flex flex-col pb-6 border-r border-black last:border-r-0 max-[1023px]:[&:nth-child(2)]:border-r-0 max-[1023px]:[&:nth-child(1)]:border-b max-[1023px]:[&:nth-child(2)]:border-b opacity-40 cursor-not-allowed select-none"
                          >
                            {cardContent}
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={r.id}
                          href={`/lectures/${r.id}`}
                          className="no-underline text-inherit flex flex-col pb-6 border-r border-black cursor-pointer last:border-r-0 max-[1023px]:[&:nth-child(2)]:border-r-0 max-[1023px]:[&:nth-child(1)]:border-b max-[1023px]:[&:nth-child(2)]:border-b"
                        >
                          {cardContent}
                        </Link>
                      )
                    })}
                  </div>
                </section>
              </>
            )}

            {/* Bottom actions */}
            <div className="flex items-center justify-between gap-6 border-t border-black pt-6 mt-[clamp(32px,4vw,56px)] max-[767px]:flex-col max-[767px]:items-stretch">
              <Link
                href="/lectures"
                className="w-fit text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline max-[767px]:w-full"
              >
                ← {t('lectureDetail.back')}
              </Link>
              {lecture.eventId && (
                <Link
                  href={`/events/${lecture.eventId}`}
                  className="flex h-[52px] min-w-[200px] items-center justify-center border border-black px-6 text-[clamp(14px,1.4vw,20px)] text-black no-underline uppercase tracking-wide transition-colors duration-200 hover:bg-black hover:text-white max-[767px]:w-full"
                >
                  {t('lectureDetail.toEvent')} →
                </Link>
              )}
            </div>
          </main>
        )}

        <Footer />
      </Skeleton>
    </div>
  )
}
