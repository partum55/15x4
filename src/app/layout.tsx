import './globals.css'
import I18nProvider from '@/components/I18nProvider'
import { AuthProvider } from '@/context/AuthContext'

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
      </body>
    </html>
  )
}
