import { expect, test } from "@playwright/test";

import { ADVENTURE_MAP_INSTRUCTIONS } from "../../src/components/elQuest/adventureRoundAudio.js";

const MECHANIC_ROUTES = [
  {
    cycle: "cycle-1",
    station: "letters",
    mechanic: "letterPair",
    stage: "letter-press",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.letterPair
  },
  {
    cycle: "cycle-1",
    station: "sounds",
    mechanic: "soundGate",
    stage: "sound-gate",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.soundGate
  },
  {
    cycle: "cycle-1",
    station: "hunt",
    mechanic: "sceneHunt",
    stage: "scene-hunt",
    instruction: "Find the word that starts with the “a” sound."
  },
  {
    cycle: "cycle-1",
    station: "quick",
    mechanic: "wordWindow",
    stage: "word-window",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.wordWindow
  },
  {
    cycle: "cycle-1",
    station: "build",
    mechanic: "soundBoxes",
    stage: "sound-boxes",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.soundBoxes
  },
  {
    cycle: "cycle-8",
    station: "play",
    mechanic: "wordMachine",
    stage: "word-machine",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.wordMachineRemove
  },
  {
    cycle: "cycle-1",
    station: "poem",
    mechanic: "poemSpotlight",
    stage: "poem-spotlight",
    instruction: "Find the word “mat” in the poem."
  },
  {
    cycle: "cycle-1",
    station: "trace",
    mechanic: "letterTrace",
    stage: "letter-trace",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.letterTrace
  },
  {
    cycle: "cycle-25",
    station: "pattern",
    mechanic: "patternSort",
    stage: "pattern-sort",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.patternSort
  },
  {
    cycle: "cycle-25",
    station: "chain",
    mechanic: "wordChain",
    stage: "word-chain",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.wordChain
  },
  {
    cycle: "cycle-25",
    station: "speed",
    mechanic: "phraseFlow",
    stage: "phrase-flow",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.phraseFlow
  },
  {
    cycle: "cycle-25",
    station: "spell",
    mechanic: "heartWord",
    stage: "heart-word-studio",
    instruction: ADVENTURE_MAP_INSTRUCTIONS.heartWord
  }
];

async function installAudioRecorder(page) {
  await page.addInitScript(() => {
    window.__adventurePlayedAudio = [];
    window.__adventurePausedAudio = [];
    window.__adventureAudioEndMs = 5;
    window.Audio = class TestAudio extends EventTarget {
      constructor(src = "") {
        super();
        this.src = String(src || "");
        this.currentTime = 0;
        this.volume = 1;
        this.preload = "";
        this.playing = false;
        this.endTimer = null;
      }

      load() {}

      play() {
        const path = new URL(this.src, window.location.href).pathname;
        window.__adventurePlayedAudio.push(path);
        this.playing = true;
        if (this.endTimer !== null) window.clearTimeout(this.endTimer);
        this.endTimer = window.setTimeout(() => {
          this.endTimer = null;
          this.playing = false;
          this.dispatchEvent(new Event("ended"));
        }, window.__adventureAudioEndMs);
        return Promise.resolve();
      }

      pause() {
        if (this.endTimer !== null) window.clearTimeout(this.endTimer);
        this.endTimer = null;
        if (this.playing && this.src) {
          window.__adventurePausedAudio.push(new URL(this.src, window.location.href).pathname);
        }
        this.playing = false;
      }
    };
  });
}

async function playedAudio(page) {
  return page.evaluate(() => window.__adventurePlayedAudio || []);
}

async function pausedAudio(page) {
  return page.evaluate(() => window.__adventurePausedAudio || []);
}

async function clearAudioLog(page) {
  await page.evaluate(() => {
    window.__adventurePlayedAudio = [];
    window.__adventurePausedAudio = [];
  });
}

async function openMechanic(page, { cycle, station, mechanic, stage }) {
  await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}`);
  const round = page.locator(
    `[data-quest-view="round"][data-station-id="${station}"][data-round-type="${mechanic}"]`
  );
  await expect(round).toBeVisible();
  await expect(round.locator(`[data-mechanic-stage="${stage}"]`)).toBeVisible();
  return round;
}

test("all 12 Adventure Map mechanics speak their exact instruction automatically and replay it", async ({ page }) => {
  test.setTimeout(120_000);
  await installAudioRecorder(page);

  for (const route of MECHANIC_ROUTES) {
    const round = await openMechanic(page, route);
    const replay = round.getByRole("button", { name: "Hear instructions again" });
    const instruction = round.locator('[aria-label="What to do"] .adventure-round-frame__instruction > p');
    await expect(instruction).toHaveText(route.instruction);
    await expect(replay, `${route.mechanic} needs a persistent instruction replay`).toBeVisible();
    await expect(replay).toHaveAttribute("data-instruction-audio", /\/audio\/production\/en-US\/instruction\/.+\.mp3$/);
    const instructionPath = await replay.getAttribute("data-instruction-audio");

    await expect.poll(() => playedAudio(page), {
      message: `${route.mechanic} must speak on entry`
    }).toContain(instructionPath);
    const automatic = await playedAudio(page);
    expect(automatic[0], `${route.mechanic} must begin with its recorded instruction`).toBe(instructionPath);

    // Let the mocked entry sequence finish before isolating replay. The test
    // double preserves the production breath between instruction and target.
    await page.waitForTimeout(450);
    await clearAudioLog(page);
    await replay.click();
    await expect.poll(() => playedAudio(page), {
      message: `${route.mechanic} must replay its instruction`
    }).toContain(instructionPath);
    const replayed = await playedAudio(page);
    expect(replayed[0], `${route.mechanic} must replay the same recorded instruction first`).toBe(instructionPath);
  }
});

test("instruction, target, and connected-text recordings remain separate controls", async ({ page }) => {
  await installAudioRecorder(page);

  const letterRound = await openMechanic(page, MECHANIC_ROUTES[0]);
  const letterInstruction = await letterRound
    .getByRole("button", { name: "Hear instructions again" })
    .getAttribute("data-instruction-audio");
  await page.waitForTimeout(450);
  await clearAudioLog(page);
  await letterRound.getByRole("button", { name: "Hear the letter name", exact: true }).click();
  await expect.poll(() => playedAudio(page)).not.toEqual([]);
  const [letterTarget] = await playedAudio(page);
  expect(letterTarget).not.toBe(letterInstruction);

  const poemRoute = MECHANIC_ROUTES.find(route => route.mechanic === "poemSpotlight");
  const poemRound = await openMechanic(page, poemRoute);
  const poemInstruction = await poemRound
    .getByRole("button", { name: "Hear instructions again" })
    .getAttribute("data-instruction-audio");
  await page.waitForTimeout(450);
  await clearAudioLog(page);
  await poemRound.getByRole("button", { name: "Hear the poem", exact: true }).click();
  await expect.poll(() => playedAudio(page)).not.toEqual([]);
  const [poemContent] = await playedAudio(page);
  expect(poemContent).not.toBe(poemInstruction);

  const phraseRoute = MECHANIC_ROUTES.find(route => route.mechanic === "phraseFlow");
  const phraseRound = await openMechanic(page, phraseRoute);
  const phraseInstruction = await phraseRound
    .getByRole("button", { name: "Hear instructions again" })
    .getAttribute("data-instruction-audio");
  await page.waitForTimeout(450);
  await clearAudioLog(page);
  await phraseRound.getByRole("button", { name: "Hear the phrase", exact: true }).click();
  await expect.poll(() => playedAudio(page)).not.toEqual([]);
  const [phraseContent] = await playedAudio(page);
  expect(phraseContent).not.toBe(phraseInstruction);
});

test("a station tap starts its recorded direction once from the trusted gesture", async ({ page }) => {
  await installAudioRecorder(page);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1");
  await expect(page.getByRole("button", { name: /Letter Spot/i })).toBeVisible();

  await clearAudioLog(page);
  await page.getByRole("button", { name: /Letter Spot/i }).click();
  const round = page.locator('[data-quest-view="round"][data-round-type="letterPair"]');
  await expect(round.locator('[data-mechanic-stage="letter-press"]')).toBeVisible();
  const replay = round.getByRole("button", { name: "Hear instructions again" });
  const instructionPath = await replay.getAttribute("data-instruction-audio");
  await expect.poll(() => playedAudio(page)).toContain(instructionPath);
  const automatic = await playedAudio(page);

  expect(automatic[0]).toBe(instructionPath);
  expect(automatic.filter(path => path === instructionPath)).toHaveLength(1);
});

test("Stop during a wrong Letter Press feedback beat cancels the pending coaching cue", async ({ page }) => {
  await installAudioRecorder(page);
  const round = await openMechanic(page, MECHANIC_ROUTES[0]);

  // Let entry audio finish, then capture the current target cue separately.
  await page.waitForTimeout(450);
  await clearAudioLog(page);
  await round.getByRole("button", { name: "Hear the letter name", exact: true }).click();
  await expect.poll(() => playedAudio(page)).not.toEqual([]);
  const [targetPath] = await playedAudio(page);
  await page.waitForTimeout(30);
  await clearAudioLog(page);

  const stage = round.locator('[data-mechanic-stage="letter-press"]');
  const shownLetter = (await stage.locator(".am-code-sign-slot").first().locator("strong").textContent())
    ?.trim()
    .toLowerCase();
  const choices = stage.locator(".am-letter-press-choices").getByRole("button");
  const labels = (await choices.allTextContents()).map(label => label.trim().toLowerCase());
  const wrongIndex = labels.findIndex(label => label !== shownLetter);
  expect(wrongIndex).toBeGreaterThanOrEqual(0);

  await choices.nth(wrongIndex).click();
  await round.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator('[data-quest-view="cycle"]')).toBeVisible();
  await page.waitForTimeout(850);

  expect(await playedAudio(page)).not.toContain(targetPath);
});

test("leaving a round stops active directions", async ({ page }) => {
  await installAudioRecorder(page);
  await page.addInitScript(() => { window.__adventureAudioEndMs = 5_000; });

  const letterRound = await openMechanic(page, MECHANIC_ROUTES[0]);
  const letterInstruction = await letterRound
    .getByRole("button", { name: "Hear instructions again" })
    .getAttribute("data-instruction-audio");
  await expect.poll(() => playedAudio(page)).toContain(letterInstruction);
  await clearAudioLog(page);
  await letterRound.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator('[data-quest-view="cycle"]')).toBeVisible();
  await expect.poll(() => pausedAudio(page)).toContain(letterInstruction);
  await page.waitForTimeout(300);
  expect(await playedAudio(page)).not.toContain(letterInstruction);
});

test("map front door speaks its recorded action while the stop stays usable", async ({ page }) => {
  await installAudioRecorder(page);
  await page.goto('/preview/child-surfaces.html?surface=adventure-map');
  const speaker = page.locator('[data-map-instruction-audio]');
  const path = await speaker.getAttribute('data-map-instruction-audio');
  expect(path).toMatch(/tap-the-card-with-the-arrow-to-start/);
  await expect.poll(()=>playedAudio(page)).toContain(path);
  await page.evaluate(()=>{window.__adventureAudioEndMs=60000;});
  await speaker.click();
  await expect(page.locator('button[data-child-primary]')).toBeEnabled();
  await page.locator('button[data-child-primary]').click();
  await expect(speaker).toHaveCount(0);
  await expect.poll(()=>pausedAudio(page)).toContain(path);
});

test("map autoplay rejection recovers on a gesture without a listening gate", async ({ page }) => {
  await installAudioRecorder(page);
  await page.addInitScript(()=>{
    const original=window.Audio.prototype.play;
    let blocked=true;
    window.Audio.prototype.play=function(){
      if(blocked){blocked=false;return Promise.reject(new DOMException('Gesture required','NotAllowedError'));}
      return original.call(this);
    };
  });
  await page.goto('/preview/child-surfaces.html?surface=adventure-map');
  const speaker=page.locator('[data-map-instruction-audio]');
  await expect(speaker).toBeEnabled();
  await expect(page.locator('button[data-child-primary]')).toBeEnabled();
  await page.locator('h1').click();
  const path=await speaker.getAttribute('data-map-instruction-audio');
  await expect.poll(()=>playedAudio(page)).toContain(path);
  await clearAudioLog(page);
  await speaker.click();
  await expect.poll(()=>playedAudio(page)).toContain(path);
});

test("map recorded directions decode and play through the native browser audio element", async ({ page }) => {
  await page.addInitScript(()=>{
    window.__nativeMapAudio=[];
    const original=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
      const result=original.apply(this,args);
      result?.then(()=>window.__nativeMapAudio.push({src:this.currentSrc||this.src,duration:this.duration})).catch(()=>{});
      return result;
    };
  });
  await page.goto('/preview/child-surfaces.html?surface=adventure-map');
  await page.locator('[data-map-instruction-audio]').click();
  await expect.poll(()=>page.evaluate(()=>window.__nativeMapAudio.some(item=>item.src.includes('tap-the-card-with-the-arrow-to-start')&&item.duration>1))).toBe(true);
  await expect(page.locator('button[data-child-primary]')).toBeEnabled();
});
