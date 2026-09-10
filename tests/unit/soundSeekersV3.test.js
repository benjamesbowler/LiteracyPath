// Sound Seekers v3 — engine tests (pure, no browser).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { CAST } from "../../src/features/soundSeekers/v3/content/cast.js";
import { BACKDROPS, TRAIL } from "../../src/features/soundSeekers/v3/content/trail.js";
import { LINE_AUDIO } from "../../src/features/soundSeekers/v3/content/lines.generated.js";
import { VOICE_CAST, voiceFor } from "../../src/features/soundSeekers/v3/content/voices.js";
import { MECHANICS, publicBeat, buildEchoHunt, buildWordForge, buildBlendBridge, buildSoundSort, buildHeartLantern, buildSignpost } from "../../src/features/soundSeekers/v3/engine/challenges.js";
import { buildCampaignMission } from "../../src/features/soundSeekers/v3/engine/campaignChallenges.js";
import { CAMPAIGN_MISSIONS, CAMPAIGN_STAGES } from "../../src/features/soundSeekers/v3/content/campaign.js";
import { createBeatState, resolveAction } from "../../src/features/soundSeekers/v3/engine/authority.js";
import {
  completeStop, createProgress, isStopUnlocked, normalizeProgress, recordEvidence, recordTaught
} from "../../src/features/soundSeekers/v3/engine/progress.js";
import { isReadableAt, isSoundDistinct, soundClass, targetInfo } from "../../src/features/soundSeekers/v3/engine/lexicon.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

function missions() {
  const progress = { targets: {} };
  return CAMPAIGN_MISSIONS.map(descriptor => {
    const mission = buildCampaignMission(descriptor, progress);
    if (descriptor.curriculum.mode === 'teach') for (const id of descriptor.curriculum.targetIds) progress.targets[id] = { taught: true };
    return { descriptor, stop: TRAIL.find(s => s.id === descriptor.curriculum.anchorIds[0]), mission };
  });
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

test("campaign residents have canonical art and distinct same-land alternatives", () => {
  for (const mission of CAMPAIGN_MISSIONS) {
    const resident = CAST[mission.residentId], alternate = CAST[mission.residentAlternateId];
    assert.ok(resident && alternate, mission.id);
    assert.notEqual(resident, alternate, mission.id);
    assert.equal(resident.land, alternate.land, mission.id);
  }
  for (const image of Object.values(BACKDROPS)) assert.ok(fs.existsSync(path.join(ROOT, "public", image)), image);
  for (const cast of Object.values(CAST)) {
    assert.ok(fs.existsSync(path.join(ROOT, "public", cast.sprite)), cast.sprite);
    if (cast.hero) assert.ok(fs.existsSync(path.join(ROOT, "public", cast.heroSprite)), cast.heroSprite);
  }
});

test("the thirty campaign stages retain every canonical curriculum anchor", () => {
  assert.equal(CAMPAIGN_STAGES.length, 30);
  assert.deepEqual([...new Set(CAMPAIGN_STAGES.flatMap(s => s.anchorIds))], QUEST_STOPS.map(s => s.id));
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
test("campaign teaching missions introduce each target before their practice", () => {
  for (const { descriptor, mission } of missions()) {
    assert.ok(mission.beats.some(b => b.key), descriptor.id);
    if (descriptor.curriculum.mode !== 'teach') continue;
    const taught = new Set();
    for (const beat of mission.beats) {
      if (beat.mechanic === MECHANICS.SIGNPOST) beat.targetIds.forEach(id => taught.add(id));
      else for (const id of beat.targetIds) if (descriptor.curriculum.targetIds.includes(id)) assert.ok(taught.has(id), beat.id);
    }
    for (const id of descriptor.curriculum.targetIds) assert.ok(taught.has(id), descriptor.id);
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
          const graphemes = beat.view.options.map(o => beat.view.direction === 'letter-to-sound' ? o.audio : o.grapheme);
          assert.equal(new Set(graphemes).size, graphemes.length, `${beat.id} duplicate graphemes`);
          assert.ok(beat.view.options.some(o => o.id === beat.key.optionId));
          const target = beat.targetIds[0];
          for (const [id, t] of Object.entries(beat.key.optionTargets)) if (id !== beat.key.optionId) assert.ok(isSoundDistinct(target, t), `${beat.id}: ${t} sounds like ${target}`);
          break;
        }
        case MECHANICS.WORD_FORGE: {
          assert.equal(beat.key.sequence.length, beat.view.slots);
          assert.ok(beat.key.sequence.every(id => beat.view.tiles.some(t => t.id === id)));
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
          assert.ok(beat.view.items.length >= 2);
          assert.equal(beat.view.bins.length, 2);
          const counts = Object.values(beat.key.bins).reduce((acc, b) => ({ ...acc, [b]: (acc[b] || 0) + 1 }), {});
          assert.ok(Object.values(counts).every(n => n > 0));
          break;
        }
        default: break;
      }
    }
  }
});

test("items are deterministic for a seed and different across replays", () => {
  const a = buildCampaignMission(CAMPAIGN_MISSIONS[0], {}, { replayOrdinal: 0 });
  const b = buildCampaignMission(CAMPAIGN_MISSIONS[0], {}, { replayOrdinal: 0 });
  const c = buildCampaignMission(CAMPAIGN_MISSIONS[0], {}, { replayOrdinal: 1 });
  assert.deepEqual(a.beats.map(x => x.view), b.beats.map(x => x.view));
  const echoA = a.beats.filter(x => x.mechanic === MECHANICS.ECHO_HUNT).map(x => x.view.options.map(o => o.grapheme).join(""));
  const echoC = c.beats.filter(x => x.mechanic === MECHANICS.ECHO_HUNT).map(x => x.view.options.map(o => o.grapheme).join(""));
  assert.notDeepEqual(echoA, echoC);
});

test("answer position never encodes the answer across the trail", () => {
  const groups = new Map();
  for (const { mission } of missions()) for (const beat of mission.beats) {
    const options = beat.view.options;
    if (!options || !beat.key?.optionId) continue;
    const counts = groups.get(options.length) || Array(options.length).fill(0);
    counts[options.findIndex(o => o.id === beat.key.optionId)] += 1;
    groups.set(options.length, counts);
  }
  assert.ok(groups.size > 0);
  for (const counts of groups.values()) {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total < counts.length * 4) continue;
    for (const n of counts) assert.ok(n > 0 && n < total * 0.7, `answer positions skewed: ${counts}`);
  }
});

// ── authority ──────────────────────────────────────────────────────────────
// Explicit shared-engine fixtures also cover mechanisms not currently selected
// by a campaign family. These are authority regressions, not old journey tests.
function firstBeat(mechanic) {
  const base = { stopId: 's3', stopIndex: 2, ordinal: 0 };
  return {
    [MECHANICS.ECHO_HUNT]: () => buildEchoHunt({ ...base, targetId: 'm' }),
    [MECHANICS.WORD_FORGE]: () => buildWordForge({ ...base, word: 'mat' }),
    [MECHANICS.BLEND_BRIDGE]: () => buildBlendBridge({ ...base, word: 'mat' }),
    [MECHANICS.SOUND_SORT]: () => buildSoundSort({ ...base, stop: TRAIL[1], targetA: 'n', targetB: 'i' }),
    [MECHANICS.HEART_LANTERN]: () => buildHeartLantern({ ...base, word: 'the' }),
    [MECHANICS.SIGNPOST]: () => buildSignpost({ ...base, targetIds: ['a', 'm'], index: 0 })
  }[mechanic]();
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

test("heart lantern: finding is available before narration ends; phrase is unscored", () => {
  const beat = firstBeat(MECHANICS.HEART_LANTERN, 2);
  let st = createBeatState(beat);
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

test("signpost: learners may continue before narration without fabricating heard cards or evidence", () => {
  const beat = firstBeat(MECHANICS.SIGNPOST);
  let st = createBeatState(beat);
  const early = resolveAction(beat, st, { type: "FINISH" });
  assert.equal(early.outcome.type, "complete");
  assert.deepEqual(early.state.cardsHeard, []);
  assert.equal(early.outcome.evidence, null);
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

test("explicit review evidence retains its target and support history", () => {
  const beat = buildEchoHunt({ stopId: 's3', stopIndex: 2, targetId: 'm', review: true });
  assert.equal(beat.review, true);
  assert.deepEqual(beat.targetIds, ['m']);
  const result = resolveAction(beat, createBeatState(beat), { type: 'CHOOSE', optionId: beat.key.optionId });
  const progress = recordEvidence(recordTaught(createProgress(), ['m']), result.outcome.evidence);
  assert.equal(progress.targets.m.independent, 1);
});

test("retained canonical source narration remains current: the clip on disk was made from the words on the card", () => {
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
