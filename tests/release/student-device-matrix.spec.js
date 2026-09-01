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

const COMPACT_RECOMMENDATION_SURFACES = Object.freeze({
  "student-home": "student-home",
  phonics: "phonics-letter",
  arcade: "arcade",
  "adventure-map": "adventure-map",
  "reading-library": "guided-reading"
});

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

async function expectPrimaryMapDestinationLabel(surface, state) {
  const label = surface.locator(".kg-map-card--next .kg-map-card-text strong");
  await expect(label, `${state} exposes the next destination name`).toBeVisible();
  const geometry = await label.evaluate(element => ({
    text: element.textContent.trim(),
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(geometry.text, `${state} names the next destination`).not.toBe("");
  expect(
    geometry.scrollWidth,
    `${state} keeps the full next destination name visible`
  ).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

async function expectArcadeTitleContained(surface, state) {
  const geometry = await surface.evaluate(element => {
    const title = element.querySelector("[data-child-title]");
    const scrollbody = element.querySelector(".lg-arcade-scrollbody");
    const titleBox = title?.getBoundingClientRect();
    const scrollBox = scrollbody?.getBoundingClientRect();
    return {
      hasParts: Boolean(titleBox && scrollBox),
      title: title?.textContent.trim() || "",
      titleTop: titleBox?.top || 0,
      titleBottom: titleBox?.bottom || 0,
      scrollTop: scrollBox?.top || 0,
      scrollBottom: scrollBox?.bottom || 0
    };
  });
  expect(geometry.hasParts, `${state} exposes its title and internal pane`).toBe(true);
  expect(geometry.title, `${state} keeps a route title`).not.toBe("");
  expect(
    geometry.titleTop,
    `${state} keeps the full route title below the pane's top edge after focus`
  ).toBeGreaterThanOrEqual(geometry.scrollTop - 1);
  expect(
    geometry.titleBottom,
    `${state} keeps the full route title above the pane's bottom edge after focus`
  ).toBeLessThanOrEqual(geometry.scrollBottom + 1);
}

async function expectPrimaryActionInInitialPane(surface, state) {
  const geometry = await surface.evaluate(element => {
    const toBox = node => {
      if (!node) return null;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || rect.width < 1 || rect.height < 1) {
        return null;
      }
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
      };
    };
    const primaryNode = element.querySelector("[data-child-primary]");
    const cueNode = primaryNode?.querySelector("[data-child-emphasis-cue]")
      || (primaryNode?.matches("[data-child-emphasis-cue]") ? primaryNode : null);
    const main = element.closest(".kg-main") || document.querySelector(".kg-main");
    const tabbar = document.querySelector(".kg-tabbar");
    const primary = toBox(primaryNode);
    const cue = toBox(cueNode);
    const mainBox = toBox(main);
    const tabbarBox = toBox(tabbar);
    const usable = {
      left: Math.max(0, mainBox?.left ?? 0),
      top: Math.max(0, mainBox?.top ?? 0),
      right: Math.min(window.innerWidth, mainBox?.right ?? window.innerWidth),
      bottom: Math.min(
        window.innerHeight,
        mainBox?.bottom ?? window.innerHeight,
        tabbarBox?.top ?? window.innerHeight
      )
    };
    const contained = box => Boolean(box && usable)
      && box.left >= usable.left - 1
      && box.top >= usable.top - 1
      && box.right <= usable.right + 1
      && box.bottom <= usable.bottom + 1;
    return {
      primary,
      cue,
      usable,
      primaryContained: contained(primary),
      cueContained: cue ? contained(cue) : true
    };
  });
  expect(
    geometry.primaryContained,
    `${state} keeps its complete primary learning action in the initial usable pane: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.cueContained,
    `${state} keeps its complete primary action cue in the initial usable pane: ${JSON.stringify(geometry)}`
  ).toBe(true);
}

async function expectVisibleRecommendationReasons(surface, state, expectedSurface) {
  const reasons = surface.locator('[data-recommendation-explanation="child"]');
  if (expectedSurface) {
    await expect(
      reasons,
      `${state} renders its governed child recommendation reason`
    ).toHaveCount(1);
    await expect(reasons).toHaveAttribute("data-recommendation-surface", expectedSurface);
  }
  const failures = [];
  for (let index = 0; index < await reasons.count(); index += 1) {
    const result = await reasons.nth(index).evaluate(element => {
      const style = getComputedStyle(element);
      const parent = element.parentElement || element;
      const parentStyle = getComputedStyle(parent);
      const parentBox = parent.getBoundingClientRect();
      const main = element.closest(".kg-main") || document.querySelector(".kg-main");
      const mainBox = main?.getBoundingClientRect();
      const tabbarBox = document.querySelector(".kg-tabbar")?.getBoundingClientRect();
      const usable = {
        left: Math.max(0, mainBox?.left ?? 0),
        top: Math.max(0, mainBox?.top ?? 0),
        right: Math.min(window.innerWidth, mainBox?.right ?? window.innerWidth),
        bottom: Math.min(
          window.innerHeight,
          mainBox?.bottom ?? window.innerHeight,
          tabbarBox?.top ?? window.innerHeight
        )
      };
      const range = document.createRange();
      range.selectNodeContents(element);
      const textBoxes = [...range.getClientRects()].map(rect => ({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
      }));
      const contains = (container, box, tolerance = 1) => (
        box.left >= container.left - tolerance
        && box.top >= container.top - tolerance
        && box.right <= container.right + tolerance
        && box.bottom <= container.bottom + tolerance
      );
      return {
        text: element.textContent.trim(),
        visible: style.display !== "none"
          && style.visibility !== "hidden"
          && Number.parseFloat(style.opacity || "1") > 0
          && parentStyle.display !== "none"
          && parentStyle.visibility !== "hidden"
          && parentBox.width >= 1
          && parentBox.height >= 1
          && textBoxes.length > 0,
        parent: {
          left: parentBox.left,
          top: parentBox.top,
          right: parentBox.right,
          bottom: parentBox.bottom
        },
        usable,
        textBoxes,
        // Font ascent can extend a line box fractionally beyond the inline
        // parent's reported box. Two CSS pixels tolerates that raster detail,
        // while the initial-pane boundary keeps the stricter one-pixel guard.
        fullyInsideParent: textBoxes.every(box => contains(parentBox, box, 2)),
        fullyInsideInitialPane: textBoxes.every(box => contains(usable, box)),
        unoccluded: textBoxes.every(box => {
          const hit = document.elementFromPoint(
            box.left + (box.right - box.left) / 2,
            box.top + (box.bottom - box.top) / 2
          );
          return Boolean(hit)
            && (hit === element || element.contains(hit) || hit.contains(element));
        })
      };
    });
    if (
      !result.text
      || !result.visible
      || !result.fullyInsideParent
      || !result.fullyInsideInitialPane
      || !result.unoccluded
    ) {
      failures.push({ index, ...result });
    }
  }
  expect(
    failures,
    `${state} keeps every governed child recommendation reason fully visible: ${JSON.stringify(failures)}`
  ).toEqual([]);
}

async function expectCompactHollowOverlaysSeparated(surface, state) {
  const geometry = await surface.evaluate(element => {
    const box = selector => {
      const node = element.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
      };
    };
    const firstVisibleBox = selector => [...element.querySelectorAll(selector)]
      .map(node => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        if (
          style.display === "none"
          || style.visibility === "hidden"
          || rect.width < 1
          || rect.height < 1
        ) return null;
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom
        };
      })
      .find(Boolean) || null;
    const overlaps = (first, second) => Boolean(first && second)
      && first.left < second.right - 1
      && first.right > second.left + 1
      && first.top < second.bottom - 1
      && first.bottom > second.top + 1;
    const room = box(".hollow-room");
    const pageTitle = box(".hollow-title");
    const primaryCue = box(".hollow-spot-next");
    const recommendedSpot = box(".hollow-spot.recommended");
    const roomName = box(".hollow-room-name");
    const instruction = firstVisibleBox("[data-child-instruction]");
    const world = box(".hollow-world-button");
    const nextRoom = box(".hollow-room-arrow.right");
    const roomControls = [...element.querySelectorAll(".hollow-room button")]
      .map(control => {
        const rect = control.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return null;
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom
        };
      })
      .filter(Boolean);
    return {
      hasParts: Boolean(
        room && pageTitle && instruction && primaryCue && recommendedSpot && world && nextRoom
      ),
      room,
      pageTitle,
      primaryCue,
      recommendedSpot,
      roomName,
      instruction,
      world,
      nextRoom,
      primaryCueContained: Boolean(room && primaryCue)
        && primaryCue.left >= room.left - 1
        && primaryCue.right <= room.right + 1
        && primaryCue.top >= room.top - 1
        && primaryCue.bottom <= room.bottom + 1,
      instructionContained: Boolean(room && instruction)
        && instruction.left >= room.left - 1
        && instruction.right <= room.right + 1
        && instruction.top >= room.top - 1
        && instruction.bottom <= room.bottom + 1,
      instructionControlCollision: roomControls.some(control => overlaps(instruction, control)),
      overlayCollision: [
        [roomName, instruction],
        [roomName, recommendedSpot],
        [instruction, recommendedSpot],
        [instruction, primaryCue],
        [instruction, world],
        [instruction, nextRoom]
      ].some(([first, second]) => overlaps(first, second)),
      worldNextOverlap: overlaps(world, nextRoom)
    };
  });
  expect(geometry.hasParts, `${state} exposes its title, primary cue and room controls`).toBe(true);
  expect(
    geometry.overlayCollision,
    `${state} keeps room overlays clear of its placement controls: ${JSON.stringify(geometry)}`
  ).toBe(false);
  expect(
    geometry.worldNextOverlap,
    `${state} separates the World and next-room controls: ${JSON.stringify(geometry)}`
  ).toBe(false);
  expect(
    geometry.primaryCueContained,
    `${state} keeps the visible primary cue inside the room: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.instructionContained,
    `${state} keeps its visible instruction inside the room: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.instructionControlCollision,
    `${state} keeps its instruction clear of every room control: ${JSON.stringify(geometry)}`
  ).toBe(false);
}

async function expectCreatorOptionContentsContained(creator, state) {
  const options = creator.locator(".q-option");
  expect(await options.count(), `${state} exposes creator options`).toBeGreaterThan(0);
  const failures = await options.evaluateAll(nodes => nodes.flatMap((option, optionIndex) => {
    const optionBox = option.getBoundingClientRect();
    const contains = (container, box) => box.left >= container.left - 1
      && box.top >= container.top - 1
      && box.right <= container.right + 1
      && box.bottom <= container.bottom + 1;
    const optionGeometry = {
      left: optionBox.left,
      top: optionBox.top,
      right: optionBox.right,
      bottom: optionBox.bottom
    };
    return [...option.querySelectorAll([
      ":scope > .q-option-art",
      ":scope > .q-option-label",
      ":scope > .q-option-cost",
      ":scope > .q-option-art > .q-book-avatar",
      ":scope > .q-option-art > .q-book-avatar > .q-book-avatar-character"
    ].join(", "))]
      .flatMap(content => {
        const style = getComputedStyle(content);
        const contentBox = content.getBoundingClientRect();
        if (
          style.display === "none"
          || style.visibility === "hidden"
          || Number.parseFloat(style.opacity || "1") <= 0
          || contentBox.width < 1
          || contentBox.height < 1
        ) return [];
        const text = content.textContent.trim();
        const range = document.createRange();
        range.selectNodeContents(content);
        const textBoxes = text
          ? [...range.getClientRects()].map(rect => ({
              left: rect.left,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom
            }))
          : [];
        const contentGeometry = {
          left: contentBox.left,
          top: contentBox.top,
          right: contentBox.right,
          bottom: contentBox.bottom
        };
        const requiresText = content.classList.contains("q-option-label")
          || content.classList.contains("q-option-cost");
        if (
          !contains(optionGeometry, contentGeometry)
          || textBoxes.some(box => !contains(optionGeometry, box))
          || textBoxes.some(box => !contains(contentGeometry, box))
          || (requiresText && !text)
        ) {
          return [{
            optionIndex,
            optionName: option.getAttribute("aria-label") || "",
            contentClass: content.className,
            text,
            option: optionGeometry,
            content: contentGeometry,
            textBoxes
          }];
        }
        return [];
      });
  }));
  expect(
    failures,
    `${state} keeps every visible label and reward state inside its option card: ${JSON.stringify(failures)}`
  ).toEqual([]);
}

async function expectCreatorOptionRailStartsReachably(reel, state) {
  const geometry = await reel.evaluate(element => {
    const rail = element.getBoundingClientRect();
    const first = element.querySelector(":scope > .q-option")?.getBoundingClientRect();
    return {
      railLeft: rail.left,
      firstLeft: first?.left ?? null,
      scrollLeft: element.scrollLeft
    };
  });
  expect(geometry.firstLeft, `${state} exposes a first option`).not.toBeNull();
  expect(
    geometry.firstLeft,
    `${state} keeps its first option inside the reachable left edge: ${JSON.stringify(geometry)}`
  ).toBeGreaterThanOrEqual(geometry.railLeft - 1);
}

async function expectCreatorInstructionClearOfHeaderControls(surface, state) {
  const instruction = surface.locator("[data-child-instruction]");
  await expect(instruction).toBeVisible();
  const geometry = await surface.evaluate(element => {
    const instructionNode = element.querySelector("[data-child-instruction]");
    const instructionBox = instructionNode?.getBoundingClientRect();
    const overlaps = (first, second) => Boolean(first && second)
      && first.left < second.right
      && first.right > second.left
      && first.top < second.bottom
      && first.bottom > second.top;
    const visibleHeaderControls = [...element.querySelectorAll(".q-creator-music-toggle, .q-exit")]
      .filter(control => {
        const style = getComputedStyle(control);
        const box = control.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number.parseFloat(style.opacity || "1") > 0
          && box.width >= 1
          && box.height >= 1;
      });
    const serialise = box => box && ({
      left: box.left,
      top: box.top,
      right: box.right,
      bottom: box.bottom
    });
    return {
      instruction: serialise(instructionBox),
      controls: visibleHeaderControls.map(control => ({
        name: control.getAttribute("aria-label") || control.textContent.trim(),
        box: serialise(control.getBoundingClientRect())
      })),
      collisions: visibleHeaderControls
        .filter(control => overlaps(instructionBox, control.getBoundingClientRect()))
        .map(control => control.getAttribute("aria-label") || control.textContent.trim())
    };
  });
  expect(geometry.controls, `${state} exposes music and Close header controls`).toHaveLength(2);
  expect(
    geometry.collisions,
    `${state} keeps its instruction clear of visible header controls: ${JSON.stringify(geometry)}`
  ).toEqual([]);
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
      await expectPrimaryActionInInitialPane(surface, state);
      await expectVisibleRecommendationReasons(
        surface,
        state,
        COMPACT_RECOMMENDATION_SURFACES[route.id]
      );
      await expectNoHorizontalOverflow(page, state);
      await expectMinimumTargets(surface, state);
      await expectKeyboardState(page, surface, state);
      if (route.id === "student-home") await expectHomeDoorLabels(surface, state);
      if (route.id === "adventure-map") await expectPrimaryMapDestinationLabel(surface, state);
      if (route.id === "arcade" && profile.id === "small-phone-landscape") {
        await expectArcadeTitleContained(surface, state);
      }
      if (route.id === "my-hollow" && profile.id.startsWith("small-phone-")) {
        await expectCompactHollowOverlaysSeparated(surface, state);
      }
      await expect(page).toHaveScreenshot(`student-device-${route.id}-${profile.id}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        maxDiffPixelRatio: 0.01
      });
    }
  });
}

test("A3.6 Sound Seekers compact creator contains option labels and locked rewards", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/preview/child-surfaces.html?surface=sound-seekers");
  const surface = page.locator('[data-child-surface="sound-seekers"]');
  const creator = surface.locator(".q-creator");
  await expect(creator).toBeVisible();
  await waitForVisibleImages(page);
  await page.evaluate(() => document.fonts?.ready);
  await expectCreatorInstructionClearOfHeaderControls(surface, "Sound Seekers compact creator");

  const characterReel = creator.locator(".q-reel--body");
  await expect(characterReel).toBeVisible();
  await expectCreatorOptionRailStartsReachably(characterReel, "Sound Seekers Character options");
  await expectCreatorOptionContentsContained(characterReel, "Sound Seekers Character options");

  const tabs = creator.getByRole("tab");
  const tabHeights = await tabs.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
  expect(tabHeights.every(height => height >= 56), "compact creator keeps 56px tabs").toBe(true);

  const outfitsTab = creator.getByRole("tab", { name: "Outfits", exact: true });
  await outfitsTab.click();
  await expect(outfitsTab).toHaveAttribute("aria-selected", "true");
  const outfitReel = creator.locator(".q-reel--outfit");
  await expect(outfitReel).toBeVisible();
  const lockedOptions = outfitReel.locator(":scope > .q-option.is-locked");
  await expect(lockedOptions, "Outfits exposes its five locked trail rewards").toHaveCount(5);
  await expect(lockedOptions.first().locator(".q-option-cost")).toContainText("Trail reward");
  await expectCreatorOptionRailStartsReachably(outfitReel, "Sound Seekers locked Outfit options");
  await expectCreatorOptionContentsContained(outfitReel, "Sound Seekers locked Outfit options");

  const primary = creator.locator("[data-child-primary]");
  const primaryBox = await primary.boundingBox();
  expect(primaryBox?.height || 0, "compact creator keeps its 64px primary action").toBeGreaterThanOrEqual(64);
  await expectPrimaryActionInInitialPane(surface, "Sound Seekers compact creator");
});

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
    await expectPrimaryActionInInitialPane(
      page.locator('[data-child-surface="student-login"]'),
      keyboardViewport.id
    );
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
