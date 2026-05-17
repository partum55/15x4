import './globals.css'
import type { Metadata } from 'next'
import I18nProvider from '@/components/I18nProvider'
import { AuthProvider } from '@/context/AuthContext'
import BoneyardClient from '@/components/BoneyardClient'
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getServerAuthUser } from '@/lib/auth-server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://15x4.org'
const description = 'Наукові лекції для широкої аудиторії. Кожна лекція — 15 хвилин, 4 лектори.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '15x4',
    template: '%s — 15x4',
  },
  description,
  keywords: ['наука', 'лекції', 'освіта', '15x4', 'наукпоп'],
  authors: [{ name: '15x4' }],
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: siteUrl,
    siteName: '15x4',
    title: '15x4 — Наукові лекції',
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: '15x4 — Наукові лекції',
    description,
  },
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await getServerAuthUser()

  return (
    <html lang="uk">
      <body>
        <BoneyardClient />
        <I18nProvider>
          <AuthProvider initialUser={initialUser}>
            {children}
            <ProfileCompletionBanner />
          </AuthProvider>
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
