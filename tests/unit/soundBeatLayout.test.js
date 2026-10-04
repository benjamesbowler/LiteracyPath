import test from 'node:test';
import assert from 'node:assert/strict';
import { soundBeatLayout, soundBeatCollectedRail } from '../../src/components/learn/games/shared/soundBeatLayout.js';

test('Sound Beat reserves distinct collected-letter, note and press-pad regions', () => {
  for (const [width, height] of [[568, 256], [844, 326], [390, 780], [1024, 696]]) {
    const layout = soundBeatLayout(width, height);
    assert.ok(layout.slotsY + 28 < layout.stageY);
    assert.ok(layout.stageY < layout.hitY);
    assert.ok(layout.hitY + 30 < layout.padY - 30);
    assert.ok(layout.padY + 34 <= height);
  }
});

test('long collected words retain13px legibility and scroll through their accepted prefix within320px', () => {
  const notes = ['The', 'beautiful', 'garden', 'has', 'different', 'flowers'];
  for (let beat = 0; beat <= notes.length; beat += 1) {
    const slots = soundBeatCollectedRail(notes, beat, 320);
    assert.ok(slots.every(slot => slot.fontSize >= 13 && slot.x >= 12 && slot.x + slot.width <= 308));
    assert.ok(slots.some(slot => slot.index === Math.min(notes.length - 1, beat)));
    for (let index = 1; index < slots.length; index += 1) assert.ok(slots[index].x - slots[index - 1].x - slots[index - 1].width >= 7.99);
  }
});
