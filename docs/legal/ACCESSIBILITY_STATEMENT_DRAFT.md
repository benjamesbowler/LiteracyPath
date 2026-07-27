# LiteracyPath accessibility statement

> **Status:** EXTERNAL-READY DRAFT — INDEPENDENT ACCESSIBILITY REVIEW REQUIRED
> **Version:** 2026-07-24
> **Conformance claim:** no formal conformance claim is made

LiteracyPath is intended for young learners and the adults who support them. The
product aims to meet WCAG 2.2 Level AA and to support keyboard, touch, screen
reader, zoom, reduced-motion, contrast, and cognitive-access needs. WCAG 2.2 is
the current W3C Recommendation used as the engineering target.

## Measures in the product

- named landmarks, controls, dialogs, and active learning surfaces;
- keyboard focus and visible focus checks on primary routes and overlays;
- minimum target-size and phone/tablet layout checks;
- contrast and disabled-state checks;
- spoken and illustrated child navigation and login recovery;
- reduced-motion and reduced-choice learner settings managed by teachers;
- alternatives or failure handling for assessment media;
- responsive teacher and learner routes at maintained device sizes;
- automated Axe checks on key routes; and
- release tests for overlays, reports, exports, assessment completion, and
  teacher workflows.

## Current limitations

Automated checks cannot prove full conformance or usability with every assistive
technology. Independent manual review with disabled users and specialists has
not been completed. Complex games, 3D/animated experiences, generated
print/export files, older authored media, audio-only cues, and long teacher
workflows may still contain barriers.

The repository’s accessibility gates cover maintained routes and viewports, but
they do not yet constitute a complete WCAG 2.2 audit, VPAT/ACR, EN 301 549
assessment, Section 508 report, or Equality Act assessment.

## Alternatives and support

Teachers should provide an equivalent supported learning route when a learner
cannot use a game, animation, audio interaction, picture credential, or timed
activity. Learning decisions should never depend solely on an inaccessible
interaction. A school may request an accessible format or reasonable adjustment
through the verified support route.

## Feedback

Accessibility feedback should include the page or activity, device/browser,
assistive technology, what the user was trying to do, and the barrier. Do not
send learner names, answers, credentials, or sensitive records in ordinary
email.

Until an accessibility route is confirmed in `LEGAL_DEPLOYMENT_FACTS.md`, use
`benjamesbowler@gmail.com`. The final public statement must include a monitored
contact, expected acknowledgement and resolution targets, escalation path, and
the date and scope of the latest independent audit.

## Assessment and update plan

Before school-scale launch:

1. test representative teacher and learner journeys with keyboard-only,
   VoiceOver/Safari, NVDA/Firefox or Chrome, zoom/reflow, reduced motion, switch
   or alternative input where applicable, and high-contrast settings;
2. include users with visual, hearing, motor, cognitive, language, and learning
   access needs;
3. audit exported/printed reports and core learning media;
4. record WCAG 2.2 A/AA findings, severity, owner, remediation, and retest;
5. publish only the accurately scoped conformance status; and
6. repeat at least annually and after material interface changes.

This draft follows the W3C WCAG 2.2 standard:
<https://www.w3.org/TR/WCAG22/>.
