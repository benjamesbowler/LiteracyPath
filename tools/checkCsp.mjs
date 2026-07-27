import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(repoRoot, "dist");
const vercelConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, "vercel.json"), "utf8"));

const globalHeaderRule = vercelConfig.headers.find(rule => rule.source === "/(.*)");
assert.ok(globalHeaderRule, "vercel.json must define global security headers");

const globalHeaders = Object.fromEntries(
  globalHeaderRule.headers.map(header => [header.key, header.value])
);
const policy = globalHeaders["Content-Security-Policy"] || "";

const requiredPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "worker-src 'self' blob:"
];
for (const directive of requiredPolicy) {
  assert.ok(policy.includes(directive), `CSP is missing ${directive}`);
}
assert.equal(policy.includes("'unsafe-eval'"), false, "CSP must not allow unsafe-eval");
assert.equal(
  /script-src[^;]*'unsafe-inline'/.test(policy),
  false,
  "CSP must not allow inline scripts"
);
assert.equal(globalHeaders["Cross-Origin-Opener-Policy"], "same-origin");
assert.equal(globalHeaders["Cross-Origin-Resource-Policy"], "same-site");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".m4a", "audio/mp4"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".wav", "audio/wav"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"]
]);

function safeDistPath(urlValue) {
  const pathname = decodeURIComponent(new URL(urlValue, "http://127.0.0.1").pathname);
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const resolved = path.resolve(distRoot, requested);
  return resolved === distRoot || resolved.startsWith(`${distRoot}${path.sep}`)
    ? resolved
    : null;
}

function createServer() {
  return http.createServer((request, response) => {
    if (new URL(request.url || "/", "http://127.0.0.1").pathname === "/csp-eval-probe.js") {
      response.writeHead(200, {
        ...globalHeaders,
        "Cache-Control": "no-store",
        "Content-Type": "text/javascript; charset=utf-8"
      });
      response.end(
        "window.__cspEvalStarted=true;try{window.eval(\"window.__cspEvalRan=true\")}catch(error){window.__cspEvalBlocked=error instanceof EvalError}"
      );
      return;
    }
    const candidate = safeDistPath(request.url || "/");
    const filePath = candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
      ? candidate
      : path.join(distRoot, "index.html");
    const headers = {
      ...globalHeaders,
      "Cache-Control": "no-store",
      "Content-Type": contentTypes.get(path.extname(filePath).toLowerCase())
        || "application/octet-stream"
    };
    response.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = createServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

let browser;
try {
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.__cspViolations = [];
    window.addEventListener("securitypolicyviolation", event => {
      window.__cspViolations.push({
        blockedURI: event.blockedURI,
        effectiveDirective: event.effectiveDirective
      });
    });
  });

  const response = await page.goto(origin, { waitUntil: "domcontentloaded" });
  assert.ok(response, "built app did not return a response");
  assert.equal(response.headers()["content-security-policy"], policy);
  await page.waitForSelector("#root");
  await page.waitForTimeout(500);

  const startupViolations = await page.evaluate(() => window.__cspViolations);
  assert.deepEqual(startupViolations, [], "the production app violates its own CSP at startup");

  const probe = await page.evaluate(async () => {
    window.__cspInlineRan = false;
    window.__cspEvalRan = false;
    window.__cspEvalBlocked = false;
    const inline = document.createElement("script");
    inline.textContent = "window.__cspInlineRan = true";
    document.head.append(inline);

    const evalProbe = document.createElement("script");
    evalProbe.src = "/csp-eval-probe.js";
    const evalProbeFinished = new Promise(resolve => {
      evalProbe.addEventListener("load", resolve, { once: true });
      evalProbe.addEventListener("error", resolve, { once: true });
    });
    document.head.append(evalProbe);
    await evalProbeFinished;

    const external = document.createElement("script");
    external.src = "https://example.invalid/csp-probe.js";
    document.head.append(external);

    const frame = document.createElement("iframe");
    frame.src = "https://example.invalid/csp-frame";
    document.body.append(frame);

    const object = document.createElement("object");
    object.data = "data:text/html,csp-object";
    document.body.append(object);

    try {
      await fetch("https://example.invalid/csp-connect");
    } catch {
      // A blocked fetch is the expected outcome.
    }

    await new Promise(resolve => setTimeout(resolve, 250));
    return {
      evalBlocked: window.__cspEvalBlocked,
      evalRan: window.__cspEvalRan,
      inlineRan: window.__cspInlineRan,
      violations: window.__cspViolations
    };
  });

  assert.equal(probe.inlineRan, false, "inline script executed despite CSP");
  assert.equal(probe.evalRan, false, "eval executed despite CSP");
  assert.equal(probe.evalBlocked, true, "eval did not produce a CSP EvalError");

  const directives = new Set(probe.violations.map(item => item.effectiveDirective));
  for (const expected of ["script-src-elem", "frame-src", "object-src", "connect-src"]) {
    assert.ok(directives.has(expected), `browser did not enforce ${expected}`);
  }
  assert.ok(
    probe.violations.some(item => item.blockedURI === "inline"),
    "browser did not report the blocked inline script"
  );

  console.log(
    `CSP runtime passed: clean app startup; inline script, eval, external script, frame, object, and connect probes blocked (${probe.violations.length} violations observed).`
  );
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
