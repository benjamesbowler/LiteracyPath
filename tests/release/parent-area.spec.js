import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("parent area gives a family a clear route from update to progress and reports", async ({ page }) => {
  await page.goto("/preview/parent-area.html");
  const main = page.locator("#parent-main");

  await expect(page.getByRole("heading", { name: "Aarav’s reading, clearly explained" })).toBeVisible();
  await expect(main).toContainText("What is going well");
  await expect(main).toContainText("The next teaching focus");

  await page.getByRole("navigation", { name: "Family area" }).getByRole("button", { name: "Progress" }).click();
  await expect(main).toContainText("No class comparisons or rankings are shown");
  await expect(main).toContainText("Needs support");
  await expect(main).toContainText("Not enough results");
  await expect(main).not.toContainText("Doing well");
  await expect(main).not.toContainText("Growing");
  await expect(main).not.toContainText("Not checked yet");
  await expect(main.locator(".pa-progress-row")).toHaveCount(6);
  await expect(main).not.toContainText("%", { useInnerText: true });

  await expect(page.getByRole("navigation", { name: "Family area" }).getByRole("button", { name: "At home" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Print plan" })).toHaveCount(0);

  await page.getByRole("navigation", { name: "Family area" }).getByRole("button", { name: "Reports" }).click();
  await expect(main.locator(".pa-report-card")).toHaveCount(2);
  await expect(main).not.toContainText("Unreleased school draft");
  await main.getByRole("button", { name: "Open" }).first().click();
  const dialog = page.getByRole("dialog");
  for (const heading of [
    "Summary highlight",
    "What your child can do",
    "What we're working on next",
    "What this means",
    "What you can do at home",
    "Who to talk to"
  ]) await expect(dialog.getByRole("heading", { name: heading })).toBeVisible();
});

test("parent area switches linked children and shows family account boundaries", async ({ page }) => {
  await page.goto("/preview/parent-area.html");
  await page.getByLabel("Choose child").selectOption("student-aisha");
  await expect(page.getByRole("heading", { name: "Aisha’s reading, clearly explained" })).toBeVisible();

  await page.getByRole("button", { name: "Account" }).click();
  const main = page.locator("#parent-main");
  await expect(main).toContainText("The school controls family links");
  await expect(main).toContainText("Literacy Guide only shows information for children the school has securely linked to you");
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
  await expect(page.getByRole("navigation", { name: "Family area" }).getByRole("button", { name: "Reports" })).toBeVisible();
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

test("production family route opens a real secure sign-in surface", async ({ page }) => {
  await page.goto("/parent");
  await expect(page.getByRole("heading", { name: "Family sign in" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByText("A school invitation and confirmed email are required")).toBeVisible();

  const result = await new AxeBuilder({ page }).include(".parent-auth-shell").analyze();
  const blocking = result.violations.filter(violation => ["serious", "critical"].includes(violation.impact));
  expect(blocking.map(violation => violation.id)).toEqual([]);
});

// Old links cannot reopen the retired activity page or leave a blank parent area.
test("retired home-activity links return to the family overview", async ({ page }) => {
  await page.goto("/preview/parent-area.html?section=practice");
  await expect(page.getByRole("heading", { name: "Aarav’s reading, clearly explained" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Family Bridge");
  await expect(page.getByRole("button", { name: "Print plan" })).toHaveCount(0);
});

for (const width of [1280, 390]) {
  test(`teacher resources retain teaching tools without retired planners at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/preview/teacher-a11y.html?surface=resources");
    await expect(page.getByRole("heading", { name: "Teach, print, project" })).toBeVisible();
    await expect(page.locator("[data-resource-kind]").filter({ hasText: "Teaching plan" })).toHaveCount(0);
    await expect(page.locator('[data-resource-kind="lesson-composer"], [data-resource-kind="family-bridge"]')).toHaveCount(0);
    for (const kind of ["present", "worksheets", "guided-reading"]) {
      const card = page.locator(`[data-resource-kind="${kind}"]`).locator("..");
      await expect(card).toBeVisible();
      await expect(card.getByRole("button")).toBeEnabled();
    }
    await expect(page.locator("body")).not.toContainText("Family Bridge");
    await expect(page.locator("body")).not.toContainText("Small-group lesson composer");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
}
