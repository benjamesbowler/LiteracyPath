import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import { SOUND_SEEKERS_CONNECTED_TEXT } from "../../src/features/soundSeekers/content/connectedText.js";

const PROFILES = [
  { id: "landscape", viewport: { width: 568, height: 320 }, zoom: 1 },
  { id: "portrait", viewport: { width: 320, height: 568 }, zoom: 1 },
  { id: "tablet", viewport: { width: 1194, height: 834 }, zoom: 1 },
  { id: "zoom-200", viewport: { width: 640, height: 1136 }, zoom: 2 }
];

function intersects(left, right) {
  return Math.min(left.right, right.right) - Math.max(left.x, right.x) > 2
    && Math.min(left.bottom, right.bottom) - Math.max(left.y, right.y) > 2;
}

function separation(left, right) {
  return Math.max(
    left.x - right.right,
    right.x - left.right,
    left.y - right.bottom,
    right.y - left.bottom
  );
}

async function pixelDifference(visible, hidden) {
  const [visiblePixels, hiddenPixels] = await Promise.all([
    sharp(visible).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(hidden).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  ]);
  expect(visiblePixels.info).toEqual(hiddenPixels.info);
  let changed = 0;
  let difference = 0;
  for (let index = 0; index < visiblePixels.data.length; index += 3) {
    const delta = Math.abs(visiblePixels.data[index] - hiddenPixels.data[index])
      + Math.abs(visiblePixels.data[index + 1] - hiddenPixels.data[index + 1])
      + Math.abs(visiblePixels.data[index + 2] - hiddenPixels.data[index + 2]);
    if (delta < 12) continue;
    changed += 1;
    difference += delta / 3;
  }
  return {
    changed,
    meanDelta: changed ? difference / changed : 0,
    coverage: changed / (visiblePixels.info.width * visiblePixels.info.height)
  };
}

async function visibleUnion(page, selector) {
  return page.locator(selector).evaluateAll(nodes => {
    const boxes = nodes.map(node => node.getBoundingClientRect()).filter(rect => (
      rect.width > 0 && rect.height > 0
    ));
    if (!boxes.length) return null;
    const x = Math.min(...boxes.map(box => box.x));
    const y = Math.min(...boxes.map(box => box.y));
    const right = Math.max(...boxes.map(box => box.right));
    const bottom = Math.max(...boxes.map(box => box.bottom));
    return { x, y, right, bottom, width: right - x, height: bottom - y };
  });
}

async function assertActionFirstScene(evidencePage) {
  await expect(evidencePage.locator("[data-gallery-ready='true']")).toBeVisible();
  const viewport = await evidencePage.evaluate(() => ({
    width: window.visualViewport?.width || window.innerWidth,
    height: window.visualViewport?.height || window.innerHeight,
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  }));
  expect(viewport.horizontalOverflow).toBeLessThanOrEqual(1);
  const rects = [
    await visibleUnion(evidencePage, "[data-scene-text], [data-scene-prompt]"),
    await visibleUnion(evidencePage, ".sound-seekers-world__props"),
    ...await evidencePage.locator("[data-option-visual-id]").evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    }))
  ];
  for (const rect of rects) {
    expect(rect).not.toBeNull();
    expect(rect.x).toBeGreaterThanOrEqual(-1);
    expect(rect.y).toBeGreaterThanOrEqual(-1);
    expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
    expect(rect.bottom).toBeLessThanOrEqual(viewport.height + 1);
  }
}

for (const profile of PROFILES) {
  test(`action-first scene remains reachable at ${profile.id}`, async ({ page, browser }) => {
    const zoomContext = profile.zoom === 2 ? await browser.newContext({
      baseURL: "http://127.0.0.1:5190",
      viewport: {
        width: profile.viewport.width / profile.zoom,
        height: profile.viewport.height / profile.zoom
      },
      deviceScaleFactor: profile.zoom
    }) : null;
    const evidencePage = zoomContext ? await zoomContext.newPage() : page;
    if (!zoomContext) await evidencePage.setViewportSize(profile.viewport);
    await evidencePage.goto("/preview/sound-seekers-v2-content.html?stop=s1&fixture=pre-choice&density=full&motion=reduced&labels=shown&seed=11");
    await expect(evidencePage.locator("[data-gallery-ready='true']")).toBeVisible();

    const viewport = await evidencePage.evaluate(() => ({
      width: window.visualViewport?.width || window.innerWidth,
      height: window.visualViewport?.height || window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      verticalOverflow: Math.max(0, document.documentElement.scrollHeight - (window.visualViewport?.height || window.innerHeight))
    }));
    if (profile.zoom === 2) expect(viewport.devicePixelRatio).toBe(2);
    expect(viewport.horizontalOverflow).toBeLessThanOrEqual(1);
    if (profile.id === "landscape") expect(viewport.verticalOverflow).toBeLessThanOrEqual(1);

    const goal = await visibleUnion(evidencePage, "[data-scene-text], [data-scene-prompt]");
    const target = await visibleUnion(evidencePage, ".sound-seekers-world__props");
    const actors = await visibleUnion(evidencePage, ".sound-seekers-world__characters");
    const landmark = await visibleUnion(evidencePage, ".sound-seekers-landmark");
    const controls = await evidencePage.locator("[data-option-visual-id]").evaluateAll(nodes => (
      nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        };
      })
    ));
    for (const rect of [goal, target, actors, landmark, ...controls]) {
      expect(rect).not.toBeNull();
      expect(rect.x).toBeGreaterThanOrEqual(-1);
      expect(rect.y).toBeGreaterThanOrEqual(-1);
      expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(rect.bottom).toBeLessThanOrEqual(viewport.height + 1);
    }
    for (const control of controls) {
      expect(control.width).toBeGreaterThanOrEqual(56);
      expect(control.height).toBeGreaterThanOrEqual(56);
    }
    for (let index = 1; index < controls.length; index += 1) {
      const previous = controls[index - 1];
      const horizontalGap = controls[index].x - previous.right;
      const verticalGap = controls[index].y - previous.bottom;
      expect(Math.max(horizontalGap, verticalGap)).toBeGreaterThanOrEqual(8);
    }
    expect(intersects(actors, target)).toBe(false);
    expect(intersects(actors, landmark)).toBe(false);
    expect(intersects(target, landmark)).toBe(false);
    await expect(evidencePage.locator("[data-correct],[data-answer],[data-private-answer],[data-expected-token]")).toHaveCount(0);
    await zoomContext?.close();
  });
}

for (const chapter of SOUND_SEEKERS_CHAPTERS) {
  test(`identical resolved content has independent ordinary, Wonder, and boss compositions for ${chapter.id}`, async ({ page }) => {
    const stopId = chapter.stopIds.at(-1);
    const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.stopId === stopId);
    const optionId = scene.choice.options[0].visualSemanticId;
    const open = async url => {
      await page.goto(url);
      await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
      const transformation = page.locator("[data-world-transformation]");
      return {
        signature: await page.locator("[data-world-composition-signature]").getAttribute("data-world-composition-signature"),
        content: await page.locator("[data-sound-seekers-scene]").evaluate(node => ({
          text: node.querySelector("[data-scene-text]")?.textContent,
          prompt: node.querySelector("[data-scene-prompt]")?.textContent,
          state: node.getAttribute("data-visual-state-id"),
          options: [...node.querySelectorAll("[data-option-visual-id]")]
            .map(option => option.getAttribute("data-option-visual-id"))
        })),
        transformation: await transformation.count()
          ? {
            id: await transformation.first().getAttribute("data-world-transformation"),
            geometry: await transformation.locator("path").evaluateAll(paths => paths.map(path => path.getAttribute("d")))
          } : null
      };
    };
    const common = `scene=${scene.id}&fixture=boss-resolved&density=full&motion=reduced&labels=shown&seed=11&option=${encodeURIComponent(optionId)}`;
    const ordinary = await open(`/preview/sound-seekers-v2-content.html?mode=route-landmark&${common}`);
    const wonder = await open(`/preview/sound-seekers-v2-content.html?mode=wonder&scene=${scene.id}&fixture=boss-resolved&density=full&motion=reduced&labels=shown&seed=11&option=${encodeURIComponent(optionId)}`);
    const boss = await open(`/preview/sound-seekers-v2-content.html?mode=scene&${common}`);
    expect(wonder.content).toEqual(ordinary.content);
    expect(boss.content).toEqual(ordinary.content);
    expect(wonder.signature).not.toBe(ordinary.signature);
    expect(boss.signature).not.toBe(ordinary.signature);
    expect(wonder.signature).not.toBe(boss.signature);
    expect(ordinary.transformation).toBeNull();
    expect(wonder.transformation).toBeTruthy();
    expect(boss.transformation).toBeTruthy();
    expect(wonder.transformation.geometry).not.toEqual(boss.transformation.geometry);
    expect(await page.locator("[data-control-state='settled']").count()).toBe(1);
  });
}

const WORST_CASES = [
  { id: "fossil-four-targets", sceneId: "scene-s11", fixture: "assessed-correct-resolved" },
  { id: "star-reach-longest", sceneId: "scene-s36", fixture: "assessed-correct-resolved" },
  { id: "star-reach-boss", sceneId: "scene-s40", fixture: "boss-resolved" }
];
const CONSTRAINED_PROFILES = PROFILES.filter(profile => profile.id !== "tablet");

for (const scenario of WORST_CASES) {
  for (const profile of CONSTRAINED_PROFILES) {
    test(`${scenario.id} keeps target, instruction, and action visible at ${profile.id}`, async ({ page, browser }) => {
      const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.id === scenario.sceneId);
      const optionId = scene.choice.kind === "narrative_bridge"
        ? scene.choice.options[0].visualSemanticId : null;
      const zoomContext = profile.zoom === 2 ? await browser.newContext({
        baseURL: "http://127.0.0.1:5190",
        viewport: { width: profile.viewport.width / 2, height: profile.viewport.height / 2 },
        deviceScaleFactor: 2
      }) : null;
      const evidencePage = zoomContext ? await zoomContext.newPage() : page;
      if (!zoomContext) await evidencePage.setViewportSize(profile.viewport);
      const option = optionId ? `&option=${encodeURIComponent(optionId)}` : "";
      await evidencePage.goto(`/preview/sound-seekers-v2-content.html?scene=${scenario.sceneId}&fixture=${scenario.fixture}&density=full&motion=reduced&labels=shown&seed=11${option}`);
      await assertActionFirstScene(evidencePage);
      const geometry = await evidencePage.evaluate(() => {
        const box = node => {
          const rect = node.getBoundingClientRect();
          return {
            x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom,
            width: rect.width, height: rect.height
          };
        };
        return {
          viewport: {
            width: window.visualViewport?.width || window.innerWidth,
            height: window.visualViewport?.height || window.innerHeight
          },
          actors: box(document.querySelector(".sound-seekers-world__characters")),
          landmark: box(document.querySelector(".sound-seekers-landmark")),
          targets: [...document.querySelectorAll(".sound-seekers-world__semantic-prop")].map(box),
          controls: [...document.querySelectorAll("[data-option-visual-id]")].map(box),
          targetLabelPixels: [...document.querySelectorAll(".sound-seekers-world__semantic-prop figcaption")]
            .map(label => Number.parseFloat(getComputedStyle(label).fontSize))
        };
      });
      const { actors, landmark, targets, controls, viewport, targetLabelPixels } = geometry;
      for (const rect of [actors, landmark, ...targets, ...controls]) {
        expect(rect.x).toBeGreaterThanOrEqual(-1);
        expect(rect.y).toBeGreaterThanOrEqual(-1);
        expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
        expect(rect.bottom).toBeLessThanOrEqual(viewport.height + 1);
      }
      for (const target of targets) {
        expect(target.width).toBeGreaterThanOrEqual(56);
        expect(target.height).toBeGreaterThanOrEqual(56);
        expect(intersects(actors, target)).toBe(false);
        expect(intersects(target, landmark)).toBe(false);
        for (const control of controls) expect(intersects(target, control)).toBe(false);
      }
      for (const control of controls) {
        expect(control.width).toBeGreaterThanOrEqual(56);
        expect(control.height).toBeGreaterThanOrEqual(56);
        expect(intersects(actors, control)).toBe(false);
        expect(intersects(landmark, control)).toBe(false);
      }
      expect(intersects(actors, landmark)).toBe(false);
      expect(Math.min(...targetLabelPixels)).toBeGreaterThanOrEqual(9);
      for (const group of [targets, controls]) {
        for (let index = 0; index < group.length; index += 1) {
          for (let peer = index + 1; peer < group.length; peer += 1) {
            expect(separation(group[index], group[peer])).toBeGreaterThanOrEqual(8);
          }
        }
      }
      await zoomContext?.close();
    });
  }
}

test("literacy target outranks the route in computed layout and rendered pixels", async ({ page }) => {
  await page.setViewportSize({ width: 1194, height: 834 });
  await page.goto("/preview/sound-seekers-v2-content.html?scene=scene-s11&fixture=assessed-correct-resolved&density=full&motion=reduced&labels=shown&seed=11");
  const hierarchy = await page.evaluate(() => {
    const route = document.querySelector(".sound-seekers-route");
    const routePaths = [...document.querySelectorAll(".sound-seekers-route path")];
    const target = document.querySelector(".sound-seekers-world__semantic-prop");
    return {
      routeOpacity: Number(getComputedStyle(route).opacity),
      widestRouteStroke: Math.max(...routePaths.map(path => Number.parseFloat(getComputedStyle(path).strokeWidth))),
      targetOpacity: Number(getComputedStyle(target).opacity),
      targetPlaneZ: Number(getComputedStyle(target.closest("[data-world-plane]")).zIndex),
      routePlaneZ: Number(getComputedStyle(route.closest("[data-world-plane]")).zIndex)
    };
  });
  const world = page.locator(".sound-seekers-world");
  const visible = await world.screenshot();
  await page.locator(".sound-seekers-route").evaluate(node => { node.style.visibility = "hidden"; });
  const routeHidden = await world.screenshot();
  await page.locator(".sound-seekers-route").evaluate(node => { node.style.visibility = ""; });
  await page.locator(".sound-seekers-world__props").evaluate(node => { node.style.visibility = "hidden"; });
  const targetHidden = await world.screenshot();
  const routePixels = await pixelDifference(visible, routeHidden);
  const targetPixels = await pixelDifference(visible, targetHidden);
  expect(routePixels.changed).toBeGreaterThan(100);
  expect(targetPixels.changed).toBeGreaterThan(100);
  expect(routePixels.meanDelta).toBeLessThan(targetPixels.meanDelta * 0.72);
  expect(hierarchy.routeOpacity).toBeLessThanOrEqual(0.55);
  expect(hierarchy.widestRouteStroke).toBeLessThanOrEqual(34);
  expect(hierarchy.targetOpacity).toBe(1);
  expect(hierarchy.targetPlaneZ).toBeGreaterThan(hierarchy.routePlaneZ);
});
