# LiteracyPath school, parent, and learner privacy materials

> **Status:** EXTERNAL-READY DRAFT — LOCAL ADAPTATION AND QUALIFIED LEGAL REVIEW REQUIRED
> **Version:** 2026-08-08
> **Use:** select the correct material only after the school and counsel identify the legal basis

These materials do not assume that consent is always the lawful basis. A school
must decide its authority under local law. In a US COPPA school-consent model,
the operator remains responsible for its COPPA duties and must give the school
the required direct notice. The school’s authority is limited to the educational
context and not an unrelated commercial use.

**Scope of these materials.** Everything in sections A to G concerns the
school-authorised service, which is the only route on which information about a
learner is collected at all. The product also offers an anonymous try-out that
collects nothing and requires no authorisation from anyone; it is covered
separately in section H, because a school asked to sign an authorisation is
entitled to know it exists and a parent may well have used it before the school
ever raised the subject. Do not use sections A to G to describe the try-out —
they would materially overstate what happens on it.

## A. Operator’s direct notice to a school

**Service:** LiteracyPath, a teacher-managed early-literacy web application for
learners approximately aged 4–7.

**Operator/contact:** use the verified operator identity, address, and privacy
contact from the final deployment facts. The current draft contact is
`benjamesbowler@gmail.com`.

**Information collected:** teacher email, display name, school, role and class
configuration; learner first/display name, class, picture-code credential
material, accessibility settings, progress, answers, mastery, engagement,
assessment evidence, reports, interventions, and game/reward state; and
privacy-minimal security, sync, and error events.

**How it is collected:** staff enter roster and settings; learners interact with
teacher-assigned activities; the service records learning and security events;
browser storage supports offline/fallback recovery.

**Purposes:** sign-in, class administration, learning delivery and adaptation,
progress/evidence, reports, access security, support, reliability, and approved
data-rights/deletion operations.

**Disclosure:** Supabase processes authentication and application data; Vercel
hosts the application and processes ordinary request metadata such as IP
address, user agent, URL, and time in platform logs. No third-party
advertising, analytics, or tracking service receives anything, and the browser
content security policy permits no connection except to the application's own
origin and Supabase. Fonts were previously requested from Google by certain
print/export documents; they are now self-hosted and Google receives nothing.
See `SUBPROCESSORS.md`.

**Other routes into the same application:** an anonymous try-out is open to the
public and collects no information about anyone. It creates no account, writes
nothing to the device, and sends nothing to the database, so it is outside this
authorisation and outside the school's records entirely. Section H covers it.
There is no other route: no adult outside a school can currently create a
learner whose work is kept.

**Prohibited purposes:** no advertising, sale, unrelated commercial profiling,
or identifiable learner-data training of an AI model.

**Review, stop collection, and deletion:** the school may request access,
correction, export, restriction, or deletion and may end future collection by
removing access or terminating the service, subject to verified request and
legal retention. Final service levels and backup expiry must be attached before
launch.

**Retention:** indefinite retention is not authorised. The final direct notice
must insert the school-selected active, inactivity, end-of-year, termination,
log, and backup periods after A8.9 is implemented.

**School acknowledgement:** an authorised school or district representative,
not a child pretending to be a teacher, must approve the service through the
verified contracting workflow.

## B. School authorisation record

The final signed record should capture:

- school/district legal name and address;
- authorised representative name, title, work email, and verification method;
- date, duration, classes/grades, and approximate learner count;
- selected legal basis and school policy/authority;
- confirmation that the operator’s direct notice, privacy notice, terms, DPA,
  subprocessor register, retention schedule, and security/accessibility
  summaries were reviewed;
- the FERPA exception and annual-notice criteria, if applicable;
- the COPPA school-authorisation analysis, if applicable;
- UK/EU controller role, lawful basis, DPIA, and transfer decision, if applicable;
- state/local addenda and parent-notice/consent requirements;
- approved staff administrators and privacy/security contacts;
- retention and end-of-year action;
- any learner categories or fields the school prohibits; and
- signature, date, renewal/review date, and withdrawal route.

Suggested acknowledgement:

> The school authorises LiteracyPath to process only the data described in the
> attached direct notice for the school-selected educational purpose. The school
> has identified its authority and required family notice or consent. This
> authorisation does not permit advertising, sale, unrelated commercial use, or
> identifiable learner-data AI training, and does not transfer the operator’s
> legal duties to the school.

## C. Plain-language parent/guardian notice

**Your child’s school would like to use LiteracyPath**

LiteracyPath helps teachers give early-reading activities and understand where a
child may need practice. The teacher creates and manages the account. Your child
does not need an email address.

The service can store your child’s first or display name, class, picture login
code, accessibility choices, activities, answers, progress, assessment results,
teacher support plans, and game rewards. It uses this information to run the
lesson, save progress, help the teacher choose next steps, and make school
reports.

LiteracyPath does not use your child’s information for advertising, sell it,
build a marketing profile, or use identifiable learner information to train an
AI model. Supabase stores login and learning information. Vercel hosts the web
application. The final school notice must list any other approved provider and
where information is processed.

You can ask the school to show you the information, correct it, obtain a copy,
stop further use where applicable, or delete it subject to law. You can also ask
what happens if you do not want your child to use the service and what
equivalent learning option the school provides.

If you have already tried LiteracyPath at home from its front page without
making an account, that is a different thing from what the school is asking
about. The public try-out keeps nothing at all — no name, no account, and no
record of what your child did — so nothing from it is held about your child and
nothing from it reaches the school. What the school is asking about here is the
version that does keep your child's work, so that their teacher can see it.

Contact the school first for education records. The final notice must include
the school privacy contact, LiteracyPath privacy contact, retention periods,
start/end dates, legal basis, and complaint/regulator route.

## D. Parent/guardian consent form when consent is required

Use this form only where counsel confirms that parent/guardian consent is the
correct basis and specifies a valid verification method.

The final form must state:

- child’s name or school learner reference;
- school/class and adult relationship;
- all information categories, purposes, providers, locations, retention, and
  rights from the final direct notice;
- whether participation is optional and the equivalent alternative;
- whether consent covers collection/use only or any separately identified
  disclosure;
- how consent is verified;
- start/end date and how to withdraw without unlawful detriment;
- what processing stops after withdrawal and what may lawfully be retained;
- school and operator contacts; and
- guardian name, affirmative choice, signature/e-sign evidence, and UTC date.

Consent choices must not be bundled with advertising, unrelated product
development, or unnecessary sharing. Silence, pre-ticked boxes, or a child’s
action are not approval.

Suggested affirmative statement:

> I have read the notice and had an opportunity to ask questions. I authorise
> the described collection and educational use for the stated period. I
> understand how to withdraw and how to request access, correction, a copy, or
> deletion. I understand the school will explain an equivalent option if I do
> not consent.

## E. Age-appropriate learner explanation and assent

An adult can say:

> This reading app remembers the work you do so your teacher can help you. Your
> teacher can see your answers and progress. It is okay to ask for help, take a
> break, or use a different activity. Do not type private things into the app.
> Tell your teacher if something feels wrong or you do not want to continue.

The adult records willingness or reluctance without asking the child to accept
legal terms. A child’s refusal, distress, fatigue, or request to stop must follow
the school’s safeguarding and study/classroom rules. Assent does not replace
required adult or school authority.

## F. Rights and privacy request intake

The request form should collect only what is necessary to verify and route:

- requester name and relationship;
- school and a safe contact method;
- learner reference supplied through the school, not a password or class code;
- request type: access, correction, export, restriction, objection, deletion,
  withdrawal, provider/retention question, or complaint;
- scope and relevant date;
- accessibility or communication needs; and
- received time, owner, verification method, due date, action, exceptions,
  secure delivery, completion evidence, and requester confirmation.

Never ask a requester to email a picture credential, password, full database
record, or unnecessary identity document. Route suspicious/conflicting requests
to the school privacy owner and counsel.

## G. Withdrawal and alternative-access script

The school should explain which processing can stop, any record it must retain,
the effect on saved history, the date of change, and an equivalent accessible
learning option. Withdrawal must be recorded and propagated to the operator.
Deletion is not complete until active systems, subprocessors, and the verified
backup lifecycle are addressed.

## H. The anonymous try-out — no authorisation, no consent, no record

This section exists so that nobody has to guess. The try-out is a deliberate
legal object, not an oversight, and the argument for it is short: there is
nothing to authorise because there is nothing collected.

**What it is.** Anyone can open the try-out from the front page, pick a starting
level, and use a sample of the books, games, letter activities, and story quests.
No account is created and no sign-up exists on that path.

**Why no consent is sought.** Consent, school authorisation, and a lawful basis
are all mechanisms for permitting the collection or use of personal information.
On this route there is none to permit. The visitor is given a nickname picked at
random from a fixed word list; there is no name field anywhere, because a text
box is how a real child's real name reaches a database. The nickname is not
derived from the device, the network address, or the time, so it cannot be used
to recognise the same child twice or to link two children on one device. Nothing
is written to the device: the application's browser storage is replaced for the
session with an in-memory object discarded when the page closes, and if that
replacement fails the try-out refuses to run rather than fall back to real
storage. Nothing is sent to the database: every database and sign-in call in the
application passes through one boundary, and on this route that boundary refuses
all of them. Both guarantees are enforced at single choke points and covered by
tests that fail if either is removed.

**What is still true, and must not be glossed over.** The application is served
by a web host, and that host records ordinary request metadata — IP address,
user agent, URL, and time — in platform logs, exactly as it does for every
visitor to every site it serves. The operator does not receive that joined to a
person and holds no identifier that could be joined to it, but it is not nothing.
Any statement that the try-out "collects nothing" should be read as a statement
about LiteracyPath rather than about web hosting. The provider log retention
period is an unresolved deployment fact.

**Where the operator's duties still sit.** No collection does not mean no
responsibility. Content shown to an unaccompanied child must still be
age-appropriate; the sample deliberately excludes anything that assesses or
scores a child, because a result nobody may keep is a waste of a child's
attention and an invitation to build a record for it later. The absence of a
persistent identifier also removes the usual means of abuse detection, so
availability and rate protection remain operator problems rather than
account-level ones.

**What a school should take from this.** The try-out is outside the school's
records and outside this authorisation. A parent using it at home creates no
education record, produces no data the school holds, and generates nothing a
data-rights request could be answered with. If a family wants a child's work
kept, the school-authorised service is currently the only route that does that.

**Open questions for counsel.** Whether an anonymous, collection-free service
still triggers notice obligations in any target region; whether the host's
platform logs are personal data in the operator's hands when the operator holds
nothing to join them to; whether the "support for internal operations"
reasoning is even reached when no persistent identifier is created; and what
must change if a persistent identifier is ever introduced on this route for any
reason, including anti-abuse. These are carried as unchecked items in
`COUNSEL_REVIEW_CHECKLIST.md`.

## Official review sources

- FTC COPPA school guidance:
  <https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions#N>
- US Department of Education FERPA school-official guidance:
  <https://studentprivacy.ed.gov/faq/who-school-official-under-ferpa>
- ICO guidance for edtech and children:
  <https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/the-children-s-code-and-education-technologies-edtech/>
