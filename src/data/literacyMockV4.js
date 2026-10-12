import { buildLiteracyMockWordLaddersV4 } from './literacyMockWordLaddersV4.js';
import { correctLiteracyMockPhonicsV4, buildLiteracyMockPhonicsLaddersV4 } from './literacyMockPhonicsLaddersV4.js';
import { correctLiteracyMockDemandV4, buildLiteracyMockDemandItemsV4 } from './literacyMockDemandCorrectionsV4.js';
import { correctLiteracyMockLanguageAccessV4, buildLiteracyMockLanguageAccessV4 } from './literacyMockLanguageAccessV4.js';
import { correctLiteracyMockComprehensionV4, buildLiteracyMockComprehensionLaddersV4 } from './literacyMockComprehensionLaddersV4.js';
import { correctLiteracyMockContextV4, buildLiteracyMockContextLaddersV4 } from './literacyMockContextCorrectionsV4.js';
import { literacyMockTaskKey } from '../utils/literacyMockConditions.js';
import { hasIndependentLiteracyMockLadder } from '../utils/literacyMockPlanner.js';

/** Versioned authoring corrections never change a published historical item. */
export function buildLiteracyMockV4(authored, normalize) {
  const corrected = authored.map(item => normalize(correctLiteracyMockContextV4(correctLiteracyMockComprehensionV4(correctLiteracyMockLanguageAccessV4(
    correctLiteracyMockDemandV4(correctLiteracyMockPhonicsV4(item), authored), authored), authored), authored)));
  const additions = [
    ...buildLiteracyMockWordLaddersV4(corrected),
    ...buildLiteracyMockPhonicsLaddersV4(corrected),
    ...buildLiteracyMockDemandItemsV4(corrected),
    ...buildLiteracyMockLanguageAccessV4(corrected),
    ...buildLiteracyMockComprehensionLaddersV4(corrected),
    ...buildLiteracyMockContextLaddersV4(corrected),
  ].map(normalize);
  const bank = [...corrected, ...additions];
  if (new Set(bank.map(item => item.id)).size !== bank.length) throw new Error('Mock v4 question IDs must be unique.');
  // The planner rechecks independent capacity after exposure exclusions. This
  // authored marker also lets the private canonical server reject fixed tasks
  // in a new mixed form, instead of trusting a client-supplied difficulty claim.
  const tasks = new Map();
  const tutorials = new Set(bank.filter(item => item.tutorialOnly).map(item => item.stimulusKey));
  for (const item of bank.filter(item => item.mediaReady && !item.tutorialOnly && !tutorials.has(item.stimulusKey))) {
    const key = literacyMockTaskKey(item);
    if (!tasks.has(key)) tasks.set(key, []);
    tasks.get(key).push(item);
  }
  const levels = items => hasIndependentLiteracyMockLadder(...[1, 2].map(level => items.filter(item => item.level === level && item.demandCeiling !== 1)));
  const eligible = new Set([...tasks].filter(([, items]) => levels(items)).map(([key]) => key));
  return bank.map(item => {
    const revised = { ...item, adaptiveMixedEligible: eligible.has(literacyMockTaskKey(item)) && item.demandCeiling !== 1 };
    revised.itemSnapshot = { ...item.itemSnapshot, adaptiveMixedEligible: revised.adaptiveMixedEligible };
    return revised;
  });
}
