import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { normalizeLedaAudioText } from "../src/data/ledaProductionAudio.js";
import { GUIDED_READING_AUDIO_REPAIRS } from "./guidedReadingAudioRepairRegistry.mjs";

export function resolveReviewedGuidedReadingAudioRepair(record, voiceName, repositoryRoot, repairs = GUIDED_READING_AUDIO_REPAIRS) {
  const normalizedLookupText = normalizeLedaAudioText(record.lookupText);
  const key = `${record.role}:${normalizedLookupText}`;
  const repair = repairs[key];
  if (!repair) return null;
  const reject = reason => { throw new Error(`Reviewed audio repair ${key}: ${reason}.`); };
  if (!["guided_page", "isolated_word"].includes(record.role) || repair.role !== record.role
    || repair.normalizedLookupText !== normalizedLookupText) reject("role or lookup key mismatch");
  if (repair.voiceName !== voiceName) reject("voice mismatch");
  if (repair.spokenText !== (record.spokenText || record.lookupText)) reject("exact spoken text mismatch");
  if (!/^[a-f0-9]{64}$/u.test(repair.audioSha256 || "")) reject("invalid byte hash");
  const folder = `/audio/production/en-US/${record.role}/`;
  const name = String(repair.audioPath || "").slice(folder.length);
  if (!repair.audioPath?.startsWith(folder) || !/^[a-z0-9-]+\.mp3$/u.test(name)
    || !name.endsWith(`-${repair.audioSha256.slice(0, 10)}.mp3`)) reject("invalid content-addressed audio path");
  let bytes;
  try { bytes = readFileSync(path.join(repositoryRoot, "public", repair.audioPath)); }
  catch { reject("reviewed file is missing"); }
  if (createHash("sha256").update(bytes).digest("hex") !== repair.audioSha256) reject("reviewed file hash mismatch");
  return repair.audioPath;
}
