import { normalizeAssessmentAttempt } from "./assessmentHistoryStore.js";

const STATUS_LABELS = {
  on_track: "On track",
  developing: "Developing",
  needs_support: "Needs support",
  not_started: "Not started"
};

const ITEM_TYPE_LABELS = {
  initial_sound: "Initial sound",
  final_sound: "Final sound",
  rhyming_family: "Rhyming family",
  short_vowel: "Short vowel",
  sight_word: "Sight word",
  phonics_pattern: "Phonics pattern",
  grammar_noun: "Noun",
  grammar_verb: "Verb",
  grammar_adjective: "Adjective",
  letter_name: "Letter name",
  letter_sound: "Letter sound",
  skill_item: "Skill item"
};

const SKILL_AREA_RULES = [
  {
    id: "phonological",
    label: "Phonological Awareness",
    color: "#0f766e",
    match: value => /initial|final|rhym/i.test(value)
  },
  {
    id: "phonics",
    label: "Phonics",
    color: "#2563eb",
    match: value => /cvc|short vowel|blend|digraph|long vowel|silent e|vowel team|controlled|phonics|pattern/i.test(value)
  },
  {
    id: "hfw",
    label: "High-Frequency Words",
    color: "#d97706",
    match: value => /hfw|high-frequency|sight/i.test(value)
  },
  {
    id: "grammar",
    label: "Grammar",
    color: "#7c3aed",
    match: value => /noun|verb|adjective|preposition|plural|prefix|suffix|grammar/i.test(value)
  }
];

const CLASS_REPORT_SKILL_ORDER = [
  "Initial Sounds",
  "Final Sounds",
  "Rhyming",
  "CVC and Short Vowels",
  "Short Vowel Discrimination",
  "Blends",
  "Digraphs",
  "Long Vowels and Silent E",
  "High-Frequency Words 1-25",
  "High-Frequency Words 26-50",
  "High-Frequency Words 51-100",
  "Grammar and Language"
];

const CLASS_REPORT_SKILL_ALIASES = [
  { label: "Initial Sounds", match: value => /initial/.test(value) },
  { label: "Final Sounds", match: value => /final|ending/.test(value) },
  { label: "Rhyming", match: value => /rhym/.test(value) },
  { label: "CVC / Short Vowels", canonical: "CVC and Short Vowels", match: value => /cvc|short vowel/.test(value) && !/discrimination/.test(value) },
  { label: "Short Vowel Discrimination", match: value => /short vowel.*discrimination|discrimination.*short vowel/.test(value) },
  { label: "Blends", match: value => /blend/.test(value) },
  { label: "Digraphs", match: value => /digraph|ch|sh|th/.test(value) },
  { label: "Long Vowels / Silent E", canonical: "Long Vowels and Silent E", match: value => /long vowel|silent e/.test(value) },
  { label: "HFW 1-25", canonical: "High-Frequency Words 1-25", match: value => /(hfw|high.frequency|sight).*1.*25|1-25/.test(value) },
  { label: "HFW 26-50", canonical: "High-Frequency Words 26-50", match: value => /(hfw|high.frequency|sight).*26.*50|26-50/.test(value) },
  { label: "HFW 51-100", canonical: "High-Frequency Words 51-100", match: value => /(hfw|high.frequency|sight).*51.*100|51-100/.test(value) },
  { label: "Grammar & Language", canonical: "Grammar and Language", match: value => /grammar|language|noun|verb|adjective|preposition/.test(value) }
];

const CLASS_REPORT_GROUP_STYLES = ["red", "amber", "orange", "green"];

export function getSkillArea(skill = {}) {
  const value = `${skill.skillId || skill.id || ""} ${skill.skillName || skill.label || skill.name || ""}`;
  return SKILL_AREA_RULES.find(rule => rule.match(value)) || {
    id: "other",
    label: "Other Literacy",
    color: "#64748b"
  };
}

function normalizeKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-z0-9']+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z']/g, "");
}

function clampPercent(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function average(values = []) {
  const numeric = values.map(Number).filter(Number.isFinite);
  return numeric.length ? clampPercent(numeric.reduce((sum, value) => sum + value, 0) / numeric.length) : 0;
}

function getClassStudentId(student = {}) {
  return student.id || student.studentId || "";
}

function getClassId(student = {}) {
  return student.classId || student.class_id || "";
}

function getClassNameById(classes = [], classId = "", fallback = "") {
  return classes.find(row => row.id === classId)?.name || fallback;
}

function formatSkillForClassReport(skillName = "") {
  const value = String(skillName || "").toLowerCase();
  const alias = CLASS_REPORT_SKILL_ALIASES.find(row => row.match(value));
  return {
    label: alias?.label || skillName || "Assessment",
    canonical: alias?.canonical || alias?.label || skillName || "Assessment"
  };
}

function classReportSkillSortValue(skillName = "") {
  const formatted = formatSkillForClassReport(skillName);
  const index = CLASS_REPORT_SKILL_ORDER.indexOf(formatted.canonical);
  return index === -1 ? CLASS_REPORT_SKILL_ORDER.length : index;
}

function getClassReportStatusId(accuracy = 0, attempts = 0) {
  if (!attempts) return "not_assessed";
  if (accuracy >= 80) return "mastered";
  if (accuracy >= 60) return "developing";
  return "needs_support";
}

function getClassReportStatusLabel(statusId = "") {
  if (statusId === "mastered") return "Mastered";
  if (statusId === "developing") return "Developing";
  if (statusId === "needs_support") return "Needs support";
  return "Not assessed";
}

function getClassReportActivity(point = {}) {
  const label = String(point.label || point.skillName || "").toLowerCase();
  if (/digraph|ch|sh|th/.test(label)) return "Multisensory ch/sh/th sort + tracing";
  if (/blend|fl|pl|cl|bl|str/.test(label)) return "Letter tile building: fl, pl, cl, bl, str";
  if (/hfw|high-frequency|sight/.test(label)) return "Word wall rotation + sentence writing";
  if (/rhyme|rhym/.test(label)) return "Build rhyme families with picture cards";
  if (/short vowel|cvc/.test(label)) return "Build and read CVC word chains";
  if (/initial|final/.test(label)) return "Sound sort, say, tap, and mark";
  if (/reading/.test(label)) return "Introduce next-level texts with pre-teaching";
  return point.itemType ? teachingNoteForItem(point) : `Model, guided try, then independent review for ${point.skillName || point.label || "the focus skill"}.`;
}

export function formatReportDate(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not yet";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function getAccuracyStatus(accuracy = 0, hasData = true) {
  if (!hasData) {
    return {
      id: "not_started",
      label: STATUS_LABELS.not_started,
      description: "No assessment evidence yet."
    };
  }
  if (accuracy > 80) {
    return {
      id: "on_track",
      label: STATUS_LABELS.on_track,
      description: "Checkpoint evidence is strong."
    };
  }
  if (accuracy >= 60) {
    return {
      id: "developing",
      label: STATUS_LABELS.developing,
      description: "Useful progress, with some targeted review needed."
    };
  }
  return {
    id: "needs_support",
    label: STATUS_LABELS.needs_support,
    description: "Plan a short, focused reteach before moving on."
  };
}

export function formatItemLabel(itemType = "", itemKey = "") {
  const key = String(itemKey || "").replace(/_/g, " ");
  if (!key) return "Unknown item";
  if (itemType === "initial_sound") return `Starts with /${key.replace(/^sound /, "")}/`;
  if (itemType === "final_sound") return `Ends with /${key.replace(/^sound /, "")}/`;
  if (itemType === "rhyming_family") return key.startsWith("-") ? `${key} family` : `-${key} family`;
  if (itemType === "short_vowel") return `Short /${key.replace(/^short /, "").replace(/^short_/, "")}/`;
  if (itemType === "sight_word") return key;
  if (itemType === "phonics_pattern") return key;
  if (itemType === "grammar_noun") return `Noun: ${key}`;
  if (itemType === "grammar_verb") return `Verb: ${key}`;
  if (itemType === "grammar_adjective") return `Adjective: ${key}`;
  if (itemType === "letter_name") return `${key.toUpperCase()} name`;
  if (itemType === "letter_sound") return `/${key}/ sound`;
  return key;
}

function inferShortVowelKey(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || record.targetSound || "");
  if (/^short_[aeiou]$/.test(explicit)) return explicit.replace("short_", "");
  const answer = cleanWord(record.correctAnswer || record.correct || "");
  if (/^[aeiou]$/.test(answer)) return answer;
  const word = cleanWord(record.targetWord || record.diagnosticTarget || record.correctAnswer || "");
  const match = word.match(/^[bcdfghjklmnpqrstvwxyz]?([aeiou])[bcdfghjklmnpqrstvwxyz]+$/);
  return match ? match[1] : "";
}

function inferRimeFamily(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || "");
  if (explicit && !["rhyming", "rhyme"].includes(explicit)) return explicit.replace(/^family_/, "");
  const word = cleanWord(record.targetWord || record.diagnosticTarget || record.correctAnswer || record.correct || "");
  return word.match(/[aeiou][a-z']*$/)?.[0] || word;
}

function inferQuestionItem(record = {}, attempt = {}) {
  const skillId = normalizeKey(record.skillId || attempt.skillId);
  const skillName = String(attempt.skillName || record.skillName || "").toLowerCase();
  const itemType = normalizeKey(record.itemType || "");
  const itemKey = normalizeKey(record.itemKey || "");

  if (itemType && itemKey) return { itemType, itemKey };

  if (skillId === "initial_sounds" || skillName.includes("initial")) {
    const key = normalizeKey(record.targetLetter || record.targetSound || record.targetPattern || record.correctAnswer || cleanWord(record.targetWord)[0]);
    return key ? { itemType: "initial_sound", itemKey: key[0] } : null;
  }
  if (skillId === "final_sounds" || skillName.includes("final") || skillName.includes("ending")) {
    const key = normalizeKey(record.targetSound || record.targetPattern || record.correctAnswer || cleanWord(record.targetWord).at(-1));
    return key ? { itemType: "final_sound", itemKey: key } : null;
  }
  if (skillId === "rhyming" || skillName.includes("rhym")) {
    const key = inferRimeFamily(record);
    return key ? { itemType: "rhyming_family", itemKey: key } : null;
  }
  if (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination" || skillName.includes("short vowel")) {
    const key = inferShortVowelKey(record);
    return key ? { itemType: "short_vowel", itemKey: key } : null;
  }
  if (skillId.startsWith("hfw") || skillName.includes("high-frequency") || skillName.includes("sight")) {
    const key = normalizeKey(record.targetWord || record.correctAnswer || record.itemKey);
    return key ? { itemType: "sight_word", itemKey: key } : null;
  }
  if (skillId === "advanced_phonics_patterns" || skillName.includes("phonics") || itemType.includes("phonics")) {
    const key = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer);
    return key ? { itemType: "phonics_pattern", itemKey: key } : null;
  }
  const grammarType = ["grammar_noun", "grammar_verb", "grammar_adjective"].find(type => itemType === type);
  if (grammarType) return { itemType: grammarType, itemKey };

  const key = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer || record.targetWord);
  return key ? { itemType: itemType || "skill_item", itemKey: key } : null;
}

function itemFromQuestion(question = {}) {
  return inferQuestionItem(question, question);
}

function getItemStatus(row = {}) {
  const attempts = Number(row.attempts || 0);
  const correct = Number(row.correct || 0);
  const accuracy = attempts ? clampPercent((correct / attempts) * 100) : clampPercent(row.accuracy);
  if (!attempts) return "not_assessed";
  if (correct >= 2 || accuracy >= 80 || row.mastered) return "mastered";
  if (correct === 0 || accuracy < 60) return "needs_support";
  return "developing";
}

function scoreExamples(row = {}) {
  const examples = [
    ...(row.missedExamples || []),
    ...(row.examples || []),
    row.itemKey
  ].filter(Boolean);
  return Array.from(new Set(examples)).slice(0, 4);
}

export function normalizeItemMasteryRows(itemMastery = {}, assessmentHistory = []) {
  const rowMap = new Map();
  const addRow = row => {
    if (!row?.itemType || !row?.itemKey) return;
    const itemType = normalizeKey(row.itemType);
    const itemKey = normalizeKey(row.itemKey);
    const key = `${itemType}::${itemKey}`;
    const existing = rowMap.get(key) || {
      itemType,
      itemKey,
      skillId: row.skillId || "",
      skillName: row.skillName || ITEM_TYPE_LABELS[itemType] || "Skill item",
      attempts: 0,
      correct: 0,
      examples: new Set(),
      missedExamples: new Set(),
      lastAssessed: ""
    };
    existing.attempts += Number(row.attempts || 0);
    existing.correct += Number(row.correct || 0);
    existing.skillId = existing.skillId || row.skillId || "";
    existing.skillName = existing.skillName || row.skillName || ITEM_TYPE_LABELS[itemType] || "Skill item";
    (row.examples || row.exampleWords || []).forEach(value => existing.examples.add(String(value)));
    (row.missedExamples || row.missedItems || []).forEach(value => existing.missedExamples.add(String(value)));
    existing.lastAssessed = [existing.lastAssessed, row.lastAssessed || row.lastAttemptDate || ""].filter(Boolean).sort().at(-1) || "";
    rowMap.set(key, existing);
  };

  Object.values(itemMastery || {}).forEach(addRow);

  assessmentHistory.map(normalizeAssessmentAttempt).forEach(attempt => {
    attempt.questionRecords.forEach(question => {
      const inferred = inferQuestionItem(question, attempt);
      if (!inferred) return;
      const example = cleanWord(question.targetWord) || cleanWord(question.correctAnswer) || inferred.itemKey;
      addRow({
        itemType: inferred.itemType,
        itemKey: inferred.itemKey,
        skillId: attempt.skillId,
        skillName: attempt.skillName,
        attempts: 1,
        correct: question.isCorrect ? 1 : 0,
        examples: question.isCorrect && example ? [example] : [],
        missedExamples: !question.isCorrect && example ? [example] : [],
        lastAssessed: question.timestamp || attempt.completedAt
      });
    });
  });

  return Array.from(rowMap.values()).map(row => {
    const accuracy = row.attempts ? clampPercent((row.correct / row.attempts) * 100) : 0;
    const status = getItemStatus({ ...row, accuracy });
    return {
      ...row,
      accuracy,
      status,
      statusLabel: status === "mastered" ? "Mastered" : status === "developing" ? "Developing" : status === "needs_support" ? "Needs support" : "Not assessed",
      label: formatItemLabel(row.itemType, row.itemKey),
      itemTypeLabel: ITEM_TYPE_LABELS[row.itemType] || "Skill item",
      examples: Array.from(row.examples).filter(Boolean).slice(0, 8),
      missedExamples: Array.from(row.missedExamples).filter(Boolean).slice(0, 8)
    };
  }).sort((a, b) =>
    a.status.localeCompare(b.status) ||
    a.skillName.localeCompare(b.skillName) ||
    a.label.localeCompare(b.label)
  );
}

export function buildWeeklyAccuracy(records = []) {
  const weeks = new Map();
  records.map(normalizeAssessmentAttempt).forEach(record => {
    if (!record.completedAt) return;
    const date = new Date(record.completedAt);
    if (!Number.isFinite(date.getTime())) return;
    const day = date.getUTCDay() || 7;
    const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 1));
    const key = monday.toISOString().slice(0, 10);
    const row = weeks.get(key) || { weekStart: key, attempts: 0, correct: 0, total: 0 };
    row.attempts += 1;
    row.correct += record.correctCount;
    row.total += record.totalQuestions;
    weeks.set(key, row);
  });

  return Array.from(weeks.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart)).map(row => ({
    ...row,
    accuracy: row.total ? clampPercent((row.correct / row.total) * 100) : 0
  }));
}

function teachingNoteForItem(row = {}) {
  const examples = scoreExamples(row).join(", ") || row.itemKey;
  const key = String(row.itemKey || "").replace(/^short_/, "");
  if (row.itemType === "initial_sound") return `Practise listening for the /${key}/ sound at the start of words using: ${examples}.`;
  if (row.itemType === "final_sound") return `Help the student listen to the end of each word to find the /${key}/ sound: ${examples}.`;
  if (row.itemType === "short_vowel") return `Focus on the short /${key}/ vowel sound. Compare pairs: ${examples}.`;
  if (row.itemType === "rhyming_family") return `Build the -${key.replace(/^-/, "")} family together: ${examples}. Ask the student to think of more words that rhyme.`;
  if (row.itemType === "sight_word") return `Practise reading and spelling ${key} in context. Use it in the sentence: I can read ${key}.`;
  if (row.itemType === "phonics_pattern") return `Practise the ${key} pattern using: ${examples}. Ask the student to tap out each sound.`;
  if (["grammar_verb", "grammar_noun", "grammar_adjective"].includes(row.itemType)) return `Use the word ${key} in a sentence together, then ask the student to make their own sentence.`;
  return `Review ${row.label || key} with a short model, guided try, and independent try.`;
}

export function buildRecommendations({
  itemRows = [],
  currentStage = {},
  currentSkillIndex = 0,
  skillTree = [],
  mastery = {},
  coverageSnapshot = {},
  currentStageQuestions = [],
  assessmentHistory = []
} = {}) {
  const currentSkillId = currentStage?.id || "";
  const currentMastery = mastery?.[currentSkillId] || null;
  const coverage = coverageSnapshot?.[currentSkillId] || { mastered: 0, total: currentStageQuestions.length || 0 };
  const itemMap = new Map(itemRows.map(row => [`${row.itemType}::${row.itemKey}`, row]));
  const unseenRows = (currentStageQuestions || [])
    .map(question => itemFromQuestion(question))
    .filter(Boolean)
    .filter((item, index, rows) => rows.findIndex(row => `${row.itemType}::${row.itemKey}` === `${item.itemType}::${item.itemKey}`) === index)
    .filter(item => !itemMap.has(`${item.itemType}::${item.itemKey}`))
    .map(item => ({
      ...item,
      skillId: currentSkillId,
      skillName: currentStage?.label || "",
      attempts: 0,
      correct: 0,
      accuracy: 0,
      unseenCount: 1,
      status: "not_assessed",
      label: formatItemLabel(item.itemType, item.itemKey),
      examples: [],
      missedExamples: []
    }));
  const candidateRows = [...itemRows, ...unseenRows];
  const currentRows = candidateRows.filter(row => !currentSkillId || row.skillId === currentSkillId || row.skillName === currentStage?.label);
  const supportRows = (currentRows.length ? currentRows : itemRows).filter(row => row.status === "needs_support");
  const developingRows = (currentRows.length ? currentRows : itemRows).filter(row => row.status === "developing");
  const focusItems = [
    ...supportRows.filter(row => row.correct === 0 && row.attempts >= 2),
    ...supportRows.filter(row => row.attempts >= 3 && row.accuracy < 50),
    ...unseenRows.filter(row => row.unseenCount > 0),
    ...supportRows.filter(row => row.attempts === 1),
    ...developingRows.filter(row => row.accuracy < 80)
  ].filter((row, index, rows) => rows.findIndex(item => `${item.itemType}::${item.itemKey}` === `${row.itemType}::${row.itemKey}`) === index).slice(0, 5);

  let recommendedSkill = currentStage?.label || "First assessment";
  let reason = "Begin with the current skill so the next data point is useful.";
  if (!assessmentHistory.length && !itemRows.length) {
    recommendedSkill = skillTree[0]?.label || currentStage?.label || "First assessment";
    reason = "No assessment data is saved yet.";
  } else if (focusItems.length >= 2 && currentStage?.label) {
    reason = `Current skill has multiple items needing support: ${focusItems.slice(0, 2).map(row => row.label).join(", ")}.`;
  } else if (currentMastery && !currentMastery.mastered) {
    reason = "The current checkpoint has been attempted but not passed yet.";
  } else if (!currentMastery) {
    reason = "The current checkpoint has not been attempted yet.";
  } else if (coverage.total && coverage.mastered / coverage.total < 0.6) {
    reason = "The checkpoint is passed, but item coverage is still below 60%.";
  } else if (currentMastery.mastered) {
    recommendedSkill = skillTree[currentSkillIndex + 1]?.label || currentStage?.label || "Maintain mastered skills";
    reason = skillTree[currentSkillIndex + 1]
      ? "Current checkpoint and coverage are ready enough to move forward."
      : "All listed checkpoints are complete; use review to maintain accuracy.";
  }

  const quickWins = developingRows
    .filter(row => row.accuracy >= 60 && row.accuracy < 80 && row.attempts >= 2)
    .filter(row => !focusItems.some(item => `${item.itemType}::${item.itemKey}` === `${row.itemType}::${row.itemKey}`))
    .slice(0, 3)
    .map(row => `Almost there: ${row.label} (${row.correct}/${row.attempts} correct)`);
  const normalizedHistory = assessmentHistory.map(normalizeAssessmentAttempt).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const sameSkillAttempts = currentSkillId ? normalizedHistory.filter(record => record.skillId === currentSkillId) : [];
  const latestAttempt = normalizedHistory.at(-1);
  const latestCoverageCounts = sameSkillAttempts.slice(-3).map(record => {
    const coverageCount = Array.isArray(record.itemKeysCovered) ? record.itemKeysCovered.length : 0;
    return coverageCount || Object.keys(record.contentCoverage || {}).length;
  });
  const cautionFlags = [
    ...supportRows.filter(row => row.correct === 0 && row.attempts >= 3).map(row => `${row.label} has ${row.attempts} misses and no correct responses yet.`),
    ...(sameSkillAttempts.length >= 2 && sameSkillAttempts.at(-1).accuracy - sameSkillAttempts.at(-2).accuracy < -20
      ? [`Accuracy dropped ${Math.abs(sameSkillAttempts.at(-1).accuracy - sameSkillAttempts.at(-2).accuracy)}% since the last ${currentStage?.label || "skill"} session.`]
      : []),
    ...(latestAttempt?.completedAt && (Date.now() - new Date(latestAttempt.completedAt).getTime()) / 86400000 > 14
      ? [`Student has not been assessed in more than 14 days.`]
      : []),
    ...(latestCoverageCounts.length === 3 && latestCoverageCounts.every(count => count === latestCoverageCounts[0])
      ? [`Coverage has stayed at ${latestCoverageCounts[0]} item(s) for the last 3 sessions.`]
      : [])
  ].slice(0, 4);

  return {
    recommendedSkill,
    reason,
    focusItems: focusItems.map(row => ({
      ...row,
      teachingNote: teachingNoteForItem(row)
    })),
    teachingNote: focusItems[0] ? teachingNoteForItem(focusItems[0]) : "Use one short checkpoint, then adjust from the result.",
    quickWins,
    cautionFlags
  };
}

export function buildStudentReportModel({
  studentName = "",
  className = "",
  totalAnswered = 0,
  accuracy = 0,
  currentStage = {},
  currentSkillIndex = 0,
  skillTree = [],
  currentStageQuestions = [],
  mastery = {},
  coverageSnapshot = {},
  skillMasterySummary = [],
  itemMastery = {},
  assessmentHistory = [],
  guidedReadingReportRows = [],
  storyQuestSummary = {}
} = {}) {
  const records = assessmentHistory.map(normalizeAssessmentAttempt).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const answered = totalAnswered || records.reduce((sum, record) => sum + record.totalQuestions, 0);
  const correct = records.reduce((sum, record) => sum + record.correctCount, 0);
  const effectiveAccuracy = answered ? clampPercent(accuracy || (correct / answered) * 100) : 0;
  const itemRows = normalizeItemMasteryRows(itemMastery, assessmentHistory);
  const latestAttempt = records.at(-1) || null;
  const sameSkillAttempts = currentStage?.id ? records.filter(record => record.skillId === currentStage.id) : [];
  const sameSkillDelta = sameSkillAttempts.length >= 2
    ? clampPercent(sameSkillAttempts.at(-1).accuracy) - clampPercent(sameSkillAttempts.at(-2).accuracy)
    : null;
  const status = getAccuracyStatus(effectiveAccuracy, answered > 0);
  const skillMapRows = skillTree.map((stage, index) => {
    const skillRecords = records.filter(record => record.skillId === stage.id || record.skillName === stage.label);
    const total = skillRecords.reduce((sum, record) => sum + record.totalQuestions, 0);
    const skillCorrect = skillRecords.reduce((sum, record) => sum + record.correctCount, 0);
    const data = mastery?.[stage.id] || null;
    const coverage = coverageSnapshot?.[stage.id] || { mastered: 0, total: 0, unit: "items" };
    const skillAccuracy = total
      ? clampPercent((skillCorrect / total) * 100)
      : coverage.total
        ? clampPercent((coverage.mastered / coverage.total) * 100)
        : 0;
    const skillItems = itemRows.filter(row => row.skillId === stage.id || row.skillName === stage.label);
    const area = getSkillArea(stage);
    return {
      skillId: stage.id,
      label: stage.label,
      skillArea: area.label,
      skillAreaId: area.id,
      skillAreaColor: area.color,
      index,
      attempts: skillRecords.length,
      accuracy: skillAccuracy,
      status: data?.mastered ? "passed" : index === currentSkillIndex ? "current" : skillRecords.length ? "attempted" : index < currentSkillIndex ? "ready" : "not_started",
      checkpointScore: data?.lastTotal ? `${data.lastScore}/${data.lastTotal}` : "Not attempted",
      coverage,
      coveragePercent: coverage.total ? clampPercent((coverage.mastered / coverage.total) * 100) : 0,
      latestDate: skillRecords.at(-1)?.completedAt || "",
      checkpointHistory: skillRecords.map(record => ({
        date: record.completedAt,
        score: `${record.correctCount}/${record.totalQuestions}`,
        accuracy: record.accuracy,
        passed: record.passed
      })),
      itemGroups: {
        mastered: skillItems.filter(row => row.status === "mastered"),
        developing: skillItems.filter(row => row.status === "developing"),
        needsSupport: skillItems.filter(row => row.status === "needs_support")
      }
    };
  });

  const recommendations = buildRecommendations({
    itemRows,
    currentStage,
    currentSkillIndex,
    skillTree,
    mastery,
    coverageSnapshot,
    currentStageQuestions,
    assessmentHistory
  });

  return {
    snapshot: {
      studentName: studentName || "Unnamed student",
      className: className || "Class not linked",
      lastActive: formatReportDate(latestAttempt?.completedAt),
      currentSkill: currentStage?.label || "No current skill",
      totalAnswered: answered,
      accuracy: effectiveAccuracy,
      checkpoint: mastery?.[currentStage?.id]?.mastered ? "Passed" : mastery?.[currentStage?.id] ? "In progress" : "Not attempted",
      skillsPassed: skillMapRows.filter(row => row.status === "passed").length,
      status
    },
    progressPoints: records.map(record => ({
      label: formatReportDate(record.completedAt),
      value: clampPercent(record.accuracy),
      skillName: record.skillName,
      score: `${record.correctCount}/${record.totalQuestions}`,
      completedAt: record.completedAt,
      skillArea: getSkillArea(record)
    })),
    sameSkillDelta,
    skillMapRows,
    itemGroups: {
      mastered: itemRows.filter(row => row.status === "mastered"),
      developing: itemRows.filter(row => row.status === "developing"),
      needsSupport: itemRows.filter(row => row.status === "needs_support")
    },
    guidedReading: {
      bookCount: guidedReadingReportRows.length,
      completedCount: guidedReadingReportRows.filter(row => row.readCount > 0).length,
      levelRange: Array.from(new Set(guidedReadingReportRows.map(row => row.level).filter(Boolean))).join(", ") || "No levels yet",
      rows: guidedReadingReportRows
    },
    storyQuest: storyQuestSummary,
    recommendations,
    weeklyAccuracy: buildWeeklyAccuracy(records),
    skillMasterySummary
  };
}

export function buildClassReportModel({ students = [], classes = [], assessmentHistory = [], classId = "", teacherName = "" } = {}) {
  const classStudents = students.filter(student => !classId || getClassId(student) === classId);
  const classStudentIds = new Set(classStudents.map(getClassStudentId).filter(Boolean));
  const records = assessmentHistory
    .map(normalizeAssessmentAttempt)
    .filter(record => {
      if (!classId) return true;
      if (record.classId === classId) return true;
      return classStudentIds.has(record.studentId);
    })
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const studentsById = new Map(classStudents.map(student => [getClassStudentId(student), student]));
  const className = classId
    ? getClassNameById(classes, classId, "Selected class")
    : "All classes";
  const totalQuestions = records.reduce((sum, record) => sum + record.totalQuestions, 0);
  const correctCount = records.reduce((sum, record) => sum + record.correctCount, 0);
  const latestAssessmentDate = records.map(record => record.completedAt).filter(Boolean).sort().at(-1) || "";

  const skillNames = Array.from(new Set(records.map(record => record.skillName).filter(Boolean)))
    .sort((a, b) => classReportSkillSortValue(a) - classReportSkillSortValue(b) || a.localeCompare(b));

  const studentRows = classStudents.map(student => {
    const studentId = getClassStudentId(student);
    const studentRecords = records.filter(record => record.studentId === studentId);
    const total = studentRecords.reduce((sum, record) => sum + record.totalQuestions, 0);
    const correct = studentRecords.reduce((sum, record) => sum + record.correctCount, 0);
    const accuracy = total ? clampPercent((correct / total) * 100) : 0;
    const latest = studentRecords.at(-1) || null;
    return {
      studentId,
      studentName: student.name || student.studentName || "Student",
      className: getClassNameById(classes, getClassId(student), student.className || ""),
      attempts: studentRecords.length,
      totalQuestions: total,
      correctCount: correct,
      accuracy,
      status: getAccuracyStatus(accuracy, studentRecords.length > 0),
      latestDate: latest?.completedAt || "",
      currentLevel: latest?.skillName || "No data yet",
      supportSkills: Array.from(new Set(studentRecords.filter(record => !record.passed || record.accuracy < 70).map(record => record.skillName))).slice(0, 4)
    };
  }).sort((a, b) => {
    const statusOrder = { needs_support: 0, developing: 1, on_track: 2, not_started: 3 };
    return (statusOrder[a.status.id] ?? 4) - (statusOrder[b.status.id] ?? 4) ||
      a.accuracy - b.accuracy ||
      a.studentName.localeCompare(b.studentName);
  });

  const statusDistribution = ["on_track", "developing", "needs_support", "not_started"].map(statusId => {
    const rows = studentRows.filter(row => row.status.id === statusId);
    return {
      statusId,
      label: STATUS_LABELS[statusId],
      count: rows.length,
      percent: classStudents.length ? clampPercent((rows.length / classStudents.length) * 100) : 0
    };
  });

  const heatmap = skillNames.map(skillName => {
    const formattedSkill = formatSkillForClassReport(skillName);
    const cells = studentRows.map(student => {
      const skillRecords = records.filter(record => record.studentId === student.studentId && record.skillName === skillName);
      const total = skillRecords.reduce((sum, record) => sum + record.totalQuestions, 0);
      const correct = skillRecords.reduce((sum, record) => sum + record.correctCount, 0);
      const accuracy = total ? clampPercent((correct / total) * 100) : 0;
      const statusId = getClassReportStatusId(accuracy, skillRecords.length);
      return {
        studentId: student.studentId,
        studentName: student.studentName,
        attempts: skillRecords.length,
        accuracy,
        statusId,
        statusLabel: getClassReportStatusLabel(statusId),
        status: getAccuracyStatus(accuracy, skillRecords.length > 0)
      };
    });
    const attemptedCells = cells.filter(cell => cell.attempts);
    return {
      skillName,
      displaySkillName: formattedSkill.label,
      canonicalSkillName: formattedSkill.canonical,
      skillArea: getSkillArea({ skillName }).label,
      cells,
      classAccuracy: attemptedCells.length ? average(attemptedCells.map(cell => cell.accuracy)) : 0,
      masteredCount: cells.filter(cell => cell.statusId === "mastered").length,
      developingCount: cells.filter(cell => cell.statusId === "developing").length,
      needsSupportCount: cells.filter(cell => cell.statusId === "needs_support").length,
      notAssessedCount: cells.filter(cell => cell.statusId === "not_assessed").length
    };
  });

  const growthAreas = heatmap.map(row => {
    const skillRecords = records.filter(record => record.skillName === row.skillName);
    const sorted = [...skillRecords].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
    const firstWindow = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
    const latestWindow = sorted.slice(Math.max(0, sorted.length - firstWindow.length));
    const firstAccuracy = firstWindow.length ? average(firstWindow.map(record => record.accuracy)) : 0;
    const latestAccuracy = latestWindow.length ? average(latestWindow.map(record => record.accuracy)) : row.classAccuracy;
    return {
      skillName: row.displaySkillName,
      canonicalSkillName: row.canonicalSkillName,
      accuracy: row.classAccuracy,
      delta: sorted.length >= 2 ? latestAccuracy - firstAccuracy : 0,
      mastered: row.masteredCount,
      developing: row.developingCount,
      needsSupport: row.needsSupportCount
    };
  });

  const masteryRows = heatmap
    .filter(row => row.classAccuracy >= 80 || row.masteredCount >= Math.max(1, Math.ceil(classStudents.length * 0.7)))
    .sort((a, b) => b.classAccuracy - a.classAccuracy || b.masteredCount - a.masteredCount)
    .slice(0, 8)
    .map(row => ({
      skill: row.displaySkillName,
      classAccuracy: row.classAccuracy,
      mastered: row.masteredCount,
      developing: row.developingCount,
      needsSupport: row.needsSupportCount,
      note: row.needsSupportCount ? `${row.needsSupportCount} student(s) still need review.` : "Class-level mastery is secure."
    }));

  const focusRows = heatmap
    .filter(row => row.cells.some(cell => cell.attempts) && (row.classAccuracy < 70 || row.needsSupportCount > 0))
    .sort((a, b) => b.needsSupportCount - a.needsSupportCount || a.classAccuracy - b.classAccuracy)
    .slice(0, 8)
    .map(row => ({
      skill: row.displaySkillName,
      classAccuracy: row.classAccuracy,
      students: row.cells.filter(cell => cell.statusId === "needs_support").map(cell => cell.studentName),
      suggestedAction: getClassReportActivity(row)
    }));

  const weakPoints = heatmap
    .map(row => ({
      skillName: row.displaySkillName,
      studentCount: row.needsSupportCount,
      students: row.cells.filter(cell => cell.statusId === "needs_support").map(cell => cell.studentName),
      classAccuracy: row.classAccuracy
    }))
    .filter(row => classStudents.length && row.studentCount / classStudents.length >= 0.3)
    .sort((a, b) => b.studentCount - a.studentCount || a.classAccuracy - b.classAccuracy)
    .slice(0, 8);

  const itemRowsByStudent = new Map(classStudents.map(student => [
    getClassStudentId(student),
    normalizeItemMasteryRows({}, records.filter(record => record.studentId === getClassStudentId(student)))
  ]));
  const itemWeakMap = new Map();
  itemRowsByStudent.forEach((rows, studentId) => {
    const student = studentRows.find(row => row.studentId === studentId);
    rows.filter(row => row.attempts > 0 && row.accuracy < 70).forEach(row => {
      const key = `${row.itemType}::${row.itemKey}`;
      const item = itemWeakMap.get(key) || {
        itemType: row.itemType,
        itemKey: row.itemKey,
        label: row.label,
        skillName: row.skillName,
        affectedStudents: [],
        totalAccuracy: 0,
        attempts: 0,
        examples: new Set()
      };
      item.affectedStudents.push(student?.studentName || "Student");
      item.totalAccuracy += row.accuracy;
      item.attempts += 1;
      [...(row.missedExamples || []), ...(row.examples || [])].forEach(example => item.examples.add(example));
      itemWeakMap.set(key, item);
    });
  });
  const weakItems = Array.from(itemWeakMap.values())
    .map(item => ({
      ...item,
      affectedCount: item.affectedStudents.length,
      affectedPercent: classStudents.length ? clampPercent((item.affectedStudents.length / classStudents.length) * 100) : 0,
      averageAccuracy: item.attempts ? clampPercent(item.totalAccuracy / item.attempts) : 0,
      examples: Array.from(item.examples).slice(0, 6)
    }))
    .filter(item => classStudents.length && item.affectedStudents.length / classStudents.length >= 0.3)
    .sort((a, b) => b.affectedCount - a.affectedCount || a.averageAccuracy - b.averageAccuracy)
    .slice(0, 12);

  const assigned = new Set();
  const groups = (weakItems.length ? weakItems : weakPoints).map((point, index) => {
    const studentNames = point.affectedStudents || point.students || [];
    const names = studentNames.filter(name => !assigned.has(name)).slice(0, 5);
    names.forEach(name => assigned.add(name));
    const focusLabel = point.label || point.skillName;
    return {
      groupName: `Group ${index + 1}`,
      focus: focusLabel,
      skill: point.skillName || focusLabel,
      students: names,
      reason: `${point.affectedCount || point.studentCount} student(s) below 70%.`,
      suggestedActivity: getClassReportActivity(point),
      style: CLASS_REPORT_GROUP_STYLES[index % CLASS_REPORT_GROUP_STYLES.length]
    };
  }).filter(group => group.students.length >= 2).slice(0, 4);

  const currentSkillCounts = studentRows.reduce((map, row) => {
    const latest = records.filter(record => record.studentId === row.studentId).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).at(-1);
    if (!latest?.skillName) return map;
    const display = formatSkillForClassReport(latest.skillName).label;
    map[display] = (map[display] || 0) + 1;
    return map;
  }, {});
  const readingRows = studentRows.map(row => ({
    studentId: row.studentId,
    studentName: row.studentName,
    level: "Not recorded",
    reads: 0,
    accuracy: null,
    trend: "No guided reading record",
    status: row.attempts ? row.status.id : "not_started",
    note: "Guided reading records are not included in this report feed yet."
  }));
  const assessedStudentCount = studentRows.filter(row => row.attempts > 0).length;
  const averageAccuracy = totalQuestions ? clampPercent((correctCount / totalQuestions) * 100) : 0;
  const mostUrgentFocus = focusRows[0]?.skill || weakItems[0]?.skillName || weakPoints[0]?.skillName || "No class focus yet";

  return {
    className,
    teacherName,
    generatedAt: new Date().toISOString(),
    snapshot: {
      totalStudents: classStudents.length,
      assessedStudents: assessedStudentCount,
      activeThisWeek: studentRows.filter(row => row.latestDate && (Date.now() - new Date(row.latestDate).getTime()) / 86400000 <= 7).length,
      attempts: records.length,
      averageAccuracy,
      onTrack: studentRows.filter(row => row.status.id === "on_track").length,
      developing: studentRows.filter(row => row.status.id === "developing").length,
      needsSupport: studentRows.filter(row => row.status.id === "needs_support").length,
      avgReadingLevel: "Not recorded",
      avgReadingAccuracy: null,
      skillsAtClassMastery: masteryRows.length,
      totalSkillsAssessed: heatmap.filter(row => row.cells.some(cell => cell.attempts)).length,
      mostUrgentFocus,
      latestAssessmentDate,
      mostCommonCurrentSkill: Object.entries(currentSkillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "No data yet",
      statusDistribution
    },
    studentRows,
    heatmap,
    growthAreas,
    masteryRows,
    focusRows,
    readingRows,
    weakPoints,
    weakItems,
    groups,
    weeklyAccuracy: buildWeeklyAccuracy(records),
    orphanRecords: records.filter(record => record.studentId && !studentsById.has(record.studentId)).length
  };
}
