'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import ArrowIcon from '../components/ArrowIcon'
import { api } from '../lib/api'

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
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!id) return
    api.getLecture(id).then((data: FormState & { id?: string; error?: string }) => {
      if (!data.error) {
        setForm({
          title: data.title ?? '',
          author: data.author ?? '',
          category: data.category ?? '',
          categoryColor: (data.categoryColor as FormState['categoryColor']) ?? 'blue',
          summary: data.summary ?? '',
          image: data.image ?? '',
          duration: data.duration ?? '',
          authorBio: data.authorBio ?? '',
          videoUrl: data.videoUrl ?? '',
        })
      }
    })
  }, [id])

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

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const body = {
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      categoryColor: form.categoryColor,
      summary: form.summary.trim(),
      image: form.image.trim(),
      duration: form.duration.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      authorBio: form.authorBio.trim() || undefined,
    }

    if (isEdit && id) {
      await api.updateLecture(id, body)
    } else {
      await api.createLecture(body)
    }
    router.push('/account/lectures')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1 px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <div className="w-full max-w-[640px]">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-[clamp(24px,3vw,48px)]">
            {isEdit ? t('addLecture.titleEdit') : t('addLecture.titleNew')}
          </h1>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <FormField label={t('addLecture.titleLabel')} error={errors.title}>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)} />
            </FormField>

            <FormField label={t('addLecture.authorLabel')} error={errors.author}>
              <input type="text" value={form.author} onChange={e => set('author', e.target.value)} />
            </FormField>

            <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
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
