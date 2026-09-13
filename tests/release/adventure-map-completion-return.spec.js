import { test, expect } from "@playwright/test";
import { buildStationRounds } from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { emptyElQuestProgress } from "../../src/utils/adventureMapProgress.js";

async function finishQuest(page) {
  const view = page.locator('[data-quest-view="round"]');
  await expect(view).toBeVisible();
  const seed = await view.getAttribute("data-run-seed");
  const cycle = elSkillsBlockCycles.find(item => item.id === "cycle-1");
  const rounds = buildStationRounds(cycle, "check", { seed });
  for (const [index, round] of rounds.entries()) {
    await expect(view.getByRole("heading", { name: `${index + 1} of ${rounds.length}`, exact: true })).toBeVisible();
    if (round.mechanicId === "wordMemory") {
      for (const word of round.words) {
        for (const card of round.cards.filter(item => item.word === word)) {
          await view.locator(`[data-card-id="${card.id}"]`).click();
        }
      }
    } else if (round.mechanicId === "letterGrid") {
      for (const cell of round.cells.filter(item => item.matches)) {
        await view.locator(`[data-cell-id="${cell.id}"]`).click();
      }
    } else {
      const answers = Array.isArray(round.answer) ? round.answer : [round.answer];
      for (const answer of answers) {
        await view.getByRole("button", {
          name: round.choiceStyle === "picture" ? `Choose ${answer}` : answer,
          exact: true
        }).click();
      }
    }
  }
  await expect(page.getByRole("heading", { name: "Cycle 1 complete!", exact: true })).toBeVisible();
}

test("a completed cycle returns to the current map and opens the next stop", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map");
  await expect(page.locator('[data-stop="cycle-1"]')).toBeVisible();
  // A returning learner has finished four practice stations; complete the
  // scored quest through the real controls rather than seeding its result.
  await page.evaluate(progress => {
    localStorage.setItem("lp-el-quest:child-surface-preview", JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated"));
  }, { ...emptyElQuestProgress(), cycles: { "cycle-1": { stations: { letters: true, sounds: true, hunt: true, quick: true } } } });
  await page.locator('[data-child-primary]').click();
  await page.getByRole("button", { name: /^Cycle Quest/ }).click();
  await finishQuest(page);
  await page.getByRole("button", { name: "Back to the map", exact: true }).click();
  await expect(page.locator('[data-stop="cycle-1"]')).toHaveAttribute("data-node-state", "done");
  await expect(page.locator('[data-stop="cycle-2"]')).toHaveAttribute("data-node-state", "next");
  await expect(page.locator('[data-stop="cycle-2"]')).toBeVisible();
  await expect(page.getByText("Your sound and word path", { exact: true })).toHaveCount(0);
  await page.locator('[data-child-primary]').click();
  await expect(page.locator('[data-quest-view="cycle"] .sbq-kicker')).toHaveText("Cycle 2");
});

test("the standalone quest return has a visible map viewport after completion", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=check");
  await finishQuest(page);
  await page.getByRole("button", { name: "Back to your path", exact: true }).click();
  const viewport = page.locator(".sbq-map-viewport");
  await expect(viewport).toBeVisible();
  expect((await viewport.boundingBox()).height).toBeGreaterThan(200);
  await expect(page.locator(".sbq-stop.next")).toBeVisible();
  await expect(page.locator(".sbq-map-progress")).toContainText("1 of 27");
});
