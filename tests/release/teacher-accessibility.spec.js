import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { completeTeacherClassEntry } from "./support/teacherLanding.js";
import { expectStudentRoster } from "./support/teacherStudents.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the teacher accessibility gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page);
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

test("@a11y-teacher authenticated section journey is keyboard and screen-reader ready", async ({ page }) => {
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

  // 2026-07-27: the section is called Students, not Children.
  const studentsButton = primaryNav.getByRole("button", { name: "Students", exact: true });
  await activateWithKeyboard(studentsButton);
  const roster = await expectStudentRoster(page, "Audit Class A");
  await expect(page.getByRole("main")).toHaveCount(1);
  const columnPicker = page.locator(".teacher-roster-column-picker");
  await activateWithKeyboard(columnPicker.getByText(/More filters and columns/));
  await columnPicker.getByLabel("Sound Seekers", { exact: true }).check();
  await columnPicker.getByLabel("Progress", { exact: true }).check();
  await expect(roster.getByRole("columnheader")).toHaveCount(8);
  await expect(roster.getByRole("row").filter({ hasText: "Aarav" }).getByRole("cell")).toHaveCount(8);

  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  const openAarav = aaravRow.locator(".teacher-roster-name");
  await activateWithKeyboard(openAarav);
  const studentPanel = page.getByRole("region", { name: "Student details: Aarav" });
  await expect(studentPanel).toBeVisible();
  await activateWithKeyboard(studentPanel.getByText("More for Aarav", { exact: true }));
  await activateWithKeyboard(
    studentPanel.getByRole("button", { name: "Student settings", exact: true })
  );
  const childOptions = page.getByRole("dialog", { name: "Options for Aarav" });
  await expect(childOptions).toBeVisible();
  await expectNoSeriousOrCritical(page, "Child options dialog");
  await page.keyboard.press("Escape");
  await expect(childOptions).toHaveCount(0);
  await expect(page.locator("body")).not.toBeFocused();

  const intentionChecks = [
    ["Assessments", "Assess a student"],
    ["Reports", "Open a report"],
    ["Resources", "Choose a teaching resource"],
    ["Settings", "Settings"]
  ];
  for (const [name, heading] of intentionChecks) {
    const button = primaryNav.getByRole("button", { name, exact: true });
    await activateWithKeyboard(button);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expectNoSeriousOrCritical(page, name);
  }

  await primaryNav.getByRole("button", { name: "Settings", exact: true }).click();
  const siteSettings = page.getByRole("button", { name: "Manage classes", exact: true });
  await activateWithKeyboard(siteSettings);
  await expect(page.getByRole("heading", {
    name: "Classes and groups",
    exact: true
  })).toBeVisible();
  await expectNoSeriousOrCritical(page, "Class sign-in");

  await expect(shell).toHaveAttribute("data-teacher-class-id", "30000000-0000-4000-8000-000000000001");
  expect(pageErrors).toEqual([]);
});
