import test from 'node:test';
import assert from 'node:assert/strict';
import { drawCampaignProp, CAMPAIGN_PROP_ROLES, campaignRelationPlacement } from '../../src/features/soundSeekers/v3/render/campaignProps.js';
import { CAMPAIGN_OBJECT_ROLES } from '../../src/features/soundSeekers/v3/content/campaignLearningPacks.js';
import { getCampaignLayout } from '../../src/features/soundSeekers/v3/content/campaignLayouts.js';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';

function drawing(kind, options = {}) {
  const commands = [];
  const ctx = new Proxy({}, {
    get: (_, method) => (...args) => commands.push([method, ...args]),
    set: (_, key, value) => { commands.push([key, value]); return true; }
  });
  const success = drawCampaignProp(ctx, kind, 200, 300, options);
  return { success, commands };
}

test('every exact learning role and scene object has an intentional drawing', () => {
  assert.ok(CAMPAIGN_OBJECT_ROLES.every(role => CAMPAIGN_PROP_ROLES.includes(role)));
  for (const role of CAMPAIGN_OBJECT_ROLES) {
    const result = drawing(role);
    assert.ok(result.success, role);
    assert.ok(result.commands.length > 10, role);
  }
  for (const mission of CAMPAIGN_MISSIONS) {
    for (const prop of getCampaignLayout(mission.id).rooms[0].objects) assert.ok(drawing(prop.kind).success, prop.kind);
  }
  assert.equal(drawing('unregistered-picture').success, false);
});

test('explicit semantic attributes produce distinguishable drawings without inspecting correctness', () => {
  for (const [kind, one, two] of [
    ['button', { sizeVariant: 'small' }, { sizeVariant: 'large' }],
    ['feather', { lengthVariant: 'long' }, { lengthVariant: 'short' }],
    ['handle', { shape: 'round' }, { shape: 'straight' }],
    ['shell', { shape: 'round' }, { shape: 'pointed' }],
    ['window', { shape: 'round' }, { shape: 'square' }],
    ['stone', { surface: 'rough' }, { surface: 'smooth' }],
    ['shell', { stripeColour: '#334155' }, { stripeColour: '#fef3c7' }],
    ['crate', { heightVariant: 'short' }, { heightVariant: 'tall' }],
    ['path', { widthVariant: 'wide' }, { widthVariant: 'narrow' }],
    ['shelf', { elevation: 'high' }, { elevation: 'low' }],
    ['gate', { open: true }, { open: false }],
    ['berry', { count: 1 }, { count: 3 }],
    ['basket', { accessory: { kind: 'ribbon', color: 'red' } }, { accessory: { kind: 'ribbon', color: 'blue' } }]
  ]) assert.notDeepEqual(drawing(kind, one).commands, drawing(kind, two).commands, kind);
  assert.deepEqual(drawing('cup', { correct: true }).commands, drawing('cup', { correct: false }).commands);
});

test('spatial prepositions create distinct object-and-landmark arrangements', () => {
  const on = drawing('cup', { relation: 'on', landmark: { kind: 'stool' } });
  const under = drawing('cup', { relation: 'under', landmark: { kind: 'stool' } });
  const beside = drawing('cup', { relation: 'beside', landmark: { kind: 'stool' } });
  assert.notDeepEqual(on.commands, under.commands);
  assert.notDeepEqual(under.commands, beside.commands);
  assert.notDeepEqual(on.commands, beside.commands);
});


test('shared relation geometry separates surfaces, under-space and container depth', () => {
  for (const kind of ['shelf','bed','bench','stool','rack','dock','bridge','cart','ledge']) {
    const under=campaignRelationPlacement({relation:'under',landmark:kind,size:125});
    const on=campaignRelationPlacement({relation:'on',landmark:kind,size:125});
    const beside=campaignRelationPlacement({relation:'beside',landmark:kind,size:125});
    assert.equal(under.supported,true,kind);
    assert.deepEqual(under.landmark,on.landmark,kind);
    assert.deepEqual(on.landmark,beside.landmark,kind);
    assert.ok(on.object.y < under.object.y-35,kind);
    assert.ok(beside.object.x > under.object.x+70,kind);
    assert.ok(under.landmark.groundSupport>0,kind);
  }
  const inside=campaignRelationPlacement({relation:'in',landmark:'basket'});
  const on=campaignRelationPlacement({relation:'on',landmark:'basket'});
  assert.ok(inside.object.y > on.object.y);
  for(const kind of ['basket','nest','post','rock','stone','root','crate'])assert.equal(campaignRelationPlacement({relation:'under',landmark:kind}).supported,false,kind);
});


test('relation surfaces follow actual host scale and only fabric drapes over a rail', () => {
 const regular=campaignRelationPlacement({relation:'on',landmark:{kind:'bed'},size:125});
 const large=campaignRelationPlacement({relation:'on',landmark:{kind:'bed',sizeVariant:'large',heightVariant:'tall'},size:125});
 assert.ok(large.object.y<regular.object.y);
 assert.ok(Math.abs(large.object.y-(large.landmark.y-.46*large.landmark.size*1.17*1.3))<1e-8);
 const rail=campaignRelationPlacement({relation:'on',landmark:'rail',objectKind:'cup'});
 const towel=campaignRelationPlacement({relation:'on',landmark:'rail',objectKind:'towel'});
 const cloth=campaignRelationPlacement({relation:'on',landmark:'rail',objectKind:'cloth'});
 assert.ok(towel.object.y>cloth.object.y&&cloth.object.y>rail.object.y);
});
