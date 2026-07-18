import { expect, test } from "@playwright/test";

const SOAK_URL = "/preview/quest.html?view=world&stop=s1&display=pixel&active=0&soak=smoke&profile=local-smoke";

test("the device recorder measures a stable live pixel session and seals its evidence", async ({ page }) => {
  await page.goto(SOAK_URL);
  await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("button", { name: "End and save test" })).toBeVisible();
  await page.evaluate(() => window.__questDeviceRecorderReady);

  const canvas = page.locator(".qp-canvas canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  for (const ratio of [0.44, 0.56, 0.48, 0.52]) {
    await canvas.click({ position: { x: box.width * ratio, y: box.height * 0.72 } });
    await page.waitForTimeout(350);
  }

  await expect.poll(() => page.evaluate(() => window.__questDeviceRecorder.snapshot().durationMs), {
    timeout: 35_000,
    intervals: [1_000]
  }).toBeGreaterThanOrEqual(21_000);

  const evidence = await page.evaluate(() => window.__questDeviceFinish());
  expect(evidence.evaluation.status, JSON.stringify(evidence.evaluation.failures)).toBe("pass");
  expect(evidence.evidenceHash).toMatch(/^[a-f0-9]{64}$/);
  expect(evidence.samples.length).toBeGreaterThanOrEqual(5);
  expect(evidence.telemetry.healthSamples).toBeGreaterThanOrEqual(2);
  expect(evidence.telemetry.sampledFrames).toBeGreaterThanOrEqual(600);
  expect(evidence.input.events).toBeGreaterThanOrEqual(4);
  expect(evidence.samples.every(sample => sample.surface === "pixel")).toBe(true);
  expect(Math.max(...evidence.samples.map(sample => sample.canvases))).toBe(1);
  expect(evidence.errors).toEqual([]);
});
