import { expect, test } from "@playwright/test";

test("A2.3 completing a mission step celebrates once and routes the primary action to the next step", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html");

  const mission = page.locator(".kg-home-stops");
  await expect(mission).toBeVisible();
  await expect(mission).toHaveAttribute("data-mission-next-kind", "quest");
  await expect(mission).toHaveAttribute("data-mission-hero-owns-next", "true");
  await expect(mission.locator("[data-mission-step]")).toHaveCount(2);
  await expect(mission.locator('[data-mission-step="quest"]')).toHaveCount(0);
  await expect(page.locator('[data-home-priority="primary"]')).toHaveAttribute(
    "data-mission-primary-kind",
    "quest"
  );

  await page.evaluate(() => window.__completeStudentHomeMissionStep("quest"));
  await page.reload();

  const celebration = page.getByRole("dialog", {
    name: "One stop done"
  });
  await expect(celebration).toBeVisible();
  await expect(celebration).toContainText("Nice work!");
  await expect(celebration).toContainText("Next up: Read a book.");
  await celebration.getByRole("button", { name: "See what’s next" }).click();
  await expect(celebration).toHaveCount(0);

  await expect(mission).toHaveAttribute("data-mission-next-kind", "book");
  await expect(mission.locator('[data-mission-step="quest"]')).toHaveAttribute(
    "data-mission-state",
    "done"
  );
  await expect(mission.locator('[data-mission-step="book"]')).toHaveCount(0);
  const primary = page.locator('[data-home-priority="primary"]');
  await expect(primary).toHaveAccessibleName("Continue Books — 2 tasks left today");
  await expect(primary).toHaveAttribute("data-mission-primary-kind", "book");

  const celebratedSteps = await page.evaluate(() => {
    const state = JSON.parse(
      window.localStorage.getItem("lp-daily-mission:student-home-preview") || "{}"
    );
    return state.celebratedSteps;
  });
  expect(celebratedSteps).toEqual(["quest"]);

  await primary.click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-student-destination",
    "reading-library"
  );
  expect(pageErrors).toEqual([]);
});
