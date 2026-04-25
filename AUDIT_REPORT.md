# 15x4 Logic Audit Report

**Date:** 2026-04-24  
**Auditor:** Claude Code (Sonnet 4.6)  
**Branch:** dev  
**Build status:** PASSES — no TypeScript errors, clean production build

---

## 1. Executive Summary

The 15x4 platform has a solid structural foundation: server-side route guards work correctly for page-level access, the middleware enforces authentication and basic rate limiting, and the admin API routes are consistently protected via `requireAdminSession`. There are no critical security vulnerabilities of the class that would allow privilege escalation or direct data exfiltration by an unauthenticated user.

However, there are several issues that range from medium-to-high severity:

1. **Missing RLS on the `Event` and `Lecture` tables** — the two main content tables have no migration-defined Row Level Security policies. All server-side access is via the service role or a checked user client, but this means any Supabase key leak or direct API call bypassing the Next.js layer can read and mutate all data.
2. **`POST /api/lectures` does not verify event ownership** — any lector can attach their own lecture to any other user's event using a known or guessed event ID.
3. **`PUT /api/lectures/[id]` allows setting required fields to empty strings** — the update handler preserves existing values by default but allows overwriting with empty when fields are explicitly sent as `""`.
4. **`/api/ai/translate` is publicly accessible without authentication** — any unauthenticated user can call the AI translation endpoint and consume the GROQ API key.
5. **In-memory rate limiting resets on every serverless cold start** — the rate-limit store is a module-level `Map` that does not survive process restarts, making the limits ineffective in a Vercel/serverless deployment.
6. **Local dev email confirmations are disabled** (`enable_confirmations = false` in `supabase/config.toml`) — while this is intentional for dev, the production value is unknown from the repo alone and must be explicitly verified.
7. **Admin lecture approval exists as an API endpoint but has no UI surface** — `/api/admin/lectures/[id]/approval` is unreachable from the admin panel.
8. **Several hardcoded English strings** in admin pages bypass the i18n system.

---

## 2. Repository Map

```
/home/parum/Documents/web/15x4
├── middleware.ts                  — Auth + rate-limit middleware
├── next.config.ts                 — Minimal; reactCompiler enabled
├── tsconfig.json                  — strict: true, target ES2017
├── package.json                   — Next 16.2, React 19, @supabase/ssr 0.10
├── supabase/
│   ├── config.toml                — Local dev: email_confirmations=false
│   └── migrations/
│       ├── 20260423_create_profiles_from_auth_users.sql
│       ├── 20260424_add_city_to_profiles.sql
│       ├── 20260425_event_date_time_types.sql
│       └── 20260425_restore_admin_roles.sql
└── src/
    ├── app/
    │   ├── layout.tsx             — SSR initialUser hydration, AuthProvider
    │   ├── page.tsx               — Home page (public)
    │   ├── admin/                 — 4 pages, all server-guarded via requireAdminPage
    │   ├── account/               — Guarded pages (requireManagerPage / requireAuthenticatedPage)
    │   ├── api/
    │   │   ├── admin/             — 6 route groups, all protected by requireAdminSession
    │   │   ├── ai/translate/      — NO auth check
    │   │   ├── events/            — Public GET, auth POST/PUT/DELETE/PATCH
    │   │   ├── lectures/          — Public GET, auth POST/PUT/DELETE
    │   │   ├── profile/           — Auth GET/PATCH
    │   │   └── auth/callback/     — OAuth callback
    │   ├── events/, lectures/     — Public pages
    │   ├── login/, register/      — Auth pages
    │   └── about-us/              — Public
    ├── lib/
    │   ├── auth.ts                — Route access level logic (pure)
    │   ├── auth-server.ts         — Server-side user resolution
    │   ├── auth-guards.ts         — Page-level server guards (redirect helpers)
    │   ├── authz.ts               — API-level role checks
    │   ├── roles.ts               — Role definitions: user/lector/admin
    │   ├── admin.ts               — requireAdminSession()
    │   ├── rate-limit/index.ts    — In-memory rate limiter
    │   ├── supabase-admin.ts      — Service role client (server-only, lazy singleton)
    │   ├── supabase/client.ts     — Browser client (anon key)
    │   ├── supabase/server.ts     — SSR client (anon key + cookies)
    │   └── date-time.ts, email.ts, password-strength.ts
    ├── context/AuthContext.tsx    — Client-side auth state
    ├── hooks/useCurrentUser.ts    — Derived user hook
    ├── views/                     — 18 page view components
    ├── components/                — Shared UI components
    └── locales/en.json, uk.json   — i18n translations
```

**Database tables confirmed in migrations and API code:**
- `public.profiles` — with RLS
- `public."Event"` — **no RLS in migrations**
- `public."Lecture"` — **no RLS in migrations**

---

## 3. Feature Map

| Feature | Status | Evidence | Risk |
|---------|--------|----------|------|
| Public lectures listing (paginated) | Working | `GET /api/lectures` + `LecturesPage.tsx` | Low |
| Public events listing | Working | `GET /api/events` + `EventsPage.tsx` | Low |
| Email/password registration | Working | `AuthContext.tsx:122`, `RegisterPage.tsx` | Medium — confirmations may be off |
| Google OAuth registration/login | Working | `AuthContext.tsx:107`, `auth/callback/route.ts` | Low |
| Email confirmation flow | Partial | Callback route handles exchange, but `enable_confirmations=false` in dev config | High — unknown prod state |
| User login | Working | `AuthContext.tsx:94` | Low |
| Account settings (name, city, password) | Working | `AccountSettingsPage.tsx`, `PATCH /api/profile` | Low |
| My Lectures (lector dashboard) | Working | `MyLecturesPage.tsx`, `requireManagerPage` | Low |
| My Events (lector dashboard) | Working | `MyEventsPage.tsx`, `requireManagerPage` | Low |
| Add/Edit Lecture | Working (with bug) | `AddEditLecturePage.tsx`, `PUT /api/lectures/[id]` allows empty required fields | Medium |
| Add/Edit Event | Working | `AddEditEventPage.tsx`, `PUT /api/events/[id]` validates required fields | Low |
| Admin dashboard stats | Working | `AdminDashboardPage.tsx`, `requireAdminPage` | Low |
| Admin user management (list/role/delete) | Working | `AdminUsersPage.tsx`, `PATCH|DELETE /api/admin/users/[id]` | Low |
| Admin lecture management (list/delete) | Partial | `AdminLecturesPage.tsx` — **approve button missing** | High |
| Admin event management (list/approve/delete) | Working | `AdminEventsPage.tsx`, `PATCH /api/admin/events/[id]` | Low |
| Lecture approval (individual) | Broken/UI-only | Endpoint `/api/admin/lectures/[id]/approval` exists but **no UI surface** | High |
| Event approval (bulk: event + lectures) | Working | `PATCH /api/admin/events/[id]` sets event+lectures isPublic=true | Low |
| Upcoming Events widget with city filter | Working | `UpcomingEvents.tsx`, auto-filters by profile city | Low |
| Bilingual content (UK/EN) | Working | i18n via react-i18next, locale resolution in all APIs | Low |
| AI translation (UK↔EN) | Working (unprotected) | `POST /api/ai/translate` — **no auth** | High |
| Rate limiting | Partial | Middleware applies limits but **in-memory store** resets on cold start | Medium |
| Password strength enforcement | Working | `password-strength.ts`, validated both client and register route | Low |
| Public lecture/event visibility (isPublic flag) | Working | Both GET endpoints filter `isPublic=true` for unauthenticated users | Low |

---

## 4. Critical Issues

### C-1: No RLS on `Event` and `Lecture` Tables

**Severity:** Critical  
**Area:** Database  

**What:** The migrations directory contains only four files. None of them create the `Event` or `Lecture` tables, and none apply `ENABLE ROW LEVEL SECURITY` or `CREATE POLICY` to either table. The `profiles` table has RLS (`migrations/20260423_create_profiles_from_auth_users.sql:17`), but the two primary content tables do not.

**Why it matters:** Row Level Security is the last line of defense in Supabase. Without RLS, any code — whether a Next.js route, a direct API call, a Supabase dashboard query, or a future third-party integration — can read and write all events and lectures without restriction. If the service role key or the anon key is ever leaked or misconfigured, every piece of content is exposed for read and write with no database-level guard.

**Fix:**
```sql
-- Apply to Event table
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read"
ON "Event" FOR SELECT TO anon, authenticated
USING ("isPublic" = true);

CREATE POLICY "events_owner_all"
ON "Event" FOR ALL TO authenticated
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

-- Apply to Lecture table
ALTER TABLE "Lecture" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectures_public_read"
ON "Lecture" FOR SELECT TO anon, authenticated
USING ("isPublic" = true);

CREATE POLICY "lectures_owner_all"
ON "Lecture" FOR ALL TO authenticated
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");
```
Admin operations that bypass RLS should continue to use `supabaseAdmin` (service role), which is already the pattern.

---

### C-2: Lector Can Attach Lecture to Any User's Event (Missing Ownership Check)

**Severity:** Critical  
**Area:** Authorization / IDOR  
**File:** `src/app/api/lectures/route.ts:124–207`

**What:** `POST /api/lectures` requires `lector` or `admin` role (via `requireContentRole`), then directly inserts a new lecture using the caller-supplied `eventId` without verifying that the event belongs to the caller. Any lector who knows or guesses an event UUID can inject lectures into any other user's event.

**Why it matters:** Content integrity is violated. A malicious lector could inject spam lectures into another lector's approved event, force it into review, or pollute content before public visibility. This is an authorization defect, not merely a data-quality issue.

**Fix:**
```typescript
// After access check, add:
const { data: event } = await supabase.from('Event').select('userId').eq('id', eventId).maybeSingle()
if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
if (event.userId !== user.id && access.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

### C-3: `/api/ai/translate` Has No Authentication

**Severity:** Critical (cost exposure)  
**Area:** Security / API  
**File:** `src/app/api/ai/translate/route.ts:9–66`

**What:** The translation endpoint calls Groq's API using `process.env.GROQ_API_KEY`. There is no call to `supabase.auth.getUser()`, no role check, no authentication of any kind. Any anonymous user or automated script can POST to `/api/ai/translate` and consume the GROQ API key budget.

**Why it matters:** Unrestricted access to a paid external API key is a direct cost risk. A single bot can exhaust the API quota causing service disruption for legitimate users.

**Fix:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

---

## 5. High Priority Issues

### H-1: Lecture Approval Has No Admin UI (Dead Endpoint)

**Severity:** High  
**Area:** Feature completeness  
**Files:** `src/app/api/admin/lectures/[id]/approval/route.ts`, `src/views/AdminLecturesPage.tsx:219–290`

**What:** The PATCH endpoint at `/api/admin/lectures/[id]/approval` correctly sets `isPublic` on a lecture. However, `AdminLecturesPage.tsx` shows an `isPublic` indicator (line 249) but has no "Approve" or "Unpublish" button. The admin can only delete individual lectures; there is no way to approve them from the UI.

**Why it matters:** The stated moderation workflow (lector submits → admin approves → appears on public pages) is incomplete for individual lectures. Events can be approved (which bulk-approves their lectures), but standalone lectures submitted via `/api/lectures` POST cannot be individually approved through the admin UI.

**Fix:** Add an approve/unpublish button in `AdminLecturesPage.tsx` that calls `PATCH /api/admin/lectures/${id}/approval` with `{ isPublic: true/false }`. The API endpoint already works correctly.

---

### H-2: In-Memory Rate Limiter Does Not Survive Serverless Cold Starts

**Severity:** High  
**Area:** Security / Reliability  
**File:** `src/lib/rate-limit/index.ts:6`

**What:** The rate limiter stores state in a module-level `Map<string, RateLimitEntry>`. On a serverless platform (Vercel, AWS Lambda), each request may hit a different function instance with a fresh empty store. An attacker making 10 rapid requests gets 10 separate fresh buckets across instances, each allowing the full limit.

**Why it matters:** The rate limit provides zero protection in a multi-instance deployment. Brute-force attacks on `/auth/callback` and write endpoints are not mitigated.

**Fix:** Replace the in-memory store with a Supabase table-based counter, Upstash Redis (available on Vercel Marketplace), or Vercel KV. This is a must-fix before production if multi-instance deployment is used.

---

### H-3: `PUT /api/lectures/[id]` Allows Clearing Required Fields

**Severity:** High  
**Area:** Data integrity / Validation  
**File:** `src/app/api/lectures/[id]/route.ts:115–136`

**What:** The PUT handler uses the pattern `titleUk: titleUk !== undefined ? String(titleUk).trim() : lecture.titleUk`. Sending `{ titleUk: "" }` sets `titleUk` to an empty string after `.trim()`. No minimum-length or non-empty check is performed after assignment. The POST handler at `src/app/api/lectures/route.ts:162` does validate `!titleUk`, but the PUT handler does not.

**Why it matters:** A lector can delete the Ukrainian title of their own lecture by sending an update with an empty string, producing content with no visible title in the Ukrainian locale.

**Fix:**
```typescript
// After building the data object:
if (data.titleUk !== undefined && !data.titleUk) {
  return NextResponse.json({ error: 'titleUk is required' }, { status: 400 })
}
if (data.authorUk !== undefined && !data.authorUk) {
  return NextResponse.json({ error: 'authorUk is required' }, { status: 400 })
}
if (data.summaryUk !== undefined && !data.summaryUk) {
  return NextResponse.json({ error: 'summaryUk is required' }, { status: 400 })
}
```

---

### H-4: Email Confirmation Disabled in Local Dev Config (Production State Unknown)

**Severity:** High (if production mirrors local config)  
**Area:** Authentication  
**File:** `supabase/config.toml:216`

**What:** `enable_confirmations = false` appears twice in `config.toml`. This is a local Supabase config, not the Supabase cloud dashboard setting, so it does not directly affect production. However, no `.env.example` or documentation was found specifying that confirmations must be enabled in the cloud project. The `AuthContext.tsx:132` signUp handler checks `if (data.session)` to detect "already confirmed" vs. "needs confirmation" — this logic is correct, but only if the cloud project has confirmations enabled.

**Why it matters:** If the Supabase cloud project also has email confirmation disabled (common when copying local config to cloud), any user can register and immediately access the platform without verifying their email address. This enables fake accounts and allows email typos to create unrecoverable accounts.

**Action:** Verify in the Supabase cloud dashboard that "Confirm email" is enabled. This cannot be confirmed from the codebase alone.

---

### H-5: `AdminDashboardPage` Fetches Stats Before Auth Is Confirmed Client-Side

**Severity:** High (information leak risk, low practical impact)  
**Area:** Admin / Security  
**File:** `src/views/AdminDashboardPage.tsx:29–35`

**What:** The stats `useEffect` (line 29) has no dependency array guard — it fires unconditionally on first render, before the `loading` state resolves or the `user.profile.role` is confirmed to be `admin`. The page.tsx (`src/app/admin/page.tsx`) calls `requireAdminPage` server-side, which redirects non-admins before the component renders. So in practice, this only matters if the server-side guard is ever bypassed.

**Why it matters:** In the current architecture the server guard prevents non-admins from seeing the page, but if the guard were ever removed or misconfigured, a non-admin user who somehow reached the page would trigger a fetch to `/api/admin/stats` — which is itself API-protected and would return 403. The practical risk is low, but the pattern is architecturally incorrect. The `AdminUsersPage` (line 41) makes the same mistake, fetching users regardless of client-side auth state.

**Fix:** Add a guard to both stats and users effects:
```typescript
useEffect(() => {
  if (loading || !user || user.profile?.role !== 'admin') return
  fetch('/api/admin/stats')...
}, [loading, user])
```

---

## 6. Medium / Low Priority Issues

### M-1: No Image URL Validation in API Routes

**Severity:** Medium  
**Files:** `src/app/api/events/route.ts:188`, `src/app/api/lectures/route.ts:170–194`

The `image` field is accepted as any non-empty string. No validation checks that it is a valid HTTP/HTTPS URL. A lector can store `javascript:alert(1)` as the image URL. The frontend renders it via `<Image src={...} unoptimized>` or `style={{ backgroundImage: url(...) }}`, which in modern browsers prevents XSS for `<img>` tags but CSS `url()` injection is a lower risk. The `registrationUrl` field in events has the same gap — no server-side URL validation.

**Fix:** Add URL format validation to both `image` and `registrationUrl` fields in all POST and PUT handlers:
```typescript
function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch { return false }
}
```

---

### M-2: `sources` and `socialLinks` Are Parsed with `JSON.parse(String(row.sources))` Without Try/Catch

**Severity:** Medium  
**Files:** `src/app/api/events/[id]/route.ts:32–33`, `src/app/api/lectures/route.ts:21–22`, `src/app/api/lectures/[id]/route.ts:22–23`

These `JSON.parse` calls will throw a runtime error if the stored value is not valid JSON (e.g., if it was written directly to the DB outside the API). The catch at the route level would return a 500 error, but the error location would be obscure.

**Fix:** Use a try/catch wrapper:
```typescript
function safeParse(value: unknown) {
  if (!value) return null
  try { return JSON.parse(String(value)) } catch { return null }
}
```

---

### M-3: Admin `listUsers` Loads All Auth Users for Every Admin Request

**Severity:** Medium (scalability)  
**Files:** `src/app/api/admin/users/route.ts:23`, `src/app/api/admin/events/route.ts:34`

`supabaseAdmin.auth.admin.listUsers()` fetches all users from Supabase Auth with no pagination. As the user base grows, this will become slow and memory-intensive. Currently called on every admin users/events page load.

**Fix:** Use the paginated form `listUsers({ page: 1, perPage: 1000 })` or maintain a cached email mapping.

---

### M-4: Lector Can Attach Lecture to a Nonexistent Event ID

**Severity:** Medium (related to C-2)  
**File:** `src/app/api/lectures/route.ts:173`

Since `eventId` is not validated against existing events, a lector can pass any UUID string as `eventId`. The Supabase insert will succeed if there is no FK constraint on `eventId → Event.id`. If a FK constraint does exist (unknown since no migration creating these tables is present), the insert will fail with a 500 error.

---

### M-5: `MyEventsPage` Contains Hardcoded English Plural String

**Severity:** Low  
**File:** `src/views/MyEventsPage.tsx:73`

```tsx
{event.lectures?.length ?? 0} {(event.lectures?.length ?? 0) === 1 ? 'lecture' : 'lectures'}
```
This string is not translated and ignores the active locale. In Ukrainian locale, a user will see "1 lecture" or "2 lectures" in English.

---

### M-6: Admin Table Headers Are Hardcoded English

**Severity:** Low  
**Files:** `src/views/AdminLecturesPage.tsx:223`, `src/views/AdminEventsPage.tsx:225–226`

- `AdminLecturesPage`: `<th>Title</th>` — not translated
- `AdminEventsPage`: `<th>Location</th>`, `<th>Lectures</th>` — not translated

These bypass the i18n system. While admin is likely English-only in practice, it breaks the bilingual contract.

---

### M-7: Admin "Edit" Button Uses `defaultValue: 'edit'` Fallback

**Severity:** Low  
**Files:** `src/views/AdminLecturesPage.tsx:260`, `src/views/AdminEventsPage.tsx:255`

Translation keys `admin.lectures.edit` and `admin.events.edit` are missing from both `en.json` and `uk.json`. The components fall back to the hardcoded `defaultValue: 'edit'`. This works but silently bypasses the translation system.

**Fix:** Add `"edit": "edit"` / `"edit": "редагувати"` to both locale files under `admin.lectures` and `admin.events`.

---

### M-8: Admin Pages Load User Data Without Auth Gate on Client

**Severity:** Low (see H-5)  
**File:** `src/views/AdminUsersPage.tsx:41–47`

The `useEffect` that fetches `/api/admin/users` has no dependency guard on `user` or `loading`. Since the server page component redirects non-admins before the view renders, this is low risk in practice, but architecturally inconsistent with the rest of the admin pages.

---

### M-9: "Loading..." Text is Hardcoded in All Admin Pages

**Severity:** Low  
**Files:** `src/views/AdminUsersPage.tsx:181`, `src/views/AdminLecturesPage.tsx:215`, `src/views/AdminEventsPage.tsx:215`

All three admin pages render `<p>Loading...</p>` as a raw English string. For a bilingual application this should use a translation key.

---

### M-10: Hardcoded Ukrainian Alt Text in UpcomingEvents

**Severity:** Low  
**File:** `src/components/UpcomingEvents.tsx:180`

```tsx
alt={`Подія 15x4 у ${event.city}`}
```
This is hardcoded Ukrainian. English-locale users will see a Ukrainian alt text for screen readers.

---

### M-11: "Translate" Button Label Hardcoded in Form Pages

**Severity:** Low  
**Files:** `src/views/AddEditLecturePage.tsx:260`, `src/views/AddEditEventPage.tsx:360`

```tsx
{translating ? '...' : 'Translate'}
```
The label "Translate" and the ellipsis `'...'` are not translated.

---

### M-12: `supabase/config.toml` Local Dev Has `enable_confirmations = false` in Two Places

**Severity:** Informational  
**File:** `supabase/config.toml:216, 251`

The setting appears twice, once in the base `[auth.email]` section and once in what appears to be a second block. Both are `false`. This is inconsistent but harmless for local dev. It should be cleaned up to avoid confusion.

---

## 7. Auth and Permission Matrix

### Intended vs Actual Access by Role

| Route/Action | Guest (unauthenticated) | User (role=user) | Lector (role=lector) | Admin (role=admin) |
|---|---|---|---|---|
| `GET /` (home page) | Allowed | Allowed | Allowed | Allowed |
| `GET /lectures` | Allowed | Allowed | Allowed | Allowed |
| `GET /events` | Allowed | Allowed | Allowed | Allowed |
| `GET /login`, `/register` | Allowed | Redirected away (middleware) | Redirected away | Redirected away |
| `GET /account/settings` | Redirected to /login | Allowed | Allowed | Allowed |
| `GET /account/lectures` | Redirected to /login | Redirected to /account/settings | Allowed | Allowed |
| `GET /account/events` | Redirected to /login | Redirected to /account/settings | Allowed | Allowed |
| `GET /admin` | Redirected to /login | Redirected to /account/settings | Redirected to /account/lectures | Allowed |
| `POST /api/lectures` | 401 | 403 (not lector/admin) | Allowed (no event ownership check) | Allowed |
| `PUT /api/lectures/[id]` | 401 | 403 | Own lectures only | All lectures |
| `DELETE /api/lectures/[id]` | 401 | 403 | Own lectures only | All lectures |
| `POST /api/events` | 401 | 403 | Allowed | Allowed |
| `PUT /api/events/[id]` | 401 | 403 | Own events only | All events |
| `DELETE /api/events/[id]` | 401 | 403 | Own events only | All events |
| `GET /api/admin/*` | 403 | 403 | 403 | Allowed |
| `PATCH /api/admin/lectures/[id]/approval` | 403 | 403 | 403 | Allowed (but no UI) |
| `POST /api/ai/translate` | **Allowed** (BUG) | Allowed | Allowed | Allowed |
| `PATCH /api/profile` | 401 | Allowed | Allowed | Allowed |

**Notes:**
- Middleware redirects are enforced server-side via `middleware.ts` and page-level via `auth-guards.ts`.
- The `user` role (role=user) cannot access `/account/lectures` or `/account/events` — this is by design.
- The `lector` role can create lectures on any event (C-2 above).
- The `admin` role cannot demote themselves (protected in `/api/admin/users/[id]/DELETE`).

---

## 8. Database and RLS Review

### Tables Identified

| Table | RLS Enabled | Policies | Notes |
|---|---|---|---|
| `public.profiles` | Yes | `profiles_select_own` (SELECT), `profiles_update_own_name` (UPDATE name), `profiles_update_own_name` covers city too after migration | Properly protected |
| `public."Event"` | **No** | **None** | Critical gap |
| `public."Lecture"` | **No** | **None** | Critical gap |

### Profiles Table Policies

Defined in `migrations/20260423_create_profiles_from_auth_users.sql:26–37`:

- `profiles_select_own`: `FOR SELECT TO authenticated USING (auth.uid() = id)` — users can only read their own profile row.
- `profiles_update_own_name`: `FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)` — users can update their own row.

Column-level grants: `GRANT UPDATE(name) ON public.profiles TO authenticated` (extended to include `city` in migration 20260424).

**Gap:** The `profiles_select_own` policy means a user cannot select another user's profile. However, the admin API uses `supabaseAdmin` (service role) which bypasses RLS, so admin operations remain functional.

**Gap:** There is no SELECT policy for `anon` — unauthenticated users cannot query profiles. This is correct behavior.

### Cascade Behavior

- `profiles.id` references `auth.users(id) ON DELETE CASCADE` — deleting a user from Supabase Auth cascades to their profile row.
- No cascades exist for `Event` or `Lecture` because no FK constraints are defined in the migrations. If a user is deleted while they have events/lectures, the events/lectures become orphaned (userId pointing to a deleted user). The admin delete handler (`/api/admin/users/[id]/DELETE`) deletes from auth first, which cascades to profiles, but event/lecture rows survive.

### Missing FK Constraints (Observable from API Code)

- `Event.userId` → `auth.users.id` — not in migrations
- `Lecture.eventId` → `Event.id` — not in migrations
- `Lecture.userId` → `auth.users.id` — not in migrations

---

## 9. Route Protection Review

| Route | Access Level | Server Guard | Client Guard | Notes |
|---|---|---|---|---|
| `/` | public | None needed | None | |
| `/events` | public | None needed | None | |
| `/events/[id]` | public | None needed | None | |
| `/lectures` | public | None needed | None | |
| `/lectures/[id]` | public | None needed | None | |
| `/about-us` | public | None needed | None | |
| `/login` | guest only | `redirectAuthenticatedAwayFromAuthPage` via page.tsx | Middleware redirects authenticated users | |
| `/register` | guest only | `redirectAuthenticatedAwayFromAuthPage` via page.tsx | Middleware redirects authenticated users | |
| `/account/settings` | authenticated | `requireAuthenticatedPage` | `useAuth` redirect in view | Double-protected |
| `/account` | authenticated | Server redirect to role-specific page | N/A | Correct |
| `/account/lectures` | manager (lector/admin) | `requireManagerPage` | `useCurrentUser` in view | Double-protected |
| `/account/lectures/new` | manager | `requireManagerPage` | | |
| `/account/lectures/[id]/edit` | manager | `requireManagerPage` | | |
| `/account/events` | manager | `requireManagerPage` | | |
| `/account/events/new` | manager | `requireManagerPage` | | |
| `/account/events/[id]/edit` | manager | `requireManagerPage` | | |
| `/admin` | admin | `requireAdminPage` | Client redirect if not admin | Double-protected |
| `/admin/users` | admin | `requireAdminPage` | Client redirect | |
| `/admin/lectures` | admin | `requireAdminPage` | Client redirect | |
| `/admin/events` | admin | `requireAdminPage` | Client redirect | |
| `GET /api/events` | public (scope=mine: auth) | `supabase.auth.getUser()` in handler | N/A | Correctly filters by isPublic or userId |
| `POST /api/events` | lector/admin | `requireContentRole` | N/A | |
| `PUT /api/events/[id]` | lector/admin + owner | `requireContentRole` + owner check | N/A | |
| `DELETE /api/events/[id]` | lector/admin + owner | `requireContentRole` + owner check | N/A | |
| `PATCH /api/events/[id]` | lector/admin + owner | `requireContentRole` + owner check | N/A | |
| `GET /api/lectures` | public (scope=mine: auth) | `supabase.auth.getUser()` in handler | N/A | |
| `POST /api/lectures` | lector/admin | `requireContentRole` | N/A | **Missing event ownership check** |
| `PUT /api/lectures/[id]` | lector/admin + owner | `requireContentRole` + owner check | N/A | **Missing required field validation** |
| `DELETE /api/lectures/[id]` | lector/admin + owner | `requireContentRole` + owner check | N/A | |
| `GET /api/profile` | authenticated | `getServerAuthUser()` | N/A | |
| `PATCH /api/profile` | authenticated | `supabase.auth.getUser()` | N/A | |
| `GET /api/admin/*` | admin | `requireAdminSession()` | N/A | Consistent |
| `POST /api/ai/translate` | **none** | **None** | **None** | **BUG — C-3** |
| `GET /auth/callback` | public | N/A | N/A | Redirects after code exchange |

---

## 10. Form and Mutation Review

### Registration Form (`RegisterPage.tsx`)

| Field | Required | Client Validation | Server Validation |
|---|---|---|---|
| name | Yes | Non-empty | Via Supabase `user_metadata` (not checked on server) |
| city | Yes | Non-empty | Via Supabase `user_metadata` (not checked on server) |
| email | Yes | Non-empty | Supabase handles format validation |
| password | Yes | Must be "strong" (evaluatePasswordStrength) | Supabase enforces minimum length |
| passwordConfirm | Yes | Must match password | N/A |

- Double-submission: Prevented via `submitting` state (`RegisterPage.tsx:61`).
- City is validated as required on the client but is stored in `user_metadata` not in `profiles` directly. The trigger function `handle_new_profile_for_auth_user` reads it from metadata. If the trigger fails, city is lost.
- Error `AUTH_SIGNUP_FAILED` is a generic code — email-already-exists and other specific errors are not surfaced to the user.

### Add Event Form (`AddEditEventPage.tsx`)

| Field | Required (client) | Required (server) |
|---|---|---|
| titleUk | Yes | Yes |
| cityUk | Yes | Yes |
| date | Yes | Yes (ISO format validated) |
| locationUk | Yes | Yes |
| time | Yes | Yes (HH:MM format validated) |
| image | No (UI) | Yes (server) |
| titleEn, cityEn, locationEn, descriptionUk/En, registrationUrl | No | No |

**Gap:** `image` is required on the server (`if (!... !image)` at `events/route.ts:167`) but the form does not mark it as required or show a validation error. A lector can try to submit without an image, get a 400 error from the server, but see only the generic `t('addEvent.errorSave')` message.

- Double-submission: Prevented via `saving` state.
- Lecture slots: Client enforces ≤4; server enforces ≤4.
- Lecture required fields: Client validates before submit; server re-validates. Client shows `t('addEvent.errorInvalidCategory')` for any invalid lecture, but does not identify which lecture is invalid.

### Add Lecture Form (`AddEditLecturePage.tsx`)

| Field | Required (client) | Required (server POST) | Required (server PUT) |
|---|---|---|---|
| eventId | Yes | Yes | N/A (not changeable via PUT) |
| titleUk | Yes | Yes | **No — can be emptied** |
| authorUk | Yes | Yes | **No — can be emptied** |
| category | Yes | Yes | Validated (category pair) |
| summaryUk | Yes | Yes | **No — can be emptied** |
| image | Yes | Yes | **No — can be emptied** |

- Double-submission: Prevented via `saving` state.
- The form loads both public events and `scope=mine` events for the event dropdown (`AddEditLecturePage.tsx:63–69`). This means a lector sees all public events in their dropdown — directly supporting the C-2 vulnerability.

### Account Settings Form (`AccountSettingsPage.tsx`)

- Name and city can be updated independently; neither is forced non-empty (a user can clear their name, though the server returns an error if `name` is an empty string: `PATCH /api/profile:31–33`).
- Password change: Client validates strength and match. Server validates via `supabase.auth.updateUser({ password })`.
- Double-submission: Prevented via `saving` state.
- **Bug:** `handleSubmit` returns early inside try block for validation errors without triggering `finally` (`setSaving(false)`). If `setError(t('account.settings.errorPasswordRequired'))` fires and then `return`, the `finally` block still runs because it's a try/finally (line 96), so `setSaving(false)` is always called. This is actually correct.

---

## 11. Localization Review

### Key Asymmetry

Using programmatic key comparison: all keys present in `en.json` exist in `uk.json` and vice versa. The two locale files are fully symmetric in key structure.

### Missing Translation Keys (Used in Code but Not in Locales)

| Key Used | File | Fallback | Status |
|---|---|---|---|
| `admin.lectures.edit` | `AdminLecturesPage.tsx:260` | `'edit'` | Missing — uses `defaultValue` |
| `admin.events.edit` | `AdminEventsPage.tsx:255` | `'edit'` | Missing — uses `defaultValue` |

### Hardcoded Strings Not in i18n

| String | File | Line |
|---|---|---|
| `'Translate'` | `AddEditLecturePage.tsx` | 260 |
| `'Translate'` | `AddEditEventPage.tsx` | 360 |
| `'...'` (loading) | `AddEditLecturePage.tsx` | 260 |
| `'...'` (loading) | `AddEditEventPage.tsx` | 360 |
| `'Loading...'` | `AdminUsersPage.tsx` | 181 |
| `'Loading...'` | `AdminLecturesPage.tsx` | 215 |
| `'Loading...'` | `AdminEventsPage.tsx` | 215 |
| `'lecture'/'lectures'` | `MyEventsPage.tsx` | 73 |
| `'Title'` (table header) | `AdminLecturesPage.tsx` | 223 |
| `'Location'` (table header) | `AdminEventsPage.tsx` | 225 |
| `'Lectures'` (table header) | `AdminEventsPage.tsx` | 226 |
| `` `Подія 15x4 у ${event.city}` `` (Ukrainian) | `UpcomingEvents.tsx` | 180 |

### Error Message Coverage

All user-facing error messages for registration, login, account settings, and content forms are translated in both locales. API error responses return English strings (e.g., `"Unauthorized"`, `"Forbidden"`) but these are not displayed to users directly — the UI translates error codes like `AUTH_INVALID_CREDENTIALS`.

---

## 12. Build / Typecheck / Lint Results

### TypeScript

```
npx tsc --noEmit
(no output — zero type errors)
```

TypeScript compilation passes cleanly with `strict: true`. No type errors were found.

### Next.js Production Build

```
npm run build
✓ Generating static pages (28/28)
```

Build passes without errors or warnings. All 36 routes generate correctly. All routes are dynamic (`ƒ`) as expected for a data-driven SSR application.

### Observed Build Notes

- No `next.config.ts` image domains are configured (`domains` or `remotePatterns`). Images use `<Image unoptimized>` throughout, which disables Next.js image optimization. This avoids the domain whitelist issue but also disables all optimization benefits.
- `reactCompiler: true` is enabled in `next.config.ts`. This is a Beta feature in Next.js 16 and could affect component memoization behavior. No issues observed in build output.

---

## 13. Recommended Fix Plan

### Must Before Demo

| Priority | Issue | Effort |
|---|---|---|
| 1 | C-3: Add auth check to `/api/ai/translate` | 5 min |
| 2 | H-1: Add approve/unpublish button to AdminLecturesPage | 30 min |
| 3 | M-5: Translate lecture count in MyEventsPage | 10 min |
| 4 | M-6/M-7/M-9: Add missing translation keys, fix hardcoded strings | 20 min |

### Must Before Production

| Priority | Issue | Effort |
|---|---|---|
| 1 | C-1: Add RLS policies to Event and Lecture tables | 1 hour (migration + test) |
| 2 | C-2: Add event ownership check in `POST /api/lectures` | 15 min |
| 3 | H-2: Replace in-memory rate limiter with persistent store (Upstash/Vercel KV) | 2–4 hours |
| 4 | H-3: Add non-empty validation in `PUT /api/lectures/[id]` | 15 min |
| 5 | H-4: Verify email confirmation is enabled in Supabase cloud dashboard | 5 min (config check) |
| 6 | M-1: Add HTTP URL validation for `image` and `registrationUrl` fields | 30 min |
| 7 | M-2: Wrap `JSON.parse` calls in try/catch | 15 min |
| 8 | M-4: Add FK constraints in a new migration | 30 min (migration) |
| 9 | Add cascade DELETE policy on Event when user is deleted | 30 min (migration) |

### Later / Improvement

| Issue | Effort |
|---|---|
| M-3: Paginate `listUsers` calls in admin routes | 1 hour |
| H-5: Add auth guard to admin stats/users useEffect | 15 min |
| Add `remotePatterns` to `next.config.ts` for image optimization | 30 min |
| Fix double `enable_confirmations` entries in `config.toml` | 5 min |
| Add client-side image URL preview validation in forms | 30 min |

---

## 14. Exact Patch Suggestions

### Patch 1 — Fix C-3: Auth guard on AI translate endpoint

**File:** `src/app/api/ai/translate/route.ts`

```typescript
// Add at top of POST handler, before the body parsing:
export async function POST(req: NextRequest) {
  try {
    // ADD THIS BLOCK:
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // END ADD

    const body = await req.json()
    // ... rest of handler unchanged
```

Also add the import at the top:
```typescript
import { createClient } from '@/lib/supabase/server'
```

---

### Patch 2 — Fix C-2: Event ownership check in POST /api/lectures

**File:** `src/app/api/lectures/route.ts`, inside `POST` handler after `access` check (approximately line 136):

```typescript
// After the requireContentRole check:
const access = await requireContentRole(user.id, supabase)
if (!access.ok) {
  return NextResponse.json({ error: access.error }, { status: access.status })
}

// ADD THIS BLOCK:
if (eventId && access.role !== 'admin') {
  const { data: targetEvent } = await supabase
    .from('Event')
    .select('userId')
    .eq('id', String(eventId))
    .maybeSingle()
  if (!targetEvent) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }
  if (targetEvent.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
// END ADD
```

---

### Patch 3 — Fix H-3: Required field validation in PUT /api/lectures/[id]

**File:** `src/app/api/lectures/[id]/route.ts`, inside `PUT` handler, after the `data` object is built (approximately line 137):

```typescript
const data = { /* ... existing object ... */ }

// ADD AFTER data is built:
if (titleUk !== undefined && !data.titleUk) {
  return NextResponse.json({ error: 'titleUk cannot be empty' }, { status: 400 })
}
if (authorUk !== undefined && !data.authorUk) {
  return NextResponse.json({ error: 'authorUk cannot be empty' }, { status: 400 })
}
if (summaryUk !== undefined && !data.summaryUk) {
  return NextResponse.json({ error: 'summaryUk cannot be empty' }, { status: 400 })
}
if (image !== undefined && !data.image) {
  return NextResponse.json({ error: 'image cannot be empty' }, { status: 400 })
}
// END ADD
```

---

### Patch 4 — Fix M-7: Add missing translation keys

**File:** `src/locales/en.json` — add under `"admin"."lectures"` and `"admin"."events"`:

```json
"admin": {
  "lectures": {
    "edit": "edit",
    // ... existing keys
  },
  "events": {
    "edit": "edit",
    // ... existing keys
  }
}
```

**File:** `src/locales/uk.json`:

```json
"admin": {
  "lectures": {
    "edit": "редагувати",
    // ... existing keys
  },
  "events": {
    "edit": "редагувати",
    // ... existing keys
  }
}
```

---

### Patch 5 — Fix M-5: Translate lecture count in MyEventsPage

**File:** `src/views/MyEventsPage.tsx:73`

Change:
```tsx
{event.lectures?.length ?? 0} {(event.lectures?.length ?? 0) === 1 ? 'lecture' : 'lectures'}
```

To use i18n (add a key `myEvents.lectureCount` to both locales):
```tsx
{t('myEvents.lectureCount', { count: event.lectures?.length ?? 0 })}
```

With locale entries:
```json
// en.json
"myEvents": { "lectureCount": "{{count}} lecture", "lectureCount_other": "{{count}} lectures" }
// uk.json — use Ukrainian plural forms
"myEvents": { "lectureCount": "{{count}} лекція", "lectureCount_few": "{{count}} лекції", "lectureCount_many": "{{count}} лекцій" }
```

---

### Patch 6 — Critical: RLS Migration for Event and Lecture tables

Create a new migration file `supabase/migrations/20260426_add_rls_to_event_lecture.sql`:

```sql
BEGIN;

-- Event table RLS
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_select"
ON "Event" FOR SELECT
TO anon, authenticated
USING ("isPublic" = true);

CREATE POLICY "events_owner_select_own"
ON "Event" FOR SELECT
TO authenticated
USING (auth.uid() = "userId");

CREATE POLICY "events_owner_insert"
ON "Event" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "events_owner_update"
ON "Event" FOR UPDATE
TO authenticated
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "events_owner_delete"
ON "Event" FOR DELETE
TO authenticated
USING (auth.uid() = "userId");

-- Lecture table RLS
ALTER TABLE "Lecture" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectures_public_select"
ON "Lecture" FOR SELECT
TO anon, authenticated
USING ("isPublic" = true);

CREATE POLICY "lectures_owner_select_own"
ON "Lecture" FOR SELECT
TO authenticated
USING (auth.uid() = "userId");

CREATE POLICY "lectures_owner_insert"
ON "Lecture" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "lectures_owner_update"
ON "Lecture" FOR UPDATE
TO authenticated
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "lectures_owner_delete"
ON "Lecture" FOR DELETE
TO authenticated
USING (auth.uid() = "userId");

-- Note: Admin operations use supabaseAdmin (service role) which bypasses RLS.
-- No admin policies needed; service role access is unrestricted by design.

COMMIT;
```

**Important:** After applying this migration, test that all admin API routes still function (they use `supabaseAdmin`), and that the `/api/events/[id]` and `/api/lectures/[id]` GET handlers for private content still work for owners (they use the user-scoped client which will now be subject to RLS, but the `events_owner_select_own` policy allows it).

---

*End of audit report.*
