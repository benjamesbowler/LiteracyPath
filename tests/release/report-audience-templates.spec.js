import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const familyJargon = /\b(?:accuracy|administration|assessment|attempt|benchmark|confidence|currency|decoding|denominator|developing|evidence|fluency|grapheme|mastery|microphase|mixed evidence|needs teaching|phoneme|scoring|secure|status|version)\b/i;

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the report-audience gate.");
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

async function openAaravWholeChildReport(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  const aaravRow = page.locator(".teacher-roster-table").getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Open learner", exact: true }).click();
  await page.getByRole("region", { name: "Learner detail: Aarav" })
    .getByRole("button", { name: "Review Aarav’s progress", exact: true })
    .click();
  await page.getByRole("navigation", { name: "Progress tools" })
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Open Whole Child", exact: true })).toBeEnabled({
    timeout: 20_000
  });
  await page.getByRole("button", { name: "Open Whole Child", exact: true }).click();
}

test("@report-audience-templates renders teacher, leadership, and family views from Aarav's record", async ({
  page
}) => {
  await logIn(page);
  await openAaravWholeChildReport(page);

  const audiencePicker = page.getByRole("group", { name: "Choose report audience" });
  const teacher = audiencePicker.getByRole("button", { name: /Teacher diagnostic/ });
  const leadership = audiencePicker.getByRole("button", { name: /Class and leadership/ });
  const family = audiencePicker.getByRole("button", { name: /Family update/ });

  await expect(teacher).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Next teaching priorities", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Knowledge by literacy area", exact: true })).toBeVisible();

  await leadership.click();
  const leadershipTemplate = page.locator('[data-report-audience="class_leadership"]');
  await expect(leadership).toHaveAttribute("aria-pressed", "true");
  await expect(leadershipTemplate.getByRole("heading", {
    name: "Class and leadership summary",
    exact: true
  })).toBeVisible();
  await expect(leadershipTemplate.getByRole("heading", {
    name: "Literacy-area summary",
    exact: true
  })).toBeVisible();
  await expect(leadershipTemplate.getByRole("heading", {
    name: "Interpretation safeguards",
    exact: true
  })).toBeVisible();
  await expect(leadershipTemplate).toContainText("No public child rank is shown.");

  await family.click();
  const familyTemplate = page.locator('[data-report-audience="family_friendly"]');
  await expect(family).toHaveAttribute("aria-pressed", "true");
  await expect(familyTemplate.getByRole("heading", {
    name: "Aarav’s reading update",
    exact: true
  })).toBeVisible();
  for (const heading of [
    "What is going well",
    "What we are practising next",
    "How we can help together"
  ]) {
    await expect(familyTemplate.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Family reading update", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Report provenance" })).toHaveCount(0);
  const familyText = await page.locator(".lg-report-main").innerText();
  expect(familyText).not.toMatch(familyJargon);
  expect(familyText).not.toMatch(/[£$€¥]/u);
});
