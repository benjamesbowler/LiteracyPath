import { expect, test } from "@playwright/test";

test.use({ hasTouch: true });

async function drift(page, control, { cancel = false, outside = false } = {}) {
  await control.click({ trial: true });
  const bounds = await control.boundingBox();
  const client = await page.context().newCDPSession(page);
  const point = { x: bounds.x + bounds.width / 2 - 7, y: bounds.y + bounds.height / 2 - 7 };
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: outside ? bounds.x - 20 : point.x + 14, y: point.y + 14 }]
  });
  await client.send("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
  await client.detach();
}

for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
test(`assessment acknowledges a held save and promptly opens the next item at ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
  await page.setViewportSize(viewport);
  let releaseSave;
  const heldSave = new Promise(resolve => { releaseSave = resolve; });
  let saveRequests = 0;
  await page.route("**/__preview_assessment_answer__", async route => {
    saveRequests += 1;
    await heldSave;
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/preview/assessment-media-evidence.html?scenario=response-latency");
  const preview = page.locator('[data-preview-surface="assessment-media-evidence"]');
  const current = page.locator('[data-assessment-question-id="replacement-picture-item"]');
  await expect(current).toBeVisible();
  await expect.poll(() => current.locator("img").evaluateAll(images => (
    images.every(image => image.complete && image.naturalWidth > 0)
  ))).toBe(true);

  await current.getByRole("button", { name: "Picture of sun sun", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saving answer…", { timeout: 300 });
  await expect(current).toHaveAttribute("inert", "");
  await expect(current).toHaveAttribute("aria-busy", "true");
  await expect(preview).toHaveAttribute("data-answer-count", "0");
  // The saving state must keep the exact item available and announce no key.
  await expect(current).toBeVisible();
  await expect(page.getByText("Answer saved", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Correct", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Incorrect", { exact: true })).toHaveCount(0);
  const bounds = await page.getByRole("status").boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  await page.screenshot({ path: testInfo.outputPath("assessment-saving.png") });

  releaseSave();
  await expect(preview).toHaveAttribute("data-answer-count", "1");
  await expect(page.locator('[data-assessment-question-id="second-safe-picture-item"]'))
    .toBeVisible({ timeout: 750 });
  expect(saveRequests).toBe(1);
  expect(errors).toEqual([]);
});
}

test("assessment accepts small finger drift once and rejects cancelled or outside releases", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Trusted moved touch uses the Chromium input protocol.");
  await page.setViewportSize({ width: 1024, height: 768 });
  let saves = 0;
  await page.route("**/__preview_assessment_answer__", route => {
    saves += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto("/preview/assessment-media-evidence.html?scenario=response-latency");
  const preview = page.locator('[data-preview-surface="assessment-media-evidence"]');
  const answer = page.getByRole("button", { name: "Picture of sun sun", exact: true });
  await drift(page, answer, { cancel: true });
  await drift(page, answer, { outside: true });
  await expect(preview).toHaveAttribute("data-answer-count", "0");
  expect(saves).toBe(0);
  await drift(page, answer);
  await expect(preview).toHaveAttribute("data-answer-count", "1", { timeout: 300 });
  await expect(page.locator('[data-assessment-question-id="second-safe-picture-item"]')).toBeVisible();
  expect(saves).toBe(1);
});

test("assessment spelling tiles keep moved taps and keyboard input single-action", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Trusted moved touch uses the Chromium input protocol.");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.route("**/__preview_assessment_answer__", route => (
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  ));
  await page.goto("/preview/assessment-media-evidence.html?scenario=response-latency&skill=hfw_1_25&item=lp3.hfw_1_25.l2.B.and.v2");
  const selected = page.locator(".hfw-letter-slot.filled");
  const first = page.getByRole("button", { name: "Add a", exact: true });
  await drift(page, first, { cancel: true });
  await drift(page, first, { outside: true });
  await expect(selected).toHaveCount(0);
  await drift(page, first);
  await expect(selected).toHaveCount(1);
  await page.getByRole("button", { name: "Add n", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(selected).toHaveCount(2);
  await drift(page, page.getByRole("button", { name: "Add d", exact: true }));
  await expect(selected).toHaveCount(3);
  await drift(page, page.getByRole("button", { name: "Submit", exact: true }));
  await expect(page.locator('[data-preview-surface="assessment-media-evidence"]'))
    .toHaveAttribute("data-answer-count", "1");
});
