import { Link } from 'react-router-dom'
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

const categories: CategoryProps[] = [
  {
    title: 'Технічна',
    description: 'Як алгоритми керують фінансами чи будинки стають розумнішими?',
    color: 'blue',
  },
  {
    title: 'Природнича',
    description: "Від хаосу клімату до нейронних зв'язків у мозку.",
    color: 'green',
  },
  {
    title: 'Гуманітарна',
    description: 'Чому мови еволюціонують чи міграція змінює суспільства — історії про нас самих.',
    color: 'red',
  },
  {
    title: 'Wild card',
    description: 'Від мікропластику в океанах до психологічних ілюзій.',
    color: 'orange',
  },
]

export default function AboutPage() {
  return (
    <div className="page about-page">
      {/* Navigation Header */}
      <nav className="about-nav">
        <Link to="/" className="about-nav__logo">15x4</Link>
        <div className="about-nav__links">
          <Link to="/events" className="about-nav__link">події</Link>
          <Link to="/lectures" className="about-nav__link">лекції</Link>
          <Link to="/about" className="about-nav__link about-nav__link--active">про нас</Link>
        </div>
      </nav>

      {/* Page Header */}
      <div className="about-header">
        <h1 className="about-header__title">
          <span className="about-header__title-accent">¿</span> ПРО НАС
        </h1>
      </div>

      {/* Who We Are Section */}
      <section className="about-who">
        <div className="about-section-header">
          <span className="about-section-header__prefix">//</span>
          <h2 className="about-section-header__title">хто ми?</h2>
          <span className="about-section-header__note">[must watch!]</span>
        </div>

        <div className="about-who__content">
          <div className="about-who__text">
            <p className="about-who__description">
              Проєкт <span className="about-who__description-bold">15х4</span> народився в Харкові і запустив хвилю децентралізованого руху молодих учених і фанатів науки. Це українська адаптація короткого формату TED Talks, яка швидко поширилася на інші міста України та країни Східної Європи.
            </p>
            <p className="about-who__mission-label">місія</p>
            <p className="about-who__mission">
              Просуваємо популяризацію науки, роблячи знання доступними для всіх через короткі, динамічні лекції.
            </p>
          </div>
          <img 
            src={introImage} 
            alt="15x4 лекція" 
            className="about-who__image"
          />
        </div>
      </section>

      {/* Format Section */}
      <section className="about-format">
        <div className="about-section-header">
          <span className="about-section-header__prefix">//</span>
          <h2 className="about-section-header__title">Формат</h2>
        </div>

        <p className="about-format__description">
          4 лекції по 15 хвилин + Q&A. <span className="about-format__description-italic">[Офлайн]</span> з реєстрацією або <span className="about-format__description-italic">[онлайн]</span>-трансляція.
        </p>
        <p className="about-format__description">
          Кожна подія — це 4 теми, які складають <span className="about-format__description-italic">баланс різних напрямків</span> науки:
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
