'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslation, Trans } from 'react-i18next'
import { Skeleton } from 'boneyard-js/react'
import Navbar from '../components/Navbar'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import { CATEGORY_BG_CLASS as categoryBgClass, CATEGORY_BORDER_CLASS as categoryBorderClass } from '../constants/colors'

const introImage = '/images/about-intro.jpg'

type CategoryProps = {
  title: string
  description: string
  color: 'blue' | 'green' | 'red' | 'orange'
}

function CategoryCard({ title, description, color }: CategoryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full">
        <div className={`w-full h-[clamp(80px,7.5vw,111px)] ${categoryBgClass[color]}`} />
        <span
          className={`absolute top-3 left-3 bg-white border-2 px-6 py-2 text-[clamp(14px,1.3vw,20px)] font-normal text-black whitespace-nowrap ${categoryBorderClass[color]}`}
        >
          {title}
        </span>
      </div>
      <p className="text-[clamp(14px,1.3vw,20px)] font-normal text-black leading-[1.4]">{description}</p>
    </div>
  )
}

export default function AboutPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setLoading(false)
    }, 220)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [])

  const categories: CategoryProps[] = [
    { title: t('about.categories.technical.title'), description: t('about.categories.technical.description'), color: 'blue' },
    { title: t('about.categories.natural.title'), description: t('about.categories.natural.description'), color: 'green' },
    { title: t('about.categories.humanities.title'), description: t('about.categories.humanities.description'), color: 'red' },
    { title: t('about.categories.wildcard.title'), description: t('about.categories.wildcard.description'), color: 'orange' },
  ]

  return (
    <div className="page">
      <Navbar />

      <Skeleton name="page-about-us" loading={loading}>
        {/* Page Header */}
        <div className="px-[clamp(16px,3.2vw,48px)] py-6">
          <h1 className="text-[clamp(28px,3.2vw,48px)] font-normal text-black leading-none uppercase">
            <span className="text-red">¿</span> {t('about.pageTitle')}
          </h1>
        </div>

        {/* Who We Are Section */}
        <section className="px-[clamp(16px,3.2vw,48px)] py-[clamp(24px,4vw,60px)]">
          <div className="flex items-baseline gap-3 mb-3 max-[767px]:flex-wrap">
            <span className="text-[clamp(24px,2.4vw,36px)] font-normal text-red tracking-[-0.04em] uppercase">{'//'}</span>
            <h2 className="text-[clamp(24px,2.4vw,36px)] font-normal text-black tracking-[-0.04em] uppercase">{t('about.whoWeAre.title')}</h2>
            <span className="text-[clamp(16px,1.6vw,24px)] font-normal italic text-black ml-3 max-[767px]:ml-0 max-[767px]:w-full">{t('about.whoWeAre.note')}</span>
          </div>

          <div className="flex items-start justify-between gap-9 max-[1199px]:flex-col">
            <div className="flex flex-col gap-3 max-w-[690px] flex-1">
              <p className="text-[clamp(16px,1.6vw,24px)] font-normal text-black leading-[1.4]">
                <Trans
                  i18nKey="about.whoWeAre.description"
                  components={{ bold: <span className="font-bold italic" /> }}
                />
              </p>
              <p className="text-[clamp(16px,1.6vw,24px)] font-normal text-black uppercase tracking-[-0.04em]">{t('about.whoWeAre.missionLabel')}</p>
              <p className="text-[clamp(16px,1.6vw,24px)] font-normal text-black leading-[1.4]">{t('about.whoWeAre.mission')}</p>
            </div>
            <Image
              src={introImage}
              alt="15x4"
              width={690}
              height={387}
              unoptimized
              className="w-full max-w-[690px] h-auto object-cover flex-shrink-0 max-[1199px]:max-w-full"
              style={{ aspectRatio: '690/387' }}
            />
          </div>
        </section>

        {/* Format Section */}
        <section className="px-[clamp(16px,3.2vw,48px)] py-[clamp(24px,4vw,60px)]">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-[clamp(24px,2.4vw,36px)] font-normal text-red tracking-[-0.04em] uppercase">{'//'}</span>
            <h2 className="text-[clamp(24px,2.4vw,36px)] font-normal text-black tracking-[-0.04em] uppercase">{t('about.format.title')}</h2>
          </div>

          <p className="text-[clamp(16px,1.6vw,24px)] font-normal text-black leading-[1.4] max-w-[690px] mb-3">
            <Trans
              i18nKey="about.format.description1"
              components={{ italic: <span className="italic" /> }}
            />
          </p>
          <p className="text-[clamp(16px,1.6vw,24px)] font-normal text-black leading-[1.4] max-w-[690px] mb-3">
            <Trans
              i18nKey="about.format.description2"
              components={{ italic: <span className="italic" /> }}
            />
          </p>

          <div className="grid grid-cols-4 gap-9 mt-9 max-[1199px]:grid-cols-2 max-[1199px]:gap-6 max-[767px]:grid-cols-1">
            {categories.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </section>

        <JoinSection />
        <Footer />
      </Skeleton>
    </div>
  )
}
