import { expect, test } from "@playwright/test";

import { CHILD_SURFACE_ROUTES } from "../../src/policy/childSurfaceRules.js";
import {
  STUDENT_DEVICE_PROFILES,
  STUDENT_FULLSCREEN_DEVICE_IDS,
  STUDENT_MINIMUM_TARGET_PX,
  STUDENT_SOFTWARE_KEYBOARD_VIEWPORTS
} from "../../src/policy/studentDeviceMatrix.js";

const INTERACTIVE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[role="button"]:not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"])'
].join(",");

async function waitForVisibleImages(page) {
  await page.waitForFunction(() => (
    [...document.images]
      .filter(image => {
        const rect = image.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0
          && rect.bottom > 0 && rect.top < window.innerHeight
          && rect.right > 0 && rect.left < window.innerWidth;
      })
      .every(image => image.complete)
  ));
}

async function expectNoHorizontalOverflow(page, state) {
  await expect.poll(() => page.evaluate(() => ({
    document: document.documentElement.scrollWidth - window.innerWidth,
    body: document.body.scrollWidth - window.innerWidth
  })), `${state} must not overflow horizontally`).toEqual({ document: 0, body: 0 });
}

async function visibleControls(root) {
  const controls = root.locator(INTERACTIVE_SELECTOR);
  const visible = [];
  for (let index = 0; index < await controls.count(); index += 1) {
    const control = controls.nth(index);
    if (await control.isVisible()) visible.push(control);
  }
  return visible;
}

async function expectMinimumTargets(root, state) {
  const controls = await visibleControls(root);
  expect(controls.length, `${state} must expose an enabled control`).toBeGreaterThan(0);
  const failures = [];
  for (let index = 0; index < controls.length; index += 1) {
    const control = controls[index];
    const box = await control.boundingBox();
    const reachability = await control.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const fullyInViewport = rect.left >= -1
        && rect.top >= -1
        && rect.right <= window.innerWidth + 1
        && rect.bottom <= window.innerHeight + 1;
      if (fullyInViewport) return { reachable: true, viaScroll: false };

      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      const documentScrollsX = document.documentElement.scrollWidth > window.innerWidth + 1
        && !["hidden", "clip"].includes(rootStyle.overflowX)
        && !["hidden", "clip"].includes(bodyStyle.overflowX);
      const documentScrollsY = document.documentElement.scrollHeight > window.innerHeight + 1
        && !["hidden", "clip"].includes(rootStyle.overflowY)
        && !["hidden", "clip"].includes(bodyStyle.overflowY);
      if (documentScrollsX || documentScrollsY) return { reachable: true, viaScroll: true };

      let ancestor = element.parentElement;
      while (ancestor) {
        const style = getComputedStyle(ancestor);
        const scrollsX = ancestor.scrollWidth > ancestor.clientWidth + 1
          && ["auto", "scroll"].includes(style.overflowX);
        const scrollsY = ancestor.scrollHeight > ancestor.clientHeight + 1
          && ["auto", "scroll"].includes(style.overflowY);
        if (scrollsX || scrollsY) return { reachable: true, viaScroll: true };
        ancestor = ancestor.parentElement;
      }
      return { reachable: false, viaScroll: false };
    });
    if (!box || box.width < STUDENT_MINIMUM_TARGET_PX || box.height < STUDENT_MINIMUM_TARGET_PX) {
      failures.push({
        problem: "target",
        index,
        name: await control.getAttribute("aria-label") || (await control.innerText()).trim(),
        width: box?.width || 0,
        height: box?.height || 0
      });
    }
    if (!reachability.reachable) {
      failures.push({
        problem: "clipped",
        index,
        name: await control.getAttribute("aria-label") || (await control.innerText()).trim(),
        left: box?.x || 0,
        top: box?.y || 0,
        right: box ? box.x + box.width : 0,
        bottom: box ? box.y + box.height : 0
      });
    }
  }
  expect(
    failures,
    `${state} has controls below ${STUDENT_MINIMUM_TARGET_PX}px or clipped without a scroll path`
  ).toEqual([]);
  return controls;
}

async function expectKeyboardState(page, root, state) {
  const controls = await visibleControls(root);
  await page.keyboard.press("Tab");
  await controls[0].focus();
  const focus = await controls[0].evaluate(element => {
    const style = getComputedStyle(element);
    return {
      insideSurface: Boolean(element.closest("[data-child-surface]")),
      focusVisible: element.matches(":focus-visible"),
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth) || 0
    };
  });
  expect(focus.insideSurface, `${state} focus stays inside the child surface`).toBe(true);
  expect(focus.focusVisible, `${state} exposes keyboard focus`).toBe(true);
  expect(focus.outlineStyle, `${state} uses a visible outline`).not.toBe("none");
  expect(focus.outlineWidth, `${state} focus outline is at least 3px`).toBeGreaterThanOrEqual(3);
}

async function expectHomeDoorLabels(surface, state) {
  const cards = surface.locator(".kg-home-door");
  const titles = surface.locator(".kg-home-door .kg-card-title");
  await expect(cards, `${state} exposes all six destination cards`).toHaveCount(6);
  await expect(titles, `${state} exposes all six destination names`).toHaveCount(6);

  const failures = [];
  for (let index = 0; index < await cards.count(); index += 1) {
    const card = cards.nth(index);
    const title = titles.nth(index);
    const [cardBox, titleBox, visible, text] = await Promise.all([
      card.boundingBox(),
      title.boundingBox(),
      title.isVisible(),
      title.innerText()
    ]);
    const contained = Boolean(cardBox && titleBox)
      && titleBox.x >= cardBox.x - 1
      && titleBox.y >= cardBox.y - 1
      && titleBox.x + titleBox.width <= cardBox.x + cardBox.width + 1
      && titleBox.y + titleBox.height <= cardBox.y + cardBox.height + 1;
    if (!visible || !contained || !titleBox?.width || !titleBox?.height) {
      failures.push({ index, text, visible, contained, cardBox, titleBox });
    }
  }
  expect(failures, `${state} keeps every destination name visibly inside its card`).toEqual([]);
}

async function openChildSurface(page, route, profile) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: profile.width, height: profile.height });
  await page.goto(`/preview/child-surfaces.html?surface=${route.id}`);
  const surface = page.locator(`[data-child-surface="${route.id}"]`);
  await expect(surface).toBeVisible();
  await expect(surface.locator("[data-child-title]")).toBeVisible();
  await expect(surface.locator("[data-child-primary]")).toHaveCount(1);
  await waitForVisibleImages(page);
  await page.evaluate(() => document.fonts?.ready);
  expect(errors, `${route.id} at ${profile.id} has no page errors`).toEqual([]);
  return surface;
}

for (const profile of STUDENT_DEVICE_PROFILES) {
  test(`A3.6 every student route passes the ${profile.id} matrix`, async ({ page }) => {
    test.setTimeout(150_000);
    for (const route of CHILD_SURFACE_ROUTES) {
      const state = `${route.id} at ${profile.id}`;
      const surface = await openChildSurface(page, route, profile);
      await expectNoHorizontalOverflow(page, state);
      await expectMinimumTargets(surface, state);
      await expectKeyboardState(page, surface, state);
      if (route.id === "student-home") await expectHomeDoorLabels(surface, state);
      await expect(page).toHaveScreenshot(`student-device-${route.id}-${profile.id}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        maxDiffPixelRatio: 0.01
      });
    }
  });
}

for (const keyboardViewport of STUDENT_SOFTWARE_KEYBOARD_VIEWPORTS) {
  test(`A3.6 student sign in remains usable with ${keyboardViewport.id}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/preview/child-surfaces.html?surface=student-login");
    const input = page.getByRole("textbox", { name: "Class code", exact: true });
    const go = page.getByRole("button", { name: "Go", exact: true });
    await input.focus();
    await page.setViewportSize({
      width: keyboardViewport.width,
      height: keyboardViewport.height
    });
    await input.scrollIntoViewIfNeeded();
    await expect(input).toBeInViewport();
    await go.scrollIntoViewIfNeeded();
    await expect(go).toBeInViewport();
    await expectNoHorizontalOverflow(page, keyboardViewport.id);
    await expectMinimumTargets(
      page.locator('[data-child-surface="student-login"]'),
      keyboardViewport.id
    );
    await expect(page).toHaveScreenshot(`student-device-${keyboardViewport.id}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
      maxDiffPixelRatio: 0.01
    });
  });
}

async function installFullscreenMock(page) {
  await page.addInitScript(() => {
    // Arcade practice rounds deliberately vary in production. Give visual QA a
    // repeatable round so image diffs measure layout, not a different randomly
    // selected word picture and letter tray on every run.
    let randomState = 0x51f15e;
    Math.random = () => {
      randomState = (randomState * 1664525 + 1013904223) >>> 0;
      return randomState / 0x100000000;
    };
    let activeElement = null;
    window.__studentFullscreenHistory = [];
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => activeElement
    });
    HTMLElement.prototype.requestFullscreen = async function requestFullscreen() {
      activeElement = this;
      window.__studentFullscreenHistory.push({
        action: "enter",
        tag: this.tagName,
        className: this.className || ""
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    };
    document.exitFullscreen = async () => {
      window.__studentFullscreenHistory.push({
        action: "exit",
        tag: activeElement?.tagName || "",
        className: activeElement?.className || ""
      });
      activeElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    };
  });
}

async function expectFullscreenHistory(page, expectedActions, state) {
  await expect.poll(() => page.evaluate(() =>
    window.__studentFullscreenHistory.map(item => item.action)
  ), `${state} fullscreen history`).toEqual(expectedActions);
}

for (const profileId of STUDENT_FULLSCREEN_DEVICE_IDS) {
  const profile = STUDENT_DEVICE_PROFILES.find(candidate => candidate.id === profileId);
  test(`A3.6 fullscreen transitions work at ${profile.id}`, async ({ page }) => {
    test.setTimeout(90_000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    await installFullscreenMock(page);
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto("/preview/game-overlay.html?game=cvc-word-builder");
    const game = page.getByRole("dialog", { name: "CVC Word Builder", exact: true });
    await expect(game).toBeVisible();
    await expect(game.getByText("Build this word.", { exact: true })).toBeVisible();
    await waitForVisibleImages(page);
    await expectFullscreenHistory(page, ["enter"], `${profile.id} game enter`);
    await expectNoHorizontalOverflow(page, `${profile.id} fullscreen game`);
    await expectMinimumTargets(game, `${profile.id} fullscreen game`);
    await expect(page).toHaveScreenshot(`student-device-fullscreen-game-${profile.id}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
      maxDiffPixelRatio: 0.01
    });
    await page.keyboard.press("Escape");
    const quit = page.getByRole("alertdialog", { name: "Quit CVC Word Builder", exact: true });
    await expect(quit).toBeVisible();
    await quit.getByRole("button", { name: "Leave", exact: true }).click();
    await expectFullscreenHistory(page, ["enter", "exit"], `${profile.id} game exit`);

    await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");
    const readerControls = page.getByRole("group", { name: "Reader view controls" });
    await readerControls.getByRole("button", { name: "Full screen", exact: true }).click();
    await expectFullscreenHistory(page, ["enter"], `${profile.id} reader enter`);
    const reader = page.locator(".guided-reader-shell");
    await expect(reader).toHaveClass(/fullscreen/);
    await waitForVisibleImages(page);
    await expectNoHorizontalOverflow(page, `${profile.id} fullscreen reader`);
    await expectMinimumTargets(reader, `${profile.id} fullscreen reader`);
    const readingText = reader.locator(".guided-page-text");
    const readingOverflow = await readingText.evaluate(element => ({
      needsScroll: element.scrollHeight > element.clientHeight + 1,
      overflowY: getComputedStyle(element).overflowY
    }));
    if (readingOverflow.needsScroll) {
      expect(
        ["auto", "scroll"].includes(readingOverflow.overflowY),
        `${profile.id} fullscreen reader keeps every word reachable`
      ).toBe(true);
      const lastWord = readingText.locator(".guided-word").last();
      await lastWord.scrollIntoViewIfNeeded();
      await expect(lastWord).toBeInViewport();
      await lastWord.evaluate(element => {
        let ancestor = element.parentElement;
        while (ancestor) {
          ancestor.scrollTop = 0;
          ancestor.scrollLeft = 0;
          ancestor = ancestor.parentElement;
        }
        window.scrollTo(0, 0);
      });
    }
    await expect(page).toHaveScreenshot(`student-device-fullscreen-reader-${profile.id}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
      maxDiffPixelRatio: 0.01
    });
    await readerControls.getByRole("button", { name: "Exit", exact: true }).click();
    await expectFullscreenHistory(page, ["enter", "exit"], `${profile.id} reader exit`);

    await page.goto("/preview/child-surfaces.html?surface=story-quests");
    await page.locator('[data-child-surface="story-quests"] [data-child-primary]').click();
    const story = page.locator(".story-quest-reader");
    await expect(story).toBeVisible();
    await story.locator("summary", { hasText: "More" }).click();
    await story.getByRole("button", { name: "Full screen", exact: true }).click();
    await expectFullscreenHistory(page, ["enter"], `${profile.id} story enter`);
    await expect(story).toHaveClass(/fullscreen/);
    await waitForVisibleImages(page);
    await expectNoHorizontalOverflow(page, `${profile.id} fullscreen story`);
    await expectMinimumTargets(story, `${profile.id} fullscreen story`);
    await expect(page).toHaveScreenshot(`student-device-fullscreen-story-${profile.id}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
      maxDiffPixelRatio: 0.01
    });
    await story.locator("summary", { hasText: "More" }).click();
    await story.getByRole("button", { name: "Exit full screen", exact: true }).click({ force: true });
    await expectFullscreenHistory(page, ["enter", "exit"], `${profile.id} story exit`);
    expect(errors, `${profile.id} fullscreen flows have no runtime errors`).toEqual([]);
  });
}
