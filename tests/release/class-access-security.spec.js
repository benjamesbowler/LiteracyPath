import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

async function logInTeacher(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the class-access security gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

test("A8.3 an abusive class-code burst produces a real device lockout", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Students: Literacy Guide Learning App" }).click();
  const input = page.getByRole("textbox", { name: "Class code" });
  await input.fill("ZZ9ZZ9");

  for (let attempt = 0; attempt < 11; attempt += 1) {
    await page.getByRole("button", { name: "Go", exact: true }).click();
    if (attempt < 10) {
      await expect(page.locator('[data-login-recovery="code-not-found"]')).toBeVisible();
    }
  }

  const lockout = page.locator('[data-login-recovery="rate-limited"]');
  await expect(lockout).toBeVisible();
  await expect(lockout).toContainText("Wait two minutes");
  await expect(input).toHaveValue("ZZ9ZZ9");
});

test("A8.3 teacher sees a privacy-minimal access log, alert, and optional expiry", async ({
  page
}) => {
  await logInTeacher(page);
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });

  const panel = page.getByLabel("Class sign-in code");
  await panel.getByRole("button", { name: "View access history", exact: true }).click();
  const history = page.getByRole("region", { name: "Class access history" });
  await expect(history).toBeVisible();
  await expect(history).toContainText("Abusive burst blocked");
  await expect(history).toContainText("Learner sign-in rejected");
  await expect(history).toContainText(
    "No child names, passwords, class codes, device IDs, or network addresses are stored here."
  );
  await expect(history.getByRole("listitem")).toHaveCount(3);

  const expiry = panel.getByLabel("Class code expiry");
  await expiry.selectOption("7");
  await expect(panel.getByRole("status")).toContainText("This code will expire");
  await expect(expiry.locator("option:checked")).toContainText("Expires");
  await expiry.selectOption("none");
  await expect(panel.getByRole("status")).toHaveText(
    "This code will not expire automatically."
  );
});
