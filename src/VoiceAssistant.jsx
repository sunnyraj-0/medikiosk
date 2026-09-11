import { useEffect, useRef, useState } from 'react';

// ---------- speech language mapping ----------
const LANGS = { 'हिंदी': 'hi-IN', 'English': 'en-IN', 'ಕನ್ನಡ': 'kn-IN', 'தமிழ்': 'ta-IN' };

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
  en: "Namaste! 🙏 I'm MediKiosk.gov.in — your AYUSH health assistant. Tell me a symptom (headache, fever, stomach, cold, stress, sleep...), ask about Vata/Pitta/Kapha, or say 'health check' and I'll ask you 8 questions to build your Ayurveda profile. What's troubling you today?",
  hi: "नमस्ते! 🙏 मैं MediKiosk.gov.in हूँ — आपकी आयुष स्वास्थ्य सहायक। कोई लक्षण बताइए (सिरदर्द, बुखार, पेट, खांसी, तनाव, नींद...), वात/पित्त/कफ के बारे में पूछिए, या 'स्वास्थ्य जांच' कहिए और मैं आपसे 8 सवाल पूछकर आपकी आयुर्वेद प्रोफ़ाइल बनाऊँगा। आज आपको क्या परेशानी है?",
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
  const [supported] = useState(
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  // Electron (e.g. the Freebuff preview) bundles no Google speech API keys, so cloud
  // recognition always fails with 'network' there — surface that instead of confusing errors.
  const isElectron = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const stateRef = useRef({ followUp: null, assessIndex: null, assessAnswers: [] });
  const recRef = useRef(null);
  const chatRef = useRef(null);

  const isHi = lang === 'हिंदी';
  const pick = (entry) => (isHi && entry.hi ? entry.hi : entry.en);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(
    () => () => {
      if (recRef.current) recRef.current.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    []
  );

  const pushAssistant = (text) => setMessages((m) => [...m, { role: 'assistant', text }]);

  const speak = (text) => {
    if (muted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGS[lang] || 'en-IN';
    u.rate = 1;
    const base = u.lang.split('-')[0].toLowerCase();
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(base));
    if (voice) u.voice = voice;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const handleUserMessage = (text) => {
    const clean = (text || '').trim();
    if (!clean) return;
    setMessages((m) => [...m, { role: 'user', text: clean }]);
    const result = buildReply(clean, lang, stateRef.current, questions);
    stateRef.current = result.state;
    setMessages((m) => [...m, { role: 'assistant', text: result.text }]);
    setAssessProgress(
      result.state.assessIndex !== null
        ? { current: result.state.assessIndex + 1, total: questions.length }
        : null
    );
    speak(result.text);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      pushAssistant("Voice input isn't supported in this browser — please use the text box below. 😊");
      return;
    }
    try {
      const rec = new SR();
      recRef.current = rec;
      rec.lang = LANGS[lang] || 'en-IN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        handleUserMessage(e.results[0][0].transcript);
      };
      rec.onerror = (e) => {
        setIsListening(false);
        if (e.error === 'not-allowed') {
          pushAssistant('Microphone access was denied. 🙅 Please allow the microphone, or type your question below.');
        } else if (e.error === 'no-speech') {
          pushAssistant("I didn't catch that — tap the mic and try again, or type below.");
        } else if (e.error === 'network') {
          pushAssistant(
            isElectron
              ? 'Voice recognition is blocked inside this preview window. ⚠️ Open the app in Google Chrome or on your phone for working voice input — or type below (I still answer and speak aloud).'
              : "Speech recognition couldn't connect to the voice service — check your internet connection, or try Google Chrome. You can also type below."
          );
        } else {
          pushAssistant(`Voice error (${e.error}) — you can also type your question below.`);
        }
      };
      rec.onend = () => setIsListening(false);
      rec.start();
      setIsListening(true);
    } catch (err) {
      pushAssistant('Voice input failed to start — please use the text box below.');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recRef.current) recRef.current.stop();
      setIsListening(false);
      return;
    }
    startListening();
  };

  const sendText = () => {
    if (!input.trim()) return;
    handleUserMessage(input);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      <img src="/chakra.png" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-orange-400 via-white to-green-700"></div>

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
                {lang} • {supported ? '🎤 voice ready' : '⌨️ text mode'}
              </p>
            </div>
            <button
              onClick={() => setMuted((m) => !m)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-base hover:bg-gray-100 transition"
              aria-label={muted ? 'Unmute voice' : 'Mute voice'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>

          {/* language chips */}
          <div className="flex gap-1.5 px-4 py-2 bg-gray-50 border-b border-gray-200">
            {Object.keys(LANGS).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition ${
                  lang === l ? 'bg-green-700 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* chat area */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {!supported && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 text-[11px] text-yellow-800 font-medium">
                🎙️ Voice input isn't supported in this browser — use the text box below (voice output still works).
              </div>
            )}
            {supported && isElectron && (
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
              <div className="flex justify-center">
                <span className="bg-red-100 text-red-700 text-[11px] font-bold px-3 py-1 rounded-full animate-pulse">
                  🔴 Listening… speak now
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
              className={`w-full py-3 rounded-xl font-bold text-white transition ${
                isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {isListening ? '⏹ Stop Listening' : '🎤 Tap & Speak'}
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