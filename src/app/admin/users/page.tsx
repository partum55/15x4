import AdminUsersPage from '@/views/AdminUsersPage'
import { requireAdminPage } from '@/lib/auth-guards'

export default async function Page() {
  await requireAdminPage('/admin/users')
  return <AdminUsersPage />
}
