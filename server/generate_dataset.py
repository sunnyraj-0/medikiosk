"""
MediKiosk voice assistant - starter dataset generator.

Builds the curated intent/response dataset (JSONL + CSV) used to train the
voice assistant's behavior: few-shot examples in the Gemini system prompt and
deterministic routing for safety-critical intents (emergency, stop, repeat).

Usage:  ./venv/bin/python generate_dataset.py
Output: data/medikiosk_voice_assistant_starter_dataset.jsonl / .csv
"""
import csv
import json
import os
import random

random.seed(42)

examples = []


def add(intent, language, utterances, response, next_questions=None, next_action=None):
    for u in utterances:
        item = {
            "instruction": f"Patient says: {u}",
            "intent": intent,
            "response": response,
            "language": language
        }
        if next_questions:
            item["next_questions"] = next_questions
        if next_action:
            item["next_action"] = next_action
        examples.append(item)


# Greetings / general
add("greeting", "en",
    ["Hello MediKiosk", "Hi", "Hello, I need help", "Good morning MediKiosk"],
    "Hello! I'm MediKiosk. I can help record your symptoms, organize medical reports, review your medical history, and guide you to the appropriate next step.",
    ["user_goal"])
add("greeting", "hi",
    ["Namaste", "Hello MediKiosk", "Mujhe help chahiye", "Namaskar"],
    "Namaste! Main MediKiosk hoon. Main aapke symptoms aur medical reports ko organize karne aur next step samajhne mein madad kar sakta hoon.",
    ["user_goal"])
add("greeting", "hinglish",
    ["Hi MediKiosk", "hello bhai help chahiye", "MediKiosk suno", "mujhe medical help chahiye"],
    "Bilkul. Bataiye aapko kis cheez mein help chahiye—symptoms record karne, report dekhne, appointment ya medical history?",
    ["user_goal"])

# Language / voice
add("language_change", "en",
    ["Speak in Hindi", "Change language to Hindi", "I want to use Hindi"],
    "Sure. I'll continue in Hindi.",
    next_action="change_language_hi")
add("language_change", "hi",
    ["English mein baat karo", "Language English kar do", "Mujhe English use karni hai"],
    "Bilkul. Ab main English mein continue karunga.",
    next_action="change_language_en")
add("voice_mode", "en",
    ["I want to use voice", "Can I talk instead of typing", "Turn on voice mode"],
    "Sure. Voice mode is ready. You can speak naturally, and I'll ask one question at a time.",
    next_action="enable_voice")
add("voice_mode", "hi",
    ["Voice se use karna hai", "Mujhe bolkar baat karni hai", "Typing nahi karni, voice chahiye"],
    "Bilkul. Aap voice ke through naturally baat kar sakte hain. Main ek-ek karke questions poochunga.",
    next_action="enable_voice")

# Symptom intake
symptoms = [
    ("headache", ["I have a headache", "My head hurts", "Sir mein dard hai", "sar dukh raha hai", "mere head mein pain hai"]),
    ("fever", ["I have fever", "Mujhe bukhar hai", "fever aa raha hai", "body feels hot and I have fever"]),
    ("cough", ["I have a cough", "Mujhe khansi hai", "khansi ho rahi hai", "I have been coughing"]),
    ("abdominal_pain", ["My stomach hurts", "Mere pet mein dard hai", "pet mein pain ho raha hai", "stomach is hurting"]),
    ("vomiting", ["I am vomiting", "Mujhe ulti ho rahi hai", "vomit aa rahi hai", "I have been throwing up"]),
    ("diarrhea", ["I have loose motions", "Dast ho rahe hain", "pet kharab hai aur loose motions hain", "I have diarrhea"]),
    ("back_pain", ["My back hurts", "Kamar mein dard hai", "back pain ho raha hai", "meri kamar dukh rahi hai"]),
    ("toothache", ["I have tooth pain", "Daant mein dard hai", "toothache ho raha hai", "mere daant mein pain hai"]),
    ("sore_throat", ["My throat hurts", "Gale mein dard hai", "gala dukh raha hai", "I have a sore throat"]),
]
for intent, us in symptoms:
    add("symptom_reporting", "en" if us[0].startswith(("I ", "My ")) else "mixed",
        us,
        "I understand. I'll record that symptom. When did it start, and how severe is it from 0 to 10?",
        ["onset", "severity", "associated_symptoms"])

# More natural symptom utterances
for u in [
    "subah se pet mein dard hai",
    "kal se sir bahut dukh raha hai",
    "teen din se khansi hai",
    "raat se fever hai",
    "right side pet mein pain hai",
    "chest mein discomfort hai",
    "body pain ho raha hai",
    "mujhe weakness feel ho rahi hai",
]:
    add("symptom_reporting", "hinglish", [u],
        "Samajh gaya. Main ise aapki symptom history mein record karta hoon. Ye kab se hai aur 0 se 10 mein kitna severe hai?",
        ["onset", "severity", "associated_symptoms"])

# Clinical follow-up fields
add("symptom_duration", "en",
    ["Since this morning", "For three days", "It started last night", "For about a week"],
    "Thanks. I've recorded the duration. Are the symptoms getting better, worse, or staying the same?",
    ["progression"])
add("symptom_severity", "en",
    ["It is 7 out of 10", "About 5", "Very severe", "Mild pain"],
    "Got it. I've recorded the severity. Are you having any other symptoms along with it?",
    ["associated_symptoms"])
add("symptom_severity", "hi",
    ["7 out of 10 hai", "5 hai", "bahut zyada hai", "thoda sa dard hai"],
    "Theek hai. Severity note kar li hai. Kya iske saath koi aur symptom bhi ho raha hai?",
    ["associated_symptoms"])
add("associated_symptoms", "en",
    ["I also have fever", "There is vomiting too", "I feel dizzy", "No other symptoms"],
    "Thanks. I've recorded that. I'll continue with a few relevant history questions.",
    ["relevant_history"])
add("associated_symptoms", "hinglish",
    ["fever bhi hai", "vomiting bhi ho rahi hai", "chakkar aa rahe hain", "aur kuch nahi ho raha"],
    "Theek hai, maine note kar liya. Ab main kuch relevant history questions poochunga.",
    ["relevant_history"])

# Emergency escalation
emergencies = [
    ("I have severe chest pain and difficulty breathing", "en"),
    ("Mere seene mein bahut dard hai aur saans lene mein dikkat hai", "hi"),
    ("I am unconscious", "en"),
    ("Patient is not responding", "en"),
    ("Mujhe behoshi aa rahi hai aur saans mein problem hai", "hi"),
    ("I am having a seizure right now", "en"),
    ("Mujhe achanak bolne mein dikkat aur ek side weakness ho rahi hai", "hi"),
    ("There is severe bleeding that will not stop", "en"),
]
for u, lang in emergencies:
    add("emergency", lang, [u],
        "This may be an emergency. Please seek immediate medical attention or contact your local emergency service now. Do not wait for an AI assessment.",
        next_action="emergency_escalation")

# Reports
add("report_upload", "en",
    ["I want to upload my blood report", "Upload my medical report", "I have a PDF report", "Can I scan this report?"],
    "Sure. Please upload a clear photo or PDF of the report. I can help extract and organize the information for your medical record.",
    next_action="request_document")
add("report_upload", "hinglish",
    ["meri report upload karo", "blood test ki report hai", "report scan karni hai", "PDF report hai meri"],
    "Bilkul. Report ka clear photo ya PDF upload kijiye. Main uski information aapke medical record mein organize karne mein help karunga.",
    next_action="request_document")
add("report_summary", "en",
    ["Explain my blood report", "Summarize my report", "What does this report say?"],
    "I can summarize the values shown in your report and flag items that may need discussion with a clinician. I won't replace a doctor's diagnosis.",
    ["select_report", "clinical_context"])
add("report_summary", "hi",
    ["Meri blood report samjhao", "Report mein kya likha hai", "Meri report ka summary do"],
    "Main report mein diye gaye values ko simple language mein summarize kar sakta hoon aur doctor se discuss karne layak points bata sakta hoon. Ye doctor ki diagnosis ka replacement nahi hai.",
    ["select_report", "clinical_context"])

# Medical history
add("medical_history", "en",
    ["Show my medical history", "What is in my medical record?", "Open my history"],
    "Sure. I can show the information stored in your MediKiosk medical record.",
    next_action="show_medical_history")
add("medical_history", "hinglish",
    ["meri medical history dikhao", "mera medical record kholo", "meri purani history kya hai"],
    "Bilkul. Main aapke MediKiosk medical record mein stored information dikha sakta hoon.",
    next_action="show_medical_history")

# Medications
add("medication_history", "en",
    ["What medicines am I taking?", "Show my current medicines", "Which medications are in my record?"],
    "I can check the medications recorded in your MediKiosk history. The record may not include medicines prescribed outside the system.",
    next_action="retrieve_medications")
add("medication_history", "hi",
    ["Meri medicines kya hain?", "Kaunsi dawa chal rahi hai?", "Meri current medicines dikhao"],
    "Main MediKiosk mein recorded medicines check kar sakta hoon. Bahar prescribe ki gayi medicines record mein zaroori nahi ki available hon.",
    next_action="retrieve_medications")

# Appointment
add("doctor_appointment", "en",
    ["I want to see a doctor", "Book a doctor appointment", "I need an appointment"],
    "Sure. I can help you start an appointment request. Which department or type of doctor do you need?",
    ["department", "preferred_date", "preferred_time"])
add("doctor_appointment", "hi",
    ["Mujhe doctor se milna hai", "Doctor ki appointment book karni hai", "Mujhe appointment chahiye"],
    "Bilkul. Main appointment request start karne mein help karunga. Aapko kis department ya kis type ke doctor ki zarurat hai?",
    ["department", "preferred_date", "preferred_time"])

# Department
add("department_guidance", "en",
    ["Which doctor should I see for a skin problem?", "I have a dental problem, which department?", "Where should I go for stomach issues?"],
    "I can help identify the relevant department based on the information you provide. A clinician should make the final diagnosis and treatment decision.",
    ["symptom_details"])
add("department_guidance", "hi",
    ["Skin problem ke liye kis doctor ke paas jaun?", "Daant ke liye kaunsa department hai?", "Pet ki problem ke liye kahan jaun?"],
    "Aapke symptoms ke basis par main relevant department identify karne mein help kar sakta hoon. Final diagnosis aur treatment decision clinician karega.",
    ["symptom_details"])

# ABHA / identity
add("medical_id", "en",
    ["What is my ABHA number?", "Show my medical ID", "I want to verify my ABHA"],
    "I can help you access or verify the medical ID information stored in your profile. I'll first ask you to confirm the required identity details.",
    next_action="verify_identity")
add("medical_id", "hi",
    ["Mera ABHA number kya hai?", "Meri medical ID dikhao", "ABHA verify karna hai"],
    "Main aapki profile mein stored medical ID information access ya verify karne mein help kar sakta hoon. Pehle required identity details confirm karni hongi.",
    next_action="verify_identity")

# Profile
add("profile_update", "en",
    ["Change my phone number", "Update my address", "I need to edit my profile"],
    "Sure. I can start a profile update. I'll ask you to verify your identity before changing personal information.",
    next_action="verify_identity")
add("profile_update", "hi",
    ["Mera phone number change karo", "Profile update karni hai", "Meri details edit karni hain"],
    "Bilkul. Personal information change karne se pehle main aapki identity verify karunga.",
    next_action="verify_identity")

# Consent / privacy
add("consent", "en",
    ["What am I consenting to?", "Explain the consent", "Do I have to give consent?"],
    "Before processing health information, MediKiosk should clearly explain what information will be collected, why it is needed, and how it will be used. You should be able to make an informed choice.",
    next_action="show_consent")
add("consent", "hi",
    ["Consent kya hai?", "Mujhe consent samjhao", "Meri information kaise use hogi?"],
    "Consent ka matlab hai ki aapko clearly bataya jaye ki kaunsi health information collect hogi, kyun chahiye aur kaise use hogi. Informed choice ke baad hi aage badhna chahiye.",
    next_action="show_consent")

# Conversation control
add("repeat", "en",
    ["Repeat that", "Say that again", "I didn't understand"],
    "Of course. I'll repeat that more slowly and simply.",
    next_action="repeat_last_response")
add("repeat", "hi",
    ["Phir se batao", "Dobara bolo", "Mujhe samajh nahi aaya"],
    "Bilkul. Main ise dobara aur simple language mein bata deta hoon.",
    next_action="repeat_last_response")
add("stop", "en",
    ["Stop", "Cancel this", "I don't want to continue"],
    "Okay. I'll stop the current flow. You can start again whenever you're ready.",
    next_action="cancel_current_flow")
add("stop", "hi",
    ["Ruko", "Cancel karo", "Mujhe continue nahi karna"],
    "Theek hai. Main current process rok raha hoon. Jab ready hon tab dobara start kar sakte hain.",
    next_action="cancel_current_flow")

# Data collection / history questions
history_questions = [
    ("allergies", "Do you have any known allergies?", "Kya aapko kisi medicine ya food se allergy hai?"),
    ("past_conditions", "Do you have any existing medical conditions?", "Kya aapko pehle se koi medical condition hai?"),
    ("past_surgery", "Have you had any major surgeries?", "Kya pehle koi major surgery hui hai?"),
    ("family_history", "Is there any important medical history in your family?", "Kya family mein koi important medical history hai?"),
    ("smoking", "Do you currently smoke or use tobacco?", "Kya aap smoking ya tobacco use karte hain?"),
    ("alcohol", "Do you drink alcohol?", "Kya aap alcohol consume karte hain?"),
]
for key, en, hi in history_questions:
    add("history_question", "en", [en], "Thanks. I've recorded your answer and will continue with the relevant history.", [key])
    add("history_question", "hi", [hi], "Dhanyavaad. Maine aapka answer note kar liya hai aur relevant history continue karunga.", [key])

# Fallback / unknown
add("fallback", "en",
    ["I don't know", "I'm not sure", "Can you help me?", "Something is wrong"],
    "That's okay. Please describe what you need help with in your own words, and I'll guide you step by step.",
    ["user_goal"])
add("fallback", "hi",
    ["Mujhe nahi pata", "Samajh nahi aa raha", "Aap help kar sakte ho?", "Kuch problem hai"],
    "Koi baat nahi. Apni problem apne words mein bataiye, main step by step guide karunga.",
    ["user_goal"])

# Expand with safe paraphrases for a few high-value intents.
paraphrase_sets = {
    "symptom_reporting": [
        ("hinglish", [
            "aaj se body off lag rahi hai", "tabiyat subah se kharab hai",
            "mujhe ye problem aaj start hui", "kuch ajeeb sa feel ho raha hai"
        ]),
        ("en", [
            "I don't feel well today", "Something has been bothering me since morning",
            "I have been feeling unwell", "I have a new symptom"
        ])
    ],
    "report_upload": [
        ("hinglish", ["is document ko record mein daal do", "report ki photo leke upload karni hai", "meri prescription scan karni hai"]),
        ("en", ["Please add this document to my record", "I want to scan my prescription", "Can I add a photo of this prescription?"])
    ],
    "doctor_appointment": [
        ("hinglish", ["doctor ka slot chahiye", "clinic mein consultation chahiye", "doctor se consult karna hai"]),
        ("en", ["I need a consultation", "Find me a doctor appointment", "Can I schedule a clinic visit?"])
    ]
}
for intent, groups in paraphrase_sets.items():
    base = next(x for x in examples if x["intent"] == intent)
    for lang, us in groups:
        for u in us:
            item = {
                "instruction": f"Patient says: {u}",
                "intent": intent,
                "response": base["response"],
                "language": lang
            }
            if "next_questions" in base:
                item["next_questions"] = base["next_questions"]
            if "next_action" in base:
                item["next_action"] = base["next_action"]
            examples.append(item)

# ---------------------------------------------------------------------------
# Output (local, repo-relative - not /mnt/data)
# ---------------------------------------------------------------------------
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(out_dir, exist_ok=True)

jsonl_out = os.path.join(out_dir, "medikiosk_voice_assistant_starter_dataset.jsonl")
with open(jsonl_out, "w", encoding="utf-8") as f:
    for item in examples:
        f.write(json.dumps(item, ensure_ascii=False) + "\n")

csv_out = os.path.join(out_dir, "medikiosk_voice_assistant_starter_dataset.csv")
with open(csv_out, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["instruction", "intent", "response", "language", "next_questions", "next_action"])
    writer.writeheader()
    for item in examples:
        row = dict(item)
        if "next_questions" in row:
            row["next_questions"] = json.dumps(row["next_questions"], ensure_ascii=False)
        writer.writerow(row)

print(f"Created {len(examples)} training examples.")
print(jsonl_out)
print(csv_out)
