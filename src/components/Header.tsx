import { Link } from 'react-router-dom'
import './Header.css'

export default function Header() {
  return (
    <header
      className="header"
      style={{ backgroundImage: `url(/images/header-image.png)` }}
    >
      <nav className="header__nav">
        <Link to="/" className="header__logo">15x4</Link>
        <div className="header__links">
          <Link to="/events" className="header__link">події</Link>
          <Link to="/lectures" className="header__link">лекції</Link>
          <Link to="/#about" className="header__link">про нас</Link>
        </div>
      </nav>

      <h1 className="header__title">
        <span className="header__title-bold">15x4</span>
        <span className="header__title-light"> – SHARE YOUR KNOWLEDGE</span>
      </h1>

      <div className="header__description">
        <p className="header__tagline">[відкритий науково-популярний лекторій]</p>
        <p className="header__desc-text">
          Кожен може стати частиною — говорити, ділитися тим, що захоплює.
          Це простір молодих науковців і тих, хто просто не може жити без пізнання.
        </p>
      </div>
    </header>
  )
}
