import { expect, test } from "@playwright/test";
import { completeTeacherClassEntry } from "./support/teacherLanding.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

async function logInTeacher(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the class-access security gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page);
}

test("A8.3 an abusive class-code burst produces a real device lockout", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Children: Little Literacy Guides" }).click();
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
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Manage classes", exact: true }).click();
  await expect(page.getByRole("heading", {
    name: "Classes and groups",
    exact: true
  })).toBeVisible();
  const panel = page.locator(".teacher-site-settings");
  await panel.locator("select").first().selectOption({ label: "Audit Class A" });
  await panel.getByRole("button", { name: "See sign-in history", exact: true }).click();
  const history = page.getByRole("region", { name: "Class sign-in history" });
  await expect(history).toBeVisible();
  await expect(history).toContainText("Too many sign-in attempts");
  await expect(history).toContainText("Sign-in details were not accepted");
  await expect(history).toContainText(
    "No student names, passwords, class codes, device IDs, or network addresses are stored here."
  );
  const eventCount = await history.getByRole("listitem").count();
  expect(eventCount).toBeGreaterThanOrEqual(3);
  expect(eventCount).toBeLessThanOrEqual(20);

  const expiry = panel.getByRole("combobox", { name: "Code expires", exact: true });
  const saveStatus = page.locator(".teacher-inline-status");
  await expiry.selectOption("7");
  await expect(saveStatus).toHaveText("Class-code expiry saved.");
  await expect(expiry.locator("option:checked")).toHaveText(/^Stops working on /);
  await expiry.selectOption("0");
  await expect(saveStatus).toHaveText(
    "This class code will not expire automatically."
  );
  await expect(expiry).toHaveValue("0");
  await expect(expiry.locator("option:checked")).toHaveText("Never");
  await expect(expiry.locator("option:checked")).not.toContainText("Stops working on");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Classes and groups", exact: true })).toBeVisible({
    timeout: 20_000
  });
  const refreshedPanel = page.locator(".teacher-site-settings");
  await refreshedPanel.locator("select").first().selectOption({ label: "Audit Class A" });
  const refreshedExpiry = refreshedPanel.getByRole("combobox", {
    name: "Code expires",
    exact: true
  });
  await expect(refreshedExpiry).toHaveValue("0");
  await expect(refreshedExpiry.locator("option:checked")).toHaveText("Never");
});
