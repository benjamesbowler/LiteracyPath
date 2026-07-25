import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const analysisPath = path.join(repoRoot, "dist", "bundle-analysis.json");
const lazyBankModules = [
  "/src/data/cvcShortVowelExpansionQuestions.js",
  "/src/data/initialSoundCoverageQuestions.js",
  "/src/data/ixlStyleSeedQuestions.js",
  "/src/data/rhymingCoverageQuestions.js"
];
const elBenchmarkEngineModule = "/src/appState/elBenchmarkEngine.js";
const elBenchmarkCoreModules = [
  "/src/data/elBenchmarkAssessmentCatalog.js",
  "/src/data/elBenchmarkAssessments.js",
  "/src/data/elBenchmarkSession.js",
  "/src/utils/elBenchmarkAssessmentScoring.js"
];

function runBuild() {
  return new Promise(resolve => {
    const child = spawn("npm", ["run", "build"], {
      cwd: repoRoot,
      env: { ...process.env, ANALYZE_BUNDLE: "true" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    for (const stream of [child.stdout, child.stderr]) {
      stream.on("data", chunk => {
        const text = chunk.toString();
        output += text;
        process.stdout.write(text);
      });
    }
    child.on("error", error => resolve({ code: 1, output, error }));
    child.on("close", code => resolve({ code: code ?? 1, output }));
  });
}

const build = await runBuild();
if (build.code !== 0) {
  console.error("Split-boundary build failed.");
  process.exit(1);
}
if (build.output.includes("[INEFFECTIVE_DYNAMIC_IMPORT]")) {
  console.error("Split-boundary build contains an ineffective dynamic import.");
  process.exit(1);
}
if (!fs.existsSync(analysisPath)) {
  console.error("Bundle analysis was not generated.");
  process.exit(1);
}

const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
const failures = [];
const normalizedModuleId = module => module.id.replaceAll("\\", "/");
for (const moduleSuffix of lazyBankModules) {
  const chunks = analysis.chunks.filter(chunk =>
    chunk.modules.some(module => module.id.replaceAll("\\", "/").endsWith(moduleSuffix))
  );
  if (chunks.length === 0) {
    failures.push(`${moduleSuffix}: absent from build`);
    continue;
  }
  if (chunks.some(chunk => chunk.isEntry || !chunk.isDynamicEntry)) {
    failures.push(
      `${moduleSuffix}: not isolated to dynamic entries (${chunks.map(chunk => chunk.fileName).join(", ")})`
    );
  }
}

const chunkByFileName = new Map(analysis.chunks.map(chunk => [chunk.fileName, chunk]));
const entryChunk = analysis.chunks.find(chunk => chunk.isEntry);
if (!entryChunk) {
  failures.push("main entry chunk: absent from build analysis");
} else {
  const staticallyReachable = new Set();
  const visitStaticImports = chunk => {
    if (!chunk || staticallyReachable.has(chunk.fileName)) return;
    staticallyReachable.add(chunk.fileName);
    for (const importedFile of chunk.imports || []) {
      visitStaticImports(chunkByFileName.get(importedFile));
    }
  };
  visitStaticImports(entryChunk);
  for (const moduleSuffix of elBenchmarkCoreModules) {
    const leakedChunks = analysis.chunks.filter(chunk =>
      staticallyReachable.has(chunk.fileName)
      && chunk.modules.some(module => normalizedModuleId(module).endsWith(moduleSuffix))
    );
    if (leakedChunks.length) {
      failures.push(
        `${moduleSuffix}: statically reachable from main entry (${leakedChunks
          .map(chunk => chunk.fileName)
          .join(", ")})`
      );
    }
  }
}

const engineChunks = analysis.chunks.filter(chunk =>
  chunk.modules.some(module => normalizedModuleId(module).endsWith(elBenchmarkEngineModule))
);
if (engineChunks.length !== 1 || !engineChunks[0].isDynamicEntry || engineChunks[0].isEntry) {
  failures.push(
    `${elBenchmarkEngineModule}: expected one dynamic entry, found ${
      engineChunks.map(chunk => `${chunk.fileName}:${chunk.isDynamicEntry ? "dynamic" : "static"}`).join(", ")
      || "none"
    }`
  );
}

const browserMasterLexiconChunks = analysis.chunks.filter(chunk =>
  chunk.modules.some(module =>
    module.id.replaceAll("\\", "/").endsWith("/src/content/lexicon/masterWordLexicon.js")
  )
);
if (browserMasterLexiconChunks.length) {
  failures.push(
    `build-time master lexicon leaked into browser chunks: ${browserMasterLexiconChunks
      .map(chunk => chunk.fileName)
      .join(", ")}`
  );
}

if (failures.length) {
  console.error(`Split-boundary verification failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(
  `Split boundaries verified: ${lazyBankModules.length} assessment banks are dynamic, `
  + "the EL benchmark engine is outside the main-entry static graph, "
  + "the build-time lexicon is absent, and zero ineffective dynamic imports were reported."
);
