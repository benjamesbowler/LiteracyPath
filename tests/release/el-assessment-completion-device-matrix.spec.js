import { expect, test } from "@playwright/test";
import { completeTeacherClassEntry } from "./support/teacherLanding.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

const VIEWPORTS = Object.freeze([
  Object.freeze({ label: "laptop-1280x720", width: 1280, height: 720 }),
  Object.freeze({ label: "laptop-1366x768", width: 1366, height: 768 }),
  Object.freeze({ label: "ipad-landscape", width: 1024, height: 768 }),
  Object.freeze({ label: "ipad-portrait", width: 768, height: 1024 })
]);

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the EL assessment device gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page);
}

async function openAmaraAssessmentHub(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  const amaraRow = page.locator(".teacher-roster-table").getByRole("row").filter({ hasText: "Amara" });
  await amaraRow.getByRole("button", { name: "Open Amara", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Student details: Amara" })).toBeVisible();
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Assessments", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Assess a student", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2 · Assessment", exact: true })).toBeVisible();
}

async function startEncoding(page) {
  // Panel 2: which assessment. Panel 3: grade and time of year. Then Begin.
  await page.getByRole("button", { name: "Start Spelling", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Grade", exact: true })).toHaveValue("K");
  await expect(page.getByRole("combobox", { name: "Time of year", exact: true })).toHaveValue("BOY");
  await page.getByRole("button", { name: "Begin Spelling", exact: true }).click();
  // Starting somewhere the child's own results do not point at still needs a
  // recorded reason before it will run.
  const review = page.getByRole("region", { name: "One quick question before you start" });
  if (await review.count()) {
    await review.getByRole("button", { name: /Recent classroom work/ }).click();
    await review.getByRole("button", { name: "Begin Spelling", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Word Encoding and Spelling", exact: true })).toBeVisible();
}

async function expectFullyInViewport(locator) {
  await expect.poll(() => locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;
  })).toBe(true);
}

test("@el-assessment-completion-device-matrix completes an 8-item route with reachable placement and finish controls", async ({
  page
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize(VIEWPORTS[0]);
  await logIn(page);
  await openAmaraAssessmentHub(page);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await startEncoding(page);

    const stickyBar = page.locator(".el-benchmark-topbar");
    const finish = stickyBar.getByRole("button", { name: "Finish assessment", exact: true });
    await expect(finish).toBeVisible();
    await expect(finish).toBeDisabled();
    await expectFullyInViewport(stickyBar);

    for (let itemNumber = 1; itemNumber <= 8; itemNumber += 1) {
      await expect(page.getByRole("progressbar", {
        name: `${itemNumber - 1} of 8 items resolved`
      })).toBeVisible();
      await page.getByRole("button", { name: "Correct spelling", exact: true }).click();
      await expectFullyInViewport(stickyBar);
    }

    await expect(page.getByRole("progressbar", { name: "8 of 8 items resolved" })).toBeVisible();
    const choosePlacement = stickyBar.getByRole("button", {
      name: "Choose starting point",
      exact: true
    });
    await expect(choosePlacement).toBeEnabled();
    await expectFullyInViewport(choosePlacement);
    await choosePlacement.click();

    const placement = page.getByRole("region", { name: "Choose where to start next" });
    await expect(placement).toBeVisible();
    const acceptPlacement = placement.getByRole("button", {
      name: "Use this starting point",
      exact: true
    });
    await expectFullyInViewport(acceptPlacement);
    await expect(page).toHaveScreenshot(`el-assessment-completion-${viewport.label}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.01
    });

    await acceptPlacement.click();
    const readyFinish = stickyBar.getByRole("button", { name: "Finish assessment", exact: true });
    await expect(readyFinish).toBeEnabled();
    await expectFullyInViewport(readyFinish);
    await readyFinish.click();
    const finishReview = page.getByRole("dialog", { name: "Review the tally before finishing" });
    await expect(finishReview).toContainText("8 scored · 0 skipped");
    await finishReview.getByRole("button", { name: "Confirm and finish", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Assess a student", exact: true }))
      .toBeVisible({ timeout: 20_000 });
  }
});
