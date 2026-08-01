#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [bookId, rawPageNumber, ...noteParts] = process.argv.slice(2);
const pageNumber = Number(rawPageNumber);
if (!bookId || !Number.isInteger(pageNumber)) {
  throw new Error("Usage: node tools/recordGuidedReadingVisualApproval.mjs <bookId> <pageNumber> <completion note>");
}
const note = noteParts.join(" ").trim()
  || "Replacement generated and visually verified against exact page text and Story Bible continuity.";
const audit = JSON.parse(fs.readFileSync(
  path.join(root, "docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json"),
  "utf8"
));
const record = audit.pages.find(row => row.bookId === bookId && row.pageNumber === pageNumber);
if (!record) throw new Error(`${bookId}:${pageNumber}: no audit record`);
if (record.status !== "replace") throw new Error(`${bookId}:${pageNumber}: record is not open for replacement`);
const imageFile = path.join(root, "public", record.imagePath.replace(/^\/+/, ""));
if (!fs.existsSync(imageFile) || fs.statSync(imageFile).size === 0) throw new Error(`${bookId}:${pageNumber}: image missing`);
const imageSha256 = crypto.createHash("sha256").update(fs.readFileSync(imageFile)).digest("hex");
const sidecarPath = path.join(root, "docs/guided-reading/visual-approvals-root.json");
const sidecar = fs.existsSync(sidecarPath)
  ? JSON.parse(fs.readFileSync(sidecarPath, "utf8"))
  : { records: [] };
const approval = { bookId, pageNumber, imagePath: record.imagePath, imageSha256, status: "approved", completionNote: note };
const existingIndex = sidecar.records.findIndex(row => row.bookId === bookId && row.pageNumber === pageNumber);
if (existingIndex >= 0) sidecar.records[existingIndex] = approval;
else sidecar.records.push(approval);
sidecar.records.sort((left, right) => left.bookId.localeCompare(right.bookId) || left.pageNumber - right.pageNumber);
fs.writeFileSync(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`);
console.log(`${bookId}:${pageNumber} recorded at ${imageSha256}`);
