import { Link } from 'react-router-dom'
import ArrowIcon from './ArrowIcon'
import { events } from '../data/events'
import './UpcomingEvents.css'

export default function UpcomingEvents() {
  return (
    <section className="upcoming" id="events">
      <div className="upcoming__content">
        <h2 className="upcoming__section-title">
          <span className="upcoming__section-title--accent">//</span> Майбутні події
        </h2>

        <div className="upcoming__list">
          {events.map((event) => (
            <div key={event.id}>
              <div className="upcoming__divider" />
              <div className="upcoming__event-row">
                {/* Column 1: event info + register button */}
                <div className="upcoming__col-info">
                  <p className="upcoming__date">{event.city.toUpperCase()} [{event.date}]</p>
                  <p className="upcoming__location">{event.location}</p>
                  <p className="upcoming__time">{event.time}</p>
                  <Link to={`/events/${event.id}`} className="upcoming__register-btn">
                    <span>реєстрація</span>
                    <ArrowIcon />
                  </Link>
                </div>

                {/* Column 2: event image */}
                <Link to={`/events/${event.id}`} className="upcoming__col-image">
                  <img
                    src={event.image}
                    alt={`Подія 15x4 у ${event.city}`}
                    className="upcoming__event-image"
                  />
                </Link>

                {/* Column 3: talks list */}
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
