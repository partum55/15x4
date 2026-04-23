import { Suspense } from 'react'
import LoginPage from '@/views/LoginPage'
import { redirectAuthenticatedAwayFromAuthPage } from '@/lib/auth-guards'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams
  await redirectAuthenticatedAwayFromAuthPage(redirect)

  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}
