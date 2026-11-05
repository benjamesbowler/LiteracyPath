import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {extractAssessmentPanel} from '../../tools/repairAssessmentPanelCrops.mjs';

test('panel extraction removes the neighboring scene and keeps all target pixels, aspect and output dimensions', async () => {
  const input = await sharp({create: {width: 100, height: 80, channels: 3, background: '#e00000'}}).composite([{input: await sharp({create: {width: 80, height: 60, channels: 3, background: '#0050d0'}}).png().toBuffer(), left: 10, top: 20}]).png().toBuffer();
  const result = await extractAssessmentPanel(input, {path: '/test.webp', width: 100, height: 80, hasAlpha: false, crop: {left: 10, top: 20, width: 80, height: 60}});
  const {data, info} = await sharp(result).raw().toBuffer({resolveWithObject: true});
  assert.equal(info.width, 100);
  assert.equal(info.height, 80);
  const pixels = Array.from({length: info.width * info.height}, (_, i) => data.subarray(i * info.channels, i * info.channels + 3));
  assert.equal(pixels.some(p => p[0] > 120 && p[1] < 80 && p[2] < 80), false, 'foreign red strip must be absent');
  assert.ok(pixels.filter(p => p[2] > 120 && p[0] < 80).length > 7000, 'complete target panel remains');
});

test('invalid bounds fail before an extraction can cut outside the reviewed source', async () => {
  await assert.rejects(extractAssessmentPanel(Buffer.alloc(0), {path: '/test.webp', width: 100, height: 80, crop: {left: 90, top: 0, width: 20, height: 80}}), /Invalid reviewed panel bounds/);
});
