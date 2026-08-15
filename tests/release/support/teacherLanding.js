import { expect } from "@playwright/test";

function exactClassButton(page, className) {
  return page.locator(".teacher-class-gate-grid")
    .getByRole("button")
    .filter({ has: page.getByText(className, { exact: true }) });
}

export async function completeTeacherClassEntry(page, className = "Audit Class A") {
  const today = page.getByRole("heading", { name: "Today", exact: true });
  const chooser = page.getByRole("heading", { name: "Choose your class", exact: true });

  await expect(today.or(chooser)).toBeVisible({ timeout: 20_000 });
  if (await chooser.isVisible()) {
    const classButton = exactClassButton(page, className);
    await expect(classButton).toHaveCount(1);
    await classButton.click();
  }
  await expect(today).toBeVisible({ timeout: 20_000 });
}

export function auditClassForEmail(email) {
  return String(email || "").includes("teacher-b") ? "Audit Class B" : "Audit Class A";
}
