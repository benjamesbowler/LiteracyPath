import { expect, test } from "@playwright/test";
import { STUDENT_DEVICE_PROFILES } from "../../src/policy/studentDeviceMatrix.js";
import { showStoryQuestCard } from "./helpers/storyQuestShelf.js";

test.describe.configure({ timeout: 90_000 });

async function expectInPane(locator) {
  await expect(locator).toBeVisible();
  const geometry = await locator.evaluate(node => {
    const rect = node.getBoundingClientRect();
    // Word help sits in the browser's top layer rather than inside the rail.
    const pane = node.closest("dialog") ? null : node.closest(".kg-main")?.getBoundingClientRect();
    const spread = node.closest(".story-quest-spread")?.getBoundingClientRect();
    const top = Math.max(0, pane?.top ?? 0, spread?.top ?? 0);
    const bottom = Math.min(innerHeight, pane?.bottom ?? innerHeight, spread?.bottom ?? innerHeight);
    const left = Math.max(0, pane?.left ?? 0);
    const right = Math.min(innerWidth, pane?.right ?? innerWidth);
    const acceptsTap = !node.matches("button:not(:disabled)") ||
      node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    return {
      fits: acceptsTap && rect.top >= top - 1 && rect.bottom <= bottom + 1 && rect.left >= left - 1 && rect.right <= right + 1,
      label: node.getAttribute("aria-label") || node.textContent.trim(),
      top: rect.top, bottom: rect.bottom, paneTop: top, paneBottom: bottom
    };
  });
  expect(geometry.fits, JSON.stringify(geometry)).toBe(true);
}

async function expectSceneFixed(reader) {
  await expectInPane(reader.getByRole("heading", { name: "The Walking Garden" }));
  const offsets = await reader.evaluate(node => [
    window.scrollY, node.scrollTop,
    node.closest(".story-quest-active-page")?.scrollTop ?? 0,
    node.closest(".kg-main")?.scrollTop ?? 0
  ]);
  expect(offsets).toEqual([0, 0, 0, 0]);
}

for (const profile of [...STUDENT_DEVICE_PROFILES, { id: "reported-browser", width: 1467, height: 828 }]) {
  test(`Walking Garden keeps reading, exploration and decisions in view at ${profile.id}`, async ({ page }) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/preview/child-surfaces.html?surface=story-quests", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Moonwood", exact: true }).click();
    const card = page.getByRole("button", { name: "Open Fern and Wren: The Walking Garden", exact: true });
    await (await showStoryQuestCard(page, card)).click();

    const reader = page.locator(".story-quest-reader");
    const next = reader.getByRole("button", { name: "Next", exact: true });
    const explore = reader.getByRole("button", { name: "Explore", exact: true });
    const read = reader.getByRole("button", { name: "Read", exact: true });
    const choose = reader.getByRole("button", { name: "Choose", exact: true });
    await expectInPane(next);
    await next.click();
    await expect(reader).toHaveAttribute("data-page-id", "p02_recipe");
    await expectSceneFixed(reader);
    await expectInPane(reader.getByRole("button", { name: "Hear the story", exact: true }));
    for (const line of await reader.locator(".story-quest-text p").all()) await expectInPane(line);
    if (await explore.isVisible()) {
      await expectInPane(explore);
      await explore.click();
    }
    const purple = reader.getByRole("button", { name: "Test a purple drop" });
    const water = reader.getByRole("button", { name: "Test a water drop" });
    await expectInPane(purple);
    await expectInPane(water);
    await purple.click();
    await expectInPane(reader.getByRole("button", { name: "Hear what you found" }));
    await expectInPane(reader.locator(".story-quest-image"));
    await expectSceneFixed(reader);

    for (const id of ["p03_pour_potion", "p04_all_walk", "p05_too_late"]) {
      await expectInPane(next);
      await next.click();
      await expect(reader).toHaveAttribute("data-page-id", id);
    }
    if (await read.isVisible()) await read.click();
    for (const line of await reader.locator(".story-quest-text p").all()) await expectInPane(line);
    const word = reader.getByRole("button", { name: "Hear Wren", exact: true });
    await expectInPane(word);
    await word.click();
    const help = reader.getByRole("dialog", { name: "Word help" });
    await expectInPane(help);
    await help.getByRole("button", { name: "Close word help" }).click();
    await expectSceneFixed(reader);
    if (await explore.isVisible()) await explore.click();
    await reader.getByRole("button", { name: "Hum with Fern" }).click();
    await expectInPane(reader.getByRole("button", { name: "Hear what you found" }));
    if (await choose.isVisible()) {
      await expectInPane(choose);
      await choose.click();
    }
    for (const label of ["Follow the small pot", "Sing to the pots"]) {
      await expectInPane(reader.getByRole("button", { name: label, exact: true }));
    }
    await expectSceneFixed(reader);
  });
}
