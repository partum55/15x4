import ArrowIcon from './ArrowIcon'
import './JoinSection.css'

export default function JoinSection() {
  return (
    <section className="join">
      <div className="join__content">
        <h2 className="join__title">
          <span className="join__title--accent">¡</span> Долучайся до подій <span className="join__title--accent">!</span>
        </h2>

        <div className="join__row">
          {/* Left: suggest a topic */}
          <div className="join__col">
            <p className="join__text">
              Тицяй сюди, якщо маєш тему, про яку хотілось би дізнатись більше
            </p>
            <button className="join__btn join__btn--black">
              <span>маю ідею для лекції</span>
              <ArrowIcon />
            </button>
          </div>

          {/* Right: become a speaker */}
          <div className="join__col">
            <p className="join__text">
              А сюди, якщо маєш бажання долучитись до заходу і провести лекцію
            </p>
            <button className="join__btn join__btn--red">
              <span>хочу бути спікером</span>
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
