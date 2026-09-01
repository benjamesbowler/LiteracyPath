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

test("Letter Sounds keeps the same lesson and cards mounted through full screen", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: async function requestFullscreen() {}
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Try for free" }).click();
  await page.getByRole("button", { name: "Start playing" }).click();
  await page.locator("button").filter({ hasText: "Sounds and writing" }).click();
  await page.getByRole("button", { name: "Letter A", exact: true }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();

  const next = page.getByRole("button", { name: "Next Step", exact: true });
  const accessibleTrace = page.getByRole("button", { name: /^Trace stroke/ });
  for (let index = 0; index < 20 && !(await next.isVisible()); index += 1) {
    if (await accessibleTrace.isVisible()) await accessibleTrace.click();
    await page.waitForTimeout(100);
  }
  await expect(next).toBeVisible();
  await next.click();

  const cards = page.locator(".phonics-listen-card");
  await expect(cards).toHaveCount(4);
  await expect(page.locator(".phonics-is-for")).toHaveText("A is for...");
  await page.evaluate(() => {
    window.__letterCardsBeforeFullscreen = [
      ...document.querySelectorAll(".phonics-listen-card")
    ];
  });

  const fullscreen = page.locator(".learn-fullscreen-toggle");
  await expect(fullscreen).toHaveAttribute("aria-label", "Enter full screen");
  await expect(fullscreen).toBeHidden();
  await fullscreen.evaluate(button => button.click());

  await expect(cards).toHaveCount(4);
  await expect(page.locator(".phonics-is-for")).toHaveText("A is for...");
  expect(await page.evaluate(() => (
    window.__letterCardsBeforeFullscreen.every(card => card.isConnected)
  ))).toBe(true);

  await expect(fullscreen).toHaveAttribute("aria-label", "Exit full screen");
  await fullscreen.evaluate(button => button.click());
  await expect(cards).toHaveCount(4);
  expect(await page.evaluate(() => (
    window.__letterCardsBeforeFullscreen.every(card => card.isConnected)
  ))).toBe(true);
});

test("Letter Sounds word cards stay visible while their pictures are loaded", async ({ page }) => {
  await page.route("**/*", async route => {
    if (route.request().resourceType() === "image") {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    await route.continue();
  });
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
        let effectiveOpacity = 1;
        for (let element = card; element; element = element.parentElement) {
          effectiveOpacity *= Number.parseFloat(getComputedStyle(element).opacity) || 0;
        }
        return {
          effectiveOpacity,
          imageComplete: Boolean(image?.complete),
          naturalWidth: image?.naturalWidth || 0,
          stableVisual: Boolean(
            (image?.complete && image?.naturalWidth > 0)
            || card.querySelector(".phonics-img-placeholder")
          )
        };
      }));
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    return samples;
  });

  expect(evidence.length).toBeGreaterThan(20);
  expect(evidence.every(sample => sample.length === 4)).toBe(true);
  expect(evidence.flat().every(card => card.effectiveOpacity >= 0.99)).toBe(true);
  expect(evidence.flat().every(card => card.stableVisual)).toBe(true);
  const images = cards.locator("img");
  await expect(images).toHaveCount(4);
  await expect.poll(async () => cards.locator("img").evaluateAll(images => (
    images.every(image => image.complete && image.naturalWidth > 0)
  ))).toBe(true);
});

test("CVC keeps a placeholder visible while the next word picture loads", async ({ page }) => {
  let releaseBatImage = () => {};
  const batImageGate = new Promise(resolve => {
    releaseBatImage = resolve;
  });
  await page.route("**/images/child-mode/cvc/bat.png", async route => {
    await batImageGate;
    await route.continue();
  });

  await page.goto(
    "/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=1",
    { waitUntil: "domcontentloaded" }
  );
  const pickerThumbnails = page.locator(".cvc-family-thumb img");
  await expect(pickerThumbnails.first()).toBeAttached();
  expect(await pickerThumbnails.evaluateAll(images => images.every(image => (
    image.loading === "lazy"
    && image.decoding === "async"
    && image.fetchPriority === "auto"
  )))).toBe(true);
  await page.getByRole("button", { name: "at word nest", exact: true }).click();

  const pictureButton = page.getByRole("button", { name: "Hear cat", exact: true });
  await expect(pictureButton.locator("img")).toHaveAttribute("alt", "cat");
  await page.getByRole("button", { name: "Sound out the word", exact: true }).click();
  const nextWord = page.getByRole("button", { name: "Next Word", exact: true });
  await expect(nextWord).toBeVisible({ timeout: 5_000 });
  await nextWord.click();

  const nextPictureButton = page.getByRole("button", { name: "Hear bat", exact: true });
  await expect(nextPictureButton).toBeVisible();
  expect(await nextPictureButton.evaluate(button => {
    const image = button.querySelector("img");
    return {
      imageReady: Boolean(image?.complete && image?.naturalWidth > 0),
      placeholderVisible: Boolean(button.querySelector(".phonics-img-placeholder"))
    };
  })).toEqual({
    imageReady: false,
    placeholderVisible: true
  });

  releaseBatImage();
  await expect.poll(async () => nextPictureButton.locator("img").evaluate(image => (
    image.complete && image.naturalWidth > 0
  ))).toBe(true);
  await expect(nextPictureButton.locator("img")).toHaveClass("is-loaded");
  await expect(nextPictureButton.locator(".phonics-img-placeholder")).toHaveCount(0);
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
        .map(card => {
          let effectiveOpacity = 1;
          for (let element = card; element; element = element.parentElement) {
            effectiveOpacity *= Number.parseFloat(getComputedStyle(element).opacity) || 0;
          }
          return effectiveOpacity;
        }));
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
