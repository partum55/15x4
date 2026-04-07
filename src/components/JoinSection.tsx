import { useTranslation } from 'react-i18next'
import ArrowIcon from './ArrowIcon'
import './JoinSection.css'

export default function JoinSection() {
  const { t } = useTranslation()

  return (
    <section className="join">
      <div className="join__content">
        <h2 className="join__title">
          <span className="join__title--accent">¡</span> {t('join.title')} <span className="join__title--accent">!</span>
        </h2>

        <div className="join__row">
          <div className="join__col">
            <p className="join__text">{t('join.ideaText')}</p>
            <button className="join__btn join__btn--black">
              <span>{t('join.ideaButton')}</span>
              <ArrowIcon />
            </button>
          </div>

          <div className="join__col">
            <p className="join__text">{t('join.speakerText')}</p>
            <button className="join__btn join__btn--red">
              <span>{t('join.speakerButton')}</span>
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
