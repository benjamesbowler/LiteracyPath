import { expect, test } from "@playwright/test";

const CLASS_ID = "00000000-0000-4000-8000-0000000000a1";
const STUDENT_ID = "maths-phase-zero-child";

const teacherUrl = `/preview/maths-phase-zero.html?audience=teacher#maths/teacher?class=${CLASS_ID}`;
const studentUrl = `/preview/maths-phase-zero.html?audience=student#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`;

function browserErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  return errors;
}

test("Maths teacher tools expose seeded presentation, real worksheet visuals, reports and assignment management", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(teacherUrl);

  const teacherNav = page.getByTestId("teacher-primary-nav");
  await teacherNav.getByRole("button", { name: "Present", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maths presentation" })).toBeVisible();
  await expect(page.locator('.maths-frame-cell[aria-pressed="true"]')).toHaveCount(5);
  await expect(page.getByText("How many did you see?")).toBeVisible();
  await page.getByRole("button", { name: "Flash for 1.5 seconds" }).click();
  await expect(page.getByText("Look now")).toBeVisible();
  await expect(page.locator(".maths-flash-cover")).toHaveCount(0);
  await page.waitForTimeout(1700);
  await expect(page.locator(".maths-flash-cover")).toHaveCount(1);

  await teacherNav.getByRole("button", { name: "Worksheets", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maths worksheet studio" })).toBeVisible();
  await expect(page.locator(".maths-print-frame")).toHaveCount(8);
  await page.getByLabel("Template").selectOption("match");
  await expect(page.locator(".maths-print-dot-match")).toHaveCount(8);
  await expect(page.getByText("Teacher answer guide · Version A")).toBeVisible();

  await teacherNav.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maths reports" })).toBeVisible();
  await expect(teacherNav.getByRole("button", { name: "Reports", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(teacherNav.getByRole("button", { name: "Present", exact: true })).not.toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Evidence sync:")).toBeVisible();
  await expect(page.getByText("7 of 12 learners checked")).toBeVisible();

  await teacherNav.getByRole("button", { name: "Resources", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maths resources" })).toBeVisible();
  await expect(page.getByText("Active assignments")).toBeVisible();
  await expect(page.getByText("5 of 12 complete")).toBeVisible();
  const instrumental = page.locator('.maths-song-player audio[src*="instrumental.mp3"]').first();
  await page.getByRole("button", { name: "Play instrumental" }).first().click();
  await expect.poll(() => instrumental.evaluate(element => element.currentTime)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Flag instrumental" }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Maths student lesson gates progress on an action and real Leda audio can start", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(studentUrl);
  await page.getByRole("button", { name: /Maths lessons/ }).click();
  const next = page.getByRole("button", { name: "Complete this step" });
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "I touched each one once" }).click();
  await expect(page.getByRole("button", { name: "Next: notice" })).toBeEnabled();

  const audio = page.locator(".maths-audio-control audio").first();
  await expect(audio).toHaveAttribute("src", /maths_instruction\/.*\.mp3$/);
  await page.getByRole("button", { name: "Hear this" }).first().click();
  await expect.poll(() => audio.evaluate(element => element.currentTime)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Flag audio" }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Maths skills checks render, mask quick quantities and use a genuine model builder", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(studentUrl);
  await page.getByRole("button", { name: /Skills check/ }).click();

  await page.getByLabel("Learning goal").selectOption("F-N-SUBITISE-5");
  await expect(page.locator(".maths-quick-quantity")).toBeVisible();
  await page.waitForTimeout(1700);
  await expect(page.getByText("Picture hidden")).toBeVisible();

  await page.getByLabel("Learning goal").selectOption("F-N-MATCH");
  await expect(page.getByRole("button", { name: "Add one" })).toBeVisible();
  await page.getByRole("button", { name: "Add one" }).click();
  await expect(page.getByRole("button", { name: "Check my model" })).toBeVisible();
  await page.getByRole("button", { name: "Use a non-visual description" }).count().then(count => expect(count).toBe(0));
  expect(errors).toEqual([]);
});

test("Maths number stories combine exact page audio, a countable model, talk prompt and Family Bridge", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(studentUrl);
  await page.getByRole("button", { name: /Number stories/ }).click();
  await page.getByRole("button", { name: /Five Buns for the Picnic/ }).click();
  await expect(page.getByText("Cuddly carries five buns to the picnic.")).toBeVisible();
  await expect(page.locator('.maths-story-text audio[src*="maths_story_page"]')).toHaveCount(1);
  await expect(page.locator('.maths-story-scene [role="img"]')).toBeVisible();
  await expect(page.getByText("Talk together")).toBeVisible();
  for (let pageNumber = 1; pageNumber < 8; pageNumber += 1) {
    await page.getByRole("button", { name: "Next page" }).click();
  }
  await page.getByRole("button", { name: "Finish story" }).click();
  await expect(page.getByText("Try it at home")).toBeVisible();
  await expect(page.getByText("No family account, child photo or child recording is needed.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Maths Arcade exposes four distinct mechanics with no timer or speed score", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(studentUrl);
  await page.getByRole("button", { name: /Maths Arcade/ }).click();
  await expect(page.getByText("4 untimed games")).toBeVisible();

  const expectations = [
    ["number-trail", ".maths-number-trail-game"],
    ["frame-foundry", ".maths-quantity-builder"],
    ["count-and-carry", ".maths-carry-game"],
    ["quantity-match", ".maths-frame-match, .maths-compare-game"]
  ];
  for (const [gameId, selector] of expectations) {
    await page.goto(`/preview/maths-phase-zero.html?audience=student&game=${gameId}#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
    await page.getByRole("button", { name: /Maths Arcade/ }).click();
    await page.locator(`[data-game="${gameId}"]`).click();
    await expect(page.locator(selector)).toBeVisible();
  }
  await expect(page.getByText(/timer|speed score/i)).toHaveCount(0);
  expect(errors).toEqual([]);
});
