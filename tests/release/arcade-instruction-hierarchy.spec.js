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
  const buildGoal = player.locator('[data-gg="coach"]');
  const replay = player.locator('[data-gg="hear"]');
  await expect(action).toBeVisible();
  await expect(buildGoal).toBeVisible();
  await expect(buildGoal).toContainText(/Build .+:/);
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
  await player.getByRole("button", { name: /TO THE YARD/ }).click();

  const action = player.locator(".sx-objective");
  const target = player.locator(".sx-target");
  const replay = player.getByRole("button", { name: "Hear the sentence again", exact: true });
  await expect(action).toHaveText("Tap the word cars in sentence order.");
  await expect(target).toBeVisible();
  await expect(target).not.toBeEmpty();
  await expect(replay).toBeVisible();

  expect((await readableStyles(action)).fontSize).toBeGreaterThanOrEqual(18);
  expect((await readableStyles(target)).fontSize).toBeGreaterThanOrEqual(20);
  const replayStyles = await readableStyles(replay);
  expect(replayStyles.fontSize).toBeGreaterThanOrEqual(16);
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

  const replay = player.locator(".soundkeys-listen");
  await expect(replay).toBeVisible();
  await expect(replay).toHaveText(/Hear word(?: again)?/);
  await expect(replay).toHaveAttribute("aria-label", /Hear .+ again/);

  const replayStyles = await readableStyles(replay);
  expect(replayStyles.fontSize).toBeGreaterThanOrEqual(16);
  expect(replayStyles.width).toBeGreaterThanOrEqual(56);
  expect(replayStyles.height).toBeGreaterThanOrEqual(56);

  await player.getByRole("button", { name: "Turn spoken audio and game sounds off" }).click();
  await expect(replay).toBeDisabled();
  await expect(replay).toHaveText(/Sound (?:is )?off/);
  await expect(replay).toHaveAttribute("aria-label", "Word replay unavailable while sound is off");
  await player.getByRole("button", { name: "Turn spoken audio and game sounds on" }).click();
  await expect(replay).toBeEnabled();
  await expect(replay).toHaveText(/Hear word(?: again)?/);
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
