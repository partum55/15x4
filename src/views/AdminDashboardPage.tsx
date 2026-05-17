'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'

type Stats = {
  users: number
  lectures: number
  events: number
  lectors: number
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user?.profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (loading || !user || user?.profile?.role !== 'admin') return
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data)
        else setStatsError(true)
      })
      .catch(() => setStatsError(true))
  }, [loading, user])

  if (loading || !user || user?.profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="light" />
      <main className="px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-8">
          {t('admin.title')}
        </h1>

        {/* Navigation */}
        <nav className="flex gap-4 mb-12 border-b border-black pb-4">
          <span className="text-[clamp(14px,1.3vw,20px)] font-bold text-red">{t('admin.nav.dashboard')}</span>
          <Link href="/admin/users" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.users')}
          </Link>
          <Link href="/admin/lectures" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.lectures')}
          </Link>
          <Link href="/admin/events" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.events')}
          </Link>
        </nav>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 max-[1023px]:grid-cols-2 max-[639px]:grid-cols-1">
          <Link href="/admin/users" className="border border-black p-8 no-underline text-inherit hover:bg-black hover:text-white transition-colors">
            <p className="text-[clamp(32px,3.5vw,56px)] font-bold mb-2">
              {statsError ? '—' : stats ? stats.users : <span className="block h-[1em] w-24 animate-pulse bg-black/10" />}
            </p>
            <p className="text-[clamp(14px,1.3vw,20px)] uppercase">{t('admin.stats.users')}</p>
          </Link>

          <Link href="/admin/lectures" className="border border-black p-8 no-underline text-inherit hover:bg-black hover:text-white transition-colors">
            <p className="text-[clamp(32px,3.5vw,56px)] font-bold mb-2">
              {statsError ? '—' : stats ? stats.lectures : <span className="block h-[1em] w-24 animate-pulse bg-black/10" />}
            </p>
            <p className="text-[clamp(14px,1.3vw,20px)] uppercase">{t('admin.stats.lectures')}</p>
          </Link>

          <Link href="/admin/events" className="border border-black p-8 no-underline text-inherit hover:bg-black hover:text-white transition-colors">
            <p className="text-[clamp(32px,3.5vw,56px)] font-bold mb-2">
              {statsError ? '—' : stats ? stats.events : <span className="block h-[1em] w-24 animate-pulse bg-black/10" />}
            </p>
            <p className="text-[clamp(14px,1.3vw,20px)] uppercase">{t('admin.stats.events')}</p>
          </Link>

          <Link href="/admin/users" className="border border-orange p-8 no-underline text-inherit hover:bg-orange hover:text-white transition-colors">
            <p className="text-[clamp(32px,3.5vw,56px)] font-bold mb-2 text-orange">
              {statsError ? '—' : stats ? stats.lectors : <span className="block h-[1em] w-24 animate-pulse bg-orange/20" />}
            </p>
            <p className="text-[clamp(14px,1.3vw,20px)] uppercase">{t('admin.stats.lectors')}</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
