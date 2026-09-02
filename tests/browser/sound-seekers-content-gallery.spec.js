import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";

import {
  SOUND_SEEKERS_CONNECTED_TEXT,
  toChildConnectedTextScene
} from "../../src/features/soundSeekers/content/connectedText.js";
import { SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX } from "../../tools/lib/soundSeekersV2GalleryManifest.mjs";

const INPUT_KINDS = Object.freeze(["mouse", "touch", "Enter", "Space"]);
const CHILD_SCENES = SOUND_SEEKERS_CONNECTED_TEXT.map(scene =>
  toChildConnectedTextScene(scene.id, "gallery:11"));
const CONTROL_COUNT = CHILD_SCENES.reduce((count, scene) => count + scene.choice.options.length, 0);
if (CONTROL_COUNT !== 112) throw new Error(`expected 112 gallery controls, received ${CONTROL_COUNT}`);

const CASES = SOUND_SEEKERS_CONNECTED_TEXT.map((scene, index) => {
  const childScene = CHILD_SCENES[index];
  return { scene, childScene };
});

function galleryUrl(sceneId) {
  return `/preview/sound-seekers-v2-content.html?scene=${sceneId}&fixture=pre-choice&density=full&motion=reduced&labels=shown&seed=11`;
}

async function assertInventoryAndKeyboardOrder(page, childScene) {
  const buttons = page.locator("[data-option-visual-id]");
  const expectedIds = childScene.choice.options.map(option => option.visualSemanticId);
  await expect(buttons).toHaveCount(expectedIds.length);
  expect(await buttons.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-option-visual-id"))))
    .toEqual(expectedIds);
  const boxes = await buttons.evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
  }
  for (let index = 1; index < boxes.length; index += 1) {
    const previous = boxes[index - 1];
    const current = boxes[index];
    const horizontal = current.x - (previous.x + previous.width);
    const vertical = current.y - (previous.y + previous.height);
    expect(Math.max(horizontal, vertical)).toBeGreaterThanOrEqual(8);
  }
  await buttons.first().focus();
  const tabOrder = [await page.evaluate(() => document.activeElement?.getAttribute("data-option-visual-id"))];
  for (let index = 1; index < expectedIds.length; index += 1) {
    await page.keyboard.press("Tab");
    tabOrder.push(await page.evaluate(() => document.activeElement?.getAttribute("data-option-visual-id")));
  }
  expect(tabOrder).toEqual(expectedIds);
}

for (const { scene, childScene } of CASES) {
  test(`all child-safe controls activate exactly once in visual and Tab order for ${scene.id}`, async ({ browser }) => {
    test.setTimeout(180_000);
    const mouseContext = await browser.newContext({ viewport: { width: 568, height: 320 }, hasTouch: false });
    const touchContext = await browser.newContext({
      viewport: { width: 568, height: 320 }, hasTouch: true, isMobile: true
    });
    try {
      const mousePage = await mouseContext.newPage();
      const touchPage = await touchContext.newPage();
      await mousePage.goto(galleryUrl(scene.id));
      await expect(mousePage.locator("[data-gallery-ready='true']")).toBeVisible();
      await expect(mousePage.locator("[data-gallery-root]")).toHaveAttribute("data-gallery-phase", "pre_choice");
      await expect(mousePage.locator("[data-sound-seekers-scene]")).toHaveAttribute("data-scene-phase", "pre_choice");
      await assertInventoryAndKeyboardOrder(mousePage, childScene);
      await mousePage.reload();
      await expect(mousePage.locator("[data-gallery-ready='true']")).toBeVisible();
      expect(await mousePage.locator("[data-option-visual-id]").evaluateAll(nodes =>
        nodes.map(node => node.getAttribute("data-option-visual-id"))))
        .toEqual(childScene.choice.options.map(option => option.visualSemanticId));

      for (const option of childScene.choice.options) {
        for (const inputKind of INPUT_KINDS) {
          const page = inputKind === "touch" ? touchPage : mousePage;
          await page.goto(galleryUrl(scene.id));
          await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
          const target = page.locator(`[data-option-visual-id="${option.visualSemanticId}"]`);
          const box = await target.boundingBox();
          expect(box?.width).toBeGreaterThanOrEqual(56);
          expect(box?.height).toBeGreaterThanOrEqual(56);
          if (inputKind === "mouse") {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          } else if (inputKind === "touch") {
            await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
          } else {
            await target.focus();
            await page.keyboard.press(inputKind);
          }
          await expect(target).toBeFocused();
          await expect(page.locator("[data-gallery-root]")).toHaveAttribute("data-gallery-activation-count", "1");
          await expect(page.locator("[data-gallery-root]")).toHaveAttribute(
            "data-gallery-last-activation-token", option.token
          );
          expect(Number.parseFloat(await target.evaluate(node => getComputedStyle(node).outlineWidth)))
            .toBeGreaterThanOrEqual(4);
          await expect(page.locator("[data-private-answer],[data-correct],[data-expected-token]")).toHaveCount(0);
          expect(await page.locator("[data-task4-rendered-subtree]").evaluate(root =>
            /expectedToken|private-answer|data-correct|correctness/iu.test(root.innerHTML))).toBe(false);
        }
      }
    } finally {
      await Promise.all([mouseContext.close(), touchContext.close()]);
    }
  });
}

const CHARACTER_SHOTS = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.filter(record => record.kind === "character-pose");
const CHARACTER_GROUPS = Map.groupBy(CHARACTER_SHOTS, record => record.expectedRenderedFacts.characterId);
for (const [characterId, shots] of CHARACTER_GROUPS) {
  test(`every ${characterId} pose exposes its exact Task 4 renderer and part structure`, async ({ page }) => {
    test.setTimeout(120_000);
    for (const shot of shots) {
      await page.goto(shot.url);
      await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
      const character = page.locator("[data-task4-rendered-subtree] [data-sound-seekers-character]");
      const facts = shot.expectedRenderedFacts;
      await expect(character).toHaveCount(1);
      await expect(character).toHaveAttribute("data-character-id", facts.characterId);
      await expect(character).toHaveAttribute("data-pose-id", facts.poseId);
      await expect(character).toHaveAttribute("data-pose-renderer-id", facts.poseRendererId);
      await expect(character).toHaveAttribute("data-pose-composition-signature", facts.poseCompositionSignature);
      await expect(character).toHaveAttribute("data-character-visual-signature", facts.characterVisualSignature);
      expect(await character.locator("[data-character-part]").evaluateAll(nodes =>
        nodes.map(node => node.getAttribute("data-character-part")))).toEqual(facts.renderedPartIds);
    }
  });
}

test("every creator option renders byte-identical canonical appearances in preview and world", async ({ page }) => {
  test.setTimeout(120_000);
  const creatorShots = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.filter(record => record.kind === "creator-option");
  expect(creatorShots).toHaveLength(22);
  for (const shot of creatorShots) {
    await page.goto(shot.url);
    await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
    const root = page.locator("[data-task4-rendered-subtree]");
    const facts = shot.expectedRenderedFacts;
    await expect(root).toHaveAttribute("data-creator-serialized", facts.serializedAppearance);
    await expect(root).toHaveAttribute("data-creator-signature", facts.appearanceSignature);
    await expect(root.locator(`[data-option-id="${facts.selectedOptionId}"][aria-pressed="true"]`)).toHaveCount(1);
    for (const [context, expectedSignature, expectedParts] of [
      ["creator-preview", facts.previewAppearanceSignature, facts.previewRenderedPartIds],
      ["gallery-world", facts.worldAppearanceSignature, facts.worldRenderedPartIds]
    ]) {
      const character = root.locator(`[data-character-context="${context}"] [data-sound-seekers-character]`);
      await expect(character).toHaveAttribute("data-appearance-signature", expectedSignature);
      expect(await character.locator("[data-character-part]").evaluateAll(nodes =>
        nodes.map(node => node.getAttribute("data-character-part")))).toEqual(expectedParts);
    }
  }
});

test("both options of every boss render distinct exact ordinary, Wonder, and boss evidence", async ({ page }) => {
  test.setTimeout(180_000);
  const bossShots = SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX.filter(record => record.kind === "boss-branch");
  expect(bossShots).toHaveLength(16);
  const evidenceByScene = new Map();
  for (const shot of bossShots) {
    const facts = shot.expectedRenderedFacts;
    const variants = [];
    for (const [mode, queryMode, signature] of [
      ["ordinary", "route-landmark", facts.ordinaryCompositionSignature],
      ["wonder", "wonder", facts.wonderCompositionSignature],
      ["boss-resolved", "scene", facts.bossCompositionSignature]
    ]) {
      const target = new URL(shot.url, "http://gallery.invalid");
      target.searchParams.set("mode", queryMode);
      await page.goto(`${target.pathname}${target.search}`);
      const root = page.locator("[data-task4-rendered-subtree]");
      await expect(page.locator("[data-gallery-ready='true']")).toBeVisible();
      await expect(root.locator('[data-option-visual-id][data-control-state="settled"]'))
        .toHaveAttribute("data-option-visual-id", facts.selectedOptionVisualId);
      await expect(root.locator('[data-semantic-kind="post_decision"]'))
        .toHaveAttribute("data-code-native-semantic", facts.postDecisionSemanticId);
      await expect(root.locator("[data-sound-seekers-scene]"))
        .toHaveAttribute("data-visual-state-id", facts.resolvedVisualStateId);
      await expect(root.locator("[data-landmark-state]"))
        .toHaveAttribute("data-landmark-state", facts.landmarkStateId);
      await expect(root.locator("[data-world-composition]"))
        .toHaveAttribute("data-world-composition", mode);
      await expect(root.locator("[data-world-composition-signature]"))
        .toHaveAttribute("data-world-composition-signature", signature);
      const bytes = await page.screenshot({ fullPage: false, animations: "disabled" });
      variants.push({
        mode,
        signature,
        pngSha256: createHash("sha256").update(bytes).digest("hex")
      });
    }
    expect(new Set(variants.map(variant => variant.signature)).size).toBe(3);
    expect(new Set(variants.map(variant => variant.pngSha256)).size).toBe(3);
    const sceneEvidence = evidenceByScene.get(shot.sceneId) || [];
    sceneEvidence.push({ selectedOptionVisualId: facts.selectedOptionVisualId, variants });
    evidenceByScene.set(shot.sceneId, sceneEvidence);
  }
  for (const [sceneId, records] of evidenceByScene) {
    expect(records, sceneId).toHaveLength(2);
    expect(new Set(records.map(record => record.selectedOptionVisualId)).size, sceneId).toBe(2);
    for (let index = 0; index < 3; index += 1) {
      expect(records[0].variants[index].signature, `${sceneId} signature ${index}`)
        .not.toBe(records[1].variants[index].signature);
      expect(records[0].variants[index].pngSha256, `${sceneId} pixels ${index}`)
        .not.toBe(records[1].variants[index].pngSha256);
    }
  }
});
