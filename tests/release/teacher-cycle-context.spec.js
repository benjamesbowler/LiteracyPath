import { expect, test } from "@playwright/test";

const url = "/preview/teacher-a11y.html?surface=cycle-context";
test.setTimeout(90000);

test("a saved device cycle requires class confirmation and does not leak to the next class", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("cycle-context-seeded")) {
      localStorage.setItem("lp-teacher-cycle", "cycle-6");
      sessionStorage.setItem("cycle-context-seeded", "yes");
    }
  });
  await page.goto(url);
  const reference = page.getByRole("combobox", { name: "Teaching cycle for reference", exact: true });
  await expect(reference).toHaveValue("");
  await expect(page.getByRole("button", { name: "Previous cycle", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next cycle", exact: true })).toBeDisabled();
  await expect(page.locator(".tcb-cycle-suggestion")).toContainText("Previously used on this device: Cycle 6");
  const launch = page.getByRole("button", { name: /Present full screen from slide/ });
  await expect(launch).toBeDisabled();
  await expect(page.getByRole("combobox", { name: "Teaching cycle", exact: true })).toHaveValue("");
  await expect(page.locator(".pr-preview-error")).toHaveCount(0);
  await page.getByRole("button", { name: "Use Cycle 6 for Audit Class A", exact: true }).click();
  await expect(reference).toHaveValue("cycle-6");
  await expect(launch).toBeEnabled();
  await expect(page.locator(".tcb-cycle-suggestion")).toHaveCount(0);
  await page.getByRole("button", { name: "Change", exact: true }).click();
  await expect(reference).toHaveValue("");
  await expect(launch).toBeDisabled();
  await expect(page.locator(".tcb-cycle-suggestion")).toHaveCount(0);
  await page.getByRole("button", { name: "Change", exact: true }).click();
  await expect(reference).toHaveValue("cycle-6");
  await expect(launch).toBeEnabled();
  await page.reload();
  await expect(reference).toHaveValue("cycle-6");
  expect(await page.evaluate(() => localStorage.getItem("lp-teacher-cycle"))).toBe("cycle-6");
});

test("invalid catalogue context stays unset in Present and Worksheets until a deliberate choice", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("lp-teacher-cycle", "cycle-80");
    localStorage.setItem("lp-teacher-class-cycles-v1", JSON.stringify({ "00000000-0000-4000-8000-0000000000f1:00000000-0000-4000-8000-0000000000a1": "cycle-80" }));
  });
  await page.goto(url);
  const reference = page.getByRole("combobox", { name: "Teaching cycle for reference", exact: true });
  await expect(reference).toHaveValue("");
  await expect(page.locator(".tcb-cycle-suggestion")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Present full screen from slide/ })).toBeDisabled();
  await page.getByRole("button", { name: "Open worksheets", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Teaching cycle", exact: true })).toHaveValue("");
  await expect(page.locator(".ws-cycle-context")).toContainText("Current class cycle: Not set");
  await expect(page.getByRole("button", { name: "Open print preview", exact: true })).toBeDisabled();
  await reference.selectOption("cycle-9");
  await expect(page.getByRole("combobox", { name: "Teaching cycle", exact: true })).toHaveValue("cycle-9");
  await expect(page.getByRole("button", { name: "Open print preview", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: ".artifacts/app-simplification/teacher/cycle-context-390.png", animations: "disabled" });
});
