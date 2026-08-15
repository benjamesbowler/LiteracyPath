import { expect, test } from "@playwright/test";
import {
  completeTeacherClassEntry,
  selectTeacherClassFromStudents
} from "./support/teacherLanding.js";
import { expectStudentRoster, openStudentPanel } from "./support/teacherStudents.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const denseAnalyticsJargon = /\b(?:confidence interval|denominator|outlier|percentile|instructional group|weighted average)\b/i;

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the report-audience gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page);
}

async function openAaravReport(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  await selectTeacherClassFromStudents(page, "Audit Class A");
  const roster = await expectStudentRoster(page, "Audit Class A");
  const studentPanel = await openStudentPanel(page, roster, "Aarav");
  await studentPanel.getByRole("button", { name: "Open report", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Summary", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

test("@report-audience-templates keeps Aarav's reachable report brief and audience-safe", async ({
  page
}) => {
  await logIn(page);
  await openAaravReport(page);

  // 2026-07-26: teacher copy no longer says "child" or "has been exposed to" — the
  // report nav is "Student reports" and tiles read "Aarav answered X 4 times".
  const reportNav = page.getByRole("navigation", { name: "Student reports" });
  const reportLinks = reportNav.getByRole("link");
  const primaryViews = ["Summary", "Skills", "High-frequency words", "EL assessments"];
  if (await reportLinks.count()) {
    await expect(reportLinks).toHaveCount(4);
    for (const view of primaryViews) {
      await expect(reportNav.getByRole("link", {
        name: new RegExp(`^${view.replace("/", "\\/")}`)
      })).toBeVisible();
    }
    await reportNav.getByRole("link", { name: /^Skills/ }).click();
  } else {
    const reportSelect = reportNav.getByRole("combobox", { name: "Choose a report" });
    await expect(reportSelect).toBeVisible();
    for (const view of primaryViews) {
      await expect(reportSelect.locator("option", { hasText: view })).toHaveCount(1);
    }
    await reportSelect.selectOption("skills-check");
  }

  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
  const firstTile = page.locator(".simple-report-tile").first();
  await expect(firstTile).toContainText(/Aarav answered/i);
  await expect(firstTile).toContainText(/correct answer/i);
  const reportText = await page.locator(".lg-report-main").innerText();
  expect(reportText).not.toMatch(denseAnalyticsJargon);
  expect(reportText).not.toMatch(/[£$€¥]/u);
});
