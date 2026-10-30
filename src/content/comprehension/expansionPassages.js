import { EXPANSION_DRAFTS_A, EXPANSION_WORD_HELP_A } from './expansionPassagesA.js';
import { EXPANSION_DRAFTS_B, EXPANSION_WORD_HELP_B } from './expansionPassagesB.js';

// The second collection: one hundred original passages, also printable as a pack.
export const EXPANSION_COMPREHENSION_DRAFTS = [...EXPANSION_DRAFTS_A, ...EXPANSION_DRAFTS_B];
export const EXPANSION_WORD_HELP = { ...EXPANSION_WORD_HELP_A, ...EXPANSION_WORD_HELP_B };
export const COMPREHENSION_EXPANSION_IDS = EXPANSION_COMPREHENSION_DRAFTS.map(([id]) => id);
