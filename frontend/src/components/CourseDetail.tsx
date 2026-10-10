import { useEffect } from 'react'
import { type Course, facultyName, SESSION_LABEL } from '../api'

interface Props {
  sections: Course[]
  onClose: () => void
}

export default function CourseDetail({ sections, onClose }: Props) {
  const c = sections[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const syllabus = c.syllabus || c.old_syllabus

  return (
    <div className="overlay" onClick={onClose}>
      <article className="detail" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <div className="card-top">
          <span className="course-num">{c.course_number}</span>
          <span className="pill">{c.course_category}</span>
        </div>
        <h2>{c.course_title}</h2>
        <p className="detail-sub">
          {facultyName(c.faculty_1)} · {SESSION_LABEL[c.course_session] ?? c.course_session} · {c.units} units
        </p>

        <table className="sections-table">
          <thead>
            <tr><th>Section</th><th>Day &amp; time</th><th>Room</th></tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.course_id + s.section}>
                <td>{s.section}</td>
                <td>{s.daytimes.trim().replace(/\s+/g, ' ') || 'TBA'}</td>
                <td>{s.room || 'TBA'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>About the course</h4>
        <p className="prose">{c.course_description.replace(/\s+/g, ' ').trim()}</p>

        {c.faculty_bio && (
          <>
            <h4>About the instructor</h4>
            <p className="prose">{c.faculty_bio}</p>
          </>
        )}

        {syllabus && (
          <a className="link" href={syllabus} target="_blank" rel="noreferrer">View syllabus ↗</a>
        )}
      </article>
    </div>
  )
}
