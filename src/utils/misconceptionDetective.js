const MIN_REPEATED_ERRORS = 3;
const LOOKBACK_DAYS = 56;

function dayOf(value, timeZone) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function classifyPattern({ target, chosen, correct }) {
  const normalizedTarget = String(target || "").toLowerCase();
  const left = String(chosen || "").trim().toLowerCase();
  const right = String(correct || "").trim().toLowerCase();
  if (/rhyme/.test(normalizedTarget)) return {
    id: "rhyme_category_confusion",
    hypothesis: `may be matching another feature instead of the ending sound pattern`,
    teachingMove: "Model one rhyme pair and one non-rhyme pair. Ask what stays the same at the end, then check with four fresh pairs."
  };
  if (left.length === 3 && right.length === 3 && left[0] === right[0] && left[2] === right[2]) return {
    id: "medial_vowel_confusion",
    hypothesis: `may be attending to the outside letters but not yet distinguishing the middle vowel`,
    teachingMove: `Contrast ${right} with ${left}. Stretch the middle sound, map each sound to one box, then check with five new CVC words.`
  };
  if (left && right && left[0] === right[0]) return {
    id: "onset_only_guessing",
    hypothesis: `may be using the first letter without checking the whole word`,
    teachingMove: `Place ${right} and ${left} side by side. Blend through every grapheme, then ask the student to point to the part that proves the answer.`
  };
  return {
    id: "repeated_alternative",
    hypothesis: `may be applying a different rule or category consistently`,
    teachingMove: `Model why ${right} fits and ${left} does not. Use a worked example, a contrast example, then three fresh checks.`
  };
}

export function detectMisconceptionSignals({ answers = [], students = [], timeZone = "UTC", now = new Date() } = {}) {
  const names = new Map(students.map(student => [String(student.id), student.name || "Student"]));
  const groups = new Map();
  const cutoff = new Date(now).getTime() - LOOKBACK_DAYS * 86400000;
  for (const answer of answers) {
    if (answer?.is_correct !== false) continue;
    const answeredAt = new Date(answer.answered_at).getTime();
    if (!Number.isFinite(answeredAt) || answeredAt < cutoff || answeredAt > new Date(now).getTime()) continue;
    const studentId = String(answer.student_id || "");
    const target = String(answer.diagnostic_target || answer.skill || "").trim();
    const chosen = String(answer.chosen_answer || "").trim();
    const correct = String(answer.correct_answer || "").trim();
    if (!studentId || !target || !chosen || !correct || chosen === correct) continue;
    const key = [studentId, target, chosen, correct].join("\u241f");
    const group = groups.get(key) || { studentId, target, chosen, correct, rows: [] };
    group.rows.push(answer);
    groups.set(key, group);
  }
  return [...groups.values()].flatMap(group => {
    const dates = [...new Set(group.rows.map(row => dayOf(row.answered_at, timeZone)).filter(Boolean))];
    if (group.rows.length < MIN_REPEATED_ERRORS || (dates.length < 2 && group.rows.length < 4)) return [];
    const pattern = classifyPattern(group);
    const latestAt = group.rows.map(row => row.answered_at || "").sort().at(-1) || null;
    return [{
      schemaVersion: 1,
      studentId: group.studentId,
      studentName: names.get(group.studentId) || "Student",
      target: group.target,
      chosen: group.chosen,
      correct: group.correct,
      occurrences: group.rows.length,
      distinctDays: dates.length,
      latestAt,
      patternId: pattern.id,
      hypothesis: pattern.hypothesis,
      teachingMove: pattern.teachingMove,
      claim: "instructional_hypothesis_not_diagnosis"
    }];
  }).sort((left, right) => right.occurrences - left.occurrences || String(right.latestAt).localeCompare(String(left.latestAt)));
}
