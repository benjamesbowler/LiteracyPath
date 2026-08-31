import { expect, test } from "@playwright/test";

const IPAD_LANDSCAPE = { width: 1024, height: 768 };

async function dispatchTouchStroke(page, points) {
  const cdp = await page.context().newCDPSession(page);
  const touchPoint = point => ({
    x: point.x,
    y: point.y,
    id: 1,
    radiusX: 7,
    radiusY: 7,
    force: 0.6
  });

  try {
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
  } finally {
    await cdp.detach();
  }
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This gate requires trusted touch input.");
  await page.setViewportSize(IPAD_LANDSCAPE);
});

test("Letter Sounds word cards stay visible while their pictures are loaded", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=phonics&step=2");
  await page.getByRole("button", { name: "Letter A", exact: true }).click();

  const cards = page.locator(".phonics-listen-card");
  await expect(cards).toHaveCount(4);

  const evidence = await page.evaluate(async () => {
    const samples = [];
    const startedAt = performance.now();
    while (performance.now() - startedAt < 1_600) {
      const cards = [...document.querySelectorAll(".phonics-listen-card")];
      samples.push(cards.map(card => {
        const image = card.querySelector("img");
        return {
          opacity: Number.parseFloat(getComputedStyle(card).opacity),
          imageComplete: Boolean(image?.complete),
          naturalWidth: image?.naturalWidth || 0
        };
      }));
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    return samples;
  });

  expect(evidence.length).toBeGreaterThan(20);
  expect(evidence.every(sample => sample.length === 4)).toBe(true);
  expect(evidence.flat().every(card => card.opacity >= 0.99)).toBe(true);
  await expect(cards.locator("img")).toHaveCount(4);
  await expect.poll(async () => cards.locator("img").evaluateAll(images => (
    images.every(image => image.complete && image.naturalWidth > 0)
  ))).toBe(true);
});

test("Letter Sounds matching cards keep their image and result faces separated", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=phonics&step=3");
  await page.getByRole("button", { name: "Letter A", exact: true }).click();

  const tiles = page.locator(".phonics-word-tile");
  await expect(tiles).toHaveCount(8);

  const opacitySamples = await page.evaluate(async () => {
    const samples = [];
    const startedAt = performance.now();
    while (performance.now() - startedAt < 1_200) {
      samples.push([...document.querySelectorAll(".phonics-match-grid > div")]
        .map(card => Number.parseFloat(getComputedStyle(card).opacity)));
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    return samples;
  });
  expect(opacitySamples.length).toBeGreaterThan(20);
  expect(opacitySamples.every(sample => sample.length === 8)).toBe(true);
  expect(opacitySamples.flat().every(opacity => opacity >= 0.99)).toBe(true);

  await expect.poll(async () => tiles.locator("img").evaluateAll(images => (
    images.length === 8 && images.every(image => image.complete && image.naturalWidth > 0)
  ))).toBe(true);

  const faceStyles = await tiles.evaluateAll(elements => elements.map(tile => {
    const inner = getComputedStyle(tile.querySelector(".phonics-word-tile-inner"));
    const front = getComputedStyle(tile.querySelector(".phonics-word-tile-front"));
    const back = getComputedStyle(tile.querySelector(".phonics-word-tile-back"));
    return {
      backBackfaceVisibility: back.backfaceVisibility,
      frontBackfaceVisibility: front.backfaceVisibility,
      frontTransform: front.transform,
      innerTransformStyle: inner.transformStyle
    };
  }));

  expect(faceStyles.every(styles => styles.innerTransformStyle === "preserve-3d")).toBe(true);
  expect(faceStyles.every(styles => styles.frontBackfaceVisibility === "hidden")).toBe(true);
  expect(faceStyles.every(styles => styles.backBackfaceVisibility === "hidden")).toBe(true);
  expect(faceStyles.every(styles => styles.frontTransform !== "none")).toBe(true);
});

test("Letter tracing keeps an iPad touch stroke captured without page movement", async ({ page }) => {
  const browserMessages = [];
  page.on("console", message => browserMessages.push(message.text()));

  await page.goto("/preview/child-surfaces.html?surface=phonics&step=1");
  await page.getByRole("button", { name: "Letter A", exact: true }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();

  const activity = page.locator(".phonics-step-tracer");
  const traceBoundary = page.locator(".phonics-trace-wrap");
  const pad = page.locator(".phonics-trace-pad");
  await expect(activity).toBeVisible();
  await expect(traceBoundary).toBeVisible();
  await expect(pad).toBeVisible();

  const gestureStyles = await traceBoundary.evaluate(element => {
    const styles = getComputedStyle(element);
    return {
      overscrollBehavior: styles.overscrollBehavior,
      touchAction: styles.touchAction,
      userSelect: styles.userSelect
    };
  });
  expect(gestureStyles).toEqual({
    overscrollBehavior: "none",
    touchAction: "none",
    userSelect: "none"
  });

  await pad.evaluate(element => {
    window.__phonicsTraceEvidence = { pointerEvents: [], scrollEvents: [] };
    for (const type of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
      element.addEventListener(type, event => {
        window.__phonicsTraceEvidence.pointerEvents.push({
          isTrusted: event.isTrusted,
          pointerType: event.pointerType,
          type
        });
      });
    }
    for (const target of [document, window, visualViewport].filter(Boolean)) {
      target.addEventListener("scroll", () => {
        window.__phonicsTraceEvidence.scrollEvents.push({
          windowX: window.scrollX,
          windowY: window.scrollY,
          viewportX: visualViewport?.pageLeft || 0,
          viewportY: visualViewport?.pageTop || 0
        });
      }, { passive: true });
    }
  });

  const beforeScroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const box = await pad.boundingBox();
  expect(box).toBeTruthy();
  const points = Array.from({ length: 25 }, (_, index) => ({
    x: box.x + box.width * (0.25 + (0.5 * index / 24)),
    y: box.y + box.height * (0.25 + (0.5 * index / 24))
  }));
  await dispatchTouchStroke(page, points);

  const afterScroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const evidence = await page.evaluate(() => window.__phonicsTraceEvidence);
  expect(afterScroll).toEqual(beforeScroll);
  expect(evidence.scrollEvents).toEqual([]);
  expect(evidence.pointerEvents.some(event => event.type === "pointercancel")).toBe(false);
  expect(evidence.pointerEvents.filter(event => event.type === "pointermove").length).toBeGreaterThan(10);
  expect(evidence.pointerEvents.every(event => event.isTrusted)).toBe(true);
  expect([...new Set(evidence.pointerEvents.map(event => event.pointerType))]).toEqual(["touch"]);
  expect(browserMessages.filter(message => /passive event listener|cancel a touchend/i.test(message))).toEqual([]);
  await expect(page.locator(".phonics-step-status")).not.toContainText("(0%)");
});
