import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  BOUNDARY_RPCS,
  BOUNDARY_TABLES
} from "../src/data/boundaries/client.js";
import {
  FACADE_RPCS,
  FACADE_TABLES
} from "../src/data/boundaries/facade.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(root, "src");
const requiredBoundaryFiles = [
  "auth.js",
  "classes.js",
  "content.js",
  "evidence.js",
  "reports.js",
  "schema.js",
  "client.js",
  "facade.js"
].map(name => path.join(srcRoot, "data", "boundaries", name));

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return /\.(?:js|jsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

const failures = [];
for (const file of requiredBoundaryFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing domain boundary: ${path.relative(root, file)}`);
}

if (JSON.stringify(FACADE_TABLES) !== JSON.stringify(BOUNDARY_TABLES)) {
  failures.push("The facade table allowlist has drifted from the domain registries.");
}
if (JSON.stringify(FACADE_RPCS) !== JSON.stringify(BOUNDARY_RPCS)) {
  failures.push("The facade RPC allowlist has drifted from the domain registries.");
}

const files = sourceFiles(srcRoot);
const literalTables = new Set();
const literalRpcs = new Set();
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  if (
    source.includes("@supabase/supabase-js")
    && relative !== "src/supabaseClient.js"
  ) {
    failures.push(`${relative} imports the raw Supabase SDK outside the client boundary.`);
  }
  if (
    /\bcreateClient\s*\(/.test(source)
    && relative !== "src/supabaseClient.js"
  ) {
    failures.push(`${relative} creates an unvalidated Supabase client.`);
  }
  if (
    /\bsupabase\s*\.\s*(?:from|rpc)\s*\(/.test(source)
    && !relative.startsWith("src/data/boundaries/")
  ) {
    failures.push(`${relative} directly calls the private Supabase SDK query interface.`);
  }
  for (const match of source.matchAll(/\bsupabase\s*\.\s*table\s*\(\s*["']([^"']+)["']/g)) {
    literalTables.add(match[1]);
  }
  for (const match of source.matchAll(/\bsupabase\s*\.\s*call\s*\(\s*["']([^"']+)["']/g)) {
    literalRpcs.add(match[1]);
  }
}

for (const table of literalTables) {
  if (!BOUNDARY_TABLES.includes(table)) failures.push(`Unregistered table call site: ${table}`);
}
for (const rpc of literalRpcs) {
  if (!BOUNDARY_RPCS.includes(rpc)) failures.push(`Unregistered RPC call site: ${rpc}`);
}

const supabaseClient = fs.readFileSync(path.join(srcRoot, "supabaseClient.js"), "utf8");
if (!/const rawSupabase =/.test(supabaseClient)) {
  failures.push("The raw Supabase client must remain private.");
}
if (!/export const supabase = createValidatedSupabaseClient\(rawSupabase\)/.test(supabaseClient)) {
  failures.push("The exported Supabase client must pass through the validated facade.");
}
if (/export\s+(?:const|let|var)\s+rawSupabase/.test(supabaseClient)) {
  failures.push("The raw Supabase client must never be exported.");
}
if (/\bsupabase\s*\.\s*(?:from|rpc)\s*\(/.test(files.map(file => fs.readFileSync(file, "utf8")).join("\n"))) {
  failures.push("Application code must use table/call domain boundaries, never from/rpc.");
}

if (failures.length) {
  console.error("Supabase domain boundary check failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `Supabase domain boundaries pass: ${BOUNDARY_TABLES.length} tables and `
    + `${BOUNDARY_RPCS.length} RPCs are registered; the raw client is private.`
  );
}
