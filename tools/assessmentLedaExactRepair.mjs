import { createHash } from 'node:crypto';
import { buildAssessmentSpeechInput } from './assessmentSpeechInput.mjs';
import { normalizeLedaAudioText } from '../src/data/ledaProductionAudio.js';

const escapeXml = text => String(text).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[character]);
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const roles = new Set(['assessment_prompt','assessment_passage','isolated_word']);

/** Preserve every spoken word; override only a reviewed word's pronunciation and optional slower pace. */
export function buildExactRepairSpeechInput(record) {
 const rate = record.speakingRate;
 if (rate != null && (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0.85 || rate > 1
   || Math.round(rate * 100) / 100 !== rate)) throw new Error('Invalid exact repair speaking rate.');
 const original = buildAssessmentSpeechInput(record.exactText);
 let ssml = original.ssml || `<speak>${escapeXml(original.text)}</speak>`;
 const phrases = new Set();
 for (const pronunciation of record.pronunciations || []) {
  const { phrase, ipa } = pronunciation;
  // Google phoneme tags direct one word; a phrase spanning words is unsupported.
  if (typeof phrase !== 'string' || !phrase || /\s/.test(phrase) || typeof ipa !== 'string' || !ipa.trim()
    || ipa.length > 100 || /[<>\r\n]/.test(ipa) || phrases.has(phrase)) throw new Error('Invalid or repeated exact repair pronunciation.');
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(phrase)}(?![\\p{L}\\p{N}])`, 'gu');
  if ([...record.exactText.matchAll(pattern)].length !== 1) throw new Error(`Repair pronunciation must match exactly one whole phrase: ${phrase}`);
  const escaped = escapeXml(phrase);
  // Replacements are unambiguous and cannot inject SSML or change spoken text.
  const textPattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(escaped)}(?![\\p{L}\\p{N}])`, 'gu');
  let matches = 0;
  ssml = ssml.split(/(<[^>]*>)/g).map(part => part.startsWith('<') ? part : part.replace(textPattern, () => {
    matches += 1;
    return `<phoneme alphabet="ipa" ph="${escapeXml(ipa)}">${escaped}</phoneme>`;
  })).join('');
  if (matches !== 1) throw new Error(`Pronunciation phrase is ambiguous in speech input: ${phrase}`);
  phrases.add(phrase);
 }
 if (!phrases.size) throw new Error('Exact repair requires a reviewed pronunciation correction.');
 if (rate != null && rate !== 1) ssml = ssml.replace('<speak>', `<speak><prosody rate="${Math.round(rate * 100)}%">`)
  .replace('</speak>', '</prosody></speak>');
 return { ssml };
}

/** Run before any paid request: no wildcard scope, stale source, path traversal or duplicate text. */
export async function validateExactRepairWorklist(worklist, { readAudio, resolveAudio }) {
 if (worklist?.scope !== 'literacy-mock-exact-repair' || !Array.isArray(worklist.records) || !worklist.records.length) throw new Error('Invalid exact repair worklist.');
 const seen = new Set();
 const result = [];
 for (const record of worklist.records) {
  if (!roles.has(record.role) || typeof record.exactText !== 'string' || !record.exactText.trim()
    || typeof record.publicPath !== 'string' || !new RegExp(`^/audio/production/en-US/${record.role}/[a-z0-9-]+\\.mp3$`).test(record.publicPath)
    || !/^[a-f0-9]{64}$/.test(record.sha256 || '')) throw new Error('Invalid exact repair record.');
  const normalized = normalizeLedaAudioText(record.exactText);
  if (seen.has(normalized)) throw new Error(`Repeated exact repair text: ${record.exactText}`);
  if (resolveAudio(record.role, record.exactText) !== record.publicPath) throw new Error(`Exact repair source mapping changed: ${record.exactText}`);
  const original = await readAudio(record.publicPath);
  if (createHash('sha256').update(original).digest('hex') !== record.sha256) throw new Error(`Exact repair source bytes changed: ${record.exactText}`);
  const speechInput = buildExactRepairSpeechInput(record);
  seen.add(normalized);
  result.push({ ...record, normalized, originalPublicPath: record.publicPath, originalSha256: record.sha256, speechInput });
 }
 return result;
}
