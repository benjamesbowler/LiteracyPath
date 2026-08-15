import { expect, test } from "@playwright/test";

const CLASS_ID = "00000000-0000-4000-8000-0000000000a1";
const teacherUrl = `/preview/maths-phase-zero.html?audience=teacher#maths/teacher?class=${CLASS_ID}`;

test("Maths overview starts with evidence-safe teaching priorities", async ({ page }) => {
  await page.goto(teacherUrl);
  await expect(page.getByRole("heading", { name: "What needs attention next?" })).toBeVisible();
  await expect(page.getByText("Shared next action")).toBeVisible();
  await expect(page.getByText("Neutral evidence gap")).toBeVisible();
  await expect(page.getByText(/Practice and short checks suggest what to teach next/)).toBeVisible();
  await expect(page.locator(".maths-overview-snapshot")).toHaveCount(0);
});

test("assignment builder selects nobody by default and requires exact recipient confirmation", async ({ page }) => {
  await page.goto(teacherUrl);
  await page.getByTestId("teacher-primary-nav").getByRole("button", { name: "Resources", exact: true }).click();

  const review = page.getByRole("button", { name: "Review assignment" });
  await expect(page.getByText("Learners (0 selected)")).toBeVisible();
  await expect(review).toBeDisabled();
  await page.getByLabel("Aaron").check();
  await expect(review).toBeEnabled();
  await review.click();

  await expect(page.getByRole("heading", { name: /Guided lesson/ })).toBeVisible();
  await expect(page.locator(".maths-assignment-confirm").getByText("Aaron", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm assignment" })).toBeVisible();
  await expect(page.getByText("12 learners assigned")).toBeVisible();
  await expect(page.getByText("roster unavailable")).toHaveCount(0);
});

test("reports connect repeated patterns to teaching and a prepared recheck", async ({ page }) => {
  await page.goto(teacherUrl);
  await page.getByTestId("teacher-primary-nav").getByRole("button", { name: "Reports", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Teach, then recheck" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pattern to check" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Plan group" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Prepare recheck" })).toBeVisible();
  await expect(page.getByText(/Roster order is preserved/)).toBeVisible();

  await page.getByRole("button", { name: "Plan group" }).click();
  await expect(page.getByRole("heading", { name: "Small-group composer" })).toBeVisible();
  await expect(page.getByText("Learners (3 selected)")).toBeVisible();
});
