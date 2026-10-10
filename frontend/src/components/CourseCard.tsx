import { type Course, facultyName, SESSION_LABEL } from '../api'
import { Peeker } from './Characters'

interface Props {
  course: Course
  sections: number
  index: number
  onOpen: () => void
}

export default function CourseCard({ course, sections, index, onOpen }: Props) {
  const time = course.daytimes.trim().replace(/\s+/g, ' ')
  return (
    <div className="card-wrap">
      <Peeker index={index} />
      <button className="card" onClick={onOpen}>
        <div className="card-top">
          <span className="course-num">{course.course_number}</span>
          <span className="pill">{course.course_category}</span>
        </div>
        <h3 className="card-title">{course.course_title}</h3>
        <p className="card-faculty">{facultyName(course.faculty_1)}</p>
        <div className="card-meta">
          <span>{time || 'Time TBA'}</span>
          <span className="dot">·</span>
          <span>{SESSION_LABEL[course.course_session] ?? course.course_session}</span>
          <span className="dot">·</span>
          <span>{course.units} units</span>
        </div>
        {sections > 1 && <span className="sections">{sections} sections</span>}
      </button>
    </div>
  )
}
