import type { Event } from '../data/events'
import type { Lecture } from '../data/lectures'

const json = (res: Response) => res.json()
const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
const post = (url: string, body?: object) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(json)
const put = (url: string, body: object) =>
  fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json)
const patch = (url: string, body: object) =>
  fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json)
const del = (url: string) =>
  fetch(url, { method: 'DELETE' }).then(json)

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string }) => post('/api/auth/register', body),
  login: (body: { email: string; password: string }) => post('/api/auth/login', body),
  logout: () => post('/api/auth/logout'),
  confirmEmail: () => post('/api/auth/confirm-email'),
  getMe: () => fetch('/api/auth/me').then(json),
  updateAccount: (body: { name?: string; email?: string; password?: string }) => patch('/api/auth/update', body),

  // Lectures
  getLectures: () => fetch('/api/lectures').then(json).then((data) => asArray<Lecture>(data)),
  getLecture: (id: string) => fetch(`/api/lectures/${id}`).then(json),
  createLecture: (body: object) => post('/api/lectures', body),
  updateLecture: (id: string, body: object) => put(`/api/lectures/${id}`, body),
  deleteLecture: (id: string) => del(`/api/lectures/${id}`),

  // Events
  getEvents: () => fetch('/api/events').then(json).then((data) => asArray<Event>(data)),
  getEvent: (id: string) => fetch(`/api/events/${id}`).then(json),
  createEvent: (body: object) => post('/api/events', body),
  updateEvent: (id: string, body: object) => put(`/api/events/${id}`, body),
  deleteEvent: (id: string) => del(`/api/events/${id}`),
}
