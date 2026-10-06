import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { projectCampaignScene } from '../../src/features/soundSeekers/rounded/campaignActivitySceneState.js';
import { CAMPAIGN_ACTIVITY_FAMILIES } from '../../src/features/soundSeekers/rounded/campaignPresentation.js';

const word = { id: 'public-word', mechanic: 'word_forge', familyId: 'rescue-bridge', view: { slots: 3, tiles: [{ id: 'd1', grapheme: 'd' }, { id: 'a', grapheme: 'a' }, { id: 'd2', grapheme: 'd' }] } };
const accepted = id => ({ type: 'progress', action: { type: 'PLACE_TILE', tileId: id } });

test('repeated accepted pieces advance separate bridge steps; undo and reload project exact settled state', () => {
  const first = projectCampaignScene(word, { placed: ['d1'] }, accepted('d1'));
  const second = projectCampaignScene(word, { placed: ['d1', 'a'] }, accepted('a'));
  const repeated = projectCampaignScene(word, { placed: ['d1', 'a', 'd2'], done: true }, { ...accepted('d2'), type: 'complete' });
  assert.equal(first.progress, 1); assert.equal(second.progress, 2); assert.equal(repeated.progress, 3);
  assert.equal(repeated.fraction, 1); assert.notEqual(first.key, second.key); assert.notEqual(second.key, repeated.key);
  const undone = projectCampaignScene(word, { placed: ['d1'] }, { type: 'removed', action: { type: 'REMOVE_LAST' } });
  assert.equal(undone.progress, 1); assert.equal(undone.accepted, false);
  const restored = projectCampaignScene(word, JSON.parse(JSON.stringify({ placed: ['d1', 'a'] })));
  assert.equal(restored.progress, second.progress); assert.equal(restored.accepted, false);
});

test('wrong answers, replay, model and support never create accepted motion or new progress', () => {
  for (const type of ['incorrect', 'model', 'ignored', 'removed']) {
    const scene = projectCampaignScene(word, { placed: ['d1'] }, { type, action: { type: 'PLACE_TILE', tileId: 'd2' } });
    assert.equal(scene.progress, 1); assert.equal(scene.accepted, false);
  }
  for (const type of ['HEARD_CARD', 'REQUEST_MODEL', 'REQUEST_TEXT_SUPPORT']) {
    assert.equal(projectCampaignScene(word, {}, { type: 'complete', action: { type } }).accepted, false);
  }
});

test('private key, target image and answer position cannot affect decorative projection', () => {
  const honest = projectCampaignScene(word, { placed: ['d1'] }, accepted('d1'));
  const guarded = { ...word, key: new Proxy({}, { get() { throw new Error('Private key accessed'); } }), targetIds: ['answer'], view: { ...word.view, target: { image: '/answer.webp' } } };
  assert.deepEqual(projectCampaignScene(guarded, { placed: ['d1'] }, accepted('d1')), honest);
  const choices = { id: 'choice', familyId: 'word-pop', mechanic: 'echo_hunt', view: { options: [{ id: 'left' }, { id: 'right' }] } };
  assert.equal(projectCampaignScene(choices, {}, { type: 'incorrect', action: { type: 'CHOOSE', optionId: 'right' } }).progress, 0);
});

test('held sorting uses receipt map, including actual accepted bin and final held item', () => {
  const beat = { id: 'sort', familyId: 'sound-herd', mechanic: 'sound_sort', view: { items: [{ id: 'x' }, { id: 'y' }], bins: [{ id: 'a' }, { id: 'b' }] } };
  const first = projectCampaignScene(beat, { itemIndex: 0, placed: { x: 'b' }, done: true }, { type: 'progress', action: { type: 'PLACE', binId: 'b', itemId: 'x' } });
  assert.equal(first.progress, 1); assert.equal(first.fraction, .5); assert.deepEqual(first.basketCounts, [0, 1]); assert.equal(first.arrivalBasket, 1);
  assert.equal(projectCampaignScene(beat, { itemIndex: 1, placed: { x: 'b', y: 'a' }, done: true }).progress, 2);
});

test('pause retains progress and replacement waits for authority completion', () => {
  const scene = projectCampaignScene(word, { paused: true, placed: ['d1', 'a'] }, accepted('a'));
  assert.equal(scene.paused, true); assert.equal(scene.progress, 2);
  const replacement = { ...word, view: { ...word.view, workshop: { mode: 'replace' } } };
  assert.equal(projectCampaignScene(replacement, { wordUnits: ['d', 'a', 'd'] }).progress, 0);
  assert.equal(projectCampaignScene(replacement, { done: true }).progress, 1);
});

test('all twelve families have dedicated scenes, no blanket idle loop, and reduced motion removes flights', () => {
  const source = fs.readFileSync(new URL('../../src/features/soundSeekers/rounded/CampaignActivityScene.jsx', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../../src/features/soundSeekers/rounded/campaign-activity-scene.css', import.meta.url), 'utf8');
  assert.equal(Object.keys(CAMPAIGN_ACTIVITY_FAMILIES).length, 12);
  for (const family of Object.keys(CAMPAIGN_ACTIVITY_FAMILIES)) assert.ok(source.includes(`'${family}':`), family);
  assert.equal(/<(?:svg|path|rect|circle|ellipse|polygon)\b/.test(source), false, 'Scene objects use painted media rather than shape construction');
  assert.equal(/\binfinite\b/.test(css), false);
  assert.ok(css.includes("[data-reduced-motion='true']"));
  assert.ok(source.includes('getAnimations({ subtree: true })'));
  assert.ok(source.includes("document.addEventListener('visibilitychange', update)"));
  assert.equal(/beat\.key|view\.target|view\.objectId/.test(source), false);
});
