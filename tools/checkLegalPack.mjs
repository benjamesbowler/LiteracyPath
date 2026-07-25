import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const LEGAL_PACK_RULES = Object.freeze({
  "README.md": [
    "EXTERNAL-READY DRAFT",
    "TERMS_OF_SERVICE_DRAFT.md",
    "DATA_PROCESSING_ADDENDUM_DRAFT.md",
    "SUBPROCESSORS.md",
    "SECURITY_SUMMARY.md",
    "ACCESSIBILITY_STATEMENT_DRAFT.md",
    "INCIDENT_RESPONSE.md",
    "SCHOOL_PARENT_CONSENT_MATERIALS.md",
    "REGION_MATRIX.md",
    "LEGAL_DEPLOYMENT_FACTS.md",
    "COUNSEL_REVIEW_CHECKLIST.md",
    "not legally approved"
  ],
  "LEGAL_DEPLOYMENT_FACTS.md": [
    "OWNER CONFIRMATION",
    "Confirmed product facts",
    "Owner-required facts",
    "Supabase project",
    "Vercel team",
    "Google Fonts disposition",
    "School-configurable retention",
    "international transfer mechanism",
    "Independent accessibility",
    "Independent penetration"
  ],
  "TERMS_OF_SERVICE_DRAFT.md": [
    "QUALIFIED LEGAL REVIEW REQUIRED",
    "not in force",
    "authorised users",
    "Child privacy and acceptable use",
    "Customer Data",
    "No cap or exclusion is proposed",
    "Governing law and disputes",
    "picture-code"
  ],
  "DATA_PROCESSING_ADDENDUM_DRAFT.md": [
    "unsigned and not legally binding",
    "Roles",
    "Documented instructions",
    "Confidentiality",
    "Subprocessors",
    "Individual rights",
    "Personal data incidents",
    "Return, deletion, and retention",
    "International transfers",
    "FERPA, COPPA",
    "Annex 1",
    "Annex 2",
    "Annex 3",
    "Standard Contractual Clauses",
    "International Data Transfer Agreement"
  ],
  "SUBPROCESSORS.md": [
    "DEPLOYMENT FACTS",
    "Production provider register",
    "Supabase",
    "Vercel",
    "Google Fonts",
    "Not production subprocessors",
    "OpenAI",
    "BytePlus",
    "Change-notice and objection process",
    "Retention/deletion",
    "Transfer position"
  ],
  "SECURITY_SUMMARY.md": [
    "NOT A CERTIFICATION",
    "Architecture and data flow",
    "Identity and access",
    "Content Security Policy",
    "row-level security",
    "Known boundaries",
    "Data rights/retention",
    "Recovery",
    "Vulnerability and incident reporting"
  ],
  "ACCESSIBILITY_STATEMENT_DRAFT.md": [
    "INDEPENDENT ACCESSIBILITY REVIEW REQUIRED",
    "no formal conformance claim",
    "WCAG 2.2 Level AA",
    "Current limitations",
    "Alternatives and support",
    "Feedback",
    "VoiceOver",
    "NVDA",
    "https://www.w3.org/TR/WCAG22/"
  ],
  "INCIDENT_RESPONSE.md": [
    "EXERCISE AND COUNSEL REVIEW REQUIRED",
    "confidentiality, integrity, availability",
    "SEV-1",
    "Triage and scope",
    "Contain",
    "Assess notification",
    "24 hours",
    "Evidence handling",
    "Provider incidents",
    "tabletop",
    "isolated restore"
  ],
  "SCHOOL_PARENT_CONSENT_MATERIALS.md": [
    "LOCAL ADAPTATION AND QUALIFIED LEGAL REVIEW REQUIRED",
    "Operator’s direct notice to a school",
    "School authorisation record",
    "Plain-language parent/guardian notice",
    "Parent/guardian consent form",
    "Age-appropriate learner explanation and assent",
    "Rights and privacy request intake",
    "Withdrawal and alternative-access",
    "operator remains responsible",
    "equivalent learning option"
  ],
  "REGION_MATRIX.md": [
    "QUALIFIED LOCAL LEGAL REVIEW REQUIRED",
    "does not declare compliance",
    "US COPPA",
    "US FERPA",
    "US PPRA",
    "UK GDPR",
    "EU/EEA GDPR",
    "Article 6 basis",
    "Article 28",
    "DPIA",
    "72-hour",
    "Target-state inventory",
    "Current readiness gaps"
  ],
  "COUNSEL_REVIEW_CHECKLIST.md": [
    "NO LEGAL REVIEW RECORDED",
    "only the named qualified reviewer",
    "Reviewer name",
    "Not recorded",
    "US education and child privacy",
    "UK and EU/EEA",
    "Providers, regions, and transfers",
    "Retention, rights, incidents, and recovery",
    "Security and accessibility",
    "genuine external approval evidence"
  ],
  "PRIVACY_POLICY.md": [
    "QUALIFIED LEGAL REVIEW REQUIRED",
    "Information we collect",
    "Accessibility and support settings",
    "Browser storage",
    "Operational security and reliability",
    "Supabase",
    "Vercel",
    "Google Fonts",
    "Retention and deletion",
    "use identifiable learner data to train an AI model",
    "school-managed context"
  ]
});

const FALSE_APPROVAL_PATTERNS = Object.freeze([
  /\bstatus:\s*(?:legally\s+)?approved\b/i,
  /\blegal review:\s*(?:complete|passed|approved)\b/i,
  /\bfully compliant with\b/i,
  /\bcertified compliant\b/i,
  /\bguarantees? compliance\b/i
]);

export function validateLegalPackDocuments(documents) {
  const issues = [];

  for (const [file, requiredTerms] of Object.entries(LEGAL_PACK_RULES)) {
    const content = documents[file];
    if (typeof content !== "string") {
      issues.push(`${file}: missing`);
      continue;
    }
    if (content.trim().length < 400) {
      issues.push(`${file}: implausibly short`);
    }
    for (const term of requiredTerms) {
      if (!content.toLocaleLowerCase("en").includes(term.toLocaleLowerCase("en"))) {
        issues.push(`${file}: missing required subject "${term}"`);
      }
    }
    for (const pattern of FALSE_APPROVAL_PATTERNS) {
      if (pattern.test(content)) {
        issues.push(`${file}: contains a false legal-approval/compliance claim`);
      }
    }
  }

  const subprocessors = documents["SUBPROCESSORS.md"] ?? "";
  if (!/OpenAI[\s\S]+No production learner runtime/i.test(subprocessors)) {
    issues.push("SUBPROCESSORS.md: authoring-only OpenAI boundary is not explicit");
  }

  const checklist = documents["COUNSEL_REVIEW_CHECKLIST.md"] ?? "";
  const unchecked = checklist.match(/^- \[ \]/gm)?.length ?? 0;
  if (unchecked < 35) {
    issues.push(`COUNSEL_REVIEW_CHECKLIST.md: expected at least 35 uncompleted external checks, found ${unchecked}`);
  }
  if (/^- \[[xX]\]/m.test(checklist)) {
    issues.push("COUNSEL_REVIEW_CHECKLIST.md: must not self-complete external checks");
  }

  const facts = documents["LEGAL_DEPLOYMENT_FACTS.md"] ?? "";
  const unresolved = facts.match(/\b(?:Unconfirmed|Unresolved|Not completed|Not assessed)\b/g)?.length ?? 0;
  if (unresolved < 15) {
    issues.push(`LEGAL_DEPLOYMENT_FACTS.md: unresolved launch decisions are not candidly enumerated (${unresolved})`);
  }

  return issues;
}

export function readLegalPack(root = repoRoot) {
  const legalRoot = path.join(root, "docs", "legal");
  return Object.fromEntries(
    Object.keys(LEGAL_PACK_RULES).map(file => [
      file,
      fs.existsSync(path.join(legalRoot, file))
        ? fs.readFileSync(path.join(legalRoot, file), "utf8")
        : null
    ])
  );
}

export function validatePublicPrivacyPage(root = repoRoot) {
  const publicPath = path.join(root, "public", "privacy.html");
  if (!fs.existsSync(publicPath)) return ["public/privacy.html: missing"];
  const publicPolicy = fs.readFileSync(publicPath, "utf8");
  const required = [
    "24 July 2026",
    "Accessibility and support settings",
    "Browser storage",
    "Operational security and reliability",
    "Google Fonts",
    "use identifiable learner data to train an AI model",
    "qualified legal review"
  ];
  return required
    .filter(term => !publicPolicy.toLocaleLowerCase("en").includes(term.toLocaleLowerCase("en")))
    .map(term => `public/privacy.html: missing synced subject "${term}"`);
}

export function validateLegalPack(root = repoRoot) {
  return [
    ...validateLegalPackDocuments(readLegalPack(root)),
    ...validatePublicPrivacyPage(root)
  ];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = validateLegalPack();
  if (issues.length) {
    console.error(`Legal-pack verification failed with ${issues.length} issue(s):`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Legal pack verified: ${Object.keys(LEGAL_PACK_RULES).length} documents, public policy sync, ` +
      "all required subjects present, external review still explicitly open."
    );
  }
}
