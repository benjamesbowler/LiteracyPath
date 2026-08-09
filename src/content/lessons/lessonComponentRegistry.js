import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { applicationFor } from "./applicationSets.js";
import { guidedPracticeFor } from "./guidedPracticeSets.js";
import { reviewedCycleComponent, LESSON_COMPONENT_CONTENT_VERSION } from "./lessonComponentReviews.js";
import { modelScriptFor } from "./modelScripts.js";
import { retrievalSetFor } from "./retrievalSets.js";

export function lessonTargetsForCycle(cycleId) {
  const cycle = elSkillsBlockCycles.find(item => item.id === cycleId);
  if (!cycle || cycle.type !== "cycle") return [];
  return (cycle.sections?.letterLearning?.cards || []).filter(card => card.spelling && card.sound).map(card => Object.freeze({
    key: `grapheme:${String(card.spelling).toLowerCase()}`,
    label: `${card.grapheme || card.spelling} — ${card.sound}`,
    spelling: String(card.spelling).toLowerCase(),
    sound: card.sound
  }));
}

export function buildLessonComponentRegistry({ cycleId, targetKey, durationMinutes }) {
  const cycle = elSkillsBlockCycles.find(item => item.id === cycleId);
  if (!cycle || cycle.type !== "cycle") throw new Error("Choose a teaching cycle, not an assessment or review block.");
  const spelling = String(targetKey || "").replace(/^grapheme:/, "").toLowerCase();
  const card = (cycle.sections?.letterLearning?.cards || []).find(item => String(item.spelling).toLowerCase() === spelling);
  if (!card) throw new Error("The target is not taught in the selected cycle.");
  const prefix = `${cycleId}:${spelling}`;
  const components = [
    reviewedCycleComponent({ id: `${prefix}:retrieve`, role: "retrieve", title: "Retrieve known code", ...retrievalSetFor(elSkillsBlockCycles, cycle, spelling), materials: ["Known sound cards"] }),
    reviewedCycleComponent({ id: `${prefix}:model`, role: "model", title: `Model ${card.grapheme || spelling}`, ...modelScriptFor(card), materials: [`${card.grapheme || spelling} sound card`] }),
    reviewedCycleComponent({ id: `${prefix}:guide`, role: "guide", title: "Guided word practice", ...guidedPracticeFor(card, durationMinutes), materials: ["Grapheme tiles", "Word cards"] }),
    reviewedCycleComponent({ id: `${prefix}:apply`, role: "apply", title: "Apply in connected reading", ...applicationFor(cycle, spelling), materials: ["Approved reading text"] }),
    reviewedCycleComponent({ id: `${prefix}:observe`, role: "observe", title: "Exit observation", teacherText: `Show one reviewed example containing ${spelling}. Record independent, supported, not shown, or not checked.`, learnerTask: `Read one final example with ${spelling}.`, materials: ["Exit card"], evidencePurpose: "practice" })
  ];
  if (durationMinutes === 20) components.splice(4, 0, reviewedCycleComponent({
    id: `${prefix}:write`, role: "write", title: "Dictation and writing", teacherText: `Dictate one reviewed ${spelling} word, then a controlled phrase. Say the full item before learners write.`, learnerTask: "Say it, segment it, write it, then check each spelling.", materials: ["Phoneme frame", "Writing board"]
  }));
  return Object.freeze({
    contentVersion: LESSON_COMPONENT_CONTENT_VERSION,
    cycle,
    target: Object.freeze({ key: `grapheme:${spelling}`, spelling, label: `${card.grapheme || spelling} — ${card.sound}` }),
    components: Object.freeze(Object.fromEntries(components.map(component => [component.id, component])))
  });
}
