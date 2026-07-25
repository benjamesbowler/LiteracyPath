import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { TraceMap, eachMapping } from "@jridgewell/trace-mapping";

import { symbolicateFrame } from "./lib/sourceMapSymbolication.mjs";

const repositoryRoot = path.resolve(new URL("..", import.meta.url).pathname);
const temporaryPrefix = path.join(tmpdir(), "literacy-path-private-maps-");
const temporaryBuild = await mkdtemp(temporaryPrefix);
const keepRootSetting = process.env.LP_PRIVATE_SOURCE_MAP_KEEP_ROOT || "";
const keepRoot = keepRootSetting ? path.resolve(keepRootSetting) : "";

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(target));
    if (entry.isFile()) files.push(target);
  }
  return files;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

try {
  if (keepRoot) {
    assert.notEqual(keepRoot, repositoryRoot, "Private map vault cannot be the repository root.");
    assert.notEqual(keepRoot, path.join(repositoryRoot, "dist"), "Private maps cannot enter dist.");
  }

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const build = spawnSync(npmCommand, ["run", "build"], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      LP_PRIVATE_SOURCE_MAPS: "true",
      LP_PRIVATE_SOURCE_MAP_OUTPUT_DIR: temporaryBuild,
      ANALYZE_BUNDLE: "true",
      VITE_APP_RELEASE_ID: "private-source-map-verification"
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024
  });
  if (build.status !== 0) {
    process.stdout.write(build.stdout || "");
    process.stderr.write(build.stderr || "");
    throw new Error(`Private source-map production build failed with status ${build.status}.`);
  }

  const files = await walkFiles(temporaryBuild);
  const javaScriptFiles = files.filter(file => file.endsWith(".js"));
  const mapFiles = files.filter(file => file.endsWith(".js.map"));
  assert.ok(javaScriptFiles.length > 0, "Production build emitted no JavaScript.");
  const mappedJavaScriptFiles = new Set(mapFiles.map(file => file.replace(/\.map$/, "")));
  const unmappedJavaScriptFiles = javaScriptFiles.filter(
    file => !mappedJavaScriptFiles.has(file)
  );
  const bundleAnalysis = JSON.parse(
    await readFile(path.join(temporaryBuild, "bundle-analysis.json"), "utf8")
  );
  const generatedWithoutSource = [];
  const copiedPublicScripts = [];
  const generatedServiceWorkers = [];

  for (const javaScriptFile of unmappedJavaScriptFiles) {
    const relative = path.relative(temporaryBuild, javaScriptFile).replaceAll("\\", "/");
    const metadata = bundleAnalysis.chunks.find(chunk => chunk.fileName === relative);
    if (metadata) {
      const containsOnlyGeneratedCode = metadata.modules.every(module => (
        Number(module.renderedLength) === 0
        || (
          String(module.id).startsWith("\0")
          && Number(module.originalLength) === 0
        )
      ));
      assert.ok(
        containsOnlyGeneratedCode,
        `${relative} contains source-bearing compiled code but has no private map.`
      );
      generatedWithoutSource.push(relative);
      continue;
    }

    if (relative === "sw.js") {
      const pluginSource = await readFile(
        path.join(repositoryRoot, "tools", "viteQuestOfflinePlugin.mjs"),
        "utf8"
      );
      assert.match(pluginSource, /fileName: "sw\.js"/);
      assert.match(pluginSource, /serviceWorkerSource\(\{ buildId, precache \}\)/);
      generatedServiceWorkers.push(relative);
      continue;
    }

    const publicSource = path.join(repositoryRoot, "public", relative);
    const [builtBytes, publicBytes] = await Promise.all([
      readFile(javaScriptFile),
      readFile(publicSource)
    ]);
    assert.deepEqual(
      builtBytes,
      publicBytes,
      `${relative} is unmapped and is not an exact public-file copy.`
    );
    copiedPublicScripts.push(relative);
  }

  for (const javaScriptFile of javaScriptFiles) {
    const contents = await readFile(javaScriptFile, "utf8");
    assert.doesNotMatch(
      contents,
      /sourceMappingURL\s*=/,
      `${path.relative(temporaryBuild, javaScriptFile)} publicly references a map.`
    );
  }

  let probe = null;
  for (const mapFile of mapFiles) {
    const rawMap = JSON.parse(await readFile(mapFile, "utf8"));
    if (!rawMap.sources?.some(source => String(source).endsWith("/src/utils/errorLog.js"))) {
      continue;
    }
    const traceMap = new TraceMap(rawMap);
    eachMapping(traceMap, mapping => {
      if (
        !probe
        && String(mapping.source).endsWith("/src/utils/errorLog.js")
        && mapping.generatedLine > 0
      ) {
        probe = {
          mapFile,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn
        };
      }
    });
    if (probe) break;
  }
  assert.ok(probe, "Could not locate an error-monitor frame in the private maps.");

  const assetPath = path.relative(temporaryBuild, probe.mapFile)
    .replaceAll("\\", "/")
    .replace(/\.map$/, "");
  const generatedFrame = `${assetPath}:${probe.generatedLine}:${probe.generatedColumn + 1}`;
  const symbolicated = await symbolicateFrame({
    mapsRoot: temporaryBuild,
    frame: generatedFrame
  });
  assert.equal(
    symbolicated.source,
    "src/utils/errorLog.js",
    "The known production frame did not resolve to the monitoring source."
  );
  assert.ok(symbolicated.line > 0);

  const selectedMap = await readFile(probe.mapFile);
  const proof = {
    result: "PASS",
    releaseId: "private-source-map-verification",
    javascriptAssets: javaScriptFiles.length,
    privateMaps: mapFiles.length,
    monitorVisibleCompiledAssetsWithoutMaps: 0,
    generatedAssetsWithoutOriginalSource: generatedWithoutSource,
    generatedServiceWorkersOutsidePageErrorMonitor: generatedServiceWorkers,
    exactCopiedPublicScripts: copiedPublicScripts,
    mapsPubliclyReferenced: false,
    probe: {
      generatedFrame,
      symbolicatedFrame: `${symbolicated.source}:${symbolicated.line}:${symbolicated.column}`,
      mapSha256: sha256(selectedMap)
    }
  };

  if (keepRoot) {
    await mkdir(keepRoot, { recursive: true });
    for (const mapFile of mapFiles) {
      const relative = path.relative(temporaryBuild, mapFile);
      const target = path.join(keepRoot, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(mapFile, target);
    }
    await writeFile(
      path.join(keepRoot, "private-source-map-manifest.json"),
      `${JSON.stringify(proof, null, 2)}\n`
    );
  }

  console.log(JSON.stringify(proof));
} finally {
  assert.ok(
    temporaryBuild.startsWith(temporaryPrefix),
    "Refusing to remove a directory outside the private-map temporary prefix."
  );
  await rm(temporaryBuild, { recursive: true, force: true });
}
