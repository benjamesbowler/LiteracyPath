#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";
import { SEEDWAKE_STOP_IDS } from "../src/data/questChapterOne.js";
import { buildTrailSection } from "../src/utils/questHub.js";
import { buildPhysicalTask } from "../src/utils/questPhysicalMechanics.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, ".artifacts/quest/slice");
const PORT = await availableLoopbackPort();
const BASE = `http://127.0.0.1:${PORT}`;
const turnOnly = process.argv.includes("--turn-only");
const journeyOnly = process.argv.includes("--journey-only");
const slotsOnly = process.argv.includes("--slots-only");
const rewardOnly = process.argv.includes("--reward-only");
const stopFilter = process.argv.find(argument => argument.startsWith("--stop="))?.slice(7) || null;
const VIEWPORTS = Object.freeze({
  phone: Object.freeze({ width: 390, height: 844 }),
  ipad: Object.freeze({ width: 1194, height: 834 })
});
const RENDER_TIMEOUT = 50_000;

function availableLoopbackPort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(error => {
        if (error) reject(error);
        else if (!port) reject(new Error("Could not allocate a loopback port for the quest camera gate"));
        else resolve(port);
      });
    });
  });
}

function startServer() {
  const server = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" }
  });
  let output = "";
  const capture = chunk => {
    output = `${output}${chunk}`.slice(-12_000);
  };
  server.stdout.on("data", capture);
  server.stderr.on("data", capture);
  server.getCapturedOutput = () => output;
  return server;
}

async function waitForServer(server, timeout = 60_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Quest preview exited before it was ready:\n${server.getCapturedOutput()}`);
    }
    try {
      const response = await fetch(BASE, { signal: AbortSignal.timeout(1500) });
      if (response.ok || response.status === 404) return;
    } catch {
      // The bounded loop reports a clear failure at the deadline.
    }
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error(`Quest preview did not start on ${BASE}`);
}

function launchBrowser() {
  return chromium.launch({
    args: journeyOnly ? [
      "--use-angle=metal",
      "--ignore-gpu-blocklist"
    ] : [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist"
    ]
  });
}

function scenarios() {
  return SEEDWAKE_STOP_IDS.flatMap(stopId => {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    return section.encounters.map((encounter, encounterIndex) => ({
      stopId,
      encounterIndex,
      encounterKind: encounter.kind,
      beatIndex: 0
    }));
  });
}

function slotScenario() {
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    for (const [encounterIndex, encounter] of section.encounters.entries()) {
      for (const [beatIndex, beat] of encounter.beats.entries()) {
        const task = buildPhysicalTask(section, encounter, beat, beatIndex);
        if (beat.word && task?.stages.length > 1 && task.mechanic === "bridge-build") {
          return { stopId, encounterIndex, beatIndex, stages: task.stages.length };
        }
      }
    }
  }
  return null;
}

async function openEncounter(browser, scenario, viewportName) {
  const viewport = VIEWPORTS[viewportName];
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const problems = [];
  page.on("console", message => { if (message.type() === "error") problems.push(message.text()); });
  page.on("pageerror", error => problems.push(error.message));
  const done = Math.max(0, Number(scenario.stopId.slice(1)) - 1);
  const url = `${BASE}/preview/quest.html?view=world&stop=${scenario.stopId}&done=${done}`
    + `&active=${scenario.encounterIndex}&beat=${scenario.beatIndex || 0}&renderer=legacy3d&sound=0&adapt=0`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForFunction(() => document.querySelector(".qh-root.is-ready"), null, { timeout: RENDER_TIMEOUT });
  await page.waitForFunction(() => {
    const proof = window.__questSliceDebug?.snapshot;
    return proof
      && proof.items.length > 0
      && proof.hudNodes === 2
      && proof.camera.settled
      && proof.camera.delta < 0.006;
  }, null, { timeout: RENDER_TIMEOUT });
  const proof = await page.evaluate(() => structuredClone(window.__questSliceDebug.snapshot));
  const failedItems = proof.items.filter(item => !item.insideSafeArea || !item.rayClear);
  const expectedKind = scenario.encounterKind;
  const mismatch = proof.encounterKind !== expectedKind
    ? [`expected ${expectedKind}, rendered ${proof.encounterKind}`]
    : [];
  const fileBase = `${scenario.stopId}-encounter-${scenario.encounterIndex + 1}-${expectedKind}-${viewportName}`;
  await page.screenshot({ path: path.join(OUT, `${fileBase}.png`), fullPage: false, timeout: 60_000, animations: "disabled" });
  fs.writeFileSync(path.join(OUT, `${fileBase}.json`), `${JSON.stringify({ proof, problems }, null, 2)}\n`);
  return { page, proof, problems: [...problems, ...mismatch], failedItems, fileBase };
}

async function captureWideFrames(browser) {
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const page = await browser.newPage({ viewport: VIEWPORTS.ipad, deviceScaleFactor: 1 });
    const done = Math.max(0, Number(stopId.slice(1)) - 1);
    await page.goto(`${BASE}/preview/quest.html?view=world&stop=${stopId}&done=${done}&renderer=legacy3d&sound=0&adapt=0`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000
    });
    await page.waitForFunction(() => document.querySelector(".qh-root.is-ready"), null, { timeout: RENDER_TIMEOUT });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, `${stopId}-wide-ipad.png`), fullPage: false, timeout: 60_000 });
    await page.close();
  }
}

async function captureSlotSequence(browser, scenario) {
  if (!scenario) throw new Error("No multi-grapheme Seedwake bridge task exists");
  const result = await openEncounter(browser, { ...scenario, encounterKind: "broken-bridge" }, "ipad");
  const { page } = result;
  try {
    await page.screenshot({ path: path.join(OUT, "phoneme-slots-empty.png"), fullPage: false, timeout: 60_000 });
    for (let stage = 0; stage < scenario.stages; stage += 1) {
      await page.waitForFunction(() => typeof window.__questSliceDebug?.choose === "function", null, { timeout: RENDER_TIMEOUT });
      const selected = await page.evaluate(() => window.__questSliceDebug?.choose?.("correct") || false);
      if (!selected) throw new Error(`Could not select the correct bridge piece at stage ${stage}`);
      if (stage < scenario.stages - 1) {
        try {
          await page.waitForFunction(expected => (
            window.__questSliceDebug?.snapshot?.stageIndex === expected
          ), stage + 1, { timeout: 8_000 });
        } catch (error) {
          const evidence = await page.evaluate(() => ({
            snapshot: window.__questSliceDebug?.snapshot || null,
            journey: window.__questSliceDebug?.journey || null,
            screen: document.querySelector(".qh-root")?.className || null,
            feedback: document.querySelector(".qh-interaction-feedback")?.textContent?.trim() || null,
            prompt: document.querySelector(".qh-objective")?.textContent?.trim() || null
          }));
          throw new Error(`Bridge stage ${stage} did not advance: ${JSON.stringify(evidence)}`, { cause: error });
        }
        await page.screenshot({ path: path.join(OUT, `phoneme-slots-fill-${stage + 1}.png`), fullPage: false, timeout: 60_000 });
      } else {
        await page.waitForFunction(() => document.querySelector(".qh-phoneme-build.is-blending .qh-success-marker"), null, { timeout: 4_000 });
        await page.screenshot({ path: path.join(OUT, "phoneme-slots-blend.png"), fullPage: false, timeout: 60_000 });
      }
    }
  } finally {
    await page.close();
  }
}

async function captureAccessibleSuccess(browser, scenario) {
  if (!scenario) throw new Error("No Seedwake word task exists for the accessibility proof");
  const page = await browser.newPage({ viewport: VIEWPORTS.phone, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const done = Math.max(0, Number(scenario.stopId.slice(1)) - 1);
  const url = `${BASE}/preview/quest.html?view=world&stop=${scenario.stopId}&done=${done}`
    + `&active=${scenario.encounterIndex}&beat=${scenario.beatIndex}&renderer=legacy3d&sound=0&adapt=0`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForFunction(() => window.__questSliceDebug?.snapshot?.camera?.settled, null, { timeout: RENDER_TIMEOUT });
  for (let stage = 0; stage < scenario.stages; stage += 1) {
    await page.waitForFunction(() => typeof window.__questSliceDebug?.choose === "function", null, { timeout: RENDER_TIMEOUT });
    const selected = await page.evaluate(() => window.__questSliceDebug?.choose?.("correct") || false);
    if (!selected) throw new Error(`Accessible success could not choose stage ${stage}`);
    if (stage < scenario.stages - 1) {
      await page.waitForFunction(expected => window.__questSliceDebug?.snapshot?.stageIndex === expected, stage + 1, { timeout: 8_000 });
    }
  }
  await page.waitForFunction(() => document.querySelector(".qh-success-marker"), null, { timeout: 4_000 });
  const evidence = await page.evaluate(() => ({
    marker: document.querySelector(".qh-success-marker")?.textContent?.trim() || "",
    announcement: document.querySelector('[aria-live="assertive"]')?.textContent?.trim() || "",
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    muted: new URLSearchParams(location.search).get("sound") === "0"
  }));
  if (!evidence.marker || !evidence.announcement || !evidence.reducedMotion || !evidence.muted) {
    throw new Error(`Accessible success evidence is incomplete: ${JSON.stringify(evidence)}`);
  }
  await page.screenshot({
    path: path.join(OUT, "phoneme-success-reduced-motion-phone.png"),
    fullPage: false,
    timeout: 60_000,
    animations: "disabled"
  });
  fs.writeFileSync(path.join(OUT, "accessible-success.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  await page.close();
}

async function captureGateAndReward(browser) {
  const gate = await browser.newPage({ viewport: VIEWPORTS.ipad, deviceScaleFactor: 1 });
  await gate.goto(`${BASE}/preview/quest.html?view=world&stop=s5&done=4&checkpoint=gate&renderer=legacy3d&sound=0&adapt=0`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  });
  await gate.waitForFunction(() => document.querySelector(".qh-root.is-ready .qh-next-call.is-gate"), null, { timeout: RENDER_TIMEOUT });
  await gate.screenshot({ path: path.join(OUT, "seedwake-gate-open.png"), fullPage: false, timeout: 60_000 });
  await gate.close();

  const reward = await browser.newPage({ viewport: VIEWPORTS.ipad, deviceScaleFactor: 1 });
  await reward.goto(`${BASE}/preview/quest.html?view=ceremony&stop=s5&done=5&renderer=legacy3d&sound=0&adapt=0`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  });
  await reward.waitForFunction(() => document.querySelector('[data-equipped-gear="stone-staff"] .q-ceremony-pixel-beastie'), null, { timeout: RENDER_TIMEOUT });
  await reward.screenshot({ path: path.join(OUT, "seedwake-reward-equipped.png"), fullPage: false, timeout: 60_000 });
  await reward.close();
}

async function captureTurnPerformance(browser) {
  const page = await browser.newPage({ viewport: VIEWPORTS.ipad, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/preview/quest.html?view=world&stop=s3&done=2&checkpoint=turn&renderer=legacy3d&sound=0&adapt=0`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  });
  await page.waitForFunction(() => document.querySelector(".qh-root.is-ready"), null, { timeout: RENDER_TIMEOUT });
  await page.waitForFunction(() => (
    window.__questSliceDebug?.motion && !document.querySelector(".qh-encounter-hud")
  ), null, { timeout: RENDER_TIMEOUT });
  const canvas = page.locator(".qh-canvas");
  await canvas.focus();
  const before = await page.evaluate(() => structuredClone(window.__questSliceDebug.motion));
  await page.screenshot({ path: path.join(OUT, "locomotion-turn-before.png"), fullPage: false, timeout: 60_000 });
  await page.keyboard.down("ArrowUp");
  await page.keyboard.down("ArrowLeft");
  await page.waitForFunction(() => {
    const motion = window.__questSliceDebug?.motion;
    return motion?.speed > 0.8 && Math.abs(motion.bank) > 0.03;
  }, null, { timeout: 4_000 });
  const banked = await page.evaluate(() => structuredClone(window.__questSliceDebug.motion));
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("ArrowUp");
  await page.screenshot({ path: path.join(OUT, "locomotion-turn-banked.png"), fullPage: false, timeout: 60_000 });
  await page.waitForFunction(() => {
    const motion = window.__questSliceDebug?.motion;
    return motion?.settled && Math.abs(motion.bank) < 0.008;
  }, null, { timeout: 8_000 });
  const settled = await page.evaluate(() => structuredClone(window.__questSliceDebug.motion));
  await page.screenshot({ path: path.join(OUT, "locomotion-turn-settled.png"), fullPage: false, timeout: 60_000 });
  fs.writeFileSync(path.join(OUT, "locomotion-evidence.json"), `${JSON.stringify({ before, banked, settled }, null, 2)}\n`);
  await page.close();
}

function journeyExpectations() {
  const expected = new Map();
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    for (const encounter of section.encounters) {
      const selections = encounter.beats.reduce((total, beat, beatIndex) => {
        const task = buildPhysicalTask(section, encounter, beat, beatIndex);
        return total + Math.max(1, task?.stages?.length || 0);
      }, 0);
      expected.set(`${stopId}:${encounter.id}`, selections);
    }
  }
  return expected;
}

async function captureFullJourney(browser) {
  const page = await browser.newPage({ viewport: VIEWPORTS.ipad, deviceScaleFactor: 1 });
  const problems = [];
  page.on("console", message => { if (message.type() === "error") problems.push(message.text()); });
  page.on("pageerror", error => problems.push(error.message));
  await page.goto(`${BASE}/preview/quest.html?view=world&stop=s1&done=0&renderer=legacy3d&sound=0&adapt=0`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  });
  await page.waitForFunction(() => window.__questSliceDebug?.journey, null, { timeout: RENDER_TIMEOUT });

  const expected = journeyExpectations();
  const selections = new Map();
  const selectionSteps = new Set();
  const visitedStops = new Set();
  const events = [];
  let iterations = 0;

  while (iterations < 240) {
    iterations += 1;
    const state = await page.evaluate(() => ({
      journey: window.__questSliceDebug?.journey || null,
      snapshot: window.__questSliceDebug?.snapshot || null,
      reward: Boolean(document.querySelector(".q-reward"))
    }));
    if (state.reward) break;
    if (!state.journey) {
      try {
        await page.waitForFunction(() => window.__questSliceDebug?.journey || document.querySelector(".q-reward"), null, { timeout: 15_000 });
      } catch (error) {
        const handoff = await page.evaluate(() => ({
          layers: [...document.querySelectorAll(".q-journey-layer")].map(layer => ({
            stopId: layer.getAttribute("data-stop"),
            className: layer.className,
            ariaHidden: layer.getAttribute("aria-hidden"),
            hubInteractive: layer.querySelector(".qh-root")?.getAttribute("data-interactive") || null,
            has2d: Boolean(layer.querySelector(".q2d-root"))
          })),
          trailNotice: document.querySelector(".q-trail-notice")?.textContent?.trim() || "",
          bodyText: document.body.textContent?.replace(/\s+/g, " ").trim().slice(0, 800) || ""
        }));
        throw new Error(`${error.message} during handoff ${JSON.stringify({ handoff, problems })}`, { cause: error });
      }
      continue;
    }

    visitedStops.add(state.journey.stopId);
    if (state.journey.phase === "teach") {
      const guideButton = page.locator('.qh-root[data-interactive="true"] .qw-go');
      const label = await guideButton.textContent();
      await guideButton.click();
      events.push({ type: "guide", stopId: state.journey.stopId, meetIndex: state.journey.meetIndex, label: label?.trim() || "" });
      await page.waitForTimeout(120);
      continue;
    }
    if (state.journey.activeId) {
      const encounterKey = `${state.journey.stopId}:${state.journey.activeId}`;
      const previous = {
        stopId: state.journey.stopId,
        activeId: state.journey.activeId,
        beatIndex: state.journey.beatIndex,
        stageIndex: state.journey.stageIndex
      };
      await page.waitForFunction(() => {
        const snapshot = window.__questSliceDebug?.snapshot;
        return snapshot?.items?.length > 0 && snapshot.camera?.settled;
      }, null, { timeout: RENDER_TIMEOUT });
      const selectionStep = `${encounterKey}:${previous.beatIndex}:${previous.stageIndex}`;
      if (selectionSteps.has(selectionStep)) throw new Error(`Journey repeated live stage ${selectionStep}`);
      const selected = await page.evaluate(() => window.__questSliceDebug.choose("correct"));
      if (!selected) throw new Error(`No correct live choice was available for ${encounterKey}`);
      selectionSteps.add(selectionStep);
      selections.set(encounterKey, (selections.get(encounterKey) || 0) + 1);
      events.push({ type: "correct", ...previous });
      console.log(`JOURNEY ${encounterKey} beat ${previous.beatIndex} stage ${previous.stageIndex}`);
      try {
        await page.waitForFunction(prior => {
          if (document.querySelector(".q-reward")) return true;
          const journey = window.__questSliceDebug?.journey;
          return !journey
            || journey.stopId !== prior.stopId
            || journey.activeId !== prior.activeId
            || journey.beatIndex !== prior.beatIndex
            || journey.stageIndex !== prior.stageIndex;
        }, previous, { timeout: 20_000 });
      } catch (error) {
        const after = await page.evaluate(() => ({
          journey: window.__questSliceDebug?.journey || null,
          snapshot: window.__questSliceDebug?.snapshot || null,
          feedback: document.querySelector('[aria-live="assertive"]')?.textContent?.trim() || ""
        }));
        throw new Error(`${error.message} after ${JSON.stringify({ previous, after })}`, { cause: error });
      }
      continue;
    }

    const priorStopId = state.journey.stopId;
    const priorSolved = state.journey.solvedCount;
    const priorPhase = state.journey.phase;
    const routeButton = page.locator('.qh-root[data-interactive="true"] .qh-next-call');
    await routeButton.click();
    try {
      await page.waitForFunction(prior => {
        if (document.querySelector(".q-reward")) return true;
        const journey = window.__questSliceDebug?.journey;
        return !journey
          || journey.stopId !== prior.stopId
          || journey.phase !== prior.phase
          || Boolean(journey.activeId)
          || journey.solvedCount > prior.solved;
      }, { stopId: priorStopId, solved: priorSolved, phase: priorPhase }, { timeout: RENDER_TIMEOUT });
    } catch (error) {
      const blocked = await page.evaluate(() => ({
        journey: window.__questSliceDebug?.journey || null,
        motion: window.__questSliceDebug?.motion || null,
        layers: [...document.querySelectorAll(".q-journey-layer")].map(layer => ({
          stopId: layer.getAttribute("data-stop"),
          className: layer.className,
          interactive: layer.querySelector(".qh-root")?.getAttribute("data-interactive") || null
        }))
      }));
      throw new Error(`${error.message} while walking ${JSON.stringify(blocked)}`, { cause: error });
    }
    events.push({ type: state.journey.gateOpen ? "gate-cross" : "walk", stopId: priorStopId });
  }

  await page.waitForFunction(() => document.querySelector('[data-equipped-gear="stone-staff"] .q-ceremony-pixel-beastie'), null, { timeout: RENDER_TIMEOUT });
  const missingStops = SEEDWAKE_STOP_IDS.filter(stopId => !visitedStops.has(stopId));
  const missingEncounters = [...expected.keys()].filter(key => !selections.has(key));
  const unknownEncounters = [...selections.keys()].filter(key => !expected.has(key));
  const gateCrosses = events.filter(event => event.type === "gate-cross").map(event => event.stopId);
  if (missingStops.length || missingEncounters.length || unknownEncounters.length || gateCrosses.length !== SEEDWAKE_STOP_IDS.length || problems.length) {
    throw new Error(JSON.stringify({ missingStops, missingEncounters, unknownEncounters, gateCrosses, problems }));
  }
  const evidence = {
    visitedStops: [...visitedStops],
    encountersCompleted: expected.size,
    correctSelections: [...selections.values()].reduce((sum, count) => sum + count, 0),
    rewardGear: await page.locator("[data-equipped-gear]").getAttribute("data-equipped-gear"),
    events
  };
  await page.screenshot({ path: path.join(OUT, "seedwake-journey-complete.png"), fullPage: false, timeout: 60_000 });
  fs.writeFileSync(path.join(OUT, "journey-report.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  await page.close();
}

async function buildContactSheet() {
  const files = fs.readdirSync(OUT)
    .filter(file => file.endsWith(".png") && file !== "slice-contact-sheet.png")
    .sort();
  const thumbs = await Promise.all(files.map(async file => ({
    input: await sharp(path.join(OUT, file)).resize(298, 209, { fit: "cover" }).png().toBuffer(),
    label: file
  })));
  const columns = 4;
  const rows = Math.ceil(thumbs.length / columns);
  const width = columns * 314;
  const height = rows * 244;
  const composites = thumbs.map((thumb, index) => ({
    input: thumb.input,
    left: (index % columns) * 314 + 8,
    top: Math.floor(index / columns) * 244 + 8
  }));
  await sharp({ create: { width, height, channels: 3, background: "#17251c" } })
    .composite(composites)
    .jpeg({ quality: 86 })
    .toFile(path.join(OUT, "slice-contact-sheet.jpg"));
}

fs.mkdirSync(OUT, { recursive: true });
const server = startServer();
let browser;
let failures = 0;
const reports = [];
const stopServer = () => {
  try { process.kill(-server.pid); } catch { server.kill("SIGKILL"); }
};

try {
  await waitForServer(server);
  browser = await launchBrowser();
  if (turnOnly) {
    await captureTurnPerformance(browser);
    console.log("check:quest-slice-camera turn proof OK - acceleration, bank and settled deceleration captured");
  } else if (journeyOnly) {
    await captureFullJourney(browser);
    console.log("check:quest-slice-camera journey proof OK - s1-s5 completed through the live gates and reward");
  } else if (slotsOnly) {
    await captureSlotSequence(browser, slotScenario());
    console.log("check:quest-slice-camera slot proof OK - every phoneme advances and blends in order");
  } else if (rewardOnly) {
    await captureGateAndReward(browser);
    console.log("check:quest-slice-camera reward proof OK - open gate and equipped Beastie captured");
  } else {
    const encounterScenarios = stopFilter
      ? scenarios().filter(scenario => scenario.stopId === stopFilter)
      : scenarios();
    if (stopFilter && !encounterScenarios.length) throw new Error(`Unknown camera stop filter: ${stopFilter}`);
    for (const scenario of encounterScenarios) {
      for (const viewportName of Object.keys(VIEWPORTS)) {
        let result;
        try {
          result = await openEncounter(browser, scenario, viewportName);
          const ok = result.problems.length === 0 && result.failedItems.length === 0;
          if (!ok) failures += 1;
          reports.push({
            scenario: result.fileBase,
            ok,
            problems: result.problems,
            failedItems: result.failedItems
          });
          console.log(`${ok ? "PASS" : "FAIL"} ${result.fileBase} (${result.proof.items.length} choices)`);
          if (viewportName === "ipad" && scenario.encounterIndex === 0) {
            const selected = await result.page.evaluate(() => window.__questSliceDebug.choose("correct"));
            if (!selected) {
              failures += 1;
              reports.push({ scenario: `${scenario.stopId}-verb-action`, ok: false, problems: ["correct action unavailable"] });
            } else {
              await result.page.waitForTimeout(180);
              await result.page.screenshot({ path: path.join(OUT, `${scenario.stopId}-verb-action.png`), fullPage: false, timeout: 60_000, animations: "disabled" });
            }
          }
        } catch (error) {
          failures += 1;
          reports.push({ scenario: `${scenario.stopId}-${scenario.encounterIndex}-${viewportName}`, ok: false, problems: [error.message] });
          console.error(`FAIL ${scenario.stopId} encounter ${scenario.encounterIndex + 1} ${viewportName}: ${error.message}`);
        } finally {
          await result?.page?.close();
        }
      }
    }
    if (!stopFilter) {
      await browser.close();
      browser = await launchBrowser();
      await captureWideFrames(browser);
      const wordScenario = slotScenario();
      await captureSlotSequence(browser, wordScenario);
      await captureAccessibleSuccess(browser, wordScenario);
      await captureGateAndReward(browser);
      await captureTurnPerformance(browser);
      await buildContactSheet();
    }
  }
} finally {
  await browser?.close();
  stopServer();
}

if (!turnOnly && !journeyOnly && !slotsOnly && !rewardOnly) {
  if (!stopFilter) fs.writeFileSync(path.join(OUT, "camera-report.json"), `${JSON.stringify({ failures, reports }, null, 2)}\n`);
  if (failures) {
    console.error(`check:quest-slice-camera found ${failures} failing scenario${failures === 1 ? "" : "s"}`);
    process.exitCode = 1;
  } else {
    console.log(`check:quest-slice-camera OK - ${reports.length} encounter/view checks, all choices safe and ray-clear`);
  }
}
