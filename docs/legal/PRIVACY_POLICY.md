# LiteracyPath privacy policy (source)

> **Status:** EXTERNAL-READY DRAFT — QUALIFIED LEGAL REVIEW REQUIRED
> **Last reviewed against the product:** 24 July 2026
> **Live page:** `public/privacy.html`; keep the source and page in sync
> **Approval boundary:** this draft describes current practice but is not legal advice or a compliance certification

**Current operator/contact:** Benjamin Bowler — `benjamesbowler@gmail.com`.
The final legal identity, address, dedicated contacts, provider regions, transfer
terms, and retention schedule remain open in `LEGAL_DEPLOYMENT_FACTS.md`.

LiteracyPath is a teacher-managed early-literacy and phonics service for learners
roughly aged 4–7. A school or authorised adult creates and manages learner
access. We do not knowingly offer independent child sign-up or collect
information from children outside the school-managed context.

## Information we collect

- **Teacher and administrator account:** email, display name, school, approval
  and role information, classes, configuration, settings, and account activity.
- **Learner roster and access:** first or chosen display name, class membership,
  and picture-code credential material used for typing-free sign-in.
- **Learning and school records:** activities, answers, scores, progress,
  mastery, engagement, books, assessments, evidence versions, teacher
  interventions, reports, and game/reward state.
- **Accessibility and support settings:** teacher-managed choices such as
  reduced motion or reduced-choice presentation. These may reveal a support need
  and are handled with additional care.
- **Operational security and reliability:** privacy-minimal class-access event
  types, one-way fingerprints, timestamps, release identity, redacted error
  fingerprints, severity, and sync health. Error records exclude arbitrary
  messages, names, answers, full URLs, tokens, and school/class/learner IDs.
- **Browser storage:** local progress, settings, reports, retry queues, session
  recovery, and cached content may remain on the school-managed device so the
  service can work reliably and recover offline saves.

We do not ask for a learner email, home address, phone number, precise location,
uploaded photograph, or free-form medical or safeguarding notes. Schools should
not enter unnecessary sensitive information.

## How we use information

We use information to:

- authenticate and approve adults and provide scoped learner access;
- administer classes and learning assignments;
- deliver and adapt educational activities;
- store progress, evidence, and reports for authorised teachers;
- protect access, diagnose privacy-minimal service failures, and recover saves;
- respond to support, privacy, and security requests; and
- delete or return data under an approved request and retention process.

We do not show advertising, sell or rent personal data, build marketing profiles
of children, or use identifiable learner data to train an AI model. The deployed
learner application does not send learner prompts, answers, or profiles to an AI
provider.

## School authority, parents, and learners

The school or other authorised customer must select a valid legal basis, give
required notices, and use an institutionally approved process. Under a valid US
COPPA school-authorisation model, school authority is limited to the educational
context; it cannot authorise unrelated commercial use. LiteracyPath keeps its
own operator duties and does not transfer them to the school.

Parents and guardians can ask the school to review, correct, export, restrict,
or delete their child’s information, stop further collection where applicable,
and explain an alternative learning route. LiteracyPath may verify and route a
request through the school to protect the learner and the education record.

## Storage and providers

- **Supabase** provides teacher authentication, database storage, database
  functions, first-party operational error records, backups, and platform
  support.
- **Vercel** hosts and delivers the web application and may process ordinary
  request metadata such as IP address, user agent, URL, and time in platform
  logs.
- **Google Fonts** may receive ordinary network metadata when a connected user
  opens certain printable/exported HTML documents that request a font. Removing
  or self-hosting those fonts is an open launch decision.

Provider entities, regions, support access, logs, backups, retention, contracts,
and international transfer terms are deployment-specific and must be confirmed
before school-scale launch. The full candid register is in `SUBPROCESSORS.md`.

Local authoring tools may use OpenAI, BytePlus, Wikimedia Commons, or dictionary
services to create or import non-personal product media. They are not part of
the hosted learner runtime and are not authorised to receive school or learner
personal data.

## Sharing and disclosure

Authorised school staff can see records for their own school/class under scoped
access controls. Child-facing leaderboards use server-derived scope and
pseudonyms rather than learner, class, or school identifiers.

We disclose personal data to approved providers only for the service, to the
Customer under its authority, or where law requires it. We review legal demands,
notify the Customer where permitted, and limit disclosure to what is required.

## Retention and deletion

Indefinite retention is not authorised. Data should be kept only as long as
reasonably necessary for the specific educational, security, support, legal, or
contract purpose and securely deleted when no longer needed.

The product does not yet have the final school-configurable retention and
end-of-year deletion job required by A8.9. Before school-scale launch, the public
policy and contract must state verified periods for active accounts, inactivity,
end of year, termination/export, access and error logs, provider logs, and
backup expiry. Deletion must propagate to active systems and subprocessors;
restored backups must replay deletion controls before use.

To request access, correction, export, restriction, or deletion, contact the
school or `benjamesbowler@gmail.com`. Final verification, secure delivery, and
response targets must be approved before launch.

## Security and incidents

Controls include row-level tenant ownership, scoped database functions, teacher
authentication and approval, expiring learner access, throttling, pseudonymous
leaderboards, enforced browser security headers, privacy-minimal logs, release
tests, immutable assessment evidence, and recovery procedures. No online service
is risk-free, and independent security review plus several live exercises remain
open.

Confirmed personal data incidents are handled under `INCIDENT_RESPONSE.md`,
including containment, evidence, recovery, Customer/legal notification
assessment, and lessons learned.

## International processing

Hosting and support locations are not yet confirmed for the final deployment.
Before restricted UK or EU transfers, the parties must map locations and remote
access and put an approved mechanism and transfer assessment in place where
required. This draft does not approve a transfer.

## Changes

We will update the date and notify affected Customers as required before a
material change to purposes, data, providers, regions, transfers, retention,
child access, advertising, analytics, or AI processing. A material new purpose
requires its own authority and cannot rely on silent continued use.

## Contact and complaints

Current draft contact: `benjamesbowler@gmail.com`. The final policy must add the
verified operator address, privacy contact, accessibility contact, security
route, applicable regulator/complaint information, and school contact path
before public school-scale launch.
