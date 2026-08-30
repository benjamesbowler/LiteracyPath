import { expect, test } from "@playwright/test";

async function pressPointerControl(page, control) {
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
}

test("Letter Leap production-word replay is reachable, sized for children, and follows sound state", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=1");

  const hear = page.getByRole("button", { name: "Hear the word", exact: true });
  await expect(hear).toBeVisible();
  await expect(hear).toBeEnabled();
  const box = await hear.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(56);
  expect(box?.height).toBeGreaterThanOrEqual(56);
  await hear.click();

  await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await expect(hear).toBeHidden();
  await page.getByRole("button", { name: "Turn spoken audio and game sounds on", exact: true }).click();
  await expect(hear).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("Letter Leap fullscreen controls prevent selection and receive held pointer input", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0");

  const player = page.getByRole("dialog", { name: "Letter Leap", exact: true });
  await expect(player).toBeVisible();
  expect(await player.evaluate(element => element.closest(".student-mode-app"))).toBeNull();

  const controls = [
    page.getByRole("button", { name: "Move left", exact: true }),
    page.getByRole("button", { name: "Move right", exact: true }),
    page.getByRole("button", { name: "Jump", exact: true })
  ];

  for (const control of controls) {
    await expect(control).toBeVisible();
    const inputStyles = await control.evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        touchAction: styles.touchAction,
        userSelect: styles.userSelect || styles.getPropertyValue("-webkit-user-select")
      };
    });
    expect(inputStyles).toEqual({
      touchAction: "none",
      userSelect: "none"
    });
  }

  await page.evaluate(() => {
    window.__letterLeapPointerEvents = [];
    document.body.addEventListener("pointerdown", event => {
      const control = event.target.closest?.('[data-ll="left"], [data-ll="right"], [data-ll="jump"]');
      if (!control) return;
      window.__letterLeapPointerEvents.push({
        control: control.getAttribute("data-ll"),
        defaultPrevented: event.defaultPrevented
      });
    });
  });

  for (const control of controls) await pressPointerControl(page, control);

  await expect.poll(() => page.evaluate(() => window.__letterLeapPointerEvents)).toEqual([
    { control: "left", defaultPrevented: true },
    { control: "right", defaultPrevented: true },
    { control: "jump", defaultPrevented: true }
  ]);
});

test("Letter Leap keeps the active ordered letter grounded after a fullscreen height change", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
    // Keep the first target in the left-most slot so running into it exercises
    // the actual canvas collision path without relying on jump timing.
    Math.random = () => 0.999999;
  });
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");

  const completedSlots = page.locator('[data-ll="word"] [aria-label^="Completed letter"]');
  await expect(page.getByRole("button", { name: "Jump", exact: true })).toBeVisible();
  await expect(page.locator(".letter-leap canvas")).toBeVisible();
  await expect(completedSlots).toHaveCount(0);

  // Reproduces the reported floating-letter failure: the shell grows after the
  // level has already stored its world coordinates.
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.waitForTimeout(120);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(850);
  await page.keyboard.up("ArrowRight");

  await expect.poll(() => completedSlots.count()).toBeGreaterThanOrEqual(1);
  expect(pageErrors).toEqual([]);
});
