import test from 'node:test';
import assert from 'node:assert/strict';
import { soundBeatLayout } from '../../src/components/learn/games/shared/soundBeatLayout.js';

test('Sound Beat reserves distinct collected-letter, note and press-pad regions', () => {
  for (const [width, height] of [[568, 256], [844, 326], [390, 780], [1024, 696]]) {
    const layout = soundBeatLayout(width, height);
    assert.ok(layout.slotsY + 28 < layout.stageY);
    assert.ok(layout.stageY < layout.hitY);
    assert.ok(layout.hitY + 30 < layout.padY - 30);
    assert.ok(layout.padY + 34 <= height);
  }
});
