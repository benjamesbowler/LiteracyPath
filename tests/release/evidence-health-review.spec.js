import { expect, test } from "@playwright/test";

import { chooseStudentReportView } from "./support/studentReportNavigation.js";

test("teacher Summary explains evidence health without a score or learner downgrade", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=report");
  await chooseStudentReportView(page, "whole-child");

  const review = page.getByRole("region", { name: "Evidence review" });
  await expect(review).toBeVisible();
  await expect(review.getByRole("heading", { name: "Collect more results" })).toBeVisible();
  await expect(review).toContainText("The report is usable");
  await expect(review).toContainText("This review never changes a learning status");
  await expect(review).not.toContainText(/\bscore\b|%/i);

  const reasons = review.getByText(/Why this needs attention/);
  await reasons.click();
  await expect(review).toContainText("More results are needed");
  await expect(review).toContainText("do not interpret this as a low result");

  const geometry = await review.evaluate(element => {
    const box = element.getBoundingClientRect();
    const main = element.closest(".lg-report-main")?.getBoundingClientRect();
    return {
      left: box.left,
      right: box.right,
      mainLeft: main?.left,
      mainRight: main?.right,
      scrollsHorizontally: element.scrollWidth > element.clientWidth + 1
    };
  });
  expect(geometry.scrollsHorizontally).toBe(false);
  expect(geometry.left).toBeGreaterThanOrEqual((geometry.mainLeft || 0) - 1);
  expect(geometry.right).toBeLessThanOrEqual((geometry.mainRight || page.viewportSize().width) + 1);
});
