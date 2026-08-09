import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CHILD_MEDIA_CAPTURE_POLICY,
  childMediaCaptureIsAllowed
} from "../../src/policy/childMediaCapturePolicy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");
const POLICY_FILE = path.join(ROOT, "policy/childMediaCapturePolicy.js");
const forbidden = [
  "getUser" + "Media",
  "Media" + "Recorder",
  "Speech" + "Recognition",
  "webkitSpeech" + "Recognition",
  "Image" + "Capture",
  "getDisplay" + "Media"
];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:js|jsx|ts|tsx)$/.test(entry.name) ? [target] : [];
  }));
  return nested.flat();
}

test("child voice and image capture remain disabled by policy", () => {
  assert.deepEqual(CHILD_MEDIA_CAPTURE_POLICY, {
    recordChildVoice: false,
    captureChildPhoto: false,
    captureChildVideo: false,
    useSpeechRecognition: false
  });
  assert.equal(childMediaCaptureIsAllowed(), false);
});

test("application source contains no browser media-capture implementation", async () => {
  const files = (await sourceFiles(ROOT)).filter(file => file !== POLICY_FILE);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const token of forbidden) {
      assert.equal(source.includes(token), false, `${path.relative(ROOT, file)} contains ${token}`);
    }
  }
});
