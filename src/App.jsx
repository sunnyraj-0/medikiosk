import React, { useState } from 'react';
import { ChevronRight, Plus, X } from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';
import { supabase } from './supabaseClient';

const LANGUAGES = [
  { code: 'hi', label: 'हिंदी', sub: 'Hindi', flag: '🇮🇳' },
  { code: 'en', label: 'English', sub: 'English', flag: '🇬🇧' },
  { code: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', sub: 'Tamil', flag: '🇮🇳' }
];

const LANG_CODE = {
  'हिंदी': 'hi',
  'English': 'en',
  'ಕನ್ನಡ': 'kn',
  'தமிழ்': 'ta'
};

const TRANSLATIONS = {
  en: {
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
    not_answered: 'Not answered'
  },
  hi: {
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
    not_answered: 'उत्तर नहीं दिया गया'
  },
  kn: {
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
    not_answered: 'ಉತ್ತರಿಸಲಾಗಿಲ್ಲ'
  },
  ta: {
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
    not_answered: 'பதிலளிக்கப்படவில்லை'
  }
};

const MediKioskApp = () => {
  const storedLang = typeof window !== 'undefined' ? localStorage.getItem('mk_lang') : null;
  const [currentScreen, setCurrentScreen] = useState('languageSelect');
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
    setCurrentScreen(mode === 'voice' ? 'voiceAssistant' : 'dashboard');
  };

  const handleAnswer = (answer) => {
    setAnswers({
      ...answers,
      [ayushQuestions[currentQuestion].id]: answer
    });
    if (currentQuestion < ayushQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCurrentScreen('summary');
    }
  };

  const pickLanguage = (code, label) => {
    setAppLang(code);
    setSelectedLanguage(label);
    localStorage.setItem('mk_lang', code);
  };

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
    // Note: no .select() here — under Row Level Security, INSERT ... RETURNING
    // requires a SELECT policy on the table, which we intentionally don't grant
    // (reads stay locked). A plain insert only needs the INSERT policy.
    const { error } = await supabase
      .from('appointments')
      .insert({
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        department,
        doctor: doctor.trim() || 'Any available',
        appointment_date: date,
        time_slot: timeSlot,
        reason: reason.trim(),
        language
      });

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

  const renderLanguageSwitcher = () => (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
      <img src="/logo.png" alt="MediKiosk.gov.in" className="w-7 h-7 rounded-full shrink-0" />
      <div className="flex flex-wrap gap-1.5 justify-end flex-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => pickLanguage(lang.code, lang.label)}
            className={`px-2 py-1 text-[11px] font-semibold rounded-full transition ${
              appLang === lang.code ? 'bg-green-700 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBackground = () => (
    <img src="/chakra.png" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
  );

  // Screen 0: Language Selection
  if (currentScreen === 'languageSelect') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
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
          {renderLanguageSwitcher()}
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
          {renderLanguageSwitcher()}
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
          {renderLanguageSwitcher()}
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
                  <div className="grid grid-cols-2 gap-2 mb-3">
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
      { icon: '📋', labelKey: 'my_records', action: 'records' }
    ];

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderLanguageSwitcher()}
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

                <button className="w-full bg-red-600 text-white py-4 rounded-lg font-bold hover:bg-red-700 transition mb-6 text-lg">
                  {t('sos_emergency')}
                </button>

                <div className="grid grid-cols-2 gap-3 pb-6">
                  {dashItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (item.action === 'documentScan') setCurrentScreen('documentScan');
                        else if (item.action === 'voice') setCurrentScreen('voiceAssistant');
                        else if (item.action === 'bodyScan') setCurrentScreen('bodyScan');
                        else if (item.action === 'camera') setCurrentScreen('camera');
                        else if (item.action === 'appointments') setCurrentScreen('appointments');
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
                      <p className="text-sm text-gray-900"><span className="font-bold text-green-700">{t('patient')}</span> {appointmentForm.name}</p>
                      <p className="text-sm text-gray-900"><span className="font-bold text-green-700">{t('department')}</span> {appointmentForm.department}</p>
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
                          {['English', 'हिंदी', 'ಕನ್ನಡ', 'தமிழ்'].map((l) => <option key={l}>{l}</option>)}
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
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderLanguageSwitcher()}
          <div className="relative h-screen flex flex-col">
            {renderChakra()}
            <div className="relative z-10">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">5. {t('scan_medical_doc')}</p>
              </div>

              <div className="px-6 pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{t('scan_medical_doc')}</h2>
                <p className="text-sm text-gray-700 mb-6 font-medium">{t('upload_prescription')}</p>

                <div className="bg-blue-50 border-2 border-dashed border-green-700 rounded-lg p-8 text-center mb-4">
                  <p className="text-4xl mb-2">📸</p>
                  <p className="text-sm font-bold text-gray-900 mb-1">{t('tap_to_capture')}</p>
                  <p className="text-xs text-gray-700">{t('or_upload')}</p>
                </div>

                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition mb-3"
                >
                  {t('open_camera')}
                </button>
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

  // Screen 6: Body Scan
  if (currentScreen === 'bodyScan') {
    const bodyParts = ['part_head', 'part_chest', 'part_stomach', 'part_joints', 'part_arms', 'part_legs'];
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {renderBackground()}
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          {renderTricolor()}
          {renderLanguageSwitcher()}
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
          {renderLanguageSwitcher()}
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
          {renderLanguageSwitcher()}
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
          {renderLanguageSwitcher()}
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
};

export default MediKioskApp;