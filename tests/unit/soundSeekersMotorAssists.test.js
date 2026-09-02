import assert from "node:assert/strict";
import test from "node:test";

import {
  MOTOR_ASSIST_KEYS,
  normalizeMotorAssists
} from "../../src/features/soundSeekers/engine/motorAssists.js";

const EXPECTED_KEYS = [
  "autoTravel",
  "slowerMovement",
  "noDamageTravel",
  "largerTargets",
  "simplifiedScene",
  "extendedResponse"
];

test("motor assists normalize only the six motor dimensions", () => {
  assert.deepEqual(MOTOR_ASSIST_KEYS, EXPECTED_KEYS);
  assert.deepEqual(normalizeMotorAssists(), Object.fromEntries(EXPECTED_KEYS.map(key => [key, false])));
  for (const key of EXPECTED_KEYS) {
    const assists = normalizeMotorAssists({ [key]: true });
    assert.equal(assists[key], true);
    assert.equal(Object.isFrozen(assists), true);
    assert.deepEqual(Object.keys(assists), EXPECTED_KEYS);
  }
  assert.throws(() => normalizeMotorAssists({ reducedEffects: true }), /unknown motor assist/i);
  assert.throws(() => normalizeMotorAssists({ autoTravel: "yes" }), /boolean/i);
});

test("motor assists cannot alter a challenge answer or evidence contract", () => {
  const challenge = Object.freeze({
    expectedToken: "sh",
    recordsDomain: "phoneme_to_grapheme",
    optionTokens: Object.freeze(["ch", "sh", "th"])
  });
  const before = structuredClone(challenge);
  for (const key of EXPECTED_KEYS) {
    normalizeMotorAssists({ [key]: true });
    assert.deepEqual(challenge, before);
  }
});
