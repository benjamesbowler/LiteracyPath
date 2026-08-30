import { expect, test } from "@playwright/test";

import { wordStartsWithTargetSound } from "../../src/utils/rocketRunRounds.js";

async function openWordClimb(page, sound = 0) {
  await page.goto(`/preview/game-overlay.html?game=word-climb&sound=${sound}&music=0`);
  const player = page.getByRole("dialog", { name: "Word Climb", exact: true });
  await expect(player).toBeVisible();
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  return player;
}

async function currentTarget(player) {
  return (await player.locator('[data-wc="target"]').innerText()).replaceAll("/", "").trim();
}

async function currentChoices(player) {
  const choices = player.locator('[data-wc="choice"]');
  const words = await choices.locator("strong").allTextContents();
  return { choices, words };
}

async function chooseCorrect(player, target, method = "click") {
  const state = await currentChoices(player);
  const correctIndex = state.words.findIndex(word => wordStartsWithTargetSound(word, target));
  expect(correctIndex).toBeGreaterThanOrEqual(0);
  if (method === "keyboard") await state.choices.nth(correctIndex).press("Enter");
  else await state.choices.nth(correctIndex).click();
  return state;
}

async function setDocumentHidden(page, hidden) {
  await page.evaluate(nextHidden => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => nextHidden
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

test("Word Climb exposes equal semantic ledges, exact feedback, replay, keyboard play, and completion", async ({ page }) => {
  test.setTimeout(45_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  const player = await openWordClimb(page, 0);
  const target = await currentTarget(player);
  const replay = player.locator('[data-wc="replay"]');

  await expect(player.getByRole("heading", { name: `Choose the word starting with /${target}/.` })).toBeVisible();
  await expect(replay).toBeVisible();
  await expect(replay).toBeDisabled();
  await expect(replay).toHaveAttribute("aria-label", `Target is ${target}; sound is off`);

  const initial = await currentChoices(player);
  await expect(initial.choices).toHaveCount(3);
  const contracts = await initial.choices.evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return {
      tagName: node.tagName,
      width: box.width,
      height: box.height,
      backgroundImage: style.backgroundImage,
      borderRadius: style.borderRadius
    };
  }));
  expect(new Set(contracts.map(contract => contract.tagName))).toEqual(new Set(["BUTTON"]));
  expect(new Set(contracts.map(contract => contract.backgroundImage)).size).toBe(1);
  expect(new Set(contracts.map(contract => contract.borderRadius)).size).toBe(1);
  for (const contract of contracts) {
    expect(contract.width).toBeGreaterThanOrEqual(56);
    expect(contract.height).toBeGreaterThanOrEqual(56);
  }

  const wrongIndex = initial.words.findIndex(word => !wordStartsWithTargetSound(word, target));
  await initial.choices.nth(wrongIndex).click();
  await expect(player.locator('[data-wc="feedback"]')).toContainText(`${initial.words[wrongIndex]} starts with /`);
  await expect(player.locator('[data-wc="feedback"]')).toContainText(`Try a /${target}/ word.`);
  await expect(player.locator(".word-climb")).toHaveAttribute("data-wc-progress", "0");
  await expect(initial.choices.first()).toBeEnabled();

  for (let completed = 0; completed < 6; completed += 1) {
    await chooseCorrect(player, target, completed === 0 ? "keyboard" : "click");
    await expect(player.locator(".word-climb")).toHaveAttribute("data-wc-progress", String(completed + 1));
    if (completed < 5) {
      await expect(player.locator('[data-wc="choice"]').first()).toBeEnabled({ timeout: 3_000 });
    } else {
      await player.getByRole("button", { name: "Close Word Climb", exact: true }).click();
      const quit = page.getByRole("alertdialog", { name: "Quit Word Climb", exact: true });
      await expect(quit).toBeVisible();
      await page.waitForTimeout(900);
      await expect(page.getByRole("alertdialog", { name: "Word Climb complete", exact: true })).toHaveCount(0);
      await expect(quit).toBeVisible();
      await quit.getByRole("button", { name: "Keep playing", exact: true }).click();
    }
  }

  const finish = page.getByRole("alertdialog", { name: "Word Climb complete", exact: true });
  await expect(finish).toBeVisible();
  await expect(page.getByRole("alertdialog", { name: "Word Climb complete", exact: true })).toHaveCount(1);
  await expect(finish.getByRole("heading", { name: "Canopy reached", exact: true })).toBeVisible();
  await expect(finish).toContainText("60 points");
  await expect(finish.locator(".lg-premium-complete-stat strong")).toHaveText("6");
  await expect(finish.locator(".lg-premium-complete-stat span")).toHaveText("words climbed");
  const exit = finish.getByRole("button", { name: "Back to Arcade", exact: true });
  const exitBox = await exit.boundingBox();
  expect(exitBox?.width).toBeGreaterThanOrEqual(56);
  expect(exitBox?.height).toBeGreaterThanOrEqual(56);
  await expect(exit).toBeFocused();
  await expect(player.locator(".lg-game-player-header")).toHaveJSProperty("inert", true);
  await expect(player.locator(".lg-game-player-main")).toHaveJSProperty("inert", true);
  await page.evaluate(() => {
    const behind = document.createElement("button");
    behind.id = "behind-word-climb";
    behind.textContent = "Behind the game";
    document.body.prepend(behind);
  });
  await page.keyboard.press("Tab");
  await expect(exit).toBeFocused();
  await expect(page.locator("#behind-word-climb")).not.toBeFocused();
  expect(pageErrors).toEqual([]);
});

test("Word Climb freezes a pending climb behind quit and resumes with only the remaining delay", async ({ page }) => {
  const player = await openWordClimb(page, 0);
  const target = await currentTarget(player);
  await chooseCorrect(player, target);
  await expect(player.locator(".word-climb")).toHaveAttribute("data-wc-progress", "1");
  await expect(player.locator('[data-wc="feedback"]')).toContainText("Up we go!");

  await player.getByRole("button", { name: "Close Word Climb", exact: true }).click();
  const quit = page.getByRole("alertdialog", { name: "Quit Word Climb", exact: true });
  await expect(quit).toBeVisible();
  const keepPlaying = quit.getByRole("button", { name: "Keep playing", exact: true });
  const leave = quit.getByRole("button", { name: "Leave", exact: true });
  await expect(keepPlaying).toBeFocused();
  await page.evaluate(() => {
    const behind = document.createElement("button");
    behind.id = "behind-quit";
    behind.textContent = "Behind the game";
    document.body.prepend(behind);
  });
  await page.keyboard.press("Shift+Tab");
  await expect(leave).toBeFocused();
  await expect(page.locator("#behind-quit")).not.toBeFocused();
  await page.waitForTimeout(900);
  await expect(player.locator('[data-wc="feedback"]')).toContainText("Up we go!");
  await expect(player.locator('[data-wc="choice"]').first()).toBeDisabled();
  await expect(page.getByRole("alertdialog", { name: "Word Climb complete", exact: true })).toHaveCount(0);

  await keepPlaying.click();
  await expect(player.locator('[data-wc="feedback"]')).toContainText("Choose another word", { timeout: 2_000 });
  await expect(player.locator('[data-wc="choice"]').first()).toBeEnabled();
});

test("Word Climb freezes a pending climb while hidden and resumes on visibility return", async ({ page }) => {
  const player = await openWordClimb(page, 0);
  const target = await currentTarget(player);
  await chooseCorrect(player, target);
  await expect(player.locator(".word-climb")).toHaveAttribute("data-wc-progress", "1");

  await setDocumentHidden(page, true);
  await page.waitForTimeout(900);
  await expect(player.locator('[data-wc="feedback"]')).toContainText("Up we go!");
  await expect(player.locator('[data-wc="choice"]').first()).toBeDisabled();

  await setDocumentHidden(page, false);
  await expect(player.locator('[data-wc="feedback"]')).toContainText("Choose another word", { timeout: 2_000 });
  await expect(player.locator('[data-wc="choice"]').first()).toBeEnabled();
});

test("Word Climb persists and restores the next unfinished climb", async ({ page }) => {
  let player = await openWordClimb(page, 0);
  const target = await currentTarget(player);
  await chooseCorrect(player, target);
  await expect(player.locator(".word-climb")).toHaveAttribute("data-wc-progress", "1");
  await expect.poll(() => page.evaluate(() => {
    const progress = JSON.parse(window.localStorage.getItem("literacy-guide-learn-games:fullscreen-overlay-preview") || "{}");
    return progress.games?.["word-climb"]?.checkpoints?.easy?.level;
  })).toBe(1);

  await page.reload();
  const resume = page.getByRole("alertdialog", { name: "Resume Word Climb", exact: true });
  await expect(resume).toBeVisible();
  await expect(resume).toContainText("level 2 of 6");
  await resume.getByRole("button", { name: "Continue", exact: true }).click();
  player = page.getByRole("dialog", { name: "Word Climb", exact: true });
  await expect(player.locator(".word-climb")).toHaveAttribute("data-wc-progress", "1");
  await expect(player.locator(".lg-game-score")).toHaveText("10 pts");
  await expect(player.locator('[data-wc="choice"]')).toHaveCount(3);
});

test("Word Climb replay follows the live sound setting without hiding the printed target", async ({ page }) => {
  const player = await openWordClimb(page, 1);
  const target = await currentTarget(player);
  const replay = player.locator('[data-wc="replay"]');

  await expect(replay).toBeEnabled();
  await expect(replay).toHaveAttribute("aria-label", `Hear the ${target} sound again`);
  await replay.click();
  await player.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await expect(replay).toBeDisabled();
  await expect(replay).toHaveAttribute("aria-label", `Target is ${target}; sound is off`);
  await expect(player.locator('[data-wc="target"]')).toHaveText(`/${target}/`);
});

test("Word Climb mission guide traps focus and Escape closes only that guide", async ({ page }) => {
  const player = await openWordClimb(page, 0);
  await player.getByRole("button", { name: "Open Word Climb mission guide", exact: true }).click();
  const guide = page.getByRole("dialog", { name: "Word Climb mission guide", exact: true });
  await expect(guide).toBeVisible();
  const keepPlaying = guide.getByRole("button", { name: "Keep playing", exact: true });
  await expect(keepPlaying).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(keepPlaying).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(guide).toBeHidden();
  await expect(page.getByRole("alertdialog", { name: "Quit Word Climb", exact: true })).toHaveCount(0);
});

test.describe("Word Climb low landscape", () => {
  test.use({ viewport: { width: 568, height: 320 } });

  test("keeps its exact goal and every primary action inside the game frame", async ({ page }) => {
    const player = await openWordClimb(page, 1);
    const target = await currentTarget(player);
    const mission = player.locator(".wc-mission-card");
    const replay = player.locator('[data-wc="replay"]');
    const choices = player.locator('[data-wc="choice"]');
    await expect(player.getByRole("heading", { name: `Choose the word starting with /${target}/.` })).toBeVisible();
    await expect(player.locator(".wc-summit-meter")).toBeHidden();

    const missionBox = await mission.boundingBox();
    const replayBox = await replay.boundingBox();
    expect(replayBox?.width).toBeGreaterThanOrEqual(56);
    expect(replayBox?.height).toBeGreaterThanOrEqual(56);

    const boxes = await choices.evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
    }));
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.y).toBeGreaterThanOrEqual(missionBox.y + missionBox.height + 8);
      expect(box.right).toBeLessThanOrEqual(568);
      expect(box.bottom).toBeLessThanOrEqual(320);
    }

    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - innerWidth,
      vertical: document.documentElement.scrollHeight - innerHeight
    }));
    expect(overflow.horizontal).toBeLessThanOrEqual(0);
    expect(overflow.vertical).toBeLessThanOrEqual(0);
  });

  test("keeps mission-guide and completion actions reachable without leaving the viewport", async ({ page }) => {
    test.setTimeout(30_000);
    const player = await openWordClimb(page, 0);
    const target = await currentTarget(player);
    await player.getByRole("button", { name: "Open Word Climb mission guide", exact: true }).click();
    const guide = page.getByRole("dialog", { name: "Word Climb mission guide", exact: true });
    const guideCard = guide.locator(":scope > div");
    const keepPlaying = guide.getByRole("button", { name: "Keep playing", exact: true });
    await expect(keepPlaying).toBeInViewport();
    const guideGeometry = await guideCard.evaluate(element => {
      const box = element.getBoundingClientRect();
      return {
        top: box.top,
        bottom: box.bottom,
        height: box.height,
        overflowY: getComputedStyle(element).overflowY
      };
    });
    expect(guideGeometry.top).toBeGreaterThanOrEqual(0);
    expect(guideGeometry.bottom).toBeLessThanOrEqual(320);
    expect(guideGeometry.height).toBeLessThanOrEqual(308);
    expect(guideGeometry.overflowY).toBe("auto");
    await keepPlaying.click();

    for (let completed = 0; completed < 6; completed += 1) {
      await chooseCorrect(player, target);
      await expect(player.locator(".word-climb")).toHaveAttribute("data-wc-progress", String(completed + 1));
      if (completed < 5) await expect(player.locator('[data-wc="choice"]').first()).toBeEnabled({ timeout: 2_000 });
    }

    const finish = page.getByRole("alertdialog", { name: "Word Climb complete", exact: true });
    const exit = finish.getByRole("button", { name: "Back to Arcade", exact: true });
    await expect(finish).toBeVisible();
    await expect(exit).toBeInViewport();
    const exitBox = await exit.boundingBox();
    expect(exitBox?.height).toBeGreaterThanOrEqual(56);
    expect(exitBox?.y).toBeGreaterThanOrEqual(0);
    expect((exitBox?.y || 0) + (exitBox?.height || 0)).toBeLessThanOrEqual(320);
  });
});
