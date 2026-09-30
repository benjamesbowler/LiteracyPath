import { expect, test } from "@playwright/test";

const classA = "00000000-0000-4000-8000-0000000000a1";
const classB = "00000000-0000-4000-8000-0000000000b2";
const worksheetUrl = (classId, cycleId) => `/preview/teacher-a11y.html?surface=worksheets&workspace-class=${classId}&cycle=${cycleId}`;
test.setTimeout(90000);

test("worksheets inherit teaching context and retain deliberate overrides only for their class", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("lp-worksheets-last-cycle", "cycle-1"));
  await page.goto(worksheetUrl(classA, "cycle-6"));
  const cycle = page.getByRole("combobox", { name: "Teaching cycle", exact: true });
  await expect(cycle).toHaveValue("cycle-6");
  await expect(page.locator(".ws-cycle-context")).toContainText("Audit Class A · Current class cycle: Cycle 6");
  await cycle.selectOption("cycle-9");
  await expect(page.getByText(/Worksheet override: Cycle 9/)).toBeVisible();

  await page.goto(worksheetUrl(classB, "cycle-3"));
  await expect(cycle).toHaveValue("cycle-3");
  await expect(page.locator(".ws-cycle-context")).toContainText("Audit Class B · Current class cycle: Cycle 3");

  await page.goto(worksheetUrl(classA, "cycle-6"));
  await expect(cycle).toHaveValue("cycle-9");
  await page.getByRole("button", { name: "Use current class cycle", exact: true }).click();
  await expect(cycle).toHaveValue("cycle-6");
  await page.reload();
  await expect(cycle).toHaveValue("cycle-6");
});

test("an unknown class cycle is explicit and printing waits for a deliberate selection", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(worksheetUrl(classB, ""));
  const cycle = page.getByRole("combobox", { name: "Teaching cycle", exact: true });
  await expect(cycle).toHaveValue("");
  await expect(page.locator(".ws-cycle-context")).toContainText("Current class cycle: Not set");
  await expect(page.getByRole("button", { name: "Open print preview", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save to bank", exact: true })).toBeDisabled();
  await cycle.selectOption("cycle-6");
  await expect(page.getByRole("button", { name: "Open print preview", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Use current class cycle", exact: true }).click();
  await expect(cycle).toHaveValue("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: ".artifacts/app-simplification/teacher/worksheet-unknown-390.png", animations: "disabled" });
});
