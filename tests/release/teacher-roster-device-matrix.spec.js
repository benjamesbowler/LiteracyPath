import { expect, test } from "@playwright/test";
import { completeTeacherClassEntry } from "./support/teacherLanding.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const teacherId = "10000000-0000-4000-8000-000000000001";

async function openAuditRoster(page) {
  if (!teacherPassword) {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("teacherRosterPreviewDeviceGatePrepared")) {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("teacherRosterColumns:")) localStorage.removeItem(key);
        }
        sessionStorage.setItem("teacherRosterPreviewDeviceGatePrepared", "true");
      }
    });
    await page.goto("/preview/teacher-a11y.html?surface=classes&students=12");
  } else {
    await page.addInitScript(id => {
      if (!sessionStorage.getItem("teacherRosterDeviceGatePrepared")) {
        localStorage.removeItem(`teacherRosterColumns:${id}`);
        sessionStorage.setItem("teacherRosterDeviceGatePrepared", "true");
      }
    }, teacherId);
    await page.goto("/");
    await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
    await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
    await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await completeTeacherClassEntry(page);
    await page.getByTestId("teacher-primary-nav")
      .getByRole("button", { name: "Students", exact: true })
      .click();
  }
  await expect(page.getByRole("heading", {
    name: "Audit Class A — 12 students",
    exact: true
  })).toBeVisible();
  await expect(page.locator(".teacher-roster-table tbody > tr")).toHaveCount(10);
  await expect(page.getByRole("navigation", { name: "Student roster pages" })).toContainText(
    "Page 1 of 2"
  );
}

async function expectNoViewportOverflow(page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= window.innerWidth
    && document.body.scrollWidth <= window.innerWidth
  ))).toBe(true);
}

test("@teacher-roster-device-matrix keeps a configurable roster and student panel usable on Chromebook and tablet", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await openAuditRoster(page);

  const roster = page.locator(".teacher-roster-table");
  // The compact design keeps every essential learning field fixed. Sign-in
  // readiness is permanently visible under the student's name.
  for (const column of ["Student", "Current focus", "Accuracy", "Status", "Last active", "Actions"]) {
    await expect(roster.getByRole("columnheader", { name: column, exact: true })).toBeAttached();
  }
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toHaveCount(0);
  await expect(roster.getByRole("columnheader", { name: "Progress", exact: true })).toHaveCount(0);
  await expectNoViewportOverflow(page);
  await expect.poll(() => roster.evaluate(table => table.scrollWidth <= table.clientWidth + 1)).toBe(true);

  const columnPicker = page.locator(".teacher-roster-column-picker");
  await columnPicker.getByText(/More filters and columns/).click();
  await columnPicker.getByLabel("Sound Seekers", { exact: true }).check();
  await columnPicker.getByLabel("Progress", { exact: true }).check();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toBeAttached();
  await expect(roster.getByRole("columnheader", { name: "Progress", exact: true })).toBeAttached();

  await page.reload();
  await expect(page.getByRole("heading", {
    name: "Audit Class A — 12 students",
    exact: true
  })).toBeVisible({
    timeout: 20_000
  });
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toBeAttached();
  await expect(roster.getByRole("columnheader", { name: "Progress", exact: true })).toBeAttached();
  await columnPicker.getByText(/More filters and columns/).click();
  await columnPicker.getByRole("button", { name: "Restore scannable defaults", exact: true }).click();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toHaveCount(0);
  await expect(roster.getByRole("columnheader", { name: "Progress", exact: true })).toHaveCount(0);
  await columnPicker.getByText(/More filters and columns/).click();
  // The interaction and overflow checks above run at 1366 × 768. Give the
  // component capture enough vertical room to include its header and all ten
  // rows without the app shell clipping either edge.
  await page.setViewportSize({ width: 1366, height: 1600 });
  await expect(page.locator(".teacher-dashboard-roster")).toHaveScreenshot(
    "teacher-roster-chromebook.png",
    {
      animations: "disabled",
      mask: [roster.locator('td[data-label="Last active"]')],
      maskColor: "#eef2f7",
      maxDiffPixelRatio: 0.025
    }
  );

  await page.setViewportSize({ width: 1366, height: 768 });
  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  const openAarav = aaravRow.getByRole("button", { name: /^Aarav\b/ });
  await openAarav.click();
  const studentPanel = page.getByRole("region", { name: "Student details: Aarav" });
  await expect(studentPanel).toBeVisible();
  await expect(studentPanel).toContainText("Pictures ready");
  await expect(openAarav).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("dialog", { name: "Student details: Aarav" })).toHaveCount(0);
  const chromebookPanelBox = await studentPanel.boundingBox();
  expect(chromebookPanelBox).not.toBeNull();
  expect(chromebookPanelBox.x + chromebookPanelBox.width).toBeLessThanOrEqual(1366);
  expect(chromebookPanelBox.width).toBeLessThanOrEqual(400);
  // Capture the whole long region instead of letting the app shell's internal
  // 768px scroller obscure its lower half. Width remains Chromebook-sized.
  await page.setViewportSize({ width: 1366, height: 4000 });
  await expect(studentPanel).toHaveScreenshot(
    "teacher-learner-drawer-chromebook.png",
    {
      animations: "disabled",
      maxDiffPixelRatio: 0.025
    }
  );
  await studentPanel.getByRole("button", { name: "Close student details", exact: true }).click();
  await expect(page.getByRole("region", { name: "Student panel" })).toBeVisible();
  await expect(openAarav).toHaveAttribute("aria-pressed", "false");

  await page.setViewportSize({ width: 1024, height: 768 });
  await expectNoViewportOverflow(page);
  const rosterTools = page.getByRole("region", {
    name: "Search and filter students"
  });
  await expect.poll(async () => {
    const toolsBox = await rosterTools.boundingBox();
    const statusBox = await rosterTools.getByRole("status").boundingBox();
    return Boolean(
      toolsBox
      && statusBox
      && statusBox.x >= toolsBox.x
      && statusBox.x + statusBox.width <= toolsBox.x + toolsBox.width + 1
    );
  }).toBe(true);
  await expect.poll(() => roster.locator("tbody").evaluate(body => getComputedStyle(body).display)).toBe("block");
  const tabletRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await expect.poll(() => tabletRow.evaluate(row => getComputedStyle(row).display)).toBe("grid");
  await expect.poll(() => roster.evaluate(table => table.scrollWidth <= table.clientWidth + 1)).toBe(true);
  const tabletRowBox = await tabletRow.boundingBox();
  const rosterBox = await roster.boundingBox();
  expect(tabletRowBox).not.toBeNull();
  expect(rosterBox).not.toBeNull();
  expect(tabletRowBox.x).toBeGreaterThanOrEqual(rosterBox.x);
  expect(tabletRowBox.x + tabletRowBox.width).toBeLessThanOrEqual(rosterBox.x + rosterBox.width + 1);
  await expect.poll(() => tabletRow.getByRole("button", { name: /^Aarav\b/ })
    .evaluate(button => button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  // The interaction and overflow checks above run at 1024 × 768. Give the
  // component capture enough vertical room to include its header and all ten
  // rows without the app shell clipping either edge.
  await page.setViewportSize({ width: 1024, height: 1600 });
  await expect(page.locator(".teacher-dashboard-roster")).toHaveScreenshot(
    "teacher-roster-tablet.png",
    {
      animations: "disabled",
      mask: [roster.locator('td[data-label="Last active"]')],
      maskColor: "#eef2f7",
      maxDiffPixelRatio: 0.025
    }
  );

  await page.setViewportSize({ width: 1024, height: 768 });
  await tabletRow.getByRole("button", { name: /^Aarav\b/ }).click();
  const tabletPanel = page.getByRole("region", { name: "Student details: Aarav" });
  await expect(tabletPanel).toBeVisible();
  const tabletPanelBox = await tabletPanel.boundingBox();
  expect(tabletPanelBox).not.toBeNull();
  expect(tabletPanelBox.x).toBeGreaterThanOrEqual(0);
  expect(tabletPanelBox.x + tabletPanelBox.width).toBeLessThanOrEqual(1024);
  // The app itself remains exercised at 1024 × 768. Expand only the capture
  // height so Playwright can record this long region without clipping it at
  // the internally scrolling app shell's viewport edge.
  await page.setViewportSize({ width: 1024, height: 4000 });
  await expect(tabletPanel).toHaveScreenshot(
    "teacher-learner-drawer-tablet.png",
    {
      animations: "disabled",
      maxDiffPixelRatio: 0.025
    }
  );
});
