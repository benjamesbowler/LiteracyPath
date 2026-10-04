import { test, expect } from '@playwright/test';
import { rhymePopV2Ladder } from '../../src/utils/rhymePopV2Levels.js';
import { openRhyme, readRhyme, acceptRhyme } from './helpers/rhymePopNative.js';

test.use({ trace: 'off', video: { mode: 'on', size: { width: 1366, height: 768 } }, viewport: { width: 1366, height: 768 } });

for (const difficulty of ['easy', 'medium', 'hard']) {
  test(`${difficulty} completes every authored rhyme family through native swept shots with real target ends`, async ({ page }) => {
    test.setTimeout(480000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const families = [], start = Date.now();
    await openRhyme(page, difficulty);
    const seed = (await readRhyme(page)).sessionSeed, ladder = rhymePopV2Ladder(difficulty, seed);
    await page.evaluate(() => {
      window.__rhymeOuting = { frames: [], inputs: [], ends: [] };
      const emit = window.Howl.prototype._emit;
      window.Howl.prototype._emit = function (event, id, message) {
        if (event === 'end') window.__rhymeOuting.ends.push({ src: this._src, at: performance.now(), id });
        return emit.call(this, event, id, message);
      };
      document.addEventListener('keydown', event => {
        if (event.repeat || event.key !== ' ') return;
        const at = performance.now();
        requestAnimationFrame(frameAt => window.__rhymeOuting.inputs.push({ at, frameAt, nextFrameMs: frameAt - at }));
      }, true);
      let previous;
      function frame(at) {
        // No growing response history is copied during performance sampling.
        if (previous != null) window.__rhymeOuting.frames.push({ at, ms: at - previous });
        previous = at;
        window.__rhymeOuting.raf = requestAnimationFrame(frame);
      }
      window.__rhymeOuting.raf = requestAnimationFrame(frame);
    });
    for (let stage = 0; stage < ladder.length; stage++) {
      await page.waitForFunction(stage => {
        const s = window.__arcadePreviewSnapshot();
        return s.stage === stage && !s.roundPendingAdvance;
      }, stage);
      await page.waitForFunction(stage => window.__arcadePreviewSnapshot().evidence.audioReceipts.some(r => r.stage === stage && r.kind === 'target'), stage, { timeout: 15000 });
      const cue = await page.locator('.rp-cue').textContent();
      expect(cue).not.toContain(ladder[stage].targetWord);
      for (let unit = 0; unit < 6; unit++) await acceptRhyme(page, ladder[stage]);
      const completed = await readRhyme(page);
      expect(completed.roundPendingAdvance).toBe(true);
      expect(completed.currentTask.correctFound).toBe(6);
      expect(completed.evidence.completions.length).toBe(stage + 1);
      const rows = completed.evidence.acceptedResponses.filter(r => r.stage === stage);
      expect(new Set(rows.map(r => r.selected))).toEqual(new Set(ladder[stage].rhymingWords));
      for (const row of rows) {
        expect(row.source).toBe('keyboard');
        expect(row.deliveryAtResponse).toBe('delivered');
        expect(row.wordVisible).toBe(false);
        expect(completed.evidence.audioReceipts).toContainEqual(row.deliveryReceipt);
      }
      families.push({ stage, target: ladder[stage].targetWord, act: ladder[stage].act, at: completed.elapsedSeconds, rows });
      if ([0, Math.floor(ladder.length / 3), Math.floor(ladder.length * 2 / 3), ladder.length - 1].includes(stage))
        await page.screenshot({ path: test.info().outputPath(`${difficulty}-family-${stage}-complete.png`) });
      // Write each completed family immediately; interruption cannot erase
      // already exercised ordinary-clock native evidence.
      await test.info().attach(`${difficulty}-family-${stage}`, { body: JSON.stringify(families.at(-1)), contentType: 'application/json' });
    }
    await page.getByRole('button', { name: /^(Play this again|Replay level)$/ }).waitFor({ timeout: 15000 });
    const final = await readRhyme(page), expected = difficulty === 'easy' ? 144 : 180;
    expect(final.complete).toBe(true);
    expect(final.evidence.acceptedResponses).toHaveLength(expected);
    expect(final.evidence.completions).toHaveLength(ladder.length);
    expect(final.mistakes).toBe(0);
    expect(errors).toEqual([]);
    const observed = await page.evaluate(() => { cancelAnimationFrame(window.__rhymeOuting.raf); return window.__rhymeOuting; });
    const steady = observed.frames.filter(r => r.at >= observed.inputs[0].at + 3000 && r.at <= observed.inputs.at(-1).at).map(r => r.ms).sort((a, b) => a - b);
    const profile = { samples: steady.length, meanMs: steady.reduce((a, b) => a + b, 0) / steady.length, p95Ms: steady[Math.ceil(steady.length * .95) - 1], maxMs: steady.at(-1) };
    await test.info().attach(`${difficulty}-full-native-outing`, { body: JSON.stringify({ status: 'PASS', elapsedWallMs: Date.now() - start,
      families, final, observed, steadyProfile: profile, input: 'Actual native keyboard focus-ring and Space shots, genuine first swept collisions; ordinary game clock',
      humanListening: 'UNKNOWN', physicalIpad: 'UNKNOWN', errors }), contentType: 'application/json' });
    await page.getByRole('button', { name: /^(Play this again|Replay level)$/ }).click();
    await page.waitForFunction(() => window.__arcadePreviewSnapshot()?.stage === 0 && !window.__arcadePreviewSnapshot().complete);
    const replay = await readRhyme(page);
    expect(replay.acceptedWords).toEqual([]);
    expect(replay.evidence.firstResponses).toEqual([]);
    expect(replay.score).toBe(0);
  });
}
