# SoundKeys authored instrument performance

SoundKeys now plays a complete 24-word performance at every difficulty. Every
performance visits three eight-word bands: Speedy and Clucky in the Meadow
workshop, Chompy/Sunny/Dozy in the fossil studio, then Pip/Wren/Fern in the
Moonwood organ hall. These bands are the existing session structure, independent
of difficulty. Native keys, whole-word pictures and recorded teaching clips
remain live; the target spelling appears only when completed. Two deliberate
spelling errors expose a partial hint. Errors retain the accepted prefix.

The full-screen Canvas composition uses three original deep venues, three
independent instrument kits and eight canonical 16-pose action sheets. A selected
key depresses immediately and the registered anatomical contact meets that
physical bar on the first rendered frame. Hold, release, recovery and finale
poses are distinct. Forepaw, wing-tip, forefoot and fingertip registrations use
the visible anatomy; Sunny remains a quadruped. Free instrument exploration
continues between word performances and never produces literacy evidence.

## Runtime and authoring authority

The leaf is `SoundKeysGame.jsx/.css` with `soundKeysWorld.js`, generated
`soundKeysArtData.js`, `soundKeysSession.js` and `soundKeysCueQueue.js`. Existing
`features/soundkeys` content, key/phoneme/MIDI mappings and input providers remain
authoritative. The standalone MIDI playground is unchanged. Shared registered
art, audio ownership, optional instrument duck gain, version exports and progress
bridge are owned by the parent integration.

`source-art/arcade/physical-worlds/soundkeys/scene-kit-v1.json` records exact
originals, prompts, runtime hashes/dimensions, source alpha bounds and registered
sockets. `key-registration-v1.json` is the sole measured registration authority.
`scripts/generate-soundkeys-art.py` and `soundkeysArtPacking.py` reproduce the
delivery bank. Six sheets whose original components cross nominal grid borders
are packed into independent 384 px cells; every opaque original main-body RGBA
value is preserved before WebP encoding. Lossy WebP RGB is not claimed identical
to PNG. No target words or UI are baked into scene art.

There are28 current WebPs totalling6,539,330 bytes. Per-band normal decoded RGBA is
25,735,628 bytes Meadow,41,643,860 bytes Dino and41,504,044 bytes Moonwood; the
hypothetical entire bank is118,173,260 bytes. Only the current band is resident.
Band changes release old images/action banks and reject stale decoder callbacks.
Eight independent original-idle performer fallbacks and six separately decoded
lower-resolution original scene derivatives remain playable on failed primary
art. Reload stage art preserves the exact word, prefix and response history.

## Learning, audio and recovery

The construct is `heard-word-ordered-grapheme-encoding`, version `soundkeys-v2`.
Practice is explicitly not formal assessment or mastery. A deliberate committed
key creates an immutable first response or assisted retry. Musical tones,
down-only input, free chords, hover, undo and motor play cannot create evidence.
Only a matching target-word/round receipt from the real owned Howler `end`
callback can claim delivered target audio at the response. Unit recordings and
synth notes are separate. The cue queue finishes the current unit before the
final word blend and keeps rhythm/instrument input immediately available.

The existing scoped practiceSession retains seed, journey, 24-round index,
originRound, prefix, errors, support and local audio receipts. Completion sends
immutable response/completion steps with matched receipts, excluding mutable
audio history. Legacy partial origins keep honest denominators. Replay, undo,
prior error, resumed practice and unavailable audio remain supported practice.
Pause, Tools, focus loss, page hiding and unmount cancel owned cues/held tones;
hidden time cannot advance the word dwell. Local quota failure exposes Try
saving again and retries the exact prefix/history snapshot. MIDI disconnect,
late permission settlement and unavailable AudioContext retain keyboard play.

## Retained verification

Eighteen focused art/contact/session/cue/instrument/lifecycle unit checks passed.
The five all-band native anchors passed in 42.36 seconds: all eight key contacts in
each band, freeplay separation, independent art failures/reload, and nine
completed-word phone/short frames. Direct pixel review shows separated faces at
320×568,320×340 and568×260; the original Clucky-over-Speedy finale failure is
retained with its corrected proof.

The complete owner run passed 8/9 in263.33 seconds, including all three 24-word
performances, held/chord/outside-pointer cancellation, browser-emulated MIDI
disconnect/reconnect, late MIDI grant cleanup, blocked teaching/synth audio and
quota retry. The remaining observer selected an intentionally CSS-hidden compact
hint in a wide viewport. Its corrected native case passed with exactly one
visible hint before/after real reload, unchanged prefix/two-wrong/first-response
history and assisted completion. That bounded rerun also matched the unchanged
quota case: 2/2 in4.57 seconds. These are nine passing owner scenarios across the
two honest runs; the original failure is not relabelled as passing.

| Ordinary-clock full outing | Easy | Medium | Hard |
| --- | ---: | ---: | ---: |
| Unique completed words |24|24|24|
| Wall time, seconds |80.004|85.697|75.826|
| Immutable responses with matched target receipt |72|72|74|
| Sustained frame samples |4346|4754|4156|
| Sustained mean/p95, ms |16.686/18.5|16.681/18.2|16.683/18.6|
| Sustained maximum, ms |52.0|35.1|34.7|
| Native key→next-rendered maximum, ms |14.0|14.9|12.6|

All outings use real native 1–8 input after visible bank selection and the
ordinary clock. No virtual tempo, controller advancement or answer injection
is used. Every first rendered input has an actual authored contact with
floating-point separation below .0001 px. Page errors were zero; all three replay
routes returned to round 0 with cleared prefix/score/response history.

Reports, exact frames/native WebMs and compact measurements live under ignored
`.artifacts/arcade-standard-upgrade/`: `soundkeys-all-band-v3-*`,
`soundkeys-final-owner-*`, `soundkeys-prefix-reload-corrected-*`,
`soundkeys-final-native-summary.json` and `soundkeys-all-band-encoded-proof.json`.
Root owns final mandatory 6+2 viewport/shared-control/whole-suite integration.
Browser-emulated MIDI proves the actual provider/controller lifecycle, not a
physical keyboard. Human listening, physical iPad, hardware MIDI and classroom
use remain UNKNOWN. Hosted release is a separate parent-owned verification.

Scoped cleanup removed only the exact duplicate registration, generated Python
bytecode and mistaken temporary Vitest runner cache after reference checks.
Original art/prompts, current derivatives, registration and failed/passing
native evidence remain active provenance/QC. Exact removal hashes and recovery
details are in `soundkeys-cleanup-ledger.json`.
