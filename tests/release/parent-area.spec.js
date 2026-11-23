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
    await expect(page.getByRole("heading", { name: "What will you teach today?" })).toBeVisible();
    await expect(page.locator("[data-resource-kind]").filter({ hasText: "Teaching plan" })).toHaveCount(0);
    await expect(page.locator('[data-resource-kind="lesson-composer"], [data-resource-kind="family-bridge"]')).toHaveCount(0);
    for (const kind of ["present", "worksheets", "guided-reading"]) {
      const card = page.locator(`[data-resource-kind="${kind}"]`).locator("..");
      await expect(card).toBeVisible();
      const actions = await card.getByRole("button").all();
      expect(actions.length).toBeGreaterThan(0);
      for (const action of actions) await expect(action).toBeEnabled();
    }
    await expect(page.locator("body")).not.toContainText("Family Bridge");
    await expect(page.locator("body")).not.toContainText("Small-group lesson composer");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
}

test("family report opens with keyboard focus, closes with Escape and restores focus", async ({ page }) => {
  await page.goto("/preview/parent-area.html?section=reports");
  const open = page.getByRole("button", { name: "Open Summer reading update" });
  await open.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Summer reading update" })).toBeFocused();
  for (let index = 0; index < 7; index += 1) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement === document.body
      || Boolean(document.activeElement.closest("dialog")))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test("an accepted invitation retries loading without submitting again", async ({ page }) => {
  await page.goto(`/preview/parent-area.html?portal=accept&invite=${"a".repeat(64)}`);
  await page.getByRole("textbox", { name: "Your name" }).fill("Fixture Guardian");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Accept secure access" }).click();
  await expect(page.getByRole("heading", { name: "Your invitation was accepted" })).toBeVisible();
  await expect(page).toHaveURL(/\/parent$/);
  await page.getByRole("button", { name: "Load family area again" }).click();
  await expect(page.getByRole("heading", { name: "Aarav’s reading, clearly explained" })).toBeVisible();
  expect(await page.evaluate(() => window.__familyPortalFixture.accepted)).toBe(1);
});

test("an open report closes when the next authorized read withdraws it", async ({ page }) => {
  await page.goto("/preview/parent-area.html?portal=refresh");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page.getByRole("button", { name: "Open Summer reading update" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => {
    window.__familyPortalFixture.withdrawn = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No reports have been released yet" })).toBeVisible();
});

test("printing a withdrawn release closes the reserved window without creating a document", async ({ page }) => {
  await page.goto("/preview/parent-area.html?portal=refresh");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page.evaluate(() => {
    window.__familyPortalFixture.withdrawn = true;
    window.__familyPrintProbe = { navigated: false, closed: false };
    window.open = () => ({
      get closed() { return window.__familyPrintProbe.closed; },
      location: { replace() { window.__familyPrintProbe.navigated = true; } },
      close() { window.__familyPrintProbe.closed = true; }
    });
  });
  await page.getByRole("button", { name: "Print or save Summer reading update" }).click();
  await expect.poll(() => page.evaluate(() => window.__familyPrintProbe)).toEqual({ navigated: false, closed: true });
  await expect(page.getByRole("heading", { name: "No reports have been released yet" })).toBeVisible();
});

test("switching guardian closes the previous guardian's open release", async ({ page }) => {
  await page.goto("/preview/parent-area.html?portal=refresh");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page.getByRole("button", { name: "Open Summer reading update" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => window.__familyPortalFixture.setGuardian("fixture-guardian-b"));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Aisha’s reading, clearly explained" })).toBeVisible();
  await expect(page.getByText("Summer reading update")).toHaveCount(0);
});
