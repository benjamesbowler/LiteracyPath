# LiteracyPath security summary

> **Status:** EXTERNAL-READY IMPLEMENTATION SUMMARY — NOT A CERTIFICATION
> **Version:** 2026-07-24
> **Audience:** school security/privacy reviewers and qualified external assessors

This summary describes controls present in the repository. It is not a
penetration-test report, SOC report, guarantee, or independent assurance
opinion. Live database tests, provider configuration, operational exercises, and
external review remain necessary where recorded below.

## Architecture and data flow

Vercel serves the browser application and static media. The browser connects
over TLS to the configured Supabase project for authentication and data
operations. Supabase PostgreSQL row-level policies and scoped database functions
enforce ownership. Selected offline/fallback data is kept in browser storage and
must be protected by the school-managed device controls.

The hosted learner application does not send learner data to an AI model.
Authoring-only generation tools run separately and are prohibited from receiving
Customer Data.

## Current controls

### Identity and access

- Teacher access uses Supabase authentication and a separate application
  approval state.
- Admin functions use database-backed admin membership rather than a hardcoded
  email.
- Teacher-owned classes and learners are protected by row-level security and
  scoped security-definer functions.
- Learner entry uses a class code, picture credential, expiring scoped token,
  throttling, and generic failures.
- Class codes can expire or be regenerated; anomaly events are privacy-minimal.
- Leaderboards derive scope on the server and return deterministic pseudonyms
  rather than learner, class, or school identifiers.

### Application and browser security

- Deployment headers enforce HTTPS persistence, content-type protection, frame
  denial, referrer controls, permissions restrictions, opener/resource policy,
  and an enforced Content Security Policy.
- The CSP denies objects, frames, arbitrary scripts, and unapproved network
  connections; hostile browser probes are part of the gate.
- Production configuration fails visibly when the backend is missing rather
  than claiming a successful save.
- Sensitive mutations and tenant access are enforced in the database, not only
  hidden in the interface.

### Data protection and privacy engineering

- The product minimises learner profile fields and does not include ads or
  behavioural trackers.
- Formal assessment evidence is versioned, replayable, and immutable after
  completion.
- Operational errors use bounded schemas, release identity, sampling,
  fingerprinting, flood control, 30-day server expiry, and a redacted local
  fallback. Names, answers, arbitrary messages, full URLs, tokens, and account,
  school, class, or learner IDs are excluded.
- Access-security events use one-way fingerprints and generic event types
  rather than raw class codes, passwords, device IDs, network addresses, or
  child names.
- Export provenance identifies evidence versions, filters, definitions, and
  privacy classification.

### Development and release

- Zero-warning lint, 1,224 unit tests at this pack version, production build,
  content integrity, security checks, browser journeys, bundle budgets, and
  database checks are coordinated by the release gate.
- Managed migrations reconstruct the core schema; deterministic audit fixtures
  exercise ownership and reporting paths.
- Generated release manifests bind evidence to an exact implementation commit.
- Source-control review must preserve unrelated user changes and must not use
  generated evidence as a substitute for a passing gate.

### Availability and recovery

- The recovery runbook sets a 24-hour recovery point objective and four-hour
  recovery time objective.
- The restore drill refuses a same-database target and requires a separately
  named isolated target plus explicit confirmation.
- It compares exact row counts and content fingerprints for classes, learners,
  answers, mastery, item mastery, assessment attempts, and saved EL reports.
- Restored service must replay data-rights deletion markers before serving.

## Known boundaries and open evidence

| Area | Current boundary |
|---|---|
| Independent assessment | No independent penetration test, privacy audit, or security certification is recorded |
| Live database coverage | Several hydrated authenticated/RLS journeys require configured audit credentials |
| Recovery | Procedure and tests exist; a real isolated restore artifact is outstanding |
| Provider controls | Supabase/Vercel plan, regions, backups, logs, support access, assurance, and transfer evidence are unconfirmed |
| Dependency review | A vulnerable archive chain was removed; the external registry-backed audit could not run under the current security policy |
| Data rights/retention | Full rights workflow and configurable retention/deletion jobs are A8.8/A8.9 work and are not complete |
| Device storage | Local browser data depends on school/device access, account separation, patching, encryption, and disposal controls |
| Source maps/operations | Production symbolication, service-level/error-budget targets, and alert exercise remain open |
| Accessibility | Automated and route/device checks exist; independent manual assistive-technology review remains open |

## School deployment responsibilities

Schools should approve the service institutionally, manage staff accounts and
devices, limit roster data, protect class and picture codes, remove departed
staff/learners, verify exports, report incidents promptly, choose retention, and
complete their own risk/DPIA/FERPA/state-law review. These responsibilities do
not transfer LiteracyPath’s obligations to the school.

## Vulnerability and incident reporting

Use the verified production security contact once it is recorded in
`LEGAL_DEPLOYMENT_FACTS.md`. Until then, the published draft contact is
`benjamesbowler@gmail.com`. Reports should avoid including real child data,
credentials, class codes, or exploit details in unencrypted email. The operator
must provide a secure follow-up channel for sensitive evidence.

## Review cadence

Review this summary quarterly, after a material architecture/provider change,
and after a significant incident or external finding. Date and link evidence;
do not convert planned or locally tested controls into claims about an
unverified production environment.
