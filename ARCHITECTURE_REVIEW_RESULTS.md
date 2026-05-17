# Architecture Review Results

> Analyzed on: 2026-05-18
> Project: 15x4 (Next.js 16 App Router + Supabase + i18next)
> Total components analyzed: 17 page views, 18 shared components, 2 hooks, ~10 lib modules
> Issues found: 12

## Summary

The application has solid bones — a clear server/client split, a dedicated `lib/api.ts` HTTP wrapper, a shared `LectureCard` with variants, and proper i18n wiring. But almost every page-level view mixes 3–5 abstraction levels in a single file (filter state, persistence, locale-refresh, debouncing, skeletons, and JSX layout all inline), and the same patterns are duplicated across pages instead of being extracted. Three changes would deliver outsized value: extract a `useFilteredList` hook for the list-page pattern, introduce an `AppLayout` / `AdminLayout` component, and promote `lib/api.ts` from a singleton object to a proper class.

## Issues

### ISSUE-01: Page components are 250–850 lines mixing data, layout, and skeletons

**Severity**: High
**Principle**: SLA Violation
**Location**: `src/views/EventsPage.tsx`, `src/views/LecturesPage.tsx`, `src/views/EventDetailPage.tsx`, `src/views/LectureDetailPage.tsx`, `src/views/AddEditEventPage.tsx`, `src/views/AddEditLecturePage.tsx`, `src/views/AdminEventsPage.tsx`, `src/views/AdminLecturesPage.tsx`, `src/views/AdminUsersPage.tsx`

Every page below 100 lines reads at one level of abstraction (`HomePage.tsx` is the gold standard — it composes 5 named children). Every page above 200 lines does not. They inline filter state machines, locale-refresh effects, debouncing, localStorage persistence, custom skeletons, and bespoke render helpers — making the page itself unreadable. By contrast a page should *describe what is shown*, not implement every piece of it.

#### Current (Bad) — `src/views/EventsPage.tsx` lines 28–260

```tsx
export default function EventsPage() {
  const { t, i18n } = useTranslation()
  // ...12 useState declarations
  const [events, setEvents] = useState<Event[]>([])
  const [cityOptionsData, setCityOptionsData] = useState<Array<{ value: string; label: string }>>([])
  // ...filter-persistence useEffect (lines 46–66)
  // ...fetch-on-change useEffect (lines 68–107)
  // ...locale-refresh useEffect (lines 109–145)
  // ...handleLoadMore (lines 147–167)
  // ...sortOptions / cityOptions / timeOptions arrays (lines 169–183)
  // ...inline LoadingBlock helper (lines 24–26)
  return (
    <div className="page">
      <Navbar />
      <div className="min-h-[620px]">
        <div className="content-shell grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] ..."> {/* 40 lines of filter bar JSX */} </div>
        <main className="content-shell">
          {listSkeletonLoading ? (
            <><EventSection loading /><EventSection loading /><EventSection loading /></>
          ) : events.length > 0 ? (
            events.map((event) => <EventSection key={event.id} event={event} ... />)
          ) : (<div>{t('events.noResults')}</div>)}
        </main>
        {/* load more block */}
        <JoinSection />
        <Footer />
      </div>
    </div>
  )
}
```

#### Recommended (Good)

```tsx
export default function EventsPage() {
  const { t } = useTranslation()
  const list = useEventsList()  // see ISSUE-03 for the hook

  return (
    <AppLayout>
      <EventsPageHeader filters={list.filters} options={list.facets} />
      <EventsList state={list.state} onLoadMore={list.loadMore} />
    </AppLayout>
  )
}
```

**Why this is better**: the page reads as a sentence. `EventsList` decides skeleton vs. data; `EventsPageHeader` owns the filter bar. The page stops touching `useState`, `useEffect`, localStorage, or layout primitives directly.

---

### ISSUE-02: No shared `AppLayout` / `AdminLayout` — every page reinvents the shell

**Severity**: High
**Principle**: Missing Layout
**Location**: All files in `src/views/` (esp. all 4 admin pages)

Every page manually renders `<Navbar variant="..." />`, a content wrapper, optionally a `<JoinSection />`, and a `<Footer />`. The four admin pages additionally duplicate the same 4-link `<nav>` and `<h1>` heading with a Tailwind class string that has drifted in 3 places. There is no central source of truth for "what an admin page looks like."

#### Current (Bad) — repeated verbatim in `src/views/AdminEventsPage.tsx:197-208`, `src/views/AdminLecturesPage.tsx`, `src/views/AdminUsersPage.tsx`, `src/views/AdminDashboardPage.tsx`

```tsx
<Navbar variant="light" />
<main className="px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
  <h1 className="text-[clamp(22px,2.4vw,36px)] ...">{t('admin.events.title')}</h1>
  <nav className="flex gap-4 mb-12 border-b border-black pb-4">
    <Link href="/admin">…dashboard</Link>
    <Link href="/admin/users">…users</Link>
    <Link href="/admin/lectures">…lectures</Link>
    <span className="text-red">{t('admin.nav.events')}</span>  {/* active page */}
  </nav>
  {/* page body */}
</main>
```

#### Recommended (Good)

```tsx
// src/components/AdminLayout.tsx — owns navbar, sub-nav, heading
export default function AdminLayout({ title, active, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="light" />
      <main className="px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <h1 className="...">{title}</h1>
        <AdminSubNav active={active} />
        {children}
      </main>
    </div>
  )
}

// src/views/AdminEventsPage.tsx
export default function AdminEventsPage() {
  const { t } = useTranslation()
  return (
    <AdminLayout title={t('admin.events.title')} active="events">
      <EventsAdminFilters {...} />
      <EventsAdminTable {...} />
    </AdminLayout>
  )
}
```

Apply the same pattern with a separate `AppLayout` (navbar + footer + join) for the public-facing pages.

**Why this is better**: changing the admin nav order, adding a new tab, or restyling the heading happens in exactly one file instead of four. Each page becomes a clean expression of its content.

---

### ISSUE-03: List-page pattern (search + filters + paginated fetch + locale refresh) duplicated across 5 pages

**Severity**: High
**Principle**: Code Duplication / Unclear Data Flow
**Location**: `src/views/EventsPage.tsx`, `src/views/LecturesPage.tsx`, `src/views/AdminEventsPage.tsx`, `src/views/AdminLecturesPage.tsx`, `src/views/AdminUsersPage.tsx`

Every list page reimplements the same state machine: debounce search, persist filter state to localStorage, refetch on filter or locale change, show skeleton, handle "load more". ~120 lines of nearly-identical hook logic per page.

#### Current (Bad) — paraphrased from `src/views/LecturesPage.tsx` and `src/views/EventsPage.tsx`

```tsx
// LecturesPage
const [searchQuery, setSearchQuery] = useState('')
const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
const [sortBy, setSortBy] = useState('dateDesc')
const [themeFilter, setThemeFilter] = useState('')
const [filtersReady, setFiltersReady] = useState(false)
const [lectures, setLectures] = useState<Lecture[]>([])
const [loading, setLoading] = useState(true)
const [hasLoaded, setHasLoaded] = useState(false)
const [loadingMore, setLoadingMore] = useState(false)
const [textRefreshing, setTextRefreshing] = useState(false)
const [hasMore, setHasMore] = useState(false)
const [total, setTotal] = useState(0)
const previousLocaleRef = useRef(locale)

useEffect(() => { /* read from localStorage */ }, [])
useEffect(() => { /* persist to localStorage */ }, [filtersReady, ...])
useEffect(() => { /* debounce search */ }, [searchQuery])
useEffect(() => { /* fetch on filters/sort change */ }, [filtersReady, debouncedSearchQuery, sortBy, themeFilter])
useEffect(() => { /* refetch on locale change */ }, [locale, ...])
// EventsPage repeats all of the above with cityFilter/timeFilter instead of search/theme.
```

#### Recommended (Good)

```tsx
// src/hooks/useFilteredList.ts
export function useFilteredList<T, F>({ fetcher, storageKey, defaultFilters }: Config<T, F>) {
  // owns: filters, debouncedFilters, page, items, loading, textRefreshing, hasMore, total
  // exposes: state, setFilter, loadMore
  return { state, filters, setFilter, loadMore }
}

// src/views/LecturesPage.tsx
const list = useFilteredList<Lecture, LectureFilters>({
  fetcher: api.getLecturesPage,
  storageKey: '15x4:lectures:filters',
  defaultFilters: { search: '', sort: 'dateDesc', category: '' },
})
```

**Why this is better**: the locale-refresh, persistence, debounce, and skeleton-min-duration logic all live in one tested hook. New list pages (e.g., a future tags page) become 20 lines instead of 150.

---

### ISSUE-04: Locale-refresh effect duplicated in 6 components verbatim

**Severity**: Medium
**Principle**: Code Duplication
**Location**: `src/views/EventsPage.tsx:109-145`, `src/views/LecturesPage.tsx:120-154`, `src/views/EventDetailPage.tsx:45-84`, `src/views/LectureDetailPage.tsx:44-96`, `src/components/UpcomingEvents.tsx:55-87`, `src/components/PopularLectures.tsx:39-71`

Every "show server-translated content" component implements the same `previousLocaleRef.current !== locale → refetch with textRefreshing=true → useMinimumSkeleton(textRefreshing, 350)` dance. The shape never varies.

#### Current (Bad) — `src/components/UpcomingEvents.tsx:55-87` (representative)

```tsx
useEffect(() => {
  let isMounted = true
  const isLocaleRefresh = hasLoadedRef.current && previousLocaleRef.current !== locale
  previousLocaleRef.current = locale
  const pendingTimer = window.setTimeout(() => {
    if (!isMounted) return
    if (isLocaleRefresh) setTextRefreshing(true)
    else setLoading(true)
  }, 0)

  api.getEvents().then(/* ... */).catch(/* ... */).finally(/* ... */)

  return () => { isMounted = false; window.clearTimeout(pendingTimer) }
}, [locale])
```

#### Recommended (Good)

```tsx
// src/hooks/useLocalizedFetch.ts
export function useLocalizedFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  // returns: { data, loading, textRefreshing }
  // owns the previousLocaleRef + hasLoadedRef + dual-skeleton logic
}

// in UpcomingEvents
const { data: events, loading, textRefreshing } = useLocalizedFetch(api.getEvents)
```

**Why this is better**: the dual-skeleton pattern (skeleton on first load, text-only skeleton on language switch) becomes a one-line contract. Components stop owning lifecycle bookkeeping.

---

### ISSUE-05: `lib/api.ts` is a singleton object literal, not a class

**Severity**: Medium
**Principle**: Missing API Abstraction
**Location**: `src/lib/api.ts:121-203`

`api` is exported as a plain object whose methods directly call `fetch()` and read `localStorage` inside `withQuery`. There's no way to inject a base URL, a different fetch implementation, an auth token, or a different locale resolver. Testing requires monkey-patching `window.localStorage` and `global.fetch`. Migration to a different backend (REST → GraphQL, or moving to a hosted SaaS for content) requires editing every method.

#### Current (Bad) — `src/lib/api.ts`

```ts
const currentLocale = () => {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem('i18nextLng')
  return stored?.startsWith('en') ? 'en' : stored?.startsWith('uk') ? 'uk' : null
}

export const api = {
  getLectures: (params?: LectureListParams) =>
    requestJson(withQuery('/api/lectures', params)).then((data) => asArray<Lecture>(data)),
  getEvent: (id: string) => requestJson(withQuery(`/api/events/${id}`)),
  // ...20 more arrow-function methods
}
```

#### Recommended (Good)

```ts
// src/lib/api/ContentApi.ts
type ApiConfig = {
  baseUrl: string
  fetcher?: typeof fetch
  getLocale?: () => 'uk' | 'en' | null
}

export class ContentApi {
  constructor(private cfg: ApiConfig) {}

  async getLectures(params?: LectureListParams): Promise<Lecture[]> {
    const data = await this.requestJson(this.withQuery('/api/lectures', params))
    return Array.isArray(data) ? data : []
  }
  async getEvent(id: string): Promise<Event> { /* ... */ }
  // ...
}

// src/lib/api/index.ts
export const api = new ContentApi({
  baseUrl: '',
  getLocale: () => localStorage.getItem('i18nextLng')?.startsWith('en') ? 'en' : 'uk',
})
```

**Why this is better**: tests instantiate `new ContentApi({ baseUrl: 'http://mock', getLocale: () => 'en', fetcher: mockFetch })`. The locale source becomes injectable (today it silently assumes a browser). Future backends swap by changing the constructor call site, not 30 view files.

---

### ISSUE-06: Admin views bypass `api.admin.*` and call `fetch()` directly

**Severity**: Medium
**Principle**: Missing API Abstraction
**Location**: `src/views/AdminEventsPage.tsx:150,172`, `src/views/AdminLecturesPage.tsx:138,163`, `src/views/AdminUsersPage.tsx:135,160`, `src/views/AdminDashboardPage.tsx:32`

`src/lib/api.ts` already exports `api.admin.deleteEvent`, `api.admin.approveEvent`, `api.admin.deleteLecture`, `api.admin.getStats`, etc. The admin pages ignore them and call `fetch('/api/admin/...')` directly — so the service layer is incomplete in practice.

#### Current (Bad) — `src/views/AdminEventsPage.tsx:150` and `:172`

```tsx
async function handleDelete(eventId: string) {
  // ...
  const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' })
  if (!res.ok) return
  // ...
}

async function handleApprove(eventId: string) {
  // ...
  const res = await fetch(`/api/admin/events/${eventId}`, { method: 'PATCH' })
  if (!res.ok) return
  // ...
}
```

#### Recommended (Good)

```tsx
async function handleDelete(eventId: string) {
  const result = await api.admin.deleteEvent(eventId)
  if (result?.error) return
  // ...
}

async function handleApprove(eventId: string) {
  const result = await api.admin.approveEvent(eventId)
  if (result?.error) return
  // ...
}
```

**Why this is better**: every admin mutation goes through the same parameterised, error-shaped service layer. When ISSUE-05 is fixed and `api` becomes injectable, admin pages benefit automatically. Today they're a hidden coupling to the `/api/admin` URL shape.

---

### ISSUE-07: `AccountSettingsPage` imports the Supabase browser client directly

**Severity**: Medium
**Principle**: Proper Layering
**Location**: `src/views/AccountSettingsPage.tsx:11,19,86`

All other Supabase auth use lives inside `AuthContext`. `AccountSettingsPage` is the only exception: it imports `createClient` and calls `supabase.auth.updateUser({ password })` directly. This is a layering leak — the layer "view depends on auth library" should not exist when `AuthContext` already wraps everything else.

#### Current (Bad) — `src/views/AccountSettingsPage.tsx:11-86`

```tsx
import { createClient } from '../lib/supabase/client'
// ...
const supabase = createClient()
// ...
if (password) {
  const { error: pwError } = await supabase.auth.updateUser({ password })
  if (pwError) { /* ... */ }
}
```

#### Recommended (Good)

```tsx
// in AuthContext.tsx — add to the value object
const updatePassword = useCallback(async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password })
  return error ? { error: toAuthResultError(error) } : {}
}, [supabase])

// in AccountSettingsPage.tsx
const { updatePassword } = useAuth()
const result = await updatePassword(password)
if (result.error) { /* ... */ }
```

**Why this is better**: the view depends on the auth context's *interface*, not on Supabase. Switching auth providers becomes a single-file change.

---

### ISSUE-08: Locale fallback re-implemented on the client even though the API already does it

**Severity**: Medium
**Principle**: Code Duplication
**Location**: `src/views/EventDetailPage.tsx:17-23`, `src/views/LectureDetailPage.tsx:309-310`, `src/views/AdminEventsPage.tsx:134-135`

`src/lib/content-api.ts` exports `pickLocalized` and uses it inside `mapEventRow` / `mapLectureRow` — so the API already returns a resolved `title`, `author`, `summary`, `location`. Several views ignore that and redo the resolution client-side, often using `??` (which mis-handles empty strings — exactly the bug we already fixed once).

#### Current (Bad) — `src/views/EventDetailPage.tsx:17-23`

```tsx
function eventDescription(event: Event, language: string) {
  if (language.startsWith('en')) {
    return event.descriptionEn || event.descriptionUk || ''
  }
  return event.descriptionUk || event.descriptionEn || ''
}
```

```tsx
// LectureDetailPage.tsx:309-310
const title = locale === 'en' ? (r.titleEn || r.titleUk || r.title) : (r.titleUk || r.titleEn || r.title)
const author = locale === 'en' ? (r.authorEn || r.authorUk || r.author) : (r.authorUk || r.authorEn || r.author)
```

#### Recommended (Good)

```tsx
// 1. Add description handling to the API mapper
// src/lib/content-api.ts → mapEventRow
return {
  ...row,
  title: pickLocalized(row.titleEn, row.titleUk, locale),
  city: pickLocalized(row.cityEn, row.cityUk, locale),
  location: pickLocalized(row.locationEn, row.locationUk, locale),
  description: pickLocalized(row.descriptionEn, row.descriptionUk, locale), // new
}

// 2. In the views, just read .description / .title / .author
<p>{event.description}</p>
<p>{r.title}</p>
```

**Why this is better**: the locale-resolution rule lives in one place. Adding a new translatable field (e.g. `slogan`) means changing one mapper, not five views. Eliminates a class of empty-string-fallback bugs.

---

### ISSUE-09: `LoadingBlock` inline definition copy-pasted in 6 files

**Severity**: Low
**Principle**: Code Duplication
**Location**: `src/components/EventSection.tsx:7-9`, `src/views/EventsPage.tsx:24-26`, `src/views/EventDetailPage.tsx:25-27`, `src/views/LectureDetailPage.tsx:18-20`, `src/views/AddEditLecturePage.tsx:131-133`, `src/components/UpcomingEvents.tsx:35-37`

Identical 3-line component declared in every file that has a skeleton state.

#### Current (Bad) — verbatim in 6 files

```tsx
function LoadingBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-black/10 ${className}`} />
}
```

#### Recommended (Good)

```tsx
// src/components/ui/LoadingBlock.tsx
export default function LoadingBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-black/10 ${className}`} />
}

// usage everywhere
import LoadingBlock from '@/components/ui/LoadingBlock'
```

**Why this is better**: a single skeleton primitive means restyling skeletons (or replacing them with a proper Skeleton library) happens in one place.

---

### ISSUE-10: `UpcomingEvents` is one 290-line component mixing 4 concerns

**Severity**: Medium
**Principle**: SLA Violation
**Location**: `src/components/UpcomingEvents.tsx`

The component combines: city selection state, locale-refresh fetch (ISSUE-04), three-column event card layout, action-button selection logic (IIFE on lines 203-236), and a skeleton fallback. The IIFE on lines 203-236 is especially telling — it's an inline 35-line function whose only job is "pick the right button for this event phase", which is exactly the contract of a named component.

#### Current (Bad) — `src/components/UpcomingEvents.tsx:203-236`

```tsx
{(() => {
  const eventPhase = getEventPhase(event.date, event.time, now)
  const registerHref = event.registrationUrl?.trim()
  const photosHref = event.eventPhotosUrl?.trim()
  const actionClassName = "mt-6 flex h-[69px] ..."

  if (eventPhase === 'upcoming' && registerHref?.startsWith('http')) {
    return (<a href={registerHref} ...><span>{t('upcomingEvents.register')}</span><ArrowIcon /></a>)
  }
  if (eventPhase === 'live') { return (<span aria-disabled>...</span>) }
  if (eventPhase === 'past' && photosHref?.startsWith('http')) {
    return (<a href={photosHref} ...><span>{t('upcomingEvents.photos')}</span><ArrowIcon /></a>)
  }
  return null
})()}
```

#### Recommended (Good)

```tsx
// src/components/EventPhaseAction.tsx — single source of truth for the 3 action variants
export default function EventPhaseAction({ event, now, labels }: Props) {
  const phase = getEventPhase(event.date, event.time, now)
  if (phase === 'upcoming' && event.registrationUrl) {
    return <RegisterButton href={event.registrationUrl} label={labels.register} />
  }
  if (phase === 'live') return <OngoingBadge label={labels.ongoing} />
  if (phase === 'past' && event.eventPhotosUrl) {
    return <PhotosButton href={event.eventPhotosUrl} label={labels.photos} />
  }
  return null
}

// in UpcomingEvents (and EventSection — they duplicate this logic)
<EventPhaseAction event={event} now={now} labels={{...}} />
```

**Why this is better**: removes ~35 lines from both `UpcomingEvents` and the very similar block in `EventSection.tsx:101-115`. Adds a single named component you can describe in one sentence.

---

### ISSUE-11: `EventSection` skeleton branch is a 25-line inline block

**Severity**: Low
**Principle**: SLA Violation
**Location**: `src/components/EventSection.tsx:25-54`

The component uses a discriminated-union prop to split between "loading" and "data" states. Reasonable in principle, but the loading branch inlines a full skeleton tree that has nothing to do with the data-rendering branch.

#### Current (Bad) — `src/components/EventSection.tsx:28-54`

```tsx
if (props.loading) {
  return (
    <section className="border-t border-black">
      <div className="flex items-start justify-between gap-6 py-6 max-[767px]:flex-col max-[767px]:gap-5">
        <div className="flex w-[clamp(220px,22.7vw,327px)] flex-col gap-6 ...">
          <div className="flex items-center justify-between gap-6">
            <LoadingBlock className="h-7 w-44" />
            <LoadingBlock className="h-6 w-16" />
          </div>
          <LoadingBlock className="h-16 w-full" />
        </div>
        {/* ...20 more lines */}
      </div>
    </section>
  )
}
```

#### Recommended (Good)

```tsx
// EventSection.tsx
if (props.loading) return <EventSectionSkeleton />
// data branch only below

// EventSectionSkeleton.tsx — a sibling, ~30 lines, single responsibility
export default function EventSectionSkeleton() { /* the JSX */ }
```

**Why this is better**: `EventSection` becomes purely about rendering an event. The skeleton's visual layout evolves independently in its own file.

---

### ISSUE-12: `LecturesPage.renderDefaultGrid` interleaves 5 layout patterns inline

**Severity**: Medium
**Principle**: SLA Violation
**Location**: `src/views/LecturesPage.tsx:221-284`

A single function `renderDefaultGrid` walks the lectures array and emits 5 different row shapes (horizontal-a, compact, horizontal-b, featured, wide). Each `rows.push(...)` is a 6-12 line JSX block. Adjacent to it is `renderTwoColumnRows` and `renderLoadingGrid`. The component owns ~150 lines of layout logic.

#### Current (Bad) — `src/views/LecturesPage.tsx:227-277` (one of five patterns shown)

```tsx
while (idx < lectures.length) {
  if (idx + 2 > lectures.length) break
  rows.push(
    <div key={`row-horizontal-a-${idx}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
      <LectureCard lecture={lectures[idx]} variant="horizontal" textLoading={textSkeletonLoading} />
      <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
      <LectureCard lecture={lectures[idx + 1]} variant="horizontal" textLoading={textSkeletonLoading} />
    </div>,
  )
  idx += 2

  // ...4 more push blocks with different variants
}
```

#### Recommended (Good)

```tsx
// src/components/LectureGridRow.tsx — one row, configured by a pattern descriptor
const PATTERN: RowSpec[] = [
  { size: 2, variant: 'horizontal' },
  { size: 2, variant: 'compact' },
  { size: 2, variant: 'horizontal' },
  { size: 3, variants: ['vertical', 'featured', 'vertical'] },
  { size: 1, variant: 'horizontal' },
]

export default function LectureGrid({ lectures, textLoading }: Props) {
  const rows = buildRows(lectures, PATTERN) // pure function
  return <>{rows.map((row, i) => <LectureGridRow key={i} row={row} textLoading={textLoading} />)}</>
}
```

**Why this is better**: the page no longer cares about how lectures get sliced into rows. The pattern becomes data, the row component becomes the unit of visual change.

---

## Recommendations Summary

| Priority | Issue                                                                     | Effort | Impact |
|----------|---------------------------------------------------------------------------|--------|--------|
| 1        | ISSUE-03: `useFilteredList` hook for list pages                            | Medium | High   |
| 2        | ISSUE-02: `AppLayout` + `AdminLayout` components                           | Low    | High   |
| 3        | ISSUE-01: Extract page-level sub-components per ISSUE-02/03/12             | Medium | High   |
| 4        | ISSUE-04: `useLocalizedFetch` hook                                         | Low    | Medium |
| 5        | ISSUE-08: Add `description` to `mapEventRow`, drop client fallbacks        | Low    | Medium |
| 6        | ISSUE-06: Replace `fetch('/api/admin/...')` with `api.admin.*`             | Low    | Medium |
| 7        | ISSUE-05: Promote `api` to a class with constructor-injected config       | Medium | Medium |
| 8        | ISSUE-12: Pattern-driven `LectureGrid` component                           | Low    | Medium |
| 9        | ISSUE-10: Extract `EventPhaseAction` (shared by UpcomingEvents + EventSection) | Low | Medium |
| 10       | ISSUE-09: Single shared `LoadingBlock` primitive                            | Low    | Low    |
| 11       | ISSUE-07: Move `supabase.auth.updateUser` into `AuthContext`               | Low    | Low    |
| 12       | ISSUE-11: Extract `EventSectionSkeleton`                                    | Low    | Low    |

## Architecture Health Score

| Criterion                    | Score (1-5) | Notes                                                                                       |
|------------------------------|-------------|---------------------------------------------------------------------------------------------|
| Single Level of Abstraction  | 2           | `HomePage` and the small leaf components are exemplary; all major pages mix 3-5 levels.     |
| Component API Design         | 4           | Variant-based `LectureCard`, `FormField`, `FilterDropdown` are well-designed primitives. `EventSection`'s discriminated-union loading prop is good. |
| Data Flow Clarity            | 3           | Parent owns state, callbacks bubble up — but list-page state machines are 12 useStates deep with 5 effects each. |
| API Abstraction Layer        | 3           | `lib/api.ts` exists and is widely used. Loses points for being a singleton object (not a class), admin pages bypassing it, and `AccountSettingsPage` reaching into Supabase. |
| App Layout / Shell           | 1           | No layout component at all. Admin sub-nav duplicated in 4 files; navbar+footer composition repeated in every public page. |
| Code Duplication             | 2           | Locale-refresh, LoadingBlock, table/pagination, action-button-by-phase, filter persistence all duplicated. |
| Composition Patterns         | 3           | `HomePage` and `EventSection` show good composition. The big list pages show none.          |
| **Overall**                  | **2.6**     | Solid primitives, weak composition above the leaf level. Lifting the 3 high-priority items would push this to a 4. |
