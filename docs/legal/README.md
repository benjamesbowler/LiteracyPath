# LiteracyPath legal and procurement pack

> **Pack status:** EXTERNAL-READY DRAFT — QUALIFIED LEGAL REVIEW REQUIRED
> **Pack version:** 2026-08-08
> **Product scope:** the school-managed LiteracyPath web application, and the anonymous try-out that collects nothing
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

The deployed application is an early-literacy service for young learners, and it
is reached by two routes that a reviewer must keep apart.

The **school-authorised service** is the product this pack mostly describes: an
adult creates and manages learner access, progress is stored, and reports are
produced. The **anonymous try-out** is open to anyone from the front page, uses
a sample of the content, and is built to collect nothing — no account, nothing
written to the device, nothing sent to the database. Because every regime in
`REGION_MATRIX.md` is triggered by collecting or using personal information,
almost none of them are reached on that route; that is a finding counsel should
make explicitly rather than one to be inferred. Section H of
`SCHOOL_PARENT_CONSENT_MATERIALS.md` states the design and the open questions.

A **direct family route**, in which an adult outside a school could keep a
child's work, is planned and not built. Nothing in the deployed application
implements it, and the privacy policy says so in terms.

Vercel serves the web application. Supabase provides authentication, database
storage, database functions, and first-party operational error records. The
deployed browser is not configured to send learner prompts, answers, or profiles
to an AI model.

Repository tools can call OpenAI, BytePlus, Wikimedia Commons, or dictionary
services to create or import product media during authoring. Those tools are
outside the hosted learner runtime and must never be given school or learner
personal data. If any such tool is later exposed in production, the processing
inventory, privacy policy, DPIA, DPA, and subprocessor list must be reviewed
before release.

Printable and exported documents previously requested Google Fonts when opened
in a connected browser, which disclosed ordinary network metadata such as an IP
address and user agent to Google. The fonts are now self-hosted from the
application's own origin and the content security policy no longer permits the
request, so this is recorded in `SUBPROCESSORS.md` as resolved with the
verification method rather than as an open decision.

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
   the current release issue.

## Maintenance

Review the pack at least annually and before any material change to data
categories, purposes, child access, analytics, advertising, AI processing,
providers, hosting regions, international transfers, retention, or rights
handling. Product, security, and legal owners must all approve a material
change before the public documents are updated.
