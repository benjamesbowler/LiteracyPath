import { expect, test } from "@playwright/test";
import { cvcWordFamilies } from "../../src/data/cvcWordFamilies.js";
import { STUDENT_DEVICE_PROFILES } from "../../src/policy/studentDeviceMatrix.js";
import { expectInChildPane, expectPagedChoices } from "./helpers/childPagedChoices.js";

test.describe.configure({ timeout: 90_000 });

async function openSurface(page, name, profile) {
  await page.setViewportSize({ width: profile.width, height: profile.height });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/preview/child-surfaces.html?surface=${name}`, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => document.fonts.ready);
}

for (const profile of STUDENT_DEVICE_PROFILES.filter(item => item.id !== "projector-landscape")) {
  test(`Letters and Words offer each choice in a visible page at ${profile.id}`, async ({ page }, info) => {
    await openSurface(page, "phonics", profile);
    const surface = page.locator("[data-child-surface=phonics]");
    const letters = surface.locator(".phonics-letter-card");
    const labels = await expectPagedChoices(surface, letters, { pagerLabel: "Letter pages", expectedCount: 26, returnToFirst: false });
    expect(labels).toEqual(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ", letter => `Letter ${letter}`));
    await letters.last().click();
    await expect(surface.locator(".phonics-trace-pad")).toBeVisible();
    await surface.getByRole("button", { name: "Back to letters", exact: false }).click();
    await expect(letters.last()).toHaveAccessibleName("Letter Z, Try again");
    await expect(letters.last()).toBeFocused();
    await expectInChildPane(letters.last());
    await surface.getByRole("button", { name: "Words", exact: true }).click();
    const families = surface.locator(".cvc-family-card");
    const familyLabels = await expectPagedChoices(surface, families, { pagerLabel: "Word family pages", expectedCount: 8, returnToFirst: false });
    expect(familyLabels).toEqual(cvcWordFamilies.map(family => `${family.rime} word family, Play`));
    await page.screenshot({ path: info.outputPath(`words-${profile.id}.png`) });
    await families.last().click();
    await expect(surface.locator(".cvc-learning-flow")).toBeVisible();
  });

  test(`Games keeps the complete roster in view at ${profile.id}`, async ({ page }, info) => {
    await openSurface(page, "arcade", profile);
    const surface = page.locator("[data-child-surface=arcade]");
    const tiles = surface.locator(".lg-game-tile");
    await expectInChildPane(surface.locator(".lg-arcade-utilities button"));
    await expectPagedChoices(surface, tiles, { pagerLabel: "Game pages", expectedCount: 27, key: "data-game-id", titleSelector: ".lg-game-tile-name" });
    await page.screenshot({ path: info.outputPath(`games-${profile.id}.png`) });
    await surface.getByRole("button", { name: "Game settings", exact: true }).click();
    const settings = surface.getByRole("dialog", { name: "Game settings" });
    await expect(settings).toBeVisible();
    await expectInChildPane(settings.locator("button:visible, summary:visible"));
    await settings.getByText("Why this game?", { exact: true }).click();
    await expectInChildPane(settings.locator("button:visible, summary:visible"));
    await settings.getByRole("button", { name: "Close settings", exact: true }).click();
    await expect(surface.getByRole("button", { name: "Game settings", exact: true })).toBeFocused();
    await surface.getByRole("button", { name: "My progress", exact: true }).click();
    const progress = surface.getByRole("dialog", { name: "My game progress" });
    await expectInChildPane(progress.getByRole("button", { name: "Close my progress", exact: true }));
    await progress.getByRole("button", { name: "Close my progress", exact: true }).click();
  });

  test(`Skills offers areas, skills and Play without scrolling at ${profile.id}`, async ({ page }, info) => {
    await openSurface(page, "skills-practice", profile);
    const surface = page.locator(".skills-practice-map");
    const navigation = surface.getByRole("navigation", { name: "Skills trail views" });
    await expect(surface.getByRole("heading", { name: "Skills trail" })).toBeVisible();
    await expectInChildPane(surface.locator("button:visible"));
    if (await navigation.count()) await navigation.getByRole("button", { name: "Skill areas", exact: true }).click();
    const areaPicker = surface.getByRole("group", { name: "Skill areas" });
    await expectInChildPane(areaPicker.getByRole("button"));
    await areaPicker.getByRole("button", { name: "Read and think", exact: true }).click();
    const skillPicker = surface.locator(".skills-practice-stops");
    await expectPagedChoices(surface, skillPicker.getByRole("button"), { pagerLabel: "Skill pages", expectedCount: 8, returnToFirst: false });
    await page.screenshot({ path: info.outputPath(`skills-${profile.id}.png`) });
    await skillPicker.getByRole("button", { name: /Theme and Higher Comprehension/ }).click();
    await expectInChildPane(surface.getByRole("button", { name: "Play Theme and Higher Comprehension", exact: true }));
    await expectInChildPane(surface.getByRole("button", { name: "Hear this skill" }));
  });
}

test("Games page in a short laptop window keeps the whole roster reachable", async ({ page }, info) => {
  await openSurface(page, "arcade", { width: 800, height: 510 });
  const surface = page.locator("[data-child-surface=arcade]");
  await expectPagedChoices(surface, surface.locator(".lg-game-tile"), {
    pagerLabel: "Game pages", expectedCount: 27, key: "data-game-id", titleSelector: ".lg-game-tile-name"
  });
  await page.screenshot({ path: info.outputPath("games-short-window.png") });
});

test("Leaving a game returns to its card and shows the current saved outing", async ({ page }) => {
  await openSurface(page, "arcade", { width: 568, height: 320 });
  const surface = page.locator("[data-child-surface=arcade]");
  const pager = surface.getByRole("navigation", { name: "Game pages" });
  await expect(pager.getByRole("status")).toHaveText("Page 1 of 9");
  await pager.getByRole("button", { name: "Next" }).click();
  const tile = surface.locator('[data-game-id="sound-racer"]');
  await tile.press("Enter");
  const player = page.getByRole("dialog", { name: "Sound Racer", exact: true });
  await expect(player).toBeVisible();
  await expect(surface.locator(".lg-arcade-scrollbody")).toHaveAttribute("inert", "");
  await page.evaluate(async () => {
    const modulePath = "/src/utils/learnGamesProgress.js";
    const { saveGameCheckpoint } = await import(modulePath);
    saveGameCheckpoint("child-surface-preview", "sound-racer", "easy", 1, 10, 913, 0);
  });
  await player.getByRole("button", { name: "Close Sound Racer" }).click();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(player).toHaveCount(0);
  await expect(tile).toContainText("Carry on");
  await expect(pager.getByRole("status")).toHaveText("Page 1 of 9");
  await expect(tile).toBeFocused();
  await expectInChildPane(tile);
});

for (const profile of STUDENT_DEVICE_PROFILES.filter(item => item.family === "small-phone" || item.id === "tablet-landscape")) {
  test(`Skills keeps reporting and the return to the question in frame at ${profile.id}`, async ({ page }) => {
    await page.addInitScript(() => {
      window.Audio = class extends EventTarget {
        constructor() { super(); this.currentTime = 0; this.readyState = 4; this.duration = 0.02; this.paused = true; }
        load() { this.dispatchEvent(new Event("canplay")); }
        play() { this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event("ended")); }, 20); return Promise.resolve(); }
        pause() { clearTimeout(this.timer); this.paused = true; }
      };
    });
    await openSurface(page, "skills-practice", profile);
    await page.getByRole("button", { name: "Play Initial Sounds", exact: true }).click();
    const practice = page.locator(".skills-practice-play");
    await expect(practice).toHaveAttribute("data-skills-practice-ready", "true");
    const report = practice.getByRole("button", { name: "Report a problem", exact: true });
    await expectInChildPane(practice.locator(".skills-practice-tools button:visible"));
    await report.click();
    await expectInChildPane(practice.getByRole("button", { name: "Report image", exact: true }));
    await expectInChildPane(practice.getByRole("button", { name: "Report question", exact: true }));
    const back = practice.getByRole("button", { name: "Back to question", exact: true });
    await expectInChildPane(back);
    await back.click();
    await expect(report).toBeFocused();
    await expectInChildPane(practice.locator(":is(.assessment-answer-card,.initial-sound-image-button,.visual-assessment-card-button):visible"));
  });
}
