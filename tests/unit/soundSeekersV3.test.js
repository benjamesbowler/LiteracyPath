// Sound Seekers v3 — engine tests (pure, no browser).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { CAST, HEROES } from "../../src/features/soundSeekers/v3/content/cast.js";
import { BACKDROPS, PANELS, TRAIL, WORLD_W } from "../../src/features/soundSeekers/v3/content/trail.js";
import { LINE_AUDIO } from "../../src/features/soundSeekers/v3/content/lines.generated.js";
import { VOICE_CAST, voiceFor } from "../../src/features/soundSeekers/v3/content/voices.js";
import { MECHANICS, publicBeat } from "../../src/features/soundSeekers/v3/engine/challenges.js";
import { buildMission } from "../../src/features/soundSeekers/v3/engine/director.js";
import { createBeatState, resolveAction } from "../../src/features/soundSeekers/v3/engine/authority.js";
import {
  completeStop, createProgress, isStopUnlocked, normalizeProgress, recordEvidence, recordTaught
} from "../../src/features/soundSeekers/v3/engine/progress.js";
import { isReadableAt, isSoundDistinct, soundClass, targetInfo } from "../../src/features/soundSeekers/v3/engine/lexicon.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const SCORED = Object.values(MECHANICS).filter(m => m !== MECHANICS.SIGNPOST);

function missions() {
  return TRAIL.map(stop => ({ stop, mission: buildMission(stop, {}) }));
}

// ── content ────────────────────────────────────────────────────────────────
test("the trail is the curriculum: 40 stops, same ids and order", () => {
  assert.equal(TRAIL.length, QUEST_STOPS.length);
  TRAIL.forEach((stop, i) => {
    assert.equal(stop.id, QUEST_STOPS[i].id);
    assert.equal(stop.name, QUEST_STOPS[i].name);
    assert.deepEqual(stop.teach, QUEST_STOPS[i].teach);
  });
});

test("every stop has a book character with a sprite on disk, and heroes are never residents", () => {
  const heroIds = new Set(HEROES.map(h => h.id));
  for (const stop of TRAIL) {
    const cast = CAST[stop.character];
    assert.ok(cast, `${stop.id} character ${stop.character} missing from CAST`);
    assert.ok(!heroIds.has(stop.character), `${stop.id}: hero ${stop.character} cannot also be a resident`);
    assert.ok(fs.existsSync(path.join(ROOT, "public", cast.sprite)), `${cast.sprite} missing`);
    assert.ok(stop.problem.length > 8 && stop.fix.length > 8);
    assert.ok(stop.world.x >= 0 && stop.world.x <= WORLD_W);
  }
  for (const panel of PANELS) assert.ok(fs.existsSync(path.join(ROOT, "public", panel.image)), panel.image);
  for (const image of Object.values(BACKDROPS)) assert.ok(fs.existsSync(path.join(ROOT, "public", image)), image);
  for (const cast of Object.values(CAST)) {
    assert.ok(fs.existsSync(path.join(ROOT, "public", cast.sprite)), `${cast.sprite} missing`);
    if (cast.hero) assert.ok(fs.existsSync(path.join(ROOT, "public", cast.heroSprite)), `${cast.heroSprite} missing`);
  }
});

test("stops progress left to right through the world (each panel in order)", () => {
  for (let i = 1; i < TRAIL.length; i += 1) {
    assert.ok(TRAIL[i].panel >= TRAIL[i - 1].panel, `${TRAIL[i].id} panel goes backwards`);
  }
});

test("every Story Bridge line is readable with the graphemes and heart words taught by that stop", () => {
  const failures = [];
  for (const stop of TRAIL) {
    if (!stop.story) continue;
    for (const raw of stop.story.text.split(/\s+/)) {
      const word = raw.replace(/[^a-z']/gi, "");
      if (word && !isReadableAt(word, stop.index)) failures.push(`${stop.id}: "${word}"`);
    }
    assert.equal(stop.story.choices.filter(c => c.correct).length, 1, `${stop.id} story needs exactly one correct choice`);
  }
  assert.deepEqual(failures, []);
});

// ── lexicon ────────────────────────────────────────────────────────────────
test("same-sound spellings are never treated as distinct distractors", () => {
  assert.equal(isSoundDistinct("ai", "ay"), false);
  assert.equal(isSoundDistinct("c", "k"), false);
  assert.equal(isSoundDistinct("f", "ff"), false);
  assert.equal(isSoundDistinct("or", "aw"), false);
  assert.equal(isSoundDistinct("m", "s"), true);
  assert.equal(isSoundDistinct("sh", "ch"), true);
  assert.equal(soundClass("ai"), soundClass("a_e"));
  assert.ok(targetInfo("a").anchorWord);
});

// ── director / items ───────────────────────────────────────────────────────
test("every stop builds a mission that teaches every new target before scoring it", () => {
  for (const { stop, mission } of missions()) {
    const beats = mission.beats;
    assert.ok(beats.some(b => SCORED.includes(b.mechanic)), `${stop.id} has no scored beat`);
    const taught = new Set();
    const newTargets = new Set(stop.teach.map(t => t.id));
    for (const beat of beats) {
      if (beat.mechanic === MECHANICS.SIGNPOST) { beat.targetIds.forEach(id => taught.add(id)); continue; }
      for (const id of beat.targetIds) {
        if (newTargets.has(id)) assert.ok(taught.has(id), `${stop.id}: ${beat.id} scores ${id} before its signpost`);
      }
    }
    for (const t of stop.teach) assert.ok(taught.has(t.id), `${stop.id}: ${t.id} never taught`);
    assert.notEqual(beats[beats.length - 1].mechanic, MECHANICS.SIGNPOST, `${stop.id} ends on a signpost`);
  }
});

test("items have one key, sound-distinct options, and leak nothing to the view", () => {
  for (const { stop, mission } of missions()) {
    for (const beat of mission.beats) {
      const pub = publicBeat(beat);
      assert.equal(pub.key, undefined);
      assert.ok(!JSON.stringify(pub.view).includes("\"correct\":"));
      switch (beat.mechanic) {
        case MECHANICS.ECHO_HUNT: {
          const graphemes = beat.view.options.map(o => o.grapheme);
          assert.equal(new Set(graphemes).size, 3, `${beat.id} duplicate graphemes`);
          assert.ok(beat.view.options.some(o => o.id === beat.key.optionId));
          const target = beat.targetIds[0];
          for (const [id, t] of Object.entries(beat.key.optionTargets)) if (id !== beat.key.optionId) assert.ok(isSoundDistinct(target, t), `${beat.id}: ${t} sounds like ${target}`);
          break;
        }
        case MECHANICS.WORD_FORGE: {
          assert.equal(beat.key.sequence.length, beat.view.slots);
          assert.equal(beat.view.tiles.length, beat.view.slots + Math.min(2, beat.view.tiles.length - beat.view.slots));
          break;
        }
        case MECHANICS.BLEND_BRIDGE: {
          assert.ok(beat.view.options.some(o => o.id === beat.key.optionId));
          assert.equal(beat.view.word, null, "the word is revealed only after the blend");
          if (beat.view.mode === "picture") beat.view.options.forEach(o => assert.ok(o.image && !o.word, `${beat.id} picture option leaks print`));
          break;
        }
        case MECHANICS.HEART_LANTERN: {
          assert.ok(beat.view.options.some(o => o.id === beat.key.optionId));
          assert.equal(new Set(beat.view.options.map(o => o.word.toLowerCase())).size, 3);
          if (beat.view.phrase) for (const w of beat.view.phrase.words) assert.ok(isReadableAt(w.text, stop.index), `${beat.id}: phrase word ${w.text} not readable`);
          break;
        }
        case MECHANICS.GATE_RIDDLE: {
          assert.equal(beat.view.keys.length, 3);
          assert.ok(beat.view.keys.some(k => k.id === beat.key.keyId));
          break;
        }
        case MECHANICS.SOUND_SORT: {
          assert.equal(beat.view.items.length, 4);
          assert.equal(beat.view.bins.length, 2);
          const counts = Object.values(beat.key.bins).reduce((acc, b) => ({ ...acc, [b]: (acc[b] || 0) + 1 }), {});
          assert.deepEqual(Object.values(counts).sort(), [2, 2]);
          break;
        }
        default: break;
      }
    }
  }
});

test("items are deterministic for a seed and different across replays", () => {
  const a = buildMission(TRAIL[0], {}, { replayOrdinal: 0 });
  const b = buildMission(TRAIL[0], {}, { replayOrdinal: 0 });
  const c = buildMission(TRAIL[0], {}, { replayOrdinal: 1 });
  assert.deepEqual(a.beats.map(x => x.view), b.beats.map(x => x.view));
  const echoA = a.beats.filter(x => x.mechanic === MECHANICS.ECHO_HUNT).map(x => x.view.options.map(o => o.grapheme).join(""));
  const echoC = c.beats.filter(x => x.mechanic === MECHANICS.ECHO_HUNT).map(x => x.view.options.map(o => o.grapheme).join(""));
  assert.notDeepEqual(echoA, echoC);
});

test("answer position never encodes the answer across the trail", () => {
  const positions = { 0: 0, 1: 0, 2: 0 };
  for (const { mission } of missions()) {
    for (const beat of mission.beats) {
      if (beat.mechanic === MECHANICS.ECHO_HUNT) positions[beat.view.options.findIndex(o => o.id === beat.key.optionId)] += 1;
    }
  }
  const total = positions[0] + positions[1] + positions[2];
  for (const n of Object.values(positions)) assert.ok(n > total * 0.2 && n < total * 0.5, `answer positions skewed: ${JSON.stringify(positions)}`);
});

// ── authority ──────────────────────────────────────────────────────────────
function firstBeat(mechanic, stopIndex = 0, progress = {}) {
  const m = buildMission(TRAIL[stopIndex], progress);
  return m.beats.find(b => b.mechanic === mechanic);
}

test("echo hunt: first error is specific and keeps the item; second shows the model; success after support is not independent", () => {
  const beat = firstBeat(MECHANICS.ECHO_HUNT);
  const wrong = beat.view.options.filter(o => o.id !== beat.key.optionId).map(o => o.id);
  let st = createBeatState(beat);
  let r = resolveAction(beat, st, { type: "CHOOSE", optionId: wrong[0] });
  st = r.state;
  assert.equal(r.outcome.type, "incorrect");
  assert.match(r.outcome.line, /Listen again/);
  assert.equal(r.outcome.revealId, null);
  assert.equal(st.done, false);
  r = resolveAction(beat, st, { type: "CHOOSE", optionId: wrong[1] });
  st = r.state;
  assert.equal(r.outcome.revealId, beat.key.optionId, "second error models the answer");
  r = resolveAction(beat, st, { type: "CHOOSE", optionId: beat.key.optionId });
  assert.equal(r.outcome.type, "correct");
  assert.equal(r.outcome.evidence.independent, false);
  assert.ok(r.outcome.evidence.supportUsed.includes("model"));
  assert.equal(r.outcome.evidence.domain, "phoneme_to_grapheme");
  // and a clean first try is independent
  const clean = resolveAction(beat, createBeatState(beat), { type: "CHOOSE", optionId: beat.key.optionId });
  assert.equal(clean.outcome.evidence.independent, true);
});

test("word forge: ordered slots, same-letter tiles interchangeable, one evidence event per word", () => {
  const beat = firstBeat(MECHANICS.WORD_FORGE);
  let st = createBeatState(beat);
  let events = 0;
  for (const id of beat.key.sequence) {
    const r = resolveAction(beat, st, { type: "PLACE_TILE", tileId: id });
    st = r.state;
    if (r.outcome.evidence) events += 1;
  }
  assert.equal(st.done, true);
  assert.equal(events, 1);
  // a wrong tile bounces back with its own sound named, nothing placed
  const st2 = createBeatState(beat);
  const wrongTile = beat.view.tiles.find(t => t.id !== beat.key.sequence[0] && t.grapheme !== beat.view.tiles.find(x => x.id === beat.key.sequence[0]).grapheme);
  const r = resolveAction(beat, st2, { type: "PLACE_TILE", tileId: wrongTile.id });
  assert.equal(r.outcome.type, "incorrect");
  assert.equal(r.state.placed.length, 0);
  assert.match(r.outcome.line, /That tile says/);
});

test("blend bridge: stones in order, blend reveals the word, then one meaning decision", () => {
  const beat = firstBeat(MECHANICS.BLEND_BRIDGE, 2);
  let st = createBeatState(beat);
  const nudge = resolveAction(beat, st, { type: "TAP_STONE", stoneId: beat.view.stones[1].id });
  assert.equal(nudge.outcome.type, "nudge");
  for (const s of beat.view.stones) st = resolveAction(beat, st, { type: "TAP_STONE", stoneId: s.id }).state;
  assert.equal(st.phase, "blend");
  const rev = resolveAction(beat, st, { type: "BLEND" });
  st = rev.state;
  assert.equal(rev.outcome.word, beat.key.word);
  const ok = resolveAction(beat, st, { type: "CHOOSE", optionId: beat.key.optionId });
  assert.equal(ok.outcome.type, "correct");
  assert.equal(ok.outcome.evidence.domain, "word_decoding");
});

test("sound sort: one evidence event per item, item stays until placed correctly", () => {
  const beat = firstBeat(MECHANICS.SOUND_SORT, 1);
  assert.ok(beat, "s2 should build a sort");
  let st = createBeatState(beat);
  const first = beat.view.items[0];
  const wrongBin = beat.view.bins.find(b => b.id !== beat.key.bins[first.id]).id;
  let r = resolveAction(beat, st, { type: "PLACE", itemId: first.id, binId: wrongBin });
  st = r.state;
  assert.equal(r.outcome.type, "incorrect");
  assert.equal(st.itemIndex, 0);
  let events = 0;
  for (const item of beat.view.items) {
    r = resolveAction(beat, st, { type: "PLACE", itemId: item.id, binId: beat.key.bins[item.id] });
    st = r.state;
    if (r.outcome.evidence) events += 1;
  }
  assert.equal(events, 4);
  assert.equal(st.done, true);
});

test("heart lantern: must hear before finding; find is scored; phrase is unscored", () => {
  const beat = firstBeat(MECHANICS.HEART_LANTERN, 2);
  let st = createBeatState(beat);
  const blocked = resolveAction(beat, st, { type: "READY" });
  assert.equal(blocked.outcome.type, "blocked");
  st = resolveAction(beat, st, { type: "HEARD" }).state;
  st = resolveAction(beat, st, { type: "READY" }).state;
  assert.equal(st.phase, "find");
  const r = resolveAction(beat, st, { type: "CHOOSE", optionId: beat.key.optionId });
  assert.equal(r.outcome.evidence.domain, "heart_word_mapping");
  assert.equal(r.outcome.evidence.independent, true);
  if (beat.view.phrase) {
    const fin = resolveAction(beat, r.state, { type: "FINISH" });
    assert.equal(fin.outcome.type, "complete");
    assert.equal(fin.outcome.evidence, null);
  }
});

test("signpost: every card must be heard before Got it, and it never produces evidence", () => {
  const beat = firstBeat(MECHANICS.SIGNPOST);
  let st = createBeatState(beat);
  const early = resolveAction(beat, st, { type: "FINISH" });
  assert.equal(early.outcome.type, "blocked");
  for (const card of beat.view.cards) st = resolveAction(beat, st, { type: "HEARD_CARD", targetId: card.targetId }).state;
  const fin = resolveAction(beat, st, { type: "FINISH" });
  assert.equal(fin.outcome.type, "complete");
  assert.deepEqual(fin.outcome.taught, beat.targetIds);
  assert.equal(fin.outcome.evidence, null);
});

// ── progress ───────────────────────────────────────────────────────────────
test("progress: unlocking, completion, checkpoint clearing and the target ledger", () => {
  let p = createProgress({ hero: "speedy" });
  assert.equal(isStopUnlocked(p, "s1"), true);
  assert.equal(isStopUnlocked(p, "s2"), false);
  p = recordTaught(p, ["a", "m"]);
  p = recordEvidence(p, { targetIds: ["a"], independent: true, domain: "phoneme_to_grapheme", errors: 0 });
  p = recordEvidence(p, { targetIds: ["m"], independent: false, domain: "phoneme_to_grapheme", errors: 2, confusedWith: "s" });
  assert.equal(p.targets.a.independent, 1);
  assert.equal(p.targets.m.supported, 1);
  assert.equal(p.targets.m.missed, 1);
  assert.equal(p.targets.m.confusions.s, 1);
  p = { ...p, checkpoint: { stopId: "s1", beatIndex: 3, replayOrdinal: 0 } };
  p = completeStop(p, "s1", { token: "tub" });
  assert.equal(p.checkpoint, null);
  assert.equal(p.currentStopId, "s2");
  assert.equal(isStopUnlocked(p, "s2"), true);
  const round = normalizeProgress(JSON.parse(JSON.stringify({ ...p, heroChosen: true })));
  assert.equal(round.heroChosen, true);
  assert.deepEqual(round.completed, p.completed);
  assert.equal(normalizeProgress({ v: 1, junk: true }).v, 3);
});

test("review picks a shaky earlier target and serves it in a later stop", () => {
  let p = createProgress();
  p = recordTaught(p, ["a", "m", "t", "s"]);
  p = recordEvidence(p, { targetIds: ["m"], independent: false, domain: "phoneme_to_grapheme", errors: 2 });
  p = completeStop(p, "s1");
  const m = buildMission(TRAIL[1], p);
  const review = m.beats.find(b => b.review);
  assert.ok(review, "a review beat is scheduled");
  assert.ok(review.targetIds.includes("m"), `review targets ${review.targetIds}`);
});

test("every spoken character line is current: the clip on disk was made from the words on the card", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "public/audio/sound-seekers/v3/lines/manifest.json"), "utf8"));
  const byId = new Map(manifest.lines.map(l => [l.id, l]));
  for (const stop of TRAIL) {
    const audio = LINE_AUDIO[stop.id];
    assert.ok(audio?.problem && audio?.fix, `${stop.id} has no spoken lines — run node tools/generateSoundSeekersV3Lines.mjs`);
    for (const kind of ["problem", "fix"]) {
      const file = path.join(ROOT, "public", audio[kind]);
      assert.ok(fs.existsSync(file) && fs.statSync(file).size > 1000, `${stop.id} ${kind}: ${audio[kind]} missing or empty`);
      const entry = byId.get(`${stop.id}-${kind}`);
      assert.ok(entry, `${stop.id} ${kind}: no manifest entry`);
      assert.equal(entry.text, stop[kind], `${stop.id} ${kind}: the clip was made from different words — regenerate`);
      assert.equal(entry.character, stop.character, `${stop.id} ${kind}: spoken by the wrong character`);
      assert.equal(entry.voice, voiceFor(stop.character).voice, `${stop.id} ${kind}: voice changed — regenerate`);
      assert.equal(`/audio/sound-seekers/v3/lines/${entry.file}`, audio[kind]);
    }
  }
  // every cast member has a voice, and no voice is shared inside one land
  for (const [key, cast] of Object.entries(CAST)) {
    assert.ok(VOICE_CAST[key], `${cast.name} has no voice`);
    assert.match(VOICE_CAST[key].prompt, new RegExp(`^Speak as ${cast.name},`));
  }
  for (const land of ["meadow", "dino", "moonwood"]) {
    const voices = Object.entries(CAST).filter(([, c]) => c.land === land).map(([k]) => VOICE_CAST[k].voice);
    assert.equal(new Set(voices).size, voices.length, `${land}: two characters share a voice`);
  }
});
