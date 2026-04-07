import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import ArrowIcon from '../components/ArrowIcon'
import { getUserLectures, deleteUserLecture } from '../auth'
import './MyLecturesPage.css'

export default function MyLecturesPage() {
  const { t } = useTranslation()
  const [lectures, setLectures] = useState(() => getUserLectures())

  function handleDelete(id: string) {
    if (!window.confirm(t('myLectures.deleteConfirm'))) return
    deleteUserLecture(id)
    setLectures(getUserLectures())
  }

  return (
    <div className="my-content-page">
      <Navbar variant="light" />
      <main className="my-content-page__main">
        <div className="my-content-page__header">
          <h1 className="my-content-page__title">{t('myLectures.title')}</h1>
          <Link to="/account/lectures/new" className="my-content-page__add-btn">
            <span>{t('myLectures.addBtn')}</span>
            <ArrowIcon />
          </Link>
        </div>

        <div className="my-content-page__divider" />

        {lectures.length === 0 ? (
          <p className="my-content-page__empty">{t('myLectures.empty')}</p>
        ) : (
          <ul className="my-content-page__list">
            {lectures.map(lecture => (
              <li key={lecture.id} className="my-content-page__item">
                <div className="my-content-page__item-info">
                  <span
                    className={`my-content-page__badge my-content-page__badge--${lecture.categoryColor}`}
                  >
                    {lecture.category}
                  </span>
                  <p className="my-content-page__item-title">{lecture.title}</p>
                  <p className="my-content-page__item-meta">{lecture.author}</p>
                </div>
                <div className="my-content-page__item-actions">
                  <Link
                    to={`/account/lectures/${lecture.id}/edit`}
                    className="my-content-page__action-btn"
                  >
                    {t('myLectures.editBtn')}
                  </Link>
                  <button
                    className="my-content-page__action-btn my-content-page__action-btn--delete"
                    onClick={() => handleDelete(lecture.id)}
                  >
                    {t('myLectures.deleteBtn')}
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
