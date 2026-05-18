import LectureCard from "@/components/LectureCard"
import LoadingBlock from "@/components/ui/LoadingBlock"

const actionClassName = "flex h-[69px] w-[clamp(220px,22.7vw,327px)] items-center justify-center gap-[10px] px-6 py-5 font-sans text-[clamp(14px,1.6vw,24px)] no-underline max-[767px]:w-full"

export default function EventSectionSkeleton() {
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
  )
}
