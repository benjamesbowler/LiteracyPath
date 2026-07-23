import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the teacher accessibility gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

async function expectNoSeriousOrCritical(page, state) {
  const result = await new AxeBuilder({ page }).include(".lg-app-shell").analyze();
  const blocking = result.violations.filter(
    violation => violation.impact === "serious" || violation.impact === "critical"
  );
  expect(
    blocking.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map(node => node.target.join(" "))
    })),
    `${state} has serious or critical accessibility violations`
  ).toEqual([]);
}

async function activateWithKeyboard(locator) {
  await locator.focus();
  await expect(locator).toBeFocused();
  await locator.press("Enter");
}

test("@a11y-teacher authenticated five-intention journey is keyboard and screen-reader ready", async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await logIn(page);

  const shell = page.locator(".lg-app-shell");
  const primaryNav = page.getByTestId("teacher-primary-nav");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(primaryNav).toHaveAccessibleName("Teacher primary");
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });
  await expectNoSeriousOrCritical(page, "Today");

  const classesButton = primaryNav.getByRole("button", { name: "Classes", exact: true });
  await activateWithKeyboard(classesButton);
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();
  await expect(page.getByRole("main")).toHaveCount(1);
  const roster = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Display name" }) });
  await expect(roster.getByRole("columnheader")).toHaveCount(8);
  await expect(roster.getByRole("row").filter({ hasText: "Aarav" }).getByRole("cell")).toHaveCount(8);

  const soundMap = page.locator(".class-heat-panel");
  await activateWithKeyboard(soundMap.getByRole("button", { name: "Show", exact: true }));
  const chartAlternative = soundMap.getByRole("img");
  await expect(chartAlternative).toHaveAccessibleName(/Class sound map\./);
  await expectNoSeriousOrCritical(page, "Classes with roster and sound map");

  const newCodeButton = page.getByRole("button", { name: "New code", exact: true });
  await activateWithKeyboard(newCodeButton);
  const dialog = page.getByRole("dialog", { name: "Make a new class code" });
  await expect(dialog).toBeVisible();
  const makeCodeButton = dialog.getByRole("button", { name: "Make new code", exact: true });
  const keepCodeButton = dialog.getByRole("button", { name: "Keep current code", exact: true });
  await expect(makeCodeButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(keepCodeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(makeCodeButton).toBeFocused();
  await expectNoSeriousOrCritical(page, "Class-code dialog");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(newCodeButton).toBeFocused();

  const intentionChecks = [
    ["Assess", "Choose the evidence you need"],
    ["Progress", "Turn evidence into a clear next step"],
    ["Plan/Resources", "Prepare teaching and practice"]
  ];
  for (const [name, heading] of intentionChecks) {
    const button = primaryNav.getByRole("button", { name, exact: true });
    await activateWithKeyboard(button);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expectNoSeriousOrCritical(page, name);
  }

  await expect(shell).toHaveAttribute("data-teacher-class-id", "30000000-0000-4000-8000-000000000001");
  expect(pageErrors).toEqual([]);
});
