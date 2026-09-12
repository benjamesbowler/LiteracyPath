import { expect, test } from "@playwright/test";
import { adventureWordsRhyme, onsetGrapheme, sharesSound } from "../../src/components/elQuest/elQuestEngine.js";

async function openStation(page, cycle, station) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}`,
    { waitUntil: "domcontentloaded" });
  const round = page.locator(`[data-quest-view="round"][data-station-id="${station}"]`);
  await expect(round.locator("[data-mechanic-stage]")).toBeVisible();
  await expect(round.getByRole("button", { name: /Open sound gate|Check tags|Reveal and check|Check my letter/ })).toHaveCount(0);
  return round;
}

async function expectRound(page, index, total) {
  await expect(page.getByRole("heading", { name: `${index} of ${total}`, exact: true })).toBeVisible();
}

async function roundTotal(page) {
  const heading = await page.locator(".adventure-round-frame__heading h1").textContent();
  return Number(heading.match(/of (\d+)/)[1]);
}

async function pictureWords(stage) {
  return stage.locator(".am-simple-picture-choice").evaluateAll(buttons => buttons.map(button =>
    button.getAttribute("aria-label").replace(/^Choose /, "")));
}

async function choosePicture(stage, word) {
  await stage.getByRole("button", { name: `Choose ${word}`, exact: true }).click();
}

test("letter matching advances from one keyboard answer", async ({ page }) => {
  const round = await openStation(page, "cycle-1", "letters");
  const total = await roundTotal(page);
  const stage = round.locator('[data-mechanic-stage="letter-press"]');
  const model = (await stage.locator(".am-code-sign-slot").first().locator("strong").textContent()).trim();
  const answer = model === model.toUpperCase() ? model.toLowerCase() : model.toUpperCase();
  await stage.getByRole("button", { name: answer, exact: true }).focus();
  await page.keyboard.press("Enter");
  await expectRound(page, 2, total);
});

test("sound matching gives an immediate retry and advances without an extra gate", async ({ page }) => {
  // Cycle 24's first authored ending-sound target is ff. Distractor positions
  // and identities may change while the phonics objective stays the same.
  const round = await openStation(page, "cycle-24", "sounds");
  const total = await roundTotal(page);
  const stage = round.locator('[data-mechanic-stage="sound-choice"]');
  const choices = await stage.getByRole("button").allTextContents();
  const wrong = choices.find(choice => choice !== "ff");
  await stage.getByRole("button", { name: wrong, exact: true }).click();
  await expect(round.locator(".adventure-round-frame")).toHaveAttribute("data-feedback-tone", "retry");
  await expectRound(page, 1, total);
  const correct = stage.getByRole("button", { name: "ff", exact: true });
  await expect(correct).toBeEnabled();
  await correct.focus();
  await page.keyboard.press("Space");
  await expectRound(page, 2, total);
});

test("picture sounds accepts the picture itself and automatically continues", async ({ page }) => {
  const round = await openStation(page, "cycle-1", "hunt");
  const total = await roundTotal(page);
  const stage = round.locator('[data-mechanic-stage="scene-hunt"]');
  await expect(stage.locator(".am-simple-picture-choice")).toHaveCount(3);
  const target = (await stage.locator(".am-picture-target strong").textContent()).trim();
  const choices = await pictureWords(stage);
  const matches = word => sharesSound(onsetGrapheme(word), target);
  await choosePicture(stage, choices.find(word => !matches(word)));
  await expectRound(page, 1, total);
  await choosePicture(stage, choices.find(matches));
  await expectRound(page, 2, total);
});

test("hidden word cards reveal only when flipped, close a mismatch, and finish from matching pairs", async ({ page }) => {
  let round = await openStation(page, "cycle-1", "quick");
  const total = await roundTotal(page);
  let stage = round.locator('[data-mechanic-stage="word-memory"]');
  const cards = stage.locator("[data-card-id]");
  const ids = await cards.evaluateAll(buttons => buttons.map(button => button.dataset.cardId));
  expect(ids.length).toBeGreaterThanOrEqual(4);
  for (let index = 0; index < ids.length; index += 1) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute("data-card-state", "hidden");
    await expect(card).toHaveAttribute("aria-label", `Turn over card ${index + 1}`);
    await expect(card).toHaveText("");
    expect(ids[index]).toMatch(/^card-\d+-\d+$/);
  }
  const seen = new Map();
  async function reveal(id) {
    const card = stage.locator(`[data-card-id="${id}"]`);
    await card.click();
    const word = (await card.textContent()).trim();
    expect(word).toMatch(/^(?:I|[a-z]+)$/);
    seen.set(id, word);
    return word;
  }
  const firstWord = await reveal(ids[0]);
  const secondWord = await reveal(ids[1]);
  if (firstWord === secondWord) {
    // Having found the first pair, the next card must be another word.
    // Reopen the same activity to exercise a deliberate, visible mismatch.
    round = await openStation(page, "cycle-1", "quick");
    stage = round.locator('[data-mechanic-stage="word-memory"]');
    await reveal(ids[0]);
    await reveal(ids[2]);
  }
  await expect(round.locator(".adventure-round-frame")).toHaveAttribute("data-feedback-tone", "retry");
  await expect(stage.locator('[data-card-state="hidden"]')).toHaveCount(ids.length);
  await expectRound(page, 1, total);

  for (let attempt = 0; attempt < ids.length * 2; attempt += 1) {
    const matched = new Set(await stage.locator('[data-card-state="matched"]').evaluateAll(buttons => buttons.map(button => button.dataset.cardId)));
    const remaining = ids.filter(id => !matched.has(id));
    if (remaining.length === 2) {
      for (const id of remaining) await stage.locator(`[data-card-id="${id}"]`).click();
      await expectRound(page, 2, total);
      await expect(stage.locator('[data-card-state="hidden"]')).toHaveCount(ids.length);
      return;
    }
    const knownFirst = remaining.find(id => seen.has(id) && remaining.some(other => other !== id && seen.get(other) === seen.get(id)));
    const first = knownFirst || remaining.find(id => !seen.has(id)) || remaining[0];
    const word = await reveal(first);
    const second = remaining.find(id => id !== first && seen.get(id) === word)
      || remaining.find(id => id !== first && !seen.has(id))
      || remaining.find(id => id !== first);
    const otherWord = await reveal(second);
    if (word !== otherWord) {
      await expect(stage.locator('[data-card-state="open"]')).toHaveCount(0);
      await expect(stage.locator(`[data-card-id="${first}"]`)).toBeEnabled();
    }
  }
  throw new Error("The matching card game did not finish through its visible cards.");
});

test("letter grids retain found letters, reject distractors, and require every big and small target", async ({ page }) => {
  const round = await openStation(page, "cycle-2", "trace");
  const total = await roundTotal(page);
  const stage = round.locator('[data-mechanic-stage="letter-grid"]');
  let foundAM = false;
  for (let index = 0; index < total && !foundAM; index += 1) {
    await expect(stage.locator("[data-cell-id]")).toHaveCount(12);
    const targetLetters = (await stage.locator(".am-simple-target-letters").textContent()).toLowerCase().replace(/\s/g, "");
    const cells = await stage.locator("[data-cell-id]").evaluateAll(buttons => buttons.map(button => ({
      id: button.dataset.cellId, letter: button.querySelector("span").textContent
    })));
    const targets = cells.filter(cell => targetLetters.includes(cell.letter.toLowerCase()));
    const wrong = cells.find(cell => !targetLetters.includes(cell.letter.toLowerCase()));
    foundAM = targetLetters.includes("a") && targetLetters.includes("m");
    expect(targets.some(cell => cell.letter === cell.letter.toUpperCase())).toBe(true);
    expect(targets.some(cell => cell.letter === cell.letter.toLowerCase())).toBe(true);
    await stage.locator(`[data-cell-id="${wrong.id}"]`).click();
    await expect(stage.locator('[data-find-state="found"]')).toHaveCount(0);
    await expectRound(page, index + 1, total);
    for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
      const target = stage.locator(`[data-cell-id="${targets[targetIndex].id}"]`);
      await target.click();
      if (targetIndex < targets.length - 1) {
        await expect(target).toBeDisabled();
        await expect(stage.locator('[data-find-state="found"]')).toHaveCount(targetIndex + 1);
        await expectRound(page, index + 1, total);
      }
    }
    if (index + 1 < total) await expectRound(page, index + 2, total);
    else await expect(page.locator('[data-quest-view="celebration"]')).toBeVisible();
  }
  expect(foundAM, "the sequence includes big and small A and M together").toBe(true);
});

test("CVC games accept the first and last letter directly and preserve the pictured word on a miss", async ({ page }) => {
  const round = await openStation(page, "cycle-4", "build");
  const total = await roundTotal(page);
  const stage = round.locator('[data-mechanic-stage="missing-letter"]');
  for (let index = 0; index < 2; index += 1) {
    const position = index === 0 ? "start" : "end";
    await expect(stage).toHaveAttribute("data-missing-position", position);
    const word = (await stage.locator(".am-missing-letter__model .am-simple-hear").getAttribute("aria-label")).replace(/^Hear /, "");
    const answer = position === "start" ? word[0] : word.at(-1);
    const letters = stage.locator(".am-simple-letter-choices");
    const choices = await letters.getByRole("button").allTextContents();
    await letters.getByRole("button", { name: choices.find(choice => choice !== answer), exact: true }).click();
    await expect(stage.getByRole("button", { name: `Hear ${word}`, exact: true })).toBeVisible();
    await expectRound(page, index + 1, total);
    await letters.getByRole("button", { name: answer, exact: true }).click();
    await expectRound(page, index + 2, total);
  }
});

test("rhyme games compare two pictures, then find the odd word without a confirmation step", async ({ page }) => {
  const round = await openStation(page, "cycle-1", "play");
  const total = await roundTotal(page);
  let stage = round.locator('[data-mechanic-stage="rhyme-pair"]');
  const words = await pictureWords(stage);
  const pair = words.filter(word => words.some(other => adventureWordsRhyme(word, other)));
  expect(pair).toHaveLength(2);
  await choosePicture(stage, pair[0]);
  await expectRound(page, 1, total);
  await choosePicture(stage, words.find(word => !pair.includes(word)));
  await expect(round.locator(".adventure-round-frame")).toHaveAttribute("data-feedback-tone", "retry");
  for (const word of pair) await choosePicture(stage, word);
  await expectRound(page, 2, total);
  stage = round.locator('[data-mechanic-stage="rhyme-odd"]');
  const oddChoices = await pictureWords(stage);
  const odd = oddChoices.find(word => !oddChoices.some(other => adventureWordsRhyme(word, other)));
  await choosePicture(stage, odd);
  await expectRound(page, 3, total);
});

test("two compound pictures lead directly to their combined picture", async ({ page }) => {
  const round = await openStation(page, "cycle-1", "poem");
  const total = await roundTotal(page);
  const stage = round.locator('[data-mechanic-stage="compound-picture"]');
  await expect(stage.locator(".am-compound-pictures__parts img")).toHaveCount(2);
  const parts = await stage.locator(".am-compound-pictures__parts .am-simple-hear").evaluateAll(buttons =>
    buttons.map(button => button.getAttribute("aria-label").replace(/^Hear /, "")));
  await choosePicture(stage, parts.join(""));
  await expectRound(page, 2, total);
});

test("the large picture search keeps found objects and finishes only after every starting-sound picture", async ({ page }) => {
  const round = await openStation(page, "cycle-1", "search");
  const total = await roundTotal(page);
  const stage = round.locator('[data-mechanic-stage="picture-search"]');
  await expect(stage.locator(".am-picture-search__scene")).toBeVisible();
  await expect(stage.locator(".am-simple-picture-choice")).toHaveCount(9);
  const pictures = stage.locator(".am-simple-picture-choice");
  for (let index = 0; index < 9; index += 1) {
    const picture = pictures.nth(index);
    await picture.scrollIntoViewIfNeeded();
    await expect.poll(() => picture.evaluate(button => {
      const rect = button.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return Boolean(hit && (hit === button || button.contains(hit)));
    }), { message: `picture ${index + 1} must be reachable without an instruction overlay intercepting taps` }).toBe(true);
  }
  const target = (await stage.locator(".am-picture-target strong").textContent()).trim();
  const choices = await pictureWords(stage);
  const matches = word => sharesSound(onsetGrapheme(word), target);
  await choosePicture(stage, choices.find(word => !matches(word)));
  await expect(stage.locator('[data-find-state="found"]')).toHaveCount(0);
  const targets = choices.filter(matches);
  expect(targets.length).toBeGreaterThanOrEqual(2);
  for (let index = 0; index < targets.length; index += 1) {
    await choosePicture(stage, targets[index]);
    if (index < targets.length - 1) {
      await expect(stage.locator('[data-find-state="found"]')).toHaveCount(index + 1);
      await expectRound(page, 1, total);
    }
  }
  await expectRound(page, 2, total);
});
