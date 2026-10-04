import { expect, test } from "@playwright/test";

async function readableStyles(locator) {
  return locator.evaluate(element => {
    const styles = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      fontSize: Number.parseFloat(styles.fontSize),
      width: bounds.width,
      height: bounds.height
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    for (const gameId of ["grammar-grind", "star-gallery", "sentence-express", "reel-read", "sound-racer"]) {
      window.localStorage.setItem(`lp-arcade-onboarded-v1:${gameId}`, "1");
    }
  });
});

test("Spell & Skate keeps the exact build goal and replay action child-readable", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=grammar-grind&sound=1&music=0");
  const player = page.getByRole("dialog", { name: "Spell & Skate", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });

  const action = player.locator('[data-gg="prompt"]');
  const buildGoal = player.locator('[data-gg="sentence"]');
  const replay = player.locator('[data-gg="hear"]');
  await expect(action).toBeVisible();
  await expect(buildGoal).toBeVisible();
  await expect(buildGoal).not.toBeEmpty();
  await expect(action).toContainText(/Collect|Choose|Build/);
  await expect(replay).toBeVisible();
  await expect(replay).toHaveAttribute("aria-label", /Hear .+ again/);

  expect((await readableStyles(action)).fontSize).toBeGreaterThanOrEqual(22);
  expect((await readableStyles(buildGoal)).fontSize).toBeGreaterThanOrEqual(16);
  const replayStyles = await readableStyles(replay);
  expect(replayStyles.fontSize).toBeGreaterThanOrEqual(16);
  expect(replayStyles.width).toBeGreaterThanOrEqual(56);
  expect(replayStyles.height).toBeGreaterThanOrEqual(56);
});

test("Sentence Express prints its sentence goal beside a generous replay control", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=sentence-express&sound=1&music=0");
  const player = page.getByRole("dialog", { name: "Sentence Express", exact: true });
  await expect(player.getByRole("button", { name: /TO THE YARD/ })).toHaveCount(0);

  const action = player.locator(".sx-objective");
  const target = player.locator(".sx-target");
  const replay = player.getByRole("button", { name: "Hear the sentence again", exact: true });
  await expect(action).toHaveText("Tap the words to finish the sentence.");
  await expect(target).toBeVisible();
  await expect(target).not.toBeEmpty();
  await expect(replay).toBeVisible();

  expect((await readableStyles(action)).fontSize).toBeGreaterThanOrEqual(18);
  expect((await readableStyles(target)).fontSize).toBeGreaterThanOrEqual(20);
  const replayStyles = await readableStyles(replay);
  expect((await readableStyles(replay.locator("svg"))).width).toBeGreaterThanOrEqual(28);
  expect(replayStyles.width).toBeGreaterThanOrEqual(56);
  expect(replayStyles.height).toBeGreaterThanOrEqual(56);
});

test("Sentence Grove exposes a semantic 56-pixel sentence replay control", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=star-gallery&sound=1&music=0");
  const player = page.getByRole("dialog", { name: "Sentence Grove", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });

  const action = player.locator('[data-role="prompt"]');
  const sentence = player.locator('[data-role="display"]');
  const replay = player.getByRole("button", { name: "Hear the sentence again", exact: true });
  await expect(action).toBeVisible();
  await expect(sentence).toBeVisible();
  await expect(replay).toBeVisible();

  expect((await readableStyles(action)).fontSize).toBeGreaterThanOrEqual(18);
  expect((await readableStyles(sentence)).fontSize).toBeGreaterThanOrEqual(24);
  const replayStyles = await readableStyles(replay);
  expect(replayStyles.fontSize).toBeGreaterThanOrEqual(16);
  expect(replayStyles.width).toBeGreaterThanOrEqual(56);
  expect(replayStyles.height).toBeGreaterThanOrEqual(56);
});

test("SoundKeys names its word replay action and gives it a generous target", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=soundkeys&sound=1&music=0");
  const player = page.getByRole("dialog", { name: "SoundKeys", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });

  const replay = player.getByRole("button", { name: /^(?:Hear target word again|Word replay unavailable while sound is off)$/ });
  await expect(replay).toBeVisible();
  await expect(replay).toHaveText(/Hear/);
  await expect(replay).toHaveAttribute("aria-label", "Hear target word again");

  const replayStyles = await readableStyles(replay);
  expect(replayStyles.fontSize).toBeGreaterThanOrEqual(16);
  expect(replayStyles.width).toBeGreaterThanOrEqual(56);
  expect(replayStyles.height).toBeGreaterThanOrEqual(56);

  await player.getByRole("button", { name: "Open game controls", exact: true }).click();
  await player.getByRole("button", { name: "Turn spoken audio and game sounds off" }).click();
  await player.getByRole("button", { name: "Back to the game", exact: true }).click();
  await expect(replay).toBeDisabled();
  await expect(replay).toHaveText(/Sound (?:is )?off/);
  await expect(replay).toHaveAttribute("aria-label", "Word replay unavailable while sound is off");
  await player.getByRole("button", { name: "Open game controls", exact: true }).click();
  await player.getByRole("button", { name: "Turn spoken audio and game sounds on" }).click();
  await player.getByRole("button", { name: "Back to the game", exact: true }).click();
  await expect(replay).toBeEnabled();
  await expect(replay).toHaveText(/Hear/);
});

test("Reel & Read keeps a persistent semantic word replay clear of its play controls", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=1&music=0");
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });

  const replay = player.locator('[data-rr="replay"]');
  await expect(replay).toBeVisible();
  await expect(replay).toHaveText(/Hear word(?: again)?/);
  await expect(replay).toHaveAttribute("aria-label", /Hear .+ again/);

  const replayStyles = await readableStyles(replay);
  expect(replayStyles.fontSize).toBeGreaterThanOrEqual(16);
  expect(replayStyles.width).toBeGreaterThanOrEqual(56);
  expect(replayStyles.height).toBeGreaterThanOrEqual(56);
  const [replayBox, leftBox, rightBox, castBox] = await Promise.all([
    replay.boundingBox(),
    player.locator('[data-rr="left"]').boundingBox(),
    player.locator('[data-rr="right"]').boundingBox(),
    player.locator('[data-rr="cast"]').boundingBox()
  ]);
  for (const controlBox of [leftBox, rightBox, castBox]) {
    const overlaps = replayBox.x < controlBox.x + controlBox.width
      && replayBox.x + replayBox.width > controlBox.x
      && replayBox.y < controlBox.y + controlBox.height
      && replayBox.y + replayBox.height > controlBox.y;
    expect(overlaps).toBe(false);
  }
  await replay.click();
  await expect(replay).toBeVisible();

  await replay.evaluate(button => {
    window.__reelReplayKeyboard = { clicks: 0, keyDefaults: [] };
    button.addEventListener("click", () => { window.__reelReplayKeyboard.clicks += 1; }, true);
    window.addEventListener("keydown", event => {
      if (event.target === button && ["Enter", " "].includes(event.key)) window.__reelReplayKeyboard.keyDefaults.push(event.defaultPrevented);
    });
  });
  for (const [index, key] of ["Enter", "Space"].entries()) {
    await replay.focus();
    await page.keyboard.press(key);
    await expect.poll(() => page.evaluate(() => window.__reelReplayKeyboard.clicks)).toBe(index + 1);
  }
  expect(await page.evaluate(() => window.__reelReplayKeyboard.keyDefaults)).toEqual([false, false]);
  await page.screenshot({ path: ".artifacts/classroom-readiness/reel-replay-keyboard.png" });

  await player.getByRole("button", { name: "Turn spoken audio and game sounds off" }).click();
  await expect(replay).toBeDisabled();
  await expect(replay).toHaveText(/Sound (?:is )?off/);
  await expect(replay).toHaveAttribute("aria-label", "Word replay unavailable while sound is off");
  await player.getByRole("button", { name: "Turn spoken audio and game sounds on" }).click();
  await expect(replay).toBeEnabled();
  await expect(replay).toHaveText(/Hear word(?: again)?/);
});

test("Sound Racer keeps its 56-pixel replay and readable label text", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=sound-racer&sound=1&music=0");
  const player = page.getByRole("dialog", { name: "Sound Racer", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });

  const replay = player.locator('[data-sr="hear-target"]');
  await expect(replay).toBeVisible();
  await expect(replay).toHaveText(/Hear\s*sound/);
  await expect(replay).toHaveAttribute("aria-label", /Hear .+ sound again/);

  const replayStyles = await readableStyles(replay);
  expect(replayStyles.fontSize).toBeGreaterThanOrEqual(16);
  expect(replayStyles.width).toBeGreaterThanOrEqual(56);
  expect(replayStyles.height).toBeGreaterThanOrEqual(56);
});

test("Sentence Express reveals one current job, preserves retries and sends only a completed sentence", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=sentence-express&difficulty=medium&sound=1&music=0");
  const stage = page.locator(".sx-stage");
  await expect(stage).toHaveAttribute("data-task", "engine");
  await expect(page.getByText("Tap the engine with a capital letter.", { exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Words to finish the sentence" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send the train!", exact: true })).toHaveCount(0);
  const choices = page.getByRole("group", { name: "Choose an engine" }).getByRole("button");
  const names = await choices.allTextContents();
  const goodIndex = names.findIndex(word => /^[A-Z]/.test(word));
  const wrongIndex = 1 - goodIndex;
  const beforeTrain = await stage.getAttribute("data-train-id");
  await choices.nth(wrongIndex).click();
  await expect(stage).toHaveAttribute("data-task", "engine");
  await expect(page.locator(".sx-hint")).toHaveText("Only a capital can lead the train!");
  await choices.nth(goodIndex).focus();
  await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-task", "build");
  await expect(stage).toHaveAttribute("data-train-id", beforeTrain);
  await expect(page.locator(".sx-train .sx-carword").first()).toHaveText(names[goodIndex]);
  await expect(page.locator(".sx-nextslot")).toBeVisible();
  await expect(page.locator(".sx-workbench button").first()).toBeFocused();
  const sentence = await page.locator(".sx-target").textContent();
  const words = sentence.replace(/[.?!]$/, "").split(" ");
  for (const word of words.slice(1)) {
    await page.getByRole("button", { name: `couple ${word}`, exact: true }).first().click();
  }
  if (await stage.getAttribute("data-task") === "caboose") {
    await page.getByRole("group", { name: "Choose the end mark" }).getByRole("button", { name: sentence.slice(-1), exact: true }).click();
  }
  await expect(stage).toHaveAttribute("data-task", "send");
  await expect(stage).toHaveAttribute("data-phase", "shunt");
  const shownWords = await page.locator(".sx-train .sx-carword").allTextContents();
  expect(shownWords).toEqual([...words, sentence.slice(-1)]);
  await page.getByRole("button", { name: "Send the train!", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(stage).toHaveAttribute("data-phase", "depart");
  await expect(page.getByRole("button", { name: "Send the train!", exact: true })).toHaveCount(0);
});
