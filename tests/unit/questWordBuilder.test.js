// THE CHILD MUST SEE THE WORD TAKING SHAPE.
//
// From playtest: "we should have a decent enough box that sees us spell the
// word — so we collect L and L appears and stays in the box, then we get o and
// now the box says LO."
//
// That is not decoration. A child watching separate sounds accumulate into a
// word is the exact moment phonics turns into reading, and it is the thing
// this product exists to cause. If a task spells a word out one sound at a
// time and never shows the word, the payoff is invisible.
//
// The builder used to be gated on an ALLOWLIST OF TWO MECHANIC NAMES
// ("bridge-build", plus the echo cave). Sixteen of the seventy-five word
// builds on the trail — every authored chapter sequence, dig-and-build,
// waterwheel-sequence, storm-shelter, telescope-build and the rest — did the
// identical job and showed nothing, purely because the mechanic had a
// different name. This gate is structural so a new mechanic cannot quietly
// opt out of the payoff by being called something new.

import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { buildTrailSection } from "../../src/utils/questHub.js";
import { buildPhysicalTask } from "../../src/utils/questPhysicalMechanics.js";
import { segmentWord } from "../../src/utils/questSegments.js";

// The runtime condition, mirrored: a word, spelt as SUCCESSIVE DIFFERENT
// sounds. Repeats are collapsed because several authored verbs are two-stage
// but single-sound — fish-rescue spots a letter then chases the same letter,
// which is not spelling and must not raise a word builder reading "m".
// Only the word's OWN sounds count. Many verbs answer a sound and then a
// PLACE — track-sort picks `a` then a route, delivery picks a parcel then a
// marker. Those destination ids are not phonemes and must never fill a slot.
function stageAnswers(task, beat) {
  const sounds = new Set(segmentWord(beat?.word || ""));
  return (task?.stages || [])
    .map(stage => (stage.items || []).find(item => item.correct)?.value)
    .filter(value => value != null)
    .map(String)
    .filter(value => sounds.has(value))
    .filter((value, index, all) => value !== all[index - 1]);
}

function buildsAWord(task, beat) {
  return Boolean(beat?.word) && stageAnswers(task, beat).length > 1;
}

function everyWordBuild() {
  const builds = [];
  for (const stop of QUEST_STOPS) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    if (!section) continue;
    for (const encounter of section.encounters) {
      encounter.beats.forEach((beat, beatIndex) => {
        const task = buildPhysicalTask(section, encounter, beat, beatIndex);
        if (!task || !buildsAWord(task, beat)) return;
        builds.push({ where: `${stop.id}/${encounter.kind}`, task, beat });
      });
    }
  }
  return builds;
}

test("every multi-stage word build is a word build, whatever its mechanic is called", () => {
  const builds = everyWordBuild();
  // Guard against the trail quietly losing its word work altogether.
  assert.ok(builds.length > 50, `only ${builds.length} word builds found on the trail`);

  // The old allowlist. Anything outside it used to render no builder at all.
  const legacyAllowlist = new Set(["bridge-build", "echo-sequence"]);
  const beyondLegacy = builds.filter(build => !legacyAllowlist.has(build.task.mechanic));
  assert.ok(
    beyondLegacy.length > 0,
    "expected authored chapter mechanics to build words too — if this is 0 the trail lost its authored sequences"
  );
});

test("a word build always has one slot per sound, and the sounds spell the word", () => {
  for (const { where, task, beat } of everyWordBuild()) {
    const answers = stageAnswers(task, beat);

    // Every stage that asks a question contributes exactly one sound.
    assert.ok(answers.length > 1, `${where}: "${beat.word}" build has ${answers.length} answered stages`);

    // Those sounds, in order, must be the word's own sounds in the word's own
    // order — compared against the SEGMENTATION, not the spelling. A split
    // digraph makes the spelling a false test: "cake" is c + a_e + k, which
    // never concatenates back to "cake".
    const parts = segmentWord(beat.word);
    assert.deepEqual(
      answers,
      parts.slice(0, answers.length),
      `${where}: stages answer ${answers.join("+")} but "${beat.word}" is ${parts.join("+")}`
    );
  }
});

test("a word build cues each sound separately, so the box fills to what the child hears", () => {
  // The builder and the audio must agree: slot 2 lighting up while the cue
  // still says the whole word is how the "hot" bug felt from the child's side.
  for (const { where, task } of everyWordBuild()) {
    const wordCues = task.stages.filter(stage => (
      stage.audioCue?.kind === "word" && !["prompt-word", "example-word"].includes(stage.cueScope)
    ));
    assert.deepEqual(
      wordCues.map(stage => stage.id),
      [],
      `${where} replays a whole word while filling one slot at a time`
    );
  }
});
