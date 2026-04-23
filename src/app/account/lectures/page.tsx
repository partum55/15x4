import MyLecturesPage from '@/views/MyLecturesPage'
import { requireManagerPage } from '@/lib/auth-guards'

export default async function Page() {
  await requireManagerPage('/account/lectures')
  return <MyLecturesPage />
}
