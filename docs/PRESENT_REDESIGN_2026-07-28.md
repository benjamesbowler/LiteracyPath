# Present mode: whole-class cycle lessons

Present offers five teacher-led lessons for each of the 27 numbered EL cycles,
with three formats: Daily lesson, Explore further and Quick revisit. The 15, 25
and 8 minute values are initial planning budgets. They are not observed lesson
durations. All 405 choices derive from one lesson assembly. The whole-cycle
option is an untimed resource collection; assessment weeks retain separate
routine decks. Poems remain excluded.

## Curriculum and sources

`elSkillsBlockCycles.js` owns cycle order, letter introduction days,
high-frequency words and Friday practice/check designations. Present follows
that sequence and does not change learner placement or formal assessment
scoring. These are local whole-group adaptations, not official EL lesson
reproductions or replacements for differentiated groups.

The adaptation's classroom sources include the Cycle 3 whole-group Lessons 1–3
decks in `Desktop/EL Sea Lions/EL Week 3`, the app's cycle-specific letter and
clay mats, and the [EL Skills Block Resource Manual](https://eleducation.org/documents/1619/Curriculum_Tools_K2_Skills_Block_Resource_Manual-0124.pdf).
Where a source deck's letter order differs, the current app cycle record owns
the assigned teaching days. The October 2026 implementation follows the audit
and implementation guide in the authorised Present audit workspace; this file
remains the current checked-in Present contract.

## Lesson assembly and review

All daily formats retain complete cumulative sound and high-frequency-word
review by default, current-letter finger tracing, picture vocabulary, shared
sentence reading, word pairs, whole spelling attempts and picture-word matching.
A teacher may deliberately choose focused review. Its private coverage ledger
lists exactly the included and omitted spellings and words. Focus selection
changes practice coverage only; it does not mark omitted content reviewed or
change placement.

Monday and Tuesday introduce assigned letters; Wednesday introductions remain
where the curriculum assigns them. Daily review includes every earlier spelling
and the current spellings introduced by that day, in sets of at most eight.
High-frequency review preserves authored case, including `I`, and includes the
weekly targets and all prior targets. Review cycles trace familiar letters;
pattern cycles trace eligible sequences. Fluency cycles introduce no new letter.
Check Fridays remain whole-class practice; administer the formal Cycle Check
separately.

The named oral schedule in `presentTeachingContent.js` deliberately presents
both declared oral skills daily in core and extended lessons, alternating which
comes first. Quick revisit selects one skill per day with the authored Monday
to Friday 3:2 alternation. The coverage dashboard counts actual generated
occurrences, rather than inferring coverage from the curriculum labels.

The five planning blocks cover oral warm-up, sound retrieval/formation,
high-frequency words, language/reading/spelling and cooperative application.
The teacher console exposes all selected activities in those blocks. Its
response allowance defaults to 12 seconds per response turn and its modelling/
transition allowance to 20 seconds per slide. Both allowances and the teacher's
1–180 minute planning budget are editable without resetting the current
activity. Block estimates display tenths of a minute; the total rounds up to a
whole minute. Estimates disclose their basis. The optional elapsed clock is
separate and is not a classroom observation receipt. A lesson whose estimate
exceeds its budget says so; retain full review or deliberately select a subset
and continue later from a saved boundary.

## Teaching routines

| Routine | Child response and teaching boundary |
| --- | --- |
| Hear, map, build | Hear the whole word, move counters, deliberately reveal sound boxes, then reveal shuffled spelling tiles. `ship` has three phonemes; `box` has four and three spelling tiles. Eligibility follows taught code. |
| Change one part | Authored grapheme operations specify substitute/add/delete, position and old/new units. Children write or arrange a draft; a volunteer edits a retained board draft. Check, model reveal, next change and reset are deliberate. |
| Read, pair, use | Read two revealed HFW cards. Leave a mismatch visible until the next deliberate turn. A fresh round reshuffles valid pairs; use a matched word in a fresh phrase and retrieve it in a separate audio-to-print activity. |
| Vocabulary detective | Authored definition, image/action, example, non-example, gesture, partner frame and later retrieval stay within one meaning objective. For under, choose between the same cat below/on the same table; preserve the chosen scene until a deliberate teacher explanation. Hide the model for a different dog-under-table scene, then offer a separate expressive frame. Accept pointing/acting before requiring English sentence production. |
| Read, change, show | Keep scene hidden while reading `A cat sat.`; change the action to `ran`, reread, then reveal the matching scene. Before the prerequisites are taught this is explicitly supported shared reading; after them it may be child reading. Adult capitalisation/punctuation guidance remains explicit. |
| Sound and word detective | Manipulate the exact authored compound part, syllable, onset/rime or phoneme. Three-syllable records include dialect/IPA, spoken units, removed indices and expected spoken remainder. A remainder may be a nonword sound chunk. |
| Sort and justify | Teacher selects an eligible semantic, initial-sound or print-pattern objective. The selected lesson names one rule and carries its exact cards, headings, rationale and print mat. Sound-sort print is hidden and spoken-word replay is available. |
| Trace, hide, write, compare | Watch the pencil or use the retained preparation audio for Write with me. Trace on the board/palm/in the air, then deliberately hide the model and write on paper. Compare start, direction, sequence and legibility; no handwriting score is inferred. |
| Tell the story | Retell the original seed–water–sprout story, order the three distinct event scenes and explain the causal connection. Preserve a wrong sequence for discussion; offer two neighbouring scenes within the same objective. |
| Help our Pal pack | Read supported labels for three concrete useful objects (cup, bag, pen). Everyone chooses before the volunteer packs. Errors lose no lives or turns. Correct packing shows the object; the fresh exit response supplies the teaching handoff. |

Every activity supplies an all-child response cue and private Model → Practise
together → Try → Explain → Apply controls. Teachers may repeat a stage. Default
retrieval is silent; replay does not advance a response. Deliberately selecting a
model marks support in the teacher guidance. Whole-class echoes, pointer
completion, matching pairs and board taps remain participation, not independent
mastery evidence.

## Reading, spelling and language

`presentVocabulary.js` owns 54 shared-reading captions with exact sentence
transcripts, caption-specific meaning questions and accepted responses, plus
separate vocabulary retrieval cues. Pictures are labelled proposition scenes,
action support or vocabulary support according to what they actually depict.
A noun picture does not silently become a complete sentence illustration. The
incorrect smiling-child crying picture is quarantined from Present; the
inspected crying scene supplies that cue. One singer supports the action in
`We can sing a song`; the teacher view discloses that it is not a full plural
scene. Original matching seated/running cat scenes are retained with source art
and provenance. The existing seed sequence depicts planting, watering and a
sprout in three distinct original scenes.

Sentence replay and word tracking are separate actions: Hear the sentence,
Point to the next word and Reset word pointer. A completed pointer explicitly
leads to a meaning response. Narration is one exact natural sentence recording,
never a concatenation of isolated words. Missing exact recordings retain named
required-role entries and a visible recoverable teacher-model state. The
current generated narration manifest owns recording availability, provenance,
full-decode evidence and actual listening state; caption gaps update with it.

High-frequency words retain their order and pairs mechanic. Each has meaning,
a short phrase, private phoneme/mapping guidance and regular/exception parts.
The child model shows spelling parts with a non-colour attention mark rather
than IPA. Hide–write–compare covers the word, tiles, mapping hints and all target
occurrences in the example sentence. Silent retrieval hides mapping hints.

Spelling withholds the printed target and uses the exact whole-word cue.
Default whole-attempt mode retains every selected part, including incorrect
parts, until Check or a deliberate repair. Repeated tiles have separate IDs.
Undo and Reset preserve the round's tile order. Guided mode and the deliberate
supported model remain available and are labelled supported. A middle-sound
correction is used only for an observed single middle mismatch; other errors
receive whole-word comparison guidance. Taught code/day boundaries gate CVC
and pattern words. Before a CVC word is available, a taught HFW is explicitly
modelled. A spelling tile need not equal one phoneme.

Gesture, object, seated movement, partner frames and an optional local
teacher-authored home-language bridge provide language access. Semantic,
sound and print sorts remain separate constructs. Movement has a constant
stand/point-up vs sit/point-down rule and a seated equivalent; return to quiet
listening before fine phoneme discrimination. Support and stretch instructions
retain the same target rather than changing its construct.

## Private workspace, print and media

The private presenter console shows current target, next prompt, reveal state,
media state, teaching stage and optional pacing. Preview and projector report
actual state. Plan-only navigation changes the selected slide; unavailable
stage/reveal/audio actions state that a preview or projector is needed. An
opaque launch-session ID isolates identical lessons in different workspaces;
no learner identity enters the scoped message/channel protocol. Popup close and
fallback-tab disconnect clear the connection state.

Quiet teaching defaults on and is remembered on the device. It suppresses
nonessential motion/effects while preserving teaching speech and thinking time.
Speech has an independent switch; muted available speech is distinct from
missing media. A single deck audio owner handles play/end/error/cancel, rapid
replay, watchdogs, stop, deliberate pause/resume and stale callbacks. Navigation
cancels audio/animation; screen blanking and tab hiding preserve paused audio
position and thinking-time remainder. Return does not automatically replay
speech. Teacher navigation uses viewport pixels and native keyboard controls;
child stimuli retain the fixed 1920×1080 canvas and self-hosted Andika.

The selected-lesson media check fetches and completely decodes images/audio,
including hidden future scenes and required missing-role rows. It offers a
speaker test, retries and explicit fallback. Decode success does not mean
heard, correctly articulated or classroom audible. Broken essential pictures
show Retry, Teacher model or Skip, preserve the activity and never create child
error feedback. A teacher model is recorded as supported access.

Print button and keyboard printing use the same exact assembly: counter mats,
shuffled/repeated grapheme tiles, picture choices, selected sort cards/headings,
sentence scene pairs, retell scenes and memory-writing prompts. Answer models
and teaching scripts are in the private teacher portion. Budget and pacing
allowances are the same ones selected in the workspace.

The author view combines student prompt, private answer/script, code status,
semantic audio/image records and an inspectable current preview control tree.
It honestly labels that inspector as a partial live view, not a complete
accessibility certification. The curriculum dashboard generates 405 actual
lesson rows with oral occurrences, included code/HFW, language constructs,
variant/media warnings and time estimates.

Observation states are lesson-local and target-specific: independent, with
support, not yet, not sampled and media interrupted. They identify no child and
persist no student data. Fresh exit prompts match the opening meaning target;
recommendations depend on the actual sampled state. Unsampled/choral/game
completion does not become attainment or placement evidence.

## Verification and classroom improvement

`presentationBuilder.js` derives plan, outline, manifest, preview/projector and
print. `presentationActivities.js` assembles authored routines;
`presentTeachingContent.js` holds oral/HFW/box/chain/sort/story contracts.
`public/present/audio.js` owns instructional audio lifecycle and
`public/present/deck.js` owns activity state. `PresentPage.jsx` owns private
session controls, author preview, media check, print and local observation.

Semantic unit and focused browser checks enumerate all 405 choices; validate
units, code gates, exact transcripts/required-role coverage, seeded choice
variation, named grapheme/HFW teaching occurrences and language objectives,
repeated tiles, retained wrong attempts, hidden answers, timer/media
failure behaviour, real popup paths, session isolation, actual pointer tracing,
viewport controls and representative rendered activity fit. Current required
repository profiles and independent review remain release evidence. Automated
checks are separate from deployment and physical-device/classroom proof.

The October 2026 classroom trial sheet records early Cycle 1, middle Cycle 15
and late Cycle 27 across core/extended/quick formats. Each trial must record the
selected objective/code, opportunities, actual duration, participation/access,
unclear instruction/media, back-row viewing/listening and a fresh response
sample. Record each problem, its revision and a retrial outcome. Leave all
actual observations unobserved until a real lesson happens. Do not upload
identifiable child data or recordings for this purpose. A complete automated
pass alone does not satisfy I24 or justify 10/10 classroom readiness.

The local audit evidence includes `.artifacts/present-completion/classroom-trial-sheet.html`
and its blank `classroom-trial-template.json`. The editable sheet downloads and
reloads anonymous local JSON, and prints all nine trial forms. It starts with
every actual trial state unobserved; no browser test changes the real evidence.
The matching 48-item tracker separates software state, acceptance status, exact
test/source receipts and any remaining external requirement.
