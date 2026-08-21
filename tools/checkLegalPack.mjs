import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const PUBLIC_LEGAL_RULES = Object.freeze({
  "legal.html": [
    "UK-first beta", "Benjamin Bowler, trading as Literacy Guide", "free beta",
    "does not take payments", "continuous", "reported defect", "data-processing.html"
  ],
  "privacy.html": [
    "2026-08-21-uk-v1", "school normally", "controller", "processor", "Article 6",
    "Article 9", "Sydney, Australia", "Vercel", "restricted transfer", "data-protection test",
    "365 days", "90 days", "rights requests", "acknowledge it within 30 days",
    "No advertising", "No use of identifiable learner data to train an AI model"
  ],
  "terms.html": [
    "2026-08-21-uk-beta-v1", "free beta", "does not currently take payment", "authorised",
    "lawful basis", "DPIA", "data-processing.html", "mandatory rights", "England and Wales",
    "geographic service address is not created"
  ],
  "cookies.html": [
    "No consent banner", "no advertising", "optional analytics", "local storage", "IndexedDB",
    "Supabase authentication", "Vercel", "Anonymous try-out", "valid choice mechanism"
  ],
  "accessibility.html": [
    "WCAG 2.2 Level AA", "continuous", "pass-by-exception", "reasonable adjustments",
    "Known limitations", "practical alternative", "not a third-party accessibility certification"
  ],
  "data-processing.html": [
    "Article 28", "not automatically a school contract", "Roles", "Documented instructions",
    "confidentiality", "security", "rights", "without undue delay", "Return or delete",
    "Subprocessors", "International transfers", "Sydney", "Vercel", "written agreement"
  ]
});

const FALSE_CLAIMS = Object.freeze([
  /\bfully compliant\b/i,
  /\bcertified compliant\b/i,
  /\bguarantees? compliance\b/i,
  /\bexternal-ready draft\b/i,
  /\b(?:waiting|awaiting|pending) (?:human |listening )?(?:review|approval)\b/i
]);

function mentions(content, term) {
  const flatten = value => String(value || "").replace(/\s+/g, " ").toLocaleLowerCase("en-GB");
  return flatten(content).includes(flatten(term));
}

export function readPublicLegalPages(root = repoRoot) {
  return Object.fromEntries(Object.keys(PUBLIC_LEGAL_RULES).map(file => {
    const filePath = path.join(root, "public", file);
    return [file, fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null];
  }));
}

export function validatePublicLegalDocuments(documents) {
  const issues = [];
  for (const [file, terms] of Object.entries(PUBLIC_LEGAL_RULES)) {
    const content = documents[file];
    if (typeof content !== "string") {
      issues.push(`public/${file}: missing`);
      continue;
    }
    if (content.trim().length < 900) issues.push(`public/${file}: implausibly short`);
    for (const term of terms) {
      if (!mentions(content, term)) issues.push(`public/${file}: missing required subject "${term}"`);
    }
    if (!/<html\s+lang="en-GB">/i.test(content)) issues.push(`public/${file}: lang must be en-GB`);
    if (!/<meta\s+name="viewport"/i.test(content)) issues.push(`public/${file}: viewport metadata missing`);
    if (!/<link\s+rel="stylesheet"\s+href="\/legal\.css"/i.test(content)) {
      issues.push(`public/${file}: shared local legal stylesheet missing`);
    }
    if (/<script\b/i.test(content)) issues.push(`public/${file}: legal pages must not execute scripts`);
    if (/<link[^>]+href="https?:\/\//i.test(content)) issues.push(`public/${file}: external stylesheet present`);
    for (const pattern of FALSE_CLAIMS) {
      if (pattern.test(content)) issues.push(`public/${file}: contains a false or obsolete release claim`);
    }
  }
  return issues;
}

function read(root, relativePath) {
  const filePath = path.join(root, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

export function validateLegalImplementation(root = repoRoot) {
  const issues = [];
  const policy = read(root, "src/policy/legalPolicy.js");
  const auth = read(root, "src/components/AuthPage.jsx");
  const controller = read(root, "src/appState/useAppSessionController.js");
  const landing = read(root, "src/components/StudentEntryPage.jsx");
  const facts = read(root, "docs/legal/LEGAL_DEPLOYMENT_FACTS.md");
  const legalReadme = read(root, "docs/legal/README.md");

  for (const [file, content] of [
    ["src/policy/legalPolicy.js", policy],
    ["src/components/AuthPage.jsx", auth],
    ["src/appState/useAppSessionController.js", controller],
    ["src/components/StudentEntryPage.jsx", landing],
    ["docs/legal/LEGAL_DEPLOYMENT_FACTS.md", facts],
    ["docs/legal/README.md", legalReadme]
  ]) {
    if (!content) issues.push(`${file}: missing`);
  }

  for (const term of ["2026-08-21-uk-beta-v1", "2026-08-21-uk-v1", "England and Wales"]) {
    if (!mentions(policy, term)) issues.push(`src/policy/legalPolicy.js: missing "${term}"`);
  }
  for (const term of ["required", "/terms.html", "/privacy.html", "legalAccepted"]) {
    if (!mentions(auth, term)) issues.push(`src/components/AuthPage.jsx: missing legal acceptance subject "${term}"`);
  }
  for (const term of ["legal_terms_accepted", "legal_terms_version", "privacy_notice_version"]) {
    if (!mentions(controller, term)) issues.push(`src/appState/useAppSessionController.js: missing sign-up metadata "${term}"`);
  }
  for (const href of ["/legal.html", "/privacy.html", "/terms.html", "/cookies.html", "/accessibility.html"]) {
    if (!landing.includes(href)) issues.push(`src/components/StudentEntryPage.jsx: missing footer link "${href}"`);
  }
  for (const term of ["Sydney", "Geographic service address", "ICO fee", "Vercel", "UK transfer", "paid service"]) {
    if (!mentions(facts, term)) issues.push(`docs/legal/LEGAL_DEPLOYMENT_FACTS.md: missing open fact "${term}"`);
  }
  for (const term of ["continuous", "pass-by-exception", "free beta", "real learner data"]) {
    if (!mentions(legalReadme, term)) issues.push(`docs/legal/README.md: missing operating rule "${term}"`);
  }

  return issues;
}

export function validateLegalPack(root = repoRoot) {
  return [
    ...validatePublicLegalDocuments(readPublicLegalPages(root)),
    ...validateLegalImplementation(root)
  ];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = validateLegalPack();
  if (issues.length) {
    console.error(`UK legal-pack verification failed with ${issues.length} issue(s):`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log(
      `UK legal pack verified: ${Object.keys(PUBLIC_LEGAL_RULES).length} public pages, `
      + "versioned sign-up acceptance, free-beta boundary, and explicit owner/provider gaps."
    );
  }
}
