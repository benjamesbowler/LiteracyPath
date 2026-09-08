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
    const supportsHover = await page.evaluate(() => window.matchMedia("(hover: hover)").matches);
    if (supportsHover) {
      await page.mouse.move(hitBox.x + hitBox.width / 2, hitBox.y + hitBox.height / 2);
      await page.waitForTimeout(180);
      const afterHover = await motionTarget.evaluate(element => {
        const style = getComputedStyle(element);
        return { transform: style.transform, filter: style.filter, shadow: style.boxShadow };
      });
      expect(afterHover, `${gameId} game objects visibly react to pointer hover`).not.toEqual(beforeHover);
    }

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

test("compact literacy cues stay large, visual, and balanced on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.addInitScript(keys => {
    keys.forEach(key => window.localStorage.setItem(key, "1"));
  }, ONBOARDING_KEYS);

  await page.goto("/preview/game-overlay.html?game=letter-garden&sound=0&music=0");
  const pictureCue = page.locator(".adv-word-cue img");
  await expect(pictureCue).toBeVisible();
  await expect.poll(() => pictureCue.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const pictureBounds = await pictureCue.boundingBox();
  expect(pictureBounds?.width).toBeGreaterThanOrEqual(94);
  expect(pictureBounds?.height).toBeGreaterThanOrEqual(94);

  await page.goto("/preview/game-overlay.html?game=sound-sort-factory&sound=0&music=0");
  const beltItem = page.locator(".adv-belt-item");
  const beltGeometry = await beltItem.evaluate(element => {
    const box = element.getBoundingClientRect();
    return { height: box.height, fontSize: Number.parseFloat(getComputedStyle(element).fontSize) };
  });
  expect(beltGeometry.height).toBeGreaterThanOrEqual(72);
  expect(beltGeometry.fontSize).toBeGreaterThanOrEqual(30);
  const binHeights = await page.locator(".adv-bin").evaluateAll(elements => (
    elements.map(element => element.getBoundingClientRect().height)
  ));
  expect(Math.min(...binHeights)).toBeGreaterThanOrEqual(126);

  await page.goto("/preview/game-overlay.html?game=blend-and-build&sound=0&music=0");
  const rimeHeight = await page.locator(".lg-rime-tile").evaluate(element => element.getBoundingClientRect().height);
  expect(rimeHeight).toBeGreaterThanOrEqual(64);
  expect(rimeHeight).toBeLessThanOrEqual(180);
  const optionRows = await page.locator(".lg-family-board .lg-game-letter-bank button").evaluateAll(elements => (
    elements.reduce((rows, element) => {
      const top = Math.round(element.getBoundingClientRect().top);
      rows[top] = (rows[top] || 0) + 1;
      return rows;
    }, {})
  ));
  expect(Object.values(optionRows).reduce((sum, row) => sum + row, 0)).toBeGreaterThanOrEqual(3);
});

test("the shared resume choice is readable and child-sized", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=cvc-word-builder&sound=0&music=0&resume=1");

  const resumeDialog = page.getByRole("alertdialog", { name: "Resume CVC Word Builder", exact: true });
  await expect(resumeDialog).toBeVisible();
  await expect(resumeDialog.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  for (const label of ["Continue", "Start over"]) {
    const control = resumeDialog.getByRole("button", { name: label, exact: true });
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(140);
    expect(box?.height).toBeGreaterThanOrEqual(56);
    expect(await control.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  }
});

test("Adventure first-run play controls stay child-sized in short landscape", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });

  for (const gameId of ["word-rescue", "sound-sort-factory", "letter-garden"]) {
    await page.goto(`/preview/game-overlay.html?game=${gameId}&sound=0&music=0`);
    const onboarding = page.getByRole("dialog", { name: /How to play/ });
    const start = onboarding.getByRole("button", { name: "Tap to play", exact: true });
    await expect(onboarding).toBeVisible();
    await expect(start).toBeVisible();

    const bounds = await start.boundingBox();
    expect(bounds?.width, `${gameId} first-run play width`).toBeGreaterThanOrEqual(156);
    expect(bounds?.height, `${gameId} first-run play height`).toBeGreaterThanOrEqual(56);
    expect(bounds?.y, `${gameId} first-run play top`).toBeGreaterThanOrEqual(0);
    expect((bounds?.y || 0) + (bounds?.height || 0), `${gameId} first-run play bottom`).toBeLessThanOrEqual(320);
  }
});

test("Adventure onboarding focuses and traps its sole play action", async ({ page }) => {
  await page.addInitScript(keys => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, ONBOARDING_KEYS);

  for (const gameId of ["word-rescue", "sound-sort-factory", "letter-garden"]) {
    await page.goto(`/preview/game-overlay.html?game=${gameId}&sound=0&music=0`);
    const onboarding = page.getByRole("dialog", { name: /How to play/ });
    const start = onboarding.getByRole("button", { name: "Tap to play", exact: true });
    await expect(onboarding).toBeVisible();
    await expect(start).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(start).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(start).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(onboarding).toBeHidden();
  }
});

test("Letter Garden prints its target when a sound-off picture cue fails", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-garden", "1");
  });
  await page.route("**/*", route => {
    if (route.request().url().includes("force-garden-cue-error")) return route.abort();
    return route.continue();
  });
  await page.goto("/preview/game-overlay.html?game=letter-garden&sound=0&music=0");

  const cueImage = page.locator(".adv-word-cue img");
  await expect(cueImage).toBeVisible();
  const target = (await page.locator(".adv-slots").getAttribute("aria-label"))?.match(/spell\s+(.+)$/i)?.[1];
  expect(target).toBeTruthy();
  await cueImage.evaluate(image => {
    const separator = image.src.includes("?") ? "&" : "?";
    image.src = `${image.src}${separator}force-garden-cue-error=1`;
  });

  const printedFallback = page.locator(".adv-word-cue .adv-belt-item");
  await expect(cueImage).toHaveCount(0);
  await expect(printedFallback).toBeVisible();
  await expect(printedFallback).toHaveText(target);

  await page.getByRole("button", { name: "Turn spoken audio and game sounds on" }).click();
  await expect(page.getByRole("button", { name: "Hear word", exact: true })).toBeVisible();
  await expect(printedFallback).toHaveCount(0);
});

test("Letter Garden keeps unchanged source sounds while replacing one sound to grow a labeled plant", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-garden", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-garden&sound=0&music=0");

  const slots = page.locator(".adv-slots");
  await expect(slots).toBeVisible();
  const source = (await slots.getAttribute("aria-label")).match(/^Change\s+(\w+)\s+to\s+spell\s+(\w+)$/i);
  expect(source).toBeTruthy();
  const [, sourceWord, targetWord] = source;
  expect([...sourceWord].filter((letter, index) => letter !== targetWord[index])).toHaveLength(1);
  expect((await slots.innerText()).replace(/\s+/g, "")).toBe(sourceWord);

  const changeIndex = [...sourceWord].findIndex((letter, index) => letter !== targetWord[index]);
  const changeButton = page.locator(".adv-letters button").filter({ hasText: new RegExp(`^${targetWord[changeIndex]}$`, "i") });
  await changeButton.click();
  await expect(slots).toHaveText(targetWord);
  await expect(page.locator(".adv-plant-card.grown")).toHaveCount(1);
  await expect(page.locator(".adv-garden-row")).toHaveAttribute("aria-label", "1 labeled plants grown");
});

test("Letter Garden resume keeps a later plant matched to its own word and shape", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-garden", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-garden&sound=0&music=0&resume=1");
  await page.getByRole("alertdialog").getByRole("button", { name: "Continue", exact: true }).click();

  const slots = page.locator(".adv-slots");
  const source = (await slots.getAttribute("aria-label")).match(/^Change\s+(\w+)\s+to\s+spell\s+(\w+)$/i);
  expect(source).toBeTruthy();
  const [, sourceWord, targetWord] = source;
  const changeIndex = [...sourceWord].findIndex((letter, index) => letter !== targetWord[index]);
  await page.locator(".adv-letters button").filter({ hasText: new RegExp(`^${targetWord[changeIndex]}$`, "i") }).click();

  const plants = page.locator(".adv-plant-card");
  await expect(plants.nth(1)).toHaveClass(/grown/);
  await expect(plants.nth(0)).not.toHaveClass(/grown/);
  await expect(plants.nth(1)).toHaveAttribute("aria-label", new RegExp(`${targetWord}\\s`));
  await expect(plants.nth(1)).toHaveAttribute("data-plant", /.+/);
});

test("Letter Garden cancels delayed replay on pause and deliberate Hear word", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-garden", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-garden&sound=1&music=0");
  await expect(page.getByRole("button", { name: "Hear word", exact: true })).toBeVisible({ timeout: 90_000 });
  await page.evaluate(() => {
    window.__g08WordPlays = [];
    const original = window.Howl.prototype.play;
    window.Howl.prototype.play = function (...args) {
      if (String(this._src).includes("/audio/production/")) window.__g08WordPlays.push(this._src);
      return original.apply(this, args);
    };
  });

  const slots = page.locator(".adv-slots");
  const source = (await slots.getAttribute("aria-label")).match(/^Change\s+(\w+)\s+to\s+spell\s+(\w+)$/i);
  const [, sourceWord, targetWord] = source;
  const changeIndex = [...sourceWord].findIndex((letter, index) => letter !== targetWord[index]);
  const wrongButton = page.locator(".adv-letters button").filter({ hasText: new RegExp(`^(?!${targetWord[changeIndex]}$)[a-z]$`, "i") }).first();
  await wrongButton.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => window.__g08WordPlays)).toEqual([]);
  await page.getByRole("alertdialog").getByRole("button", { name: "Keep playing", exact: true }).click();

  await page.getByRole("button", { name: "Hear word", exact: true }).click();
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => window.__g08WordPlays)).toHaveLength(1);
});

test("Word Rescue completion focuses and contains its engine-owned Play again action", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:word-rescue", "1");
  });
  await page.goto("/preview/game-overlay.html?game=word-rescue&sound=0&music=0");

  const targetCue = page.locator(".adv-rescue > .adv-belt-item");
  for (let round = 0; round < 6; round += 1) {
    const target = await targetCue.textContent();
    expect(target).toBeTruthy();
    await page.locator(".adv-choices").getByRole("button", { name: target, exact: true }).click();
    if (round < 5) {
      await expect(page.locator(".adv-bridge")).toHaveAttribute("aria-label", `${round + 1} of 6 planks built`);
      await expect(targetCue).not.toHaveText(target);
    }
  }

  const playAgain = page.getByRole("button", { name: "Play again", exact: true });
  await expect(playAgain).toBeVisible();
  await expect(playAgain).toBeFocused();
  await expect(page.locator(".lg-game-player-header")).toHaveAttribute("inert", "");

  await page.keyboard.press("Tab");
  await expect(playAgain).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(playAgain).toBeFocused();
});

test("Sight Word Memory masks face-down answers and announces revealed and matched cards", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=sight-word-memory&sound=0&music=0");

  const cards = page.locator(".lg-match-card");
  await expect(cards).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) {
    await expect(cards.nth(index)).toHaveAccessibleName(`Hidden card ${index + 1} of 6`);
    await expect(cards.nth(index).locator(".lg-card-front")).toHaveAttribute("aria-hidden", "true");
  }

  const firstWord = await cards.first().locator(".lg-card-front").textContent();
  const matchingIndexes = await cards.locator(".lg-card-front").evaluateAll((fronts, word) => (
    fronts.reduce((indexes, front, index) => {
      if (front.textContent === word) indexes.push(index);
      return indexes;
    }, [])
  ), firstWord);
  expect(matchingIndexes).toHaveLength(2);

  const firstMatch = cards.nth(matchingIndexes[0]);
  const secondMatch = cards.nth(matchingIndexes[1]);
  await firstMatch.focus();
  await page.keyboard.press("Enter");
  await expect(firstMatch).toHaveAccessibleName(
    `Revealed card ${matchingIndexes[0] + 1} of 6: ${firstWord}`
  );
  await expect(firstMatch.locator(".lg-card-front")).toHaveAttribute("aria-hidden", "false");

  await secondMatch.focus();
  await page.keyboard.press("Enter");
  await expect(firstMatch).toHaveAccessibleName(
    `Matched card ${matchingIndexes[0] + 1} of 6: ${firstWord}`
  );
  await expect(secondMatch).toHaveAccessibleName(
    `Matched card ${matchingIndexes[1] + 1} of 6: ${firstWord}`
  );
});
