'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMinimumSkeleton } from './useMinimumSkeleton'

export type FilteredListResponse<T, Extra extends object = object> = {
  items: T[]
  total: number
  hasMore: boolean
} & Extra

export type Fetcher<T, F, Extra extends object = object> = (params: {
  filters: F
  limit: number
  offset: number
}) => Promise<FilteredListResponse<T, Extra>>

export type FilteredListConfig<T, F extends object, Extra extends object = object> = {
  fetcher: Fetcher<T, F, Extra>
  defaultFilters: F
  pageSize: number
  storageKey?: string
  debouncedKeys?: Array<keyof F>
  debounceMs?: number
}

export type FilteredListState<T, Extra extends object = object> = {
  items: T[]
  total: number
  hasMore: boolean
  /** Initial-load skeleton: true on the first fetch, false thereafter. */
  loading: boolean
  /** Background-refresh skeleton: true on language switch or filter-driven refetch. */
  refreshing: boolean
  /** Refresh-only skeleton (text-bone style, shorter min duration). */
  textRefreshing: boolean
  /** True after the very first fetch resolves. */
  hasLoaded: boolean
  /** True while load-more is fetching the next page. */
  loadingMore: boolean
  facets: Extra | null
}

export type FilteredListApi<T, F extends object, Extra extends object = object> = {
  state: FilteredListState<T, Extra>
  filters: F
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void
  resetFilters: () => void
  loadMore: () => Promise<void>
}

const SKELETON_MIN_MS = 350

export function useFilteredList<T, F extends object, Extra extends object = object>({
  fetcher,
  defaultFilters,
  pageSize,
  storageKey,
  debouncedKeys = [],
  debounceMs = 300,
}: FilteredListConfig<T, F, Extra>): FilteredListApi<T, F, Extra> {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en' : 'uk'
  const previousLocaleRef = useRef(locale)
  const hasLoadedRef = useRef(false)

  const debouncedKeySet = useMemo(() => new Set(debouncedKeys.map(String)), [debouncedKeys])

  const [filters, setFilters] = useState<F>(defaultFilters)
  const [debouncedFilters, setDebouncedFilters] = useState<F>(defaultFilters)
  const [filtersReady, setFiltersReady] = useState(!storageKey)
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [textRefreshing, setTextRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [facets, setFacets] = useState<Extra | null>(null)
  const refreshing = loading && hasLoaded

  // Restore filters from storage once.
  useEffect(() => {
    if (!storageKey) return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<F>
        if (parsed && typeof parsed === 'object') {
          setFilters((current) => ({ ...current, ...parsed }))
          setDebouncedFilters((current) => ({ ...current, ...parsed }))
        }
      }
    } catch {
      // Ignore corrupt persisted filters.
    } finally {
      setFiltersReady(true)
    }
  }, [storageKey])

  // Persist filters back to storage.
  useEffect(() => {
    if (!storageKey || !filtersReady) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(filters))
    } catch {
      // Ignore quota / private-mode errors.
    }
  }, [storageKey, filtersReady, filters])

  // Debounce the requested fields.
  useEffect(() => {
    if (debouncedKeySet.size === 0) {
      setDebouncedFilters(filters)
      return
    }
    const timer = window.setTimeout(() => {
      setDebouncedFilters(filters)
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [filters, debounceMs, debouncedKeySet])

  // Synchronise non-debounced fields immediately.
  useEffect(() => {
    if (debouncedKeySet.size === 0) return
    setDebouncedFilters((current) => {
      let next = current
      for (const key of Object.keys(filters) as Array<keyof F>) {
        if (debouncedKeySet.has(String(key))) continue
        if (current[key] !== filters[key]) {
          if (next === current) next = { ...current }
          next[key] = filters[key]
        }
      }
      return next
    })
  }, [filters, debouncedKeySet])

  // Fetch on filter change.
  useEffect(() => {
    if (!filtersReady) return
    let isMounted = true
    const isLocaleRefresh = hasLoadedRef.current && previousLocaleRef.current !== locale
    previousLocaleRef.current = locale
    const pendingTimer = window.setTimeout(() => {
      if (!isMounted) return
      if (isLocaleRefresh) setTextRefreshing(true)
      else setLoading(true)
    }, 0)

    fetcher({ filters: debouncedFilters, limit: pageSize, offset: 0 })
      .then((data) => {
        if (!isMounted) return
        setItems(Array.isArray(data.items) ? data.items : [])
        setTotal(Number(data.total ?? 0))
        setHasMore(Boolean(data.hasMore))
        const facetsFromResponse = { ...data } as Extra & FilteredListResponse<T, Extra>
        delete (facetsFromResponse as { items?: T[] }).items
        delete (facetsFromResponse as { total?: number }).total
        delete (facetsFromResponse as { hasMore?: boolean }).hasMore
        setFacets(Object.keys(facetsFromResponse).length > 0 ? (facetsFromResponse as Extra) : null)
      })
      .catch(() => {
        if (!isMounted) return
        if (!isLocaleRefresh) {
          setItems([])
          setTotal(0)
          setHasMore(false)
        }
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
  }, [filtersReady, debouncedFilters, locale, fetcher, pageSize])

  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((current) => (current[key] === value ? current : { ...current, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [defaultFilters])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const data = await fetcher({ filters: debouncedFilters, limit: pageSize, offset: items.length })
      setItems((current) => [...current, ...(Array.isArray(data.items) ? data.items : [])])
      setHasMore(Boolean(data.hasMore))
      setTotal(Number(data.total ?? 0))
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [debouncedFilters, fetcher, pageSize, items.length])

  const skeletonLoading = useMinimumSkeleton(loading && !hasLoaded)
  const refreshSkeletonLoading = useMinimumSkeleton(refreshing, SKELETON_MIN_MS)
  const textSkeletonLoading = useMinimumSkeleton(textRefreshing, SKELETON_MIN_MS)

  return {
    state: {
      items,
      total,
      hasMore,
      loading: skeletonLoading || refreshSkeletonLoading,
      refreshing: refreshSkeletonLoading,
      textRefreshing: textSkeletonLoading,
      hasLoaded,
      loadingMore,
      facets,
    },
    filters,
    setFilter,
    resetFilters,
    loadMore,
  }
}
