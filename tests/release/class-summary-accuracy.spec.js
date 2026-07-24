import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("A4.3 class summary shows both weighted views, counts, and weak-comparability suppression", async ({
  page
}) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/preview/learning-policy.html");

  const summary = page.getByRole("article", { name: "Class accuracy comparison" });
  const facts = summary.locator(".teacher-progress-accuracy-facts");
  const learnerWeighted = facts.locator("div").filter({ hasText: "Learner-weighted accuracy" });
  const responseWeighted = facts.locator("div").filter({ hasText: "Response-weighted accuracy" });
  await expect(summary).toHaveAttribute("data-class-comparable", "false");
  await expect(summary.getByText("No single class average", { exact: true })).toBeVisible();
  await expect(learnerWeighted.locator("dt")).toHaveText("Learner-weighted accuracy");
  await expect(learnerWeighted.locator("dd")).toContainText("66%");
  await expect(learnerWeighted.locator("dd")).toContainText("2 policy-ready learners of 3");
  await expect(responseWeighted.locator("dt")).toHaveText("Response-weighted accuracy");
  await expect(responseWeighted.locator("dd")).toContainText("71.9%");
  await expect(responseWeighted.locator("dd")).toContainText("32 scored responses");
  await expect(
    summary.getByText(/67% of learners are policy-ready; 70% required/)
  ).toBeVisible();

  const insufficientSegment = page.locator(
    ".teacher-progress-distribution-chart .is-not_enough_evidence"
  );
  const segmentColours = await insufficientSegment.evaluate(element => ({
    segment: getComputedStyle(element).backgroundColor,
    track: getComputedStyle(element.parentElement).backgroundColor
  }));
  expect(segmentColours.segment).not.toBe("rgba(0, 0, 0, 0)");
  expect(segmentColours.segment).not.toBe(segmentColours.track);

  const axe = await new AxeBuilder({ page })
    .include('[aria-label="Class accuracy comparison"]')
    .analyze();
  expect(
    axe.violations.filter(violation => ["serious", "critical"].includes(violation.impact))
  ).toEqual([]);
  expect(pageErrors).toEqual([]);
});
