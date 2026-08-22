import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("parent area gives a family a clear route from update to progress, practice and reports", async ({ page }) => {
  await page.goto("/preview/parent-area.html");
  const main = page.locator("#parent-main");

  await expect(page.getByRole("heading", { name: "Aarav’s reading, clearly explained" })).toBeVisible();
  await expect(main).toContainText("What is going well");
  await expect(main).toContainText("The next teaching focus");

  await page.getByRole("navigation", { name: "Family area" }).getByRole("button", { name: "Progress" }).click();
  await expect(main).toContainText("No class comparisons or rankings are shown");
  await expect(main.locator(".pa-progress-row")).toHaveCount(6);
  await expect(main).not.toContainText("%", { useInnerText: true });

  await page.getByRole("navigation", { name: "Family area" }).getByRole("button", { name: "At home" }).click();
  await expect(main.locator(".pa-activity-list li")).toHaveCount(5);
  await expect(main).toContainText("does not record your child’s voice, image or home activity");

  await page.getByRole("navigation", { name: "Family area" }).getByRole("button", { name: "Reports" }).click();
  await expect(main.locator(".pa-report-card")).toHaveCount(2);
  await expect(main).not.toContainText("Unreleased school draft");
});

test("parent area switches linked children and shows family account boundaries", async ({ page }) => {
  await page.goto("/preview/parent-area.html");
  await page.getByLabel("Choose child").selectOption("student-aisha");
  await expect(page.getByRole("heading", { name: "Aisha’s reading, clearly explained" })).toBeVisible();

  await page.getByRole("button", { name: "Account" }).click();
  const main = page.locator("#parent-main");
  await expect(main).toContainText("The school controls family links");
  await expect(main).toContainText("LiteracyPath only shows information for children the school has securely linked to you");
});

test("parent area includes safe empty, loading and retryable error states", async ({ page }) => {
  await page.goto("/preview/parent-area.html?state=empty");
  await expect(page.getByRole("heading", { name: "No child is linked yet" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Aarav");

  await page.goto("/preview/parent-area.html?state=loading");
  await expect(page.getByRole("heading", { name: "Loading your family area" })).toBeVisible();

  await page.goto("/preview/parent-area.html?state=error");
  await expect(page.getByRole("heading", { name: "We could not load this update" })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Aarav’s reading, clearly explained" })).toBeVisible();
});

test("parent area fits a phone without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/parent-area.html");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  await expect(page.getByRole("navigation", { name: "Family area" }).getByRole("button", { name: "At home" })).toBeVisible();
});

test("parent area has no serious or critical automated accessibility violations", async ({ page }) => {
  await page.goto("/preview/parent-area.html");
  const result = await new AxeBuilder({ page }).include(".parent-area-shell").analyze();
  const blocking = result.violations.filter(violation => ["serious", "critical"].includes(violation.impact));
  expect(blocking.map(violation => ({
    id: violation.id,
    help: violation.help,
    targets: violation.nodes.map(node => node.target.join(" "))
  }))).toEqual([]);
});
