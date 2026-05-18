'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

type Stats = {
  users: number
  lectures: number
  events: number
  lectors: number
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState(false)

  useEffect(() => {
    if (loading || !user || user?.profile?.role !== 'admin') return
    let isMounted = true
    api.admin.getStats()
      .then(data => {
        if (!isMounted) return
        if (data && !data.error) setStats(data as Stats)
        else setStatsError(true)
      })
      .catch(() => {
        if (!isMounted) return
        setStatsError(true)
      })
    return () => {
      isMounted = false
    }
  }, [loading, user])

  return (
    <AdminLayout title={t('admin.title')}>
      <div className="grid grid-cols-4 gap-6 max-[1023px]:grid-cols-2 max-[639px]:grid-cols-1">
        <Link href="/admin/users" className="border border-black p-8 no-underline text-inherit hover:bg-black hover:text-white transition-colors group">
          <p className="text-[clamp(32px,3.5vw,56px)] font-bold mb-2">
            {statsError ? '—' : stats ? stats.users : <span className="block h-[1em] w-24 animate-pulse bg-black/10" />}
          </p>
          <p className="text-[clamp(14px,1.3vw,20px)] uppercase">{t('admin.stats.users')}</p>
        </Link>

        <Link href="/admin/lectures" className="border border-black p-8 no-underline text-inherit hover:bg-black hover:text-white transition-colors group">
          <p className="text-[clamp(32px,3.5vw,56px)] font-bold mb-2">
            {statsError ? '—' : stats ? stats.lectures : <span className="block h-[1em] w-24 animate-pulse bg-black/10" />}
          </p>
          <p className="text-[clamp(14px,1.3vw,20px)] uppercase">{t('admin.stats.lectures')}</p>
        </Link>

        <Link href="/admin/events" className="border border-black p-8 no-underline text-inherit hover:bg-black hover:text-white transition-colors group">
          <p className="text-[clamp(32px,3.5vw,56px)] font-bold mb-2">
            {statsError ? '—' : stats ? stats.events : <span className="block h-[1em] w-24 animate-pulse bg-black/10" />}
          </p>
          <p className="text-[clamp(14px,1.3vw,20px)] uppercase">{t('admin.stats.events')}</p>
        </Link>

        <Link href="/admin/users" className="border border-orange p-8 no-underline text-inherit hover:bg-orange hover:text-white transition-colors group">
          <p className="text-[clamp(32px,3.5vw,56px)] font-bold mb-2 text-orange group-hover:text-white">
            {statsError ? '—' : stats ? stats.lectors : <span className="block h-[1em] w-24 animate-pulse bg-orange/20" />}
          </p>
          <p className="text-[clamp(14px,1.3vw,20px)] uppercase">{t('admin.stats.lectors')}</p>
        </Link>
      </div>
    </AdminLayout>
  )
}
