import { expect, test } from "@playwright/test";

const CLASS_ID = "00000000-0000-4000-8000-0000000000a1";
const STUDENT_ID = "maths-phase-zero-child";
const studentUrl = `/preview/maths-phase-zero.html?audience=student#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`;

async function noHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth
  }))).toEqual({ body: 0, document: 0 });
}

async function undersizedMechanicControls(page) {
  return page.locator(".maths-arcade-mechanic button:not(:disabled)").evaluateAll(elements => elements
    .filter(element => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && box.width > 0 && box.height > 0;
    })
    .map(element => {
      const box = element.getBoundingClientRect();
      return { name: element.getAttribute("aria-label") || element.textContent.trim(), width: box.width, height: box.height };
    })
    .filter(control => control.width < 56 || control.height < 56));
}

test("Maths home and Guided Lesson keep their labels, endpoints and navigation whole on child devices", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 568, height: 320 },
    { width: 768, height: 1024 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(studentUrl.replace("#", `&viewport=${viewport.width}x${viewport.height}#`));
    const kicker = page.getByText("Choose your way to practise", { exact: true });
    await expect(kicker).toBeVisible();
    const kickerBox = await kicker.boundingBox();
    expect(kickerBox?.height).toBeGreaterThanOrEqual(16);
    await noHorizontalOverflow(page);

    await page.locator(".maths-destination.is-learn").click();
    const home = page.getByRole("button", { name: "Back to Maths home" });
    await expect(home).toBeVisible();
    await expect(home).toContainText("Maths home");

    const numberLine = page.getByRole("radiogroup", { name: "Choose a number on the number line" });
    await expect(numberLine).toBeVisible();
    const endpoints = numberLine.getByRole("radio");
    await expect(endpoints.first()).toHaveText("0");
    await expect(endpoints.last()).toHaveText("20");
    await endpoints.last().evaluate(element => element.scrollIntoView({ block: "nearest", inline: "end" }));
    await expect.poll(async () => {
      const lineBox = await numberLine.boundingBox();
      const lastBox = await endpoints.last().boundingBox();
      if (!lineBox || !lastBox) return false;
      return lastBox.x >= lineBox.x - 1 && lastBox.x + lastBox.width <= lineBox.x + lineBox.width + 1;
    }).toBe(true);

    const model = page.locator(".maths-lesson-model");
    const nav = page.locator(".maths-student-area-v2[data-child-surface='maths-lesson'] > .maths-player-nav-v2");
    await expect(nav).toBeVisible();
    const modelBox = await model.boundingBox();
    const navBox = await nav.boundingBox();
    if (viewport.width <= 720) {
      await expect(nav).toHaveCSS("position", "fixed");
      expect(navBox?.y).toBeGreaterThanOrEqual(viewport.height - 100);
      expect((navBox?.y || 0) + (navBox?.height || 0)).toBeLessThanOrEqual(viewport.height + 1);
    } else {
      await expect(nav).toHaveCSS("position", "static");
      expect(navBox?.y).toBeGreaterThanOrEqual((modelBox?.y || 0) + (modelBox?.height || 0) - 1);
    }
    await noHorizontalOverflow(page);
  }
});

test("Skills Check number match exposes its Add one model action on desktop and a 320px phone", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`/preview/maths-phase-zero.html?audience=student&check=match&viewport=${viewport.width}#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
    await page.getByRole("button", { name: /Skills check/ }).click();
    await page.getByLabel("Learning goal").selectOption("F-N-MATCH");
    await page.getByRole("button", { name: "Start the check" }).click();
    const addOne = page.getByRole("button", { name: "Add one" });
    await expect(addOne).toBeVisible();
    await addOne.scrollIntoViewIfNeeded();
    expect(await addOne.evaluate(button => {
      const box = button.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + (box.width / 2), box.top + (box.height / 2));
      return top === button || button.contains(top);
    })).toBe(true);
    await addOne.click();
    await expect(page.getByRole("button", { name: "Take one away" })).toBeEnabled();
    expect(await page.getByRole("button", { name: "Take one away" }).evaluate(button => getComputedStyle(button).opacity)).toBe("1");
    await expect(page.getByRole("button", { name: "Use this model" })).toBeVisible();
    await noHorizontalOverflow(page);
  }
});

test("Number Trail has a progressive 3D world, complete semantic fallback, pause and exit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/preview/maths-phase-zero.html?audience=student&game=number-trail#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
  await page.getByRole("button", { name: /Maths Arcade/ }).click();
  await page.locator('[data-game="number-trail"]').click();

  const world = page.locator(".maths-number-trail-world");
  const threeLayer = page.locator(".maths-number-trail-three");
  const choices = page.getByRole("group", { name: "Walk onto a stepping stone for the missing number" });
  await expect(world).toBeVisible();
  await expect(threeLayer).toHaveAttribute("data-render-state", /ready|fallback/);
  await expect(choices.getByRole("button")).toHaveCount(3);
  await expect(choices.getByRole("button").first()).toHaveAttribute("aria-label", /Step onto \d+ and put it in the gap/);

  const renderState = await threeLayer.getAttribute("data-render-state");
  if (renderState === "ready") await expect(threeLayer.locator("canvas")).toHaveCount(1);
  else await expect(page.locator(".maths-mountain-layer")).toHaveCount(2);

  const pause = page.getByRole("button", { name: "Pause game" });
  for (const control of [pause, page.getByRole("button", { name: "Exit to Arcade" })]) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(56);
    expect(box?.height).toBeGreaterThanOrEqual(56);
  }
  await pause.click();
  await expect(page.getByText("Game paused", { exact: true })).toBeVisible();
  await expect(choices.getByRole("button").first()).toBeDisabled();
  await page.getByRole("button", { name: "Keep playing" }).click();
  await expect(page.getByText("Game paused", { exact: true })).toHaveCount(0);
  await expect(choices.getByRole("button").first()).toBeEnabled();

  await page.getByRole("button", { name: "Exit to Arcade" }).click();
  await expect(page.getByRole("heading", { name: "Choose how you want to think" })).toBeVisible();
  const arcadeScroller = page.locator('[data-child-surface="maths-arcade"]');
  await arcadeScroller.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await page.locator('[data-game="glimpse-garden"]').click();
  await expect.poll(() => arcadeScroller.evaluate(element => element.scrollTop)).toBe(0);
  await expect(page.getByText("Mission", { exact: true })).toBeVisible();
  await noHorizontalOverflow(page);
});

test("all five game loops keep 56px primary controls and distinct world mechanics at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const games = [
    ["number-trail", ".maths-number-trail-world", ".maths-trail-stones button"],
    ["glimpse-garden", ".m2d-garden-stage", ".m2d-controls .is-action"],
    ["frame-foundry", ".maths-foundry-machine", ".maths-foundry-frame button"],
    ["count-and-carry", ".m2d-plan-picker", ".m2d-plan-picker button"],
    ["quantity-match", ".maths-bridge-world", ".maths-bridge-build-controls button:last-child"]
  ];
  for (const [gameId, selector, firstActionSelector] of games) {
    await page.goto(`/preview/maths-phase-zero.html?audience=student&game=${gameId}#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
    await page.getByRole("button", { name: /Maths Arcade/ }).click();
    await page.locator(`[data-game="${gameId}"]`).click();
    await expect(page.locator(selector)).toBeVisible();
    const firstActionBox = await page.locator(firstActionSelector).first().boundingBox();
    expect(firstActionBox?.y, `${gameId} first action begins above the viewport`).toBeGreaterThanOrEqual(0);
    expect((firstActionBox?.y || 0) + (firstActionBox?.height || 0), `${gameId} first action is below the initial 568px viewport`).toBeLessThanOrEqual(568);
    expect(await undersizedMechanicControls(page), `${gameId} has undersized child controls before play`).toEqual([]);
    if (gameId === "number-trail") {
      await page.getByRole("group", { name: "Walk onto a stepping stone for the missing number" }).getByRole("button").first().click();
      await expect(page.getByText(/Walking to/)).toBeVisible();
    } else if (gameId === "glimpse-garden") {
      await page.getByRole("button", { name: "Walk to gate" }).click();
      await expect(page.getByRole("button", { name: "Open gate" })).toBeEnabled();
      await page.getByRole("button", { name: "Open gate" }).click();
      await expect(page.getByRole("img", { name: /^\d glowbugs/ })).toBeVisible();
      await expect(page.getByRole("button", { name: "Keep it open so I can count" })).toBeVisible();
      await page.getByRole("button", { name: "Keep it open so I can count" }).click();
      await expect(page.getByRole("group", { name: "Choose the number of glowbugs" })).toBeVisible();
    } else if (gameId === "frame-foundry") {
      await page.locator(".maths-foundry-frame button").first().click();
      await expect(page.locator(".maths-foundry-readout")).toContainText("You added 1");
      await expect(page.getByRole("button", { name: /Test this build/ })).toBeEnabled();
    } else if (gameId === "count-and-carry") {
      await page.getByRole("group", { name: "Choose a counting plan" }).getByRole("button").first().click();
      const firstParcel = page.locator(".m2d-parcel-field button").first();
      await firstParcel.click();
      await expect(page.locator(".m2d-status")).toContainText("Driving to the chosen waiting parcel");
    } else {
      await page.getByRole("button", { name: "Add one" }).click();
      await expect(page.locator(".maths-bridge-build-controls strong")).toHaveText("1 plank");
      await expect(page.getByRole("button", { name: /Test the bridge/ })).toBeEnabled();
    }
    expect(await undersizedMechanicControls(page), `${gameId} has undersized child controls during play`).toEqual([]);
    await noHorizontalOverflow(page);
  }
});

test("all four Glimpse patterns render their saved geometry at desktop and mobile widths", async ({ page }) => {
  test.setTimeout(120_000);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`/preview/maths-phase-zero.html?audience=student&game=glimpse-garden&geometry=${viewport.width}#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
    await page.getByRole("button", { name: /Maths Arcade/ }).click();
    await page.locator('[data-game="glimpse-garden"]').click();
    const seenPatterns = new Set();
    const seenVisualLayouts = new Set();

    for (let roundIndex = 0; roundIndex < 8 && seenPatterns.size < 4; roundIndex += 1) {
      await page.getByRole("button", { name: "Walk to gate" }).click();
      await expect(page.getByRole("button", { name: "Open gate" })).toBeEnabled();
      await page.getByRole("button", { name: "Open gate" }).click();
      await expect(page.getByRole("button", { name: "Keep it open so I can count" })).toBeVisible();
      await page.getByRole("button", { name: "Keep it open so I can count" }).click();
      const pattern = page.locator(".m2d-glimpse-pattern");
      await pattern.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
      const answerGroup = page.getByRole("group", { name: "Choose the number of glowbugs" });
      const rendered = await pattern.evaluate(element => {
        const patternBox = element.getBoundingClientRect();
        const patternStyle = getComputedStyle(element);
        const slots = [...element.querySelectorAll(".m2d-glowbug")].map(slot => {
          const box = slot.getBoundingClientRect();
          const slotStyle = getComputedStyle(slot);
          return {
            centerX: Math.round((box.left + (box.width / 2)) - patternBox.left),
            centerY: Math.round((box.top + (box.height / 2)) - patternBox.top),
            computedLeft: Number.parseFloat(slotStyle.left),
            computedTop: Number.parseFloat(slotStyle.top),
            group: Number(slot.dataset.glowbugGroup),
            occupied: slot.dataset.occupied === "true",
            sourceX: Number.parseFloat(slotStyle.getPropertyValue("--bug-x")),
            sourceY: Number.parseFloat(slotStyle.getPropertyValue("--bug-y"))
          };
        });
        return {
          boxHeight: patternBox.height,
          boxWidth: patternBox.width,
          clientHeight: element.clientHeight,
          clientWidth: element.clientWidth,
          count: Number(element.dataset.count),
          name: element.dataset.pattern,
          signature: element.dataset.layoutSignature,
          slots,
          transform: patternStyle.transform
        };
      });
      seenPatterns.add(rendered.name);
      seenVisualLayouts.add(rendered.slots.map(slot => `${slot.occupied ? 1 : 0}@${slot.centerX},${slot.centerY},g${slot.group}`).join("|"));
      expect(rendered.slots.filter(slot => slot.occupied)).toHaveLength(rendered.count);
      await expect(answerGroup).toHaveAttribute("data-evidence-pattern", rendered.name);
      await expect(answerGroup).toHaveAttribute("data-evidence-layout-signature", rendered.signature);
      await expect(pattern).toHaveAttribute("aria-label", new RegExp(`^${rendered.count} glowbugs`));

      const savedCoordinates = rendered.signature.split(":").slice(2).join(":").split("|").map(token => {
        const [, x, y, group] = token.match(/^[01]@(\d+),(\d+),g(\d+)$/).map(Number);
        return { group, x, y };
      });
      for (const [index, expected] of savedCoordinates.entries()) {
        expect(rendered.slots[index].group).toBe(expected.group);
        expect(rendered.slots[index].sourceX).toBe(expected.x);
        expect(rendered.slots[index].sourceY).toBe(expected.y);
        const geometryContext = JSON.stringify({ expected, index, rendered: rendered.slots[index], transform: rendered.transform, viewport });
        const xOffsets = [rendered.clientWidth, rendered.boxWidth].map(width => Math.abs(rendered.slots[index].computedLeft - ((expected.x / 100) * width)));
        const yOffsets = [rendered.clientHeight, rendered.boxHeight].map(height => Math.abs(rendered.slots[index].computedTop - ((expected.y / 100) * height)));
        expect(Math.min(...xOffsets), geometryContext).toBeLessThanOrEqual(1);
        expect(Math.min(...yOffsets), geometryContext).toBeLessThanOrEqual(1);
        expect(rendered.slots[index].centerX, geometryContext).toBeGreaterThanOrEqual(0);
        expect(rendered.slots[index].centerX, geometryContext).toBeLessThanOrEqual(rendered.boxWidth);
        expect(rendered.slots[index].centerY, geometryContext).toBeGreaterThanOrEqual(0);
        expect(rendered.slots[index].centerY, geometryContext).toBeLessThanOrEqual(rendered.boxHeight);
      }

      await expect(page.locator(".maths-arcade-feedback-row")).toHaveCount(0);
      const correctButton = answerGroup.getByRole("button", { name: String(rendered.count), exact: true });
      const topElementIsAnswer = await correctButton.evaluate(button => {
        const box = button.getBoundingClientRect();
        const top = document.elementFromPoint(box.left + (box.width / 2), box.top + (box.height / 2));
        return top === button || button.contains(top);
      });
      expect(topElementIsAnswer).toBe(true);
      await correctButton.click();
      await expect(page.locator(".maths-arcade-feedback-row")).toBeVisible();
      const continueButton = page.getByRole("button", { name: /Continue journey/ });
      await continueButton.scrollIntoViewIfNeeded();
      const topElementIsContinue = await continueButton.evaluate(button => {
        const box = button.getBoundingClientRect();
        const top = document.elementFromPoint(box.left + (box.width / 2), box.top + (box.height / 2));
        return top === button || button.contains(top);
      });
      expect(topElementIsContinue).toBe(true);
      await continueButton.click();
    }
    expect([...seenPatterns].sort()).toEqual(["arc", "dice", "frame", "split"]);
    expect(seenVisualLayouts.size).toBeGreaterThanOrEqual(4);
    await noHorizontalOverflow(page);
  }
});

test("Count plans visibly enforce authored rows and answers stay clickable at 1440x900", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/preview/maths-phase-zero.html?audience=student&game=count-and-carry#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
  await page.getByRole("button", { name: /Maths Arcade/ }).click();
  await page.locator('[data-game="count-and-carry"]').click();

  const completePlan = async ({ buttonName, expectedMode, expectedPlan }) => {
    await page.getByRole("group", { name: "Choose a counting plan" }).getByRole("button", { name: buttonName }).click();
    const layout = page.locator(".m2d-carry-stage");
    await expect(layout).toHaveAttribute("data-counting-plan", expectedPlan);
    await expect(layout).toHaveAttribute("data-layout-mode", expectedMode);
    const rowSizes = (await layout.getAttribute("data-layout-rows")).split(",").map(Number);
    expect(await layout.locator(".m2d-delivery-group").evaluateAll(groups => groups.map(group => Number(group.dataset.parcelCount)))).toEqual(rowSizes);
    const initialGeometry = await layout.evaluate(stage => ({ plan: stage.querySelector(".m2d-carry-plan strong").textContent, signature: stage.closest(".m2d-game").dataset.worldSignature, firstParcelLeft: getComputedStyle(stage.querySelector(".m2d-parcel-field button")).left }));
    const total = rowSizes.reduce((sum, value) => sum + value, 0);
    for (let delivered = 0; delivered < total; delivered += 1) {
      await page.getByRole("button", { name: /Assist the travel/ }).click();
      await expect(page.getByRole("button", { name: "Load parcel" })).toBeEnabled();
      await page.getByRole("button", { name: "Load parcel" }).click();
      await page.getByRole("button", { name: "Place this parcel in the group" }).click();
    }
    const answerGroup = page.getByRole("group", { name: "Choose how many parcels are in the whole collection" });
    await expect(answerGroup).toHaveAttribute("data-evidence-selected-plan", expectedPlan);
    await expect(answerGroup).toHaveAttribute("data-evidence-layout-mode", expectedMode);
    await expect(answerGroup).toHaveAttribute("data-evidence-layout-rows", rowSizes.join(","));
    await expect(page.locator(".maths-arcade-feedback-row")).toHaveCount(0);
    const answer = answerGroup.getByRole("button", { name: String(total), exact: true });
    expect(await answer.evaluate(button => { const box = button.getBoundingClientRect(); const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2); return top === button || button.contains(top); })).toBe(true);
    await answer.click();
    const continueButton = page.getByRole("button", { name: /Continue journey/ });
    await continueButton.scrollIntoViewIfNeeded();
    expect(await continueButton.evaluate(button => { const box = button.getBoundingClientRect(); const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2); return top === button || button.contains(top); })).toBe(true);
    return initialGeometry;
  };

  const meadowGeometry = await completePlan({ buttonName: "Sweep left to right", expectedMode: "meadow_grid", expectedPlan: "move_once" });
  await page.getByRole("button", { name: "Exit to Arcade" }).click();
  await page.locator('[data-game="count-and-carry"]').click();
  const rowGeometry = await completePlan({ buttonName: "Make five, then more", expectedMode: "structured_rows", expectedPlan: "make_row" });
  expect(meadowGeometry).not.toEqual(rowGeometry);

  await page.getByRole("button", { name: /Continue journey/ }).click();
  await page.getByRole("group", { name: "Choose a counting plan" }).getByRole("button", { name: "Make ten, then extras" }).click();
  const tenLayout = page.locator(".m2d-carry-stage");
  await expect(tenLayout).toHaveAttribute("data-layout-rows", /^10,/);
  await expect(tenLayout.locator('[data-parcel-row="1"]')).toHaveAttribute("data-parcel-count", "10");
  await expect(tenLayout.locator('[data-parcel-row="2"]')).toHaveAttribute("aria-label", /Extras group/);
  await noHorizontalOverflow(page);
});

test("2D Arcade worlds do not request the Three scene", async ({ page }) => {
  const threeRequests = [];
  page.on("request", request => {
    if (/MathsNumberTrailThree|three\.module|node_modules\/.vite\/deps\/three/.test(request.url())) threeRequests.push(request.url());
  });
  await page.goto(`/preview/maths-phase-zero.html?audience=student&game=glimpse-garden&bundle=2d#maths/home?class=${CLASS_ID}&learner=${STUDENT_ID}`);
  await page.getByRole("button", { name: /Maths Arcade/ }).click();
  await page.locator('[data-game="glimpse-garden"]').click();
  await expect(page.locator(".m2d-garden-stage")).toBeVisible();
  expect(threeRequests).toEqual([]);
});
