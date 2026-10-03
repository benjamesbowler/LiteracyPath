import { expect, test } from "@playwright/test";

import { STUDENT_DEVICE_PROFILES, STUDENT_MINIMUM_TARGET_PX } from "../../src/policy/studentDeviceMatrix.js";
import { LETTER_PRACTICE_VERSION, LETTER_PRACTICE_ROUND_COUNT } from "../../src/policy/letterPractice.js";

const PROFILES = [
  ...STUDENT_DEVICE_PROFILES,
  { id: "ipad-browser-chrome", width: 1024, height: 650 },
  { id: "wide-review", width: 2560, height: 1080 }
];

async function outlineClipping(card) {
  return card.evaluate(element => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const scaleX = box.width / element.offsetWidth;
    const scaleY = box.height / element.offsetHeight;
    const ring = style.outlineStyle === "none" ? 0
      : Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
    const painted = {
      left: box.left - ring * scaleX,
      right: box.right + ring * scaleX,
      top: box.top - ring * scaleY,
      bottom: box.bottom + ring * scaleY
    };
    const failures = [];
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const clip = ancestor.getBoundingClientRect();
      const css = getComputedStyle(ancestor);
      const xClips = /hidden|clip|auto|scroll/.test(css.overflowX);
      const yClips = /hidden|clip|auto|scroll/.test(css.overflowY);
      if ((xClips && (painted.left < clip.left - 1 || painted.right > clip.right + 1))
        || (yClips && (painted.top < clip.top - 1 || painted.bottom > clip.bottom + 1))) {
        failures.push({ ancestor: ancestor.className, painted, clip: clip.toJSON() });
      }
    }
    return failures;
  });
}

async function headerGeometry(page) {
  return page.locator(".kg-header").evaluate(element => {
    const box = element.getBoundingClientRect();
    const profile = element.querySelector(".kg-profile").getBoundingClientRect();
    const notice = element.querySelector(".student-session-notice--header");
    const message = notice.getBoundingClientRect();
    return {
      separated: profile.right <= message.left,
      contained: message.top >= box.top && message.bottom <= box.bottom
        && message.right <= box.right,
      textFits: notice.scrollWidth <= notice.clientWidth + 1
        && notice.scrollHeight <= notice.clientHeight + 1
    };
  });
}

for (const profile of PROFILES) {
  for (const locked of [false, true]) {
    const mode = locked ? "teacher-assigned" : "independent";
    test(`Letters keep edge outlines and controls visible: ${mode}, ${profile.id}`, async ({ page }, testInfo) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: profile.width, height: profile.height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`/preview/child-surfaces.html?surface=phonics${locked ? "&lockedLetters=1" : ""}`);
      const current = page.locator(".phonics-alphabet-picker");
      await expect(current).toBeVisible();
      await expect(page.locator(".phonics-alphabet-progress")).toContainText("0 of 26 letters");
      const cards = page.getByRole("group", { name: "All 26 letters" }).locator("button");
      await expect(cards).toHaveCount(26);
      if (locked) {
        await expect(page.locator(".student-session-notice")).toContainText("Letters Practice");
        await expect(page.locator(".kg-tabbar")).toHaveCount(0);
        const header = await headerGeometry(page);
        expect(header).toEqual({ separated: true, contained: true, textFits: true });
      }

      // Check actual paint bounds: button boxes alone miss the reported gold
      // recommendation ring and keyboard focus ring outside the left edge.
      await expect.poll(() => outlineClipping(cards.first())).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath("letters-inset.png") });
      const compact = profile.width < 768;
      if (!compact) {
        const layout = await page.evaluate(() => {
          const main = document.querySelector(".kg-main").getBoundingClientRect();
          const items = [...document.querySelectorAll(".phonics-letter-card, .phonics-alphabet-progress")];
          return items.filter(element => {
            const box = element.getBoundingClientRect();
            return box.top < main.top - 1 || box.bottom > main.bottom + 1;
          }).map(element => element.textContent);
        });
        expect(layout).toEqual([]);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

      // Every deliberate alphabet page retains physical targets and complete
      // keyboard focus painting, including the first and last outside cards.
      const seen = new Set();
      for (let alphabetPage = 0; alphabetPage < 1; alphabetPage += 1) {
        for (const card of await cards.all()) {
          await card.scrollIntoViewIfNeeded();
          await card.focus();
          await expect(card).toBeFocused();
          seen.add((await card.getAttribute("aria-label")).match(/^Letter ([A-Z])/)[1]);
          await expect.poll(() => outlineClipping(card), { message: `${mode} ${profile.id}: alphabet page ${alphabetPage + 1}` }).toEqual([]);
          const box = await card.boundingBox();
          expect(box.width).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX - 0.1);
          expect(box.height).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX - 0.1);
        }
      }
      expect(seen.size).toBe(26);

      await cards.first().scrollIntoViewIfNeeded();
      await cards.first().focus();
      await page.screenshot({ path: testInfo.outputPath("letters-focus.png") });
      await testInfo.attach("Letters focus and inset", {
        path: testInfo.outputPath("letters-focus.png"), contentType: "image/png"
      });
      await cards.first().press("Enter");
      await expect(page.locator(".phonics-trace-pad")).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}

test("hovering outside letters preserves the complete alphabet and focus ring", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/preview/child-surfaces.html?surface=phonics&lockedLetters=1");

  const cards = page.getByRole("group", { name: "All 26 letters" }).locator("button");
  for (let alphabetPage = 0; alphabetPage < 1; alphabetPage += 1) {
    for (const index of [0, (await cards.count()) - 1]) {
      const card = cards.nth(index); await card.focus(); await card.hover();
      await expect.poll(() => card.evaluate(element => {
        const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform);
        return { scale: Math.round(transform.a * 100), lift: Math.round(transform.m42) };
      })).toEqual({ scale: 100, lift: 0 });
      expect(await outlineClipping(card)).toEqual([]);
    }
  }

});

test("saved progress marks right-edge letters Try again without clipping", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/child-surfaces.html?surface=phonics&lockedLetters=1");
  for (const letter of ["I", "R", "Z"]) {
    const completed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").slice(0, letter.charCodeAt(0) - 65);
    const records = Object.fromEntries(completed.map(value => [value, {
      v: 3, status: "completed",
      completions: Array.from({ length: LETTER_PRACTICE_ROUND_COUNT }, (_, index) => ({
        id: `layout-${value}-${index + 1}`,
        contentVersion: LETTER_PRACTICE_VERSION,
        completedAt: "2026-09-18T12:00:00Z",
        steps: [1, 2, 3].map(practiceStep => ({ practiceRound: index + 1, practiceStep }))
      }))
    }]));
    await page.evaluate(({ records, letter }) => {
      localStorage.setItem("lp_phonics_progress_child-surface-preview", JSON.stringify({
        ...records,
        [letter]: "inprogress"
      }));
      dispatchEvent(new CustomEvent("lp-progress-hydrated", {
        detail: { studentId: "child-surface-preview" }
      }));
    }, { records, letter });
    const card = page.getByRole("button", { name: `Letter ${letter}, Try again`, exact: true });
    await expect(card).toBeVisible();
    expect(await outlineClipping(card)).toEqual([]);
    await expect(page.locator(".phonics-alphabet-progress")).toContainText(`${completed.length} of 26 letters`);
  }
  await page.screenshot({ path: testInfo.outputPath("letters-resumed-z.png") });
});

test("assigned reading and map notices stay separate from the child profile on phones", async ({ page }) => {
  test.setTimeout(60_000);
  for (const viewport of [{ width: 320, height: 568 }, { width: 420, height: 844 }, { width: 568, height: 320 }]) {
    await page.setViewportSize(viewport);
    for (const path of [
      "/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees&locked=1",
      "/preview/child-surfaces.html?surface=adventure-map&lockedCycle=cycle-14"
    ]) {
      await page.goto(path);
      await expect(page.locator(".student-session-notice--header")).toBeVisible();
      expect(await headerGeometry(page), `${path} at ${viewport.width}x${viewport.height}`)
        .toEqual({ separated: true, contained: true, textFits: true });
    }
  }
});
