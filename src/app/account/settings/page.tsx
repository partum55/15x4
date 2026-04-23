import AccountSettingsPage from '@/views/AccountSettingsPage'
import { requireAuthenticatedPage } from '@/lib/auth-guards'

export default async function Page() {
  await requireAuthenticatedPage('/account/settings')
  return <AccountSettingsPage />
}
