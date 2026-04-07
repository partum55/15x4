import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { lectures } from '../data/lectures'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './LectureDetailPage.css'

export default function LectureDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const lecture = lectures.find((l) => l.id === id)
  const related = lectures.filter((l) => l.id !== id).slice(0, 4)

  if (!lecture) {
    return (
      <div className="page ld-page">
        <Navbar />
        <div className="ld-not-found">{t('lectureDetail.notFound')}</div>
      </div>
    )
  }

  return (
    <div className="page ld-page">
      <Navbar />

      <main className="ld-main">
        {/* Title */}
        <h1 className="ld-title">{lecture.title.toUpperCase()}</h1>

        {/* Hero: image + meta */}
        <div className="ld-hero">
          <div className="ld-hero__media">
            <img src={lecture.image} alt={lecture.title} className="ld-hero__img" />
            <button className="ld-hero__play" aria-label={t('lectureDetail.play')}>
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="16,10 40,24 16,38" fill="white" />
              </svg>
            </button>
          </div>

          <div className="ld-hero__side">
            <div className="ld-hero__top-row">
              <span className={`ld-badge ld-badge--${lecture.categoryColor}`}>
                {lecture.category}
              </span>
              {lecture.duration && (
                <span className="ld-hero__duration">{lecture.duration}</span>
              )}
            </div>
            <p className="ld-hero__desc">{lecture.summary}</p>
          </div>
        </div>

        <div className="ld-divider" />

        {/* About author + sources */}
        <div className="ld-info-grid">
          <section className="ld-author">
            <h2 className="ld-section-heading">
              <span className="ld-section-heading__accent">//</span> {t('lectureDetail.aboutAuthor')}
            </h2>
            <div className="ld-author__body">
              <div className="ld-author__left">
                <p className="ld-author__name">{lecture.author.toUpperCase()}</p>
                {lecture.socialLinks?.map((s) => (
                  <div key={s.platform} className="ld-author__social">
                    <span className="ld-author__platform">[{s.platform}]</span>
                    <a href={s.url} className="ld-author__handle" target="_blank" rel="noreferrer">
                      {s.handle}
                    </a>
                  </div>
                ))}
              </div>
              {lecture.authorBio && (
                <p className="ld-author__bio">{lecture.authorBio}</p>
              )}
            </div>
          </section>

          {lecture.sources && lecture.sources.length > 0 && (
            <section className="ld-sources">
              <h2 className="ld-section-heading">
                <span className="ld-section-heading__accent">//</span> {t('lectureDetail.additionalSources')}
              </h2>
              <ol className="ld-sources__list">
                {lecture.sources.map((s, i) => (
                  <li key={i} className="ld-sources__item">
                    {s.url ? (
                      <>
                        {s.label.split('–')[0]}
                        {s.label.includes('–') && '– '}
                        <a href={s.url} className="ld-sources__link" target="_blank" rel="noreferrer">
                          {s.url.replace(/^https?:\/\//, '')}
                        </a>
                      </>
                    ) : (
                      s.label
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* About event */}
        {lecture.event && (
          <>
            <div className="ld-divider" />
            <section className="ld-event">
              <h2 className="ld-section-heading">
                <span className="ld-section-heading__accent">//</span> {t('lectureDetail.aboutEvent')}
              </h2>
              <div className="ld-event__meta">
                <span className="ld-event__city">{lecture.event.city.toUpperCase()}</span>
                <span className="ld-event__date">[{lecture.event.date}]</span>
                {lecture.event.photosUrl && (
                  <a href={lecture.event.photosUrl} className="ld-event__photos" target="_blank" rel="noreferrer">
                    {t('lectureDetail.eventPhotos')}&nbsp;<span className="ld-event__arrow">↗</span>
                  </a>
                )}
              </div>

              {related.length > 0 && (
                <div className="ld-related">
                  {related.map((r) => (
                    <Link key={r.id} to={`/lectures/${r.id}`} className="ld-related__card">
                      <div className="ld-related__img-wrap">
                        <img src={r.image} alt={r.title} className="ld-related__img" />
                        <span className={`ld-related__badge ld-related__badge--${r.categoryColor}`}>
                          {r.category}
                        </span>
                      </div>
                      <p className="ld-related__title">{r.title.toUpperCase()}</p>
                      <p className="ld-related__author">{r.author}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
