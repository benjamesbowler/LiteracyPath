import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncBuiltinESMExports } from "node:module";

const checkMode = process.env.LP_AUDIT_OUTPUT_MODE === "check";
const repoRoot = path.resolve(process.env.LP_AUDIT_REPO_ROOT || process.cwd());
const artifactRoot = path.resolve(
  process.env.LP_AUDIT_ARTIFACT_ROOT
  || path.join(repoRoot, "docs", "release", "artifacts", "audits", "unknown")
);
const tempRoot = path.resolve(process.env.TMPDIR || os.tmpdir());

function asPath(value) {
  if (value instanceof URL) return fileURLToPath(value);
  return typeof value === "string" || Buffer.isBuffer(value) ? String(value) : null;
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function resolveAuditWritePath(value) {
  if (!checkMode) return value;
  const candidateValue = asPath(value);
  if (!candidateValue) return value;
  const candidate = path.resolve(candidateValue);
  if (isInside(candidate, artifactRoot) || isInside(candidate, tempRoot)) return candidate;
  if (isInside(candidate, repoRoot)) {
    return path.join(artifactRoot, "repo", path.relative(repoRoot, candidate));
  }
  return path.join(
    artifactRoot,
    "external",
    candidate.replace(/^[/\\]+/, "").replaceAll(":", "_")
  );
}

function ensureParent(target) {
  const mapped = resolveAuditWritePath(target);
  const mappedPath = asPath(mapped);
  if (mappedPath) original.mkdirSync(path.dirname(mappedPath), { recursive: true });
  return mapped;
}

const original = {
  appendFile: fs.appendFile.bind(fs),
  appendFileSync: fs.appendFileSync.bind(fs),
  copyFile: fs.copyFile.bind(fs),
  copyFileSync: fs.copyFileSync.bind(fs),
  createWriteStream: fs.createWriteStream.bind(fs),
  mkdir: fs.mkdir.bind(fs),
  mkdirSync: fs.mkdirSync.bind(fs),
  rename: fs.rename.bind(fs),
  renameSync: fs.renameSync.bind(fs),
  rm: fs.rm.bind(fs),
  rmSync: fs.rmSync.bind(fs),
  unlink: fs.unlink.bind(fs),
  unlinkSync: fs.unlinkSync.bind(fs),
  writeFile: fs.writeFile.bind(fs),
  writeFileSync: fs.writeFileSync.bind(fs)
};

if (checkMode) {
  fs.writeFileSync = (target, ...args) => original.writeFileSync(ensureParent(target), ...args);
  fs.appendFileSync = (target, ...args) => original.appendFileSync(ensureParent(target), ...args);
  fs.copyFileSync = (source, target, ...args) =>
    original.copyFileSync(source, ensureParent(target), ...args);
  fs.createWriteStream = (target, ...args) =>
    original.createWriteStream(ensureParent(target), ...args);
  fs.mkdirSync = (target, ...args) =>
    original.mkdirSync(resolveAuditWritePath(target), ...args);
  fs.renameSync = (source, target, ...args) =>
    original.renameSync(resolveAuditWritePath(source), ensureParent(target), ...args);
  fs.rmSync = (target, ...args) => original.rmSync(resolveAuditWritePath(target), ...args);
  fs.unlinkSync = (target, ...args) => original.unlinkSync(resolveAuditWritePath(target), ...args);

  fs.writeFile = (target, ...args) => original.writeFile(ensureParent(target), ...args);
  fs.appendFile = (target, ...args) => original.appendFile(ensureParent(target), ...args);
  fs.copyFile = (source, target, ...args) =>
    original.copyFile(source, ensureParent(target), ...args);
  fs.mkdir = (target, ...args) =>
    original.mkdir(resolveAuditWritePath(target), ...args);
  fs.rename = (source, target, ...args) =>
    original.rename(resolveAuditWritePath(source), ensureParent(target), ...args);
  fs.rm = (target, ...args) => original.rm(resolveAuditWritePath(target), ...args);
  fs.unlink = (target, ...args) => original.unlink(resolveAuditWritePath(target), ...args);

  const promises = fs.promises;
  const promiseWriteFile = promises.writeFile.bind(promises);
  const promiseAppendFile = promises.appendFile.bind(promises);
  const promiseCopyFile = promises.copyFile.bind(promises);
  const promiseMkdir = promises.mkdir.bind(promises);
  const promiseRename = promises.rename.bind(promises);
  const promiseRm = promises.rm.bind(promises);
  const promiseUnlink = promises.unlink.bind(promises);
  promises.writeFile = (target, ...args) => promiseWriteFile(ensureParent(target), ...args);
  promises.appendFile = (target, ...args) => promiseAppendFile(ensureParent(target), ...args);
  promises.copyFile = (source, target, ...args) =>
    promiseCopyFile(source, ensureParent(target), ...args);
  promises.mkdir = (target, ...args) => promiseMkdir(resolveAuditWritePath(target), ...args);
  promises.rename = (source, target, ...args) =>
    promiseRename(resolveAuditWritePath(source), ensureParent(target), ...args);
  promises.rm = (target, ...args) => promiseRm(resolveAuditWritePath(target), ...args);
  promises.unlink = (target, ...args) => promiseUnlink(resolveAuditWritePath(target), ...args);

  syncBuiltinESMExports();
}
