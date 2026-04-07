'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import ArrowIcon from '../components/ArrowIcon'
import { api } from '../lib/api'

type EventFormState = {
  city: string
  date: string
  location: string
  time: string
  image: string
  registrationUrl: string
}

type LectureEntry = {
  tempId: string
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

let tempIdCounter = 0
function emptyLecture(): LectureEntry {
  return {
    tempId: String(++tempIdCounter),
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
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const isEdit = Boolean(id)

  const [form, setForm] = useState<EventFormState>(EMPTY_EVENT)
  const [lectures, setLectures] = useState<LectureEntry[]>([])
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!id) return
    api.getEvent(id).then((data: EventFormState & { lectures?: LectureEntry[]; error?: string }) => {
      if (!data.error) {
        setForm({
          city: data.city ?? '',
          date: data.date ?? '',
          location: data.location ?? '',
          time: data.time ?? '',
          image: data.image ?? '',
          registrationUrl: data.registrationUrl ?? '',
        })
        setLectures(
          (data.lectures ?? []).map((l: LectureEntry) => ({
            tempId: String(++tempIdCounter),
            title: l.title ?? '',
            author: l.author ?? '',
            category: l.category ?? '',
            categoryColor: (l.categoryColor as LectureEntry['categoryColor']) ?? 'blue',
            summary: l.summary ?? '',
            image: l.image ?? '',
          }))
        )
      }
    })
  }, [id])

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

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const body = {
      city: form.city.trim(),
      date: form.date.trim(),
      location: form.location.trim(),
      time: form.time.trim(),
      image: form.image.trim(),
      registrationUrl: form.registrationUrl.trim() || null,
      lectures: lectures.map(l => ({
        title: l.title.trim(),
        author: l.author.trim(),
        category: l.category.trim(),
        categoryColor: l.categoryColor,
        summary: l.summary.trim(),
        image: l.image.trim(),
      })),
    }

    if (isEdit && id) {
      await api.updateEvent(id, body)
    } else {
      await api.createEvent(body)
    }
    router.push('/account/events')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[720px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">
            {isEdit ? t('addEvent.titleEdit') : t('addEvent.titleNew')}
          </h1>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
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

            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
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
            <div className="flex flex-col gap-0 border-t border-black pt-6">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-[clamp(16px,1.6vw,24px)] font-normal tracking-[-0.04em] uppercase text-black">{t('addEvent.lecturesTitle')}</h2>
                <button
                  type="button"
                  className="bg-transparent border border-black font-sans text-[clamp(12px,1.1vw,16px)] font-normal text-black cursor-pointer px-4 py-2 uppercase transition-colors duration-150 hover:bg-black hover:text-white"
                  onClick={addLecture}
                >
                  + {t('addEvent.addLectureBtn')}
                </button>
              </div>

              {lectures.map((lec, idx) => (
                <div key={lec.tempId} className="flex flex-col gap-4 pt-5 pb-6 border-b border-black mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[clamp(13px,1.2vw,18px)] font-bold text-black opacity-40 uppercase">#{idx + 1}</span>
                    <button
                      type="button"
                      className="bg-transparent border-none font-sans text-[clamp(12px,1.1vw,16px)] text-red cursor-pointer p-0 underline opacity-80 transition-opacity duration-150 hover:opacity-100"
                      onClick={() => removeLecture(idx)}
                    >
                      {t('addEvent.removeLectureBtn')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
                    <FormField label={t('addEvent.lectureTitleLabel')}>
                      <input type="text" value={lec.title} onChange={e => setLectureField(idx, 'title', e.target.value)} />
                    </FormField>
                    <FormField label={t('addEvent.lectureAuthorLabel')}>
                      <input type="text" value={lec.author} onChange={e => setLectureField(idx, 'author', e.target.value)} />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
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
                <p className="text-[clamp(13px,1.2vw,18px)] text-black opacity-35 mb-6">
                  —
                </p>
              )}
            </div>

            <div className="flex items-center gap-6 mt-2 pt-6 border-t border-black">
              <button
                type="submit"
                className="flex items-center gap-3 px-6 py-4 bg-black text-white border-none font-sans text-[clamp(14px,1.3vw,20px)] font-normal uppercase cursor-pointer transition-opacity duration-200 hover:opacity-85"
              >
                <span>{isEdit ? t('addEvent.submitBtnEdit') : t('addEvent.submitBtnNew')}</span>
                <ArrowIcon />
              </button>
              <Link
                href="/account/events"
                className="text-[clamp(13px,1.2vw,18px)] text-black no-underline opacity-60 transition-opacity duration-150 hover:opacity-100 hover:underline"
              >
                {t('addEvent.cancelBtn')}
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
