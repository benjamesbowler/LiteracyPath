# LiteracyPath privacy policy (source)

> **Status:** EXTERNAL-READY DRAFT — QUALIFIED LEGAL REVIEW REQUIRED
> **Last reviewed against the product:** 8 August 2026
> **Live page:** `public/privacy.html`; keep the source and page in sync
> **Approval boundary:** this draft describes current practice but is not legal advice or a compliance certification

**Current operator/contact:** Benjamin Bowler — `benjamesbowler@gmail.com`.
The final legal identity, address, dedicated contacts, provider regions, transfer
terms, and approved contractual retention periods remain open in
`LEGAL_DEPLOYMENT_FACTS.md`.

LiteracyPath is an early-literacy and phonics service for learners roughly aged
4–7.

## Two routes, and why this policy is organised around them

Everything below depends on which of two routes a person is on, so the routes
come first. Reading the wrong half of this policy will give the wrong answer.

**Route 1 — the school-authorised service.** A school or other authorised adult
creates and manages learner access. Teachers hold accounts; learners are placed
on a roster by an adult and sign in with a picture code. Progress is stored,
reports are produced, and the school directs what happens to the records. This
is the school-managed context, it is the paid product, and it is the subject of
most of this policy, the terms, and the data processing addendum.

**Route 2 — the anonymous try-out.** Anyone can open the try-out from the front
page and use a sample of the activities with no account, no sign-up, and no
information collected about them or their child. Nothing is stored on the device
and nothing is sent to our database. There is no progress, no report, no
leaderboard and no assessment, because each of those requires keeping something
and this route keeps nothing. It exists so that an adult can evaluate the product
and a child can read a few books without anyone having to hand over data first.

Until August 2026 this policy stated flatly that no child could reach the
product outside the school-managed context. The try-out made that sentence
untrue, and it has been replaced rather than qualified. The accurate statement
is that **a child can reach LiteracyPath without a school, but only through a
route that collects nothing.** There is deliberately no third option in which a
child uses the product outside a school while data is kept about them. The
planned family route described at the end of this policy would create one, and
it is not live.

## Information we collect

### On Route 1, the school-authorised service

- **Teacher and administrator account:** email, display name, school, approval
  and role information, classes, configuration, settings, and account activity.
  An email address must be confirmed before an account can be approved.
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

### On Route 2, the anonymous try-out

Nothing that identifies a person, and nothing that would allow the same person
to be recognised on a later visit.

- **No account and no sign-up.** There is no email field, no password, and no
  code to enter.
- **A nickname the visitor is given rather than types.** It is picked at random
  from a fixed list of ordinary words such as "Sunny Otter". There is no name
  input anywhere in the try-out, which is deliberate: a text field is how a real
  child's real name ends up in a database. The nickname is not derived from the
  device, the network address, the time, or anything else about the visitor, so
  two children on one device are not linkable to each other and one child is not
  recognisable on a second visit.
- **Nothing written to the device.** For the duration of the try-out the
  application's browser storage is replaced with an in-memory object that is
  discarded when the page closes. If that replacement cannot be made, the
  try-out refuses to start rather than running against real storage.
- **Nothing sent to our database.** Every database and authentication call in the
  application passes through a single boundary, and in this mode that boundary
  refuses all of them outright rather than quietly doing nothing.
- **No cookies are set by us**, on this route or any other.

**The honest carve-out.** "We collect nothing" is a statement about
LiteracyPath, not about the internet. Loading any web page causes the server that
hosts it to see the request. Our host, Vercel, records ordinary request metadata
— IP address, user agent, URL, and time — in platform logs, exactly as it does
for every visitor to every site it serves, and exactly as any other web host
would. We do not receive that data joined to a person, we hold no identifier that
could be joined to it, and we do not use it to build a profile. It is
nevertheless not nothing, and this policy does not claim otherwise. The final log
retention and region for those platform logs is an unresolved provider fact in
`LEGAL_DEPLOYMENT_FACTS.md`.

Beyond that, the browser is instructed by our content security policy to refuse
every network connection except to our own origin and our database provider, so
no advertising, analytics, font, or tracking service can receive anything from
either route. There is no analytics product in the application at all.

## How we use information

We use information to:

- authenticate and approve adults and provide scoped learner access;
- administer classes and learning assignments;
- deliver and adapt educational activities;
- store progress, evidence, and reports for authorised teachers;
- protect access, diagnose privacy-minimal service failures, and recover saves;
- respond to support, privacy, and security requests; and
- delete or return data under an approved request and retention process.

On the anonymous try-out none of these apply, because there is nothing to apply
them to. The activities run entirely in the browser for as long as the page is
open.

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

The anonymous try-out sits outside this arrangement in both directions. No school
authority is required, because no personal information is collected. Equally,
there is nothing to request access to, correct, export or delete: no record is
created, so no record can be produced. An adult who wants a child's work kept
needs Route 1. The try-out screen says so before the child starts and again when
they leave, rather than only at the front door.

## Storage and providers

- **Supabase** provides teacher authentication, database storage, database
  functions, first-party operational error records, backups, and platform
  support. It receives nothing from the anonymous try-out.
- **Vercel** hosts and delivers the web application and may process ordinary
  request metadata such as IP address, user agent, URL, and time in platform
  logs. This applies to every visitor, including anonymous ones, and is described
  in the carve-out above.
- **Google Fonts** is no longer used and receives nothing. The seven typefaces
  the application uses are self-hosted from our own origin, and the content
  security policy no longer permits a request to Google's font domains, so the
  change cannot silently regress.

Supabase and Vercel are the current hosted-service providers. Their final
contracting entities, project and support regions, onward-provider locations,
log and backup periods, and international transfer terms are deployment-specific
and remain unconfirmed. This policy does not claim a region that has not been
checked in the provider dashboards and contracts. The full candid register is
in `SUBPROCESSORS.md`.

Local authoring tools may use OpenAI, BytePlus, Wikimedia Commons, or dictionary
services to create or import non-personal product media. They are not part of
the hosted learner runtime and are not authorised to receive school or learner
personal data.

## Sharing and disclosure

Authorised school staff can see records for their own school/class under scoped
access controls. Child-facing leaderboards use server-derived scope and
pseudonyms rather than learner, class, or school identifiers, and are switched
off entirely on the anonymous route.

We disclose personal data to approved providers only for the service, to the
Customer under its authority, or where law requires it. We review legal demands,
notify the Customer where permitted, and limit disclosure to what is required.

## Retention and deletion

Indefinite retention is not authorised. Data should be kept only as long as
reasonably necessary for the specific educational, security, support, legal, or
contract purpose and securely deleted when no longer needed.

The product supports a per-school inactivity period, deletion after archive, and
an annual archive-or-delete instruction. An administrator must save the school
instruction, preview the affected learner counts, and type an exact confirmation
before the retention job changes records. Active learner records are deleted
through the verified data-rights workflow.

Provider and backup target dates are tracked separately. A date passing does not
prove that a provider copy is gone: an administrator must check provider or
backup evidence and record its reference before marking propagation verified.
The values shown in product defaults are operational safeguards, not approved
legal periods. Before school-scale launch, the contract and this notice must
state the school-approved periods and provider-verified log, replica, cache,
support-copy, and backup expiry. Restored backups must replay deletion controls
before use.

An anonymous try-out session has no retention period because it creates no
record. It ends when the page closes, and the in-memory storage it used is
discarded with the tab. The only surviving trace is the host's platform log
described above, whose expiry is a provider setting rather than a product one.

To request access, correction, export, restriction, or deletion, contact the
school or `benjamesbowler@gmail.com`. Final verification, secure delivery, and
response targets must be approved before launch.

## Security and incidents

Controls include row-level tenant ownership, scoped database functions, teacher
authentication with confirmed email and manual approval, expiring learner
access, throttling, pseudonymous leaderboards, enforced browser security
headers, privacy-minimal logs, release tests, immutable assessment evidence, and
recovery procedures. The anonymous route's two guarantees — that nothing is
written to the device and nothing reaches the database — are enforced at single
choke points and covered by tests that fail if either boundary is removed. No
online service is risk-free, and independent security review plus several live
exercises remain open.

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

## Planned and not yet live: a direct family route

This section describes something that does not exist yet. It is written down so
that counsel can review it before it is built rather than after, and so that
nobody reads the two routes above and assumes a third one is hiding somewhere.
No part of the deployed application implements it today: there is no family
sign-up, no parent account, and no way for an adult outside a school to create a
learner whose work is kept.

The intended shape is that an adult registers with an email address and
password, confirms the address, adds up to two children by display name only,
and gets the same sample of the content as the try-out with progress kept
between visits. Reporting, exports, assessments and leaderboards would stay with
the school product. Before any of it ships, at minimum the following must be
resolved rather than assumed: which lawful basis and which verifiable parental
consent mechanism apply in each target region; how an adult registrant is
distinguished from a child; what the direct notice to a parent says when there
is no school in between; what the deletion and export route is when there is no
school to route a request through; and whether the operator becomes a controller
rather than a processor for those records, with the accountability that follows.
`LEGAL_DEPLOYMENT_FACTS.md` carries these as open decisions and
`COUNSEL_REVIEW_CHECKLIST.md` carries them as unchecked review items.

## Contact and complaints

Current draft contact: `benjamesbowler@gmail.com`. The final policy must add the
verified operator address, privacy contact, accessibility contact, security
route, applicable regulator/complaint information, and school contact path
before public school-scale launch.
