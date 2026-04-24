'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from 'boneyard-js/react'
import type { Lecture } from '@/lib/api'
import LectureCard from './LectureCard'
import { api } from '../lib/api'

type LectureRowProps = {
  left: Lecture
  right: Lecture
}

function LectureRow({ left, right }: LectureRowProps) {
  return (
    <div className="flex flex-col">
      <div className="w-full h-px bg-black" />
      <div className="flex items-stretch max-[767px]:flex-col">
        <LectureCard lecture={left} variant="popular" className="pr-[18px] max-[767px]:pr-0" />
        <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
        <LectureCard lecture={right} variant="popular" className="pl-[18px] max-[767px]:pl-0" />
      </div>
      <div className="w-full h-px bg-black" />
    </div>
  )
}

export default function PopularLectures() {
  const { t } = useTranslation()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

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
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const rows: [Lecture, Lecture][] = []
  const visibleLectures = lectures.slice(0, 4)
  for (let i = 0; i + 1 < visibleLectures.length; i += 2) {
    rows.push([visibleLectures[i], visibleLectures[i + 1]])
  }

  return (
    <Skeleton name="home-popular-lectures" loading={loading}>
      <section className="pt-[clamp(32px,4.2vw,64px)]" id="lectures">
        <div className="content-shell">
          <div className="flex items-end gap-9 ml-[clamp(0px,13%,184px)] mb-[34px] max-[767px]:ml-0 max-[767px]:flex-wrap max-[767px]:gap-2">
            <span className="text-[clamp(14px,1.6vw,24px)] font-normal text-black pb-[7px] leading-none">{t('popularLectures.badge')}</span>
            <h2 className="text-[clamp(22px,2.4vw,36px)] font-normal text-black leading-[1.2]">
              <span className="text-red">{'//'}</span> {t('popularLectures.title')}
            </h2>
          </div>

          <div className="flex flex-col">
            {rows.map(([left, right]) => (
              <LectureRow key={left.id} left={left} right={right} />
            ))}
          </div>
        </div>
      </section>
    </Skeleton>
  )
}
