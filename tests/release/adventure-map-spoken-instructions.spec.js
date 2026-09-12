import { expect, test } from "@playwright/test";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { adventureWordsRhyme, buildStationRounds } from "../../src/components/elQuest/elQuestEngine.js";
import { resolveAdventureRoundAudio } from "../../src/components/elQuest/adventureRoundAudio.js";
import { ADVENTURE_MAP_INSTRUCTION_AUDIO } from "../../src/data/generated/adventureMapInstructionAudio.generated.js";

const ROUTES = [
  { cycle: "cycle-1", station: "letters", mechanic: "letterPair", stage: "letter-press" },
  { cycle: "cycle-1", station: "sounds", mechanic: "soundChoice", stage: "sound-choice" },
  { cycle: "cycle-1", station: "hunt", mechanic: "sceneHunt", stage: "scene-hunt" },
  { cycle: "cycle-1", station: "quick", mechanic: "wordMemory", stage: "word-memory" },
  { cycle: "cycle-2", station: "build", mechanic: "missingLetter", stage: "missing-letter" },
  { cycle: "cycle-1", station: "trace", mechanic: "letterGrid", stage: "letter-grid" },
  { cycle: "cycle-1", station: "play", mechanic: "rhymePair", stage: "rhyme-pair" },
  { cycle: "cycle-1", station: "poem", mechanic: "compoundPicture", stage: "compound-picture" },
  { cycle: "cycle-1", station: "search", mechanic: "pictureSearch", stage: "picture-search" }
];

function authoredRounds(route) {
  return buildStationRounds(elSkillsBlockCycles.find(cycle => cycle.id === route.cycle), route.station, {
    seed: `adventure:${route.cycle}:${route.station}:initial-v3`
  });
}

async function installAudioRecorder(page, { rejectFirst = false, duration = 5 } = {}) {
  await page.addInitScript(({ rejectFirst, duration }) => {
    window.__adventurePlayedAudio = [];
    window.__adventurePausedAudio = [];
    window.__adventureAudioEvents = [];
    window.__adventureStopAt = null;
    document.addEventListener('click', event => {
      if (event.target.closest?.('button')?.textContent.trim() === 'Stop') window.__adventureStopAt = performance.now();
    }, true);
    let reject = rejectFirst;
    window.Audio = class TestAudio extends EventTarget {
      constructor(src = "") {
        super();
        this.src = src;
        this.currentTime = 0;
        this.volume = 1;
        this.readyState = 4;
        this.endTimer = null;
        this.playing = false;
      }
      load() { this.dispatchEvent(new Event("canplay")); }
      removeAttribute(name) { if (name === "src") this.src = ""; }
      play() {
        if (reject) { reject = false; return Promise.reject(new DOMException("Gesture required", "NotAllowedError")); }
        const src = new URL(this.src, location.href).pathname;
        window.__adventurePlayedAudio.push(src);
        window.__adventureAudioEvents.push({ src, at: performance.now() });
        this.playing = true;
        clearTimeout(this.endTimer);
        this.endTimer = setTimeout(() => { this.playing = false; this.dispatchEvent(new Event("ended")); }, duration);
        return Promise.resolve();
      }
      pause() {
        clearTimeout(this.endTimer);
        if (this.playing && this.src) window.__adventurePausedAudio.push(new URL(this.src, location.href).pathname);
        this.playing = false;
      }
    };
  }, { rejectFirst, duration });
}

const played = page => page.evaluate(() => window.__adventurePlayedAudio);
const clearPlayed = page => page.evaluate(() => { window.__adventurePlayedAudio = []; });

async function openRoute(page, route) {
  await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${route.cycle}&station=${route.station}`);
  const round = page.locator(`[data-quest-view="round"][data-round-type="${route.mechanic}"]`);
  await expect(round.locator(`[data-mechanic-stage="${route.stage}"]`)).toBeVisible();
  return round;
}

test("every simple game automatically speaks its current action and replays it", async ({ page }) => {
  test.setTimeout(90_000);
  await installAudioRecorder(page);
  for (const route of ROUTES) {
    const round = await openRoute(page, route);
    const expected = resolveAdventureRoundAudio(authoredRounds(route)[0]);
    const replay = round.getByRole("button", { name: "Hear instructions again" });
    await expect(round.locator('.adventure-round-frame__instruction > p')).toHaveText(expected.instructionText);
    await expect(replay).toHaveAttribute("data-instruction-audio", expected.instructionAudio);
    await expect.poll(() => played(page)).toContain(expected.instructionAudio);
    expect((await played(page))[0]).toBe(expected.instructionAudio);
    await expect(replay).toHaveAttribute("data-audio-state", "ready");
    await clearPlayed(page);
    await replay.click();
    await expect.poll(() => played(page)).toContain(expected.instructionAudio);
    expect((await played(page))[0]).toBe(expected.instructionAudio);
  }
});

test("the next rhyme question changes its spoken instruction automatically", async ({ page }) => {
  await installAudioRecorder(page);
  const route = ROUTES.find(route => route.mechanic === "rhymePair");
  const round = await openRoute(page, route);
  const words = await round.locator('.am-simple-picture-choice').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label').replace(/^Choose /, '')));
  const pair = words.flatMap((word, index) => words.slice(index + 1).filter(other => adventureWordsRhyme(word, other)).map(other => [word, other]))[0];
  expect(pair).toHaveLength(2);
  for (const word of pair) await round.getByRole("button", { name: `Choose ${word}`, exact: true }).click();
  const next = page.locator('[data-quest-view="round"][data-round-type="rhymeOdd"]');
  await expect(next).toBeVisible();
  const expected = resolveAdventureRoundAudio({ mechanicId: "rhymeOdd" });
  await expect(next.locator('.adventure-round-frame__instruction > p')).toHaveText("Which word does NOT rhyme?");
  await expect.poll(() => played(page)).toContain(expected.instructionAudio);
});

test("a real game gesture recovers denied autoplay while the answer still works", async ({ page }) => {
  await installAudioRecorder(page, { rejectFirst: true });
  const route = ROUTES[0];
  const round = await openRoute(page, route);
  const current = authoredRounds(route)[0];
  const instruction = resolveAdventureRoundAudio(current).instructionAudio;
  await expect(round.locator('[data-audio-state="unavailable"]').first()).toBeVisible();
  await clearPlayed(page);
  const wrong = current.choices.find(choice => choice !== current.answer);
  const choice = round.locator('.am-letter-press-choices').getByRole('button', { name: wrong, exact: true });
  await expect(choice).toBeEnabled();
  await choice.click();
  await expect.poll(() => played(page)).toContain(instruction);
  await expect(round.locator('[data-feedback-tone="retry"]').first()).toBeVisible();
});

test("Stop cancels active speech and pending feedback cues", async ({ page }) => {
  await installAudioRecorder(page, { duration: 5_000 });
  const route = ROUTES[0];
  const round = await openRoute(page, route);
  const current = authoredRounds(route)[0];
  const instruction = resolveAdventureRoundAudio(current).instructionAudio;
  await expect.poll(() => played(page)).toContain(instruction);
  const wrong = current.choices.find(choice => choice !== current.answer);
  await round.locator('.am-letter-press-choices').getByRole('button', { name: wrong, exact: true }).click();
  await clearPlayed(page);
  await round.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.locator('[data-quest-view="cycle"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__adventurePausedAudio)).toContain(instruction);
  await page.waitForTimeout(850);
  const afterStop = await page.evaluate(() => ({
    stopped: window.__adventureStopAt !== null,
    played: window.__adventureAudioEvents.filter(event => event.at >= window.__adventureStopAt)
  }));
  expect(afterStop.stopped).toBe(true);
  expect(afterStop.played).toEqual([]);
});

test("a hidden round falls quiet and repeats its current directions on return", async ({ page }) => {
  await installAudioRecorder(page, { duration: 5_000 });
  const route = ROUTES[0];
  const round = await openRoute(page, route);
  const instruction = resolveAdventureRoundAudio(authoredRounds(route)[0]).instructionAudio;
  await expect.poll(() => played(page)).toContain(instruction);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.__adventurePausedAudio)).toContain(instruction);
  await clearPlayed(page);
  await page.waitForTimeout(250);
  expect(await played(page)).toEqual([]);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => played(page)).toContain(instruction);
  await expect(round.locator('.am-letter-press-choices').getByRole('button').first()).toBeEnabled();
});

test("all recorded actions have audible decoded samples, not only valid MP3 durations", async ({ page }) => {
  await page.goto('/preview/child-surfaces.html?surface=adventure-map');
  const paths = [...new Set(Object.values(ADVENTURE_MAP_INSTRUCTION_AUDIO))];
  const results = await page.evaluate(async sources => {
    const context = new AudioContext();
    const checks = [];
    for (const src of sources) {
      const response = await fetch(src);
      const decoded = await context.decodeAudioData(await response.arrayBuffer());
      let peak = 0;
      for (const sample of decoded.getChannelData(0)) peak = Math.max(peak, Math.abs(sample));
      checks.push({ src, duration: decoded.duration, peakDb: 20 * Math.log10(peak) });
    }
    await context.close();
    return checks;
  }, paths);
  expect(results).toHaveLength(paths.length);
  for (const clip of results) {
    expect(clip.duration, clip.src).toBeGreaterThan(0.5);
    // The existing production audibility floor catches the old start-of-file
    // fade-out bug, whose valid playable MP3s peaked below -48dB.
    expect(clip.peakDb, clip.src).toBeGreaterThan(-40);
  }
});

test("map replay and station entry play native recordings to completion while input remains enabled", async ({ page }) => {
  await page.addInitScript(() => {
    window.__nativeAdventureAudio = [];
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      const clip = { src: this.src, started: false, ended: false, elapsed: 0 };
      window.__nativeAdventureAudio.push(clip);
      this.addEventListener('timeupdate', () => { clip.elapsed = Math.max(clip.elapsed, this.currentTime); });
      this.addEventListener('ended', () => { clip.ended = true; }, { once: true });
      const result = original.apply(this, args);
      result?.then(() => { clip.started = true; }).catch(() => {});
      return result;
    };
  });
  await page.goto('/preview/child-surfaces.html?surface=adventure-map');
  await page.locator('[data-map-instruction-audio]').click();
  await expect(page.locator('button[data-child-primary]')).toBeEnabled();
  await expect.poll(() => page.evaluate(() => window.__nativeAdventureAudio.some(clip => clip.src.includes('tap-the-card-with-the-arrow-to-start') && clip.started && clip.ended && clip.elapsed > 1))).toBe(true);
  await page.locator('button[data-child-primary]').click();
  await page.getByRole('button', { name: /Letter Match/ }).click();
  const round = page.locator('[data-quest-view="round"][data-round-type="letterPair"]');
  await expect(round.locator('.am-letter-press-choices').getByRole('button').first()).toBeEnabled();
  const instruction = await round.locator('[data-instruction-audio]').getAttribute('data-instruction-audio');
  await expect.poll(() => page.evaluate(path => window.__nativeAdventureAudio.some(clip => clip.src.endsWith(path) && clip.started && clip.ended && clip.elapsed > 0.5), instruction)).toBe(true);
});
