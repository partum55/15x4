'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import type { Lecture } from '../data/lectures'
import { api } from '../lib/api'
import { CATEGORY_COLOR_VAR } from '../constants/colors'

export function LectureCard({ id, category, categoryColor, author, image, title, summary }: Lecture) {
  const [hovered, setHovered] = useState(false)

  const bgColor = CATEGORY_COLOR_VAR[categoryColor] || 'var(--color-red)'

  return (
    <Link
      href={`/lectures/${id}`}
      className="flex-1 min-w-0 flex flex-col pt-12 pb-12 no-underline text-inherit cursor-pointer transition-colors duration-200 ease-in max-[1199px]:pt-8 max-[1199px]:pb-8 max-[767px]:pt-6 max-[767px]:pb-6 max-[767px]:border-b max-[767px]:border-black last:max-[767px]:border-b-0"
      style={hovered ? { backgroundColor: bgColor, color: 'var(--color-white)' } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between min-h-[40px] mb-6 gap-2">
        <span
          className="inline-flex items-center px-6 py-2 text-[clamp(13px,1.3vw,20px)] font-normal border border-transparent leading-none whitespace-nowrap flex-shrink-0 max-[1199px]:px-4 max-[1199px]:py-1.5"
          style={{
            borderColor: bgColor,
            backgroundColor: hovered ? bgColor : 'var(--color-white)',
            color: hovered ? 'var(--color-white)' : 'inherit',
          }}
        >
          {category}
        </span>
        <span className="text-[clamp(13px,1.3vw,20px)] font-normal text-right flex-shrink-0">{author}</span>
      </div>
      <Image
        src={image}
        alt={title}
        width={900}
        height={600}
        unoptimized
        className="w-full h-[clamp(160px,20.9vw,300px)] object-cover block mb-6 transition-opacity duration-200 hover:opacity-85 max-[767px]:h-[200px]"
      />
      <div className="flex flex-col gap-6">
        <p className="text-[clamp(16px,1.6vw,24px)] font-normal leading-[1.2]">{title}</p>
        <p className="text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.2]">{summary}</p>
      </div>
    </Link>
  )
}

type LectureRowProps = {
  left: Lecture
  right: Lecture
}

function LectureRow({ left, right }: LectureRowProps) {
  return (
    <div className="flex flex-col">
      <div className="w-full h-px bg-black" />
      <div className="flex items-stretch max-[767px]:flex-col">
        <LectureCard {...left} />
        <div className="w-px bg-black flex-shrink-0 mx-[18px] max-[767px]:hidden" />
        <LectureCard {...right} />
      </div>
      <div className="w-full h-px bg-black" />
    </div>
  )
}

export default function PopularLectures() {
  const { t } = useTranslation()
  const [lectures, setLectures] = useState<Lecture[]>([])

  useEffect(() => {
    api
      .getLectures()
      .then((data) => setLectures(Array.isArray(data) ? data : []))
      .catch(() => setLectures([]))
  }, [])

  const rows: [Lecture, Lecture][] = []
  for (let i = 0; i + 1 < lectures.length; i += 2) {
    rows.push([lectures[i], lectures[i + 1]])
  }

  return (
    <section className="pt-[clamp(32px,4.2vw,64px)]" id="lectures">
      <div className="px-[clamp(16px,3.2vw,48px)]">
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
  )
}
