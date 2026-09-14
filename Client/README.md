# EventSphere Client

Vite + React frontend for the EventSphere MERN project. Drop this folder in as `Eventsphere/Client`.

## Setup

```bash
cd Client
npm install
npm run dev
```

Dev server: http://localhost:5173  
API proxy: `/api` → `http://localhost:5000` (your Express server)

### Connect to your Server

The app talks to the real EventSphere API **by default** — requests go to relative paths like `/api/auth/login`, which the Vite dev proxy above forwards to your Express server, so no CORS setup is needed in development.

```env
# Optional — point at an absolute server URL instead of the dev proxy
# (needed for production builds not served from the same origin; enable
# CORS on Express if you set this).
VITE_API_URL=http://localhost:5000

# Optional — force the offline demo experience (localStorage + demo
# accounts below) instead of calling the real API.
VITE_DEMO_MODE=true
```

### Demo accounts (`VITE_DEMO_MODE=true` only)

| Role      | Email                     | Password    |
|-----------|---------------------------|-------------|
| admin     | alex@eventsphere.com      | admin123    |
| exhibitor | exhibitor@eventsphere.com | exhibit123  |
| attendee  | attendee@eventsphere.com  | attend123   |

## Signup & account flow

- There is a **single** sign-up form (`/register`). It creates a normal account — the backend always assigns `role: "attendee"`; there is no role picker at signup.
- The real server also requires email verification before `/api/auth/login` succeeds, so after signing up the UI shows a "check your inbox" screen instead of auto-logging in. The link in that email points to `/verify-email/:token`, which calls `GET /api/auth/verify-email/:token`.
- Once logged in, attendees see **"Register as Exhibitor"** and **"Register as Organizer"** on their dashboard home and in the sidebar (`Dashboard → Grow`). These are separate, post-registration flows — never part of the signup form.
  - **Register as Exhibitor** (`/dashboard/become-exhibitor`) submits a real application to `POST /api/exhibitors/apply`. An admin/organizer approval (existing `/api/exhibitors/applications` flow) upgrades the user's role to `exhibitor`.
  - **Register as Organizer** (`/dashboard/become-organizer`) is an informational page: the current server has no self-serve organizer role or application endpoint yet (the `User` role enum is `admin | exhibitor | attendee`), so this connects the button to a real page without inventing a backend API. It becomes a full application flow once the server adds organizer support.

> **Server config note:** `POST /api/auth/register` always tries to send a verification email (`EMAIL_USER`/`EMAIL_PASS` via Nodemailer/Gmail) and treats a failed send as a fatal `500` error, even though the user was already created. Make sure `EMAIL_USER`/`EMAIL_PASS` are set in the Server's `.env`, or signups will appear to fail.

## Features aligned with Server

- Auth: register, login, forgot/reset password, `/api/auth/me`
- Events: list, detail, create, publish
- Registrations + ticket check-in
- Exhibitor applications + participation
- Booths: create, assign, release
- Sessions + session registrations
- Booth visits + feedback
- Favorites, notifications, role dashboards

## SpecularButton

Category cards on the home page and filter chips on `/events` use the React Bits **SpecularButton** (WebGL via `ogl`).

## CORS note

If you set `VITE_API_URL` to the full server origin, enable CORS on Express. Prefer the Vite proxy in development.
