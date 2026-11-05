import test from 'node:test';
import assert from 'node:assert/strict';
import { collectQuestionArtDescriptors, renderQuestionArt } from '../../tools/soundSeekersQuestionArt/build.mjs';

const descriptors = collectQuestionArtDescriptors();
const placement = descriptor => renderQuestionArt(descriptor, { write: false });

test('delivery scenes never add a second copy of the object already depicted', async () => {
  const affected = descriptors.filter(d => d.destination && d.carriedKind === d.kind && d.appearance?.relation && d.appearance.landmark?.kind !== d.kind);
  assert.ok(affected.length >= 300);
  for (const descriptor of affected) {
    const layers = await placement(descriptor);
    assert.equal(layers.filter(layer => layer.kind === descriptor.kind && layer.clip === null).length, descriptor.appearance.count || 1, descriptor.label);
  }
});

test('high, middle and low posts stand on the same floor and differ in height', async () => {
  const posts = [];
  for (const elevation of ['high', 'middle', 'low']) {
    const layers = await placement({ kind: 'post', appearance: { elevation } });
    posts.push(layers.find(layer => layer.kind === 'post'));
  }
  assert.deepEqual(posts.map(p => p.top + p.height), [347, 347, 347]);
  assert.ok(posts[0].height > posts[1].height && posts[1].height > posts[2].height);
});

test('sun and shade are environments, with a chair below the sky or canopy', async () => {
  for (const landmark of ['sun', 'shade']) {
    const layers = await placement({ kind: 'seat', appearance: { relation: 'in', landmark: { kind: landmark } } });
    const seat = layers.find(layer => layer.kind === 'seat');
    const host = layers.find(layer => layer.kind === landmark);
    if (landmark === 'sun') {
      assert.ok(host.top + host.height < seat.top + seat.height * .25);
      assert.ok(host.left > seat.left + seat.width * .8);
    } else assert.ok(seat.top > host.top + host.height * .45);
    assert.ok(seat.top + seat.height >= 325);
  }
});

test('seeds and plants enter the actual mouth of every pot variant and are masked by its front rim', async () => {
  for (const lighting of ['', 'sunny', 'shady']) {
    const layers = await placement({ kind: 'pot', carriedKind: 'seed', destination: true, appearance: { ...(lighting ? { lighting } : {}) } });
    const [back, seed, front] = layers;
    assert.equal(back.kind, 'pot');
    assert.equal(seed.kind, 'seed');
    assert.equal(front.kind, 'pot');
    assert.ok(front.clip > 0);
    assert.ok(seed.top < front.top && seed.top + seed.height > front.top, lighting || 'plain');
    assert.ok(seed.left > back.left && seed.left + seed.width < back.left + back.width);
  }
});

test('under-bridge objects fit below the arch instead of in front of a bridge support', async () => {
  const under = descriptors.filter(d => d.appearance?.relation === 'under' && d.appearance.landmark?.kind === 'bridge');
  assert.ok(under.length > 0);
  for (const descriptor of under) {
    const layers = await placement(descriptor);
    const bridge = layers.find(layer => layer.kind === 'bridge');
    const object = layers.find(layer => layer.kind === descriptor.carriedKind);
    assert.ok(object.left > bridge.left + bridge.width * .3, descriptor.label);
    assert.ok(object.left + object.width < bridge.left + bridge.width * .75, descriptor.label);
    assert.ok(object.top > bridge.top + bridge.height * .65, descriptor.label);
  }
});

test('objects on a lever contact its raised handle instead of floating beside it', async () => {
  const onLever = descriptors.filter(d => d.appearance?.relation === 'on' && d.appearance.landmark?.kind === 'lever');
  assert.ok(onLever.length > 0);
  for (const descriptor of onLever) {
    const layers = await placement(descriptor);
    const lever = layers.find(layer => layer.kind === 'lever');
    const object = layers.find(layer => layer.kind === descriptor.kind);
    assert.ok(object.left + object.width / 2 > lever.left + lever.width * .8, descriptor.label);
    assert.ok(Math.abs(object.top + object.height - (lever.top + lever.height * .035)) <= 4, descriptor.label);
  }
});

test('pot contents are visibly recessed while short moss and tall cups remain recognizable', async () => {
  for (const carriedKind of ['cup', 'moss', 'fern', 'flower']) for (const lighting of ['', 'sunny', 'shady']) {
    const layers = await placement({ kind: 'pot', carriedKind, destination: true, appearance: { ...(lighting ? { lighting } : {}) } });
    const [, content, front] = layers;
    const hidden = content.top + content.height - front.top;
    assert.ok(hidden >= content.height * .3 && hidden <= content.height * .5, `${carriedKind}/${lighting || 'plain'}`);
  }
});
