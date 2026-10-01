import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PRESENT_AIR_WRITING_READY_COPY } from '../../src/copy/presentLearningCopy.js';
import { getLedaInstructionAudioPath, LEDA_PRODUCTION_VOICE, normalizeLedaAudioText } from '../../src/data/ledaProductionAudio.js';
import { STUDENT_SUPPORT_AUDIO_METADATA } from '../../src/data/generated/studentSupportAudio.generated.js';
import { buildCyclePresentation } from '../../src/utils/present/presentationBuilder.js';

test('every Present formation resolves the exact authored finger-ready recording with current provenance', () => {
  const audio = getLedaInstructionAudioPath(PRESENT_AIR_WRITING_READY_COPY);
  const metadata = STUDENT_SUPPORT_AUDIO_METADATA[normalizeLedaAudioText(PRESENT_AIR_WRITING_READY_COPY)];
  assert.ok(audio, 'the teacher action has a spoken readiness instruction');
  assert.equal(metadata.text, PRESENT_AIR_WRITING_READY_COPY);
  assert.equal(metadata.voice, LEDA_PRODUCTION_VOICE);
  assert.equal(metadata.provider, 'Google Cloud Text-to-Speech');
  assert.equal(metadata.sha256, createHash('sha256').update(readFileSync(`public${audio}`)).digest('hex'));
  assert.ok(metadata.durationSeconds > 0);
  const deck = buildCyclePresentation('cycle-3', { day: 'monday', format: 'extended' });
  const writingSlides = deck.html.match(/<section class="slide p-writing"[^>]+>/g);
  assert.ok(writingSlides.length > 0);
  for (const slide of writingSlides) assert.ok(slide.includes(`data-writing-ready-audio="${audio}"`));
});
