// Talks to the FastAPI backend in ../backend.
// Locally that's http://127.0.0.1:8000. On Render, set VITE_API_URL to the backend's URL.
const API = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')
const TOKEN_KEY = 'som-token'

// One row of the courses table (the fields the UI shows).
export interface Course {
  id: number
  course_id: string
  course_number: string
  course_title: string
  course_category: string
  course_type: string
  course_session: string
  course_description: string
  daytimes: string
  room: string
  section: string
  units: string
  faculty_1: string
  faculty_1_email: string
  syllabus: string
  old_syllabus: string
  faculty_bio: string
}

export interface User {
  name: string
  email: string
}

export interface ChatReply {
  reply: string
  tools_used: string[]
}

export interface SavedMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  tools_used: string[]
}

// ---------- sign-in token (kept in this browser so a refresh stays signed in) ----------

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* private window: stay signed in until refresh */ }
}

export class AuthError extends Error {}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
      else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join(', ')
    } catch { /* not JSON */ }
    if (res.status === 401) throw new AuthError(detail)
    throw new Error(detail)
  }
  return res.json()
}

export async function signUp(name: string, email: string, password: string): Promise<User> {
  const r = await call<{ token: string; user: User }>('/api/signup', {
    method: 'POST', body: JSON.stringify({ name, email, password }),
  })
  setToken(r.token)
  return r.user
}

export async function signIn(email: string, password: string): Promise<User> {
  const r = await call<{ token: string; user: User }>('/api/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  })
  setToken(r.token)
  return r.user
}

export function signOut() {
  setToken(null)
}

export const fetchMe = () => call<User>('/api/me')

export async function fetchCourses(): Promise<Course[]> {
  const courses = (await call<{ courses: Course[] }>('/api/courses')).courses
  // A few rows have no category in the database; give them a label for the filter chips.
  return courses.map((c) => ({ ...c, course_category: c.course_category?.trim() || 'Other' }))
}

export async function fetchChats(): Promise<SavedMessage[]> {
  return (await call<{ messages: SavedMessage[] }>('/api/chats')).messages
}

export const clearChats = () => call<{ ok: boolean }>('/api/chats', { method: 'DELETE' })

// The backend remembers the conversation itself (saved chats), so only the new message goes up.
export const sendChat = (message: string) =>
  call<ChatReply>('/api/chat', { method: 'POST', body: JSON.stringify({ message }) })

// "Simonsohn, Uri" -> "Uri Simonsohn"
export function facultyName(raw: string): string {
  const [last, first] = (raw ?? '').split(',').map((s) => s.trim())
  return first ? `${first} ${last}` : (raw ?? '').trim()
}

export const SESSION_LABEL: Record<string, string> = {
  fall: 'Full term',
  'fall-1': 'Fall 1',
  'fall-2': 'Fall 2',
}
