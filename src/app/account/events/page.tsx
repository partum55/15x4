import MyEventsPage from '@/views/MyEventsPage'
import { requireManagerPage } from '@/lib/auth-guards'

export default async function Page() {
  await requireManagerPage('/account/events')
  return <MyEventsPage />
}
