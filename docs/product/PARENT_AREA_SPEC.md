# LiteracyPath school-linked parent area

Status: proposed product specification with a working seeded UI preview

Preview: `/preview/parent-area.html`

## Product decision

Build the first parent area as a **school-linked, invitation-only guardian portal**.

This is not the direct-to-consumer family free tier described in `FREE_TIER_SPEC.md`. The two account types must remain separate:

- In the school product, the school authorises a guardian's link to a learner and controls what is released.
- In a future direct family product, the parent creates and controls a separate family learning record.

Combining these routes would blur who controls a child's school record and would make access, retention and deletion harder to explain.

## The parent job

A busy parent should be able to answer three questions in under a minute:

1. What is going well?
2. What is the school working on next?
3. What useful, low-pressure thing can we do at home?

The parent area is therefore not a smaller teacher dashboard. It is the final part of the LiteracyPath loop:

`school evidence -> teacher decision -> family explanation -> short home support -> later school evidence`

## Users and permissions

### Guardian

A verified adult invited by a school. A guardian can:

- view only learners to whom the school has explicitly linked them;
- switch between linked learners;
- view family-ready updates and reports released by the school;
- print home activities and reports;
- change family language and notification preferences;
- contact the school using the route the school provides; and
- see the family privacy notice and how to make a data-rights request.

A guardian cannot:

- find or request access to a learner by name;
- view a class list, another learner or class comparisons;
- see internal teacher notes, drafts, raw results or staff-only diagnostic detail;
- edit learning evidence, teaching priorities or progress decisions;
- mark home practice as proof of learning; or
- message a child, teacher or other parent inside the product in version one.

### School staff

An authorised teacher or school administrator can:

- create an invitation for a named guardian email;
- link one or more guardians to a learner;
- revoke a link immediately;
- release or withdraw a family report;
- choose a Family Bridge plan and family language; and
- define the school contact shown to the family.

The school remains responsible for confirming that the invited adult is entitled to see the learner's record.

## Information architecture

### Home

The default page is a strengths-first summary in this order:

1. Summary highlight
2. What is going well
3. What the child can do now
4. The next teaching focus
5. What this means
6. One thing to try at home
7. Who to talk to

This follows the family-report ordering required by the Reporting Bible while reducing it to a quick daily-use view.

### Progress

Show no more than six parent-facing strands. The proposed initial labels are:

- Letter names and sounds
- Hearing sounds in words
- Reading words
- Spelling words
- Reading aloud smoothly
- Understanding a text

Use only the words `Doing well`, `Growing` and `Not checked yet`. A strand includes a sentence explaining what the school has seen. Do not show percentages, age equivalents, reading bands, rankings or red-amber-green displays.

`Not checked yet` is an honest absence of shared information, never zero.

### At home

Reuse and extend the current Family Bridge system:

- five short activities tied to the current teaching focus;
- English, Spanish and Simplified Chinese at launch;
- print-friendly version;
- no voice or image recording;
- no completion streak or compliance score; and
- no claim that home activity proves learning.

### Reports

Show only explicitly released family reports, newest first. Each report supports opening, printing and downloading. Withdrawing a report removes it from future access but must create an audit event.

### Account

Show linked children, family language, report notifications, the school that controls each link, the family privacy notice, the data-rights route and sign out.

## Access and data model

Recommended server-side records:

| Record | Purpose | Important rule |
|---|---|---|
| `guardian_profiles` | Adult profile attached to a verified authentication account | No learner access on its own |
| `guardian_invites` | Single-use, expiring school invitation | Store inviter, school, learner, intended email, expiry and revocation |
| `guardian_learner_links` | Authoritative guardian-to-learner relationship | School-scoped, auditable and immediately revocable |
| `family_report_releases` | A released snapshot or immutable release reference | Draft reports never satisfy a parent read policy |
| `guardian_notification_preferences` | Email and language choices | No marketing consent inferred from service notifications |
| `guardian_access_audit` | Invitation, link, view, download, withdrawal and revocation events | Append-only with limited staff visibility |

### Row-level access policy

Every family read must prove all of the following in the database, not only in the interface:

1. the user has a current guardian profile;
2. the guardian-to-learner link is active;
3. the learner belongs to the same school as the link;
4. the requested report is released to families; and
5. neither the invitation nor the link has expired or been revoked.

Never accept a learner id from the browser as sufficient authority. Direct object-reference tests must attempt access across children, guardians and schools.

## Invitation and recovery flow

1. School staff enter the guardian's email against a learner.
2. LiteracyPath sends a single-use link with a clear expiry.
3. The guardian verifies the same email address and sets up or signs into an adult account.
4. The server consumes the invitation and creates the learner link atomically.
5. The guardian sees the family home page.
6. The school can resend, cancel or revoke from the learner record.

Recovery must never reveal whether an unverified email is linked to a child. Support staff must not create family links from an email request alone.

## Release scope

### P0: useful and safe

- Guardian authentication with email verification and password recovery
- School-created invitation, resend, expiry, cancellation and revocation
- One guardian linked to multiple children and multiple guardians linked to one child
- Home, Progress, At home, Reports and Account pages
- Teacher release control for family reports
- Family Bridge delivery and printing
- Family-language choice
- Parent-specific row-level policies and cross-tenant security tests
- Access audit, privacy notice and school-routed data-rights instructions
- Empty, loading, error, no-report and revoked-access states
- Mobile phone, tablet, keyboard, screen-reader and print checks

### P1: makes it operationally strong

- Report-ready email notifications
- School guardian-access screen with last-used and revoked states
- Branded school contact and optional school logo
- Report withdrawal notice and audit history
- Translation review workflow and per-report language fallback
- Guardian access export for school administrators

### P2: only after evidence of need

- Optional acknowledgements such as `I have read this update`
- School-configured home-reading recommendations
- Family attendance at meetings or events
- Direct family subscription area, kept on a separate account and data path

## Deliberate exclusions

- No in-app messaging in version one. It creates safeguarding, moderation, retention and response-time obligations without improving the core progress loop.
- No parent-entered progress judgments.
- No child comparison or class average.
- No public guardian signup that searches for a child.
- No advertising or child-facing purchase prompt.
- No home-practice streaks, pressure or surveillance.
- No automatic sharing of every saved teacher result.

## Notification rules

Service emails are limited to invitations, security events, report releases and access changes. Marketing is separate and opt-in. Notification content should not include detailed child learning information; the email should ask the verified guardian to sign in.

## Accessibility and content rules

- Family copy targets an eighth-grade reading level or lower.
- Strengths appear before needs.
- A status is always written in words and never communicated by colour alone.
- Controls are at least 44 by 44 CSS pixels.
- The complete area works at 390 CSS pixels without horizontal overflow.
- Released reports have semantic headings and a print layout.
- Dates and names come from school-controlled display fields and are escaped as untrusted content.

## Proposed launch measures

These are targets to validate, not current product claims:

| Measure | Initial target |
|---|---:|
| Invitation accepted within 14 days | 70% or better |
| Activated guardians returning within 30 days | 60% or better |
| Activated guardians opening an at-home activity | 50% or better |
| Released reports successfully opened | 95% or better |
| Unauthorised cross-learner access in automated and manual testing | 0 |
| Parent copy passing the plain-language check | 100% |

Operational review should also track invitations that bounce, expired links, revoked links, support requests and schools that release no updates.

## Acceptance scenarios

The feature is not production-ready until all of these pass:

- A guardian linked to learner A cannot read learner B by changing a URL or request body.
- A guardian linked to children in two classes can switch cleanly between them.
- Two guardians can independently access the same child after separate invitations.
- Revocation ends access on the next server-authorised request, including an already open session.
- A draft or withdrawn report never appears in the parent API response.
- Missing progress displays `Not checked yet` and never zero.
- A parent can complete every task on a 390-pixel-wide phone using keyboard or touch.
- A failed load explains that no data was changed and offers a retry.
- An unlinked adult sees no child names and receives no clue that a particular child exists.
- Printing an at-home plan excludes app navigation and account controls.

## Current implementation boundary

The preview implements the proposed page design, interactions, responsive behaviour and display-model rules with seeded sample content. It deliberately does not add a production guardian role, database tables, authentication, invitations, notifications or report-download service. Those are the security-critical implementation phase and must be built together rather than simulated in a live beta.
