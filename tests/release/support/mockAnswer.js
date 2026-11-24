import { expect } from '@playwright/test';
import { mockChoices } from '../../../src/utils/literacyMockPlanner.js';
import { mockConstructionLength, mockResponseValue } from '../../../src/utils/literacyMockResponse.js';

function spellingTiles(item, choices, prefix = '', used = []) {
  if (prefix === item.answer && used.length === mockConstructionLength(item)) return used;
  for (const choice of choices) {
    const next = prefix + choice.label;
    if (used.includes(choice.id) || !item.answer.startsWith(next)) continue;
    const result = spellingTiles(item, choices, next, [...used, choice.id]);
    if (result) return result;
  }
}

export async function fillMockQuestion(page, item, seed, correct) {
  if (item.alphabetSpelling) {
    const word = correct ? item.answer : item.answer + 's';
    await page.getByRole('textbox', { name:'Your spelling' }).fill(word);
    return word;
  }
  const choices = mockChoices(item, seed);
  let targets = item.format === 'build_word' ? spellingTiles(item, choices) :
    Array.isArray(item.answer) ? [...item.answer] : [item.answer];
  expect(targets?.length, item.id).toBeGreaterThan(0);
  if (!correct) {
    const different = choices.find(choice => !targets.includes(choice.id));
    if (different) targets = [different.id, ...targets.slice(1)];
    else [targets[0], targets[1]] = [targets[1], targets[0]];
  }
  const slots = page.locator('[data-mock-slot]');
  for (const [index, target] of targets.entries()) {
    if (item.format === 'select_text') {
      const tokens = [...item.choices].sort((a,b) => a.tokenIndex-b.tokenIndex);
      await page.locator('.literacy-mock-text-selection button').nth(tokens.findIndex(choice => choice.id === target)).click();
    } else {
      await page.locator('.literacy-mock-choice').nth(choices.findIndex(choice => choice.id === target)).click();
      if (await slots.count()) await slots.nth(index).click();
    }
  }
  return mockResponseValue(item, targets);
}
