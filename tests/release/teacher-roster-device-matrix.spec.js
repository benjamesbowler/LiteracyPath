import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const teacherId = "10000000-0000-4000-8000-000000000001";

async function openAuditRoster(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the teacher roster device gate.");
  }
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
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class A" });
  await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible();
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

test("@teacher-roster-device-matrix keeps a configurable roster and detail drawer usable on Chromebook and tablet", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await openAuditRoster(page);

  const roster = page.locator(".teacher-roster-table");
  // 2026-07-26: "Sign-in" is a default column now — it was the only route to setting
  // sign-in pictures and hiding it behind the picker made a new class unusable.
  for (const column of ["Display name", "Current focus", "Sign-in", "Last active", "Actions"]) {
    await expect(roster.getByRole("columnheader", { name: column, exact: true })).toBeAttached();
  }
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toHaveCount(0);
  await expectNoViewportOverflow(page);
  await expect.poll(() => roster.evaluate(table => table.scrollWidth <= table.clientWidth + 1)).toBe(true);

  const columnPicker = page.locator(".teacher-roster-column-picker");
  await columnPicker.getByText(/Choose columns/).click();
  await columnPicker.getByLabel("Sound Seekers", { exact: true }).check();
  await columnPicker.getByLabel("Sign-in", { exact: true }).check();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toBeAttached();
  await expect(roster.getByRole("columnheader", { name: "Sign-in", exact: true })).toBeAttached();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toBeAttached();
  await expect(roster.getByRole("columnheader", { name: "Sign-in", exact: true })).toBeAttached();
  await columnPicker.getByText(/Choose columns/).click();
  await columnPicker.getByRole("button", { name: "Restore scannable defaults", exact: true }).click();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toHaveCount(0);
  // Sign-in survives a reset to defaults, by design.
  await expect(roster.getByRole("columnheader", { name: "Sign-in", exact: true })).toBeAttached();
  await columnPicker.getByText(/Choose columns/).click();
  await expect(page.locator(".teacher-dashboard-roster")).toHaveScreenshot(
    "teacher-roster-chromebook.png",
    {
      animations: "disabled",
      mask: [roster.locator('td[data-label="Last active"]')],
      maskColor: "#eef2f7",
      maxDiffPixelRatio: 0.025
    }
  );

  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Open Aarav", exact: true }).click();
  const drawerDialog = page.getByRole("dialog", { name: "Student details: Aarav" });
  await expect(drawerDialog).toBeVisible();
  await expect(drawerDialog.getByRole("region", { name: "Student details: Aarav" })).toContainText(
    "Pictures ready"
  );
  await expect(drawerDialog.getByRole("button", { name: "Close student details", exact: true })).toBeFocused();
  const chromebookDrawer = drawerDialog.locator(".teacher-learner-drawer");
  await expect(chromebookDrawer).toBeVisible();
  const chromebookDrawerBox = await chromebookDrawer.boundingBox();
  expect(chromebookDrawerBox).not.toBeNull();
  expect(chromebookDrawerBox.x + chromebookDrawerBox.width).toBeLessThanOrEqual(1366);
  expect(chromebookDrawerBox.width).toBeLessThanOrEqual(480);
  await expect(chromebookDrawer).toHaveScreenshot(
    "teacher-learner-drawer-chromebook.png",
    {
      animations: "disabled",
      mask: [drawerDialog.locator(".teacher-learner-drawer-metrics > .teacher-roster-metric:nth-child(3) strong")],
      maskColor: "#eef2f7",
      maxDiffPixelRatio: 0.025
    }
  );
  await page.keyboard.press("Escape");
  await expect(drawerDialog).toHaveCount(0);
  await expect(aaravRow.getByRole("button", { name: "Open Aarav", exact: true })).toBeFocused();

  await page.setViewportSize({ width: 1024, height: 768 });
  await expectNoViewportOverflow(page);
  const rosterTools = page.getByRole("region", {
    name: "Search, sort, and filter students"
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
  await expect.poll(() => roster.locator("tbody").evaluate(body => getComputedStyle(body).display)).toBe("grid");
  const tabletRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  const tabletRowBox = await tabletRow.boundingBox();
  const rosterBox = await roster.boundingBox();
  expect(tabletRowBox).not.toBeNull();
  expect(rosterBox).not.toBeNull();
  expect(tabletRowBox.x).toBeGreaterThanOrEqual(rosterBox.x);
  expect(tabletRowBox.x + tabletRowBox.width).toBeLessThanOrEqual(rosterBox.x + rosterBox.width + 1);
  await expect.poll(() => tabletRow.getByRole("button", { name: "Open Aarav", exact: true })
    .evaluate(button => button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await expect(page.locator(".teacher-dashboard-roster")).toHaveScreenshot(
    "teacher-roster-tablet.png",
    {
      animations: "disabled",
      mask: [roster.locator('td[data-label="Last active"]')],
      maskColor: "#eef2f7",
      maxDiffPixelRatio: 0.025
    }
  );

  await tabletRow.getByRole("button", { name: "Open Aarav", exact: true }).click();
  const tabletDrawer = page.getByRole("dialog", { name: "Student details: Aarav" });
  const tabletDrawerSurface = tabletDrawer.locator(".teacher-learner-drawer");
  await expect(tabletDrawerSurface).toBeVisible();
  const tabletDrawerBox = await tabletDrawerSurface.boundingBox();
  expect(tabletDrawerBox).not.toBeNull();
  expect(tabletDrawerBox.x).toBeGreaterThanOrEqual(0);
  expect(tabletDrawerBox.x + tabletDrawerBox.width).toBeLessThanOrEqual(1024);
  await expect(tabletDrawerSurface).toHaveScreenshot(
    "teacher-learner-drawer-tablet.png",
    {
      animations: "disabled",
      mask: [tabletDrawer.locator(".teacher-learner-drawer-metrics > .teacher-roster-metric:nth-child(3) strong")],
      maskColor: "#eef2f7",
      maxDiffPixelRatio: 0.025
    }
  );
});
