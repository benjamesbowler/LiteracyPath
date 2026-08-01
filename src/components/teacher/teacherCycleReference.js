import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { cycleOptionLabel } from "../../utils/cycleTitles.js";

// The teaching cycles the context bar can point at - a teacher-set reference
// (never automated; this is the current product behavior). Derived once from the
// curriculum catalog. Every label names what the cycle covers ("Cycle 2 · Tt
// and Ss"), because the data titles only a handful of them.
const TEACHING_CYCLES = elSkillsBlockCycles
  .filter(cycle => cycle.cycleNumber)
  .map(cycle => ({
    id: cycle.id,
    cycleNumber: cycle.cycleNumber,
    label: cycleOptionLabel(cycle)
  }));

export function teacherCycleOptions() {
  return TEACHING_CYCLES;
}
