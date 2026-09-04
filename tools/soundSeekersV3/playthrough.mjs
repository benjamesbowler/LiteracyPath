// Sound Seekers v3 — automated playthrough for visual review.
//
// Drives whole stops through the accessible proxy buttons (the same buttons a
// switch user presses), screenshotting every beat, including wrong answers,
// the model, and the fix. Needs the dev server on 127.0.0.1:5173.
//
//   node tools/soundSeekersV3/playthrough.mjs <outDir> [stopsToPlay=1] [stopsAlreadyDone=0]
//   VW=1024 VH=768 node tools/soundSeekersV3/playthrough.mjs ~/Projects/tmp/ss-v3-review 1 12
//
// The third argument seeds progress so the run starts at that stop + 1.
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = process.argv[2] || 'tmp/ss-v3-review';
const STOPS = Number(process.argv[3] || 1);
const START = Number(process.argv[4] || 0);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const VW = Number(process.env.VW || 1470), VH = Number(process.env.VH || 831);
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
if (START > 0) {
  // seed progress so the run starts at stop START+1
  const completed = {}; for (let i = 1; i <= START; i++) completed['s' + i] = { at: 1, tokens: [], replayOrdinal: 0, plays: 1 };
  const seed = { v: 3, hero: 'speedy', heroChosen: true, journeyStep: START, currentStopId: 's' + (START + 1), completed, checkpoint: null, targets: {}, evidence: [], updatedAt: 1 };
  await page.addInitScript(p => { try { localStorage.setItem('lp-quest:child-surface-preview:v3', JSON.stringify(p)); } catch { /* storage blocked: start from the beginning */ } }, seed);
}
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
const BASE = process.env.BASE || 'http://127.0.0.1:5173';
await page.goto(`${BASE}/preview/child-surfaces.html?surface=sound-seekers`, { waitUntil: 'load', timeout: 60000 });
// a cold dev server compiles the whole app on first load — wait for the game root
try { await page.waitForSelector('.ss3', { timeout: 90000 }); } catch { console.log('game root never appeared; page errors:', errors); await browser.close(); process.exit(2); }
await page.waitForTimeout(1200);
const jsClick = async (sel, nth = 0) => page.evaluate(([s, n]) => { const els = document.querySelectorAll(s); const el = els[n]; if (el) { el.click(); return el.textContent; } return null; }, [sel, nth]);
const texts = async sel => page.evaluate(s => [...document.querySelectorAll(s)].map(e => e.textContent.trim()), sel);
let shot = 0;
const settle = async () => { for (let w = 0; w < 40; w++) { await page.waitForTimeout(150); if (!(await page.evaluate(() => window.__ss3busy?.()))) break; } await page.waitForTimeout(500); };
const snap = async name => { await page.screenshot({ path: `${OUT}/${String(shot++).padStart(2, '0')}-${name}.png` }); };

if (await page.locator('text=Start the trail').count()) { await page.click('text=Start the trail'); await page.waitForTimeout(1500); }
for (let stopN = 0; stopN < STOPS; stopN++) {
  await snap('map');
  // open meet card
  await page.click('.ss3__actions button');
  await page.waitForTimeout(700);
  await snap('meet');
  await jsClick('.ss3__card .ss3__btn--go');
  await page.waitForTimeout(2200);
  let lastBeat = -1;
  for (let step = 0; step < 220; step++) {
    if (await page.locator('.ss3__card >> text=is fixed').count()) { await snap('done'); await jsClick('.ss3__card .ss3__btn--go'); await page.waitForTimeout(2500); break; }
    const lanterns = await texts('.ss3__lanterns');
    const prompt = (await texts('.ss3__prompt-text'))[0] || '';
    const beatKey = prompt + '|' + lanterns.join('');
    if (beatKey !== lastBeat) { lastBeat = beatKey; await snap('beat-' + prompt.replace(/[^a-z0-9]+/gi, '_').slice(0, 30)); }
    // signposts: hear every card, then Got it
    if (/^Meet/.test(prompt) && !(await texts('.ss3__actions button')).some(t => /Next/.test(t))) {
      const hears = (await texts('.ss3__proxy')).map((t, i) => ({ t, i })).filter(({ t }) => /^Hear/.test(t));
      for (const h of hears) { await jsClick('.ss3__proxy', h.i); await settle(); }
      await snap('signpost-heard');
      const acts0 = await texts('.ss3__actions button');
      const gi = acts0.findIndex(t => /Got it/.test(t));
      if (gi >= 0) { await jsClick('.ss3__actions button', gi); await page.waitForTimeout(900); }
      continue;
    }
    // hear things once per beat before pressing on
    const heardKey = beatKey;
    const hearsNow = (await texts('.ss3__proxy')).map((t, i) => ({ t, i })).filter(({ t }) => /^Hear/.test(t) && !/Hear stone/.test(t));
    if (hearsNow.length && !(globalThis.__heard ||= new Set()).has(heardKey)) { globalThis.__heard.add(heardKey); for (const h of hearsNow) { await jsClick('.ss3__proxy', h.i); await settle(); } continue; }
    // special HUD buttons first
    const acts = await texts('.ss3__actions button');
    const special = acts.find(t => /Got it|Blend!|Find it|Done|Next/.test(t));
    if (special) {
      const idx = acts.indexOf(special);
      if (/Next/.test(special)) { await snap('room-done'); }
      await jsClick('.ss3__actions button', idx);
      await page.waitForTimeout(/Next/.test(special) ? 2600 : 900);
      continue;
    }
    const proxies = await texts('.ss3__proxy');
    if (!proxies.length) { await page.waitForTimeout(600); continue; }
    // signposts: hear everything
    const hearIdx = proxies.findIndex(t => /^Hear/.test(t));
    const pickIdx = proxies.findIndex(t => !/^Hear|^Show me|^Take the last/.test(t));
    if (hearIdx >= 0 && (pickIdx < 0 || step % 5 === 4)) { await jsClick('.ss3__proxy', hearIdx); await page.waitForTimeout(700); continue; }
    if (pickIdx >= 0) {
      // pick a "random" but deterministic candidate so we see wrong answers too
      let candidates = proxies.map((t, i) => ({ t, i })).filter(({ t }) => !/^Hear|^Show me|^Take the last/.test(t));
      // stones must be tapped in order; keys need a hear-tap then a try-tap
      const stones = candidates.filter(c => /^Stone/.test(c.t));
      globalThis.__picks = (globalThis.__picks || 0) + 1;
      let choice = stones.length ? stones[0] : candidates[globalThis.__picks % candidates.length];
      if (stones.length) { for (const st of stones) { await jsClick('.ss3__proxy', st.i); for (let w = 0; w < 30; w++) { await page.waitForTimeout(150); if (!(await page.evaluate(() => window.__ss3busy?.()))) break; } await page.waitForTimeout(500); } await snap('stones-tapped'); continue; }
      await jsClick('.ss3__proxy', choice.i);
      // wait for the hero to arrive and the pick to resolve
      for (let w = 0; w < 30; w++) { await page.waitForTimeout(150); const busy = await page.evaluate(() => window.__ss3busy?.()); if (!busy) break; }
      await page.waitForTimeout(900);
      if (step % 5 === 2) await snap('after-pick');
      continue;
    }
    await page.waitForTimeout(500);
  }
}
await snap('map-after');
console.log('errors:', errors.slice(0, 15));
await browser.close();
