// Shared clinical-safety utilities: red-flag detection, clinical alerts and
// the chronological medical timeline. Used by App.jsx and VoiceAssistant.jsx.

const ALERTS_KEY = 'mk_alerts';
const TIMELINE_KEY = 'mk_timeline';

// Red-flag symptom patterns (English + Hindi/Hinglish). Severity alone is not
// a red flag; the patterns look for emergency features around the symptom.
const RED_FLAG_PATTERNS = [
  { label: 'Severe chest pain', re: /(chest pain|chest tightness|chest pressure|seene mein (bahut )?(dard|pain)|seene\s*mein\s*dard)/i },
  { label: 'Breathing difficulty', re: /(breathing (difficulty|problem)|trouble breathing|shortness of breath|saans lene mein (dikkat|problem|taklif)|saans (nahi|na) aa)/i },
  { label: 'Unconsciousness / fainting', re: /(unconscious|not responding|behosh|faint|gir (gaya|gayi))/i },
  { label: 'Stroke-like symptoms', re: /(slurred speech|bolne mein dikkat|face drooping|ek side weakness|one side weak|left side weak|right side weak|sudden.*(left|right).*(weak|numb)|(left|right).*(arm|leg|side).*(sudden|suddenly).*(weak|numb)|difficulty speaking|difficulty understanding speech|stroke|paralysis)/i },
  { label: 'Sudden severe headache', re: /((sudden|suddenly|explosive|thunderclap).*(worst\s*)?headache|worst headache.*(sudden|suddenly|minutes?|just now))/i },
  { label: 'Neurologic headache symptoms', re: /(headache.*(confusion|confused|difficulty speaking|slurred speech|vision loss|seizure)|headache.*(sudden|suddenly).*((left|right|one)\s*(arm|leg|side)|face).*(weak|numb|droop)|headache.*((left|right|one)\s*(arm|leg|side)|face).*(sudden|suddenly).*(weak|numb|droop)|headache.*((left|right|one)\s*(arm|leg|side)|face).*(weak|numb|droop))/i },
  { label: 'Headache with fever and stiff neck', re: /(headache.*(fever|bukhar).*(stiff neck|neck stiffness|gardan.*akad|gardan.*stiff))/i },
  { label: 'Headache after head injury', re: /(headache.*(head injury|hit my head|accident|chot))/i },
  { label: 'Uncontrolled bleeding', re: /(bleeding (will not|won'?t|nahi) stop|khoon (nahi )?band (nahi|nahi ho)|severe bleeding)/i },
  { label: 'Seizure', re: /(seizure|fits|daura|convulsion)/i },
  { label: 'Severe allergic reaction', re: /(severe allergic|allergic reaction|anaphyla)/i },
  { label: 'Severe abdominal pain', re: /(severe (stomach|abdominal) pain|bahut (tez )?pet (mein )?dard)/i },
  { label: 'High fever (>=103)', re: /(fever 10[3-9]|bukhar 10[3-9])/i },
  { label: 'Self-harm emergency', re: /(suicid|kill myself|khudkushi)/i }
];

export function detectRedFlags(text) {
  if (!text) return [];
  const flags = [];
  for (const { label, re } of RED_FLAG_PATTERNS) {
    if (re.test(text)) flags.push(label);
  }
  return flags;
}

export const RED_FLAG_RESPONSE =
  'This may be an emergency. Please seek immediate medical attention or contact your local emergency service (108) now. Do not wait for an AI assessment.';

export const POST_RED_FLAG_RESPONSE =
  'For now, the important step is getting medical help. If you are waiting for help, do not drive yourself, stay with someone if possible, and tell them if anything changes.';

export const POST_RED_FLAG_FOLLOWUP_RE =
  /^(that'?s it\??|what (now|next)\??|now what\??|anything else\??|aur kya\??|bas\??)$/i;

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function write(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr.slice(-300))); } catch {}
}

export function getAlerts() { return read(ALERTS_KEY); }

export function addClinicalAlert(labels, source, detail = '', at = null) {
  const list = labels.length ? (Array.isArray(labels) ? labels : [labels]) : [];
  if (!list.length) return null;
  const alert = {
    id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: at || new Date().toISOString(),
    labels: list,
    source,
    detail
  };
  const alerts = read(ALERTS_KEY);
  alerts.push(alert);
  write(ALERTS_KEY, alerts);
  addTimelineEvent(`Red-flag: ${list.join(', ')}`, `Source: ${source}${detail ? ` - ${detail}` : ''}`, 'alert', true, at);
  return alert;
}

export function getTimeline() { return read(TIMELINE_KEY); }

// `at` lets callers date an event by when it clinically happened (e.g. the date
// printed on a scanned report) instead of when it was recorded at the kiosk.
export function addTimelineEvent(title, detail = '', type = 'info', flag = false, at = null) {
  const ev = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: at || new Date().toISOString(),
    recordedAt: new Date().toISOString(),
    type, title, detail, flag
  };
  const tl = read(TIMELINE_KEY);
  tl.push(ev);
  write(TIMELINE_KEY, tl);
  return ev;
}

// ------------------------------------------------------------
// Patient report history - AI-extracted details from scanned
// documents, kept as a dated medical history (newest first).
// ------------------------------------------------------------

const REPORT_HISTORY_KEY = 'mk_report_history';

// A lab value is abnormal unless the model explicitly says normal/empty.
export function isAbnormalValue(v) {
  const f = (v && v.flag ? String(v.flag) : '').toLowerCase().trim();
  if (!f || f === 'normal' || f === 'n' || f === '-') return false;
  return /high|low|abnormal|critical|h$|l$|\u2191|\u2193/.test(f) || f === 'high' || f === 'low';
}

// Avoids "Dr. Dr. X" when the extracted name already carries the title.
export function formatDoctor(name) {
  const n = (name || '').trim();
  if (!n) return '';
  return /^(dr\.?|doctor)\b/i.test(n) ? n : `Dr. ${n}`;
}

export function getReportHistory() {
  const list = read(REPORT_HISTORY_KEY);
  return [...list].sort((a, b) => new Date(b.at) - new Date(a.at));
}

// Turns an AI-extracted document into patient medical history: a dated history
// entry plus timeline events, and clinical alerts for abnormal lab values.
export function addReportHistory(record) {
  const reportDate = (record.record_date || '').trim();
  const dated = /^\d{4}-\d{2}-\d{2}$/.test(reportDate);
  const at = dated ? new Date(`${reportDate}T09:00:00`).toISOString() : new Date().toISOString();
  const abnormal = (record.lab_values || []).filter(isAbnormalValue);

  const entry = {
    id: `rp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at,
    recordedAt: new Date().toISOString(),
    patient_name: record.patient_name || '',
    doc_type: record.doc_type || 'other',
    record_date: dated ? reportDate : '',
    diagnosis: record.diagnosis || '',
    doctor: record.doctor || '',
    hospital: record.hospital || '',
    medicines: record.medicines || [],
    lab_values: record.lab_values || [],
    notes: record.notes || '',
    abnormal_count: abnormal.length,
    extractedBy: 'MediKiosk AI'
  };

  // De-duplicate: re-scanning the same report updates its entry instead of
  // stacking a second copy onto the patient's history.
  const history = read(REPORT_HISTORY_KEY).filter((e) => {
    const sameDate = (e.record_date || '') === entry.record_date;
    const sameDiag = (e.diagnosis || '') === entry.diagnosis;
    const sameType = (e.doc_type || '') === entry.doc_type;
    return !(sameDate && sameType && (sameDiag || !entry.diagnosis));
  });
  history.push(entry);
  write(REPORT_HISTORY_KEY, history);

  const medCount = entry.medicines.length;
  addTimelineEvent(
    `Report: ${entry.doc_type}${entry.diagnosis ? ` - ${entry.diagnosis}` : ''}`,
    [entry.hospital, formatDoctor(entry.doctor), medCount ? `${medCount} medicines` : '',
      entry.patient_name].filter(Boolean).join(' - ') || 'AI-extracted report',
    'report', abnormal.length > 0, at
  );

  if (abnormal.length) {
    addClinicalAlert(
      abnormal.map((v) => `${v.test || 'Value'} ${v.flag || 'abnormal'}`),
      'document-scan',
      abnormal.map((v) => `${v.test}: ${v.value}${v.unit ? ` ${v.unit}` : ''}${v.flag ? ` (${v.flag})` : ''}`).join(' - '),
      at
    );
  }
  return entry;
}

// PDF: department guidance - map free-text symptoms to an AYUSH department.
const DEPT_MAP = [
  { dept: 'Kayachikitsa (Internal Medicine)', re: /(fever|bukhar|infection|weakness|kamzori|general)/i },
  { dept: 'Shalya Tantra (Surgery)', re: /(wound|injury|hernia|stone|surgery|chot)/i },
  { dept: 'Shalakya Tantra (ENT/Eye)', re: /(eye|aankh|ear|kaan|nose|naak|throat|gala|sinus)/i },
  { dept: 'Kaumarabhritya (Pediatrics)', re: /(child|bacche|baby|infant)/i },
  { dept: 'Prasuti Tantra (Gynecology)', re: /(pregnan|garbh|menstrua|period|pcod)/i },
  { dept: 'Ayurveda', re: /(joint|jod|arthritis|gaathi|digestion|pet|pachan|acidity|skin|twacha|ilaaj)/i }
];

export function suggestDepartment(text) {
  if (!text || text.trim().length < 3) return null;
  for (const { dept, re } of DEPT_MAP) {
    if (re.test(text)) return dept;
  }
  return null;
}

export function nextToken() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = (parseInt(localStorage.getItem('mk_token_seq') || '0', 10) + 1);
  localStorage.setItem('mk_token_seq', String(seq));
  return `MK-${ymd}-${String(seq).padStart(3, '0')}`;
}
