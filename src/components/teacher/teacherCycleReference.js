import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";

// The teaching cycles the context bar can point at - a teacher-set reference
// (never automated; Benjamin's 2026-07-28 decision). Derived once from the
// curriculum catalog; the display label turns "Cycle 6: X" into "Cycle 6 · X".
const TEACHING_CYCLES = elSkillsBlockCycles
  .filter(cycle => cycle.cycleNumber)
  .map(cycle => ({
    id: cycle.id,
    cycleNumber: cycle.cycleNumber,
    label: String(cycle.title || `Cycle ${cycle.cycleNumber}`).replace(/^Cycle (\d+):\s*/, "Cycle $1 · ")
  }));

export function teacherCycleOptions() {
  return TEACHING_CYCLES;
}
