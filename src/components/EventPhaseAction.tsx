import ArrowIcon from '@/components/ArrowIcon'
import { getEventPhase } from '@/lib/date-time'

export type EventPhaseLabels = {
  register: string
  ongoing: string
  photos: string
}

type EventPhaseActionProps = {
  date: string
  time: string
  registrationUrl?: string | null
  eventPhotosUrl?: string | null
  labels: EventPhaseLabels
  /** Refresh anchor for `now`; pass when rendering inside a list that already tracks Date.now(). */
  now?: number
  variant?: 'solid' | 'underlined'
  className?: string
  fullWidth?: boolean
}

const SOLID = 'bg-black text-white transition-opacity duration-200 hover:opacity-85'
const UNDERLINED = 'bg-black text-white transition-opacity duration-200 hover:opacity-85'
const DISABLED = 'cursor-not-allowed border border-black text-black/50'

function buildBaseClass(fullWidth: boolean) {
  const width = fullWidth ? 'w-full' : 'w-[clamp(220px,22.7vw,327px)] max-[767px]:w-full'
  return `flex h-[69px] ${width} items-center justify-center gap-[10px] px-6 py-5 font-sans text-[clamp(14px,1.6vw,24px)] no-underline`
}

export default function EventPhaseAction({
  date,
  time,
  registrationUrl,
  eventPhotosUrl,
  labels,
  now,
  variant = 'solid',
  className = '',
  fullWidth = false,
}: EventPhaseActionProps) {
  const phase = getEventPhase(date, time, now)
  const registerHref = registrationUrl?.trim()
  const photosHref = eventPhotosUrl?.trim()
  const baseClass = buildBaseClass(fullWidth)
  const accent = variant === 'solid' ? SOLID : UNDERLINED

  if (phase === 'upcoming' && registerHref?.startsWith('http')) {
    return (
      <a href={registerHref} target="_blank" rel="noopener noreferrer" className={`${baseClass} ${accent} ${className}`}>
        <span>{labels.register}</span>
        <ArrowIcon />
      </a>
    )
  }

  if (phase === 'live') {
    return (
      <span className={`${baseClass} ${DISABLED} ${className}`} aria-disabled="true">
        <span>{labels.ongoing}</span>
      </span>
    )
  }

  if (phase === 'past' && photosHref?.startsWith('http')) {
    return (
      <a href={photosHref} target="_blank" rel="noopener noreferrer" className={`${baseClass} ${accent} ${className}`}>
        <span>{labels.photos}</span>
        <ArrowIcon />
      </a>
    )
  }

  return null
}
