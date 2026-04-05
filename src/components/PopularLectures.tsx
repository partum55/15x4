import { useState } from 'react'
import { Link } from 'react-router-dom'
import { lectures, type Lecture } from '../data/lectures'
import './PopularLectures.css'

export function LectureCard({ id, category, categoryColor, author, image, title, summary }: Lecture) {
  const [hovered, setHovered] = useState(false)
  
  const colorMap: Record<string, string> = {
    orange: 'var(--color-orange)',
    green: 'var(--color-green)',
    blue: 'var(--color-blue)',
    red: 'var(--color-red)',
  }
  const bgColor = colorMap[categoryColor] || 'var(--color-red)'

  return (
    <Link 
      to={`/lectures/${id}`} 
      className={`lecture-card ${hovered ? 'lecture-card--hovered' : ''}`}
      style={hovered ? { backgroundColor: bgColor } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="lecture-card__info">
        <span 
          className={`lecture-card__badge lecture-card__badge--${categoryColor} ${hovered ? 'lecture-card__badge--filled' : ''}`}
          style={{ 
            borderColor: bgColor,
            backgroundColor: hovered ? bgColor : 'var(--color-white)'
          }}
        >
          {category}
        </span>
        <span className="lecture-card__author">{author}</span>
      </div>
      <img src={image} alt={title} className="lecture-card__image" />
      <div className="lecture-card__description">
        <p className="lecture-card__title">{title}</p>
        <p className="lecture-card__summary">{summary}</p>
      </div>
    </Link>
  )
}

type LectureRowProps = {
  left: Lecture
  right: Lecture
}

function LectureRow({ left, right }: LectureRowProps) {
  return (
    <div className="lecture-row-wrapper">
      <div className="lecture-row__divider-top" />
      <div className="lecture-row">
        <LectureCard {...left} />
        <div className="lecture-row__separator" />
        <LectureCard {...right} />
      </div>
      <div className="lecture-row__divider-bottom" />
    </div>
  )
}

export default function PopularLectures() {
  const rows: [Lecture, Lecture][] = []
  for (let i = 0; i + 1 < lectures.length; i += 2) {
    rows.push([lectures[i], lectures[i + 1]])
  }

  return (
    <section className="popular" id="lectures">
      <div className="popular__content">
        <div className="popular__header">
          <span className="popular__badge">[must watch!]</span>
          <h2 className="popular__title">
            <span className="popular__title--accent">//</span> Популярні лекції
          </h2>
        </div>

        <div className="popular__list">
          {rows.map(([left, right]) => (
            <LectureRow key={left.id} left={left} right={right} />
          ))}
        </div>
      </div>
    </section>
  )
}
