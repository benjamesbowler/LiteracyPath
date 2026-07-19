import { buildPhysicalTask } from "./questPhysicalMechanics.js";

// Raised 8 -> 10 after the deep review: the 8-action budget silently deferred
// 44 beats across 20 of 40 stops (s26 lost its whole sort encounter). Ten
// rendered actions still reads as a walk, and clears nearly every deferral;
// the few that remain return through spaced review (see the note below).
export const QUEST_PHYSICAL_ACTION_BUDGET = 10;
export const QUEST_PACING_SLOW_RESPONSE_MS = 8000;

export function questPacingDecision({ tally = {}, slowResponses = 0, completedBeats = 0, totalBeats = 0 } = {}) {
  const attempts = Math.max(0, Number(tally.total) || 0);
  const mistakes = Math.max(0, Number(tally.mistakes) || 0);
  const completed = Math.max(0, Number(completedBeats) || 0);
  const remaining = Math.max(0, (Number(totalBeats) || 0) - completed);
  const mistakeRate = attempts ? mistakes / attempts : 0;
  const repeatedReadingStruggle = attempts >= 4 && mistakes >= 2 && mistakeRate >= 0.4;
  // Latency is measured per completed response, so two slow moments are already
  // enough evidence once the child has finished two beats. Requiring a third
  // answer made this support arrive after short encounters were effectively over.
  const repeatedSlowResponse = Number(slowResponses) >= 2;
  const defer = completed >= 2 && remaining > 0 && (repeatedReadingStruggle || repeatedSlowResponse);
  return {
    defer,
    deferredBeats: defer ? remaining : 0,
    reason: defer ? (repeatedReadingStruggle ? "repeated-corrections" : "repeated-slow-responses") : null,
    mistakeRate
  };
}

function beatCost(section, encounter, beat, beatIndex) {
  return buildPhysicalTask(section, encounter, beat, beatIndex)?.stages.length || 0;
}

export function budgetPhysicalSection(section, budget = QUEST_PHYSICAL_ACTION_BUDGET) {
  if (!section?.encounters?.length) return section;
  let remaining = Math.max(1, Number(budget) || QUEST_PHYSICAL_ACTION_BUDGET);
  const selected = [];

  // First preserve breadth: one complete physical moment from as many residents
  // as the real rendered-action budget permits.
  for (const encounter of section.encounters) {
    const beat = encounter.beats?.[0];
    const cost = beat ? beatCost(section, encounter, beat, 0) : 0;
    if (!cost || cost > remaining) continue;
    selected.push({ encounter, beatEntries: [{ beat, originalIndex: 0, cost }] });
    remaining -= cost;
  }

  // Then use spare room for later evidence without crowding out a different
  // character or activity. Unplayed evidence returns through spaced review.
  for (const entry of selected) {
    for (let index = 1; index < (entry.encounter.beats?.length || 0); index += 1) {
      const beat = entry.encounter.beats[index];
      const cost = beatCost(section, entry.encounter, beat, index);
      if (!cost || cost > remaining) continue;
      entry.beatEntries.push({ beat, originalIndex: index, cost });
      remaining -= cost;
    }
  }

  if (!selected.length) {
    const encounter = section.encounters[0];
    const beat = encounter.beats?.[0];
    if (!beat) return section;
    selected.push({ encounter, beatEntries: [{ beat, originalIndex: 0, cost: beatCost(section, encounter, beat, 0) }] });
  }

  // Deferral notes: with the ceiling at 10 the sim shows almost nothing is
  // deferred; anything that is comes back through spaced review (the
  // scheduler's whole job, proven by the recurrence playthrough test). A
  // hard never-defer-a-sole-carrier rule was tried and rejected: at an
  // 8-target stop nearly every beat is a sole carrier, so the rule quietly
  // deleted the budget instead of the budget deleting lessons.
  const encounters = selected.map((entry, order) => ({
    ...entry.encounter,
    order,
    beats: entry.beatEntries.map(item => item.beat),
    atGate: order === selected.length - 1
  }));

  return {
    ...section,
    encounters,
    physicalPlan: {
      budget: Math.max(1, Number(budget) || QUEST_PHYSICAL_ACTION_BUDGET),
      actions: encounters.reduce((total, encounter) => (
        total + encounter.beats.reduce((beatTotal, beat, beatIndex) => (
          beatTotal + beatCost({ ...section, encounters }, encounter, beat, beatIndex)
        ), 0)
      ), 0),
      deferredBeats: section.encounters.reduce((total, encounter) => total + (encounter.beats?.length || 0), 0)
        - encounters.reduce((total, encounter) => total + encounter.beats.length, 0)
    }
  };
}
