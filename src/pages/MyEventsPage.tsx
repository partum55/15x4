import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import ArrowIcon from '../components/ArrowIcon'
import { getUserEvents, deleteUserEvent } from '../auth'
import './MyLecturesPage.css'

export default function MyEventsPage() {
  const { t } = useTranslation()
  const [events, setEvents] = useState(() => getUserEvents())

  function handleDelete(id: string) {
    if (!window.confirm(t('myEvents.deleteConfirm'))) return
    deleteUserEvent(id)
    setEvents(getUserEvents())
  }

  return (
    <div className="my-content-page">
      <Navbar variant="light" />
      <main className="my-content-page__main">
        <div className="my-content-page__header">
          <h1 className="my-content-page__title">{t('myEvents.title')}</h1>
          <Link to="/account/events/new" className="my-content-page__add-btn">
            <span>{t('myEvents.addBtn')}</span>
            <ArrowIcon />
          </Link>
        </div>

        <div className="my-content-page__divider" />

        {events.length === 0 ? (
          <p className="my-content-page__empty">{t('myEvents.empty')}</p>
        ) : (
          <ul className="my-content-page__list">
            {events.map(event => (
              <li key={event.id} className="my-content-page__item">
                <div className="my-content-page__item-info">
                  <p className="my-content-page__item-title">{event.city}</p>
                  <p className="my-content-page__item-meta">
                    {event.date} · {event.time} · {event.location}
                  </p>
                  <p className="my-content-page__item-meta">
                    {event.lectures.length} {event.lectures.length === 1 ? 'lecture' : 'lectures'}
                  </p>
                </div>
                <div className="my-content-page__item-actions">
                  <Link
                    to={`/account/events/${event.id}/edit`}
                    className="my-content-page__action-btn"
                  >
                    {t('myEvents.editBtn')}
                  </Link>
                  <button
                    className="my-content-page__action-btn my-content-page__action-btn--delete"
                    onClick={() => handleDelete(event.id)}
                  >
                    {t('myEvents.deleteBtn')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
