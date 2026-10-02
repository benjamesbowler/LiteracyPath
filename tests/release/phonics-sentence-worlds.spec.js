import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { SENTENCE_FIX } from "../../src/data/learnGamesData.js";
import { REPAIR_MARK_NAMES } from "../../src/components/learn/games/games/sentenceWorkshopModel.js";
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

async function finishGuided(page) {
  while (await page.locator("[data-guided-model]:enabled").count()) await page.locator("[data-guided-model]:enabled").first().click();
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
    if (width === 320) await expect(page.locator("[data-guided-model]:enabled").first()).toBeInViewport({ ratio: .9 });
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
