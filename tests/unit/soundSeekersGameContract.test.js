import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import {
  createSoundSeekersState,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";

let CampaignMap;
let CreatorSheet;
let FieldJournal;
let RewardReveal;
let SettingsSheet;
let vite;

test.before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ CampaignMap } = await vite.ssrLoadModule("/src/features/soundSeekers/ui/CampaignMap.jsx"));
  ({ CreatorSheet } = await vite.ssrLoadModule("/src/features/soundSeekers/ui/CreatorSheet.jsx"));
  ({ FieldJournal } = await vite.ssrLoadModule("/src/features/soundSeekers/ui/FieldJournal.jsx"));
  ({ RewardReveal } = await vite.ssrLoadModule("/src/features/soundSeekers/ui/RewardReveal.jsx"));
  ({ SettingsSheet } = await vite.ssrLoadModule("/src/features/soundSeekers/ui/SettingsSheet.jsx"));
});

test.after(async () => vite?.close());

const noop = () => {};
const mapActions = Object.freeze({
  onStart: noop,
  onOpenJournal: noop,
  onOpenCreator: noop,
  onOpenSettings: noop,
  onExit: noop
});

const completedSeedwakeSummary = Object.freeze({
  kind: "sound_seekers_mission_committed",
  stopId: "s1",
  journeyStep: 1,
  repairId: "wake-seeds",
  relationshipBeatId: "seedwake-s1-moss-trust",
  consequenceId: "seedwake-path-lit"
});
const defaultAppearance = Object.freeze({
  schemaVersion: 1,
  bodyShapeId: "body-shape-sprout",
  paletteTokenId: "player-palette-sunrise",
  accessories: Object.freeze({ back: null, head: null, neck: null, held: null })
});

test("campaign map exposes all eight worlds, all forty authored expeditions, one next mission, and trail tools", () => {
  const state = createSoundSeekersState();
  const html = renderToStaticMarkup(React.createElement(CampaignMap, {
    state,
    ...mapActions
  }));
  assert.match(html, /data-sound-seekers-campaign-map=""/u);
  for (const chapter of SOUND_SEEKERS_CHAPTERS) assert.match(html, new RegExp(chapter.title, "u"));
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) assert.match(html, new RegExp(expedition.title, "u"));
  assert.equal((html.match(/class="ss-map__chapter"/gu) || []).length, 8);
  assert.equal((html.match(/class="ss-map__stop"/gu) || []).length, 40);
  assert.match(html, /Begin expedition/u);
  for (const tool of ["Field journal", "My seeker", "Game settings", "Leave trail"]) {
    assert.match(html, new RegExp(tool, "u"));
  }
});

test("campaign map labels an exact resumable mission and keeps completed repairs visible", () => {
  const base = createSoundSeekersState();
  const state = normalizeSoundSeekersState({
    ...base,
    trail: {
      ...base.trail,
      routeCursor: 2,
      completedStopIds: ["s1"],
      repairs: { "wake-seeds": true }
    },
    checkpoint: {
      ...base.checkpoint,
      mission: null
    }
  });
  const html = renderToStaticMarkup(React.createElement(CampaignMap, { state, ...mapActions }));
  assert.match(html, /Landmark repaired/u);
  assert.match(html, /Bramble Gate/u);
  assert.match(html, /Begin expedition/u);
  assert.match(html, /1\/40/u);
});

test("settings separate movement assistance from presentation and do not expose learning answers", () => {
  const settings = createSoundSeekersState().settings;
  const html = renderToStaticMarkup(React.createElement(SettingsSheet, {
    settings,
    onChange: noop,
    onClose: noop
  }));
  assert.match(html, /Movement help/u);
  assert.match(html, /Look and sound/u);
  assert.match(html, /change movement and presentation—not the reading target/u);
  for (const label of ["Move for me", "Slower movement", "Gentle travel", "Larger buttons", "Extra response time", "Calmer scenes", "Reduce motion", "Higher contrast", "Music", "Voices and sounds"]) {
    assert.match(html, new RegExp(label, "u"));
  }
  assert.doesNotMatch(html, /show answer|easier word|skip reading|automatic correct/iu);
});

test("journal and reward surfaces derive only from canonical durable progress", () => {
  const state = createSoundSeekersState();
  const journal = renderToStaticMarkup(React.createElement(FieldJournal, { state, onClose: noop }));
  assert.match(journal, /Field journal/u);
  assert.match(journal, /Your first word discovery will appear here/u);
  assert.equal((journal.match(/Undiscovered world gift/gu) || []).length, 8);

  const reward = renderToStaticMarkup(React.createElement(RewardReveal, {
    summary: completedSeedwakeSummary,
    onContinue: noop
  }));
  assert.match(reward, /Wake the Seed Lanterns is repaired!/u);
  assert.match(reward, /data-wonder-effect-id=/u);
  for (const summary of [
    { stopId: "s1", repairId: "wake-seeds" },
    { ...completedSeedwakeSummary, kind: "forged" },
    { ...completedSeedwakeSummary, journeyStep: 0 },
    { ...completedSeedwakeSummary, relationshipBeatId: "forged-beat" },
    { ...completedSeedwakeSummary, consequenceId: "forged-consequence" },
    { ...completedSeedwakeSummary, correct: true }
  ]) {
    assert.throws(() => renderToStaticMarkup(React.createElement(RewardReveal, {
      summary,
      onContinue: noop
    })), /exact completed expedition summary/u);
  }
});

test("journal world-gift total counts the eight chapter gifts rather than expedition consequences", () => {
  const base = createSoundSeekersState();
  const state = normalizeSoundSeekersState({
    ...base,
    trail: {
      ...base.trail,
      routeCursor: 6,
      completedStopIds: ["s1", "s2", "s3", "s4", "s5"]
    },
    rewards: {
      claimedIds: [
        "seedwake-path-lit",
        "fern-steps-sing",
        "rook-stones-turn",
        "otter-ford-open",
        "bramble-gate-blooming"
      ]
    }
  });
  const journal = renderToStaticMarkup(React.createElement(FieldJournal, { state, onClose: noop }));
  assert.match(journal, /<strong>1<\/strong> world gift/u);
  assert.equal((journal.match(/data-owned="true"/gu) || []).length, 1);
});

test("every rendered Task 5 action has an explicit callable boundary", () => {
  const state = createSoundSeekersState();
  for (const action of Object.keys(mapActions)) {
    assert.throws(() => renderToStaticMarkup(React.createElement(CampaignMap, {
      state,
      ...mapActions,
      [action]: undefined
    })), /action/u, `CampaignMap ${action}`);
  }

  for (const [name, Component, props, missing] of [
    ["CreatorSheet", CreatorSheet, {
      appearance: defaultAppearance, onChange: noop, onClose: noop
    }, ["onChange", "onClose"]],
    ["SettingsSheet", SettingsSheet, {
      settings: state.settings, onChange: noop, onClose: noop
    }, ["onChange", "onClose"]],
    ["FieldJournal", FieldJournal, { state, onClose: noop }, ["onClose"]],
    ["RewardReveal", RewardReveal, {
      summary: completedSeedwakeSummary, onContinue: noop
    }, ["onContinue"]]
  ]) {
    for (const action of missing) {
      assert.throws(() => renderToStaticMarkup(React.createElement(Component, {
        ...props,
        [action]: undefined
      })), /action/u, `${name} ${action}`);
    }
  }
});
