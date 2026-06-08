import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const startupFiles = [
  "src/App.jsx",
  "src/data/loadAssessmentSkillBank.js",
  "src/data/coverageExpectations.js",
  "src/data/skillTemplateRouting.js",
  "src/data/questionMediaResolver.js",
  "src/data/assessmentMediaPicker.js"
];

const generatedAssessmentBankPattern = /src\/data\/generated\/.*(?:Questions|QuestionBank|Skill|Level|Assessment).*\.generated\.js$/;
const knownStartupAllowedGenerated = new Set([
  "src/data/hfwApprovedCoverageWords.js"
]);

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function resolveImport(importer, specifier) {
  if (!specifier.startsWith(".")) return null;
  const importerDir = path.dirname(path.resolve(repoRoot, importer));
  const base = path.resolve(importerDir, specifier);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    path.join(base, "index.js")
  ];
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function getFileStats(filePath) {
  const absolutePath = path.resolve(repoRoot, filePath);
  if (!fs.existsSync(absolutePath)) return null;
  const text = fs.readFileSync(absolutePath, "utf8");
  return {
    bytes: Buffer.byteLength(text),
    lines: text.split(/\r?\n/).length
  };
}

function getStaticImports(filePath) {
  const absolutePath = path.resolve(repoRoot, filePath);
  if (!fs.existsSync(absolutePath)) return [];
  const text = fs.readFileSync(absolutePath, "utf8");
  const imports = [];
  const importPattern = /import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
  let match;
  while ((match = importPattern.exec(text))) {
    const resolved = resolveImport(filePath, match[1]);
    if (!resolved) continue;
    const repoPath = normalizePath(path.relative(repoRoot, resolved));
    imports.push({
      importer: filePath,
      specifier: match[1],
      resolved: repoPath,
      stats: getFileStats(repoPath)
    });
  }
  return imports;
}

const staticImports = startupFiles.flatMap(getStaticImports);
const riskyImports = staticImports
  .filter(item =>
    generatedAssessmentBankPattern.test(item.resolved) &&
    !knownStartupAllowedGenerated.has(item.resolved)
  )
  .sort((a, b) => (b.stats?.bytes || 0) - (a.stats?.bytes || 0));

const dynamicBankSources = [
  "src/data/generated/earlySkillQuestions.generated.js",
  "src/data/generated/hfwAssessmentQuestions.generated.js",
  "src/data/generated/hfwLevel2Questions.generated.js",
  "src/data/generated/firstTenSkillTopUpQuestions.generated.js",
  "src/data/generated/secondBlockSkillTopUpQuestions.generated.js",
  "src/data/generated/blendsAssessmentQuestions.generated.js",
  "src/data/generated/digraphsAssessmentQuestions.generated.js",
  "src/data/generated/longVowelsAssessmentQuestions.generated.js",
  "src/data/generated/vowelTeamsVarietyQuestions.generated.js",
  "src/data/generated/grammarAssessmentQuestions.generated.js",
  "src/data/generated/languageSkillQuestions.generated.js",
  "src/data/generated/skillLevelGapQuestions.generated.js"
].map(filePath => ({
  file: filePath,
  stats: getFileStats(filePath),
  loading: "dynamic via loadAssessmentSkillBank(skillId)"
}));

const report = {
  generatedAt: new Date().toISOString(),
  startupFiles,
  riskyStaticGeneratedAssessmentImports: riskyImports,
  dynamicAssessmentBanks: dynamicBankSources,
  pass: riskyImports.length === 0
};

const outputDir = path.resolve(repoRoot, "docs/validation");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "startup_assessment_import_audit.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

const markdown = [
  "# Startup Assessment Import Audit",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `Status: ${report.pass ? "PASS" : "FAIL"}`,
  "",
  "## Risky Static Generated Imports",
  "",
  riskyImports.length
    ? riskyImports.map(item =>
      `- ${item.importer} -> ${item.resolved} (${item.stats?.lines || 0} lines, ${item.stats?.bytes || 0} bytes)`
    ).join("\n")
    : "- None found in audited startup files.",
  "",
  "## Dynamic Assessment Banks",
  "",
  dynamicBankSources.map(item =>
    `- ${item.file} (${item.stats?.lines || 0} lines, ${item.stats?.bytes || 0} bytes): ${item.loading}`
  ).join("\n"),
  ""
].join("\n");

fs.writeFileSync(path.join(outputDir, "startup_assessment_import_audit.md"), markdown);

console.log(JSON.stringify({
  pass: report.pass,
  riskyStaticGeneratedAssessmentImports: riskyImports.length,
  dynamicAssessmentBanks: dynamicBankSources.length,
  outputs: [
    "docs/validation/startup_assessment_import_audit.json",
    "docs/validation/startup_assessment_import_audit.md"
  ]
}, null, 2));

if (!report.pass) {
  process.exitCode = 1;
}
