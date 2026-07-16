// SHOOT THE QUEST — turn "I think it looks right" into PNGs somebody can open.
//
//   npm run shots
//
// Boots the dev server, drives a real Chromium through preview/quest.html at
// three real device sizes, and writes to docs/previews/shots/:
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/previews/shots");
const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}`;
const GATE_ONLY = process.argv.includes("--gate-only");
const SOFTWARE_SCENE_TIMEOUT = 45_000;
const SOFTWARE_HANDOFF_TIMEOUT = 60_000;

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
  { name: "den-ipad", url: "/preview/quest.html?view=den&done=6", size: "ipad" },
  { name: "world-s1-ipad", url: "/preview/quest.html?view=world&stop=s1", size: "ipad" },
  { name: "world-s12-ipad", url: "/preview/quest.html?view=world&stop=s12&done=11", size: "ipad" },
  { name: "world-s24-ipad", url: "/preview/quest.html?view=world&stop=s24&done=23", size: "ipad" },
  { name: "creator-ipad", url: "/preview/quest.html?view=creator", size: "ipad" },
  { name: "post-ipad", url: "/preview/quest.html?view=post&done=20", size: "ipad" },
  { name: "world-s1-phone", url: "/preview/quest.html?view=world&stop=s1", size: "phone" },
  { name: "world-s1-question-phone", url: "/preview/quest.html?view=world&stop=s1&active=1&creature=showcase", size: "phone" },
  { name: "world-s1-gate-ipad", url: "/preview/quest.html?view=world&stop=s1&checkpoint=gate&creature=showcase", size: "ipad" },
  { name: "pal-three-items-phone", url: "/preview/pal.html?companion=chips&back=gear-explorer-pack&feet=gear-trail-boots&head=gear-wizard-hat", size: "phone" },
  { name: "den-phone", url: "/preview/quest.html?view=den&done=6", size: "phone" },
  { name: "world-s1-desktop", url: "/preview/quest.html?view=world&stop=s1", size: "desktop" },
  { name: "home-comic-ipad", url: "/preview/home.html", size: "ipad" },
  { name: "home-sage-ipad", url: "/preview/home.html?skin=sage", size: "ipad" },
  { name: "home-sage-phone", url: "/preview/home.html?skin=sage", size: "phone" }
];

function startServer() {
  // `detached` so the whole process group can be killed. Without it a crashed run
  // leaves a vite holding the port, and the NEXT run dies on --strictPort with a
  // message that has nothing to do with the real problem.
  const proc = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" }
  });
  proc.stdout.on("data", () => {});
  proc.stderr.on("data", d => process.stderr.write(`  [vite] ${d}`));
  return proc;
}

async function checkGateHandoff(browser) {
  const page = await browser.newPage({ viewport: SIZES.phone, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(`PAGE ERROR: ${error.message}`));
  try {
    await page.goto(`${BASE}/preview/quest.html?view=world&stop=s1&checkpoint=gate&creature=showcase&display=low`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000
    });
    await page.waitForFunction(
      () => document.querySelector(".q-journey-layer.is-active .qh-root.is-ready"),
      null,
      { timeout: SOFTWARE_SCENE_TIMEOUT }
    );
    // The gate callout tracks an animated 3D target. Playwright's default click
    // waits for geometry to stop moving, which can never happen on a live scene.
    // Scope to the interactive journey layer and press the visible control.
    const gateControl = page.locator(".q-journey-layer.is-active .qh-next-call");
    await gateControl.waitFor({ state: "visible", timeout: 20_000 });
    await gateControl.click({ force: true });
    const handoffState = await page.waitForFunction(() => {
      const activeLayer = document.querySelector(".q-journey-layer.is-active");
      const trail = activeLayer?.querySelector(".qh-land-title strong")?.textContent?.trim();
      if (!activeLayer?.querySelector(".qh-root") || trail !== "Trail 2 of 40" || document.querySelector(".q-den")) return false;
      return {
        place: activeLayer.querySelector(".qh-land-title span")?.textContent?.trim() || "Next trail",
        trail
      };
    }, null, { timeout: SOFTWARE_HANDOFF_TIMEOUT });
    const destination = await handoffState.jsonValue();
    return { ok: errors.length === 0, detail: `${destination.place} - ${destination.trail}`, errors };
  } catch (error) {
    return { ok: false, detail: String(error.message).split("\n")[0], errors };
  } finally {
    await page.close();
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

  for (const [i, shot] of SHOTS.entries()) {
    const size = SIZES[shot.size];
    process.stdout.write(`  [${i + 1}/${SHOTS.length}] ${shot.name}… `);
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2 });

    const errors = [];
    const failedRequests = [];
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", e => errors.push(`PAGE ERROR: ${e.message}`));
    page.on("requestfailed", r => failedRequests.push(`${r.failure()?.errorText} ${r.url()}`));
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

    await page.screenshot({ path: path.join(OUT, `${shot.name}.png`), fullPage: false });

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

    const report = [
      `${shot.name}  —  ${shot.url}  @ ${size.width}x${size.height}`,
      "",
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

    const bad = errors.length + failedRequests.length + (stillLoading ? 1 : 0);
    problems += bad;
    console.log(
      `${bad ? `${errors.length} errors, ${[...new Set(failedRequests)].length} failed` : "clean"}`
      + `${stillLoading ? "  [doc never finished loading]" : ""}`
      + `${pending.length ? `  [${pending.length} requests never settled]` : ""}`
    );

    await page.close();
  }

  await browser.close();
  stop();

  console.log(`\nWrote ${SHOTS.length} screenshots to docs/previews/shots/`);
  if (problems) console.log(`${problems} console errors / failed requests / stuck loads — see the .txt beside each shot.`);

  // A diagnostic that cannot fail is not a gate. The Jul-14 gate screen
  // shipped as a fully blank world with ZERO console errors and this tool
  // printed "clean" — but a console error, a 404'd asset, or a document that
  // never finishes loading is exactly the class of silent screen-level break
  // this tool exists to catch, so from now on any of them fails the run (and
  // CI). Pixel-level blank detection lives in check:quest-route-visual.
  if (problems > 0) process.exitCode = 1;
  console.log("\nOpen the folder:  open docs/previews/shots");
}

main().catch(err => { console.error(err); process.exit(1); });
