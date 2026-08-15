// SHOOT THE QUEST — turn "I think it looks right" into PNGs somebody can open.
//
//   npm run shots
//
// Boots the dev server, drives a real Chromium through preview/quest.html at
// three real device sizes, and writes to .artifacts/quest/shots/:
//
//   <name>.png    what the screen actually looks like
//   <name>.txt    console errors, failed image requests, and every visible
//                 button on that screen
//
// The .txt is not a nicety. Without it the next question ("what do I click to get
// past the guide?") gets answered by guessing at a class name, which is exactly
// the habit this tool exists to kill. A failed-request list also catches the most
// common silent bug in this codebase by far: an <img> pointing at a path that
// isn't there, which renders as nothing at all and looks like a layout bug.
//
// Sound is off and animations are frozen at a fixed point, so two runs of the
// same commit produce the same pixels and a diff means something changed.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

// ACCESSIBILITY: axe-core runs on every shot marked `a11y: true` and its
// serious/critical violations land in the .txt beside the PNG. It sat in
// devDependencies with zero usages for weeks — a tool you never run is a
// tool you don't have. Report-first: set A11Y_ENFORCE=1 to make violations
// fail the run (flip it in CI once the baseline count is known and zero).
const A11Y_ENFORCE = process.env.A11Y_ENFORCE === "1";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, ".artifacts/quest/shots");
const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}`;
const GATE_ONLY = process.argv.includes("--gate-only");
const SOFTWARE_SCENE_TIMEOUT = 45_000;
const SOFTWARE_HANDOFF_TIMEOUT = 60_000;
const SOFTWARE_SCREENSHOT_TIMEOUT = 60_000;

// The sizes children actually hold. An iPad in landscape is the primary target;
// a phone is the cruellest test of a side-scroller; the desktop is what the
// teacher demos on.
const SIZES = {
  ipad: { width: 1180, height: 820 },
  phone: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 }
};

// Stop ids are s1…s40 — NOT zero-padded. "s01" resolves to nothing and renders a
// silent blank screen. Don't reintroduce it.
const SHOTS = [
  { name: "map-ipad", url: "/preview/quest.html?view=map&done=6", size: "ipad", a11y: true },
  { name: "world-s1-ipad", url: "/preview/quest.html?view=world&stop=s1", size: "ipad" },
  { name: "world-s12-ipad", url: "/preview/quest.html?view=world&stop=s12&done=11", size: "ipad" },
  { name: "world-s24-ipad", url: "/preview/quest.html?view=world&stop=s24&done=23", size: "ipad" },
  { name: "creator-ipad", url: "/preview/quest.html?view=creator", size: "ipad" },
  { name: "post-ipad", url: "/preview/quest.html?view=post&done=20", size: "ipad" },
  { name: "world-s1-phone", url: "/preview/quest.html?view=world&stop=s1", size: "phone" },
  { name: "world-s1-question-phone", url: "/preview/quest.html?view=world&stop=s1&active=1&creature=showcase", size: "phone" },
  { name: "world-s1-gate-ipad", url: "/preview/quest.html?view=world&stop=s1&checkpoint=gate&creature=showcase", size: "ipad" },
  { name: "pal-three-items-phone", url: "/preview/pal.html?companion=chips&back=gear-explorer-pack&feet=gear-trail-boots&head=gear-wizard-hat", size: "phone" },
  { name: "map-phone", url: "/preview/quest.html?view=map&done=6", size: "phone" },
  { name: "world-s1-desktop", url: "/preview/quest.html?view=world&stop=s1", size: "desktop" },
  { name: "home-sage-ipad", url: "/preview/home.html", size: "ipad", a11y: true },
  { name: "home-sage-phone", url: "/preview/home.html", size: "phone" },
  { name: "home-sage-desktop", url: "/preview/home.html", size: "desktop", a11y: true }
];

const onlyIndex = process.argv.indexOf("--only");
const requestedShotNames = onlyIndex >= 0
  ? new Set(String(process.argv[onlyIndex + 1] || "").split(",").map(value => value.trim()).filter(Boolean))
  : null;
const RUN_SHOTS = requestedShotNames
  ? SHOTS.filter(shot => requestedShotNames.has(shot.name))
  : SHOTS;
if (requestedShotNames && RUN_SHOTS.length !== requestedShotNames.size) {
  const known = new Set(SHOTS.map(shot => shot.name));
  const unknown = [...requestedShotNames].filter(name => !known.has(name));
  throw new Error(`Unknown shot name: ${unknown.join(", ")}`);
}

function startServer() {
  // `detached` so the whole process group can be killed. Without it a crashed run
  // leaves a vite holding the port, and the NEXT run dies on --strictPort with a
  // message that has nothing to do with the real problem.
  const proc = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      BROWSER: "none",
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || BASE,
      VITE_SUPABASE_ANON_KEY:
        process.env.VITE_SUPABASE_ANON_KEY || "quest-shots-test-key"
    }
  });
  proc.stdout.on("data", () => {});
  proc.stderr.on("data", d => process.stderr.write(`  [vite] ${d}`));
  return proc;
}

async function checkGateHandoff(browser) {
  const context = await browser.newContext({ viewport: SIZES.phone, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(`PAGE ERROR: ${error.message}`));
  try {
    await page.goto(`${BASE}/preview/quest.html?view=world&stop=s1&checkpoint=gate&creature=showcase&display=pixel`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000
    });
    await page.waitForFunction(
      () => document.querySelector(".q-journey-layer.is-active .qp-root[data-ready='true']"),
      null,
      { timeout: SOFTWARE_SCENE_TIMEOUT }
    );
    // Exercise the renderer children actually receive. A gate is crossed by
    // sustained movement, so keep ArrowUp held until the active journey layer
    // is the next authored stop; a one-frame key tap would be a timing guess.
    await page.keyboard.down("ArrowUp");
    let handoffState;
    try {
      handoffState = await page.waitForFunction(() => {
        const activeLayer = document.querySelector(".q-journey-layer.is-active");
        const root = activeLayer?.querySelector(".qp-root[data-ready='true']");
        if (!root || activeLayer?.getAttribute("data-stop") !== "s2" || document.querySelector(".q-den")) return false;
        return {
          stopId: activeLayer.getAttribute("data-stop"),
          place: activeLayer.querySelector(".qp-place span")?.textContent?.trim() || "Next trail",
          trail: activeLayer.querySelector(".qp-place strong")?.textContent?.trim() || ""
        };
      }, null, { timeout: SOFTWARE_HANDOFF_TIMEOUT });
    } finally {
      await page.keyboard.up("ArrowUp");
    }
    const destination = await handoffState.jsonValue();
    return {
      ok: destination.stopId === "s2" && errors.length === 0,
      detail: `${destination.place} - ${destination.trail}`,
      errors
    };
  } catch (error) {
    return { ok: false, detail: String(error.message).split("\n")[0], errors };
  } finally {
    await context.close();
  }
}

// Says what it is doing, every second. A silent tool that takes 40 seconds is
// indistinguishable from a hung one, and you cannot debug what you cannot see.
async function waitForServer(timeoutMs = 60_000) {
  const started = Date.now();
  const deadline = started + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 404) {
        console.log(`  dev server up on ${BASE} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
        return true;
      }
    } catch {
      // not up yet
    }
    process.stdout.write(`\r  waiting for the dev server… ${Math.round((Date.now() - started) / 1000)}s`);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log("");
  return false;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log("shots — booting the dev server…");
  const server = startServer();
  const stop = () => { try { process.kill(-server.pid); } catch { server.kill("SIGKILL"); } };

  if (!(await waitForServer())) {
    stop();
    console.error("\nThe dev server never came up on " + BASE + ".");
    process.exit(1);
  }

  let browser;
  try {
    // The world is Three.js. Headless Chromium has no GPU, so without a software
    // rasteriser WebGL silently fails and the canvas comes back BLACK — which
    // looks exactly like a broken scene and would send us off fixing a bug that
    // does not exist. SwiftShader renders it on the CPU: slow, correct, honest.
    browser = await chromium.launch({
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--ignore-gpu-blocklist",
        "--disable-frame-rate-limit",
        "--disable-gpu-vsync"
      ]
    });
  } catch (err) {
    stop();
    console.error("\nCould not start Chromium. Playwright's browser isn't installed.");
    console.error("Run this once, then try again:\n\n  npx playwright install chromium\n");
    console.error(String(err.message).split("\n")[0]);
    process.exit(1);
  }

  let problems = 0;
  process.stdout.write("  gate handoff… ");
  const handoff = await checkGateHandoff(browser);
  if (!handoff.ok) problems += Math.max(1, handoff.errors.length);
  console.log(handoff.ok ? `clean (${handoff.detail})` : `FAILED (${handoff.detail})`);

  if (GATE_ONLY) {
    await browser.close();
    stop();
    if (problems) process.exitCode = 1;
    return;
  }

  for (const [i, shot] of RUN_SHOTS.entries()) {
    const size = SIZES[shot.size];
    process.stdout.write(`  [${i + 1}/${RUN_SHOTS.length}] ${shot.name}… `);
    const context = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
    const page = await context.newPage();

    const errors = [];
    const failedRequests = [];
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", e => errors.push(`PAGE ERROR: ${e.message}`));
    page.on("requestfailed", request => {
      // Chromium deliberately cancels a media range request after it has enough
      // metadata or when an autoplay attempt is blocked. A missing/broken file
      // still produces a 4xx response below; only this normal media abort is
      // excluded from the failure count.
      if (
        request.resourceType() === "media"
        && request.failure()?.errorText === "net::ERR_ABORTED"
      ) return;
      failedRequests.push(`${request.failure()?.errorText} ${request.url()}`);
    });
    page.on("response", r => { if (r.status() >= 400) failedRequests.push(`HTTP ${r.status()} ${r.url()}`); });

    // NOT "networkidle", and NOT "load".
    //
    // With the 3D world mounted this page never finishes loading — the `load`
    // event never fires, so Chrome sits in a permanent "loading" state. (That is
    // a real bug in QuestHub, logged in the .txt below via the pending-request
    // list; it also makes the browser extension's screenshot tool unusable,
    // because it waits on document_idle.) Waiting on `load` here would just hang
    // this tool for the same reason. Take the shot regardless, and REPORT the
    // hang rather than being defeated by it.
    // EVERY WAIT IN HERE IS BOUNDED. Learned the hard way: the first version of
    // this script waited for all <img> elements to settle — on a page whose whole
    // problem is a request that NEVER settles. Promise.all on a never-resolving
    // promise hangs forever. A diagnostic tool that hangs on the bug it exists to
    // diagnose is worse than useless; it wastes the one person who can run it.
    //
    // So: nothing here can block. If something won't settle, we note it and shoot
    // anyway. The screenshot is the point.
    const bounded = (promise, ms, label) =>
      Promise.race([
        Promise.resolve(promise).catch(() => `${label}: threw`),
        new Promise(r => setTimeout(() => r(`${label}: TIMED OUT after ${ms}ms`), ms))
      ]);

    await page.goto(BASE + shot.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForFunction(() => window.__questReady === true, null, { timeout: 15_000 }).catch(() => {});
    const stillLoading = await page.evaluate(() => document.readyState !== "complete").catch(() => true);

    await bounded(page.evaluate(() => document.fonts?.ready), 5_000, "fonts");
    await bounded(
      page.evaluate(() => Promise.all(
        [...document.images].filter(i => !i.complete).map(i => new Promise(res => {
          i.addEventListener("load", res, { once: true });
          i.addEventListener("error", res, { once: true });
        }))
      )),
      6_000,
      "images"
    );
    await page.waitForTimeout(900);
    await page.addStyleTag({ content: "*,*::before,*::after{animation-play-state:paused !important;transition:none !important}" });
    await page.waitForTimeout(150);

    // SwiftShader can need more than Playwright's 30-second default to read a
    // settled 2x WebGL frame on a busy developer machine. The slice-camera gate
    // already allows a minute for the same renderer; keep this gate consistent.
    await page.screenshot({
      path: path.join(OUT, `${shot.name}.png`),
      fullPage: false,
      timeout: SOFTWARE_SCREENSHOT_TIMEOUT
    });

    // What is actually on this screen — so the next decision is made by looking,
    // not by guessing at a selector.
    const buttons = await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .filter(b => b.offsetParent !== null)
        .map(b => `  "${(b.textContent || b.getAttribute("aria-label") || "").trim().slice(0, 40)}"  .${b.className}`)
    );
    const canvases = await page.evaluate(() =>
      [...document.querySelectorAll("canvas")].map(c => `  <canvas> ${c.width}x${c.height}`)
    );

    // Which requests are STILL IN FLIGHT. This is the list that explains why the
    // document never reaches "complete" — a request that neither finishes nor
    // fails holds the load event open forever.
    const pending = await page.evaluate(() =>
      performance.getEntriesByType("resource")
        .filter(e => e.responseEnd === 0)
        .map(e => `  PENDING (never settled): ${e.name}`)
    );

    // Accessibility scan — serious/critical only (minor/moderate would bury
    // the signal; fix the screaming first).
    let axeViolations = [];
    if (shot.a11y) {
      try {
        const axe = await new AxeBuilder({ page }).analyze();
        axeViolations = axe.violations
          .filter(v => ["serious", "critical"].includes(v.impact))
          .map(v => `  ${v.impact.toUpperCase()} ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`);
      } catch (axeError) {
        axeViolations = [`  AXE FAILED TO RUN: ${axeError.message}`];
      }
    }

    const report = [
      `${shot.name}  —  ${shot.url}  @ ${size.width}x${size.height}`,
      "",
      ...(shot.a11y ? [`A11Y (serious/critical): ${axeViolations.length ? axeViolations.length : "none"}`, ...axeViolations, ""] : []),
      `DOCUMENT STATE: ${stillLoading ? "STILL LOADING — the load event never fired" : "complete"}`,
      ...(pending.length ? ["", `IN-FLIGHT REQUESTS (${pending.length}) — these are why:`, ...pending] : []),
      "",
      `CONSOLE ERRORS (${errors.length})`,
      ...(errors.length ? errors.map(e => `  ${e}`) : ["  none"]),
      "",
      `FAILED / 4xx REQUESTS (${failedRequests.length})`,
      ...(failedRequests.length ? [...new Set(failedRequests)].map(r => `  ${r}`) : ["  none"]),
      "",
      `VISIBLE BUTTONS (${buttons.length})`,
      ...(buttons.length ? buttons : ["  none"]),
      "",
      `CANVASES (${canvases.length})`,
      ...(canvases.length ? canvases : ["  none"]),
      ""
    ].join("\n");
    fs.writeFileSync(path.join(OUT, `${shot.name}.txt`), report);

    const uniqueFailedRequests = [...new Set(failedRequests)];
    const bad = errors.length + failedRequests.length + (stillLoading ? 1 : 0)
      + (A11Y_ENFORCE ? axeViolations.length : 0);
    if (!A11Y_ENFORCE && axeViolations.length) {
      console.log(`  a11y: ${axeViolations.length} serious/critical (reported, not enforced — A11Y_ENFORCE=1 to gate)`);
    }
    problems += bad;
    console.log(
      `${bad ? `${errors.length} errors, ${uniqueFailedRequests.length} failed` : "clean"}`
      + `${stillLoading ? "  [doc never finished loading]" : ""}`
      + `${pending.length ? `  [${pending.length} requests never settled]` : ""}`
    );
    for (const failure of uniqueFailedRequests) console.log(`    ${failure}`);
    for (const error of errors) console.log(`    ${error}`);

    await context.close();
  }

  await browser.close();
  stop();

  console.log(`\nWrote ${RUN_SHOTS.length} screenshots to .artifacts/quest/shots/`);
  if (problems) console.log(`${problems} console errors / failed requests / stuck loads — see the .txt beside each shot.`);

  // A diagnostic that cannot fail is not a gate. The Jul-14 gate screen
  // shipped as a fully blank world with ZERO console errors and this tool
  // printed "clean" — but a console error, a 404'd asset, or a document that
  // never finishes loading is exactly the class of silent screen-level break
  // this tool exists to catch, so from now on any of them fails the run (and
  // CI). Pixel-level blank detection lives in check:quest-route-visual.
  if (problems > 0) process.exitCode = 1;
  console.log("\nOpen the folder: .artifacts/quest/shots");
}

main().catch(err => { console.error(err); process.exit(1); });
