import { parse } from "espree";

function memberName(node) {
  if (node?.type === "ChainExpression") return memberName(node.expression);
  if (node?.type === "Identifier") return node.name;
  if (node?.type === "MemberExpression" && !node.computed) return `${memberName(node.object)}.${node.property.name}`;
  return "";
}

/** All active child cues, including Progress access and warmup, use recordings.
 * Do not revive the retired Progress browser-speech exception. */
export function browserSpeechViolations(relativePath, source) {
  if (!/SpeechSynthesisUtterance|speechSynthesis\.speak\s*\(/.test(source)) return [];
  let ast;
  try {
    ast = parse(source, { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true }, loc: true });
  } catch (error) {
    return [{ path: relativePath, reason: `Cannot verify access speech: ${error.message}` }];
  }
  const violations = [];
  function walk(node) {
    if (!node || typeof node !== "object") return;
    const constructor = node.type === "NewExpression" && /(?:^|\.)SpeechSynthesisUtterance$/.test(memberName(node.callee));
    const speak = node.type === "CallExpression" && /(?:^|\.)speechSynthesis\.speak$/.test(memberName(node.callee));
    if (constructor || speak) {
      violations.push({ path: relativePath, line: node.loc.start.line, reason: "Production child speech requires an exact recording" });
    }
    for (const [key, child] of Object.entries(node)) {
      if (key === "loc") continue;
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child === "object") walk(child);
    }
  }
  walk(ast);
  return violations;
}
