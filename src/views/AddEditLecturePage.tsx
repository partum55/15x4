'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import ArrowIcon from '../components/ArrowIcon'
import { api } from '../lib/api'
import { LECTURE_CATEGORIES, getLectureCategoryColor, normalizeLectureCategory } from '../constants/lectureCategories'
import type { Event } from '@/lib/api'

type FormState = {
  eventId: string
  slot: string
  titleUk: string
  titleEn: string
  authorUk: string
  authorEn: string
  category: string
  summaryUk: string
  summaryEn: string
  image: string
  duration: string
  authorBioUk: string
  authorBioEn: string
  videoUrl: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const EMPTY: FormState = {
  eventId: '',
  slot: '1',
  titleUk: '',
  titleEn: '',
  authorUk: '',
  authorEn: '',
  category: '',
  summaryUk: '',
  summaryEn: '',
  image: '',
  duration: '',
  authorBioUk: '',
  authorBioEn: '',
  videoUrl: '',
}

export default function AddEditLecturePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    api.getEvents().then((rows) => setEvents(rows))
  }, [])

  useEffect(() => {
    if (!id) return
    api.getLecture(id).then((data: FormState & { error?: string }) => {
      if (!data.error) {
        const normalizedCategory = normalizeLectureCategory(data.category ?? '')?.category ?? ''
        setForm({
          eventId: data.eventId ?? '',
          slot: String(data.slot ?? '1'),
          titleUk: data.titleUk ?? '',
          titleEn: data.titleEn ?? '',
          authorUk: data.authorUk ?? '',
          authorEn: data.authorEn ?? '',
          category: normalizedCategory,
          summaryUk: data.summaryUk ?? '',
          summaryEn: data.summaryEn ?? '',
          image: data.image ?? '',
          duration: data.duration ?? '',
          authorBioUk: data.authorBioUk ?? '',
          authorBioEn: data.authorBioEn ?? '',
          videoUrl: data.videoUrl ?? '',
        })
      }
    })
  }, [id])

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!form.eventId.trim()) e.eventId = t('auth.login.errorRequired')
    if (!form.slot.trim()) e.slot = t('auth.login.errorRequired')
    if (!form.titleUk.trim()) e.titleUk = t('auth.login.errorRequired')
    if (!form.authorUk.trim()) e.authorUk = t('auth.login.errorRequired')
    if (!form.category.trim()) e.category = t('auth.login.errorRequired')
    if (!form.summaryUk.trim()) e.summaryUk = t('auth.login.errorRequired')
    if (!form.image.trim()) e.image = t('auth.login.errorRequired')
    return e
  }

  async function translatePair(
    sourceValue: string,
    sourceLanguage: 'uk' | 'en',
    targetLanguage: 'uk' | 'en',
  ) {
    if (!sourceValue.trim()) return ''
    const result = await api.translateText({ text: sourceValue.trim(), sourceLanguage, targetLanguage })
    return result?.translatedText ? String(result.translatedText) : ''
  }

  async function handleTranslateAll() {
    setTranslating(true)
    try {
      const useUkAsSource =
        form.titleUk.trim() ||
        form.authorUk.trim() ||
        form.summaryUk.trim() ||
        form.authorBioUk.trim() ||
        !form.titleEn.trim()

      if (useUkAsSource) {
        const [titleEn, authorEn, summaryEn, authorBioEn] = await Promise.all([
          translatePair(form.titleUk, 'uk', 'en'),
          translatePair(form.authorUk, 'uk', 'en'),
          translatePair(form.summaryUk, 'uk', 'en'),
          translatePair(form.authorBioUk, 'uk', 'en'),
        ])

        setForm((prev) => ({
          ...prev,
          titleEn: titleEn || prev.titleEn,
          authorEn: authorEn || prev.authorEn,
          summaryEn: summaryEn || prev.summaryEn,
          authorBioEn: authorBioEn || prev.authorBioEn,
        }))
      } else {
        const [titleUk, authorUk, summaryUk, authorBioUk] = await Promise.all([
          translatePair(form.titleEn, 'en', 'uk'),
          translatePair(form.authorEn, 'en', 'uk'),
          translatePair(form.summaryEn, 'en', 'uk'),
          translatePair(form.authorBioEn, 'en', 'uk'),
        ])

        setForm((prev) => ({
          ...prev,
          titleUk: titleUk || prev.titleUk,
          authorUk: authorUk || prev.authorUk,
          summaryUk: summaryUk || prev.summaryUk,
          authorBioUk: authorBioUk || prev.authorBioUk,
        }))
      }
    } finally {
      setTranslating(false)
    }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setFormError('')
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }

    const categoryColor = getLectureCategoryColor(form.category)
    if (!categoryColor) {
      setErrors((prev) => ({ ...prev, category: t('addLecture.errorInvalidCategory') }))
      return
    }

    const body = {
      eventId: form.eventId.trim(),
      slot: Number(form.slot),
      titleUk: form.titleUk.trim(),
      titleEn: form.titleEn.trim(),
      authorUk: form.authorUk.trim(),
      authorEn: form.authorEn.trim(),
      category: form.category.trim(),
      categoryColor,
      summaryUk: form.summaryUk.trim(),
      summaryEn: form.summaryEn.trim(),
      image: form.image.trim(),
      duration: form.duration.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      authorBioUk: form.authorBioUk.trim() || undefined,
      authorBioEn: form.authorBioEn.trim() || undefined,
    }

    const result = isEdit && id ? await api.updateLecture(id, body) : await api.createLecture(body)
    if (result?.error) {
      setFormError(result.error)
      return
    }

    router.push('/account/lectures')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[900px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">
            {isEdit ? t('addLecture.titleEdit') : t('addLecture.titleNew')}
          </h1>

          {formError && (
            <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{formError}</p>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <div className="flex justify-end">
              <button
                type="button"
                className="h-[42px] min-w-[128px] px-5 rounded-full border border-black bg-white text-[11px] font-medium tracking-[0.08em] uppercase transition-colors duration-150 hover:bg-black hover:text-white disabled:opacity-45 disabled:cursor-not-allowed"
                onClick={handleTranslateAll}
                disabled={translating}
              >
                {translating ? '...' : 'Translate'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
              <FormField label={t('addLecture.eventLabel')} error={errors.eventId}>
                <select value={form.eventId} onChange={(e) => set('eventId', e.target.value)}>
                  <option value="">{t('addLecture.eventPlaceholder')}</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.titleUk || event.cityUk}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={t('addLecture.slotLabel')} error={errors.slot}>
                <select value={form.slot} onChange={(e) => set('slot', e.target.value)}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addLecture.titleUkLabel')} error={errors.titleUk}>
                <input type="text" value={form.titleUk} onChange={(e) => set('titleUk', e.target.value)} />
              </FormField>
              <FormField label={t('addLecture.titleEnLabel')}>
                <input type="text" value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addLecture.authorUkLabel')} error={errors.authorUk}>
                <input type="text" value={form.authorUk} onChange={(e) => set('authorUk', e.target.value)} />
              </FormField>
              <FormField label={t('addLecture.authorEnLabel')}>
                <input type="text" value={form.authorEn} onChange={(e) => set('authorEn', e.target.value)} />
              </FormField>
            </div>

            <FormField label={t('addLecture.categoryLabel')} error={errors.category}>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">{t('addLecture.categoryPlaceholder')}</option>
                {LECTURE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(`lectureCategories.${category}`, { defaultValue: category })}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addLecture.summaryUkLabel')} error={errors.summaryUk}>
                <textarea rows={4} value={form.summaryUk} onChange={(e) => set('summaryUk', e.target.value)} />
              </FormField>
              <FormField label={t('addLecture.summaryEnLabel')}>
                <textarea rows={4} value={form.summaryEn} onChange={(e) => set('summaryEn', e.target.value)} />
              </FormField>
            </div>

            <FormField label={t('addLecture.imageLabel')} error={errors.image}>
              <input type="text" value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="https://" />
            </FormField>

            <FormField label={t('addLecture.videoUrlLabel')}>
              <input type="text" value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </FormField>

            <FormField label={t('addLecture.durationLabel')}>
              <input type="text" value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder="17 хв" />
            </FormField>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addLecture.authorBioUkLabel')}>
                <textarea rows={3} value={form.authorBioUk} onChange={(e) => set('authorBioUk', e.target.value)} />
              </FormField>
              <FormField label={t('addLecture.authorBioEnLabel')}>
                <textarea rows={3} value={form.authorBioEn} onChange={(e) => set('authorBioEn', e.target.value)} />
              </FormField>
            </div>

            <div className="flex items-center gap-6 mt-2 pt-6 border-t border-black">
              <button
                type="submit"
                className="flex items-center gap-3 px-6 py-4 bg-black text-white border-none font-sans text-[clamp(14px,1.3vw,20px)] font-normal uppercase cursor-pointer transition-opacity duration-200 hover:opacity-85"
              >
                <span>{isEdit ? t('addLecture.submitBtnEdit') : t('addLecture.submitBtnNew')}</span>
                <ArrowIcon />
              </button>
              <Link
                href="/account/lectures"
                className="text-[clamp(13px,1.2vw,18px)] text-black no-underline opacity-60 transition-opacity duration-150 hover:opacity-100 hover:underline"
              >
                {t('addLecture.cancelBtn')}
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
