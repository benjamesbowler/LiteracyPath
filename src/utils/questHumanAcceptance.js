export const QUEST_HUMAN_EVIDENCE_VERSION = 1;
export const QUEST_HUMAN_PROFILES = Object.freeze([
  "child-first-use",
  "child-repeat-play",
  "reward-choice",
  "teacher-report",
  "classroom-audio"
]);

const DIRECT_IDENTIFIER_KEYS = new Set([
  "name",
  "fullname",
  "email",
  "phone",
  "address",
  "studentid",
  "schoolid",
  "dateofbirth",
  "dob"
]);

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function hasFiniteNumber(value) {
  return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
}

function numberBetween(value, minimum, maximum = Number.POSITIVE_INFINITY) {
  return hasFiniteNumber(value) && Number(value) >= minimum && Number(value) <= maximum;
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function average(values) {
  return values.length ? values.reduce((total, value) => total + finite(value), 0) / values.length : 0;
}

function hasDirectIdentifier(value, parentKey = "") {
  if (Array.isArray(value)) return value.some(child => hasDirectIdentifier(child, parentKey));
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return false;
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) return true;
    if (!['observedat', 'evidencehash'].includes(parentKey)
      && /(?:\+?\d[\d ()-]{6,}\d)/.test(text)) return true;
    if (/\b(?:name|student|child|teacher)\s*[:=]\s*[A-Za-z]/i.test(text)) return true;
    // Format checks reject these code values too, but privacy must independently
    // flag name-shaped VALUES so imported evidence is never called anonymous.
    if (parentKey !== "devicemodel" && /^[A-Z]{2,20}-[A-Z]{2,20}$/.test(text)) return true;
    if (parentKey !== "devicemodel" && /^(?:Mr|Mrs|Ms|Miss|Dr)[A-Z][A-Za-z]{1,30}[0-9]*$/.test(text)) return true;
    if (parentKey !== "devicemodel" && /^[A-Z][a-z]{1,20}(?:[ -][A-Z][a-z]{1,20})+$/.test(text)) return true;
    return false;
  }
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
    return DIRECT_IDENTIFIER_KEYS.has(normalizedKey) || hasDirectIdentifier(child, normalizedKey);
  });
}

function idIsAnonymous(value, prefixes) {
  const allowed = Array.isArray(prefixes) ? prefixes : [prefixes];
  const match = /^([A-Z]+)-([0-9]{1,4})$/.exec(String(value || "").trim());
  return Boolean(match && allowed.includes(match[1]));
}

function commonChecks(record) {
  const participantPrefix = record.profileId === "teacher-report"
    ? "ADULT"
    : record.profileId === "classroom-audio" ? "AUDIO" : "CHILD";
  return [
    { id: "schema", pass: record.schemaVersion === QUEST_HUMAN_EVIDENCE_VERSION },
    { id: "profile", pass: QUEST_HUMAN_PROFILES.includes(record.profileId) },
    { id: "session", pass: idIsAnonymous(record.sessionId, "SESSION") },
    { id: "observer", pass: idIsAnonymous(record.observerId, "OBS") },
    { id: "participant", pass: idIsAnonymous(record.participant?.anonymousId, participantPrefix) },
    { id: "consent", pass: record.consentConfirmed === true },
    { id: "date", pass: Number.isFinite(Date.parse(record.observedAt || "")) },
    { id: "setting", pass: idIsAnonymous(record.settingId, "ROOM") },
    { id: "privacy", pass: !hasDirectIdentifier(record) }
  ];
}

function profileChecks(record) {
  const measures = record.measures || {};
  if (["child-first-use", "child-repeat-play"].includes(record.profileId)) {
    const tasksShown = finite(measures.tasksShown);
    return [
      { id: "age", pass: numberBetween(record.participant?.ageYears, 4, 8) },
      { id: "tasks", pass: numberBetween(measures.tasksShown, 4) && numberBetween(measures.tasksIndependent, 0, tasksShown) },
      { id: "prompts", pass: numberBetween(measures.adultPrompts, 0) },
      { id: "enjoyment", pass: numberBetween(measures.enjoymentRating, 1, 5) },
      { id: "frustration", pass: numberBetween(measures.severeFrustrationIncidents, 0) }
    ];
  }
  if (record.profileId === "reward-choice") {
    return [
      { id: "age", pass: numberBetween(record.participant?.ageYears, 4, 8) },
      { id: "choice", pass: typeof measures.independentStoreChoice === "boolean" },
      { id: "gear", pass: typeof measures.cumulativeGearRecognized === "boolean" },
      { id: "relic", pass: typeof measures.relicPurposeExplained === "boolean" },
      { id: "spend", pass: numberBetween(measures.sparksAvailable, 0) && numberBetween(measures.sparksSpent, 0, finite(measures.sparksAvailable)) }
    ];
  }
  if (record.profileId === "teacher-report") {
    return [
      { id: "role", pass: ["teacher", "parent", "specialist"].includes(record.participant?.role) },
      { id: "questions", pass: numberBetween(measures.questionsAsked, 4) && numberBetween(measures.questionsCorrect, 0, finite(measures.questionsAsked)) },
      { id: "action", pass: typeof measures.nextActionAccurate === "boolean" },
      { id: "usefulness", pass: numberBetween(measures.usefulnessRating, 1, 5) }
    ];
  }
  if (record.profileId === "classroom-audio") {
    return [
      { id: "room", pass: idIsAnonymous(measures.roomProfile, "ROOM") },
      { id: "device", pass: Boolean(String(measures.deviceModel || "").trim()) },
      { id: "prompts", pass: numberBetween(measures.promptsPlayed, 10) && numberBetween(measures.promptsUnderstood, 0, finite(measures.promptsPlayed)) },
      { id: "masking", pass: numberBetween(measures.maskingIncidents, 0) },
      { id: "comfort", pass: numberBetween(measures.discomfortIncidents, 0) }
    ];
  }
  return [];
}

export function validateQuestHumanObservation(record = {}) {
  const checks = [...commonChecks(record), ...profileChecks(record)];
  return {
    status: checks.every(check => check.pass) ? "valid" : "invalid",
    checks,
    failures: checks.filter(check => !check.pass).map(check => check.id)
  };
}

function aggregateCheck(id, pass, detail) {
  return { id, pass: Boolean(pass), detail };
}

export function evaluateQuestHumanAcceptance(records = []) {
  const seenSessions = new Set();
  const duplicateRecords = [];
  const valid = [];
  for (const record of records.filter(candidate => validateQuestHumanObservation(candidate).status === "valid")) {
    // Participant is part of identity: two children observed in the same
    // session id (paired testing) are two observations, not a duplicate.
    const key = `${record.profileId}:${String(record.sessionId).toLowerCase()}:${String(record.participant?.anonymousId || "").toLowerCase()}`;
    if (seenSessions.has(key)) {
      duplicateRecords.push(record);
      continue;
    }
    seenSessions.add(key);
    valid.push(record);
  }
  const groups = Object.fromEntries(QUEST_HUMAN_PROFILES.map(profile => [profile, valid.filter(record => record.profileId === profile)]));
  const first = groups["child-first-use"];
  const firstTasks = first.reduce((total, record) => total + finite(record.measures.tasksShown), 0);
  const firstIndependent = first.reduce((total, record) => total + finite(record.measures.tasksIndependent), 0);
  const repeat = groups["child-repeat-play"];
  const repeatTasks = repeat.reduce((total, record) => total + finite(record.measures.tasksShown), 0);
  const repeatIndependent = repeat.reduce((total, record) => total + finite(record.measures.tasksIndependent), 0);
  const rewards = groups["reward-choice"];
  const teachers = groups["teacher-report"];
  const audio = groups["classroom-audio"];
  const teacherAsked = teachers.reduce((total, record) => total + finite(record.measures.questionsAsked), 0);
  const teacherCorrect = teachers.reduce((total, record) => total + finite(record.measures.questionsCorrect), 0);
  const promptsPlayed = audio.reduce((total, record) => total + finite(record.measures.promptsPlayed), 0);
  const promptsUnderstood = audio.reduce((total, record) => total + finite(record.measures.promptsUnderstood), 0);

  const categories = {
    "child-first-use": [
      aggregateCheck("sample-size", first.length >= 8, `${first.length}/8 sessions`),
      aggregateCheck("distinct-participants", new Set(first.map(record => record.participant.anonymousId)).size >= 8, `${new Set(first.map(record => record.participant.anonymousId)).size}/8 children`),
      aggregateCheck("independent-comprehension", ratio(firstIndependent, firstTasks) >= 0.85, `${Math.round(ratio(firstIndependent, firstTasks) * 100)}%`),
      aggregateCheck("adult-prompts", first.length > 0 && average(first.map(record => record.measures.adultPrompts)) <= 2, first.length ? `${average(first.map(record => record.measures.adultPrompts)).toFixed(1)} average` : "awaiting evidence"),
      aggregateCheck("blocked-sessions", first.length > 0 && first.filter(record => record.measures.blocked === true).length <= 1, first.length ? `${first.filter(record => record.measures.blocked === true).length} blocked` : "awaiting evidence"),
      aggregateCheck("frustration", first.length > 0 && first.reduce((total, record) => total + finite(record.measures.severeFrustrationIncidents), 0) === 0, first.length ? "no severe incidents" : "awaiting evidence"),
      aggregateCheck("enjoyment", average(first.map(record => record.measures.enjoymentRating)) >= 3.5, `${average(first.map(record => record.measures.enjoymentRating)).toFixed(1)}/5`)
    ],
    "child-repeat-play": [
      aggregateCheck("sample-size", repeat.length >= 6, `${repeat.length}/6 sessions`),
      aggregateCheck("distinct-participants", new Set(repeat.map(record => record.participant.anonymousId)).size >= 6, `${new Set(repeat.map(record => record.participant.anonymousId)).size}/6 children`),
      aggregateCheck("independent-comprehension", ratio(repeatIndependent, repeatTasks) >= 0.9, `${Math.round(ratio(repeatIndependent, repeatTasks) * 100)}%`),
      aggregateCheck("voluntary-replay", ratio(repeat.filter(record => record.measures.voluntaryReplay === true).length, repeat.length) >= 0.8, `${repeat.filter(record => record.measures.voluntaryReplay === true).length}/${repeat.length}`),
      aggregateCheck("boredom", repeat.length > 0 && average(repeat.map(record => record.measures.boredomIncidents)) <= 1, repeat.length ? `${average(repeat.map(record => record.measures.boredomIncidents)).toFixed(1)} average` : "awaiting evidence"),
      aggregateCheck("enjoyment", average(repeat.map(record => record.measures.enjoymentRating)) >= 3.5, `${average(repeat.map(record => record.measures.enjoymentRating)).toFixed(1)}/5`)
    ],
    "reward-choice": [
      aggregateCheck("sample-size", rewards.length >= 8, `${rewards.length}/8 sessions`),
      aggregateCheck("distinct-participants", new Set(rewards.map(record => record.participant.anonymousId)).size >= 8, `${new Set(rewards.map(record => record.participant.anonymousId)).size}/8 children`),
      aggregateCheck("independent-choice", ratio(rewards.filter(record => record.measures.independentStoreChoice).length, rewards.length) >= 0.75, `${rewards.filter(record => record.measures.independentStoreChoice).length}/${rewards.length}`),
      aggregateCheck("cumulative-gear", ratio(rewards.filter(record => record.measures.cumulativeGearRecognized).length, rewards.length) >= 0.75, `${rewards.filter(record => record.measures.cumulativeGearRecognized).length}/${rewards.length}`),
      aggregateCheck("relic-purpose", ratio(rewards.filter(record => record.measures.relicPurposeExplained).length, rewards.length) >= 0.75, `${rewards.filter(record => record.measures.relicPurposeExplained).length}/${rewards.length}`),
      aggregateCheck("spending", ratio(rewards.filter(record => finite(record.measures.sparksSpent) > 0).length, rewards.length) >= 0.75, `${rewards.filter(record => finite(record.measures.sparksSpent) > 0).length}/${rewards.length}`)
    ],
    "teacher-report": [
      aggregateCheck("sample-size", teachers.length >= 5, `${teachers.length}/5 sessions`),
      aggregateCheck("distinct-participants", new Set(teachers.map(record => record.participant.anonymousId)).size >= 5, `${new Set(teachers.map(record => record.participant.anonymousId)).size}/5 adults`),
      aggregateCheck("interpretation", ratio(teacherCorrect, teacherAsked) >= 0.9, `${Math.round(ratio(teacherCorrect, teacherAsked) * 100)}%`),
      aggregateCheck("next-action", ratio(teachers.filter(record => record.measures.nextActionAccurate).length, teachers.length) >= 0.8, `${teachers.filter(record => record.measures.nextActionAccurate).length}/${teachers.length}`),
      aggregateCheck("usefulness", average(teachers.map(record => record.measures.usefulnessRating)) >= 4, `${average(teachers.map(record => record.measures.usefulnessRating)).toFixed(1)}/5`)
    ],
    "classroom-audio": [
      aggregateCheck("sample-size", audio.length >= 3, `${audio.length}/3 rooms`),
      aggregateCheck("distinct-rooms", new Set(audio.map(record => record.measures.roomProfile)).size >= 3, `${new Set(audio.map(record => record.measures.roomProfile)).size}/3 profiles`),
      aggregateCheck("intelligibility", ratio(promptsUnderstood, promptsPlayed) >= 0.95, `${Math.round(ratio(promptsUnderstood, promptsPlayed) * 100)}%`),
      aggregateCheck("masking", audio.length > 0 && audio.reduce((total, record) => total + finite(record.measures.maskingIncidents), 0) === 0, audio.length ? `${audio.reduce((total, record) => total + finite(record.measures.maskingIncidents), 0)} incidents` : "awaiting evidence"),
      aggregateCheck("comfort", audio.length > 0 && audio.reduce((total, record) => total + finite(record.measures.discomfortIncidents), 0) === 0, audio.length ? `${audio.reduce((total, record) => total + finite(record.measures.discomfortIncidents), 0)} incidents` : "awaiting evidence")
    ]
  };
  const categoryStatus = Object.fromEntries(Object.entries(categories).map(([profile, checks]) => [profile, checks.every(check => check.pass) ? "pass" : "incomplete"]));
  return {
    status: Object.values(categoryStatus).every(status => status === "pass") ? "pass" : "incomplete",
    records: records.length,
    validRecords: valid.length,
    invalidRecords: records.length - valid.length - duplicateRecords.length,
    duplicateRecords: duplicateRecords.length,
    categories,
    categoryStatus
  };
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).filter(key => key !== "evidenceHash").sort().map(key => [key, canonicalValue(value[key])]));
}

export function canonicalQuestHumanObservation(record) {
  return JSON.stringify(canonicalValue(record));
}

export async function sealQuestHumanObservation(record, cryptoValue = globalThis.crypto) {
  const evidenceHash = await questHumanObservationHash(record, cryptoValue);
  return { ...record, evidenceHash };
}

export async function questHumanObservationHash(record, cryptoValue = globalThis.crypto) {
  const digest = await cryptoValue.subtle.digest("SHA-256", new TextEncoder().encode(canonicalQuestHumanObservation(record)));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

export async function verifyQuestHumanObservation(record, cryptoValue = globalThis.crypto) {
  const validation = validateQuestHumanObservation(record);
  const expectedHash = await questHumanObservationHash(record, cryptoValue);
  const hashValid = typeof record?.evidenceHash === "string" && record.evidenceHash === expectedHash;
  return {
    status: validation.status === "valid" && hashValid ? "valid" : "invalid",
    hashValid,
    validation,
    failures: [...validation.failures, ...(hashValid ? [] : ["evidence-hash"])]
  };
}
