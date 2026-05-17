import Link from "next/link";
import type { Event } from "@/lib/api";
import ArrowIcon from "@/components/ArrowIcon";
import LectureCard from "@/components/LectureCard";
import LoadingBlock from "@/components/ui/LoadingBlock";
import EventSectionSkeleton from "@/components/EventSectionSkeleton";
import EventPhaseAction from "@/components/EventPhaseAction";
import { formatEventDate, formatEventTime } from "@/lib/date-time";

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
  if (props.loading) return <EventSectionSkeleton />

  const actionClassName = "flex h-[69px] w-[clamp(220px,22.7vw,327px)] items-center justify-center gap-[10px] px-6 py-5 font-sans text-[clamp(14px,1.6vw,24px)] no-underline max-[767px]:w-full";
  const { event, detailsLabel, registerLabel, ongoingLabel = "триває...", photosLabel = "фото", textLoading = false } = props;
  const lectures = event.lectures ?? [];

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
          <EventPhaseAction
            date={event.date}
            time={event.time}
            registrationUrl={event.registrationUrl}
            eventPhotosUrl={event.eventPhotosUrl}
            labels={{ register: registerLabel, ongoing: ongoingLabel, photos: photosLabel }}
          />
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
