import fs from 'node:fs';
import crypto from 'node:crypto';
import { expect, test } from '@playwright/test';
import { getLetterLeapEncodingPlans } from '../../src/data/letterLeapEncodingContent.js';
import { driveLeap, leapCheckpoint } from './letterLeapNative.js';

test.use({ trace: 'off' });

const sourceFiles = [
  'src/components/learn/games/games/LetterLeapGame.jsx','src/components/learn/games/games/LetterLeapGame.css',
  'src/components/learn/games/games/letterLeapSceneKit.js','src/components/learn/games/games/letterLeapArt.generated.js',
  'src/components/learn/games/games/letterLeapContact.js','src/components/learn/games/games/letterLeapLearning.js',
  'src/components/learn/games/games/letterLeapSession.js','src/components/learn/games/games/letterLeapCue.js',
  'src/components/learn/games/games/letterLeapMetrics.js','src/components/learn/games/shared/registeredPalArt.js',
  'src/components/learn/games/shared/physicalPalFallback.js','src/components/learn/games/GamePlayer.jsx',
  'src/components/learn/games/arcadeLearningContext.js','src/utils/learnGamesProgress.js','src/utils/audio/playOwnedClip.js',
  'src/data/arcadeContentVersions.js','src/data/learnGamesData.js','src/styles/learn-games.css','src/game-overlay-preview.jsx',
  'src/data/letterLeapEncodingContent.js','src/data/childAssets.js','src/data/ledaProductionAudio.js',
  'source-art/arcade/physical-worlds/letter-leap/manifest.json','tests/release/letterLeapNative.js',
  'tests/release/letter-leap-authored-complete.spec.js',
];
const sourceHashes = () => Object.fromEntries(sourceFiles.map(file => [file,
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));

for (const difficulty of ['easy','medium','hard']) {
  test(`Letter Leap completes all ten ${difficulty} courses through real native contacts`, async ({ page }, testInfo) => {
    test.setTimeout(5400000);
    const seed = 3;
    const rounds = getLetterLeapEncodingPlans(difficulty, seed);
    const expectedWords = rounds.flatMap(plan => plan.mode === 'sentence' ? plan.targets.flat() : plan.targets).length;
    const proof = { difficulty, seed, expectedWords, clock: 'ordinary wall clock; fixed controller simulation',
      trace: 'off', observer: 'bounded read-only current encounter/nearby collision geometry',
      sourceStart: sourceHashes(), checkpoints: [], contactFrames: [], errors: [] };
    page.on('pageerror', error => proof.errors.push(error.message));
    const write = () => fs.writeFileSync(testInfo.outputPath('outing.json'), JSON.stringify(proof, null, 2));
    await page.addInitScript(({ difficulty, seed }) => {
      localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview', JSON.stringify({ games: {
        'letter-leap': { checkpoints: { [difficulty]: { level: 0, totalLevels: 10, sessionSeed: seed, chapter: 0 } } }
      } }));
    }, { difficulty, seed });
    await page.goto(`/preview/game-overlay.html?game=letter-leap&difficulty=${difficulty}&sound=1&music=0`);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.letter-leap')?.__letterLeapMotion?.()?.running);
    await page.locator('.lg-game-player-main').focus();
    await page.waitForFunction(() => Object.values(document.querySelector('.letter-leap').__letterLeapSnapshot().authoredArt.delivery.hero)
      .every(value => value === 'delivered'));
    await page.screenshot({ path: testInfo.outputPath('opening.png') });
    let lastWord = '', lastStage = -1, lastCompletion = -1;
    let distinctCount = 0, lastDistinctAt = Date.now();
    const diagnosticMotion = [], diagnosticInputs = [];
    const captured = new Set();
    proof.startedAt = Date.now();
    try {
      const result = await driveLeap(page, {
        timeout: 5250000, until: state => state.phase === 'complete',
        onInput: row => { diagnosticInputs.push(row); if (diagnosticInputs.length > 80) diagnosticInputs.shift(); },
        onSample: ({ state }) => {
          diagnosticMotion.push({ at: Date.now(), ...state });
          if (diagnosticMotion.length > 45) diagnosticMotion.shift();
          if (state.wordsDone > distinctCount) { distinctCount = state.wordsDone; lastDistinctAt = Date.now(); }
          // A driver diagnostic stops a repeated no-credit navigation loop
          // while the page is still available for actual geometry/frame proof.
          // It never awards a word or relaxes full-completion acceptance.
          if (Date.now() - lastDistinctAt > 180000) throw new Error(`Native navigation plateau after ${distinctCount} distinct words`);
        },
        onCheckpoint: async state => {
          const wordKey = [state.stageIndex,state.legIndex,state.wordIndex].join(':');
          if (state.phase === 'playing' && state.letterIndex === 0 && wordKey !== lastWord) {
            lastWord = wordKey;
            // Observe the actual audio end and displayed image decode. Waiting
            // here is a learner listening action, never a game-clock override.
            await expect.poll(() => page.evaluate(() => {
              const cue = document.querySelector('.letter-leap').__letterLeapMotion().cue;
              return [cue.delivery, cue.pictureDelivery];
            }), { timeout: 10000, intervals: [150] }).toEqual(['delivered','delivered']);
          }
          if (state.wordsDone !== lastCompletion || state.stageIndex !== lastStage) {
            lastCompletion = state.wordsDone; lastStage = state.stageIndex;
            proof.checkpoints.push({ at: Date.now(), stage: state.stageIndex, leg: state.legIndex,
              word: state.wordIndex, slot: state.letterIndex, wordsDone: state.wordsDone, wrongHits: state.wrongHits,
              hearts: state.hearts, phase: state.phase });
            write();
          }
          // Three deliberate render checkpoints retain contact/art details;
          // no growing evidence snapshot is requested during movement.
          if ([0,4,9].includes(state.stageIndex) && state.phase === 'word-result' && !captured.has(state.stageIndex)) {
            captured.add(state.stageIndex);
            const view = await leapCheckpoint(page);
            proof.contactFrames.push({ stage: state.stageIndex, word: view.word, player: view.player,
              hero: view.authoredArt.hero, delivery: view.authoredArt.delivery, motor: view.learning.motorEvents });
            await page.screenshot({ path: testInfo.outputPath(`course-${state.stageIndex + 1}-native-contact.png`) });
            write();
          }
        },
      });
      proof.nativeMetrics = result.metrics;
      proof.final = await leapCheckpoint(page);
      proof.performanceContext = 'Ordinary internal rAF/submission measurements during native play with compact observer; no tracing/video. Numeric checks are owner-selected headless desktop diagnostic alarms, not an approved physical-device support policy or display latency claim';
      proof.saved = await page.evaluate(() => JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')));
      expect(proof.final.wordsDone).toBe(expectedWords);
      expect(new Set(proof.final.learning.completions).size).toBe(expectedWords);
      expect(proof.final.learning.completions).toHaveLength(expectedWords);
      expect(new Set(proof.final.learning.firstResponses.map(row => row.responseId)).size).toBe(proof.final.learning.firstResponses.length);
      expect(proof.final.learning.firstResponses.some(row => row.deliveryAtResponse === 'delivered' && row.pictureDelivery === 'delivered')).toBe(true);
      expect(proof.final.learning.acceptedResponses.every(row => row.correct)).toBe(true);
      const savedCompletion = proof.saved.games['letter-leap'].practiceRecord.completions.at(-1);
      expect(savedCompletion.contentVersion).toBe('letter-leap-v2');
      expect(savedCompletion.practiceContext.construct).toBe('heard-word-grapheme-encoding');
      expect(savedCompletion.practiceContext.masteryClaim).toBe(false);
      expect(savedCompletion.practiceContext.motorCreatesEvidence).toBe(false);
      expect(proof.checkpoints.filter(row => row.phase === 'playing').map(row => row.stage)).toContain(9);
      expect(proof.errors).toEqual([]);
      expect(proof.final.performance.frameInterval.count).toBeGreaterThanOrEqual(120);
      expect(proof.final.performance.frameInterval.meanMs).toBeLessThan(42);
      expect(proof.final.performance.inputToSubmission.p95Ms).toBeLessThan(90);
      await page.screenshot({ path: testInfo.outputPath('all-ten-courses-complete.png') });
      proof.status = 'passed';
    } catch (error) {
      proof.status = 'failed'; proof.failure = error.message;
      proof.navigationDiagnostic = { motion: diagnosticMotion, inputs: diagnosticInputs };
      proof.failureCheckpoint = await leapCheckpoint(page).catch(() => null);
      await page.screenshot({ path: testInfo.outputPath('failure.png') }).catch(() => {});
      throw error;
    } finally {
      proof.endedAt = Date.now(); proof.sourceEnd = sourceHashes();
      proof.sourcesUnchanged = JSON.stringify(proof.sourceStart) === JSON.stringify(proof.sourceEnd);
      write();
      expect(proof.sourcesUnchanged, 'all imported gameplay/art/shared sources stay frozen during the outing').toBe(true);
    }
  });
}
