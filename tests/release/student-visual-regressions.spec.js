import { expect, test } from "@playwright/test";

import { GAME_LIST } from "../../src/data/learnGamesData.js";

const SCREENSHOT_VIEWPORT = Object.freeze({ width: 1920, height: 1030 });
const COMMON_CHILD_VIEWPORT = Object.freeze({ width: 1366, height: 768 });
const MACBOOK_CHROME_VIEWPORT = Object.freeze({ width: 1470, height: 775 });
const IPAD_SAFARI_VISIBLE_VIEWPORT = Object.freeze({ width: 1194, height: 720 });
const PHONE_ARCADE_AUTHORED_CARD_MIN_PX = 210;
const ARCADE_GAMES = Object.freeze(
  GAME_LIST.filter(game => (game.surfaces || []).includes("arcade"))
);

async function expectCompleteArcadeCatalogue(root) {
  const tiles = root.locator(".lg-game-tile");
  await expect(tiles).toHaveCount(ARCADE_GAMES.length);
  await expect(tiles.locator(".lg-game-tile-name")).toHaveText(
    ARCADE_GAMES.map(game => game.title)
  );
  return tiles;
}

async function childFlowGeometry(page) {
  return page.evaluate(() => {
    const main = document.querySelector(".kg-main");
    const tabbar = document.querySelector(".kg-tabbar");
    const route = document.querySelector(".student-surface-phonics");
    const shell = document.querySelector(".phonics-tab-shell");
    const flow = document.querySelector(".kg-child-flow");
    const step = document.querySelector(".kg-child-flow__step");
    const content = document.querySelector(".kg-child-flow__content");
    const mainBox = main.getBoundingClientRect();
    const tabBox = tabbar.getBoundingClientRect();
    const contentLimit = Math.min(mainBox.bottom, tabBox.top);
    const visible = element => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && box.width > 0
        && box.height > 0;
    };
    const insideContentViewport = element => {
      const box = element.getBoundingClientRect();
      return box.top >= mainBox.top - 1 && box.bottom <= contentLimit + 1;
    };
    const containers = [main, route, shell, flow, step, content];
    const visibleControls = [...flow.querySelectorAll("button")].filter(visible);
    const visibleStepRows = [...content.children].filter(visible);

    return {
      containersDoNotScroll: containers.every(element => (
        !["auto", "scroll"].includes(getComputedStyle(element).overflowY)
      )),
      containersStayAboveTabs: [route, shell, flow, step, content].every(element => {
        const box = element.getBoundingClientRect();
        return box.top >= mainBox.top - 1 && box.bottom <= contentLimit + 1;
      }),
      controlsStayAboveTabs: visibleControls.every(insideContentViewport),
      stepRowsStayAboveTabs: visibleStepRows.every(insideContentViewport),
      mainAboveTabs: mainBox.bottom <= tabBox.top + 1,
      flowOverflowPixels: Math.max(0, flow.scrollHeight - flow.clientHeight),
      contentOverflowPixels: Math.max(0, content.scrollHeight - content.clientHeight)
    };
  });
}

test("Letters and Arcade clear the bottom navigation in the live MacBook viewport", async ({ page }) => {
  await page.setViewportSize(MACBOOK_CHROME_VIEWPORT);

  await page.goto("/preview/child-surfaces.html?surface=phonics");
  await expect(page.locator(".phonics-letter-card")).toHaveCount(26);
  const lettersGeometry = await page.evaluate(() => {
    const main = document.querySelector(".kg-main");
    const route = document.querySelector(".student-surface-phonics");
    const progress = document.querySelector(".phonics-picker-progress");
    const mainBox = main.getBoundingClientRect();
    const routeBox = route.getBoundingClientRect();
    const progressBox = progress.getBoundingClientRect();
    return {
      routeUsesMainHeight: route.clientHeight === main.clientHeight,
      routeInsideMain: routeBox.top >= mainBox.top - 1 && routeBox.bottom <= mainBox.bottom + 1,
      progressInsideMain: progressBox.bottom <= mainBox.bottom + 1,
      lettersInsideMain: [...document.querySelectorAll(".phonics-letter-card")].every(letter => (
        letter.getBoundingClientRect().bottom <= mainBox.bottom + 1
      ))
    };
  });
  expect(lettersGeometry, JSON.stringify(lettersGeometry)).toEqual({
    routeUsesMainHeight: true,
    routeInsideMain: true,
    progressInsideMain: true,
    lettersInsideMain: true
  });

  await page.goto("/preview/child-surfaces.html?surface=arcade");
  await expectCompleteArcadeCatalogue(page);
  const arcadeGeometry = await page.evaluate(() => {
    const main = document.querySelector(".kg-main");
    const route = document.querySelector(".student-surface-arcade");
    const grid = document.querySelector(".lg-game-tilegrid");
    const mainBox = main.getBoundingClientRect();
    const routeBox = route.getBoundingClientRect();
    const gridBox = grid.getBoundingClientRect();
    return {
      routeUsesMainHeight: route.clientHeight === main.clientHeight,
      routeInsideMain: routeBox.top >= mainBox.top - 1 && routeBox.bottom <= mainBox.bottom + 1,
      gridInsideMain: gridBox.bottom <= mainBox.bottom + 1,
      cardsInsideGrid: [...document.querySelectorAll(".lg-game-tile")].every(card => {
        const box = card.getBoundingClientRect();
        return box.top >= gridBox.top - 1 && box.bottom <= gridBox.bottom + 1;
      }),
      cardContentFits: [...document.querySelectorAll(".lg-game-tile")].every(card => (
        card.scrollHeight <= card.clientHeight + 1
      ))
    };
  });
  expect(arcadeGeometry, JSON.stringify(arcadeGeometry)).toEqual({
    routeUsesMainHeight: true,
    routeInsideMain: true,
    gridInsideMain: true,
    cardsInsideGrid: true,
    cardContentFits: true
  });
});

test("Character outfits are finished illustrations and the creator fits the MacBook viewport", async ({ page }) => {
  await page.setViewportSize(MACBOOK_CHROME_VIEWPORT);
  await page.goto("/preview/quest.html?sound=0&creature=showcase&adapt=0&view=creator&done=20");

  await expect(page.getByRole("heading", { name: "Change your book character" })).toBeVisible();
  await page.getByRole("tab", { name: "Outfits" }).click();
  const scarf = page.getByRole("button", { name: "Vine scarf" });
  await expect(scarf).toBeEnabled();
  await expect(scarf.locator(".q-book-avatar-character")).toHaveAttribute(
    "src",
    /\/characters\/pip\/outfit-vine-scarf\.webp$/
  );
  await expect(page.locator(".q-book-avatar-wearable")).toHaveCount(0);

  const geometry = await page.evaluate(() => {
    const creator = document.querySelector(".q-creator");
    const done = document.querySelector(".q-creator .q-primary");
    const image = document.querySelector(".q-creator-book-character .q-book-avatar-character");
    const creatorBox = creator.getBoundingClientRect();
    const doneBox = done.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    return {
      creatorFits: creator.scrollHeight <= creator.clientHeight + 1,
      doneInside: doneBox.bottom <= creatorBox.bottom + 1,
      imageInside: imageBox.top >= creatorBox.top - 1 && imageBox.bottom <= creatorBox.bottom + 1,
      doneIsFocusedAction: doneBox.width <= 361
    };
  });
  expect(geometry, JSON.stringify(geometry)).toEqual({
    creatorFits: true,
    doneInside: true,
    imageInside: true,
    doneIsFocusedAction: true
  });
});

test("the whole arcade fits a common child laptop viewport", async ({ page }) => {
  await page.setViewportSize(COMMON_CHILD_VIEWPORT);
  await page.goto("/preview/child-surfaces.html?surface=arcade");

  const grid = page.locator(".lg-game-tilegrid");
  await expectCompleteArcadeCatalogue(grid);

  const geometry = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect();
    const mainBox = rect(".kg-main");
    const route = document.querySelector(".student-surface-arcade");
    const arcade = document.querySelector(".lg-arcade");
    const gridBox = rect(".lg-game-tilegrid");
    const tabBox = rect(".kg-tabbar");
    const tileState = [...document.querySelectorAll(".lg-game-tile")].map(tile => {
      const tileBox = tile.getBoundingClientRect();
      const nameBox = tile.querySelector(".lg-game-tile-name").getBoundingClientRect();
      const footBox = tile.querySelector(".lg-game-tile-foot").getBoundingClientRect();
      return {
        insideGrid: tileBox.top >= gridBox.top - 1 && tileBox.bottom <= gridBox.bottom + 1,
        nameInside: nameBox.top >= tileBox.top && nameBox.bottom <= tileBox.bottom + 1,
        footInside: footBox.top >= tileBox.top && footBox.bottom <= tileBox.bottom + 1,
        contentFits: tile.scrollHeight <= tile.clientHeight + 1
      };
    });
    return {
      routeFits: route.scrollHeight <= route.clientHeight + 1,
      arcadeFits: arcade.scrollHeight <= arcade.clientHeight + 1,
      gridInsideMain: gridBox.bottom <= mainBox.bottom + 1,
      mainAboveTabs: mainBox.bottom <= tabBox.top + 1,
      tileState
    };
  });

  expect(geometry.routeFits, JSON.stringify(geometry)).toBe(true);
  expect(geometry.arcadeFits, JSON.stringify(geometry)).toBe(true);
  expect(geometry.gridInsideMain).toBe(true);
  expect(geometry.mainAboveTabs).toBe(true);
  expect(geometry.tileState.every(tile => (
    tile.insideGrid && tile.nameInside && tile.footInside && tile.contentFits
  ))).toBe(true);
});

test("all Letters content fits a common child laptop viewport", async ({ page }) => {
  await page.setViewportSize(COMMON_CHILD_VIEWPORT);
  await page.goto("/preview/child-surfaces.html?surface=phonics");

  const letters = page.locator(".phonics-letter-card");
  await expect(letters).toHaveCount(26);
  await expect(page.locator(".phonics-picker-progress")).toBeVisible();

  const geometry = await page.evaluate(() => {
    const main = document.querySelector(".kg-main");
    const route = document.querySelector(".student-surface-phonics");
    const shell = document.querySelector(".phonics-tab-shell");
    const picker = document.querySelector(".phonics-picker");
    const mainBox = main.getBoundingClientRect();
    const progressBox = document.querySelector(".phonics-picker-progress").getBoundingClientRect();
    const letterState = [...document.querySelectorAll(".phonics-letter-card")].map(letter => {
      const box = letter.getBoundingClientRect();
      return box.top >= mainBox.top - 1 && box.bottom <= mainBox.bottom + 1;
    });
    return {
      mainFits: main.scrollHeight <= main.clientHeight + 1,
      routeFits: route.scrollHeight <= route.clientHeight + 1,
      shellFits: shell.scrollHeight <= shell.clientHeight + 1,
      pickerFits: picker.scrollHeight <= picker.clientHeight + 1,
      progressInsideMain: progressBox.top >= mainBox.top - 1 && progressBox.bottom <= mainBox.bottom + 1,
      allLettersInsideMain: letterState.every(Boolean)
    };
  });

  expect(geometry, JSON.stringify(geometry)).toEqual({
    mainFits: true,
    routeFits: true,
    shellFits: true,
    pickerFits: true,
    progressInsideMain: true,
    allLettersInsideMain: true
  });
});

test("Explore ideas follows every selected reading level", async ({ page }) => {
  await page.setViewportSize(COMMON_CHILD_VIEWPORT);
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  await page.getByRole("button", { name: "Explore ideas" }).click();

  for (const level of ["A", "B", "C"]) {
    await page.getByRole("button", { name: `Level ${level}`, exact: true }).click();
    const panel = page.locator(".kg-knowledge");
    await expect(panel).toHaveAttribute("data-reading-level", level);
    const books = panel.locator(".kg-knowledge-book");
    await expect(books.first()).toBeVisible();
    expect(await books.count()).toBeGreaterThan(0);
    expect(await books.evaluateAll(nodes => nodes.map(node => node.dataset.bookLevel)))
      .toEqual(Array(await books.count()).fill(level));
  }
});

test("every post-selection phonics and word-building step fits the visible iPad stage", async ({ page }) => {
  await page.setViewportSize(IPAD_SAFARI_VISIBLE_VIEWPORT);
  const states = [
    { id: "letter-trace", query: "surface=phonics&step=1", launchName: "Letter K" },
    { id: "letter-listen", query: "surface=phonics&step=2", launchName: "Letter K" },
    { id: "letter-match", query: "surface=phonics&step=3", launchName: "Letter K" },
    { id: "word-hear", query: "surface=phonics&island=words&unlockWords=1&step=1", launchName: "at word nest" },
    { id: "word-build", query: "surface=phonics&island=words&unlockWords=1&step=2", launchName: "at word nest" },
    { id: "word-magic", query: "surface=phonics&island=words&unlockWords=1&step=3", launchName: "at word nest" }
  ];

  for (const state of states) {
    await page.goto(`/preview/child-surfaces.html?${state.query}`);
    await page.getByRole("button", { name: state.launchName, exact: true }).click();
    await expect(page.locator(".kg-child-flow__content")).toBeVisible();
    await page.waitForTimeout(900);

    const geometry = await childFlowGeometry(page);
    expect(geometry, `${state.id}: ${JSON.stringify(geometry)}`).toEqual({
      containersDoNotScroll: true,
      containersStayAboveTabs: true,
      controlsStayAboveTabs: true,
      stepRowsStayAboveTabs: true,
      mainAboveTabs: true,
      flowOverflowPixels: 0,
      contentOverflowPixels: expect.any(Number)
    });
    // Infinite sound-ring and focus-shadow animation can extend the scroll
    // measurement by a few decorative pixels. It must never displace content.
    expect(geometry.contentOverflowPixels, state.id).toBeLessThanOrEqual(12);

    if (state.id === "word-hear") {
      await page.getByRole("button", { name: "Sound out the word", exact: true }).click();
      const nextWord = page.getByRole("button", { name: "Next Word", exact: true });
      await expect(nextWord).toBeVisible({ timeout: 5_000 });
      const nextWordBox = await nextWord.boundingBox();
      const tabBox = await page.locator(".kg-tabbar").boundingBox();
      expect((nextWordBox?.y || 0) + (nextWordBox?.height || 0)).toBeLessThanOrEqual(
        (tabBox?.y || 0) + 1,
      );
    }
  }
});

test("the phone arcade keeps every card in the scroll flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=arcade");
  const grid = page.locator(".lg-game-tilegrid");
  await expect(grid).toBeVisible();
  const tiles = await expectCompleteArcadeCatalogue(grid);

  const geometry = await page.evaluate(() => {
    const stage = document.querySelector(".kg-stage");
    const main = document.querySelector(".kg-main");
    const grid = document.querySelector(".lg-game-tilegrid");
    const route = document.querySelector(".student-surface-arcade");
    const tiles = [...document.querySelectorAll(".lg-game-tile")];
    const gridBox = grid.getBoundingClientRect();
    const routeBox = route.getBoundingClientRect();
    const firstBox = tiles[0].getBoundingClientRect();
    const lastCard = tiles.at(-1);
    const lastBox = lastCard.getBoundingClientRect();
    const stageBox = stage.getBoundingClientRect();
    const artwork = [...document.querySelectorAll(".lg-game-tile-art img")];
    const names = [...document.querySelectorAll(".lg-game-tile-name")];
    return {
      stageScale: stage.offsetWidth > 0 ? stageBox.width / stage.offsetWidth : 1,
      authoredCardMinimum: Number.parseFloat(getComputedStyle(lastCard).minHeight) || 0,
      gridContainsCards: gridBox.top <= firstBox.top && gridBox.bottom >= lastBox.bottom - 1,
      routeScrollContainsCards: route.scrollHeight >= lastBox.bottom - routeBox.top - 1,
      mainHasIntendedScroll: ["auto", "scroll"].includes(getComputedStyle(main).overflowY)
        && main.scrollHeight > main.clientHeight + 1,
      gridHeight: gridBox.height,
      lastCardHeight: lastBox.height,
      artworkIsLoaded: artwork.length === tiles.length && artwork.every(image => {
        const box = image.getBoundingClientRect();
        return image.complete && image.naturalWidth > 0 && box.width > 0 && box.height > 0;
      }),
      namesAreVisible: names.length === tiles.length && names.every(name => {
        const box = name.getBoundingClientRect();
        return name.textContent.trim().length > 0 && box.width > 0 && box.height > 0;
      }),
      tileContentFits: tiles.every(tile => tile.scrollHeight <= tile.clientHeight + 1)
    };
  });

  expect(geometry.gridHeight).toBeGreaterThan(1000);
  expect(geometry.authoredCardMinimum).toBeGreaterThanOrEqual(PHONE_ARCADE_AUTHORED_CARD_MIN_PX);
  expect(geometry.lastCardHeight).toBeGreaterThanOrEqual(
    PHONE_ARCADE_AUTHORED_CARD_MIN_PX * geometry.stageScale - 1
  );
  expect(geometry.gridContainsCards).toBe(true);
  expect(geometry.routeScrollContainsCards).toBe(true);
  expect(geometry.mainHasIntendedScroll).toBe(true);
  expect(geometry.artworkIsLoaded).toBe(true);
  expect(geometry.namesAreVisible).toBe(true);
  expect(geometry.tileContentFits).toBe(true);

  const lastTile = tiles.last();
  await lastTile.scrollIntoViewIfNeeded();
  const lastTileVisibility = await lastTile.evaluate(element => {
    const tile = element.getBoundingClientRect();
    const main = element.closest(".kg-main");
    const mainBox = main?.getBoundingClientRect();
    const tabbarBox = document.querySelector(".kg-tabbar")?.getBoundingClientRect();
    const usable = mainBox ? {
      left: Math.max(0, mainBox.left),
      top: Math.max(0, mainBox.top),
      right: Math.min(window.innerWidth, mainBox.right),
      bottom: Math.min(window.innerHeight, mainBox.bottom, tabbarBox?.top ?? window.innerHeight)
    } : null;
    return {
      tile: { left: tile.left, top: tile.top, right: tile.right, bottom: tile.bottom },
      usable,
      fullyVisible: Boolean(usable)
        && tile.left >= usable.left - 1
        && tile.top >= usable.top - 1
        && tile.right <= usable.right + 1
        && tile.bottom <= usable.bottom + 1
    };
  });
  expect(
    lastTileVisibility.fullyVisible,
    `the last Arcade card clears the fixed navigation: ${JSON.stringify(lastTileVisibility)}`
  ).toBe(true);
});

test("the earned-coins notice is opaque and clears the navigation", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "literacyPath.guidedReadingRecords.child-surface-preview",
      JSON.stringify({ rewardPreview: { readCount: 1 } })
    );
    window.localStorage.setItem("lp-hollow-seen:child-surface-preview", "100");
  });
  await page.setViewportSize(SCREENSHOT_VIEWPORT);
  await page.goto("/preview/child-surfaces.html?surface=student-home");

  const toast = page.locator(".kid-reward-toast");
  await expect(toast).toBeVisible();
  await expect(toast).toContainText("You earned 10 coins!");
  await toast.evaluate(element => Promise.all(
    element.getAnimations().map(animation => animation.finished)
  ));

  const appearance = await page.evaluate(() => {
    const toastElement = document.querySelector(".kid-reward-toast");
    const toastBox = toastElement.getBoundingClientRect();
    const tabBox = document.querySelector(".kg-tabbar").getBoundingClientRect();
    const style = getComputedStyle(toastElement);
    return {
      background: style.backgroundColor,
      bottom: toastBox.bottom,
      clearance: tabBox.top - toastBox.bottom,
      opacity: style.opacity
    };
  });
  expect(appearance.background).toBe("rgb(255, 253, 248)");
  expect(appearance.opacity).toBe("1");
  expect(appearance.clearance).toBeGreaterThanOrEqual(8);
});

test("Sound Seekers world maps move gently and respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/child-surfaces.html?surface=sound-seekers");
  const creatorStart = page.getByRole("button", { name: "Start my adventure", exact: true });
  if (await creatorStart.isVisible()) {
    await creatorStart.click();
  } else {
    await page.getByRole("button", { name: "Go to Hollow Tree" }).click();
    await page.getByRole("button", { name: "Start my adventure", exact: true }).click();
  }
  await page.getByRole("button", { name: "Back to the map" }).click();

  const ambientPieces = page.locator(".q-map-v2-ambient > i");
  await expect(ambientPieces).toHaveCount(6);
  await expect(page.locator(".q-map-ambient-flow")).toBeVisible();

  const animationNames = await ambientPieces.evaluateAll(elements => (
    elements.map(element => getComputedStyle(element).animationName)
  ));
  expect(animationNames.every(name => name !== "none")).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => ambientPieces.evaluateAll(elements => (
    elements.map(element => getComputedStyle(element).animationName)
  ))).toEqual(["none", "none", "none", "none", "none", "none"]);
});
