import AddEditEventPage from '@/views/AddEditEventPage'
import { requireManagerPage } from '@/lib/auth-guards'

export default async function Page() {
  await requireManagerPage('/account/events/new')
  return <AddEditEventPage />
}
