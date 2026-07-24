#!/usr/bin/env node

import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  createPilotCsvExports,
  validatePilotDataset
} from "./pilotData.mjs";

function parseArguments(argv) {
  const options = {
    input: "",
    output: "",
    overwrite: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--input") {
      options.input = argv[index + 1] || "";
      index += 1;
    } else if (argument === "--output") {
      options.output = argv[index + 1] || "";
      index += 1;
    } else if (argument === "--overwrite") {
      options.overwrite = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!options.input) throw new Error("--input is required");
  if (!options.output) throw new Error("--output is required");
  return options;
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function assertWritableTargets(outputDirectory, fileNames, overwrite) {
  const parsed = path.parse(outputDirectory);
  if (path.resolve(outputDirectory) === parsed.root) {
    throw new Error("Refusing to use a filesystem root as the output directory");
  }
  await fs.mkdir(outputDirectory, { recursive: true });
  if (overwrite) return;

  const existing = [];
  for (const fileName of fileNames) {
    try {
      await fs.access(path.join(outputDirectory, fileName));
      existing.push(fileName);
    } catch {
      continue;
    }
  }
  if (existing.length) {
    throw new Error(
      `Refusing to overwrite existing export files: ${existing.join(", ")}. Use a new directory or pass --overwrite.`
    );
  }
}

export async function exportPilotDataset({
  inputPath,
  outputDirectory,
  overwrite = false
}) {
  const resolvedInput = path.resolve(inputPath);
  const resolvedOutput = path.resolve(outputDirectory);
  const source = await fs.readFile(resolvedInput, "utf8");
  const dataset = JSON.parse(source);
  const validation = validatePilotDataset(dataset);
  if (!validation.valid) {
    throw new Error(`Pilot dataset validation failed:\n${validation.errors.join("\n")}`);
  }

  const csvExports = createPilotCsvExports(dataset);
  const analysisReadyContent = `${JSON.stringify(dataset, null, 2)}\n`;
  const files = {
    ...Object.fromEntries(Object.entries(csvExports).map(([fileName, entry]) => [
      fileName,
      entry.content
    ])),
    "analysis-ready.json": analysisReadyContent
  };
  const targetNames = [...Object.keys(files), "export-manifest.json"];
  await assertWritableTargets(resolvedOutput, targetNames, overwrite);

  for (const [fileName, content] of Object.entries(files)) {
    await fs.writeFile(path.join(resolvedOutput, fileName), content, "utf8");
  }

  const manifest = {
    schemaVersion: 1,
    studyId: dataset.study.studyId,
    protocolVersion: dataset.study.protocolVersion,
    sourceExportedAt: dataset.study.exportedAt,
    generatedAt: new Date().toISOString(),
    deidentified: true,
    validationPassed: true,
    humanResultsSimulated: false,
    counts: validation.counts,
    files: Object.fromEntries(Object.entries(files).map(([fileName, content]) => [
      fileName,
      {
        bytes: Buffer.byteLength(content),
        sha256: sha256(content),
        rows: csvExports[fileName]?.rowCount ?? null
      }
    ]))
  };
  const manifestContent = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(
    path.join(resolvedOutput, "export-manifest.json"),
    manifestContent,
    "utf8"
  );
  return {
    outputDirectory: resolvedOutput,
    manifest
  };
}

async function main(argv) {
  const options = parseArguments(argv);
  const result = await exportPilotDataset({
    inputPath: options.input,
    outputDirectory: options.output,
    overwrite: options.overwrite
  });
  console.log(`Pilot export passed validation: ${result.outputDirectory}`);
  console.log(`Participants: ${result.manifest.counts.participants}`);
  console.log(`Sessions: ${result.manifest.counts.sessions}`);
  console.log(`Item events: ${result.manifest.counts.itemEvents}`);
}

const isMain = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
