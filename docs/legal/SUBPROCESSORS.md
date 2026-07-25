# LiteracyPath provider and subprocessor register

> **Status:** EXTERNAL-READY DRAFT — DEPLOYMENT FACTS AND QUALIFIED LEGAL REVIEW REQUIRED
> **Version:** 2026-07-24
> **Scope:** providers that can receive production user or Customer Data

This register distinguishes the hosted runtime from authoring tools. Regions,
provider entities, contracts, retention, and transfer mechanisms must be
verified in provider dashboards and agreements before processing school data.

## Production provider register

| Provider/service | Role and purpose | Data classes | Location/remote access | Retention/deletion | Transfer position | Current decision |
|---|---|---|---|---|---|---|
| Supabase | Subprocessor for teacher authentication, PostgreSQL data, database functions, storage of first-party operational errors, backups, and platform support | Teacher/admin account data; learner roster, credential material, settings, learning activity, evidence, reports, interventions, reward state; privacy-minimal security/error events | Project region, replicas, backups, logs, and support access are deployment-specific and unconfirmed | Active records follow Customer/operator policy; provider backup/log periods and deletion propagation are unconfirmed | Provider DPA, contracting entity, destination chain, and any SCC/UK mechanism must be verified | Required for current hosted service; contract and region evidence outstanding |
| Vercel | Subprocessor/service provider for web hosting, TLS, content delivery, deployment, and platform logs | Static application/media; ordinary request metadata such as IP, user agent, URL, time, and security/log data; application Customer Data is intended to travel directly between browser and Supabase | Deployment/CDN/log/support locations are plan- and configuration-specific and unconfirmed | Cache, deployment, request-log, and account deletion periods are unconfirmed | Provider DPA, contracting entity, destination chain, and any SCC/UK mechanism must be verified | Required for current hosted service; analytics/log settings and region evidence outstanding |
| Google Fonts | External network recipient for fonts requested by some printable/exported HTML documents; not required for core data storage | Ordinary request metadata, potentially including IP address, user agent, referring context, time, and requested font | Google infrastructure; destination and support access not mapped | Controlled by provider; not verified by LiteracyPath | No school DPA or transfer assessment is recorded | Unresolved: self-host/remove before launch, or obtain counsel approval and disclose the residual request |

## Not production subprocessors

The following services appear only in local content-authoring/import tools or as
source attribution. They are not authorised to receive teacher, learner, school,
support, or Customer personal data:

| Service | Repository use | Production restriction |
|---|---|---|
| OpenAI | Local generation of questions, images, audio, or visual assets | No production learner runtime; never submit Customer Data |
| BytePlus/ARK image APIs | Local generation of visual assets | No production learner runtime; never submit Customer Data |
| Wikimedia Commons | Local import/source attribution for public word audio | No Customer Data in import queries |
| Dictionary API | Local discovery/import of public pronunciation audio | No Customer Data in import queries |
| Google Drive links | Teacher-facing source/resource links in authored content | Do not place Customer Data in URLs or shared documents |
| GitHub, Poly Pizza, and asset repositories | Source/licence attribution for shipped assets | No Customer Data |

If a local tool becomes remotely accessible, processes a school prompt, or is
used with personal data, it must move into the production register and undergo
privacy, security, contract, transfer, retention, and child-safety review before
release.

## Change-notice and objection process

The final DPA must set the notice period and channel. The operational process is:

1. product owner records the proposed provider, purpose, data, locations,
   retention, security evidence, terms, and transfer chain;
2. security and privacy owners complete risk and child-impact review;
3. counsel approves the role, DPA, transfer mechanism, and notice;
4. affected Customers receive advance notice and a meaningful opportunity to
   object on data-protection grounds;
5. objections are assessed for mitigation, an alternative, or termination of
   the affected service under the executed agreement; and
6. the provider is enabled only after approval and the public register update.

Emergency replacement for service security must still be documented and
notified as soon as contractually and legally permitted.

## Provider-review evidence required before launch

For each production provider retain:

- verified legal entity and service;
- executed terms and data-processing terms;
- project/account owner and plan;
- primary and failover regions;
- remote-support and onward-provider locations;
- encryption and access-control evidence;
- breach-notice commitment;
- active, log, cache, and backup retention;
- deletion and account-closure process;
- international transfer mechanism and assessment where required;
- current assurance reports or equivalent review; and
- owner, review date, and next review date.

This register is not a claim that unresolved provider terms satisfy a particular
law. Review it at least annually and before any provider or configuration change.
