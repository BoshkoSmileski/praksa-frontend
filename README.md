# Diploma Thesis Management — Frontend

Modern React + TypeScript frontend for the Diploma Thesis Management backend.

Stack: **React 19 / Vite / TypeScript / Tailwind CSS / Zustand / Axios / React Router**.

## Features

- JWT login with persistent session
- Role-based sidebar (Student / Mentor / Admin / Committee / Archive)
- Thesis list + create + detail with workflow timeline
- Mentor picker modal
- PDF drag-and-drop upload with progress
- Versions list + comments per version
- Committee proposal + approval flow
- Defense scheduling, cancellation, grade recording
- Notification history
- Toast notifications + loading skeletons

## Prerequisites

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- The backend running on `localhost:8080`

## Setup

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

Vite proxies `/api/*` to `http://localhost:8080` (configured in `vite.config.ts`), so no CORS setup is needed.

## Test accounts

All passwords: **`password123`**

| Role | Email |
|---|---|
| STUDENT | `student@test.com` |
| MENTOR | `mentor@test.com`, `mentor2@test.com`, `mentor3@test.com` |
| ADMIN | `admin@test.com` |
| COMMITTEE | `committee@test.com` |
| ARCHIVE | `archive@test.com` |

## Project structure

```
src/
├── api/            # Axios client + per-domain services
├── components/
│   ├── layout/     # Sidebar, Header
│   └── ui/         # Modal, Skeleton, StatusBadge, EmptyState, PageHeader
├── features/       # Feature folders (mentor-picker, versions, committee, defense)
├── layouts/        # AuthLayout, AppLayout
├── pages/          # Route-level pages
├── routes/         # AppRouter + ProtectedRoute
├── store/          # Zustand stores (auth)
├── types/          # TS mirrors of backend DTOs
└── utils/          # cn(), date formatting
```

## Architecture highlights

- **Path alias `@/`** — `@/components/Modal` instead of `../../../components/Modal`
- **Zustand `persist`** — auth token + user survive page refresh
- **Axios interceptors** — JWT auto-attached, 401/403 handled globally
- **Vertical slicing** — each `features/<name>/` folder owns its data, state, modals

## Build for production

```bash
npm run build
```

## License

MIT — academic project.
