'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import FilterDropdown from '../components/FilterDropdown'
import EventSection from '../components/EventSection'
import LoadingBlock from '../components/ui/LoadingBlock'
import { api } from '../lib/api'
import type { Event, EventFacet } from '@/lib/api'
import { formatEventTime } from '../lib/date-time'
import { useFilteredList } from '../hooks/useFilteredList'

const EVENTS_PAGE_SIZE = 10
const EVENTS_FILTER_STORAGE_KEY = '15x4:events:filters'

type EventFilters = {
  sort: string
  city: string
  time: string
}

type EventsFacets = {
  cities?: EventFacet[]
  times?: EventFacet[]
}

const DEFAULT_FILTERS: EventFilters = { sort: '', city: '', time: '' }

const fetchEvents = ({ filters, limit, offset }: { filters: EventFilters; limit: number; offset: number }) =>
  api.getEventsPage({
    limit,
    offset,
    sort: filters.sort,
    city: filters.city,
    time: filters.time,
  })

export default function EventsPage() {
  const { t } = useTranslation()
  const list = useFilteredList<Event, EventFilters, EventsFacets>({
    fetcher: fetchEvents,
    defaultFilters: DEFAULT_FILTERS,
    pageSize: EVENTS_PAGE_SIZE,
    storageKey: EVENTS_FILTER_STORAGE_KEY,
  })

  const cityOptions = useMemo(
    () => [
      { value: '', label: t('events.allCities') },
      ...(list.state.facets?.cities ?? []),
    ],
    [list.state.facets?.cities, t],
  )

  const timeOptions = useMemo(
    () => [
      { value: '', label: t('events.time') },
      ...(list.state.facets?.times ?? []).map((option) => ({
        value: option.value,
        label: formatEventTime(option.value) || option.label,
      })),
    ],
    [list.state.facets?.times, t],
  )

  const sortOptions = [
    { value: '', label: t('events.sortBy') },
    { value: 'dateDesc', label: t('events.dateDesc') },
    { value: 'dateAsc', label: t('events.dateAsc') },
  ]

  const { items: events, loading, textRefreshing, loadingMore, hasMore, total } = list.state

  return (
    <AppLayout>
      <div className="min-h-[620px]">
        <div className="content-shell grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-6 py-6 max-[1199px]:gap-4 max-[900px]:grid-cols-1 max-[900px]:gap-4">
          <div className="grid grid-cols-[clamp(220px,22.7vw,327px)_minmax(0,1fr)] items-end gap-6 max-[1199px]:gap-4 max-[900px]:grid-cols-1">
            <h1 className="col-start-2 px-[clamp(16px,2vw,28px)] text-[clamp(28px,3.2vw,48px)] font-normal leading-none text-black max-[900px]:col-start-auto max-[900px]:px-0">
              <span className="text-red">{'//'}</span> {t('events.pageTitle')}
            </h1>
          </div>
          <div className="flex items-end justify-between gap-6 max-[1199px]:gap-4 max-[767px]:flex-col max-[767px]:items-stretch">
            <FilterDropdown label={t('events.sortBy')} options={sortOptions} value={list.filters.sort} onChange={(v) => list.setFilter('sort', v)} />
            <FilterDropdown label={t('events.city')} options={cityOptions} value={list.filters.city} onChange={(v) => list.setFilter('city', v)} />
            <FilterDropdown label={t('events.time')} options={timeOptions} value={list.filters.time} onChange={(v) => list.setFilter('time', v)} />
          </div>
        </div>

        <main className="content-shell">
          {loading ? (
            <>
              <EventSection loading />
              <EventSection loading />
              <EventSection loading />
            </>
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventSection
                key={event.id}
                event={event}
                detailsLabel={t('events.details')}
                registerLabel={t('events.register')}
                ongoingLabel={t('events.ongoing')}
                photosLabel={t('events.photos')}
                textLoading={textRefreshing}
              />
            ))
          ) : (
            <div className="border-t border-black py-12 text-center text-[clamp(16px,1.6vw,24px)] opacity-60">
              {t('events.noResults')}
            </div>
          )}
          <div className="h-px w-full bg-black" />
        </main>

        {loading ? (
          <div className="content-shell flex justify-center py-10">
            <LoadingBlock className="h-[48px] w-36 border border-black bg-transparent" />
          </div>
        ) : loadingMore ? (
          <div className="content-shell py-10 flex justify-center" aria-live="polite" aria-busy="true">
            <span className="loader" />
          </div>
        ) : (hasMore || total > events.length) && (
          <div className="content-shell py-10 flex justify-center">
            <button
              type="button"
              onClick={() => void list.loadMore()}
              className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-black"
            >
              {t('events.loadMore')}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
