import { expect, test } from "@playwright/test";

const CLASS_ID = "00000000-0000-4000-8000-0000000000a1";
const STUDENT_ID = "maths-phase-zero-child";

const teacherUrl = `/preview/maths-phase-zero.html?audience=teacher#maths/teacher?class=${CLASS_ID}`;
const studentUrl = `/preview/maths-phase-zero.html?audience=student#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`;
const mathsSurfaceIds = ["maths-home", "maths-lesson", "maths-check", "maths-stories", "maths-arcade"];
const mathsViewportMatrix = [
  { id: "small-phone-portrait", width: 320, height: 568 },
  { id: "small-phone-landscape", width: 568, height: 320 },
  { id: "tablet-portrait", width: 768, height: 1024 },
  { id: "tablet-landscape", width: 1024, height: 768 },
  { id: "chromebook", width: 1366, height: 768 },
  { id: "projector", width: 1920, height: 1080 }
];

function browserErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  return errors;
}

async function expectMathsViewportIntegrity(page, state, root) {
  await expect.poll(() => page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth
  })), `${state} must not overflow horizontally`).toEqual({ body: 0, document: 0 });
  const controls = root.locator("button:not([disabled]), a[href], select:not([disabled]), summary");
  await expect.poll(() => controls.evaluateAll(elements => elements
    .filter(element => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    })
    .map(element => {
      const box = element.getBoundingClientRect();
      return { name: element.getAttribute("aria-label") || element.textContent.trim(), width: box.width, height: box.height };
    })
    .filter(control => control.width < 44 || control.height < 44)), `${state} keeps enabled controls at least 44px`).toEqual([]);
}

test("Every Maths surface fits the full release viewport matrix", async ({ page }) => {
  test.setTimeout(150_000);
  for (const viewport of mathsViewportMatrix) {
    await page.setViewportSize(viewport);
    for (const surfaceId of mathsSurfaceIds) {
      await page.goto(`/preview/child-surfaces.html?surface=${surfaceId}`);
      const surface = page.locator(`[data-child-surface="${surfaceId}"]`);
      await expect(surface).toBeVisible();
      await expectMathsViewportIntegrity(page, `${surfaceId} at ${viewport.id}`, surface);
    }
    await page.goto(teacherUrl);
    const teacher = page.locator('[data-maths-preview="teacher"]');
    await expect(teacher).toBeVisible();
    await expect.poll(() => page.evaluate(() => ({
      body: document.body.scrollWidth - window.innerWidth,
      document: document.documentElement.scrollWidth - window.innerWidth
    })), `Maths teacher workspace at ${viewport.id} must not overflow horizontally`).toEqual({ body: 0, document: 0 });
  }
});

test("Maths teacher tools expose seeded presentation, real worksheet visuals, reports and assignment management", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(teacherUrl);

  const teacherNav = page.getByTestId("teacher-primary-nav");
  await teacherNav.getByRole("button", { name: "Present", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maths presentation" })).toBeVisible();
  await expect(page.locator('.maths-frame-cell[aria-pressed="true"]')).toHaveCount(5);
  await expect(page.getByText("How many did you see?")).toBeVisible();
  await page.getByRole("button", { name: "Flash picture" }).click();
  await expect(page.getByText("Look now")).toBeVisible();
  await expect(page.locator(".maths-flash-cover")).toHaveCount(0);
  await page.waitForTimeout(1700);
  await expect(page.locator(".maths-flash-cover")).toHaveCount(1);

  await teacherNav.getByRole("button", { name: "Worksheets", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maths worksheet studio" })).toBeVisible();
  await expect(page.locator(".maths-print-frame")).toHaveCount(8);
  await page.getByLabel("Learning goal").selectOption("F-N-MATCH");
  await page.getByLabel("Template").selectOption("match");
  await expect(page.locator(".maths-print-dot-match")).toHaveCount(8);
  await expect(page.getByText("Teacher answer guide · Core · Version A")).toBeVisible();

  await teacherNav.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maths reports" })).toBeVisible();
  await expect(teacherNav.getByRole("button", { name: "Reports", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(teacherNav.getByRole("button", { name: "Present", exact: true })).not.toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Evidence sync:")).toBeVisible();
  await expect(page.getByText("7 of 12 learners with evidence")).toBeVisible();

  await teacherNav.getByRole("button", { name: "Resources", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maths resources" })).toBeVisible();
  await expect(page.getByText("Active assignments")).toBeVisible();
  await expect(page.getByText("5 of 12 complete")).toBeVisible();
  await page.getByRole("button", { name: "Chants and games" }).click();
  const performedSong = page.locator('.maths-song-player audio[src*="step-and-count-to-twenty-performed.mp3"]');
  await expect(performedSong).toHaveCount(1);
  await expect(performedSong.locator('track[kind="captions"]')).toHaveAttribute("src", /step-and-count-to-twenty-lyrics\.vtt$/);
  await expect(page.getByText("Complete vocal performance").first()).toBeVisible();
  await page.getByRole("button", { name: "Play full song with vocals" }).first().click();
  await expect.poll(() => performedSong.evaluate(element => element.currentTime)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Restart" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Flag full song" }).first()).toBeVisible();
  await expect(page.getByText("Lyrics", { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Maths student lesson gates progress on an action and real Leda audio can start", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(studentUrl);
  await page.getByRole("button", { name: /Continue lesson/ }).click();
  const next = page.getByRole("button", { name: "Use the model and choose a note" });
  await expect(next).toBeDisabled();
  const retrieveThinking = page.getByRole("group", { name: "Show your retrieve thinking" });
  await retrieveThinking.getByRole("button").first().click();
  await expect(page.getByRole("button", { name: "Use the model and choose a note" })).toBeDisabled();
  const cells = page.getByRole("group", { name: "Ten frame spaces" }).getByRole("button");
  for (let index = 0; index < 5; index += 1) await cells.nth(index).click();
  await page.getByRole("button", { name: "Part B, dotted" }).click();
  for (let index = 5; index < 10; index += 1) await cells.nth(index).click();
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
  await page.getByRole("button", { name: "Start the check" }).click();
  await expect(page.locator(".maths-quick-quantity")).toBeVisible();
  await page.waitForTimeout(1700);
  await expect(page.getByText("Picture hidden")).toBeVisible();

  await page.goto(`/preview/maths-phase-zero.html?audience=student&check=match#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
  await page.getByRole("button", { name: /Skills check/ }).click();
  await page.getByLabel("Learning goal").selectOption("F-N-MATCH");
  await page.getByRole("button", { name: "Start the check" }).click();
  await expect(page.getByRole("button", { name: "Add one" })).toBeVisible();
  await page.getByRole("button", { name: "Add one" }).click();
  await expect(page.getByRole("button", { name: "Use this model" })).toBeVisible();
  await page.getByRole("button", { name: "Use a non-visual description" }).count().then(count => expect(count).toBe(0));
  expect(errors).toEqual([]);
});

test("Maths number stories combine exact page audio, a countable model, talk prompt and Family Bridge", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(studentUrl);
  await page.getByRole("button", { name: /Number stories/ }).click();
  await page.getByRole("button", { name: /Five Buns for the Picnic/ }).click();
  await expect(page.getByText("Cuddly packs exactly five buns for the meadow picnic.")).toBeVisible();
  await expect(page.locator('.maths-story-text audio[src*="maths_story_page"]')).toHaveCount(1);
  await expect(page.locator('.maths-story-page-visual img[src$="page-01.webp"]')).toHaveJSProperty("naturalWidth", 1200);
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

test("Maths Arcade exposes five direct-manipulation mechanics with no timer or speed score", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto(studentUrl);
  await page.getByRole("button", { name: /Maths Arcade/ }).click();
  await expect(page.getByText("Five different game worlds")).toBeVisible();

  const expectations = [
    ["number-trail", ".maths-number-trail-world"],
    ["glimpse-garden", ".maths-glimpse-garden"],
    ["frame-foundry", ".maths-foundry-machine"],
    ["count-and-carry", ".maths-count-strategy"],
    ["quantity-match", ".maths-bridge-world"]
  ];
  for (const [gameId, selector] of expectations) {
    await page.goto(`/preview/maths-phase-zero.html?audience=student&game=${gameId}#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
    await page.getByRole("button", { name: /Maths Arcade/ }).click();
    await page.locator(`[data-game="${gameId}"]`).click();
    await expect(page.locator(selector)).toBeVisible();
  }
  await page.goto(`/preview/maths-phase-zero.html?audience=student&game=number-trail#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
  await page.getByRole("button", { name: /Maths Arcade/ }).click();
  await page.locator('[data-game="number-trail"]').click();
  await expect(page.locator(".maths-trail-sequence .is-gap")).toContainText("Missing");
  const trailChoices = page.getByRole("group", { name: "Walk onto a stepping stone for the missing number" });
  await expect(trailChoices.getByRole("button")).toHaveCount(3);
  await expect(page.getByText("Count along the path. Tap the stone that fits the gap.")).toBeVisible();
  await page.goto(`/preview/maths-phase-zero.html?audience=student&game=glimpse-garden#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
  await page.getByRole("button", { name: /Maths Arcade/ }).click();
  await page.locator('[data-game="glimpse-garden"]').click();
  await page.getByRole("button", { name: "Open the garden gate" }).click();
  await expect(page.getByRole("img", { name: /glowbugs arranged as/ })).toBeVisible();
  await page.getByRole("button", { name: "Keep it open so I can count" }).click();
  await expect(page.getByRole("group", { name: "Choose the number of glowbugs" })).toBeVisible();
  await page.goto(`/preview/maths-phase-zero.html?audience=student&game=count-and-carry#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
  await page.getByRole("button", { name: /Maths Arcade/ }).click();
  await page.locator('[data-game="count-and-carry"]').click();
  await page.getByRole("button", { name: /Move each parcel once|Make ten, then count on|Make a clear row/ }).first().click();
  await expect(page.locator(".maths-carry-landscape")).toBeVisible();
  await expect(page.getByRole("group", { name: "Choose how many parcels are in the collection" })).toHaveCount(0);
  const parcelButtons = page.locator('.maths-parcel-meadow button');
  const parcelsToMove = await parcelButtons.count();
  for (let index = 0; index < parcelsToMove; index += 1) await parcelButtons.nth(index).click();
  const parcelAnswers = page.getByRole("group", { name: "Choose how many parcels are in the collection" });
  await expect(parcelAnswers).toBeVisible();
  await expect(parcelAnswers.getByRole("button")).toHaveCount(3);
  await expect(page.locator("[data-timer], .timer, .speed-score")).toHaveCount(0);
  expect(errors).toEqual([]);
});
