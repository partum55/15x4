import { useParams, Link } from 'react-router-dom'
import { events } from '../data/events'
import ArrowIcon from '../components/ArrowIcon'
import Footer from '../components/Footer'
import './EventDetailPage.css'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const event = events.find((e) => e.id === id)

  if (!event) {
    return (
      <div className="page detail-page">
        <nav className="inner-nav">
          <Link to="/" className="inner-nav__logo">15x4</Link>
          <Link to="/events" className="inner-nav__back">← події</Link>
        </nav>
        <div className="detail-page__not-found">Подію не знайдено</div>
      </div>
    )
  }

  return (
    <div className="page detail-page">
      <nav className="inner-nav">
        <Link to="/" className="inner-nav__logo">15x4</Link>
        <Link to="/events" className="inner-nav__back">← події</Link>
      </nav>

      <main className="event-detail__main">
        <img src={event.image} alt={`Подія у ${event.city}`} className="event-detail__hero" />

        <div className="event-detail__body">
          <div className="event-detail__meta">
            <h1 className="event-detail__city">{event.city}</h1>
            <div className="event-detail__info">
              <span className="event-detail__date">[{event.date}]</span>
              <span className="event-detail__time">{event.time}</span>
            </div>
            <p className="event-detail__location">{event.location}</p>
            <button className="event-detail__register-btn">
              <span>реєстрація</span>
              <ArrowIcon />
            </button>
          </div>

          <div className="event-detail__talks">
            <h2 className="event-detail__talks-title">// Доповіді</h2>
            <div className="event-detail__talks-list">
              {event.lectures.map((lecture, i) => (
                <div key={i} className="event-detail__talk">
                  <div className="event-detail__talk-divider" />
                  <p className="event-detail__talk-name">{lecture.title}</p>
                  <p className="event-detail__talk-author">{lecture.author}</p>
                </div>
              ))}
              <div className="event-detail__talk-divider" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
