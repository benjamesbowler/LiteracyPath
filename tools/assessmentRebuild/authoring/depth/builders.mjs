// Compact authoring helpers. Every call supplies a separate stimulus and a
// reviewed key/contrast; these helpers do not generate token-swap questions.
import { skillBlueprints } from "../../../../src/content/blueprints/skillBlueprints.js";

export const key = t => ({ t, k: true, r: "KEY" });
export const wrong = (t, r = "D-FUNCTION-SWAP") => ({ t, r });
export function author(skillId, rows) {
  return rows.map((row, index) => {
    const phase = Object.entries(skillBlueprints[skillId].phaseUnitsByLevel[row.lvl])
      .find(([, units]) => units.includes(row.u))?.[0];
    if (!phase) throw new Error(`No blueprint phase for ${skillId}/${row.lvl}/${row.u}`);
    return {
      v: 101 + index, ph: Number(phase), form: ["A", "B", "C"][index % 3],
      media: "text", ...row
    };
  });
}
export function text(u, lvl, fmt, prompt, choices, note, extra = {}) {
  return { u, lvl, fmt, prompt, spoken: prompt, choices, note, ...extra };
}
