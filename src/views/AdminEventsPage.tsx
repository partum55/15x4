'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'

type Event = {
  id: string
  city: string
  date: string
  location: string
  time: string
  isPublic: boolean
  createdAt: string
  user: { id: string; name: string; email: string } | null
  _count: { lectures: number }
}

export default function AdminEventsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    fetch('/api/admin/events')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setEvents(data)
        setLoadingEvents(false)
      })
  }, [])

  async function handleDelete(eventId: string) {
    if (!confirm(t('admin.events.confirmDelete'))) return
    await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  if (loading || !user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="light" />
      <main className="px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-8">
          {t('admin.events.title')}
        </h1>

        {/* Navigation */}
        <nav className="flex gap-4 mb-12 border-b border-black pb-4">
          <Link href="/admin" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.dashboard')}
          </Link>
          <Link href="/admin/users" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.users')}
          </Link>
          <Link href="/admin/lectures" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.lectures')}
          </Link>
          <span className="text-[clamp(14px,1.3vw,20px)] font-bold text-red">{t('admin.nav.events')}</span>
        </nav>

        {loadingEvents ? (
          <p className="text-[clamp(14px,1.3vw,20px)]">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{t('admin.events.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.city')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.date')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">Location</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">Lectures</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.public')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.owner')}</th>
                  <th className="text-right p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id} className="border-b border-black/20 hover:bg-black/5">
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      <Link href={`/events/${e.id}`} className="text-black hover:underline">
                        {e.city}
                      </Link>
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{e.date}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{e.location}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{e._count.lectures}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      {e.isPublic ? '✓' : '—'}
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      {e.user?.name || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="px-3 py-1 bg-red text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80"
                      >
                        {t('admin.events.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
