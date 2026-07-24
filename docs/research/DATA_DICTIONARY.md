# Pilot data dictionary and export contract

## 1. Privacy boundary

The canonical capture contains de-identified research fields only. Store the
participant-code identity key and signed consent records in the separately
approved controlled system.

The scripts reject keys named:

`name`, `firstName`, `lastName`, `fullName`, `email`, `phone`, `telephone`,
`address`, `postcode`, `postalCode`, `dateOfBirth`, `dob`, `studentName`,
`teacherName`, `parentName`, `guardianName`.

They also reject free text containing an email address or common international
phone-number pattern. Automated screening is a backstop; the data steward must
still review redacted comments and quotes before export.

Do not include:

- names, initials or contact details;
- exact date of birth or home address;
- school/class names;
- child photographs, audio, video or screen recordings;
- raw answer text;
- safeguarding disclosure details;
- production authentication tokens, database URLs or secrets;
- consent-form images or signatures.

## 2. Canonical JSON root

```json
{
  "schemaVersion": 1,
  "study": {
    "studyId": "LP-PILOT-001",
    "protocolVersion": "1.0",
    "packCommit": "git-sha",
    "appReleaseId": "release-id",
    "curriculumVersion": "curriculum-version",
    "exportedAt": "2026-07-24T12:00:00.000Z"
  },
  "participants": [],
  "sessions": [],
  "itemEvents": [],
  "usabilityObservations": [],
  "teacherFeedback": [],
  "deviations": []
}
```

Timestamps use ISO 8601 UTC with `Z`. Participant and staff codes are study
codes, not school IDs or stable product IDs.

## 3. Study

| Field | Type | Rule |
|---|---|---|
| `studyId` | string | Non-identifying registered study code |
| `protocolVersion` | string | Frozen approved protocol |
| `packCommit` | string | Repository commit containing this pack |
| `appReleaseId` | string | Tested deployment/release identifier |
| `curriculumVersion` | string | Frozen policy/item-bank version |
| `exportedAt` | ISO timestamp | Time the source capture was frozen |

## 4. Participants

| Field | Type/values | Rule |
|---|---|---|
| `participantCode` | string | Unique; pattern `P-` plus letters, digits or hyphens |
| `participantType` | `child` or `teacher` | Determines required consent fields |
| `ageBand` | `4-5`, `5-6`, `6-7`, `7-8`, `adult`, `not_recorded` | Band only; never exact birth date |
| `gradeBand` | approved local code | Avoid tiny identifying combinations |
| `multilingualLearner` | boolean or null | Definition frozen in protocol |
| `additionalSupport` | boolean or null | Broad flag only; no diagnosis |
| `cohortCode` | string | De-identified school/class cohort |
| `deviceClass` | `chromebook`, `tablet`, `desktop`, `phone`, `other` | Primary pilot device |
| `schoolApprovalRef` | string | Non-secret approval reference |
| `guardianConsentAt` | ISO timestamp or null | Required for child |
| `childAssentAt` | ISO timestamp or null | Required for child and refreshed each session |
| `teacherConsentAt` | ISO timestamp or null | Required for teacher |
| `withdrawnAt` | ISO timestamp or null | No events may occur later |

## 5. Sessions

| Field | Type/values | Rule |
|---|---|---|
| `sessionId` | string | Unique study session code |
| `participantCode` | string | Must reference one participant |
| `phase` | `familiarisation`, `pre`, `practice`, `post`, `retention`, `transfer`, `usability_first`, `usability_familiar`, `teacher_workflow` | Frozen phase |
| `startedAt`, `completedAt` | ISO timestamp | Completed must not precede start |
| `facilitatorCode` | string | Study role code, not a name |
| `appReleaseId` | string | Exact session release |
| `curriculumVersion` | string | Exact session content policy |
| `deviceClass` | permitted device value | Actual device |
| `accessibilityAdjustments` | string array | Approved controlled codes |
| `sessionStatus` | `completed`, `discontinued`, `not_administered` | Never infer incorrect from status |
| `assentConfirmedAt` | ISO timestamp or null | Required for every child session |

Retention sessions must occur 7–21 days after the participant’s latest post
session. Outside-window records are rejected from the canonical analysis file
and retained in the controlled deviation record.

## 6. Item events

| Field | Type/values | Rule |
|---|---|---|
| `eventId` | string | Globally unique immutable event code |
| `sessionId` | string | Existing session |
| `participantCode` | string | Must match session participant |
| `phase` | `pre`, `practice`, `post`, `retention`, `transfer` | Must match session phase |
| `skillId` | string | Canonical LiteracyPath skill ID |
| `itemKey` | string | Stable, versioned construct/item key |
| `formId` | string | Parallel-form identifier |
| `responseStatus` | `correct`, `incorrect`, `no_response`, `not_administered`, `discontinued` | Explicit terminal state |
| `latencyMs` | integer or null | Positive; used in primary latency only for independent correct |
| `supportStages` | array | Ordered values from allowed support list |
| `supportInitiator` | `child`, `adult`, `none` | `none` when stages empty |
| `isUnseenTransfer` | boolean | True only in transfer phase |
| `selfCorrected` | boolean | Preserved separately |
| `observedAt` | ISO timestamp | True item evidence time |

Allowed support values:

- `whole_word_audio`;
- `segmented_phonemes`;
- `reread_prompt`;
- `instruction_repeated`;
- `accessibility_adjustment`.

An unseen transfer `itemKey` must never occur for that participant in a
non-transfer phase. The validator fails the entire export when it does.

## 7. Usability observations

| Field | Type/values | Rule |
|---|---|---|
| `observationId` | string | Unique |
| `sessionId`, `participantCode` | string | Valid linked codes |
| `taskId` | string | Pre-registered task such as `U-NEXT` |
| `taskState` | `independent`, `completed_with_prompt`, `not_completed`, `stopped` | Observable state |
| `durationSeconds` | non-negative integer or null | No zero substitution for missing |
| `navigationErrors` | non-negative integer | Count from rubric |
| `adultPrompts` | non-negative integer | Excludes standard administration |
| `confusionCodes` | string array | Controlled codes |
| `accessibilityBarrierCodes` | string array | Controlled codes |
| `recoverySucceeded` | boolean or null | Null when no recovery task |
| `affect` | `comfortable`, `neutral`, `frustrated`, `distressed`, `not_observed` | Direct observation only |
| `quoteRedacted` | string or null | Optional, consented, screened and redacted |
| `observedAt` | ISO timestamp | Evidence time |

## 8. Teacher feedback

| Field | Type/values | Rule |
|---|---|---|
| `feedbackId` | string | Unique |
| `sessionId`, `participantCode` | string | Linked teacher session |
| `taskId` | string | Pre-registered workflow task |
| `taskState` | same usability states | Observable state |
| `durationSeconds`, `errors`, `helpRequests` | non-negative integer or null | Structured task measures |
| `confidenceRating` | integer 1–5 | Anchors defined in protocol |
| `workloadRating` | integer 1–5 | Anchors defined in protocol |
| `issueCodes` | string array | Controlled codes |
| `commentRedacted` | string or null | Optional screened text |
| `observedAt` | ISO timestamp | Evidence time |

## 9. Deviations

| Field | Type/values | Rule |
|---|---|---|
| `deviationId` | string | Unique |
| `sessionId`, `participantCode` | string or null | Use null if study-wide |
| `severity` | `critical`, `major`, `minor` | Revision workflow definitions |
| `plannedProcedure` | string | Protocol reference |
| `actualProcedureCode` | string | Controlled, non-identifying code |
| `reasonCode` | string | Controlled code |
| `affectedMetricIds` | string array | Declared outcomes |
| `analysisDisposition` | `include`, `exclude_from_metric`, `exclude_session`, `pending_review` | Frozen rule |
| `ownerCode` | string | Study role code |
| `occurredAt`, `reviewedAt` | ISO timestamp or null | Audit times |

## 10. Derived exports

`exportPilotDataset.mjs` creates:

- `participants.csv`;
- `sessions.csv`;
- `item_events.csv`;
- `usability_observations.csv`;
- `teacher_feedback.csv`;
- `deviations.csv`;
- `analysis-ready.json`;
- `export-manifest.json` with SHA-256 and row counts.

`summarizePilotDataset.mjs` creates descriptive JSON containing:

- recruitment/session counts;
- per-phase administered, correct, accuracy, independent-correct latency and
  support use;
- participant-level pre/post/retention/transfer metrics;
- pre-declared subgroup summaries with small-cell suppression;
- missingness and deviation counts;
- version/provenance fields.

It performs no imputation, significance test, causal estimate, mastery
classification or automatic release decision.
