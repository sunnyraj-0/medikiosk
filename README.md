# MediKiosk.gov.in

A government AYUSH healthcare kiosk web app. Patients pick their language, enter basic
details, book appointments (saved to Supabase), and can talk to a multilingual voice
assistant for symptom guidance and an AYUSH assessment.

**Live demo:** https://medikiosk-gov-in.vercel.app

## Features

- **Language-first flow** — app opens with a language picker (हिंदी, English, ಕನ್ನಡ, தமிழ்);
  the entire UI operates in the chosen language, switchable from any screen.
- **Patient login** — name, age, city, and mobile number (Govt Medical ID path included).
- **Dashboard** — SOS, document scan, live reporting, symptom checker, appointments, records,
  plus logout.
- **Appointment booking** — saves directly to a Supabase `appointments` table (Row Level
  Security protected; reads stay locked).
- **Voice assistant** — hears via the Web Speech API (Chrome/Edge), answers AYUSH questions
  in the selected language, asks follow-up questions, speaks replies aloud, and runs a
  guided 8-question AYUSH assessment.
- **Branding** — MediKiosk logo + Ashoka Chakra watermark on every screen.

## Tech stack

- React 19 + Vite 7 + Tailwind CSS 4
- @supabase/supabase-js (publishable key, client-side)
- Deployed on Vercel

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
```

## Supabase setup

1. Create a table + RLS insert policy by running `supabase/schema.sql` once in the
   Supabase Dashboard → SQL Editor.
2. The client (`src/supabaseClient.js`) uses the project URL and the **publishable** key —
   safe to expose; it can only write rows the RLS policy allows.

Note: bookings are inserted without `.select()` — `INSERT ... RETURNING` would need a
SELECT policy, which is intentionally not granted (patient data stays private).

## Deployment

```bash
npm run build
npx vercel deploy --prod --yes
```

Speech recognition requires HTTPS and a real browser (Chrome/Edge) — the Electron preview
environment cannot reach the cloud recognizer, but the deployed site can.