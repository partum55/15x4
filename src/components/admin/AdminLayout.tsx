'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import AdminNav from '@/components/admin/AdminNav'
import { useAuth } from '@/context/AuthContext'

type AdminLayoutProps = {
  title: string
  children: React.ReactNode
}

export default function AdminLayout({ title, children }: AdminLayoutProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || user?.profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user || user?.profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="light" />
      <main className="px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-8">
          {title}
        </h1>
        <AdminNav />
        {children}
      </main>
    </div>
  )
}
