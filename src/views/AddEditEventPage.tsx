'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import FormField from '../components/FormField'
import ArrowIcon from '../components/ArrowIcon'
import LoadingBlock from '../components/ui/LoadingBlock'
import { api } from '../lib/api'
import { CATEGORY_COLOR_VAR } from '../constants/colors'
import { formatEventDate, formatEventTime, normalizeDateInput, normalizeTimeInput } from '../lib/date-time'
import {
  LECTURE_CATEGORIES,
  getLectureCategoryColor,
  normalizeLectureCategory,
} from '../constants/lectureCategories'
import { CITY_OPTIONS, findCityOption, getCityLabel } from '../constants/cities'
import { formatLectureSources, parseLectureSources } from '@/lib/content-api'

type EventFormState = {
  titleUk: string
  titleEn: string
  descriptionUk: string
  descriptionEn: string
  cityId: string
  date: string
  locationUk: string
  locationEn: string
  time: string
  image: string
  registrationUrl: string
  eventPhotosUrl: string
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
  authorBioUk: string,
  authorBioEn: string,
  videoUrl: string,
  presentationUrl: string,
  sourcesText: string,
}

type FormErrors = Partial<Record<keyof EventFormState, string>>
type EventLectureErrors = Partial<Record<keyof EventLectureFormState, string>>

const EMPTY_EVENT: EventFormState = {
  titleUk: '',
  titleEn: '',
  descriptionUk: '',
  descriptionEn: '',
  cityId: '',
  date: '',
  locationUk: '',
  locationEn: '',
  time: '',
  image: '',
  registrationUrl: '',
  eventPhotosUrl: '',
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
    authorBioUk: '',
    authorBioEn: '',
    videoUrl: '',
    presentationUrl: '',
    sourcesText: '',
  }
}

const EVENT_DRAFT_STORAGE_PREFIX = '15x4:add-edit-event-draft'
const EVENT_DRAFT_VERSION = 1

function getEventDraftStorageKey(id?: string) {
  return `${EVENT_DRAFT_STORAGE_PREFIX}:${id || 'new'}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeEventDraftForm(value: unknown): EventFormState | null {
  if (!isRecord(value)) return null

  return {
    titleUk: stringValue(value.titleUk),
    titleEn: stringValue(value.titleEn),
    descriptionUk: stringValue(value.descriptionUk),
    descriptionEn: stringValue(value.descriptionEn),
    cityId: stringValue(value.cityId),
    date: stringValue(value.date),
    locationUk: stringValue(value.locationUk),
    locationEn: stringValue(value.locationEn),
    time: stringValue(value.time),
    image: stringValue(value.image),
    registrationUrl: stringValue(value.registrationUrl),
    eventPhotosUrl: stringValue(value.eventPhotosUrl),
  }
}

function normalizeEventDraftLecture(value: unknown, index: number): EventLectureFormState | null {
  if (!isRecord(value)) return null

  return {
    ...emptyLecture(index + 1),
    slot: stringValue(value.slot, String(index + 1)),
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

function readEventDraft(key: string): { form: EventFormState; lectures: EventLectureFormState[] } | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== EVENT_DRAFT_VERSION) return null

    const form = normalizeEventDraftForm(parsed.form)
    if (!form) return null

    const lectures = Array.isArray(parsed.lectures)
      ? parsed.lectures
          .map((lecture, index) => normalizeEventDraftLecture(lecture, index))
          .filter((lecture): lecture is EventLectureFormState => Boolean(lecture))
      : []

    return { form, lectures }
  } catch {
    return null
  }
}

function writeEventDraft(key: string, form: EventFormState, lectures: EventLectureFormState[]) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify({
      version: EVENT_DRAFT_VERSION,
      form,
      lectures,
    }))
  } catch {
    // Ignore storage failures so the form remains usable in private mode/quota edge cases.
  }
}

function clearEventDraft(key: string) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

function FormSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,960px)_minmax(320px,390px)] gap-[clamp(24px,3vw,48px)] items-start max-[1120px]:grid-cols-1">
      <div className="flex flex-col gap-5">
        <div className="flex justify-end">
          <LoadingBlock className="h-[42px] w-[128px] rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
          <LoadingBlock className="h-[78px] w-full" />
          <LoadingBlock className="h-[78px] w-full" />
        </div>
        <LoadingBlock className="h-[78px] w-full" />
        <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
          <LoadingBlock className="h-[78px] w-full" />
          <LoadingBlock className="h-[78px] w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
          <LoadingBlock className="h-[118px] w-full" />
          <LoadingBlock className="h-[118px] w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
          <LoadingBlock className="h-[78px] w-full" />
          <LoadingBlock className="h-[78px] w-full" />
        </div>
        <div className="pt-6 border-t border-black">
          <LoadingBlock className="h-[220px] w-full" />
        </div>
        <div className="pt-6 border-t border-black">
          <LoadingBlock className="h-[56px] w-[180px]" />
        </div>
      </div>
      <aside className="border border-black bg-white">
        <LoadingBlock className="aspect-[16/10] w-full border-b border-black" />
        <div className="p-5 flex flex-col gap-4">
          <LoadingBlock className="h-5 w-full" />
          <LoadingBlock className="h-10 w-full" />
          <LoadingBlock className="h-12 w-3/4" />
          <LoadingBlock className="h-20 w-full" />
        </div>
      </aside>
    </div>
  )
}

export default function AddEditEventPage() {
  const { i18n, t } = useTranslation()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const isEdit = Boolean(id)
  const draftStorageKey = getEventDraftStorageKey(id)

  const [initialDraft] = useState(() => readEventDraft(draftStorageKey))
  const [form, setForm] = useState<EventFormState>(() => initialDraft?.form ?? EMPTY_EVENT)
  const [lectures, setLectures] = useState<EventLectureFormState[]>(() => initialDraft?.lectures ?? [])
  const [errors, setErrors] = useState<FormErrors>({})
  const [lectureErrors, setLectureErrors] = useState<Record<string, EventLectureErrors>>({})
  const [formError, setFormError] = useState('')
  const [loadingEvent, setLoadingEvent] = useState(isEdit && !initialDraft)
  const [translating, setTranslating] = useState(false)
  const [saving, setSaving] = useState(false)
  const shouldPersistDraftRef = useRef(Boolean(initialDraft))

  function markDraftDirty() {
    shouldPersistDraftRef.current = true
  }

  useEffect(() => {
    if (!shouldPersistDraftRef.current) return
    writeEventDraft(draftStorageKey, form, lectures)
  }, [draftStorageKey, form, lectures, shouldPersistDraftRef])

  useEffect(() => {
    if (!id) {
      setLoadingEvent(false)
      return
    }

    let isMounted = true
    setLoadingEvent(!shouldPersistDraftRef.current)
    api.getEvent(id)
      .then((data: EventFormState & { error?: string }) => {
      if (!isMounted) return
      if (data && !data.error) {
        if (!shouldPersistDraftRef.current) {
          setForm({
            titleUk: data.titleUk ?? '',
            titleEn: data.titleEn ?? '',
            descriptionUk: data.descriptionUk ?? '',
            descriptionEn: data.descriptionEn ?? '',
            cityId: (data as { cityId?: string }).cityId ?? '',
            date: normalizeDateInput(data.date),
            locationUk: data.locationUk ?? '',
            locationEn: data.locationEn ?? '',
            time: normalizeTimeInput(data.time),
            image: data.image ?? '',
            registrationUrl: data.registrationUrl ?? '',
            eventPhotosUrl: String((data as { eventPhotosUrl?: string | null }).eventPhotosUrl ?? ''),
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
                  authorBioUk: String(lecture.authorBioUk ?? ''),
                  authorBioEn: String(lecture.authorBioEn ?? ''),
                  videoUrl: String(lecture.videoUrl ?? ''),
                  presentationUrl: String(lecture.presentationUrl ?? ''),
                  sourcesText: formatLectureSources(
                    Array.isArray(lecture.sources)
                      ? (lecture.sources as Array<{ name?: string | null; url?: string | null }>)
                      : null,
                  ),
                }))
              : [],
          )
        }
      } else {
        setFormError(t('eventDetail.notFound'))
      }
      })
      .catch(() => {
        if (isMounted) setFormError(t('addEvent.errorSave'))
      })
      .finally(() => {
        if (isMounted) setLoadingEvent(false)
      })

    return () => {
      isMounted = false
    }
  }, [id, t])

  function setField(field: keyof EventFormState, value: string) {
    markDraftDirty()
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  function setCity(value: string) {
    markDraftDirty()
    setForm((current) => ({ ...current, cityId: value }))
    if (errors.cityId) {
      setErrors((current) => ({ ...current, cityId: undefined }))
    }
  }

  function setLectureField(index: number, field: keyof EventLectureFormState, value: string) {
    markDraftDirty()
    setLectures((prev) => prev.map((lecture, i) => (i === index ? { ...lecture, [field]: value } : lecture)))
    const tempId = lectures[index]?.tempId
    if (tempId && lectureErrors[tempId]?.[field]) {
      setLectureErrors((current) => ({
        ...current,
        [tempId]: { ...current[tempId], [field]: undefined },
      }))
    }
  }

  function addLecture() {
    if (saving || translating) return
    if (lectures.length >= 4) return
    const slot = lectures.length + 1
    markDraftDirty()
    setLectures((prev) => [...prev, emptyLecture(slot)])
  }

  function removeLecture(index: number) {
    if (saving || translating) return
    markDraftDirty()
    setLectures((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((lecture, i) => ({ ...lecture, slot: String(i + 1) })),
    )
  }

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!form.titleUk.trim()) e.titleUk = t('auth.login.errorRequired')
    if (!form.cityId.trim()) e.cityId = t('auth.login.errorRequired')
    if (!form.date.trim()) e.date = t('auth.login.errorRequired')
    if (!form.locationUk.trim()) e.locationUk = t('auth.login.errorRequired')
    if (!form.time.trim()) e.time = t('auth.login.errorRequired')
    if (!form.image.trim()) e.image = t('auth.login.errorRequired')
    return e
  }

  function validateLectures() {
    const next: Record<string, EventLectureErrors> = {}

    for (const lecture of lectures) {
      const errorsForLecture: EventLectureErrors = {}
      if (!lecture.titleUk.trim()) errorsForLecture.titleUk = t('auth.login.errorRequired')
      if (!lecture.authorUk.trim()) errorsForLecture.authorUk = t('auth.login.errorRequired')
      if (!lecture.category.trim()) errorsForLecture.category = t('auth.login.errorRequired')
      if (!lecture.summaryUk.trim()) errorsForLecture.summaryUk = t('auth.login.errorRequired')
      if (!lecture.image.trim()) errorsForLecture.image = t('auth.login.errorRequired')
      if (Object.keys(errorsForLecture).length > 0) {
        next[lecture.tempId] = errorsForLecture
      }
    }

    return next
  }

  async function translatePair(
    sourceValue: string,
    sourceLanguage: 'uk' | 'en',
    targetLanguage: 'uk' | 'en',
    existingTarget = '',
  ) {
    const src = String(sourceValue ?? '').trim()
    const tgt = String(existingTarget ?? '').trim()
    if (tgt) {
      return existingTarget
    }
    if (!src) {
      return ''
    }
    const result = await api.translateText({ text: src, sourceLanguage, targetLanguage })
    if (result?.error) {
      throw new Error(String(result.error))
    }
    const translated = result?.translatedText ? String(result.translatedText) : ''
    return translated
  }

  async function handleTranslateAll() {
    if (translating || saving) return
    setTranslating(true)
    try {
      // Event-level translations (only fill missing counterparts)
      const tasks: Array<Promise<[keyof EventFormState, string]>> = []

      if (!form.titleUk.trim() && form.titleEn.trim()) tasks.push(translatePair(form.titleEn, 'en', 'uk').then(v => ['titleUk', v] as [keyof EventFormState, string]))
      if (!form.titleEn.trim() && form.titleUk.trim()) tasks.push(translatePair(form.titleUk, 'uk', 'en').then(v => ['titleEn', v] as [keyof EventFormState, string]))

      if (!form.locationUk.trim() && form.locationEn.trim()) tasks.push(translatePair(form.locationEn, 'en', 'uk').then(v => ['locationUk', v] as [keyof EventFormState, string]))
      if (!form.locationEn.trim() && form.locationUk.trim()) tasks.push(translatePair(form.locationUk, 'uk', 'en').then(v => ['locationEn', v] as [keyof EventFormState, string]))

      if (!form.descriptionUk.trim() && form.descriptionEn.trim()) tasks.push(translatePair(form.descriptionEn, 'en', 'uk').then(v => ['descriptionUk', v] as [keyof EventFormState, string]))
      if (!form.descriptionEn.trim() && form.descriptionUk.trim()) tasks.push(translatePair(form.descriptionUk, 'uk', 'en').then(v => ['descriptionEn', v] as [keyof EventFormState, string]))

      const results = await Promise.all(tasks)
      if (results.length) {
        const nextForm = { ...form }
        for (const [key, value] of results) {
          if (value && value.trim()) nextForm[key] = value
        }
        markDraftDirty()
        setForm(nextForm)
      }

      // Lectures: translate each missing counterpart per lecture
      const lectureTasks: Array<Promise<{ index: number; key: keyof EventLectureFormState; value: string }>> = []
      lectures.forEach((lecture, i) => {
        if (!lecture.titleUk.trim() && lecture.titleEn.trim()) lectureTasks.push(translatePair(lecture.titleEn, 'en', 'uk').then(v => ({ index: i, key: 'titleUk' as const, value: v })))
        if (!lecture.titleEn.trim() && lecture.titleUk.trim()) lectureTasks.push(translatePair(lecture.titleUk, 'uk', 'en').then(v => ({ index: i, key: 'titleEn' as const, value: v })))

        if (!lecture.authorUk.trim() && lecture.authorEn.trim()) lectureTasks.push(translatePair(lecture.authorEn, 'en', 'uk').then(v => ({ index: i, key: 'authorUk' as const, value: v })))
        if (!lecture.authorEn.trim() && lecture.authorUk.trim()) lectureTasks.push(translatePair(lecture.authorUk, 'uk', 'en').then(v => ({ index: i, key: 'authorEn' as const, value: v })))

        if (!lecture.summaryUk.trim() && lecture.summaryEn.trim()) lectureTasks.push(translatePair(lecture.summaryEn, 'en', 'uk').then(v => ({ index: i, key: 'summaryUk' as const, value: v })))
        if (!lecture.summaryEn.trim() && lecture.summaryUk.trim()) lectureTasks.push(translatePair(lecture.summaryUk, 'uk', 'en').then(v => ({ index: i, key: 'summaryEn' as const, value: v })))

        if (!lecture.authorBioUk.trim() && lecture.authorBioEn.trim()) lectureTasks.push(translatePair(lecture.authorBioEn, 'en', 'uk').then(v => ({ index: i, key: 'authorBioUk' as const, value: v })))
        if (!lecture.authorBioEn.trim() && lecture.authorBioUk.trim()) lectureTasks.push(translatePair(lecture.authorBioUk, 'uk', 'en').then(v => ({ index: i, key: 'authorBioEn' as const, value: v })))
      })

      const lresults = await Promise.all(lectureTasks)
      if (lresults.length) {
        const nextLectures = lectures.map((l) => ({ ...l }))
        for (const r of lresults) {
          if (r.value && r.value.trim()) {
            nextLectures[r.index] = { ...nextLectures[r.index], [r.key]: r.value }
          }
        }
        markDraftDirty()
        setLectures(nextLectures)
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
    const nextLectureErrors = validateLectures()
    setErrors(e)
    setLectureErrors(nextLectureErrors)
    if (Object.keys(e).length || Object.keys(nextLectureErrors).length) return

    const body = {
      titleUk: form.titleUk.trim(),
      titleEn: form.titleEn.trim(),
      descriptionUk: form.descriptionUk.trim(),
      descriptionEn: form.descriptionEn.trim(),
      cityId: form.cityId,
      date: normalizeDateInput(form.date),
      locationUk: form.locationUk.trim(),
      locationEn: form.locationEn.trim(),
      time: normalizeTimeInput(form.time),
      image: form.image.trim(),
      registrationUrl: form.registrationUrl.trim() || null,
      eventPhotosUrl: form.eventPhotosUrl.trim() || null,
      lectures: lectures.map((lecture, index) => ({
        slot: Number(lecture.slot || index + 1),
        titleUk: lecture.titleUk.trim(),
        titleEn: lecture.titleEn.trim(),
        authorUk: lecture.authorUk.trim(),
        authorEn: lecture.authorEn.trim(),
        category: lecture.category.trim(),
        summaryUk: lecture.summaryUk.trim(),
        summaryEn: lecture.summaryEn.trim(),
        image: lecture.image.trim(),
        authorBioUk: lecture.authorBioUk.trim(),
        authorBioEn: lecture.authorBioEn.trim(),
        videoUrl: lecture.videoUrl.trim() || '',
        presentationUrl: lecture.presentationUrl.trim() || '',
        sources: parseLectureSources(lecture.sourcesText),
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
      !getLectureCategoryColor(lecture.category),
    )
    if (invalidLecture) {
      setLectureErrors(validateLectures())
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

      clearEventDraft(draftStorageKey)
      router.push('/account/events')
    } catch {
      setFormError(t('addEvent.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  const previewTitle = form.titleUk.trim() || form.titleEn.trim() || t('addEvent.titleUkLabel')
  const previewCityOption = findCityOption(form.cityId)
  const previewCity = (previewCityOption ? getCityLabel(previewCityOption, i18n.language) : '') || t('addEvent.cityLabel')
  const previewLocation = form.locationUk.trim() || form.locationEn.trim() || t('addEvent.locationLabel')
  const previewDescription = form.descriptionUk.trim() || form.descriptionEn.trim() || t('addEvent.descriptionUkLabel')
  const previewDate = form.date ? formatEventDate(form.date, true) : t('addEvent.dateLabel')
  const previewTime = form.time ? formatEventTime(form.time) : t('addEvent.timeLabel')

  return (
    <AppLayout hideJoin hideFooter withPageShell={false}>
      <main className="content-shell flex-1 py-[clamp(32px,4.2vw,64px)] min-h-[calc(100vh-92px)]">
        <div className="w-full">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">
            {isEdit ? t('addEvent.titleEdit') : t('addEvent.titleNew')}
          </h1>

          {formError && (
            <p className="text-[clamp(13px,1.2vw,18px)] text-red mb-4 px-4 py-3 border border-red">{formError}</p>
          )}

          {isEdit && loadingEvent ? (
            <FormSkeleton />
          ) : (
          <div className="grid grid-cols-[minmax(0,960px)_minmax(320px,390px)] gap-[clamp(24px,3vw,48px)] items-start max-[1120px]:grid-cols-1">
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

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addEvent.titleUkLabel')} error={errors.titleUk} required>
                <input type="text" value={form.titleUk} onChange={e => setField('titleUk', e.target.value)} required />
              </FormField>
              <FormField label={t('addEvent.titleEnLabel')}>
                <input type="text" value={form.titleEn} onChange={e => setField('titleEn', e.target.value)} />
              </FormField>
            </div>

            <FormField label={t('addEvent.cityLabel')} error={errors.cityId} required>
              <select
                value={form.cityId}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                required
              >
                <option value="">{t('addEvent.cityPlaceholder')}</option>
                {CITY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {getCityLabel(option, i18n.language)}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4 max-[991px]:grid-cols-1">
              <FormField label={t('addEvent.locationUkLabel')} error={errors.locationUk} required>
                <input type="text" value={form.locationUk} onChange={e => setField('locationUk', e.target.value)} required />
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

            <FormField label={t('addEvent.dateLabel')} error={errors.date} required>
              <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} required />
            </FormField>

            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
              <FormField label={t('addEvent.timeLabel')} error={errors.time} required>
                <input type="time" value={form.time} onChange={e => setField('time', e.target.value)} required />
              </FormField>
              <FormField label={t('addEvent.imageLabel')} error={errors.image} required>
                <input type="url" value={form.image} onChange={e => setField('image', e.target.value)} placeholder="https://" required />
              </FormField>
            </div>

            <FormField label={t('addEvent.registrationUrlLabel')}>
              <input type="text" value={form.registrationUrl} onChange={e => setField('registrationUrl', e.target.value)} placeholder="https://forms.google.com/..." />
            </FormField>

            <FormField label={t('addEvent.eventPhotosUrlLabel')}>
              <input type="url" value={form.eventPhotosUrl} onChange={e => setField('eventPhotosUrl', e.target.value)} placeholder="https://" />
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
                    <FormField label={t('addEvent.lectureTitleUkLabel')} error={lectureErrors[lecture.tempId]?.titleUk} required>
                      <input type="text" value={lecture.titleUk} onChange={(e) => setLectureField(index, 'titleUk', e.target.value)} required />
                    </FormField>
                    <FormField label={t('addEvent.lectureTitleEnLabel')}>
                      <input type="text" value={lecture.titleEn} onChange={(e) => setLectureField(index, 'titleEn', e.target.value)} />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
                    <FormField label={t('addEvent.lectureAuthorUkLabel')} error={lectureErrors[lecture.tempId]?.authorUk} required>
                      <input type="text" value={lecture.authorUk} onChange={(e) => setLectureField(index, 'authorUk', e.target.value)} required />
                    </FormField>
                    <FormField label={t('addEvent.lectureAuthorEnLabel')}>
                      <input type="text" value={lecture.authorEn} onChange={(e) => setLectureField(index, 'authorEn', e.target.value)} />
                    </FormField>
                  </div>

                  <FormField label={t('addEvent.lectureCategoryLabel')} error={lectureErrors[lecture.tempId]?.category} required>
                    <select value={lecture.category} onChange={(e) => setLectureField(index, 'category', e.target.value)} required>
                      <option value="">{t('addEvent.lectureCategoryPlaceholder')}</option>
                      {LECTURE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {t(`lectureCategories.${category}`)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
                    <FormField label={t('addEvent.lectureSummaryUkLabel')} error={lectureErrors[lecture.tempId]?.summaryUk} required>
                      <textarea rows={3} value={lecture.summaryUk} onChange={(e) => setLectureField(index, 'summaryUk', e.target.value)} required />
                    </FormField>
                    <FormField label={t('addEvent.lectureSummaryEnLabel')}>
                      <textarea rows={3} value={lecture.summaryEn} onChange={(e) => setLectureField(index, 'summaryEn', e.target.value)} />
                    </FormField>
                  </div>

                  <FormField label={t('addEvent.lectureImageLabel')} error={lectureErrors[lecture.tempId]?.image} required>
                    <input type="url" value={lecture.image} onChange={(e) => setLectureField(index, 'image', e.target.value)} placeholder="https://" required />
                  </FormField>
                  <FormField label={t('addLecture.videoUrlLabel')}>
                    <input type="text" value={lecture.videoUrl} onChange={(e) => setLectureField(index, 'videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </FormField>
                  <FormField label={t('addLecture.presentationUrlLabel')}>
                    <input type="url" value={lecture.presentationUrl} onChange={(e) => setLectureField(index, 'presentationUrl', e.target.value)} placeholder="https://" />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
                    <FormField label={t('addLecture.authorBioUkLabel')}>
                      <textarea rows={3} value={lecture.authorBioUk} onChange={(e) => setLectureField(index, 'authorBioUk', e.target.value)} />
                    </FormField>
                    <FormField label={t('addLecture.authorBioEnLabel')}>
                      <textarea rows={3} value={lecture.authorBioEn} onChange={(e) => setLectureField(index, 'authorBioEn', e.target.value)} />
                    </FormField>
                  </div>

                  <FormField label={t('addLecture.sourcesLabel')}>
                    <textarea
                      rows={4}
                      value={lecture.sourcesText}
                      onChange={(e) => setLectureField(index, 'sourcesText', e.target.value)}
                      placeholder={t('addLecture.sourcesPlaceholder')}
                    />
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
          <aside className="sticky top-6 border border-black bg-white max-[1120px]:static">
            <div
              className="aspect-[16/10] bg-black/10 bg-cover bg-center border-b border-black"
              style={form.image.trim() ? { backgroundImage: `url(${form.image.trim()})` } : undefined}
              aria-label={t('addEvent.imageLabel')}
            />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] uppercase text-black/50">{previewCity}</span>
                <span className="text-[12px] uppercase text-black/50">{previewTime}</span>
              </div>
              <h2 className="text-[clamp(22px,2.2vw,34px)] font-normal tracking-[-0.04em] uppercase text-black leading-none">
                {previewTitle}
              </h2>
              <div className="flex flex-col gap-1 text-[clamp(13px,1.2vw,17px)] text-black/70">
                <span>{previewDate}</span>
                <span>{previewLocation}</span>
              </div>
              <p className="text-[clamp(13px,1.2vw,16px)] leading-snug text-black">{previewDescription}</p>
              {lectures.length > 0 && (
                <div className="flex flex-col gap-2 pt-3 border-t border-black/20">
                  {lectures.slice(0, 4).map((lecture, index) => {
                    const categoryColor = getLectureCategoryColor(lecture.category)
                    return (
                      <div key={lecture.tempId} className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 shrink-0"
                          style={{
                            backgroundColor: categoryColor
                              ? CATEGORY_COLOR_VAR[categoryColor]
                              : 'var(--color-black)',
                          }}
                        />
                        <span className="text-[13px] uppercase text-black truncate">
                          {lecture.titleUk.trim() || lecture.titleEn.trim() || `${t('addEvent.lectureTitleLabel')} ${index + 1}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </aside>
          </div>
          )}
        </div>
      </main>
    </AppLayout>
  )
}
