import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import ArrowIcon from '../components/ArrowIcon'
import { getUserLectures, saveLecture, generateId } from '../auth'
import type { Lecture } from '../data/lectures'
import './AddEditLecturePage.css'

type FormState = {
  title: string
  author: string
  category: string
  categoryColor: 'orange' | 'green' | 'blue' | 'red'
  summary: string
  image: string
  duration: string
  authorBio: string
  videoUrl: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const EMPTY: FormState = {
  title: '',
  author: '',
  category: '',
  categoryColor: 'blue',
  summary: '',
  image: '',
  duration: '',
  authorBio: '',
  videoUrl: '',
}

export default function AddEditLecturePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const existing = id ? getUserLectures().find(l => l.id === id) : undefined

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          title: existing.title,
          author: existing.author,
          category: existing.category,
          categoryColor: existing.categoryColor,
          summary: existing.summary,
          image: existing.image ?? '',
          duration: existing.duration ?? '',
          authorBio: existing.authorBio ?? '',
          videoUrl: existing.videoUrl ?? '',
        }
      : EMPTY
  )
  const [errors, setErrors] = useState<FormErrors>({})

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!form.title.trim()) e.title = t('auth.login.errorRequired')
    if (!form.author.trim()) e.author = t('auth.login.errorRequired')
    if (!form.category.trim()) e.category = t('auth.login.errorRequired')
    if (!form.summary.trim()) e.summary = t('auth.login.errorRequired')
    return e
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const lecture: Lecture = {
      id: existing?.id ?? generateId(),
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      categoryColor: form.categoryColor,
      summary: form.summary.trim(),
      image: form.image.trim(),
      ...(form.duration.trim() && { duration: form.duration.trim() }),
      ...(form.videoUrl.trim() && { videoUrl: form.videoUrl.trim() }),
      ...(form.authorBio.trim() && { authorBio: form.authorBio.trim() }),
    }

    saveLecture(lecture)
    navigate('/account/lectures')
  }

  return (
    <div className="add-edit-lecture-page">
      <Navbar variant="light" />
      <main className="add-edit-lecture-page__main">
        <div className="add-edit-lecture-page__container">
          <h1 className="add-edit-lecture-page__title">
            {isEdit ? t('addLecture.titleEdit') : t('addLecture.titleNew')}
          </h1>

          <form className="add-edit-form" onSubmit={handleSubmit} noValidate>
            <FormField label={t('addLecture.titleLabel')} error={errors.title}>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)} />
            </FormField>

            <FormField label={t('addLecture.authorLabel')} error={errors.author}>
              <input type="text" value={form.author} onChange={e => set('author', e.target.value)} />
            </FormField>

            <div className="add-edit-form__row">
              <FormField label={t('addLecture.categoryLabel')} error={errors.category}>
                <input type="text" value={form.category} onChange={e => set('category', e.target.value)} />
              </FormField>

              <FormField label={t('addLecture.categoryColorLabel')}>
                <select value={form.categoryColor} onChange={e => set('categoryColor', e.target.value as FormState['categoryColor'])}>
                  <option value="blue">blue</option>
                  <option value="orange">orange</option>
                  <option value="green">green</option>
                  <option value="red">red</option>
                </select>
              </FormField>
            </div>

            <FormField label={t('addLecture.summaryLabel')} error={errors.summary}>
              <textarea rows={4} value={form.summary} onChange={e => set('summary', e.target.value)} />
            </FormField>

            <FormField label={t('addLecture.imageLabel')}>
              <input type="text" value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://" />
            </FormField>

            <FormField label={t('addLecture.videoUrlLabel')}>
              <input type="text" value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </FormField>

            <FormField label={t('addLecture.durationLabel')}>
              <input type="text" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="17 хв" />
            </FormField>

            <FormField label={t('addLecture.authorBioLabel')}>
              <textarea rows={3} value={form.authorBio} onChange={e => set('authorBio', e.target.value)} />
            </FormField>

            <div className="add-edit-form__actions">
              <button type="submit" className="add-edit-form__submit">
                <span>{isEdit ? t('addLecture.submitBtnEdit') : t('addLecture.submitBtnNew')}</span>
                <ArrowIcon />
              </button>
              <Link to="/account/lectures" className="add-edit-form__cancel">
                {t('addLecture.cancelBtn')}
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
