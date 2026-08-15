import { expect } from "@playwright/test";

function exactClassButton(page, className) {
  return page.locator(".teacher-class-gate-grid")
    .getByRole("button")
    .filter({ has: page.getByText(className, { exact: true }) });
}

export function currentTeacherClass(page) {
  return page.locator("[data-teacher-context-bar] .tcb-class-name");
}

export async function expectCurrentTeacherClass(page, className) {
  const currentClass = currentTeacherClass(page);
  await expect(currentClass).toBeVisible({ timeout: 20_000 });
  await expect(currentClass).toHaveText(className);
  return currentClass;
}

export async function openTeacherClassControls(page) {
  const controls = page.locator("details.teacher-students-class-tools");
  await expect(controls).toBeVisible({ timeout: 20_000 });
  if (!(await controls.evaluate(element => element.open))) {
    await controls.locator(":scope > summary").click();
  }
  const select = controls.getByLabel("Current class");
  await expect(select).toBeVisible();
  await expect(select).toBeEnabled({ timeout: 20_000 });
  return select;
}

export async function selectTeacherClassFromStudents(page, className) {
  const select = await openTeacherClassControls(page);
  await select.selectOption({ label: className });
  await expect(select.locator("option:checked")).toHaveText(className);
  await expectCurrentTeacherClass(page, className);
  return select;
}

export async function switchTeacherClass(page, className) {
  const currentClass = currentTeacherClass(page);
  await expect(currentClass).toBeVisible({ timeout: 20_000 });
  if ((await currentClass.textContent())?.trim() === className) return currentClass;

  const contextBar = page.locator("[data-teacher-context-bar]");
  await contextBar.getByRole("button", { name: "Change", exact: true }).click();
  const chooser = page.getByRole("heading", { name: "Choose your class", exact: true });
  await expect(chooser).toBeVisible({ timeout: 20_000 });
  const classButton = exactClassButton(page, className);
  await expect(classButton).toHaveCount(1);
  await classButton.click();
  await expect(page.getByRole("heading", {
    name: "Start with these students",
    exact: true
  })).toBeVisible({ timeout: 20_000 });
  return expectCurrentTeacherClass(page, className);
}

export async function completeTeacherClassEntry(page, className = "Audit Class A") {
  const dashboard = page.getByRole("heading", {
    name: "Start with these students",
    exact: true
  });
  const chooser = page.getByRole("heading", { name: "Choose your class", exact: true });
  const firstClass = page.getByRole("heading", {
    name: "Create your first class",
    exact: true
  });

  await expect(dashboard.or(chooser).or(firstClass)).toBeVisible({ timeout: 20_000 });
  if (await firstClass.isVisible()) return;
  if (await chooser.isVisible()) {
    const classButton = exactClassButton(page, className);
    await expect(classButton).toHaveCount(1);
    await classButton.click();
  }
  await expect(dashboard).toBeVisible({ timeout: 20_000 });
}

export function auditClassForEmail(email) {
  return String(email || "").includes("teacher-b") ? "Audit Class B" : "Audit Class A";
}
