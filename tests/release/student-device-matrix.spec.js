import { expect, test } from "@playwright/test";

import { CHILD_SURFACE_ROUTES } from "../../src/policy/childSurfaceRules.js";
import {
  STUDENT_DEVICE_PROFILES,
  STUDENT_FULLSCREEN_DEVICE_IDS,
  STUDENT_MINIMUM_TARGET_PX,
  STUDENT_SOFTWARE_KEYBOARD_VIEWPORTS
} from "../../src/policy/studentDeviceMatrix.js";
import { expectVisibleImagesReady } from "./support/visualReadiness.js";

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

async function readTabletMapDestinationLabelFailures(surface) {
  const labels = surface.locator(".kg-map-card .kg-map-card-text strong");
  return labels.evaluateAll(nodes => nodes.flatMap((label, labelIndex) => {
    const card = label.closest(".kg-map-card");
    const labelRect = label.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const toBox = box => ({
      left: box.left,
      top: box.top,
      right: box.right,
      bottom: box.bottom
    });
    const labelBox = toBox(labelRect);
    const cardBox = toBox(cardRect);
    const range = document.createRange();
    range.selectNodeContents(label);
    const textBoxes = [...range.getClientRects()]
      .filter(box => box.width >= 1 && box.height >= 1)
      .map(toBox);
    const contains = (container, box) => box.left >= container.left - 1
      && box.top >= container.top - 1
      && box.right <= container.right + 1
      && box.bottom <= container.bottom + 1;
    const complete = label.scrollWidth <= label.clientWidth + 1
      && label.scrollHeight <= label.clientHeight + 1
      && textBoxes.length > 0
      && textBoxes.every(box => contains(labelBox, box) && contains(cardBox, box));
    return complete
      ? []
      : [{
          labelIndex,
          text: label.textContent.trim(),
          label: {
            ...labelBox,
            clientWidth: label.clientWidth,
            scrollWidth: label.scrollWidth,
            clientHeight: label.clientHeight,
            scrollHeight: label.scrollHeight
          },
          card: cardBox,
          textBoxes
        }];
  }));
}

async function expectTabletMapDestinationLabels(surface, state) {
  const labels = surface.locator(".kg-map-card .kg-map-card-text strong");
  await expect(labels, `${state} exposes all four visible route names`).toHaveCount(4);
  await expect(labels).toHaveText(["Farm Gate", "Carrot Patch", "Duck Pond", "Apple Orchard"]);
  const failures = await readTabletMapDestinationLabelFailures(surface);
  expect(
    failures,
    `${state} keeps every route name complete inside its map card: ${JSON.stringify(failures)}`
  ).toEqual([]);
}

async function readPhonicsRecommendationGeometry(surface) {
  return surface.locator(".phonics-letter-card.recommended").evaluate(card => {
    const cue = card.querySelector(".phonics-letter-next");
    const status = card.querySelector(".phonics-letter-status");
    const visual = status.firstElementChild;
    const cardBox = card.getBoundingClientRect();
    const cueBox = cue.getBoundingClientRect();
    let statusBox;
    if (visual) {
      statusBox = visual.getBoundingClientRect();
    } else {
      const range = document.createRange();
      range.selectNodeContents(status);
      const boxes = [...range.getClientRects()];
      statusBox = boxes.length > 0
        ? {
            left: Math.min(...boxes.map(box => box.left)),
            top: Math.min(...boxes.map(box => box.top)),
            right: Math.max(...boxes.map(box => box.right)),
            bottom: Math.max(...boxes.map(box => box.bottom))
          }
        : status.getBoundingClientRect();
    }
    const toBox = box => ({
      left: box.left,
      top: box.top,
      right: box.right,
      bottom: box.bottom,
      width: box.right - box.left,
      height: box.bottom - box.top
    });
    const cardGeometry = toBox(cardBox);
    const cueGeometry = toBox(cueBox);
    const statusGeometry = toBox(statusBox);
    const contains = box => box.left >= cardGeometry.left - 1
      && box.top >= cardGeometry.top - 1
      && box.right <= cardGeometry.right + 1
      && box.bottom <= cardGeometry.bottom + 1;
    const horizontalGap = Math.max(
      cueGeometry.left - statusGeometry.right,
      statusGeometry.left - cueGeometry.right,
      0
    );
    const verticalGap = Math.max(
      cueGeometry.top - statusGeometry.bottom,
      statusGeometry.top - cueGeometry.bottom,
      0
    );
    const intersectionWidth = Math.max(
      0,
      Math.min(cueGeometry.right, statusGeometry.right)
        - Math.max(cueGeometry.left, statusGeometry.left)
    );
    const intersectionHeight = Math.max(
      0,
      Math.min(cueGeometry.bottom, statusGeometry.bottom)
        - Math.max(cueGeometry.top, statusGeometry.top)
    );
    return {
      card: cardGeometry,
      cue: cueGeometry,
      status: statusGeometry,
      cueContained: contains(cueGeometry),
      statusContained: contains(statusGeometry),
      separation: Math.hypot(horizontalGap, verticalGap),
      overlapArea: intersectionWidth * intersectionHeight
    };
  });
}

async function expectPhonicsRecommendationClear(surface, state) {
  const primary = surface.locator(".phonics-letter-card.recommended");
  await expect(primary, `${state} exposes one recommended letter`).toHaveCount(1);
  await expect(
    primary.locator(".phonics-letter-next"),
    `${state} exposes one Start here cue`
  ).toHaveCount(1);
  await expect(
    primary.locator(".phonics-letter-status"),
    `${state} exposes one recommendation status visual`
  ).toHaveCount(1);
  const geometry = await readPhonicsRecommendationGeometry(surface);
  expect(
    geometry.cueContained && geometry.statusContained,
    `${state} contains the recommendation cue and status visual: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.overlapArea,
    `${state} keeps status decoration off its Start here cue: ${JSON.stringify(geometry)}`
  ).toBe(0);
  expect(
    geometry.separation,
    `${state} leaves at least 4px between status and recommendation visuals: ${JSON.stringify(geometry)}`
  ).toBeGreaterThanOrEqual(4);
}

async function headingTextFragmentFailures(surface) {
  return surface.locator("[data-child-title]").evaluateAll(headings => (
    headings.flatMap((heading, headingIndex) => {
      const style = getComputedStyle(heading);
      const headingRect = heading.getBoundingClientRect();
      if (
        style.display === "none"
        || style.visibility === "hidden"
        || headingRect.width < 1
        || headingRect.height < 1
      ) return [];
      const headingBox = {
        left: headingRect.left,
        top: headingRect.top,
        right: headingRect.right,
        bottom: headingRect.bottom,
        clientWidth: heading.clientWidth,
        scrollWidth: heading.scrollWidth,
        clientHeight: heading.clientHeight,
        scrollHeight: heading.scrollHeight
      };
      const range = document.createRange();
      range.selectNodeContents(heading);
      const textBoxes = [...range.getClientRects()]
        .filter(box => box.width >= 1 && box.height >= 1)
        .map(box => ({
          left: box.left,
          top: box.top,
          right: box.right,
          bottom: box.bottom,
          height: box.height
        }));
      // Range boxes include the font's reserved ascent/descent, which can sit
      // outside a healthy CSS line box. Map Canvas's actual glyph ink into the
      // rendered Range geometry so normal font reserve passes while even a
      // small amount of truly clipped letterform ink fails.
      const context = document.createElement("canvas").getContext("2d");
      context.font = style.font;
      const metrics = context.measureText(heading.textContent.trim());
      const fontMetricHeight = metrics.fontBoundingBoxAscent
        + metrics.fontBoundingBoxDescent;
      const metricsValid = [
        metrics.fontBoundingBoxAscent,
        metrics.fontBoundingBoxDescent,
        metrics.actualBoundingBoxAscent,
        metrics.actualBoundingBoxDescent
      ].every(Number.isFinite) && fontMetricHeight > 0;
      const inkBoxes = metricsValid
        ? textBoxes.map(box => {
            const scaleY = box.height / fontMetricHeight;
            const baseline = box.top + (metrics.fontBoundingBoxAscent * scaleY);
            return {
              left: box.left,
              top: baseline - (metrics.actualBoundingBoxAscent * scaleY),
              right: box.right,
              bottom: baseline + (metrics.actualBoundingBoxDescent * scaleY)
            };
          })
        : [];
      const pixelTolerance = 1;
      // Glyph ink is allowed to paint beyond a CSS line box when overflow is
      // visible. Linux's Press Start 2P metrics do exactly that without losing
      // a pixel. Judge vertical visibility against the boxes that can actually
      // clip the paint (plus the viewport), not the heading's own line box.
      const verticalClipBoxes = [];
      let clippingAncestor = heading;
      while (clippingAncestor) {
        const clippingStyle = getComputedStyle(clippingAncestor);
        if (["auto", "clip", "hidden", "scroll"].includes(clippingStyle.overflowY)) {
          const clippingRect = clippingAncestor.getBoundingClientRect();
          // Overflow clips at the padding edge. getBoundingClientRect() is the
          // outer border box, so using it directly can miss a few hidden glyph
          // pixels on bordered containers such as the Arcade header. Client
          // metrics are untransformed layout pixels, so map them into the same
          // rendered coordinate space as Range and bounding-client rectangles.
          const measuredScaleY = clippingAncestor.offsetHeight > 0
            ? clippingRect.height / clippingAncestor.offsetHeight
            : 1;
          const scaleY = Number.isFinite(measuredScaleY) && measuredScaleY > 0
            ? measuredScaleY
            : 1;
          const clippingTop = clippingRect.top + (clippingAncestor.clientTop * scaleY);
          verticalClipBoxes.push({
            element: clippingAncestor === heading
              ? "heading"
              : clippingAncestor.className || clippingAncestor.tagName.toLowerCase(),
            top: clippingTop,
            bottom: clippingTop + (clippingAncestor.clientHeight * scaleY)
          });
        }
        clippingAncestor = clippingAncestor.parentElement;
      }
      verticalClipBoxes.push({ element: "viewport", top: 0, bottom: window.innerHeight });
      const horizontallyContained = box => (
        box.left >= headingBox.left - 1
        && box.right <= headingBox.right + 1
      );
      const verticallyContained = box => verticalClipBoxes.every(clipBox => (
        box.top >= clipBox.top - pixelTolerance
        && box.bottom <= clipBox.bottom + pixelTolerance
      ));
      const contentFits = heading.scrollWidth <= heading.clientWidth + pixelTolerance;
      return heading.textContent.trim()
        && textBoxes.length > 0
        && metricsValid
        && textBoxes.every(horizontallyContained)
        && inkBoxes.every(verticallyContained)
        && contentFits
        ? []
        : [{
            headingIndex,
            text: heading.textContent.trim(),
            heading: headingBox,
            textBoxes,
            inkBoxes,
            verticalClipBoxes,
            metricsValid,
            pixelTolerance
          }];
    })
  ));
}

async function expectHeadingTextFragmentsContained(surface, state) {
  const failures = await headingTextFragmentFailures(surface);
  expect(
    failures,
    `${state} keeps every visible heading text fragment inside its title box: ${JSON.stringify(failures)}`
  ).toEqual([]);
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

async function expectCompactArcadeTabsClear(surface, state) {
  const tabs = surface.locator(".lg-arcade-tab");
  await expect(tabs, `${state} exposes both game collections`).toHaveCount(2);
  const geometry = await tabs.evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    const box = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    const range = document.createRange();
    range.selectNodeContents(node);
    const textBoxes = [...range.getClientRects()].map(textBox => ({
      left: textBox.left,
      top: textBox.top,
      right: textBox.right,
      bottom: textBox.bottom
    }));
    const contains = textBox => textBox.left >= box.left - 1
      && textBox.top >= box.top - 1
      && textBox.right <= box.right + 1
      && textBox.bottom <= box.bottom + 1;
    return {
      text: node.textContent.trim(),
      box,
      width: rect.width,
      height: rect.height,
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
      textBoxes,
      textContained: textBoxes.length > 0 && textBoxes.every(contains)
    };
  }));
  expect(
    geometry.every(tab => tab.text && tab.width >= 56 && tab.height >= 56 && tab.textContained),
    `${state} keeps both collection labels inside 56px controls: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.every(tab => tab.scrollWidth <= tab.clientWidth + 1
      && tab.scrollHeight <= tab.clientHeight + 1),
    `${state} keeps complete collection labels visible: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    Math.max(...geometry.map(tab => tab.box.top)) - Math.min(...geometry.map(tab => tab.box.top)),
    `${state} keeps both collection controls in one row: ${JSON.stringify(geometry)}`
  ).toBeLessThanOrEqual(1);
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

async function expectCreatorTabLabelsClear(tabs, state) {
  const geometry = await tabs.evaluateAll(nodes => {
    const toBox = rect => ({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    });
    const labels = nodes.map(node => {
      const tab = toBox(node.getBoundingClientRect());
      const range = document.createRange();
      range.selectNodeContents(node);
      const textBoxes = [...range.getClientRects()]
        .filter(box => box.width >= 1 && box.height >= 1)
        .map(toBox);
      const text = textBoxes.length > 0
        ? {
            left: Math.min(...textBoxes.map(box => box.left)),
            top: Math.min(...textBoxes.map(box => box.top)),
            right: Math.max(...textBoxes.map(box => box.right)),
            bottom: Math.max(...textBoxes.map(box => box.bottom))
          }
        : null;
      const clippingBoxes = [{
        element: "viewport",
        clipsX: true,
        clipsY: true,
        box: { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
      }];
      let clippingAncestor = node;
      while (clippingAncestor) {
        const style = getComputedStyle(clippingAncestor);
        const clipsX = ["auto", "clip", "hidden", "scroll"].includes(style.overflowX);
        const clipsY = ["auto", "clip", "hidden", "scroll"].includes(style.overflowY);
        if (clipsX || clipsY) {
          const rect = clippingAncestor.getBoundingClientRect();
          const measuredScaleX = clippingAncestor.offsetWidth > 0
            ? rect.width / clippingAncestor.offsetWidth
            : 1;
          const measuredScaleY = clippingAncestor.offsetHeight > 0
            ? rect.height / clippingAncestor.offsetHeight
            : 1;
          const scaleX = Number.isFinite(measuredScaleX) && measuredScaleX > 0
            ? measuredScaleX
            : 1;
          const scaleY = Number.isFinite(measuredScaleY) && measuredScaleY > 0
            ? measuredScaleY
            : 1;
          const left = rect.left + (clippingAncestor.clientLeft * scaleX);
          const top = rect.top + (clippingAncestor.clientTop * scaleY);
          clippingBoxes.push({
            element: clippingAncestor === node
              ? "tab"
              : clippingAncestor.className || clippingAncestor.tagName.toLowerCase(),
            clipsX,
            clipsY,
            box: {
              left,
              top,
              right: left + (clippingAncestor.clientWidth * scaleX),
              bottom: top + (clippingAncestor.clientHeight * scaleY)
            }
          });
        }
        clippingAncestor = clippingAncestor.parentElement;
      }
      const unclipped = textBoxes.length > 0 && textBoxes.every(box => (
        clippingBoxes.every(clip => (
          (!clip.clipsX || (
            box.left >= clip.box.left - 1
            && box.right <= clip.box.right + 1
          ))
          && (!clip.clipsY || (
            box.top >= clip.box.top - 1
            && box.bottom <= clip.box.bottom + 1
          ))
        ))
      ));
      return {
        label: node.textContent.trim(),
        tab,
        text,
        textBoxes,
        clippingBoxes,
        unclipped
      };
    });
    return labels.map((label, index) => {
      const previousTab = labels[index - 1]?.tab;
      const nextTab = labels[index + 1]?.tab;
      const horizontalBounds = {
        left: previousTab?.right ?? label.tab.left - 1,
        right: nextTab?.left ?? label.tab.right + 1
      };
      return {
        ...label,
        clearOfAdjacentTabs: label.textBoxes.length > 0 && label.textBoxes.every(box => (
          box.left >= horizontalBounds.left
          && box.right <= horizontalBounds.right
          && box.top >= label.tab.top - 1
          && box.bottom <= label.tab.bottom + 1
        )),
        gapToNext: index < labels.length - 1 && label.text && labels[index + 1].text
          ? labels[index + 1].text.left - label.text.right
          : null
      };
    });
  });
  expect(geometry, `${state} exposes all five creator tab labels`).toHaveLength(5);
  expect(
    geometry.filter(label => !label.clearOfAdjacentTabs),
    `${state} keeps tab-label ink out of adjacent controls: ${JSON.stringify(geometry)}`
  ).toEqual([]);
  expect(
    geometry.filter(label => !label.unclipped),
    `${state} keeps every tab label visible through all clipping boundaries: ${JSON.stringify(geometry)}`
  ).toEqual([]);
  expect(
    geometry.filter(label => label.gapToNext !== null && label.gapToNext < 2),
    `${state} keeps adjacent tab labels visually separate: ${JSON.stringify(geometry)}`
  ).toEqual([]);
}

async function expectLibraryHeaderControlsClear(surface, state) {
  const geometry = await surface.evaluate(element => {
    const controls = [...element.querySelectorAll(".kg-books-head button")]
      .filter(control => {
        const style = getComputedStyle(control);
        const box = control.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && box.width >= 1
          && box.height >= 1;
      });
    const toBox = node => {
      const box = node.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
    };
    const contains = (container, box) => box.left >= container.left - 1
      && box.top >= container.top - 1
      && box.right <= container.right + 1
      && box.bottom <= container.bottom + 1;
    const overlaps = (first, second) => first.left < second.right
      && first.right > second.left
      && first.top < second.bottom
      && first.bottom > second.top;
    const summaries = controls.map(control => {
      const box = toBox(control);
      const range = document.createRange();
      range.selectNodeContents(control);
      const contentBoxes = [...range.getClientRects()]
        .filter(contentBox => contentBox.width >= 1 && contentBox.height >= 1)
        .map(contentBox => ({
          left: contentBox.left,
          top: contentBox.top,
          right: contentBox.right,
          bottom: contentBox.bottom
        }));
      return {
        name: control.textContent.trim(),
        box,
        contentBoxes,
        width: box.right - box.left,
        height: box.bottom - box.top,
        contentContained: contentBoxes.length > 0
          && contentBoxes.every(contentBox => contains(box, contentBox))
      };
    });
    const collisions = [];
    for (let firstIndex = 0; firstIndex < summaries.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < summaries.length; secondIndex += 1) {
        if (overlaps(summaries[firstIndex].box, summaries[secondIndex].box)) {
          collisions.push([summaries[firstIndex].name, summaries[secondIndex].name]);
        }
      }
    }
    return {
      controls: summaries,
      failures: summaries.filter(control => (
        control.width < 56
        || control.height < 56
        || !control.contentContained
      )),
      collisions
    };
  });
  expect(geometry.controls.length, `${state} exposes its reading filters`).toBeGreaterThanOrEqual(6);
  expect(
    geometry.failures,
    `${state} keeps every filter label and icon inside its 56px+ control: ${JSON.stringify(geometry.failures)}`
  ).toEqual([]);
  expect(
    geometry.collisions,
    `${state} keeps reading filters from overlapping: ${JSON.stringify(geometry.collisions)}`
  ).toEqual([]);
}

async function expectLibraryBookCopyReadable(surface, state) {
  const failures = await surface.locator(".kg-shelf-grid .kg-book-card:not(.kg-book-card--more)")
    .evaluateAll(cards => cards.flatMap((card, cardIndex) => {
      const main = card.querySelector(".kg-book-card-main");
      const cover = card.querySelector(".kg-book-cover");
      const title = card.querySelector(".kg-book-title");
      const purpose = card.querySelector(".kg-book-purpose");
      const stars = card.querySelector(".kg-book-stars");
      const toBox = node => {
        const box = node?.getBoundingClientRect();
        return box && ({ left: box.left, top: box.top, right: box.right, bottom: box.bottom });
      };
      const cardBox = toBox(card);
      const mainBox = toBox(main);
      const coverBox = toBox(cover);
      const titleBox = toBox(title);
      const purposeBox = toBox(purpose);
      const starsBox = toBox(stars);
      const contains = (container, box) => Boolean(container && box)
        && box.left >= container.left - 1
        && box.top >= container.top - 1
        && box.right <= container.right + 1
        && box.bottom <= container.bottom + 1;
      const containsTextInk = (container, box) => Boolean(container && box)
        && box.left >= container.left - 1
        && box.right <= container.right + 1
        // Production display-font ink can extend four pixels beyond its CSS
        // line box without being clipped; card containment remains strict.
        && box.top >= container.top - 4
        && box.bottom <= container.bottom + 4;
      const textBoxes = node => {
        if (!node) return [];
        const range = document.createRange();
        range.selectNodeContents(node);
        return [...range.getClientRects()].map(box => ({
          left: box.left,
          top: box.top,
          right: box.right,
          bottom: box.bottom
        }));
      };
      const titleTextBoxes = textBoxes(title);
      const visibleTitleTextBoxes = titleTextBoxes.filter(box => (
        titleBox && box.bottom > titleBox.top && box.top < titleBox.bottom
      ));
      const purposeTextBoxes = textBoxes(purpose);
      const isPainted = node => {
        if (!node) return false;
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return node.textContent.trim().length > 0
          && style.display !== "none"
          && style.visibility !== "hidden"
          && Number.parseFloat(style.opacity || "1") > 0
          && style.color !== "rgba(0, 0, 0, 0)"
          && box.width >= 1
          && box.height >= 1;
      };
      const readable = Boolean(
        isPainted(title)
        && isPainted(purpose)
        && visibleTitleTextBoxes.length > 0
        && purposeTextBoxes.length > 0
      )
        && title.scrollWidth <= title.clientWidth + 1
        && purpose.scrollWidth <= purpose.clientWidth + 1
        && visibleTitleTextBoxes.every(box => containsTextInk(titleBox, box))
        && purposeTextBoxes.every(box => containsTextInk(purposeBox, box));
      const contentContained = [mainBox, coverBox, titleBox, purposeBox]
        .every(box => contains(cardBox, box));
      const retiredQuizStarsAbsent = stars === null;
      if (readable && contentContained && retiredQuizStarsAbsent && main.scrollWidth <= main.clientWidth + 1) return [];
      return [{
        cardIndex,
        title: title.textContent.trim(),
        card: cardBox,
        main: { ...mainBox, clientWidth: main.clientWidth, scrollWidth: main.scrollWidth },
        titleBox: { ...titleBox, clientWidth: title.clientWidth, scrollWidth: title.scrollWidth },
        purposeBox: { ...purposeBox, clientWidth: purpose.clientWidth, scrollWidth: purpose.scrollWidth },
        stars: starsBox,
        visibleTitleTextBoxes,
        purposeTextBoxes,
        readable,
        contentContained,
        retiredQuizStarsAbsent
      }];
    }));
  expect(
    failures,
    `${state} keeps every visible book title and reading-help label readable inside its card: ${JSON.stringify(failures)}`
  ).toEqual([]);
}

async function expectFocusedControlFullyRevealed(control, state, { focusControl = true } = {}) {
  const tabIndex = await control.evaluate(element => element.tabIndex);
  expect(
    tabIndex,
    `${state} remains in sequential keyboard navigation`
  ).toBeGreaterThanOrEqual(0);
  if (focusControl) {
    await control.evaluate(element => {
      let ancestor = element.parentElement;
      while (ancestor) {
        const overflowX = getComputedStyle(ancestor).overflowX;
        if (/(auto|scroll)/.test(overflowX)) ancestor.scrollLeft = 0;
        ancestor = ancestor.parentElement;
      }
      // Suppress Chromium's automatic focus scroll so the assertion exercises
      // the app's focus-aware rail behaviour, including nested phone rails.
      element.focus({ preventScroll: true });
    });
  }
  await expect(control, `${state} receives keyboard focus`).toBeFocused();

  const readGeometry = () => control.evaluate(element => {
    const toBox = rect => ({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    });
    const target = toBox(element.getBoundingClientRect());
    const style = getComputedStyle(element);
    const outlineWidth = Number.parseFloat(style.outlineWidth) || 0;
    const outlineOffset = Number.parseFloat(style.outlineOffset) || 0;
    const expectedOutlineColor = element.matches(".kg-segment.is-active")
      ? "rgb(255, 255, 255)"
      : "rgb(32, 66, 58)";
    const focusRingOutset = element.matches(":focus-visible")
      ? Math.max(0, outlineWidth + outlineOffset)
      : 0;
    const paintedFocus = {
      left: target.left - focusRingOutset,
      top: target.top - focusRingOutset,
      right: target.right + focusRingOutset,
      bottom: target.bottom + focusRingOutset
    };
    const clips = [{
      name: "viewport",
      clipsX: true,
      clipsY: true,
      box: { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
    }];
    let ancestor = element.parentElement;
    while (ancestor) {
      const style = getComputedStyle(ancestor);
      const clipsX = /(auto|hidden|scroll|clip)/.test(style.overflowX);
      const clipsY = /(auto|hidden|scroll|clip)/.test(style.overflowY);
      if (clipsX || clipsY) {
        clips.push({
          name: ancestor.className || ancestor.tagName,
          clipsX,
          clipsY,
          box: toBox(ancestor.getBoundingClientRect())
        });
      }
      ancestor = ancestor.parentElement;
    }
    const failures = clips.filter(clip => (
      (clip.clipsX && (
        paintedFocus.left < clip.box.left - 1
        || paintedFocus.right > clip.box.right + 1
      ))
      || (clip.clipsY && (
        paintedFocus.top < clip.box.top - 1
        || paintedFocus.bottom > clip.box.bottom + 1
      ))
    ));
    return {
      target,
      paintedFocus,
      focusRingOutset,
      outlineStyle: style.outlineStyle,
      outlineWidth,
      outlineColor: style.outlineColor,
      expectedOutlineColor,
      clips,
      failures
    };
  });

  await expect.poll(async () => (await readGeometry()).failures.length, {
    message: `${state} becomes fully visible inside the viewport and every clipping ancestor`
  }).toBe(0);
  const geometry = await readGeometry();
  expect(
    geometry.failures,
    `${state} is not partially clipped after focus: ${JSON.stringify(geometry)}`
  ).toEqual([]);
  expect(geometry.outlineStyle, `${state} paints a keyboard outline`).not.toBe("none");
  expect(geometry.outlineWidth, `${state} keeps a 3px keyboard outline`).toBeGreaterThanOrEqual(3);
  expect(
    geometry.outlineColor,
    `${state} uses the high-contrast Reading focus color: ${JSON.stringify(geometry)}`
  ).toBe(geometry.expectedOutlineColor);
  return geometry;
}

async function expectLibraryPortraitShelves(surface, state, expectedRowCount) {
  const geometry = await surface.evaluate(element => {
    const serialise = rect => ({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    });
    const overlaps = (first, second) => first.left < second.right - 1
      && first.right > second.left + 1
      && first.top < second.bottom - 1
      && first.bottom > second.top + 1;
    const tabbar = document.querySelector(".kg-tabbar")?.getBoundingClientRect();
    const shelves = [...element.querySelectorAll(".kg-shelf-grid")].map((grid, shelfIndex) => {
      const gridBox = serialise(grid.getBoundingClientRect());
      const gridStyle = getComputedStyle(grid);
      const cards = [...grid.querySelectorAll(":scope > .kg-book-card")].map((card, cardIndex) => {
        const cardBox = serialise(card.getBoundingClientRect());
        const contentLeft = cardBox.left - gridBox.left + grid.scrollLeft;
        const textFailures = [...card.querySelectorAll(".kg-book-title, .kg-book-purpose")]
          .flatMap(textNode => {
            const range = document.createRange();
            range.selectNodeContents(textNode);
            const boxes = [...range.getClientRects()]
              .filter(box => box.width >= 1 && box.height >= 1)
              .map(serialise);
            return boxes.some(box => (
              box.left < cardBox.left - 1
              || box.right > cardBox.right + 1
              || box.top < cardBox.top - 1
              || box.bottom > cardBox.bottom + 1
            )) ? [{ text: textNode.textContent.trim(), boxes }] : [];
          });
        return {
          cardIndex,
          name: card.textContent.trim(),
          box: cardBox,
          contentLeft,
          offsetWidth: card.offsetWidth,
          height: cardBox.height,
          textFailures,
          verticallyInsideGrid: cardBox.top >= gridBox.top - 1
            && cardBox.bottom <= gridBox.bottom + 1,
          insideScrollableWidth: contentLeft >= -1
            && contentLeft + card.offsetWidth <= grid.scrollWidth + 1,
          aboveTabbar: !tabbar || cardBox.bottom <= tabbar.top + 1
        };
      });
      const collisions = [];
      for (let first = 0; first < cards.length; first += 1) {
        for (let second = first + 1; second < cards.length; second += 1) {
          if (overlaps(cards[first].box, cards[second].box)) {
            collisions.push([cards[first].name, cards[second].name]);
          }
        }
      }
      return {
        shelfIndex,
        box: gridBox,
        overflowY: gridStyle.overflowY,
        clientHeight: grid.clientHeight,
        scrollHeight: grid.scrollHeight,
        rowTops: [...new Set(cards.map(card => Math.round(card.box.top)))],
        cards,
        collisions
      };
    });
    return {
      shelves,
      route: {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight
      },
      page: {
        viewportHeight: window.innerHeight,
        scrollHeight: document.documentElement.scrollHeight
      }
    };
  });

  expect(
    geometry.shelves.length,
    `${state} keeps both governed reading shelves mounted`
  ).toBe(2);
  expect(
    geometry.shelves.map(shelf => shelf.cards.length),
    `${state} keeps the complete eight-choice preview in each shelf`
  ).toEqual([8, 8]);
  const failures = geometry.shelves.flatMap(shelf => {
    const cardFailures = shelf.cards.filter(card => (
      card.box.width < 56
      || card.height < 56
      || !card.verticallyInsideGrid
      || !card.insideScrollableWidth
      || !card.aboveTabbar
      || card.textFailures.length > 0
    ));
    return shelf.collisions.length > 0
      || shelf.scrollHeight > shelf.clientHeight + 1
      || shelf.rowTops.length !== expectedRowCount
      || cardFailures.length > 0
      ? [{ ...shelf, cardFailures }]
      : [];
  });
  expect(
    failures,
    `${state} uses ${expectedRowCount} non-overlapping 56px horizontal shelf row(s) with no hidden vertical content: ${JSON.stringify(failures)}`
  ).toEqual([]);
  expect(
    geometry.route.scrollHeight,
    `${state} keeps the Reading Library route free of a child-page scrollbar: ${JSON.stringify(geometry.route)}`
  ).toBeLessThanOrEqual(geometry.route.clientHeight + 1);
  expect(
    geometry.page.scrollHeight,
    `${state} stays inside the shortened visual viewport: ${JSON.stringify(geometry.page)}`
  ).toBeLessThanOrEqual(geometry.page.viewportHeight + 1);
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
  await expectVisibleImagesReady(page, `${route.id} at ${profile.id}`);
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
      await expectHeadingTextFragmentsContained(surface, state);
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
      if (route.id === "adventure-map" && profile.id === "tablet-portrait") {
        await expectTabletMapDestinationLabels(surface, state);
      }
      if (route.id === "phonics") await expectPhonicsRecommendationClear(surface, state);
      if (route.id === "arcade" && profile.id === "small-phone-portrait") {
        await expectCompactArcadeTabsClear(surface, state);
      }
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

test("A3.6 heading containment rejects near-boundary glyph clipping", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const surface = page.locator('[data-child-surface="reading-library"]');
  await expect(surface).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({
    content: `
      [data-child-surface="reading-library"] [data-child-title] {
        display: block !important;
        height: 30px !important;
        min-height: 30px !important;
        max-height: 30px !important;
        line-height: 18px !important;
        overflow: hidden !important;
      }
    `
  });

  const failures = await headingTextFragmentFailures(surface);
  expect(failures, "the generic guard rejects a few pixels of clipped glyph ink").toHaveLength(1);
  const failure = failures[0];
  const excursion = Math.max(
    failure.heading.top - Math.min(...failure.inkBoxes.map(box => box.top)),
    Math.max(...failure.inkBoxes.map(box => box.bottom)) - failure.heading.bottom
  );
  expect(
    excursion,
    `the injected title clips beyond CSS-pixel rounding: ${JSON.stringify(failure)}`
  ).toBeGreaterThan(failure.pixelTolerance);
  expect(
    excursion,
    `the negative control stays near the title boundary: ${JSON.stringify(failure)}`
  ).toBeLessThan(6);
  const surfaceBox = await surface.boundingBox();
  expect(
    failure.inkBoxes.every(box => (
      box.top >= surfaceBox.y - 1
      && box.bottom <= surfaceBox.y + surfaceBox.height + 1
    )),
    "the negative control remains inside the whole surface, so a surface-only bound would miss it"
  ).toBe(true);
});

test("A3.6 heading containment permits visible ink outside an unclipped line box", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/preview/child-surfaces.html?surface=arcade");
  const surface = page.locator('[data-child-surface="arcade"]');
  const title = surface.locator("[data-child-title]");
  await expect(surface).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({
    content: `
      [data-child-surface="arcade"] .lg-arcade-topband {
        padding-top: 20px !important;
      }
      [data-child-surface="arcade"] [data-child-title] {
        display: block !important;
        height: 8px !important;
        min-height: 8px !important;
        max-height: 8px !important;
        line-height: 8px !important;
        overflow: visible !important;
      }
    `
  });

  const geometry = await title.evaluate(element => {
    const titleBox = element.getBoundingClientRect();
    const clipBox = element.closest(".lg-arcade-topband").getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const textBoxes = [...range.getClientRects()].map(box => ({
      left: box.left,
      top: box.top,
      right: box.right,
      bottom: box.bottom
    }));
    const contains = (container, box) => box.left >= container.left - 1
      && box.top >= container.top - 1
      && box.right <= container.right + 1
      && box.bottom <= container.bottom + 1;
    return {
      overflowY: getComputedStyle(element).overflowY,
      textEscapesLineBox: textBoxes.some(box => (
        box.top < titleBox.top - 1 || box.bottom > titleBox.bottom + 1
      )),
      textInsideHeader: textBoxes.length > 0 && textBoxes.every(box => contains(clipBox, box))
    };
  });
  expect(geometry).toEqual({
    overflowY: "visible",
    textEscapesLineBox: true,
    textInsideHeader: true
  });

  expect(
    await headingTextFragmentFailures(surface),
    "visible glyph ink remains valid when the actual clipping boundary contains it"
  ).toEqual([]);
});

test("A3.6 heading containment rejects ink clipped by an ancestor", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/preview/child-surfaces.html?surface=arcade");
  const surface = page.locator('[data-child-surface="arcade"]');
  const title = surface.locator("[data-child-title]");
  const header = surface.locator(".lg-arcade-topband");
  await expect(surface).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({
    content: `
      [data-child-surface="arcade"] .lg-arcade-topband {
        box-sizing: border-box !important;
        height: 24px !important;
        min-height: 24px !important;
        max-height: 24px !important;
        padding-top: 20px !important;
        overflow: hidden !important;
      }
      [data-child-surface="arcade"] [data-child-title] {
        display: block !important;
        height: 8px !important;
        min-height: 8px !important;
        max-height: 8px !important;
        line-height: 8px !important;
        overflow: visible !important;
      }
    `
  });

  const geometry = await title.evaluate(element => {
    const titleBox = element.getBoundingClientRect();
    const clipBox = element.closest(".lg-arcade-topband").getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const inkBoxes = [...range.getClientRects()].map(box => ({
      top: box.top,
      bottom: box.bottom
    }));
    return {
      titleOverflowY: getComputedStyle(element).overflowY,
      inkEscapesTitle: inkBoxes.some(box => (
        box.top < titleBox.top - 1 || box.bottom > titleBox.bottom + 1
      )),
      inkEscapesHeader: inkBoxes.some(box => (
        box.top < clipBox.top - 1 || box.bottom > clipBox.bottom + 1
      ))
    };
  });
  expect(geometry).toEqual({
    titleOverflowY: "visible",
    inkEscapesTitle: true,
    inkEscapesHeader: true
  });
  await expect(header).toHaveCSS("overflow-y", "hidden");

  const failures = await headingTextFragmentFailures(surface);
  expect(
    failures,
    "visible heading overflow is invalid when a clipping ancestor cuts off the glyph ink"
  ).toHaveLength(1);
  expect(failures[0].verticalClipBoxes.some(box => box.element === "lg-arcade-topband")).toBe(true);
});

test("A3.6 heading containment uses a bordered ancestor's inner clipping edge", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/child-surfaces.html?surface=arcade");
  const surface = page.locator('[data-child-surface="arcade"]');
  const title = surface.locator("[data-child-title]");
  await expect(surface).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({
    content: `
      [data-child-surface="arcade"] .lg-arcade-topband {
        box-sizing: border-box !important;
        align-items: flex-start !important;
        height: 29px !important;
        min-height: 29px !important;
        max-height: 29px !important;
        padding: 15px 18px 0 !important;
        border-width: 3px !important;
        overflow: hidden !important;
      }
      [data-child-surface="arcade"] [data-child-title] {
        display: block !important;
        height: 8px !important;
        min-height: 8px !important;
        max-height: 8px !important;
        line-height: 8px !important;
        overflow: visible !important;
      }
    `
  });

  const geometry = await title.evaluate(element => {
    const style = getComputedStyle(element);
    const header = element.closest(".lg-arcade-topband");
    const headerRect = header.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const textBoxes = [...range.getClientRects()];
    const context = document.createElement("canvas").getContext("2d");
    context.font = style.font;
    const metrics = context.measureText(element.textContent.trim());
    const fontMetricHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    const inkBoxes = textBoxes.map(box => {
      const scaleY = box.height / fontMetricHeight;
      const baseline = box.top + (metrics.fontBoundingBoxAscent * scaleY);
      return {
        top: baseline - (metrics.actualBoundingBoxAscent * scaleY),
        bottom: baseline + (metrics.actualBoundingBoxDescent * scaleY)
      };
    });
    const stageScaleY = header.offsetHeight > 0
      ? headerRect.height / header.offsetHeight
      : 1;
    const clipTop = headerRect.top + (header.clientTop * stageScaleY);
    const clipBottom = clipTop + (header.clientHeight * stageScaleY);
    return {
      titleOverflowY: style.overflowY,
      headerOverflowY: getComputedStyle(header).overflowY,
      borderTop: header.clientTop,
      stageScaleY,
      clipTop,
      headerBottom: headerRect.bottom,
      clipBottom,
      mixedCoordinateBottom: headerRect.top + header.clientTop + header.clientHeight,
      inkBottom: Math.max(...inkBoxes.map(box => box.bottom)),
      borderContainsInk: inkBoxes.every(box => (
        box.top >= headerRect.top - 1 && box.bottom <= headerRect.bottom + 1
      )),
      innerEdgeClipsInk: inkBoxes.some(box => (
        box.top < clipTop - 1 || box.bottom > clipBottom + 1
      ))
    };
  });
  expect(geometry.titleOverflowY).toBe("visible");
  expect(geometry.headerOverflowY).toBe("hidden");
  expect(geometry.borderTop).toBe(3);
  expect(Math.abs(geometry.stageScaleY - 1), JSON.stringify(geometry)).toBeGreaterThan(0.05);
  expect(geometry.borderContainsInk, JSON.stringify(geometry)).toBe(true);
  expect(geometry.innerEdgeClipsInk, JSON.stringify(geometry)).toBe(true);

  const failures = await headingTextFragmentFailures(surface);
  expect(
    failures,
    "a border-box match cannot hide ink clipped at the ancestor's inner overflow edge"
  ).toHaveLength(1);
  const ancestorClip = failures[0].verticalClipBoxes
    .find(box => box.element === "lg-arcade-topband");
  expect(ancestorClip).toBeDefined();
  expect(ancestorClip.top).toBeCloseTo(geometry.clipTop, 1);
  expect(ancestorClip.bottom).toBeCloseTo(geometry.clipBottom, 1);
});

test("A3.6 Story Quests keeps its primary card visible with wider font metrics", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  const surface = page.locator('[data-child-surface="story-quests"]');
  await expect(surface).toBeVisible();
  // This deterministic fallback reproduces Ubuntu's 194px header and the
  // exact y274–524 primary-card failure even when the local webfont is narrow.
  await page.addStyleTag({
    content: `
      [data-child-surface="story-quests"] .kg-quests-head .kg-title,
      [data-child-surface="story-quests"] .kg-quests-head .kg-quests-pill {
        font-family: ui-monospace, monospace !important;
        letter-spacing: 0.02em;
      }
    `
  });
  await expectVisibleImagesReady(page, "Story Quests with wider font metrics");
  await page.evaluate(() => document.fonts?.ready);

  await expectPrimaryActionInInitialPane(surface, "Story Quests with wider font metrics");
  const headerCopyFailures = await surface.locator(".kg-quests-head .kg-title, .kg-quests-pill")
    .evaluateAll(nodes => nodes.flatMap(node => {
      const box = node.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(node);
      const textBoxes = [...range.getClientRects()];
      const contained = textBoxes.every(textBox => (
        textBox.left >= box.left - 1
        && textBox.top >= box.top - 1
        && textBox.right <= box.right + 1
        && textBox.bottom <= box.bottom + 1
      ));
      return node.textContent.trim() && textBoxes.length > 0 && contained
        ? []
        : [{
            text: node.textContent.trim(),
            box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
            textBoxes: textBoxes.map(textBox => ({
              left: textBox.left,
              top: textBox.top,
              right: textBox.right,
              bottom: textBox.bottom
            }))
          }];
    }));
  expect(
    headerCopyFailures,
    "Story Quests keeps its wider heading and subtitle visibly contained"
  ).toEqual([]);
  const headerControls = surface.locator(".kg-back, .kg-segment-tray .kg-segment");
  await expect(headerControls).toHaveCount(4);
  const headerControlBoxes = await headerControls.evaluateAll(nodes => (
    nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { width: box.width, height: box.height };
    })
  ));
  expect(
    headerControlBoxes.every(box => box.width >= 56 && box.height >= 56),
    `Story Quests keeps its Back and world controls at least 56px square: ${JSON.stringify(headerControlBoxes)}`
  ).toBe(true);
});

test("A3.6 Reading Library tablet portrait keeps filters and book copy clear", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const surface = page.locator('[data-child-surface="reading-library"]');
  await expect(surface).toBeVisible();
  // Exercise a deterministic wider fallback so this geometry contract covers
  // Linux without depending on which host font happens to win locally.
  await page.addStyleTag({
    content: `
      [data-child-surface="reading-library"] .kg-books-head button,
      [data-child-surface="reading-library"] .kg-book-title,
      [data-child-surface="reading-library"] .kg-book-purpose {
        font-family: ui-monospace, monospace !important;
        letter-spacing: 0.01em;
      }
    `
  });
  await expectVisibleImagesReady(page, "Reading Library tablet portrait");
  await page.evaluate(() => document.fonts?.ready);

  await expectLibraryPortraitShelves(surface, "Reading Library tablet portrait", 2);
  await expectLibraryBookCopyReadable(surface, "Reading Library tablet portrait");
  await expectLibraryHeaderControlsClear(surface, "Reading Library tablet portrait");
  await expectNoHorizontalOverflow(page, "Reading Library tablet portrait");
});

test("A3.6 Reading Library separates C Standard from C Extended without a decodable claim", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const surface = page.locator('[data-child-surface="reading-library"]');
  await surface.getByRole("button", { name: "Level C" }).click();

  const standard = surface.getByRole("region", { name: "C Standard", exact: true });
  const extended = surface.getByRole("region", { name: "C Extended / Read Together", exact: true });
  await expect(standard).toBeVisible();
  await expect(extended).toBeVisible();
  expect(await standard.locator('[data-reading-mode="predictable-levelled"]').count()).toBeGreaterThan(0);
  expect(await extended.locator('[data-reading-mode="supported-read-together"]').count()).toBeGreaterThan(0);
  await expect(standard.locator('[data-reading-mode="supported-read-together"]')).toHaveCount(0);
  await expect(extended.locator('[data-reading-mode="predictable-levelled"]')).toHaveCount(0);
  await expect(surface.locator('[data-reading-mode="decodable"]')).toHaveCount(0);
});

for (const viewport of [
  { id: "tablet landscape", width: 1024, height: 768 },
  { id: "desktop", width: 1280, height: 900 }
]) {
  test(`A3.6 Reading Library shows complete shelf titles at ${viewport.id}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto("/preview/child-surfaces.html?surface=reading-library");
    const surface = page.locator('[data-child-surface="reading-library"]');
    await expect(surface).toBeVisible();
    await expectVisibleImagesReady(page, `Reading Library at ${viewport.id}`);
    await page.evaluate(() => document.fonts?.ready);

    const inventory = await surface.locator(".kg-shelf-grid").evaluateAll(grids => ({
      shelfCount: grids.length,
      cardsPerShelf: grids.map(grid => grid.querySelectorAll(":scope > .kg-book-card").length),
      titleCount: grids.reduce((count, grid) => (
        count + grid.querySelectorAll(":scope > .kg-book-card:not(.kg-book-card--more) .kg-book-title").length
      ), 0)
    }));
    expect(
      inventory,
      `${viewport.id} keeps both complete eight-card shelves and all fourteen real book titles`
    ).toEqual({ shelfCount: 2, cardsPerShelf: [8, 8], titleCount: 14 });

    const failures = await surface
      .locator(".kg-shelf-grid .kg-book-card:not(.kg-book-card--more) .kg-book-title")
      .evaluateAll(titles => titles.flatMap(title => {
        const titleBox = title.getBoundingClientRect();
        const style = getComputedStyle(title);
        const range = document.createRange();
        range.selectNodeContents(title);
        const textBoxes = [...range.getClientRects()]
          .filter(box => box.width >= 1 && box.height >= 1)
          .map(box => ({
            left: box.left,
            top: box.top,
            right: box.right,
            bottom: box.bottom
          }));
        const painted = title.textContent.trim().length > 0
          && style.display !== "none"
          && style.visibility !== "hidden"
          && Number.parseFloat(style.opacity || "1") > 0
          && style.color !== "rgba(0, 0, 0, 0)"
          && titleBox.width >= 1
          && titleBox.height >= 1;
        const fullyVisible = painted
          && title.scrollWidth <= title.clientWidth + 1
          && textBoxes.length > 0 && textBoxes.every(box => (
          box.left >= titleBox.left - 1
          && box.right <= titleBox.right + 1
          // The display font can paint up to five pixels beyond its CSS line box;
          // a hidden third line exceeds this tolerance by a full line height.
          && box.top >= titleBox.top - 5
          && box.bottom <= titleBox.bottom + 5
        ));
        return fullyVisible
          ? []
          : [{
              title: title.textContent.trim(),
              titleBox: {
                left: titleBox.left,
                top: titleBox.top,
                right: titleBox.right,
                bottom: titleBox.bottom
              },
              painted,
              style: {
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                color: style.color
              },
              textBoxes
            }];
      }));

    expect(
      failures,
      `${viewport.id} keeps every Reading Library title fully visible without an ellipsis: ${JSON.stringify(failures)}`
    ).toEqual([]);

    const layoutFailures = await surface.locator(".kg-shelf-grid").evaluateAll(grids => (
      grids.flatMap((grid, shelfIndex) => {
        const gridBox = grid.getBoundingClientRect();
        const contains = (container, box) => box.left >= container.left - 1
          && box.top >= container.top - 1
          && box.right <= container.right + 1
          && box.bottom <= container.bottom + 1;
        return [...grid.querySelectorAll(":scope > .kg-book-card:not(.kg-book-card--more)")]
          .flatMap((card, cardIndex) => {
            const cardBox = card.getBoundingClientRect();
            const title = card.querySelector(".kg-book-title");
            const purpose = card.querySelector(".kg-book-purpose");
            const titleBox = title.getBoundingClientRect();
            const purposeBox = purpose.getBoundingClientRect();
            const quizStars = card.querySelector(".kg-book-stars");
            const keepsShelfGeometry = cardBox.height >= 56
              && contains(gridBox, cardBox)
              && contains(cardBox, titleBox)
              && contains(cardBox, purposeBox);
            const retiredQuizStarsAbsent = quizStars === null;
            return keepsShelfGeometry && retiredQuizStarsAbsent
              ? []
              : [{
                  shelfIndex,
                  cardIndex,
                  title: title.textContent.trim(),
                  keepsShelfGeometry,
                  retiredQuizStarsAbsent,
                  card: { left: cardBox.left, top: cardBox.top, right: cardBox.right, bottom: cardBox.bottom },
                  titleBox: { left: titleBox.left, top: titleBox.top, right: titleBox.right, bottom: titleBox.bottom },
                  purposeBox: { left: purposeBox.left, top: purposeBox.top, right: purposeBox.right, bottom: purposeBox.bottom }
                }];
          });
      })
    ));
    expect(
      layoutFailures,
      `${viewport.id} preserves 56px shelf cards and keeps retired quiz stars absent: ${JSON.stringify(layoutFailures)}`
    ).toEqual([]);
  });
}

test("A3.6 Reading Library portrait header Tab order follows its visual order", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const header = page.locator('[data-child-surface="reading-library"] .kg-books-head');
  const controls = header.locator("button");
  const expectedNames = [
    "Level A",
    "Level B",
    "Level C",
    "All books",
    "Bob & Nan",
    "Meadow Pals",
    "Science & Facts",
    "Explore ideas",
    "Story Quests"
  ];
  await expect(controls).toHaveCount(expectedNames.length);
  await page.evaluate(() => document.fonts?.ready);

  const sequence = [];
  await controls.first().focus();
  for (let index = 0; index < expectedNames.length; index += 1) {
    const control = controls.nth(index);
    await expect(control, `header control ${expectedNames[index]} follows Tab order`).toBeFocused();
    sequence.push(await control.evaluate(element => {
      const box = element.getBoundingClientRect();
      return {
        name: element.textContent.trim().replace(/\s+/g, " "),
        tabIndex: element.tabIndex,
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom
      };
    }));
    if (index < expectedNames.length - 1) await page.keyboard.press("Tab");
  }

  expect(sequence.map(control => control.name)).toEqual(expectedNames);
  expect(
    sequence.filter(control => control.tabIndex > 0),
    "Reading Library keeps native DOM order without positive tabindex"
  ).toEqual([]);
  const visualRegressions = sequence.slice(1).flatMap((control, index) => {
    const previous = sequence[index];
    const movesToEarlierRow = control.top < previous.top - 4;
    const movesBackWithinRow = Math.abs(control.top - previous.top) <= 4
      && control.left < previous.left - 1;
    return movesToEarlierRow || movesBackWithinRow
      ? [{ previous, control }]
      : [];
  });
  expect(
    visualRegressions,
    `Reading Library Tab order follows top-to-bottom, left-to-right visual order: ${JSON.stringify(sequence)}`
  ).toEqual([]);
});

for (const viewport of [
  { id: "phone portrait", width: 320, height: 568, bookRails: false },
  { id: "tablet portrait", width: 768, height: 1024, bookRails: true }
]) {
  test(`A3.6 Reading Library focus fully reveals horizontal choices at ${viewport.id}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/preview/child-surfaces.html?surface=reading-library");
    const surface = page.locator('[data-child-surface="reading-library"]');
    await expect(surface).toBeVisible();
    await page.evaluate(() => document.fonts?.ready);

    const headerChoices = surface.locator(".kg-segment, .kg-collection-chip, .kg-books-stories");
    expect(await headerChoices.count(), `${viewport.id} exposes collection and destination choices`).toBeGreaterThan(3);
    for (let index = 0; index < await headerChoices.count(); index += 1) {
      await expectFocusedControlFullyRevealed(
        headerChoices.nth(index),
        `${viewport.id} header choice ${index + 1}`
      );
    }

    if (viewport.bookRails) {
      const shelfCards = surface.locator(".kg-shelf-grid > .kg-book-card");
      expect(await shelfCards.count(), `${viewport.id} exposes horizontally railed books`).toBeGreaterThan(4);
      for (let index = 0; index < await shelfCards.count(); index += 1) {
        await expectFocusedControlFullyRevealed(
          shelfCards.nth(index),
          `${viewport.id} book ${index + 1}`
        );
      }
    }
  });
}

test("A3.6 Reading Library phone Tab navigation reveals every level choice", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const levels = page.locator('[data-child-surface="reading-library"] .kg-segment');
  await expect(levels).toHaveCount(3);
  await levels.first().focus();

  for (let index = 0; index < await levels.count(); index += 1) {
    await expectFocusedControlFullyRevealed(
      levels.nth(index),
      `phone portrait level choice ${index + 1}`,
      { focusControl: false }
    );
    if (index < await levels.count() - 1) await page.keyboard.press("Tab");
  }
});

test("A3.6 Reading Library pointer activation does not move a partially visible collection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const surface = page.locator('[data-child-surface="reading-library"]');
  await expect(surface).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);

  const tray = surface.locator(".kg-collection-tray");
  const science = tray.getByRole("button", { name: "Science & Facts" });
  const geometry = await science.evaluate((element) => {
    const trayElement = element.closest(".kg-collection-tray");
    const target = element.getBoundingClientRect();
    const clip = trayElement.getBoundingClientRect();
    const visibleLeft = Math.max(0, target.left, clip.left);
    const visibleRight = Math.min(window.innerWidth, target.right, clip.right);
    const visibleTop = Math.max(0, target.top, clip.top);
    const visibleBottom = Math.min(window.innerHeight, target.bottom, clip.bottom);
    return {
      targetWidth: target.width,
      visibleWidth: visibleRight - visibleLeft,
      point: {
        x: visibleRight - 2,
        y: visibleTop + ((visibleBottom - visibleTop) / 2)
      },
      scrollLeft: trayElement.scrollLeft
    };
  });
  expect(geometry.visibleWidth, "Science & Facts exposes a tappable preview").toBeGreaterThan(16);
  expect(
    geometry.visibleWidth,
    "Science & Facts begins partially clipped so pointer-down cannot hide an activation bug"
  ).toBeLessThan(geometry.targetWidth - 1);

  await page.mouse.move(geometry.point.x, geometry.point.y);
  await page.mouse.down();
  const scrollAfterPointerDown = await tray.evaluate(element => element.scrollLeft);
  await page.mouse.up();

  expect(
    scrollAfterPointerDown,
    "pointer focus does not move the choice between pointer-down and pointer-up"
  ).toBe(geometry.scrollLeft);
  await expect(science, "the partially visible collection remains directly tappable").toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

for (const { height, expectedRowCount } of [
  { height: 780, expectedRowCount: 1 },
  { height: 860, expectedRowCount: 1 },
  { height: 901, expectedRowCount: 1 },
  { height: 973, expectedRowCount: 1 },
  { height: 974, expectedRowCount: 2 }
]) {
  test(`A3.6 Reading Library keeps ${height}px portrait-tablet shelves usable`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 768, height });
    await page.goto("/preview/child-surfaces.html?surface=reading-library");
    const surface = page.locator('[data-child-surface="reading-library"]');
    await expect(surface).toBeVisible();
    await expectVisibleImagesReady(page, `Reading Library at 768x${height}`);
    await page.evaluate(() => document.fonts?.ready);

    const state = `Reading Library at 768x${height}`;
    await expectLibraryPortraitShelves(surface, state, expectedRowCount);
    await expectLibraryBookCopyReadable(surface, state);
    await expectNoHorizontalOverflow(page, state);
    const shelfCards = surface.locator(".kg-shelf-grid > .kg-book-card");
    await expect(shelfCards, `${state} keeps both complete eight-choice shelves`).toHaveCount(16);
    for (let index = 0; index < await shelfCards.count(); index += 1) {
      await expectFocusedControlFullyRevealed(
        shelfCards.nth(index),
        `${state} book ${index + 1}`
      );
    }
  });
}

test("A3.6 Phonics names recommended, completed and in-progress letter states", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/child-surfaces.html?surface=phonics");
  const surface = page.locator('[data-child-surface="phonics"]');
  await expect(surface).toBeVisible();

  const letterA = surface.locator(".phonics-letter-card").filter({ hasText: /^AStart here/ });
  await expect(letterA.locator(".phonics-letter-next")).toHaveText("Start here");
  await expect(letterA).toHaveAccessibleName("Letter A, Start here, recommended");

  await page.evaluate(() => {
    window.localStorage.setItem(
      "lp_phonics_progress_child-surface-preview",
      JSON.stringify({ A: "completed", B: "inprogress" })
    );
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: { studentId: "child-surface-preview" }
    }));
  });

  await expect(surface.locator(".phonics-letter-card").nth(0))
    .toHaveAccessibleName("Letter A, completed");
  await expect(surface.locator(".phonics-letter-card").nth(1))
    .toHaveAccessibleName("Letter B, Start here, in progress, recommended");
});

test("A3.6 Phonics recommendation guard rejects a tablet cue collision", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/preview/child-surfaces.html?surface=phonics");
  const surface = page.locator('[data-child-surface="phonics"]');
  await expect(surface).toBeVisible();
  await page.addStyleTag({
    content: `
      [data-child-surface="phonics"] .phonics-letter-card.recommended .phonics-letter-status {
        top: auto !important;
        right: 10px !important;
        bottom: 8px !important;
      }
    `
  });

  const geometry = await readPhonicsRecommendationGeometry(surface);
  expect(
    geometry.overlapArea,
    `the guard detects a restored bottom-edge collision: ${JSON.stringify(geometry)}`
  ).toBeGreaterThan(0);
  expect(
    geometry.separation,
    `the injected tablet status has no clear gap from Start here: ${JSON.stringify(geometry)}`
  ).toBe(0);
});

test("A3.6 Adventure Map guard rejects truncated tablet route names", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/preview/child-surfaces.html?surface=adventure-map");
  const surface = page.locator('[data-child-surface="adventure-map"]');
  await expect(surface).toBeVisible();
  const labels = surface.locator(".kg-map-card .kg-map-card-text strong");
  await expect(labels).toHaveCount(4);
  await page.addStyleTag({
    content: `
      [data-child-surface="adventure-map"] .kg-map-card {
        grid-template-columns: 38px minmax(0, 1fr) 28px !important;
      }
      [data-child-surface="adventure-map"] .kg-map-card-text strong {
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
    `
  });

  const failures = await readTabletMapDestinationLabelFailures(surface);
  expect(
    failures.map(failure => failure.text),
    `the guard detects the labels hidden by the old arrow track: ${JSON.stringify(failures)}`
  ).toEqual(["Carrot Patch", "Apple Orchard"]);
});

test("A3.6 Adventure Map compact landscape keeps its wider title clear", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/preview/child-surfaces.html?surface=adventure-map");
  const surface = page.locator('[data-child-surface="adventure-map"]');
  await expect(surface).toBeVisible();
  await page.addStyleTag({
    content: `
      [data-child-surface="adventure-map"] [data-child-title] {
        font-family: ui-monospace, monospace !important;
        letter-spacing: 0.06em;
      }
    `
  });
  await expectVisibleImagesReady(page, "Adventure Map compact landscape");
  await page.evaluate(() => document.fonts?.ready);

  const geometry = await surface.evaluate(element => {
    const title = element.querySelector("[data-child-title]");
    const header = element.querySelector(".kg-trail-head");
    const speaker = element.querySelector(".kg-trail-head .kg-speaker");
    const toBox = node => {
      const box = node.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
    };
    const titleBox = toBox(title);
    const headerBox = toBox(header);
    const speakerBox = toBox(speaker);
    const range = document.createRange();
    range.selectNodeContents(title);
    const textBoxes = [...range.getClientRects()].map(box => ({
      left: box.left,
      top: box.top,
      right: box.right,
      bottom: box.bottom
    }));
    const contains = (container, box) => box.left >= container.left - 1
      && box.top >= container.top - 1
      && box.right <= container.right + 1
      && box.bottom <= container.bottom + 1;
    return {
      text: title.textContent.trim(),
      title: {
        ...titleBox,
        clientWidth: title.clientWidth,
        scrollWidth: title.scrollWidth,
        clientHeight: title.clientHeight,
        scrollHeight: title.scrollHeight
      },
      header: headerBox,
      speaker: speakerBox,
      textBoxes,
      textInsideTitle: textBoxes.length > 0 && textBoxes.every(box => contains(titleBox, box)),
      textInsideHeader: textBoxes.length > 0 && textBoxes.every(box => contains(headerBox, box))
    };
  });
  expect(geometry.text).toBe("Adventure Map");
  expect(
    geometry.title.scrollWidth,
    `Adventure Map keeps its full wider title horizontally visible: ${JSON.stringify(geometry)}`
  ).toBeLessThanOrEqual(geometry.title.clientWidth + 1);
  expect(
    geometry.title.scrollHeight,
    `Adventure Map keeps its full wider title vertically visible: ${JSON.stringify(geometry)}`
  ).toBeLessThanOrEqual(geometry.title.clientHeight + 1);
  expect(
    geometry.textInsideTitle,
    `Adventure Map keeps every title fragment inside the title box: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.textInsideHeader,
    `Adventure Map keeps every title fragment inside the compact header: ${JSON.stringify(geometry)}`
  ).toBe(true);
  expect(
    geometry.title.right,
    `Adventure Map separates its wider title from the speaker: ${JSON.stringify(geometry)}`
  ).toBeLessThanOrEqual(geometry.speaker.left - 4);
});

test("A3.6 Sound Seekers compact creator contains option labels and locked rewards", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/preview/child-surfaces.html?surface=sound-seekers");
  const surface = page.locator('[data-child-surface="sound-seekers"]');
  const creator = surface.locator(".q-creator");
  await expect(creator).toBeVisible();
  await expectVisibleImagesReady(page, "Sound Seekers compact creator");
  await page.evaluate(() => document.fonts?.ready);
  await expectCreatorInstructionClearOfHeaderControls(surface, "Sound Seekers compact creator");

  const characterReel = creator.locator(".q-reel--body");
  await expect(characterReel).toBeVisible();
  await expectCreatorOptionRailStartsReachably(characterReel, "Sound Seekers Character options");
  await expectCreatorOptionContentsContained(characterReel, "Sound Seekers Character options");

  const tabs = creator.getByRole("tab");
  const tabBoxes = await tabs.evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    return { width: box.width, height: box.height };
  }));
  expect(
    tabBoxes.every(box => box.width >= 56 && box.height >= 56),
    `compact creator keeps 56px-square tabs: ${JSON.stringify(tabBoxes)}`
  ).toBe(true);
  await expectCreatorTabLabelsClear(tabs, "Sound Seekers compact creator tabs");
  await page.addStyleTag({
    content: `
      [data-child-surface="sound-seekers"] .q-creator .q-tab {
        font-family: ui-monospace, monospace !important;
      }
    `
  });
  await expectCreatorTabLabelsClear(tabs, "Sound Seekers wider-font creator tabs");

  const characterTab = creator.getByRole("tab", { name: "Character", exact: true });
  await characterTab.evaluate(node => {
    const label = document.createElement("span");
    label.textContent = node.textContent;
    node.replaceChildren(label);
    const tabBox = node.getBoundingClientRect();
    const nextTabBox = node.nextElementSibling.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(label);
    const textBox = range.getBoundingClientRect();
    const gutter = nextTabBox.left - tabBox.right;
    const overhang = Math.max(1.25, gutter - 0.5);
    label.style.position = "relative";
    label.style.left = `${tabBox.right + overhang - textBox.right}px`;
    node.style.overflow = "hidden";
  });
  await expect(
    expectCreatorTabLabelsClear(tabs, "Sound Seekers clipped-label negative control")
  ).rejects.toThrow(/clipping boundaries/);
  await characterTab.evaluate(node => {
    node.replaceChildren("Character");
    node.style.removeProperty("overflow");
  });

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
  expect(primaryBox?.width || 0, "compact creator keeps a 56px-wide primary action").toBeGreaterThanOrEqual(56);
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
    await expectVisibleImagesReady(page, `${profile.id} fullscreen game`);
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
    await expectVisibleImagesReady(page, `${profile.id} fullscreen reader`);
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
    await expectVisibleImagesReady(page, `${profile.id} fullscreen story`);
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
