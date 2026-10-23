# API Integration Report

## Frontend Integration

- Axios client: `src/app/api/http.ts`
- JWT storage: `src/app/api/authStorage.ts`
- React Query client: `src/app/api/queryClient.ts`
- Protected routes: `src/app/components/ProtectedRoute.tsx`
- Socket.IO realtime chat: `src/app/hooks/useRealtimeChat.ts`

## Connected Routes

| Frontend Area | API Endpoint |
| --- | --- |
| Auth login/profile/refresh/logout | `/api/auth/*` |
| Dashboard and analytics | `/api/dashboard/*` |
| Live chat and messages | `/api/chats/*` |
| Bot rules CRUD | `/api/bot-rules/*` |
| Bot engine queue/test | `/api/bot-engine/*` |
| Broadcast campaigns | `/api/broadcasts/*` |
| Scheduler | `/api/schedules/*` |
| AI chatbot | `/api/ai/*` |
| Forms | `/api/forms/*` |
| Settings | `/api/settings/*` |
| Evolution status | `/api/evolution/*` |

## Backend Additions

- Added `/api/dashboard` module for summary, trends, activity, health, and campaign performance.
- Added `/api/bot-rules` CRUD module backed by `bot_rules`.
- Added `/api/settings` module backed by `settings`.
- Added `/api/forms` list endpoint backed by `forms`, `form_steps`, and `form_submissions`.
- Added form-submission operations for detail answers, follow-up status and notes, CSV export, and webhook forwarding.
- Added aliases:
  - `/api/ai` -> AI chatbot routes
  - `/api/schedules` -> scheduler routes

## Mock Data Removal

Routed pages now render API data only. Static arrays remaining in routed pages are UI configuration only, such as tab definitions and stat-card metadata, not business/mock records.

## Verification

- Frontend production build: passed with `npm run build`.
- Backend import check: passed with `node --input-type=module -e "import './src/app.js'"`.
- Dashboard service MySQL query check: passed.
