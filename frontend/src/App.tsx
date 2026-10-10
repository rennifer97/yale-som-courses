import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthError, type Course, fetchCourses, fetchMe, facultyName, getToken, signOut, type User } from './api'
import ChatPanel from './components/ChatPanel'
import CityBackdrop from './components/CityBackdrop'
import CourseCard from './components/CourseCard'
import CourseDetail from './components/CourseDetail'
import Login from './components/Login'

const SESSIONS = [
  { id: '', label: 'All terms' },
  { id: 'fall', label: 'Full term' },
  { id: 'fall-1', label: 'Fall 1' },
  { id: 'fall-2', label: 'Fall 2' },
]

// One card per course: sections of the same course number + title are grouped.
function groupCourses(rows: Course[]): Course[][] {
  const map = new Map<string, Course[]>()
  for (const c of rows) {
    const key = `${c.course_number}|${c.course_title}`
    map.set(key, [...(map.get(key) ?? []), c])
  }
  return [...map.values()].sort((a, b) =>
    a[0].course_number.localeCompare(b[0].course_number, undefined, { numeric: true }),
  )
}

// Decides between the sign-in screen and the catalog.
export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(() => !!getToken())

  // Already signed in from an earlier visit? Ask the backend who we are.
  useEffect(() => {
    if (!getToken()) return
    fetchMe().then(setUser).catch(() => signOut()).finally(() => setChecking(false))
  }, [])

  const leave = useCallback(() => { signOut(); setUser(null) }, [])

  if (checking) return <div className="boot"><span className="spinner" /></div>
  if (!user) return <Login onSignedIn={setUser} />
  return <Catalog user={user} onSignOut={leave} />
}

function Catalog({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [session, setSession] = useState('')
  const [open, setOpen] = useState<Course[] | null>(null)

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
      .catch((e) => {
        if (e instanceof AuthError) onSignOut()
        else setError('Could not load courses. Is the backend running?')
      })
      .finally(() => setLoading(false))
  }, [onSignOut])

  const groups = useMemo(() => groupCourses(courses), [courses])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const g of groups) counts.set(g[0].course_category, (counts.get(g[0].course_category) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [groups])

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return groups.filter((g) => {
      const c = g[0]
      if (category && c.course_category !== category) return false
      if (session && c.course_session !== session) return false
      if (!words.length) return true
      const text = [c.course_number, c.course_title, facultyName(c.faculty_1), c.course_category,
        c.course_description, g.map((s) => s.daytimes).join(' ')].join(' ').toLowerCase()
      const squashed = text.replace(/\s+/g, '')
      return words.every((w) => text.includes(w) || squashed.includes(w))
    })
  }, [groups, query, category, session])

  return (
    <>
      <header className="hero">
        <CityBackdrop />
        <div className="account">
          <span>Hi, {user.name.split(' ')[0]}</span>
          <button onClick={onSignOut}>Sign out</button>
        </div>
        <div className="hero-inner">
          <p className="eyebrow">Yale School of Management · Fall 2026</p>
          <h1>Course Explorer</h1>
          <p className="lede">
            {groups.length ? `${groups.length} courses` : 'Every course'} across the full term, Fall 1 and Fall 2.
            Browse, search, or ask the assistant.
          </p>
          <div className="search">
            <span className="search-icon">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, number, faculty, or topic…"
            />
            {query && <button className="clear" onClick={() => setQuery('')} aria-label="Clear">×</button>}
          </div>
        </div>
      </header>

      <main className="wrap">
        <div className="filters">
          <div className="segmented">
            {SESSIONS.map((s) => (
              <button key={s.id} className={session === s.id ? 'on' : ''} onClick={() => setSession(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="chips">
            <button className={`chip ${category === '' ? 'on' : ''}`} onClick={() => setCategory('')}>All</button>
            {categories.map(([name, n]) => (
              <button key={name} className={`chip ${category === name ? 'on' : ''}`}
                onClick={() => setCategory(category === name ? '' : name)}>
                {name} <span className="count">{n}</span>
              </button>
            ))}
          </div>
        </div>

        {!loading && !error && (
          <p className="result-count">{shown.length} {shown.length === 1 ? 'course' : 'courses'}</p>
        )}

        {error && <div className="notice">{error}</div>}
        {loading && <div className="grid">{Array.from({ length: 9 }, (_, i) => <div key={i} className="card skeleton" />)}</div>}

        {!loading && !error && (
          shown.length ? (
            <div className="grid">
              {shown.map((g, i) => (
                <CourseCard key={g[0].course_number + g[0].course_title} course={g[0]}
                  sections={g.length} index={i} onOpen={() => setOpen(g)} />
              ))}
            </div>
          ) : (
            <div className="notice">No courses match. Try a broader search, or ask the assistant.</div>
          )
        )}
      </main>

      <footer className="foot">Data: Yale SOM Fall 2026 course list · MGT 409 class project</footer>

      {open && <CourseDetail sections={open} onClose={() => setOpen(null)} />}
      <ChatPanel onAuthError={onSignOut} />
    </>
  )
}
