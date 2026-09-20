import assert from 'node:assert/strict';
import test from 'node:test';
import { importV3Bank, listV3PublishedSkillIds } from '../../src/data/v3/v3Registry.js';

test('published sound constructions contain exactly the required units, so the last tile completes the response', async () => {
  let count = 0;
  for (const skill of listV3PublishedSkillIds()) {
    for (const question of await importV3Bank(skill)) {
      if ((question.templateType || question.formatType) !== 'PUT_SOUNDS_IN_ORDER') continue;
      count += 1;
      assert.ok(question.soundTiles.length > 1, question.id);
      assert.deepEqual(
        question.soundTiles.join('').split('').sort(),
        question.answer.split('').sort(),
        `${question.id} must not include surplus or missing sound tiles`
      );
    }
  }
  assert.ok(count > 0, 'The sound-construction branch must have actual published items.');
});
