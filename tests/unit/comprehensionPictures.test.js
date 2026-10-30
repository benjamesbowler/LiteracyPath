import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { COMPREHENSION_PASSAGES } from '../../src/content/comprehension/passages.js';
import { COMPREHENSION_PICTURES, passagePicture } from '../../src/content/comprehension/pictures.js';
import { validateComprehensionPicturePlans, checkComprehensionPictures } from '../../tools/checkComprehensionPictures.mjs';

import { COMPREHENSION_PICTURES as AUTHORING } from '../../tools/authoring/comprehensionPictures.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');

test('all 172 exact passages have independently authored, stable picture records', () => {
  assert.equal(COMPREHENSION_PASSAGES.length,172);
  assert.deepEqual(Object.keys(COMPREHENSION_PICTURES).sort(),COMPREHENSION_PASSAGES.map(p => p.id).sort());
  const scenes = new Set();
  for (const passage of COMPREHENSION_PASSAGES) {
    const picture = passagePicture(passage);
    assert.ok(picture,passage.id);
    assert.equal(picture.sourceText,passage.text);
    assert.equal(picture.textSha256,digest(passage.text));
    assert.equal(picture.src,`/images/comprehension/passages/${passage.id}.webp`);
    assert.equal(picture.referencePath,`/images/worksheets/${passage.character}-colouring.webp`);
    assert.ok(['scene','comic'].includes(picture.kind));
    assert.equal(picture.panels.length,picture.kind === 'scene' ? 1 : 3);
    for (const panel of picture.panels) {
      assert.ok(panel.scene.length > 35);
      assert.ok(panel.alt.length > 15);
      assert.ok(!scenes.has(panel.scene),`duplicated scene: ${passage.id}`);
      scenes.add(panel.scene);
    }
    assert.ok(AUTHORING[passage.id].prompt.includes(passage.text));
    assert.equal(picture.prompt,undefined);
    const metadata={...AUTHORING[passage.id]};delete metadata.prompt;
    assert.deepEqual(picture,metadata);
    assert.ok(picture.alt.length > 20);
  }
});

test('a changed or unknown passage never inherits stale picture support', () => {
  const passage = COMPREHENSION_PASSAGES[0];
  assert.equal(passagePicture({...passage,text:`${passage.text} `}),null);
  assert.equal(passagePicture({...passage,text:passage.text.replace('mud.','sand.')}),null);
  assert.equal(passagePicture({...passage,id:'missing-passage'}),null);
  assert.equal(passagePicture({id:'toString',text:'anything'}),null);
  for (const value of [null,undefined,{},'muddy-mat',{id:passage.id}]) assert.equal(passagePicture(value),null);
  assert.equal(passagePicture({...passage,title:'Changed title only'}),COMPREHENSION_PICTURES[passage.id]);
});

test('spatial scenes and state-change comics keep their concrete teaching beats', () => {
  assert.equal(COMPREHENSION_PICTURES['muddy-rain'].kind,'scene');
  assert.match(COMPREHENSION_PICTURES['muddy-rain'].panels[0].scene,/bottom hole directly into the bowl/);
  assert.match(COMPREHENSION_PICTURES['pip-sheep'].panels[0].scene,/two standing by the tree and one resting behind the bush/);
  const seeds = COMPREHENSION_PICTURES['fluff-seeds'].panels;
  assert.match(seeds[0].scene,/three distinct seeds/);
  assert.match(seeds[1].scene,/Two small plants/);
  assert.match(seeds[2].scene,/three small plants/);
  assert.match(COMPREHENSION_PICTURES['chips-boat'].panels[2].scene,/only the stick/);
  assert.match(COMPREHENSION_PICTURES['chompy-game'].panels[2].scene,/five stones total/);
  assert.match(COMPREHENSION_PICTURES['socks-these-boxes'].panels[0].scene,/labels each clearly read Books/);
});

test('plan gate catches stale hashes, missing coverage, invalid panels and paths', () => {
  const passage = COMPREHENSION_PASSAGES[0];
  const record = AUTHORING[passage.id];
  assert.deepEqual(validateComprehensionPicturePlans([passage],{[passage.id]:record}),[]);
  const broken = {[passage.id]:{...record,textSha256:'0'.repeat(64),panels:[],src:'/wrong.webp'},orphan:record};
  const failures = validateComprehensionPicturePlans([passage],broken).join('\n');
  assert.match(failures,/source text\/hash/);
  assert.match(failures,/authored panels/);
  assert.match(failures,/incorrect local image path/);
  assert.match(failures,/orphan picture plan/);
  assert.match(validateComprehensionPicturePlans([passage],{}).join(),/missing picture plan/);
});

test('normal asset gate fails on absent real raster/provenance; planning mode cannot claim decoded images', async () => {
  const root = new URL('../../.artifacts/comprehension/visual-plans/nonexistent-assets/',import.meta.url).pathname;
  const passage = COMPREHENSION_PASSAGES[0];
  const pictures = {[passage.id]:AUTHORING[passage.id]};
  const normal = await checkComprehensionPictures({root,passages:[passage],pictures});
  assert.match(normal.failures.join('\n'),/missing generation and visual-review provenance/);
  assert.match(normal.failures.join('\n'),/raster does not decode/);
  assert.equal(normal.decoded,0);
  const plan = await checkComprehensionPictures({root,passages:[passage],pictures,planOnly:true});
  assert.equal(plan.mode,'plan-only');
  assert.equal(plan.decoded,0);
  assert.ok(!plan.failures.some(f => /provenance|raster/.test(f)));
});

test('the browser picture module contains no Node-only hash dependency or live source import', () => {
  const source = readFileSync(new URL('../../src/content/comprehension/pictures.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\bimport\s/);
  assert.doesNotMatch(source,/node:crypto|createHash/);
});
