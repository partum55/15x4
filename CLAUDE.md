# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check (tsc -b) then bundle for production
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

No test runner is configured.

## Architecture

**Stack:** React 19 + TypeScript + Vite + React Router v7 + i18next

**Key directories:**
- `src/pages/` — Full-page route components with co-located `.css` files
- `src/components/` — Shared UI components with co-located `.css` files
- `src/data/` — Mock data and TypeScript types (`events.ts`, `lectures.ts`)
- `src/locales/` — Translation files (`en.json`, `uk.json`)
- `src/i18n.ts` — i18next config; default language is Ukrainian (`uk`), stored in localStorage

**Routing** (defined in `src/App.tsx`):
```
/                  → HomePage
/events            → EventsPage
/events/:id        → EventDetailPage
/lectures          → LecturesPage
/lectures/:id      → LectureDetailPage
/about-us          → AboutPage
```

**State management:** No global store — all state is local `useState`. No backend API; data comes from static mock arrays in `src/data/`.

**Styling:** Per-component `.css` files (not CSS Modules — plain CSS with BEM-like class names). Global CSS variables for colors are defined in `src/index.css` (e.g., `--color-orange`, `--color-blue`).

**i18n:** Use the `useTranslation()` hook for translated strings. Use `<Trans>` for rich text with embedded HTML. Translation keys follow a nested structure matching the page/section (e.g., `nav.logo`, `about.whoWeAre.title`). Both `en.json` and `uk.json` must be updated together when adding new keys.

**Component variants:** Some components (e.g., `ArchiveLectureCard`) accept a `variant` prop (`'horizontal' | 'compact' | 'vertical' | 'featured'`) to render different layouts from one component.
