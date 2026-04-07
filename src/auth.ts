import type { Lecture } from './data/lectures'
import type { Event } from './data/events'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string
  email: string
  name: string
  status: 'pending_email' | 'pending_approval' | 'approved'
  passwordHash: string
  createdAt: string
}

interface AuthStore {
  currentUserId: string | null
  users: StoredUser[]
}

interface UserContent {
  lectures: Lecture[]
  events: Event[]
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

const AUTH_KEY = '15x4_auth'
const CONTENT_KEY = '15x4_user_content'

function getAuthStore(): AuthStore {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return { currentUserId: null, users: [] }
    return JSON.parse(raw) as AuthStore
  } catch {
    return { currentUserId: null, users: [] }
  }
}

function saveAuthStore(store: AuthStore): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(store))
}

function getContentStore(): UserContent {
  try {
    const raw = localStorage.getItem(CONTENT_KEY)
    if (!raw) return { lectures: [], events: [] }
    return JSON.parse(raw) as UserContent
  } catch {
    return { lectures: [], events: [] }
  }
}

function saveContentStore(content: UserContent): void {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content))
}

// ─── Auth functions ───────────────────────────────────────────────────────────

export function getCurrentUser(): StoredUser | null {
  const store = getAuthStore()
  if (!store.currentUserId) return null
  return store.users.find(u => u.id === store.currentUserId) ?? null
}

export function isApproved(): boolean {
  return getCurrentUser()?.status === 'approved'
}

export function register(
  email: string,
  name: string,
  password: string
): { ok: boolean; error?: string } {
  const store = getAuthStore()
  const existing = store.users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (existing) return { ok: false, error: 'emailTaken' }

  const user: StoredUser = {
    id: generateId(),
    email,
    name,
    status: 'pending_email',
    passwordHash: btoa(password),
    createdAt: new Date().toISOString(),
  }

  store.users.push(user)
  store.currentUserId = user.id
  saveAuthStore(store)
  return { ok: true }
}

export function confirmEmail(userId: string): void {
  const store = getAuthStore()
  const user = store.users.find(u => u.id === userId)
  if (user && user.status === 'pending_email') {
    user.status = 'pending_approval'
    saveAuthStore(store)
  }
}

export function approveCurrentUser(): void {
  const store = getAuthStore()
  const user = store.users.find(u => u.id === store.currentUserId)
  if (user) {
    user.status = 'approved'
    saveAuthStore(store)
  }
}

export function login(
  email: string,
  password: string
): { ok: boolean; error?: string } {
  const store = getAuthStore()
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user || user.passwordHash !== btoa(password)) {
    return { ok: false, error: 'invalid' }
  }
  store.currentUserId = user.id
  saveAuthStore(store)
  return { ok: true }
}

export function logout(): void {
  const store = getAuthStore()
  store.currentUserId = null
  saveAuthStore(store)
}

export function updateAccount(patch: Partial<Pick<StoredUser, 'name' | 'email' | 'passwordHash'>>): void {
  const store = getAuthStore()
  const user = store.users.find(u => u.id === store.currentUserId)
  if (user) {
    Object.assign(user, patch)
    saveAuthStore(store)
  }
}

// ─── User content functions ───────────────────────────────────────────────────

export function getUserLectures(): Lecture[] {
  return getContentStore().lectures
}

export function getUserEvents(): Event[] {
  return getContentStore().events
}

export function saveLecture(lecture: Lecture): void {
  const content = getContentStore()
  const idx = content.lectures.findIndex(l => l.id === lecture.id)
  if (idx >= 0) {
    content.lectures[idx] = lecture
  } else {
    content.lectures.push(lecture)
  }
  saveContentStore(content)
}

export function deleteUserLecture(id: string): void {
  const content = getContentStore()
  content.lectures = content.lectures.filter(l => l.id !== id)
  saveContentStore(content)
}

export function saveEvent(event: Event): void {
  const content = getContentStore()
  const idx = content.events.findIndex(e => e.id === event.id)
  if (idx >= 0) {
    content.events[idx] = event
  } else {
    content.events.push(event)
  }
  saveContentStore(content)
}

export function deleteUserEvent(id: string): void {
  const content = getContentStore()
  content.events = content.events.filter(e => e.id !== id)
  saveContentStore(content)
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
