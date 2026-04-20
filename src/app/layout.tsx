import './globals.css'
import '../bones/registry'
import I18nProvider from '@/components/I18nProvider'
import { AuthProvider } from '@/context/AuthContext'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata = {
  title: '15x4',
  description: 'Science lectures for everyone',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
