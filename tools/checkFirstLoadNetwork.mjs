import { chromium } from "playwright";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(repoRoot, "dist");
const analysisPath = path.join(distDir, "bundle-analysis.json");
const artifactDir = path.join(repoRoot, "docs", "release", "artifacts");
const mimeTypes = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff2": "font/woff2"
});
const forbiddenModuleFragments = Object.freeze([
  "/src/data/generated/runtimeShards/",
  "/src/data/generated/languageSkillQuestions.generated.js",
  "/src/data/generated/skillLevelGapQuestions.generated.js",
  "/src/data/generated/rhyming.generated.js",
  "/src/data/generated/hfwAssessmentQuestions.generated.js",
  "/src/data/generated/hfwLevel2Questions.generated.js",
  "/src/data/loadAssessmentSkillBank.js",
  "/src/data/guidedReading",
  "/src/data/firstFacts",
  "/src/data/moonwood",
  "/src/appState/elBenchmarkEngine.js",
  "/src/data/elBenchmarkAssessmentCatalog.js",
  "/src/data/elBenchmarkAssessments.js",
  "/src/data/elBenchmarkParallelFormContent.js",
  "/src/data/elBenchmarkSession.js",
  "/src/utils/elBenchmarkAssessmentScoring.js",
  "/node_modules/phaser/",
  "/node_modules/three/",
  "/node_modules/xlsx/",
  "/node_modules/exceljs/"
]);

function safeBuiltPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = path.resolve(distDir, relative);
  if (!candidate.startsWith(`${distDir}${path.sep}`) && candidate !== distDir) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  return path.join(distDir, "index.html");
}

function startServer() {
  const server = http.createServer((request, response) => {
    const filePath = safeBuiltPath(request.url || "/");
    if (!filePath || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    fs.createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise(closeResolve => server.close(closeResolve))
      });
    });
  });
}

function forbiddenChunkFiles(analysis) {
  return new Set(analysis.chunks
    .filter(chunk => chunk.modules.some(module => {
      const id = module.id.replaceAll("\\", "/");
      return forbiddenModuleFragments.some(fragment => id.includes(fragment));
    }))
    .map(chunk => path.basename(chunk.fileName)));
}

async function captureShell(browser, origin, surface) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  const requests = [];
  page.on("response", response => {
    const url = new URL(response.url());
    if (url.origin !== origin) return;
    requests.push({
      path: url.pathname,
      status: response.status(),
      type: response.request().resourceType()
    });
  });
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Choose your space" }).waitFor();
  if (surface === "student") {
    await page.getByRole("button", { name: "Children: Little Literacy Guides" }).click();
    await page.getByRole("heading", { name: "Enter your class code" }).waitFor();
  } else {
    await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
    await page.getByRole("heading", { name: "Teacher sign-in" }).waitFor();
  }
  await page.waitForTimeout(250);
  await context.close();
  return requests;
}

if (!fs.existsSync(analysisPath)) {
  console.error("First-load network check needs an analysed production build.");
  process.exit(1);
}

const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
const forbiddenFiles = forbiddenChunkFiles(analysis);
const server = await startServer();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const student = await captureShell(browser, server.origin, "student");
  const teacher = await captureShell(browser, server.origin, "teacher");
  const failures = [];
  for (const [surface, requests] of Object.entries({ student, teacher })) {
    const badRequests = requests.filter(request =>
      forbiddenFiles.has(path.basename(request.path))
    );
    if (badRequests.length) {
      failures.push(
        `${surface} shell loaded deferred chunks: ${badRequests.map(item => item.path).join(", ")}`
      );
    }
    const failedRequests = requests.filter(request => request.status >= 400);
    if (failedRequests.length) {
      failures.push(
        `${surface} shell returned HTTP failures: ${failedRequests
          .map(item => `${item.status} ${item.path}`)
          .join(", ")}`
      );
    }
  }

  const generatedAt = new Date().toISOString();
  const payload = {
    schemaVersion: 1,
    generatedAt,
    result: failures.length ? "FAIL" : "PASS",
    forbiddenDeferredChunkCount: forbiddenFiles.size,
    failures,
    surfaces: { student, teacher }
  };
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactDir, "first-load-network.json"),
    `${JSON.stringify(payload, null, 2)}\n`
  );

  const summary = [
    "# First-load production network",
    "",
    `Generated: ${generatedAt}`,
    "",
    "| Surface | Requests | JavaScript | Deferred bank/route violations | HTTP failures |",
    "|---|---:|---:|---:|---:|",
    ...Object.entries({ student, teacher }).map(([surface, requests]) => {
      const javascript = requests.filter(request => request.path.endsWith(".js")).length;
      const deferred = requests.filter(request => forbiddenFiles.has(path.basename(request.path))).length;
      const httpFailures = requests.filter(request => request.status >= 400).length;
      return `| ${surface} | ${requests.length} | ${javascript} | ${deferred} | ${httpFailures} |`;
    }),
    "",
    failures.length
      ? `Result: FAIL — ${failures.join("; ")}`
      : "Result: PASS — both production shells load zero assessment-bank, guided-reading, "
        + "benchmark, export, 3D, or game-engine chunks."
  ].join("\n");
  fs.writeFileSync(path.join(artifactDir, "first-load-network.md"), `${summary}\n`);
  console.log(summary);
  if (failures.length) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await server.close();
}
