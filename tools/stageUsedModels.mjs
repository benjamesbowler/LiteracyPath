// Which files under public/models/library does the RUNTIME actually load?
//
// The library is ~71 MB / 1,638 files. The game loads about 2.4 MB of it. The
// rest is a CC0 asset dump we keep locally to pick from — it must never enter
// git history and must never be deployed.
//
// So: `public/models/library/` is gitignored wholesale, and this script
// force-adds back only the closure of what `src/` actually references. Git
// keeps tracking a file once it is tracked, ignore rule or not, so this stays
// correct — and a stray `git add .` can never sweep the other 69 MB in.
//
// The closure matters. A `.gltf` is not self-contained: it points at external
// `.bin` buffers and `.png` textures as sibling URIs. Add the .gltf alone and
// the model 404s at runtime with a green build.
//
//   node tools/stageUsedModels.mjs          # list what is needed
//   node tools/stageUsedModels.mjs --stage  # git add -f exactly that

import { readFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { globSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");

// Every /models/... path mentioned anywhere in src/.
const sources = globSync("src/**/*.{js,jsx}", { cwd: ROOT });
const referenced = new Set();
for (const file of sources) {
  const text = readFileSync(path.join(ROOT, file), "utf8");
  for (const match of text.matchAll(/\/models\/[A-Za-z0-9_./-]+\.(?:glb|gltf|json)/g)) {
    referenced.add(match[0]);
  }
}

// Resolve each reference to its full dependency closure.
const needed = new Set();
const missing = [];
const add = p => { if (existsSync(path.join(PUBLIC, p))) needed.add(p); };

for (const ref of referenced) {
  if (!existsSync(path.join(PUBLIC, ref))) { missing.push(ref); continue; }
  add(ref);
  if (!ref.endsWith(".gltf")) continue;

  // A .gltf names its buffers and images as relative sibling URIs. Follow them.
  let gltf;
  try {
    gltf = JSON.parse(readFileSync(path.join(PUBLIC, ref), "utf8"));
  } catch {
    missing.push(`${ref} (unparseable)`);
    continue;
  }
  const dir = path.posix.dirname(ref);
  for (const key of ["buffers", "images"]) {
    for (const item of gltf[key] || []) {
      const uri = item.uri;
      if (!uri || uri.startsWith("data:")) continue;
      add(path.posix.normalize(path.posix.join(dir, decodeURIComponent(uri))));
    }
  }
}

// CC0 still wants the licence shipped beside the models it covers.
for (const p of [...needed]) {
  const parts = p.split("/");
  const i = parts.indexOf("kaykit");
  if (i !== -1) {
    const pack = parts.slice(0, i + 2).join("/");
    add(`${pack}/LICENSE.txt`);
    add(`${pack}/License.txt`);
  }
  if (parts.includes("poly-pizza")) add("/models/library/poly-pizza/objectives/LICENSE.txt");
}

const files = [...needed].sort();
const bytes = files.reduce((sum, p) => sum + statSync(path.join(PUBLIC, p)).size, 0);

if (missing.length) {
  console.error("REFERENCED BUT NOT ON DISK — these will 404 at runtime:");
  for (const m of missing) console.error("  " + m);
  console.error("");
}

console.log(`${files.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB`);

if (process.argv.includes("--stage")) {
  // -f because public/models/library/ is gitignored by design.
  const paths = files.map(p => path.posix.join("public", p));
  execFileSync("git", ["add", "-f", "--", ...paths], { stdio: "inherit" });
  console.log("staged.");
} else {
  for (const p of files) console.log("  public" + p);
}

if (missing.length) process.exitCode = 1;
