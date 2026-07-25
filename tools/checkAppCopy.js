import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { parse } from "@babel/parser";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(repoRoot, "src");
const renderedMode = process.argv.includes("--rendered");

const TEACHER_BANNED = /\b(?:evidence|learning event|telemetry|sync health|policy-ready|learner-weighted|response-weighted|cumulative|roster administration|access activity|drill down|provenance|contract|scope|baseline|BOY|MOY|EOY|learners?|students?|assessments?|checkpoints?|logins?)\b|(?<!privacy )\bpolicy\b/i;
const CHILD_BANNED = /\b(?:assessments?|evidence|learners?|students?|checkpoints?|wrong|failed|incorrect|needs teaching|not[-_ ]assessed)\b/i;
const RAW_TOKEN = /\b(?:level-[a-z]|[a-z0-9]+(?:_[a-z0-9]+){1,})\b/i;
const FRACTION = /\b\d+\s*\/\s*\d+\b/;

const DISPLAY_ATTRIBUTES = new Set([
  "alt",
  "aria-label",
  "aria-description",
  "placeholder",
  "title"
]);

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["generated", "content", "data"].includes(entry.name)) return [];
      return listSourceFiles(absolute);
    }
    return /\.(?:jsx|js)$/.test(entry.name) ? [absolute] : [];
  });
}

function audienceFor(file) {
  const relative = path.relative(sourceRoot, file).replaceAll(path.sep, "/");
  if (/^components\/quest\/QuestFieldStudyConsole\.jsx$/.test(relative)) return "";
  if (
    /^copy\/childCopy\.js$/.test(relative)
    || /^components\/(?:Student|Hollow)/.test(relative)
    || /^components\/(?:elQuest|learn|quest)\//.test(relative)
  ) return "child";
  if (
    /^copy\/teacherCopy\.js$/.test(relative)
    || /^components\/(?:teacher|assessment|reports)\//.test(relative)
    || /^components\/(?:Teacher|FinishedReport|Sidebar|AppPages|AppSurface|AuthPage)/.test(relative)
    || /^appState\//.test(relative)
  ) return "teacher";
  return "";
}

function locationLabel(file, node) {
  return `${path.relative(repoRoot, file)}:${node.loc?.start?.line || 1}`;
}

function meaningfulText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function expressionStrings(node, results = []) {
  if (!node) return results;
  if (node.type === "StringLiteral") results.push({ value: node.value, node });
  if (node.type === "TemplateLiteral") {
    node.quasis.forEach(quasi => results.push({ value: quasi.value.cooked || "", node: quasi }));
  }
  if (node.type === "ConditionalExpression") {
    expressionStrings(node.consequent, results);
    expressionStrings(node.alternate, results);
  }
  if (node.type === "LogicalExpression") expressionStrings(node.right, results);
  if (node.type === "ArrayExpression") {
    node.elements.forEach(element => expressionStrings(element, results));
  }
  return results;
}

function scanText({ audience, file, node, value, findings }) {
  const text = meaningfulText(value);
  if (!text) return;
  const registerPattern = audience === "child" ? CHILD_BANNED : TEACHER_BANNED;
  const registerMatch = text.match(registerPattern);
  if (registerMatch) {
    findings.push(`${locationLabel(file, node)}: ${audience} copy contains “${registerMatch[0]}” — ${text}`);
  }
  const rawMatch = text.match(RAW_TOKEN);
  if (rawMatch) {
    findings.push(`${locationLabel(file, node)}: visible raw token “${rawMatch[0]}” — ${text}`);
  }
  if (audience === "child" && FRACTION.test(text)) {
    findings.push(`${locationLabel(file, node)}: child copy contains a fraction — ${text}`);
  }
}

function scanSourceFile(file, audience, findings) {
  const source = fs.readFileSync(file, "utf8");
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["jsx", "importAttributes"],
    errorRecovery: false
  });

  function visit(node, parent = null) {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXText") {
      scanText({ audience, file, node, value: node.value, findings });
    } else if (node.type === "JSXAttribute") {
      const name = node.name?.name;
      if (DISPLAY_ATTRIBUTES.has(name)) {
        if (node.value?.type === "StringLiteral") {
          scanText({ audience, file, node: node.value, value: node.value.value, findings });
        } else if (node.value?.type === "JSXExpressionContainer") {
          expressionStrings(node.value.expression).forEach(result => {
            scanText({ audience, file, node: result.node, value: result.value, findings });
          });
        }
      }
    } else if (node.type === "JSXExpressionContainer" && parent?.type !== "JSXAttribute") {
      expressionStrings(node.expression).forEach(result => {
        scanText({ audience, file, node: result.node, value: result.value, findings });
      });
    } else if (
      /copy\/(?:childCopy|teacherCopy)\.js$/.test(file.replaceAll(path.sep, "/"))
      && node.type === "StringLiteral"
    ) {
      scanText({ audience, file, node, value: node.value, findings });
    }

    Object.entries(node).forEach(([key, child]) => {
      if (["loc", "start", "end", "extra"].includes(key)) return;
      if (Array.isArray(child)) child.forEach(item => visit(item, node));
      else if (child && typeof child === "object" && child.type) visit(child, node);
    });
  }
  visit(ast);
}

function runRenderedScan() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      [
        "playwright",
        "test",
        "tests/release/app-copy-standard.spec.js",
        "--project=desktop",
        "--workers=1"
      ],
      { cwd: repoRoot, env: process.env, stdio: "inherit" }
    );
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`Rendered copy scan failed (${code}).`)));
  });
}

function runExportScan() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--test", "tests/unit/appCopyExports.test.js"],
      { cwd: repoRoot, env: process.env, stdio: "inherit" }
    );
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`Export copy scan failed (${code}).`)));
  });
}

const findings = [];
listSourceFiles(sourceRoot).forEach(file => {
  const audience = audienceFor(file);
  if (audience) scanSourceFile(file, audience, findings);
});

if (findings.length) {
  console.error(`App copy source scan failed with ${findings.length} finding(s):`);
  findings.forEach(finding => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log("App copy source pre-filter passed.");
  if (renderedMode) {
    try {
      await runExportScan();
      await runRenderedScan();
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
