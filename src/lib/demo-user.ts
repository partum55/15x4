// Demo branch: there is no auth backend. Everyone is the mock admin until they "log out"
// (which sets a cookie), after which the site behaves as for a guest.
import type { AuthUser } from '@/lib/auth'

export const DEMO_GUEST_COOKIE = 'demo-guest'

export const DEMO_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@15x4.org',
  profile: { id: '00000000-0000-0000-0000-000000000001', name: 'Demo Admin', city: 'kyiv', role: 'admin' },
}

export const DEMO_PROFILES = [
  { id: DEMO_USER.id, name: 'Demo Admin', email: DEMO_USER.email, role: 'admin', createdAt: '2026-01-10T10:00:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Олена Коваль', email: 'olena@example.com', role: 'lector', createdAt: '2026-02-03T10:00:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Андрій Мельник', email: 'andrii@example.com', role: 'lector', createdAt: '2026-02-15T10:00:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Ірина Шевчук', email: 'iryna@example.com', role: 'user', createdAt: '2026-03-21T10:00:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Kadri Tamm', email: 'kadri@example.com', role: 'user', createdAt: '2026-04-02T10:00:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000006', name: 'Тарас Бондар', email: 'taras@example.com', role: 'user', createdAt: '2026-05-18T10:00:00.000Z' },
]
