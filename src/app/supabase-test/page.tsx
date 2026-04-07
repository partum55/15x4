import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

type TodoRow = {
  id: string
  name: string
}

export default async function SupabaseTestPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos, error } = await supabase.from('todos').select('id, name')

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-3">Supabase connection test</h1>
        <p className="text-red-600">{error.message}</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-3">Supabase connection test</h1>
      <ul className="list-disc pl-6">
        {(todos as TodoRow[] | null)?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </main>
  )
}
