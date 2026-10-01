import { expect, test } from "@playwright/test";

const NEW_GAMES = [["drum-trail", "Drum Trail", ".drum-trail"], ["lantern-lagoon", "Lantern Lagoon", ".lantern-lagoon"]];

for (const [id, title, engine] of NEW_GAMES) {
  test(`${title} first-question checkpoint without local support history is conservative`, async ({ page }) => {
    await page.addInitScript(({ gameId }) => {
      localStorage.setItem("literacy-guide-learn-games:fullscreen-overlay-preview", JSON.stringify({ v: 1, games: {
        [gameId]: { checkpoints: { easy: { level: 0, totalLevels: gameId === "drum-trail" ? 16 : 8, sessionSeed: 913, chapter: 0 } } }
      } }));
    }, { gameId: id });
    await page.goto(`/preview/game-overlay.html?game=${id}&sound=0&taughtCycle=15`);
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
    await expect(page.locator(engine)).toHaveCount(0);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator(engine)).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      const snapshot = window.__arcadePreviewSnapshot?.();
      return snapshot?.supportReasons || snapshot?.support || [];
    })).toContain("resume_without_support_record");
    if (id === "lantern-lagoon") {
      const choiceId = await page.evaluate(() => window.__arcadePreviewSnapshot().deck.rounds[0].answerId);
      await page.locator(`[data-choice-id="${choiceId}"]`).click();
      await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot().evidence.firstResponses[0]?.independent)).toBe(false);
    }
  });

  test(`${title} opens from the complete real Arcade catalogue`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/preview/child-surfaces.html?surface=arcade");
    await expect(page.locator(".lg-game-tile")).toHaveCount(24);
    await page.locator(`.lg-game-tile[data-game-id="${id}"]`).click();
    await expect(page.locator(".lg-game-player")).toHaveAttribute("data-surface-name", title);
    await expect(page.locator(engine)).toBeVisible();
    await expect(page.locator(`${engine} button`).first()).toBeVisible();
  });

  test(`${title} exact assignment cannot expose a different game`, async ({ page }) => {
    await page.goto(`/preview/child-surfaces.html?surface=arcade&lockedGame=${id}`);
    await expect(page.locator(".lg-game-tile")).toHaveCount(1);
    await expect(page.locator(".lg-game-tile")).toHaveAttribute("data-game-id", id);
    await expect(page.locator(engine)).toBeVisible();
    await page.goto("/preview/child-surfaces.html?surface=arcade&lockedGame=unavailable-game");
    await expect(page.getByRole("heading", { name: "Game unavailable", exact: true })).toBeVisible();
    await expect(page.locator(".lg-game-player")).toHaveCount(0);
    await expect(page.locator(".lg-game-tile")).toHaveCount(0);
  });

  test(`${title} shared mission help pauses the real engine and retains support`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/preview/game-overlay.html?game=${id}&sound=0&taughtCycle=15`);
    await expect(page.locator(engine)).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(window.__arcadePreviewSnapshot?.()))).toBe(true);
    await page.getByRole("button", { name: `Open ${title} mission guide`, exact: true }).click();
    await expect(page.getByRole("dialog", { name: `${title} mission guide`, exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      const snapshot = window.__arcadePreviewSnapshot?.();
      return { paused: snapshot?.paused, supported: (snapshot?.supportReasons || snapshot?.support || []).includes("mission-help") };
    })).toEqual({ paused: true, supported: true });
    await page.getByRole("button", { name: "Keep playing", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot?.().paused)).toBe(false);
  });
}

test("Lantern reading eligibility travels through the actual Phonics/Arcade host without difficulty or class-cycle inference", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=arcade&lockedGame=lantern-lagoon&placementCycle=10");
  await expect(page.locator(".lantern-lagoon")).toHaveAttribute("data-mode", "reading");
  await page.goto("/preview/child-surfaces.html?surface=arcade&lockedGame=lantern-lagoon&teachingCycle=25");
  await expect(page.locator(".lantern-lagoon")).toHaveAttribute("data-mode", "listening");
  await page.goto("/preview/game-overlay.html?game=lantern-lagoon&difficulty=hard&sound=0");
  await expect(page.locator(".lantern-lagoon")).toHaveAttribute("data-mode", "listening");
  await expect(page.getByText("Sound is off.", { exact: false })).toBeVisible();
});
