'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="page min-h-screen items-center justify-center flex flex-col gap-8">
      <p className="text-[clamp(14px,1.4vw,20px)] text-black opacity-60 uppercase tracking-widest">
        Something went wrong
      </p>
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={reset}
          className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase no-underline transition-colors duration-200 hover:bg-black hover:text-white"
        >
          Home
        </Link>
      </div>
    </div>
  )
}
