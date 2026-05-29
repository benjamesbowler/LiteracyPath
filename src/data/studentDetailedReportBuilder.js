import { normalizeAssessmentAttempt } from "./assessmentHistoryStore.js";
import {
  getGuidedReadingProgress,
  getGuidedReadingWordStatusRows,
  guidedReadingBooks,
  summarizeGuidedReadingRecord
} from "./guidedReadingBooks.js";

const DEFAULT_REPORT_SECTIONS = {
  skills: true,
  letters: true,
  advancedPhonics: true,
  hfw: true,
  guidedReadingBooks: true,
  guidedReadingWords: true,
  recommendations: true,
  growth: true
};

const SKILL_GROUPS = {
  initial_sounds: "Letter Name and Initial Sounds",
  el_letter_assessment: "Letter Name and Initial Sounds",
  final_sounds: "Final / Ending Sounds",
  rhyming: "Rhyming",
  cvc_short_vowels: "CVC / Short Vowels",
  short_vowel_discrimination: "CVC / Short Vowels",
  hfw_1_25: "High-Frequency Words",
  hfw_26_50: "High-Frequency Words",
  hfw_51_100: "High-Frequency Words",
  advanced_phonics_patterns: "Advanced Phonics Patterns",
  blends: "Advanced Phonics Patterns",
  digraphs: "Advanced Phonics Patterns",
  long_vowels: "Advanced Phonics Patterns",
  vowel_teams: "Advanced Phonics Patterns",
  r_controlled: "Advanced Phonics Patterns"
};

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

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function getStudentId(student = {}) {
  return student.id || student.studentId || "";
}

function getClassId(student = {}) {
  return student.classId || student.class_id || "";
}

function getClassName(classId, classes = [], fallback = "") {
  return classes.find(row => row.id === classId)?.name || fallback || "Unknown Class";
}

function getStatusClass(accuracy, attempts = 0) {
  if (!attempts) return "not_assessed";
  if (accuracy >= 80) return "mastered";
  if (accuracy >= 60) return "developing";
  return "needs_support";
}

function statusLabel(status) {
  if (status === "mastered") return "Mastered";
  if (status === "developing") return "Developing";
  if (status === "needs_support") return "Needs Support";
  return "Not Yet Assessed";
}

function inferShortVowelKey(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || record.targetSound || "");
  if (/^short_[aeiou]$/.test(explicit)) return explicit;
  const answer = cleanWord(record.correctAnswer || "");
  if (/^[aeiou]$/.test(answer)) return `short_${answer}`;
  const word = cleanWord(record.targetWord || "");
  const match = word.match(/^[bcdfghjklmnpqrstvwxyz]?([aeiou])[bcdfghjklmnpqrstvwxyz]+$/);
  return match ? `short_${match[1]}` : explicit;
}

function inferRimeFamily(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || "");
  if (explicit && explicit !== "rhyming") return explicit;
  const word = cleanWord(record.targetWord || record.correctAnswer || "");
  return word.match(/[aeiou][a-z']*$/)?.[0] || word;
}

function inferItem(record = {}, attempt = {}) {
  const skillId = normalizeKey(record.skillId || attempt.skillId);
  const skillName = String(attempt.skillName || "").toLowerCase();
  const itemType = normalizeKey(record.itemType || "");
  const itemKey = normalizeKey(record.itemKey || "");

  if (itemType && itemKey) {
    return { itemType, itemKey };
  }

  if (skillId === "el_letter_assessment") {
    const key = normalizeKey(record.targetLetter || record.correctAnswer || record.itemKey);
    return key ? { itemType: record.templateType === "letter_sound" ? "letter_sound" : "letter_name", itemKey: key } : null;
  }

  if (skillId === "initial_sounds" || skillName.includes("initial")) {
    const key = normalizeKey(record.targetSound || record.targetLetter || record.correctAnswer || cleanWord(record.targetWord)[0]);
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

  if (skillId.startsWith("hfw") || skillName.includes("high-frequency")) {
    const key = normalizeKey(record.targetWord || record.correctAnswer || record.itemKey);
    return key ? { itemType: "sight_word", itemKey: key } : null;
  }

  if (skillId === "advanced_phonics_patterns" || skillName.includes("phonics") || itemType.includes("phonics")) {
    const key = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer);
    return key ? { itemType: itemType || "phonics_pattern", itemKey: key } : null;
  }

  const key = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer);
  return key ? { itemType: itemType || "skill_item", itemKey: key } : null;
}

function getSkillSection(record = {}) {
  const skillId = normalizeKey(record.skillId);
  return SKILL_GROUPS[skillId] || record.skillName || "Other Skills";
}

function getItemLabel(itemType, itemKey) {
  if (itemType === "final_sound") return itemKey.length === 1 ? `/${itemKey}/` : itemKey;
  if (itemType === "rhyming_family") return itemKey.startsWith("-") ? itemKey : `-${itemKey}`;
  if (itemType === "short_vowel") return itemKey.replace(/^short_/, "short ");
  if (itemType === "letter_name") return `${itemKey.toUpperCase()} name`;
  if (itemType === "letter_sound") return `/${itemKey}/ sound`;
  return itemKey.replace(/_/g, " ");
}

function aggregateAttempts(records = []) {
  const sectionMap = new Map();

  records.forEach(rawRecord => {
    const attempt = normalizeAssessmentAttempt(rawRecord);
    const sectionName = getSkillSection(attempt);
    const section = sectionMap.get(sectionName) || {
      skillId: attempt.skillId,
      skillName: sectionName,
      latestAttemptDate: "",
      attemptsCount: 0,
      totalQuestions: 0,
      correctCount: 0,
      itemMap: new Map(),
      attempts: []
    };

    section.attemptsCount += 1;
    section.totalQuestions += attempt.totalQuestions;
    section.correctCount += attempt.correctCount;
    section.latestAttemptDate = [section.latestAttemptDate, attempt.completedAt].filter(Boolean).sort().at(-1) || "";
    section.attempts.push(attempt);

    attempt.questionRecords.forEach(question => {
      const inferred = inferItem(question, attempt);
      if (!inferred?.itemKey || !inferred?.itemType) return;
      const key = `${inferred.itemType}::${inferred.itemKey}`;
      const row = section.itemMap.get(key) || {
        itemKey: inferred.itemKey,
        itemType: inferred.itemType,
        label: getItemLabel(inferred.itemType, inferred.itemKey),
        attempts: 0,
        correct: 0,
        incorrect: 0,
        exampleWords: new Set(),
        missedExamples: new Set(),
        lastAttemptDate: "",
        details: []
      };

      row.attempts += 1;
      if (question.isCorrect) row.correct += 1;
      else row.incorrect += 1;
      const example = cleanWord(question.targetWord) || normalizeKey(question.correctAnswer || "");
      if (example && example !== inferred.itemKey) {
        if (question.isCorrect) row.exampleWords.add(example);
        else row.missedExamples.add(example);
      }
      row.lastAttemptDate = [row.lastAttemptDate, question.timestamp || attempt.completedAt].filter(Boolean).sort().at(-1) || "";
      row.details.push({
        questionId: question.questionId,
        prompt: question.prompt,
        targetWord: question.targetWord,
        correctAnswer: question.correctAnswer,
        selectedAnswer: question.selectedAnswer,
        isCorrect: question.isCorrect,
        date: question.timestamp || attempt.completedAt
      });
      section.itemMap.set(key, row);
    });

    sectionMap.set(sectionName, section);
  });

  return Array.from(sectionMap.values()).map(section => {
    const itemRows = Array.from(section.itemMap.values()).map(row => {
      const accuracy = row.attempts ? Math.round((row.correct / row.attempts) * 100) : 0;
      const status = getStatusClass(accuracy, row.attempts);
      return {
        itemKey: row.itemKey,
        itemType: row.itemType,
        label: row.label,
        status,
        statusLabel: statusLabel(status),
        attempts: row.attempts,
        correct: row.correct,
        incorrect: row.incorrect,
        accuracy,
        exampleWords: Array.from(row.exampleWords).slice(0, 8),
        missedExamples: Array.from(row.missedExamples).slice(0, 8),
        lastAttemptDate: row.lastAttemptDate,
        recentTrend: row.details.slice(-3).every(item => item.isCorrect) ? "improving" : row.details.slice(-3).some(item => !item.isCorrect) ? "watch" : "steady",
        details: row.details
      };
    }).sort((a, b) => a.itemType.localeCompare(b.itemType) || a.itemKey.localeCompare(b.itemKey));

    const accuracy = section.totalQuestions ? Math.round((section.correctCount / section.totalQuestions) * 100) : 0;
    return {
      skillId: section.skillId,
      skillName: section.skillName,
      latestAttemptDate: section.latestAttemptDate,
      attemptsCount: section.attemptsCount,
      totalQuestions: section.totalQuestions,
      correctCount: section.correctCount,
      accuracy,
      masteredItems: itemRows.filter(row => row.status === "mastered"),
      developingItems: itemRows.filter(row => row.status === "developing"),
      needsSupportItems: itemRows.filter(row => row.status === "needs_support"),
      itemRows
    };
  });
}

function readGuidedReadingRecords({ teacherId = "", studentId = "" } = {}) {
  if (typeof localStorage === "undefined" || !teacherId || !studentId) return {};
  try {
    return JSON.parse(localStorage.getItem(`guidedReadingAssessment:${teacherId}:${studentId}`) || "{}");
  } catch {
    return {};
  }
}

function buildGuidedReadingSection(records = {}) {
  const bookRows = Object.entries(records || {}).map(([bookId, record]) => {
    const book = guidedReadingBooks.find(item => item.id === bookId) || {};
    const progress = getGuidedReadingProgress(book, { ...record, bookId });
    const summary = summarizeGuidedReadingRecord(record);
    return {
      bookId,
      title: book.title || record.title || bookId,
      level: book.level || record.level || "",
      series: book.seriesTitle || record.seriesTitle || "",
      type: book.type || record.type || "",
      completed: progress.completed,
      status: progress.completed ? "Completed" : progress.completedPages ? "In Progress" : "Not Started",
      completionDate: progress.lastReadAt || progress.firstReadAt || "",
      rereadCount: Math.max(0, progress.readCount - 1),
      pagesRead: progress.completedPages,
      totalPages: progress.totalPages,
      correctWords: summary.correctWords,
      supportWords: summary.supportWords,
      notes: [summary.wholeBookNote, ...summary.pageNotes.map(item => `p${item.page}: ${item.note}`)].filter(Boolean)
    };
  }).filter(row => row.pagesRead > 0 || row.completed || row.correctWords.length || row.supportWords.length || row.notes.length);

  const wordRows = getGuidedReadingWordStatusRows(records);
  return {
    totalBooksStarted: bookRows.length,
    completedBooks: bookRows.filter(row => row.completed).length,
    inProgressBooks: bookRows.filter(row => !row.completed && row.pagesRead > 0).length,
    bookRows,
    wordRows
  };
}

function filterRecords({ assessmentHistory = [], studentId = "", classId = "", dateRange = {} }) {
  const start = dateRange.start ? new Date(dateRange.start) : null;
  const end = dateRange.end ? new Date(dateRange.end) : null;
  return assessmentHistory
    .map(normalizeAssessmentAttempt)
    .filter(record => (!studentId || record.studentId === studentId) && (!classId || record.classId === classId))
    .filter(record => {
      const date = new Date(record.completedAt);
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    })
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
}

function buildRecommendations(skillSections = [], guidedReading = {}) {
  const needs = skillSections.flatMap(section =>
    section.needsSupportItems.slice(0, 4).map(item => `${section.skillName}: ${item.label}`)
  );
  const developing = skillSections.flatMap(section =>
    section.developingItems.slice(0, 3).map(item => `${section.skillName}: ${item.label}`)
  );
  const mastered = skillSections.flatMap(section =>
    section.masteredItems.slice(0, 3).map(item => `${section.skillName}: ${item.label}`)
  );
  const hints = [];

  if (needs.length) hints.push(`Review ${needs.slice(0, 3).join(", ")}.`);
  if (developing.length) hints.push(`Keep practicing ${developing.slice(0, 3).join(", ")}.`);
  if (mastered.length) hints.push(`Ready to build on ${mastered.slice(0, 3).join(", ")}.`);
  if (guidedReading.inProgressBooks) hints.push(`${guidedReading.inProgressBooks} guided reading book(s) are in progress.`);
  if (!hints.length) hints.push("Not enough assessment data yet.");

  return { needsSupport: needs, developing, mastered, hints };
}

function buildGrowth(records = []) {
  if (records.length < 2) {
    return {
      hasGrowth: false,
      firstAccuracy: records[0]?.accuracy || 0,
      latestAccuracy: records[0]?.accuracy || 0,
      accuracyChange: 0,
      recentlyMasteredItems: [],
      persistentNeedsSupportItems: []
    };
  }
  const first = records[0];
  const latest = records.at(-1);
  return {
    hasGrowth: true,
    firstAccuracy: first.accuracy || 0,
    latestAccuracy: latest.accuracy || 0,
    accuracyChange: (latest.accuracy || 0) - (first.accuracy || 0),
    recentlyMasteredItems: latest.masteredItems || [],
    persistentNeedsSupportItems: latest.needsSupportItems || []
  };
}

export function buildIndividualStudentDetailedReport({
  student = {},
  classes = [],
  assessmentHistory = [],
  itemMastery = {},
  guidedReadingRecords = null,
  teacherId = "",
  dateRange = {},
  selectedSections = DEFAULT_REPORT_SECTIONS
} = {}) {
  const studentId = getStudentId(student);
  const classId = getClassId(student);
  const records = filterRecords({ assessmentHistory, studentId, dateRange });
  const skillSections = aggregateAttempts(records);
  const effectiveGuidedReadingRecords = guidedReadingRecords || readGuidedReadingRecords({ teacherId, studentId });
  const guidedReading = buildGuidedReadingSection(effectiveGuidedReadingRecords);
  const totalQuestions = records.reduce((sum, record) => sum + record.totalQuestions, 0);
  const correctCount = records.reduce((sum, record) => sum + record.correctCount, 0);
  const recommendations = buildRecommendations(skillSections, guidedReading);

  return {
    studentId,
    studentName: student.name || student.studentName || "Unknown Student",
    className: getClassName(classId, classes, student.className),
    generatedAt: new Date().toISOString(),
    dateRange: {
      start: dateRange.start || records[0]?.completedAt || "",
      end: dateRange.end || records.at(-1)?.completedAt || ""
    },
    selectedSections,
    summary: {
      attemptsCount: records.length,
      totalQuestions,
      correctCount,
      accuracy: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
      masteredItems: skillSections.reduce((sum, section) => sum + section.masteredItems.length, 0),
      developingItems: skillSections.reduce((sum, section) => sum + section.developingItems.length, 0),
      needsSupportItems: skillSections.reduce((sum, section) => sum + section.needsSupportItems.length, 0),
      itemMasteryRows: Object.keys(itemMastery || {}).length
    },
    skillSections,
    guidedReading,
    recommendations,
    growth: buildGrowth(records)
  };
}

export function buildWholeClassDetailedReport({
  students = [],
  classes = [],
  assessmentHistory = [],
  teacherId = "",
  classId = "",
  dateRange = {}
} = {}) {
  const classStudents = students.filter(student => !classId || getClassId(student) === classId);
  const studentReports = classStudents.map(student =>
    buildIndividualStudentDetailedReport({
      student,
      classes,
      assessmentHistory,
      teacherId,
      dateRange
    })
  );
  const classRecords = filterRecords({ assessmentHistory, classId, dateRange });
  const sectionNames = new Set(studentReports.flatMap(report => report.skillSections.map(section => section.skillName)));
  const matrices = Array.from(sectionNames).map(sectionName => {
    const itemMap = new Map();
    studentReports.forEach(report => {
      const section = report.skillSections.find(item => item.skillName === sectionName);
      if (!section) return;
      section.itemRows.forEach(row => {
        const item = itemMap.get(row.label) || {
          label: row.label,
          attemptedStudents: 0,
          masteredStudents: 0,
          developingStudents: 0,
          needsSupportStudents: 0,
          studentsNeedingSupport: []
        };
        item.attemptedStudents += 1;
        if (row.status === "mastered") item.masteredStudents += 1;
        if (row.status === "developing") item.developingStudents += 1;
        if (row.status === "needs_support") {
          item.needsSupportStudents += 1;
          item.studentsNeedingSupport.push(report.studentName);
        }
        item.masteryPercentage = item.attemptedStudents
          ? Math.round((item.masteredStudents / item.attemptedStudents) * 100)
          : 0;
        itemMap.set(row.label, item);
      });
    });
    return {
      sectionName,
      rows: Array.from(itemMap.values()).sort((a, b) =>
        b.needsSupportStudents - a.needsSupportStudents ||
        a.label.localeCompare(b.label)
      )
    };
  });
  const totalQuestions = classRecords.reduce((sum, record) => sum + record.totalQuestions, 0);
  const correctCount = classRecords.reduce((sum, record) => sum + record.correctCount, 0);

  return {
    classId,
    className: getClassName(classId, classes, classId ? "Selected Class" : "All Classes"),
    generatedAt: new Date().toISOString(),
    summary: {
      totalStudents: classStudents.length,
      assessedStudents: studentReports.filter(report => report.summary.attemptsCount > 0).length,
      totalAssessments: classRecords.length,
      averageAccuracy: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
      studentsNeedingSupport: studentReports.filter(report => report.summary.needsSupportItems > 0).map(report => report.studentName),
      studentsReadyForAdvancement: studentReports.filter(report => report.summary.masteredItems > 0 && report.summary.needsSupportItems === 0).map(report => report.studentName)
    },
    studentRows: studentReports.map(report => ({
      studentId: report.studentId,
      studentName: report.studentName,
      attempts: report.summary.attemptsCount,
      accuracy: report.summary.accuracy,
      masteredItems: report.summary.masteredItems,
      needsSupportItems: report.summary.needsSupportItems,
      guidedReadingCompleted: report.guidedReading.completedBooks,
      recommendedFocus: report.recommendations.needsSupport.slice(0, 3)
    })),
    matrices,
    recommendations: buildClassRecommendations(matrices, studentReports)
  };
}

function buildClassRecommendations(matrices = [], studentReports = []) {
  const weakItems = matrices
    .flatMap(matrix => matrix.rows.map(row => ({ ...row, sectionName: matrix.sectionName })))
    .filter(row => row.needsSupportStudents > 0)
    .sort((a, b) => b.needsSupportStudents - a.needsSupportStudents)
    .slice(0, 8);
  const hints = weakItems.map(row =>
    `${row.needsSupportStudents} student(s) need support with ${row.sectionName}: ${row.label}.`
  );
  if (!hints.length) hints.push(studentReports.some(report => report.summary.attemptsCount) ? "Most attempted items are on track." : "Not enough assessment data yet.");
  return { weakItems, hints };
}

export function formatDetailedReportAsText(report = {}) {
  const lines = [
    "LiteracyPath Individual Student Report",
    `Student: ${report.studentName || "Unknown Student"}`,
    `Class: ${report.className || "Unknown Class"}`,
    `Generated: ${formatDate(report.generatedAt)}`,
    "",
    `Summary: ${report.summary?.correctCount || 0}/${report.summary?.totalQuestions || 0} correct (${report.summary?.accuracy || 0}%)`,
    ""
  ];

  (report.skillSections || []).forEach(section => {
    lines.push(`${section.skillName}: ${section.correctCount}/${section.totalQuestions} correct (${section.accuracy}%)`);
    section.itemRows.forEach(row => {
      lines.push(`- ${row.label}: ${row.correct}/${row.attempts} correct, ${row.statusLabel}${row.exampleWords.length ? `, examples: ${row.exampleWords.join(", ")}` : ""}${row.missedExamples.length ? `, needs support examples: ${row.missedExamples.join(", ")}` : ""}`);
    });
    lines.push("");
  });

  if (report.guidedReading?.bookRows?.length) {
    lines.push("Guided Reading");
    report.guidedReading.bookRows.forEach(row => {
      lines.push(`- ${row.title} (Level ${row.level}): ${row.status}, ${row.pagesRead}/${row.totalPages} pages${row.supportWords.length ? `, support words: ${row.supportWords.join(", ")}` : ""}`);
    });
    lines.push("");
  }

  lines.push("Recommendations");
  (report.recommendations?.hints || ["Not enough assessment data yet."]).forEach(hint => lines.push(`- ${hint}`));
  return lines.join("\n");
}

export { DEFAULT_REPORT_SECTIONS };
