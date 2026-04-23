import AddEditEventPage from '@/views/AddEditEventPage'
import { requireManagerPage } from '@/lib/auth-guards'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireManagerPage(`/account/events/${id}/edit`)
  return <AddEditEventPage />
}
