import { useTranslation, Trans } from 'react-i18next'
import Navbar from '../components/Navbar'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import './AboutPage.css'

const introImage = '/images/about-intro.jpg'

type CategoryProps = {
  title: string
  description: string
  color: 'blue' | 'green' | 'red' | 'orange'
}

function CategoryCard({ title, description, color }: CategoryProps) {
  return (
    <div className="about-category">
      <div className="about-category__header">
        <div className={`about-category__background about-category__background--${color}`} />
        <span className={`about-category__title about-category__title--${color}`}>
          {title}
        </span>
      </div>
      <p className="about-category__description">{description}</p>
    </div>
  )
}

export default function AboutPage() {
  const { t } = useTranslation()

  const categories: CategoryProps[] = [
    { title: t('about.categories.technical.title'), description: t('about.categories.technical.description'), color: 'blue' },
    { title: t('about.categories.natural.title'), description: t('about.categories.natural.description'), color: 'green' },
    { title: t('about.categories.humanities.title'), description: t('about.categories.humanities.description'), color: 'red' },
    { title: t('about.categories.wildcard.title'), description: t('about.categories.wildcard.description'), color: 'orange' },
  ]

  return (
    <div className="page about-page">
      <Navbar />

      {/* Page Header */}
      <div className="about-header">
        <h1 className="about-header__title">
          <span className="about-header__title-accent">¿</span> {t('about.pageTitle')}
        </h1>
      </div>

      {/* Who We Are Section */}
      <section className="about-who">
        <div className="about-section-header">
          <span className="about-section-header__prefix">//</span>
          <h2 className="about-section-header__title">{t('about.whoWeAre.title')}</h2>
          <span className="about-section-header__note">{t('about.whoWeAre.note')}</span>
        </div>

        <div className="about-who__content">
          <div className="about-who__text">
            <p className="about-who__description">
              <Trans
                i18nKey="about.whoWeAre.description"
                components={{ bold: <span className="about-who__description-bold" /> }}
              />
            </p>
            <p className="about-who__mission-label">{t('about.whoWeAre.missionLabel')}</p>
            <p className="about-who__mission">{t('about.whoWeAre.mission')}</p>
          </div>
          <img src={introImage} alt="15x4" className="about-who__image" />
        </div>
      </section>

      {/* Format Section */}
      <section className="about-format">
        <div className="about-section-header">
          <span className="about-section-header__prefix">//</span>
          <h2 className="about-section-header__title">{t('about.format.title')}</h2>
        </div>

        <p className="about-format__description">
          <Trans
            i18nKey="about.format.description1"
            components={{ italic: <span className="about-format__description-italic" /> }}
          />
        </p>
        <p className="about-format__description">
          <Trans
            i18nKey="about.format.description2"
            components={{ italic: <span className="about-format__description-italic" /> }}
          />
        </p>

        <div className="about-categories">
          {categories.map((category) => (
            <CategoryCard key={category.title} {...category} />
          ))}
        </div>
      </section>

      <JoinSection />
      <Footer />
    </div>
  )
}
