import { expect, test } from "@playwright/test";

const CLASS_ID = "00000000-0000-4000-8000-0000000000a1";
const STUDENT_ID = "maths-phase-zero-child";

function browserErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(`page: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

test("teacher can switch subjects and the Maths route survives reload, Back and Forward", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(
    `/preview/maths-phase-zero.html?audience=teacher#teacher/dashboard?class=${CLASS_ID}`
  );

  await expect(page.getByRole("group", { name: "Choose subject" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Literacy teacher home" })).toBeVisible();
  await page.getByRole("button", { name: "Maths" }).click();
  await expect(page.getByRole("heading", { name: "Maths teaching" })).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash).toBe(`#maths/teacher?class=${CLASS_ID}`);
  await expect(page.getByText("Every tool uses the same eight learning goals.")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Maths teaching" })).toBeVisible();

  await page.getByRole("button", { name: "Literacy" }).click();
  await expect(page.getByRole("heading", { name: "Literacy teacher home" })).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash).toBe(`#teacher/dashboard?class=${CLASS_ID}`);

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Maths teaching" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Literacy teacher home" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("learner can enter Maths and return to Literacy with durable subject history", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(
    `/preview/maths-phase-zero.html?audience=student#student/home?class=${CLASS_ID}&learner=${STUDENT_ID}`
  );

  await expect(page.locator('[data-child-surface="student-home"]')).toBeVisible();
  await page.getByRole("button", { name: "Maths" }).click();
  await expect(page.locator('[data-child-surface="maths-home"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ready to make sense of numbers/ })).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash)
    .toBe(`#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);

  await page.reload();
  await expect(page.locator('[data-child-surface="maths-home"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Literacy", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Literacy", exact: true }).click();
  await expect(page.locator('[data-child-surface="student-home"]')).toBeVisible();

  await page.goBack();
  await expect(page.locator('[data-child-surface="maths-home"]')).toBeVisible();
  await page.goForward();
  await expect(page.locator('[data-child-surface="student-home"]')).toBeVisible();
  expect(errors).toEqual([]);
});
