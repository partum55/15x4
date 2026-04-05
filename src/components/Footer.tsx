import './Footer.css'

function InstagramIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Instagram"
    >
      <rect x="1" y="1" width="28" height="28" rx="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="22.5" cy="7.5" r="1.25" fill="currentColor" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg
      width="31"
      height="25"
      viewBox="0 0 31 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="YouTube"
    >
      <path
        d="M30.3 4.2C29.9 2.7 28.8 1.5 27.3 1.1 24.9 0.5 15.5 0.5 15.5 0.5s-9.4 0-11.8.6C2.2 1.5 1.1 2.7.7 4.2.1 6.6.1 12.2.1 12.2s0 5.6.6 8.1c.4 1.5 1.5 2.7 3 3.1 2.4.6 11.8.6 11.8.6s9.4 0 11.8-.6c1.5-.4 2.6-1.6 3-3.1.6-2.5.6-8.1.6-8.1s0-5.6-.6-8z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path d="M12.5 17.5l8-5.3-8-5.3v10.6z" fill="currentColor" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="footer">
      {/* Column 1: navigation links + copyright */}
      <div className="footer__col footer__col--nav">
        <nav className="footer__nav">
          <a href="#events" className="footer__link">події</a>
          <a href="#lectures" className="footer__link">лекції</a>
          <a href="#about" className="footer__link">про нас</a>
        </nav>
        <p className="footer__copyright">©15x4</p>
      </div>

      {/* Column 2: big logo + tagline */}
      <div className="footer__col footer__col--logo">
        <p className="footer__big-logo">15x4</p>
        <p className="footer__tagline">[відкритий науково-популярний лекторій]</p>
      </div>

      {/* Column 3: contact + social icons */}
      <div className="footer__col footer__col--contact">
        <div className="footer__contact">
          <p className="footer__contact-label">напишіть нам</p>
          <a href="mailto:example@gmail.com" className="footer__email">
            example@gmail.com
          </a>
        </div>
        <div className="footer__socials">
          <a href="#instagram" className="footer__social-link" aria-label="Instagram">
            <InstagramIcon />
          </a>
          <a href="#youtube" className="footer__social-link" aria-label="YouTube">
            <YouTubeIcon />
          </a>
        </div>
      </div>
    </footer>
  )
}
