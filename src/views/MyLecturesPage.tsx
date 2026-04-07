'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import ArrowIcon from '../components/ArrowIcon'
import { api } from '../lib/api'
import { useCurrentUser } from '../hooks/useCurrentUser'
import type { Lecture } from '@/lib/api'

const colorStyles: Record<string, string> = {
  orange: 'border-orange text-orange',
  green: 'border-green text-green',
  blue: 'border-blue text-blue',
  red: 'border-red text-red',
}

export default function MyLecturesPage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const [lectures, setLectures] = useState<Lecture[]>([])

  useEffect(() => {
    api.getLectures().then((all) => {
      setLectures(all.filter((l) => l.userId === user?.id))
    })
  }, [user?.id])

  async function handleDelete(id: string) {
    if (!window.confirm(t('myLectures.deleteConfirm'))) return
    await api.deleteLecture(id)
    setLectures(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black">{t('myLectures.title')}</h1>
          <Link
            href="/account/lectures/new"
            className="flex items-center gap-[10px] px-6 py-[14px] bg-black text-white no-underline text-[clamp(13px,1.2vw,18px)] font-normal uppercase transition-opacity duration-200 hover:opacity-85 whitespace-nowrap flex-shrink-0"
          >
            <span className="max-[767px]:hidden">{t('myLectures.addBtn')}</span>
            <ArrowIcon />
          </Link>
        </div>

        <div className="w-full h-px bg-black" />

        {lectures.length === 0 ? (
          <p className="py-8 text-[clamp(14px,1.3vw,20px)] text-black opacity-50">{t('myLectures.empty')}</p>
        ) : (
          <ul className="list-none">
            {lectures.map(lecture => (
              <li key={lecture.id} className="flex items-center justify-between gap-6 py-5 border-b border-black max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-3">
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <span
                    className={`inline-block px-3 py-1 text-[clamp(11px,1vw,14px)] font-normal border-[1.5px] w-fit whitespace-nowrap ${colorStyles[lecture.categoryColor] || colorStyles.red}`}
                  >
                    {lecture.category}
                  </span>
                  <p className="text-[clamp(14px,1.4vw,20px)] font-normal uppercase tracking-[-0.03em] text-black whitespace-nowrap overflow-hidden text-ellipsis">{lecture.title}</p>
                  <p className="text-[clamp(12px,1.1vw,16px)] text-black opacity-60">{lecture.author}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Link
                    href={`/account/lectures/${lecture.id}/edit`}
                    className="font-sans text-[clamp(12px,1.1vw,16px)] font-normal text-black underline bg-transparent border-none cursor-pointer p-0 uppercase opacity-70 transition-opacity duration-150 hover:opacity-100"
                  >
                    {t('myLectures.editBtn')}
                  </Link>
                  <button
                    className="font-sans text-[clamp(12px,1.1vw,16px)] font-normal text-red underline bg-transparent border-none cursor-pointer p-0 uppercase opacity-70 transition-opacity duration-150 hover:opacity-100"
                    onClick={() => handleDelete(lecture.id)}
                  >
                    {t('myLectures.deleteBtn')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
