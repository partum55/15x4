'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import ArrowIcon from '../components/ArrowIcon'
import { api, type Lecture } from '../lib/api'
import { CATEGORY_COLOR_VAR } from '../constants/colors'
import { LECTURE_CATEGORIES, getLectureCategoryColor, normalizeLectureCategory } from '../constants/lectureCategories'
import type { Event } from '@/lib/api'
import { formatLectureSources, parseLectureSources } from '@/lib/content-api'

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
  presentationUrl: string
  sourcesText: string
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
  presentationUrl: '',
  sourcesText: '',
}

const LECTURE_SLOTS = ['1', '2', '3', '4']
const LECTURE_DRAFT_STORAGE_PREFIX = '15x4:add-edit-lecture-draft'
const LECTURE_DRAFT_VERSION = 1

function getLectureDraftStorageKey(id?: string) {
  return `${LECTURE_DRAFT_STORAGE_PREFIX}:${id || 'new'}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeLectureDraft(value: unknown): FormState | null {
  if (!isRecord(value)) return null

  return {
    eventId: stringValue(value.eventId),
    slot: stringValue(value.slot, EMPTY.slot),
    titleUk: stringValue(value.titleUk),
    titleEn: stringValue(value.titleEn),
    authorUk: stringValue(value.authorUk),
    authorEn: stringValue(value.authorEn),
    category: stringValue(value.category),
    summaryUk: stringValue(value.summaryUk),
    summaryEn: stringValue(value.summaryEn),
    image: stringValue(value.image),
    authorBioUk: stringValue(value.authorBioUk),
    authorBioEn: stringValue(value.authorBioEn),
    videoUrl: stringValue(value.videoUrl),
    presentationUrl: stringValue(value.presentationUrl),
    sourcesText: stringValue(value.sourcesText),
  }
}

function readLectureDraft(key: string): FormState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== LECTURE_DRAFT_VERSION) return null

    return normalizeLectureDraft(parsed.form)
  } catch {
    return null
  }
}

function writeLectureDraft(key: string, form: FormState) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify({
      version: LECTURE_DRAFT_VERSION,
      form,
    }))
  } catch {
    // Ignore storage failures so the form remains usable in private mode/quota edge cases.
  }
}

function clearLectureDraft(key: string) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

function LoadingBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-black/10 ${className}`} />
}

function FormSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,900px)_minmax(300px,380px)] gap-[clamp(24px,3vw,48px)] items-start max-[1100px]:grid-cols-1">
      <div className="flex flex-col gap-5">
        <div className="flex justify-end">
          <LoadingBlock className="h-[42px] w-[128px] rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
          <LoadingBlock className="h-[78px] w-full" />
          <LoadingBlock className="h-[78px] w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
          <LoadingBlock className="h-[78px] w-full" />
          <LoadingBlock className="h-[78px] w-full" />
        </div>
        <LoadingBlock className="h-[78px] w-full" />
        <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
          <LoadingBlock className="h-[132px] w-full" />
          <LoadingBlock className="h-[132px] w-full" />
        </div>
        <LoadingBlock className="h-[78px] w-full" />
        <LoadingBlock className="h-[78px] w-full" />
        <div className="pt-6 border-t border-black">
          <LoadingBlock className="h-[56px] w-[180px]" />
        </div>
      </div>
      <aside className="border border-black bg-white">
        <LoadingBlock className="aspect-[16/10] w-full border-b border-black" />
        <div className="p-5 flex flex-col gap-4">
          <LoadingBlock className="h-5 w-24" />
          <LoadingBlock className="h-9 w-full" />
          <LoadingBlock className="h-5 w-1/2" />
          <LoadingBlock className="h-20 w-full" />
        </div>
      </aside>
    </div>
  )
}

export default function AddEditLecturePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const isEdit = Boolean(id)
  const draftStorageKey = getLectureDraftStorageKey(id)

  const [initialDraft] = useState(() => readLectureDraft(draftStorageKey))
  const [form, setForm] = useState<FormState>(() => initialDraft ?? EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [loadingLecture, setLoadingLecture] = useState(isEdit && !initialDraft)
  const [translating, setTranslating] = useState(false)
  const [saving, setSaving] = useState(false)
  const shouldPersistDraftRef = useRef(Boolean(initialDraft))

  function markDraftDirty() {
    shouldPersistDraftRef.current = true
  }

  useEffect(() => {
    if (!shouldPersistDraftRef.current) return
    writeLectureDraft(draftStorageKey, form)
  }, [draftStorageKey, form, shouldPersistDraftRef])

  useEffect(() => {
    let isMounted = true
    setEventsLoading(true)
    Promise.all([api.getEvents(), api.getMyEvents()])
      .then(([publicEvents, ownEvents]) => {
        if (!isMounted) return
        const byId = new Map<string, Event>()
        for (const event of [...ownEvents, ...publicEvents]) {
          byId.set(event.id, event)
        }
        setEvents([...byId.values()])
      })
      .catch(() => {
        if (isMounted) setEvents([])
      })
      .finally(() => {
        if (isMounted) setEventsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!id) {
      setLoadingLecture(false)
      return
    }

    let isMounted = true
    setLoadingLecture(!shouldPersistDraftRef.current)
    api.getLecture(id)
      .then((data: Lecture & { error?: string }) => {
      if (!isMounted) return
      if (data && !data.error) {
        const normalizedCategory = normalizeLectureCategory(data.category ?? '')?.category ?? ''
        if (!shouldPersistDraftRef.current) {
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
            presentationUrl: data.presentationUrl ?? '',
            sourcesText: formatLectureSources(data.sources),
          })
        }

        if (data.eventId) {
          api.getEvent(data.eventId).then((event: Event & { error?: string }) => {
            if (isMounted && !event?.error) {
              setEvents((prev) => prev.some((item) => item.id === event.id) ? prev : [event, ...prev])
            }
          })
        }
      } else {
        setFormError(t('lectureDetail.notFound'))
      }
      })
      .catch(() => {
        if (isMounted) setFormError(t('addLecture.errorSave'))
      })
      .finally(() => {
        if (isMounted) setLoadingLecture(false)
      })

    return () => {
      isMounted = false
    }
  }, [id, t])

  function set(field: keyof FormState, value: string) {
    markDraftDirty()
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  const selectedEvent = events.find((event) => event.id === form.eventId)
  const occupiedSlots = useMemo(
    () => new Set(
      (selectedEvent?.lectures ?? [])
        .filter((lecture) => !isEdit || lecture.id !== id)
        .map((lecture) => String(lecture.slot)),
    ),
    [id, isEdit, selectedEvent],
  )

  useEffect(() => {
    if (!form.eventId || !selectedEvent) return
    if (form.slot && !occupiedSlots.has(form.slot)) return

    const nextSlot = LECTURE_SLOTS.find((slot) => !occupiedSlots.has(slot)) ?? ''
    setForm((current) => {
      if (current.slot === nextSlot) return current
      if (shouldPersistDraftRef.current) markDraftDirty()
      return { ...current, slot: nextSlot }
    })
  }, [form.eventId, form.slot, selectedEvent, occupiedSlots])

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
    if (result?.error) throw new Error(String(result.error))
    return result?.translatedText ? String(result.translatedText) : ''
  }

  async function handleTranslateAll() {
    if (translating || saving) return
    setTranslating(true)
    try {
      const tasks: Array<Promise<[keyof FormState, string]>> = []

      if (!form.titleUk.trim() && form.titleEn.trim()) tasks.push(translatePair(form.titleEn, 'en', 'uk').then(v => ['titleUk', v] as [keyof FormState, string]))
      if (!form.titleEn.trim() && form.titleUk.trim()) tasks.push(translatePair(form.titleUk, 'uk', 'en').then(v => ['titleEn', v] as [keyof FormState, string]))

      if (!form.authorUk.trim() && form.authorEn.trim()) tasks.push(translatePair(form.authorEn, 'en', 'uk').then(v => ['authorUk', v] as [keyof FormState, string]))
      if (!form.authorEn.trim() && form.authorUk.trim()) tasks.push(translatePair(form.authorUk, 'uk', 'en').then(v => ['authorEn', v] as [keyof FormState, string]))

      if (!form.summaryUk.trim() && form.summaryEn.trim()) tasks.push(translatePair(form.summaryEn, 'en', 'uk').then(v => ['summaryUk', v] as [keyof FormState, string]))
      if (!form.summaryEn.trim() && form.summaryUk.trim()) tasks.push(translatePair(form.summaryUk, 'uk', 'en').then(v => ['summaryEn', v] as [keyof FormState, string]))

      if (!form.authorBioUk.trim() && form.authorBioEn.trim()) tasks.push(translatePair(form.authorBioEn, 'en', 'uk').then(v => ['authorBioUk', v] as [keyof FormState, string]))
      if (!form.authorBioEn.trim() && form.authorBioUk.trim()) tasks.push(translatePair(form.authorBioUk, 'uk', 'en').then(v => ['authorBioEn', v] as [keyof FormState, string]))

      const results = await Promise.all(tasks)
      if (results.length) {
        const next = { ...form }
        for (const [key, value] of results) {
          if (value && value.trim()) next[key] = value
        }
        markDraftDirty()
        setForm(next)
      }
    } catch {
      setFormError(t('common.translationError'))
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
      presentationUrl: form.presentationUrl.trim() || undefined,
      authorBioUk: form.authorBioUk.trim() || undefined,
      authorBioEn: form.authorBioEn.trim() || undefined,
      sources: parseLectureSources(form.sourcesText),
    }

    setSaving(true)
    try {
      const result = isEdit && id ? await api.updateLecture(id, body) : await api.createLecture(body)
      if (result?.error) {
        setFormError(result.error)
        return
      }

      clearLectureDraft(draftStorageKey)
      router.push('/account/lectures')
    } catch {
      setFormError(t('addLecture.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  const previewTitle = form.titleUk.trim() || form.titleEn.trim() || t('addLecture.titleLabel')
  const previewAuthor = form.authorUk.trim() || form.authorEn.trim() || t('addLecture.authorLabel')
  const previewSummary = form.summaryUk.trim() || form.summaryEn.trim() || t('addLecture.summaryLabel')
  const previewCategory = form.category.trim()
  const previewCategoryColor = getLectureCategoryColor(previewCategory)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="content-shell flex-1 py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">
            {isEdit ? t('addLecture.titleEdit') : t('addLecture.titleNew')}
          </h1>

          {formError && (
            <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{formError}</p>
          )}

          {isEdit && loadingLecture ? (
            <FormSkeleton />
          ) : (
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
                {translating ? '...' : t('common.translate')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
              <FormField label={t('addLecture.eventLabel')} error={errors.eventId} required>
                <select value={form.eventId} onChange={(e) => set('eventId', e.target.value)} disabled={eventsLoading} required>
                  <option value="">{eventsLoading ? t('addLecture.loading') : t('addLecture.eventPlaceholder')}</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.titleUk || event.cityUk}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={t('addLecture.slotLabel')} error={errors.slot} required>
                <div className="ui-radio-group grid-cols-4" role="radiogroup" aria-label={t('addLecture.slotLabel')}>
                  {LECTURE_SLOTS.map((slot) => {
                    const occupied = occupiedSlots.has(slot)
                    const selected = form.slot === slot

                    return (
                      <button
                        key={slot}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-disabled={occupied}
                        disabled={occupied || saving || translating}
                        onClick={() => set('slot', slot)}
                        className="ui-radio-button"
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addLecture.titleUkLabel')} error={errors.titleUk} required>
                <input type="text" value={form.titleUk} onChange={(e) => set('titleUk', e.target.value)} required />
              </FormField>
              <FormField label={t('addLecture.titleEnLabel')}>
                <input type="text" value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addLecture.authorUkLabel')} error={errors.authorUk} required>
                <input type="text" value={form.authorUk} onChange={(e) => set('authorUk', e.target.value)} required />
              </FormField>
              <FormField label={t('addLecture.authorEnLabel')}>
                <input type="text" value={form.authorEn} onChange={(e) => set('authorEn', e.target.value)} />
              </FormField>
            </div>

            <FormField label={t('addLecture.categoryLabel')} error={errors.category} required>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} required>
                <option value="">{t('addLecture.categoryPlaceholder')}</option>
                {LECTURE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(`lectureCategories.${category}`, { defaultValue: category })}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addLecture.summaryUkLabel')} error={errors.summaryUk} required>
                <textarea rows={4} value={form.summaryUk} onChange={(e) => set('summaryUk', e.target.value)} required />
              </FormField>
              <FormField label={t('addLecture.summaryEnLabel')}>
                <textarea rows={4} value={form.summaryEn} onChange={(e) => set('summaryEn', e.target.value)} />
              </FormField>
            </div>

            <FormField label={t('addLecture.imageLabel')} error={errors.image} required>
              <input type="url" value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="https://" required />
            </FormField>

            <FormField label={t('addLecture.videoUrlLabel')}>
              <input type="text" value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </FormField>

            <FormField label={t('addLecture.presentationUrlLabel')}>
              <input type="url" value={form.presentationUrl} onChange={(e) => set('presentationUrl', e.target.value)} placeholder="https://" />
            </FormField>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addLecture.authorBioUkLabel')}>
                <textarea rows={3} value={form.authorBioUk} onChange={(e) => set('authorBioUk', e.target.value)} />
              </FormField>
              <FormField label={t('addLecture.authorBioEnLabel')}>
                <textarea rows={3} value={form.authorBioEn} onChange={(e) => set('authorBioEn', e.target.value)} />
              </FormField>
            </div>

            <FormField label={t('addLecture.sourcesLabel')}>
              <textarea
                rows={4}
                value={form.sourcesText}
                onChange={(e) => set('sourcesText', e.target.value)}
                placeholder={t('addLecture.sourcesPlaceholder')}
              />
            </FormField>

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
          )}
        </div>
      </main>
    </div>
  )
}
