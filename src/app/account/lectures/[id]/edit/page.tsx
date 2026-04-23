import AddEditLecturePage from '@/views/AddEditLecturePage'
import { requireManagerPage } from '@/lib/auth-guards'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireManagerPage(`/account/lectures/${id}/edit`)
  return <AddEditLecturePage />
}
