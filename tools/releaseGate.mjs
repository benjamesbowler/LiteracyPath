import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseArtifactRoot = path.join(repoRoot, ".artifacts", "release");
const canonicalManifestPath = path.join(releaseArtifactRoot, "manifest.json");
const assessmentGateJsonPath = path.join(repoRoot, "docs", "validation", "assessment_rebuild_gate.json");
const REQUIRED_AUDIT_ENVIRONMENT = Object.freeze([
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "LP_AUDIT_SUPABASE_URL",
  "LP_AUDIT_SUPABASE_ANON_KEY",
  "LP_AUDIT_DATABASE_URL",
  "LP_AUDIT_TEACHER_PASSWORD"
]);

export const RELEASE_GATES = Object.freeze([
  {
    id: "lint",
    label: "Lint with zero warnings",
    command: ["npm", "run", "lint", "--", "--max-warnings=0"],
    areas: [4, 10]
  },
  {
    id: "unit-tests",
    label: "Full unit suite",
    command: ["npm", "test"],
    areas: [4, 8, 9, 10]
  },
  {
    id: "build",
    label: "Production build",
    command: ["npm", "run", "build"],
    areas: [3, 8, 9, 10]
  },
  {
    id: "reporting-bible",
    label: "Reporting bible has not drifted",
    command: ["npm", "run", "check:reporting-bible"],
    areas: [4, 8, 10]
  },
  {
    id: "app-copy",
    label: "Plain-language copy on teacher, child, family, and export surfaces",
    command: ["npm", "run", "check:app-copy"],
    areas: [1, 2, 3, 5, 6, 7, 10]
  },
  {
    id: "story-content-policy",
    label: "Registered narrative content, exact source fingerprints, and supported approval claims",
    command: ["npm", "run", "check:story-content-policy"],
    areas: [1, 2, 3, 4, 10]
  },
  {
    id: "guided-reading-story-bible",
    label: "Guided Reading Story Bible, level ladder, exact narration, and locked manuscript review",
    command: ["npm", "run", "check:guided-reading-story-bible"],
    areas: [1, 2, 3, 4, 10]
  },
  {
    id: "guided-reading-human-voice",
    label: "Guided Reading fiction uses concrete, character-specific human prose",
    command: ["npm", "run", "check:guided-reading-human-voice"],
    areas: [1, 2, 3, 4, 10]
  },
  {
    id: "guided-reading-visual-alignment",
    label: "Every Guided Reading page has hash-locked Story-Bible-aligned illustration approval",
    command: ["npm", "run", "check:guided-reading-visual-alignment"],
    areas: [1, 3, 4, 10]
  },
  {
    id: "guided-reading-evidence-questions",
    label: "Every Guided Reading book has three evidence-grounded, unambiguous questions",
    command: ["npm", "run", "check:validate:guided-reading-questions"],
    areas: [1, 2, 4, 10]
  },
  {
    id: "public-source-maps",
    label: "Public build contains no source maps or map references",
    command: ["npm", "run", "check:public-source-maps"],
    areas: [8, 9, 10]
  },
  {
    id: "smoke",
    label: "Reachable-product smoke tests",
    command: ["npm", "run", "test:smoke"],
    areas: [1, 2, 3, 5, 6, 7, 9, 10]
  },
  {
    id: "assessment-question-integrity",
    label: "Current v3 assessment structure, originality, answer integrity, progression, repeat safety, and reporting",
    command: ["npm", "run", "check:assessment-question-integrity"],
    areas: [1, 4, 10]
  },
  {
    id: "question-design-policy",
    label: "Research-backed question design across assessments, reading, quests, games, and worksheets",
    command: ["npm", "run", "check:question-design-policy"],
    areas: [1, 2, 3, 4, 8, 10]
  },
  {
    id: "learn-games",
    label: "Arcade literacy mechanics, recorded cues, media, and integration",
    command: ["npm", "run", "check:learn-games"],
    areas: [1, 2, 3, 4, 8, 10]
  },
  {
    id: "guided-reading-decoding-support",
    label: "Guided Reading decoding ladder and teacher-visible support events",
    command: ["npm", "run", "check:guided-reading-decoding-support"],
    areas: [1, 6, 7, 10]
  },
  {
    id: "research-pilot-pack",
    label: "Expert review, learning-measurement, and child/teacher pilot pack",
    command: ["npm", "run", "check:research-pilot-pack"],
    areas: [1, 2, 4, 10]
  },
  {
    id: "calibration-readiness",
    label: "Seeded calibration monitoring and independent specialist protocol",
    command: ["npm", "run", "check:calibration-readiness"],
    areas: [4, 10]
  },
  {
    id: "student-home-hierarchy",
    label: "One policy-led student-home recommendation, two secondary choices, and disclosed exploration",
    command: ["npm", "run", "check:student-home-hierarchy"],
    areas: [2, 4, 10]
  },
  {
    id: "student-home-continuation",
    label: "Specific student-home continuation with a progress-derived remaining goal",
    command: ["npm", "run", "check:student-home-continuation"],
    areas: [2, 4, 10]
  },
  {
    id: "student-daily-mission",
    label: "Main-hierarchy daily mission with durable per-step celebration and next-step routing",
    command: ["npm", "run", "check:student-daily-mission"],
    areas: [2, 4, 10]
  },
  {
    id: "student-home-card-states",
    label: "Child-safe student-home New, Continue, Teacher picked, and progress states",
    command: ["npm", "run", "check:student-home-card-states"],
    areas: [2, 4, 10]
  },
  {
    id: "student-rail-accessibility",
    label: "Named and spoken child navigation with teacher-owned reduced-choice persistence",
    command: ["npm", "run", "check:student-rail-accessibility"],
    areas: [2, 3, 4, 8, 10]
  },
  {
    id: "student-login-recovery",
    label: "Illustrated and spoken student-login recovery with preserved class code",
    command: ["npm", "run", "check:student-login-recovery"],
    areas: [2, 3, 4, 8, 10]
  },
  {
    id: "student-login-panel",
    label: "Focused class-code panel with subordinate teacher escape and visual example",
    command: ["npm", "run", "check:student-login-panel"],
    areas: [2, 3, 10]
  },
  {
    id: "guided-reading-control-hierarchy",
    label: "Primary Read Page action with status-only progress and grouped reader view controls",
    command: ["npm", "run", "check:guided-reading-control-hierarchy"],
    areas: [2, 3, 10]
  },
  {
    id: "guided-reading-measure",
    label: "Level-specific Guided Reading line length, line focus, and image/text templates",
    command: ["npm", "run", "check:guided-reading-measure"],
    areas: [1, 3, 10]
  },
  {
    id: "locked-item-affordance",
    label: "Visible and spoken locked-item currency cost, shortfall, and disabled-state contrast",
    command: ["npm", "run", "check:locked-item-affordance"],
    areas: [3, 10]
  },
  {
    id: "sound-racer-tutorial",
    label: "Current-target Sound Racer tutorial with recorded example audio and separate steering help",
    command: ["npm", "run", "check:sound-racer-tutorial"],
    areas: [2, 4, 10]
  },
  {
    id: "fullscreen-overlay-semantics",
    label: "Active-surface names and modal semantics across every fullscreen quest and game overlay",
    command: ["npm", "run", "check:fullscreen-overlay-semantics"],
    areas: [2, 3, 10]
  },
  {
    id: "child-surface-rules",
    label: "Five-region child-surface contract with exactly one primary action on every student route",
    command: ["npm", "run", "check:child-surface-rules"],
    areas: [2, 3, 10]
  },
  {
    id: "student-emphasis-budget",
    label: "One visually dominant recommended learning action on every child route and review width",
    command: ["npm", "run", "check:student-emphasis-budget"],
    areas: [2, 3, 10]
  },
  {
    id: "assessment-media-evidence",
    label: "Meaningfully named assessment evidence with failed-image removal and round refill",
    command: ["npm", "run", "check:assessment-media-evidence"],
    areas: [1, 3, 4, 8, 10]
  },
  {
    id: "learning-policy",
    label: "Versioned learning thresholds with minimum evidence, recency, confidence, and sparse-learner UI",
    command: ["npm", "run", "check:learning-policy"],
    areas: [1, 4, 7, 8, 10]
  },
  {
    id: "class-summary-accuracy",
    label: "Learner-weighted and response-weighted class accuracy with comparability suppression",
    command: ["npm", "run", "check:class-summary-accuracy"],
    areas: [4, 5, 6, 7, 10]
  },
  {
    id: "recommendation-explanations",
    label: "Brief child and evidence/dependency/confidence/unlock teacher recommendation explanations",
    command: ["npm", "run", "check:recommendation-explanations"],
    areas: [2, 4, 5, 6, 7, 10]
  },
  {
    id: "engagement-sync",
    label: "Durable engagement queue, bounded retry, class sync health, and offline recovery",
    command: ["npm", "run", "check:engagement-sync"],
    areas: [4, 5, 6, 8, 9, 10]
  },
  {
    id: "key-route-visuals",
    label: "Desktop and phone visual baselines plus delayed child-route placeholders",
    command: ["npm", "run", "check:key-route-visuals"],
    areas: [2, 3, 10]
  },
  {
    id: "assessment-runtime-variation",
    label: "Assessment runtime variation",
    command: ["npm", "run", "check:assessment-runtime-variation", "--", "--check"],
    areas: [1, 4, 10]
  },
  {
    id: "assessment-skill-contracts",
    label: "Exact 30-skill publication, phase, and retry contracts",
    command: ["npm", "run", "check:assessment-skill-contracts"],
    areas: [1, 4, 10]
  },
  {
    id: "strict-curriculum",
    label: "Current v3 assessment publication gate",
    command: ["npm", "run", "check:audit:assessment-rebuild"],
    areas: [1, 4, 10]
  },
  {
    id: "curriculum-release-standard",
    label: "Canonical assessment publication standard",
    command: ["npm", "run", "check:curriculum-release-standard"],
    areas: [1, 4, 10]
  },
  {
    id: "skill-progression",
    label: "Skill progression without warnings",
    command: ["npm", "run", "check:skill-progression", "--", "--check"],
    areas: [1, 4, 10],
    failOnPositiveCount: "warnings"
  },
  {
    id: "teacher-dashboard-data",
    label: "Reachable teacher dashboard contracts",
    command: ["npm", "run", "check:teacher-dashboard-data"],
    areas: [4, 5, 6, 7, 9, 10]
  },
  {
    id: "teacher-ia",
    label: "Six-section teacher information architecture",
    command: ["npm", "run", "check:teacher-ia"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-today",
    label: "Seeded Today evidence briefing and actions",
    command: ["npm", "run", "check:teacher-today"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-urgency-order",
    label: "Teacher page urgency order and collapsed roster administration",
    command: ["npm", "run", "check:teacher-urgency-order"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-action-feedback",
    label: "Shared pending, success, error, and undo feedback with AT announcements",
    command: ["npm", "run", "check:teacher-action-feedback"],
    areas: [5, 6, 7, 10]
  },
  {
    id: "teacher-metric-definitions",
    label: "Defined teacher metrics in DOM tooltips and export definition sheets",
    command: ["npm", "run", "check:teacher-metric-definitions"],
    areas: [5, 6, 7, 10]
  },
  {
    id: "teacher-assessment-hub",
    label: "Purpose-led teacher assessment hub and retired navigation taxonomy",
    command: ["npm", "run", "check:teacher-assessment-hub"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-state-matrix",
    label: "Five-surface teacher loading, empty, partial, offline, denied, conflict, expired, and recovery states",
    command: ["npm", "run", "check:teacher-state-matrix"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-ui-primitives",
    label: "Consolidated teacher tokens, page shells, filters, tables, charts, dialogs, and visual baselines",
    command: ["npm", "run", "check:teacher-ui-primitives"],
    areas: [5, 6, 9, 10]
  },
  {
    id: "teacher-context",
    label: "Persistent class, group, and learner teacher context",
    command: ["npm", "run", "check:teacher-context"],
    areas: [5, 6, 10]
  },
  {
    id: "teacher-class-progress",
    label: "Class-first distribution, coverage, groups, outliers, and three-click item evidence",
    command: ["npm", "run", "check:teacher-class-progress"],
    areas: [5, 7, 10]
  },
  {
    id: "teacher-evidence-basis",
    label: "Attempts, diversity, recency, confidence, support use, and sparse-evidence withholding",
    command: ["npm", "run", "check:teacher-evidence-basis"],
    areas: [7, 10]
  },
  {
    id: "teacher-growth-history",
    label: "Five longitudinal evidence series with curriculum versions on one dated axis",
    command: ["npm", "run", "check:teacher-growth-history"],
    areas: [7, 10]
  },
  {
    id: "teacher-instructional-groups",
    label: "Saved transparent groups, aggregate comparison, movement review, and tracked follow-up",
    command: ["npm", "run", "check:teacher-instructional-groups"],
    areas: [5, 7, 8, 10]
  },
  {
    id: "teacher-insight-actions",
    label: "Every actionable insight closes into practice, group planning, print, or observed follow-up",
    command: ["npm", "run", "check:teacher-insight-actions"],
    areas: [5, 7, 8, 10]
  },
  {
    id: "immutable-assessment-evidence",
    label: "Versioned immutable assessment evidence and content-independent report replay",
    command: ["npm", "run", "check:immutable-assessment-evidence"],
    areas: [7, 8, 10]
  },
  {
    id: "report-export-provenance",
    label: "Complete PDF, Excel, and CSV provenance snapshots",
    command: ["npm", "run", "check:report-export-provenance"],
    areas: [7, 8, 10]
  },
  {
    id: "el-export-consistency",
    label: "Cross-export skill-spine consistency and explicit zero-evidence handling",
    command: ["npm", "run", "check:el-export-consistency"],
    areas: [7, 8, 10]
  },
  {
    id: "whole-child-evidence-integrity",
    label: "Per-item timestamps, phoneme coverage, evidence basis, and reconciled Whole Child reporting",
    command: ["npm", "run", "check:whole-child-evidence-integrity"],
    areas: [1, 4, 7, 10]
  },
  {
    id: "report-audience-templates",
    label: "Teacher diagnostic, class/leadership, and plain-language family report templates",
    command: ["npm", "run", "check:report-audience-templates"],
    areas: [6, 7, 10]
  },
  {
    id: "audit-school-live",
    label: "Audit school Auth, fixtures, and RLS isolation",
    command: ["npm", "run", "check:audit-school-live"],
    areas: [6, 8, 10]
  },
  {
    id: "teacher-onboarding",
    label: "Fresh-teacher setup and first-check golden path",
    command: ["npm", "run", "check:teacher-onboarding"],
    areas: [5, 6, 8, 9, 10]
  },
  {
    id: "teacher-roster-scale",
    label: "Real-class roster import, bulk cards, archive, and transfer",
    command: ["npm", "run", "check:teacher-roster-scale"],
    areas: [5, 6, 8, 9, 10]
  },
  {
    id: "teacher-roster-device-matrix",
    label: "Configurable teacher roster and learner drawer at Chromebook and tablet sizes",
    command: ["npm", "run", "check:teacher-roster-device-matrix"],
    areas: [5, 6, 10]
  },
  {
    id: "el-assessment-completion-device-matrix",
    label: "Reachable 8-item EL completion, placement, and finish controls across laptop and iPad viewports",
    command: ["npm", "run", "check:el-assessment-completion-device-matrix"],
    areas: [3, 4, 6, 10]
  },
  {
    id: "el-assessment-item-copy",
    label: "Exact teacher directives and jargon-free EL assessment item headers",
    command: ["npm", "run", "check:el-assessment-item-copy"],
    areas: [4, 6, 10]
  },
  {
    id: "el-assessment-route-final-review",
    label: "Exact EL assessment refresh/resume route and deliberate final-tally confirmation",
    command: ["npm", "run", "check:el-assessment-route-final-review"],
    areas: [4, 9, 10]
  },
  {
    id: "teacher-routing",
    label: "RLS-validated teacher class/report deep links with refresh and browser-history restoration",
    command: ["npm", "run", "check:teacher-routing"],
    areas: [8, 9, 10]
  },
  {
    id: "domain-boundaries",
    label: "Runtime-validated auth, class, evidence, report, and content backend boundaries",
    command: ["npm", "run", "check:domain-boundaries"],
    areas: [4, 8, 9, 10]
  },
  {
    id: "app-decomposition",
    label: "App controller session and rendering boundaries",
    command: ["npm", "run", "check:app-decomposition"],
    areas: [4, 9, 10]
  },
  {
    id: "teacher-contextual-help",
    label: "Searchable question-type help reachable from learner evidence",
    command: ["npm", "run", "check:teacher-contextual-help"],
    areas: [4, 5, 6, 10]
  },
  {
    id: "teacher-class-code",
    label: "Accessible class-code copy and regeneration",
    command: ["npm", "run", "check:teacher-class-code"],
    areas: [3, 5, 6, 8, 10]
  },
  {
    id: "teacher-login-cards",
    label: "Page-sized login-card route without document stream writes",
    command: ["npm", "run", "check:teacher-login-cards"],
    areas: [3, 5, 6, 8, 10]
  },
  {
    id: "teacher-student-preview",
    label: "Read-only student preview with exact teacher return",
    command: ["npm", "run", "check:teacher-student-preview"],
    areas: [3, 5, 6, 8, 10]
  },
  {
    id: "teacher-interventions",
    label: "Trackable intervention lifecycle and Today follow-up",
    command: ["npm", "run", "check:teacher-interventions"],
    areas: [4, 5, 6, 7, 8, 10]
  },
  {
    id: "teacher-dashboard-consolidation",
    label: "Single teacher product and parity matrix",
    command: ["npm", "run", "check:teacher-dashboard-consolidation"],
    areas: [5, 9, 10]
  },
  {
    id: "product-finish-surface",
    label: "Reachable product finish contracts",
    command: ["npm", "run", "check:product-finish-surface"],
    areas: [4, 5, 6, 7, 10]
  },
  {
    id: "release-readiness-surface",
    label: "Report and release-readiness contracts",
    command: ["npm", "run", "check:release-readiness-surface"],
    areas: [4, 7, 10]
  },
  {
    id: "dependency-audit",
    label: "Dependency audit (high and critical)",
    command: ["npm", "audit", "--json", "--audit-level=high"],
    areas: [8, 10],
    outputFormat: "npm-audit-json"
  },
  {
    id: "export-compatibility",
    label: "Export compatibility, lazy loading, and 500-item memory",
    command: ["npm", "run", "check:export-compatibility"],
    areas: [8, 9, 10]
  },
  {
    id: "repo-hygiene",
    label: "Baselined repository hygiene",
    command: ["npm", "run", "check:repo-hygiene", "--", "--check"],
    areas: [10]
  },
  {
    id: "audit-read-only",
    label: "Read-only audit mode contract",
    command: ["npm", "run", "check:audit-read-only"],
    areas: [10]
  },
  {
    id: "database-bootstrap-schema",
    label: "Reconstructable core database schema",
    command: ["npm", "run", "check:database-bootstrap-schema"],
    areas: [8, 10]
  },
  {
    id: "live-database-functions",
    label: "Every browser-callable RPC is visible in the hosted PostgREST schema",
    command: ["npm", "run", "check:live-database"],
    areas: [5, 6, 7, 8, 10]
  },
  {
    id: "audit-school-seed",
    label: "Deterministic non-production audit school",
    command: ["npm", "run", "check:audit-school-seed"],
    areas: [6, 10]
  },
  {
    id: "a11y-routes",
    label: "All-route accessibility",
    command: ["npm", "run", "check:a11y-routes"],
    areas: [3, 10]
  },
  {
    id: "external-program-readiness",
    label: "Manual accessibility and recurring observation programmes ready for human execution",
    command: ["npm", "run", "check:external-program-readiness"],
    areas: [1, 2, 3, 10]
  },
  {
    id: "curriculum-board",
    label: "Canonical per-skill admin QA and Loop D child-exposure board",
    command: ["npm", "run", "check:curriculum-board"],
    areas: [1, 4, 10],
    planned: true
  },
  {
    id: "learner-accessibility-settings",
    label: "Persisted per-learner accessibility settings and runtime effects",
    command: ["npm", "run", "check:learner-accessibility-settings"],
    areas: [3, 8, 10]
  },
  {
    id: "overlay-contrast-focus",
    label: "Game-overlay contrast, disabled-state legibility, and visible keyboard focus",
    command: ["npm", "run", "check:overlay-contrast-focus"],
    areas: [3, 10]
  },
  {
    id: "a11y-teacher",
    label: "Authenticated teacher accessibility",
    command: ["npm", "run", "check:a11y-teacher"],
    areas: [6, 10],
    planned: true
  },
  {
    id: "db-policies",
    label: "Database policy integration",
    command: ["npm", "run", "check:db-policies"],
    areas: [8, 10],
    planned: true
  },
  {
    id: "class-access-security",
    label: "Class-code throttling, expiry, anomaly alert, and privacy-minimal access log",
    command: ["npm", "run", "check:class-access-security"],
    areas: [2, 5, 6, 8, 10],
    planned: true
  },
  {
    id: "private-source-maps",
    label: "Private hidden source maps and production-frame symbolication",
    command: ["npm", "run", "check:private-source-maps"],
    areas: [9, 10]
  },
  {
    id: "error-monitoring",
    label: "Redacted release-tagged remote errors, retention, alerting, and local fallback",
    command: ["npm", "run", "check:error-monitoring"],
    areas: [8, 9, 10],
    planned: true
  },
  {
    id: "recovery-drill",
    label: "Isolated backup restore with class, evidence, and report verification",
    command: ["npm", "run", "check:recovery-drill"],
    areas: [8, 10],
    planned: true
  },
  {
    id: "learner-data-rights",
    label: "Tracked verified learner export, deletion, zero-residual proof, and audit tombstone",
    command: ["npm", "run", "check:learner-data-rights"],
    areas: [8, 10],
    planned: true
  },
  {
    id: "retention-policy",
    label: "School-configurable retention, cleanup job, and evidence-gated deletion propagation",
    command: ["npm", "run", "check:retention-policy"],
    areas: [8, 10],
    planned: true
  },
  {
    id: "split-boundaries",
    label: "Effective per-skill data splits, route/data ceilings, and build-time lexicon isolation",
    command: ["npm", "run", "check:split-boundaries"],
    areas: [9, 10],
    planned: true
  },
  {
    id: "first-load-network",
    label: "Production student and teacher shells exclude deferred banks and heavy routes",
    command: ["npm", "run", "check:first-load-network"],
    areas: [9, 10],
    planned: true
  },
  {
    id: "legal-pack",
    label: "Complete counsel-ready legal, privacy, consent, region, security, and accessibility pack",
    command: ["npm", "run", "check:legal-pack"],
    areas: [8, 10],
    planned: true
  },
  {
    id: "e2e-teacher",
    label: "Authenticated teacher end-to-end",
    command: ["npm", "run", "check:e2e-teacher"],
    areas: [5, 6, 7, 10],
    planned: true
  },
  {
    id: "csp",
    label: "Enforced content security policy",
    command: ["npm", "run", "check:csp"],
    areas: [8, 10],
    planned: true
  },
  {
    id: "runtime-variation-simulation",
    label: "500-session-per-skill variation simulation",
    command: ["npm", "run", "check:runtime-variation-simulation"],
    areas: [1, 4, 10],
    planned: true
  },
  {
    id: "media-runtime-resolution",
    label: "Built-app media runtime resolution",
    command: ["npm", "run", "check:media-runtime-resolution"],
    areas: [1, 3, 4, 10],
    planned: true
  },
  {
    id: "media-quality",
    label: "Active assessment image semantics and pixel-quality scan",
    command: ["npm", "run", "check:media-quality"],
    areas: [1, 3, 4, 10],
    planned: true
  },
  {
    id: "public-media-policy",
    label: "No known watermarked batch or forbidden public-media reference",
    command: ["npm", "run", "check:public-media-policy"],
    areas: [1, 3, 4, 8, 10]
  },
  {
    id: "assessment-media-sizes",
    label: "Assessment images and audio meet delivery-size and file-format limits",
    command: ["npm", "run", "check:assessment-media-sizes"],
    areas: [1, 3, 9, 10]
  },
  {
    id: "media-review-release",
    label: "Every published assessment, Guided Reading, and Story Quest media pairing has a human decision",
    command: ["npm", "run", "check:media-review-release"],
    areas: [1, 3, 4, 10]
  },
  {
    id: "sound-seekers-audio",
    label: "Every Sound Seekers teaching sound has release-approved audio",
    command: ["npm", "run", "check:quest-release"],
    areas: [1, 2, 3, 4, 10]
  },
  {
    id: "device-matrix",
    label: "Student device matrix",
    command: ["npm", "run", "check:device-matrix"],
    areas: [2, 3, 10]
  },
  {
    id: "sync-chaos",
    label: "Progress sync chaos suite",
    command: ["npm", "run", "check:sync-chaos"],
    areas: [4, 9, 10],
    planned: true
  }
]);

const CURRICULUM_DIMENSIONS = Object.freeze({
  correctness: ["assessment-question-integrity"],
  depth: [
    "strict-curriculum",
    "curriculum-release-standard",
    "assessment-skill-contracts"
  ],
  variation: [
    "assessment-runtime-variation",
    "assessment-skill-contracts",
    "skill-progression",
    "runtime-variation-simulation"
  ],
  media: [
    "strict-curriculum",
    "curriculum-release-standard",
    "media-runtime-resolution",
    "media-quality"
  ],
  runtimeSelectability: [
    "strict-curriculum",
    "curriculum-release-standard",
    "assessment-question-integrity",
    "assessment-skill-contracts",
    "runtime-variation-simulation"
  ]
});
const CURRICULUM_COMPOSED_GATE_ID = "curriculum-composed";
const CURRICULUM_DEPENDENCY_GATE_IDS = Object.freeze([
  ...new Set(Object.values(CURRICULUM_DIMENSIONS).flat())
]);

export function expandReleaseGateSelection(only) {
  if (!only) return null;
  const expanded = new Set(
    [...only].filter(id => id !== CURRICULUM_COMPOSED_GATE_ID)
  );
  if (only.has(CURRICULUM_COMPOSED_GATE_ID)) {
    for (const id of CURRICULUM_DEPENDENCY_GATE_IDS) expanded.add(id);
  }
  return expanded;
}

function isoFilePart(date = new Date()) {
  return date.toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function commandText(command) {
  return command.map(part => (
    /[\s"'`$]/.test(part) ? JSON.stringify(part) : part
  )).join(" ");
}

function readPackageScripts() {
  const packagePath = path.join(repoRoot, "package.json");
  return JSON.parse(fs.readFileSync(packagePath, "utf8")).scripts || {};
}

export function isGateImplemented(gate, scripts = readPackageScripts()) {
  if (gate.command[0] !== "npm" || gate.command[1] !== "run") return true;
  return Boolean(scripts[gate.command[2]]);
}

function collectRegexCounts(output) {
  const patterns = {
    tests: /(?:#\s*)?tests[:\s]+(\d+)/i,
    passed: /(?:#\s*)?pass(?:ed)?[:\s]+(\d+)|(\d+)\s+passed\b/i,
    failed: /(?:#\s*)?fail(?:ed|ures?)?[:\s]+(\d+)|(\d+)\s+failed\b/i,
    warnings: /warnings?[:\s]+(\d+)/i,
    productionReadySkills: /production-ready skills[:\s]+(\d+)/i,
    auditedSkills: /strict assessment skills audited[:\s]+(\d+)/i,
    missingImages: /true missing images[:\s]+(\d+)/i,
    missingAudio: /true missing audio[:\s]+(\d+)/i,
    mediaWiringFixes: /media wiring fixes[:\s]+(\d+)/i,
    newQuestionsNeeded: /new questions needed[:\s]+(\d+)/i
  };
  const counts = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matches = [...output.matchAll(new RegExp(pattern.source, flags))];
    const match = matches.at(-1);
    if (!match) continue;
    const value = match.slice(1).find(part => part !== undefined);
    counts[key] = Number(value);
  }
  return counts;
}

export function extractGateCounts(gate, output) {
  if (gate.outputFormat === "npm-audit-json") {
    try {
      const parsed = JSON.parse(output);
      return {
        ...(parsed.metadata?.vulnerabilities || {}),
        dependencies: parsed.metadata?.dependencies?.total ?? null
      };
    } catch {
      return { parseError: 1 };
    }
  }
  return collectRegexCounts(output);
}

function tail(value, maxCharacters = 4000) {
  if (value.length <= maxCharacters) return value;
  return value.slice(-maxCharacters);
}

async function runCommand(gate, logPath) {
  const startedAt = new Date();
  const startedMs = Date.now();
  let combinedOutput = "";

  const result = await new Promise(resolve => {
    const child = spawn(gate.command[0], gate.command.slice(1), {
      cwd: repoRoot,
      env: {
        ...process.env,
        CI: process.env.CI || "1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    const onData = chunk => {
      const value = chunk.toString();
      combinedOutput += value;
      process.stdout.write(value);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", error => {
      combinedOutput += `\nFailed to start command: ${error.message}\n`;
      resolve({ exitCode: 1, signal: null, spawnError: error.message });
    });
    child.on("close", (exitCode, signal) => {
      resolve({
        exitCode: Number.isInteger(exitCode) ? exitCode : 1,
        signal: signal || null,
        spawnError: null
      });
    });
  });

  fs.writeFileSync(logPath, combinedOutput);
  const counts = extractGateCounts(gate, combinedOutput);
  const warningFailure = gate.failOnPositiveCount
    && Number(counts[gate.failOnPositiveCount] || 0) > 0;
  const status = result.exitCode === 0 && !warningFailure ? "pass" : "fail";

  return {
    id: gate.id,
    label: gate.label,
    areas: gate.areas,
    command: commandText(gate.command),
    status,
    exitCode: result.exitCode,
    signal: result.signal,
    durationMs: Date.now() - startedMs,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    counts,
    logPath: path.relative(repoRoot, logPath).replaceAll(path.sep, "/"),
    outputTail: status === "fail" ? tail(combinedOutput) : "",
    reason: warningFailure
      ? `${gate.failOnPositiveCount} must be zero`
      : result.spawnError
  };
}

function statusForDependencies(dependencies, resultsById) {
  const statuses = dependencies.map(id => resultsById.get(id)?.status || "not-run");
  if (statuses.every(status => status === "pass")) return "pass";
  if (statuses.some(status => status === "fail" || status === "not-implemented")) return "fail";
  return "not-run";
}

function readAssessmentGate() {
  try {
    return JSON.parse(fs.readFileSync(assessmentGateJsonPath, "utf8"));
  } catch {
    return null;
  }
}

export function composeCurriculumResult(results, assessmentGate = readAssessmentGate()) {
  const resultsById = new Map(results.map(result => [result.id, result]));
  const dimensions = Object.fromEntries(
    Object.entries(CURRICULUM_DIMENSIONS).map(([dimension, dependencies]) => [
      dimension,
      {
        status: statusForDependencies(dependencies, resultsById),
        dependencies
      }
    ])
  );

  const globalDimensionsPass = Object.values(dimensions).every(item => item.status === "pass");
  const skills = (assessmentGate?.results || []).map(skill => {
    const v3Pass = skill.ready === true
      && Object.values(skill.gates || {}).every(Boolean);
    const skillDimensions = {
      correctness: v3Pass ? dimensions.correctness.status : "fail",
      depth: v3Pass ? dimensions.depth.status : "fail",
      variation: v3Pass ? dimensions.variation.status : "fail",
      media: v3Pass ? dimensions.media.status : "fail",
      runtimeSelectability: v3Pass ? dimensions.runtimeSelectability.status : "fail"
    };
    return {
      skillId: skill.skillId,
      dimensions: skillDimensions,
      releaseReady: Object.values(skillDimensions).every(status => status === "pass")
    };
  });

  const releaseReadySkills = skills.filter(skill => skill.releaseReady).length;
  const status = globalDimensionsPass
    && skills.length > 0
    && releaseReadySkills === skills.length
    ? "pass"
    : "fail";

  return {
    id: "curriculum-composed",
    label: "Composed curriculum release gate",
    areas: [1, 4, 10],
    command: "synthetic: correctness ∧ depth ∧ variation ∧ media ∧ runtime-selectability",
    status,
    exitCode: status === "pass" ? 0 : 1,
    durationMs: 0,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    counts: {
      skillsAudited: skills.length,
      releaseReadySkills
    },
    dimensions,
    skills,
    reason: status === "pass"
      ? null
      : "Every curriculum dimension must pass for every audited skill."
  };
}

function parseArguments(argv) {
  const args = [...argv];
  const onlyIndex = args.indexOf("--only");
  const only = onlyIndex >= 0
    ? new Set(String(args[onlyIndex + 1] || "").split(",").map(value => value.trim()).filter(Boolean))
    : null;
  return {
    list: args.includes("--list"),
    preflight: args.includes("--preflight"),
    only
  };
}

function validUrl(value, protocols) {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function validateAuditEnvironment(environment = process.env) {
  const missing = REQUIRED_AUDIT_ENVIRONMENT.filter(name => !String(environment[name] || "").trim());
  const invalid = [];

  if (!missing.includes("LP_AUDIT_SUPABASE_URL")
    && !validUrl(environment.LP_AUDIT_SUPABASE_URL, ["http:", "https:"])) {
    invalid.push("LP_AUDIT_SUPABASE_URL must be an http(s) URL");
  }
  if (!missing.includes("VITE_SUPABASE_URL")
    && !validUrl(environment.VITE_SUPABASE_URL, ["http:", "https:"])) {
    invalid.push("VITE_SUPABASE_URL must be an http(s) URL");
  }
  if (!missing.includes("LP_AUDIT_DATABASE_URL")
    && !validUrl(environment.LP_AUDIT_DATABASE_URL, ["postgres:", "postgresql:"])) {
    invalid.push("LP_AUDIT_DATABASE_URL must be a PostgreSQL URL");
  }
  if (!missing.includes("LP_AUDIT_TEACHER_PASSWORD")
    && String(environment.LP_AUDIT_TEACHER_PASSWORD).length < 12) {
    invalid.push("LP_AUDIT_TEACHER_PASSWORD must contain at least 12 characters");
  }
  if (!missing.includes("VITE_SUPABASE_URL")
    && !missing.includes("LP_AUDIT_SUPABASE_URL")
    && environment.VITE_SUPABASE_URL !== environment.LP_AUDIT_SUPABASE_URL) {
    invalid.push("VITE_SUPABASE_URL must match LP_AUDIT_SUPABASE_URL");
  }
  if (!missing.includes("VITE_SUPABASE_ANON_KEY")
    && !missing.includes("LP_AUDIT_SUPABASE_ANON_KEY")
    && environment.VITE_SUPABASE_ANON_KEY !== environment.LP_AUDIT_SUPABASE_ANON_KEY) {
    invalid.push("VITE_SUPABASE_ANON_KEY must match LP_AUDIT_SUPABASE_ANON_KEY");
  }

  const details = [
    missing.length ? `missing ${missing.join(", ")}` : "",
    invalid.length ? `invalid ${invalid.join("; ")}` : ""
  ].filter(Boolean);

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    message: details.length
      ? `Release environment preflight failed: ${details.join("; ")}. Inject credentials through the process environment or CI secret store; values were not read from or written to plaintext files.`
      : "Release environment preflight passed: all audit credentials are injected and structurally valid."
  };
}

async function readGitMetadata() {
  const run = command => new Promise(resolve => {
    const child = spawn("git", command, {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"]
    });
    let output = "";
    child.stdout.on("data", chunk => {
      output += chunk.toString();
    });
    child.on("close", code => resolve(code === 0 ? output.trim() : "unknown"));
    child.on("error", () => resolve("unknown"));
  });
  return {
    commitSha: await run(["rev-parse", "HEAD"]),
    branch: await run(["branch", "--show-current"])
  };
}

export async function runReleaseGate(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const scripts = readPackageScripts();

  if (options.list) {
    for (const gate of RELEASE_GATES) {
      const implemented = isGateImplemented(gate, scripts);
      console.log(`${gate.id}\t${implemented ? "implemented" : "not-implemented"}\t${commandText(gate.command)}`);
    }
    console.log("curriculum-composed\tsynthetic\tfive required dimensions");
    return 0;
  }

  if (options.preflight) {
    const preflight = validateAuditEnvironment();
    console[preflight.ok ? "log" : "error"](preflight.message);
    return preflight.ok ? 0 : 2;
  }

  const unknownOnly = options.only
    ? [...options.only].filter(id => (
      id !== CURRICULUM_COMPOSED_GATE_ID
      && !RELEASE_GATES.some(gate => gate.id === id)
    ))
    : [];
  if (unknownOnly.length) {
    console.error(`Unknown release gate(s): ${unknownOnly.join(", ")}`);
    return 2;
  }

  const expandedOnly = expandReleaseGateSelection(options.only);
  const selectedGates = expandedOnly
    ? RELEASE_GATES.filter(gate => expandedOnly.has(gate.id))
    : RELEASE_GATES;
  const fullRun = !options.only;
  const composedCurriculumRequested = Boolean(
    options.only?.has(CURRICULUM_COMPOSED_GATE_ID)
  );
  if (fullRun) {
    const preflight = validateAuditEnvironment();
    if (!preflight.ok) {
      console.error(preflight.message);
      return 2;
    }
    console.log(preflight.message);
  }
  const runStartedAt = new Date();
  const artifactDir = path.join(releaseArtifactRoot, isoFilePart(runStartedAt));
  fs.mkdirSync(artifactDir, { recursive: true });
  const git = await readGitMetadata();
  const results = [];

  for (const gate of selectedGates) {
    const implemented = isGateImplemented(gate, scripts);
    console.log(`\n=== ${gate.id}: ${gate.label} ===`);
    if (!implemented) {
      const now = new Date().toISOString();
      const result = {
        id: gate.id,
        label: gate.label,
        areas: gate.areas,
        command: commandText(gate.command),
        status: "not-implemented",
        exitCode: 1,
        durationMs: 0,
        startedAt: now,
        finishedAt: now,
        counts: {},
        logPath: null,
        reason: `Missing package script: ${gate.command[2]}`
      };
      results.push(result);
      console.error(result.reason);
      continue;
    }
    results.push(await runCommand(gate, path.join(artifactDir, `${gate.id}.log`)));
  }

  if (fullRun || composedCurriculumRequested) {
    results.push(composeCurriculumResult(results));
  }

  const summary = {
    total: results.length,
    passed: results.filter(result => result.status === "pass").length,
    failed: results.filter(result => result.status === "fail").length,
    notImplemented: results.filter(result => result.status === "not-implemented").length,
    notRun: results.filter(result => result.status === "not-run").length
  };
  const manifest = {
    schemaVersion: 1,
    partial: !fullRun,
    generatedAt: new Date().toISOString(),
    startedAt: runStartedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    commitSha: git.commitSha,
    branch: git.branch,
    summary,
    gates: results
  };
  const manifestPath = fullRun
    ? canonicalManifestPath
    : path.join(artifactDir, "manifest.partial.json");
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nRelease manifest: ${path.relative(repoRoot, manifestPath)}`);
  console.log(`Passed ${summary.passed}/${summary.total}; failed ${summary.failed}; not implemented ${summary.notImplemented}.`);
  return summary.failed === 0 && summary.notImplemented === 0 ? 0 : 1;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  process.exitCode = await runReleaseGate();
}
