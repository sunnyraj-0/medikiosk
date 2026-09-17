import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, X } from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';
import { supabase } from './supabaseClient';
import {
  detectRedFlags,
  RED_FLAG_RESPONSE,
  addClinicalAlert,
  getAlerts,
  getTimeline,
  addTimelineEvent,
  addReportHistory,
  getReportHistory,
  isAbnormalValue,
  formatDoctor,
  nextToken,
  suggestDepartment
} from './clinical';

const LANGUAGES = [
  { code: 'hi', label: 'हिंदी', sub: 'Hindi', flag: '🇮🇳' },
  { code: 'en', label: 'English', sub: 'English', flag: '🇬🇧' },
  { code: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', sub: 'Tamil', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', sub: 'Marathi', flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা', sub: 'Bengali', flag: '🇮🇳' },
  { code: 'ur', label: 'اردو', sub: 'Urdu', flag: '🇵🇰', rtl: true }
];

const LANG_CODE = {
  'हिंदी': 'hi',
  'English': 'en',
  'ಕನ್ನಡ': 'kn',
  'தமிழ்': 'ta'
};

const TRANSLATIONS = {
  en: {
    report_history: 'Patient Report History',
    report_history_desc: 'AI-extracted from your scanned prescriptions and reports, newest first',
    ai_extracted: 'AI extracted',
    no_reports: 'No reports yet — scan a document to build your history',
    activity_alerts: 'Activity & Alerts',
    abnormal_short: 'abnormal values',
    scan_open_camera: 'Scan Document',
    scan_hint: 'Place the document flat and fill the frame',
    scan_capture: 'Capture',
    scan_upload: 'Upload from Gallery',
    scan_processing: 'Reading the document with AI...',
    scan_review: 'Check the extracted details',
    scan_save: 'Save to My Records',
    scan_saved: 'Document saved successfully',
    scan_rescan: 'Scan Another',
    scan_done: 'Go to My Records',
    scan_no_details: 'No details found — the photo may be unclear',
    scan_medicines: 'Medicines',
    scan_lab_values: 'Lab Values',
    scan_doc_type: 'Document Type',
    records_empty: 'No records yet — scan a document to create your first record',
    records_title: 'My Records',
    scan_error_prefix: 'Scan failed',
    choose_language: 'Choose your preferred language',
    continue: 'Continue',
    back: 'Back',
    fill_validation: 'Please fill your name, a valid 10-digit phone number, and a date.',
    logout: 'Logout',
    change_language: 'Change Language',
    govt_healthcare: 'Government AYUSH Healthcare',
    mobile_number: 'Mobile Number',
    send_otp: 'Send OTP',
    or_login_govt: 'or login with govt ID',
    govt_medical_id: 'Govt Medical ID',
    ph_10digit: '10 digit number',
    age: 'Age',
    city: 'City',
    govt_id_login: 'Govt ID Login',
    government_login: 'Government Login',
    abdm: 'ABDM / Ayushman Bharat',
    id_type: 'ID Type',
    id_number: 'ID Number',
    enter_your_id: 'Enter your ID',
    aadhaar: 'Aadhaar Number',
    health_id: 'Health ID',
    abha: 'ABHA Number',
    voice_preference: 'Voice Preference',
    how_use: 'How do you want to use this app?',
    voice_assistant: 'Voice Assistant',
    talk_to_ai: 'Talk to AI in your language',
    use_voice_mode: 'Use Voice Mode',
    or_word: 'or',
    text_only_mode: 'Text Only Mode',
    main_dashboard: 'Main Dashboard',
    welcome_back: 'Welcome Back',
    sos_emergency: '🚨 SOS - Emergency',
    scan_document: 'Scan Document',
    voice_help: 'Voice Help',
    live_report: 'Live Report',
    symptoms: 'Symptoms',
    appointments: 'Appointments',
    my_records: 'My Records',
    book_appointment: 'Book Appointment',
    book_an_appointment: 'Book an Appointment',
    fill_details: 'Fill your details — they are saved securely to our system.',
    full_name: 'Full Name *',
    patient_name: 'Patient name',
    phone_number: 'Phone Number *',
    department: 'Department *',
    doctor_optional: 'Doctor (optional)',
    date: 'Date *',
    time_slot: 'Time Slot *',
    reason_symptoms: 'Reason / Symptoms',
    describe_problem: 'Briefly describe your problem',
    preferred_language: 'Preferred Language',
    confirm_booking: 'Confirm Booking',
    saving: 'Saving…',
    appointment_booked: 'Appointment Booked!',
    saved_in_system: 'Your details have been saved in our system.',
    patient: 'Patient:',
    book_another: 'Book Another Appointment',
    back_to_dashboard: 'Back to Dashboard',
    scan_medical_doc: 'Scan Medical Document',
    upload_prescription: 'Upload prescription, report or test results',
    tap_to_capture: 'Tap to capture',
    or_upload: 'or upload from gallery',
    open_camera: 'Open Camera',
    symptom_checker: 'Body Scan - Symptom Checker',
    where_hurt: 'Where does it hurt?',
    click_body_parts: 'Click on body parts to log symptoms',
    part_head: 'Head',
    part_chest: 'Chest',
    part_stomach: 'Stomach',
    part_joints: 'Joints',
    part_arms: 'Arms',
    part_legs: 'Legs',
    live_reporting: 'Live Reporting',
    capture_photo: 'Capture Patient Photo',
    position_face: 'Position your face in frame for analysis',
    start_camera: 'Start Camera',
    continue_to_assessment: 'Continue to Assessment',
    ayush_assessment: 'AYUSH Assessment',
    skip_for_now: 'Skip for now',
    assessment_summary: 'Assessment Summary',
    your_ayush_profile: 'Your AYUSH Profile',
    view_full_report: 'View Full Report',
    share_with_doctor: 'Share with Doctor',
    not_answered: 'Not answered',
    ministry_of_ayush: 'Ministry of Ayush',
    govt_of_india: 'Government of India',
    satyameva: 'सत्यमेव जयते',
    tap_to_continue: 'Tap anywhere to continue',
    // === PDF features ===
    abdm_consent_title: 'ABDM Consent',
    consent_required: 'Consent required to continue',
    consent_dpdp: 'Digital Personal Data Protection Act, 2023',
    consent_body: 'Your health data (demographics, symptoms, documents, appointments, prescriptions) will be stored securely and used only for your care by authorized MediKiosk staff and your doctor. You can withdraw consent anytime.',
    consent_scope_title: 'What will be shared',
    consent_audio_note: 'Listen to this explanation before giving consent (ABDM audio-consent)',
    consent_play_audio: 'Play audio explanation',
    consent_revocable: 'Consent is revocable anytime from Consent Management.',
    consent_grant_audio: 'Grant consent (after audio)',
    consent_grant_text: 'Grant consent (text)',
    consent_manage: 'Consent Management',
    consent_active: 'Consent is ACTIVE',
    consent_inactive: 'Consent is NOT granted',
    consent_revoke: 'Revoke consent',
    consent_history: 'Consent history',
    medical_timeline: 'Medical Timeline',
    timeline_desc: 'Your complete health journey in chronological order. Red markers are clinical alerts needing attention.',
    no_events: 'No health events yet. They appear as you use the app.',
    red_flag: 'Clinical Alert',
    ayush_kb: 'AYUSH Knowledge Base',
    kb_desc: 'Traditional medicine concepts, explained simply in English and Hindi.',
    prescription: 'Prescription & Token',
    enter_token: 'Enter your token number',
    presc_not_found: 'No prescription found for this token. It appears after your doctor visit.',
    presc_hint: 'Prescriptions are uploaded by the doctor against your OPD token. Medicine times appear here in your language.',
    your_token: 'Your Token',
    suggested_dept: 'Suggested department:',
    use_this: 'Use this department',
    my_appointment: 'My Appointment',
    medicine_times: 'Medicine Times',
    opd_place: 'MediKiosk OPD, Ground Floor',
    today: 'Today',
    no_medicines: 'No medicines scheduled',
    clinical_alerts: 'Clinical Alert',
    view_timeline: 'View Timeline'
  },
  hi: {
    report_history: 'मरीज़ की रिपोर्ट हिस्ट्री',
    report_history_desc: 'आपकी स्कैन की गई पर्चियों और रिपोर्ट से AI द्वारा निकाली गई जानकारी, नई पहले',
    ai_extracted: 'AI द्वारा निकाला',
    no_reports: 'अभी कोई रिपोर्ट नहीं — इतिहास बनाने के लिए दस्तावेज़ स्कैन करें',
    activity_alerts: 'गतिविधि और चेतावनियां',
    abnormal_short: 'असामान्य मान',
    scan_open_camera: 'दस्तावेज़ स्कैन करें',
    scan_hint: 'दस्तावेज़ को सपाट रखें और फ्रेम में भरें',
    scan_capture: 'कैप्चर करें',
    scan_upload: 'गैलरी से अपलोड करें',
    scan_processing: 'AI दस्तावेज़ पढ़ रहा है...',
    scan_review: 'निकाले गए विवरण जांचें',
    scan_save: 'मेरे रिकॉर्ड में सेव करें',
    scan_saved: 'दस्तावेज़ सफलतापूर्वक सेव हुआ',
    scan_rescan: 'दूसरा स्कैन करें',
    scan_done: 'मेरे रिकॉर्ड देखें',
    scan_no_details: 'कोई विवरण नहीं मिला — फोटो स्पष्ट नहीं हो सकती',
    scan_medicines: 'दवाइयां',
    scan_lab_values: 'लैब रिपोर्ट',
    scan_doc_type: 'दस्तावेज़ प्रकार',
    records_empty: 'अभी कोई रिकॉर्ड नहीं — पहला रिकॉर्ड बनाने के लिए दस्तावेज़ स्कैन करें',
    records_title: 'मेरे रिकॉर्ड',
    scan_error_prefix: 'स्कैन विफल',
    choose_language: 'अपनी पसंदीदा भाषा चुनें',
    continue: 'जारी रखें',
    back: 'वापस',
    fill_validation: 'कृपया अपना नाम, मान्य 10 अंकों का फ़ोन नंबर और तारीख भरें।',
    logout: 'लॉग आउट',
    change_language: 'भाषा बदलें',
    govt_healthcare: 'सरकारी आयुष स्वास्थ्य सेवा',
    mobile_number: 'मोबाइल नंबर',
    send_otp: 'OTP भेजें',
    or_login_govt: 'या सरकारी आईडी से लॉगिन करें',
    govt_medical_id: 'सरकारी मेडिकल आईडी',
    ph_10digit: '10 अंकों का नंबर',
    age: 'आयु',
    city: 'शहर',
    govt_id_login: 'सरकारी आईडी लॉगिन',
    government_login: 'सरकारी लॉगिन',
    abdm: 'एबीडीएम / आयुष्मान भारत',
    id_type: 'आईडी प्रकार',
    id_number: 'आईडी नंबर',
    enter_your_id: 'अपनी आईडी दर्ज करें',
    aadhaar: 'आधार नंबर',
    health_id: 'स्वास्थ्य आईडी',
    abha: 'ABHA नंबर',
    voice_preference: 'आवाज़ प्राथमिकता',
    how_use: 'आप इस ऐप का उपयोग कैसे करना चाहते हैं?',
    voice_assistant: 'आवाज़ सहायक',
    talk_to_ai: 'अपनी भाषा में AI से बात करें',
    use_voice_mode: 'वॉइस मोड उपयोग करें',
    or_word: 'या',
    text_only_mode: 'केवल टेक्स्ट मोड',
    main_dashboard: 'मुख्य डैशबोर्ड',
    welcome_back: 'वापसी पर स्वागत है',
    sos_emergency: '🚨 SOS - आपातकाल',
    scan_document: 'दस्तावेज़ स्कैन करें',
    voice_help: 'आवाज़ सहायता',
    live_report: 'लाइव रिपोर्ट',
    symptoms: 'लक्षण',
    appointments: 'अपॉइंटमेंट',
    my_records: 'मेरे रिकॉर्ड',
    book_appointment: 'अपॉइंटमेंट बुक करें',
    book_an_appointment: 'अपॉइंटमेंट बुक करें',
    fill_details: 'अपना विवरण भरें — यह हमारे सिस्टम में सुरक्षित रूप से सहेजा जाता है।',
    full_name: 'पूरा नाम *',
    patient_name: 'मरीज का नाम',
    phone_number: 'फ़ोन नंबर *',
    department: 'विभाग *',
    doctor_optional: 'डॉक्टर (वैकल्पिक)',
    date: 'तारीख *',
    time_slot: 'समय स्लॉट *',
    reason_symptoms: 'कारण / लक्षण',
    describe_problem: 'अपनी समस्या संक्षेप में बताएं',
    preferred_language: 'पसंदीदा भाषा',
    confirm_booking: 'बुकिंग की पुष्टि करें',
    saving: 'सहेजा जा रहा है…',
    appointment_booked: 'अपॉइंटमेंट बुक हो गया!',
    saved_in_system: 'आपका विवरण हमारे सिस्टम में सहेज लिया गया है।',
    patient: 'मरीज:',
    book_another: 'दूसरा अपॉइंटमेंट बुक करें',
    back_to_dashboard: 'डैशबोर्ड पर वापस',
    scan_medical_doc: 'मेडिकल दस्तावेज़ स्कैन करें',
    upload_prescription: 'प्रिस्क्रिप्शन, रिपोर्ट या टेस्ट रिजल्ट अपलोड करें',
    tap_to_capture: 'कैप्चर करने के लिए टैप करें',
    or_upload: 'या गैलरी से अपलोड करें',
    open_camera: 'कैमरा खोलें',
    symptom_checker: 'बॉडी स्कैन - लक्षण जांच',
    where_hurt: 'कहाँ दर्द हो रहा है?',
    click_body_parts: 'लक्षण दर्ज करने के लिए शरीर के अंगों पर क्लिक करें',
    part_head: 'सिर',
    part_chest: 'छाती',
    part_stomach: 'पेट',
    part_joints: 'जोड़',
    part_arms: 'बाँह',
    part_legs: 'पैर',
    live_reporting: 'लाइव रिपोर्टिंग',
    capture_photo: 'मरीज की फोटो लें',
    position_face: 'विश्लेषण के लिए अपना चेहरा फ्रेम में रखें',
    start_camera: 'कैमरा शुरू करें',
    continue_to_assessment: 'आकलन जारी रखें',
    ayush_assessment: 'आयुष आकलन',
    skip_for_now: 'अभी के लिए छोड़ें',
    assessment_summary: 'आकलन सारांश',
    your_ayush_profile: 'आपकी आयुष प्रोफ़ाइल',
    view_full_report: 'पूरी रिपोर्ट देखें',
    share_with_doctor: 'डॉक्टर के साथ साझा करें',
    not_answered: 'उत्तर नहीं दिया गया',
    ministry_of_ayush: 'आयुष मंत्रालय',
    govt_of_india: 'भारत सरकार',
    satyameva: 'सत्यमेव जयते',
    tap_to_continue: 'जारी रखने के लिए कहीं भी टैप करें',
    // === PDF features ===
    abdm_consent_title: 'एबीडीएम सहमति',
    consent_required: 'जारी रखने के लिए सहमति आवश्यक है',
    consent_dpdp: 'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023',
    consent_body: 'आपका स्वास्थ्य डेटा (जनांकिकी, लक्षण, दस्तावेज़, अपॉइंटमेंट, पर्चे) सुरक्षित रूप से संग्रहीत होगा और केवल आपके उपचार हेतु अधिकृत स्टाफ व डॉक्टर द्वारा उपयोग होगा। आप कभी भी सहमति वापस ले सकते हैं।',
    consent_scope_title: 'क्या साझा किया जाएगा',
    consent_audio_note: 'सहमति देने से पहले यह व्याख्या सुनें (एबीडीएम ऑडियो-सहमति)',
    consent_play_audio: 'ऑडियो व्याख्या सुनें',
    consent_revocable: 'सहमति कभी भी वापस ली जा सकती है।',
    consent_grant_audio: 'सहमति दें (ऑडियो के बाद)',
    consent_grant_text: 'सहमति दें (टेक्स्ट)',
    consent_manage: 'सहमति प्रबंधन',
    consent_active: 'सहमति सक्रिय है',
    consent_inactive: 'सहमति नहीं दी गई',
    consent_revoke: 'सहमति वापस लें',
    consent_history: 'सहमति इतिहास',
    medical_timeline: 'चिकित्सा टाइमलाइन',
    timeline_desc: 'कालक्रम में आपकी पूरी स्वास्थ्य यात्रा। लाल चिह्न चिकित्सीय चेतावनी हैं।',
    no_events: 'अभी कोई स्वास्थ्य घटना नहीं।',
    red_flag: 'चिकित्सीय चेतावनी',
    ayush_kb: 'आयुष ज्ञान कोश',
    kb_desc: 'पारंपरिक चिकित्सा अवधारणाएँ, सरल भाषा में।',
    prescription: 'पर्चा व टोकन',
    enter_token: 'अपना टोकन नंबर डालें',
    presc_not_found: 'इस टोकन का पर्चा नहीं मिला। डॉक्टर से मिलने के बाद दिखेगा।',
    presc_hint: 'पर्चे डॉक्टर द्वारा आपके टोकन पर अपलोड होते हैं। दवा का समय आपकी भाषा में यहाँ दिखता है।',
    your_token: 'आपका टोकन',
    suggested_dept: 'सुझाया विभाग:',
    use_this: 'यह विभाग चुनें',
    my_appointment: 'मेरा अपॉइंटमेंट',
    medicine_times: 'दवा का समय',
    opd_place: 'मेडीकियोस्क ओपीडी, भूतल',
    today: 'आज',
    no_medicines: 'कोई दवा निर्धारित नहीं',
    clinical_alerts: 'चिकित्सीय चेतावनी',
    view_timeline: 'टाइमलाइन देखें'
  },
  kn: {
    report_history: 'ರೋಗಿಯ ವರದಿ ಇತಿಹಾಸ',
    ai_extracted: 'AI ಮೂಲಕ ಪಡೆದದ್ದು',
    no_reports: 'ಇನ್ನೂ ಯಾವುದೇ ವರದಿ ಇಲ್ಲ — ದಸ್ತಾವೇಜು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    activity_alerts: 'ಚಟುವಟಿಕೆ ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳು',
    abnormal_short: 'ಅಸಹಜ ಮೌಲ್ಯಗಳು',
    scan_open_camera: 'ದಸ್ತಾವೇಜು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    scan_hint: 'ದಸ್ತಾವೇಜನ್ನು ಸಮತಟ್ಟಾಗಿ ಇರಿಸಿ',
    scan_capture: 'ಕ್ಯಾಪ್ಚರ್',
    scan_upload: 'ಗ್ಯಾಲರಿಯಿಂದ ಅಪ್\u200cಲೋಡ್',
    scan_processing: 'AI ದಸ್ತಾವೇಜನ್ನು ಓದುತ್ತಿದೆ...',
    scan_review: 'ಹೊರತೆಗೆದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
    scan_save: 'ದಾಖಲೆಗಳಲ್ಲಿ ಉಳಿಸಿ',
    scan_saved: 'ದಸ್ತಾವೇಜು ಉಳಿಸಲಾಗಿದೆ',
    scan_medicines: 'ಔಷಧಿಗಳು',
    records_title: 'ನನ್ನ ದಾಖಲೆಗಳು',
    choose_language: 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    continue: 'ಮುಂದುವರಿಸಿ',
    back: 'ಹಿಂದೆ',
    fill_validation: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು, ಮಾನ್ಯ 10 ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆ ಮತ್ತು ದಿನಾಂಕವನ್ನು ಭರ್ತಿ ಮಾಡಿ.',
    logout: 'ಲಾಗ್ ಔಟ್',
    change_language: 'ಭಾಷೆ ಬದಲಿಸಿ',
    govt_healthcare: 'ಸರ್ಕಾರಿ ಆಯುಷ್ ಆರೋಗ್ಯ ಸೇವೆ',
    mobile_number: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    send_otp: 'OTP ಕಳುಹಿಸಿ',
    or_login_govt: 'ಅಥವಾ ಸರ್ಕಾರಿ ID ಯಿಂದ ಲಾಗಿನ್ ಮಾಡಿ',
    govt_medical_id: 'ಸರ್ಕಾರಿ ವೈದ್ಯಕೀಯ ID',
    ph_10digit: '10 ಅಂಕಿಯ ಸಂಖ್ಯೆ',
    age: 'ವಯಸ್ಸು',
    city: 'ನಗರ',
    govt_id_login: 'ಸರ್ಕಾರಿ ID ಲಾಗಿನ್',
    government_login: 'ಸರ್ಕಾರಿ ಲಾಗಿನ್',
    abdm: 'ABDM / ಆಯುಷ್ಮಾನ್ ಭಾರತ್',
    id_type: 'ID ಪ್ರಕಾರ',
    id_number: 'ID ಸಂಖ್ಯೆ',
    enter_your_id: 'ನಿಮ್ಮ ID ನಮೂದಿಸಿ',
    aadhaar: 'ಆಧಾರ ಸಂಖ್ಯೆ',
    health_id: 'ಆರೋಗ್ಯ ID',
    abha: 'ABHA ಸಂಖ್ಯೆ',
    voice_preference: 'ಧ್ವನಿ ಆದ್ಯತೆ',
    how_use: 'ನೀವು ಈ ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ಹೇಗೆ ಬಳಸಲು ಬಯಸುತ್ತೀರಿ?',
    voice_assistant: 'ಧ್ವನಿ ಸಹಾಯಕ',
    talk_to_ai: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ AI ಯೊಂದಿಗೆ ಮಾತನಾಡಿ',
    use_voice_mode: 'ಧ್ವನಿ ಮೋಡ್ ಬಳಸಿ',
    or_word: 'ಅಥವಾ',
    text_only_mode: 'ಪಠ್ಯ ಮಾತ್ರ ಮೋಡ್',
    main_dashboard: 'ಮುಖ್ಯ ಡ್ಯಾಶ್ಬೋರ್ಡ್',
    welcome_back: 'ಮರಳಿ ಸ್ವಾಗತ',
    sos_emergency: '🚨 SOS - ತುರ್ತು',
    scan_document: 'ದಾಖಲೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    voice_help: 'ಧ್ವನಿ ಸಹಾಯ',
    live_report: 'ಲೈವ್ ವರದಿ',
    symptoms: 'ರೋಗಲಕ್ಷಣಗಳು',
    appointments: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ಗಳು',
    my_records: 'ನನ್ನ ದಾಖಲೆಗಳು',
    book_appointment: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
    book_an_appointment: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
    fill_details: 'ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ — ಅವು ನಮ್ಮ ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಲ್ಪಡುತ್ತವೆ.',
    full_name: 'ಪೂರ್ಣ ಹೆಸರು *',
    patient_name: 'ರೋಗಿಯ ಹೆಸರು',
    phone_number: 'ಫೋನ್ ಸಂಖ್ಯೆ *',
    department: 'ವಿಭಾಗ *',
    doctor_optional: 'ವೈದ್ಯರು (ಐಚ್ಛಿಕ)',
    date: 'ದಿನಾಂಕ *',
    time_slot: 'ಸಮಯ ಸ್ಲಾಟ್ *',
    reason_symptoms: 'ಕಾರಣ / ರೋಗಲಕ್ಷಣಗಳು',
    describe_problem: 'ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ',
    preferred_language: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
    confirm_booking: 'ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಿ',
    saving: 'ಉಳಿಸಲಾಗುತ್ತಿದೆ…',
    appointment_booked: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಆಗಿದೆ!',
    saved_in_system: 'ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನಮ್ಮ ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.',
    patient: 'ರೋಗಿ:',
    book_another: 'ಮತ್ತೊಂದು ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
    back_to_dashboard: 'ಡ್ಯಾಶ್ಬೋರ್ಡ್ಗೆ ಹಿಂತಿರುಗಿ',
    scan_medical_doc: 'ವೈದ್ಯಕೀಯ ದಾಖಲೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    upload_prescription: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್, ವರದಿ ಅಥವಾ ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶಗಳನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ',
    tap_to_capture: 'ಸೆರೆಹಿಡಿಯಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    or_upload: 'ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಅಪ್ಲೋಡ್ ಮಾಡಿ',
    open_camera: 'ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ',
    symptom_checker: 'ಬಾಡಿ ಸ್ಕ್ಯಾನ್ - ರೋಗಲಕ್ಷಣ ಪರೀಕ್ಷಕ',
    where_hurt: 'ಎಲ್ಲಿ ನೋವು ಇದೆ?',
    click_body_parts: 'ರೋಗಲಕ್ಷಣಗಳನ್ನು ದಾಖಲಿಸಲು ದೇಹದ ಭಾಗಗಳ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ',
    part_head: 'ತಲೆ',
    part_chest: 'ಎದೆ',
    part_stomach: 'ಹೊಟ್ಟೆ',
    part_joints: 'ಕೀಲುಗಳು',
    part_arms: 'ತೋಳುಗಳು',
    part_legs: 'ಕಾಲುಗಳು',
    live_reporting: 'ಲೈವ್ ವರದಿ',
    capture_photo: 'ರೋಗಿಯ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ',
    position_face: 'ವಿಶ್ಲೇಷಣೆಗಾಗಿ ನಿಮ್ಮ ಮುಖವನ್ನು ಫ್ರೇಮ್ನಲ್ಲಿ ಇರಿಸಿ',
    start_camera: 'ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ',
    continue_to_assessment: 'ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ',
    ayush_assessment: 'ಆಯುಷ್ ಮೌಲ್ಯಮಾಪನ',
    skip_for_now: 'ಇದೀಗ ಬಿಟ್ಟುಬಿಡಿ',
    assessment_summary: 'ಮೌಲ್ಯಮಾಪನ ಸಾರಾಂಶ',
    your_ayush_profile: 'ನಿಮ್ಮ ಆಯುಷ್ ಪ್ರೊಫೈಲ್',
    view_full_report: 'ಪೂರ್ಣ ವರದಿ ವೀಕ್ಷಿಸಿ',
    share_with_doctor: 'ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ',
    not_answered: 'ಉತ್ತರಿಸಲಾಗಿಲ್ಲ',
    ministry_of_ayush: 'ಆಯುಷ್ ಸಚಿವಾಲಯ',
    govt_of_india: 'ಭಾರತ ಸರ್ಕಾರ',
    satyameva: 'ಸತ್ಯಮೇವ ಜಯತೆ',
    tap_to_continue: 'ಮುಂದುವರಿಸಲು ಎಲ್ಲಿಯಾದರೂ ಟ್ಯಾಪ್ ಮಾಡಿ',
    medical_timeline: 'ವೈದ್ಯಕೀಯ ಕಾಲಾನುಕ್ರಮ',
    ayush_kb: 'ಆಯುಷ್ ಜ್ಞಾನ ಕೋಶ',
    prescription: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ & ಟೋಕನ್',
    consent_manage: 'ಸಮ್ಮತಿ ನಿರ್ವಹಣೆ',
    your_token: 'ನಿಮ್ಮ ಟೋಕನ್',
    my_appointment: 'ನನ್ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್',
    medicine_times: 'ಔಷಧಿ ಸಮಯ',
    today: 'ಇಂದು',
    no_medicines: 'ಔಷಧಿಗಳು ನಿಗದಿಪಡಿಸಿಲ್ಲ',
    red_flag: 'ಕ್ಲಿನಿಕಲ್ ಎಚ್ಚರಿಕೆ'
  },
  ta: {
    report_history: 'நோயாளி அறிக்கை வரலாறு',
    ai_extracted: 'AI மூலம் பெறப்பட்டது',
    no_reports: 'இன்னும் அறிக்கை இல்லை — ஆவணத்தை ஸ்கேன் செய்யவும்',
    activity_alerts: 'செயல்பாடு மற்றும் எச்சரிக்கைகள்',
    abnormal_short: 'அசாதாரண மதிப்புகள்',
    scan_open_camera: 'ஆவணத்தை ஸ்கேன் செய்யவும்',
    scan_hint: 'ஆவணத்தை சமமாக வைக்கவும்',
    scan_capture: 'படம் எடுக்கவும்',
    scan_upload: 'கேலரியில் இருந்து பதிவேற்றவும்',
    scan_processing: 'AI ஆவணத்தைப் படிக்கிறது...',
    scan_review: 'பிரித்தெடுத்த விவரங்களை சரிபார்க்கவும்',
    scan_save: 'பதிவுகளில் சேமிக்கவும்',
    scan_saved: 'ஆவணம் சேமிக்கப்பட்டது',
    scan_medicines: 'மருந்துகள்',
    records_title: 'எனது பதிவுகள்',
    choose_language: 'உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
    continue: 'தொடரவும்',
    back: 'பின்',
    fill_validation: 'தயவுசெய்து உங்கள் பெயர், சரியான 10 இலக்க தொலைபேசி எண் மற்றும் தேதியை நிரப்பவும்.',
    logout: 'வெளியேறு',
    change_language: 'மொழியை மாற்று',
    govt_healthcare: 'அரசு ஆயுஷ் சுகாதார சேவை',
    mobile_number: 'மொபைல் எண்',
    send_otp: 'OTP அனுப்பு',
    or_login_govt: 'அல்லது அரசு அடையாள அட்டை மூலம் உள்நுழையுங்கள்',
    govt_medical_id: 'அரசு மருத்துவ அடையாள அட்டை',
    ph_10digit: '10 இலக்க எண்',
    age: 'வயது',
    city: 'நகரம்',
    govt_id_login: 'அரசு அடையாள அட்டை உள்நுழைவு',
    government_login: 'அரசு உள்நுழைவு',
    abdm: 'ABDM / ஆயுஷ்மான் பாரத்',
    id_type: 'அடையாள அட்டை வகை',
    id_number: 'அடையாள எண்',
    enter_your_id: 'உங்கள் அடையாள எண்ணை உள்ளிடவும்',
    aadhaar: 'ஆதார் எண்',
    health_id: 'சுகாதார அடையாள எண்',
    abha: 'ABHA எண்',
    voice_preference: 'குரல் விருப்பம்',
    how_use: 'இந்த செயலியை எப்படிப் பயன்படுத்த விரும்புகிறீர்கள்?',
    voice_assistant: 'குரல் உதவியாளர்',
    talk_to_ai: 'உங்கள் மொழியில் AI-யுடன் பேசுங்கள்',
    use_voice_mode: 'குரல் முறையைப் பயன்படுத்து',
    or_word: 'அல்லது',
    text_only_mode: 'உரை மட்டும் முறை',
    main_dashboard: 'முதன்மை டாஷ்போர்டு',
    welcome_back: 'மீண்டும் வரவேற்கிறோம்',
    sos_emergency: '🚨 SOS - அவசரம்',
    scan_document: 'ஆவணத்தை ஸ்கேன் செய்யுங்கள்',
    voice_help: 'குரல் உதவி',
    live_report: 'நேரடி அறிக்கை',
    symptoms: 'அறிகுறிகள்',
    appointments: 'சந்திப்புகள்',
    my_records: 'எனது பதிவுகள்',
    book_appointment: 'சந்திப்பு முன்பதிவு',
    book_an_appointment: 'சந்திப்பை முன்பதிவு செய்யுங்கள்',
    fill_details: 'உங்கள் விவரங்களை நிரப்பவும் — அவை எங்கள் அமைப்பில் பாதுகாப்பாகச் சேமிக்கப்படும்.',
    full_name: 'முழுப் பெயர் *',
    patient_name: 'நோயாளியின் பெயர்',
    phone_number: 'தொலைபேசி எண் *',
    department: 'துறை *',
    doctor_optional: 'மருத்துவர் (விருப்பம்)',
    date: 'தேதி *',
    time_slot: 'நேர இடைவெளி *',
    reason_symptoms: 'காரணம் / அறிகுறிகள்',
    describe_problem: 'உங்கள் பிரச்சினையைச் சுருக்கமாக விவரிக்கவும்',
    preferred_language: 'விருப்ப மொழி',
    confirm_booking: 'முன்பதிவை உறுதிப்படுத்து',
    saving: 'சேமிக்கிறது…',
    appointment_booked: 'சந்திப்பு முன்பதிவு செய்யப்பட்டது!',
    saved_in_system: 'உங்கள் விவரங்கள் எங்கள் அமைப்பில் சேமிக்கப்பட்டுள்ளன.',
    patient: 'நோயாளி:',
    book_another: 'மற்றொரு சந்திப்பை முன்பதிவு செய்யுங்கள்',
    back_to_dashboard: 'டாஷ்போர்டுக்குத் திரும்பு',
    scan_medical_doc: 'மருத்துவ ஆவணத்தை ஸ்கேன் செய்யுங்கள்',
    upload_prescription: 'மருந்துச்சீட்டு, அறிக்கை அல்லது சோதனை முடிவுகளைப் பதிவேற்றவும்',
    tap_to_capture: 'படம்பிடிக்கத் தட்டவும்',
    or_upload: 'அல்லது கேலரியிலிருந்து பதிவேற்றவும்',
    open_camera: 'கேமராவைத் திற',
    symptom_checker: 'உடல் ஸ்கேன் - அறிகுறி சரிபார்ப்பு',
    where_hurt: 'எங்கே வலிக்கிறது?',
    click_body_parts: 'அறிகுறிகளைப் பதிவுசெய்ய உடல் பாகங்களைக் கிளிக் செய்யவும்',
    part_head: 'தலை',
    part_chest: 'மார்பு',
    part_stomach: 'வயிறு',
    part_joints: 'மூட்டுகள்',
    part_arms: 'கைகள்',
    part_legs: 'கால்கள்',
    live_reporting: 'நேரடி அறிக்கை',
    capture_photo: 'நோயாளியின் புகைப்படத்தை எடுக்கவும்',
    position_face: 'பகுப்பாய்வுக்காக உங்கள் முகத்தை சட்டகத்தில் வைக்கவும்',
    start_camera: 'கேமராவைத் தொடங்கு',
    continue_to_assessment: 'மதிப்பீட்டிற்குத் தொடரவும்',
    ayush_assessment: 'ஆயுஷ் மதிப்பீடு',
    skip_for_now: 'இப்போதைக்கு தவிர்க்கவும்',
    assessment_summary: 'மதிப்பீட்டு சுருக்கம்',
    your_ayush_profile: 'உங்கள் ஆயுஷ் சுயவிவரம்',
    view_full_report: 'முழு அறிக்கையைப் பார்க்க',
    share_with_doctor: 'மருத்துவருடன் பகிரவும்',
    not_answered: 'பதிலளிக்கப்படவில்லை',
    ministry_of_ayush: 'ஆயுஷ் அமைச்சகம்',
    govt_of_india: 'இந்திய அரசு',
    satyameva: 'சத்யமேவ ஜெயதே',
    tap_to_continue: 'தொடர்ந்து செல்ல எங்கிலும் தட்டவும்',
    medical_timeline: 'மருத்துவ காலவரிசை',
    ayush_kb: 'ஆயுஷ் அறிவுக் களஞ்சியம்',
    prescription: 'மருந்து விபரம் & டோக்கன்',
    consent_manage: 'சம்மதம் நிர்வகிப்பு',
    your_token: 'உங்கள் டோக்கன்',
    my_appointment: 'என் சந்திப்பு',
    medicine_times: 'மருந்து நேரம்',
    today: 'இன்று',
    no_medicines: 'மருந்துகள் இல்லை',
    red_flag: 'மருத்துவ எச்சரிக்கை'
  },
  mr: {
    report_history: 'रुग्ण अहवाल इतिहास',
    ai_extracted: 'AI द्वारे काढलेले',
    no_reports: 'अजून अहवाल नाही — दस्तऐवज स्कॅन करा',
    activity_alerts: 'क्रियाकलाप आणि सूचना',
    abnormal_short: 'असामान्य मूल्ये',
    scan_open_camera: 'दस्तऐवज स्कॅन करा',
    scan_hint: 'दस्तऐवज सपाट ठेवा',
    scan_capture: 'कॅप्चर करा',
    scan_upload: 'गॅलरीतून अपलोड करा',
    scan_processing: 'AI दस्तऐवज वाचत आहे...',
    scan_review: 'काढलेले तपशील तपासा',
    scan_save: 'रेकॉर्डमध्ये जतन करा',
    scan_saved: 'दस्तऐवज जतन झाला',
    scan_medicines: 'औषधे',
    records_title: 'माझी रेकॉर्ड',
    choose_language: 'आपली पसंतीची भाषा निवडा',
    continue: 'पुढे चला',
    back: 'मागे',
    fill_validation: 'कृपया तुमचे नाव, वैध १०-अंकी फोन नंबर आणि तारीख भरा.',
    logout: 'लॉग आउट',
    change_language: 'भाषा बदला',
    govt_healthcare: 'शासकीय आयुष आरोग्य सेवा',
    mobile_number: 'मोबाइल क्रमांक',
    send_otp: 'OTP पाठवा',
    or_login_govt: 'किंवा शासकीय आयडीने लॉगिन करा',
    govt_medical_id: 'शासकीय वैद्यकीय आयडी',
    ph_10digit: '१० अंकी नंबर',
    age: 'वय',
    city: 'शहर',
    govt_id_login: 'शासकीय आयडी लॉगिन',
    government_login: 'शासकीय लॉगिन',
    abdm: 'एबीडीएम / आयुष्मान भारत',
    id_type: 'आयडी प्रकार',
    id_number: 'आयडी क्रमांक',
    enter_your_id: 'तुमची आयडी टाका',
    aadhaar: 'आधार क्रमांक',
    health_id: 'आरोग्य आयडी',
    abha: 'ABHA क्रमांक',
    voice_preference: 'आवाज पसंती',
    how_use: 'तुम्ही हा ऍप कसा वापरू इच्छिता?',
    voice_assistant: 'आवाज सहाय्यक',
    talk_to_ai: 'तुमच्या भाषेत AI शी बोला',
    use_voice_mode: 'व्हॉइस मोड वापरा',
    or_word: 'किंवा',
    text_only_mode: 'फक्त मजकूर मोड',
    main_dashboard: 'मुख्य डॅशबोर्ड',
    welcome_back: 'पुन्हा स्वागत आहे',
    sos_emergency: '🚨 SOS - आपत्कालीन',
    scan_document: 'दस्तऐवज स्कॅन करा',
    voice_help: 'आवाज मदत',
    live_report: 'थेट अहवाल',
    symptoms: 'लक्षणे',
    appointments: 'भेटी',
    my_records: 'माझी रेकॉर्ड',
    book_appointment: 'भेट बुक करा',
    book_an_appointment: 'भेट बुक करा',
    fill_details: 'तुमचे तपशील भरा — ते आमच्या प्रणालीत सुरक्षित जतन होतात.',
    full_name: 'पूर्ण नाव *',
    patient_name: 'रुग्णाचे नाव',
    phone_number: 'फोन क्रमांक *',
    department: 'विभाग *',
    doctor_optional: 'डॉक्टर (ऐच्छिक)',
    date: 'तारीख *',
    time_slot: 'वेळ *',
    reason_symptoms: 'कारण / लक्षणे',
    describe_problem: 'तुमची समस्या थोडक्यात सांगा',
    preferred_language: 'पसंतीची भाषा',
    confirm_booking: 'बुकिंग निश्चित करा',
    saving: 'जतन करत आहे…',
    appointment_booked: 'भेट बुक झाली!',
    saved_in_system: 'तुमचे तपशील आमच्या प्रणालीत जतन झाले आहेत.',
    patient: 'रुग्ण:',
    book_another: 'आणखी भेट बुक करा',
    back_to_dashboard: 'डॅशबोर्डवर परत',
    scan_medical_doc: 'वैद्यकीय दस्तऐवज स्कॅन करा',
    upload_prescription: 'प्रिस्क्रिप्शन, अहवाल किंवा चाचणी निकाल अपलोड करा',
    tap_to_capture: 'कॅप्चर करण्यासाठी टॅप करा',
    or_upload: 'किंवा गॅलरीतून अपलोड करा',
    open_camera: 'कॅमेरा उघडा',
    symptom_checker: 'शरीर तपासणी - लक्षण तपासनीस',
    where_hurt: 'कुठे दुखते?',
    click_body_parts: 'लक्षणे नोंदवण्यासाठी शरीराचे भाग दाबा',
    part_head: 'डोके',
    part_chest: 'छाती',
    part_stomach: 'पोट',
    part_joints: 'सांधे',
    part_arms: 'हात',
    part_legs: 'पाय',
    live_reporting: 'थेट नोंद',
    capture_photo: 'रुग्णाचा फोटो घ्या',
    position_face: 'विश्लेषणासाठी चेहरा फ्रेममध्ये ठेवा',
    start_camera: 'कॅमेरा सुरू करा',
    continue_to_assessment: 'तपासणीकडे पुढे जा',
    ayush_assessment: 'आयुष मूल्यांकन',
    skip_for_now: 'आत्तासाठी वगळा',
    assessment_summary: 'मूल्यांकन सारांश',
    your_ayush_profile: 'तुमचे आयुष प्रोफाइल',
    view_full_report: 'संपूर्ण अहवाल पहा',
    share_with_doctor: 'डॉक्टरांसोबत शेअर करा',
    not_answered: 'उत्तर दिलेले नाही',
    ministry_of_ayush: 'आयुष मंत्रालय',
    govt_of_india: 'भारत सरकार',
    satyameva: 'सत्यमेव जयते',
    tap_to_continue: 'पुढे जाण्यासाठी कुठेही टॅप करा',
    medical_timeline: 'वैद्यकीय टाइमलाइन',
    ayush_kb: 'आयुष ज्ञानकोश',
    prescription: 'पर्चा व टोकन',
    consent_manage: 'संमती व्यवस्थापन',
    your_token: 'तुमचा टोकन',
    my_appointment: 'माझी भेट',
    medicine_times: 'औषधाची वेळ',
    today: 'आज',
    no_medicines: 'औषध नाही',
    red_flag: 'वैद्यकीय सूचना'
  },
  bn: {
    report_history: 'রোগীর রিপোর্ট ইতিহাস',
    ai_extracted: 'AI দ্বারা সংগৃহীত',
    no_reports: 'এখনও কোনো রিপোর্ট নেই — নথি স্ক্যান করুন',
    activity_alerts: 'কার্যকলাপ ও সতর্কতা',
    abnormal_short: 'অস্বাভাবিক মান',
    scan_open_camera: 'দস্তাবেজ স্ক্যান করুন',
    scan_hint: 'দস্তাবেজ সমতল রাখুন',
    scan_capture: 'ক্যাপচার করুন',
    scan_upload: 'গ্যালারি থেকে আপলোড করুন',
    scan_processing: 'AI দস্তাবেজ পড়ছে...',
    scan_review: '_extracted বিবরণ দেখুন',
    scan_save: 'রেকর্ডে সংরক্ষণ করুন',
    scan_saved: 'দস্তাবেজ সংরক্ষিত হয়েছে',
    scan_medicines: 'ওষুধ',
    records_title: 'আমার রেকর্ড',
    choose_language: 'আপনার পছন্দের ভাষা নির্বাচন করুন',
    continue: 'চালিয়ে যান',
    back: 'পিছনে',
    fill_validation: 'অনুগ্রহ করে আপনার নাম, বৈধ ১০-সংখ্যার ফোন নম্বর এবং তারিখ দিন।',
    logout: 'লগ আউট',
    change_language: 'ভাষা পরিবর্তন করুন',
    govt_healthcare: 'সরকারি আয়ুষ স্বাস্থ্যসেবা',
    mobile_number: 'মোবাইল নম্বর',
    send_otp: 'OTP পাঠান',
    or_login_govt: 'অথবা সরকারি আইডি দিয়ে লগইন করুন',
    govt_medical_id: 'সরকারি মেডিকেল আইডি',
    ph_10digit: '১০ সংখ্যার নম্বর',
    age: 'বয়স',
    city: 'শহর',
    govt_id_login: 'সরকারি আইডি লগইন',
    government_login: 'সরকারি লগইন',
    abdm: 'এবিডিএম / আয়ুষ্মান ভারত',
    id_type: 'আইডির ধরন',
    id_number: 'আইডি নম্বর',
    enter_your_id: 'আপনার আইডি লিখুন',
    aadhaar: 'আধার নম্বর',
    health_id: 'স্বাস্থ্য আইডি',
    abha: 'ABHA নম্বর',
    voice_preference: 'ভয়েস পছন্দ',
    how_use: 'আপনি এই অ্যাপটি কীভাবে ব্যবহার করতে চান?',
    voice_assistant: 'ভয়েস সহকারী',
    talk_to_ai: 'আপনার ভাষায় AI-এর সাথে কথা বলুন',
    use_voice_mode: 'ভয়েস মোড ব্যবহার করুন',
    or_word: 'অথবা',
    text_only_mode: 'শুধু টেক্সট মোড',
    main_dashboard: 'মূল ড্যাশবোর্ড',
    welcome_back: 'ফিরে আসার জন্য স্বাগতম',
    sos_emergency: '🚨 SOS - জরুরি',
    scan_document: 'নথি স্ক্যান করুন',
    voice_help: 'ভয়েস সাহায্য',
    live_report: 'লাইভ রিপোর্ট',
    symptoms: 'উপসর্গ',
    appointments: 'অ্যাপয়েন্টমেন্ট',
    my_records: 'আমার রেকর্ড',
    book_appointment: 'অ্যাপয়েন্টমেন্ট বুক করুন',
    book_an_appointment: 'অ্যাপয়েন্টমেন্ট বুক করুন',
    fill_details: 'আপনার তথ্য দিন — সেগুলি আমাদের সিস্টেমে নিরাপদে সংরক্ষিত হয়।',
    full_name: 'পূর্ণ নাম *',
    patient_name: 'রোগীর নাম',
    phone_number: 'ফোন নম্বর *',
    department: 'বিভাগ *',
    doctor_optional: 'ডাক্তার (ঐচ্ছিক)',
    date: 'তারিখ *',
    time_slot: 'সময় *',
    reason_symptoms: 'কারণ / উপসর্গ',
    describe_problem: 'সংক্ষেপে আপনার সমস্যা লিখুন',
    preferred_language: 'পছন্দের ভাষা',
    confirm_booking: 'বুকিং নিশ্চিত করুন',
    saving: 'সংরক্ষণ করা হচ্ছে…',
    appointment_booked: 'অ্যাপয়েন্টমেন্ট বুক হয়েছে!',
    saved_in_system: 'আপনার তথ্য আমাদের সিস্টেমে সংরক্ষিত হয়েছে।',
    patient: 'রোগী:',
    book_another: 'আরেকটি অ্যাপয়েন্টমেন্ট বুক করুন',
    back_to_dashboard: 'ড্যাশবোর্ডে ফিরুন',
    scan_medical_doc: 'মেডিকেল নথি স্ক্যান করুন',
    upload_prescription: 'প্রেসক্রিপশন, রিপোর্ট বা টেস্টের ফলাফল আপলোড করুন',
    tap_to_capture: 'ছবি তুলতে ট্যাপ করুন',
    or_upload: 'অথবা গ্যালারি থেকে আপলোড করুন',
    open_camera: 'ক্যামেরা খুলুন',
    symptom_checker: 'বডি স্ক্যান - উপসর্গ পরীক্ষক',
    where_hurt: 'কোথায় ব্যথা?',
    click_body_parts: 'উপসর্গ লিখতে শরীরের অংশে চাপ দিন',
    part_head: 'মাথা',
    part_chest: 'বুক',
    part_stomach: 'পেট',
    part_joints: 'জয়েন্ট',
    part_arms: 'হাত',
    part_legs: 'পা',
    live_reporting: 'লাইভ রিপোর্টিং',
    capture_photo: 'রোগীর ছবি তুলুন',
    position_face: 'বিশ্লেষণের জন্য মুখ ফ্রেমে রাখুন',
    start_camera: 'ক্যামেরা চালু করুন',
    continue_to_assessment: 'মূল্যায়নে এগিয়ে যান',
    ayush_assessment: 'আয়ুষ মূল্যায়ন',
    skip_for_now: 'এখন এড়িয়ে যান',
    assessment_summary: 'মূল্যায়নের সারসংক্ষেপ',
    your_ayush_profile: 'আপনার আয়ুষ প্রোফাইল',
    view_full_report: 'সম্পূর্ণ রিপোর্ট দেখুন',
    share_with_doctor: 'ডাক্তারের সাথে শেয়ার করুন',
    not_answered: 'উত্তর দেওয়া হয়নি',
    ministry_of_ayush: 'আয়ুষ মন্ত্রক',
    govt_of_india: 'ভারত সরকার',
    satyameva: 'সত্যমেব জয়তে',
    tap_to_continue: 'চালিয়ে যেতে যেকোনো জায়গায় ট্যাপ করুন',
    medical_timeline: 'মেডিকেল টাইমলাইন',
    ayush_kb: 'আয়ুষ জ্ঞানভাণ্ডার',
    prescription: 'প্রেসক্রিপশন ও টোকেন',
    consent_manage: 'সম্মতি ব্যবস্থাপনা',
    your_token: 'আপনার টোকেন',
    my_appointment: 'আমার অ্যাপয়েন্টমেন্ট',
    medicine_times: 'ওষুধের সময়',
    today: 'আজ',
    no_medicines: 'কোনো ওষুধ নেই',
    red_flag: 'চিকিৎসা সতর্কতা'
  },
  ur: {
    report_history: 'مریض کی رپورٹ ہسٹری',
    ai_extracted: 'AI سے نکالا گیا',
    no_reports: 'ابھی کوئی رپورٹ نہیں — دستاویز اسکین کریں',
    activity_alerts: 'سرگرمی اور انتباہات',
    abnormal_short: 'غیر معمولی اقدار',
    scan_open_camera: 'دستاویز اسکین کریں',
    scan_hint: 'دستاویز کو ہموار رکھیں',
    scan_capture: 'کیپچر کریں',
    scan_upload: 'گیلری سے اپ لوڈ کریں',
    scan_processing: 'AI دستاویز پڑھ رہا ہے...',
    scan_review: 'نکالے گئے تفصیلات دیکھیں',
    scan_save: 'ریکارڈ میں محفوظ کریں',
    scan_saved: 'دستاویز محفوظ ہو گیا',
    scan_medicines: 'دوائیں',
    records_title: 'میرے ریکارڈ',
    choose_language: 'اپنی پسندیدہ زبان منتخب کریں',
    continue: 'جاری رکھیں',
    back: 'واپس',
    fill_validation: 'براہ کرم اپنا نام، درست 10 ہندسوں کا فون نمبر اور تاریخ درج کریں۔',
    logout: 'لاگ آؤٹ',
    change_language: 'زبان تبدیل کریں',
    govt_healthcare: 'سرکاری آیوش صحت خدمات',
    mobile_number: 'موبائل نمبر',
    send_otp: 'OTP بھیجیں',
    or_login_govt: 'یا سرکاری شناختی نمبر سے لاگ ان کریں',
    govt_medical_id: 'سرکاری میڈیکل آئی ڈی',
    ph_10digit: '10 ہندسوں کا نمبر',
    age: 'عمر',
    city: 'شہر',
    govt_id_login: 'سرکاری آئی ڈی لاگ ان',
    government_login: 'سرکاری لاگ ان',
    abdm: 'اے بی ڈی ایم / آیوشمان بھارت',
    id_type: 'شناختی کی قسم',
    id_number: 'شناختی نمبر',
    enter_your_id: 'اپنی شناختی درج کریں',
    aadhaar: 'آدھار نمبر',
    health_id: 'ہیلتھ آئی ڈی',
    abha: 'ABHA نمبر',
    voice_preference: 'آواز کی ترجیح',
    how_use: 'آپ یہ ایپ کیسے استعمال کرنا چاہتے ہیں؟',
    voice_assistant: 'آواز معاون',
    talk_to_ai: 'اپنی زبان میں AI سے بات کریں',
    use_voice_mode: 'وائس موڈ استعمال کریں',
    or_word: 'یا',
    text_only_mode: 'صرف ٹیکسٹ موڈ',
    main_dashboard: 'مرکزی ڈیش بورڈ',
    welcome_back: 'خوش آمدید',
    sos_emergency: '🚨 SOS - ایمرجنسی',
    scan_document: 'دستاویز اسکین کریں',
    voice_help: 'آواز مدد',
    live_report: 'لائیو رپورٹ',
    symptoms: 'علامات',
    appointments: 'اپائنٹمنٹس',
    my_records: 'میرے ریکارڈز',
    book_appointment: 'اپائنٹمنٹ بک کریں',
    book_an_appointment: 'اپائنٹمنٹ بک کریں',
    fill_details: 'اپنی تفصیلات درج کریں — وہ ہمارے نظام میں محفوظ طریقے سے محفوظ ہوں گی۔',
    full_name: 'پورا نام *',
    patient_name: 'مریض کا نام',
    phone_number: 'فون نمبر *',
    department: 'شعبہ *',
    doctor_optional: 'ڈاکٹر (اختیاری)',
    date: 'تاریخ *',
    time_slot: 'وقت *',
    reason_symptoms: 'وجہ / علامات',
    describe_problem: 'اپنا مسئلہ مختصراً بیان کریں',
    preferred_language: 'پسندیدہ زبان',
    confirm_booking: 'بکنگ کی تصدیق کریں',
    saving: 'محفوظ کیا جا رہا ہے…',
    appointment_booked: 'اپائنٹمنٹ بک ہو گئی!',
    saved_in_system: 'آپ کی تفصیلات ہمارے نظام میں محفوظ ہو گئی ہیں۔',
    patient: 'مریض:',
    book_another: 'ایک اور اپائنٹمنٹ بک کریں',
    back_to_dashboard: 'ڈیش بورڈ پر واپس',
    scan_medical_doc: 'میڈیکل دستاویز اسکین کریں',
    upload_prescription: 'پری اسکرپشن، رپورٹ یا ٹیسٹ کے نتائج اپ لوڈ کریں',
    tap_to_capture: 'تصویر لینے کے لیے ٹیپ کریں',
    or_upload: 'یا گیلری سے اپ لوڈ کریں',
    open_camera: 'کیمرہ کھولیں',
    symptom_checker: 'باڈی اسکین - علامات چیکر',
    where_hurt: 'کہاں درد ہے؟',
    click_body_parts: 'علامات درج کرنے کے لیے جسم کے حصوں پر کلک کریں',
    part_head: 'سر',
    part_chest: 'سینہ',
    part_stomach: 'پیٹ',
    part_joints: 'جوڑ',
    part_arms: 'بازو',
    part_legs: 'ٹانگیں',
    live_reporting: 'لائیو رپورٹنگ',
    capture_photo: 'مریض کی تصویر لیں',
    position_face: 'تجزیے کے لیے چہرہ فریم میں رکھیں',
    start_camera: 'کیمرہ شروع کریں',
    continue_to_assessment: 'تشخیص کی طرف بڑھیں',
    ayush_assessment: 'آیوش تشخیص',
    skip_for_now: 'ابھی چھوڑ دیں',
    assessment_summary: 'تشخیص کا خلاصہ',
    your_ayush_profile: 'آپ کی آیوش پروفائل',
    view_full_report: 'مکمل رپورٹ دیکھیں',
    share_with_doctor: 'ڈاکٹر کے ساتھ شیئر کریں',
    not_answered: 'جواب نہیں دیا گیا',
    ministry_of_ayush: 'وزارت آیوش',
    govt_of_india: 'حکومت ہند',
    satyameva: 'ستیہ میو جے تے',
    tap_to_continue: 'جاری رکھنے کے لیے کہیں بھی ٹیپ کریں',
    medical_timeline: 'طبی ٹائم لائن',
    ayush_kb: 'آیوش علمی خزانہ',
    prescription: 'پیشکش اور ٹوکن',
    consent_manage: 'رضامندی کا انتظام',
    your_token: 'آپ کا ٹوکن',
    my_appointment: 'میری اپائنٹمنٹ',
    medicine_times: 'دوا کا وقت',
    today: 'آج',
    no_medicines: 'کوئی دوا نہیں',
    red_flag: 'طبی انتباہ'
  }
};

const MediKioskApp = () => {
  const storedLang = typeof window !== 'undefined' ? localStorage.getItem('mk_lang') : null;
  const [currentScreen, setCurrentScreen] = useState('intro');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientCity, setPatientCity] = useState('');
  const [appLang, setAppLang] = useState(storedLang || 'en');
  const [selectedLanguage, setSelectedLanguage] = useState(
    storedLang ? (LANGUAGES.find((l) => l.code === storedLang) || {}).label : 'हिंदी'
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [appointmentForm, setAppointmentForm] = useState({
    name: '',
    phone: '',
    department: 'General Medicine',
    doctor: '',
    date: '',
    timeSlot: '9:00 AM - 10:00 AM',
    reason: '',
    language: 'English'
  });
  const [bookingStatus, setBookingStatus] = useState('idle');
  const [bookingError, setBookingError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('mk_theme') || 'light');
  // PDF feature set: consent gate, token, medicines, alerts, timeline, KB, prescription
  const [consentGranted, setConsentGranted] = useState(() => sessionStorage.getItem('mk_consent') === 'granted');
  const [consentPlayed, setConsentPlayed] = useState(false);
  const [consentLog, setConsentLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mk_consent_log') || '[]'); } catch { return []; }
  });
  const [lastToken, setLastToken] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [prescToken, setPrescToken] = useState('');
  const [prescResult, setPrescResult] = useState(null);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const refreshTimeline = () => setTimelineVersion((v) => v + 1);

  // --- Document Scan (camera -> Gemini extraction -> review -> save) ---
  const voiceApiBase = (() => {
    if (typeof window === 'undefined') return 'http://localhost:8000';
    const host = window.location.hostname;
    return host === 'localhost'
      ? 'http://localhost:8000'
      : `http://${host}:8000`;
  })();
  const [scanStage, setScanStage] = useState('idle'); // idle | camera | processing | review | saved
  const [scanError, setScanError] = useState('');
  const [scanImage, setScanImage] = useState(null); // dataURL preview
  const [scanData, setScanData] = useState(null);   // extracted JSON
  const [scanSaving, setScanSaving] = useState(false);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const scanStreamRef = React.useRef(null);

  const stopScanCamera = () => {
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach((tr) => tr.stop());
      scanStreamRef.current = null;
    }
  };

  const openScanCamera = async () => {
    setScanError('');
    setScanStage('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      scanStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setScanStage('idle');
      setScanError(err && err.name === 'NotAllowedError'
        ? 'Camera permission denied — use Upload instead'
        : 'Camera unavailable — use Upload instead');
    }
  };

  const extractDocument = async (blob) => {
    setScanStage('processing');
    setScanError('');
    stopScanCamera();
    const reader = new FileReader();
    reader.onload = () => setScanImage(reader.result);
    reader.readAsDataURL(blob);
    try {
      const fd = new FormData();
      fd.append('image', blob, 'document.jpg');
      const res = await fetch(`${voiceApiBase}/scan-document`, { method: 'POST', body: fd });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || `Extraction failed (${res.status})`);
      }
      const data = await res.json();
      setScanData(data);
      setScanStage('review');
    } catch (err) {
      setScanStage('idle');
      setScanError(err.message === 'Failed to fetch'
        ? 'Cannot reach the AI server — is it running on port 8000?'
        : err.message);
    }
  };

  const captureScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => { if (blob) extractDocument(blob); }, 'image/jpeg', 0.92);
  };

  const handleScanFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) extractDocument(file);
    e.target.value = '';
  };

  const resetScan = () => {
    stopScanCamera();
    setScanStage('idle');
    setScanError('');
    setScanImage(null);
    setScanData(null);
  };

  const saveScannedRecord = async () => {
    if (!scanData) return;
    setScanSaving(true);
    setScanError('');
    const record = {
      patient_name: scanData.patient_name || patientName || '',
      phone: phoneNumber || '',
      doc_type: scanData.doc_type || 'other',
      hospital: scanData.hospital || '',
      doctor: scanData.doctor || '',
      record_date: scanData.date || '',
      diagnosis: scanData.diagnosis || '',
      medicines: scanData.medicines || [],
      lab_values: scanData.lab_values || [],
      notes: scanData.notes || ''
    };
    let saved = false;
    try {
      const { error } = await supabase.from('medical_records').insert(record);
      saved = !error;
      if (error) console.warn('Supabase insert failed:', error.message);
    } catch { /* offline — keep local copy */ }
    // Local mirror so My Records / timeline work even when Supabase is unreachable
    try {
      const local = JSON.parse(localStorage.getItem('mk_medical_records') || '[]');
      local.unshift({ ...record, created_at: new Date().toISOString(), synced: saved });
      localStorage.setItem('mk_medical_records', JSON.stringify(local.slice(0, 100)));
    } catch {}
    if (saved && (record.medicines || []).length) {
      setMedicines(record.medicines);
      localStorage.setItem('mk_medicines', JSON.stringify(record.medicines));
    }
    // AI-extracted clinical facts become the patient's medical history:
    // a dated history entry, timeline events and alerts for abnormal values.
    addReportHistory(record);
    refreshTimeline();
    setScanSaving(false);
    setScanStage('saved');
  };

  const grantConsent = (method) => {
    const entry = {
      at: new Date().toISOString(),
      method, // 'audio' | 'text'
      scope: ['Demographics', 'Symptoms & History', 'Documents', 'Appointments', 'Prescriptions'],
      dpdp: 'DPDP Act 2023'
    };
    sessionStorage.setItem('mk_consent', 'granted');
    setConsentGranted(true);
    const log = [...consentLog, entry];
    setConsentLog(log);
    localStorage.setItem('mk_consent_log', JSON.stringify(log));
    addTimelineEvent('ABDM consent granted', `Method: ${method} · Scope: demographics, symptoms, documents, appointments, prescriptions`, 'consent');
    setCurrentScreen('dashboard');
  };

  const revokeConsent = () => {
    const entry = {
      at: new Date().toISOString(),
      method: 'revoke',
      scope: [],
      dpdp: 'DPDP Act 2023'
    };
    sessionStorage.removeItem('mk_consent');
    setConsentGranted(false);
    const log = [...consentLog, entry];
    setConsentLog(log);
    localStorage.setItem('mk_consent_log', JSON.stringify(log));
    addTimelineEvent('ABDM consent revoked', 'Data sharing stopped; historical record retained per clinic policy', 'consent');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('mk_theme', theme);
  }, [theme]);

  const toggleTheme = (e) => {
    e.stopPropagation();
    setTheme((th) => (th === 'dark' ? 'light' : 'dark'));
  };

  // Stop the document-scan camera whenever the user leaves that screen
  useEffect(() => {
    if (currentScreen !== 'documentScan') stopScanCamera();
  }, [currentScreen]);

  const t = (key) => (TRANSLATIONS[appLang] && TRANSLATIONS[appLang][key]) || TRANSLATIONS.en[key] || key;

  const ayushQuestions = [
    {
      id: 'prakriti',
      category: '🌿 Prakriti',
      title: 'Body Constitution',
      question: "What is your natural body constitution?",
      options: ['Vata - Thin, active, cold', 'Pitta - Medium, warm, sharp', 'Kapha - Heavy, calm, stable', 'Dual/Mixed']
    },
    {
      id: 'vikriti',
      category: '⚡ Vikriti',
      title: 'Current Imbalance',
      question: "What is currently going wrong or imbalanced?",
      options: ['Vata imbalance - anxiety, dryness', 'Pitta imbalance - anger, fever', 'Kapha imbalance - lethargy, cold', 'Multiple imbalances']
    },
    {
      id: 'agni',
      category: '🔥 Agni',
      title: 'Digestive Power',
      question: "How well does your digestive system work?",
      options: ['Strong - Regular, good appetite', 'Weak - Irregular, low appetite', 'Irregular - Inconsistent digestion', 'Other issues']
    },
    {
      id: 'koshtha',
      category: '💧 Koshtha',
      title: 'Bowel Nature',
      question: "What is your bowel/digestive nature?",
      options: ['Vata - Irregular, constipated', 'Pitta - Loose, frequent', 'Kapha - Heavy, sluggish', 'Balanced & regular']
    },
    {
      id: 'ahara',
      category: '🍎 Ahara-Vihara',
      title: 'Diet & Lifestyle',
      question: "What do you typically eat and what is your lifestyle?",
      options: ['Regular, balanced, active', 'Spicy, varied, moderate activity', 'Heavy, fatty, low activity', 'Irregular eating & sleep']
    },
    {
      id: 'nidana',
      category: '🔍 Nidana',
      title: 'Disease Cause',
      question: "What might have caused this condition?",
      options: ['Stress & anxiety', 'Poor diet', 'Sedentary lifestyle', 'Environmental factors', 'Unknown']
    },
    {
      id: 'samprapti',
      category: '📊 Samprapti',
      title: 'Disease Progression',
      question: "How did the disease develop?",
      options: ['Sudden onset', 'Gradual progression', 'Seasonal pattern', 'Related to specific event']
    },
    {
      id: 'pariksha',
      category: '🩺 Pariksha',
      title: 'Traditional Exam',
      question: "Any other symptoms or observations?",
      options: ['Tongue coating', 'Skin changes', 'Energy levels', 'Sleep quality']
    }
  ];

  const handlePhoneSubmit = () => {
    const phoneOk = phoneNumber.length === 10 || phoneNumber.includes('+91');
    if (phoneOk && patientName.trim()) {
      setCurrentScreen('govtIDLogin');
    }
  };

  const handleVoiceChoice = (mode) => {
    // PDF: ABDM consent gate (DPDP 2023) before any health data flows
    if (!consentGranted) { setCurrentScreen('consentGate'); return; }
    setCurrentScreen(mode === 'voice' ? 'voiceAssistant' : 'dashboard');
  };

  const handleAnswer = (answer) => {
    setAnswers({
      ...answers,
      [ayushQuestions[currentQuestion].id]: answer
    });
    // PDF: continuous red-flag surveillance over patient responses
    const flags = detectRedFlags(answer);
    if (flags.length) {
      addClinicalAlert(flags, 'AYUSH Assessment', ayushQuestions[currentQuestion].title);
      refreshTimeline();
    }
    if (currentQuestion < ayushQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      addTimelineEvent('AYUSH assessment completed', `${Object.keys({ ...answers, [ayushQuestions[currentQuestion].id]: answer }).length} responses recorded`, 'assessment');
      setCurrentScreen('summary');
    }
  };

  const pickLanguage = (code, label) => {
    setAppLang(code);
    setSelectedLanguage(label);
    localStorage.setItem('mk_lang', code);
  };

  // Urdu reads right-to-left — flip the whole document, restore otherwise
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('dir', appLang === 'ur' ? 'rtl' : 'ltr');
    el.setAttribute('lang', appLang);
  }, [appLang]);

  const handleLogout = () => {
    setPhoneNumber('');
    setPatientName('');
    setPatientAge('');
    setPatientCity('');
    setCurrentQuestion(0);
    setAnswers({});
    setAppointmentForm({
      name: '', phone: '', department: 'General Medicine', doctor: '', date: '', timeSlot: '9:00 AM - 10:00 AM', reason: '', language: 'English'
    });
    setBookingStatus('idle');
    setBookingError('');
    setCurrentScreen('languageSelect');
  };

  const handleBookAppointment = async () => {
    const { name, phone, date, department, doctor, timeSlot, reason, language } = appointmentForm;
    if (!name.trim() || phone.replace(/\D/g, '').length !== 10 || !date) {
      setBookingError(t('fill_validation'));
      setBookingStatus('error');
      return;
    }
    setBookingStatus('saving');
    setBookingError('');
    // PDF: department guidance auto-suggestion from the stated reason/symptoms
    const suggested = suggestDepartment(reason || '');
    const dept = department && department !== 'General Medicine' ? department : (suggested || department);
    // PDF: token number issued at booking
    const token = nextToken();
    setLastToken({ token, ...appointmentForm, department: dept, date, timeSlot });
    addTimelineEvent('Appointment booked', `${dept} · ${date} ${timeSlot} · Token ${token}`, 'appointment');
    // Note: no .select() here — under Row Level Security, INSERT ... RETURNING
    // requires a SELECT policy on the table, which we intentionally don't grant
    // (reads stay locked). A plain insert only needs the INSERT policy.
    const { error } = await supabase
      .from('appointments')
      .insert({
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        department: dept,
        doctor: doctor.trim() || 'Any available',
        appointment_date: date,
        time_slot: timeSlot,
        reason: reason.trim(),
        language,
        token
      });
    if (error && error.code === 'PGRST204' && (error.message || '').includes('token')) {
      // Column not added yet in Supabase — save without token rather than fail
      const { error: retryErr } = await supabase
        .from('appointments')
        .insert({
          name: name.trim(),
          phone: phone.replace(/\D/g, ''),
          department: dept,
          doctor: doctor.trim() || 'Any available',
          appointment_date: date,
          time_slot: timeSlot,
          reason: reason.trim(),
          language
        });
      if (retryErr) {
        setBookingError(retryErr.message || 'Could not save your appointment.');
        setBookingStatus('error');
        return;
      }
      setBookingStatus('success');
      return;
    }

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (error.code === 'PGRST205' || msg.includes('could not find the table')) {
        setBookingError('The appointments table is not set up in your Supabase project yet. Open the Supabase Dashboard → SQL Editor, run the script from supabase/schema.sql, then try again.');
      } else if (msg.includes('row-level security') || msg.includes('permission denied') || msg.includes('violates row-level')) {
        setBookingError('Saving was blocked by the database. Make sure the insert policy from supabase/schema.sql has been enabled.');
      } else {
        setBookingError(error.message || 'Could not save your appointment. Please check your connection and try again.');
      }
      setBookingStatus('error');
    } else {
      setBookingStatus('success');
    }
  };

  // Load today's medicine schedule (PDF: medicine times in patient dashboard)
  useEffect(() => {
    if (currentScreen !== 'dashboard') return;
    try {
      const raw = localStorage.getItem('mk_medicines');
      setMedicines(raw ? JSON.parse(raw) : [
        { name: 'Amla Juice', dose: '20 ml', times: ['07:00 AM', '07:00 PM'] },
        { name: 'Triphala Churna', dose: '1 tsp', times: ['09:00 PM'] }
      ]);
    } catch { setMedicines([]); }
  }, [currentScreen]);

  const renderChakra = () => (
    <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 opacity-5 pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#001f7f" strokeWidth="2">
        <circle cx="100" cy="100" r="90"/>
        <circle cx="100" cy="100" r="70"/>
        <circle cx="100" cy="100" r="50"/>
        <circle cx="100" cy="100" r="30"/>
      </g>
      <circle cx="100" cy="100" r="12" fill="#001f7f"/>
      <g stroke="#001f7f" strokeWidth="2" strokeLinecap="round">
        <line x1="100" y1="10" x2="100" y2="30"/>
        <line x1="100" y1="170" x2="100" y2="190"/>
        <line x1="10" y1="100" x2="30" y2="100"/>
        <line x1="170" y1="100" x2="190" y2="100"/>
        <line x1="29.3" y1="29.3" x2="44.6" y2="44.6"/>
        <line x1="155.4" y1="155.4" x2="170.7" y2="170.7"/>
        <line x1="170.7" y1="29.3" x2="155.4" y2="44.6"/>
        <line x1="44.6" y1="155.4" x2="29.3" y2="170.7"/>
      </g>
      <g fill="#001f7f">
        <circle cx="100" cy="15" r="5"/>
        <circle cx="100" cy="185" r="5"/>
        <circle cx="15" cy="100" r="5"/>
        <circle cx="185" cy="100" r="5"/>
        <circle cx="41" cy="41" r="5"/>
        <circle cx="159" cy="159" r="5"/>
        <circle cx="159" cy="41" r="5"/>
        <circle cx="41" cy="159" r="5"/>
      </g>
    </svg>
  );

  const renderTricolor = () => (
    <div className="h-2 bg-gradient-to-r from-orange-400 via-white to-green-700"></div>
  );

  const renderThemeToggle = () => (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="absolute top-2.5 right-3 z-20 w-9 h-9 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-lg hover:bg-gray-100 transition"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );

  const renderBackButton = (target) => (
    <div className="px-4 pt-2">
      <button
        onClick={() => setCurrentScreen(target)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 hover:bg-gray-100 transition"
        aria-label={t('back')}
      >
        <span className="text-base leading-none">‹</span>
        {t('back')}
      </button>
    </div>
  );

  const renderLanguageSwitcher = () => (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="flex items-center justify-center py-1 border-b border-gray-100">
        <img src="/gov-india.png" alt="Government of India" className="h-9 object-contain" />
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1">
      <img src="/logo.png" alt="MediKiosk.gov.in" className="w-5 h-5 rounded-full shrink-0" />
      <div className="flex flex-nowrap gap-1 justify-end flex-1 overflow-hidden">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => pickLanguage(lang.code, lang.label)}
            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap shrink-0 transition ${
              appLang === lang.code ? 'bg-green-700 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
      </div>
    </div>
  );

  const renderBackground = () => (
    <img src="/chakra.png" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
  );

  // Screen -1: Ministry of Ayush intro splash
  if (currentScreen === 'intro') {
    return (
      <div
        onClick={() => setCurrentScreen('languageSelect')}
        className="min-h-screen relative flex items-center justify-center p-4 cursor-pointer overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2e1065 0%, #7f1d1d 50%, #172554 100%)' }}
      >
        <img src="/redfort.svg" alt="" aria-hidden="true" className="absolute bottom-0 left-0 w-full h-[55%] object-cover opacity-40 pointer-events-none" />
        {renderThemeToggle()}
        <div className="relative z-10 text-center text-white max-w-sm w-full h-screen flex flex-col items-center py-8">
          <img src="/gov-india-white.png" alt="Government of India" className="h-20 object-contain mb-2" />
          <div className="my-auto flex flex-col items-center">
            <img src="/logo.png" alt="MediKiosk.gov.in logo" className="w-36 h-36 rounded-full shadow-2xl mb-3" />
            <h1 className="text-2xl font-bold">MediKiosk</h1>
            <p className="text-sm text-white/85 font-medium">{t('govt_healthcare')}</p>
          </div>
          <div className="flex flex-col items-center">
            <img src="/emblem.png" alt="Emblem of India" className="h-14 mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]" />
            <p className="text-xs text-white/70 animate-pulse">{t('tap_to_continue')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Screen 0: Language Selection
  if (currentScreen === 'languageSelect') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="pt-12 px-6 text-center">
                <img src="/logo.png" alt="MediKiosk.gov.in logo" className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg" />
                <h1 className="text-2xl font-bold text-gray-900 mb-1">MediKiosk.gov.in</h1>
                <p className="text-sm text-gray-700 mb-8">{t('choose_language')}</p>
              </div>

              <div className="px-6 space-y-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => pickLanguage(lang.code, lang.label)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition text-left ${
                      appLang === lang.code
                        ? 'bg-green-700 border-green-700 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-green-700 hover:bg-green-50'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="flex-1">
                      <span className="block text-base font-bold">{lang.label}</span>
                      <span className={`block text-xs ${appLang === lang.code ? 'text-green-100' : 'text-gray-600'}`}>{lang.sub}</span>
                    </span>
                    {appLang === lang.code && <span className="text-lg font-bold">✓</span>}
                  </button>
                ))}
              </div>

              <div className="px-6 pt-6 pb-8">
                <button
                  onClick={() => setCurrentScreen('phoneLogin')}
                  className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition"
                >
                  {t('continue')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 1: Phone Login
  if (currentScreen === 'phoneLogin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('languageSelect')}
          <div className="relative h-screen flex flex-col">
            {renderChakra()}
            <div className="relative z-10 flex flex-col items-center justify-center pt-8 px-6">
              <img src="/logo.png" alt="MediKiosk.gov.in logo" className="w-28 h-28 rounded-full mb-4 shadow-lg" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">MediKiosk.gov.in</h1>
              <p className="text-sm text-gray-700 mb-12">{t('govt_healthcare')}</p>

              <div className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">{t('full_name')}</label>
                  <input
                    type="text"
                    placeholder={t('patient_name')}
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">{t('age')}</label>
                    <input
                      type="tel"
                      placeholder="18"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">{t('city')}</label>
                    <input
                      type="text"
                      placeholder="Mumbai"
                      value={patientCity}
                      onChange={(e) => setPatientCity(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">{t('mobile_number')}</label>
                  <input
                    type="tel"
                    placeholder={t('ph_10digit')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={handlePhoneSubmit}
                  className="w-full bg-green-700 text-white py-2.5 rounded-lg font-semibold hover:bg-green-800 transition"
                >
                  {t('send_otp')}
                </button>
                <div className="relative my-4">
                  <div className="border-t border-gray-300"></div>
                  <p className="text-xs text-gray-600 text-center mt-3 mb-3">{t('or_login_govt')}</p>
                </div>
                <button
                  onClick={() => setCurrentScreen('govtIDLogin')}
                  className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  {t('govt_medical_id')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Govt ID Login
  if (currentScreen === 'govtIDLogin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('phoneLogin')}
          <div className="relative h-screen flex flex-col">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">2. {t('govt_id_login')}</p>
              </div>
              <div className="pt-12 px-6 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">📋</div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">{t('government_login')}</h1>
                <p className="text-sm text-gray-700 mb-8">{t('abdm')}</p>
              </div>

              <div className="px-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">{t('id_type')}</label>
                  <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                    <option>{t('aadhaar')}</option>
                    <option>{t('health_id')}</option>
                    <option>{t('abha')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">{t('id_number')}</label>
                  <input type="text" placeholder={t('enter_your_id')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
                <button
                  onClick={() => setCurrentScreen('voicePreference')}
                  className="w-full bg-green-700 text-white py-2.5 rounded-lg font-semibold hover:bg-green-800 transition mt-6 mb-4"
                >
                  {t('continue')}
                </button>
                <button
                  onClick={() => setCurrentScreen('phoneLogin')}
                  className="w-full text-xs text-gray-500 pb-4 font-semibold hover:text-green-700 transition"
                >
                  ← {t('back')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Voice Preference
  if (currentScreen === 'voicePreference') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('govtIDLogin')}
          <div className="relative h-screen flex flex-col">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">3. {t('voice_preference')}</p>
              </div>
              <div className="pt-8 px-6 text-center">
                <h1 className="text-lg font-bold text-gray-900">{t('how_use')}</h1>
              </div>

              <div className="px-6 pt-8 space-y-4">
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-2">🎙️</p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('voice_assistant')}</h3>
                  <p className="text-xs text-gray-700 mb-4">{t('talk_to_ai')}</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => pickLanguage(lang.code, lang.label)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                          selectedLanguage === lang.label
                            ? 'bg-green-700 text-white'
                            : 'bg-white text-gray-800 border border-gray-300'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleVoiceChoice('voice')}
                    className="w-full bg-green-700 text-white py-2 rounded-lg font-semibold hover:bg-green-800 transition text-sm"
                  >
                    {t('use_voice_mode')}
                  </button>
                </div>

                <div className="text-center text-gray-500 text-xs font-medium">{t('or_word')}</div>

                <button
                  onClick={() => handleVoiceChoice('text')}
                  className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  {t('text_only_mode')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 4: Main Dashboard
  if (currentScreen === 'dashboard') {
    const dashItems = [
      { icon: '📄', labelKey: 'scan_document', action: 'documentScan' },
      { icon: '🎤', labelKey: 'voice_help', action: 'voice' },
      { icon: '📹', labelKey: 'live_report', action: 'camera' },
      { icon: '💭', labelKey: 'symptoms', action: 'bodyScan' },
      { icon: '📅', labelKey: 'appointments', action: 'appointments' },
      { icon: '📋', labelKey: 'my_records', action: 'records' },
      { icon: '🕐', labelKey: 'medical_timeline', action: 'timeline' },
      { icon: '📚', labelKey: 'ayush_kb', action: 'ayushKB' },
      { icon: '📜', labelKey: 'prescription', action: 'prescription' },
      { icon: '🔐', labelKey: 'consent_manage', action: 'consentManage' }
    ];

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('voicePreference')}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 uppercase">4. {t('main_dashboard')}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-red-600 border border-red-300 bg-white rounded-lg px-3 py-1.5 hover:bg-red-50 transition"
                >
                  ⎋ {t('logout')}
                </button>
              </div>

              <div className="px-6 pt-4">
                <h2 className="text-xl font-bold text-gray-900">{t('welcome_back')}</h2>
                <p className="text-sm text-gray-700 font-medium">{patientName || 'Rajesh Kumar'}</p>
                {patientAge || patientCity ? (
                  <p className="text-xs text-gray-500 mb-6">
                    {patientAge ? `${patientAge} yrs` : ''}{patientAge && patientCity ? ' · ' : ''}{patientCity || ''}
                  </p>
                ) : (
                  <div className="mb-6"></div>
                )}

                <button className="w-full bg-red-600 text-white py-4 rounded-lg font-bold hover:bg-red-700 transition mb-4 text-lg">
                  {t('sos_emergency')}
                </button>

                {(() => {
                  const alerts = getAlerts();
                  const latest = alerts[alerts.length - 1];
                  return latest ? (
                    <div className="bg-red-50 border border-red-400 rounded-lg p-3 mb-4 flex items-start gap-2">
                      <span className="text-xl">🚩</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-700">{t('clinical_alerts')}</p>
                        <p className="text-xs text-red-700">{latest.labels.join(' · ')}</p>
                        <button onClick={() => setCurrentScreen('timeline')} className="text-xs font-bold text-red-700 underline mt-1">{t('view_timeline')} →</button>
                      </div>
                    </div>
                  ) : null;
                })()}

                {lastToken && (
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-blue-700">🎫 {t('my_appointment')}</p>
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{lastToken.token}</span>
                    </div>
                    <p className="text-sm text-gray-900 font-semibold">{lastToken.department}</p>
                    <p className="text-xs text-gray-700">👨‍⚕️ {lastToken.doctor || 'Any available'}</p>
                    <p className="text-xs text-gray-700">📅 {lastToken.date} · {lastToken.timeSlot}</p>
                    <p className="text-xs text-gray-700">📍 {t('opd_place')}</p>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-xs font-bold text-green-700 mb-2">💊 {t('medicine_times')}</p>
                  {medicines.length ? medicines.map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-green-100 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{m.name} · {m.dose}</p>
                        <p className="text-[10px] text-gray-600">{m.times.join(' · ')}</p>
                      </div>
                      <span className="text-[10px] font-bold text-green-700 bg-white border border-green-300 rounded-full px-2 py-0.5">{t('today')}</span>
                    </div>
                  )) : <p className="text-xs text-gray-600">{t('no_medicines')}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3 pb-6">
                  {dashItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (item.action === 'documentScan') setCurrentScreen('documentScan');
                        else if (item.action === 'records') setCurrentScreen('records');
                        else if (item.action === 'voice') setCurrentScreen('voiceAssistant');
                        else if (item.action === 'bodyScan') setCurrentScreen('bodyScan');
                        else if (item.action === 'camera') setCurrentScreen('camera');
                        else if (item.action === 'appointments') setCurrentScreen('appointments');
                        else if (item.action === 'timeline') setCurrentScreen('timeline');
                        else if (item.action === 'ayushKB') setCurrentScreen('ayushKB');
                        else if (item.action === 'prescription') setCurrentScreen('prescription');
                        else if (item.action === 'consentManage') setCurrentScreen('consentManage');
                      }}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center hover:border-green-700 hover:bg-green-50 transition"
                    >
                      <p className="text-2xl mb-2">{item.icon}</p>
                      <p className="text-xs font-semibold text-gray-900">{t(item.labelKey)}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen: Book Appointment
  if (currentScreen === 'appointments') {
    const updateField = (key) => (e) => setAppointmentForm({ ...appointmentForm, [key]: e.target.value });

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-800 font-bold hover:bg-gray-100 transition"
                  aria-label={t('back')}
                >
                  ‹
                </button>
                <p className="text-xs font-semibold text-gray-600 uppercase">{t('book_appointment')}</p>
                <span className="w-8"></span>
              </div>

              <div className="px-6 pt-4 pb-8">
                {bookingStatus === 'success' ? (
                  <div className="text-center pt-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{t('appointment_booked')}</h2>
                    <p className="text-xs text-gray-700 mb-6 font-medium">{t('saved_in_system')}</p>

                    <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-left mb-6 space-y-2">
                      {lastToken && (
                        <div className="flex items-center justify-between border-b border-green-200 pb-2 mb-2">
                          <p className="text-xs font-bold text-green-700">{t('your_token')}</p>
                          <span className="bg-green-700 text-white text-sm font-bold px-3 py-1 rounded-lg">{lastToken.token}</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-900"><span className="font-bold text-green-700">{t('patient')}</span> {appointmentForm.name}</p>
                      <p className="text-sm text-gray-900"><span className="font-bold text-green-700">{t('department')}</span> {lastToken?.department || appointmentForm.department}</p>
                      <p className="text-sm text-gray-900"><span className="font-bold text-green-700">{t('date')}</span> {appointmentForm.date} · {appointmentForm.timeSlot}</p>
                    </div>

                    <button
                      onClick={() => {
                        setAppointmentForm({ name: '', phone: '', department: 'General Medicine', doctor: '', date: '', timeSlot: '9:00 AM - 10:00 AM', reason: '', language: 'English' });
                        setBookingStatus('idle');
                        setBookingError('');
                      }}
                      className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition mb-2"
                    >
                      {t('book_another')}
                    </button>
                    <button
                      onClick={() => setCurrentScreen('dashboard')}
                      className="w-full bg-green-700 text-white py-2.5 rounded-lg font-semibold hover:bg-green-800 transition"
                    >
                      {t('back_to_dashboard')}
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{t('book_an_appointment')}</h2>
                    <p className="text-sm text-gray-700 mb-4 font-medium">{t('fill_details')}</p>

                    {bookingStatus === 'error' && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
                        <p className="text-xs font-semibold text-red-700">{bookingError}</p>
                      </div>
                    )}

                    {(() => {
                      const sug = suggestDepartment(appointmentForm.reason || '');
                      return sug && appointmentForm.department === 'General Medicine' ? (
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
                          <p className="text-xs text-yellow-800"><span className="font-bold">💡 {t('suggested_dept')}</span> {sug}</p>
                          <button
                            onClick={() => setAppointmentForm({ ...appointmentForm, department: sug })}
                            className="text-xs font-bold text-yellow-800 underline mt-1"
                          >{t('use_this')}</button>
                        </div>
                      ) : null;
                    })()}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">{t('full_name')}</label>
                        <input type="text" placeholder={t('patient_name')} value={appointmentForm.name} onChange={updateField('name')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">{t('phone_number')}</label>
                        <input type="tel" placeholder={t('ph_10digit')} value={appointmentForm.phone} onChange={(e) => setAppointmentForm({ ...appointmentForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">{t('department')}</label>
                        <select value={appointmentForm.department} onChange={updateField('department')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                          {['General Medicine', 'Ayurveda', 'Yoga & Naturopathy', 'Unani', 'Siddha', 'Homeopathy'].map((d) => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">{t('doctor_optional')}</label>
                        <input type="text" placeholder="Any available" value={appointmentForm.doctor} onChange={updateField('doctor')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-1">{t('date')}</label>
                          <input type="date" value={appointmentForm.date} min={new Date().toISOString().split('T')[0]} onChange={updateField('date')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-1">{t('time_slot')}</label>
                          <select value={appointmentForm.timeSlot} onChange={updateField('timeSlot')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                            {['9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 1:00 PM', '2:00 PM - 3:00 PM', '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM'].map((tm) => <option key={tm}>{tm}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">{t('reason_symptoms')}</label>
                        <textarea rows="2" placeholder={t('describe_problem')} value={appointmentForm.reason} onChange={updateField('reason')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">{t('preferred_language')}</label>
                        <select value={appointmentForm.language} onChange={updateField('language')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                          {['English', 'हिंदी', 'ಕನ್ನಡ', 'தமிழ்', 'मराठी', 'বাংলা', 'اردو'].map((l) => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleBookAppointment}
                      disabled={bookingStatus === 'saving'}
                      className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mt-5 mb-2 disabled:opacity-60"
                    >
                      {bookingStatus === 'saving' ? t('saving') : t('confirm_booking')}
                    </button>
                    <button
                      onClick={() => setCurrentScreen('dashboard')}
                      className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition"
                    >
                      {t('back')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen: Voice Assistant
  if (currentScreen === 'voiceAssistant') {
    return (
      <VoiceAssistant
        selectedLanguage={selectedLanguage}
        questions={ayushQuestions}
        onBack={() => setCurrentScreen('dashboard')}
      />
    );
  }

  // Screen 5: Document Scan
  if (currentScreen === 'documentScan') {
    const fieldRows = scanData ? [
      [t('name'), scanData.patient_name],
      [t('scan_doc_type'), scanData.doc_type],
      ['Hospital', scanData.hospital],
      ['Doctor', scanData.doctor],
      ['Date', scanData.date],
      ['Diagnosis', scanData.diagnosis]
    ] : [];

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('dashboard')}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">5. {t('scan_medical_doc')}</p>
              </div>

              <div className="px-6 pt-4 pb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{t('scan_medical_doc')}</h2>
                <p className="text-sm text-gray-700 mb-4 font-medium">{t('upload_prescription')}</p>

                {scanError && (
                  <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-red-700">{t('scan_error_prefix')}: {scanError}</p>
                  </div>
                )}

                {scanStage === 'idle' && (
                  <>
                    <div className="bg-blue-50 border-2 border-dashed border-green-700 rounded-lg p-8 text-center mb-4">
                      <p className="text-4xl mb-2">📸</p>
                      <p className="text-sm font-bold text-gray-900 mb-1">{t('tap_to_capture')}</p>
                      <p className="text-xs text-gray-700">{t('or_upload')}</p>
                    </div>
                    <button onClick={openScanCamera} className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-3">
                      {t('scan_open_camera')}
                    </button>
                    <label className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition text-center block cursor-pointer">
                      {t('scan_upload')}
                      <input type="file" accept="image/*" capture="environment" onChange={handleScanFile} className="hidden" />
                    </label>
                  </>
                )}

                {scanStage === 'camera' && (
                  <>
                    <div className="bg-black rounded-lg overflow-hidden mb-2 relative">
                      <video ref={videoRef} playsInline muted className="w-full aspect-[3/4] object-cover" />
                      <div className="absolute inset-6 border-2 border-white/70 rounded-lg pointer-events-none"></div>
                    </div>
                    <p className="text-xs text-gray-700 text-center mb-3 font-medium">{t('scan_hint')}</p>
                    <button onClick={captureScan} className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-3">
                      {t('scan_capture')}
                    </button>
                    <button onClick={resetScan} className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition">
                      {t('back')}
                    </button>
                  </>
                )}

                {scanStage === 'processing' && (
                  <div className="py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-700 border-t-transparent mb-4"></div>
                    <p className="text-sm font-semibold text-gray-900">{t('scan_processing')}</p>
                  </div>
                )}

                {scanStage === 'review' && scanData && (
                  <>
                    {scanImage && (
                      <img src={scanImage} alt="Scanned document" className="w-full rounded-lg border border-gray-300 mb-4 max-h-40 object-cover object-top" />
                    )}
                    {fieldRows.some(([, v]) => v) ? (
                      <div className="space-y-2 mb-4">
                        {fieldRows.map(([label, value], i) => value ? (
                          <div key={i} className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 flex justify-between gap-3">
                            <span className="text-xs font-semibold text-gray-600">{label}</span>
                            <span className="text-xs font-bold text-gray-900 text-right">{String(value)}</span>
                          </div>
                        ) : null)}
                        {(scanData.medicines || []).length > 0 && (
                          <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-green-700 mb-2">{t('scan_medicines')}</p>
                            {scanData.medicines.map((med, i) => (
                              <p key={i} className="text-xs text-gray-900 font-medium">
                                • {med.name}{med.dose ? ` — ${med.dose}` : ''}{med.frequency ? `, ${med.frequency}` : ''}{med.duration ? `, ${med.duration}` : ''}
                              </p>
                            ))}
                          </div>
                        )}
                        {(scanData.lab_values || []).length > 0 && (
                          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-blue-700 mb-2">{t('scan_lab_values')}</p>
                            {scanData.lab_values.map((lv, i) => (
                              <p key={i} className="text-xs text-gray-900 font-medium">
                                • {lv.test}: {lv.value}{lv.unit ? ` ${lv.unit}` : ''}{lv.flag ? ` (${lv.flag})` : ''}
                              </p>
                            ))}
                          </div>
                        )}
                        {scanData.notes && (
                          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Notes</p>
                            <p className="text-xs text-gray-900">{scanData.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                        <p className="text-xs font-semibold text-yellow-700">{t('scan_no_details')}</p>
                      </div>
                    )}
                    <button onClick={saveScannedRecord} disabled={scanSaving} className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-3 disabled:opacity-60">
                      {scanSaving ? '...' : t('scan_save')}
                    </button>
                    <button onClick={resetScan} className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition">
                      {t('scan_rescan')}
                    </button>
                  </>
                )}

                {scanStage === 'saved' && (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-green-100 border border-green-300 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
                    <p className="text-sm font-bold text-gray-900 mb-6">{t('scan_saved')}</p>
                    <button onClick={() => { resetScan(); setCurrentScreen('records'); }} className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-3">
                      {t('scan_done')}
                    </button>
                    <button onClick={resetScan} className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition">
                      {t('scan_rescan')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 5b: My Records — scanned documents saved on this kiosk
  if (currentScreen === 'records') {
    let records = [];
    try { records = JSON.parse(localStorage.getItem('mk_medical_records') || '[]'); } catch {}
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('dashboard')}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">{t('records_title')}</p>
              </div>
              <div className="px-6 pt-4 pb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('records_title')}</h2>
                {records.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center mb-4">
                    <p className="text-xs text-gray-700 font-medium">{t('records_empty')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {records.map((r, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-gray-900 uppercase">{r.doc_type || 'record'}</p>
                          <p className="text-[10px] text-gray-600">{(r.created_at || '').slice(0, 10)}</p>
                        </div>
                        {r.diagnosis && <p className="text-xs text-gray-900 font-medium mb-1">{r.diagnosis}</p>}
                        {r.doctor && <p className="text-xs text-gray-700">{formatDoctor(r.doctor)}</p>}
                        {r.hospital && <p className="text-xs text-gray-700">{r.hospital}</p>}
                        {(r.medicines || []).length > 0 && (
                          <p className="text-xs text-green-700 font-semibold mt-1">{r.medicines.length} {t('scan_medicines')}</p>
                        )}
                        {r.synced === false && (
                          <p className="text-[10px] text-yellow-700 font-semibold mt-1">Saved on device only</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setCurrentScreen('documentScan')} className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition">
                  + {t('scan_open_camera')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 6: Body Scan
  if (currentScreen === 'bodyScan') {
    const bodyParts = ['part_head', 'part_chest', 'part_stomach', 'part_joints', 'part_arms', 'part_legs'];
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('dashboard')}
          <div className="relative h-screen flex flex-col">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">6. {t('symptom_checker')}</p>
              </div>

              <div className="px-6 pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('where_hurt')}</h2>

                <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center mb-4">
                  <p className="text-6xl mb-2">🧍</p>
                  <p className="text-xs text-gray-700 font-medium">{t('click_body_parts')}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {bodyParts.map((part) => (
                    <button
                      key={part}
                      className="bg-gray-50 border border-gray-300 rounded-lg py-3 text-sm font-semibold text-gray-900 hover:border-green-700 hover:bg-green-50 transition"
                    >
                      {t(part)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  {t('back')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 7: Camera / Live Reporting
  if (currentScreen === 'camera') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('dashboard')}
          <div className="relative h-screen flex flex-col">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">{t('live_reporting')}</p>
              </div>

              <div className="px-6 pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{t('capture_photo')}</h2>
                <p className="text-sm text-gray-700 mb-4 font-medium">{t('position_face')}</p>

                <div className="bg-black rounded-lg p-4 mb-4 aspect-video flex items-center justify-center">
                  <p className="text-4xl">📷</p>
                </div>

                <button
                  onClick={() => setCurrentQuestion(0) || setCurrentScreen('ayushAssessment')}
                  className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-2"
                >
                  {t('start_camera')}
                </button>
                <button
                  onClick={() => setCurrentScreen('ayushAssessment')}
                  className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  {t('continue_to_assessment')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 8: AYUSH Assessment Questions
  if (currentScreen === 'ayushAssessment') {
    const q = ayushQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / ayushQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('camera')}
          <div className="relative h-screen flex flex-col">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">{t('ayush_assessment')} - Q{currentQuestion + 1}</p>
              </div>

              <div className="px-6 pt-4">
                <div className="h-1 bg-gray-300 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-green-700" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{q.category} {q.title}</h3>
                  <p className="text-xs text-gray-700 font-medium">{q.question}</p>
                </div>

                <div className="space-y-2 mb-4">
                  {q.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs font-medium text-gray-900 hover:border-green-700 hover:bg-green-50 transition text-left"
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-full bg-gray-300 text-gray-800 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-400 transition"
                >
                  {t('skip_for_now')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 9: Assessment Summary
  if (currentScreen === 'summary') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('dashboard')}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">{t('assessment_summary')}</p>
              </div>

              <div className="px-6 pt-6">
                <h2 className="text-lg font-bold text-gray-900 text-center mb-6">{t('your_ayush_profile')}</h2>

                <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-3">
                  <p className="text-xs font-bold text-green-700 mb-1">🌿 Prakriti (Constitution)</p>
                  <p className="text-sm text-gray-900 font-medium">{answers.prakriti || t('not_answered')}</p>
                </div>

                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mb-3">
                  <p className="text-xs font-bold text-orange-600 mb-1">⚡ Vikriti (Current Issue)</p>
                  <p className="text-sm text-gray-900 font-medium">{answers.vikriti || t('not_answered')}</p>
                </div>

                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
                  <p className="text-xs font-bold text-blue-700 mb-1">🔥 Agni (Digestion)</p>
                  <p className="text-sm text-gray-900 font-medium">{answers.agni || t('not_answered')}</p>
                </div>

                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-2"
                >
                  {t('view_full_report')}
                </button>
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  {t('share_with_doctor')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== PDF FEATURES =====

  // Screen: ABDM Consent Gate (DPDP Act 2023) — required before dashboard
  if (currentScreen === 'consentGate') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">🔐 {t('abdm_consent_title')}</p>
              </div>
              <div className="px-6 pt-4 pb-8">
                <p className="text-sm font-semibold text-gray-900 mb-3">{t('consent_required')}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-blue-700 mb-1">{t('consent_dpdp')}</p>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{t('consent_body')}</p>
                </div>
                <p className="text-xs font-bold text-gray-800 mb-2">{t('consent_scope_title')}</p>
                <ul className="space-y-1 mb-4">
                  {['Demographics', 'Symptoms & History', 'Documents', 'Appointments', 'Prescriptions'].map((s) => (
                    <li key={s} className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-4 h-4 bg-green-100 border border-green-400 rounded flex items-center justify-center text-green-700 text-[10px]">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-[11px] text-gray-700">🔊 {t('consent_audio_note')}</p>
                  <button
                    onClick={() => {
                      setConsentPlayed(true);
                      try {
                        const u = new SpeechSynthesisUtterance(t('consent_body'));
                        u.lang = appLang === 'hi' ? 'hi-IN' : 'en-IN';
                        u.rate = 0.95;
                        speechSynthesis.cancel();
                        speechSynthesis.speak(u);
                      } catch {}
                    }}
                    className="mt-2 w-full bg-white border border-yellow-400 text-gray-800 py-2 rounded-lg text-xs font-semibold hover:bg-yellow-100 transition"
                  >▶ {t('consent_play_audio')}</button>
                </div>
                <p className="text-[11px] text-gray-600 mb-4">↩️ {t('consent_revocable')}</p>
                <button
                  onClick={() => grantConsent('audio')}
                  disabled={!consentPlayed}
                  className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-2 disabled:opacity-50"
                >
                  ✅ {t('consent_grant_audio')}
                </button>
                <button
                  onClick={() => grantConsent('text')}
                  className="w-full bg-white text-gray-800 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  📝 {t('consent_grant_text')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen: Consent Management (view / revoke history)
  if (currentScreen === 'consentManage') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('dashboard')}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">🔐 {t('consent_manage')}</p>
              </div>
              <div className="px-6 pt-4 pb-8">
                <div className={`rounded-lg p-4 mb-4 ${consentGranted ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}>
                  <p className={`text-sm font-bold ${consentGranted ? 'text-green-700' : 'text-red-700'}`}>
                    {consentGranted ? `✅ ${t('consent_active')}` : `⛔ ${t('consent_inactive')}`}
                  </p>
                  {consentGranted && <p className="text-xs text-gray-700 mt-1">{t('consent_scope_title')}: Demographics, Symptoms, Documents, Appointments, Prescriptions</p>}
                </div>
                {consentGranted ? (
                  <button onClick={revokeConsent} className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition mb-4">
                    ⛔ {t('consent_revoke')}
                  </button>
                ) : (
                  <button onClick={() => setCurrentScreen('consentGate')} className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-4">
                    ✅ {t('consent_grant_text')}
                  </button>
                )}
                <p className="text-xs font-bold text-gray-800 mb-2">📜 {t('consent_history')}</p>
                {consentLog.length === 0 ? (
                  <p className="text-xs text-gray-600">{t('no_medicines') === 'No medicines scheduled' ? '' : ''}{t('not_answered')}</p>
                ) : (
                  <div className="space-y-2">
                    {[...consentLog].reverse().map((c, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-900">
                          {c.method === 'revoke' ? `⛔ ${t('consent_revoke')}` : `✅ ${c.method === 'audio' ? t('consent_grant_audio') : t('consent_grant_text')}`}
                        </p>
                        <p className="text-[10px] text-gray-600">{new Date(c.at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen: Medical Timeline (chronological + abnormal flags)
  if (currentScreen === 'timeline') {
    const events = [...getTimeline()].sort((a, b) => new Date(b.at) - new Date(a.at));
    const reports = getReportHistory();
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('dashboard')}
          <div className="relative h-screen flex flex-col overflow-y-auto" key={timelineVersion}>
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">🕐 {t('medical_timeline')}</p>
              </div>
              <div className="px-6 pt-4 pb-8">
                <p className="text-sm text-gray-700 mb-4 font-medium">{t('timeline_desc')}</p>

                {/* Patient report history — AI-extracted from scanned documents */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-900 uppercase">📄 {t('report_history')}</h3>
                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                      {t('ai_extracted')}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mb-3">{t('report_history_desc')}</p>
                  {reports.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-600">{t('no_reports')}</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-blue-200 ml-2 space-y-3">
                      {reports.map((rp) => {
                        const abnormal = (rp.lab_values || []).filter(isAbnormalValue);
                        return (
                          <div key={rp.id} className="relative pl-5">
                            <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${abnormal.length ? 'bg-red-500 border-red-300' : 'bg-blue-600 border-blue-200'}`}></span>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <p className="text-xs font-bold text-gray-900 uppercase">{rp.doc_type}</p>
                                <p className="text-[10px] font-semibold text-gray-600">
                                  {rp.record_date || new Date(rp.at).toLocaleDateString()}
                                </p>
                              </div>
                              {rp.diagnosis && <p className="text-xs font-semibold text-gray-900 mb-1">{rp.diagnosis}</p>}
                              {(rp.doctor || rp.hospital) && (
                                <p className="text-[11px] text-gray-700 mb-1">
                                  {[formatDoctor(rp.doctor), rp.hospital].filter(Boolean).join(' · ')}
                                </p>
                              )}
                              {(rp.medicines || []).length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded p-2 mt-1">
                                  <p className="text-[10px] font-bold text-green-700 mb-1">{t('scan_medicines')}</p>
                                  {rp.medicines.map((m, i) => (
                                    <p key={i} className="text-[11px] text-gray-900">
                                      • {m.name}{m.dose ? ` — ${m.dose}` : ''}{m.frequency ? `, ${m.frequency}` : ''}{m.duration ? `, ${m.duration}` : ''}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {(rp.lab_values || []).length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-1">
                                  <p className="text-[10px] font-bold text-blue-700 mb-1">{t('scan_lab_values')}</p>
                                  {rp.lab_values.map((v, i) => (
                                    <p key={i} className={`text-[11px] ${isAbnormalValue(v) ? 'text-red-700 font-bold' : 'text-gray-900'}`}>
                                      • {v.test}: {v.value}{v.unit ? ` ${v.unit}` : ''}{v.flag ? ` (${v.flag})` : ''}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {rp.notes && <p className="text-[11px] text-gray-600 mt-1 italic">{rp.notes}</p>}
                              {abnormal.length > 0 && (
                                <p className="text-[10px] font-bold text-red-700 mt-1">
                                  🚩 {abnormal.length} {t('abnormal_short')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <h3 className="text-xs font-bold text-gray-900 uppercase mb-2">🕐 {t('activity_alerts')}</h3>
                {events.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-xs text-gray-600">{t('no_events')}</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-green-200 ml-2 space-y-4">
                    {events.map((ev) => (
                      <div key={ev.id} className="relative pl-5">
                        <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${ev.flag ? 'bg-red-500 border-red-300' : 'bg-green-600 border-green-200'}`}></span>
                        {ev.flag && (
                          <div className="bg-red-50 border border-red-300 rounded-lg p-2 mb-1">
                            <p className="text-[10px] font-bold text-red-700">🚩 {t('red_flag')}</p>
                          </div>
                        )}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-xs font-bold text-gray-900">{ev.title}</p>
                          {ev.detail && <p className="text-[11px] text-gray-700">{ev.detail.replace(/Dr\.\s*Dr\./gi, 'Dr.')}</p>}
                          <p className="text-[10px] text-gray-500">{new Date(ev.at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen: AYUSH Knowledge Base (bilingual EN + HI side by side)
  if (currentScreen === 'ayushKB') {
    const kb = [
      {
        icon: '🌿', title: 'Prakriti & Vikriti',
        en: 'Prakriti is your natural constitution (Vata, Pitta, Kapha). Vikriti is the current imbalance. Treatment aims to restore balance through diet, herbs and routine.',
        hi: 'प्रकृति आपका स्वाभाविक संविधान है (वात, पित्त, कफ)। विकृति वर्तमान असंतुलन है। उपचार का उद्देश्य आहार, जड़ी-बूटियों और दिनचर्या से संतुलन बहाल करना है।'
      },
      {
        icon: '🔥', title: 'Agni (Digestive Fire)',
        en: 'Agni is the digestive fire. Strong agni means good digestion and immunity. Weak agni causes ama (toxins). Eat warm, fresh food at regular times.',
        hi: 'अग्नि पाचन शक्ति है। प्रबल अग्नि से अच्छा पाचन और रोग प्रतिरोधक क्षमता बनती है। कमज़ोर अग्नि से आम (विष) बनता है। गर्म, ताज़ा भोजन नियमित समय पर लें।'
      },
      {
        icon: '🧘', title: 'Dinacharya (Daily Routine)',
        en: 'Wake before sunrise, cleanse, exercise, eat meals at fixed times and sleep by 10 PM. A steady routine prevents most lifestyle diseases.',
        hi: 'सूर्योदय से पहले उठें, शुद्धि करें, व्यायाम करें, नियत समय पर भोजन करें और रात 10 बजे तक सोएं। नियमित दिनचर्या से अधिकांश जीवनशैली रोग रुकते हैं।'
      },
      {
        icon: '🍲', title: 'Ahara (Diet)',
        en: 'Eat according to your prakriti: Vata — warm, moist foods; Pitta — cooling foods; Kapha — light, spicy foods. Avoid ice-cold drinks and processed food.',
        hi: 'अपनी प्रकृति अनुसार भोजन करें: वात — गर्म, नम आहार; पित्त — शीतल आहार; कफ — हल्का, तीक्ष्ण आहार। बर्फीले पेय और प्रोसेस्ड भोजन से बचें।'
      },
      {
        icon: '💆', title: 'Panchakarma',
        en: 'Five purification therapies (Vamana, Virechana, Basti, Nasya, Raktamokshana) done seasonally under supervision to remove deep-seated toxins.',
        hi: 'पंचकर्म — पाँच शुद्धिकरण चिकित्साएँ (वमन, विरेचन, बस्ती, नस्य, रक्तमोक्षण) जो गहरे विषाक्त पदार्थों को निकालने हेतु पर्वकाल में विशेषज्ञ की देखरेख में की जाती हैं।'
      }
    ];
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('dashboard')}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">📚 {t('ayush_kb')}</p>
              </div>
              <div className="px-6 pt-4 pb-8">
                <p className="text-sm text-gray-700 mb-4 font-medium">{t('kb_desc')}</p>
                <div className="space-y-3">
                  {kb.map((k) => (
                    <div key={k.title} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-green-50 px-3 py-2 flex items-center gap-2">
                        <span className="text-lg">{k.icon}</span>
                        <p className="text-xs font-bold text-gray-900">{k.title}</p>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r p-2">
                          <p className="text-[9px] font-bold text-blue-700 mb-0.5">EN</p>
                          <p className="text-[11px] text-gray-800 leading-relaxed">{k.en}</p>
                        </div>
                        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r p-2">
                          <p className="text-[9px] font-bold text-orange-700 mb-0.5">हिं</p>
                          <p className="text-[11px] text-gray-800 leading-relaxed">{k.hi}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen: Prescription & Token (doctor upload → patient views by token)
  if (currentScreen === 'prescription') {
    const lookup = async () => {
      const tok = prescToken.trim().toUpperCase();
      if (!tok) return;
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('token', tok)
          .order('created_at', { ascending: false })
          .limit(1);
        if (!error && data && data.length) {
          const row = data[0];
          setPrescResult({ doctor: row.doctor, department: row.department, date: row.prescription_date, medicines: row.medicines || [], notes: row.notes });
          addTimelineEvent('Prescription viewed', `Token ${tok}`, 'prescription');
          return;
        }
      } catch {}
      // Fallback: locally stored (doctor-upload demo data on this kiosk)
      try {
        const all = JSON.parse(localStorage.getItem('mk_prescriptions') || '{}');
        const hit = all[tok];
        if (hit) {
          setPrescResult(hit);
          addTimelineEvent('Prescription viewed', `Token ${tok}`, 'prescription');
          return;
        }
      } catch {}
      setPrescResult({ notFound: true });
    };
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderThemeToggle()}
          {renderLanguageSwitcher()}
          {renderBackButton('dashboard')}
          <div className="relative h-screen flex flex-col overflow-y-auto">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">📜 {t('prescription')}</p>
              </div>
              <div className="px-6 pt-4 pb-8">
                {lastToken && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-[11px] text-blue-700">🎫 {t('your_token')}: <span className="font-bold">{lastToken.token}</span></p>
                  </div>
                )}
                <label className="block text-sm font-semibold text-gray-800 mb-1">{t('enter_token')}</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={prescToken}
                    onChange={(e) => setPrescToken(e.target.value.toUpperCase())}
                    placeholder="MK-20260916-001"
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <button onClick={() => lookup()} className="bg-green-700 text-white px-4 rounded-lg text-sm font-semibold hover:bg-green-800 transition">🔍</button>
                </div>
                {prescResult && !prescResult.notFound && (
                  <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-3">
                    <p className="text-xs font-bold text-green-700 mb-2">📜 {t('prescription')} — Dr. {prescResult.doctor}</p>
                    <p className="text-[11px] text-gray-700 font-semibold mb-1">{prescResult.department} · {prescResult.date}</p>
                    {prescResult.medicines && prescResult.medicines.length > 0 && (
                      <div className="mt-2 border-t border-green-200 pt-2">
                        <p className="text-[10px] font-bold text-gray-800 mb-1">💊 {t('medicine_times')}</p>
                        {prescResult.medicines.map((m, i) => (
                          <p key={i} className="text-[11px] text-gray-700">• {m.name} {m.dose ? `(${m.dose})` : ''} — {m.times ? m.times.join(', ') : m.timing}</p>
                        ))}
                      </div>
                    )}
                    {prescResult.notes && <p className="text-[11px] text-gray-700 mt-2 border-t border-green-200 pt-2">📝 {prescResult.notes}</p>}
                  </div>
                )}
                {prescResult && prescResult.notFound && (
                  <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-3">
                    <p className="text-xs text-red-700">{t('presc_not_found')}</p>
                  </div>
                )}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-[11px] text-gray-700">ℹ️ {t('presc_hint')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default MediKioskApp;