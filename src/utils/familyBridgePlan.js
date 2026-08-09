import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";
import { FAMILY_BRIDGE_COPY } from "../content/familyBridge/familyBridgeContent.js";

export function buildFamilyBridgePlan({ cycleNumber, studentName = "Your child", language = "en" }) {
  const cycle = elSkillsBlockCycles.find(item => item.cycleNumber === Number(cycleNumber));
  if (!cycle) throw new Error("Choose a teaching cycle before creating a Family Bridge plan.");
  const copy = FAMILY_BRIDGE_COPY[language] || FAMILY_BRIDGE_COPY.en;
  const focus = cycle.focusLetters.map(item => item.grapheme || item.spelling).filter(Boolean).join(" and ") || "the current English sounds";
  const quickWords = (cycle.highFrequencyWords || []).slice(0, 4);
  const wordText = quickWords.length ? quickWords.join(", ") : "the words sent home by the teacher";
  const book = cycle.guidedReadingRecommendations?.fiction || cycle.guidedReadingRecommendations?.nonfiction;
  return {
    schemaVersion: 1,
    studentName,
    cycleId: cycle.id,
    cycleNumber: cycle.cycleNumber,
    cycleTitle: cycle.title,
    language,
    title: copy.title,
    note: copy.note,
    languageNote: copy.languageNote,
    generatedAt: new Date().toISOString(),
    activities: [
      { id: "sound-hunt", day: 1, title: copy.activityTitles[0], direction: copy.activities.sound(focus) },
      { id: "letter-find", day: 2, title: copy.activityTitles[1], direction: copy.activities.letters(focus) },
      { id: "quick-words", day: 3, title: copy.activityTitles[2], direction: copy.activities.words(wordText) },
      { id: "read-talk", day: 4, title: copy.activityTitles[3], direction: copy.activities.book(book?.title || "a favourite book") },
      { id: "child-choice", day: 5, title: copy.activityTitles[4], direction: copy.activities.celebrate() }
    ],
    privacy: {
      childVoiceRecorded: false,
      childImageCollected: false,
      completionTracked: false
    }
  };
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

export function familyBridgePrintHtml(plan) {
  return `<!doctype html><html lang="${escapeHtml(plan.language)}"><head><meta charset="utf-8"><title>${escapeHtml(plan.title)}</title><style>@page{margin:14mm}body{font:16px/1.45 Arial,sans-serif;color:#173a34}header{border-bottom:3px solid #397366;padding-bottom:12px}h1{margin:.2rem 0}ol{padding:0;list-style:none;display:grid;gap:12px}li{border:1px solid #9eb8af;border-radius:12px;padding:12px}li b{display:block}footer{margin-top:18px;border-top:1px solid #ccd9d4;padding-top:10px;color:#526b63}.check{float:right;font-size:24px}</style></head><body><header><small>${escapeHtml(plan.studentName)} · ${escapeHtml(plan.cycleTitle)}</small><h1>${escapeHtml(plan.title)}</h1><p>${escapeHtml(plan.note)}</p><p>${escapeHtml(plan.languageNote)}</p></header><ol>${plan.activities.map(activity => `<li><span class="check">□</span><b>${escapeHtml(activity.day)} · ${escapeHtml(activity.title)}</b><p>${escapeHtml(activity.direction)}</p></li>`).join("")}</ol><footer>No app sign-in is needed. Nothing on this sheet records a child’s voice or image, and home completion is not tracked.</footer></body></html>`;
}
