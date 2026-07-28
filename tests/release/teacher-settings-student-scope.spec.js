import { expect, test } from "@playwright/test";

test("teacher privacy controls never carry students across a class switch", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=settings");
  await page.getByRole("button", { name: "Student privacy", exact: true }).click();

  const main = page.getByRole("main");
  const classSelect = main.getByRole("combobox", { name: "Class", exact: true });
  const studentSelect = main.getByRole("combobox", { name: "Student", exact: true });

  await expect(classSelect).toHaveValue("00000000-0000-4000-8000-0000000000a1");
  for (const classAName of ["Aarav", "Aisha", "Camila"]) {
    await expect(studentSelect.locator("option", { hasText: classAName })).toHaveCount(1);
  }
  await expect(studentSelect.locator("option", { hasText: "Diego" })).toHaveCount(0);

  await classSelect.selectOption("00000000-0000-4000-8000-0000000000b2");

  await expect(studentSelect).toHaveValue("");
  await expect(studentSelect.locator("option", { hasText: "Diego" })).toHaveCount(1);
  for (const oldName of ["Aarav", "Aisha", "Camila"]) {
    await expect(studentSelect.locator("option", { hasText: oldName })).toHaveCount(0);
  }
});
