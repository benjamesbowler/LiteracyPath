import { expect, test } from "@playwright/test";

const PREVIEW = "/?skillsQuest";
const TRACE_CANVAS = ".sbq-trace-stage canvas";
const TRACE_TARGET = ".sbq-trace-letter [data-trace-target]";
const TRACE_STATUS = ".sbq-trace-message";

async function openFirstLetterTrace(page) {
  await page.goto(PREVIEW);
  await page.getByRole("button", { name: /you are here/i }).click();
  await page.getByRole("button", { name: /Letter Trace/i }).click();

  await expect(page.getByRole("heading", { name: "1 of 2" })).toBeVisible();
  await expect(page.locator(TRACE_CANVAS)).toBeVisible();
  await expect(page.getByRole("button", { name: "Check my letter" })).toBeDisabled();
}

/**
 * Sample the actual rendered target paths in screen coordinates. The release
 * gate deliberately follows the same SVG geometry the child sees; it does not
 * import a parallel test alphabet or write to React/app state.
 */
async function renderedTargetStrokes(page) {
  await page.locator(TRACE_CANVAS).scrollIntoViewIfNeeded();
  return page.locator(TRACE_TARGET).evaluateAll(paths => paths.map(path => {
    const length = path.getTotalLength();
    const pointCount = Math.max(2, Math.ceil(length / 6) + 1);
    const matrix = path.getScreenCTM();
    if (!matrix) throw new Error("Rendered trace target has no screen transform");
    return Array.from({ length: pointCount }, (_, index) => {
      const distance = length * (index / Math.max(1, pointCount - 1));
      const point = path.getPointAtLength(distance).matrixTransform(matrix);
      return { x: point.x, y: point.y };
    });
  }));
}

async function drawMouseStroke(page, points) {
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (const point of points.slice(1)) {
    await page.mouse.move(point.x, point.y);
  }
  await page.mouse.up();
}

async function drawTouchStroke(cdp, points) {
  const touchPoint = point => ({
    x: point.x,
    y: point.y,
    id: 1,
    radiusX: 7,
    radiusY: 7,
    force: 0.6
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touchPoint(points[0])]
  });
  for (const point of points.slice(1)) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [touchPoint(point)]
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: []
  });
}

function inputDriver(page, projectName) {
  let cdp;
  return {
    async draw(strokes) {
      if (projectName === "mobile") {
        cdp ||= await page.context().newCDPSession(page);
        for (const stroke of strokes) await drawTouchStroke(cdp, stroke);
        return;
      }
      for (const stroke of strokes) await drawMouseStroke(page, stroke);
    },
    async close() {
      try {
        await cdp?.detach();
      } catch (error) {
        if (!/closed|detached/i.test(String(error))) throw error;
      }
    }
  };
}

async function expectRejected(page) {
  await expect(page.getByRole("button", { name: "Check my letter" })).toBeEnabled();
  await page.getByRole("button", { name: "Check my letter" }).click();
  await expect(page.locator(TRACE_STATUS)).toHaveText("Follow the grey letter.");
  await expect(page.getByRole("heading", { name: "1 of 2" })).toBeVisible();
  await expect(page.getByText("That looks like the letter!", { exact: true })).toHaveCount(0);
}

async function clearTrace(page) {
  await page.getByRole("button", { name: "Start again" }).click();
  await expect(page.locator(TRACE_STATUS)).toHaveText("Trace the grey letter.");
  await expect(page.getByRole("button", { name: "Check my letter" })).toBeDisabled();
  await expect(page.locator(".sbq-encourage")).toHaveCount(0);
  await expect(page.locator(".sbq-round-card")).not.toHaveClass(/sbq-shake/);
}

function highCoverageScribble(canvasBox) {
  const left = canvasBox.x + (canvasBox.width * 0.08);
  const right = canvasBox.x + (canvasBox.width * 0.92);
  const top = canvasBox.y + (canvasBox.height * 0.1);
  const bottom = canvasBox.y + (canvasBox.height * 0.9);
  return Array.from({ length: 13 }, (_, row) => {
    const y = top + ((bottom - top) * (row / 12));
    const start = row % 2 === 0 ? left : right;
    const end = row % 2 === 0 ? right : left;
    return Array.from({ length: 20 }, (__, index) => ({
      x: start + ((end - start) * (index / 19)),
      y
    }));
  });
}

test("Letter Trace requires ordered formation through real mouse or touch input", async ({
  page
}, testInfo) => {
  test.setTimeout(60_000);
  await openFirstLetterTrace(page);
  let targetStrokes = await renderedTargetStrokes(page);
  expect(targetStrokes.length).toBeGreaterThanOrEqual(4);

  const driver = inputDriver(page, testInfo.project.name);
  try {
    const canvasBox = await page.locator(TRACE_CANVAS).boundingBox();
    expect(canvasBox).toBeTruthy();

    // Covering/filling the whole writing area used to earn credit. It must not.
    await driver.draw(highCoverageScribble(canvasBox));
    await expectRejected(page);
    await clearTrace(page);

    // The right geometry in reverse formation direction must not earn credit.
    targetStrokes = await renderedTargetStrokes(page);
    await driver.draw(targetStrokes.map(stroke => [...stroke].reverse()));
    await expectRejected(page);
    await clearTrace(page);

    // Correctly directed strokes in a wrong pedagogic order must not earn credit.
    targetStrokes = await renderedTargetStrokes(page);
    await driver.draw([
      targetStrokes[1],
      targetStrokes[0],
      ...targetStrokes.slice(2)
    ]);
    await expectRejected(page);
    await clearTrace(page);

    // A neat but incomplete pair of strokes must not earn credit.
    targetStrokes = await renderedTargetStrokes(page);
    await driver.draw(targetStrokes.slice(0, 2));
    await expectRejected(page);
    await clearTrace(page);

    // The complete modelled stroke sequence is accepted through the same input.
    targetStrokes = await renderedTargetStrokes(page);
    await page.locator(TRACE_CANVAS).evaluate(canvas => {
      window.__letterTracePointerEvidence = [];
      for (const type of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
        canvas.addEventListener(type, event => {
          window.__letterTracePointerEvidence.push({
            type,
            pointerType: event.pointerType,
            isTrusted: event.isTrusted,
            x: event.clientX,
            y: event.clientY
          });
        });
      }
    });
    await driver.draw(targetStrokes);
    const pointerEvidence = await page.evaluate(() => window.__letterTracePointerEvidence || []);
    expect(pointerEvidence.length).toBeGreaterThanOrEqual(20);
    expect([...new Set(pointerEvidence.map(event => event.pointerType))]).toEqual([
      testInfo.project.name === "mobile" ? "touch" : "mouse"
    ]);
    expect(pointerEvidence.every(event => event.isTrusted)).toBe(true);
    await page.getByRole("button", { name: "Check my letter" }).click();
    await expect(page.locator(TRACE_STATUS)).toHaveText("That looks like the letter!");
    await expect(page.getByRole("heading", { name: "2 of 2" })).toBeVisible();
  } finally {
    await driver.close();
  }
});
