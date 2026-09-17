import os
import io
import json
import re
import uuid
import wave
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from google import genai
from google.genai import types

load_dotenv()

# ============================================================
# GEMINI
# ============================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL = "gemini-3.6-flash"  # gemini-2.5-flash was retired for new API users

# Natural TTS voices for the assistant (tried in order; first working one wins)
TTS_MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]
TTS_VOICE = "Kore"
_tts_model_index = 0

# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="MediKiosk AI Voice Assistant",
    version="1.0"
)

# Allow the MediKiosk web app (Vite dev server / deployed site) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary conversation memory
sessions = {}


# ============================================================
# TRAINED DATASET (starter intent dataset -> behavior)
# ============================================================

DATA_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "data",
    "medikiosk_voice_assistant_starter_dataset.jsonl"
)


def load_dataset():
    items = []
    try:
        with open(DATA_FILE, encoding="utf-8") as f:
            items = [json.loads(line) for line in f if line.strip()]
        print(f"Loaded {len(items)} training examples from dataset")
    except FileNotFoundError:
        print("WARNING: dataset not found - run generate_dataset.py")
    return items


DATASET = load_dataset()


EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF\U00002B00-\U00002BFF\U0001F900-\U0001F9FF\U00002700-\U000027BF\u2190-\u21FF\u2B00-\u2BFF\u2700-\u27bf\u2600-\u26ff\uFE0F\u2764\u2705\u274C\u2757\u2049\u203C\u2122\u00A9\u00AE]"
)


def sanitize_reply(text):
    """Enforce one-sentence, emoji-free, non-repetitive replies."""
    if not text:
        return text
    out = EMOJI_RE.sub("", text)
    out = re.sub(r'[*#`_>]+', '', out)          # markdown decoration
    out = re.sub(r"\s+", " ", out).strip()         # collapse whitespace
    # keep only the first sentence (period, question or exclamation end)
    m = re.match(r"^(.+?[.?!])(?:\s|$)", out, re.S)
    if m and len(out) > len(m.group(1)) + 40:
        out = m.group(1)
    # drop a repeated leading acknowledgement used in consecutive replies
    prev = LAST_REPLY.get("text")
    if prev:
        prev_lead = " ".join(prev.split()[:3]).lower()
        if prev_lead and out.lower().startswith(prev_lead):
            out = " ".join(out.split()[3:]).strip()
            if out:
                out = out[0].upper() + out[1:]
    LAST_REPLY["text"] = out
    return out


LAST_REPLY = {"text": None}


def build_trained_behavior_block():
    """Compact few-shot block: every intent, its utterances and target response."""
    if not DATASET:
        return ""
    groups = {}
    for item in DATASET:
        groups.setdefault((item["intent"], item["language"]), {"utts": [], "resp": None,
                              "nq": item.get("next_questions"), "na": item.get("next_action")})
        if len(groups[(item["intent"], item["language"])]["utts"]) < 6:
            u = item["instruction"].replace("Patient says: ", "")
            groups[(item["intent"], item["language"])]["utts"].append(u)
            groups[(item["intent"], item["language"])]["resp"] = item["response"]

    lines = [
        "============================================================",
        "TRAINED BEHAVIOR (MediKiosk voice dataset)",
        "============================================================",
        "",
        "You were trained on the intent dataset below. When a patient",
        "message matches an intent, reply in the same language with a",
        "response in the same style and meaning as the target response,",
        "then continue with the listed next questions. Always respect",
        "the listed next_action (especially emergency_escalation).",
        "",
        "STYLE OVERRIDE (applies to everything below):",
        "Compress every reply into ONE short sentence. No emojis.",
        "No repeating the patient's words. Vary acknowledgements.",
        "",
    ]
    seen_intents = []
    for (intent, lang), g in sorted(groups.items()):
        if intent not in seen_intents:
            seen_intents.append(intent)
        resp = (g["resp"] or "")[:400]
        lines.append(f"[{intent} / {lang}]")
        lines.append("  Patient: " + " | ".join(g["utts"]))
        lines.append(f"  Response like: {resp}")
        if g["nq"]:
            lines.append(f"  Then ask about: {', '.join(g['nq'])}")
        if g["na"]:
            lines.append(f"  Action: {g['na']}")
        lines.append("")
    return "\n".join(lines)


TRAINED_BEHAVIOR = build_trained_behavior_block()


# ============================================================
# DETERMINISTIC SAFETY ROUTING (dataset intents, zero-latency)
# ============================================================

def dataset_response(intent, lang_key="en"):
    for item in DATASET:
        if item["intent"] == intent and item["language"] == lang_key:
            return item["response"]
    for item in DATASET:
        if item["intent"] == intent:
            return item["response"]
    return None


EMERGENCY_PATTERNS = [
    r"severe\s+(chest\s+)?pain.*?(breath|saans|saans)",
    r"(chest|seene|seenay).*(bahut|severe|strong).*(dard|pain)",
    r"(breathing|saans).*(dikkat|problem|difficulty|nahi|nhi)",
    r"unconscious|not responding|behosh|behoshi",
    r"seizure|daura|fits\b|jhatke",
    r"(bolne|speaking|baat).*(dikkat|problem|difficulty).*(weakness|kamzor|side)?",
    r"(weakness|kamzor|sust).*(ek side|one side|ek taraf)",
    r"(bleeding|khoon|khun).*(ruk|band|stop|nahi|nhi)",
    r"severe bleeding",
    r"suicide|khudkushi|aadha|paralysis|heart attack|stroke",
]

STOP_PATTERNS = [
    r"\bstop\b", r"\bcancel\b", r"ruko\b", r"rok do", r"band karo",
    r"cancel karo", r"continue nahi", r"nahi karna", r"don.?t want to continue",
    r"chhodo", r"bas karo",
]

REPEAT_PATTERNS = [
    r"repeat", r"say (that )?again", r"phir se", r"dobara", r"fir se",
    r"samajh nahi", r"didn.?t understand", r"kya bola", r"sunai nahi",
]


def matches_any(text, patterns):
    t = text.lower().strip()
    return any(re.search(p, t) for p in patterns)


def guess_lang_key(text):
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"
    hinglish = ["hai", "ho", "karo", "mera", "meri", "mujhe", "kya", "nahi", "karna", "ruko"]
    words = set(re.findall(r"[a-z']+", text.lower()))
    return "hi" if len(words & set(hinglish)) >= 2 else "en"


def last_assistant_reply(history):
    for entry in reversed(history):
        if entry.startswith("MEDIKIOSK AI:"):
            return entry[len("MEDIKIOSK AI:"):].strip()
    return None


# ============================================================
# MEDIKIOSK AI INSTRUCTIONS
# ============================================================

SYSTEM_PROMPT = """
You are MediKiosk AI, the healthcare voice assistant
inside the MediKiosk application.

Your job is to help patients communicate with the
MediKiosk healthcare system using natural conversation.

============================================================
LANGUAGE
============================================================

Support:

- English
- Hindi
- Hinglish

Automatically detect the patient's language.

Reply in the same language the patient uses.

Keep spoken responses to one short sentence, natural and easy to understand.

============================================================
PATIENT INTAKE
============================================================

You can collect:

- Name
- Age
- Gender
- Phone number
- City
- ABHA number
- Chief complaint
- Symptoms
- Duration
- Severity
- Location
- Previous medical conditions
- Previous surgeries
- Current medications
- Allergies
- Family history
- Lifestyle information

Ask ONE question at a time.

Do not ask 10 questions together.

============================================================
SYMPTOM CONVERSATION
============================================================

When a patient describes symptoms:

1. Understand what they are saying.
2. Ask relevant follow-up questions.
3. Collect structured clinical history.
4. Identify possible urgency.
5. Never claim a definite diagnosis.

Example:

Patient:
"Mereko subah se pet mein dard hai."

Assistant:
"Samajh gaya. Pet ke kis hisse mein dard ho raha hai -
upar, neeche, right ya left?"

============================================================
MEDICAL SAFETY
============================================================

You are an AI assistant, not a doctor.

Do NOT:

- Give a definite diagnosis.
- Prescribe prescription medicines.
- Tell patients to stop prescribed medicines.
- Pretend to be a doctor.
- Invent medical information.

If the patient describes a possible emergency such as:

- severe chest pain
- severe breathing difficulty
- unconsciousness
- stroke-like symptoms
- uncontrolled bleeding
- seizure
- severe allergic reaction
- suicidal emergency

Tell the patient to seek immediate emergency medical care.

============================================================
MEDICAL REPORTS
============================================================

When a report is provided:

- Extract available information.
- Explain medical terms simply.
- Identify abnormal values.
- Never invent missing values.
- Recommend discussing concerning findings with a doctor.

============================================================
DOCTOR HANDOFF
============================================================

When enough information has been collected,
the information should be structured for the doctor.

The final clinical summary should contain:

Chief Complaint
History of Present Illness
Associated Symptoms
Past Medical History
Surgical History
Medications
Allergies
Family History
Social History
Relevant Reports
AI Observations
Questions for Doctor

============================================================
VOICE
============================================================

Reply in exactly ONE short sentence. Never more.

If you need to ask something, ask it inside that same sentence.

No emojis, no symbols, no lists, no markdown.

Never repeat or restate the patient's words back to them.

Never reuse the same acknowledgement (like "Samajh gaya" or
"I understand") two turns in a row. Vary it or skip it.

Use simple language.

Be calm and reassuring.

============================================================
PRIVACY
============================================================

Medical information is sensitive.

Never reveal information belonging to another patient.

Only use information provided by the current patient
or authorized MediKiosk systems.
"""


# ============================================================
# SESSION
# ============================================================

def get_session(session_id):

    if session_id not in sessions:

        base = SYSTEM_PROMPT
        if TRAINED_BEHAVIOR:
            base = base + "\n" + TRAINED_BEHAVIOR
        sessions[session_id] = [
            base
        ]

    return sessions[session_id]


# ============================================================
# GEMINI CHAT
# ============================================================

def ask_gemini(session_id, user_message):

    history = get_session(session_id)
    lang_key = guess_lang_key(user_message)

    # --- deterministic routing for safety-critical dataset intents ---
    # Emergency beats everything: zero-latency escalation, never model-dependent.
    if matches_any(user_message, EMERGENCY_PATTERNS):
        answer = sanitize_reply(dataset_response("emergency", lang_key))
        history.append(f"PATIENT: {user_message}")
        history.append(f"MEDIKIOSK AI: {answer}")
        return answer

    if matches_any(user_message, REPEAT_PATTERNS):
        last = last_assistant_reply(history)
        if last:
            answer = f"Of course - repeating: {last}"
            history.append(f"PATIENT: {user_message}")
            history.append(f"MEDIKIOSK AI: {answer}")
            return answer

    if matches_any(user_message, STOP_PATTERNS):
        answer = dataset_response("stop", lang_key)
        sessions.pop(session_id, None)  # end the current intake flow
        history = get_session(session_id)
        history.append(f"PATIENT: {user_message}")
        history.append(f"MEDIKIOSK AI: {answer}")
        return answer

    # --- normal Gemini turn (system prompt carries the trained dataset) ---
    history.append(
        f"PATIENT: {user_message}"
    )

    conversation = "\n\n".join(history)

    response = client.models.generate_content(
        model=MODEL,
        contents=conversation
    )

    answer = response.text

    answer = sanitize_reply(answer)

    history.append(
        f"MEDIKIOSK AI: {answer}"
    )

    return answer


# ============================================================
# TEXT CHAT API
# ============================================================

# ============================================================
# DOCUMENT SCAN — extract structured details from a medical document
# ============================================================

SCAN_PROMPT = """You are MediKiosk's medical document parser.
Extract the key details from this medical document image (prescription,
lab report, discharge summary, etc.).

Return ONLY a JSON object, no markdown fences, matching exactly:
{
  "doc_type": "prescription | lab_report | discharge_summary | other",
  "patient_name": "" ,
  "doctor": "",
  "hospital": "",
  "date": "YYYY-MM-DD or empty",
  "diagnosis": "",
  "medicines": [{"name": "", "dose": "", "frequency": "", "duration": ""}],
  "lab_values": [{"test": "", "value": "", "unit": "", "flag": "normal|high|low|"}],
  "notes": ""
}
Use empty string or empty list when a field is not present.
Do not invent values that are not visible in the document."""


@app.post("/scan-document")
async def scan_document(image: UploadFile = File(...)):
    """Extract structured medical details from a photographed document."""
    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty upload")

    mime = (image.content_type or "image/jpeg").split(";")[0].strip().lower()
    if mime not in ("image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"):
        mime = "image/jpeg"

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=[
                types.Part.from_bytes(data=raw, mime_type=mime),
                SCAN_PROMPT,
            ],
        )
        text = (response.text or "").strip()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini extraction failed: {exc}")

    # Robust JSON parse (strip fences, take the outermost {...} block)
    cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if not match:
        raise HTTPException(status_code=502, detail="Model did not return JSON")
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Invalid JSON from model")

    data["extracted_at"] = datetime.now(timezone.utc).isoformat()
    return data


@app.post("/chat/{session_id}")
async def chat(
    session_id: str,
    message: str
):

    answer = ask_gemini(
        session_id,
        message
    )

    return {
        "session_id": session_id,
        "user_message": message,
        "response": answer
    }


# ============================================================
# SPEECH TO TEXT
# ============================================================

async def transcribe_audio(audio_bytes, mime_type="audio/webm"):

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(
                data=audio_bytes,
                mime_type=mime_type
            ),
            """
            Transcribe this patient's speech accurately.

            Detect whether the patient is speaking:
            Hindi, English or Hinglish.

            Return ONLY the transcription.
            """
        ]
    )

    return response.text


# ============================================================
# VOICE CHAT
# ============================================================

@app.post("/voice/{session_id}")
async def voice_chat(
    session_id: str,
    audio: UploadFile = File(...)
):

    audio_bytes = await audio.read()

    # Browsers record via MediaRecorder as audio/webm (Chrome) or audio/mp4 (Safari);
    # keep the mime Gemini expects intact.
    mime = (audio.content_type or "audio/webm").split(";")[0].strip()
    if mime not in ("audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/wave"):
        mime = "audio/webm"

    # ------------------------------------
    # STEP 1: SPEECH -> TEXT
    # ------------------------------------

    transcript = await transcribe_audio(
        audio_bytes,
        mime_type=mime
    )

    print(
        f"\nPATIENT: {transcript}"
    )

    # ------------------------------------
    # STEP 2: GEMINI
    # ------------------------------------

    ai_response = ask_gemini(
        session_id,
        transcript
    )

    print(
        f"MEDIKIOSK: {ai_response}"
    )

    return {
        "session_id": session_id,
        "transcript": transcript,
        "response": ai_response
    }


# ============================================================
# NATURAL TTS (Gemini speech generation) -> WAV
# ============================================================

def pcm_to_wav(pcm: bytes, sample_rate: int = 24000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)          # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(pcm)
    return buf.getvalue()


@app.post("/tts")
async def tts(text: str):
    global _tts_model_index

    if not text.strip():
        raise HTTPException(status_code=400, detail="empty text")

    last_error = None
    for attempt in range(len(TTS_MODELS)):
        model = TTS_MODELS[(_tts_model_index + attempt) % len(TTS_MODELS)]
        try:
            response = client.models.generate_content(
                model=model,
                contents=text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=TTS_VOICE
                            )
                        )
                    ),
                ),
            )
            pcm = response.candidates[0].content.parts[0].inline_data.data
            _tts_model_index = (_tts_model_index + attempt) % len(TTS_MODELS)
            return Response(
                content=pcm_to_wav(pcm),
                media_type="audio/wav",
                headers={"Cache-Control": "no-store"},
            )
        except Exception as e:  # noqa: BLE001 - try the next TTS model
            last_error = e

    raise HTTPException(status_code=502, detail=f"TTS unavailable: {last_error}")


# ============================================================
# RESET SESSION
# ============================================================

@app.delete("/session/{session_id}")
async def delete_session(session_id):

    if session_id in sessions:

        del sessions[session_id]

    return {
        "message": "Patient session cleared"
    }


# ============================================================
# FHIR R4 API (PDF: HIS/EMR integration layer)
# ============================================================

FHIR_BASE = "http://localhost:8000/fhir"

@app.get("/fhir/metadata")
def fhir_metadata():
    """FHIR R4 CapabilityStatement — lets hospital HIS/EMR systems discover us."""
    return {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "date": "2026-09-16",
        "publisher": "MediKiosk (Ministry of Ayush kiosk)",
        "kind": "capability",
        "software": {"name": "MediKiosk", "version": "1.0"},
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "rest": [{
            "mode": "server",
            "resource": [
                {"type": "Patient", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                {"type": "Appointment", "interaction": [{"code": "create"}, {"code": "search-type"}]},
                {"type": "Observation", "interaction": [{"code": "search-type"}]},
                {"type": "DocumentReference", "interaction": [{"code": "create"}, {"code": "search-type"}]}
            ]
        }]
    }

@app.get("/fhir/Patient/{session_id}")
def fhir_patient(session_id: str):
    """Patient + recorded intake as a FHIR bundle for the clinic EMR."""
    history = get_session(session_id)
    intake_turns = [
        h[len("PATIENT: "):] for h in history
        if h.startswith("PATIENT: ")
    ]
    return {
        "resourceType": "Bundle",
        "type": "collection",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "id": session_id,
                    "managingOrganization": {"display": "MediKiosk AYUSH OPD"}
                }
            },
            {
                "resource": {
                    "resourceType": "DocumentReference",
                    "status": "current",
                    "type": {"text": "AI-assisted patient intake transcript"},
                    "description": " | ".join(intake_turns[-20:]) if intake_turns else "No intake recorded"
                }
            }
        ]
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def home():

    return {
        "application": "MediKiosk",
        "status": "running",
        "ai": "Gemini"
    }


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )
