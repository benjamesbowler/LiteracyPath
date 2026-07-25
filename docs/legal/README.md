# LiteracyPath legal and procurement pack

> **Pack status:** EXTERNAL-READY DRAFT — QUALIFIED LEGAL REVIEW REQUIRED
> **Pack version:** 2026-07-24
> **Product scope:** the school-managed LiteracyPath web application
> **Approval status:** not legally approved, not executed, and not a certification of compliance

This directory is the single review pack for counsel, school privacy teams,
security reviewers, and accessibility reviewers. It describes the product as it
exists in the repository and separates verified implementation facts from legal
decisions that only the operator, a school, or qualified counsel can make.

## Pack contents

| Document | Purpose | Status |
|---|---|---|
| `PRIVACY_POLICY.md` | Current public-policy source and data-practice summary | Existing draft; counsel review required |
| `TERMS_OF_SERVICE_DRAFT.md` | School and teacher service terms | Draft for counsel |
| `DATA_PROCESSING_ADDENDUM_DRAFT.md` | Controller/processor terms and processing schedule | Draft for counsel |
| `SUBPROCESSORS.md` | Providers, purposes, data classes, locations, transfers, and change process | Deployment facts outstanding |
| `SECURITY_SUMMARY.md` | Technical and organisational controls, limitations, and evidence | Implementation summary; not a certification |
| `ACCESSIBILITY_STATEMENT_DRAFT.md` | Accessibility target, known limits, feedback, and review cadence | Draft; independent audit outstanding |
| `INCIDENT_RESPONSE.md` | Operational detection, containment, notification, recovery, and review process | Operational draft; exercise required |
| `SCHOOL_PARENT_CONSENT_MATERIALS.md` | School authorisation, direct notice, parent notice/consent, assent, and rights request templates | Draft for local adaptation |
| `REGION_MATRIX.md` | COPPA, FERPA/PPRA, UK GDPR, EU GDPR, and deployment gates | Counsel decision matrix |
| `LEGAL_DEPLOYMENT_FACTS.md` | Confirmed facts and unresolved launch decisions | Owner action register |
| `COUNSEL_REVIEW_CHECKLIST.md` | Clause-by-clause external review and sign-off record | Unexecuted |
| `LEADERBOARD_PRIVACY.md` | Child-facing leaderboard privacy design and evidence boundary | External privacy review outstanding |

## Product boundary used by this pack

The deployed application is a teacher-managed early-literacy service for young
learners. Vercel serves the web application. Supabase provides authentication,
database storage, database functions, and first-party operational error records.
The deployed browser is not configured to send learner prompts, answers, or
profiles to an AI model.

Repository tools can call OpenAI, BytePlus, Wikimedia Commons, or dictionary
services to create or import product media during authoring. Those tools are
outside the hosted learner runtime and must never be given school or learner
personal data. If any such tool is later exposed in production, the processing
inventory, privacy policy, DPIA, DPA, and subprocessor list must be reviewed
before release.

Some printable/exported documents currently request Google Fonts when opened in
a connected browser. That can disclose ordinary network metadata such as an IP
address and user agent to Google. This is recorded as a deployment decision in
`SUBPROCESSORS.md`; it is not hidden or treated as resolved.

## Review and release rule

Automated verification proves that the complete pack is present, consistently
marked as draft, and covers the required subjects. It does not decide governing
law, establish a lawful basis, execute a DPA, approve international transfers,
replace a DPIA, or certify COPPA, FERPA, GDPR, accessibility, or security
compliance.

Before a paid, public, or school-scale launch, the owner must:

1. resolve every owner-required fact in `LEGAL_DEPLOYMENT_FACTS.md`;
2. obtain qualified legal review for each target region;
3. execute the approved commercial terms and DPA with each school or authority;
4. verify provider contracts, regions, transfer mechanisms, and retention;
5. publish only counsel-approved public text;
6. complete the independent accessibility and live security reviews; and
7. record dated approval evidence in `COUNSEL_REVIEW_CHECKLIST.md` and
   `docs/release/EXTERNAL.md`.

## Maintenance

Review the pack at least annually and before any material change to data
categories, purposes, child access, analytics, advertising, AI processing,
providers, hosting regions, international transfers, retention, or rights
handling. Product, security, and legal owners must all approve a material
change before the public documents are updated.
