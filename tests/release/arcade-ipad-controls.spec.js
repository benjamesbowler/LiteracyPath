import { expect, test } from "@playwright/test";

import { GAME_LIST } from "../../src/data/learnGamesData.js";

const ARCADE_GAMES = GAME_LIST.filter(game => (game.surfaces || []).includes("arcade"));

function gestureViolations(controls) {
  return controls.flatMap(control => {
    if (control.userSelect !== "none") return [{ ...control, reason: "text selection is enabled" }];
    if (control.held && control.touchAction !== "none") return [{ ...control, reason: "held movement permits browser gestures" }];
    if (["none", "manipulation"].includes(control.touchAction)) return [];
    const axes = control.touchAction.split(/\s+/);
    if (!axes.length || axes.some(axis => !["pan-x", "pan-y"].includes(axis))) {
      return [{ ...control, reason: "unbounded or undeclared browser gestures" }];
    }
    if (!control.bodyContained || axes.some(axis => !control.scrollAxes.includes(axis))) {
      return [{ ...control, reason: "pan has no contained, named scrollport for its axis" }];
    }
    return [];
  });
}

// This policy is based on the control's action and scroll ownership, with no
// game-ID exemptions. A rack can fit on iPad yet own scrolling on a phone.
function inspectControls(controls) {
  const bodyContained = document.documentElement.scrollWidth <= innerWidth + 1
    && document.documentElement.scrollHeight <= innerHeight + 1;
  const heldAction = /^(?:(?:move|walk|steer|turn) (?:left|right|forward|back|backward|up|down)|climb (?:up|down|upward)|hold to (?:brake|reel)|accelerate|brake)(?:\b|$)/i;
  return controls.map(control => {
    const styles = getComputedStyle(control);
    const label = control.getAttribute("aria-label") || control.textContent?.trim() || control.tagName;
    const movementGroup = control.closest('[role="group"][aria-label], [aria-label="Climb and steer"]');
    const held = heldAction.test(label) || control.getAttribute("data-control-mode") === "held"
      || /^(?:move|walk|steer|drive)\b|^climb and steer$/i.test(movementGroup?.getAttribute("aria-label") || "");
    const scrollAxes = [];
    for (let owner = control.parentElement; owner && !owner.matches("body,html"); owner = owner.parentElement) {
      const ownerStyles = getComputedStyle(owner), rect = owner.getBoundingClientRect();
      const namedCollection = owner.hasAttribute("aria-label")
        && (owner.matches("section") || ["group", "listbox", "menu", "grid", "dialog"].includes(owner.getAttribute("role")));
      const contained = rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1;
      if (!namedCollection || !contained || !owner.clientWidth || !owner.clientHeight) continue;
      if (["auto", "scroll"].includes(ownerStyles.overflowX)) scrollAxes.push("pan-x");
      if (["auto", "scroll"].includes(ownerStyles.overflowY)) scrollAxes.push("pan-y");
    }
    return { label, held, touchAction: styles.touchAction, bodyContained, scrollAxes: [...new Set(scrollAxes)],
      userSelect: styles.userSelect || styles.getPropertyValue("-webkit-user-select") };
  });
}

test("gesture policy distinguishes held actions, native taps and contained collection scrolling", () => {
  const base = { label: "control", userSelect: "none", held: false, bodyContained: true, scrollAxes: [] };
  expect(gestureViolations([
    { ...base, held: true, touchAction: "none" },
    { ...base, touchAction: "manipulation" },
    { ...base, touchAction: "pan-x", scrollAxes: ["pan-x"] },
    { ...base, touchAction: "pan-x pan-y", scrollAxes: ["pan-x", "pan-y"] }
  ])).toEqual([]);
  expect(gestureViolations([
    { ...base, held: true, touchAction: "manipulation" },
    { ...base, held: true, touchAction: "pan-x", scrollAxes: ["pan-x"] },
    { ...base, touchAction: "auto" },
    { ...base, touchAction: "pan-y", scrollAxes: ["pan-x"] },
    { ...base, touchAction: "pan-x", scrollAxes: ["pan-x"], bodyContained: false },
    { ...base, touchAction: "none", userSelect: "text" }
  ])).toHaveLength(6);
});

test("pan ownership follows rendered named scrollports rather than game identities", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.setContent(`<style>
    body { margin: 0; } button { width: 56px; height: 56px; user-select: none; touch-action: pan-x; }
    .rack { width: 180px; height: 70px; overflow-x: auto; overflow-y: hidden; }
    .wide { width: 400px; } .vertical { overflow-x: hidden; overflow-y: auto; }
  </style>
  <div class="rack" role="group" aria-label="Scrollable sound choices"><div class="wide"><button id="owned">Choose sound</button></div></div>
  <div class="rack" role="group" aria-label="Currently fitting sound choices"><button id="fitting">Choose sound</button></div>
  <div class="rack"><div class="wide"><button id="unowned">Choose sound</button></div></div>
  <div class="rack vertical" role="group" aria-label="Vertical choices"><button id="wrong-axis">Choose sound</button></div>
  <div class="rack" role="group" aria-label="Scrollable choices"><div class="wide"><button id="held" aria-label="Move left">Left</button></div></div>`);
  const valid = await page.locator("#owned,#fitting").evaluateAll(inspectControls);
  expect(gestureViolations(valid)).toEqual([]);
  expect(await page.locator("#fitting").evaluate(button => button.parentElement.scrollWidth === button.parentElement.clientWidth)).toBe(true);
  const invalid = await page.locator("#unowned,#wrong-axis,#held").evaluateAll(inspectControls);
  expect(gestureViolations(invalid)).toHaveLength(3);
});

test("every Arcade control reserves held iPad input and contains intentional choice scrolling", async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  // Input-style coverage uses the low rendering tier; cinematic rendering has its own suite.
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const game of ARCADE_GAMES) {
    await page.goto(`/preview/game-overlay.html?game=${encodeURIComponent(game.id)}&sound=0`);
    const player = page.getByRole("dialog", { name: game.title, exact: true });
    await expect(player).toBeVisible();
    await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 40_000 });

    await expect(player.getByRole("dialog", { name: /instructions|how to play/i })).toHaveCount(0);
    await expect(player.getByRole("button", { name: /^(tap to play|play|to the yard)$/i })).toHaveCount(0);
    const controlStyles = await player.locator('button:visible, [role="button"]:visible').evaluateAll(inspectControls);

    expect(controlStyles.length, `${game.id} should expose at least one control`).toBeGreaterThan(0);
    expect(
      gestureViolations(controlStyles),
      `${game.id} permits selection, held-control gestures or uncontained collection pans`
    ).toEqual([]);
    const toolsTrigger = player.getByRole("button", { name: "Open game controls", exact: true });
    if (await toolsTrigger.isVisible()) {
      await toolsTrigger.click();
      const tools = player.getByRole("dialog", { name: "Game controls", exact: true });
      await expect(tools).toBeVisible();
      const toolsStyles = await tools.locator('button:visible, [role="button"]:visible').evaluateAll(inspectControls);
      expect(toolsStyles.length).toBeGreaterThan(1);
      expect(gestureViolations(toolsStyles), `${game.id} Tools controls permit unbounded browser gestures`).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(tools).toHaveCount(0);
      await expect(player.locator(".lg-game-player-main")).toBeFocused();
    }
  }
});
