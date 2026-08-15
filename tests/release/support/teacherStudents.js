import { expect } from "@playwright/test";

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function studentRosterHeading(page, className) {
  return page.getByRole("heading", {
    name: new RegExp(`^${escapeRegExp(className)} — \\d+ students?$`)
  });
}

export async function expectStudentRoster(page, className) {
  await expect(studentRosterHeading(page, className)).toBeVisible({ timeout: 20_000 });
  const roster = page.locator(".teacher-roster-table");
  await expect(roster).toBeVisible();
  return roster;
}

export async function openStudentPanel(page, roster, studentName) {
  const row = roster.getByRole("row").filter({ hasText: studentName });
  await expect(row).toBeVisible();
  const nameButton = row.locator(".teacher-roster-name");
  await expect(nameButton).toContainText(studentName);
  await nameButton.click();
  const panel = page.getByRole("region", { name: `Student details: ${studentName}` });
  await expect(panel).toBeVisible();
  return panel;
}

export async function openStudentSettings(page, roster, studentName) {
  const panel = await openStudentPanel(page, roster, studentName);
  const settings = panel.getByRole("button", { name: "Student settings", exact: true });
  if (!await settings.isVisible()) {
    await panel.getByText(`More for ${studentName}`, { exact: true }).click();
  }
  await settings.click();
  const options = page.getByRole("dialog", { name: `Options for ${studentName}` });
  await expect(options).toBeVisible();
  return options;
}
