'use client'

import { useEffect, useRef, useState } from 'react'

export function useMinimumSkeleton(loading: boolean, minimumMs = 450) {
  const startedAtRef = useRef<number | null>(null)
  const [visible, setVisible] = useState(loading)

  useEffect(() => {
    if (loading) {
      startedAtRef.current ??= Date.now()
      setVisible(true)
      return
    }

    if (!visible) return

    const startedAt = startedAtRef.current ?? Date.now()
    const remaining = Math.max(0, minimumMs - (Date.now() - startedAt))
    const timer = window.setTimeout(() => {
      startedAtRef.current = null
      setVisible(false)
    }, remaining)

    return () => window.clearTimeout(timer)
  }, [loading, minimumMs, visible])

  return visible
}
