import { expect, test } from "@playwright/test";

const CLASS_ID = "00000000-0000-4000-8000-0000000000a1";
const STUDENT_ID = "maths-phase-zero-child";
const studentUrl = `/preview/maths-phase-zero.html?audience=student#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`;

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth
  }))).toEqual({ body: 0, document: 0 });
}

async function openCheck(page, skillId, viewport = { width: 390, height: 844 }) {
  await page.setViewportSize(viewport);
  await page.goto("/preview/child-surfaces.html?surface=maths-check");
  await page.locator("#maths-check-skill").selectOption(skillId);
  await page.getByRole("button", { name: /Start the check/ }).click();
  await expect(page.locator(".maths-check-interaction")).toBeVisible();
}

async function advanceTo(page, { direction, selector }) {
  for (let index = 0; index < 6; index += 1) {
    const interaction = page.locator(".maths-check-interaction");
    if (await interaction.getAttribute("data-assessment-direction") === direction) {
      const target = page.locator(selector);
      await expect(target).toBeVisible({ timeout: 4_000 });
      return target;
    }
    await page.getByRole("button", { name: "Not sure yet" }).click();
    await page.getByRole("button", { name: /Next decision|Finish check/ }).click();
  }
  throw new Error(`No ${direction} item rendered with ${selector}`);
}

test("Skills Check renders each authored response direction as the claimed interaction", async ({ page }) => {
  await openCheck(page, "F-N-SEQ-20");
  const sequence = await advanceTo(page, { direction: "construction", selector: ".maths-sequence-constructor" });
  await expect(sequence.getByRole("button", { name: "Place this number in the gap" })).toBeDisabled();
  await sequence.getByRole("button", { name: "Move forward one" }).click();
  await expect(sequence.getByRole("button", { name: "Place this number in the gap" })).toBeEnabled();

  await openCheck(page, "F-N-SUBITISE-5");
  const reconstruction = await advanceTo(page, { direction: "construction", selector: ".maths-quick-quantity .maths-quantity-builder" });
  await expect(reconstruction.getByText("Build the amount you saw.")).toBeVisible();
  await reconstruction.getByRole("button", { name: "Add one" }).click();
  await expect(reconstruction.locator(".maths-picture-frame .is-filled")).toHaveCount(1);

  await openCheck(page, "F-N-COMPARE");
  const pairing = await advanceTo(page, { direction: "construction", selector: ".maths-pair-builder" });
  const progress = pairing.locator(".maths-pair-progress small");
  const pairTarget = Number((await progress.textContent()).match(/of (\d+)/)?.[1]);
  expect(pairTarget).toBeGreaterThan(0);
  for (let index = 0; index < pairTarget; index += 1) await pairing.getByRole("button", { name: /Pair next objects|Every possible pair is made/ }).click();
  await expect(pairing.locator(".maths-pair-decisions button")).toHaveCount(3);

  await openCheck(page, "F-N-PART-10", { width: 320, height: 568 });
  const recognition = await advanceTo(page, { direction: "recognition", selector: ".maths-answer-grid.is-frame-choice" });
  await expect(recognition.getByRole("button")).toHaveCount(3);
  await expect(page.locator(".maths-check-interaction .maths-quantity-builder")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("counter-tray construction has a visible tray, spaces and counters", async ({ page }) => {
  await openCheck(page, "F-N-MATCH", { width: 320, height: 568 });
  let tray = page.locator(".maths-builder-counter-tray");
  for (let index = 0; index < 6 && !(await tray.isVisible().catch(() => false)); index += 1) {
    await page.getByRole("button", { name: "Not sure yet" }).click();
    await page.getByRole("button", { name: /Next decision/ }).click();
    tray = page.locator(".maths-builder-counter-tray");
  }
  await expect(tray).toBeVisible();
  await expect(tray.locator("span")).toHaveCount(10);
  await page.getByRole("button", { name: "Add one" }).click();
  const counter = tray.locator("span.is-filled").first();
  await expect(counter).toBeVisible();
  const box = await counter.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(34);
  expect(box?.height).toBeGreaterThanOrEqual(30);
  await expect(counter).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expectNoHorizontalOverflow(page);
});

test("Guided Lesson surfaces graduated repair steps after an incomplete model", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=maths-lesson");
  const line = page.getByRole("radiogroup", { name: "Choose a number on the number line" });
  await line.getByRole("radio", { name: "1", exact: true }).click();
  await page.locator(".maths-stage-choices button").first().click();
  const repair = page.locator(".maths-lesson-repair");
  await expect(repair).toContainText("Point to the number immediately before");
  await repair.getByRole("button", { name: "Show another clue" }).click();
  await expect(repair).toContainText("Move one space and say the next number");
});

test("all Maths destinations and check decisions reset the child surface to the top", async ({ page }) => {
  test.setTimeout(120_000);
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    for (const [destination, surfaceId] of [["is-learn", "maths-lesson"], ["is-check", "maths-check"], ["is-story", "maths-stories"], ["is-arcade", "maths-arcade"]]) {
      await page.setViewportSize(viewport);
      await page.goto(studentUrl.replace("audience=student", `audience=student&visit=${viewport.width}-${destination}`));
      const home = page.locator('[data-child-surface="maths-home"]');
      await home.evaluate(element => { element.scrollTop = element.scrollHeight; });
      await page.locator(`.maths-destination.${destination}`).evaluate(element => element.click());
      const surface = page.locator(`[data-child-surface="${surfaceId}"]`);
      await expect(surface).toBeVisible();
      await expect.poll(() => surface.evaluate(element => element.scrollTop)).toBe(0);
      const firstVisible = surface.locator("h1").first();
      const box = await firstVisible.boundingBox();
      expect(box?.y).toBeGreaterThanOrEqual(0);
      expect(box?.y).toBeLessThan(viewport.height);
    }
  }

  await openCheck(page, "F-N-COUNT-10", { width: 320, height: 568 });
  const check = page.locator('[data-child-surface="maths-check"]');
  await check.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await page.getByRole("button", { name: "Not sure yet" }).click();
  await page.getByRole("button", { name: "Next decision" }).click();
  await expect.poll(() => check.evaluate(element => element.scrollTop)).toBe(0);
  await expect(page.locator(".maths-check-progress-v2")).toBeInViewport();
  await expect(page.locator(".maths-check-prompt")).toBeInViewport();
});
