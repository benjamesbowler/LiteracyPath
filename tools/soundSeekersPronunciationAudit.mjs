#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { PRONUNCIATION_RECORDS } from "../src/features/soundSeekers/content/pronunciationRecords.js";
import {
  CMU_PRONUNCIATION_PROVENANCE,
  CMU_PRONUNCIATION_REFERENCE
} from "./fixtures/soundSeekersCmuPronunciations.mjs";

export { CMU_PRONUNCIATION_PROVENANCE, CMU_PRONUNCIATION_REFERENCE };

export const SOUND_KEY_ARPABET = Object.freeze({
  a_e: ["EY"],
  ai: ["EY"],
  air: ["EH", "R"],
  ar: ["AA", "R"],
  are: ["EH", "R"],
  aw: ["AO"],
  ay: ["EY"],
  b: ["B"],
  c: ["K"],
  c_s: ["S"],
  ch: ["CH"],
  ch_k: ["K"],
  ck: ["K"],
  d: ["D"],
  e_e: ["IY"],
  ea: ["IY"],
  ea_e: ["EH"],
  ear: ["IY", "R"],
  ear_lax: ["IH", "R"],
  ed_id: ["IH", "D"],
  ee: ["IY"],
  er: ["ER"],
  ew: ["UW"],
  ew_yoo: ["Y", "UW"],
  f: ["F"],
  g: ["G"],
  g_j: ["JH"],
  h: ["HH"],
  i_e: ["AY"],
  ie: ["AY"],
  igh: ["AY"],
  ir: ["ER"],
  j: ["JH"],
  k: ["K"],
  l: ["L"],
  le: ["AH", "L"],
  m: ["M"],
  n: ["N"],
  ng: ["NG"],
  nk: ["NG", "K"],
  o_e: ["OW"],
  oa: ["OW"],
  oe: ["OW"],
  oi: ["OY"],
  once_onset: ["W", "AH"],
  oo: ["UW"],
  oo_short: ["UH"],
  or: ["AO", "R"],
  ore: ["AO", "R"],
  ou: ["AW"],
  ow: ["OW"],
  ow_ou: ["AW"],
  oy: ["OY"],
  p: ["P"],
  qu: ["K", "W"],
  r: ["R"],
  s: ["S"],
  schwa: ["AH"],
  sh: ["SH"],
  short_a: ["AE"],
  short_e: ["EH"],
  short_i: ["IH"],
  short_o: ["AA"],
  short_u: ["AH"],
  t: ["T"],
  th: ["TH"],
  th_voiced: ["DH"],
  tion: ["SH", "AH", "N"],
  u_e: ["Y", "UW"],
  ue: ["UW"],
  ur: ["ER"],
  ure: ["Y", "UH", "R"],
  ure_no_y: ["UH", "R"],
  v: ["V"],
  w: ["W"],
  wh: ["W"],
  x: ["K", "S"],
  y: ["Y"],
  y_ee: ["IY"],
  y_ie: ["AY"],
  z: ["Z"],
  zz: ["Z"]
});

export function arpabetForRecord(record) {
  return record.units.flatMap((unit, index) => {
    const phones = SOUND_KEY_ARPABET[unit.soundKey];
    if (!phones) throw new Error(`${record.id}: unit ${index} has no ARPABET mapping for sound key ${unit.soundKey}`);
    return phones;
  });
}

export function pronunciationReferenceProblems(records = {}) {
  const problems = [];
  const recordIds = Object.keys(records).sort();
  const referenceIds = Object.keys(CMU_PRONUNCIATION_REFERENCE).sort();
  for (const word of referenceIds.filter(word => !records[word])) problems.push(`${word}: reference has no shipping record`);
  for (const word of recordIds.filter(word => !CMU_PRONUNCIATION_REFERENCE[word])) problems.push(`${word}: shipping record has no pronunciation authority`);
  for (const word of recordIds.filter(word => CMU_PRONUNCIATION_REFERENCE[word])) {
    const expected = CMU_PRONUNCIATION_REFERENCE[word].arpabet;
    let actual;
    try {
      actual = arpabetForRecord(records[word]);
    } catch (error) {
      problems.push(error.message);
      continue;
    }
    if (expected.join(" ") !== actual.join(" ")) {
      problems.push(`${word}: reference ${expected.join(" ")}; authored ${actual.join(" ")}`);
    }
  }
  return problems;
}

export function assertPronunciationsMatchReference(records = {}) {
  const problems = pronunciationReferenceProblems(records);
  if (problems.length) throw new Error(`Sound Seekers pronunciation audit failed (${problems.length}):\n${problems.join("\n")}`);
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = pronunciationReferenceProblems(PRONUNCIATION_RECORDS);
  if (problems.length) {
    console.error(`Sound Seekers pronunciation audit failed (${problems.length}):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`Sound Seekers pronunciation audit passed: ${Object.keys(PRONUNCIATION_RECORDS).length} records match CMUdict ${CMU_PRONUNCIATION_PROVENANCE.commit}.`);
}
