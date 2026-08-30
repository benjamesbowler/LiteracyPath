import { expect, test } from "@playwright/test";

const GAMES = [
  "cvc-word-builder",
  "sight-word-memory",
  "blend-and-build",
  "pop-the-word",
  "word-hopscotch",
  "reading-race",
  "word-rescue",
  "sound-sort-factory",
  "letter-garden"
];

const ONBOARDING_KEYS = [
  "lp-arcade-onboarded-v1:word-rescue",
  "lp-arcade-onboarded-v1:sound-sort-factory",
  "lp-arcade-onboarded-v1:letter-garden"
];

const GAME_OBJECTS = {
  "cvc-word-builder": {
    hit: ".lg-game-letter-bank button:not([disabled])",
    surface: ".lg-game-letter-bank button:not([disabled])"
  },
  "sight-word-memory": {
    hit: ".lg-match-card:not([disabled])",
    surface: ".lg-match-card:not([disabled]) .lg-card-back",
    motion: ".lg-match-card:not([disabled]) .lg-card-back"
  },
  "blend-and-build": {
    hit: ".lg-family-board .lg-game-letter-bank button:not([disabled])",
    surface: ".lg-family-board .lg-game-letter-bank button:not([disabled])"
  },
  "pop-the-word": {
    hit: ".lg-floating-options button:not([disabled])",
    surface: ".lg-floating-options button:not([disabled])"
  },
  "word-hopscotch": {
    hit: ".lg-hop-grid button:not([disabled])",
    surface: ".lg-hop-grid button:not([disabled])"
  },
  "reading-race": {
    hit: ".lg-hop-grid button:not([disabled])",
    surface: ".lg-hop-grid button:not([disabled])"
  },
  "word-rescue": {
    hit: ".adv-choices button:not([disabled])",
    surface: ".adv-choices button:not([disabled])"
  },
  "sound-sort-factory": {
    hit: ".adv-bin:not([disabled])",
    surface: ".adv-bin:not([disabled]) .adv-bin-label",
    motion: ".adv-bin:not([disabled])"
  },
  "letter-garden": {
    hit: ".adv-letters button:not([disabled])",
    surface: ".adv-letters button:not([disabled])"
  }
};

function cssChannels(value) {
  const channels = (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  if (value.startsWith("color(") && channels.every(channel => channel <= 1)) {
    return channels.map(channel => channel * 255);
  }
  return channels;
}

function relativeLuminance(value) {
  return cssChannels(value)
    .map(channel => channel / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(foreground, background) {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
}

test("all compact practice games fill the child stage with art and reachable game objects", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.addInitScript(keys => {
    keys.forEach(key => window.localStorage.setItem(key, "1"));
  }, ONBOARDING_KEYS);

  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  for (const gameId of GAMES) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/preview/game-overlay.html?game=${gameId}&sound=0&music=0`);

    const scene = page.locator(`[data-game-scene="${gameId}"]`);
    const stage = scene.locator(":scope > .lg-game-stage");
    const art = scene.locator(":scope > .lg-illustrated-game-art img");
    const prompt = stage.locator(":scope > p:first-child");
    const objects = GAME_OBJECTS[gameId];

    await expect(scene, `${gameId} has the shared illustrated world`).toBeVisible();
    await expect(stage, `${gameId} has a separate playable stage`).toBeVisible();
    await expect(art, `${gameId} renders its owned scene art`).toBeVisible();
    await expect.poll(() => art.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);

    const layout = await scene.evaluate(element => {
      const sceneBox = element.getBoundingClientRect();
      const artBox = element.querySelector(".lg-illustrated-game-art")?.getBoundingClientRect();
      const stageBox = element.querySelector(":scope > .lg-game-stage")?.getBoundingClientRect();
      const stageChildren = [...element.querySelectorAll(":scope > .lg-game-stage > *")]
        .map(child => child.getBoundingClientRect())
        .filter(box => box.width > 0 && box.height > 0);
      const contentTop = Math.min(...stageChildren.map(box => box.top));
      const contentBottom = Math.max(...stageChildren.map(box => box.bottom));
      return {
        sceneWidth: sceneBox.width,
        sceneHeight: sceneBox.height,
        sceneBottom: sceneBox.bottom,
        artWidth: artBox?.width || 0,
        artHeight: artBox?.height || 0,
        stageWidth: stageBox?.width || 0,
        stageHeight: stageBox?.height || 0,
        contentSpan: contentBottom - contentTop,
        viewportHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        scrollHeight: document.documentElement.scrollHeight
      };
    });

    expect(layout.sceneWidth, `${gameId} uses the available stage width`).toBeGreaterThan(930);
    expect(layout.sceneHeight, `${gameId} uses the available stage height`).toBeGreaterThan(630);
    expect(layout.artWidth, `${gameId} art is large enough to read`).toBeGreaterThanOrEqual(260);
    expect(layout.artHeight, `${gameId} art is a scene rather than a thumbnail`).toBeGreaterThan(600);
    expect(layout.stageWidth, `${gameId} playfield remains the dominant action area`).toBeGreaterThan(500);
    expect(
      layout.contentSpan / layout.stageHeight,
      `${gameId} keeps content from collapsing into the middle third of the playfield`
    ).toBeGreaterThan(0.64);
    expect(layout.sceneBottom, `${gameId} stays inside the one-screen stage`).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.scrollWidth, `${gameId} has no horizontal page overflow`).toBe(layout.viewportWidth);
    expect(layout.scrollHeight, `${gameId} has no vertical page overflow`).toBe(layout.viewportHeight);

    const promptLines = await prompt.evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set(
        [...range.getClientRects()]
          .filter(rect => rect.width > 0 && rect.height > 0)
          .map(rect => Math.round(rect.top))
      ).size;
    });
    expect(promptLines, `${gameId} prompt stays within two readable lines`).toBeLessThanOrEqual(2);

    const sceneText = await scene.innerText();
    expect(sceneText, `${gameId} avoids template-style question and section labels`).not.toMatch(/\b(?:question|section)\s+0?\d+\b/i);

    const contrastPairs = await page.locator(objects.surface).evaluateAll(elements => elements
      .filter(element => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      })
      .map(element => {
        const style = getComputedStyle(element);
        return { foreground: style.color, background: style.backgroundColor };
      }));
    expect(contrastPairs.length, `${gameId} exposes visible high-contrast game objects`).toBeGreaterThan(0);
    for (const pair of contrastPairs) {
      expect(
        contrastRatio(pair.foreground, pair.background),
        `${gameId} game-object text has at least WCAG AA contrast`
      ).toBeGreaterThanOrEqual(4.5);
    }

    const promptContrast = await prompt.evaluate(element => {
      const style = getComputedStyle(element);
      return { foreground: style.color, background: style.backgroundColor };
    });
    expect(
      contrastRatio(promptContrast.foreground, promptContrast.background),
      `${gameId} prompt contrast is explicit and readable`
    ).toBeGreaterThanOrEqual(7);

    const targetSizes = await page.locator(".lg-game-player button:not([disabled])").evaluateAll(buttons => (
      buttons.map(button => {
        const box = button.getBoundingClientRect();
        return { label: button.getAttribute("aria-label") || button.textContent.trim(), width: box.width, height: box.height };
      })
    ));
    expect(targetSizes.length, `${gameId} exposes playable controls`).toBeGreaterThan(0);
    expect(
      targetSizes.filter(target => target.width < 56 || target.height < 56),
      `${gameId} keeps every game object at least 56px`
    ).toEqual([]);

    const hitTarget = page.locator(objects.hit).first();
    const motionTarget = page.locator(objects.motion || objects.hit).first();
    const beforeHover = await motionTarget.evaluate(element => {
      const style = getComputedStyle(element);
      return { transform: style.transform, filter: style.filter, shadow: style.boxShadow };
    });
    const hitBox = await hitTarget.boundingBox();
    expect(hitBox, `${gameId} exposes a pointer-reachable game object`).not.toBeNull();
    await page.mouse.move(hitBox.x + hitBox.width / 2, hitBox.y + hitBox.height / 2);
    await page.waitForTimeout(180);
    const afterHover = await motionTarget.evaluate(element => {
      const style = getComputedStyle(element);
      return { transform: style.transform, filter: style.filter, shadow: style.boxShadow };
    });
    expect(afterHover, `${gameId} game objects visibly react to pointer input`).not.toEqual(beforeHover);

    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedMotion = await motionTarget.evaluate(element => {
      const style = getComputedStyle(element);
      return { animation: style.animationName, transition: style.transitionDuration };
    });
    expect(
      reducedMotion.transition.split(",").every(duration => Number.parseFloat(duration) <= 0.001),
      `${gameId} removes tactile transitions for reduced motion`
    ).toBe(true);
    expect(await art.evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  }

  expect(pageErrors).toEqual([]);
});

test("all compact practice games remain playable at 568x320 phone landscape", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(keys => {
    keys.forEach(key => window.localStorage.setItem(key, "1"));
  }, ONBOARDING_KEYS);

  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  for (const gameId of GAMES) {
    await page.goto(`/preview/game-overlay.html?game=${gameId}&sound=0&music=0`);

    const scene = page.locator(`[data-game-scene="${gameId}"]`);
    const stage = scene.locator(":scope > .lg-game-stage");
    const header = page.locator(".lg-game-player-header");
    await expect(stage, `${gameId} keeps the literacy stage visible`).toBeVisible();

    const geometry = await page.evaluate(id => {
      const headerBox = document.querySelector(".lg-game-player-header")?.getBoundingClientRect();
      const sceneBox = document.querySelector(`[data-game-scene="${id}"]`)?.getBoundingClientRect();
      const stageBox = document.querySelector(`[data-game-scene="${id}"] > .lg-game-stage`)?.getBoundingClientRect();
      const art = document.querySelector(`[data-game-scene="${id}"] .lg-illustrated-game-art`);
      return {
        headerHeight: headerBox?.height || 0,
        sceneTop: sceneBox?.top || 0,
        stageTop: stageBox?.top || 0,
        stageBottom: stageBox?.bottom || 0,
        stageRight: stageBox?.right || 0,
        artDisplay: art ? getComputedStyle(art).display : "missing",
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight
      };
    }, gameId);

    expect(geometry.headerHeight, `${gameId} keeps compact chrome to one row`).toBeLessThanOrEqual(64);
    expect(geometry.artDisplay, `${gameId} hides decorative art instead of shrinking it to a thumbnail`).toBe("none");
    expect(geometry.sceneTop, `${gameId} scene starts below the compact header`).toBeGreaterThanOrEqual(geometry.headerHeight);
    expect(geometry.stageTop, `${gameId} stage begins inside the viewport`).toBeGreaterThanOrEqual(geometry.headerHeight);
    expect(geometry.stageBottom, `${gameId} stage ends inside the viewport`).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.stageRight, `${gameId} stage ends inside the viewport width`).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.scrollWidth, `${gameId} has no phone-landscape horizontal scroll`).toBe(geometry.viewportWidth);
    expect(geometry.scrollHeight, `${gameId} has no phone-landscape vertical scroll`).toBe(geometry.viewportHeight);

    const visibleControls = await page.locator(".lg-game-player button:not([disabled])").evaluateAll(buttons => buttons.map(button => {
      const box = button.getBoundingClientRect();
      return {
        label: button.getAttribute("aria-label") || button.textContent.trim(),
        width: box.width,
        height: box.height,
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom
      };
    }));
    expect(visibleControls.length, `${gameId} exposes phone-landscape controls`).toBeGreaterThan(0);
    expect(
      visibleControls.filter(control => (
        control.width < 56 || control.height < 56 || control.left < 0 ||
        control.top < 0 || control.right > 568 || control.bottom > 320
      )),
      `${gameId} keeps every 56px control visible and reachable at phone landscape`
    ).toEqual([]);

    const primaryObject = page.locator(GAME_OBJECTS[gameId].hit).first();
    await expect(primaryObject, `${gameId} keeps its learning action on screen`).toBeInViewport();
    await expect(header, `${gameId} keeps the shared chrome visible`).toBeInViewport();
  }

  expect(pageErrors).toEqual([]);
});
