# Legal deployment facts and open decisions

> **Status:** EXTERNAL-READY DRAFT — OWNER CONFIRMATION AND QUALIFIED LEGAL REVIEW REQUIRED
> **Reviewed against repository:** 2026-08-08
> **Purpose:** prevent contracts and notices from inventing deployment facts

## Confirmed product facts

| Fact | Current evidence |
|---|---|
| Product | LiteracyPath, an early-literacy and phonics web application, school-managed on its only data-collecting route |
| Routes into the product | Exactly two: the school-authorised service, and an anonymous try-out that creates no account. No route exists on which an adult outside a school can create a learner whose work is kept |
| Anonymous try-out | Assigns a random nickname from a fixed word list with no name input anywhere; replaces the application's browser storage with an in-memory object for the session and refuses to start if that swap fails; refuses every database and authentication call at the single boundary all of them pass through; excludes progress, reporting, export, leaderboards, and assessments. Both boundaries are covered by tests that fail if either is removed |
| Third-party runtime recipients | None. The content security policy permits connections only to the application's own origin and Supabase; no analytics, advertising, tracking, or font service is present in the application |
| Intended learner age | Approximately 4–7 |
| Current operator/contact | Benjamin Bowler; `benjamesbowler@gmail.com`, as published in the current privacy draft |
| Teacher data | Email, display name, school name, account/approval state, classes, settings, and service activity |
| Learner data | Teacher-entered first/display name, class membership, picture-code credential material, accessibility settings, progress, answers, mastery, engagement, assessment evidence, reports, interventions, and game/reward state |
| Deliberately excluded from learner profile | Learner email, home address, phone, precise geolocation, and learner-uploaded photo |
| Primary purposes | Authentication, classroom administration, learning delivery, adaptation, progress/evidence storage, reports, safeguarding of access, support, and service reliability |
| Advertising and sale | No advertising; no sale, rental, or trading of personal data |
| Production backend | Supabase authentication, PostgreSQL/database functions, and first-party error monitoring |
| Production hosting | Vercel web hosting and content delivery |
| Browser storage | Local storage/cache supports offline or fallback progress, settings, reports, queues, and recovery |
| Production AI | No learner-facing AI processing is wired into the deployed browser runtime |
| Authoring-only AI/import tools | Repository tools may use OpenAI, BytePlus, Wikimedia Commons, and dictionary services with non-personal content |
| Fonts | Self-hosted from the application bundle. Google Fonts was removed on 2026-08-07 and the content security policy no longer permits its domains |
| Security evidence | RLS migrations, scoped database functions, CSP, throttling, privacy-minimal logs, error redaction, immutable evidence, release gates, and a recovery runbook exist; several live/external exercises remain open |

## Owner-required facts before contract or public launch

No contract should guess these values. The owner must enter verified answers,
attach evidence, and date the decision before counsel approves final documents.

| Decision | Required evidence | Current state |
|---|---|---|
| Contracting legal name and legal form | Registration or identity record | Unconfirmed |
| Registered/business address | Authoritative address | Unconfirmed |
| Country of establishment | Registration/tax record | Unconfirmed |
| Privacy and legal notice address | Monitored mailbox and response owner | Current personal email exists; production route unconfirmed |
| Security incident contact | Monitored urgent channel and escalation owner | Unconfirmed |
| Accessibility feedback contact | Monitored accessible channel and response owner | Unconfirmed |
| Governing law, venue, and dispute path | Counsel-approved terms | Unconfirmed |
| Minimum customer age and authorised buyer | Commercial/legal decision | Unconfirmed |
| Supabase project organisation, plan, primary region, replicas, backups, support access, DPA, and transfer terms | Provider dashboard and executed provider terms | Unconfirmed |
| Vercel team, plan, deployment regions, logs, analytics settings, DPA, and transfer terms | Provider dashboard and executed provider terms | Unconfirmed |
| Google Fonts disposition | Remove/self-host, or approve and disclose provider/transfer position | **Resolved 2026-08-07.** Self-hosted via Fontsource; verified by loading the built application and observing zero requests to fonts.googleapis.com or fonts.gstatic.com, with the content security policy tightened so a reintroduction fails loudly. Counsel still confirms the removal at review |
| Legal position of the anonymous try-out | Counsel finding per target region on whether a collection-free child-facing route creates notice, consent, or authorisation duties | Not completed |
| Status of host platform request logs for anonymous visitors | Counsel finding on whether provider-side request metadata is personal data in the operator's hands where no joinable identifier is held | Not assessed |
| Provider log retention and region for anonymous traffic | Vercel plan settings and executed provider terms | Unconfirmed |
| Abuse, rate-limiting, and availability protection without a persistent identifier | Product design plus counsel review of any identifier introduced for that purpose | Unconfirmed |
| Direct family route: lawful basis and verifiable parental consent mechanism | Counsel decision per target region before the route is built | Not completed |
| Direct family route: adult-versus-child registration assurance, direct notice with no school in between, and rights/deletion routing | Product design and counsel approval before the route is built | Not completed |
| Direct family route: whether the operator becomes a controller rather than a processor for those records | Counsel role analysis | Not assessed |
| School-configurable retention schedule | Product policy and operational job evidence | Implemented with preview, exact confirmation, immutable run records, and tests; school/counsel-approved values remain unconfirmed |
| Default inactive-account and end-of-year deletion periods | Counsel/customer decision and operational evidence | Unconfirmed |
| Backup deletion/expiry and deletion propagation | Provider settings and tested procedure | Product tracks target dates and requires an evidence reference before verification; provider settings and live evidence remain unconfirmed |
| Data export, correction, restriction, objection, and deletion service levels | Operational owner and exercised workflow | Tracked access export and verified deletion are implemented with a 30-day operational target; hydrated release exercise and final contractual/legal target remain unconfirmed |
| Breach-notification contractual target | Counsel and incident-owner approval | Proposed target in DPA; unconfirmed |
| UK representative, EU representative, and DPO need | Role/establishment/monitoring assessment by counsel | Not assessed |
| UK/EU lawful bases and role allocation | School/controller instructions and counsel review | Per-deployment decision |
| UK/EU international transfer mechanism and transfer risk assessment | Provider chain, destination map, IDTA/Addendum/SCC decision | Not completed |
| COPPA school-authorisation method and direct-notice delivery | Verified school contracting workflow | Not completed |
| FERPA exception and annual-notice fit | Each school/LEA decision | School decision required |
| PPRA and US state student-privacy addenda | Target-state inventory and counsel review | Not completed |
| DPIA/children’s best-interests assessment | Controller-led assessment with provider assistance | Not completed |
| Independent accessibility conformance audit | Dated report with scope and exceptions | Not completed |
| Independent penetration/privacy review | Dated report and remediation record | Not completed |
| Insurance, uptime/SLA, fees, taxes, refunds, and liability cap | Commercial and counsel decision | Unconfirmed |

## Change control

The product owner owns this register. Security, privacy, accessibility, and
commercial owners must update their facts before a release that changes them.
Counsel should initial each resolved legal fact in the review checklist. A code
commit or automated gate cannot change an item from unconfirmed to approved.
