import { expect, test } from "@playwright/test";
import { wordBridgeLadder } from "../../src/utils/wordBridgeLevels.js";

const KEY = "literacy-guide-learn-games:fullscreen-overlay-preview";
const pageErrors = new WeakMap();
test.beforeEach(({ page }) => {
  pageErrors.set(page, []);
  page.on("pageerror", error => pageErrors.get(page).push(error.message));
});
test.afterEach(({ page }) => { expect(pageErrors.get(page)).toEqual([]); });
const game = page => page.locator(".wb-game");
const tile = (page, id) => page.locator(`[data-tile-id="${id}"]`);
const slot = (page, i) => page.locator("[data-slot-id]").nth(i);
async function observeMedia(page) {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    const pause = HTMLMediaElement.prototype.pause;
    window.g11Media = { elements: [], pauses: 0 };
    HTMLMediaElement.prototype.play = function (...args) {
      if (!window.g11Media.elements.includes(this)) window.g11Media.elements.push(this);
      return play.apply(this, args);
    };
    HTMLMediaElement.prototype.pause = function (...args) {
      window.g11Media.pauses += 1;
      return pause.apply(this, args);
    };
  });
}
async function open(page, { difficulty = "easy", stage = 0, width = 1024, height = 768, sound = 0, reduced = true } = {}) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
  await page.addInitScript(({ key, difficulty, stage }) => {
    localStorage.setItem("lp-arcade-onboarded-v1:word-bridge", "1");
    localStorage.setItem(key, JSON.stringify({ games: { "word-bridge": { checkpoints: { [difficulty]: { level: stage, totalLevels: 10 } } } } }));
  }, { key: KEY, difficulty, stage });
  await page.goto(`/preview/game-overlay.html?game=word-bridge&difficulty=${difficulty}&sound=${sound}&music=0`);
  if (stage) await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(game(page)).toHaveAttribute("data-stage", String(stage));
}
async function saved(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)).games["word-bridge"], KEY);
}
async function pickGlyph(page, glyph, { keyboard = false, last = false } = {}) {
  const choices = page.locator("[data-tile-id]").filter({ hasText: new RegExp(`^${glyph}$`, "i") });
  const available = choices.locator("visible=true");
  const candidates = await available.evaluateAll(els => els.filter(el => !el.disabled).map(el => el.dataset.tileId));
  expect(candidates.length, glyph).toBeGreaterThan(0);
  const chosen = tile(page, last ? candidates.at(-1) : candidates[0]);
  if (keyboard) { await chosen.focus(); await chosen.press("Enter"); } else await chosen.click();
  await expect(chosen).toHaveAttribute("aria-pressed", "true");
  return chosen;
}
async function fill(page, level, { reverse = false, keyboard = false } = {}) {
  const items = Array.isArray(level.target) ? level.target : level.target.toUpperCase().split("");
  const indices = items.map((_, i) => i);
  if (reverse) indices.reverse();
  for (const i of indices) {
    if (await slot(page, i).getAttribute("data-filled") === "true") continue;
    await pickGlyph(page, items[i], { keyboard });
    if (keyboard) { await slot(page, i).focus(); await slot(page, i).press("Space"); } else await slot(page, i).click();
    await expect(slot(page, i)).toHaveAttribute("data-filled", "true");
  }
  await expect(game(page)).toHaveAttribute("data-phase", "built");
}
async function cross(page) {
  await page.getByRole("button", { name: "Ring the bell", exact: true }).click();
  await expect(game(page)).toHaveAttribute("data-phase", "arrived");
}
async function geometry(page) {
  const buttons = page.locator(".lg-game-player-header button, .wb-game button");
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    await button.scrollIntoViewIfNeeded();
    const proof = await button.evaluate(el => {
      const r = el.getBoundingClientRect();
      const sample = [[.5,.5],[.15,.15],[.85,.85]].map(([x,y]) => {
        const hit = document.elementFromPoint(r.left + r.width*x,r.top + r.height*y);
        return hit === el || el.contains(hit);
      });
      return { w:r.width,h:r.height,hit:sample.every(Boolean),overflow:el.scrollWidth>el.clientWidth+1,text:el.textContent };
    });
    expect(proof.w, proof.text).toBeGreaterThanOrEqual(56);
    expect(proof.h, proof.text).toBeGreaterThanOrEqual(56);
    expect(proof.hit, `obstructed ${proof.text}`).toBe(true);
    expect(proof.overflow, `clipped word ${proof.text}`).toBe(false);
  }
  const overlaps = await page.locator(".wb-content").evaluate(root => {
    const boxes = [...root.querySelectorAll("[data-wb-region]")].map(el => el.getBoundingClientRect());
    const buttons = [...root.querySelectorAll("[data-tile-id],[data-slot-id]")].map(el => el.getBoundingClientRect());
    const overlap = (a,b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const close = (a,b) => overlap({left:a.left-7.9,right:a.right+7.9,top:a.top-7.9,bottom:a.bottom+7.9},b);
    return {
      regions:boxes.some((a,i)=>boxes.slice(i+1).some(b=>overlap(a,b))),
      objects:buttons.some((a,i)=>buttons.slice(i+1).some(b=>close(a,b)))
    };
  });
  expect(overlaps).toEqual({regions:false,objects:false});
}
async function capture(page, testInfo, name) {
  await page.screenshot({ path:testInfo.outputPath(name+".png"), fullPage:true });
}

for (const [width,height] of [[320,568],[568,320],[1024,768]]) {
  for (const difficulty of ["easy","medium","hard"]) {
    test(`all ten ${difficulty} bridges at ${width}x${height}: real hit targets and complete construction`, async ({page}, testInfo) => {
      test.setTimeout(180_000);
      await open(page,{difficulty,width,height});
      for (const [index,level] of wordBridgeLadder(difficulty).entries()) {
        await expect(game(page)).toHaveAttribute("data-stage",String(index));
        await geometry(page);
        if (difficulty === "hard" && [0,8].includes(index)) {
          await page.locator(".wb-cue").scrollIntoViewIfNeeded();
          await capture(page,testInfo,`stage-${index}-cue`);
          await page.locator(".wb-construction").scrollIntoViewIfNeeded();
          await capture(page,testInfo,`stage-${index}-bridge`);
        }
        await fill(page,level,{reverse:true,keyboard:width===1024});
        await expect(page.locator("[data-wb-motion]")).toHaveCount(0);
        await geometry(page);
        await cross(page);
        if (index===8 && difficulty==="hard") await capture(page,testInfo,"sentence-arrived");
        if (index<9) await page.getByRole("button",{name:"Next bridge",exact:true}).click();
      }
      const record=await saved(page);
      expect(record.plays).toBe(1);
      expect(record.wordsCompleted).toBe(10);
      expect(record.practiceRecord.completions).toHaveLength(1);
    });
  }
}

test("opposite identical Ts, lower-row first, wrong repair, cancellation, carry pause and resize", async ({page},testInfo) => {
  await open(page,{difficulty:"medium",stage:5,reduced:false});
  const level=wordBridgeLadder("medium")[5];
  for(const [i,t] of level.tiles.entries()) if(t.glyph==="T") {
    const dest=t.order===0?3:0;
    await tile(page,`bridge-5-tile-${i}`).click();
    await slot(page,dest).click();
    await expect(slot(page,dest)).toHaveAttribute("data-filled","true");
  }
  const decoy=level.tiles.findIndex(t=>!t.correct);
  await tile(page,`bridge-5-tile-${decoy}`).click();
  await slot(page,1).click();
  await expect(page.getByRole("status").filter({hasText:"You chose"})).toBeVisible();
  expect(await slot(page,0).getAttribute("data-filled")).toBe("true");
  const e=page.getByRole("button",{name:"Pick E",exact:true});
  await e.scrollIntoViewIfNeeded();
  const box=await e.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.mouse.move(1,1);await page.mouse.up();
  await expect(e).toHaveAttribute("aria-pressed","false");
  await e.dispatchEvent("pointerdown",{pointerId:9,button:0,clientX:box.x+5,clientY:box.y+5});
  await e.dispatchEvent("pointercancel",{pointerId:9});
  await expect(e).toHaveAttribute("aria-pressed","false");
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.keyboard.press("Escape");
  await expect(game(page)).toHaveAttribute("data-paused","true");
  await page.keyboard.press("e");
  await expect(e).toHaveAttribute("aria-pressed","false");
  await page.keyboard.press("Escape");
  await expect(game(page)).toHaveAttribute("data-paused","false");
  await page.mouse.up();
  await expect(e).toHaveAttribute("aria-pressed","false");
  await e.click();
  await expect(page.locator(".wb-helper:visible")).toHaveCount(1);
  await capture(page,testInfo,"carrying");
  await page.getByRole("button",{name:"Close Word Bridge",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-paused","true");
  await page.getByRole("button",{name:"Keep playing",exact:true}).click();
  await expect(e).toHaveAttribute("aria-pressed","true");
  await page.setViewportSize({width:320,height:568});
  await slot(page,1).click();
  await fill(page,level);
  await capture(page,testInfo,"repaired");
  await page.getByRole("button",{name:"Ring the bell",exact:true}).click();
  await page.getByRole("button",{name:"Close Word Bridge",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-paused","true");
  const progress=await page.locator("[data-wb-motion]").getAttribute("data-progress");
  await page.waitForTimeout(200);
  expect(await page.locator("[data-wb-motion]").getAttribute("data-progress")).toBe(progress);
  await page.getByRole("button",{name:"Keep playing",exact:true}).click();
  await capture(page,testInfo,"crossing");
  await expect(game(page)).toHaveAttribute("data-phase","arrived");
});

test("receipt is identical before crossing and Finish; replay makes exactly one further receipt",async({page})=>{
  test.setTimeout(180_000);
  await open(page,{stage:9});
  const levels=wordBridgeLadder("easy");
  await fill(page,levels[9]);
  const first=await saved(page);
  await cross(page);
  expect(await saved(page)).toEqual(first);
  await page.getByRole("button",{name:"Play again",exact:true}).click();
  for(const [i,level] of levels.entries()){
    await fill(page,level);
    if(i===9) break;
    await cross(page);await page.getByRole("button",{name:"Next bridge",exact:true}).click();
  }
  const second=await saved(page);
  expect(second.plays).toBe(2);
  expect(second.practiceRecord.completions).toHaveLength(2);
  expect(second.practiceRecord.completions[0]).toEqual(first.practiceRecord.completions[0]);
  await cross(page);
  expect(await saved(page)).toEqual(second);
  await page.getByRole("button",{name:"Finish",exact:true}).click();
  await expect(page.getByRole("alertdialog",{name:"Word Bridge complete"})).toBeVisible();
  await expect(page.getByText(`You earned ${second.highScore} points.`,{exact:true})).toBeVisible();
  expect(await saved(page)).toEqual(second);
});

test("close at final placement preserves one completion and resume Start over is fresh",async({page})=>{
  await observeMedia(page);
  await open(page,{stage:9,sound:1});
  await fill(page,wordBridgeLadder("easy")[9]);
  const before=await saved(page);
  await page.getByRole("button",{name:"Hear",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-cue","started");
  const pauses=await page.evaluate(()=>window.g11Media.pauses);
  await page.getByRole("button",{name:"Close Word Bridge",exact:true}).click();
  await expect(page.getByText("Closed Word Bridge",{exact:true})).toBeVisible();
  expect(await saved(page)).toEqual(before);
  expect(await page.evaluate(()=>window.g11Media.pauses)).toBeGreaterThan(pauses);
  expect(await page.evaluate(()=>window.g11Media.elements.every(audio=>audio.paused))).toBe(true);
});

test("fresh recording hides solution, pause cancels voice, failure and mute restore truthful model",async({page},testInfo)=>{
  test.setTimeout(60_000);
  await observeMedia(page);
  await open(page,{sound:1});
  await fill(page,wordBridgeLadder("easy")[0]);
  await cross(page);await page.getByRole("button",{name:"Next bridge",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-model","hidden");
  await expect(page.locator("[data-wb=target]")).toHaveText("Listen to the word. Build its sounds.");
  await expect(page.locator(".wb-socket>span")).toHaveText(["?","?","?"]);
  await page.getByRole("button",{name:"Hear",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-cue","completed");
  await capture(page,testInfo,"fresh-cued");
  await fill(page,wordBridgeLadder("easy")[1]);
  await cross(page);await page.getByRole("button",{name:"Next bridge",exact:true}).click();
  await page.getByRole("button",{name:"Hear",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-cue","started");
  const pauses=await page.evaluate(()=>window.g11Media.pauses);
  await page.getByRole("button",{name:"Close Word Bridge",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-paused","true");
  expect(await page.evaluate(()=>window.g11Media.elements.length)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>window.g11Media.pauses)).toBeGreaterThan(pauses);
  const playing=await page.evaluate(()=>window.g11Media.elements.filter(audio=>!audio.paused).map(audio=>({src:audio.currentSrc||audio.src,ended:audio.ended,time:audio.currentTime})));
  expect(playing).toEqual([]);
  await page.getByRole("button",{name:"Keep playing",exact:true}).click();
  await page.route("**/*.mp3",route=>route.abort());
  await page.route("**/*.wav",route=>route.abort());
  await page.route("**/*.ogg",route=>route.abort());
  // This level's source may be cached; reject the real media play call as well.
  await page.evaluate(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException("audio unavailable","NotSupportedError"));};});
  await page.getByRole("button",{name:"Hear",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-cue","failed");
  await expect(page.getByText("The recording could not play. Match the printed model.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Turn spoken audio and game sounds off",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-model","shown");
  await expect(game(page)).toHaveAttribute("data-cue","muted");
  for (let i=2;i<10;i++) {
    await fill(page,wordBridgeLadder("easy")[i]);
    if(i<9) { await cross(page);await page.getByRole("button",{name:"Next bridge",exact:true}).click(); }
  }
  const completion=(await saved(page)).practiceRecord.completions[0];
  const cued=completion.steps.filter(step=>step.levelId===wordBridgeLadder("easy")[1].levelId);
  expect(cued.length).toBeGreaterThan(0);
  expect(cued.every(step=>step.supportUsed.includes("recorded_target_cue")&&!step.supportUsed.includes("printed_model"))).toBe(true);
  const failed=completion.steps.filter(step=>step.levelId===wordBridgeLadder("easy")[2].levelId);
  expect(failed.every(step=>step.supportUsed.includes("printed_model")&&step.supportUsed.includes("audio_failed"))).toBe(true);
});

test("Start over discards checkpoint and failed art keeps usable controls",async({page})=>{
  await page.route("**/images/learn-games/word-bridge/**",route=>route.abort());
  await page.addInitScript(()=>{
    localStorage.setItem("lp-arcade-onboarded-v1:word-bridge","1");
    localStorage.setItem("literacy-guide-learn-games:fullscreen-overlay-preview",JSON.stringify({games:{"word-bridge":{checkpoints:{easy:{level:4,totalLevels:10}}}}}));
  });
  await page.goto("/preview/game-overlay.html?game=word-bridge&sound=0");
  await page.getByRole("button",{name:"Start over",exact:true}).click();
  await expect(game(page)).toHaveAttribute("data-stage","0");
  await expect(page.locator(".wb-fallback-character").first()).toBeVisible();
  await fill(page,wordBridgeLadder("easy")[0]);
});
