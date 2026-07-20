# Sound Seekers Human Evidence

This folder holds anonymised, integrity-sealed observation records. Never record a child or adult name, email, phone number, address, school identifier, date of birth, or internal student identifier. Codes use a fixed word plus digits only: `SESSION-014`, `OBS-02`, `ROOM-003`, and `CHILD-014`, `ADULT-006`, or `AUDIO-003` according to the profile. Do not put a name or location label after the prefix.

The aggregate release gate requires:

| Profile | Minimum evidence | Aggregate result |
| --- | ---: | --- |
| `child-first-use` | 8 sessions | At least 85% independent task comprehension, no more than two adult prompts on average, no severe frustration, and average enjoyment of at least 3.5/5. |
| `child-repeat-play` | 6 sessions | At least 90% independent comprehension, at least 80% voluntary replay, no more than one boredom incident on average, and average enjoyment of at least 3.5/5. |
| `reward-choice` | 8 observations | At least 75% independently choose and buy, recognise cumulative equipment, understand the relic purpose, and spend earned Sparks. |
| `teacher-report` | 5 observations | At least 90% interpretation accuracy, at least 80% select the sound evidence's correct next action, and average usefulness of at least 4/5. Parents and literacy specialists may also participate. |
| `classroom-audio` | 3 room profiles | At least 95% prompt intelligibility, with no score/cue masking or sensory-discomfort incidents. |

## Field console

Open `/preview/quest-evidence.html` from a release-preview build to collect observations without editing JSON. The console provides all five profile-specific forms, rejects incomplete and direct-identifier fields, seals each valid record with SHA-256, downloads the individual record, retains a verified local copy, imports existing records, rejects tampering and duplicated profile/session/participant codes, and shows the live aggregate matrix. Different participant codes may share one session code for paired testing. It is excluded from the normal child application build.

Every numeric measure must be answered explicitly, including a genuine zero. Each child and adult cohort must contain the required number of distinct anonymous participant codes; repeating one participant or one session cannot satisfy the release gate.

Every record uses this common envelope:

```json
{
  "schemaVersion": 1,
  "profileId": "child-first-use",
  "sessionId": "SESSION-001",
  "observedAt": "2026-07-18T09:00:00.000Z",
  "observerId": "OBS-01",
  "settingId": "ROOM-001",
  "consentConfirmed": true,
  "participant": { "anonymousId": "CHILD-001", "ageYears": 6 },
  "measures": {}
}
```

Profile measures:

- `child-first-use`: `tasksShown`, `tasksIndependent`, `adultPrompts`, `blocked`, `severeFrustrationIncidents`, `enjoymentRating`.
- `child-repeat-play`: the same fields plus `voluntaryReplay` and `boredomIncidents`.
- `reward-choice`: `independentStoreChoice`, `cumulativeGearRecognized`, `relicPurposeExplained`, `sparksAvailable`, `sparksSpent`.
- `teacher-report`: participant `role` (`teacher`, `parent`, or `specialist`) plus `questionsAsked`, `questionsCorrect`, `nextActionAccurate`, `usefulnessRating`.
- `classroom-audio`: `roomProfile`, `deviceModel`, `promptsPlayed`, `promptsUnderstood`, `maskingIncidents`, `discomfortIncidents`.

The console is the preferred field workflow. For terminal-only collection, complete a draft using `child-first-use.example.json` as the common shape, then run `npm run seal:quest-human-observation -- path/to/draft.json`. The import rejects incomplete fields, direct identifiers, and duplicate session files before sealing the record into this folder. Run `npm run check:quest-human-harness` to regenerate the current matrix and `npm run check:quest-human-acceptance` for the strict release gate.
