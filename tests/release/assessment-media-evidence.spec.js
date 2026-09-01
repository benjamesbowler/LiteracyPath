import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

function blockingViolations(result) {
  return result.violations
    .filter(violation => ["serious", "critical"].includes(violation.impact))
    .map(violation => ({
      id: violation.id,
      targets: violation.nodes.map(node => node.target.join(" "))
    }));
}

async function expectGeneratedPictureQuestion(page, {
  itemId,
  prompt,
  skillId,
  words
}) {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  const expectedPaths = words
    .map(word => `/images/assessment/objective-words/${word}.webp`)
    .sort();

  for (const viewport of [
    { height: 768, width: 1024 },
    { height: 1024, width: 768 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(
      `/preview/assessment-media-evidence.html?skill=${skillId}&item=${encodeURIComponent(itemId)}`
    );

    const preview = page.locator('[data-preview-scenario="generated-v3-item"]');
    const question = page.locator(`[data-assessment-question-id="${itemId}"]`);
    const cards = question.locator(".visual-assessment-card");
    const images = cards.locator('img[data-assessment-media-kind="evidence"]');
    const audioButtons = cards.locator(".initial-sound-card-audio");

    await expect(preview).toBeVisible();
    await expect(question).toBeVisible();
    await expect(page.getByText(prompt, { exact: true })).toBeVisible();
    await expect(cards).toHaveCount(4);
    await expect(images).toHaveCount(4);
    await expect(audioButtons).toHaveCount(4);
    await expect(cards.locator("strong")).toHaveCount(0);
    for (const word of words) {
      await expect(page.getByRole("button", { name: `Hear ${word}`, exact: true })).toBeInViewport();
    }

    await expect.poll(async () => images.evaluateAll(elements => (
      elements.every(image => image.complete && image.naturalWidth === 768 && image.naturalHeight === 768)
    ))).toBe(true);
    const paths = await images.evaluateAll(elements => elements
      .map(image => new URL(image.src).pathname)
      .sort());
    expect(paths).toEqual(expectedPaths);

    const geometry = await question.evaluate(element => {
      const questionRect = element.getBoundingClientRect();
      const controls = [...element.querySelectorAll(".initial-sound-card-audio")]
        .map(control => control.getBoundingClientRect());
      const imageRects = [...element.querySelectorAll('img[data-assessment-media-kind="evidence"]')]
        .map(image => image.getBoundingClientRect());
      return {
        controlsInsideQuestion: controls.every(rect => (
          rect.top >= questionRect.top - 1
          && rect.bottom <= questionRect.bottom + 1
        )),
        documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        documentOverflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        imagesLargeEnough: imageRects.every(rect => rect.width >= 96 && rect.height >= 96),
        questionOverflowY: element.scrollHeight - element.clientHeight
      };
    });

    expect(geometry).toEqual({
      controlsInsideQuestion: true,
      documentOverflowX: 0,
      documentOverflowY: 0,
      imagesLargeEnough: true,
      questionOverflowY: 0
    });
  }

  expect(pageErrors).toEqual([]);
}

test("A3.10 failed answer evidence is removed, refilled, and never scored", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/preview/assessment-media-evidence.html");

  const preview = page.locator('[data-preview-surface="assessment-media-evidence"]');
  await expect(preview).toHaveAttribute("data-failure-count", "1");
  await expect(preview).toHaveAttribute(
    "data-round-question-ids",
    "replacement-picture-item,second-safe-picture-item"
  );
  await expect(
    page.locator('[data-assessment-question-id="replacement-picture-item"]')
  ).toBeVisible();
  await expect(page.getByText("Question 1 of 2", { exact: true })).toBeVisible();
  await expect(page.getByText(/Correct!|Let's learn from that one/)).toHaveCount(0);

  const evidenceImages = page.locator('img[data-assessment-media-kind="evidence"]');
  await expect(evidenceImages).toHaveCount(2);
  await expect(evidenceImages.nth(0)).toHaveAttribute("alt", "Picture of sun");
  await expect(evidenceImages.nth(1)).toHaveAttribute("alt", "A folded map");
  await expect(evidenceImages.nth(0)).toHaveAttribute("data-assessment-media-role", "choice");
  await expect.poll(async () => evidenceImages.evaluateAll(images => (
    images.every(image => image.complete && image.naturalWidth > 0)
  ))).toBe(true);

  const decoration = page.locator('[data-assessment-media-kind="decorative"]');
  await expect(decoration).toHaveCount(1);
  await expect(decoration).toHaveAttribute("aria-hidden", "true");

  const axe = await new AxeBuilder({ page })
    .include('[data-preview-surface="assessment-media-evidence"]')
    .analyze();
  expect(blockingViolations(axe)).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("iPad viewports keep the corrected tooth initial-sound evidence visible", async ({ page }) => {
  await expectGeneratedPictureQuestion(page, {
    itemId: "lp3.initial_sounds.l2.C.t.v3",
    prompt: "Which word has the same starting sound?",
    skillId: "initial_sounds",
    words: ["fan", "tie", "dog", "duck"]
  });
});

test("iPad viewports keep the corrected tooth digraph evidence visible", async ({ page }) => {
  await expectGeneratedPictureQuestion(page, {
    itemId: "lp3.digraphs.l2.C.ch.v3",
    prompt: "Which word has the same final sound?",
    skillId: "digraphs",
    words: ["watch", "wheel", "tooth", "clock"]
  });
});

test("locked skills assessment keeps the teacher notice inline and clear of iPad progress", async ({ page }) => {
  const viewports = [
    { height: 1024, width: 768 },
    { height: 768, width: 1024 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/preview/assessment-media-evidence.html?scenario=compact-visual-grid&locked=1");
    await page.evaluate(() => document.fonts.ready);

    const topbar = page.locator(".assessment-topbar");
    const notice = topbar.locator(".student-session-notice--inline");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("Skills Assessment");
    await expect(notice).toContainText("Your teacher has chosen this activity");

    const geometry = await page.evaluate(() => {
      const toRect = element => {
        const rect = element.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top
        };
      };
      const noticeElement = document.querySelector(".student-session-notice--inline");
      const progressElement = document.querySelector(".assessment-progress");
      const topbarElement = document.querySelector(".assessment-topbar");
      return {
        notice: toRect(noticeElement),
        noticePosition: getComputedStyle(noticeElement).position,
        progress: toRect(progressElement),
        topbar: toRect(topbarElement)
      };
    });
    const overlap = geometry.notice.left < geometry.progress.right
      && geometry.notice.right > geometry.progress.left
      && geometry.notice.top < geometry.progress.bottom
      && geometry.notice.bottom > geometry.progress.top;
    expect(geometry.noticePosition).toBe("static");
    expect(geometry.notice.top).toBeGreaterThanOrEqual(geometry.topbar.top - 0.5);
    expect(geometry.notice.bottom).toBeLessThanOrEqual(geometry.topbar.bottom + 0.5);
    expect(overlap).toBe(false);
  }
});

test("generated scene questions fit a compact laptop and load approved evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  const itemIds = [
    "lp3.sentence_comprehension.l1.A.picture_match.v1",
    "lp3.sentence_comprehension.l1.B.picture_match.v2",
    "lp3.sentence_comprehension.l1.C.picture_match.v3",
    "lp3.sentence_comprehension.l1.A.picture_match.v4",
    "lp3.sentence_comprehension.l1.B.picture_match.v5",
    "lp3.sentence_comprehension.l1.C.picture_match.v6",
    "lp3.sentence_comprehension.l1.A.picture_match.v7",
    "lp3.sentence_comprehension.l1.B.picture_match.v8",
    "lp3.sentence_comprehension.l1.R.picture_match.v9r",
    "lp3.sentence_comprehension.l1.R.picture_match.v10r"
  ];

  for (const itemId of itemIds) {
    await page.goto(`/preview/assessment-media-evidence.html?skill=sentence_comprehension&item=${encodeURIComponent(itemId)}`);
    const question = page.locator(`[data-assessment-question-id="${itemId}"]`);
    const image = question.locator('img[data-assessment-media-kind="evidence"]');
    await expect(question).toBeVisible();
    await expect(image).toHaveCount(1);
    await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);

    const geometry = await question.evaluate(element => ({
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      documentOverflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      inaccessibleBottomControls: [...element.querySelectorAll(".choice-audio")].some(control => {
        const rect = control.getBoundingClientRect();
        return rect.bottom > window.innerHeight || rect.top < 0;
      }),
      questionOverflowIsScrollable: element.scrollHeight <= element.clientHeight
        || ["auto", "scroll"].includes(getComputedStyle(element).overflowY)
    }));
    expect(geometry).toEqual({
      documentOverflowX: 0,
      documentOverflowY: 0,
      inaccessibleBottomControls: false,
      questionOverflowIsScrollable: true
    });
  }
});
