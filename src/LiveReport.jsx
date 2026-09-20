import { useEffect, useRef, useState } from 'react';
import {
  detectRedFlags,
  RED_FLAG_RESPONSE,
  addClinicalAlert,
  addTimelineEvent,
  suggestDepartment,
  markChatTopic
} from './clinical';

// ---------- speech language mapping (mirrors VoiceAssistant.jsx) ----------
const LANGS = {
  'हिंदी': 'hi-IN',
  'English': 'en-IN',
  'ಕನ್ನಡ': 'kn-IN',
  'தமிழ்': 'ta-IN',
  'मराठी': 'mr-IN',
  'বাংলা': 'bn-IN',
  'اردو': 'ur-IN'
};
const TTS_LANGS = {
  'English': 'en',
  'हिंदी': 'hi-IN',
  'ಕನ್ನಡ': 'kn-IN',
  'தமிழ்': 'ta-IN',
  'मराठी': 'mr-IN',
  'বাংলা': 'bn-IN',
  'اردو': 'ur-IN'
};
const LANGUAGE_LIST = Object.keys(LANGS);

// Free-text signals that the answer talks about medication — unlocks the
// Medicine Times card on the dashboard, same rule as the AI chat.
const MEDICINE_MENTION_RE = /(medicine|medicines|medication|tablet|capsule|syrup|dose|dosage|prescri|dawa|dawai|goli)/i;

const IMPRESSION_SECONDS = 10;

// The nurse-free kiosk interview: asked aloud, answered by voice or text.
const QUESTIONS = [
  { en: 'What is the main problem you are facing today? Describe it in your own words.', hi: 'आज आपकी मुख्य समस्या क्या है? अपने शब्दों में बताइए।' },
  { en: 'Since how many days have you had this problem?', hi: 'यह समस्या कितने दिनों से है?' },
  { en: 'How severe is the discomfort — mild, moderate or severe?', hi: 'तकलीफ़ कितनी तेज़ है — हल्की, मध्यम या तेज़?' },
  { en: 'Are you currently taking any medicines? If yes, which ones?', hi: 'क्या आप अभी कोई दवा ले रहे हैं? यदि हाँ, तो कौन सी?' },
  { en: 'Do you have any allergies, or any past surgeries we should know about?', hi: 'क्या आपको कोई एलर्जी है, या पहले कोई ऑपरेशन हुआ है?' },
  { en: 'Anything else the doctor should know before your appointment?', hi: 'डॉक्टर को अपॉइंटमेंट से पहले और कुछ बताना चाहेंगे?' }
];

const UI = {
  title: { en: 'Live Reporting', hi: 'लाइव रिपोर्टिंग' },
  openCamera: { en: 'Open Camera', hi: 'कैमरा खोलें' },
  cameraHint: { en: 'We record a short first impression, then ask a few questions to prepare your report.', hi: 'हम पहले आपका संक्षिप्त परिचय रिकॉर्ड करते हैं, फिर रिपोर्ट तैयार करने के लिए कुछ सवाल पूछेंगे।' },
  startImpression: { en: 'Record First Impression', hi: 'पहली झलक रिकॉर्ड करें' },
  recording: { en: 'Recording', hi: 'रिकॉर्डिंग' },
  reRecord: { en: 'Record Again', hi: 'फिर से रिकॉर्ड करें' },
  impressionDone: { en: 'First impression recorded', hi: 'पहली झलक रिकॉर्ड हो गई' },
  skipCamera: { en: 'Continue without camera', hi: 'कैमरा के बिना आगे बढ़ें' },
  camError: { en: 'Camera not available here. You can still answer the questions below.', hi: 'यहाँ कैमरा उपलब्ध नहीं है। आप नीचे सवालों के जवाब दे सकते हैं।' },
  question: { en: 'Question', hi: 'सवाल' },
  of: { en: 'of', hi: '/' },
  listenAgain: { en: '🔊 Listen again', hi: '🔊 फिर से सुनें' },
  tapSpeak: { en: '🎤 Tap & Speak', hi: '🎤 दबाकर बोलें' },
  listening: { en: '⏹ Listening… tap to stop', hi: '⏹ सुन रहा हूँ… रोकने के लिए दबाएँ' },
  typePlaceholder: { en: 'Or type your answer…', hi: 'या अपना जवाब लिखें…' },
  send: { en: 'Send', hi: 'भेजें' },
  skipQ: { en: 'Skip this question', hi: 'यह सवाल छोड़ें' },
  voiceUnsupported: { en: 'Voice input needs Chrome/Edge — please type your answer below.', hi: 'आवाज़ से जवाब के लिए Chrome/Edge चाहिए — कृपया नीचे लिखकर बताएँ।' },
  reportReady: { en: 'Report Prepared', hi: 'रिपोर्ट तैयार' },
  reportSub: { en: 'Prepared after hearing your answers', hi: 'आपके जवाब सुनकर तैयार किया गया' },
  yourAnswers: { en: 'Your answers', hi: 'आपके जवाब' },
  noAnswer: { en: '(skipped)', hi: '(छोड़ा गया)' },
  flagsTitle: { en: 'Clinical Alert', hi: 'चिकित्सीय चेतावनी' },
  deptTitle: { en: 'Suggested department', hi: 'सुझाया विभाग' },
  savedNote: { en: 'Saved to your Medical Timeline ✓', hi: 'आपकी मेडिकल टाइमलाइन में सुरक्षित ✓' },
  backDashboard: { en: 'Back to Dashboard', hi: 'डैशबोर्ड पर वापस' },
  impressionChip: { en: '📸 First impression', hi: '📸 पहली झलक' }
};

const isElectron = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);
const hasWebSpeech = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
const hasRecorder = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';

export default function LiveReport({ selectedLanguage = 'English', onBack }) {
  const [lang, setLang] = useState(selectedLanguage);
  const isHi = lang === 'हिंदी';
  const t = (entry) => (isHi && entry.hi ? entry.hi : entry.en);

  const [stage, setStage] = useState('camera'); // camera -> questions -> report
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordLeft, setRecordLeft] = useState(0);
  const [clipUrl, setClipUrl] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [flags, setFlags] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');
  const [report, setReport] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const countdownRef = useRef(null);
  const recRef = useRef(null);
  const speakTokenRef = useRef(0);

  // Stop everything when leaving the screen: camera, mic, timers, speech.
  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (recRef.current && recRef.current.stop) { try { recRef.current.abort(); } catch (e) {} }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setClipUrl((url) => { if (url) URL.revokeObjectURL(url); return null; });
  }, []);

  // Speak each question as it appears.
  useEffect(() => {
    if (stage !== 'questions') return;
    speak(QUESTIONS[qIndex][isHi ? 'hi' : 'en']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, qIndex]);

  const pickVoice = () => {
    if (!('speechSynthesis' in window)) return null;
    const want = (TTS_LANGS[lang] || 'en').toLowerCase();
    const base = want.split('-')[0];
    const norm = (v) => (v.lang || '').replace('_', '-').toLowerCase();
    const voices = window.speechSynthesis.getVoices() || [];
    return voices.find((v) => norm(v) === want)
      || voices.find((v) => norm(v).split('-')[0] === base)
      || null;
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window) || !text) return;
    speakTokenRef.current += 1;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = TTS_LANGS[lang] || 'en';
    u.rate = 0.95;
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const stopListening = () => {
    if (recRef.current) { try { recRef.current.stop(); } catch (e) {} }
    setListening(false);
  };

  const startListening = () => {
    if (listening) { stopListening(); return; }
    if (speaking && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (!hasWebSpeech || isElectron) {
      setNotice(t(UI.voiceUnsupported));
      return;
    }
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recRef.current = recognition;
      recognition.lang = LANGS[lang] || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = (event.results?.[0]?.[0]?.transcript || '').trim();
        setListening(false);
        if (transcript) handleAnswer(transcript);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognition.start();
      setListening(true);
      setNotice('');
    } catch (e) {
      setListening(false);
      setNotice(t(UI.voiceUnsupported));
    }
  };

  // ---------- camera + first impression ----------
  const startCamera = async () => {
    setNotice('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 } },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamReady(true);
      setCamError(false);
    } catch (e) {
      setCamError(true);
      setCamReady(false);
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    const scale = 480 / video.videoWidth;
    canvas.width = 480;
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  };

  const releaseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setCamReady(false);
  };

  const startImpression = () => {
    const stream = streamRef.current;
    if (!stream) return;
    setNotice('');
    const shot = captureSnapshot();
    if (shot) setSnapshot(shot);

    // No MediaRecorder (or no camera) -> fall back to a photo-only impression.
    if (!hasRecorder) {
      releaseCamera();
      setNotice(t(UI.impressionDone) + ' 📷');
      setTimeout(() => setStage('questions'), 700);
      return;
    }

    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '');
    let recorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch (e) {
      releaseCamera();
      setStage('questions');
      return;
    }
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
      setClipUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return blob.size > 0 ? URL.createObjectURL(blob) : old;
      });
      setRecording(false);
      setRecordLeft(0);
      releaseCamera();
      setTimeout(() => setStage('questions'), 700);
    };
    recorderRef.current = recorder;
    recorder.start(250);
    setRecording(true);
    setRecordLeft(IMPRESSION_SECONDS);
    countdownRef.current = setInterval(() => {
      setRecordLeft((s) => {
        if (s <= 1) {
          if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
          if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // ---------- interview + report ----------
  const handleAnswer = (text) => {
    const clean = (text || '').trim();
    if (!clean) return;
    const questionText = QUESTIONS[qIndex][isHi ? 'hi' : 'en'];
    const nextFlags = detectRedFlags(clean);
    if (nextFlags.length) {
      addClinicalAlert(nextFlags, 'Live Report', questionText);
      setFlags((f) => [...f, ...nextFlags]);
    }
    if (MEDICINE_MENTION_RE.test(clean)) markChatTopic('medicines');

    const nextAnswers = [...answers];
    nextAnswers[qIndex] = clean;
    setAnswers(nextAnswers);

    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      prepareReport(nextAnswers);
    }
  };

  const prepareReport = (finalAnswers) => {
    const combined = finalAnswers.filter(Boolean).join(' ');
    const dept = suggestDepartment(combined);
    addTimelineEvent(
      'Live report recorded',
      [
        `${finalAnswers.filter(Boolean).length}/${QUESTIONS.length} answers`,
        snapshot ? 'first-impression photo' : '',
        clipUrl ? `${IMPRESSION_SECONDS}s video` : '',
        flags.length ? `red flags: ${flags.join(', ')}` : '',
        combined.slice(0, 160)
      ].filter(Boolean).join(' · '),
      'report',
      flags.length > 0
    );
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setReport({ dept });
    setStage('report');
  };

  // ---------- render ----------
  const progressBar = (pct) => (
    <div className="h-1 bg-gray-300 rounded-full overflow-hidden mb-4">
      <div className="h-full bg-green-700" style={{ width: `${pct}%` }}></div>
    </div>
  );

  if (stage === 'camera') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden relative z-10 h-screen flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
            <button onClick={onBack} className="text-xs font-bold text-gray-700 hover:text-gray-900">‹ {t(UI.backDashboard)}</button>
            <p className="text-xs font-semibold text-gray-600 uppercase">📹 {t(UI.title)}</p>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-1.5 py-1 bg-white"
              aria-label="Language"
            >
              {LANGUAGE_LIST.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6">
            <p className="text-sm text-gray-700 font-medium mb-4">{t(UI.cameraHint)}</p>

            <div className="bg-black rounded-lg mb-4 aspect-video flex items-center justify-center relative overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${camReady ? '' : 'hidden'}`}
              />
              {!camReady && (
                <div className="text-center px-4">
                  <p className="text-4xl mb-2">📹</p>
                  <p className="text-xs text-gray-300">{camError ? t(UI.camError) : isElectron ? t(UI.camError) : ''}</p>
                </div>
              )}
              {recording && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  {t(UI.recording)} · {recordLeft}s
                </div>
              )}
            </div>

            {clipUrl && (
              <div className="mb-4">
                <p className="text-xs font-bold text-green-700 mb-1">✓ {t(UI.impressionDone)}</p>
                <video src={clipUrl} controls className="w-full rounded-lg" />
              </div>
            )}

            {snapshot && !clipUrl && (
              <p className="text-xs font-bold text-green-700 mb-4">✓ {t(UI.impressionDone)} 📷</p>
            )}

            {!camReady ? (
              <button
                onClick={startCamera}
                disabled={recording}
                className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-2"
              >
                {t(UI.openCamera)}
              </button>
            ) : (
              <button
                onClick={startImpression}
                disabled={recording}
                className={`w-full py-3 rounded-lg font-semibold text-white transition mb-2 ${recording ? 'bg-red-600' : 'bg-green-700 hover:bg-green-800'}`}
              >
                {recording ? `⏺ ${t(UI.recording)} ${recordLeft}s` : t(UI.startImpression)}
              </button>
            )}

            <button
              onClick={() => { stopListening(); releaseCamera(); setStage('questions'); }}
              className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              {camError || isElectron ? t(UI.skipCamera) : clipUrl || snapshot ? t(UI.skipCamera) : t(UI.skipCamera)}
            </button>

            {notice && <p className="text-xs text-gray-600 mt-3">{notice}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'questions') {
    const q = QUESTIONS[qIndex];
    const progress = ((qIndex + 1) / QUESTIONS.length) * 100;
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden relative z-10 h-screen flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 shrink-0">
            <p className="text-xs font-semibold text-gray-600 uppercase">
              📹 {t(UI.title)} · {t(UI.question)} {qIndex + 1} {t(UI.of)} {QUESTIONS.length}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
            {progressBar(progress)}

            {(snapshot || clipUrl) && (
              <p className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 inline-block mb-3">
                {t(UI.impressionChip)} {clipUrl ? `· ${IMPRESSION_SECONDS}s 🎥` : '📷'}
              </p>
            )}

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
              <p className="text-sm font-bold text-gray-900">{q[isHi ? 'hi' : 'en']}</p>
              <button onClick={() => speak(q[isHi ? 'hi' : 'en'])} className="text-xs font-bold text-green-700 underline mt-2">
                {t(UI.listenAgain)}
              </button>
              {speaking && <span className="text-[11px] text-blue-600 ml-2">🔊</span>}
            </div>

            <button
              onClick={startListening}
              className={`w-full py-3 rounded-xl font-bold text-white transition mb-2 ${listening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'}`}
            >
              {listening ? t(UI.listening) : t(UI.tapSpeak)}
            </button>

            <div className="flex gap-2 mb-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { handleAnswer(input); setInput(''); } }}
                placeholder={t(UI.typePlaceholder)}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-700"
              />
              <button
                onClick={() => { if (input.trim()) { handleAnswer(input); setInput(''); } }}
                className="px-4 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800 transition"
              >
                ➤
              </button>
            </div>

            <button
              onClick={() => handleAnswer('Skipped')}
              className="w-full bg-gray-100 text-gray-600 py-2 rounded-lg font-semibold text-xs hover:bg-gray-200 transition"
            >
              {t(UI.skipQ)}
            </button>

            {notice && <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-3">{notice}</p>}
          </div>
        </div>
      </div>
    );
  }

  // stage === 'report'
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden relative z-10 h-screen flex flex-col">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 shrink-0">
          <p className="text-xs font-semibold text-gray-600 uppercase">📋 {t(UI.title)}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6">
          <h2 className="text-lg font-bold text-green-700 text-center mb-1">✓ {t(UI.reportReady)}</h2>
          <p className="text-xs text-gray-600 text-center mb-4">{t(UI.reportSub)}</p>

          {snapshot && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-700 mb-1">{t(UI.impressionChip)}</p>
              <img src={snapshot} alt="First impression" className="w-full rounded-lg border border-gray-200" />
            </div>
          )}
          {clipUrl && (
            <video src={clipUrl} controls className="w-full rounded-lg mb-4" />
          )}

          <p className="text-xs font-bold text-gray-700 mb-2">{t(UI.yourAnswers)}</p>
          <div className="space-y-2 mb-4">
            {QUESTIONS.map((q, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-[11px] font-bold text-gray-500">{t(UI.question)} {i + 1}</p>
                <p className="text-xs font-semibold text-gray-900">{q[isHi ? 'hi' : 'en']}</p>
                <p className="text-xs text-gray-700 mt-1">{answers[i] || t(UI.noAnswer)}</p>
              </div>
            ))}
          </div>

          {flags.length > 0 && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3 mb-3">
              <p className="text-xs font-bold text-red-700 mb-1">🚩 {t(UI.flagsTitle)}</p>
              <p className="text-xs text-red-700 font-medium">{flags.join(' · ')}</p>
              <p className="text-[11px] text-red-700 mt-1">{RED_FLAG_RESPONSE}</p>
            </div>
          )}

          {report?.dept && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-3">
              <p className="text-xs font-bold text-green-700 mb-1">🏥 {t(UI.deptTitle)}</p>
              <p className="text-sm text-gray-900 font-semibold">{report.dept}</p>
            </div>
          )}

          <p className="text-xs text-green-700 font-semibold text-center mb-4">{t(UI.savedNote)}</p>

          <button
            onClick={onBack}
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition"
          >
            {t(UI.backDashboard)}
          </button>
        </div>
      </div>
    </div>
  );
}
