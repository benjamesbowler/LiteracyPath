import { expect, test } from "@playwright/test";

const HARNESS = "/tests/fixtures/soundSeekersPersistenceControllerHarness.html";

async function installListenerTracker(page) {
  await page.addInitScript(() => {
    const trackedTypes = ["storage", "lp-progress-hydrated"];
    const listeners = new Map(trackedTypes.map(type => [type, new Set()]));
    const additions = new Map(trackedTypes.map(type => [type, 0]));
    const removals = new Map(trackedTypes.map(type => [type, 0]));
    const originalAdd = window.addEventListener;
    const originalRemove = window.removeEventListener;

    window.addEventListener = function addTrackedListener(type, listener, options) {
      const active = listeners.get(type);
      if (active && !active.has(listener)) {
        active.add(listener);
        additions.set(type, additions.get(type) + 1);
      }
      return Reflect.apply(originalAdd, this, [type, listener, options]);
    };
    window.removeEventListener = function removeTrackedListener(type, listener, options) {
      const active = listeners.get(type);
      if (active?.delete(listener)) removals.set(type, removals.get(type) + 1);
      return Reflect.apply(originalRemove, this, [type, listener, options]);
    };
    window.__soundSeekersPersistenceListeners = () => Object.fromEntries(
      trackedTypes.map(type => [type, {
        active: listeners.get(type).size,
        additions: additions.get(type),
        removals: removals.get(type)
      }])
    );
  });
}

async function openHarness(page, scope) {
  await installListenerTracker(page);
  await page.goto(`${HARNESS}?scope=${encodeURIComponent(scope)}`);
  await expect(page.locator("[data-sound-seekers-persistence-ready='true']")).toBeVisible();
}

async function readSnapshot(page) {
  return JSON.parse(await page.getByTestId("progress-snapshot").textContent());
}

async function writeCanonicalState(page, {
  scope,
  journeyStep,
  routeCursor = journeyStep,
  stopId = `s${journeyStep}`,
  settings = {},
  assignment = null,
  reset = null
}) {
  return page.evaluate(async input => {
    const {
      createSoundSeekersState,
      normalizeSoundSeekersState
    } = await import("/src/features/soundSeekers/engine/stateV2.js");
    const { questProgressStorageKey } = await import("/src/utils/questStore.js");
    const base = createSoundSeekersState({ assignment: input.assignment });
    const next = normalizeSoundSeekersState({
      ...base,
      ...(input.reset ? { reset: input.reset } : {}),
      trail: {
        ...base.trail,
        journeyStep: input.journeyStep,
        routeCursor: input.routeCursor
      },
      checkpoint: input.stopId ? {
        contentVersion: base.contentVersion,
        stopId: input.stopId
      } : null,
      settings: { ...base.settings, ...input.settings },
      assignment: input.assignment
    });
    localStorage.setItem(questProgressStorageKey(input.scope), JSON.stringify(next));
    return next;
  }, { scope, journeyStep, routeCursor, stopId, settings, assignment, reset });
}

async function dispatchHydrated(page, {
  studentId,
  resetApplied = false,
  stored = { attacker: "event payload must be ignored" }
}) {
  await page.evaluate(input => {
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: {
        studentId: input.studentId,
        rows: [{ area: "phonics_quest", key: "__all__" }],
        resetApplied: input.resetApplied,
        stored: input.stored
      }
    }));
  }, { studentId, resetApplied, stored });
}

test("delayed pristine hydration adopts the stored route, checkpoint, settings, and teacher reset", async ({ page }) => {
  const scope = "persistence-pristine";
  await openHarness(page, scope);

  await writeCanonicalState(page, {
    scope,
    journeyStep: 18,
    stopId: "s18",
    settings: { highContrast: true, displayMode: "pixel" }
  });
  await dispatchHydrated(page, { studentId: scope });

  await expect.poll(() => readSnapshot(page)).toMatchObject({
    trail: { journeyStep: 18, routeCursor: 18 },
    checkpoint: { stopId: "s18" },
    settings: { highContrast: true, displayMode: "pixel" },
    evidence: []
  });

  await writeCanonicalState(page, {
    scope,
    journeyStep: 1,
    stopId: null,
    reset: { epoch: 2, at: "2026-09-03T00:00:00.000Z" }
  });
  await dispatchHydrated(page, { studentId: scope, resetApplied: true });

  await expect.poll(() => readSnapshot(page)).toMatchObject({
    reset: { epoch: 2, at: "2026-09-03T00:00:00.000Z" },
    trail: { journeyStep: 1, routeCursor: 1 },
    checkpoint: null,
    evidence: []
  });
});

test("dirty local play keeps volatile route state while durable remote progress merges", async ({ page }) => {
  await openHarness(page, "persistence-dirty");
  await page.getByRole("button", { name: "Create local and remote conflict" }).click();

  await expect.poll(() => readSnapshot(page)).toMatchObject({
    trail: { journeyStep: 18, routeCursor: 4 },
    checkpoint: { stopId: "s4" },
    settings: {
      soundEnabled: false,
      highContrast: false,
      displayMode: "auto"
    },
    evidence: []
  });
});

test("only a real exact StorageEvent for the live scoped localStorage key can reconcile", async ({ page }) => {
  const scope = "persistence-storage-a";
  await openHarness(page, scope);
  const initial = await readSnapshot(page);
  await writeCanonicalState(page, { scope, journeyStep: 8, stopId: "s8" });

  await page.evaluate(async activeScope => {
    const { questProgressStorageKey } = await import("/src/utils/questStore.js");
    const key = questProgressStorageKey(activeScope);
    const plainEvent = new Event("storage");
    Object.defineProperties(plainEvent, {
      key: { value: key },
      newValue: { value: "{}" },
      storageArea: { value: localStorage }
    });
    window.dispatchEvent(plainEvent);
    window.dispatchEvent(new StorageEvent("storage", {
      key: `${key}:wrong`, newValue: "{}", storageArea: localStorage
    }));
    window.dispatchEvent(new StorageEvent("storage", {
      key, newValue: "{}", storageArea: sessionStorage
    }));
    window.dispatchEvent(new StorageEvent("storage", {
      key, newValue: null, storageArea: localStorage
    }));
  }, scope);
  expect(await readSnapshot(page)).toEqual(initial);

  await page.evaluate(async activeScope => {
    const { questProgressStorageKey } = await import("/src/utils/questStore.js");
    window.dispatchEvent(new StorageEvent("storage", {
      key: questProgressStorageKey(activeScope),
      newValue: JSON.stringify({ forgedPayload: 99 }),
      storageArea: localStorage
    }));
  }, scope);
  await expect.poll(() => readSnapshot(page)).toMatchObject({
    trail: { journeyStep: 8, routeCursor: 8 },
    checkpoint: { stopId: "s8" }
  });

  await page.getByRole("button", { name: "Switch progress scope" }).click();
  await expect(page.getByTestId("progress-scope")).toHaveText("persistence-storage-a-next");
  const newScopeInitial = await readSnapshot(page);
  await writeCanonicalState(page, { scope, journeyStep: 20, stopId: "s20" });
  await page.evaluate(async oldScope => {
    const { questProgressStorageKey } = await import("/src/utils/questStore.js");
    window.dispatchEvent(new StorageEvent("storage", {
      key: questProgressStorageKey(oldScope),
      newValue: "{}",
      storageArea: localStorage
    }));
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: { studentId: oldScope, rows: [], resetApplied: false }
    }));
  }, scope);
  expect(await readSnapshot(page)).toEqual(newScopeInitial);
});

test("StrictMode replay, scope replacement, remount, and unmount leave no progress listeners or dirty save", async ({ page }) => {
  const scope = "persistence-lifecycle";
  await openHarness(page, scope);

  await expect.poll(() => page.evaluate(() => window.__soundSeekersPersistenceListeners()))
    .toMatchObject({
      storage: { active: 1 },
      "lp-progress-hydrated": { active: 1 }
    });
  const mountedCounts = await page.evaluate(() => window.__soundSeekersPersistenceListeners());
  expect(mountedCounts.storage.additions).toBeGreaterThanOrEqual(2);
  expect(mountedCounts.storage.removals).toBeGreaterThanOrEqual(1);
  expect(mountedCounts["lp-progress-hydrated"].additions).toBeGreaterThanOrEqual(2);
  expect(mountedCounts["lp-progress-hydrated"].removals).toBeGreaterThanOrEqual(1);

  await page.getByRole("button", { name: "Commit route and unmount" }).click();
  await expect(page.getByTestId("controller-unmounted")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__soundSeekersPersistenceListeners()))
    .toMatchObject({
      storage: { active: 0 },
      "lp-progress-hydrated": { active: 0 }
    });
  const unmountedSave = await page.evaluate(activeScope => JSON.parse(
    localStorage.getItem(`lp-quest:${activeScope}`) || "null"
  ), scope);
  expect(unmountedSave).toMatchObject({
    trail: { journeyStep: 6, routeCursor: 6 },
    checkpoint: { stopId: "s6" },
    settings: { highContrast: true },
    evidence: []
  });

  await page.getByRole("button", { name: "Mount progress controller" }).click();
  await expect(page.locator("[data-sound-seekers-persistence-ready='true']")).toBeVisible();
  await page.getByRole("button", { name: "Commit route and switch scope" }).click();
  await expect(page.getByTestId("progress-scope")).toHaveText("persistence-lifecycle-next");
  const replacedScopeSave = await page.evaluate(activeScope => JSON.parse(
    localStorage.getItem(`lp-quest:${activeScope}`) || "null"
  ), scope);
  expect(replacedScopeSave).toMatchObject({
    trail: { journeyStep: 7, routeCursor: 7 },
    checkpoint: { stopId: "s7" },
    settings: { simplifiedScene: true },
    evidence: []
  });
  await expect.poll(() => page.evaluate(() => window.__soundSeekersPersistenceListeners()))
    .toMatchObject({
      storage: { active: 1 },
      "lp-progress-hydrated": { active: 1 }
    });

  await page.getByRole("button", { name: "Unmount progress controller" }).click();
  await expect.poll(() => page.evaluate(() => window.__soundSeekersPersistenceListeners()))
    .toMatchObject({
      storage: { active: 0 },
      "lp-progress-hydrated": { active: 0 }
    });
  const finalCounts = await page.evaluate(() => window.__soundSeekersPersistenceListeners());
  expect(finalCounts.storage.additions).toBe(finalCounts.storage.removals);
  expect(finalCounts["lp-progress-hydrated"].additions)
    .toBe(finalCounts["lp-progress-hydrated"].removals);
});

test("teacher assignment survives child commit locally and is absent from the actual cloud upload", async ({ page }) => {
  const scope = "persistence-assignment";
  const cloudWrites = [];
  await page.route("**/rest/v1/rpc/student_save_progress", async route => {
    cloudWrites.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });
  await openHarness(page, scope);
  const assignment = {
    targets: ["short_a"],
    note: "Hear and map it",
    assignedAt: "2026-09-03T00:00:00.000Z",
    by: "teacher"
  };
  await writeCanonicalState(page, {
    scope,
    journeyStep: 5,
    stopId: "s5",
    assignment
  });
  await dispatchHydrated(page, { studentId: scope });
  await expect.poll(() => readSnapshot(page)).toMatchObject({ assignment });

  await page.evaluate(async activeScope => {
    const { configureProgressSync } = await import("/src/utils/progressSync.js");
    configureProgressSync({
      studentId: activeScope,
      mode: "student",
      token: "sound-seekers-browser-token"
    });
  }, scope);
  await page.getByRole("button", { name: "Attempt child assignment takeover" }).click();
  await expect.poll(() => readSnapshot(page)).toMatchObject({ assignment });

  const localState = await page.evaluate(activeScope => JSON.parse(
    localStorage.getItem(`lp-quest:${activeScope}`) || "null"
  ), scope);
  expect(localState.assignment).toEqual(assignment);

  await page.evaluate(async () => {
    const { flushQueuedProgressWrites } = await import("/src/utils/progressSync.js");
    await flushQueuedProgressWrites();
  });
  expect(cloudWrites).toHaveLength(1);
  expect(cloudWrites[0]).toMatchObject({
    p_token: "sound-seekers-browser-token",
    p_area: "phonics_quest",
    p_key: "__all__"
  });
  expect(cloudWrites[0].p_payload.assignment).toBeUndefined();

  await page.evaluate(async () => {
    const { clearProgressSyncSession } = await import("/src/utils/progressSync.js");
    clearProgressSyncSession();
  });
});
