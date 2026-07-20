import { buildPhysicalTask } from "./questPhysicalMechanics.js";

function clampIndex(value, length) {
  if (length <= 0) return 0;
  const numeric = Number(value);
  const index = Number.isFinite(numeric) ? Math.floor(numeric) : 0;
  return Math.max(0, Math.min(length - 1, index));
}

// Checkpoints outlive the generated section they describe. Mastery, pacing,
// and content fixes can all change the number of encounters, beats, or stages
// between save and resume, so every renderer must validate the checkpoint
// against the freshly-built section before using it.
export function clampQuestWorldResume(section, resume = null) {
  const encounters = Array.isArray(section?.encounters) ? section.encounters : [];
  const requestedActiveId = resume?.activeId || null;
  const requestedEncounterIndex = requestedActiveId
    ? encounters.findIndex(encounter => encounter.id === requestedActiveId)
    : -1;
  const activeIdValid = requestedEncounterIndex >= 0;
  const encounterIndex = activeIdValid ? requestedEncounterIndex : 0;
  const encounter = encounters[encounterIndex] || null;
  const beatIndex = activeIdValid
    ? clampIndex(resume?.beatIndex, encounter?.beats?.length || 0)
    : 0;
  const beat = encounter?.beats?.[beatIndex] || null;
  const task = encounter && beat
    ? buildPhysicalTask(section, encounter, beat, beatIndex)
    : null;
  const fieldStage = activeIdValid
    ? clampIndex(resume?.fieldStage, task?.stages?.length || 0)
    : 0;
  const fallbackPhase = resume?.guideDone || !section?.teach?.length ? "trail" : "teach";
  const requestedPhase = ["teach", "trail", "gate"].includes(resume?.phase)
    ? resume.phase
    : fallbackPhase;
  const phase = encounters.length === 0
    ? "gate"
    : requestedPhase === "teach" && (resume?.guideDone || !section?.teach?.length)
      ? "trail"
      : requestedPhase;

  return Object.freeze({
    activeIdValid,
    encounterIndex,
    beatIndex,
    fieldStage,
    phase
  });
}
