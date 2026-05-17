'use client'

import Navbar from './Navbar'
import JoinSection from './JoinSection'
import Footer from './Footer'

type AppLayoutProps = {
  children: React.ReactNode
  /** Hide the JoinSection above the footer (e.g. on detail pages). */
  hideJoin?: boolean
  /** Hide the footer entirely (e.g. on auth pages). */
  hideFooter?: boolean
  /** Optional Navbar variant override (`dark` for the home hero). */
  navbarVariant?: 'light' | 'dark'
  /** Wrap children in a `<div className="page">` shell. Defaults to true. */
  withPageShell?: boolean
}

export default function AppLayout({
  children,
  hideJoin = false,
  hideFooter = false,
  navbarVariant,
  withPageShell = true,
}: AppLayoutProps) {
  const body = (
    <>
      <Navbar variant={navbarVariant} />
      {children}
      {!hideJoin && <JoinSection />}
      {!hideFooter && <Footer />}
    </>
  )

  if (!withPageShell) return body

  return <div className="page">{body}</div>
}
