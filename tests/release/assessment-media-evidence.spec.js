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

test("compact laptop assessment keeps every picture audio control visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  await page.goto("/preview/assessment-media-evidence.html?scenario=compact-visual-grid");

  const preview = page.locator('[data-preview-scenario="compact-visual-grid"]');
  const question = page.locator('[data-assessment-question-id="lp3.initial_sounds.l1.C.j.v3"]');
  const cards = question.locator(".visual-assessment-card");
  const audioButtons = cards.locator(".initial-sound-card-audio");

  await expect(preview).toBeVisible();
  await expect(question).toBeVisible();
  await expect(cards).toHaveCount(4);
  await expect(audioButtons).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Hear drum", exact: true })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Hear yarn", exact: true })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Hear mug", exact: true })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Hear jet", exact: true })).toBeInViewport();

  const geometry = await question.evaluate(element => {
    const grid = element.querySelector(".visual-card-grid");
    const questionRect = element.getBoundingClientRect();
    const columns = grid
      ? getComputedStyle(grid).gridTemplateColumns
        .split(" ")
        .filter(track => Number.parseFloat(track) > 1)
      : [];
    const controls = [...element.querySelectorAll(".initial-sound-card-audio")]
      .map(control => control.getBoundingClientRect());
    return {
      columns: columns.length,
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      documentOverflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      questionOverflowY: element.scrollHeight - element.clientHeight,
      controlsInsideQuestion: controls.every(rect => (
        rect.top >= questionRect.top - 1
        && rect.bottom <= questionRect.bottom + 1
      ))
    };
  });

  expect(geometry).toEqual({
    columns: 4,
    documentOverflowX: 0,
    documentOverflowY: 0,
    questionOverflowY: 0,
    controlsInsideQuestion: true
  });
});
