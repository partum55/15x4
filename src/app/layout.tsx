import './globals.css'
import I18nProvider from '@/components/I18nProvider'
import { AuthProvider } from '@/context/AuthContext'
import BoneyardClient from '@/components/BoneyardClient'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getServerAuthUser } from '@/lib/auth-server'

export const metadata = {
  title: '15x4',
  description: 'Science lectures for everyone',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await getServerAuthUser()

  return (
    <html lang="uk">
      <body>
        <BoneyardClient />
        <I18nProvider>
          <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
