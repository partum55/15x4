import Link from "next/link";
import type { Event } from "@/lib/api";
import ArrowIcon from "@/components/ArrowIcon";
import LectureCard from "@/components/LectureCard";
import { formatEventDate, formatEventTime, getEventPhase } from "@/lib/date-time";

function LoadingBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-black/10 ${className}`} />;
}

type EventSectionProps =
  | {
      loading: true;
    }
  | {
      loading?: false;
      event: Event;
      detailsLabel: string;
      registerLabel: string;
      ongoingLabel?: string;
      photosLabel?: string;
      textLoading?: boolean;
    };

export default function EventSection(props: EventSectionProps) {
  const actionClassName = "flex h-[69px] w-[clamp(220px,22.7vw,327px)] items-center justify-center gap-[10px] px-6 py-5 font-sans text-[clamp(14px,1.6vw,24px)] no-underline max-[767px]:w-full";

  if (props.loading) {
    return (
      <section className="border-t border-black">
        <div className="flex items-start justify-between gap-6 py-6 max-[767px]:flex-col max-[767px]:gap-5">
          <div className="flex w-[clamp(220px,22.7vw,327px)] flex-col gap-6 max-[767px]:w-full">
            <div className="flex items-center justify-between gap-6">
              <LoadingBlock className="h-7 w-44" />
              <LoadingBlock className="h-6 w-16" />
            </div>
            <LoadingBlock className="h-16 w-full" />
          </div>

          <div className="flex items-center gap-9 max-[1199px]:gap-6 max-[767px]:w-full max-[767px]:flex-col max-[767px]:gap-4">
            <LoadingBlock className={`${actionClassName} bg-black/10`} />
            <LoadingBlock className={`${actionClassName} bg-black/10`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-9 gap-y-6 pb-9 max-[1199px]:gap-x-6 max-[767px]:grid-cols-1">
          <LectureCard loading variant="compact" />
          <LectureCard loading variant="compact" />
          <LectureCard loading variant="compact" />
          <LectureCard loading variant="compact" />
        </div>
      </section>
    );
  }

  const { event, detailsLabel, registerLabel, ongoingLabel = "триває...", photosLabel = "фото", textLoading = false } = props;
  const lectures = event.lectures ?? [];
  const registerHref = event.registrationUrl?.trim();
  const photosHref = event.eventPhotosUrl?.trim();
  const eventPhase = getEventPhase(event.date, event.time);
  const registrationAvailable = Boolean(registerHref) && eventPhase === 'upcoming';
  const photosAvailable = Boolean(photosHref) && eventPhase === 'past';
  const registerClassName = `${actionClassName} bg-black text-white transition-opacity duration-200 hover:opacity-85`;
  const disabledClassName = `${actionClassName} cursor-not-allowed border border-black text-black/50`;
  const registerContent = (
    <>
      <span>{registerLabel}</span>
      <ArrowIcon />
    </>
  );
  const photosContent = (
    <>
      <span>{photosLabel}</span>
      <ArrowIcon />
    </>
  );

  return (
    <section className="border-t border-black">
      <div className="flex items-start justify-between gap-6 py-6 max-[767px]:flex-col max-[767px]:gap-5">
        <div className="relative flex w-[clamp(220px,22.7vw,327px)] flex-col gap-6 max-[767px]:w-full">
          <div className="flex items-center justify-between gap-6">
            <span className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em]">
              {event.city} [{formatEventDate(event.date, true)}]
            </span>
            <span className="text-[clamp(22px,2.4vw,36px)] font-normal leading-none">{formatEventTime(event.time)}</span>
          </div>
          <p className="text-[clamp(13px,1.3vw,20px)] font-normal leading-[1.35]">{event.location}</p>
          {textLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-6 bg-white" aria-hidden="true">
              <div className="flex items-center justify-between gap-6">
                <LoadingBlock className="h-7 w-44" />
                <LoadingBlock className="h-9 w-20" />
              </div>
              <LoadingBlock className="h-16 w-full" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-9 max-[1199px]:gap-6 max-[767px]:w-full max-[767px]:flex-col max-[767px]:gap-4">
          {registrationAvailable && registerHref && (
            <a href={registerHref} target="_blank" rel="noopener noreferrer" className={registerClassName}>
              {registerContent}
            </a>
          )}
          {eventPhase === 'live' && (
            <span className={disabledClassName} aria-disabled="true">
              <span>{ongoingLabel}</span>
            </span>
          )}
          {photosAvailable && photosHref && (
            <a href={photosHref} target="_blank" rel="noopener noreferrer" className={registerClassName}>
              {photosContent}
            </a>
          )}
          <Link
            href={`/events/${event.id}`}
            className={`${actionClassName} border border-red bg-transparent text-black transition-colors duration-200 hover:bg-red hover:text-white`}
          >
            <span>{detailsLabel}</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>

      {lectures.length > 0 && (
        <div className="grid grid-cols-2 gap-x-9 gap-y-6 pb-9 max-[1199px]:gap-x-6 max-[767px]:grid-cols-1">
          {lectures.slice(0, 4).map((lecture) => (
            <LectureCard key={lecture.id} lecture={lecture} variant="compact" textLoading={textLoading} />
          ))}
        </div>
      )}
    </section>
  );
}
