import AdminLecturesPage from '@/views/AdminLecturesPage'
import { requireAdminPage } from '@/lib/auth-guards'

export default async function Page() {
  await requireAdminPage('/admin/lectures')
  return <AdminLecturesPage />
}
