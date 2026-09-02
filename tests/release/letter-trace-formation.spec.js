import { expect, test } from "@playwright/test";

import { LETTER_GUIDES, LETTER_STROKES } from "../../src/data/letterStrokes.js";
import { scoreLetterTrace } from "../../src/utils/traceLetterScoring.js";

const PREVIEW = "/?skillsQuest";
const TRACE_CANVAS = ".sbq-trace-stage canvas";
const TRACE_TARGET = ".sbq-trace-letter [data-trace-target]";
const TRACE_STATUS = ".sbq-trace-message";

async function openFirstLetterTrace(page) {
  await page.goto(PREVIEW);
  await page.getByRole("button", { name: /you are here/i }).click();
  await page.getByRole("button", { name: /Letter Trace/i }).click();

  await expect(page.getByRole("heading", { name: "1 of 4" })).toBeVisible();
  await expect(page.locator('[data-mechanic-stage="letter-trace"]')).toHaveAttribute("data-trace-phase", "guided");
  await expect(page.locator(TRACE_CANVAS)).toBeVisible();
  await expect(page.getByRole("button", { name: "Check my letter" })).toBeDisabled();
}

test("Adventure Map traces one letter form at a time and owns the iPad gesture", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This gate requires trusted touch input.");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=trace");

  const canvas = page.locator(TRACE_CANVAS);
  const traceBoundary = page.locator(".sbq-trace-stage");
  await expect(page.getByRole("heading", { name: "1 of 4" })).toBeVisible();
  await expect(canvas).toHaveAttribute("aria-label", "Trace the letter A");
  await expect(page.locator(TRACE_TARGET)).toHaveCount(3);

  expect(await traceBoundary.evaluate(element => {
    const styles = getComputedStyle(element);
    return {
      overscrollBehavior: styles.overscrollBehavior,
      touchAction: styles.touchAction,
      userSelect: styles.userSelect
    };
  })).toEqual({
    overscrollBehavior: "none",
    touchAction: "none",
    userSelect: "none"
  });

  await canvas.evaluate(element => {
    window.__adventureTraceGestureEvidence = {
      pointerEvents: [],
      scrollEvents: [],
      touchMoves: []
    };
    for (const type of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
      element.addEventListener(type, event => {
        window.__adventureTraceGestureEvidence.pointerEvents.push({
          defaultPrevented: event.defaultPrevented,
          isTrusted: event.isTrusted,
          pointerType: event.pointerType,
          type
        });
      });
    }
    document.addEventListener("touchmove", event => {
      window.__adventureTraceGestureEvidence.touchMoves.push({
        defaultPrevented: event.defaultPrevented,
        isTrusted: event.isTrusted
      });
    }, { passive: false });
    for (const target of [document, window, visualViewport].filter(Boolean)) {
      target.addEventListener("scroll", () => {
        window.__adventureTraceGestureEvidence.scrollEvents.push({
          windowX: window.scrollX,
          windowY: window.scrollY,
          viewportX: visualViewport?.pageLeft || 0,
          viewportY: visualViewport?.pageTop || 0
        });
      }, { passive: true });
    }
  });

  const targetStrokes = await renderedTargetStrokes(page);
  const beforeScroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const driver = inputDriver(page, testInfo.project.name);
  try {
    await driver.draw([targetStrokes[0]]);
  } finally {
    await driver.close();
  }

  const afterScroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const evidence = await page.evaluate(() => window.__adventureTraceGestureEvidence);
  expect(afterScroll).toEqual(beforeScroll);
  expect(evidence.scrollEvents).toEqual([]);
  expect(evidence.pointerEvents.some(event => event.type === "pointercancel")).toBe(false);
  expect(evidence.pointerEvents.filter(event => event.type === "pointermove").length).toBeGreaterThan(4);
  expect(evidence.pointerEvents.every(event => event.isTrusted)).toBe(true);
  expect(evidence.touchMoves.length).toBeGreaterThan(4);
  expect(evidence.touchMoves.every(event => event.isTrusted && event.defaultPrevented)).toBe(true);
});

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

async function sampleLetterStrokeBank(page) {
  return page.evaluate(({ guides, pathsByLetter }) => {
    const namespace = "http://www.w3.org/2000/svg";
    const scale = Math.min((460 - 72) / guides.width, (300 - 34) / 140);
    const offsetX = (460 - (guides.width * scale)) / 2;
    const offsetY = (300 - (140 * scale)) / 2;
    return Object.fromEntries(Object.entries(pathsByLetter).map(([letter, pathData]) => [
      letter,
      pathData.map(data => {
        const path = document.createElementNS(namespace, "path");
        path.setAttribute("d", data);
        const length = path.getTotalLength();
        const points = [];
        for (let at = 0; at <= length; at += 5) {
          const point = path.getPointAtLength(Math.min(at, length));
          points.push([
            offsetX + (point.x * scale),
            offsetY + (point.y * scale)
          ]);
        }
        return points;
      })
    ]));
  }, { guides: LETTER_GUIDES, pathsByLetter: LETTER_STROKES });
}

function substantialStroke(stroke) {
  if (stroke.length < 2) return false;
  const [firstX, firstY] = stroke[0];
  const [lastX, lastY] = stroke.at(-1);
  return Math.hypot(lastX - firstX, lastY - firstY) > 12;
}

test("one continuous modelled gesture is accepted across the taught letter bank", async ({ page }) => {
  const strokeBank = await sampleLetterStrokeBank(page);

  const failures = Object.entries(strokeBank)
    .filter(([, expectedStrokes]) => expectedStrokes.length > 1)
    .flatMap(([letter, expectedStrokes]) => {
      const exact = expectedStrokes.flat();
      const childLike = exact.map(([x, y], index) => [
        x + (Math.sin(index * 0.7) * 3),
        y + (Math.cos(index * 0.55) * 3)
      ]);
      return [
        ["exact", exact],
        ["child-like", childLike]
      ].map(([variant, drawn]) => ({
        letter,
        variant,
        result: scoreLetterTrace({
          drawnStrokes: [drawn],
          expectedStrokes
        })
      }));
    })
    .filter(({ result }) => !result.pass);

  expect(failures).toEqual([]);
});

test("a continuous gesture cannot hide an observably reversed pedagogic stroke", async ({ page }) => {
  const strokeBank = await sampleLetterStrokeBank(page);
  // Uppercase Y's second branch is the one unavoidable ambiguity introduced
  // by never lifting: both formations travel centre -> right -> centre, with
  // only the invisible boundary between connector and stroke changing.
  const continuouslyIndistinguishable = new Set(["Y:1"]);
  const acceptedReversals = Object.entries(strokeBank)
    .filter(([, expectedStrokes]) => expectedStrokes.length > 1)
    .flatMap(([letter, expectedStrokes]) => expectedStrokes
      .map((stroke, reversedIndex) => ({ stroke, reversedIndex }))
      .filter(({ stroke }) => substantialStroke(stroke))
      .map(({ reversedIndex }) => {
        const drawn = expectedStrokes.flatMap((stroke, index) => (
          index === reversedIndex ? [...stroke].reverse() : stroke
        ));
        return {
          letter,
          reversedIndex,
          result: scoreLetterTrace({ drawnStrokes: [drawn], expectedStrokes })
        };
      })
      .filter(({ letter: candidateLetter, reversedIndex }) => (
        !continuouslyIndistinguishable.has(`${candidateLetter}:${reversedIndex}`)
      )))
    .filter(({ result }) => result.pass);

  expect(acceptedReversals).toEqual([]);
});

test("a continuous gesture cannot hide a full backwards retrace", async ({ page }) => {
  const strokeBank = await sampleLetterStrokeBank(page);
  const acceptedRetraces = Object.entries(strokeBank)
    .filter(([, expectedStrokes]) => expectedStrokes.length > 1)
    .map(([letter, expectedStrokes]) => {
      const retracedIndex = expectedStrokes.reduce((longestIndex, stroke, index) => (
        stroke.length > expectedStrokes[longestIndex].length ? index : longestIndex
      ), 0);
      const drawn = expectedStrokes.flatMap((stroke, index) => (
        index === retracedIndex
          ? [...stroke, ...[...stroke].reverse().slice(1), ...stroke.slice(1)]
          : stroke
      ));
      return {
        letter,
        retracedIndex,
        result: scoreLetterTrace({ drawnStrokes: [drawn], expectedStrokes })
      };
    })
    .filter(({ result }) => result.pass);

  expect(acceptedRetraces).toEqual([]);
});

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

async function expectRejected(page, dimension) {
  await expect(page.getByRole("button", { name: "Check my letter" })).toBeEnabled();
  await page.getByRole("button", { name: "Check my letter" }).click();
  await expect(page.locator(TRACE_STATUS)).toHaveAttribute("data-trace-failure-dimension", dimension);
  await expect(page.getByRole("heading", { name: "1 of 4" })).toBeVisible();
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
  expect(targetStrokes.length).toBeGreaterThanOrEqual(3);

  const driver = inputDriver(page, testInfo.project.name);
  try {
    const canvasBox = await page.locator(TRACE_CANVAS).boundingBox();
    expect(canvasBox).toBeTruthy();

    // Covering/filling the whole writing area used to earn credit. It must not.
    await driver.draw(highCoverageScribble(canvasBox));
    await expectRejected(page, "path");
    await clearTrace(page);

    // The right geometry in reverse formation direction must not earn credit.
    targetStrokes = await renderedTargetStrokes(page);
    await driver.draw(targetStrokes.map(stroke => [...stroke].reverse()));
    await expectRejected(page, "direction");
    await clearTrace(page);

    // Correctly directed strokes in a wrong pedagogic order must not earn credit.
    targetStrokes = await renderedTargetStrokes(page);
    await driver.draw([
      targetStrokes[1],
      targetStrokes[0],
      ...targetStrokes.slice(2)
    ]);
    await expectRejected(page, "order");
    await clearTrace(page);

    // A neat but incomplete pair of strokes must not earn credit.
    targetStrokes = await renderedTargetStrokes(page);
    await driver.draw(targetStrokes.slice(0, 2));
    await expectRejected(page, "coverage");
    await clearTrace(page);

    // The complete modelled shape is accepted even when a child keeps one
    // finger down while moving between its pedagogic strokes.
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
    await driver.draw([targetStrokes.flat()]);
    const pointerEvidence = await page.evaluate(() => window.__letterTracePointerEvidence || []);
    expect(pointerEvidence.length).toBeGreaterThanOrEqual(20);
    expect([...new Set(pointerEvidence.map(event => event.pointerType))]).toEqual([
      testInfo.project.name === "mobile" ? "touch" : "mouse"
    ]);
    expect(pointerEvidence.every(event => event.isTrusted)).toBe(true);
    await page.getByRole("button", { name: "Check my letter" }).click();
    await expect(page.locator('[data-mechanic-stage="letter-trace"]')).toHaveAttribute("data-trace-phase", "faded");
    await expect(page.locator(TRACE_STATUS)).toHaveText("Now trace again with the faded model.");
    await expect(page.getByRole("heading", { name: "1 of 4" })).toBeVisible();

    targetStrokes = await renderedTargetStrokes(page);
    await driver.draw([targetStrokes.flat()]);
    await page.getByRole("button", { name: "Check my letter" }).click();
    await expect(page.locator(TRACE_STATUS)).toHaveText("That looks like the letter!");
    await expect(page.getByRole("heading", { name: "2 of 4" })).toBeVisible();
  } finally {
    await driver.close();
  }
});

test("Letter Trace offers a keyboard-completable supported formation route", async ({ page }) => {
  await openFirstLetterTrace(page);

  const supportedRoute = page.getByRole("button", { name: "Use supported formation practice" });
  await supportedRoute.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-support-route="formation-practice"]')).toContainText(
    "This records supported formation practice."
  );

  while (await page.getByRole("button", { name: "Next stroke" }).count()) {
    await page.getByRole("button", { name: "Next stroke" }).press("Enter");
  }
  await page.getByRole("button", { name: "Finish supported practice" }).press("Enter");
  await expect(page.getByRole("heading", { name: "2 of 4" })).toBeVisible();
});
