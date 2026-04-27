export default function Loader({ className = 'flex items-center justify-center w-full min-h-[40vh]' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="loader" aria-label="Loading" role="status" />
    </div>
  )
}
