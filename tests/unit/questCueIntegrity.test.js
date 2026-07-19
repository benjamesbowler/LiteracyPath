// THE CUE MUST NAME THE ANSWER — enforced across all 40 stops.
//
// This gate exists because of a playtest, not a theory. A child building "hot"
// on the Broken Bridge heard the whole word played at all three stages while
// the answer moved h -> o -> t, and was marked wrong for tapping the sound they
// could hear. See the header on normaliseStageCue in questPhysicalMechanics.js.
//
// Nothing else in the suite could have caught it: every unit test asserted the
// stage's ANSWER, and every one of them passed. The cue was never checked
// against the answer, so the two were free to disagree.

import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { buildTrailSection } from "../../src/utils/questHub.js";
import {
  buildPhysicalTask,
  physicalStage,
  stageCueNamesAnswer
} from "../../src/utils/questPhysicalMechanics.js";
import { hasGraphemeAudio, hasWordAudio } from "../../src/utils/questAudio.js";

// Every stage of every task at every stop, walked once.
function everyStage() {
  const rows = [];
  for (const stop of QUEST_STOPS) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    if (!section) continue;
    for (const encounter of section.encounters) {
      encounter.beats.forEach((beat, beatIndex) => {
        const task = buildPhysicalTask(section, encounter, beat, beatIndex);
        if (!task) return;
        task.stages.forEach((_, stageIndex) => {
          const stage = physicalStage(task, stageIndex);
          rows.push({
            where: `${stop.id}/${encounter.kind}/beat${beatIndex}/stage${stageIndex}`,
            stage,
            word: beat.word || null
          });
        });
      });
    }
  }
  return rows;
}

test("every stage's audio cue names that stage's own answer", () => {
  const broken = everyStage()
    .filter(row => row.stage.cueScope !== "example-word")
    .filter(row => !stageCueNamesAnswer(row.stage))
    .map(row => {
      const correct = (row.stage.items || []).find(item => item.correct);
      return `${row.where}: cue=${row.stage.audioCue?.value ?? "none"} answer=${correct?.value ?? "none"}`;
    });
  assert.deepEqual(broken, [], `Stages whose cue does not name their answer:\n${broken.join("\n")}`);
});

test("the example-word exemption is earned, never merely claimed", () => {
  // A stage may substitute an example word for a sound ONLY when we genuinely
  // cannot say that sound. If a recording exists, playing a word instead is
  // the "hot" bug wearing the exemption as a disguise.
  const unearned = everyStage()
    .filter(({ stage }) => stage.cueScope === "example-word")
    .filter(({ stage }) => {
      const correct = (stage.items || []).find(item => item.correct);
      if (!correct) return true;
      // Earned only if the answer has no clip and the substitute word does.
      return hasGraphemeAudio(String(correct.value)) || !hasWordAudio(String(stage.audioCue?.value));
    })
    .map(row => {
      const correct = (row.stage.items || []).find(item => item.correct);
      return `${row.where}: substituted "${row.stage.audioCue?.value}" for "${correct?.value}" which IS recorded`;
    });
  assert.deepEqual(unearned, []);
});

test("no stage plays a whole word as the cue for a single-grapheme answer", () => {
  // The exact shape of the "hot" bug: a word cue standing in for a sound.
  const offenders = everyStage()
    .filter(({ stage }) => {
      if (stage.cueScope === "prompt-word" || stage.cueScope === "example-word") return false;
      if (stage.audioCue?.kind !== "word") return false;
      const correct = (stage.items || []).find(item => item.correct);
      // A word cue is only ever legitimate when the ANSWER is that word.
      return correct && String(correct.value).replace(/^hw:/, "") !== String(stage.audioCue.value);
    })
    .map(row => `${row.where}: word cue "${row.stage.audioCue.value}"`);
  assert.deepEqual(offenders, []);
});

test("a multi-stage word build never replays the whole word as its cue", () => {
  // Sequence builds are where the bug did its damage: one word cue reused for
  // every stage while the answer moved on. Word Beast is NOT this — there the
  // answer IS the word ("carry the cake that says 'he'"), so the cue naming it
  // is exactly right. The failure is a word cue that does not name the answer.
  const replays = everyStage()
    .filter(row => row.word && row.stage.audioCue?.kind === "word")
    .filter(row => !["prompt-word", "example-word"].includes(row.stage.cueScope))
    .filter(row => {
      const correct = (row.stage.items || []).find(item => item.correct);
      return correct && String(correct.value).replace(/^hw:/, "") !== String(row.stage.audioCue.value);
    })
    .map(row => `${row.where}: replays "${row.stage.audioCue.value}" while building "${row.word}"`);
  assert.deepEqual(replays, []);
});

test("no two stages of the same word-build share a cue", () => {
  // Sibling stages that build one word must each ask for a different sound;
  // identical cues across stages is the failure mode by another name.
  const bad = [];
  for (const stop of QUEST_STOPS) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    if (!section) continue;
    for (const encounter of section.encounters) {
      encounter.beats.forEach((beat, beatIndex) => {
        const task = buildPhysicalTask(section, encounter, beat, beatIndex);
        if (!task || task.stages.length < 2) return;
        const cues = task.stages
          .filter(stage => stage.audioCue && stage.cueScope !== "prompt-word")
          .filter(stage => (stage.items || []).some(item => item.correct))
          .map(stage => `${stage.audioCue.kind}:${stage.audioCue.value}`);
        // Repeated sounds inside one word ("pop" -> p, o, p) are legitimate,
        // so compare against the answers rather than demanding uniqueness.
        const answers = task.stages
          .filter(stage => stage.audioCue && stage.cueScope !== "prompt-word")
          .map(stage => (stage.items || []).find(item => item.correct))
          .filter(Boolean)
          .map(item => String(item.value));
        if (new Set(cues).size !== new Set(answers).size) {
          bad.push(`${stop.id}/${encounter.kind}/beat${beatIndex}: cues=${cues.join(",")} answers=${answers.join(",")}`);
        }
      });
    }
  }
  assert.deepEqual(bad, []);
});

test("a distractor never matches the cue", () => {
  // If the cue says /t/ and a wrong tile is also `t`, the child is right and
  // the game says wrong. Same class of harm as the original bug.
  const clashes = everyStage()
    .filter(({ stage }) => {
      if (!stage.audioCue || stage.cueScope === "prompt-word") return false;
      const cue = String(stage.audioCue.value);
      return (stage.items || []).some(item => !item.correct && String(item.value) === cue);
    })
    .map(row => `${row.where}: distractor equals cue "${row.stage.audioCue.value}"`);
  assert.deepEqual(clashes, []);
});
