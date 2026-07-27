# LiteracyPath school, parent, and learner privacy materials

> **Status:** EXTERNAL-READY DRAFT — LOCAL ADAPTATION AND QUALIFIED LEGAL REVIEW REQUIRED
> **Version:** 2026-07-24
> **Use:** select the correct material only after the school and counsel identify the legal basis

These materials do not assume that consent is always the lawful basis. A school
must decide its authority under local law. In a US COPPA school-consent model,
the operator remains responsible for its COPPA duties and must give the school
the required direct notice. The school’s authority is limited to the educational
context and not an unrelated commercial use.

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
hosts the application and processes ordinary request metadata. Some connected
print/export documents currently request Google Fonts; this must be removed or
approved before launch. See `SUBPROCESSORS.md`.

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

## Official review sources

- FTC COPPA school guidance:
  <https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions#N>
- US Department of Education FERPA school-official guidance:
  <https://studentprivacy.ed.gov/faq/who-school-official-under-ferpa>
- ICO guidance for edtech and children:
  <https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/the-children-s-code-and-education-technologies-edtech/>
