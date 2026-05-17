'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMinimumSkeleton } from './useMinimumSkeleton'

export type UseLocalizedFetchResult<T> = {
  data: T | null
  loading: boolean
  textRefreshing: boolean
  /** Fires once initial load completes. Useful for downstream `useEffect`s that should wait. */
  hasLoaded: boolean
}

type UseLocalizedFetchOptions = {
  enabled?: boolean
  textRefreshMinMs?: number
}

/**
 * Owns the "first load shows skeleton, language switch shows lightweight text-only skeleton" pattern.
 *
 * Pass a fetcher that returns the latest data. Any additional deps trigger a refetch and are
 * treated as a *content* change (not a locale change) for skeleton purposes.
 */
export function useLocalizedFetch<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
  { enabled = true, textRefreshMinMs = 350 }: UseLocalizedFetchOptions = {},
): UseLocalizedFetchResult<T> {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en' : 'uk'
  const previousLocaleRef = useRef(locale)
  const hasLoadedRef = useRef(false)
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [textRefreshing, setTextRefreshing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const skeletonLoading = useMinimumSkeleton(loading)
  const textSkeletonLoading = useMinimumSkeleton(textRefreshing, textRefreshMinMs)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let isMounted = true
    const isLocaleRefresh = hasLoadedRef.current && previousLocaleRef.current !== locale
    previousLocaleRef.current = locale
    const pendingTimer = window.setTimeout(() => {
      if (!isMounted) return
      if (isLocaleRefresh) setTextRefreshing(true)
      else setLoading(true)
    }, 0)

    fetcher()
      .then((result) => {
        if (!isMounted) return
        setData(result)
      })
      .catch(() => {
        if (!isMounted) return
        if (!isLocaleRefresh) setData(null)
      })
      .finally(() => {
        if (!isMounted) return
        hasLoadedRef.current = true
        setHasLoaded(true)
        setLoading(false)
        setTextRefreshing(false)
      })

    return () => {
      isMounted = false
      window.clearTimeout(pendingTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, locale, ...deps])

  return {
    data,
    loading: skeletonLoading,
    textRefreshing: textSkeletonLoading,
    hasLoaded,
  }
}
