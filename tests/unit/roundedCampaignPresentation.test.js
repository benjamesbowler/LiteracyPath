import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission, createCampaignBeatState, resolveCampaignAction } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { publicBeat } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { openingSceneAppearance } from '../../src/features/soundSeekers/v3/content/campaignLanguage.js';
import {
  campaignFamily, campaignDisplayChoices, campaignSceneDescriptor, campaignSlots, campaignMotion,
  campaignDestinationAppearance, campaignPropAppearance, CAMPAIGN_ACTIVITY_FAMILIES, CAMPAIGN_ACTIVITY_MECHANICS
} from '../../src/features/soundSeekers/rounded/campaignPresentation.js';

const progress = { targets: {} };
const corpus = CAMPAIGN_MISSIONS.flatMap(mission => {
  const beats = buildCampaignMission(mission, progress).beats;
  for (const beat of beats) if (beat.mechanic === 'sound_signpost') {
    for (const id of beat.targetIds) progress.targets[id] = { taught: true };
  }
  return beats;
});

test('every authored beat has a rounded physical family and supported mechanic', () => {
  // The reviewed contextual cues make four more authored word beats eligible.
  assert.equal(corpus.length, 3963);
  assert.deepEqual(new Set(corpus.map(beat => beat.familyId)), new Set(Object.keys(CAMPAIGN_ACTIVITY_FAMILIES)));
  assert.deepEqual(new Set(corpus.map(beat => beat.mechanic)), new Set(CAMPAIGN_ACTIVITY_MECHANICS));
  for (const beat of corpus) assert.ok(campaignFamily(publicBeat(beat)), beat.id);
});

test('the full corpus projects exact authority action IDs without needing private keys', () => {
  for (const privateBeat of corpus) {
    const beat = publicBeat(privateBeat), state = createCampaignBeatState(privateBeat);
    const choices = campaignDisplayChoices(beat, state);
    assert.equal(new Set(choices.map(choice => choice.id)).size, choices.length, beat.id);
    assert.deepEqual(choices, campaignDisplayChoices({ ...beat, key: { answer: 'wrong-private-data' } }, state));
    for (const choice of choices) {
      assert.ok(['CHOOSE', 'PLACE', 'PLACE_TILE'].includes(choice.action.type));
      assert.equal(Object.values(choice.action).includes(choice.id), true);
      assert.equal(Object.keys(choice.action).some(key => /answer|correct|evidence/i.test(key)), false);
    }
    if (beat.mechanic === 'sound_signpost') assert.deepEqual(choices, []);
  }
});

test('oral scenes retain every authored colour, size, count, owner and spatial attribute', () => {
  let scenes = 0, relations = 0, counts = 0, owners = 0;
  for (const privateBeat of corpus) {
    const beat = publicBeat(privateBeat);
    for (const choice of campaignDisplayChoices(beat)) {
      const source = beat.view.sceneObjects?.find(object => object.id === choice.icon);
      if (!source) continue;
      const descriptor = campaignSceneDescriptor(beat, choice);
      assert.deepEqual(descriptor.appearance, openingSceneAppearance(source));
      assert.equal(descriptor.label, source.label || choice.label || '');
      assert.equal(descriptor.carriedKind, beat.view.phase === 'delivery' ? beat.view.objectId || '' : '');
      scenes++;
      if (descriptor.appearance.relation) relations++;
      if (descriptor.appearance.count) counts++;
      if (descriptor.residentId) owners++;
    }
  }
  assert.ok(scenes > 5000);
  assert.ok(relations > 1500);
  assert.ok(counts > 0);
  assert.ok(owners > 0);
});

test('repeated pieces retain individual IDs and placed left-to-right order', () => {
  const privateBeat = corpus.find(beat => beat.mechanic === 'word_forge' && beat.key.word === 'dad' && !beat.view.workshop);
  assert.ok(privateBeat);
  const beat = publicBeat(privateBeat);
  const placed = privateBeat.key.sequence.slice(0, 2);
  const choices = campaignDisplayChoices(beat, { placed });
  assert.equal(choices.length, beat.view.tiles.length);
  assert.deepEqual(choices.filter(choice => choice.used).map(choice => choice.id).sort(), [...placed].sort());
  const slots = campaignSlots(beat, { placed });
  assert.deepEqual(slots.map(slot => slot.label), ['d', 'a', '']);
  assert.deepEqual(slots.slice(0, 2).map(slot => slot.tileId), placed);
  assert.equal(slots[2].marked, true);
});

test('pictured destination hosts retain flat, long, tall, wide and coloured authored distinctions', () => {
  const expectations = new Map([
    ['on the flat rock', ['shape', 'flat']],
    ['in the long basket', ['sizeVariant', 'long']],
    ['beside the tall post', ['heightVariant', 'tall']],
    ['on the wide mat', ['widthVariant', 'wide']],
    ['in the red tray', ['colour', 'red']],
    ['in the blue tray', ['colour', 'blue']]
  ]);
  const seen = new Set();
  for (const privateBeat of corpus) for (const choice of campaignDisplayChoices(publicBeat(privateBeat))) {
    const descriptor = campaignSceneDescriptor(privateBeat, choice);
    if (!descriptor?.destination || !descriptor.appearance.relation) continue;
    const expected = expectations.get(descriptor.label);
    if (!expected) continue;
    const [attribute, value] = expected;
    assert.equal(campaignDestinationAppearance(descriptor).landmark[attribute], value, descriptor.label);
    seen.add(descriptor.label);
  }
  assert.deepEqual(seen, new Set(expectations.keys()));
  const search = { destination: false, appearance: { colour: 'red', relation: 'in', landmark: { kind: 'basket' } } };
  assert.equal(campaignDestinationAppearance(search), search.appearance);
  assert.equal(campaignDestinationAppearance(search).landmark.colour, undefined);
});

test('long baskets use canonical horizontal length without changing authored appearances', () => {
  const authored = { sizeVariant: 'long', colour: 'red', count: 1 };
  const rendered = campaignPropAppearance('basket', authored);
  assert.equal(rendered.lengthVariant, 'long');
  assert.equal(rendered.sizeVariant, 'regular');
  assert.equal(rendered.colour, 'red');
  assert.deepEqual(authored, { sizeVariant: 'long', colour: 'red', count: 1 });
  assert.equal(campaignPropAppearance('post', authored), authored);
  const relation = { relation: 'in', landmark: { kind: 'basket', sizeVariant: 'long' } };
  assert.equal(campaignPropAppearance('ball', relation).landmark.lengthVariant, 'long');
  assert.equal(relation.landmark.sizeVariant, 'long');
});

test('a wrong workshop replacement keeps the whole base word and marked slot', () => {
  const privateBeat = corpus.find(beat => beat.view.workshop?.mode === 'replace');
  const initial = createCampaignBeatState(privateBeat);
  const wrong = privateBeat.view.tiles.find(tile => !privateBeat.key.sequence.includes(tile.id));
  const judged = resolveCampaignAction(privateBeat, initial, { type: 'PLACE_TILE', tileId: wrong.id });
  assert.equal(judged.outcome.type, 'incorrect');
  const slots = campaignSlots(publicBeat(privateBeat), judged.state);
  assert.deepEqual(slots.map(slot => slot.label), privateBeat.view.workshop.baseUnits);
  assert.equal(slots.filter(slot => slot.marked).length, 1);
  assert.equal(slots[privateBeat.view.workshop.slotIndex].marked, true);
});

test('sorting always routes the currently visible item, including exact partial resume', () => {
  const privateBeat = corpus.find(beat => beat.mechanic === 'sound_sort' && beat.view.items.length > 1);
  const beat = publicBeat(privateBeat);
  const actions = campaignDisplayChoices(beat, { itemIndex: 1 }).map(choice => choice.action);
  assert.equal(actions.length, 2);
  assert.ok(actions.every(action => action.itemId === beat.view.items[1].id));
});

test('only judged literacy outcomes start motion; replay, teaching and support do not', () => {
  const beat = publicBeat(corpus.find(beat => beat.mechanic === 'story_bridge'));
  const action = campaignDisplayChoices(beat)[0].action;
  assert.equal(campaignMotion(beat, {}, { type: 'correct', action }).accepted, true);
  for (const feedback of [
    { type: 'incorrect', action }, { type: 'model', action },
    { type: 'progress', action: { type: 'HEARD_CARD', targetId: 'a' } },
    { type: 'complete', action: { type: 'REQUEST_TEXT_SUPPORT' } },
    { type: 'correct' }
  ]) assert.equal(campaignMotion(beat, {}, feedback).accepted, false);
});
