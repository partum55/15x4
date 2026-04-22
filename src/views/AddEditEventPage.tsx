'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import ArrowIcon from '../components/ArrowIcon'
import { api } from '../lib/api'
import {
  LECTURE_CATEGORIES,
  getLectureCategoryColor,
  normalizeLectureCategory,
} from '../constants/lectureCategories'

type EventFormState = {
  titleUk: string
  titleEn: string
  descriptionUk: string
  descriptionEn: string
  cityUk: string
  cityEn: string
  date: string
  locationUk: string
  locationEn: string
  time: string
  image: string
  registrationUrl: string
}

type EventLectureFormState = {
  tempId: string
  slot: string
  titleUk: string
  titleEn: string
  authorUk: string
  authorEn: string
  category: string
  summaryUk: string
  summaryEn: string
  image: string
}

type FormErrors = Partial<Record<keyof EventFormState, string>>

const EMPTY_EVENT: EventFormState = {
  titleUk: '',
  titleEn: '',
  descriptionUk: '',
  descriptionEn: '',
  cityUk: '',
  cityEn: '',
  date: '',
  locationUk: '',
  locationEn: '',
  time: '',
  image: '',
  registrationUrl: '',
}

let lectureTempCounter = 0
function emptyLecture(slot: number): EventLectureFormState {
  return {
    tempId: String(++lectureTempCounter),
    slot: String(slot),
    titleUk: '',
    titleEn: '',
    authorUk: '',
    authorEn: '',
    category: '',
    summaryUk: '',
    summaryEn: '',
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
  const [lectures, setLectures] = useState<EventLectureFormState[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState('')
  const [translating, setTranslating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getEvent(id).then((data: EventFormState & { error?: string }) => {
      if (!data.error) {
        setForm({
          titleUk: data.titleUk ?? '',
          titleEn: data.titleEn ?? '',
          descriptionUk: data.descriptionUk ?? '',
          descriptionEn: data.descriptionEn ?? '',
          cityUk: data.cityUk ?? '',
          cityEn: data.cityEn ?? '',
          date: data.date ?? '',
          locationUk: data.locationUk ?? '',
          locationEn: data.locationEn ?? '',
          time: data.time ?? '',
          image: data.image ?? '',
          registrationUrl: data.registrationUrl ?? '',
        })
        setLectures(
          Array.isArray((data as { lectures?: Array<Record<string, unknown>> }).lectures)
            ? ((data as { lectures?: Array<Record<string, unknown>> }).lectures ?? []).map((lecture, index) => ({
                tempId: String(++lectureTempCounter),
                slot: String(lecture.slot ?? index + 1),
                titleUk: String(lecture.titleUk ?? ''),
                titleEn: String(lecture.titleEn ?? ''),
                authorUk: String(lecture.authorUk ?? ''),
                authorEn: String(lecture.authorEn ?? ''),
                category: normalizeLectureCategory(String(lecture.category ?? ''))?.category ?? '',
                summaryUk: String(lecture.summaryUk ?? ''),
                summaryEn: String(lecture.summaryEn ?? ''),
                image: String(lecture.image ?? ''),
              }))
            : [],
        )
      }
    })
  }, [id])

  function setField(field: keyof EventFormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setLectureField(index: number, field: keyof EventLectureFormState, value: string) {
    setLectures((prev) => prev.map((lecture, i) => (i === index ? { ...lecture, [field]: value } : lecture)))
  }

  function addLecture() {
    if (saving || translating) return
    if (lectures.length >= 4) return
    const slot = lectures.length + 1
    setLectures((prev) => [...prev, emptyLecture(slot)])
  }

  function removeLecture(index: number) {
    if (saving || translating) return
    setLectures((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((lecture, i) => ({ ...lecture, slot: String(i + 1) })),
    )
  }

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!form.titleUk.trim()) e.titleUk = t('auth.login.errorRequired')
    if (!form.cityUk.trim()) e.cityUk = t('auth.login.errorRequired')
    if (!form.date.trim()) e.date = t('auth.login.errorRequired')
    if (!form.locationUk.trim()) e.locationUk = t('auth.login.errorRequired')
    if (!form.time.trim()) e.time = t('auth.login.errorRequired')
    return e
  }

  async function translatePair(
    sourceValue: string,
    sourceLanguage: 'uk' | 'en',
    targetLanguage: 'uk' | 'en',
    existingTarget = '',
  ) {
    if (existingTarget.trim()) return existingTarget
    if (!sourceValue.trim()) return ''
    const result = await api.translateText({ text: sourceValue.trim(), sourceLanguage, targetLanguage })
    return result?.translatedText ? String(result.translatedText) : ''
  }

  async function handleTranslateAll() {
    if (translating || saving) return
    setTranslating(true)
    try {
      const useUkAsSource =
        form.titleUk.trim() ||
        form.cityUk.trim() ||
        form.locationUk.trim() ||
        form.descriptionUk.trim() ||
        !form.titleEn.trim()

      if (useUkAsSource) {
        const [titleEn, cityEn, locationEn, descriptionEn] = await Promise.all([
          translatePair(form.titleUk, 'uk', 'en', form.titleEn),
          translatePair(form.cityUk, 'uk', 'en', form.cityEn),
          translatePair(form.locationUk, 'uk', 'en', form.locationEn),
          translatePair(form.descriptionUk, 'uk', 'en', form.descriptionEn),
        ])

        setForm((prev) => ({
          ...prev,
          titleEn: titleEn || prev.titleEn,
          cityEn: cityEn || prev.cityEn,
          locationEn: locationEn || prev.locationEn,
          descriptionEn: descriptionEn || prev.descriptionEn,
        }))

        const translatedLectures = await Promise.all(
          lectures.map(async (lecture) => {
            const [lTitleEn, lAuthorEn, lSummaryEn] = await Promise.all([
              translatePair(lecture.titleUk, 'uk', 'en', lecture.titleEn),
              translatePair(lecture.authorUk, 'uk', 'en', lecture.authorEn),
              translatePair(lecture.summaryUk, 'uk', 'en', lecture.summaryEn),
            ])
            return {
              ...lecture,
              titleEn: lTitleEn || lecture.titleEn,
              authorEn: lAuthorEn || lecture.authorEn,
              summaryEn: lSummaryEn || lecture.summaryEn,
            }
          }),
        )
        setLectures(translatedLectures)
      } else {
        const [titleUk, cityUk, locationUk, descriptionUk] = await Promise.all([
          translatePair(form.titleEn, 'en', 'uk', form.titleUk),
          translatePair(form.cityEn, 'en', 'uk', form.cityUk),
          translatePair(form.locationEn, 'en', 'uk', form.locationUk),
          translatePair(form.descriptionEn, 'en', 'uk', form.descriptionUk),
        ])

        setForm((prev) => ({
          ...prev,
          titleUk: titleUk || prev.titleUk,
          cityUk: cityUk || prev.cityUk,
          locationUk: locationUk || prev.locationUk,
          descriptionUk: descriptionUk || prev.descriptionUk,
        }))

        const translatedLectures = await Promise.all(
          lectures.map(async (lecture) => {
            const [lTitleUk, lAuthorUk, lSummaryUk] = await Promise.all([
              translatePair(lecture.titleEn, 'en', 'uk', lecture.titleUk),
              translatePair(lecture.authorEn, 'en', 'uk', lecture.authorUk),
              translatePair(lecture.summaryEn, 'en', 'uk', lecture.summaryUk),
            ])
            return {
              ...lecture,
              titleUk: lTitleUk || lecture.titleUk,
              authorUk: lAuthorUk || lecture.authorUk,
              summaryUk: lSummaryUk || lecture.summaryUk,
            }
          }),
        )
        setLectures(translatedLectures)
      }
    } finally {
      setTranslating(false)
    }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (saving || translating) return
    setFormError('')
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const body = {
      titleUk: form.titleUk.trim(),
      titleEn: form.titleEn.trim(),
      descriptionUk: form.descriptionUk.trim(),
      descriptionEn: form.descriptionEn.trim(),
      cityUk: form.cityUk.trim(),
      cityEn: form.cityEn.trim(),
      date: form.date.trim(),
      locationUk: form.locationUk.trim(),
      locationEn: form.locationEn.trim(),
      time: form.time.trim(),
      image: form.image.trim(),
      registrationUrl: form.registrationUrl.trim() || null,
      lectures: lectures.map((lecture, index) => ({
        slot: Number(lecture.slot || index + 1),
        titleUk: lecture.titleUk.trim(),
        titleEn: lecture.titleEn.trim(),
        authorUk: lecture.authorUk.trim(),
        authorEn: lecture.authorEn.trim(),
        category: lecture.category.trim(),
        categoryColor: getLectureCategoryColor(lecture.category.trim()),
        summaryUk: lecture.summaryUk.trim(),
        summaryEn: lecture.summaryEn.trim(),
        image: lecture.image.trim(),
      })),
    }

    if (body.lectures.length > 4) {
      setFormError(t('addEvent.errorLecturesLimit'))
      return
    }

    const invalidLecture = body.lectures.find((lecture) =>
      !lecture.titleUk ||
      !lecture.authorUk ||
      !lecture.category ||
      !lecture.summaryUk ||
      !lecture.image ||
      !lecture.categoryColor,
    )
    if (invalidLecture) {
      setFormError(t('addEvent.errorInvalidCategory'))
      return
    }

    setSaving(true)
    try {
      const result = isEdit && id
        ? await api.updateEvent(id, body)
        : await api.createEvent(body)

      if (result?.error) {
        setFormError(result.error)
        return
      }

      router.push('/account/events')
    } catch {
      setFormError(t('addEvent.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[960px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">
            {isEdit ? t('addEvent.titleEdit') : t('addEvent.titleNew')}
          </h1>

          {formError && (
            <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{formError}</p>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <div className="flex justify-end">
              <button
                type="button"
                className="h-[42px] min-w-[128px] px-5 rounded-full border border-black bg-white text-[11px] font-medium tracking-[0.08em] uppercase transition-colors duration-150 hover:bg-black hover:text-white disabled:opacity-45 disabled:cursor-wait disabled:animate-pulse"
                onClick={handleTranslateAll}
                disabled={translating || saving}
                aria-busy={translating}
              >
                {translating ? '...' : 'Translate'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addEvent.titleUkLabel')} error={errors.titleUk}>
                <input type="text" value={form.titleUk} onChange={e => setField('titleUk', e.target.value)} />
              </FormField>
              <FormField label={t('addEvent.titleEnLabel')}>
                <input type="text" value={form.titleEn} onChange={e => setField('titleEn', e.target.value)} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addEvent.cityUkLabel')} error={errors.cityUk}>
                <input type="text" value={form.cityUk} onChange={e => setField('cityUk', e.target.value)} />
              </FormField>
              <FormField label={t('addEvent.cityEnLabel')}>
                <input type="text" value={form.cityEn} onChange={e => setField('cityEn', e.target.value)} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addEvent.locationUkLabel')} error={errors.locationUk}>
                <input type="text" value={form.locationUk} onChange={e => setField('locationUk', e.target.value)} />
              </FormField>
              <FormField label={t('addEvent.locationEnLabel')}>
                <input type="text" value={form.locationEn} onChange={e => setField('locationEn', e.target.value)} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addEvent.descriptionUkLabel')}>
                <textarea rows={3} value={form.descriptionUk} onChange={e => setField('descriptionUk', e.target.value)} />
              </FormField>
              <FormField label={t('addEvent.descriptionEnLabel')}>
                <textarea rows={3} value={form.descriptionEn} onChange={e => setField('descriptionEn', e.target.value)} />
              </FormField>
            </div>

            <FormField label={t('addEvent.dateLabel')} error={errors.date}>
              <input type="text" value={form.date} onChange={e => setField('date', e.target.value)} placeholder="10/05" />
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

            <div className="flex flex-col gap-4 pt-6 border-t border-black">
              <div className="flex items-center justify-between">
                <h2 className="text-[clamp(16px,1.6vw,24px)] font-normal tracking-[-0.04em] uppercase text-black">{t('addEvent.lecturesTitle')}</h2>
                <button
                  type="button"
                  className="h-[42px] min-w-[128px] px-5 rounded-full border border-black bg-white text-[11px] font-medium tracking-[0.08em] uppercase transition-colors duration-150 hover:bg-black hover:text-white disabled:opacity-45 disabled:cursor-wait disabled:animate-pulse"
                  onClick={addLecture}
                  disabled={lectures.length >= 4 || saving || translating}
                >
                  {t('addEvent.addLectureBtn')}
                </button>
              </div>

              {lectures.map((lecture, index) => (
                <div key={lecture.tempId} className="border border-black p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[clamp(12px,1.1vw,16px)] uppercase opacity-60">#{lecture.slot}</span>
                    <button
                      type="button"
                      className="text-[clamp(12px,1.1vw,16px)] uppercase underline opacity-70 hover:opacity-100 disabled:cursor-wait disabled:opacity-40"
                      onClick={() => removeLecture(index)}
                      disabled={saving || translating}
                    >
                      {t('addEvent.removeLectureBtn')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
                    <FormField label={t('addEvent.lectureTitleUkLabel')}>
                      <input type="text" value={lecture.titleUk} onChange={(e) => setLectureField(index, 'titleUk', e.target.value)} />
                    </FormField>
                    <FormField label={t('addEvent.lectureTitleEnLabel')}>
                      <input type="text" value={lecture.titleEn} onChange={(e) => setLectureField(index, 'titleEn', e.target.value)} />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
                    <FormField label={t('addEvent.lectureAuthorUkLabel')}>
                      <input type="text" value={lecture.authorUk} onChange={(e) => setLectureField(index, 'authorUk', e.target.value)} />
                    </FormField>
                    <FormField label={t('addEvent.lectureAuthorEnLabel')}>
                      <input type="text" value={lecture.authorEn} onChange={(e) => setLectureField(index, 'authorEn', e.target.value)} />
                    </FormField>
                  </div>

                  <FormField label={t('addEvent.lectureCategoryLabel')}>
                    <select value={lecture.category} onChange={(e) => setLectureField(index, 'category', e.target.value)}>
                      <option value="">{t('addEvent.lectureCategoryPlaceholder')}</option>
                      {LECTURE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {t(`lectureCategories.${category}`, { defaultValue: category })}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
                    <FormField label={t('addEvent.lectureSummaryUkLabel')}>
                      <textarea rows={3} value={lecture.summaryUk} onChange={(e) => setLectureField(index, 'summaryUk', e.target.value)} />
                    </FormField>
                    <FormField label={t('addEvent.lectureSummaryEnLabel')}>
                      <textarea rows={3} value={lecture.summaryEn} onChange={(e) => setLectureField(index, 'summaryEn', e.target.value)} />
                    </FormField>
                  </div>

                  <FormField label={t('addEvent.lectureImageLabel')}>
                    <input type="text" value={lecture.image} onChange={(e) => setLectureField(index, 'image', e.target.value)} placeholder="https://" />
                  </FormField>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 mt-2 pt-6 border-t border-black">
              <button
                type="submit"
                disabled={saving || translating}
                aria-busy={saving}
                className="flex items-center gap-3 px-6 py-4 bg-black text-white border-none font-sans text-[clamp(14px,1.3vw,20px)] font-normal uppercase cursor-pointer transition-opacity duration-200 hover:opacity-85 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
              >
                <span>{saving ? '...' : isEdit ? t('addEvent.submitBtnEdit') : t('addEvent.submitBtnNew')}</span>
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
