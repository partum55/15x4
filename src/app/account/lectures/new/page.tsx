import AddEditLecturePage from '@/views/AddEditLecturePage'
import { requireManagerPage } from '@/lib/auth-guards'

export default async function Page() {
  await requireManagerPage('/account/lectures/new')
  return <AddEditLecturePage />
}
