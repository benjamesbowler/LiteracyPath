import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { SENTENCES, SENTENCE_FIX } from "../../src/data/learnGamesData.js";
import { REPAIR_MARK_NAMES, hopLearningTask, repairFeedback, repairLearningTask } from "../../src/components/learn/games/games/sentenceWorkshopModel.js";
import { advanceLearningResponseReceipt, commitLearningResponse, createLearningResponseEpisode, recordLearningGuidedAction } from "../../src/utils/learningResponseState.js";
import { getLedaInstructionAudioPath } from "../../src/data/ledaProductionAudio.js";

const EVIDENCE = ".artifacts/phonics-overhaul/sentences";
const PROGRESS = "literacy-guide-learn-games:fullscreen-overlay-preview";
const phonicsKey = (mode, difficulty) => `literacy-guide-phonics-play:fullscreen-overlay-preview:${mode}:${difficulty}`;
const gameResult = (page, game) => page.evaluate(({ key, gameId }) => JSON.parse(localStorage.getItem(key) || "{}").games?.[gameId], { key: PROGRESS, gameId: game });
async function open(page, game, difficulty = "easy", sound = 0) {
  await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=${difficulty}&sound=${sound}`);
  await expect(page.locator(".psw-game")).toBeVisible();
}
async function pausedRetry(page, title, action) {
  await page.getByRole("button", { name: `Pause ${title}`, exact: true }).click();
  await expect(page.getByRole("dialog", { name: `${title} paused`, exact: true })).toBeVisible();
  await expect(page.locator(".psw-game")).toHaveClass(/is-paused/);
  await expect(page.locator(".psw-game button:enabled")).toHaveCount(0);
  await page.getByRole("button", { name: "Resume game", exact: true }).click();
  await expect(action).toBeEnabled();
}

async function finishGuided(page, beforeAction) {
  while (await page.locator("[data-guided-model]:enabled").count()) {
    const action = page.locator("[data-guided-model]:enabled").first();
    if (beforeAction) await beforeAction(action);
    await action.click();
  }
}
async function expectFullNativeHit(control) {
  await expect.poll(() => control.evaluate(element => {
    const rect=element.getBoundingClientRect(), clipped={left:0,top:0,right:innerWidth,bottom:innerHeight};
    for(let ancestor=element.parentElement;ancestor;ancestor=ancestor.parentElement){
      const style=getComputedStyle(ancestor), bounds=ancestor.getBoundingClientRect();
      if(["auto","scroll","hidden","clip"].includes(style.overflowX)){clipped.left=Math.max(clipped.left,bounds.left);clipped.right=Math.min(clipped.right,bounds.right);}
      if(["auto","scroll","hidden","clip"].includes(style.overflowY)){clipped.top=Math.max(clipped.top,bounds.top);clipped.bottom=Math.min(clipped.bottom,bounds.bottom);}
      // The fixed game overlay uses its viewport, not the body's zero-height
      // flow box. Keep every real clipping boundary inside that overlay.
      if(style.position==="fixed") break;
    }
    const inset=8, points=[[rect.left+inset,rect.top+inset],[rect.right-inset,rect.top+inset],[rect.left+inset,rect.bottom-inset],[rect.right-inset,rect.bottom-inset],[rect.x+rect.width/2,rect.y+rect.height/2]];
    return {target:rect.width>=55.9&&rect.height>=55.9,full:rect.left>=clipped.left-.1&&rect.top>=clipped.top-.1&&rect.right<=clipped.right+.1&&rect.bottom<=clipped.bottom+.1,
      hit:points.every(([x,y])=>element.contains(document.elementFromPoint(x,y)))};
  })).toEqual({target:true,full:true,hit:true});
}

for (const difficulty of ["easy", "medium", "hard"]) {
  test(`${difficulty} Hopscotch freezes a wrong next word, preserves its prefix and restores the saved model`, async ({ page }) => {
    test.setTimeout(90000);
    await open(page, "word-hopscotch", difficulty);
    const key = phonicsKey("sentence", difficulty);
    const sentence = await page.locator(".psw-sentence-model p").innerText();
    const words = sentence.replace(/[.?!]/g, "").split(/\s+/);
    await page.getByRole("button", { name: `Hop to ${words[0]}`, exact: true }).press("Enter");
    await expect(page.locator(".psw-hop")).toHaveAttribute("data-hop-index", "1");
    const labels = await page.locator(".psw-word-stone").allTextContents();
    const wrong = labels.find(word => word !== words[1]);
    await page.getByRole("button", { name: `Hop to ${wrong}`, exact: true }).click();
    await expect(page.locator("[data-learning-phase=teaching]").first()).toBeVisible();
    await expect(page.locator(".psw-word-stone")).toHaveCount(0);
    await expect(page.locator(".psw-kept-prefix")).toContainText(words[0]);
    const first = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode, key);
    expect(first.firstResponse.selected).toEqual([wrong]);
    expect(first.firstQuestion.builtPrefix).toEqual([words[0]]);
    expect(first.firstExpected).toEqual(words.slice(1));
    const guided = page.locator("[data-guided-model]:enabled").first();
    await pausedRetry(page, "Word Hopscotch", guided);
    await guided.press("Enter");
    await page.reload(); await page.getByRole("button", { name: "Continue", exact: true }).click();
    const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode, key);
    expect(restored.firstResponse).toEqual(first.firstResponse);
    expect(restored.guidedCursor).toBe(1);
    await expect(page.locator(".psw-hop")).toHaveAttribute("data-hop-index", "1");
    await finishGuided(page);
    const transfer = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode, key);
    expect(transfer.role).toBe("transfer"); expect(transfer.question.sentence).not.toBe(sentence);
    for (const word of transfer.expected) await page.getByRole("button", { name: `Choose ${word}`, exact: true }).press("Enter");
    await expect(page.locator(".psw-progress")).toContainText("Sentence 2");
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    expect(saved.evidence.firstResponses.find(response => response.round === "0:1").correct).toBe(false);
    expect(saved.evidence.assistedRetries).toHaveLength(1);
    expect(saved.evidence.assistedRetries[0].learningEpisode.firstResponse).toEqual(first.firstResponse);
    expect(saved.evidence.assistedRetries[0].learningEpisode.responses[1].evidenceUse).toBe("formative_transfer_after_teaching");
  });

  test(`${difficulty} Sentence Fix-It freezes one direct wrong repair and restores its guided cursor`, async ({ page }) => {
    test.setTimeout(90000);
    await open(page, "reading-race", difficulty);
    const key = phonicsKey("quiz", difficulty);
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    const fix = saved.gameState.fixes[0];
    const wrong = fix.options.find(piece => !(fix.acceptedAnswers || [fix.answer]).includes(piece));
    await page.getByRole("button", { name: `Use ${REPAIR_MARK_NAMES[wrong] || wrong}`, exact: true }).click();
    await expect(page.locator("[data-learning-phase=teaching]").first()).toBeVisible();
    await expect(page.locator(".psw-repair-piece")).toHaveCount(0);
    const first = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode, key);
    expect(first.firstResponse.selected).toBe(wrong);
    await page.reload(); await page.getByRole("button", { name: "Continue", exact: true }).click();
    const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode, key);
    expect(restored.firstResponse).toEqual(first.firstResponse);
    const guided = page.locator("[data-guided-model]:enabled").first();
    await pausedRetry(page, "Sentence Fix-It", guided); await guided.press("Enter");
    if (await page.locator("[data-learning-phase=answer]").count()) {
      const transfer = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode, key);
      expect(transfer.question.display).not.toBe(fix.display);
      await page.getByRole("button", { name: `Choose ${transfer.expected}`, exact: true }).press("Enter");
    }
    await expect(page.locator(".psw-repair")).toHaveAttribute("data-repair-index", "1");
    const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    expect(after.evidence.firstResponses[0].correct).toBe(false);
    expect(after.evidence.assistedRetries).toHaveLength(1);
    expect(after.evidence.assistedRetries[0].learningEpisode.firstResponse).toEqual(first.firstResponse);
  });

  test(`${difficulty} factory is immediately tappable, retries a wrong chute and restores the parcel`, async ({ page }) => {
    await open(page, "sound-sort-factory", difficulty, 1);
    const word = await page.locator(".psw-factory-parcel").getAttribute("data-word");
    const bins = await page.locator(".psw-factory-chute").evaluateAll(elements => elements.map(element => element.dataset.bin));
    const target = bins.filter(bin => word.startsWith(bin)).sort((a, b) => b.length - a.length)[0];
    const wrong = bins.find(bin => bin !== target);
    await expect(page.getByRole("button", { name: `Sort into ${wrong} chute`, exact: true })).toBeEnabled();
    await page.getByRole("button", { name: `Sort into ${wrong} chute`, exact: true }).click();
    await expect(page.locator(".psw-feedback")).toContainText(`${word} starts with ${target}. You chose ${wrong}`);
    const choice = page.getByRole("button", { name: `Sort into ${target} chute`, exact: true });
    await expect(choice).toBeEnabled();
    await page.reload();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator(".psw-factory-parcel")).toHaveAttribute("data-word", word);
    await pausedRetry(page, "Sound Sort Factory", choice);
    await choice.press("Enter");
    await expect(page.locator(".psw-feedback")).toContainText(`${word} starts with ${target}. Parcel sorted!`);
    // An accepted parcel reloads as accepted during the result dwell, never
    // asks for the same response twice or awards its points twice.
    await page.reload();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator(".psw-factory")).toHaveAttribute("data-aw-index", "1", { timeout: 30000 });
  });
}

for (const [width, height] of [[1366, 768], [1024, 768], [768, 1024], [568, 320], [320, 568]]) {
  test(`sentence worlds show unoccluded 56px controls at ${width}x${height}`, async ({ page }) => {
    await mkdir(EVIDENCE, { recursive: true });
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const game of ["word-hopscotch", "reading-race", "sound-sort-factory"]) {
      await open(page, game, "hard");
      const geometry = await page.locator(".psw-game button").evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { label: element.getAttribute("aria-label"), x: rect.x, y: rect.y, w: rect.width, h: rect.height, hit: element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)) };
      }));
      for (const control of geometry) {
        expect(control.w, `${game}: ${control.label}`).toBeGreaterThanOrEqual(55.9);
        expect(control.h, `${game}: ${control.label}`).toBeGreaterThanOrEqual(55.9);
        expect(control.x).toBeGreaterThanOrEqual(-.1);
        expect(control.y).toBeGreaterThanOrEqual(-.1);
        expect(control.x + control.w).toBeLessThanOrEqual(width + .1);
        expect(control.y + control.h).toBeLessThanOrEqual(height + .1);
        expect(control.hit, `${game}: ${control.label}`).toBe(true);
      }
      if ([1366, 1024, 768].includes(width)) await page.screenshot({ path: `${EVIDENCE}/${game}-${width}x${height}.png` });
    }
  });
}

for (const difficulty of ["easy", "medium", "hard"]) for (const game of ["word-hopscotch", "reading-race"]) test(`${difficulty} ${game === "word-hopscotch" ? "Hopscotch" : "Fix-It"} completes whole fresh outings automatically and replays with fresh content`, async ({ page }) => {
  test.setTimeout(240000);
    await open(page, game, difficulty);
    const first = await page.locator(game === "word-hopscotch" ? ".psw-sentence-model p" : ".psw-repair-sign p").innerText();
    const fresh = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), phonicsKey(game === "word-hopscotch" ? "sentence" : "quiz", difficulty));
    const count = game === "word-hopscotch" ? fresh.gameState.sentences.length : fresh.gameState.fixes.length;
    if (game === "word-hopscotch") expect(await page.evaluate(async sentences => {
      const { hasRecordedSpeech } = await import("/src/utils/learnGamesAudio.js");
      return sentences.every(sentence => hasRecordedSpeech(sentence));
    }, [fresh.gameState.modelSentence, ...fresh.gameState.sentences])).toBe(true);
    for (let round = 0; round < count; round += 1) {
      if (game === "word-hopscotch") {
        const sentence = fresh.gameState.sentences[round];
        const words = sentence.replace(/[.?!]/g, "").split(/\s+/);
        for (const word of words) await page.getByRole("button", { name: `Hop to ${word}`, exact: true }).click();
        if (round + 1 < count) await expect(page.locator(".psw-sentence-model p")).toHaveText(fresh.gameState.sentences[round + 1]);
      } else {
        const fix = fresh.gameState.fixes[round];
        const answer = fix.acceptedAnswers?.at(-1) || fix.answer;
        await page.getByRole("button", { name: `Use ${REPAIR_MARK_NAMES[answer] || answer}`, exact: true }).click();
        if (round + 1 < count) await expect(page.locator(".psw-repair")).toHaveAttribute("data-repair-index", String(round + 1));
      }
    }
    await expect(page.getByRole("heading", { name: `${game === "word-hopscotch" ? "Word Hopscotch" : "Sentence Fix-It"} complete!`, exact: true })).toBeVisible();
    await expect.poll(async () => (await gameResult(page, game))?.plays).toBe(1);
    await page.getByRole("button", { name: "Replay level", exact: true }).click();
    await expect(page.locator(".psw-game")).toBeVisible();
    const replay = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), phonicsKey(game === "word-hopscotch" ? "sentence" : "quiz", difficulty));
    expect(replay.gameState.sessionSeed).not.toBe(fresh.gameState.sessionSeed);
    // A chance-identical first target is possible; the complete seeded deck
    // and choice ordering must provide variation instead of imposing a slot.
    expect(replay.gameState).not.toEqual(fresh.gameState);
    expect(first.length).toBeGreaterThan(5);
});

for (const difficulty of ["easy", "medium", "hard"]) test(`${difficulty} factory completes its bounded outing automatically, records one receipt and replays`, async ({ page }) => {
  test.setTimeout(180000);
  await open(page, "sound-sort-factory", difficulty);
  const firstWord = await page.locator(".psw-factory-parcel").getAttribute("data-word");
  const total = Number((await page.locator(".psw-progress").innerText()).split("/").at(-1));
  expect(total).toBe(({ easy: 16, medium: 24, hard: 32 })[difficulty]);
  for (let index = 0; index < total; index += 1) {
    await expect(page.locator(".psw-factory")).toHaveAttribute("data-aw-index", String(index));
    const word = await page.locator(".psw-factory-parcel").getAttribute("data-word");
    const bins = await page.locator(".psw-factory-chute").evaluateAll(elements => elements.map(element => element.dataset.bin));
    const target = bins.filter(bin => word.startsWith(bin)).sort((a, b) => b.length - a.length)[0];
    await page.getByRole("button", { name: `Sort into ${target} chute`, exact: true }).click();
    if (index + 1 < total) await expect(page.locator(".psw-factory")).toHaveAttribute("data-aw-index", String(index + 1));
  }
  await expect(page.getByRole("heading", { name: "Sound Sort Factory complete!", exact: true })).toBeVisible();
  await expect.poll(async () => (await gameResult(page, "sound-sort-factory"))?.plays).toBe(1);
  await page.getByRole("button", { name: "Replay level", exact: true }).click();
  await expect(page.locator(".psw-factory")).toHaveAttribute("data-aw-index", "0");
  expect(firstWord.length).toBeGreaterThan(1);
});

test("all repair categories and the accepted her alternative have literal complete feedback", async ({ page }) => {
  await open(page, "reading-race", "hard");
  const fixes = SENTENCE_FIX.hard;
  expect(fixes.some(fix => fix.acceptedAnswers?.includes("her"))).toBe(true);
  // Whole-roster completion above exercises the real source bank. This row
  // separately checks every child's feedback string through the pure module.
  const audit = await page.evaluate(async () => {
    const { SENTENCE_FIX } = await import("/src/data/learnGamesData.js");
    const { repairFeedback } = await import("/src/components/learn/games/games/sentenceWorkshopModel.js");
    return Object.values(SENTENCE_FIX).flat().map(fix => ({ kind: fix.kind, correct: repairFeedback(fix, fix.acceptedAnswers?.at(-1) || fix.answer, true) }));
  });
  expect(audit).toHaveLength(42);
  expect(audit.every(item => item.correct.length > 15)).toBe(true);
});

test("failed recorded cues keep printed models, retryable Hear and immediate answers", async ({ page }) => {
  test.setTimeout(60000);
  await page.route("**/*.mp3", route => route.abort());
  await page.setViewportSize({ width: 568, height: 320 });
  for (const game of ["word-hopscotch", "sound-sort-factory"]) {
    if (game === "word-hopscotch") {
      // Most authored sentences have no complete retained recording. Exercise
      // a real recorded target so transport failure is distinct from absence.
      await open(page, game, "hard", 0);
      await page.evaluate(key => {
        const saved = JSON.parse(localStorage.getItem(key));
        saved.gameState.sentences[0] = "The owl hunts when the moon is bright.";
        localStorage.setItem(key, JSON.stringify(saved));
      }, phonicsKey("sentence", "hard"));
      await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=hard&sound=1`);
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(page.locator(".psw-game")).toBeVisible();
    } else await open(page, game, "hard", 1);
    await expect(page.locator(".psw-hud")).toContainText("try its voice again");
    await expect(page.locator(".psw-replay")).toBeEnabled();
    const controls = await page.locator(".psw-game button").evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { bottom: rect.bottom, hit: element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)) };
    }));
    expect(controls.every(control => control.bottom <= 320 && control.hit)).toBe(true);
    if (game === "word-hopscotch") {
      const firstWord = (await page.locator(".psw-sentence-model p").innerText()).split(/\s+/)[0];
      await page.getByRole("button", { name: `Hop to ${firstWord}`, exact: true }).click();
      await expect(page.locator(".psw-hop")).toHaveAttribute("data-hop-index", "1");
    } else {
      const word = await page.locator(".psw-factory-parcel").getAttribute("data-word");
      const bins = await page.locator(".psw-factory-chute").evaluateAll(elements => elements.map(element => element.dataset.bin));
      const target = bins.filter(bin => word.startsWith(bin)).sort((a, b) => b.length - a.length)[0];
      await page.getByRole("button", { name: `Sort into ${target} chute`, exact: true }).click();
      await expect(page.locator(".psw-factory")).toHaveAttribute("data-aw-index", "1");
    }
  }
});

test("a missing complete sentence recording exposes printed support without blocking the hop", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await open(page, "word-hopscotch", "hard");
  await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key));
    saved.gameState.sentences[0] = "The children played happily outside.";
    localStorage.setItem(key, JSON.stringify(saved));
  }, phonicsKey("sentence", "hard"));
  await page.goto("/preview/game-overlay.html?game=word-hopscotch&difficulty=hard&sound=1");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".psw-hud")).toContainText("Read the printed sentence");
  await expect(page.locator(".psw-replay")).toBeDisabled();
  await expect(page.locator(".psw-sentence-model p")).toHaveText("The children played happily outside.");
  await page.getByRole("button", { name: "Hop to The", exact: true }).press("Enter");
  await expect(page.locator(".psw-hop")).toHaveAttribute("data-hop-index", "1");
});

async function openRepairFixture(page, fix, difficulty = "easy") {
  await open(page, "reading-race", difficulty, 0);
  await page.evaluate(({ key, repair }) => {
    const saved = JSON.parse(localStorage.getItem(key));
    saved.gameState.fixes[0] = repair;
    saved.stage = { round: 0, data: {} };
    localStorage.setItem(key, JSON.stringify(saved));
  }, { key: phonicsKey("quiz", difficulty), repair: fix });
  await page.goto(`/preview/game-overlay.html?game=reading-race&difficulty=${difficulty}&sound=1`);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".psw-repair")).toBeVisible();
}

test("repair voice reads only the instruction before an answer, then the actual repaired sentence", async ({ page }) => {
  const requested = [];
  page.on("request", request => { if (request.url().endsWith(".mp3")) requested.push(request.url()); });
  await page.route("**/*.mp3", route => route.abort());
  const fix = SENTENCE_FIX.easy[0];
  await openRepairFixture(page, fix);
  await page.getByRole("button", { name: "Hear the repair instruction", exact: true }).click();
  await expect.poll(() => requested.some(url => url.endsWith(getLedaInstructionAudioPath(fix.prompt)))).toBe(true);
  expect(requested.some(url => url.endsWith(getLedaInstructionAudioPath(fix.say)))).toBe(false);
  await page.getByRole("button", { name: "Use The", exact: true }).click();
  await expect(page.locator(".psw-repair-sign p")).toHaveText(fix.say);
  await expect.poll(() => requested.some(url => url.endsWith(getLedaInstructionAudioPath(fix.say)))).toBe(true);
});

test("missing punctuation instructions expose Read text without voicing the completed answer early", async ({ page }) => {
  const requested = [];
  page.on("request", request => { if (request.url().endsWith(".mp3")) requested.push(request.url()); });
  await page.route("**/*.mp3", route => route.abort());
  const fix = SENTENCE_FIX.easy[1];
  await openRepairFixture(page, fix);
  await expect(page.locator(".psw-hud")).toContainText(fix.prompt);
  await expect(page.getByRole("button", { name: "Read the sign", exact: true })).toBeDisabled();
  await expect(page.locator(".psw-replay")).toContainText("Read text");
  expect(requested.some(url => url.endsWith(getLedaInstructionAudioPath(fix.say)))).toBe(false);
  await page.getByRole("button", { name: "Use full stop", exact: true }).press("Enter");
  await expect(page.locator(".psw-repair-sign p")).toHaveText(fix.say);
  await expect(page.getByRole("button", { name: "Hear the fixed sentence", exact: true })).toBeEnabled();
});

test("accepted pronoun her retains Read text and never plays the canonical his sentence", async ({ page }) => {
  const requested = [];
  page.on("request", request => { if (request.url().endsWith(".mp3")) requested.push(request.url()); });
  await page.route("**/*.mp3", route => route.abort());
  const fix = SENTENCE_FIX.hard.find(repair => repair.acceptedAnswers?.includes("her"));
  await openRepairFixture(page, fix, "hard");
  await page.getByRole("button", { name: "Use her", exact: true }).click();
  await expect(page.locator(".psw-repair-sign p")).toHaveText("The wizard kept her wand by the door.");
  await expect(page.getByRole("button", { name: "Read the fixed sentence", exact: true })).toBeDisabled();
  expect(requested.some(url => url.endsWith(getLedaInstructionAudioPath(fix.say)))).toBe(false);
});

async function failPracticeSaving(page, key) {
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    window.__practiceSaveBlocked = true;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && window.__practiceSaveBlocked) throw new DOMException("Synthetic preview save failure", "QuotaExceededError");
      return original.call(this, name, value);
    };
  }, key);
}
for (const [game, mode] of [["word-hopscotch", "sentence"], ["reading-race", "quiz"]]) {
  test(`${game} holds a frozen wrong choice through failed saving and retries the same response`, async ({ page }) => {
    test.setTimeout(60000); await open(page, game);
    const key = phonicsKey(mode, "easy"), saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    await failPracticeSaving(page, key);
    if (mode === "sentence") {
      const target = saved.gameState.sentences[0].replace(/[.?!]/g, "").split(/\s+/)[0];
      await page.locator(".psw-word-stone").filter({ hasNotText: new RegExp(`^${target}$`) }).first().click();
    } else {
      const fix = saved.gameState.fixes[0], other = fix.options.find(piece => !(fix.acceptedAnswers || [fix.answer]).includes(piece));
      await page.locator(".psw-repair-piece").getByText(other, { exact: true }).click();
    }
    await expect(page.getByRole("alert")).toContainText("Retry saving");
    await expect(page.locator(".psw-word-stone,.psw-repair-piece")).toHaveCount(0);
    await expect(page.locator(".psw-game [data-learning-phase]").first()).toHaveAttribute("data-learning-phase", "receipt");
    await page.waitForTimeout(2700);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).round, key)).toBe(0);
    await page.evaluate(() => { window.__practiceSaveBlocked = false; });
    await page.getByRole("button", { name: "Retry save", exact: true }).click();
    await expect(page.locator("[data-learning-phase=teaching]").first()).toBeVisible();
    const episode = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode, key);
    expect(episode.firstResponse.observedCorrect).toBe(false); expect(episode.responses).toHaveLength(1);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).evidence.firstResponses.length, key)).toBe(1);
  });
  test(`${game} blocks native correct progress and reward until the same answer saves`, async ({ page }) => {
    test.setTimeout(60000); await open(page, game);
    const key = phonicsKey(mode, "easy"), saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    await failPracticeSaving(page, key);
    if (mode === "sentence") {
      const word = saved.gameState.sentences[0].replace(/[.?!]/g, "").split(/\s+/)[0];
      await page.getByRole("button", { name: `Hop to ${word}`, exact: true }).click();
      await expect(page.locator(".psw-hop")).toHaveAttribute("data-hop-index", "0");
    } else await page.getByRole("button", { name: `Use ${REPAIR_MARK_NAMES[saved.gameState.fixes[0].answer] || saved.gameState.fixes[0].answer}`, exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Retry saving");
    await page.waitForTimeout(2700);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).score, key)).toBe(0);
    await page.evaluate(() => { window.__practiceSaveBlocked = false; });
    await page.getByRole("button", { name: "Retry save", exact: true }).press("Enter");
    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).score, key)).toBeGreaterThan(0);
    const recorded = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    expect(recorded.evidence.firstResponses).toHaveLength(1);
    await page.reload(); await page.getByRole("button", { name: "Continue", exact: true }).click();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).score, key)).toBe(recorded.score);
  });
}
for (const [width, height] of [[320,568], [768,1024], [1024,768]]) for (const [game, mode] of [["word-hopscotch", "sentence"], ["reading-race", "quiz"]]) {
  test(`${game} keeps modeled and transfer controls in its world at ${width}x${height}`, async ({ page }) => {
    test.setTimeout(60000); await page.setViewportSize({ width, height }); await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, game, "hard");
    const key = phonicsKey(mode,"hard"), saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    if (mode === "sentence") {
      const target = saved.gameState.sentences[0].replace(/[.?!]/g, "").split(/\s+/)[0];
      await page.locator(".psw-word-stone").filter({ hasNotText: new RegExp(`^${target}$`) }).first().click();
    } else {
      const fix = saved.gameState.fixes[0], other = fix.options.find(piece => !(fix.acceptedAnswers || [fix.answer]).includes(piece));
      await page.locator(".psw-repair-piece").getByText(other, {exact:true}).click();
    }
    await expect(page.locator("[data-learning-phase=teaching]").first()).toBeVisible();
    await expect(page.locator("[data-guided-model]:enabled").first()).toBeInViewport({ ratio: 1 });
    await expectFullNativeHit(page.locator("[data-guided-model]:enabled").first());
    await page.screenshot({ path: `${EVIDENCE}/${game}-teaching-initial-${width}x${height}.png` });
    const action = page.locator("[data-guided-model]:enabled").first(); await action.scrollIntoViewIfNeeded();
    const rect = await action.boundingBox(); expect(rect.width).toBeGreaterThanOrEqual(56); expect(rect.height).toBeGreaterThanOrEqual(56);
    expect(await action.evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })).toBe(true);
    await page.screenshot({ path: `${EVIDENCE}/${game}-teaching-${width}x${height}.png` });
    await finishGuided(page);
    if (await page.locator("[data-learning-phase=answer]").count()) {
      await expect(page.getByText("Try a new one", {exact:true})).toBeVisible();
      const choice = page.locator(".learning-guided-action:enabled").first(); await choice.scrollIntoViewIfNeeded();
      const bounds = await choice.boundingBox(); expect(bounds.width).toBeGreaterThanOrEqual(56); expect(bounds.height).toBeGreaterThanOrEqual(56);
      expect(await choice.evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })).toBe(true);
      for (const target of await page.locator("[data-learning-phase=answer] .learning-guided-action").all()) { await target.scrollIntoViewIfNeeded(); await expectFullNativeHit(target); }
      if (mode === "sentence") await expect(page.locator("[data-learning-phase=answer] .learning-teaching-passage")).toBeInViewport({ ratio: .5 });
      await page.screenshot({ path: `${EVIDENCE}/${game}-transfer-${width}x${height}.png` });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}


test("Fix-It transfer replays its instruction without speaking its accepted sentence before the response", async ({page}) => {
  test.setTimeout(60000); const requested=[];
  page.on("request", request => { if (request.url().endsWith(".mp3")) requested.push(request.url()); });
  await page.route("**/*.mp3", route=>route.abort());
  const fix=SENTENCE_FIX.easy[0]; await openRepairFixture(page,fix);
  await page.getByRole("button",{name:"Use the",exact:true}).click();
  await expect(page.locator("[data-learning-phase=teaching]").first()).toBeVisible();
  await expect.poll(()=>requested.some(url=>url.endsWith(getLedaInstructionAudioPath(fix.say)))).toBe(true);
  await finishGuided(page);
  await expect(page.getByText("Try a new one",{exact:true})).toBeVisible();
  const episode=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,phonicsKey("quiz","easy"));
  const transfer=episode.question, line=transfer.display.replace("___",episode.expected), answerPath=getLedaInstructionAudioPath(line);
  expect(answerPath).toBeTruthy(); expect(line).not.toBe(fix.say);
  await page.getByRole("button",{name:"Listen again",exact:true}).click();
  await expect.poll(()=>requested.some(url=>url.endsWith(getLedaInstructionAudioPath(transfer.instructionCue)))).toBe(true);
  expect(requested.some(url=>url.endsWith(answerPath))).toBe(false);
  await expect(page.locator("[data-learning-phase=answer] .learning-teaching-passage")).toHaveText(transfer.display);
  await page.getByRole("button",{name:`Choose ${episode.expected}`,exact:true}).press("Enter");
  const receipt=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,phonicsKey("quiz","easy"));
  expect(receipt.firstResponse.observedCorrect).toBe(false); expect(receipt.responses[1].observedCorrect).toBe(true);
  await expect(page.locator(".psw-feedback")).toContainText(line);
  await page.getByRole("button",{name:"Listen again",exact:true}).click();
  await expect.poll(()=>requested.some(url=>url.endsWith(answerPath))).toBe(true);
});


function legacySentenceClosure(source, mode, round, guided, applied) {
  const saved = structuredClone(source), words = line => line.replace(/[.?!]/g, "").split(/\s+/);
  const sentence = saved.gameState.sentences?.[round], fix = saved.gameState.fixes?.[round];
  const prefix = mode === "sentence" ? guided ? 1 : words(sentence).length - 1 : 0;
  const priorActions = mode === "sentence" ? saved.gameState.sentences.slice(0, round).reduce((count, line) => count + words(line).length, prefix) : round;
  const unit = mode === "sentence" ? 10 : 25;
  let score = 0;
  for (let index = 0; index < priorActions; index += 1) score += unit + Math.min(10, index * 2);
  const before = { score, streak: priorActions, correct: round };
  const task = guided ? mode === "sentence" ? hopLearningTask(saved.gameState, round, prefix) : repairLearningTask(saved.gameState, round, fix.options) : null;
  let episode = null;
  if (task) {
    const selected = mode === "sentence" ? [words(sentence).find(word => word !== task.expected[0])] : fix.options.find(piece => !(fix.acceptedAnswers || [fix.answer]).includes(piece));
    episode = createLearningResponseEpisode({ id: `legacy-${mode}-${round}`, instrument: mode === "sentence" ? "recognition_sentence" : "recognition_repair", slotId: `legacy-slot-${round}`, ...task });
    episode = advanceLearningResponseReceipt(commitLearningResponse(episode, { selected, correct: false, supported: true }));
    episode = recordLearningGuidedAction(episode, episode.expected);
    if (episode.role === "transfer") episode = advanceLearningResponseReceipt(commitLearningResponse(episode, { selected: episode.expected, correct: true, supported: true }));
    expect(episode.phase).toBe("complete");
  }
  const discovery = mode === "sentence" ? { id: `sentence-${round}`, sentence } : { id: `repair-${round}`, sentence: fix.display.replace("___", fix.answer), index: round };
  const assisted = episode ? { game: mode === "sentence" ? "word-hopscotch" : "sentence-fix-it", round, attempts: 1, independent: false, practiceOnly: true, learningEpisode: episode } : null;
  const earned = (mode === "sentence" && guided ? 10 * task.expected.length : unit) + Math.min(10, before.streak * 2);
  Object.assign(saved, before, { round, wrongs: guided ? 1 : 0, modelNext: false });
  delete saved.acceptedReceipts;
  saved.discoveries = Array.from({ length: round }, (_, index) => ({ id: `${mode === "sentence" ? "sentence" : "repair"}-${index}`, sentence: "Prior completed slot" }));
  saved.evidence = { firstResponses: [{ round: mode === "sentence" ? `${round}:${prefix}` : round, correct: !guided, response: episode?.firstResponse.selected || (mode === "sentence" ? words(sentence).at(-1) : fix.answer) }], assistedRetries: [] };
  saved.stage = { round, data: mode === "sentence" ? { index: words(sentence).length, feedback: `You built: ${sentence}`, attempts: guided ? 1 : 0, recovery: null, learningEpisode: episode }
    : { answer: fix.answer, options: fix.options, feedback: "Repaired", attempts: guided ? 1 : 0, recovery: null, learningEpisode: episode } };
  if (applied) {
    saved.score += earned; saved.streak += 1; saved.correct += 1; saved.discoveries.push(discovery);
    if (assisted) saved.evidence.assistedRetries.push(assisted);
  }
  return { saved, expected: { score: before.score + earned, streak: before.streak + 1, correct: round + 1 }, episode, discovery };
}
async function restoreSentenceEnvelope(page, game, mode, saved) {
  await page.evaluate(({ key, progressKey, game, mode, saved }) => {
    const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
    progress.games ||= {}; progress.games[game] ||= {}; progress.games[game].checkpoints ||= {};
    progress.games[game].checkpoints.easy = { level: saved.round, totalLevels: mode === "sentence" ? saved.gameState.sentences.length : saved.gameState.fixes.length, sessionSeed: saved.gameState.sessionSeed };
    localStorage.setItem(progressKey, JSON.stringify(progress)); localStorage.setItem(key, JSON.stringify(saved));
  }, { key: phonicsKey(mode, "easy"), progressKey: PROGRESS, game, mode, saved });
  await page.reload(); await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".psw-game")).toBeVisible();
}
for (const [game, mode] of [["word-hopscotch", "sentence"], ["reading-race", "quiz"]]) for (const round of [0,4]) for (const guided of [false,true]) {
  test(`${game} cold accepted ${guided ? "guided" : "native"} round ${round} applies missing legacy credit once and preserves applied credit`, async ({page}) => {
    test.setTimeout(90000); await open(page, game); const key=phonicsKey(mode,"easy");
    const source=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    for (const applied of [false,true]) {
      const fixture=legacySentenceClosure(source,mode,round,guided,applied);
      await restoreSentenceEnvelope(page,game,mode,fixture.saved);
      await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).correct,key)).toBe(fixture.expected.correct);
      const closed=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
      expect(closed.score).toBe(fixture.expected.score); expect(closed.streak).toBe(fixture.expected.streak);
      expect(closed.discoveries.filter(item=>item.id===fixture.discovery.id)).toHaveLength(1);
      expect(closed.evidence.firstResponses).toEqual(fixture.saved.evidence.firstResponses);
      expect(closed.evidence.assistedRetries).toHaveLength(guided ? 1 : 0);
      if (guided) expect(closed.evidence.assistedRetries[0].learningEpisode).toEqual(fixture.episode);
      await restoreSentenceEnvelope(page,game,mode,closed);
      const repeated=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
      expect(repeated.score).toBe(closed.score); expect(repeated.correct).toBe(closed.correct); expect(repeated.streak).toBe(closed.streak);
      expect(repeated.evidence).toEqual(closed.evidence); expect(repeated.discoveries).toEqual(closed.discoveries);
      await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).round,key),{timeout:30000}).toBe(round+1);
    }
  });
}
for (const [game,mode] of [["word-hopscotch","sentence"],["reading-race","quiz"]]) test(`${game} captured early accepted writes contain credit before the scene advances`, async({page})=>{
  test.setTimeout(60000); await open(page,game); const key=phonicsKey(mode,"easy");
  const initial=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  await page.evaluate(key=>{
    window.__sentenceAcceptedWrites=[]; const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(name,value){
      if(name===key){const state=JSON.parse(value); if(state.acceptedReceipts?.length) window.__sentenceAcceptedWrites.push(state);}
      return original.call(this,name,value);
    };
  },key);
  if(mode==="sentence") {
    const words=initial.gameState.sentences[0].replace(/[.?!]/g,"").split(/\s+/);
    for(const word of words) await page.getByRole("button",{name:`Hop to ${word}`,exact:true}).click();
    const writes=await page.evaluate(()=>window.__sentenceAcceptedWrites);
    for(let index=1;index<=words.length;index+=1){
      const first=writes.find(state=>state.stage.data.index===index); expect(first).toBeTruthy();
      expect(first.acceptedReceipts).toContain(`hop:0:${index-1}`); expect(first.streak).toBe(index);
      expect(first.score).toBe(Array.from({length:index},(_,i)=>10+Math.min(10,i*2)).reduce((a,b)=>a+b,0));
      if(index===words.length){expect(first.correct).toBe(1); expect(first.discoveries.some(item=>item.id==="sentence-0")).toBe(true);}
    }
  } else {
    const fix=initial.gameState.fixes[0]; await page.getByRole("button",{name:`Use ${REPAIR_MARK_NAMES[fix.answer]||fix.answer}`,exact:true}).click();
    const first=await page.evaluate(()=>window.__sentenceAcceptedWrites.find(state=>state.stage.data.answer));
    expect(first.acceptedReceipts).toContain("repair:0:native"); expect(first.score).toBe(25); expect(first.streak).toBe(1); expect(first.correct).toBe(1);
    expect(first.discoveries.some(item=>item.id==="repair-0")).toBe(true);
  }
});

for (const [game, mode] of [["word-hopscotch", "sentence"], ["reading-race", "quiz"]]) {
  test(`${game} holds a failed accepted write across reload without reopening its native guess`, async ({page}) => {
    test.setTimeout(60000); await open(page,game); const key=phonicsKey(mode,"easy");
    const initial=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    await page.evaluate(key=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){if(name===key && JSON.parse(value).acceptedReceipts?.length) throw new DOMException("Held accepted write","QuotaExceededError"); return original.call(this,name,value);};
    },key);
    const value=mode==="sentence" ? initial.gameState.sentences[0].split(/\s+/)[0] : initial.gameState.fixes[0].answer;
    await page.getByRole("button",{name:mode==="sentence" ? `Hop to ${value}` : `Use ${REPAIR_MARK_NAMES[value]||value}`,exact:true}).click();
    await expect(page.getByRole("alert")).toContainText("Retry saving");
    const held=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    expect(held.score).toBe(0); expect(held.correct).toBe(0); expect(held.stage.data.pendingAcceptance).toBeTruthy();
    if(mode==="sentence") expect(held.stage.data.index).toBe(0); else expect(held.stage.data.answer).toBe("");
    await page.reload(); await page.getByRole("button",{name:"Continue",exact:true}).click();
    await expect(page.getByRole("alert")).toContainText("Retry saving");
    await expect(page.locator(".psw-word-stone:enabled,.psw-repair-piece:enabled")).toHaveCount(0);
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).score,key)).toBe(0);
    await page.getByRole("button",{name:"Retry save",exact:true}).press("Enter");
    await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).score,key)).toBe(mode==="sentence" ? 10 : 25);
    const accepted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    expect(accepted.evidence.firstResponses).toEqual(held.evidence.firstResponses); expect(accepted.acceptedReceipts).toHaveLength(1);
    await page.reload(); await page.getByRole("button",{name:"Continue",exact:true}).click();
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).score,key)).toBe(accepted.score);
    if(mode==="sentence") await expect(page.locator(".psw-hop")).toHaveAttribute("data-hop-index","1");
  });
  test(`${game} guided completion early write includes its exact assisted episode and one credit`, async ({page}) => {
    test.setTimeout(90000); await open(page,game); const key=phonicsKey(mode,"easy");
    const initial=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    await page.evaluate(key=>{
      window.__sentenceGuidedWrites=[]; const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){if(name===key){const state=JSON.parse(value); if(state.acceptedReceipts?.some(id=>id.endsWith(":guided"))) window.__sentenceGuidedWrites.push(state);} return original.call(this,name,value);};
    },key);
    if(mode==="sentence") {
      const target=initial.gameState.sentences[0].split(/\s+/)[0]; await page.locator(".psw-word-stone").filter({hasNotText:new RegExp(`^${target}$`)}).first().click();
    } else {
      const fix=initial.gameState.fixes[0], other=fix.options.find(piece=>!(fix.acceptedAnswers||[fix.answer]).includes(piece)); await page.getByRole("button",{name:`Use ${REPAIR_MARK_NAMES[other]||other}`,exact:true}).click();
    }
    await expect(page.locator("[data-learning-phase=teaching]").first()).toBeVisible(); await finishGuided(page);
    if(await page.locator("[data-learning-phase=answer]").count()) {
      const transfer=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,key);
      for(const expected of Array.isArray(transfer.expected) ? transfer.expected : [transfer.expected]) await page.getByRole("button",{name:`Choose ${expected}`,exact:true}).click();
    }
    await expect.poll(()=>page.evaluate(()=>window.__sentenceGuidedWrites.length)).toBeGreaterThan(0);
    const accepted=await page.evaluate(()=>window.__sentenceGuidedWrites[0]);
    expect(accepted.correct).toBe(1); expect(accepted.streak).toBe(1); expect(accepted.evidence.firstResponses[0].correct).toBe(false);
    expect(accepted.evidence.assistedRetries).toHaveLength(1); const episode=accepted.evidence.assistedRetries[0].learningEpisode;
    expect(episode.phase).toBe("complete"); expect(episode.firstResponse.observedCorrect).toBe(false); expect(accepted.stage.data.learningEpisode).toEqual(episode);
    expect(accepted.score).toBe(mode==="sentence" ? 10*episode.firstExpected.length : 25); expect(accepted.stage.data.recovery).toBeNull();
    expect(accepted.discoveries.some(item=>item.id===(mode==="sentence" ? "sentence-0" : "repair-0"))).toBe(true);
  });
}

test("Hopscotch preserves a historic partial prefix without inventing unverifiable per-word credit", async ({page}) => {
  test.setTimeout(60000); await open(page,"word-hopscotch"); const key=phonicsKey("sentence","easy");
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key), words=saved.gameState.sentences[0].replace(/[.?!]/g,"").split(/\s+/);
  saved.stage={round:0,data:{index:1,feedback:`${words[0]} fits next.`,attempts:0,recovery:null,learningEpisode:null}};
  saved.evidence.firstResponses=[{round:"0:0",correct:true,response:words[0]}]; saved.score=0; saved.streak=0; delete saved.acceptedReceipts;
  await restoreSentenceEnvelope(page,"word-hopscotch","sentence",saved);
  await expect(page.locator(".psw-hop")).toHaveAttribute("data-hop-index","1");
  await expect(page.locator(".psw-reached-stone")).toContainText(words[0]);
  const restored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  expect(restored.score).toBe(0); expect(restored.evidence).toEqual(saved.evidence);
  await page.getByRole("button",{name:`Hop to ${words[1]}`,exact:true}).press("Enter");
  const next=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  expect(next.stage.data.index).toBe(2); expect(next.score).toBe(10); expect(next.acceptedReceipts).toEqual(["hop:0:1"]);
  expect(next.evidence.firstResponses[0]).toEqual(saved.evidence.firstResponses[0]);
});


const PHONE_EVIDENCE=".artifacts/phonics-overhaul/sentences-phone-followup";
async function savedHardPhoneQuestion(page, game, update) {
  const mode=game==="word-hopscotch" ? "sentence" : "quiz", key=phonicsKey(mode,"hard");
  await page.setViewportSize({width:320,height:568}); await page.emulateMedia({reducedMotion:"reduce"}); await open(page,game,"hard");
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key); update(saved);
  await page.evaluate(({key,progressKey,game,mode,saved})=>{
    const progress=JSON.parse(localStorage.getItem(progressKey));
    progress.games[game].checkpoints.hard={level:0,totalLevels:mode==="sentence" ? saved.gameState.sentences.length : saved.gameState.fixes.length,sessionSeed:saved.gameState.sessionSeed};
    localStorage.setItem(key,JSON.stringify(saved));localStorage.setItem(progressKey,JSON.stringify(progress));
  },{key,progressKey:PROGRESS,game,mode,saved});
  await page.reload(); await page.getByRole("button",{name:"Continue",exact:true}).click();
  return {key,saved};
}
async function phoneModelAndTransfer(page, key, filename) {
  await expect(page.locator("[data-learning-phase=teaching]").first()).toBeVisible();
  const first=page.locator("[data-guided-model]:enabled").first();
  await expect(first).toBeInViewport({ratio:1}); await expectFullNativeHit(first);
  await expect(page.getByRole("heading",{name:"Look, listen, then match",exact:true})).toBeInViewport({ratio:1});
  await mkdir(PHONE_EVIDENCE,{recursive:true}); await page.screenshot({path:`${PHONE_EVIDENCE}/${filename}-model-320.png`});
  const original=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,key);
  await finishGuided(page,async control=>{await control.scrollIntoViewIfNeeded();await expectFullNativeHit(control);});
  if(await page.locator("[data-learning-phase=answer]").count()) {
    const transfer=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,key);
    expect(transfer.role).toBe("transfer"); expect(transfer.question.id).not.toBe(original.firstQuestion.id); expect(transfer.firstResponse).toEqual(original.firstResponse);
    for(const control of await page.locator("[data-learning-phase=answer] .learning-guided-action").all()){await control.scrollIntoViewIfNeeded();await expectFullNativeHit(control);}
    await expect(page.getByText("Try a new one",{exact:true})).toBeVisible();
    await page.screenshot({path:`${PHONE_EVIDENCE}/${filename}-transfer-320.png`});
  }
}
test("Hopscotch exact Linux seed1616459298 keeps the first complete phone matching target",async({page})=>{
  test.setTimeout(60000);
  const {key,saved}=await savedHardPhoneQuestion(page,"word-hopscotch",saved=>{
    saved.gameState={modelSentence:"Could a robot learn to paint?",sentences:["The rocket flew higher than the birds.","The astronauts were floating in space.","On Monday we read a space book.","Seeds need water and sun to grow.","The knight rode his horse to the castle.","We went to the shop.","We saw two stars in the night sky."],rerollKey:0,sessionSeed:1616459298};
  });
  await expect(page.locator(".psw-sentence-model p")).toHaveText(saved.gameState.sentences[0]);
  await page.getByRole("button",{name:"Hop to birds",exact:true}).click();
  await phoneModelAndTransfer(page,key,"ci-seed1616459298");
});
test("Hopscotch longest eligible hard model retains full first phone target and reachable sequential words",async({page})=>{
  test.setTimeout(60000);
  const pool=[...new Set([...SENTENCES.level3,...SENTENCE_FIX.hard.map(fix=>fix.say)])]
    .filter(line=>getLedaInstructionAudioPath(line)&&new Set(line.replace(/[.?!]/g,"").split(/\s+/)).size>=3).sort((a,b)=>b.length-a.length);
  const {key}=await savedHardPhoneQuestion(page,"word-hopscotch",saved=>{saved.gameState.sentences[0]=pool[0];});
  const target=pool[0].split(/\s+/)[0]; await page.locator(".psw-word-stone").filter({hasNotText:new RegExp(`^${target}$`)}).first().click();
  await phoneModelAndTransfer(page,key,"longest-hop");
});
test("Fix-It longest hard coaching retains complete phone target and actual repair context",async({page})=>{
  test.setTimeout(60000);
  const longest=[...SENTENCE_FIX.hard].sort((a,b)=>`${b.prompt} ${repairFeedback(b,b.answer,true)} ${b.say}`.length-`${a.prompt} ${repairFeedback(a,a.answer,true)} ${a.say}`.length)[0];
  const {key}=await savedHardPhoneQuestion(page,"reading-race",saved=>{saved.gameState.fixes[0]=longest;});
  const wrong=longest.options.find(piece=>!(longest.acceptedAnswers||[longest.answer]).includes(piece)); await page.getByRole("button",{name:`Use ${REPAIR_MARK_NAMES[wrong]||wrong}`,exact:true}).click();
  await phoneModelAndTransfer(page,key,"longest-fix");
  const episode=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,key);
  expect(episode.firstQuestion.display).toBe(longest.display);
});
