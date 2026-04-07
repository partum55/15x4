import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ArrowIcon from './ArrowIcon'
import { events } from '../data/events'
import './UpcomingEvents.css'

export default function UpcomingEvents() {
  const { t } = useTranslation()

  return (
    <section className="upcoming" id="events">
      <div className="upcoming__content">
        <h2 className="upcoming__section-title">
          <span className="upcoming__section-title--accent">//</span> {t('upcomingEvents.title')}
        </h2>

        <div className="upcoming__list">
          {events.map((event) => (
            <div key={event.id}>
              <div className="upcoming__divider" />
              <div className="upcoming__event-row">
                <div className="upcoming__col-info">
                  <p className="upcoming__date">{event.city.toUpperCase()} [{event.date}]</p>
                  <p className="upcoming__location">{event.location}</p>
                  <p className="upcoming__time">{event.time}</p>
                  <Link to={`/events/${event.id}`} className="upcoming__register-btn">
                    <span>{t('upcomingEvents.register')}</span>
                    <ArrowIcon />
                  </Link>
                </div>

                <Link to={`/events/${event.id}`} className="upcoming__col-image">
                  <img
                    src={event.image}
                    alt={`Подія 15x4 у ${event.city}`}
                    className="upcoming__event-image"
                  />
                </Link>

                <div className="upcoming__col-talks">
                  {event.lectures.map((lecture) => (
                    <div key={lecture.id} className="upcoming__talk-row">
                      <span className="upcoming__talk-title">{lecture.title}</span>
                      <span className="upcoming__talk-author">{lecture.author}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div className="upcoming__divider" />
        </div>
      </div>
    </section>
  )
}
