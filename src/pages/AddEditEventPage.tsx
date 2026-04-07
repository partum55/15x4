import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import ArrowIcon from '../components/ArrowIcon'
import { getUserEvents, saveEvent, generateId } from '../auth'
import type { Event, EventLecture } from '../data/events'
import './AddEditEventPage.css'

type EventFormState = {
  city: string
  date: string
  location: string
  time: string
  image: string
  registrationUrl: string
}

type LectureEntry = {
  id: string
  title: string
  author: string
  category: string
  categoryColor: 'orange' | 'green' | 'blue' | 'red'
  summary: string
  image: string
}

type FormErrors = Partial<Record<keyof EventFormState, string>>

const EMPTY_EVENT: EventFormState = {
  city: '',
  date: '',
  location: '',
  time: '',
  image: '',
  registrationUrl: '',
}

function emptyLecture(): LectureEntry {
  return {
    id: generateId(),
    title: '',
    author: '',
    category: '',
    categoryColor: 'blue',
    summary: '',
    image: '',
  }
}

export default function AddEditEventPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const existing = id ? getUserEvents().find(e => e.id === id) : undefined

  const [form, setForm] = useState<EventFormState>(
    existing
      ? {
          city: existing.city,
          date: existing.date,
          location: existing.location,
          time: existing.time,
          image: existing.image ?? '',
          registrationUrl: existing.registrationUrl ?? '',
        }
      : EMPTY_EVENT
  )

  const [lectures, setLectures] = useState<LectureEntry[]>(
    existing?.lectures?.map(l => ({
      id: l.id,
      title: l.title,
      author: l.author,
      category: l.category,
      categoryColor: l.categoryColor,
      summary: l.summary,
      image: l.image ?? '',
    })) ?? []
  )

  const [errors, setErrors] = useState<FormErrors>({})

  function setField(field: keyof EventFormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setLectureField(idx: number, field: keyof LectureEntry, value: string) {
    setLectures(ls =>
      ls.map((l, i) => i === idx ? { ...l, [field]: value } : l)
    )
  }

  function addLecture() {
    setLectures(ls => [...ls, emptyLecture()])
  }

  function removeLecture(idx: number) {
    setLectures(ls => ls.filter((_, i) => i !== idx))
  }

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!form.city.trim()) e.city = t('auth.login.errorRequired')
    if (!form.date.trim()) e.date = t('auth.login.errorRequired')
    if (!form.location.trim()) e.location = t('auth.login.errorRequired')
    if (!form.time.trim()) e.time = t('auth.login.errorRequired')
    return e
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const eventLectures: EventLecture[] = lectures.map(l => ({
      id: l.id,
      title: l.title.trim(),
      author: l.author.trim(),
      category: l.category.trim(),
      categoryColor: l.categoryColor,
      summary: l.summary.trim(),
      image: l.image.trim(),
    }))

    const event: Event = {
      id: existing?.id ?? generateId(),
      city: form.city.trim(),
      date: form.date.trim(),
      location: form.location.trim(),
      time: form.time.trim(),
      image: form.image.trim(),
      ...(form.registrationUrl.trim() && { registrationUrl: form.registrationUrl.trim() }),
      lectures: eventLectures,
    }

    saveEvent(event)
    navigate('/account/events')
  }

  return (
    <div className="add-edit-event-page">
      <Navbar variant="light" />
      <main className="add-edit-event-page__main">
        <div className="add-edit-event-page__container">
          <h1 className="add-edit-event-page__title">
            {isEdit ? t('addEvent.titleEdit') : t('addEvent.titleNew')}
          </h1>

          <form className="add-edit-form" onSubmit={handleSubmit} noValidate>
            <div className="add-edit-form__row">
              <FormField label={t('addEvent.cityLabel')} error={errors.city}>
                <input type="text" value={form.city} onChange={e => setField('city', e.target.value)} />
              </FormField>
              <FormField label={t('addEvent.dateLabel')} error={errors.date}>
                <input type="text" value={form.date} onChange={e => setField('date', e.target.value)} placeholder="10/05" />
              </FormField>
            </div>

            <FormField label={t('addEvent.locationLabel')} error={errors.location}>
              <input type="text" value={form.location} onChange={e => setField('location', e.target.value)} />
            </FormField>

            <div className="add-edit-form__row">
              <FormField label={t('addEvent.timeLabel')} error={errors.time}>
                <input type="text" value={form.time} onChange={e => setField('time', e.target.value)} placeholder="19:00" />
              </FormField>
              <FormField label={t('addEvent.imageLabel')}>
                <input type="text" value={form.image} onChange={e => setField('image', e.target.value)} placeholder="https://" />
              </FormField>
            </div>

            <FormField label={t('addEvent.registrationUrlLabel')}>
              <input type="text" value={form.registrationUrl} onChange={e => setField('registrationUrl', e.target.value)} placeholder="https://forms.google.com/..." />
            </FormField>

            {/* Lectures sub-form */}
            <div className="add-edit-event-page__lectures-section">
              <div className="add-edit-event-page__lectures-header">
                <h2 className="add-edit-event-page__lectures-title">{t('addEvent.lecturesTitle')}</h2>
                <button type="button" className="add-edit-event-page__add-lecture-btn" onClick={addLecture}>
                  + {t('addEvent.addLectureBtn')}
                </button>
              </div>

              {lectures.map((lec, idx) => (
                <div key={lec.id} className="add-edit-event-page__lecture-entry">
                  <div className="add-edit-event-page__lecture-entry-header">
                    <span className="add-edit-event-page__lecture-number">#{idx + 1}</span>
                    <button
                      type="button"
                      className="add-edit-event-page__remove-lecture-btn"
                      onClick={() => removeLecture(idx)}
                    >
                      {t('addEvent.removeLectureBtn')}
                    </button>
                  </div>

                  <div className="add-edit-form__row">
                    <FormField label={t('addEvent.lectureTitleLabel')}>
                      <input type="text" value={lec.title} onChange={e => setLectureField(idx, 'title', e.target.value)} />
                    </FormField>
                    <FormField label={t('addEvent.lectureAuthorLabel')}>
                      <input type="text" value={lec.author} onChange={e => setLectureField(idx, 'author', e.target.value)} />
                    </FormField>
                  </div>

                  <div className="add-edit-form__row">
                    <FormField label={t('addEvent.lectureCategoryLabel')}>
                      <input type="text" value={lec.category} onChange={e => setLectureField(idx, 'category', e.target.value)} />
                    </FormField>
                    <FormField label={t('addEvent.lectureCategoryColorLabel')}>
                      <select value={lec.categoryColor} onChange={e => setLectureField(idx, 'categoryColor', e.target.value)}>
                        <option value="blue">blue</option>
                        <option value="orange">orange</option>
                        <option value="green">green</option>
                        <option value="red">red</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField label={t('addEvent.lectureSummaryLabel')}>
                    <textarea rows={2} value={lec.summary} onChange={e => setLectureField(idx, 'summary', e.target.value)} />
                  </FormField>

                  <FormField label={t('addEvent.lectureImageLabel')}>
                    <input type="text" value={lec.image} onChange={e => setLectureField(idx, 'image', e.target.value)} placeholder="https://" />
                  </FormField>
                </div>
              ))}

              {lectures.length === 0 && (
                <p className="add-edit-event-page__no-lectures">
                  —
                </p>
              )}
            </div>

            <div className="add-edit-form__actions">
              <button type="submit" className="add-edit-form__submit">
                <span>{isEdit ? t('addEvent.submitBtnEdit') : t('addEvent.submitBtnNew')}</span>
                <ArrowIcon />
              </button>
              <Link to="/account/events" className="add-edit-form__cancel">
                {t('addEvent.cancelBtn')}
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
