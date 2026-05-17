'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from 'boneyard-js/react'
import type { Lecture } from '@/lib/api'
import LectureCard from './LectureCard'
import { api } from '../lib/api'
import { useMinimumSkeleton } from '../hooks/useMinimumSkeleton'
import { TEXT_BONE_SNAPSHOT } from '@/lib/boneyard'

type LectureRowProps = {
  left: Lecture
  right: Lecture
  textLoading?: boolean
}

function LectureRow({ left, right, textLoading = false }: LectureRowProps) {
  return (
    <div className="flex items-stretch border-b border-black max-[767px]:flex-col">
      <LectureCard lecture={left} variant="horizontal" textLoading={textLoading} />
      <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
      <LectureCard lecture={right} variant="horizontal" textLoading={textLoading} />
    </div>
  )
}

export default function PopularLectures() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en' : 'uk'
  const previousLocaleRef = useRef(locale)
  const hasLoadedRef = useRef(false)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [textRefreshing, setTextRefreshing] = useState(false)
  const skeletonLoading = useMinimumSkeleton(loading)
  const textSkeletonLoading = useMinimumSkeleton(textRefreshing, 350)

  useEffect(() => {
    let isMounted = true
    const isLocaleRefresh = hasLoadedRef.current && previousLocaleRef.current !== locale
    previousLocaleRef.current = locale
    const pendingTimer = window.setTimeout(() => {
      if (!isMounted) return
      if (isLocaleRefresh) setTextRefreshing(true)
      else setLoading(true)
    }, 0)

    api
      .getLectures()
      .then((data) => {
        if (!isMounted) return
        setLectures(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!isMounted) return
        setLectures([])
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
  }, [locale])

  const rows: [Lecture, Lecture][] = []
  const visibleLectures = lectures.slice(0, 4)
  for (let i = 0; i + 1 < visibleLectures.length; i += 2) {
    rows.push([visibleLectures[i], visibleLectures[i + 1]])
  }

  return (
    <Skeleton name="home-popular-lectures" loading={skeletonLoading} className="min-h-[420px]" snapshotConfig={TEXT_BONE_SNAPSHOT}>
      <section className="pt-[clamp(32px,4.2vw,64px)]" id="lectures">
        <div className="content-shell">
          <div className="flex items-end gap-9 ml-[clamp(0px,13%,184px)] mb-[34px] max-[767px]:ml-0 max-[767px]:flex-wrap max-[767px]:gap-2">
            <span className="text-[clamp(14px,1.6vw,24px)] font-normal text-black pb-[7px] leading-none">{t('popularLectures.badge')}</span>
            <h2 className="text-[clamp(22px,2.4vw,36px)] font-normal text-black leading-[1.2]">
              <span className="text-red">{'//'}</span> {t('popularLectures.title')}
            </h2>
          </div>

          <div className="flex flex-col border-t border-black">
            {rows.map(([left, right]) => (
              <LectureRow key={left.id} left={left} right={right} textLoading={textSkeletonLoading} />
            ))}
          </div>
        </div>
      </section>
    </Skeleton>
  )
}
