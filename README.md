# 15x4

15x4 — це відкритий науково-популярний лекторій, де четверо спікерів за 15 хвилин розповідають про те, що їх по-справжньому захоплює.

Цей репозиторій містить вебплатформу 15x4: публічні сторінки подій та лекцій, особисті кабінети користувачів і адмін-панель для модерації.

## Технології

- Next.js 16 (App Router)
- React 19 + TypeScript
- Supabase (PostgreSQL + supabase-js)
- JWT auth в httpOnly cookie (jose)
- i18next (UA/EN)
- Tailwind CSS v4

## Що є в проєкті

- Публічні сторінки: головна, події, лекції, детальні сторінки, про нас
- Автентифікація: реєстрація, логін, logout, підтвердження email
- Статуси користувача: pending_email -> pending_approval -> approved
- Кабінет користувача: налаштування, власні лекції/події (CRUD)
- Адмін-панель: статистика, керування користувачами, лекціями та подіями
- Локалізація інтерфейсу: українська та англійська

## Структура

- src/app — маршрути Next.js (сторінки та API)
- src/views — page-level React компоненти
- src/components — спільні UI-компоненти
- src/lib — Supabase helper-и, сесії, API-хелпери, email
- src/context — глобальний auth-контекст
- src/locales — переклади (en.json, uk.json)

## Маршрути

### Публічні

- /
- /events, /events/[id]
- /lectures, /lectures/[id]
- /about-us
- /login, /register
- /confirm-email, /wait-approval

### Авторизований користувач

- /account/settings
- /account/lectures, /account/lectures/new, /account/lectures/[id]/edit
- /account/events, /account/events/new, /account/events/[id]/edit

### Адмін

- /admin
- /admin/users
- /admin/lectures
- /admin/events

proxy.ts захищає /account/* та /admin/*, а також робить редіректи за статусом користувача.

## API

### Auth

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- PATCH /api/auth/update
- POST /api/auth/confirm-email
- GET /api/auth/confirm-email?token=...

### Lectures / Events

- GET, POST /api/lectures
- GET, PUT, DELETE /api/lectures/[id]
- GET, POST /api/events
- GET, PUT, DELETE /api/events/[id]

### Admin

- GET /api/admin/stats
- GET /api/admin/users
- PATCH, DELETE /api/admin/users/[id]
- GET /api/admin/lectures
- PATCH, DELETE /api/admin/lectures/[id]
- GET /api/admin/events
- PATCH, DELETE /api/admin/events/[id]

## Локальний запуск

### 1. Встанови залежності

```bash
npm install
```

### 2. Налаштуй змінні оточення (.env)

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_PUBLISHABLE_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
JWT_SECRET="your-super-secret-key"

APP_URL="http://localhost:3000"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="you@example.com"
SMTP_PASS="app-password"
```

### 3. Запусти dev-сервер

```bash
npm run dev
```

Відкрий http://localhost:3000.

## Скрипти

- npm run dev — запуск у dev-режимі
- npm run build — production build
- npm run start — запуск production-версії
- npm run lint — ESLint перевірка

## Примітка по ключах Supabase

- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY безпечний для клієнта.
- SUPABASE_SERVICE_ROLE_KEY використовуй тільки на сервері (API routes), ніколи не віддавай у браузер.
