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

export default function AddEditEventPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const isEdit = Boolean(id)

  const [form, setForm] = useState<EventFormState>(EMPTY_EVENT)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState('')
  const [translating, setTranslating] = useState<keyof EventFormState | null>(null)

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
      }
    })
  }, [id])

  function setField(field: keyof EventFormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
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

  async function handleTranslate(fromField: keyof EventFormState, toField: keyof EventFormState, sourceLanguage: 'uk' | 'en', targetLanguage: 'uk' | 'en') {
    const source = form[fromField].trim()
    if (!source) return
    setTranslating(toField)
    try {
      const result = await api.translateText({ text: source, sourceLanguage, targetLanguage })
      if (result?.translatedText) {
        setForm((prev) => ({ ...prev, [toField]: result.translatedText }))
      }
    } finally {
      setTranslating(null)
    }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
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
    }

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
            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
              <FormField label={t('addEvent.titleUkLabel')} error={errors.titleUk}>
                <input type="text" value={form.titleUk} onChange={e => setField('titleUk', e.target.value)} />
              </FormField>
              <FormField label={t('addEvent.titleEnLabel')}>
                <div className="flex gap-2">
                  <input type="text" value={form.titleEn} onChange={e => setField('titleEn', e.target.value)} />
                  <button type="button" className="px-3 border border-black text-sm uppercase" onClick={() => handleTranslate('titleUk', 'titleEn', 'uk', 'en')} disabled={translating === 'titleEn'}>
                    {translating === 'titleEn' ? '…' : 'UA→EN'}
                  </button>
                  <button type="button" className="px-3 border border-black text-sm uppercase" onClick={() => handleTranslate('titleEn', 'titleUk', 'en', 'uk')} disabled={translating === 'titleUk'}>
                    {translating === 'titleUk' ? '…' : 'EN→UA'}
                  </button>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
              <FormField label={t('addEvent.cityUkLabel')} error={errors.cityUk}>
                <input type="text" value={form.cityUk} onChange={e => setField('cityUk', e.target.value)} />
              </FormField>
              <FormField label={t('addEvent.cityEnLabel')}>
                <div className="flex gap-2">
                  <input type="text" value={form.cityEn} onChange={e => setField('cityEn', e.target.value)} />
                  <button type="button" className="px-3 border border-black text-sm uppercase" onClick={() => handleTranslate('cityUk', 'cityEn', 'uk', 'en')} disabled={translating === 'cityEn'}>
                    {translating === 'cityEn' ? '…' : 'UA→EN'}
                  </button>
                  <button type="button" className="px-3 border border-black text-sm uppercase" onClick={() => handleTranslate('cityEn', 'cityUk', 'en', 'uk')} disabled={translating === 'cityUk'}>
                    {translating === 'cityUk' ? '…' : 'EN→UA'}
                  </button>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
              <FormField label={t('addEvent.locationUkLabel')} error={errors.locationUk}>
                <input type="text" value={form.locationUk} onChange={e => setField('locationUk', e.target.value)} />
              </FormField>
              <FormField label={t('addEvent.locationEnLabel')}>
                <div className="flex gap-2">
                  <input type="text" value={form.locationEn} onChange={e => setField('locationEn', e.target.value)} />
                  <button type="button" className="px-3 border border-black text-sm uppercase" onClick={() => handleTranslate('locationUk', 'locationEn', 'uk', 'en')} disabled={translating === 'locationEn'}>
                    {translating === 'locationEn' ? '…' : 'UA→EN'}
                  </button>
                  <button type="button" className="px-3 border border-black text-sm uppercase" onClick={() => handleTranslate('locationEn', 'locationUk', 'en', 'uk')} disabled={translating === 'locationUk'}>
                    {translating === 'locationUk' ? '…' : 'EN→UA'}
                  </button>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
              <FormField label={t('addEvent.descriptionUkLabel')}>
                <textarea rows={3} value={form.descriptionUk} onChange={e => setField('descriptionUk', e.target.value)} />
              </FormField>
              <FormField label={t('addEvent.descriptionEnLabel')}>
                <div className="flex gap-2">
                  <textarea rows={3} value={form.descriptionEn} onChange={e => setField('descriptionEn', e.target.value)} />
                  <button type="button" className="px-3 border border-black text-sm uppercase h-fit" onClick={() => handleTranslate('descriptionUk', 'descriptionEn', 'uk', 'en')} disabled={translating === 'descriptionEn'}>
                    {translating === 'descriptionEn' ? '…' : 'UA→EN'}
                  </button>
                  <button type="button" className="px-3 border border-black text-sm uppercase h-fit" onClick={() => handleTranslate('descriptionEn', 'descriptionUk', 'en', 'uk')} disabled={translating === 'descriptionUk'}>
                    {translating === 'descriptionUk' ? '…' : 'EN→UA'}
                  </button>
                </div>
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
