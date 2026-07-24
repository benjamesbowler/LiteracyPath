import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the EL assessment route gate.");
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

async function openAmaraAssessmentHub(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  const amaraRow = page.locator(".teacher-roster-table").getByRole("row").filter({ hasText: "Amara" });
  await amaraRow.getByRole("button", { name: "Open learner", exact: true }).click();
  await page.getByRole("region", { name: "Learner detail: Amara" })
    .getByRole("button", { name: "Assess Amara", exact: true })
    .click();
  await page.getByRole("region", { name: "Assessment hub tools" })
    .getByRole("article")
    .filter({ hasText: "Progress monitoring" })
    .getByRole("button", { name: "Open", exact: true })
    .click();
  await expect(page.getByRole("heading", {
    name: "Choose a comparable assessment for Amara",
    exact: true
  })).toBeVisible();
}

async function startEncoding(page) {
  const encodingCard = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Word Encoding and Spelling", exact: true })
  });
  const directStart = encodingCard.getByRole("button", { name: "Start spelling", exact: true });
  if (await directStart.count()) {
    await directStart.click();
  } else {
    await encodingCard.getByRole("button", { name: "Check & start spelling", exact: true }).click();
    const review = page.getByRole("region", { name: "One quick check before starting" });
    await review.getByRole("button", { name: /Recent classroom work/ }).click();
    await review.getByRole("button", { name: "Start Encoding", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Word Encoding and Spelling", exact: true })).toBeVisible();
}

async function acceptPlacement(page) {
  const stickyBar = page.locator(".el-benchmark-topbar");
  await stickyBar.getByRole("button", { name: "Choose starting point", exact: true }).click();
  await page.getByRole("region", { name: "Choose where to start next" })
    .getByRole("button", { name: "Use this starting point", exact: true })
    .click();
}

test("@el-assessment-route-resume @el-assessment-final-review restores the item and confirms a corrected final tap", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await logIn(page);
  await openAmaraAssessmentHub(page);
  await startEncoding(page);

  await expect(page).toHaveURL(/#teacher\/assess\/el-benchmark\?.*assessment=el_encoding.*item=1/);
  for (let itemNumber = 1; itemNumber <= 3; itemNumber += 1) {
    await page.getByRole("button", { name: "Correct spelling", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Item 4 of 8", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#teacher\/assess\/el-benchmark\?.*item=4/);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Word Encoding and Spelling", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("heading", { name: "Item 4 of 8", exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "3 of 8 items resolved" })).toBeVisible();
  await expect(page).toHaveURL(/#teacher\/assess\/el-benchmark\?.*item=4/);

  for (let itemNumber = 4; itemNumber <= 7; itemNumber += 1) {
    await page.getByRole("button", { name: "Correct spelling", exact: true }).click();
  }
  await page.getByRole("button", { name: "Not yet", exact: true }).click();
  await acceptPlacement(page);

  await page.locator(".el-benchmark-topbar")
    .getByRole("button", { name: "Finish assessment", exact: true })
    .click();
  let finishReview = page.getByRole("dialog", { name: "Check the tally before finishing" });
  await expect(finishReview).toContainText("8 scored · 0 skipped");
  await finishReview.getByRole("button", { name: "Change final answer", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Item 8 of 8", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Correct spelling", exact: true }).click();

  await acceptPlacement(page);
  await page.locator(".el-benchmark-topbar")
    .getByRole("button", { name: "Finish assessment", exact: true })
    .click();
  finishReview = page.getByRole("dialog", { name: "Check the tally before finishing" });
  await expect(finishReview).toContainText("8 scored · 0 skipped");
  await finishReview.getByRole("button", { name: "Confirm and finish", exact: true }).click();

  await expect(page.getByRole("heading", {
    name: "Choose a comparable assessment for Amara",
    exact: true
  })).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/#teacher\/assess\?/);
  await expect(page).not.toHaveURL(/el-benchmark/);
});
