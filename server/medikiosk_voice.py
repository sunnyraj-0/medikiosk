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

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except (ImportError, AttributeError):
    genai = None
    types = None
    HAS_GENAI = False

from groq import Groq

# Load environment variables from current directory and server/.env
load_dotenv()
server_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(server_env):
    load_dotenv(server_env)

# ============================================================
# LLM CLIENTS & CONFIGURATION
# ============================================================

# Gemini (optional - used for multimodal OCR and optional cloud TTS if key is present)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
GEMINI_MODEL = "gemini-3.6-flash"
TTS_MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]
TTS_VOICE = "Kore"
_tts_model_index = 0

# Groq (primary conversational LLM + Whisper STT)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="MediKiosk AI Voice Assistant",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured in-memory sessions: session_id -> {"mode": "chat"|"assessment", "messages": [...]}
sessions = {}


# ============================================================
# DATASET & AYUSH KNOWLEDGE CURATION
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
    except FileNotFoundError:
        pass
    return items


DATASET = load_dataset()


def extract_ayush_knowledge_block():
    """Extracts beneficial AYUSH symptom remedies and dosha advice from the dataset,
    filtering out rigid personal intake patterns."""
    if not DATASET:
        return ""
    
    # Extract remedies and guidance for common symptoms and doshas
    curated = []
    seen = set()
    for item in DATASET:
        intent = item.get("intent", "")
        # Explicitly exclude rigid questionnaire and personal data intake intents
        if intent in ("history_question", "medical_id", "profile_update", "symptom_duration", "symptom_severity"):
            continue
        resp = item.get("response", "")
        lang = item.get("language", "en")
        if (intent, lang) not in seen and len(curated) < 15:
            seen.add((intent, lang))
            if any(k in intent for k in ("symptom", "remedy", "diet", "lifestyle", "vata", "pitta", "kapha", "ayurveda")):
                curated.append(f"- {intent.upper()} ({lang}): {resp}")
    
    if not curated:
        return ""
    return "\nAYUSH CLINICAL REFERENCE & REMEDIES:\n" + "\n".join(curated)


AYUSH_KNOWLEDGE_CONTEXT = extract_ayush_knowledge_block()


# ============================================================
# SYSTEM PROMPTS (MODE A: CHAT vs MODE B: AYUSH ASSESSMENT)
# ============================================================

SYSTEM_PROMPT_CHAT = f"""You are MediKiosk, a compassionate, knowledgeable, and safe healthcare conversational assistant for an Indian medical kiosk.
Your mission is to assist patients with symptoms, general health inquiries, and traditional AYUSH (Ayurveda, Yoga, Naturopathy, Unani, Siddha, Homeopathy) guidance.

PRIMARY CONVERSATIONAL DIRECTIVES:
1. Empathy & Warmth: Greet warmly, acknowledge the user's specific symptom or concern first, and use simple, everyday language suitable for elderly, rural, and low-literacy citizens.
2. Context-Aware Memory: Remember everything the patient has already stated in this session (such as symptom, onset, duration, severity, and existing conditions). NEVER re-ask for duration, severity, or details the user already provided.
3. Focused Clinical Follow-Ups: Ask at most 1 to 3 relevant clinical follow-up questions tailored STRICTLY to their stated concern (e.g. onset, severity on a 0-10 scale, or specific warning signs like fever, vomiting, or breathing trouble).
4. ABSOLUTE PROHIBITION ON UNRELATED INTAKE:
   - NEVER ask for patient identification or registration details (name, age, gender, phone number, city, ABHA number, address) during normal symptom or health conversations.
   - NEVER ask unrelated questionnaire batteries (surgeries, family history, smoking, or alcohol) unless the user explicitly requests a full intake.
   - Do NOT interrogate the patient like a checklist. Talk naturally.
5. Concise Answers: Keep responses concise (2 to 4 sentences maximum) so they read cleanly on a kiosk touch screen and sound comfortable when spoken aloud.

SAFETY & CLINICAL BOUNDARIES:
- You are an AI assistant, NOT a medical doctor.
- NEVER offer a definitive diagnosis or declare a condition with certainty.
- NEVER prescribe prescription medications or advise patients to start, stop, or change prescribed medicines.
- Do NOT equate symptom severity alone with an emergency. A pain score of 8-10/10 should be acknowledged seriously, but it should not automatically produce "call 108" unless emergency red flags are present.
- For severe symptoms without clear emergency red flags, ask 1-3 focused red-flag questions when useful, give cautious non-emergency guidance, and recommend prompt evaluation by a qualified healthcare professional.
- If symptoms suggest a medical emergency (e.g. sudden explosive/thunderclap headache, stroke signs, confusion, seizure, severe breathing difficulty, chest pain with concerning features, significant head injury, stiff neck with high fever), immediately urge emergency medical care (call 108 or go to the nearest emergency clinic).
- Once emergency guidance has already been clearly communicated, do not repeat the full emergency paragraph for brief follow-ups like "that's it?". Instead, give short practical next steps while waiting for help.
- For lasting, worsening, or severe symptoms, explicitly recommend consultation with a qualified healthcare professional without claiming the cause is known.

AYUSH GUIDANCE:
- Suggest traditional, safe AYUSH home remedies (e.g. warm ginger-lemon water, tulsi tea, cumin water for mild indigestion/colds, or cooling foods for excess heat) and dinacharya (daily lifestyle) tips where appropriate.
- Clearly present traditional remedies as supportive comfort measures, never as guaranteed cures.
- If the user asks about Ayurveda concepts (such as Vata, Pitta, Kapha, or Agni), explain them simply without launching into an intake questionnaire.
- If the patient wants a comprehensive constitution assessment, inform them they can say 'health check' to start the guided AYUSH assessment.

LANGUAGE:
- Always reply in the patient's language. Fluent support for: English, Hindi (हिंदी), Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Marathi (मराठी), Bengali (বাংলা), Urdu (اردو), and conversational Hinglish.
{AYUSH_KNOWLEDGE_CONTEXT}"""

SYSTEM_PROMPT_ASSESSMENT = """You are MediKiosk AYUSH Assessment Guide.
The user has explicitly entered the structured AYUSH Health Assessment mode.

Your goal is to guide the user step-by-step through a friendly 5-question evaluation to determine their natural constitution (Prakriti) and digestive balance (Agni).

QUESTIONS TO ASK (ONE QUESTION AT A TIME):
1. Physical Build (Prakriti): Ask whether their natural frame is lean/slender (Vata), medium/muscular (Pitta), or broad/heavy-set (Kapha).
2. Digestion & Appetite (Agni): Ask if their appetite is irregular/variable, sharp/intense, or slow/steady.
3. Temperature Sensitivity: Ask if they are sensitive to cold, sensitive to heat, or tolerate both well.
4. Sleep Pattern: Ask if their sleep is light/interrupted, moderate, or deep/long.
5. Current Discomfort (Vikriti): Ask if they currently feel dry/anxious (Vata), burning/acidity/irritability (Pitta), or heavy/congested/lethargic (Kapha).

RULES FOR ASSESSMENT:
- Ask exactly ONE question at a time.
- Acknowledge their previous answer before moving to the next question.
- Do NOT ask for name, phone, ABHA, or unrelated intake data.
- After all 5 questions are answered, provide a concise summary of their likely AYUSH profile with supportive diet/lifestyle suggestions.
- If the user says 'stop', 'exit', or 'cancel', warmly conclude the assessment and return to normal chat.
- Answer in the user's language."""


# ============================================================
# DETERMINISTIC SAFETY & EMERGENCY ROUTING
# ============================================================

EMERGENCY_PATTERNS = [
    r"severe\s+(chest\s+)?pain.*?(breath|saans)",
    r"(chest|seene|seenay).*(bahut|severe|strong|hurts?|pain).*(dard|pain)?",
    r"(chest|seene|seenay)\s*(hurts?|pain|tightness|pressure)",
    r"(breathing|saans).*(dikkat|problem|difficulty|nahi|nhi)",
    r"trouble\s*breath(ing)?",
    r"short(ness)?\s*of\s*breath",
    r"unconscious|not responding|behosh|behoshi|faint(ing)?",
    r"seizure|daura|fits\b|jhatke|convulsion",
    r"(bolne|speaking|baat).*(dikkat|problem|difficulty).*(weakness|kamzor|side)?",
    r"(difficulty|trouble)\s+(speaking|understanding\s+speech)",
    r"(confusion|confused|altered consciousness|not making sense).*(headache|speaking|speech)?",
    r"(weakness|kamzor|sust).*(ek side|one side|ek taraf)",
    r"(one|left|right)\s*side\s*(is\s*)?weak",
    r"(sudden|suddenly|explosive|thunderclap).*(worst\s*)?headache",
    r"worst\s*headache\s*(of\s*my\s*life)?.*(sudden|suddenly|minutes?|just now)",
    r"headache.*(sudden|suddenly).*((left|right|one)\s*(arm|leg|side)|face).*(weak|numb|droop)",
    r"headache.*((left|right|one)\s*(arm|leg|side)|face).*(sudden|suddenly).*(weak|numb|droop)",
    r"headache.*((left|right|one)\s*(arm|leg|side)|face).*(weak|numb|droop)",
    r"(sudden|suddenly).*((left|right|one)\s*(arm|leg|side)|face).*(weak|numb|droop).*(headache)?",
    r"((left|right|one)\s*(arm|leg|side)|face).*(sudden|suddenly).*(weak|numb|droop).*(headache)?",
    r"headache.*(fever|bukhar).*(stiff neck|neck stiffness|gardan.*akad|gardan.*stiff)",
    r"headache.*(persistent|continuous|bar bar|baar baar).*(vomit|vomiting|ulti)",
    r"headache.*(head injury|hit my head|accident|chot)",
    r"(bleeding|khoon|khun).*(ruk|band|stop|nahi|nhi)",
    r"severe bleeding",
    r"suicide|khudkushi|aadha|paralysis|heart attack|stroke|anaphylaxis",
]

POST_EMERGENCY_FOLLOWUP_PATTERNS = [
    r"^that'?s it\??$",
    r"^what (now|next)\??$",
    r"^now what\??$",
    r"^anything else\??$",
    r"^aur kya\??$",
    r"^bas\??$",
]

ASSESSMENT_TRIGGER_PATTERNS = [
    r"\bhealth\s*check\b",
    r"\b(start|do|begin)\s*(an?\s*)?(ayurveda\s*|ayush\s*)?(health\s*)?assessment\b",
    r"\bayurveda\s*health\s*check\b",
    r"\bprakriti\s*(test|check|quiz)\b",
    r"स्वास्थ्य\s*जांच",
    r"आयुष\s*जांच",
]

STOP_PATTERNS = [
    r"\bstop\b", r"\bcancel\b", r"ruko\b", r"rok do", r"band karo",
    r"cancel karo", r"continue nahi", r"nahi karna", r"don.?t want to continue",
    r"chhodo", r"bas karo", r"\bexit\b", r"\bquit\b"
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
    if re.search(r"[\u0C80-\u0CFF]", text):
        return "kn"
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "ta"
    if re.search(r"[\u0980-\u09FF]", text):
        return "bn"
    if re.search(r"[\u0600-\u06FF]", text):
        return "ur"
    hinglish = ["hai", "ho", "karo", "mera", "meri", "mujhe", "kya", "nahi", "karna", "ruko", "dard", "bukhar"]
    words = set(re.findall(r"[a-z']+", text.lower()))
    return "hi" if len(words & set(hinglish)) >= 2 else "en"


def get_emergency_response(lang_key="en"):
    if lang_key == "hi":
        return "🚨 यह एक आपातकालीन स्थिति (Emergency) हो सकती है। कृपया तुरंत आपातकालीन सेवा (108 पर कॉल करें) या निकटतम अस्पताल जाएं। किसी ऑनलाइन जांच की प्रतीक्षा न करें।"
    if lang_key == "kn":
        return "🚨 ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಾಗಿರಬಹುದು (Emergency). ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ (108) ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ. ಆನ್‌ಲೈನ್ ಮೌಲ್ಯಮಾಪನಕ್ಕಾಗಿ ಕಾಯಬೇಡಿ."
    if lang_key == "ta":
        return "🚨 இது அவசர நிலையாக இருக்கலாம் (Emergency). தயவுசெய்து உடனடியாக அவசர மருத்துவ உதவியை அணுகவும் (108 ஐ அழைக்கவும்) அல்லது அருகிலுள்ள மருத்துவமனைக்குச் செல்லவும்."
    return "🚨 This may be an emergency. Please seek immediate medical attention or contact your local emergency service (call 108) right now. Do not wait for an AI assessment."


def get_post_emergency_followup_response(lang_key="en"):
    if lang_key == "hi":
        return "अभी सबसे जरूरी कदम चिकित्सा मदद लेना है। मदद आने तक खुद ड्राइव न करें, अकेले न रहें, और अगर लक्षण बदलते या बिगड़ते हैं तो आसपास के व्यक्ति को तुरंत बताएं।"
    return "For now, the important step is getting medical help. If you are waiting for help, do not drive yourself, stay with someone if possible, and tell them if anything changes."


EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF\U00002B00-\U00002BFF\U0001F900-\U0001F9FF\U00002700-\U000027BF\u2190-\u21FF\u2B00-\u2BFF\u2700-\u27bf\u2600-\u26ff\uFE0F\u2764\u2705\u274C\u2757\u2049\u203C\u2122\u00A9\u00AE]"
)


def sanitize_reply(text):
    """Cleans excess markdown artifacts while keeping full multi-sentence conversational flow."""
    if not text:
        return text
    # Remove markdown header markers and bullets
    out = re.sub(r'^[#*>\-]+\s*', '', text, flags=re.MULTILINE)
    # Collapse multiple spaces or multiple newlines
    out = re.sub(r'[ \t]+', ' ', out)
    out = re.sub(r'\n{3,}', '\n\n', out)
    return out.strip()


# ============================================================
# SESSION MANAGEMENT & CONVERSATIONAL ENGINE
# ============================================================

def get_session(session_id: str):
    if session_id not in sessions:
        sessions[session_id] = {
            "mode": "chat",
            "messages": [],
            "emergency_escalated": False
        }
    return sessions[session_id]


def ask_groq(session_id: str, user_message: str) -> str:
    session = get_session(session_id)
    lang_key = guess_lang_key(user_message)

    # 1. Deterministic Emergency Escalation (Zero Latency, Pre-LLM)
    if session.get("emergency_escalated") and matches_any(user_message, POST_EMERGENCY_FOLLOWUP_PATTERNS):
        followup_msg = get_post_emergency_followup_response(lang_key)
        session["messages"].append({"role": "user", "content": user_message})
        session["messages"].append({"role": "assistant", "content": followup_msg})
        return followup_msg

    if matches_any(user_message, EMERGENCY_PATTERNS):
        emergency_msg = get_emergency_response(lang_key)
        session["emergency_escalated"] = True
        session["messages"].append({"role": "user", "content": user_message})
        session["messages"].append({"role": "assistant", "content": emergency_msg})
        return emergency_msg

    # 2. Repeat Request
    if matches_any(user_message, REPEAT_PATTERNS):
        last_resp = next((m["content"] for m in reversed(session["messages"]) if m["role"] == "assistant"), None)
        if last_resp:
            repeated = f"Repeating: {last_resp}"
            session["messages"].append({"role": "user", "content": user_message})
            session["messages"].append({"role": "assistant", "content": repeated})
            return repeated

    # 3. Mode Switching: Check for AYUSH Health Assessment Mode Trigger
    if matches_any(user_message, ASSESSMENT_TRIGGER_PATTERNS):
        session["mode"] = "assessment"

    # Stop / Exit during Assessment Mode
    if session.get("mode") == "assessment" and matches_any(user_message, STOP_PATTERNS):
        session["mode"] = "chat"
        exit_msg = "I have stopped the AYUSH assessment. How else can I help you today?"
        session["messages"].append({"role": "user", "content": user_message})
        session["messages"].append({"role": "assistant", "content": exit_msg})
        return exit_msg

    # 4. Select System Prompt according to active mode
    active_prompt = SYSTEM_PROMPT_ASSESSMENT if session.get("mode") == "assessment" else SYSTEM_PROMPT_CHAT

    # 5. Build Structured Messages with sliding window (last 10 turns)
    groq_messages = [{"role": "system", "content": active_prompt}]
    for m in session["messages"][-10:]:
        groq_messages.append({"role": m["role"], "content": m["content"]})
    groq_messages.append({"role": "user", "content": user_message})

    # 6. Call Groq
    if not groq_client:
        return "The MediKiosk AI service is currently initializing. Please check server configuration."

    try:
        print(f"🔥 GROQ CALLED [Mode: {session.get('mode', 'chat')}]:", user_message)
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=groq_messages,
            temperature=0.3,
            max_tokens=350
        )
        answer = response.choices[0].message.content or ""
        answer = sanitize_reply(answer)
    except Exception as exc:
        print(f"Groq Chat API Error: {exc}")
        answer = "I'm having difficulty connecting to my clinical reasoning service right now. Please tell me your symptoms again or consult our on-duty clinic doctor."

    # 7. Record to session history
    session["messages"].append({"role": "user", "content": user_message})
    session["messages"].append({"role": "assistant", "content": answer})

    return answer


# ============================================================
# API ENDPOINTS
# ============================================================

@app.post("/chat/{session_id}")
async def chat(session_id: str, message: str):
    answer = ask_groq(session_id, message)
    return {
        "session_id": session_id,
        "user_message": message,
        "response": answer
    }


# ============================================================
# SPEECH TO TEXT (Groq Whisper with Gemini Fallback)
# ============================================================

async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm", filename: str = "speech.webm") -> str:
    """Transcribes patient speech using Groq's high-speed Whisper model,
    falling back to Gemini if configured."""
    if groq_client:
        try:
            transcription = groq_client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=(filename, audio_bytes),
                response_format="text"
            )
            return str(transcription).strip()
        except Exception as exc:
            print(f"Groq Whisper transcription error: {exc}")

    if client:
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                    "Transcribe this patient speech accurately. Return ONLY the transcription."
                ]
            )
            return (response.text or "").strip()
        except Exception as exc:
            print(f"Gemini STT fallback error: {exc}")

    return ""


@app.post("/voice/{session_id}")
async def voice_chat(session_id: str, audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    mime = (audio.content_type or "audio/webm").split(";")[0].strip()
    if mime not in ("audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/wave"):
        mime = "audio/webm"

    transcript = await transcribe_audio(audio_bytes, mime_type=mime, filename=audio.filename or "speech.webm")
    print(f"\nPATIENT (Voice): {transcript}")

    if not transcript:
        return {
            "session_id": session_id,
            "transcript": "",
            "response": "I could not hear you clearly. Please tap the mic and try again, or type your question below."
        }

    ai_response = ask_groq(session_id, transcript)
    print(f"MEDIKIOSK (Voice Response): {ai_response}")

    return {
        "session_id": session_id,
        "transcript": transcript,
        "response": ai_response
    }


# ============================================================
# TEXT TO SPEECH (Graceful Fallback - Never Crashes with 502)
# ============================================================

def pcm_to_wav(pcm: bytes, sample_rate: int = 24000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm)
    return buf.getvalue()


@app.post("/tts")
async def tts(text: str):
    """Synthesizes speech via Gemini TTS if configured; otherwise returns 204 No Content
    allowing the frontend to seamlessly use browser SpeechSynthesis without throwing 502."""
    global _tts_model_index

    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty text")

    if not client:
        # Server TTS not configured (GEMINI_API_KEY absent); return 204 No Content
        return Response(status_code=204, headers={"X-TTS-Status": "BrowserFallback"})

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
        except Exception as e:
            last_error = e

    return Response(status_code=204, headers={"X-TTS-Status": "BrowserFallback"})


# ============================================================
# DOCUMENT SCANNING (ISOLATED GEMINI MULTIMODAL FEATURE)
# ============================================================

SCAN_PROMPT = """You are MediKiosk's medical document parser.
Extract key details from this medical document image (prescription, lab report, discharge summary, etc.).

Return ONLY a JSON object with no markdown fences, matching:
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
Use empty string or empty list when a field is not present. Do not invent values."""


@app.post("/scan-document")
async def scan_document(image: UploadFile = File(...)):
    """Extracts structured medical details from an uploaded or photographed document.
    Isolated from conversational chat."""
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Document OCR scanning requires GEMINI_API_KEY to be configured in server/.env"
        )

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty upload")

    mime = (image.content_type or "image/jpeg").split(";")[0].strip().lower()
    if mime not in ("image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"):
        mime = "image/jpeg"

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=raw, mime_type=mime),
                SCAN_PROMPT,
            ],
        )
        text = (response.text or "").strip()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Document extraction failed: {exc}")

    cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if not match:
        raise HTTPException(status_code=502, detail="Model did not return valid JSON")
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Invalid JSON from OCR parser")

    data["extracted_at"] = datetime.now(timezone.utc).isoformat()
    return data


# ============================================================
# RESET SESSION
# ============================================================

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    if session_id in sessions:
        del sessions[session_id]
    return {"message": "Patient session cleared"}


# ============================================================
# FHIR R4 API (HIS/EMR INTEGRATION LAYER)
# ============================================================

FHIR_BASE = "http://localhost:8000/fhir"

@app.get("/fhir/metadata")
def fhir_metadata():
    return {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "date": "2026-09-19",
        "publisher": "MediKiosk (Ministry of Ayush kiosk)",
        "kind": "capability",
        "software": {"name": "MediKiosk", "version": "2.0"},
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
    session = get_session(session_id)
    intake_turns = [m["content"] for m in session.get("messages", []) if m["role"] == "user"]
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
# HEALTH CHECK & PROBE
# ============================================================

@app.get("/")
def home():
    return {
        "application": "MediKiosk",
        "status": "running",
        "ai": "Groq",
        "model": GROQ_MODEL,
        "tts": bool(client),
        "stt": bool(groq_client)
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
