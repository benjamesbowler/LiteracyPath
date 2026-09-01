# Task 5 — exact teaching and audio

## Delivered

- Frozen canonical `SOUND_POWER_IDS` uses underscore runtime IDs; instruction
  file slugs remain hyphenated.
- Nineteen Leda instruction recordings are committed with provenance, hash,
  duration, and real `ffmpeg` signal measurements. `SOURCE.md` leaves direct
  listening open (`humanListeningApproved: false`).
- Every one of the 103 stop targets receives unscored teaching before challenge
  evidence, retains its checkpoint index, resolves a replayable exact contract,
  and has child-safe labels from `graphemeLabel`. The three suffix targets use a
  dedicated morphology introduction and ending-specific examples.
- Delivery callbacks identify cue ID and session, distinguish started,
  completed, interrupted, failed, and unavailable, and reject stale/illegal
  reducer transitions.
- The normal instruction provenance gate rejects missing, changed-text,
  zero-duration, unprovenanced, and hash-mismatched clips.

## Contextual sound review boundary

The ignored `.artifacts/sound-seekers-contextual-unit-candidates` pack contains
15 unapproved local Google Chirp3 HD Leda IPA/SSML candidate clips (three
rate/pitch variants for each of five keys), an audio listening page, and a
machine-readable manifest with exact SSML, audio configuration, SHA-256,
duration, and signal measurement. Nothing was copied to `public/`, neither
audio manifest treats it as a phoneme bank asset, and every record remains
`humanListeningApproved: false` / `installedInRuntime: false`.

The preferred Kokoro route was attempted in ignored `.artifacts/kokoro-venv`.
The model downloaded, but its `espeakng-loader` wheel requested the inaccessible
build path `/Users/runner/work/espeakng-loader/espeakng-loader/espeak-ng/_dynamic/share/espeak-ng-data/phontab` before synthesis. The standard's explicit IPA/SSML fallback was then used and this exact blocker is recorded in the candidate manifest and review guide.
The failed local environment and stale Kokoro synthesis plan were removed after
the fallback pack was verified; no shared cache was touched.

All 21 blockers remain intact across exactly five keys: `schwa` (10),
`ear_lax` (5), `ed_id` (2), `ure_no_y` (2), and `once_onset` (2).

## Verification

- Focused Task 5, cue lifecycle, and pronunciation tests: 27 passing.
- Foundation suite requested by the task: 135 passing.
- `npm run check:quest`: passing.
- `npm run check:quest-release`: expected one blocker-only failure listing the
  exact 21 contextual records above.
- `node tools/generateSoundSeekersInstructionAudio.mjs --dry-run`: 19
  contracts, 0 stale/missing.
- Candidate pack check: 15 MP3s; 15 hashed, duration-positive,
  signal-positive, unapproved, and not installed.

## Remaining direct evidence

Human phonics listening, rights clearance, selection of masters, AI disclosure,
and physical-device/browser playback remain open. Automated tests and signal
checks do not substitute for those release gates.
