# LiteracyPath region and education-privacy matrix

> **Status:** EXTERNAL-READY DRAFT — QUALIFIED LOCAL LEGAL REVIEW REQUIRED
> **Version:** 2026-08-08
> **Rule:** this matrix identifies decisions and gates; it does not declare compliance

Law, regulator guidance, school status, child age, funding, location, contract,
and actual processing determine the result. Counsel must verify the law in force
on the deployment date and add state, provincial, sector, employment, consumer,
and public-records rules that apply.

## Which route this matrix covers

The decision matrix below concerns the school-authorised service, where personal
information about a learner is collected. The product also offers an anonymous
try-out that creates no account, writes nothing to the device, and sends nothing
to the database. Every regime in the matrix is triggered by collection or use of
personal information, so on that route the entries are not so much satisfied as
never reached — which is a different finding and must be recorded as one rather
than inferred from a column of blanks. The open questions specific to it are in
`COUNSEL_REVIEW_CHECKLIST.md` and section H of
`SCHOOL_PARENT_CONSENT_MATERIALS.md`. The planned direct family route would be
a third case and is not built.

## Decision matrix

| Regime | Expected role | Authority/consent decision | Required notice/contract | Rights and records | Security/incident | Location/transfer | Launch gate |
|---|---|---|---|---|---|---|---|
| US COPPA, children under 13 | LiteracyPath is the covered operator if the service is child-directed or knowingly collects online personal information; school may act as parent’s agent only in the educational context | Determine coverage; use verified parental consent unless a valid school-authorisation model applies; school authorisation cannot cover unrelated commercial purposes; operator keeps its own duties | Direct notice to school equivalent to parent notice; clear online privacy notice; verified school decision; service-provider assurances; written security program; written retention/deletion policy | Parent/school opportunity to review, delete, stop further use/collection; verification; minimise collection and do not retain indefinitely | Reasonable written safeguards, provider due diligence/assurances, incident assessment under federal/state/contract rules | Disclose providers and assess state/international issues; COPPA does not replace other transfer laws | Counsel-approved COPPA assessment; verified institutional authoriser; final direct notice; rights workflow; A8.9 retention; provider review; no ads/sale/unrelated use |
| US FERPA | School/LEA is subject entity where federally funded; LiteracyPath may act under school-official exception or another selected exception | School—not vendor—selects and documents exception; for school-official model, service performs institutional function, is under school’s direct control, uses records only for disclosed purpose, and meets annual-notice criteria | Executed terms/DPA with purpose, direct control, use/redisclosure restrictions, security, access, deletion, and audit support; align school annual notice | Parent/eligible-student access/amendment rights handled through school; no unauthorised redisclosure; preserve record integrity | Contractual safeguards, incident cooperation, and school notification; state laws may be stricter | Map all recipients/locations; add state student-privacy and breach terms | School privacy official records exception and annual-notice fit; DPA executed; ownership/RLS/live tests; rights and deletion workflow |
| US PPRA and state student-privacy laws | School and operator duties vary | Determine whether surveys, protected information, marketing, sale, profiling, biometrics, or state-specific consent/contract rules apply | State addenda, parent notices/opt-outs, security clauses, deletion, advertising/sale prohibitions, and local procurement terms as applicable | State-specific access, correction, deletion, transparency, and complaint rights | State breach clocks and security standards | State/local storage or contracting requirements where applicable | Target-state inventory and counsel-approved addenda before offering service there |
| UK GDPR and Data Protection Act 2018 | School commonly controller for school purposes; LiteracyPath commonly processor when acting only on instructions; actual conduct can make it controller/joint controller for other purposes | School selects Article 6 basis and any Article 9/DPA condition; do not default to consent or borrow school public task for provider’s own purpose; assess Children’s code scope based on actual service | Article 28 contract; child-accessible privacy information; DPIA where high risk; records of processing; subprocessor authorisation; data-sharing/role record | Access, rectification, erasure, restriction, objection, portability where applicable; school routes education records; account for child capacity and best interests | Appropriate measures, breach records, processor notice without undue delay, controller ICO/individual assessment; contractual 24-hour target requires approval | Confirm UK storage/access; apply UK adequacy, IDTA or UK Addendum and transfer-risk assessment for restricted transfers | Role/lawful-basis memo; DPIA and best-interests/Children’s code assessment; executed Article 28 DPA; UK transfer chain; rights/retention; ICO/representative/DPO assessment |
| EU/EEA GDPR | School or authority commonly controller; LiteracyPath commonly processor on instructions; other-purpose processing changes role | Controller selects Article 6 basis and Article 9 condition if needed; assess national child/education law and age rules | Article 28 contract, transparent child-appropriate notice, DPIA, subprocessor authorisation, records, and local public-sector terms | GDPR data-subject rights with identity verification, controller routing, exceptions, and secure delivery | Appropriate measures; processor notice without undue delay; controller 72-hour supervisory-authority assessment where Article 33 applies | Confirm EEA storage/access; adequacy or 2021 SCCs plus transfer impact/supplementary measures for restricted transfers | Target-country counsel; role/lawful-basis record; DPIA; DPA; SCC/transfer assessment; representative/DPO/supervisory-authority decision |

## Cross-region product rules

The following are required regardless of which legal basis counsel selects:

- collect only fields needed for the school-authorised learning purpose;
- no advertising, sale, unrelated marketing profile, or identifiable learner AI
  training;
- no high-stakes educational decision without qualified human review;
- child-appropriate explanation and accessible adult notices;
- verified school/customer authority rather than self-declared teacher status;
- least-privilege tenant isolation and scoped child access;
- provider inventory, written terms, regions, retention, and transfer chain;
- exercised access, correction, export, restriction, and deletion workflow;
- specific active, inactivity, end-of-year, termination, log, and backup periods;
- DPIA/child-impact review before high-risk or new-purpose processing;
- incident roles, evidence, school notice, and jurisdiction-specific clocks;
- equivalent accessible learning where a digital interaction is unsuitable; and
- no route outside a school on which anything about a child is kept, unless and
  until counsel approves a lawful basis and consent mechanism for one.

## Current readiness gaps

The implementation pack is ready for external review, but launch is not legally
cleared. Contracting identity, regions, provider terms, retention jobs, rights
workflow, transfer mechanisms, DPIAs, role/lawful-basis records, target-state
review, the legal position of the anonymous route, independent accessibility
testing, security assessment, and counsel approval remain open in
`LEGAL_DEPLOYMENT_FACTS.md`. The Google Fonts disposition, previously listed
here, is resolved: the fonts are self-hosted and the content security policy no
longer permits the request.

## Official sources checked for this draft

- FTC COPPA compliance plan, updated May 2026:
  <https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business>
- FTC COPPA FAQs, including schools:
  <https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions>
- US Department of Education FERPA school-official guidance:
  <https://studentprivacy.ed.gov/faq/who-school-official-under-ferpa>
- ICO edtech and Children’s code guidance:
  <https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/the-children-s-code-and-education-technologies-edtech/>
- ICO controller/processor contract guidance:
  <https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/what-needs-to-be-included-in-the-contract/>
- ICO international-transfer update:
  <https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/01/updated-guidance-on-international-transfers-published/>

Counsel must check source updates and binding law at approval time.
