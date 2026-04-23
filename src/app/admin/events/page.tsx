import AdminEventsPage from '@/views/AdminEventsPage'
import { requireAdminPage } from '@/lib/auth-guards'

export default async function Page() {
  await requireAdminPage('/admin/events')
  return <AdminEventsPage />
}
