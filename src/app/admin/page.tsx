import AdminDashboard from '@/views/AdminDashboardPage'
import { requireAdminPage } from '@/lib/auth-guards'

export default async function Page() {
  await requireAdminPage('/admin')
  return <AdminDashboard />
}
