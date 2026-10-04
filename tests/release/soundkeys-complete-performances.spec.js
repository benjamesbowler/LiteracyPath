import { test, expect } from '@playwright/test';

test.use({ trace: 'off', video: { mode: 'on', size: { width: 1366, height: 768 } }, viewport: { width: 1366, height: 768 } });
const read = page => page.evaluate(() => window.__arcadePreviewSnapshot());

async function openFresh(page, difficulty) {
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:soundkeys', '1'));
  await page.goto(`/preview/game-overlay.html?game=soundkeys&difficulty=${difficulty}&sound=1`);
  await page.waitForFunction(() => window.__arcadePreviewSnapshot?.()?.performance?.delivered, null, { timeout: 30000 });
  const start = page.getByRole('button', { name: 'Start playing', exact: true }); if (await start.isVisible()) await start.click();
  await page.evaluate(() => {
    window.__keysOutingObserver = { frames: [], ends: [], inputs: [] };
    const emit = window.Howl.prototype._emit;
    window.Howl.prototype._emit = function (event, id, message) {
      if (event === 'end') window.__keysOutingObserver.ends.push({ src: this._src, at: performance.now(), id });
      return emit.call(this, event, id, message);
    };
    document.addEventListener('keydown', event => {
      if (event.repeat || !/^[1-8]$/.test(event.key)) return;
      const at = performance.now();
      requestAnimationFrame(frameAt => {
        const state = window.__arcadePreviewSnapshot();
        window.__keysOutingObserver.inputs.push({ key: event.key, at, frameAt, deltaMs: frameAt-at, round: state.round,
          contacts: state.performance.contacts.map(row => ({ character: row.character, index: row.index, separation: row.separation, rendered: row.rendered })) });
      });
    }, true);
    let previous; function record(at) {
      if (previous !== undefined && !window.__arcadePreviewSnapshot()?.paused) window.__keysOutingObserver.frames.push({ at, ms: at-previous });
      previous=at; window.__keysOutingObserver.frameId=requestAnimationFrame(record);
    } window.__keysOutingObserver.frameId=requestAnimationFrame(record);
  });
}

async function nativeToken(page, token) {
  const button = page.getByRole('button', { name: `Play ${token}`, exact: true });
  for (let index=0; !(await button.isVisible()) && index<4; index++) await page.getByRole('button', { name: 'Next sound keys', exact:true }).click();
  await expect(button).toBeVisible();
  const key=await button.locator('small').textContent();
  await page.locator('.lg-game-player-main').focus(); await page.keyboard.press(key);
}

for (const difficulty of ['easy', 'medium', 'hard']) {
  test(`${difficulty} completes all24 authored words through three bands with ordinary clock and real teaching ends`, async ({ page }) => {
    test.setTimeout(300000); const errors=[]; page.on('pageerror', error=>errors.push(error.message));
    await openFresh(page,difficulty); const before=await read(page); expect(before.round).toBe(0);
    const rounds=[], started=Date.now();
    for (let round=0;round<24;round++) {
      await page.waitForFunction(round=>window.__arcadePreviewSnapshot().round===round && !window.__arcadePreviewSnapshot().celebrating,round);
      await page.waitForFunction(round=>window.__arcadePreviewSnapshot().evidence.audioReceipts.some(row=>row.round===round && row.kind==='target'),round,{timeout:15000});
      const state=await read(page);
      expect(state.tokens).toEqual([]); expect(state.target.tokens.length).toBeGreaterThan(1);
      expect(await page.locator('.sk-cue').textContent()).not.toContain(state.target.display);
      for (const token of state.target.tokens) await nativeToken(page,token);
      const completed=await read(page); expect(completed.celebrating).toBe(true); expect(completed.evidence.completions.length).toBe(round+1);
      expect(completed.tokens).toEqual(state.target.tokens);
      expect(completed.evidence.firstResponses.filter(row=>row.round===round).every(row=>row.deliveryAtResponse==='delivered' && row.wordVisible===false)).toBe(true);
      rounds.push({round,word:state.target.id,units:state.target.tokens,world:completed.performance.world,completedAt:completed.clock,
        score:completed.score,first:completed.evidence.firstResponses.filter(row=>row.round===round)});
      if ([7,15,23].includes(round)) {
        await page.waitForTimeout(480);
        await page.screenshot({path:test.info().outputPath(`${difficulty}-band-${Math.floor(round/8)}-finale.png`)});
      }
    }
    const final=await read(page); expect(final.complete).toBe(true); expect(final.evidence.completions.length).toBe(24);
    expect(new Set(rounds.map(row=>row.word)).size).toBe(24);
    expect(new Set(rounds.map(row=>row.world))).toEqual(new Set(['meadow','dino','moonwood']));
    for(const row of final.evidence.firstResponses) expect(final.evidence.audioReceipts).toContainEqual(row.deliveryReceipt);
    await page.getByRole('button',{name:/^(Play this again|Replay level)$/}).waitFor({timeout:15000});
    const observed=await page.evaluate(()=>{cancelAnimationFrame(window.__keysOutingObserver.frameId);return window.__keysOutingObserver;});
    const steady=observed.frames.filter(row=>row.at>=observed.inputs[0].at+3000 && row.at<=observed.inputs.at(-1).at).map(row=>row.ms).sort((a,b)=>a-b);
    const profile={samples:steady.length,meanMs:steady.reduce((sum,n)=>sum+n,0)/(steady.length||1),p95Ms:steady[Math.ceil(steady.length*.95)-1],maxMs:steady.at(-1)};
    expect(observed.inputs.every(row=>row.contacts.some(contact=>contact.rendered && contact.separation<.0001))).toBe(true);
    expect(errors).toEqual([]);
    await test.info().attach(`${difficulty}-full-native-outing`,{body:JSON.stringify({status:'PASS',elapsedWallMs:Date.now()-started,rounds,final,observed,steadyProfile:profile,
      input:'Actual native1–8 after disclosed live key-bank selection; no controller advancement or virtual clock',humanListening:'UNKNOWN',physicalIpad:'UNKNOWN',hardwareMidi:'UNKNOWN',errors}),contentType:'application/json'});
    await page.getByRole('button',{name:/^(Play this again|Replay level)$/}).click();
    await page.waitForFunction(()=>window.__arcadePreviewSnapshot()?.round===0 && !window.__arcadePreviewSnapshot().complete);
    const replay=await read(page);expect(replay.tokens).toEqual([]);expect(replay.evidence.firstResponses).toEqual([]);expect(replay.score).toBe(0);
  });
}
