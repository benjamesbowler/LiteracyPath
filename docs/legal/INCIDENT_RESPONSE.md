# LiteracyPath privacy and security incident response

> **Status:** EXTERNAL-READY OPERATIONAL DRAFT — EXERCISE AND COUNSEL REVIEW REQUIRED
> **Version:** 2026-07-24
> **Scope:** confidentiality, integrity, availability, child-safety, and personal-data events

## Objectives

Protect children and schools, stop ongoing harm, preserve reliable evidence,
restore safely, meet contractual and legal duties, communicate accurately, and
prevent recurrence. Speed does not justify exposing more personal data.

## Roles

Before launch, the owner must name a primary and backup for:

- incident commander;
- security/technical lead;
- privacy and legal lead;
- operations/recovery lead;
- school/customer communications lead; and
- evidence recorder.

Names, secure contacts, authority, provider escalation paths, insurer contacts,
and regulator decision routes belong in a restricted on-call record, not this
public repository. If one person holds several roles, the record must state who
provides independent legal and communications review.

## Severity

| Severity | Example | Response |
|---|---|---|
| SEV-1 critical | Confirmed broad learner-data access, active credential compromise, destructive tenant breach, or material child-safety risk | Immediate page; incident command; contain; legal/customer assessment; executive ownership |
| SEV-2 high | Confirmed limited unauthorised access, material security-control failure, or outage risking data integrity | Urgent response; contain and investigate; notification assessment |
| SEV-3 moderate | Suspicious activity, failed control without confirmed access, or bounded availability/integrity issue | Triage promptly; preserve evidence; monitor and remediate |
| SEV-4 low | Benign event, blocked probe, minor defect, or policy question | Record, route, and address through normal work |

Severity can increase as evidence changes. Lack of complete evidence must not be
treated as proof that no incident occurred.

## Response lifecycle

### 1. Receive and stabilise

- create a restricted incident record with UTC times and reporter;
- acknowledge through a safe channel;
- prevent child data, credentials, raw URLs, or class codes entering ordinary
  tickets or chat;
- preserve relevant logs and release/configuration identity; and
- assign command and severity.

### 2. Triage and scope

Determine affected schools, people, systems, data categories, time window,
access method, ongoing risk, provider involvement, integrity/availability
effects, and whether the event is a personal data breach. Separate confirmed
facts, reasonable hypotheses, unknowns, and decisions.

### 3. Contain

Use the least destructive effective action: revoke sessions/keys, expire class
codes, disable a route or function, block a malicious source, isolate a
deployment, pause processing, or restrict support access. Record who approved
each action and preserve evidence before alteration where safe.

### 4. Eradicate and recover

Remove the cause, patch and test, rotate affected secrets, validate tenant
boundaries and evidence integrity, restore only to an isolated target when
recovery is required, replay deletion markers, and obtain incident-command
approval before returning service.

### 5. Assess notification

Privacy/legal lead determines applicable controller/processor roles, affected
jurisdictions, contractual clocks, risk to people, school/customer notice,
regulator notice, parent/learner notice, law-enforcement interaction, and
provider duties. LiteracyPath does not wait for perfect information if a
required initial notice can be accurate and updated in phases.

The DPA proposes initial Customer notice within 24 hours of confirming an
incident affecting Customer Data, subject to counsel approval. Statutory
deadlines are assessed separately; this document does not redefine them.

### 6. Communicate

Approved notices state what happened and when, affected data and people, likely
effects, containment, actions recipients should take, current unknowns, contact,
and next update. Do not speculate, blame, minimise, or expose another customer.
Use age-appropriate and accessible language for families and learners.

### 7. Close and learn

Closure requires containment, validated recovery, notification decisions,
Customer follow-up, preserved evidence, owner-approved residual risk, and tracked
corrective actions. Hold a blameless review promptly for SEV-1/2 and recurring
SEV-3 events. Record root causes, control failures, detection gaps, timeline,
impact, response quality, actions, owners, deadlines, and retest evidence.

## Evidence handling

Restrict incident records by need to know. Prefer opaque IDs and redacted
exports. Do not paste database URLs, tokens, picture credentials, learner names,
answers, or full production records into source control. Preserve authenticity,
source, collector, UTC time, hashes where appropriate, access history, and legal
hold instructions.

## Provider incidents

Open the provider’s urgent case, preserve its case ID and notices, identify
affected services/regions/data, request containment and timeline evidence, and
apply the same notification assessment. A provider’s statement does not replace
LiteracyPath’s or the school’s independent role assessment.

## Exercises and maintenance

- quarterly contact and provider-escalation check;
- six-month tabletop covering a learner-data disclosure and a school outage;
- annual isolated restore drill;
- annual notification and family-copy exercise with counsel;
- post-change exercise for major auth, tenancy, provider, or recovery changes.

An exercise record must include scenario, participants, timestamps, decisions,
observed gaps, actions, owners, deadlines, and retest. A written process without
an exercised response is not sufficient evidence of operational readiness.
