import assert from "node:assert/strict";
import test from "node:test";
import { assertRetiredPeerScoreAccessDenied } from "../../tools/verifyLeaderboardPrivacyLive.mjs";

test("retirement accepts actual permission denial for both API roles", () => {
  for (const role of ["anonymous", "authenticated"]) {
    assert.doesNotThrow(() => assertRetiredPeerScoreAccessDenied({ error: { code: "42501" } }, role));
  }
});

test("retirement accepts absence from the role's API schema", () => {
  assert.doesNotThrow(() => assertRetiredPeerScoreAccessDenied({ error: { code: "PGRST202" } }, "anonymous"));
});

test("token-validation failure cannot pass a retired-endpoint check", () => {
  assert.throws(() => assertRetiredPeerScoreAccessDenied({ error: { code: "P0001", message: "invalid_session" } }, "anonymous"), /remain callable/);
  assert.throws(() => assertRetiredPeerScoreAccessDenied({ error: { code: "PGRST203" } }, "authenticated"), /remain callable/);
});

test("returned peer data or an unexpected error cannot pass retirement", () => {
  for (const result of [{ data: [] }, { data: { rows: [] } }, { error: { code: "500" } }]) {
    assert.throws(() => assertRetiredPeerScoreAccessDenied(result, "authenticated"), /remain callable/);
  }
});
