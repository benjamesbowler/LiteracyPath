import { expect, test } from "@playwright/test";

test("Story Crew passes one device through three evidence roles and stores no child media", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.getByRole("button", { name: "Story Crew" }).click();
  const crew = page.getByRole("main", { name: "Story Crew" });
  await expect(crew).toContainText("nothing you say is recorded");
  await crew.getByRole("button", { name: "Start together" }).first().click();
  await expect(page.getByText("Pass to the Clue Finder")).toBeVisible();
  await page.getByRole("button", { name: "The packet was empty." }).click();
  await expect(page.getByRole("status")).toContainText("does not prove");
  await page.getByRole("button", { name: "Footprints led to the gate." }).click();
  await page.getByRole("button", { name: "Pass to the next role" }).click();
  await expect(page.getByText("Pass to the Connector")).toBeVisible();
  await page.getByRole("button", { name: "A trail-maker moved toward the gate." }).click();
  await page.getByRole("button", { name: "Pass to the next role" }).click();
  await expect(page.getByText("Pass to the Story Crew")).toBeVisible();
  await page.getByRole("button", { name: "Follow the footprints and look near the hedge." }).click();
  await page.getByRole("button", { name: "Finish together" }).click();
  await expect(crew).toContainText("Solved together");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("lp-cooperative-story-quest:child-surface-preview")));
  expect(stored.completed).toEqual(["seed-trail"]);
  expect(stored.evidence[0].masteryEligible).toBe(false);
  expect(stored.evidence[0].childMediaCollected).toBe(false);
  expect(stored.evidence[0].attempts).toEqual([2, 1, 1]);
});

test("Story Crew is phone-safe with large shared-device choices", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.getByRole("button", { name: "Story Crew" }).click();
  await page.getByRole("button", { name: "Start together" }).first().click();
  const player = page.locator(".coop-player");
  const metrics = await player.evaluate(element => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    choiceHeights: [...element.querySelectorAll(".coop-choices button")].map(button => Math.round(button.getBoundingClientRect().height))
  }));
  expect(metrics.overflow).toBe(0);
  expect(Math.min(...metrics.choiceHeights)).toBeGreaterThanOrEqual(60);
});
