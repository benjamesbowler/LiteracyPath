import { expect, test } from "@playwright/test";

const CLASS_ID = "00000000-0000-4000-8000-0000000000a1";

test("@teacher-assessment-history opens a complete class record and returns to assessment start", async ({
  page
}) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto(
    `/preview/teacher-a11y.html?surface=assess#teacher/assessments?class=${CLASS_ID}`
  );

  await expect(page.getByRole("heading", { name: "Assess a student", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Previous assessments", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Previous assessments", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/view=previous/);
  await expect(page.getByText("4 assessments for 3 students.", { exact: true })).toBeVisible();

  const rows = page.locator(".teacher-assess-history tbody tr");
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0).getByRole("rowheader")).toHaveText("Aisha");
  await expect(rows.nth(0)).toContainText("Letter names and sounds");
  await expect(rows.nth(1).getByRole("rowheader")).toHaveText("Camila");
  await expect(rows.nth(1)).toContainText("Word reading");
  await expect(rows.nth(1)).toContainText("Stopped early");
  await expect(rows.nth(2).getByRole("rowheader")).toHaveText("Aarav");

  const tableRegion = page.locator(".teacher-assess-history .teacher-data-table-region");
  const dimensions = await tableRegion.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

  await page.getByRole("button", { name: "Start an assessment", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Assess a student", exact: true })).toBeVisible();
  await expect(page.locator(".teacher-assess-step")).toHaveCount(3);
  await expect(page).not.toHaveURL(/view=previous/);
});
