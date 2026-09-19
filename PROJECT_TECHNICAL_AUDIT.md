# PROJECT TECHNICAL AUDIT: MEDIKIOSK.GOV.IN

> **Audit Execution Date:** 2026-09-19  
> **Repository:** `sunnyraj-0/medikiosk`  
> **Auditor:** Antigravity Autonomous Technical Audit System  
> **Repository Root:** `c:\Users\syedr\Downloads\SIH\medikiosk`  
> **Investigation Scope:** Complete codebase audit (Frontend, Backend, Database, Configuration, Assets, AI/ML, Voice, Multilingual, Security, Deployment)  
> **Audit Mode:** Pure read-only technical investigation and documentation. No code or configuration was modified.

---

## 1. PROJECT OVERVIEW

### Application Purpose
**MediKiosk.gov.in** is a government-style touch-and-voice healthcare kiosk web application designed for Government of India AYUSH (Ayurveda, Yoga & Naturopathy, Unani, Siddha, and Homeopathy) clinics, dispensaries, and rural healthcare centers. The system enables citizens—particularly rural, elderly, or low-literacy patients—to register via mobile or government medical ID, undergo multilingual voice-guided or text-guided symptom triage, receive home remedies and AYUSH guidance, undergo a structured 8-factor clinical assessment, book outpatient department (OPD) appointments, capture and extract physical medical records/prescriptions via computer vision, track a chronological health timeline with red-flag alerts, review medication timings, and manage Digital Personal Data Protection (DPDP Act 2023) ABDM consent.

### Intended Users
1. **Citizens / Patients:** Seeking outpatient care, traditional AYUSH symptom guidance, appointment booking, or medical document storage via a physical kiosk (Android tablet, touchscreen terminal, or public web station).
2. **Kiosk Operators / ASHA Workers / Clinic Staff:** Assisting walk-in patients who cannot navigate English or text interfaces.
3. **Clinic Doctors / OPD Practitioners:** Doctors who retrieve structured patient intake summaries, review AI-parsed medical histories and abnormal lab flags, and issue digital prescriptions tied to issued OPD token numbers.

### Main User Workflows
1. **Onboarding & Authentication Flow:**
   - Splash screen (`intro`) featuring official Ministry of Ayush branding, Emblem of India, and Red Fort backdrop.
   - Language Selection (`languageSelect`) supporting 7 Indian languages.
   - Patient Login (`phoneLogin`) collecting name, age, city, and mobile number.
   - Government ID Login (`govtIDLogin`) supporting Aadhaar, Health ID, and ABHA numbers.
   - Voice Preference Selection (`voicePreference`) choosing between Voice Mode and Text-Only Mode.
   - ABDM Consent Gate (`consentGate`) presenting DPDP Act 2023 data scope with optional audio explanation in native language.
2. **Clinical Triage & Voice Assistant Flow:**
   - Conversational voice/text assistant (`voiceAssistant`) with continuous microphone listening, voice activity detection (VAD), silence auto-detection, and barge-in support.
   - Real-time clinical safety checks detecting 10 red-flag emergencies (chest pain, stroke, seizure, severe breathing difficulty, unconsciousness, etc.) with zero-latency escalation.
   - Dual-engine fallback: Python FastAPI backend powered by Google Gemini (`gemini-3.6-flash`) with natural TTS (`gemini-2.5-flash-preview-tts`), falling back seamlessly to an in-browser rule-based intent engine and Web Speech API if the backend is offline.
   - 8-question guided AYUSH clinical assessment (`ayushAssessment`) calculating Prakriti (constitution), Vikriti (imbalance), and Agni (digestive fire) profiles.
3. **OPD Appointment Booking Flow:**
   - Appointment booking (`appointments`) selecting department, doctor, date, and hourly time slot.
   - Automated AYUSH department recommendation based on free-text patient symptoms.
   - Generation of unique OPD token (`nextToken()` format: `MK-YYYYMMDD-XXX`).
   - Insertion into Supabase PostgreSQL database under locked Row Level Security (insert-only).
4. **Document Scanning & OCR Extraction Flow:**
   - Document scanning (`documentScan`) using device camera stream (`getUserMedia`) or file upload.
   - Multimodal Gemini OCR parsing prescriptions, lab reports, and discharge summaries into structured JSON (medicines, dosages, lab tests, values, units, and abnormal flags).
   - Storage in Supabase `medical_records` and local offline storage mirror.
   - Automatic generation of clinical timeline events and abnormal lab alert flags.
5. **Patient Record, Timeline, & Prescription Lookup Flow:**
   - Prescription lookup (`prescription`) by OPD token number, displaying doctor instructions and medicine times.
   - Chronological medical timeline (`timeline`) aggregating appointments, consent events, assessments, reports, and red-flag alerts.
   - Bilingual AYUSH Knowledge Base (`ayushKB`) displaying English and Hindi medical reference cards.
   - Consent Management (`consentManage`) allowing patients to audit consent history or revoke data sharing.

### Evidence of Medical / Smart India Hackathon (SIH) Use Case
- **Branding & Assets:** `public/gov-india.png`, `public/gov-india-white.png`, `public/emblem.png`, `public/chakra.png`, `public/redfort.svg`, and official Ministry of Ayush / Government of India slogans ("सत्यमेव जयते", "Government AYUSH Healthcare").
- **ABDM / ABHA Standards:** Dedicated screens and fields for Ayushman Bharat Digital Mission (ABDM), ABHA ID, Health ID, and DPDP Act 2023 consent protocols.
- **AYUSH Domain Taxonomy:** Deep AYUSH terminology embedded across code: Prakriti, Vikriti, Agni, Koshtha, Ahara-Vihara, Nidana, Samprapti, Pariksha, Tridosha (Vata, Pitta, Kapha), Kayachikitsa, Shalya Tantra, Shalakya Tantra, Kaumarabhritya, Prasuti Tantra, and Dinacharya.
- **SIH Architecture Style:** Lightweight kiosk UI optimized for low hardware specs (single-column max-width card), rapid offline fallback, multi-tier emergency detection, and dual-backend integration.
- **FHIR R4 Hospital Integration Layer:** `server/medikiosk_voice.py` exposes standard HL7 FHIR R4 `CapabilityStatement` and `Patient` resource endpoints (`/fhir/metadata`, `/fhir/Patient/{session_id}`).

### Current Project Maturity
- **Frontend Core & Navigation:** **High / Functional Prototype** (19 screens implemented in React 19).
- **Voice Assistant (Chat & Audio):** **Functional / Hybrid Prototype** (Gemini server STT/TTS + client-side rule-based fallback).
- **Document OCR:** **Functional Prototype** (Webcam capture / file upload + FastAPI Gemini vision parser).
- **Database:** **Partial / Working Prototype** (Supabase client configured with anonymous insert-only RLS policies; local mirror in `localStorage`).
- **Body Scan & Live Reporting:** **Mock / Incomplete** (`bodyScan` buttons have no click handlers; `camera` does not stream video or capture facial analysis).
- **Backend Architecture:** **Single-script Prototype** (`server/medikiosk_voice.py` uses in-memory dictionary for sessions; no persistent server database).

---

## 2. COMPLETE TECHNOLOGY STACK

| Technology Category | Technology Name | Exact Version | Where Used | Relevant File Paths |
|---|---|---|---|---|
| **Frontend Framework** | React | `^19.0.0` | Entire UI rendering, screen state, form lifecycle | `package.json`, `src/main.jsx`, `src/App.jsx`, `src/VoiceAssistant.jsx` |
| **Frontend DOM Engine** | React DOM | `^19.0.0` | Root mounting to DOM container | `package.json`, `src/main.jsx` |
| **Frontend Language** | JavaScript (ES Module / JSX) | ECMAScript 2022+ | All UI components, services, and clinical utilities | `src/App.jsx`, `src/VoiceAssistant.jsx`, `src/clinical.js`, `src/supabaseClient.js` |
| **Build Tool / Bundler** | Vite | `^7.0.0` | Development server, HMR, production bundling | `package.json`, `vite.config.js`, `index.html` |
| **Build Tool Plugin** | @vitejs/plugin-react | `^5.0.0` | React Fast Refresh and JSX transform in Vite | `package.json`, `vite.config.js` |
| **CSS / UI Framework** | Tailwind CSS | `^4.0.0` | Utility-first styling, CSS custom variants | `package.json`, `vite.config.js`, `src/index.css` |
| **Tailwind Vite Plugin** | @tailwindcss/vite | `^4.0.0` | Vite integration for Tailwind CSS v4 compiler | `package.json`, `vite.config.js` |
| **Icon Library** | Lucide React | `^0.525.0` | ChevronRight, Plus, X icons (partially used; UI predominantly uses emoji) | `package.json`, `src/App.jsx` |
| **Typography / Fonts** | Google Fonts (Noto Sans Multi-script) | Remote CDN | Devanagari, Bengali, Arabic, Kannada, Tamil, Latin font glyphs | `index.html`, `src/index.css` |
| **Backend Framework** | FastAPI | `0.115.0+` (unpinned in requirements) | Python REST API server for voice, chat, OCR, and FHIR | `server/requirements.txt`, `server/medikiosk_voice.py` |
| **Backend ASGI Server** | Uvicorn (standard) | `0.30.0+` (unpinned in requirements) | Running FastAPI ASGI server on `0.0.0.0:8000` | `server/requirements.txt`, `server/medikiosk_voice.py` |
| **Backend Language** | Python | `3.11+` | Backend voice server and dataset generation script | `server/medikiosk_voice.py`, `server/generate_dataset.py` |
| **Backend Multipart** | python-multipart | `0.0.9+` (unpinned in requirements) | Parsing `UploadFile` (multipart/form-data audio and image blobs) | `server/requirements.txt`, `server/medikiosk_voice.py` |
| **Config / Dotenv** | python-dotenv | `1.0.0+` (unpinned in requirements) | Loading environment variables from `server/.env` | `server/requirements.txt`, `server/medikiosk_voice.py` |
| **AI / LLM SDK** | Google GenAI SDK (`google-genai`) | `0.1.1+` (unpinned in requirements) | Official Google SDK for Gemini LLM, Vision, and Audio | `server/requirements.txt`, `server/medikiosk_voice.py` |
| **AI Vision & Chat Model** | Google Gemini 3.6 Flash | `gemini-3.6-flash` | Document OCR extraction, multi-turn clinical chat, STT audio transcription | `server/medikiosk_voice.py` |
| **AI Speech Model (TTS)** | Google Gemini Preview TTS | `gemini-2.5-flash-preview-tts`, `gemini-2.5-pro-preview-tts` | Generating natural speech WAV audio from text | `server/medikiosk_voice.py` |
| **Database Platform** | Supabase (PostgreSQL) | Managed Cloud (`supabase.co`) | Relational database with Row Level Security (RLS) | `src/supabaseClient.js`, `supabase/schema.sql` |
| **Database Client** | @supabase/supabase-js | `^2.115.0` | Client-side PostgreSQL query builder and RLS data insertion | `package.json`, `src/supabaseClient.js`, `src/App.jsx` |
| **Client Storage** | HTML5 localStorage & sessionStorage | Web API standard | Offline data mirror, theme, language, token sequence, consent log | `src/App.jsx`, `src/VoiceAssistant.jsx`, `src/clinical.js` |
| **Voice Audio Input** | Web Audio API & MediaRecorder | W3C Web API | Microphone capture (`audio/webm`), live RMS level meter, silence detection | `src/VoiceAssistant.jsx` |
| **Voice STT Fallback** | Web Speech API (`SpeechRecognition`) | W3C Browser API | Browser-native speech recognition when Python server is unreachable | `src/VoiceAssistant.jsx` |
| **Voice TTS Fallback** | Web Speech API (`SpeechSynthesis`) | W3C Browser API | Browser-native voice output when backend TTS is unreachable or muted | `src/VoiceAssistant.jsx`, `src/App.jsx` |
| **Health Standard / Interoperability** | HL7 FHIR R4 | `4.0.1` | CapabilityStatement and Patient bundle export for hospital EMR | `server/medikiosk_voice.py` |
| **Package Manager (JS)** | npm | `10.8.2` | Dependency resolution and scripts runner | `package.json`, `package-lock.json` |
| **Package Manager (Python)** | pip / venv | Built-in | Python virtual environment package management | `server/requirements.txt` |
| **Deployment Platform** | Vercel | CLI `^59.11.7` | Static web deployment for frontend (`medikiosk-gov-in.vercel.app`) | `package.json`, `README.md`, `.gitignore` |

---

## 3. REPOSITORY STRUCTURE

```text
medikiosk/
│
├── .gitignore                         # Git exclusion rules (node_modules, dist, server/.env, venv)
├── index.html                         # HTML5 entry point; Google Font preconnects (Noto Sans multi-script)
├── package.json                       # Node dependencies (React 19, Vite 7, Tailwind 4, Supabase JS)
├── package-lock.json                  # Deterministic Node dependency tree
├── vite.config.js                     # Vite build configuration with React & Tailwind plugins
├── README.md                          # Project documentation, live demo link, Supabase instructions
│
├── docs/
│   └── UI-UX-SPEC.md                  # Comprehensive UI design specification, tokens, layouts, screens
│
├── public/                            # Static assets served at root
│   ├── chakra.png                     # Ashoka Chakra high-res background watermark (296 KB)
│   ├── emblem.png                     # National Emblem of India ("सत्यमेव जयते") (116 KB)
│   ├── gov-india.png                  # Government of India header logo - dark text (13 KB)
│   ├── gov-india-white.png            # Government of India logo - white text for splash (7.3 KB)
│   ├── logo.png                       # MediKiosk official circular seal badge (375 KB)
│   └── redfort.svg                    # Red Fort architectural silhouette vector (2.7 KB)
│
├── src/                               # Frontend source code
│   ├── main.jsx                       # React 19 application entry point (`createRoot`)
│   ├── App.jsx                        # Primary application controller: state, 19 screens, translations, camera
│   ├── VoiceAssistant.jsx             # Conversational voice assistant: VAD, backend client, offline NLP
│   ├── clinical.js                    # Clinical safety engine: red-flag regex, alerts, medical timeline, tokens
│   ├── supabaseClient.js              # Supabase client instantiation and endpoint credentials
│   └── index.css                      # Tailwind v4 import, Noto Sans typography, and full dark-theme mappings
│
├── server/                            # Python AI voice & document extraction backend
│   ├── requirements.txt               # Python package dependencies (FastAPI, uvicorn, google-genai)
│   ├── medikiosk_voice.py             # FastAPI server: Gemini chat, multimodal voice, document OCR, TTS, FHIR
│   ├── generate_dataset.py            # Dataset generator: compiles 205 clinical few-shot examples
│   └── data/                          # Dataset output directory
│       ├── medikiosk_voice_assistant_starter_dataset.jsonl   # 205 JSONL lines loaded into Gemini prompt
│       └── medikiosk_voice_assistant_starter_dataset.csv     # Tabular version of the clinical intent dataset
│
└── supabase/                          # Database schema and security policies
    └── schema.sql                     # PostgreSQL schema: appointments, prescriptions, medical_records, RLS
```

---

## 4. FRONTEND ARCHITECTURE

### Entry Point
- **File:** [`index.html`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/index.html) mounts `<div id="root"></div>` and imports [`src/main.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/main.jsx).
- **Execution:** [`src/main.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/main.jsx) wraps `<App />` inside React `<StrictMode>` and renders via `createRoot(document.getElementById('root'))`.

### Routing Architecture
- **Routing Engine:** State-driven conditional rendering. There is **no client-side router** (such as `react-router-dom` or `@tanstack/react-router`).
- **Screen Controller:** Managed via `currentScreen` state inside [`src/App.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L922) (`useState('intro')`).
- **Screen Transitions:** Screens transition imperatively via `setCurrentScreen('screenName')`.
- **Browser History:** Browser back/forward navigation is not wired; all navigation relies on in-screen buttons (`renderBackButton('targetScreen')`).

### Complete Screen Inventory (19 Screens)

| # | Screen Identifier | Purpose & User Functionality | State & Interactions | File Path & Lines |
|---|---|---|---|---|
| 1 | `intro` | Official Ministry of Ayush splash screen with tricolor gradient, Red Fort vector, and Emblem of India | Tap anywhere advances to `languageSelect` | [`src/App.jsx#L1432-L1455`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1432-L1455) |
| 2 | `languageSelect` | First-class language selection (7 languages: Hindi, English, Kannada, Tamil, Marathi, Bengali, Urdu) | Sets `appLang`, `selectedLanguage`, saves `mk_lang` in localStorage | [`src/App.jsx#L1458-L1508`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1458-L1508) |
| 3 | `phoneLogin` | Patient registration with Full Name, Age, City, and 10-digit Phone Number | Form validation (name + 10 digits); bypass button to Govt ID | [`src/App.jsx#L1511-L1592`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1511-L1592) |
| 4 | `govtIDLogin` | Government identification entry (Aadhaar, Health ID, ABHA) | Select ID type + enter number; advances to `voicePreference` | [`src/App.jsx#L1595-L1647`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1595-L1647) |
| 5 | `voicePreference` | Choice between interactive Voice Mode and Text-Only Mode | Routes to `consentGate` if consent not yet granted; else dashboard/voice | [`src/App.jsx#L1650-L1711`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1650-L1711) |
| 6 | `consentGate` | ABDM DPDP Act 2023 consent gate with optional text-to-speech audio explanation | Grants consent via 'audio' or 'text'; writes to `sessionStorage` & log | [`src/App.jsx#L2415-L2479`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2415-L2479) |
| 7 | `dashboard` | Central kiosk menu: SOS emergency button, active clinical alerts, token, medicine schedule, 10 action tiles | Navigates to all sub-features; displays patient name and details | [`src/App.jsx#L1714-L1834`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1714-L1834) |
| 8 | `appointments` | OPD appointment booking: department, doctor, date, slot, reason | Inserts into Supabase `appointments`; generates OPD token | [`src/App.jsx#L1837-L1986`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1837-L1986) |
| 9 | `voiceAssistant` | Dedicated full-screen conversational assistant | Renders `<VoiceAssistant />` component | [`src/App.jsx#L1989-L1997`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1989-L1997), [`src/VoiceAssistant.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx) |
| 10 | `documentScan` | Live camera document capture or upload; triggers AI parsing; presents review screen; saves record | Calls `${voiceApiBase}/scan-document`; inserts into Supabase & localStorage | [`src/App.jsx#L2000-L2147`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2000-L2147) |
| 11 | `records` | View scanned prescriptions and medical reports saved on device or Supabase | Reads `mk_medical_records` from localStorage | [`src/App.jsx#L2150-L2203`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2150-L2203) |
| 12 | `bodyScan` | Visual symptom checker with 6 body part buttons (Head, Chest, Stomach, Joints, Arms, Legs) | **Partially implemented / Inert** (Buttons lack `onClick` handlers) | [`src/App.jsx#L2206-L2254`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2206-L2254) |
| 13 | `camera` | Live patient facial photo capture placeholder | **Mock / Inert** (Start Camera button skips straight to assessment) | [`src/App.jsx#L2257-L2299`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2257-L2299) |
| 14 | `ayushAssessment` | Guided 8-question clinical intake (Prakriti, Vikriti, Agni, Koshtha, Ahara, etc.) | Stores answers in `answers` state; checks for red-flags | [`src/App.jsx#L2302-L2355`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2302-L2355) |
| 15 | `summary` | Assessment profile recap (Prakriti, Vikriti, Agni) | Action buttons ("View Full Report", "Share with Doctor") return to dashboard | [`src/App.jsx#L2358-L2410`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2358-L2410) |
| 16 | `consentManage` | Audit consent grant/revocation history and toggle active consent state | Revokes or grants consent; appends to `mk_consent_log` | [`src/App.jsx#L2482-L2534`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2482-L2534) |
| 17 | `timeline` | Unified chronological medical timeline and AI-extracted report history | Visual timeline with abnormal value flags and clinical alerts | [`src/App.jsx#L2537-L2655`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2537-L2655) |
| 18 | `ayushKB` | Static bilingual reference cards for traditional AYUSH concepts | Displays English and Hindi side-by-side | [`src/App.jsx#L2658-L2728`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2658-L2728) |
| 19 | `prescription` | Patient prescription lookup using assigned OPD token | Queries Supabase `prescriptions` table by token or reads local demo cache | [`src/App.jsx#L2731-L2821`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2731-L2821) |

### Important Components
1. **`MediKioskApp` ([`src/App.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L920)):** Monolithic top-level container holding global state, translation lookup `t()`, layout decorators (`renderTricolor`, `renderChakra`, `renderThemeToggle`, `renderLanguageSwitcher`), camera feed logic, and screen switch blocks.
2. **`VoiceAssistant` ([`src/VoiceAssistant.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L380)):** Self-contained voice kiosk module with live audio recording, audio level visualization meter, silence timeout detection, conversation history display, and speech synthesis handlers.

### State Management
- **Global / Page State:** Pure React `useState` hooks located at the root of `MediKioskApp`.
- **Session Persistence:**
  - `sessionStorage.getItem('mk_consent')`: Ephemeral session gate.
  - `localStorage`:
    - `mk_lang`: Chosen language code.
    - `mk_theme`: `'light'` or `'dark'` (dynamically adds `.dark` class to `document.documentElement`).
    - `mk_token_seq`: Monotonically increasing counter for OPD tokens.
    - `mk_alerts`: Array of clinical alert objects.
    - `mk_timeline`: Array of chronological health event objects.
    - `mk_report_history`: Array of AI-extracted report objects.
    - `mk_medical_records`: Local copy of scanned documents.
    - `mk_medicines`: Local schedule of prescribed medicines.
    - `mk_prescriptions`: Mock/demo dictionary of prescriptions keyed by OPD token.
    - `mk_consent_log`: Audit trail of consent grants and revocations.

### Form Handling & Validation
- Standard uncontrolled/controlled inputs with inline sanitized handlers.
- Mobile numbers enforce 10 digits via regex sanitization: `value.replace(/\D/g, '').slice(0, 10)`.
- Booking form validates non-empty patient name, valid 10-digit mobile number, and non-empty appointment date before submission.

### Error Handling & Suspicious / Unfinished Areas
1. **Suspicious Dead Code:**
   - [`src/App.jsx#L30-L35`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L30-L35) defines `const LANG_CODE = { 'हिंदी': 'hi', 'English': 'en', 'ಕನ್ನಡ': 'kn', 'தமிழ்': 'ta' };` which is never referenced anywhere in the file.
2. **Inert UI Elements:**
   - [`src/App.jsx#L2232-L2240`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2232-L2240) (`bodyScan` screen): The 6 body part buttons have no `onClick` handlers. Clicking them does nothing.
   - [`src/App.jsx#L2281-L2286`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2281-L2286) (`camera` screen): "Start Camera" does not start any video stream; it merely jumps directly to `ayushAssessment`.
   - [`src/App.jsx#L2392-L2403`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2392-L2403) (`summary` screen): Both "View Full Report" and "Share with Doctor" buttons simply route back to `dashboard`.
3. **Hardcoded API Hosts:**
   - Both `App.jsx` and `VoiceAssistant.jsx` define `voiceApiBase` / `API_BASE` with runtime checks against `window.location.hostname:8000`. If the frontend is deployed to Vercel via HTTPS, browser security will block plaintext HTTP requests to `http://<host>:8000` due to Mixed Content policy.

---

## 5. BACKEND ARCHITECTURE

### Entry Point & Framework
- **File:** [`server/medikiosk_voice.py`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py)
- **Framework:** FastAPI (`app = FastAPI(title="MediKiosk AI Voice Assistant", version="1.0")`)
- **Execution:** Started via `uvicorn.run(app, host="0.0.0.0", port=8000)` or `uvicorn server.medikiosk_voice:app --reload`.

### Middleware & Cross-Origin Configuration
- **CORS:** Configured via `CORSMiddleware`:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
  Allows all origins, methods, and headers for development and cross-origin kiosk terminals.

### Controllers / API Endpoints

1. **`GET /` (Health Check & AI Probe):**
   - **Purpose:** Verifies backend liveness and confirms Gemini AI integration.
   - **Response:** `{"application": "MediKiosk", "status": "running", "ai": "Gemini"}`.
   - **Source:** [`server/medikiosk_voice.py#L756-L764`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L756-L764)

2. **`POST /chat/{session_id}` (Conversational Chat):**
   - **Purpose:** Multi-turn text chat with patient intake management and clinical reasoning.
   - **Parameters:** Path parameter `session_id: str`, query parameter `message: str`.
   - **Logic:**
     - Probes `EMERGENCY_PATTERNS`, `REPEAT_PATTERNS`, and `STOP_PATTERNS` regex.
     - If triggered, bypasses the LLM and returns immediate pre-compiled dataset responses.
     - Otherwise appends `PATIENT: {message}` to session history and invokes `client.models.generate_content(model="gemini-3.6-flash")`.
     - Sanitizes response via `sanitize_reply` (enforces 1-sentence limit, strips emojis/markdown).
   - **Source:** [`server/medikiosk_voice.py#L527-L543`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L527-L543)

3. **`POST /voice/{session_id}` (Multimodal Audio Ingestion):**
   - **Purpose:** Ingests recorded spoken audio, transcribes speech, generates assistant reply.
   - **Parameters:** Path parameter `session_id: str`, multipart body `audio: UploadFile`.
   - **Logic:**
     - Step 1: Passes raw audio bytes to `client.models.generate_content` (`gemini-3.6-flash`) with prompt requesting Hindi/English/Hinglish transcription.
     - Step 2: Passes resulting transcript into `ask_gemini(session_id, transcript)`.
   - **Response:** `{"session_id": "...", "transcript": "...", "response": "..."}`.
   - **Source:** [`server/medikiosk_voice.py#L576-L621`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L576-L621)

4. **`POST /tts` (Gemini Speech Generation):**
   - **Purpose:** Synthesizes natural spoken voice audio from input text.
   - **Parameters:** Query parameter `text: str`.
   - **Logic:**
     - Calls `client.models.generate_content` on `gemini-2.5-flash-preview-tts` (falling back to `gemini-2.5-pro-preview-tts`) with voice `Kore` and `response_modalities=["AUDIO"]`.
     - Extracts inline PCM byte stream and converts to standard WAV container (`pcm_to_wav`, 24,000 Hz, 16-bit mono).
   - **Response:** Binary audio stream (`media_type="audio/wav"`).
   - **Source:** [`server/medikiosk_voice.py#L637-L673`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L637-L673)

5. **`POST /scan-document` (Multimodal Medical Document Parser):**
   - **Purpose:** Extracts structured medical details from photographed prescriptions, reports, or discharge summaries.
   - **Parameters:** Multipart body `image: UploadFile`.
   - **Logic:**
     - Ingests image bytes with `SCAN_PROMPT` into `gemini-3.6-flash`.
     - Enforces JSON schema: `doc_type`, `patient_name`, `doctor`, `hospital`, `date`, `diagnosis`, `medicines`, `lab_values`, `notes`.
     - Strips markdown formatting and returns validated JSON object with `extracted_at` ISO timestamp.
   - **Source:** [`server/medikiosk_voice.py#L490-L525`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L490-L525)

6. **`DELETE /session/{session_id}` (Session Eviction):**
   - **Purpose:** Deletes conversational intake history from memory when a session finishes.
   - **Source:** [`server/medikiosk_voice.py#L679-L689`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L679-L689)

7. **`GET /fhir/metadata` (FHIR R4 Discovery):**
   - **Purpose:** Exposes HL7 FHIR R4 `CapabilityStatement` (FHIR v4.0.1) declaring supported resources (`Patient`, `Appointment`, `Observation`, `DocumentReference`).
   - **Source:** [`server/medikiosk_voice.py#L697-L719`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L697-L719)

8. **`GET /fhir/Patient/{session_id}` (FHIR R4 Patient Export):**
   - **Purpose:** Formats recorded patient conversational intake into a standard FHIR Bundle containing `Patient` and `DocumentReference` resources.
   - **Source:** [`server/medikiosk_voice.py#L720-L750`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L720-L750)

### Services & In-Memory State
- **Session Memory:** Held in a global Python dictionary `sessions = {}`. Each session stores an array of strings representing turns (`"PATIENT: ..."`, `"MEDIKIOSK AI: ..."`).
- **Persistence:** **None on the server.** If the server process restarts, all active session histories are lost.
- **Dataset Integration:** At startup, [`load_dataset()`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L67-L78) reads `server/data/medikiosk_voice_assistant_starter_dataset.jsonl` into memory. A compiled few-shot prompt block is prepended to the system prompt of every new conversation session.

---

## 6. DATABASE

### Database Technology
- **Platform:** Supabase Cloud PostgreSQL.
- **Project URL:** Configured in [`src/supabaseClient.js`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/supabaseClient.js) (`https://rmiptuqbkeeejrjspujb.supabase.co`).
- **Connection Model:** Direct client-side HTTP REST API connection via `@supabase/supabase-js`. The Python backend does not directly connect to Supabase.

### Schema Definition ([`supabase/schema.sql`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/supabase/schema.sql))

#### 1. Table: `public.appointments`
Stores patient outpatient booking records.
```sql
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  department text not null default 'General Medicine',
  doctor text,
  appointment_date date,
  time_slot text,
  reason text,
  language text default 'English',
  token text,
  status text not null default 'pending'
);
```
- **Indexes:** `create unique index if not exists appointments_token_idx on public.appointments (token) where token is not null;`
- **Security / RLS:** RLS is enabled. Policy `"allow anonymous appointment inserts"` grants `INSERT` to role `anon` with `with check (true)`. `SELECT` is **intentionally denied** to `anon` to protect patient privacy on public kiosk screens.

#### 2. Table: `public.prescriptions`
Stores prescriptions uploaded by doctors for patient retrieval via OPD token.
```sql
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  token text not null,
  doctor text not null,
  department text,
  prescription_date date not null default current_date,
  medicines jsonb not null default '[]',
  notes text
);
```
- **Security / RLS:** RLS is enabled.
  - Policy `"allow anonymous prescription reads"` grants `SELECT` to `anon` with `using (true)`.
  - Policy `"allow prescription inserts"` grants `INSERT` to `anon` with `with check (true)`.

#### 3. Table: `public.medical_records`
Stores document OCR extractions from scanned paper prescriptions and lab reports.
```sql
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_name text,
  phone text,
  doc_type text,
  hospital text,
  doctor text,
  record_date text,
  diagnosis text,
  medicines jsonb not null default '[]',
  lab_values jsonb not null default '[]',
  notes text,
  raw_text text
);
```
- **Security / RLS:** RLS is enabled. Policy `"allow anonymous medical record inserts"` grants `INSERT` to `anon` with `with check (true)`. `SELECT` is not granted to `anon`; patient records are only viewable by staff in Supabase Table Editor or locally via device localStorage mirror.

### Seed Data & Migrations
- **Migrations:** There is no migration tooling (such as Flyway, Liquibase, Prisma, or Supabase CLI migrations). Schema setup is manual via `supabase/schema.sql` in the Supabase web dashboard.
- **Seed Data:** None provided in the database script. Initial demo data is seeded into `localStorage` on first client run (e.g. sample medicines like Amla Juice and Triphala Churna).

---

## 7. COMPLETE API INVENTORY

### Frontend & External APIs

| Method | Endpoint / Service | Purpose | Authentication | Request Payload | Response Payload | Source File |
|---|---|---|---|---|---|---|
| `POST` | `https://rmiptuqbkeeejrjspujb.supabase.co/rest/v1/appointments` | Save patient OPD appointment | Supabase Publishable Key (Bearer token) | `{ name, phone, department, doctor, appointment_date, time_slot, reason, language, token }` | HTTP 201 Created (no returning row under RLS) | [`src/App.jsx#L1280-L1314`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1280-L1314) |
| `POST` | `https://rmiptuqbkeeejrjspujb.supabase.co/rest/v1/medical_records` | Save AI-extracted medical record | Supabase Publishable Key (Bearer token) | `{ patient_name, phone, doc_type, hospital, doctor, record_date, diagnosis, medicines, lab_values, notes }` | HTTP 201 Created | [`src/App.jsx#L1072`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1072) |
| `GET` | `https://rmiptuqbkeeejrjspujb.supabase.co/rest/v1/prescriptions?token=eq.<TOKEN>&select=*` | Look up prescription by OPD token | Supabase Publishable Key (Bearer token) | URL query parameter `token` | `[ { id, token, doctor, department, prescription_date, medicines, notes } ]` | [`src/App.jsx#L2736-L2748`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2736-L2748) |

### Python Backend Endpoints (`server/medikiosk_voice.py`)

| Method | Endpoint | Purpose | Authentication | Request Payload / Params | Response Payload | Source File |
|---|---|---|---|---|---|---|
| `GET` | `/` | Backend liveness and AI model detection probe | None | None | `{"application": "MediKiosk", "status": "running", "ai": "Gemini"}` | [`server/medikiosk_voice.py#L756`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L756) |
| `POST` | `/chat/{session_id}` | Conversational multi-turn patient intake chat | None | Query param `message: str` | `{"session_id": str, "user_message": str, "response": str}` | [`server/medikiosk_voice.py#L527`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L527) |
| `POST` | `/voice/{session_id}` | Multimodal speech transcription + conversational turn | None | Multipart form `audio: UploadFile` (`speech.webm` / audio blob) | `{"session_id": str, "transcript": str, "response": str}` | [`server/medikiosk_voice.py#L576`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L576) |
| `POST` | `/tts` | Gemini-based speech audio synthesis | None | Query param `text: str` | Binary WAV audio (`audio/wav`, 24 kHz 16-bit mono) | [`server/medikiosk_voice.py#L637`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L637) |
| `POST` | `/scan-document` | Multimodal medical document OCR & structured entity extraction | None | Multipart form `image: UploadFile` (JPEG/PNG/WebP/HEIC) | JSON object: `doc_type`, `patient_name`, `doctor`, `hospital`, `date`, `diagnosis`, `medicines`, `lab_values`, `notes`, `extracted_at` | [`server/medikiosk_voice.py#L490`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L490) |
| `DELETE` | `/session/{session_id}` | Reset and purge conversation memory for a kiosk session | None | Path param `session_id: str` | `{"message": "Patient session cleared"}` | [`server/medikiosk_voice.py#L679`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L679) |
| `GET` | `/fhir/metadata` | HL7 FHIR R4 CapabilityStatement discovery | None | None | FHIR R4 `CapabilityStatement` resource JSON | [`server/medikiosk_voice.py#L697`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L697) |
| `GET` | `/fhir/Patient/{session_id}` | Export patient session transcript as FHIR Bundle | None | Path param `session_id: str` | FHIR R4 `Bundle` JSON containing `Patient` and `DocumentReference` | [`server/medikiosk_voice.py#L720`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L720) |

---

## 8. EXISTING AI / ML AUDIT

### Detailed Audit Findings

#### A. Does an AI system already exist?
**YES.** A functional hybrid AI implementation exists, spanning a Python FastAPI backend integrated with the Google Gemini API, alongside a browser-native offline rule-based NLP fallback engine.

#### B. Is it partially implemented?
**YES.** The core conversation loop, multimodal audio transcription, Gemini TTS, and multimodal document OCR are implemented. However, advanced elements (such as vector embeddings, persistent conversation memory, FHIR database synchronization, and automated diagnostic validation) are partial or mock.

#### C. Is there only UI / mock code?
**NO.** The AI system is not merely a mockup:
- [`server/medikiosk_voice.py`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py) actively connects to Google Gemini via `google-genai`.
- [`src/VoiceAssistant.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx) communicates over HTTP to `/voice` and `/chat`.
- Live document extraction actively sends captured video frames to `/scan-document`.
- *Note:* Certain secondary UI screens (`bodyScan` and `camera`) contain mock UI that does not yet wire into the AI pipeline.

#### D. Which model / provider is used?
- **Provider:** Google DeepMind / Google Cloud via the `google-genai` Python SDK.
- **LLM / Vision / Audio Model:** `gemini-3.6-flash` (declared as `MODEL = "gemini-3.6-flash"` in [`server/medikiosk_voice.py#L28`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L28)).
- **TTS Models:** `gemini-2.5-flash-preview-tts` with fallback to `gemini-2.5-pro-preview-tts` (voice `Kore`).

#### E. Where are API calls made?
- **Backend Model Calls:**
  - `client.models.generate_content(model="gemini-3.6-flash", contents=conversation)` in [`server/medikiosk_voice.py#L446-L449`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L446-L449)
  - `client.models.generate_content(model="gemini-3.6-flash", contents=[Part.from_bytes(raw), SCAN_PROMPT])` in [`server/medikiosk_voice.py#L502-L508`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L502-L508)
  - `client.models.generate_content(model="gemini-3.6-flash", contents=[Part.from_bytes(audio_bytes), ...])` in [`server/medikiosk_voice.py#L551-L567`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L551-L567)
  - `client.models.generate_content(model="gemini-2.5-flash-preview-tts", ...)` in [`server/medikiosk_voice.py#L648-L661`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L648-L661)
- **Frontend-to-Backend Calls:**
  - `fetch("${API_BASE}/chat/${sessionId()}?message=...")` in [`src/VoiceAssistant.jsx#L41-L46`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L41-L46)
  - `fetch("${API_BASE}/voice/${sessionId()}", { method: 'POST', body: fd })` in [`src/VoiceAssistant.jsx#L48-L55`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L48-L55)
  - `fetch("${API_BASE}/tts?text=...")` in [`src/VoiceAssistant.jsx#L519`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L519)
  - `fetch("${voiceApiBase}/scan-document", { method: 'POST', body: fd })` in [`src/App.jsx#L1014`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1014)

#### F. Are API keys / environment variables configured?
- In [`server/medikiosk_voice.py#L24-L26`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L24-L26), the server reads `GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")`.
- **Status in Repo:** There is **no `.env` file present** in the cloned repository. The user must provide a valid `GEMINI_API_KEY` in `server/.env` to run the backend AI services.

#### G. What inputs does the AI receive?
1. **Chat:** Raw user text query or transcript string + full multi-turn session history + injected few-shot dataset.
2. **Voice:** Raw audio binary blob (WebM Opus / WAV / MP4) from the kiosk browser's `MediaRecorder`.
3. **Document Scan:** JPEG/PNG camera snapshot of a prescription or laboratory document.

#### H. What outputs does it generate?
1. **Chat:** Exactly one concise, emoji-free, conversational response sentence with follow-up clinical questions.
2. **Voice:** Transcribed user text + single-sentence spoken reply.
3. **TTS:** 24 kHz 16-bit mono linear PCM audio packaged into a WAV container.
4. **Document Scan:** Structured JSON schema containing document type, patient name, doctor, hospital, date, diagnosis, medicine array, lab value array with high/low flags, and notes.

#### I. Is conversation history stored?
- **Server:** Stored **in-memory only** inside the Python dictionary `sessions[session_id]` ([`server/medikiosk_voice.py#L53`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L53)). Not persisted across server restarts.
- **Frontend:** Stored in component React state (`messages` in [`src/VoiceAssistant.jsx#L382`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L382)). Persists until the patient exits the Voice Assistant screen.

#### J. Is there any RAG / Vector Database?
**NO.** There are no vector databases (ChromaDB, Pinecone, FAISS, Weaviate, Qdrant, or pgvector), no embedding models, and no dynamic retrieval pipelines anywhere in the repository.

#### K. Is there any medical knowledge base?
- **Static In-Code AYUSH Knowledge Base:**
  - In [`src/VoiceAssistant.jsx#L81-L248`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L81-L248): Static dictionaries for symptoms (headache, stomach, cold, fever, stress, sleep, energy, BP, sugar), doshas (Vata, Pitta, Kapha), diet, and lifestyle.
  - In [`src/App.jsx#L2658-L2685`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2658-L2685): Bilingual reference cards for Prakriti, Vikriti, Agni, Dinacharya, Ahara, and Panchakarma.
- **Starter Dataset:**
  - [`server/data/medikiosk_voice_assistant_starter_dataset.jsonl`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/data/medikiosk_voice_assistant_starter_dataset.jsonl) containing 205 curated patient utterances, intents, and target clinical responses. Injected into the Gemini prompt as few-shot training.

#### L. Is there any safety / guardrail system?
**YES, multi-tiered:**
1. **Client-Side Pre-Call Red-Flag Detection:** [`src/clinical.js#L9-L29`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/clinical.js#L9-L29) uses regular expressions covering English, Hindi, and Hinglish to detect 10 critical conditions. If matched, it immediately emits `RED_FLAG_RESPONSE`, saves a clinical alert, and **aborts the LLM call entirely**.
2. **Server-Side Deterministic Safety Routing:** [`server/medikiosk_voice.py#L174-L185`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L174-L185) evaluates `EMERGENCY_PATTERNS` regex before invoking Gemini. If matched, it returns a hardcoded 108 emergency escalation message with zero latency.
3. **Clinical Output Sanitization:**
   - Server-side [`sanitize_reply()`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L86-L106) strips emojis, markdown symbols, duplicate leading acknowledgements, and clamps responses to the first sentence.
   - Client-side [`sanitizeReply()`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L534-L545) provides an identical safeguard if raw text bypasses the server filter.
4. **Prompt System Rules:** Explicit instructions forbidding the assistant from prescribing medications, altering dosages, claiming a definite diagnosis, or pretending to be a physician ([`server/medikiosk_voice.py#L296-L321`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L296-L321)).

---

## 9. AUDIO / VOICE AUDIT

### Voice Functionality Status
**Fully Implemented** as a hybrid browser/cloud pipeline with automatic multi-level fallbacks.

### Audio Input Methods
1. **MediaRecorder Audio Streaming (Primary):**
   - Implemented in [`src/VoiceAssistant.jsx#L584-L672`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L584-L672).
   - Pre-warms microphone hardware on mount via `navigator.mediaDevices.getUserMedia({ audio: true })`.
   - Records using `MediaRecorder` with MIME type `audio/webm;codecs=opus` (or fallback).
   - Live Voice Activity Detection (VAD) via `AudioContext` and `AnalyserNode` (fftSize 512). Calculates RMS audio volume in a `requestAnimationFrame` loop.
   - Automatically stops recording and sends audio if silence persists for more than 1,600 ms after speech.
   - Enforces a hard cap of 20 seconds (`MAX_RECORD_SECONDS = 20`).
   - Supports barge-in: pressing the microphone button immediately halts ongoing audio playback.
2. **Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) (Fallback):**
   - Implemented in [`src/VoiceAssistant.jsx#L695-L727`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L695-L727).
   - Used when the Python voice server is unreachable or when running in pure browser mode.
   - Configured with `rec.lang = LANGS[lang] || 'en-IN'`.

### Audio Output Methods
1. **Gemini Cloud TTS (Primary):**
   - Triggered via `POST /tts?text=...` in [`src/VoiceAssistant.jsx#L514-L531`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L514-L531).
   - Backend calls `gemini-2.5-flash-preview-tts` (or `gemini-2.5-pro-preview-tts`) with voice `Kore`.
   - Audio is received as a binary WAV blob, converted to an object URL via `URL.createObjectURL(blob)`, and played through HTML5 `new Audio(url)`.
2. **Web Speech API (`SpeechSynthesis`) (Fallback):**
   - Implemented in [`src/VoiceAssistant.jsx#L483-L512`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L483-L512).
   - Invoked if the `/tts` endpoint fails or returns an error.
   - Uses an intelligent voice scoring algorithm prioritizing high-quality voices matching the target locale (e.g. Google, Natural, Online, Premium voices).
3. **Audio Consent Playback:**
   - Implemented in [`src/App.jsx#L2446-L2457`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2446-L2457) (`consentGate` screen), reading out DPDP Act 2023 legal terms in Hindi or English using `speechSynthesis`.

### Audio Processing Architecture
- **Format:** `audio/webm` (client capture) converted to WAV container on the server for TTS playback.
- **Streaming:** True real-time audio chunk streaming (e.g. WebSockets or gRPC bidirectional streams) is **not implemented**. Audio is recorded into a single chunk buffer and submitted as a single POST request upon silence detection.

---

## 10. MULTILINGUAL / TRANSLATION AUDIT

### Supported Languages

| Language | Native Label | Code | Locale | UI Strings | Voice STT | Voice TTS | Offline Rule Engine |
|---|---|---|---|---|---|---|---|
| **English** | English | `en` | `en-IN` | Full (92+ keys) | Yes | Yes | Full (20+ intents) |
| **Hindi** | हिंदी | `hi` | `hi-IN` | Full (92+ keys) | Yes | Yes | Full (20+ intents) |
| **Kannada** | ಕನ್ನಡ | `kn` | `kn-IN` | Full (92+ keys) | Yes | Yes | Fallback to English |
| **Tamil** | தமிழ் | `ta` | `ta-IN` | Full (92+ keys) | Yes | Yes | Fallback to English |
| **Marathi** | मराठी | `mr` | `mr-IN` | Full (92+ keys) | Yes | Yes | Fallback to English |
| **Bengali** | বাংলা | `bn` | `bn-IN` | Full (92+ keys) | Yes | Yes | Fallback to English |
| **Urdu** | اردو | `ur` | `ur-IN` | Full (92+ keys) | Yes | Yes | Fallback to English |

### How Language Selection Works
1. **Entry Selection:** [`src/App.jsx#L1458-L1508`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1458-L1508) forces initial selection from the 7 supported languages.
2. **Global Switcher Bar:** Present on all subsequent screens. Tapping any language chip updates state instantly.
3. **Storage:** Stored in `localStorage.setItem('mk_lang', code)`.
4. **RTL Support:** Urdu (`ur`) automatically activates bidirectional document rendering:
   ```javascript
   document.documentElement.setAttribute('dir', appLang === 'ur' ? 'rtl' : 'ltr');
   ```
5. **Translation Dictionary:** Embedded in [`src/App.jsx#L37-L918`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L37-L918) (`TRANSLATIONS` object).
6. **Fallback Mechanism:** `t(key) = TRANSLATIONS[appLang][key] || TRANSLATIONS.en[key] || key`.

### Server vs. Client Translation
- **Client-Side:** UI labels, error messages, and static clinical reference cards are translated client-side via the dictionary.
- **Server-Side AI:** The Gemini voice server (`medikiosk_voice.py`) automatically detects Hindi, English, and Hinglish inputs and replies in kind. It does **not** currently possess prompt directives for Kannada, Tamil, Marathi, Bengali, or Urdu.

---

## 11. AUTHENTICATION & SECURITY

### Authentication Model
- **Patient Login:** **Unauthenticated / Demographic Only.** Entering full name and mobile number merely initializes client React state. There is no password, OTP verification, or JWT generation.
- **Govt ID Login:** **Unauthenticated / Mock.** Entering an Aadhaar, Health ID, or ABHA number performs no verification against ABDM or UIDAI gateways.
- **Staff / Doctor Login:** **Does not exist.** Doctors currently interact with Supabase directly via the Supabase Web Dashboard or Table Editor.

### Supabase Security & Row Level Security (RLS)
- **Client Configuration:** [`src/supabaseClient.js`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/supabaseClient.js) uses the public `supabaseUrl` and `supabaseAnonKey`.
- **Row Level Security Policies:**
  - `appointments`: Locked down. Allows anonymous `INSERT` (`with check (true)`). Denies `SELECT`. Prevents subsequent patients on a public kiosk from viewing previous patients' booking records.
  - `medical_records`: Locked down. Allows anonymous `INSERT`. Denies `SELECT`.
  - `prescriptions`: Allows anonymous `SELECT` (`using (true)`) and anonymous `INSERT`. Patients can fetch prescriptions if they possess the valid OPD token.

### Security Concerns & Technical Vulnerabilities
1. **Hardcoded Supabase Credentials:** The Supabase Project URL and Anon Public Key are hardcoded into source code in [`src/supabaseClient.js`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/supabaseClient.js). While designated as a publishable key, hardcoding prevents environment-based deployment switching.
2. **Unauthenticated Prescription Table:** The `prescriptions` table has an RLS policy granting `for select to anon using (true)`. Any client using the publishable key can run `supabase.from('prescriptions').select('*')` without a token and dump all prescriptions in the database.
3. **Open CORS on Voice Server:** `server/medikiosk_voice.py` sets `allow_origins=["*"]`, allowing any website to invoke Gemini chat, audio transcription, and document OCR.
4. **No Rate Limiting:** Neither the FastAPI server nor the Supabase client implement rate limiting. A malicious actor could overload the `/tts`, `/voice`, or `/scan-document` endpoints, exhausting Gemini API quotas.
5. **No Input Sanitization on File Uploads:** Uploaded documents in `/scan-document` and audio in `/voice` are read directly into memory without file size limits, posing a potential denial-of-service (DoS) memory exhaustion vulnerability.

---

## 12. ENVIRONMENT VARIABLES

| Variable Name | Purpose | Used By | Required? | Example / Default | Secret? |
|---|---|---|---|---|---|
| `GEMINI_API_KEY` | Authentication key for Google Gemini API (LLM, Vision, STT, TTS) | `server/medikiosk_voice.py` | **YES** (for backend AI features) | `AIzaSy...` (from Google AI Studio) | **YES** |
| `VITE_SUPABASE_URL` | Supabase Project REST URL | Currently hardcoded in `src/supabaseClient.js` | Recommended (not currently wired) | `https://rmiptuqbkeeejrjspujb.supabase.co` | No |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anonymous Publishable Key | Currently hardcoded in `src/supabaseClient.js` | Recommended (not currently wired) | `sb_publishable_...` | Low (Public Key) |
| `PORT` | FastAPI server listening port | `server/medikiosk_voice.py` | No (hardcoded to `8000`) | `8000` | No |

*Note on Repository State:* There is currently **no `.env` or `.env.example` file** present in the repository root or in `server/`.

---

## 13. APPLICATION DATA FLOWS

### Flow 1: OPD Appointment Booking
```text
Patient on Kiosk Terminal
  │
  ▼
Fill Details (src/App.jsx: Name, Phone, Dept, Doctor, Date, Slot, Reason)
  │
  ▼
Validation (Checks name, 10-digit phone, date)
  │
  ▼
Department Guidance (clinical.js: suggestDepartment() checks symptoms against regex)
  │
  ▼
Token Generation (clinical.js: nextToken() increments localStorage 'mk_token_seq' -> 'MK-20260919-001')
  │
  ▼
Timeline Event Logged (clinical.js: addTimelineEvent() appends to 'mk_timeline')
  │
  ▼
Supabase Insert (supabase.from('appointments').insert({ ... }))
  │
  ├── [Success] ──► UI flips to Success Card displaying Token and Summary
  └── [Error]   ──► Displays human-readable message (RLS error / offline error)
```

### Flow 2: Live Document Scanning & AI OCR Extraction
```text
Patient holds paper document to Kiosk Camera
  │
  ▼
Video Stream (src/App.jsx: navigator.mediaDevices.getUserMedia renders to <video>)
  │
  ▼
Capture Frame (Drawn to hidden <canvas>, exported via canvas.toBlob('image/jpeg'))
  │
  ▼
HTTP POST (Multipart FormData to http://localhost:8000/scan-document)
  │
  ▼
FastAPI Controller (server/medikiosk_voice.py: scan_document())
  │
  ▼
Gemini 3.6 Flash (client.models.generate_content with SCAN_PROMPT)
  │
  ▼
Structured JSON Parsing (Extracts medicines, lab values, doctor, hospital, diagnosis)
  │
  ▼
Frontend Review Screen (Patient verifies extracted details)
  │
  ▼
Save Clicked (src/App.jsx: saveScannedRecord())
  │
  ├──► Supabase Insert (supabase.from('medical_records').insert())
  ├──► Local Mirror (localStorage.setItem('mk_medical_records'))
  ├──► Report History (clinical.js: addReportHistory())
  └──► Abnormal Flag Check (isAbnormalValue() flags 'high'/'low'/'critical' -> addClinicalAlert())
```

### Flow 3: Conversational Voice Interaction (With Red-Flag Safety)
```text
Patient speaks into Kiosk Microphone
  │
  ▼
Audio Capture (src/VoiceAssistant.jsx: MediaRecorder chunks + Web Audio API AnalyserNode)
  │
  ▼
Voice Activity Detection (Continuous RMS volume analysis; auto-stops after 1.6s of silence)
  │
  ▼
HTTP POST (Multipart audio/webm to http://localhost:8000/voice/{session_id})
  │
  ▼
FastAPI Audio Transcription (Gemini 3.6 Flash transcribes Hindi/English/Hinglish)
  │
  ▼
Clinical Red-Flag Check (server/medikiosk_voice.py: EMERGENCY_PATTERNS regex)
  │
  ├── [Matched] ──► Immediate 108 Emergency Response (LLM skipped, zero latency)
  │
  └── [Safe]    ──► Multi-turn Gemini 3.6 Flash Prompting
                      │
                      ▼
                    Response Sanitization (sanitize_reply: 1-sentence limit, strips emojis)
                      │
                      ▼
                    Return JSON ({ transcript, response })
                      │
                      ▼
                    HTTP POST (http://localhost:8000/tts?text=...)
                      │
                      ▼
                    Gemini TTS (gemini-2.5-flash-preview-tts with voice 'Kore')
                      │
                      ▼
                    PCM to WAV Conversion (FastAPI returns audio/wav)
                      │
                      ▼
                    Browser Playback (HTML5 Audio element plays synthesized speech)
```

---

## 14. EXISTING MEDICAL DOMAIN FUNCTIONALITY

| Medical Feature | Status | Actual Code Implementation Details |
|---|---|---|
| **Red-Flag Emergency Detection** | **Implemented** | [`src/clinical.js#L9-L29`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/clinical.js#L9-L29) regex identifies 10 critical conditions (severe chest pain, stroke, breathing failure, seizures, etc.) in English, Hindi, and Hinglish. [`server/medikiosk_voice.py#L174-L185`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L174-L185) mirrors this server-side. |
| **AYUSH 8-Question Assessment** | **Implemented** | [`src/App.jsx#L1142-L1199`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L1142-L1199) structured questions: Prakriti, Vikriti, Agni, Koshtha, Ahara-Vihara, Nidana, Samprapti, Pariksha. |
| **Department Recommendation** | **Implemented** | [`src/clinical.js#L159-L174`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/clinical.js#L159-L174) maps patient symptom free-text to AYUSH departments (Kayachikitsa, Shalya Tantra, Shalakya Tantra, etc.). |
| **Abnormal Lab Value Detection** | **Implemented** | [`src/clinical.js#L85-L89`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/clinical.js#L85-L89) `isAbnormalValue()` flags high/low/critical/↑/↓ laboratory values extracted by vision OCR. |
| **Chronological Health Timeline** | **Implemented** | [`src/clinical.js#L64-L75`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/clinical.js#L64-L75) logs dated clinical events and alerts in chronological order. |
| **DPDP Act 2023 Consent Gate** | **Implemented** | [`src/App.jsx#L2415-L2534`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2415-L2534) logs grant/revocation history and provides audio legal explanation. |
| **Prescription & OPD Token Tracking**| **Implemented** | Unique token generation (`MK-YYYYMMDD-XXX`) and token-based prescription retrieval from Supabase. |
| **Medicine Schedule / Times** | **Implemented** | Displays daily medicine schedules with doses and times (morning/evening) on the patient dashboard. |
| **Visual Body Symptom Checker** | **Mock** | [`src/App.jsx#L2206-L2254`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2206-L2254) displays a body graphic and 6 part buttons, but buttons have no click handlers. |
| **Live Facial Reporting / Camera** | **Mock** | [`src/App.jsx#L2257-L2299`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2257-L2299) displays a black viewfinder and camera emoji; clicking "Start Camera" bypasses to assessment. |
| **ABDM / ABHA Identity Verification** | **Mock** | Form inputs exist for Aadhaar and ABHA numbers, but no gateway verification takes place. |
| **Assessment Report Sharing / PDF** | **Mock** | "View Full Report" and "Share with Doctor" buttons in the assessment summary return to dashboard without generating a report. |

---

## 15. DEPLOYMENT CONFIGURATION

### Frontend Deployment
- **Hosting:** Vercel (`medikiosk-gov-in.vercel.app` as documented in `README.md`).
- **Build Command:** `npm run build` (runs `vite build`, output to `dist/`).
- **Development Command:** `npm run dev` (starts Vite local development server on port 5173).
- **Preview Command:** `npm run preview` (starts local server serving production `dist/`).

### Backend Deployment
- **Hosting:** Currently configured for local development on `http://localhost:8000` or on the local network host (`http://${host}:8000`).
- **Run Command:**
  ```bash
  uvicorn server.medikiosk_voice:app --host 0.0.0.0 --port 8000
  ```
- **Virtual Environment:** Recommended in `server/venv` (gitignored).

### Database Hosting
- **Provider:** Managed Supabase Cloud (`https://rmiptuqbkeeejrjspujb.supabase.co`).
- **Configuration:** SQL migration executed via Supabase SQL Editor.

### Containerization & CI/CD
- **Docker:** **None.** There are no `Dockerfile` or `docker-compose.yml` files in the repository.
- **CI/CD:** **None.** There are no GitHub Actions workflows (`.github/workflows`) or CI scripts.

---

## 16. DEPENDENCY AUDIT

### Frontend Dependencies (`package.json`)

#### Production Dependencies
- `@supabase/supabase-js` (`^2.115.0`): Supabase PostgreSQL client and authentication library.
- `lucide-react` (`^0.525.0`): SVG icons (partially utilized; majority of icons are UTF-8 emojis).
- `react` (`^19.0.0`): Core React library.
- `react-dom` (`^19.0.0`): React DOM renderer.

#### Development Dependencies
- `@tailwindcss/vite` (`^4.0.0`): Official Tailwind CSS v4 compiler plugin for Vite.
- `@vitejs/plugin-react` (`^5.0.0`): Official Vite plugin providing React Fast Refresh and JSX support.
- `tailwindcss` (`^4.0.0`): Utility-first CSS framework v4.
- `vercel` (`^59.11.7`): Vercel deployment CLI tool.
- `vite` (`^7.0.0`): Fast frontend bundler and dev server.

### Backend Dependencies (`server/requirements.txt`)
- `fastapi`: High-performance asynchronous Python web framework.
- `uvicorn[standard]`: Production-grade ASGI server with Cython dependencies.
- `python-multipart`: Streaming multipart/form-data parser for file uploads.
- `python-dotenv`: Environment variable loader.
- `google-genai`: Official Google GenAI SDK for Gemini 3.6 Flash and Gemini TTS models.

---

## 17. CURRENT PROBLEMS & TECHNICAL DEBT

### Confirmed Issues (Verified in Code)

1. **Mixed Content Policy on Production Deployments:**
   - [`src/VoiceAssistant.jsx#L26-L32`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx#L26-L32) and [`src/App.jsx#L960-L966`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L960-L966) construct `API_BASE` as `http://${host}:8000`.
   - If the frontend is loaded over HTTPS (such as on Vercel at `https://medikiosk-gov-in.vercel.app`), all browser requests to `http://` backend endpoints will be blocked by standard browser Mixed Content security rules.
2. **Inert Screen Elements:**
   - [`src/App.jsx#L2232-L2240`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2232-L2240) (`bodyScan`): Body part buttons lack `onClick` event listeners.
   - [`src/App.jsx#L2281-L2286`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2281-L2286) (`camera`): "Start Camera" button bypasses hardware access and routes to assessment.
   - [`src/App.jsx#L2392-L2403`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L2392-L2403) (`summary`): "View Full Report" and "Share with Doctor" simply route to dashboard.
3. **Dead / Unused Code:**
   - [`src/App.jsx#L30-L35`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx#L30-L35) defines `LANG_CODE` which is never read or imported.
4. **Hardcoded Credentials & Configuration:**
   - [`src/supabaseClient.js#L6-L7`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/supabaseClient.js#L6-L7) hardcodes `supabaseUrl` and `supabaseAnonKey`.
5. **In-Memory Server State:**
   - [`server/medikiosk_voice.py#L53`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L53) stores session conversations in a Python dictionary `sessions = {}`. If the server restarts, all multi-turn context and intake data disappear.
6. **Unpinned Python Dependencies:**
   - `server/requirements.txt` contains zero version specifications (`fastapi`, `uvicorn[standard]`, etc.), risking breaking API changes during future environment builds.
7. **Publicly Queryable Prescription Table:**
   - Supabase schema policy `"allow anonymous prescription reads"` permits unrestricted SELECTs on `public.prescriptions` without enforcing a token check at the database level.

### Suspected Issues & Risks

1. **Gemini Model Deprecation Risk:**
   - [`server/medikiosk_voice.py#L31`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py#L31) references preview models `gemini-2.5-flash-preview-tts` and `gemini-2.5-pro-preview-tts`. Google preview model endpoints frequently sunset with short notice.
2. **Missing Backend Rate Limiting:**
   - Direct exposure of Gemini generation endpoints could lead to denial of service or unexpected API billing spikes.
3. **Large Audio/Image Payloads in Server Memory:**
   - Reading uploaded files entirely into memory via `await audio.read()` or `await image.read()` without chunked disk buffering could exhaust RAM under concurrent kiosk usage.

---

## 18. WHAT ALREADY EXISTS FOR OUR AI GOAL

### Requirement: "AI + Voice + Multilingual Medical Assistant"

| AI Requirement | Already Exists? | Existing Implementation Status | Reusable in Next Stage? | Missing Work Needed for Production |
|---|---|---|---|---|
| **AI / LLM Core** | **YES** | Implemented using Google GenAI SDK and `gemini-3.6-flash` in `server/medikiosk_voice.py`. | **YES (High)** | Structured JSON outputs, dynamic grounding, streaming responses. |
| **Chat Interface** | **YES** | Implemented in `src/VoiceAssistant.jsx` with chat bubbles, typing indicators, and status pills. | **YES (High)** | Virtualized message history, audio waveform rendering, file attachments. |
| **Medical Knowledge** | **PARTIAL** | Static AYUSH concepts in `VoiceAssistant.jsx` and `App.jsx`, plus 205-row few-shot dataset. | **PARTIAL** | Real-world verified AYUSH clinical guidelines, pharmacology database. |
| **RAG System** | **NO** | Zero vector databases, embeddings, or retrieval pipelines exist. | **NO (None exists)** | Chunking pipeline, vector store (e.g. pgvector or Chroma), hybrid semantic search. |
| **Speech-to-Text (STT)** | **YES** | Multimodal Gemini audio transcription via FastAPI `/voice`, plus Web Speech API fallback. | **YES (High)** | Chunked streaming audio over WebSockets (e.g. Gemini Live Multimodal API or Whisper). |
| **Text-to-Speech (TTS)** | **YES** | Gemini TTS preview models returning 24 kHz WAV audio via `/tts`, plus Web Speech synthesis fallback. | **YES (High)** | Low-latency audio streaming; support for Indian regional accent voices. |
| **Voice Conversation Flow** | **YES** | Full client-side VAD, auto-send after 1.6s silence, live level meter, and barge-in support. | **YES (High)** | Interruptible bidirectional audio stream; noise suppression for public kiosks. |
| **Language Detection** | **PARTIAL** | Gemini auto-detects English, Hindi, and Hinglish. Regex heuristic in `guess_lang_key()`. | **PARTIAL** | Support for South Indian languages (Kannada, Tamil) in backend AI prompting. |
| **Translation** | **PARTIAL** | 7 languages supported in client UI dictionary (`TRANSLATIONS`). Backend handles En/Hi/Hinglish. | **PARTIAL** | Real-time cross-language machine translation for regional Indian languages. |
| **Conversation Memory** | **PARTIAL** | In-memory Python dictionary `sessions` on backend; React state on frontend. | **PARTIAL** | Persistent session storage in PostgreSQL / Redis; session resumption across restarts. |
| **User / Patient Context**| **PARTIAL** | Basic demographics (name, age, city, phone) captured on login and passed via session ID. | **PARTIAL** | Unified EHR patient profile object injected into LLM context window. |
| **Safety / Guardrails** | **YES** | Dual-tier red-flag regex (client & server) + prompt constraints + 1-sentence reply sanitizer. | **YES (High)** | Automated hallucination checks, clinical confidence scoring, emergency dispatcher alert. |
| **Logging & Audit Trail** | **PARTIAL** | `localStorage` consent logs and clinical timeline; console logging on backend. | **PARTIAL** | Structured JSON server-side application logs, telemetry, and error tracking. |
| **Rate Limiting** | **NO** | No rate limiting implemented on FastAPI or Supabase endpoints. | **NO** | Redis-based token bucket or SlowAPI rate limiting per kiosk IP/session. |

---

## 19. RECOMMENDED ARCHITECTURE OPTIONS FOR NEXT PHASE

### Option A: Extend Existing FastAPI Voice Backend (Monolithic Python AI Service)
```text
Existing React Frontend (src/)
  │  (HTTP / WebSockets)
  ▼
Existing Python FastAPI Server (server/medikiosk_voice.py)
  ├── 1. Session & History Manager (Redis / PostgreSQL)
  ├── 2. RAG Engine (pgvector in Supabase / LangChain / LlamaIndex)
  ├── 3. Gemini 3.6 Flash (Intake & Reasoning)
  ├── 4. Whisper / Gemini Multimodal (STT)
  └── 5. Gemini TTS / ElevenLabs (TTS)
```
- **Existing Code Reused:** Entire frontend UI (`App.jsx`, `VoiceAssistant.jsx`, `clinical.js`), FastAPI controllers, few-shot dataset.
- **New Services Required:** Redis (for session caching) and pgvector extension on Supabase.
- **Languages / Frameworks:** Python (FastAPI).
- **Complexity:** **Low to Moderate.** Builds directly on top of the established codebase.
- **Main Advantages:** Minimal refactoring; preserves existing multimodal vision OCR and TTS routes; simple deployment.
- **Main Disadvantages:** Python server remains a single point of failure; requires separate backend hosting (Render, Fly.io, or AWS EC2).

---

### Option B: Dedicated Edge AI Gateway (FastAPI + WebSocket Streaming)
```text
Existing React Frontend (src/)
  │  (Bidirectional WebSocket)
  ▼
FastAPI Realtime Streaming Gateway
  ├── Live Audio Ingestion (WebRTC / Opus over WebSocket)
  ├── Gemini Multimodal Live API (Bidirectional voice streaming)
  └── RAG Retrieval (Asynchronous vector search against AYUSH knowledge base)
  │
  ▼
Supabase Database (Persisted sessions, clinical alerts, appointments)
```
- **Existing Code Reused:** Frontend UI layout, design tokens, Supabase database schema, clinical red-flag regex.
- **New Services Required:** WebSocket streaming server, WebRTC audio gateway.
- **Languages / Frameworks:** Python (FastAPI with WebSockets) or Node.js.
- **Complexity:** **High.** Requires replacing HTTP POST audio transfers with real-time bidirectional streaming.
- **Main Advantages:** Near-zero latency conversation (< 500 ms); true conversational barge-in; high responsiveness for walk-in patients.
- **Main Disadvantages:** High implementation complexity; higher server resource consumption per active kiosk session.

---

### Option C: Direct Frontend Serverless Integration (Vercel Serverless / Edge Functions)
```text
React Frontend (Vercel)
  │
  ├──► Vercel Edge API Routes (/api/chat, /api/voice)
  │      └── Google GenAI SDK (Node.js)
  │
  └──► Supabase Cloud (PostgreSQL + pgvector + Auth)
```
- **Existing Code Reused:** All React components, Tailwind styling, Supabase client.
- **New Services Required:** Vercel Edge Functions (Node.js).
- **Languages / Frameworks:** TypeScript / JavaScript (Node.js).
- **Complexity:** **Moderate.** Requires porting `medikiosk_voice.py` logic from Python into TypeScript.
- **Main Advantages:** Serverless scalability; zero backend server maintenance; unified deployment on Vercel.
- **Main Disadvantages:** Loses Python AI ecosystem tooling; potential Vercel Edge function timeout limits on long document OCR or audio parsing tasks.

---

## 20. INSTALLATION & RUNNING THE CURRENT PROJECT

### Prerequisites
- **Node.js:** v18+ or v20+ (`v20.19.0` verified on current system)
- **Python:** v3.10+ or v3.11+ (`3.11.9` verified on current system)
- **Google Gemini API Key:** From Google AI Studio

### 1. Frontend Setup & Execution
```powershell
# In repository root: c:\Users\syedr\Downloads\SIH\medikiosk
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev

# Build production bundle (outputs to dist/)
npm run build
```

### 2. Backend Setup & Execution
```powershell
# Navigate to server directory
cd server

# Create Python virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install required Python packages
pip install -r requirements.txt

# Configure environment variables (create server/.env)
# Add: GEMINI_API_KEY=your_actual_gemini_api_key_here

# (Optional) Re-generate starter dataset if needed
python generate_dataset.py

# Launch FastAPI voice server (runs on http://localhost:8000)
uvicorn medikiosk_voice:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Database Setup (Supabase)
1. Open the Supabase project dashboard at `https://app.supabase.com`.
2. Open the **SQL Editor**.
3. Open [`supabase/schema.sql`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/supabase/schema.sql) from this repository.
4. Paste and execute the script. This creates `appointments`, `prescriptions`, `medical_records`, indexes, and Row Level Security policies.
5. Confirm that [`src/supabaseClient.js`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/supabaseClient.js) points to the intended Supabase URL.

---

## 21. FINAL ARCHITECTURE SUMMARY

### Existing System Architecture Diagram
```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT / KIOSK UI                               │
│                         (React 19 + Vite 7 + Tailwind 4)                     │
│                                                                              │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │     App Controller    │  │   Voice Assistant    │  │  Clinical Safety  │  │
│  │      (src/App.jsx)    │  │(src/VoiceAssistant.jsx│ │ (src/clinical.js) │  │
│  │  19 Screens / i18n /  │  │  VAD / Web Speech /  │  │ Red Flags / Token │  │
│  │   Camera / Timeline   │  │   Offline NLP Brain  │  │  Timeline / Alert │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └─────────┬─────────┘  │
└──────────────┼─────────────────────────┼────────────────────────┼────────────┘
               │                         │                        │
       HTTPS / REST               HTTP Multipart / JSON     Local Mirror
               │                         │                        │
               ▼                         ▼                        ▼
┌───────────────────────────┐  ┌───────────────────────┐  ┌──────────────────┐
│         SUPABASE          │  │     FASTAPI SERVER    │  │   LOCAL STORAGE  │
│       (PostgreSQL)        │  │ (server/medikiosk_... │  │ (Browser Memory) │
│                           │  │                       │  │                  │
│ • appointments (insert)   │  │ • /chat & /voice      │  │ • mk_timeline    │
│ • medical_records (insert)│  │ • /scan-document      │  │ • mk_alerts      │
│ • prescriptions (select)  │  │ • /tts & /fhir        │  │ • mk_medicines   │
│ • Row Level Security (RLS)│  │ • 205 Few-Shot Dataset│  │ • mk_consent_log │
└───────────────────────────┘  └───────────┬───────────┘  └──────────────────┘
                                           │
                                    Google GenAI SDK
                                           │
                                           ▼
                               ┌───────────────────────┐
                               │   GOOGLE GEMINI API   │
                               │                       │
                               │ • gemini-3.6-flash    │
                               │   (Chat, Vision, STT) │
                               │ • gemini-2.5-preview  │
                               │   (Natural WAV TTS)   │
                               └───────────────────────┘
```

### AI Addition — Current State
- Functional single-turn and multi-turn voice/text chat powered by `gemini-3.6-flash`.
- Multimodal document OCR parsing paper prescriptions and lab test sheets into JSON.
- Multimodal audio transcription directly from browser WebM Opus audio chunks.
- Natural speech synthesis via Gemini TTS preview models.
- Pre-LLM safety guardrail engine matching 10 red-flag conditions with zero latency.
- 205 few-shot clinical conversation dataset injected into system prompt.
- Offline browser fallback with 20+ hardcoded symptom and dosha intents.

### AI Addition — Missing Components
- **Vector Search & RAG:** No document index, knowledge base vectorization, or semantic retrieval.
- **Real-Time Streaming:** No WebSocket streaming for live voice conversation (audio is submitted in batch POST requests).
- **Session Persistence:** Backend session memory is ephemeral in-RAM (`sessions = {}`).
- **Comprehensive Multilingual AI:** Backend Gemini prompts only address English, Hindi, and Hinglish (Kannada, Tamil, Marathi, Bengali, Urdu are UI-only).
- **Verification of Medical Entities:** No verification against standard AYUSH drug registries or ICD-10/NAMASTE codes.
- **Doctor Consultation Portal:** No authenticated interface for medical professionals to review kiosk intake summaries.

### Unknown Information (Cannot be Determined from Codebase)
- **Production Server Host:** The production URL/host for the FastAPI backend is unknown (only `localhost:8000` or local network IP is coded).
- **Target Hardware Specifications:** Specific kiosk hardware (e.g. Android tablet model, touch panel resolution, thermal printer connection for OPD tokens) is not documented.
- **ABDM Production Credentials:** Whether official ABDM sandbox client credentials exist for Ayushman Bharat integration is unknown.
- **Vercel Backend Configuration:** How the Python backend is intended to be hosted alongside the Vercel-deployed frontend is not documented in the repository.

### 25 Most Important Files to Inspect Before Implementation
1. [`src/App.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/App.jsx): Master frontend component controlling state, 19 screens, translations, camera, and Supabase calls.
2. [`src/VoiceAssistant.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/VoiceAssistant.jsx): Complete voice client, Web Audio VAD, backend API client, and offline NLP engine.
3. [`src/clinical.js`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/clinical.js): Clinical safety regex, red-flag emergency detector, medical timeline, and abnormal lab value logic.
4. [`src/supabaseClient.js`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/supabaseClient.js): Supabase client initialization, endpoints, and credentials.
5. [`src/index.css`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/index.css): Design system, Tailwind custom variants, and dark theme class re-mappings.
6. [`src/main.jsx`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/src/main.jsx): React application bootstrapping.
7. [`server/medikiosk_voice.py`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/medikiosk_voice.py): FastAPI backend, Gemini client, document OCR parser, TTS generator, and FHIR endpoints.
8. [`server/generate_dataset.py`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/generate_dataset.py): Script generating the 205-row few-shot clinical intent dataset.
9. [`server/requirements.txt`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/requirements.txt): Python dependencies.
10. [`server/data/medikiosk_voice_assistant_starter_dataset.jsonl`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/data/medikiosk_voice_assistant_starter_dataset.jsonl): Few-shot training dataset loaded into Gemini system prompt.
11. [`server/data/medikiosk_voice_assistant_starter_dataset.csv`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/server/data/medikiosk_voice_assistant_starter_dataset.csv): Tabular view of intent-response mappings.
12. [`supabase/schema.sql`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/supabase/schema.sql): PostgreSQL table schemas, indexes, and Row Level Security policies.
13. [`docs/UI-UX-SPEC.md`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/docs/UI-UX-SPEC.md): Design tokens, UI component specifications, and brand guidelines.
14. [`package.json`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/package.json): Frontend Node dependencies and scripts.
15. [`vite.config.js`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/vite.config.js): Vite plugins and configuration.
16. [`index.html`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/index.html): HTML root and multi-script font link tags.
17. [`.gitignore`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/.gitignore): Git ignore rules (identifies environment variable locations).
18. [`README.md`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/README.md): Project overview and initial deployment notes.
19. [`public/logo.png`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/public/logo.png): App branding badge.
20. [`public/chakra.png`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/public/chakra.png): Background watermark image.
21. [`public/emblem.png`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/public/emblem.png): State emblem used on splash screen.
22. [`public/redfort.svg`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/public/redfort.svg): Splash screen background graphic.
23. [`public/gov-india.png`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/public/gov-india.png): Dark header seal.
24. [`public/gov-india-white.png`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/public/gov-india-white.png): White splash seal.
25. [`package-lock.json`](file:///c:/Users/syedr/Downloads/SIH/medikiosk/package-lock.json): Resolved dependency lockfile.

### Recommended Next Investigations Before Writing Any AI Code
1. **Resolve Mixed Content / Deployment URL Architecture:** Determine where the Python voice backend will be deployed in production (e.g. AWS, Render, Fly.io) with valid HTTPS/SSL certificates so the Vercel frontend can communicate with it without browser security blocks.
2. **Decide Between REST Batching vs. WebSocket Streaming:** Determine whether to keep the current batch audio upload model (`/voice` POST after silence) or upgrade to real-time bidirectional streaming (WebSockets / WebRTC) for conversational AI.
3. **Audit Supabase Prescription RLS Policy:** Update `supabase/schema.sql` to restrict anonymous `SELECT` queries on `public.prescriptions` to only return rows matching a specific token rather than allowing full table dumps.
4. **Determine Medical Knowledge Base / RAG Scope:** Identify verified AYUSH literature, pharmacopoeias, or treatment guidelines to ingest into a vector database (e.g. pgvector in Supabase).
5. **Implement Server-Side Session Persistence:** Migrate `sessions = {}` in `server/medikiosk_voice.py` to Redis or PostgreSQL to preserve patient conversation context across server restarts.
6. **Harmonize Multilingual Backend Directives:** Extend `SYSTEM_PROMPT` in `server/medikiosk_voice.py` to support Kannada, Tamil, Marathi, Bengali, and Urdu to match the 7 languages supported by the frontend.
7. **Complete or Remove Inert Mock UI Screens:** Implement actual logic for `bodyScan` (wire body parts into the symptom intake pipeline) and `camera` (attach live video stream for facial analysis) or hide them from the dashboard until ready.
8. **Add Server-Side Rate Limiting & Input Validation:** Implement request throttling on `/tts`, `/voice`, and `/scan-document` to protect against denial of service and API quota exhaustion.
