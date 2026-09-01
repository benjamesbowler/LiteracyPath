import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const vercelConfig = JSON.parse(
  readFileSync(new URL("../../vercel.json", import.meta.url), "utf8")
);

test("assessment images always revalidate in the browser", () => {
  const rules = vercelConfig.headers || [];
  const assessmentRuleIndex = rules.findIndex(
    rule => rule.source === "/images/assessment/(.*)"
  );
  const genericMediaRuleIndex = rules.findIndex(
    rule => rule.source === "/(.*)\\.(webp|png|jpg|jpeg|gif|svg|mp3|m4a|ogg|wav|woff|woff2)"
  );

  assert.notEqual(assessmentRuleIndex, -1, "missing assessment-image cache rule");
  assert.ok(
    assessmentRuleIndex > genericMediaRuleIndex,
    "assessment-image cache rule must follow the generic media rule so it wins"
  );

  const headers = Object.fromEntries(
    rules[assessmentRuleIndex].headers.map(({ key, value }) => [key.toLowerCase(), value])
  );
  assert.equal(headers["cache-control"], "public, max-age=0, must-revalidate");
  assert.equal(headers["vercel-cdn-cache-control"], "public, max-age=86400");
});
