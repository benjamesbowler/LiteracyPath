import { expect, test } from "@playwright/test";

test("transfer mission rehearses, resumes, completes, and stays separate from mastery", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html?scenario=transfer");

  const card = page.locator(".transfer-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("not a new level or score");
  await card.getByRole("button", { name: "Try the mission" }).click();
  const dialog = page.locator(".transfer-overlay");
  await expect(dialog).toContainText("Practice first — this does not count");
  await dialog.locator(".transfer-runner > div button").first().click();
  await expect(dialog).toContainText("Step 1 of 3");
  await dialog.locator(".transfer-runner > div button").first().click();
  await expect(dialog).toContainText("Step 2 of 3");

  await dialog.getByRole("button", { name: "Leave for now" }).click();
  await card.getByRole("button", { name: "Try the mission" }).click();
  await expect(dialog).toContainText("Step 2 of 3");
  await dialog.locator(".transfer-runner > div button").first().click();
  await expect(dialog).toContainText("Step 3 of 3");
  await dialog.locator(".transfer-runner > div button").first().click();
  await expect(page.getByRole("dialog", { name: "Transfer mission result" })).toContainText(
    "does not change a secure skill"
  );

  const stored = await page.evaluate(() => JSON.parse(
    window.localStorage.getItem("lp-transfer-missions:student-home-preview")
  ));
  expect(stored.completed).toHaveLength(1);
  expect(stored.evidence).toHaveLength(1);
  expect(stored.evidence[0].masteryEligible).toBe(false);
  expect(stored.evidence[0].context).toBe("unfamiliar_word");
  expect(stored.active).toBeNull();
  expect(pageErrors).toEqual([]);
});

test("transfer mission fits phone viewport with child-sized controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/student-home-preview.html?scenario=transfer");
  await page.locator(".transfer-card").getByRole("button", { name: "Try the mission" }).click();
  const dialog = page.locator(".transfer-overlay");
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    dialog: document.querySelector(".transfer-runner").scrollWidth
      - document.querySelector(".transfer-runner").clientWidth
  }));
  expect(overflow).toEqual({ document: 0, dialog: 0 });
  const heights = await dialog.getByRole("button").evaluateAll(buttons =>
    buttons.map(button => Math.round(button.getBoundingClientRect().height))
  );
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
});
