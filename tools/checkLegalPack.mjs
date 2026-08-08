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
    "not legally approved",
    // The pack must introduce a reviewer to both routes before they read a
    // single clause, or they will read the whole thing as school-only.
    "anonymous try-out",
    "direct family route"
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
    "Independent penetration",
    "Routes into the product",
    "Anonymous try-out",
    "Direct family route"
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
    // Pins the resolution. Without this the register could quietly drift back to
    // describing the font request as an open decision while the code has
    // already removed it, and the term-presence rule above would not notice.
    "self-hosted",
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
    "equivalent learning option",
    // A school signing an authorisation is entitled to know the public route
    // exists, and a parent may have used it before the school ever asked.
    "The anonymous try-out",
    "Open questions for counsel"
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
    "Current readiness gaps",
    "Which route this matrix covers",
    "anonymous try-out"
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
    "genuine external approval evidence",
    "Anonymous try-out and non-school routes"
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
    "school-managed context",
    // The two routes, the resolved font position, the honest platform-log
    // caveat, and the explicit statement that the family route is not built.
    "Two routes",
    "the anonymous try-out",
    "self-hosted",
    "platform logs",
    "not yet live"
  ]
});

/**
 * The sentence this pack was rewritten to remove.
 *
 * Before the anonymous try-out shipped, the policy said the product did not
 * offer independent child sign-up or collect information from children outside
 * the school-managed context. The first clause is still true and the second was
 * made false the day a child could open the try-out without a school.
 *
 * It is asserted as an ABSENCE rather than trusting a reviewer to notice,
 * because this is exactly the kind of line that survives a rewrite by being
 * unremarkable. Describe the change in your own words; do not reproduce the
 * sentence, even to quote it.
 */
const RETIRED_CHILD_ACCESS_CLAIM = /do not knowingly offer\s+independent child sign-?up/i;

/**
 * Anywhere a document says the try-out collects nothing, it must also say what
 * the host still sees.
 *
 * "We collect nothing" is a claim about LiteracyPath, not about web hosting:
 * the platform still logs an IP address, user agent, URL and time for every
 * request, as every web host does. Stating the first half without the second is
 * the single most likely way this pack becomes misleading, and it would happen
 * through ordinary tightening of the prose rather than through anybody deciding
 * to overclaim. So the two are bound together here.
 */
const COLLECTS_NOTHING_CLAIM =
  /(collects? nothing|nothing is (?:stored|collected|kept)|no information (?:is )?collected)/i;
const PLATFORM_LOG_CAVEAT = /(platform log|request metadata)/i;

const FALSE_APPROVAL_PATTERNS = Object.freeze([
  /\bstatus:\s*(?:legally\s+)?approved\b/i,
  /\blegal review:\s*(?:complete|passed|approved)\b/i,
  /\bfully compliant with\b/i,
  /\bcertified compliant\b/i,
  /\bguarantees? compliance\b/i
]);

/**
 * Substring search that does not care where a line happened to wrap.
 *
 * These documents are hard-wrapped prose, so a required phrase like "anonymous
 * try-out" is regularly split across a newline. A raw `includes` then reports it
 * as missing, and the fix is to reflow a paragraph rather than to write anything
 * — a gate that fails for a reason unrelated to its subject is a gate people
 * learn to work around. Case and whitespace are both normalised.
 */
function mentions(content, term) {
  const flatten = value => value.replace(/\s+/g, " ").toLocaleLowerCase("en");
  return flatten(content).includes(flatten(term));
}

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
      if (!mentions(content, term)) {
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

  for (const [file, content] of Object.entries(documents)) {
    if (typeof content !== "string") continue;
    if (RETIRED_CHILD_ACCESS_CLAIM.test(content)) {
      issues.push(
        `${file}: repeats the retired claim that no child reaches the product outside a school. `
        + "The anonymous try-out made that untrue; state the route instead."
      );
    }
  }

  issues.push(...collectsNothingIssues({
    "PRIVACY_POLICY.md": documents["PRIVACY_POLICY.md"],
    "SCHOOL_PARENT_CONSENT_MATERIALS.md": documents["SCHOOL_PARENT_CONSENT_MATERIALS.md"]
  }));

  return issues;
}

function collectsNothingIssues(namedDocuments) {
  const issues = [];
  for (const [name, content] of Object.entries(namedDocuments)) {
    if (typeof content !== "string") continue;
    if (COLLECTS_NOTHING_CLAIM.test(content) && !PLATFORM_LOG_CAVEAT.test(content)) {
      issues.push(
        `${name}: claims nothing is collected without disclosing that the host still records `
        + "ordinary request metadata in platform logs."
      );
    }
  }
  return issues;
}

/**
 * The date the source policy was last checked against the product.
 *
 * Read rather than hardcoded so the public page and the source cannot drift.
 * The previous version of this file pinned a literal date string, which meant
 * every policy revision needed a matching edit here and a forgotten one made the
 * gate assert a date that was no longer true.
 */
export function reviewDateFrom(policySource) {
  return policySource?.match(/Last reviewed against the product:\*{0,2}\s*([^\n<]+?)\s*$/im)?.[1] ?? null;
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

  const sourcePath = path.join(root, "docs", "legal", "PRIVACY_POLICY.md");
  const source = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, "utf8") : "";
  const reviewDate = reviewDateFrom(source);

  const required = [
    "Accessibility and support settings",
    "Browser storage",
    "Operational security and reliability",
    "Google Fonts",
    "self-hosted",
    "use identifiable learner data to train an AI model",
    "qualified legal review",
    // The published page is what a parent actually reads. If it describes only
    // the school route, the route a parent is most likely to have used is the
    // one the page does not mention.
    "the anonymous try-out",
    "platform logs",
    "no cookies are set by us"
  ];

  const issues = required
    .filter(term => !mentions(publicPolicy, term))
    .map(term => `public/privacy.html: missing synced subject "${term}"`);

  if (!reviewDate) {
    issues.push("PRIVACY_POLICY.md: no \"Last reviewed against the product\" date to sync against");
  } else if (!publicPolicy.includes(reviewDate)) {
    issues.push(
      `public/privacy.html: review date is out of sync with the source, which says "${reviewDate}"`
    );
  }

  issues.push(...collectsNothingIssues({ "public/privacy.html": publicPolicy }));
  if (RETIRED_CHILD_ACCESS_CLAIM.test(publicPolicy)) {
    issues.push(
      "public/privacy.html: repeats the retired claim that no child reaches the product outside a school."
    );
  }

  return issues;
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
