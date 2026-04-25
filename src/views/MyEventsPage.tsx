'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import ArrowIcon from '../components/ArrowIcon'
import { api } from '../lib/api'
import { formatEventDate, formatEventTime } from '../lib/date-time'
import { useCurrentUser } from '../hooks/useCurrentUser'
import type { Event } from '@/lib/api'

export default function MyEventsPage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const [events, setEvents] = useState<Event[]>([])
  const [deletingEventIds, setDeletingEventIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user?.id) return
    api.getMyEvents().then(setEvents)
  }, [user?.id])

  async function handleDelete(id: string) {
    if (deletingEventIds.has(id)) return
    if (!window.confirm(t('myEvents.deleteConfirm'))) return
    setDeletingEventIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    try {
      await api.deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } finally {
      setDeletingEventIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="content-shell flex-1 py-[clamp(32px,4.2vw,64px)]">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black">{t('myEvents.title')}</h1>
          <Link
            href="/account/events/new"
            className="flex items-center gap-[10px] px-6 py-[14px] bg-black text-white no-underline text-[clamp(13px,1.2vw,18px)] font-normal uppercase transition-opacity duration-200 hover:opacity-85 whitespace-nowrap flex-shrink-0"
          >
            <span className="max-[767px]:hidden">{t('myEvents.addBtn')}</span>
            <ArrowIcon />
          </Link>
        </div>

        <div className="w-full h-px bg-black" />

        {events.length === 0 ? (
          <p className="py-8 text-[clamp(14px,1.3vw,20px)] text-black opacity-50">{t('myEvents.empty')}</p>
        ) : (
          <ul className="list-none">
            {events.map(event => (
              <li key={event.id} className="flex items-center justify-between gap-6 py-5 border-b border-black max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-3">
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <p className="text-[clamp(14px,1.4vw,20px)] font-normal uppercase tracking-[-0.03em] text-black whitespace-nowrap overflow-hidden text-ellipsis">{event.city}</p>
                  <p className="text-[clamp(12px,1.1vw,16px)] text-black opacity-60">
                    {formatEventDate(event.date, true)} · {formatEventTime(event.time)} · {event.location}
                  </p>
                  <p className="text-[clamp(12px,1.1vw,16px)] text-black opacity-60">
                    {t('myEvents.lectureCount', { count: event.lectures?.length ?? 0 })}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Link
                    href={`/account/events/${event.id}/edit`}
                    className="font-sans text-[clamp(12px,1.1vw,16px)] font-normal text-black underline bg-transparent border-none cursor-pointer p-0 uppercase opacity-70 transition-opacity duration-150 hover:opacity-100"
                  >
                    {t('myEvents.editBtn')}
                  </Link>
                  <button
                    type="button"
                    className="font-sans text-[clamp(12px,1.1vw,16px)] font-normal text-red underline bg-transparent border-none cursor-pointer p-0 uppercase opacity-70 transition-opacity duration-150 hover:opacity-100 disabled:cursor-wait disabled:opacity-45 disabled:animate-pulse"
                    onClick={() => handleDelete(event.id)}
                    disabled={deletingEventIds.has(event.id)}
                    aria-busy={deletingEventIds.has(event.id)}
                  >
                    {deletingEventIds.has(event.id) ? `${t('myEvents.deleteBtn')}...` : t('myEvents.deleteBtn')}
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
