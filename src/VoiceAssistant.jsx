import { useEffect, useRef, useState } from 'react';
import {
  detectRedFlags,
  RED_FLAG_RESPONSE,
  POST_RED_FLAG_RESPONSE,
  POST_RED_FLAG_FOLLOWUP_RE,
  addClinicalAlert,
  markChatTopic
} from './clinical';

// Free-text signals that the patient is talking about their medication —
// unlocks the Medicine Times card on the dashboard.
const MEDICINE_MENTION_RE = /(medicine|medicines|medication|tablet|capsule|syrup|dose|dosage|prescri|dawa|dawai|goli|awas)/i;

// ---------- speech language mapping ----------
const LANGS = {
  'हिंदी': 'hi-IN',
  'English': 'en-IN',
  'ಕನ್ನಡ': 'kn-IN',
  'தமிழ்': 'ta-IN',
  'मराठी': 'mr-IN',
  'বাংলা': 'bn-IN',
  'اردو': 'ur-IN'
};

// Locale codes used for the TTS path only (speech recognition keeps LANGS above).
// English maps to the plain 'en' BCP-47 base tag; everything else to its full locale.
const TTS_LANGS = {
  'English': 'en',
  'हिंदी': 'hi-IN',
  'ಕನ್ನಡ': 'kn-IN',
  'தமிழ்': 'ta-IN',
  'मराठी': 'mr-IN',
  'বাংলা': 'bn-IN',
  'اردو': 'ur-IN',
};

const LANG_GENDER = {
  'हिंदी': 'feminine', 'English': 'feminine', 'ಕನ್ನಡ': 'feminine',
  'தமிழ்': 'feminine', 'मराठी': 'feminine', 'বাংলা': 'feminine', 'اردو': 'feminine'
};

const LANG_NAME = {
  'हिंदी': 'Hindi', 'English': 'English', 'ಕನ್ನಡ': 'Kannada',
  'தமிழ்': 'Tamil', 'मराठी': 'Marathi', 'বাংলা': 'Bengali', 'اردو': 'Urdu'
};

// ---------- Gemini backend (Python FastAPI voice server) ----------
const API_BASE = (() => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  const host = window.location.hostname;
  return host && host !== 'localhost' && host !== '127.0.0.1'
    ? `http://${host}:8000`
    : 'http://localhost:8000';
})();

const sessionId = () => {
  if (!window.__mkVoiceSession) {
    window.__mkVoiceSession = 'kiosk-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
  }
  return window.__mkVoiceSession;
};

async function backendChat(text) {
  const res = await fetch(`${API_BASE}/chat/${sessionId()}?message=${encodeURIComponent(text)}`, { method: 'POST' });
  if (!res.ok) throw new Error(`backend ${res.status}`);
  const data = await res.json();
  return data.response;
}

async function backendVoice(blob) {
  const fd = new FormData();
  fd.append('audio', blob, 'speech.webm');
  const res = await fetch(`${API_BASE}/voice/${sessionId()}?transcribe_only=true`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`backend ${res.status}`);
  const data = await res.json();
  return { transcript: (data.transcript || '').trim() };
}

// ---------- small text helpers ----------
const isAscii = (s) => /^[\x00-\x7F]+$/.test(s);
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Word-boundary match for short ASCII words, plain includes otherwise (Devanagari etc.)
const matches = (t, kws) =>
  kws.some((kw) => {
    const k = kw.toLowerCase();
    if (isAscii(k) && k.length <= 4) return new RegExp(`\\b${escapeRegExp(k)}\\b`).test(t);
    return t.includes(k);
  });

const MAX_RECORD_SECONDS = 20; // hard cap for one spoken turn
const VOICE_STATE = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
  ERROR: 'ERROR',
};

const CLEAR = { followUp: null, assessIndex: null, assessAnswers: [] };

// Words that read as an "answer" to a follow-up question (e.g. "since 2 days", "severe", "yes")
const TIME_WORDS = [
  'days', 'day', 'week', 'month', 'since', 'yesterday', 'today', 'morning', 'night', 'evening',
  'hours', 'hour', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'ten',
  'severe', 'mild', 'bad', 'okay', 'ok', 'yes', 'no', 'haan', 'nahi', 'know', 'pata', 'don',
  'हां', 'हाँ', 'नहीं', 'पता', 'कल', 'आज', 'दिन', 'हफ्ता', 'हफ्ते', 'महीना', 'महीने', 'साल',
  'सुबह', 'रात', 'शाम', 'घंटा', 'घंटे', 'बहुत', 'तेज़', 'हल्का', 'ज़्यादा', 'ज्यादा', 'कम', 'बुरा', 'ठीक',
];

// ---------- knowledge base (English + Hindi) ----------
const GREETING = {
  en: "Namaste, I'm MediKiosk.gov.in, your AYUSH health assistant — tell me a symptom (headache, fever, stomach, cold, stress, sleep), ask about Vata/Pitta/Kapha, or say 'health check' and I'll ask you 8 questions to build your Ayurveda profile.",
  hi: "नमस्ते, मैं MediKiosk.gov.in हूँ, आपकी आयुष स्वास्थ्य सहायक — कोई लक्षण बताइए (सिरदर्द, बुखार, पेट, खांसी, तनाव, नींद), वात/पित्त/कफ के बारे में पूछिए, या 'स्वास्थ्य जांच' कहिए और मैं आपसे 8 सवाल पूछकर आपकी आयुर्वेद प्रोफ़ाइल बनाऊँगा।",
};

const SOCIAL = {
  howareyou: {
    en: "I'm always feeling great — it's my job! 😄 More importantly, how are you feeling today?",
    hi: "मैं तो हमेशा बढ़िया हूँ — यही तो मेरा काम है! 😄 सबसे ज़रूरी — आप आज कैसा महसूस कर रहे हैं?",
  },
  thanks: {
    en: "You're most welcome! 💚 Anything else you'd like to ask about?",
    hi: "आपका स्वागत है! 💚 क्या कुछ और पूछना चाहेंगे?",
  },
  bye: {
    en: "Take care and stay healthy! 🌿 Remember: regular routine and warm, fresh food keep you balanced. See you soon!",
    hi: "अपना ख्याल रखें और स्वस्थ रहें! 🌿 याद रखें: नियमित दिनचर्या और गर्म, ताज़ा भोजन आपको संतुलित रखते हैं। फिर मिलेंगे!",
  },
  help: {
    en: "You can ask me: 1️⃣ Tell me a symptom (headache, fever, stomach, cold, stress, sleep...) 2️⃣ Ask about Vata, Pitta or Kapha 3️⃣ Ask for home remedies or diet/lifestyle tips 4️⃣ Say 'health check' and I'll guide you through an AYUSH assessment. What would you like?",
    hi: "आप मुझसे पूछ सकते हैं: 1️⃣ कोई लक्षण बताएँ (सिरदर्द, बुखार, पेट, खांसी, तनाव, नींद...) 2️⃣ वात, पित्त या कफ के बारे में 3️⃣ घरेलू उपाय या आहार/जीवनशैली की सलाह 4️⃣ 'स्वास्थ्य जांच' कहें और मैं आपकी आयुष जाँच करूँगा। आप क्या चाहेंगे?",
  },
  emergency: {
    en: "🚨 If this is a real emergency, please call 108 (ambulance) or go to the nearest hospital RIGHT NOW. I'm a health-information assistant, not a substitute for urgent medical care. Stay safe!",
    hi: "🚨 अगर यह वास्तविक आपातकाल है, तो कृपया तुरंत 108 (एम्बुलेंस) पर कॉल करें या निकटतम अस्पताल जाएँ। मैं एक स्वास्थ्य-सूचना सहायक हूँ, तत्काल चिकित्सा का विकल्प नहीं। सुरक्षित रहें!",
  },
  navigation: {
    en: "For appointments and medical records, use the dashboard buttons (📅 Appointments / 📋 My Records). As your assistant, I can help with symptoms, doshas and home remedies — what's bothering you today?",
    hi: "अपॉइंटमेंट और मेडिकल रिकॉर्ड के लिए डैशबोर्ड के बटन इस्तेमाल करें (📅 अपॉइंटमेंट / 📋 मेरे रिकॉर्ड)। मैं लक्षण, दोष और घरेलू उपायों में मदद कर सकता हूँ — आज क्या परेशानी है?",
  },
  diet: {
    en: "A sattvic diet keeps all doshas balanced: 🌾 warm, freshly cooked meals; plenty of vegetables and dal; ghee in moderation; seasonal fruits; and herbal teas (tulsi, ginger, jeera). Avoid cold drinks, fried & packaged food, and eating late. What do you usually eat? I can suggest tweaks.",
    hi: "सात्विक आहार सभी दोषों को संतुलित रखता है: 🌾 गर्म, ताज़ा पका भोजन; भरपूर सब्ज़ियाँ और दाल; संतुलित घी; मौसमी फल; और हर्बल चाय (तुलसी, अदरक, जीरा)। ठंडे पेय, तला-भुना, पैकेज्ड खाना और देर से खाना बचें। आप आमतौर पर क्या खाते हैं? मैं सुझाव दे सकता हूँ।",
  },
  lifestyle: {
    en: "Dinacharya (daily routine) is Ayurveda's secret: ☀️ wake before sunrise, drink warm water, scrape your tongue, exercise or yoga, make lunch the biggest meal, walk after dinner, and sleep by 10–11 pm. Consistency beats intensity! Want help with any part?",
    hi: "दिनचर्या आयुर्वेद का राज़ है: ☀️ सूर्योदय से पहले जागें, गुनगुना पानी पिएँ, जीभ साफ़ करें, व्यायाम या योग करें, दोपहर का खाना सबसे बड़ा रखें, रात के खाने के बाद टहलें, और रात 10–11 बजे तक सोएँ। निरंतरता ही सफलता है! किसी हिस्से में मदद चाहिए?",
  },
  remedy: {
    en: "I'd love to help with that! 🌿 Tell me your symptom (headache, cold, stomach, stress, sleep...) and I'll give you an Ayurvedic home remedy. What's bothering you?",
    hi: "मुझे खुशी होगी मदद करने में! 🌿 अपना लक्षण बताइए (सिरदर्द, खांसी, पेट, तनाव, नींद...) और मैं आयुर्वेदिक घरेलू उपाय बताऊँगा। क्या परेशानी है?",
  },
  default: {
    en: "I'm not sure I understood that. 🤔 You can tell me a symptom (headache, fever, stomach, cold, stress, sleep...), ask about Vata/Pitta/Kapha, say 'health check', or ask for diet or lifestyle tips. Try rephrasing?",
    hi: "मुझे ठीक से समझ नहीं आया। 🤔 आप कोई लक्षण बता सकते हैं (सिरदर्द, बुखार, पेट, खांसी, तनाव, नींद...), वात/पित्त/कफ के बारे में पूछ सकते हैं, 'स्वास्थ्य जांच' कह सकते हैं, या आहार-जीवनशैली की सलाह माँग सकते हैं। दोबारा बताइए?",
  },
  closingYes: {
    en: "Great! 🌿 Daily tip: warm freshly cooked meals, tulsi-ginger tea through the day, and a 15-minute evening walk. Say any symptom or 'health check' for more specific guidance!",
    hi: "बहुत बढ़िया! 🌿 रोज़ की सलाह: गर्म ताज़ा पका भोजन, दिन में तुलसी-अदरक चाय, और शाम को 15 मिनट की सैर। किसी लक्षण या 'स्वास्थ्य जांच' के लिए बोलें!",
  },
  closingNo: {
    en: "Anytime! Stay healthy 💚 Whenever you need me, tell me a symptom or say 'health check'.",
    hi: "ठीक है! स्वस्थ रहें 💚 जब भी ज़रूरत हो, कोई लक्षण बताएँ या 'स्वास्थ्य जांच' कहें।",
  },
};

const SYMPTOMS = {
  headache: {
    reply: {
      en: "I'm sorry to hear you have a headache. 😔 In Ayurveda it's often a Vata or Pitta imbalance. Common triggers: dehydration, skipped meals, screen time, or stress. — How long have you had it, and is it on one side or all over?",
      hi: "सिरदर्द की बात सुनकर दुख हुआ। 😔 आयुर्वेद में यह अक्सर वात या पित्त असंतुलन होता है। सामान्य कारण: पानी कम पीना, खाना छोड़ना, स्क्रीन टाइम या तनाव। — यह कितने समय से है, और एक तरफ है या पूरे सिर में?",
    },
    remedy: {
      en: "For quick relief try: 💧 warm water, cooling sandalwood or peppermint oil on the forehead, rest in a dim room, and gentle massage of the temples with warm sesame oil. Avoid skipping meals. If it's severe or frequent, please see a doctor. Would you like diet or lifestyle tips too?",
      hi: "आराम के लिए: 💧 गुनगुना पानी पिएँ, माथे पर ठंडा चंदन या पुदीने का तेल लगाएँ, अंधेरे कमरे में आराम करें, और कनपटी पर गुनगुने तिल के तेल से हल्की मालिश करें। खाना न छोड़ें। अगर दर्द तेज़ या बार-बार हो तो डॉक्टर से मिलें। क्या आहार या जीवनशैली की सलाह भी चाहिए?",
    },
  },
  stomach: {
    reply: {
      en: "Stomach issues usually point to weak Agni (digestive fire). 🔥 Tell me — is it acidity, gas, constipation, or pain? And after which foods does it get worse?",
      hi: "पेट की समस्या आमतौर पर कमज़ोर अग्नि (पाचन अग्नि) की ओर इशारा करती है। 🔥 बताइए — यह एसिडिटी, गैस, कब्ज़ या दर्द है? और कौन सा खाना खाने के बाद बढ़ती है?",
    },
    remedy: {
      en: "Sip warm water with ginger, cumin and a pinch of hing (asafoetida) after meals. Eat warm, light food; avoid cold drinks and heavy/fried items. A teaspoon of roasted ajwain with warm water relieves gas. Try to eat at the same time every day. Want more tips?",
      hi: "भोजन के बाद अदरक, जीरा और एक चुटकी हींग वाला गुनगुना पानी पिएँ। हल्का और गर्म खाना खाएँ; ठंडे पेय और तला-भुना कम करें। गैस में एक चम्मच भुना अजवाइन गुनगुने पानी के साथ लें। हर दिन एक ही समय पर खाना खाएँ। और सुझाव चाहिए?",
    },
  },
  cold: {
    reply: {
      en: "A cold or cough is often Kapha-related. 🤧 Do you have a dry or wet cough, and is there a fever with it?",
      hi: "खांसी-जुकाम अक्सर कफ से जुड़ा होता है। 🤧 खांसी सूखी है या बलगम वाली, और क्या बुखार भी है?",
    },
    remedy: {
      en: "Try tulsi + ginger + black pepper tea with honey, 2–3 times a day. Gargle warm salt water for a sore throat, avoid cold food, dairy at night and fried snacks. Steam with a drop of eucalyptus oil helps congestion. Rest well! 🌿",
      hi: "दिन में 2–3 बार तुलसी + अदरक + काली मिर्च वाली चाय शहद के साथ पिएँ। गले की खराश के लिए गुनगुने नमक के पानी से गरारे करें। ठंडा खाना, रात में दूध और तले स्नैक्स से बचें। एक बूँद नीलगिरी तेल के साथ भाप लें। खूब आराम करें! 🌿",
    },
  },
  fever: {
    reply: {
      en: "A fever means the body is fighting something. 🌡️ How high is the temperature, and since when? Any body ache or chills?",
      hi: "बुखार का मतलब शरीर किसी चीज़ से लड़ रहा है। 🌡️ तापमान कितना है, और कब से है? शरीर में दर्द या ठंड लग रही है?",
    },
    remedy: {
      en: "Rest and hydrate with warm fluids: ginger-tulsi tea, dal water. Sponge the forehead with a cool cloth. Tulsi-haldi kadha helps. If the fever is high (above 102°F / 39°C) or lasts more than 2–3 days, see a doctor.",
      hi: "आराम करें और गर्म तरल पिएँ: अदरक-तुलसी चाय, दाल का पानी। माथे पर ठंडे कपड़े की पट्टी रखें। तुलसी-हल्दी काढ़ा मददगार है। अगर बुखार बहुत तेज़ (102°F / 39°C से अधिक) हो या 2–3 दिन से ज़्यादा रहे तो डॉक्टर से मिलें।",
    },
  },
  stress: {
    reply: {
      en: "I hear you — stress affects everyone. 🧘 In Ayurveda, anxiety is often excess Vata. What's causing the stress — work, health, or something else? And is it more worry or anger?",
      hi: "मैं समझता हूँ — तनाव सबको होता है। 🧘 आयुर्वेद में चिंता अक्सर बढ़ा हुआ वात होता है। तनाव किस वजह से है — काम, सेहत या कुछ और? और यह चिंता ज़्यादा है या गुस्सा?",
    },
    remedy: {
      en: "Try: 🌿 Brahmi or Ashwagandha tea (with milk) at night, daily 10 min of pranayama (anulom-vilom), a warm oil head massage once a week, and a fixed sleep time. Reduce caffeine. If anxiety is heavy or frequent, please talk to a professional too — that's strength, not weakness. 💚",
      hi: "ये आज़माएँ: 🌿 रात में ब्राह्मी या अश्वगंधा चाय (दूध के साथ), रोज़ 10 मिनट प्राणायाम (अनुलोम-विलोम), हफ्ते में एक बार गर्म तेल से सिर की मालिश, और सोने का नियत समय। कैफीन कम करें। अगर चिंता बहुत ज़्यादा या बार-बार हो तो किसी विशेषज्ञ से भी बात करें — यह कमज़ोरी नहीं, ताकत है। 💚",
    },
  },
  sleep: {
    reply: {
      en: "Good sleep is the foundation of health. 😴 Is it trouble falling asleep, waking up at night, or sleeping too little? And how many hours do you get?",
      hi: "अच्छी नींद सेहत की नींव है। 😴 नींद आने में दिक्कत है, रात में नींद टूटती है, या नींद बहुत कम आती है? और कितने घंटे सोते हैं?",
    },
    remedy: {
      en: "Wind down early: warm milk with a pinch of nutmeg or turmeric before bed, no screens 30 min before sleeping, a warm foot bath, and 5 minutes of Shavasana. Wake at the same time daily. If insomnia persists, see a doctor. 🌙",
      hi: "जल्दी आराम करें: सोने से पहले एक चुटकी जायफल या हल्दी वाला गर्म दूध, सोने से 30 मिनट पहले स्क्रीन बंद, गुनगुने पानी से पैर धोएँ, और 5 मिनट शवासन करें। रोज़ एक ही समय पर जागें। अगर अनिद्रा बनी रहे तो डॉक्टर से मिलें। 🌙",
    },
  },
  energy: {
    reply: {
      en: "Low energy usually means low Agni or poor sleep. 🔋 Is the tiredness all day or mainly after meals? And how is your sleep at night?",
      hi: "कम ऊर्जा आमतौर पर कमज़ोर अग्नि या खराब नींद से होती है। 🔋 थकान पूरे दिन रहती है या खाने के बाद ज़्यादा? और रात की नींद कैसी है?",
    },
    remedy: {
      en: "Start the day with warm lemon-honey water, eat a light lunch (heavy meals cause fatigue), snack on soaked almonds and dates, and take a 15-min walk after meals. Chyawanprash (1 tsp, morning) is a classic energy tonic. 🌞",
      hi: "दिन की शुरुआत गुनगुने नींबू-शहद पानी से करें, हल्का दोपहर का खाना खाएँ (भारी भोजन से थकान होती है), भीगे बादाम और खजूर खाएँ, और खाने के बाद 15 मिनट टहलें। च्यवनप्राश (1 चम्मच, सुबह) क्लासिक ऊर्जा टॉनिक है। 🌞",
    },
  },
  bp: {
    reply: {
      en: "Blood pressure needs monitoring, not guessing. 🩺 Do you have a reading — high or low? And are you on any medication already?",
      hi: "ब्लड प्रेशर का अनुमान नहीं, नियमित माप ज़रूरी है। 🩺 आपकी रीडिंग क्या है — ज़्यादा या कम? और क्या आप कोई दवा ले रहे हैं?",
    },
    remedy: {
      en: "For high BP: reduce salt, walk 30 min daily, try Sheetali pranayama, and drink water infused with soaked methi (fenugreek). Avoid alcohol and smoking. For low BP: salted buttermilk, soaked raisins, and adequate water. IMPORTANT: never stop prescribed medicine without a doctor.",
      hi: "उच्च रक्तचाप के लिए: नमक कम करें, रोज़ 30 मिनट टहलें, शीतली प्राणायाम करें, और भीगी मेथी का पानी पिएँ। शराब और धूम्रपान से बचें। निम्न रक्तचाप के लिए: नमक वाली छाछ, भीगी किशमिश, और भरपूर पानी। महत्वपूर्ण: डॉक्टर की सलाह के बिना दवा कभी न रोकें।",
    },
  },
  sugar: {
    reply: {
      en: "Managing sugar is about routine. 🍃 Do you have a recent reading, and is it fasting or post-meal? Are you on medication?",
      hi: "शुगर नियंत्रण दिनचर्या से है। 🍃 आपकी हाल की रीडिंग क्या है, और वह खाली पेट की है या खाने के बाद? क्या दवा चल रही है?",
    },
    remedy: {
      en: "Add: 1 tbsp methi seeds soaked overnight in water (morning), bitter gourd (karela) juice weekly, and replace white rice with barley or millets. Walk 30 min daily. Avoid sugary drinks entirely. Monitor regularly and never stop medicines without your doctor.",
      hi: "ये अपनाएँ: रात भर भीगी 1 चम्मच मेथी का पानी (सुबह), हफ्ते में एक बार करेले का जूस, और सफेद चावल की जगह जौ या मिलेट्स। रोज़ 30 मिनट टहलें। मीठे पेय पूरी तरह बंद करें। नियमित जाँच करवाएँ और डॉक्टर की सलाह के बिना दवा न रोकें।",
    },
  },
};

const DOSHAS = {
  vata: {
    en: "🌬️ VATA = air & space. Traits: thin frame, dry skin, quick mind, irregular digestion, feels cold easily. When imbalanced: anxiety, dryness, constipation, joint cracking. Balance it: warm cooked food, oil massage (abhyanga), warm drinks, and a regular routine. Are you more Vata?",
    hi: "🌬️ वात = वायु और आकाश। लक्षण: पतला शरीर, शुष्क त्वचा, तेज़ दिमाग, अनियमित पाचन, जल्दी ठंड लगना। असंतुलन में: चिंता, सूखापन, कब्ज़, जोड़ों की कटकटाहट। संतुलन: गर्म पका भोजन, तेल मालिश (अभ्यंग), गर्म पेय, और नियमित दिनचर्या। क्या आप वात प्रकृति के हैं?",
  },
  pitta: {
    en: "🔥 PITTA = fire & water. Traits: medium build, warm body, sharp intellect, strong appetite, gets angry easily. When imbalanced: acidity, skin rashes, anger, fever. Balance it: cooling foods (coconut, cucumber), avoid spicy/oily food, early dinner, and Sheetali breathing. Sounds like you?",
    hi: "🔥 पित्त = अग्नि और जल। लक्षण: मध्यम शरीर, गर्म शरीर, तेज़ बुद्धि, तेज़ भूख, जल्दी गुस्सा। असंतुलन में: एसिडिटी, त्वचा पर चकत्ते, गुस्सा, बुखार। संतुलन: ठंडा भोजन (नारियल, खीरा), तीखा-तला कम, जल्दी रात का खाना, और शीतली श्वास। क्या यह आप जैसा लगता है?",
  },
  kapha: {
    en: "🌿 KAPHA = earth & water. Traits: sturdy build, calm nature, good stamina, slow digestion, sleeps long. When imbalanced: lethargy, weight gain, congestion, low mood. Balance it: warm light food, morning exercise, honey instead of sugar, and spices like ginger & pepper. Does this fit you?",
    hi: "🌿 कफ = पृथ्वी और जल। लक्षण: मजबूत शरीर, शांत स्वभाव, अच्छी सहनशक्ति, धीमा पाचन, लंबी नींद। असंतुलन में: आलस, वज़न बढ़ना, जुकाम, उदासी। संतुलन: गर्म हल्का भोजन, सुबह व्यायाम, चीनी की जगह शहद, और अदरक-काली मिर्च जैसे मसाले। क्या यह आप पर फिट बैठता है?",
  },
  ayurveda: {
    en: "Ayurveda ('science of life') sees health as balance of three doshas: Vata (movement), Pitta (digestion & metabolism), Kapha (structure). Your Prakriti is your natural balance. I can explain each dosha, or say 'health check' and I'll ask you 8 questions to estimate your profile! 🌿",
    hi: "आयुर्वेद ('जीवन का विज्ञान') स्वास्थ्य को तीन दोषों के संतुलन के रूप में देखता है: वात (गति), पित्त (पाचन एवं चयापचय), कफ (संरचना)। आपकी प्रकृति आपका प्राकृतिक संतुलन है। मैं हर दोष समझा सकता हूँ, या 'स्वास्थ्य जांच' कहें और मैं आपसे 8 सवाल पूछकर आपकी प्रोफ़ाइल बनाऊँगा! 🌿",
  },
};

const EN_ASSESS_INTRO = "Let's build your AYUSH profile! 🌿 I'll ask you 8 short questions. Answer in your own words — say 'skip' to skip a question, or 'stop' to end anytime.";
const HI_ASSESS_INTRO = "चलिए आपकी आयुष प्रोफ़ाइल बनाते हैं! 🌿 मैं 8 छोटे सवाल पूछूँगा। अपने शब्दों में जवाब दें — 'skip' कहें या 'stop' कहें।";
const EN_DONE = "Assessment complete! 🌿 Here's your AYUSH profile:";
const HI_DONE = "जांच पूरी! 🌿 आपकी आयुष प्रोफ़ाइल:";
const EN_STOP = "Stopped early. Here's your profile so far:";
const HI_STOP = "जांच रोक दी गई। अब तक की प्रोफ़ाइल:";

// ---------- intent detection ----------
const INTENT_ORDER = [
  ['emergency', ['emergency', 'sos', 'ambulance', 'accident', '108', 'आपातकाल', 'sankat', 'संकट', 'bache', 'बचाओ']],
  ['greeting', ['hello', 'hey', 'hi', 'namaste', 'namaskar', 'सुप्रभात', 'नमस्ते', 'नमस्कार', 'good morning', 'good evening', 'good afternoon', 'salaam', 'hola']],
  ['howareyou', ['how are you', 'how are u', 'kaise ho', 'कैसे हो', 'कैसी हो']],
  ['thanks', ['thank', 'thanks', 'dhanyavad', 'धन्यवाद', 'shukriya', 'शुक्रिया', 'thx']],
  ['bye', ['bye', 'goodbye', 'alvida', 'अलविदा', 'phir milenge', 'फिर मिलेंगे', 'see you', 'ta ta']],
  ['help', ['help', 'madad', 'मदद', 'what can you do', 'can you help', 'features', 'सुविधाएँ']],
  ['assessment', ['assessment', 'health check', 'checkup', 'quiz', 'prakriti test', 'जांच', 'परीक्षण', 'स्वास्थ्य जांच']],
  ['navigation', ['appointment', 'record', 'records', 'report', 'booking', 'doctor', 'डॉक्टर', 'अपॉइंटमेंट', 'रिकॉर्ड', 'रिपोर्ट']],
  ['headache', ['headache', 'head pain', 'sir dard', 'सिर दर्द', 'सिरदर्द', 'माइग्रेन', 'migraine', 'सर दर्द']],
  ['stomach', ['stomach', 'pet', 'digestion', 'acidity', 'acid', 'gas', 'indigestion', 'constipation', 'kabz', 'पेट', 'अपच', 'कब्ज', 'एसिडिटी', 'गैस']],
  ['cold', ['cold', 'cough', 'khansi', 'खांसी', 'sardi', 'सर्दी', 'flu', 'jukaam', 'जुकाम', 'sore throat', 'gala', 'गला', 'throat', 'balam', 'बलगम', 'runny nose']],
  ['fever', ['fever', 'bukhar', 'बुखार', 'temperature', 'taap', 'ताप', 'jwar', 'ज्वर']],
  ['stress', ['stress', 'anxiety', 'tension', 'chinta', 'चिंता', 'तनाव', 'worried', 'depress', 'anger', 'gussa', 'गुस्सा', 'nervous', 'ghabrahat', 'घबराहट']],
  ['sleep', ['sleep', 'neend', 'नींद', 'insomnia', 'anidra', 'अनिद्रा', 'restless', 'sone', 'सोना']],
  ['energy', ['energy', 'tired', 'thakan', 'थकान', 'weak', 'kamzori', 'कमजोरी', 'fatigue', 'lazy', 'aalsi', 'आलसी', 'thak', 'थक']],
  ['bp', ['blood pressure', 'bp', 'pressure', 'दबाव', 'dabav', 'रक्तचाप']],
  ['sugar', ['sugar', 'diabetes', 'diabetic', 'shuger', 'शुगर', 'मधुमेह']],
  ['diet', ['diet', 'khana', 'खाना', 'eat', 'eating', 'food', 'recipe', 'bhojan', 'भोजन', 'nutrition', 'पोषण', 'आहार']],
  ['lifestyle', ['lifestyle', 'routine', 'dinacharya', 'दिनचर्या', 'habit', 'आदत', 'schedule', 'समय']],
  ['remedy', ['remedy', 'ilaaj', 'इलाज', 'cure', 'treatment', 'upchar', 'उपचार', 'medicine', 'dawa', 'दवा', 'gharelu', 'घरेलू', 'home remedy', 'nuskha', 'नुस्खा', 'kadha', 'काढ़ा', 'churan', 'चूर्ण']],
  ['vata', ['vata', 'vaat', 'वात', 'vayu', 'वायु']],
  ['pitta', ['pitta', 'पित्त']],
  ['kapha', ['kapha', 'kaph', 'कफ']],
  ['ayurveda', ['ayurved', 'आयुर्वेद', 'prakriti', 'प्रकृति', 'dosha', 'दोष', 'tridosha', 'त्रिदोष', 'ayush', 'आयुष']],
];

const detect = (t) => {
  for (const [id, kws] of INTENT_ORDER) {
    if (matches(t, kws)) return id;
  }
  return 'other';
};

// ---------- reply builder ----------
const qText = (q, idx, total, isHi) =>
  `${isHi ? 'सवाल' : 'Q'} ${idx + 1}/${total} • ${q.category} ${q.title}: ${q.question}\n${isHi ? 'विकल्प' : 'Options'}: ${q.options.join(' • ')}`;

const formatSummary = (questions, answers, isHi) =>
  questions
    .map((q, i) => `${i + 1}. ${q.title}: ${answers[i] || (isHi ? 'छोड़ा गया' : 'skipped')}`)
    .join('\n');

const buildReply = (rawText, lang, state, questions) => {
  const t = rawText.toLowerCase().trim();
  const isHi = lang === 'हिंदी';
  const pick = (entry) => (isHi && entry.hi ? entry.hi : entry.en);
  let { followUp, assessIndex, assessAnswers } = state;

  // --- assessment in progress ---
  if (assessIndex !== null) {
    if (matches(t, ['skip', 'next', 'aage', 'आगे'])) {
      assessAnswers = [...assessAnswers, null];
    } else if (matches(t, ['stop', 'exit', 'quit', 'end', 'बंद', 'रोक'])) {
      const partial = formatSummary(questions, assessAnswers, isHi);
      return {
        text: (isHi ? HI_STOP : EN_STOP) + '\n\n' + partial,
        state: { followUp: 'closing', assessIndex: null, assessAnswers: [] },
      };
    } else {
      assessAnswers = [...assessAnswers, rawText.trim().slice(0, 160)];
    }
    if (assessIndex + 1 < questions.length) {
      const q = questions[assessIndex + 1];
      return {
        text: qText(q, assessIndex + 1, questions.length, isHi),
        state: { followUp, assessIndex: assessIndex + 1, assessAnswers },
      };
    }
    return {
      text: (isHi ? HI_DONE : EN_DONE) + '\n\n' + formatSummary(questions, assessAnswers, isHi),
      state: { followUp: 'closing', assessIndex: null, assessAnswers: [] },
    };
  }

  // --- emergency always wins ---
  if (matches(t, INTENT_ORDER[0][1])) {
    return { text: pick(SOCIAL.emergency), state: CLEAR };
  }

  const intent = detect(t);

  // --- closing-context ("want more tips?") ---
  if (followUp === 'closing') {
    if (matches(t, ['yes', 'haan', 'sure', 'ok', 'okay', 'tips', 'हां', 'जी हाँ'])) {
      return { text: pick(SOCIAL.closingYes), state: CLEAR };
    }
    if (matches(t, ['no', 'nahi', 'na', 'nothing', 'नहीं'])) {
      return { text: pick(SOCIAL.closingNo), state: CLEAR };
    }
  }

  // --- answer to an open follow-up question ---
  if (followUp && (intent === followUp || (intent === 'other' && matches(t, TIME_WORDS)))) {
    const entry = SYMPTOMS[followUp];
    if (entry && entry.remedy) {
      return { text: pick(entry.remedy), state: { followUp: 'closing', assessIndex: null, assessAnswers: [] } };
    }
  }

  // --- regular intents ---
  if (intent === 'greeting') return { text: pick(GREETING), state: CLEAR };
  if (SOCIAL[intent]) return { text: pick(SOCIAL[intent]), state: CLEAR };
  if (SYMPTOMS[intent]) {
    return {
      text: pick(SYMPTOMS[intent].reply),
      state: { followUp: intent, assessIndex: null, assessAnswers: [] },
    };
  }
  if (DOSHAS[intent]) return { text: pick(DOSHAS[intent]), state: CLEAR };
  if (intent === 'assessment' && questions.length) {
    return {
      text: (isHi ? HI_ASSESS_INTRO : EN_ASSESS_INTRO) + '\n\n' + qText(questions[0], 0, questions.length, isHi),
      state: { followUp: null, assessIndex: 0, assessAnswers: [] },
    };
  }
  return { text: pick(SOCIAL.default), state: CLEAR };
};

// =====================================================================
// Component
// =====================================================================
export default function VoiceAssistant({ selectedLanguage = 'English', questions = [], onBack }) {
  const [lang, setLang] = useState(selectedLanguage);
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', text: selectedLanguage === 'हिंदी' ? GREETING.hi : GREETING.en },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [assessProgress, setAssessProgress] = useState(null);
  const [aiReady, setAiReady] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [voiceState, setVoiceState] = useState(VOICE_STATE.IDLE);
  const [voiceError, setVoiceError] = useState('');
  const [level, setLevel] = useState(0);
  const [recSeconds, setRecSeconds] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('mk_theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('mk_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((th) => (th === 'dark' ? 'light' : 'dark'));
  };
  const [supported] = useState(
    typeof window !== 'undefined' && (
      !!(window.SpeechRecognition || window.webkitSpeechRecognition) ||
      !!(navigator.mediaDevices && window.MediaRecorder)
    )
  );
  // Electron (e.g. the Freebuff preview) bundles no Google speech API keys, so cloud
  // recognition always fails with 'network' there — surface that instead of confusing errors.
  const isElectron = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const stateRef = useRef({ followUp: null, assessIndex: null, assessAnswers: [] });
  const recRef = useRef(null);
  const chatRef = useRef(null);
  const streamRef = useRef(null);
  const prewarmedRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const recordStartRef = useRef(0);
  const speechStartRef = useRef(null);
  const audioElRef = useRef(null);
  const speakTokenRef = useRef(0);
  const emergencyEscalatedRef = useRef(false);

  const isHi = lang === 'हिंदी';
  const pick = (entry) => (isHi && entry.hi ? entry.hi : entry.en);

  // Switching language mid-session immediately interrupts speech in the old language,
  // so the next utterance is spoken with the newly selected locale.
  useEffect(() => {
    stopSpeaking();
  }, [lang]);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const [serverTts, setServerTts] = useState(false);

  // Probe the voice server once so the UI can show the active AI mode
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (alive && d && (d.ai === 'Groq' || d.ai === 'Gemini' || d.status === 'running')) {
          setAiReady(true);
          if (d.tts === true) setServerTts(true);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Warm the browser TTS voice list without requesting microphone permission early.
  useEffect(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  }, []);

  useEffect(
    () => () => {
      try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); } catch (e) {}
      try { if (recRef.current && recRef.current.abort) recRef.current.abort(); } catch (e) {}
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (prewarmedRef.current) prewarmedRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} }
      if (audioElRef.current) { try { audioElRef.current.pause(); } catch (e) {} }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    []
  );

  const pushAssistant = (text) => setMessages((m) => [...m, { role: 'assistant', text }]);

  const setVoiceFailure = (message) => {
    setVoiceError(message);
    setVoiceState(VOICE_STATE.ERROR);
    pushAssistant(message);
    window.setTimeout(() => {
      setVoiceState((state) => (state === VOICE_STATE.ERROR ? VOICE_STATE.IDLE : state));
    }, 2600);
  };

  // ---------- speaking: server TTS first, browser SpeechSynthesis fallback ----------
  const stopSpeaking = () => {
    speakTokenRef.current += 1; // invalidates any in-flight server TTS request
    if (audioElRef.current) {
      try { audioElRef.current.pause(); } catch (e) {}
      audioElRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceState(VOICE_STATE.IDLE);
  };

  // Enumerate available voices and pick one for the requested locale:
  // exact locale match (e.g. kn-IN) > base-language match (any kn-*) > none.
  // Never silently forces en-US for a non-English request; when nothing matches we keep
  // utterance.lang at the requested locale and let the engine pick its best voice.
  const pickBrowserVoice = (requested) => {
    if (!('speechSynthesis' in window)) return null;
    const want = (requested || '').replace('_', '-').toLowerCase();
    const base = want.split('-')[0];
    const voices = window.speechSynthesis.getVoices() || [];
    const norm = (v) => (v.lang || '').replace('_', '-').toLowerCase();
    const rank = (v) =>
      (/google/i.test(v.name) ? 3 : 0) +
      (/natural|online|premium|enhanced/i.test(v.name) ? 2 : 0) +
      (!v.localService ? 1 : 0);
    const bestOf = (list) => list.slice().sort((a, b) => rank(b) - rank(a))[0] || null;
    const exact = bestOf(voices.filter((v) => norm(v) === want));
    if (exact) {
      console.log(`[TTS] selected voice= SpeechSynthesis "${exact.name}" (${exact.lang}) for ${requested}`);
      return exact;
    }
    const sameBase = bestOf(voices.filter((v) => norm(v).split('-')[0] === base));
    if (sameBase) {
      console.log(`[TTS] selected voice= SpeechSynthesis "${sameBase.name}" (${sameBase.lang}) for ${requested} (base-language match)`);
      return sameBase;
    }
    console.warn(`[TTS] fallback=no SpeechSynthesis voice matches ${requested}; keeping utterance.lang=${requested} with engine default voice`);
    return null;
  };

  const speakWithBrowser = (text, voiceLang) => {
    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] fallback=browser SpeechSynthesis unavailable');
      setVoiceState(VOICE_STATE.IDLE);
      return;
    }
    const spokenText = sanitizeReply(text);
    if (!spokenText) {
      setVoiceState(VOICE_STATE.IDLE);
      return;
    }
    console.log(`[TTS] fallback=browser SpeechSynthesis (lang=${voiceLang})`);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const voice = pickBrowserVoice(voiceLang);
    if (voice) utterance.voice = voice;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setVoiceState(VOICE_STATE.SPEAKING);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceState(VOICE_STATE.IDLE);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setVoiceState(VOICE_STATE.IDLE);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Try server (Gemini) TTS in the selected language; on 204 / failure speak the SAME
  // translated text via browser SpeechSynthesis — the text is never re-translated.
  const speak = async (text) => {
    if (muted) {
      setVoiceState(VOICE_STATE.IDLE);
      return;
    }
    stopSpeaking();
    const token = speakTokenRef.current;
    const ttsLang = TTS_LANGS[lang] || 'en';
    console.log(`[TTS] language=${ttsLang}`);
    console.log(`[TTS] text=${sanitizeReply(text)}`);
    try {
      const res = await fetch(
        `${API_BASE}/tts?text=${encodeURIComponent(text)}&language=${encodeURIComponent(ttsLang)}`,
        { method: 'POST' }
      );
      if (token !== speakTokenRef.current) return; // interrupted while fetching
      if (res.ok) {
        const blob = await res.blob();
        console.log(`[TTS] selected voice= Gemini TTS server voice (${ttsLang})`);
        const audio = new Audio(URL.createObjectURL(blob));
        audioElRef.current = audio;
        audio.onplay = () => {
          setIsSpeaking(true);
          setVoiceState(VOICE_STATE.SPEAKING);
        };
        audio.onended = () => {
          if (audioElRef.current === audio) audioElRef.current = null;
          URL.revokeObjectURL(audio.src);
          setIsSpeaking(false);
          setVoiceState(VOICE_STATE.IDLE);
        };
        audio.onerror = () => {
          if (audioElRef.current === audio) audioElRef.current = null;
          URL.revokeObjectURL(audio.src);
          console.warn('[TTS] fallback=server audio failed to play -> browser SpeechSynthesis');
          speakWithBrowser(text, ttsLang);
        };
        try {
          await audio.play();
          return;
        } catch (e) {
          console.warn('[TTS] fallback=server audio playback blocked -> browser SpeechSynthesis');
        }
      } else {
        console.log(`[TTS] fallback=server TTS unavailable (HTTP ${res.status}) -> browser SpeechSynthesis`);
      }
    } catch (e) {
      console.log('[TTS] fallback=server TTS unreachable -> browser SpeechSynthesis');
    }
    if (token !== speakTokenRef.current) return; // interrupted while fetching
    speakWithBrowser(text, ttsLang);
  };

  // Keep chat replies clean and readable without truncating full sentences
  const sanitizeReply = (raw) => {
    if (!raw) return raw;
    let out = String(raw)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\uFE0F\u2764\u2705\u274C\u2757]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[*#`_>]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return out;
  };

  const handleUserMessage = async (text) => {
    const clean = (text || '').trim();
    if (!clean || aiBusy) {
      if (!clean) setVoiceState(VOICE_STATE.IDLE);
      return;
    }
    setMessages((messages) => [...messages, { role: 'user', text: clean }]);
    setVoiceState(VOICE_STATE.PROCESSING);
    setAiBusy(true);
    if (emergencyEscalatedRef.current && POST_RED_FLAG_FOLLOWUP_RE.test(clean)) {
      const reply = sanitizeReply(POST_RED_FLAG_RESPONSE);
      setAiBusy(false);
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
      speak(reply);
      return;
    }

    // PDF: continuous red-flag surveillance — alerts fire instantly, before any model call
    const flags = detectRedFlags(clean);
    if (flags.length) {
      addClinicalAlert(flags, 'Voice Assistant', clean.slice(0, 120));
    }
    if (MEDICINE_MENTION_RE.test(clean)) {
      markChatTopic('medicines');
    }
    let reply = null;
    if (flags.length) {
      emergencyEscalatedRef.current = true;
      reply = RED_FLAG_RESPONSE;
    } else if (aiReady) {
      try {
        reply = await backendChat(clean);
      } catch (e) {
        reply = null;
      }
    }
    if (reply === null) {
      // Fallback: the built-in offline AYUSH engine
      const result = buildReply(clean, lang, stateRef.current, questions);
      stateRef.current = result.state;
      reply = result.text;
      setAssessProgress(
        result.state.assessIndex !== null
          ? { current: result.state.assessIndex + 1, total: questions.length }
          : null
      );
    }
    setAiBusy(false);
    reply = sanitizeReply(reply);
    setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    speak(reply);
  };

  const startListening = () => {
    if (aiBusy) return;
    stopSpeaking();
    setVoiceError('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !isElectron) {
      startWebSpeech(SpeechRecognition, true);
      return;
    }
    startRecorderTranscription();
  };

  const startWebSpeech = (SpeechRecognition, allowRecorderFallback = false) => {
    try {
      const recognition = new SpeechRecognition();
      recRef.current = recognition;
      recognition.lang = LANGS[lang] || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = (event.results?.[0]?.[0]?.transcript || '').trim();
        setIsListening(false);
        setVoiceState(VOICE_STATE.PROCESSING);
        if (transcript) handleUserMessage(transcript);
        else setVoiceFailure("Couldn't hear that. Tap and try again.");
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        setLevel(0);
        if (event.error === 'not-allowed') {
          setVoiceFailure('Microphone access is required for voice input. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setVoiceFailure("Couldn't hear that. Tap and try again.");
        } else if (allowRecorderFallback) {
          startRecorderTranscription();
        } else {
          setVoiceFailure(`Voice error (${event.error}). You can still type below.`);
        }
      };
      recognition.onend = () => {
        setIsListening(false);
        setLevel(0);
        setVoiceState((state) => (state === VOICE_STATE.LISTENING ? VOICE_STATE.IDLE : state));
      };
      recognition.start();
      setIsListening(true);
      setVoiceState(VOICE_STATE.LISTENING);
    } catch (err) {
      if (allowRecorderFallback) startRecorderTranscription();
      else setVoiceFailure('Voice input failed to start. Please use the text box below.');
    }
  };

  const startRecorderTranscription = () => {
    const canRecord = typeof navigator !== 'undefined' && navigator.mediaDevices && typeof MediaRecorder !== 'undefined';
    if (!canRecord) {
      setVoiceFailure("Voice input isn't supported in this browser. Please use the text box below.");
      return;
    }

    const begin = (stream) => {
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined;
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      recRef.current = recorder;
      speechStartRef.current = null;
      recordStartRef.current = Date.now();
      setRecSeconds(0);
      setVoiceState(VOICE_STATE.LISTENING);
      timerRef.current = setInterval(() => setRecSeconds(Math.round((Date.now() - recordStartRef.current) / 1000)), 500);

      const finish = () => {
        if (recorder.state !== 'inactive') recorder.stop();
      };

      recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data);
      recorder.onstop = async () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} audioCtxRef.current = null; }
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsListening(false);
        setLevel(0);

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 2000) {
          setVoiceFailure("Couldn't hear that. Tap and try again.");
          return;
        }

        setVoiceState(VOICE_STATE.PROCESSING);
        try {
          const { transcript } = await backendVoice(blob);
          if (!transcript) {
            setVoiceFailure("Couldn't hear that. Tap and try again.");
            return;
          }
          handleUserMessage(transcript);
        } catch (err) {
          setVoiceFailure('Voice transcription is unavailable right now. Please type your question below.');
        }
      };

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        let spoke = false;
        let lastVoiceAt = Date.now();
        const tick = () => {
          analyser.getByteTimeDomainData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) { const value = (buffer[i] - 128) / 128; sum += value * value; }
          const rms = Math.sqrt(sum / buffer.length);
          setLevel(Math.min(1, rms * 4));
          if (rms > 0.09) { spoke = true; lastVoiceAt = Date.now(); if (speechStartRef.current === null) speechStartRef.current = Date.now(); }
          const elapsed = Date.now() - recordStartRef.current;
          if (elapsed > MAX_RECORD_SECONDS * 1000) { finish(); return; }
          if (spoke && Date.now() - lastVoiceAt > 1600) { finish(); return; }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) { /* metering optional */ }

      recorder.start();
      setIsListening(true);
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(begin)
      .catch(() => {
        setIsListening(false);
        setVoiceFailure('Microphone access is required for voice input. Please allow microphone access in your browser settings.');
      });
  };

  const toggleListening = () => {
    if (isSpeaking || voiceState === VOICE_STATE.SPEAKING) {
      stopSpeaking();
      return;
    }
    if (isListening) {
      const recorder = recRef.current;
      if (recorder) { try { if (recorder.state === 'recording') recorder.stop(); else if (recorder.stop) recorder.stop(); } catch (e) {} }
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setIsListening(false);
      setVoiceState(VOICE_STATE.PROCESSING);
      return;
    }
    startListening();
  };

  const sendText = () => {
    if (!input.trim()) return;
    handleUserMessage(input);
    setInput('');
  };

  const voiceButtonText =
    voiceState === VOICE_STATE.LISTENING ? '\u{1F534} Listening...' :
    voiceState === VOICE_STATE.PROCESSING ? 'Thinking...' :
    voiceState === VOICE_STATE.SPEAKING || isSpeaking ? '\u{1F50A} Stop' :
    voiceState === VOICE_STATE.ERROR ? "Couldn't hear that. Tap and try again." :
    '\u{1F3A4} Tap & Speak';

  const voiceButtonClass =
    voiceState === VOICE_STATE.LISTENING ? 'bg-red-600 hover:bg-red-700 animate-pulse' :
    voiceState === VOICE_STATE.PROCESSING ? 'bg-gray-500' :
    voiceState === VOICE_STATE.SPEAKING || isSpeaking ? 'bg-blue-600 hover:bg-blue-700' :
    voiceState === VOICE_STATE.ERROR ? 'bg-amber-600 hover:bg-amber-700' :
    'bg-green-700 hover:bg-green-800';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      <img src="/chakra.png" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-orange-400 via-white to-green-700 relative">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="absolute top-2.5 right-3 z-20 w-9 h-9 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-lg hover:bg-gray-100 transition"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="h-screen flex flex-col">
          {/* header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-800 font-bold hover:bg-gray-100 transition"
              aria-label="Back to dashboard"
            >
              ‹
            </button>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600 uppercase">🎙️ Voice Assistant</p>
              <p className="text-[10px] text-gray-500 font-medium">
                {lang} • {aiReady ? '✨ MediKiosk AI' : supported ? '🎤 voice ready' : '⌨️ text mode'}
              </p>
            </div>
            <button
              onClick={() => setMuted((m) => { if (!m) stopSpeaking(); return !m; })}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-base hover:bg-gray-100 transition"
              aria-label={muted ? 'Unmute voice' : 'Mute voice'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>

          {/* language chips — single line, compact */}
          <div className="flex flex-nowrap gap-1 px-3 py-1.5 bg-gray-50 border-b border-gray-200 overflow-hidden">
            {Object.keys(LANGS).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap shrink-0 transition ${
                  lang === l ? 'bg-green-700 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* chat area */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {aiReady && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[11px] text-green-800 font-medium">
                MediKiosk AI is active — I understand your language and remember our conversation. Tap the mic or type below.
              </div>
            )}
            {!supported && !aiReady && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 text-[11px] text-yellow-800 font-medium">
                🎙️ Voice input isn't supported in this browser — use the text box below (voice output still works).
              </div>
            )}
            {supported && isElectron && !aiReady && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 text-[11px] text-yellow-800 font-medium">
                ⚠️ This preview window can't reach cloud voice recognition. For working voice input, open{' '}
                <span className="font-bold">{origin}</span> in Google Chrome or on your phone — or type below
                (replies still speak aloud 🔊).
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] px-4 py-2.5 text-sm whitespace-pre-wrap rounded-2xl leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-green-700 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {assessProgress && (
              <div className="flex justify-center">
                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-3 py-1 rounded-full">
                  AYUSH check — question {assessProgress.current} of {assessProgress.total}
                </span>
              </div>
            )}
            {isListening && (
              <div className="flex flex-col items-center gap-2">
                <span className="bg-red-100 text-red-700 text-[11px] font-bold px-3 py-1 rounded-full animate-pulse">
                  🔴 Listening… speak now{recSeconds > 0 ? ` (${recSeconds}s)` : ''}
                </span>
                <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-75"
                    style={{
                      width: `${Math.round(level * 100)}%`,
                      background: level > 0.55 ? '#dc2626' : level > 0.28 ? '#f59e0b' : '#16a34a',
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-medium">I'll send it automatically when you pause</span>
              </div>
            )}
            {aiBusy && !isListening && (
              <div className="flex justify-center">
                <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-3 py-1 rounded-full animate-pulse">
                  ✨ MediKiosk AI is thinking…
                </span>
              </div>
            )}
            {isSpeaking && !isListening && (
              <div className="flex justify-center">
                <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full">
                  🔊 Speaking…
                </span>
              </div>
            )}
          </div>

          {/* input */}
          <div className="border-t border-gray-200 p-3 bg-white space-y-2">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendText()}
                placeholder="Type your question…"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-700"
              />
              <button
                onClick={sendText}
                className="px-4 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800 transition"
                aria-label="Send"
              >
                ➤
              </button>
            </div>
            <button
              onClick={toggleListening}
              disabled={aiBusy}
              className={`w-full py-3 rounded-xl font-bold text-white transition ${
                isListening ? 'bg-red-600 hover:bg-red-700' : aiBusy ? 'bg-gray-400' : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {isListening ? '⏹ Stop & Send' : aiBusy ? '✨ Thinking…' : '🎤 Tap & Speak'}
            </button>
            <p className="text-[10px] text-gray-400 text-center">
              I'm an AI assistant — for serious or lasting symptoms, please see a doctor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
