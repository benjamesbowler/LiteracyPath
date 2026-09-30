import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { A11Y_KEY_INTERACTIONS } from "../../src/accessibility/primaryRouteInventory.js";

test.setTimeout(120_000);

const PERSONAL = A11Y_KEY_INTERACTIONS.find(row => row.id === "arcade-personal-progress");
const SESSION_KEY = "lp-student-session-v1";
const SENTINEL = '{ "token": "sentinel-real-child-token", "studentId": "sentinel-child", "keep": ["spacing", 2] }';

async function seedOwnRecords(page) {
  await page.evaluate(() => {
    localStorage.setItem("literacy-guide-learn-games:child-surface-preview", JSON.stringify({ difficulty: "easy", soundEnabled: false, games: {
      "rocket-run": { plays: 3, stars: 2, highScore: 140, lastPlayedAt: "2026-09-30T01:00:00Z" },
      "rhyme-pop": { plays: 1, stars: 1, highScore: 60, lastPlayedAt: "2026-09-29T01:00:00Z" }
    } }));
    dispatchEvent(new CustomEvent("lp-progress-hydrated", { detail: { studentId: "child-surface-preview" } }));
  });
}

test("My progress is an accessible keyboard dialog of the learner's own game records", async ({ page }) => {
  const peerRequests = [];
  page.on("request", request => { if (request.url().includes("get_game_leaderboard")) peerRequests.push(request.url()); });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: SESSION_KEY, value: SENTINEL });
  await page.goto(`${PERSONAL.url}&leaderboard=populated`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-child-primary]")).toBeVisible({ timeout: 90_000 });
  await seedOwnRecords(page);
  const trigger = page.getByRole("button", { name: PERSONAL.triggerName, exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: PERSONAL.regionName, exact: true });
  const close = dialog.getByRole("button", { name: "Close my progress" });
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();
  await expect(dialog.getByRole("list", { name: "Your recent games" }).getByRole("listitem")).toHaveCount(2);
  await expect(dialog).toContainText("Personal best: 140 game points");
  await expect(dialog).toContainText("3 times played");
  await expect(dialog).not.toContainText(/Top Readers|Reader Pine|ranking|Your class|Your school/);
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  const axe = await new AxeBuilder({ page }).include("#lg-personal-progress").analyze();
  expect(axe.violations.filter(row => ["serious", "critical"].includes(row.impact))).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(peerRequests).toEqual([]);
  expect(await page.evaluate(key => localStorage.getItem(key), SESSION_KEY)).toBe(SENTINEL);
});

test("personal progress stays available with empty records and without a class leaderboard", async ({ page }) => {
  for (const mode of ["empty", "failure", "unavailable"]) {
    await page.goto(`${PERSONAL.url}&leaderboard=${mode}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-child-primary]")).toBeVisible({ timeout: 90_000 });
    await page.getByRole("button", { name: "My progress", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Play a game to start your journey.");
    await page.getByRole("button", { name: "Close my progress" }).click();
    await expect(page.getByRole("button", { name: "My progress", exact: true })).toBeFocused();
    await expect(page.locator(".lg-leaderboard-list, .lg-leaderboard-rank")).toHaveCount(0);
  }
});

test("the personal progress dialog and its close target fit compact landscape", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto(PERSONAL.url, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-child-primary]")).toBeVisible({ timeout: 90_000 });
  await seedOwnRecords(page);
  const trigger = page.getByRole("button", { name: "My progress", exact: true });
  await expect(trigger).toBeInViewport();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  const size = await dialog.evaluate(element => {
    const box = element.getBoundingClientRect(); const main = element.closest(".kg-main").getBoundingClientRect();
    const close = element.querySelector("button").getBoundingClientRect();
    return { contained: box.top >= main.top && box.bottom <= main.bottom, closeHeight: close.height };
  });
  expect(size.contained).toBe(true);
  expect(size.closeHeight).toBeGreaterThanOrEqual(55.5);
  await page.getByRole("button", { name: "Close my progress" }).click();
  await expect(trigger).toBeFocused();
});
