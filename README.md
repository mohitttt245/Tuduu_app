# Tuduu — personal productivity

Tuduu is a full-stack personal productivity app built with React, Vite, Tailwind CSS, Express, and MongoDB. The app uses HTTP-only JWT cookies and scopes personal records to the signed-in user.

## Requirements

- Node.js 20 or newer
- MongoDB (local or Atlas)

## Run locally

1. Configure `server/.env` with `MONGODB_URI` and a random `JWT_SECRET` of at least 32 characters. `server/.env.example` is the placeholder template. Keep `.env` private; it is ignored by Git.
2. Install dependencies from the project root with `npm install`, `npm install --prefix client`, and `npm install --prefix server`.
3. Run `npm run dev` from the project root.
4. Open `http://localhost:5173`; the Express API listens on port `5000`.

Set `CLIENT_URL` to the exact frontend origin if it differs from `http://localhost:5173`. Password reset email delivery additionally needs `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` in `server/.env`.

The AI assistant is optional. Set `AI_API_KEY` and `AI_MODEL` on the server to enable it. `AI_BASE_URL` can point to an OpenAI-compatible chat completions endpoint; it defaults to OpenAI's endpoint. Never put provider credentials in client environment variables.

## Features implemented

- Account registration, login, logout, profile and password changes, and SMTP-backed password recovery.
- Task create, edit, complete, reopen, pin, archive, restore, and delete; search, filters, sorting, pagination, categories, tags, and subtasks.
- Recurring task occurrences. Completing one occurrence creates the next scheduled occurrence; the completed occurrence stays in history. Weekly schedules can select weekdays.
- Month calendar and in-app notification center. A server worker checks task and habit reminders once per minute while the API is running. Reminder notifications are deduplicated in MongoDB.
- Habit schedules, daily check-ins, history, and streaks. A streak counts consecutive scheduled days completed. If today is a scheduled day and is not complete yet, the current streak is based on the previous scheduled day.
- Pomodoro focus/short-break/long-break timer, task association, and saved completed sessions.
- Analytics for task activity, categories, priorities, habits, and focus sessions with 7-day, 30-day, 90-day, and 12-month views.
- AI assistant with saved conversations, task breakdown into real subtasks, day planning, and priority suggestions that require a user click before applying.
- Light, dark, and system appearance preferences, plus a searchable in-app help guide.
- Responsive desktop sidebar and mobile bottom navigation, quick add (`Ctrl/Cmd+Shift+A` outside text fields), and real database-backed empty states.

## API overview

```text
POST/GET/PUT/DELETE /api/tasks
POST /api/tasks/:id/complete | /reopen | /pin | /archive | /unarchive
GET/POST/PUT/DELETE /api/categories
GET/POST/DELETE /api/tags
GET /api/tasks/calendar?from=...&to=...
GET/PUT/DELETE /api/notifications
GET/POST/PUT/DELETE /api/habits
POST /api/habits/:id/complete
GET/POST /api/pomodoro
GET /api/analytics?range=7|30|90|all
GET /api/ai/conversations
POST /api/ai/chat | /break-task | /plan-day | /prioritize
```

Task reminders are persisted as in-app notifications. Delivery runs while the API process is running; browser push notifications and email reminders are not enabled. Habit reminder times use the user's latest browser timezone offset.

## Project layout

```text
client/  React pages, reusable UI, API client, and responsive styling
server/  Express routes/controllers, Mongoose models, auth middleware, and reminder worker
```
