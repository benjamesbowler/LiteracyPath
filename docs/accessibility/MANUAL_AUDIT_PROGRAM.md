# Manual accessibility audit programme

Status: `EXTERNAL-READY`; human execution is not started.

## Roles and independence

- Audit owner: owns scope, access, scheduling, containment, and release
  decision; cannot self-certify specialist findings.
- Accessibility specialist: experienced with the named platform and assistive
  technology; records observed barriers and exact reproduction steps.
- Keyboard/switch tester: completes tasks without pointer input.
- Child-session facilitator: holds safeguarding responsibility, obtains assent,
  stops on distress, and does not coach around defects.
- Note taker: records participant codes and observations without names,
  contact details, answers, account identifiers, or uncontrolled recordings.

One person may cover multiple technical roles, but the product author cannot be
the sole verifier for a critical or major finding.

## Required manual modes

| Mode | Minimum environment | Completion task |
|---|---|---|
| Screen reader | VoiceOver + Safari on current macOS/iOS and NVDA + Chrome on supported Windows | Complete sign-in, primary navigation, one learning task, one assessment task, one report, errors, dialogs, and recovery |
| Switch / keyboard-only | Keyboard plus a configured switch-control scan on one supported platform | Reach and operate every primary action, disclosure, dialog, game pause/exit, and recovery without pointer traps |
| Zoom 200% | Desktop browser at 200% text/page zoom and 1280×720 viewport | Complete each primary route with no lost content, overlap, two-dimensional page scroll, or off-screen completion control |
| Audio off | Browser and device muted | Complete all tasks using equivalent visual/text instructions; identify any audio-only prompt or feedback |
| Motion off | OS reduced-motion enabled before load and changed while open | Confirm no essential information depends on motion and animations/games honor the setting without blocking progress |
| Child usability | Consented/assented representative children with a safeguarding facilitator | Observe first-use and familiar-use completion, comprehension, recovery, fatigue, distress, and adult prompting without inferring emotion from screenshots |

Test current supported browsers and devices. Record exact OS, browser,
assistive-technology version, input method, viewport, zoom, audio, motion, app
release, curriculum version, and route/state ID.

## Calendar

These are target windows, not claims that people are booked or work is done.
The owner must record the actual date and participant/reviewer code in
`EXTERNAL.md`.

| Target date | Activity | Exit |
|---|---|---|
| 2026-08-03 | Adult test-data rehearsal and environment check | All accounts, devices, stop routes, and evidence forms ready |
| 2026-08-10 | Screen-reader and keyboard/switch run | Every inventory row attempted; blockers contained |
| 2026-08-12 | 200% zoom, audio-off, and motion-off run | Every inventory row attempted in each mode |
| 2026-08-17 | Child-usability first run, only after approvals/consent/assent | Stop rules followed; observations de-identified |
| 2026-08-21 | Triage, correction decisions, and independent retest plan | Every finding has severity, owner, due date, gate, and release decision |
| 2026-11-16 | First quarterly recurrence | Trigger review plus full high-risk-route sample |

Repeat quarterly thereafter, before a major launch, and whenever navigation,
assessment interaction, game controls, reports, typography/zoom behavior,
audio alternatives, motion behavior, or supported assistive technology changes.

## First-run procedure

1. Freeze the app release, inventory version, supported-platform matrix, test
   accounts, and non-production data.
2. Confirm local legal, school, safeguarding, consent, assent, privacy, and
   recording decisions before involving a child.
3. Run the unexecuted template in the current release issue; do not mark a mode
   complete from an automated result.
4. Record direct observation and task outcome, not inferred emotion or a
   facilitator’s workaround.
5. Stop an affected task on a critical barrier, privacy/safeguarding incident,
   or child distress.
6. Enter each finding into `docs/research/REVISION_WORKFLOW.md`.
7. Convert every mechanizable critical/major finding into a permanent failing
   release gate; independently retest the exact corrected release.

Human closure requires completed records, environment details, route/state
coverage, findings, containment, retest evidence, unresolved limitations, and a
named external owner. This prepared programme alone does not close the manual
audit.
