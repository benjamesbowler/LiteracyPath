# Story Quest production contract

The current catalogue is `src/data/storyQuests.js`. The Story Bible Parts I and
II govern its writing and character canon. This document defines the shared
reader and production workflow; it replaces the dated July rewrite notes and
blueprint generator, which contained superseded prose and routes.

## Manuscript and routes

Keep all fourteen story identities. Each book has one concrete goal, a readable
obstacle, actions that change the situation, and earned endings. A child’s
choice of quiet, space or a different companion is valid and remains visible.
Use **Next** between meaningful forks. Every authored scene must be reachable,
and all routes must obey the reading band and preserve the state of companions,
props, clues, weather, injuries and magical rules. Branches may merge only after
the chosen action happens and their incoming states are compatible.

Early is a declared short-a decoding track, separate from Level A. Maintain
natural grammar with explicitly declared exception words. Navigation, hooks and
spoken choices receive their own recorded support; they do not become evidence
of independent decoding. Moonwood Quests use the compact present-tense C profile,
not the longer past-tense Guided Reading paragraph profile.

Store a meaningful `imageAlt` per scene, `shortTitle` and `hook` per book, and a
`replayPrompt` at each ending. A dedicated cover invites the reader into the
problem without revealing its solution. Never substitute the opening image for
an authored cover. A content revision invalidates unsafe older route resumes;
previous exposure/completion remains history, not a mastery claim.

## Child reader

- Story prose is visually primary and retains natural spacing and punctuation.
- Each displayed word has explicit whole-word support. **Hear the letters** is
  a separate action and is never labelled blending or sounds.
- Sam/Pam's six picture-word cards show the matching meaning picture in word
  help. Picture support and heard words remain supported practice, not mastery.
- Choices have separate hear and select controls. Hearing never selects a path.
- The child sees their scene position; vocabulary exposure is retained for
  reporting and never used as a story-completion bar or a mastery score.
- The ending retains its illustration and prose after Finish. A replay invitation
  refers to the story; the shelf offers Continue or Read again, never a false lock
  or a claim that one ending exhausts the book.
- Full screen uses its remaining height for the complete illustration. Short
  passages sit below it above the path controls; longer passages use a separate
  column at roomy widths. Menu controls never reduce the picture to a fixed
  viewport-height cap.
- Small displays may scroll the complete reader to preserve readable type and
  the entire illustration. They must not crop essential evidence, shrink prose,
  or trap text in an internal scroll box. The shelf keeps its existing paged hub.
- Playback is optional, interruptible and stops on exit. Music does not start.

## Media and verification

Settle the manuscript and route-state ledger before final art and audio. Resolve
character references against runtime-connected source art and the current canon;
a disconnected file called master or reference is not authority. Lock each cast,
recurring prop and location before rendering scenes. Inspect each resulting asset
at its actual display size and in sequence. Record exact paths and hashes only
after inspection. Generated reports and work receipts belong in `.artifacts/`.

`tools/generateStoryQuestLedaAudio.mjs` owns exact Leda audio for story text,
words, hooks, prompts and choices. Its current-text catalogue is the reader’s
first selection path. Changed wording cannot retain a stale recording. Validate
speech signal, decoding, replay/interruption and actual requested asset paths.
Record listening evidence separately from machine checks.

`tools/syncStoryQuestMediaQa.mjs` rebuilds only the Admin Media QA Story Quest
rows from the current manuscript and exact narration manifest. Run it after
authored text or media changes; `--check` verifies that the checked-in inventory
is current without writing. Unrelated rows and existing review statuses are
preserved. A changed content/media fingerprint clears obsolete observation
claims while keeping reported defects quarantined. Historical rows are retained
as ignored sync receipts. Stored review decisions must not overwrite current
story text, image paths or narration metadata.

Run Story Quest integrity and reading-band checks, the story content policy,
current visual/media gates, relevant unit and browser tests, and the repository
regression profile. Traverse every finite route for state coherence and inspect
phone/tablet/laptop rendering. Preserve the pass-by-exception review policy:
missing human-observation metadata is not a personal approval queue, and known
reported defects remain open until their correction is verified.
