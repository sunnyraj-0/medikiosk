# MediKiosk.gov.in — UI/UX Specification

> Extracted from the production source (`src/App.jsx`, `src/VoiceAssistant.jsx`).
> Stack: React 18 + Vite + Tailwind CSS v4 (single utility-class system, no custom CSS beyond `@import "tailwindcss"`).
> Product type: Android-tablet-style **health kiosk** for Government AYUSH clinics — one column, max-width phone card, touch-first.

---

## 1. Brand & Design Language

| Attribute | Value |
|---|---|
| Product name | **MediKiosk.gov.in** |
| Tagline | "Government AYUSH Healthcare" |
| Personality | Official/governmental (tricolor, Ashoka Chakra) yet warm and approachable (emoji, rounded shapes, plain language) |
| Visual metaphor | A phone-shaped white card floating on a gray desktop, always centered on screen |
| Signature motifs | ① Tricolor gradient bar (top of every screen) ② Chakra watermark background ③ Circular logo badge |
| Iconography | Emoji only (📄🎤📹💭📅📋📸🧍📷🌿 etc.) — no icon font |
| Illustration | `public/logo.png` (circular MediKiosk logo), `public/chakra.png` (Ashoka Chakra watermark) |

---

## 2. Design Tokens (as used)

### 2.1 Color palette

| Role | Token / Class | Hex reference |
|---|---|---|
| **Primary action** (all CTAs) | `bg-green-700`, hover `bg-green-800` | #15803d / #166534 |
| Primary text-on-action | `text-white` | #fff |
| **Emergency** (SOS, stop-listening) | `bg-red-600`, hover `bg-red-700`; outline: `text-red-600 border-red-300 bg-white hover:bg-red-50` | #dc2626 |
| **Info / accent** (govt ID, voice card) | `bg-blue-600`, `bg-blue-50 border-blue-300` | #2563eb |
| **Highlight wash** (selected states) | `bg-green-50 border-green-700` | #f0fdf4 |
| **Warning banner** | `bg-yellow-50 border-yellow-300 text-yellow-800` | #fefce8 |
| **Error banner** | `bg-red-50 border-red-300 text-red-700` | |
| **Success state** | `bg-green-100` (icon disc), `bg-green-50 border-green-300` (summary card) | |
| **Summary accents** | Prakriti → green · Vikriti → `bg-orange-50 border-orange-300 text-orange-600` · Agni → blue | |
| Page background | `bg-gray-100` | #f3f4f6 |
| Card surface | `bg-white` | #fff |
| Section header strip | `bg-gray-50 border-b border-gray-200` | |
| Card titles / body | `text-gray-900` / `text-gray-700` | |
| Muted / labels-small | `text-gray-600`, `text-gray-500`, `text-gray-400` (disclaimer) | |
| Input borders | `border-gray-300` | #d1d5db |
| Chakra watermark color | `#001f7f` at **opacity-10** (full-screen image) and **opacity-5** (in-card SVG) | |

### 2.2 Typography (Tailwind default stack)

| Use | Classes |
|---|---|
| Screen title (h1) | `text-2xl font-bold text-gray-900` |
| Section title (h2) | `text-lg font-bold text-gray-900` |
| Card heading (h3) | `text-sm font-bold text-gray-900` |
| Body / description | `text-sm text-gray-700 font-medium` |
| Form labels | `block text-sm font-semibold text-gray-800 mb-1|2` |
| Header strip (eyebrow) | `text-xs font-semibold text-gray-600 uppercase` (numbered: "4. MAIN DASHBOARD") |
| Chips / micro | `text-[11px] font-semibold`, `text-[10px]` |
| Buttons | `font-semibold` (CTAs), `font-bold` (SOS, send, mic) |

### 2.3 Shape, spacing, elevation

| Token | Value |
|---|---|
| Card radius | `rounded-xl` (12px); chat bubbles `rounded-2xl` with one square corner |
| Controls radius | `rounded-lg` (8px); language chips `rounded-full` |
| Card shadow | `shadow-lg`; chat bubbles `shadow-sm`; logo `shadow-lg` |
| Page padding | `p-4`; content gutter `px-6`; header strips `px-4 py-3` |
| Card width | `w-full max-w-sm` (384px) — the "kiosk phone" |
| Card height | `h-screen` inner column; long screens add `overflow-y-auto` |
| Standard button height | `py-2.5` (fields) / `py-3` (CTA) / `py-4` (SOS) |
| Grid | 2-col grids (`grid-cols-2 gap-2|3`) for dashboard tiles, body parts, language mini-buttons |

---

## 3. Global Layout System ("Kiosk Frame")

Every screen is composed the same way, top to bottom:

```
┌─────────────────────────────────┐
│ ① Tricolor bar   h-2, gradient orange-400 → white → green-700 │
│ ② Language switcher bar (all screens except language-select)   │
│    logo 28px + 4 language chips (active = green-700 pill)      │
│ ③ White card (max-w-sm, rounded-xl, shadow-lg, overflow-hidden)│
│    ③a Chakra watermark inside card (SVG, opacity-5, centered)  │
│    ③b Section header strip: eyebrow label (+ optional actions) │
│    ③c Screen content (px-6)                                    │
│ ④ Chakra PNG watermark behind card (full-screen, opacity-10)   │
└─────────────────────────────────┘
Page: min-h-screen bg-gray-100, card centered (flex)
```

**Header strip variants** (all: `bg-gray-50 px-4 py-3 border-b border-gray-200`):
- Plain: eyebrow text only
- With back button: `‹` 32×32 bordered square left, centered title, 32px spacer right (Appointments, Voice Assistant)
- With actions: title left + `⎋ Logout` button right (Dashboard)

**Numbered eyebrows** preserve the onboarding metaphor: "2. GOVT ID LOGIN", "3. VOICE PREFERENCE", "4. MAIN DASHBOARD", "5. …".

---

## 4. Component Inventory

### 4.1 Buttons

| Variant | Classes | Usage |
|---|---|---|
| Primary CTA | `w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition` | Continue, Send OTP, Confirm Booking, Open Camera |
| Primary small | same with `py-2` + `text-sm` | Use Voice Mode |
| Secondary / outline | `w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition` | Back, Govt Medical ID, Text Only Mode |
| Danger filled | `w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg` | 🚨 SOS |
| Danger outline | `text-xs font-bold text-red-600 border border-red-300 bg-white rounded-lg px-3 py-1.5 hover:bg-red-50` | ⎋ Logout |
| Disabled | `disabled:opacity-60` | Confirm Booking while saving |
| Icon square | `w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg font-bold hover:bg-gray-100` | ‹ back, 🔊/🔇 mute |
| Option (list) | `w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-left hover:border-green-700 hover:bg-green-50` | Assessment answers |
| Language chip | active: `bg-green-700 text-white rounded-full` / idle: `bg-white text-gray-700 border border-gray-300` | Global switcher + assistant |

### 4.2 Form fields

Uniform pattern: label (`text-sm font-semibold text-gray-800 mb-1`) + input
`w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm`.
Types: `text`, `tel` (phone digits-only, max 10; age max 3), `date` (min = today), `select`, `textarea rows=2`.
Pair fields share a `grid grid-cols-2 gap-3` (Age+City, Date+Time slot).
Phone inputs sanitize: `value.replace(/\D/g, '').slice(0, 10)`.

### 4.3 Feedback & status

- **Info banner**: blue wash card with emoji + copy (voice assistant pitch).
- **Warning banner**: yellow wash (browser doesn't support voice / Electron limitation).
- **Error banner**: red wash, `text-xs font-semibold` (booking failure, form validation).
- **Success card**: ✅ in green disc, heading, green summary card of booked details.
- **Progress bar**: `h-1 bg-gray-300 rounded-full` track + `bg-green-700` fill (width %).
- **Status pills** (chat): centered `rounded-full text-[10-11px] font-bold` —
  red `animate-pulse` "🔴 Listening…", blue "🔊 Speaking…", green "AYUSH check — question N of 8".

### 4.4 Chat bubbles (voice assistant)

- User: right-aligned, `bg-green-700 text-white rounded-2xl rounded-br-sm max-w-[88%]`.
- Assistant: left-aligned, `bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm`.
- `whitespace-pre-wrap leading-relaxed text-sm`.

---

## 5. Screens (12)

### 0. Language Select — `languageSelect` *(entry point)*
Centered logo 96px → title **MediKiosk.gov.in** → "Choose your preferred language" → **4 full-width language rows** (flag emoji 24px, native name bold 16px + English sub-label, active row = solid green with ✓) → Continue CTA. No switcher bar on this screen.

### 1. Phone Login — `phoneLogin`
Hero: logo 112px → title → "Government AYUSH Healthcare". Form: **Full Name\***, **Age + City** (2-col), **Mobile Number\*** (10 digits), Send OTP CTA, divider "or login with govt ID", outline button **Govt Medical ID**. Validation: name + 10-digit phone required.

### 2. Govt ID Login — `govtIDLogin`
Blue 📋 disc 48px → "Government Login" → "ABDM / Ayushman Bharat". **ID Type** select (Aadhaar / Health ID / ABHA) + **ID Number** field → Continue → text-only back link.

### 3. Voice Preference — `voicePreference`
Question headline → **blue card**: 🎙️, "Voice Assistant", sub-copy, 2×2 language mini-buttons, "Use Voice Mode" → "or" → outline **Text Only Mode**. Voice → assistant; Text → dashboard.

### 4. Main Dashboard — `dashboard`
Header strip: "4. MAIN DASHBOARD" + ⎋ Logout. Greeting: "Welcome Back" + patient name (from login) + `age yrs · city` microline. **🚨 SOS full-width red CTA**. Then **2×3 tile grid**: 📄 Scan Document · 🎤 Voice Help · 📹 Live Report · 💭 Symptoms · 📅 Appointments · 📋 My Records — each tile: gray wash, bordered, emoji 24px + 12px bold label, hover = green tint. (Tiles without a target screen are currently inert.)

### 5. Book Appointment — `appointments`
Header with ‹ back. Two states:
- **Form**: intro copy → Full Name\*, Phone\* (10-digit), Department\* select (General Medicine, Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homeopathy), Doctor (optional), Date\* (min today) + Time Slot\* (hourly 9 AM–5 PM) 2-col, Reason textarea, Preferred Language select → **Confirm Booking** (shows "Saving…" while in flight) + Back.
- **Success**: ✅ disc → "Appointment Booked!" → green recap card (Patient / Department / Date · Slot) → "Book Another" (resets form) + "Back to Dashboard".
- Errors render in a red banner with human-readable copy (table missing / RLS / network). Saves to Supabase `appointments` (insert-only; no read-back under RLS).

### 6. Voice Assistant — `voiceAssistant` *(full-screen takeover, own layout)*
Header: ‹ back · "🎙️ VOICE ASSISTANT" + status subline (`हिंदी • 🎤 voice ready` / `⌨️ text mode`) · 🔊/🔇 mute toggle. Language chip row. **Chat area** on gray wash with: browser-support warnings (yellow), message bubbles, AYUSH-progress pill, Listening/Speaking pills. **Input dock**: text field + green ➤ send; full-width **🎤 Tap & Speak** (turns red "⏹ Stop Listening" while live); micro-disclaimer "I'm an AI assistant — for serious or lasting symptoms, please see a doctor."
Behavior: greets in EN/HI; intent brain answers symptoms (headache, fever, stomach, cold, stress, sleep, BP, sugar…), dosha questions, diet/lifestyle; **every answer ends with a follow-up question**; remedy follows the reply; "health check" / "स्वास्थ्य जांच" starts the 8-question guided assessment; TTS speaks replies in the selected language.

### 7. Document Scan — `documentScan`
Copy → **dashed upload target** (`border-2 border-dashed border-green-700 bg-blue-50 p-8`, 📸 36px, "Tap to capture / or upload from gallery") → Open Camera CTA → Back.

### 8. Body Scan (Symptom Checker) — `bodyScan`
"Where does it hurt?" → 🧍 figure card (gray wash) → **2×3 body-part buttons** (Head, Chest, Stomach, Joints, Arms, Legs) → Back.

### 9. Live Reporting / Camera — `camera`
"Capture Patient Photo" → **black 16:9 viewfinder** with 📷 → Start Camera CTA → outline "Continue to Assessment" (jumps to AYUSH questions).

### 10. AYUSH Assessment — `ayushAssessment`
Header "AYUSH ASSESSMENT - Q{n}". Progress bar. Question card (gray wash): emoji category + title (e.g. "🌿 Prakriti Body Constitution") + question line. 4–5 full-width option buttons. **Skip for now** (gray) exits to dashboard.
Question set: Prakriti, Vikriti, Agni, Koshtha, Ahara-Vihara, Nidana, Samprapti, Pariksha.

### 11. Assessment Summary — `summary`
"Your AYUSH Profile" centered → three tinted recap cards: 🌿 Prakriti (green), ⚡ Vikriti (orange), 🔥 Agni (blue), each with answer or "Not answered" → View Full Report (green) + Share with Doctor (outline).

---

## 6. Primary User Flows

```
Language Select
   └→ Phone Login (name/age/city/phone) ─→ Govt ID Login ─→ Voice Preference ─┬→ Voice Assistant
                                       └──────────── (skip via Govt ID btn) ──┘        │
                                                                                       └→ / text → Dashboard
Dashboard ─┬→ Appointments (form → Supabase → success)
           ├→ Voice Assistant (back ↔ dashboard)
           ├→ Document Scan / Body Scan / Camera (→ AYUSH Assessment → Summary)
           └→ Logout → Language Select (resets all session state)
```

Assessment is reachable two ways: Camera screen "Continue to Assessment", or in-chat "health check".

---

## 7. Localization Model

- **First-class screen** for language choice; choice persisted in `localStorage` (`mk_lang`), re-asked each session (shared kiosk).
- **Global switcher bar** on every screen + dedicated chips inside the assistant → instant, full-app re-render.
- Translation dictionary `TRANSLATIONS` covers **en / hi / kn / ta**; fallback chain: selected → English → raw key.
- Assistant content is only fully localized for **en/hi**; kn/ta are recognition/TTS-ready.
- Languages: हिंदी, English, ಕನ್ನಡ, தமிழ் (flags 🇮🇳 except English 🇬🇧).

---

## 8. Interaction Rules & States

| Rule | Detail |
|---|---|
| Validation | Booking needs name + 10-digit phone + date; inline red banner, values preserved on error |
| Async | `saving` disables CTA and swaps label ("Saving…") |
| Errors | Always human-readable, never blank; specific copy for table-missing vs RLS vs network |
| Session reset | Logout clears phone/name/age/city, answers, form, booking state, returns to screen 0 |
| Safe exit | Back buttons on every sub-screen; assistant has ‹ + continuous chat history |
| Trust cues | Tricolor + chakra + numbered steps (official), medical disclaimer under chat input, 🚨 escalation copy in assistant |
| Hover language | Everything hoverable shifts border to green-700 with green-50 wash (consistent affordance) |

---

## 9. Assets

| File | Role | Specs |
|---|---|---|
| `public/logo.png` | App logo: hero (96–112px circles), switcher-bar mark (28px), favicon | square PNG, used rounded-full |
| `public/chakra.png` | Background watermark on all screens | `absolute inset-0 object-cover opacity-10 pointer-events-none` |
| In-code SVG chakra | In-card watermark | `w-72 h-72 opacity-5`, stroke #001f7f |

---

## 10. Rebuild Checklist (for a designer/developer recreating this)

1. Gray page, centered white `max-w-sm rounded-xl shadow-lg` card; tricolor h-2 bar on top.
2. Add language bar (logo + 4 pills) under the tricolor on every screen except the picker.
3. Header strip with uppercase eyebrow (numbered during onboarding); add back/logout actions where specified.
4. Buttons: green filled / white outline / red emergency — exact classes in §4.1.
5. Fields: uniform label+input pattern, 2-col pairs, digit sanitizers on tel inputs.
6. Emoji as icons; 2-col tile grid for the dashboard; dashed green upload target for scans.
7. Chat: green/white bubbles, status pills, big mic button, disclaimer.
8. Feedback: blue info / yellow warning / red error banners; green success card with recap.
9. Wire i18n dictionary with fallbacks; persist language; instant switching.
10. States to cover: idle, saving, success, error, listening, speaking, unsupported-browser.
