#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json");
const sidecarPaths = [
  "docs/guided-reading/visual-approvals-nonfiction-human.json",
  "docs/guided-reading/visual-approvals-human-series.json",
  "docs/guided-reading/visual-approvals-human-series-tail.json",
  "docs/guided-reading/visual-approvals-dino-meadow.json",
  "docs/guided-reading/visual-approvals-meadow-late.json",
  "docs/guided-reading/visual-approvals-moonwood.json",
  "docs/guided-reading/visual-approvals-root.json"
].map(relative => path.join(root, relative));

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function publicFile(publicPath = "") {
  return path.join(root, "public", String(publicPath).split("?")[0].replace(/^\/+/, ""));
}

function releaseFingerprint(pages) {
  return sha256(JSON.stringify(pages.map(record => ({
    bookId: record.bookId,
    pageNumber: record.pageNumber,
    textSha256: record.textSha256,
    imagePath: record.imagePath,
    imageSha256: record.imageSha256,
    status: record.status
  }))));
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const approvals = [];
for (const sidecarPath of sidecarPaths) {
  if (!fs.existsSync(sidecarPath)) continue;
  const data = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));
  approvals.push(...(Array.isArray(data) ? data : data.records || data.approvals || []));
}

const approvalByKey = new Map();
for (const approval of approvals) {
  const key = `${approval.bookId}:${approval.pageNumber}`;
  if (approvalByKey.has(key)) throw new Error(`Duplicate visual approval ${key}`);
  if (approval.status && approval.status !== "approved") throw new Error(`${key}: sidecar status is not approved`);
  if (!/^[a-f0-9]{64}$/i.test(String(approval.imageSha256 || ""))) {
    throw new Error(`${key}: sidecar imageSha256 is missing or invalid`);
  }
  approvalByKey.set(key, approval);
}

let applied = 0;
for (const record of report.pages || []) {
  const key = `${record.bookId}:${record.pageNumber}`;
  const approval = approvalByKey.get(key);
  if (!approval) continue;
  if (record.status !== "replace") throw new Error(`${key}: approval does not target an open replacement record`);
  if (approval.imagePath && approval.imagePath !== record.imagePath) {
    throw new Error(`${key}: sidecar image path does not match the audit record`);
  }
  const file = publicFile(record.imagePath);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) throw new Error(`${key}: approved image is missing`);
  const actualHash = sha256(fs.readFileSync(file));
  if (approval.imageSha256 !== actualHash) {
    throw new Error(`${key}: approved hash does not match the installed image`);
  }
  record.imageSha256 = actualHash;
  record.status = "approved";
  record.issueCodes = [];
  record.issues = [];
  record.regenerationBrief = String(approval.completionNote || approval.note || "Replacement generated and visually verified against the exact page text and Story Bible continuity.");
  applied += 1;
}

for (const key of approvalByKey.keys()) {
  if (!(report.pages || []).some(record => `${record.bookId}:${record.pageNumber}` === key)) {
    throw new Error(`${key}: approval has no matching audit record`);
  }
}

const approvedPages = report.pages.filter(record => record.status === "approved").length;
const replacementPages = report.pages.filter(record => record.status === "replace").length;
const booksWithReplacements = new Set(report.pages.filter(record => record.status === "replace").map(record => record.bookId));
const allBookIds = new Set(report.pages.map(record => record.bookId));
report.scope.approvedPages = approvedPages;
report.scope.replacementPages = replacementPages;
report.scope.booksWithReplacementPages = booksWithReplacements.size;
report.scope.approvedBooks = allBookIds.size - booksWithReplacements.size;
report.gateSemantics.releaseFingerprintSha256 = releaseFingerprint(report.pages);

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Applied ${applied} verified visual approvals. ${replacementPages} replacement pages remain open.`);
