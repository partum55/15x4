'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import ArrowIcon from '../components/ArrowIcon'
import { api } from '../lib/api'
import { CATEGORY_COLOR_VAR } from '../constants/colors'
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
  const [saving, setSaving] = useState(false)

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
        form.authorUk.trim() ||
        form.summaryUk.trim() ||
        form.authorBioUk.trim() ||
        !form.titleEn.trim()

      if (useUkAsSource) {
        const [titleEn, authorEn, summaryEn, authorBioEn] = await Promise.all([
          translatePair(form.titleUk, 'uk', 'en', form.titleEn),
          translatePair(form.authorUk, 'uk', 'en', form.authorEn),
          translatePair(form.summaryUk, 'uk', 'en', form.summaryEn),
          translatePair(form.authorBioUk, 'uk', 'en', form.authorBioEn),
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
          translatePair(form.titleEn, 'en', 'uk', form.titleUk),
          translatePair(form.authorEn, 'en', 'uk', form.authorUk),
          translatePair(form.summaryEn, 'en', 'uk', form.summaryUk),
          translatePair(form.authorBioEn, 'en', 'uk', form.authorBioUk),
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
    if (saving || translating) return
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
      videoUrl: form.videoUrl.trim() || undefined,
      authorBioUk: form.authorBioUk.trim() || undefined,
      authorBioEn: form.authorBioEn.trim() || undefined,
    }

    setSaving(true)
    try {
      const result = isEdit && id ? await api.updateLecture(id, body) : await api.createLecture(body)
      if (result?.error) {
        setFormError(result.error)
        return
      }

      router.push('/account/lectures')
    } catch {
      setFormError(t('addLecture.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  const selectedEvent = events.find((event) => event.id === form.eventId)
  const previewTitle = form.titleUk.trim() || form.titleEn.trim() || t('addLecture.titleLabel')
  const previewAuthor = form.authorUk.trim() || form.authorEn.trim() || t('addLecture.authorLabel')
  const previewSummary = form.summaryUk.trim() || form.summaryEn.trim() || t('addLecture.summaryLabel')
  const previewCategory = form.category.trim()
  const previewCategoryColor = getLectureCategoryColor(previewCategory)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[1360px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">
            {isEdit ? t('addLecture.titleEdit') : t('addLecture.titleNew')}
          </h1>

          {formError && (
            <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{formError}</p>
          )}

          <div className="grid grid-cols-[minmax(0,900px)_minmax(300px,380px)] gap-[clamp(24px,3vw,48px)] items-start max-[1100px]:grid-cols-1">
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
                disabled={saving || translating}
                aria-busy={saving}
                className="flex items-center gap-3 px-6 py-4 bg-black text-white border-none font-sans text-[clamp(14px,1.3vw,20px)] font-normal uppercase cursor-pointer transition-opacity duration-200 hover:opacity-85 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
              >
                <span>{saving ? '...' : isEdit ? t('addLecture.submitBtnEdit') : t('addLecture.submitBtnNew')}</span>
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
          <aside className="sticky top-6 border border-black bg-white max-[1100px]:static">
            <div
              className="aspect-[16/10] bg-black/10 bg-cover bg-center border-b border-black"
              style={form.image.trim() ? { backgroundImage: `url(${form.image.trim()})` } : undefined}
              aria-label={t('addLecture.imageLabel')}
            />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="px-2 py-1 text-[11px] uppercase text-white"
                  style={{
                    backgroundColor: previewCategoryColor
                      ? CATEGORY_COLOR_VAR[previewCategoryColor]
                      : 'var(--color-black)',
                  }}
                >
                  {previewCategory ? t(`lectureCategories.${previewCategory}`, { defaultValue: previewCategory }) : t('addLecture.categoryLabel')}
                </span>
                <span className="text-[12px] uppercase text-black/50">#{form.slot || '1'}</span>
              </div>
              <h2 className="text-[clamp(20px,2vw,30px)] font-normal tracking-[-0.04em] uppercase text-black leading-none">
                {previewTitle}
              </h2>
              <p className="text-[clamp(13px,1.2vw,18px)] text-black/70">{previewAuthor}</p>
              {selectedEvent && (
                <p className="text-[12px] uppercase text-black/50">
                  {selectedEvent.titleUk || selectedEvent.titleEn || selectedEvent.cityUk}
                </p>
              )}
              <p className="text-[clamp(13px,1.2vw,16px)] leading-snug text-black">{previewSummary}</p>
            </div>
          </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
