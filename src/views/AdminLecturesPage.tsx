'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { CATEGORY_COLOR_VAR } from '@/constants/colors'

type Lecture = {
  id: string
  title: string
  author: string
  category: string
  categoryColor: string
  isPublic: boolean
  createdAt: string
  user: { id: string; name: string; email: string } | null
}

export default function AdminLecturesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loadingLectures, setLoadingLectures] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    fetch('/api/admin/lectures')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setLectures(data)
        setLoadingLectures(false)
      })
  }, [])

  async function handleDelete(lectureId: string) {
    if (!confirm(t('admin.lectures.confirmDelete'))) return
    await fetch(`/api/admin/lectures/${lectureId}`, { method: 'DELETE' })
    setLectures(prev => prev.filter(l => l.id !== lectureId))
  }

  if (loading || !user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="light" />
      <main className="px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-8">
          {t('admin.lectures.title')}
        </h1>

        {/* Navigation */}
        <nav className="flex gap-4 mb-12 border-b border-black pb-4">
          <Link href="/admin" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.dashboard')}
          </Link>
          <Link href="/admin/users" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.users')}
          </Link>
          <span className="text-[clamp(14px,1.3vw,20px)] font-bold text-red">{t('admin.nav.lectures')}</span>
          <Link href="/admin/events" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.events')}
          </Link>
        </nav>

        {loadingLectures ? (
          <p className="text-[clamp(14px,1.3vw,20px)]">Loading...</p>
        ) : lectures.length === 0 ? (
          <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{t('admin.lectures.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">Title</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.lectures.author')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.lectures.category')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.lectures.public')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.lectures.owner')}</th>
                  <th className="text-right p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {lectures.map(l => (
                  <tr key={l.id} className="border-b border-black/20 hover:bg-black/5">
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      <Link href={`/lectures/${l.id}`} className="text-black hover:underline">
                        {l.title}
                      </Link>
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{l.author}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      <span
                        className="px-2 py-1 text-[clamp(11px,1vw,14px)] text-white"
                        style={{ backgroundColor: CATEGORY_COLOR_VAR[l.categoryColor as keyof typeof CATEGORY_COLOR_VAR] || 'var(--color-black)' }}
                      >
                        {l.category}
                      </span>
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      {l.isPublic ? '✓' : '—'}
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      {l.user?.name || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="px-3 py-1 bg-red text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80"
                      >
                        {t('admin.lectures.delete')}
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
