import { expect, test } from "@playwright/test";

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
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

async function openAmaraAssessmentHub(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Children", exact: true })
    .click();
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  const amaraRow = page.locator(".teacher-roster-table").getByRole("row").filter({ hasText: "Amara" });
  await amaraRow.getByRole("button", { name: "Open child", exact: true }).click();
  await page.getByRole("region", { name: "Child details: Amara" })
    .getByRole("button", { name: "Check Amara", exact: true })
    .click();
  await page.getByRole("article")
    .filter({ hasText: "EL formal check" })
    .getByRole("button", { name: "Open EL check", exact: true })
    .click();
  await expect(page.getByRole("heading", {
    name: "Choose a check for Amara",
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
    const finish = stickyBar.getByRole("button", { name: "Finish check", exact: true });
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
    const readyFinish = stickyBar.getByRole("button", { name: "Finish check", exact: true });
    await expect(readyFinish).toBeEnabled();
    await expectFullyInViewport(readyFinish);
    await readyFinish.click();
    const finishReview = page.getByRole("dialog", { name: "Check the tally before finishing" });
    await expect(finishReview).toContainText("8 scored · 0 skipped");
    await finishReview.getByRole("button", { name: "Confirm and finish", exact: true }).click();
    await expect(page.getByRole("heading", {
      name: "Choose a check for Amara",
      exact: true
    })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("article").filter({
      has: page.getByRole("heading", { name: "Word Encoding and Spelling", exact: true })
    })).toContainText("Completed");
  }
});
