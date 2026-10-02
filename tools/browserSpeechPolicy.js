import { parse } from "espree";

const ACCESS_PAGE = "src/components/progress/ProgressCheckPage.jsx";

function memberName(node) {
  if (node?.type === "ChainExpression") return memberName(node.expression);
  if (node?.type === "Identifier") return node.name;
  if (node?.type === "MemberExpression" && !node.computed) return `${memberName(node.object)}.${node.property.name}`;
  return "";
}

function conjuncts(node) {
  return node?.type === "LogicalExpression" && node.operator === "&&"
    ? [...conjuncts(node.left), ...conjuncts(node.right)] : [node];
}

function optionalAccessGuard(node) {
  const clauses = conjuncts(node);
  const negated = name => clauses.some(clause => clause?.type === "UnaryExpression" && clause.operator === "!" && memberName(clause.argument) === name);
  return negated("cue.path") && negated("cue.required") && clauses.some(clause =>
    clause?.type === "BinaryExpression" && clause.operator === "===" && memberName(clause.left) === "cue.fallback" && clause.right?.value === "speech_access");
}

function warmupGuard(fn) {
  const guard = fn?.body?.body?.[0];
  return guard?.type === "IfStatement" && guard.test?.type === "BinaryExpression" && guard.test.operator === "!=="
    && memberName(guard.test.left) === "ref.current.status" && guard.test.right?.value === "warmup"
    && guard.consequent?.type === "ReturnStatement" && !guard.alternate;
}

/** Question Bible section 9 and PROGRESS_CHECKS permit ordinary access speech.
 * Every other production caller remains blocked. Check actual positive control
 * flow rather than exempting an entire file or merely finding a guard string. */
export function browserSpeechViolations(relativePath, source) {
  if (!/SpeechSynthesisUtterance|speechSynthesis\.speak\s*\(/.test(source)) return [];
  if (relativePath !== ACCESS_PAGE) return [{ path: relativePath, reason: "Browser speech outside the declared Progress access renderer" }];
  let ast;
  try {
    ast = parse(source, { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true }, loc: true });
  } catch (error) {
    return [{ path: relativePath, reason: `Cannot verify access speech: ${error.message}` }];
  }
  const violations = [];
  function walk(node, ancestors = []) {
    if (!node || typeof node !== "object") return;
    const constructor = node.type === "NewExpression" && /(?:^|\.)SpeechSynthesisUtterance$/.test(memberName(node.callee));
    const speak = node.type === "CallExpression" && /(?:^|\.)speechSynthesis\.speak$/.test(memberName(node.callee));
    if (constructor || speak) {
      const inPlay = ancestors.some(parent => parent.type === "FunctionDeclaration" && parent.id?.name === "play");
      const guardedAccess = inPlay && ancestors.some((parent, index) => parent.type === "IfStatement"
        && optionalAccessGuard(parent.test) && ancestors[index + 1] === parent.consequent);
      const guardedWarmup = ancestors.some(parent => parent.type === "FunctionDeclaration" && parent.id?.name === "speakWarmup" && warmupGuard(parent));
      if (!guardedAccess && !guardedWarmup) violations.push({ path: relativePath, line: node.loc.start.line, reason: "Speech is outside optional access or unscored warmup control flow" });
    }
    const next = [...ancestors, node];
    for (const [key, child] of Object.entries(node)) {
      if (key === "loc") continue;
      if (Array.isArray(child)) child.forEach(entry => walk(entry, next));
      else if (child && typeof child === "object") walk(child, next);
    }
  }
  walk(ast);
  return violations;
}
