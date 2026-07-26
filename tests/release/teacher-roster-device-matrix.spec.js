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
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Children", exact: true })
    .click();
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class A" });
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  await expect(page.getByRole("heading", { name: "Children — Audit Class A", exact: true })).toBeVisible();
  await expect(page.locator(".teacher-roster-table tbody > tr")).toHaveCount(12);
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
  for (const column of ["Display name", "Focus", "Progress", "Last active", "Actions"]) {
    await expect(roster.getByRole("columnheader", { name: column, exact: true })).toBeAttached();
  }
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toHaveCount(0);
  await expect(roster.getByRole("columnheader", { name: "Sign-in", exact: true })).toHaveCount(0);
  await expectNoViewportOverflow(page);
  await expect.poll(() => roster.evaluate(table => table.scrollWidth <= table.clientWidth + 1)).toBe(true);

  const columnPicker = page.locator(".teacher-roster-column-picker");
  await columnPicker.getByText(/Choose columns/).click();
  await columnPicker.getByLabel("Sound Seekers", { exact: true }).check();
  await columnPicker.getByLabel("Sign-in", { exact: true }).check();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toBeAttached();
  await expect(roster.getByRole("columnheader", { name: "Sign-in", exact: true })).toBeAttached();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Children", exact: true })).toBeVisible({
    timeout: 20_000
  });
  const reloadedRosterAdmin = page.locator(".teacher-roster-admin");
  if (!await reloadedRosterAdmin.evaluate(element => element.open)) {
    await reloadedRosterAdmin.locator(":scope > summary").click();
  }
  await expect(page.getByRole("heading", { name: "Children — Audit Class A", exact: true })).toBeVisible();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toBeAttached();
  await expect(roster.getByRole("columnheader", { name: "Sign-in", exact: true })).toBeAttached();
  await columnPicker.getByText(/Choose columns/).click();
  await columnPicker.getByRole("button", { name: "Restore scannable defaults", exact: true }).click();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toHaveCount(0);
  await expect(roster.getByRole("columnheader", { name: "Sign-in", exact: true })).toHaveCount(0);
  await columnPicker.getByText(/Choose columns/).click();
  await expect(page.locator(".teacher-dashboard-roster")).toHaveScreenshot(
    "teacher-roster-chromebook.png",
    { animations: "disabled", maxDiffPixelRatio: 0.025 }
  );

  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Open child", exact: true }).click();
  const drawerDialog = page.getByRole("dialog", { name: "Child details: Aarav" });
  await expect(drawerDialog).toBeVisible();
  await expect(drawerDialog.getByRole("region", { name: "Child details: Aarav" })).toContainText(
    "Pictures ready"
  );
  await expect(drawerDialog.getByRole("button", { name: "Close child details", exact: true })).toBeFocused();
  const chromebookDrawerBox = await drawerDialog.locator(".teacher-learner-drawer").boundingBox();
  expect(chromebookDrawerBox).not.toBeNull();
  expect(chromebookDrawerBox.x + chromebookDrawerBox.width).toBeLessThanOrEqual(1366);
  expect(chromebookDrawerBox.width).toBeLessThanOrEqual(480);
  await expect(drawerDialog.locator(".teacher-learner-drawer")).toHaveScreenshot(
    "teacher-learner-drawer-chromebook.png",
    { animations: "disabled", maxDiffPixelRatio: 0.025 }
  );
  await page.keyboard.press("Escape");
  await expect(drawerDialog).toHaveCount(0);
  await expect(aaravRow.getByRole("button", { name: "Open child", exact: true })).toBeFocused();

  await page.setViewportSize({ width: 1024, height: 768 });
  await expectNoViewportOverflow(page);
  const rosterTools = page.getByRole("region", {
    name: "Search, sort, and filter children"
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
  await expect.poll(() => tabletRow.getByRole("button", { name: "Open child", exact: true })
    .evaluate(button => button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await expect(page.locator(".teacher-dashboard-roster")).toHaveScreenshot(
    "teacher-roster-tablet.png",
    { animations: "disabled", maxDiffPixelRatio: 0.025 }
  );

  await tabletRow.getByRole("button", { name: "Open child", exact: true }).click();
  const tabletDrawer = page.getByRole("dialog", { name: "Child details: Aarav" });
  const tabletDrawerBox = await tabletDrawer.locator(".teacher-learner-drawer").boundingBox();
  expect(tabletDrawerBox).not.toBeNull();
  expect(tabletDrawerBox.x).toBeGreaterThanOrEqual(0);
  expect(tabletDrawerBox.x + tabletDrawerBox.width).toBeLessThanOrEqual(1024);
  await expect(tabletDrawer.locator(".teacher-learner-drawer")).toHaveScreenshot(
    "teacher-learner-drawer-tablet.png",
    { animations: "disabled", maxDiffPixelRatio: 0.025 }
  );
});
