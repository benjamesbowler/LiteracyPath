import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStop,
  buildStoneBridgeRound,
  buildGateRounds,
  pickDistractors,
  wordsForTarget,
  sharesSound,
  makeRng,
  isHeartTarget,
  heartWordOf
} from "../../src/utils/questRounds.js";
import { taughtThrough, heartWordsThrough, QUEST_STOPS } from "../../src/data/questSequence.js";
import { emptyRecord, MASTERY_STATES } from "../../src/utils/questMastery.js";

const rng = () => makeRng(42);

test("stop 1 builds a complete, playable set of rounds", () => {
  const built = buildStop("s1", { seed: 7 });
  assert.deepEqual(built.targets, ["a", "m", "t", "s"]);
  assert.equal(built.rounds["sound-stones"].length, 4);
  assert.equal(built.rounds["beast-feed"].length, 4);
  assert.ok(built.rounds["stone-bridge"].length >= 3);
  assert.equal(built.rounds.gate.length, 6);
});

test("every teach entry comes with real example words the child can already read", () => {
  const built = buildStop("s1", { seed: 7 });
  for (const entry of built.teach) {
    assert.ok(entry.examples.length > 0, `${entry.id} has no example words`);
    for (const word of entry.examples) {
      assert.ok(word.includes(entry.id), `"${word}" does not contain ${entry.id}`);
    }
  }
});

// ── FAIRNESS RULE 1: no giveaway distractors ────────────────────────────────

test("distractors are always sounds the child HAS been taught", () => {
  // A distractor from the future is a free right answer: the child rejects it
  // because it looks unfamiliar, not because they read it.
  for (const stop of QUEST_STOPS.slice(0, 12)) {
    const built = buildStop(stop.id, { seed: 3 });
    const known = taughtThrough(stop.index);
    for (const round of [...built.rounds["sound-stones"], ...built.rounds["beast-feed"], ...built.rounds.gate]) {
      for (const choice of round.choices) {
        assert.ok(known.has(choice), `${stop.id}: choice "${choice}" is not taught by stop ${stop.index}`);
      }
    }
  }
});

test("distractors prefer the sounds the child is WEAK at", () => {
  // A distractor a child can already reject teaches nothing. The ones they're
  // shaky on are the ones worth putting in front of them.
  const mastery = {
    m: { ...emptyRecord(), seen: 10, correct: 1, state: MASTERY_STATES.LEARNING },
    t: { ...emptyRecord(), seen: 10, correct: 10, state: MASTERY_STATES.MASTERED }
  };
  const known = new Set(["a", "m", "t", "s"]);
  const picked = pickDistractors("a", { known, mastery, count: 1, rng: rng() });
  assert.deepEqual(picked, ["m"], "the sound they keep getting wrong should come back");
});

// ── FAIRNESS RULE 2: no same-sound choices ──────────────────────────────────

test("two graphemes that make the SAME sound never appear together", () => {
  // c and k both say /k/. Offer both against one spoken cue and the child is
  // right either way — but the game says they're wrong. This is the bug that
  // makes a child think they can't read.
  assert.equal(sharesSound("c", "k"), true);
  assert.equal(sharesSound("w", "wh"), true);
  assert.equal(sharesSound("ai", "ay"), true);
  assert.equal(sharesSound("a", "m"), false);

  for (const stop of QUEST_STOPS.slice(0, 20)) {
    const built = buildStop(stop.id, { seed: 5 });
    for (const round of [...built.rounds["sound-stones"], ...built.rounds.gate]) {
      for (const choice of round.choices) {
        if (choice === round.answer) continue;
        assert.equal(
          sharesSound(round.answer, choice),
          false,
          `${stop.id}: "${choice}" makes the same sound as the answer "${round.answer}" — both are correct`
        );
      }
    }
  }
});

test("the answer is always among the choices, exactly once", () => {
  for (const stop of QUEST_STOPS.slice(0, 20)) {
    const built = buildStop(stop.id, { seed: 9 });
    for (const round of [...built.rounds["sound-stones"], ...built.rounds["beast-feed"], ...built.rounds.gate]) {
      const hits = round.choices.filter(c => c === round.answer).length;
      assert.equal(hits, 1, `${stop.id}: answer "${round.answer}" appears ${hits} times in ${JSON.stringify(round.choices)}`);
    }
  }
});

// ── FAIRNESS RULE 3: nothing ahead of the curriculum ────────────────────────

test("Stone Bridge planks are the word's real graphemes, in blending order", () => {
  const round = buildStoneBridgeRound("ship", { stopIndex: 9, mastery: {}, rng: rng() });
  assert.deepEqual(round.planks, ["sh", "i", "p"]);
  assert.deepEqual(round.answer, ["sh", "i", "p"]);
});

test("Stone Bridge decoys never duplicate a plank", () => {
  // A duplicate decoy is not a wrong answer — it is the RIGHT answer, sitting
  // in the tray a second time, and the child gets marked wrong for tapping it.
  for (const stop of QUEST_STOPS.slice(0, 20)) {
    const built = buildStop(stop.id, { seed: 11 });
    for (const round of built.rounds["stone-bridge"]) {
      const counts = {};
      for (const tile of round.tray) counts[tile] = (counts[tile] || 0) + 1;
      for (const plank of new Set(round.planks)) {
        const inWord = round.planks.filter(p => p === plank).length;
        assert.equal(
          counts[plank], inWord,
          `${stop.id} "${round.word}": tray has ${counts[plank]} x "${plank}" but the word needs ${inWord}`
        );
      }
    }
  }
});

test("Stone Bridge only ever uses words the child can decode", () => {
  for (const stop of QUEST_STOPS) {
    const built = buildStop(stop.id, { seed: 13 });
    const known = taughtThrough(stop.index);
    for (const round of built.rounds["stone-bridge"]) {
      for (const plank of round.planks) {
        assert.ok(known.has(plank), `${stop.id} "${round.word}": plank "${plank}" is not taught yet`);
      }
      for (const tile of round.tray) {
        assert.ok(known.has(tile), `${stop.id} "${round.word}": tray tile "${tile}" is not taught yet`);
      }
    }
  }
});

test("example words never include heart words — those are not sounded out", () => {
  // "the" is a heart word precisely because it cannot be decoded. Putting it in
  // a blending game teaches a child that sounding out doesn't work.
  const words = wordsForTarget("h", 10);
  assert.ok(!words.includes("the"));
});

// ── The gate ────────────────────────────────────────────────────────────────

test("the gate asks BOTH directions, because one direction measures one thing", () => {
  const rounds = buildGateRounds(["a", "m"], { stopIndex: 1, mastery: {}, rng: rng() });
  assert.equal(rounds.length, 6);
  assert.ok(rounds.every(r => r.gate === true));
  const shells = new Set(rounds.map(r => r.shell));
  assert.deepEqual([...shells].sort(), ["beast-feed", "sound-stones"]);
});

test("the gate offers 4 choices, not 3 — a real check is harder than practice", () => {
  const rounds = buildGateRounds(["a", "m", "t", "s"], { stopIndex: 1, mastery: {}, rng: rng() });
  for (const round of rounds) assert.equal(round.choices.length, 4);
});

test("a boss stop with nothing new to teach still builds a gate from review", () => {
  const built = buildStop("s8", { targets: ["a", "m", "sh"], seed: 4 });
  assert.equal(built.rounds.gate.length, 6);
});

// ── Echo Cave (segmenting) ──────────────────────────────────────────────────

test("Echo Cave asks for the word's real sounds, in order", () => {
  const built = buildStop("s9", { seed: 21 });
  const round = built.rounds["echo-cave"].find(r => r.word === "ship") || built.rounds["echo-cave"][0];
  assert.deepEqual(round.sounds, round.answer);
  assert.ok(round.sounds.length >= 3);
  for (const s of round.sounds) assert.ok(round.keys.includes(s), `key "${s}" missing from the keyboard`);
});

test("Echo Cave never uses a key the child has not been taught", () => {
  for (const stop of QUEST_STOPS) {
    const built = buildStop(stop.id, { seed: 17 });
    const known = taughtThrough(stop.index);
    for (const round of built.rounds["echo-cave"]) {
      for (const key of round.keys) {
        assert.ok(known.has(key), `${stop.id} "${round.word}": key "${key}" is not taught by stop ${stop.index}`);
      }
    }
  }
});

test("Echo Cave avoids re-using the Stone Bridge's words where it can", () => {
  // Segmenting the same four words the child just blended teaches them to
  // remember the answer, not to hear the sounds.
  const built = buildStop("s7", { seed: 31 });
  const bridge = new Set(built.rounds["stone-bridge"].map(r => r.word));
  const echo = built.rounds["echo-cave"].map(r => r.word);
  const overlap = echo.filter(w => bridge.has(w));
  assert.equal(overlap.length, 0, `stop 7 reuses ${overlap.join(", ")} in both shells`);
});

// ── Word Beast (heart words) ────────────────────────────────────────────────

test("Word Beast distractors are other HEART words, never decodable ones", () => {
  // Offer a decodable distractor and a child can win by sounding it out — which
  // is exactly the skill a heart word is not testing.
  for (const stop of QUEST_STOPS) {
    const built = buildStop(stop.id, { seed: 23 });
    const hearts = new Set(heartWordsThrough(stop.index).map(w => w.toLowerCase()));
    for (const round of built.rounds["word-beast"]) {
      for (const choice of round.choices) {
        assert.ok(hearts.has(choice.toLowerCase()), `${stop.id}: "${choice}" is not a heart word`);
      }
      assert.equal(round.choices.filter(c => c === round.answer).length, 1);
    }
  }
});

test("a stop with no heart words simply has no Word Beast rounds", () => {
  assert.equal(buildStop("s1", { seed: 2 }).rounds["word-beast"].length, 0);
  assert.ok(buildStop("s3", { seed: 2 }).rounds["word-beast"].length > 0);
});

// ── THE COLLISION. Two tracks, two namespaces. ──────────────────────────────

test("heart-word targets are NAMESPACED so they can never reach a letter shell", () => {
  // Without the hw: prefix, "the" enters the mastery map as a bare target, the
  // review scheduler marks it due at a later stop, and it gets handed to Sound
  // Stones — which would show a child a stone carved "the" and ask which one
  // makes that SOUND. It would also light up on the Den wall, which is a wall
  // of sounds.
  const built = buildStop("s3", { seed: 5 });
  for (const round of built.rounds["word-beast"]) {
    assert.ok(isHeartTarget(round.target), `"${round.target}" is not namespaced`);
    assert.equal(heartWordOf(round.target), round.word);
  }

  // And a heart word that the scheduler drags back is dropped from the letter
  // shells rather than rendered as a stone.
  const withHeart = buildStop("s5", { targets: ["c", "g", "hw:the", "hw:is"], seed: 5 });
  assert.deepEqual(withHeart.targets, ["c", "g"]);
  for (const round of [...withHeart.rounds["sound-stones"], ...withHeart.rounds["beast-feed"], ...withHeart.rounds.gate]) {
    assert.ok(!isHeartTarget(round.target));
    for (const choice of round.choices) assert.ok(!choice.includes(":"));
  }
});

// ── Determinism ─────────────────────────────────────────────────────────────

test("the same seed always builds the same stop — a bug is reproducible", () => {
  const a = buildStop("s5", { seed: 99 });
  const b = buildStop("s5", { seed: 99 });
  assert.deepEqual(a.rounds, b.rounds);

  const c = buildStop("s5", { seed: 100 });
  assert.notDeepEqual(a.rounds["sound-stones"], c.rounds["sound-stones"], "a different seed should vary the rounds");
});

test("every stop on the whole trail builds without throwing", () => {
  for (const stop of QUEST_STOPS) {
    const built = buildStop(stop.id, { seed: stop.index });
    assert.ok(built, `${stop.id} failed to build`);
    assert.ok(built.rounds.gate.length > 0 || built.targets.length === 0, `${stop.id} built an empty gate`);
  }
});
