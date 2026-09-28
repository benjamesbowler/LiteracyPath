import { test, expect } from "@playwright/test";
import { getElBenchmarkPlan } from "../../src/data/elBenchmarkAssessments.js";

test("expanded spelling completes, reviews a correction, and retries failed saving with every response intact", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=assessment&assessment=el_encoding&grade=K&window=BOY&start=early_partial&save=fail-once");
  const plan = getElBenchmarkPlan({ assessmentId: "el_encoding", grade: "K", window: "BOY", startMicrophase: "early_partial" });
  expect(plan.items).toHaveLength(12);
  for (let index = 0; index < plan.items.length; index += 1) {
    await expect(page.getByRole("heading", { name: `Item ${index + 1} of 12`, exact: true })).toBeVisible();
    await page.getByRole("button", { name: index === 11 ? "Not yet" : "Correct spelling", exact: true }).click();
  }
  const choosePlacement = async () => {
    await page.locator(".el-benchmark-topbar").getByRole("button", { name: "Choose starting point", exact: true }).click();
    await page.getByRole("region", { name: "Choose where to start next" }).getByRole("button", { name: "Use this starting point", exact: true }).click();
  };
  await choosePlacement();
  await page.locator(".el-benchmark-topbar").getByRole("button", { name: "Finish assessment", exact: true }).click();
  let review = page.getByRole("dialog", { name: "Review the tally before finishing" });
  await expect(review).toContainText("12 scored · 0 skipped");
  await review.getByRole("button", { name: "Change final answer", exact: true }).click();
  await page.getByRole("button", { name: "Correct spelling", exact: true }).click();
  await choosePlacement();
  await page.locator(".el-benchmark-topbar").getByRole("button", { name: "Finish assessment", exact: true }).click();
  review = page.getByRole("dialog", { name: "Review the tally before finishing" });
  await review.getByRole("button", { name: "Confirm and finish", exact: true }).click();
  await expect(review.getByRole("alert")).toContainText("We couldn't save this assessment.");
  const responses = await page.evaluate(() => JSON.parse(localStorage.getItem("assessment-depth-preview:el_encoding")).responses);
  expect(Object.keys(responses)).toHaveLength(12);
  expect(responses[plan.items[11].id].isCorrect).toBe(true);
  await page.locator(".el-benchmark-topbar").getByRole("button", { name: "Retry finish", exact: true }).click();
  await page.getByRole("dialog", { name: "Review the tally before finishing" }).getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.getByTestId("assessment-preview-saved")).toContainText("completed");
});
