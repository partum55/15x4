'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { Skeleton } from 'boneyard-js/react'
import type { Lecture } from '@/lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api } from '../lib/api'
import { CATEGORY_BORDER_CLASS as badgeBorderClass } from '../constants/colors'

type ResolvedLectureVideo = {
  kind: 'iframe' | 'file'
  src: string
}

function toHttpUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

function getYouTubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase()

  if (host === 'youtu.be') {
    return url.pathname.slice(1) || null
  }

  if (host.endsWith('youtube.com')) {
    if (url.pathname === '/watch') {
      return url.searchParams.get('v')
    }

    if (url.pathname.startsWith('/embed/')) {
      return url.pathname.split('/')[2] || null
    }

    if (url.pathname.startsWith('/shorts/')) {
      return url.pathname.split('/')[2] || null
    }
  }

  return null
}

function getVimeoId(url: URL): string | null {
  const host = url.hostname.toLowerCase()
  if (!host.endsWith('vimeo.com')) {
    return null
  }

  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length === 0) {
    return null
  }

  const id = parts[parts.length - 1]
  return /^\d+$/.test(id) ? id : null
}

function resolveLectureVideo(videoUrl?: string): ResolvedLectureVideo | null {
  if (!videoUrl) {
    return null
  }

  const url = toHttpUrl(videoUrl.trim())
  if (!url) {
    return null
  }

  const youTubeId = getYouTubeId(url)
  if (youTubeId) {
    return {
      kind: 'iframe',
      src: `https://www.youtube.com/embed/${youTubeId}?autoplay=1&rel=0`,
    }
  }

  const vimeoId = getVimeoId(url)
  if (vimeoId) {
    return {
      kind: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
    }
  }

  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    return {
      kind: 'file',
      src: url.toString(),
    }
  }

  if (url.pathname.startsWith('/embed/')) {
    return {
      kind: 'iframe',
      src: url.toString(),
    }
  }

  return null
}

export default function LectureDetailPage() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const id = params?.id
  const bonesMode = searchParams.get('bones') === '1'
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [related, setRelated] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [openedVideoLectureId, setOpenedVideoLectureId] = useState<string | null>(null)
  const lectureCategoryLabel = lecture
    ? t(`lectureCategories.${lecture.category}`, { defaultValue: lecture.category })
    : ''
  const resolvedVideo = lecture ? resolveLectureVideo(lecture.videoUrl) : null
  const isVideoOpen = lecture ? openedVideoLectureId === lecture.id : false

  useEffect(() => {
    if (!id) return

    if (bonesMode) {
      setLoading(true)
      setLecture(null)
      setRelated([])
      return
    }

    let isMounted = true
    setLoading(true)

    Promise.all([api.getLecture(id), api.getLectures()])
      .then(([lectureData, allLectures]) => {
        if (!isMounted) return

        if (lectureData && !('error' in lectureData)) {
          setLecture(lectureData)
        } else {
          setLecture(null)
        }

        const lectures = Array.isArray(allLectures) ? allLectures : []
        setRelated(lectures.filter((l) => l.id !== id).slice(0, 4))
      })
      .catch(() => {
        if (!isMounted) return
        setLecture(null)
        setRelated([])
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id, bonesMode])

  if (!bonesMode && !loading && !lecture) {
    return (
      <div className="page min-h-screen">
        <Navbar />
        <div className="px-[clamp(16px,3.2vw,48px)] py-16 text-2xl">{t('lectureDetail.notFound')}</div>
      </div>
    )
  }

  return (
    <div className="page min-h-screen">
      <Navbar />

      <Skeleton name="page-lecture-detail" loading={bonesMode || loading}>
        {lecture && (
          <main className="px-[clamp(16px,3.2vw,48px)] pb-[clamp(48px,6vw,96px)]">
        {/* Title */}
        <h1 className="text-[clamp(24px,3.2vw,48px)] font-bold text-center uppercase tracking-[0.03em] mb-[clamp(24px,3vw,48px)] leading-[1.1]">
          {lecture.title.toUpperCase()}
        </h1>

        {/* Hero: image + meta */}
        <div className="grid grid-cols-[58%_1fr] gap-[clamp(24px,3vw,48px)] mb-[clamp(32px,4vw,64px)] items-start max-[1023px]:grid-cols-1">
          <div className="relative">
            {isVideoOpen && resolvedVideo ? (
              resolvedVideo.kind === 'iframe' ? (
                <iframe
                  src={resolvedVideo.src}
                  title={lecture.title}
                  className="w-full aspect-[4/3] block border-0 max-[1023px]:aspect-[16/9]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={resolvedVideo.src}
                  className="w-full aspect-[4/3] object-cover block max-[1023px]:aspect-[16/9]"
                  controls
                  autoPlay
                  playsInline
                />
              )
            ) : (
              <>
                <Image
                  src={lecture.image}
                  alt={lecture.title}
                  width={1200}
                  height={900}
                  unoptimized
                  className="w-full aspect-[4/3] object-cover block max-[1023px]:aspect-[16/9]"
                />
                {resolvedVideo && (
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center bg-transparent border-none cursor-pointer transition-opacity duration-200 hover:opacity-80"
                    aria-label={t('lectureDetail.play')}
                    onClick={() => setOpenedVideoLectureId(lecture.id)}
                  >
                    <svg
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-[clamp(48px,7vw,96px)] h-[clamp(48px,7vw,96px)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                    >
                      <polygon points="16,10 40,24 16,38" fill="white" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-5 pt-1">
            <div className="flex items-center justify-between gap-4">
              <span
                className={`inline-flex items-center px-5 py-[7px] text-[clamp(12px,1.2vw,18px)] font-normal border leading-none whitespace-nowrap ${badgeBorderClass[lecture.categoryColor] || 'border-red'}`}
              >
                {lectureCategoryLabel}
              </span>
              {lecture.duration && (
                <span className="text-[clamp(12px,1.2vw,18px)] opacity-70 whitespace-nowrap">{lecture.duration}</span>
              )}
            </div>
            <p className="text-[clamp(13px,1.3vw,20px)] leading-[1.55]">{lecture.summary}</p>
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

        {/* About author + sources */}
        <div className="grid grid-cols-2 gap-[clamp(32px,6vw,96px)] max-[1023px]:grid-cols-1 max-[1023px]:gap-[clamp(32px,4vw,48px)]">
          <section>
            <h2 className="text-[clamp(16px,1.8vw,26px)] font-normal uppercase mb-[clamp(20px,2.4vw,36px)] tracking-[0.02em]">
              <span className="text-red">{'//'}</span> {t('lectureDetail.aboutAuthor')}
            </h2>
            <div className="grid grid-cols-[auto_1fr] gap-8 items-start max-[767px]:grid-cols-1 max-[767px]:gap-5">
              <div className="flex flex-col gap-2 min-w-[140px]">
                <p className="text-[clamp(12px,1.2vw,17px)] font-bold text-orange tracking-[0.04em] mb-1">
                  {lecture.author.toUpperCase()}
                </p>
                {lecture.socialLinks?.map((s) => (
                  <div key={s.type} className="flex items-baseline gap-2">
                    <span className="text-[clamp(11px,1.1vw,15px)] text-black whitespace-nowrap">[{s.type}]</span>
                    <a
                      href={s.url}
                      className="text-[clamp(11px,1.1vw,15px)] text-orange no-underline hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.url}
                    </a>
                  </div>
                ))}
              </div>
              {lecture.authorBio && (
                <p className="text-[clamp(13px,1.3vw,19px)] leading-[1.55]">{lecture.authorBio}</p>
              )}
            </div>
          </section>

          {lecture.sources && lecture.sources.length > 0 && (
            <section>
              <h2 className="text-[clamp(16px,1.8vw,26px)] font-normal uppercase mb-[clamp(20px,2.4vw,36px)] tracking-[0.02em]">
                <span className="text-red">{'//'}</span> {t('lectureDetail.additionalSources')}
              </h2>
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
            </section>
          )}
        </div>

        {/* About event */}
        {(lecture.eventCity || lecture.eventDate) && (
          <>
            <div className="w-full h-px bg-black my-[clamp(32px,4vw,56px)]" />
            <section>
              <h2 className="text-[clamp(16px,1.8vw,26px)] font-normal uppercase mb-[clamp(20px,2.4vw,36px)] tracking-[0.02em]">
                <span className="text-red">{'//'}</span> {t('lectureDetail.aboutEvent')}
              </h2>
              <div className="flex items-baseline gap-[clamp(16px,3vw,48px)] mb-[clamp(24px,3vw,40px)] max-[767px]:flex-wrap max-[767px]:gap-2">
                {lecture.eventCity && (
                  <span className="text-[clamp(13px,1.3vw,18px)] font-normal tracking-[0.05em]">{lecture.eventCity.toUpperCase()}</span>
                )}
                {lecture.eventDate && (
                  <span className="text-[clamp(13px,1.3vw,18px)]">[{lecture.eventDate}]</span>
                )}
                {lecture.eventPhotosUrl && (
                  <a
                    href={lecture.eventPhotosUrl}
                    className="ml-auto text-[clamp(12px,1.2vw,17px)] text-orange no-underline flex items-baseline gap-1 hover:underline max-[767px]:ml-0 max-[767px]:w-full"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('lectureDetail.eventPhotos')}&nbsp;<span className="text-[0.9em]">↗</span>
                  </a>
                )}
              </div>

              {related.length > 0 && (
                <div className="grid grid-cols-4 gap-0 border-t border-black max-[1023px]:grid-cols-2">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/lectures/${r.id}`}
                      className="no-underline text-inherit flex flex-col pb-6 border-r border-black cursor-pointer last:border-r-0 max-[1023px]:[&:nth-child(2)]:border-r-0 max-[1023px]:[&:nth-child(1)]:border-b max-[1023px]:[&:nth-child(2)]:border-b"
                    >
                      <div className="relative mb-3">
                        <Image
                          src={r.image}
                          alt={r.title}
                          width={900}
                          height={600}
                          unoptimized
                          className="w-full aspect-[3/2] object-cover block transition-opacity duration-200 hover:opacity-85"
                        />
                        <span
                          className={`absolute top-2 left-2 text-[clamp(10px,1vw,14px)] px-[10px] py-1 bg-white border leading-none ${badgeBorderClass[r.categoryColor] || 'border-red'}`}
                        >
                          {t(`lectureCategories.${r.category}`, { defaultValue: r.category })}
                        </span>
                      </div>
                      <p className="text-[clamp(11px,1.1vw,15px)] font-normal uppercase tracking-[0.02em] leading-[1.3] mb-1.5 px-3">{r.title.toUpperCase()}</p>
                      <p className="text-[clamp(10px,1vw,14px)] opacity-60 px-3">{r.author}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
          </main>
        )}

        <Footer />
      </Skeleton>
    </div>
  )
}
