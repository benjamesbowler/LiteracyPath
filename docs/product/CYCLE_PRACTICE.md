# Cycle Practice

Cycle Practice is LiteracyPath's original, teacher-controlled practice area for one phonics/word-work cycle. The name deliberately avoids presenting it as an official EL Education product or form.

## Learning contract

The teacher can start Cycle Practice for the whole active class or selected students. The teacher chooses one cycle for everyone or an exact cycle for each student. Each child's iPad is held inside the Cycle Practice route for the session; the app lock is an in-app focus lock, so Apple MDM or Single App Mode is still a separate device-operation control.

Each session has two parts:

1. At least 30 minutes of cycle-bounded practice.
2. A Cycle Check with one independent first response recorded for each check item.

Practice reuses the reviewed Cycle Quest mechanics and the cycle's own content. Depending on the cycle, this includes matching letter forms and sounds, initial or ending sound picture sorts, tracing a letter or grapheme, rhyming/word play, sound boxes and segmentation, word chains, and joining or breaking compound-word parts. Every mechanic uses the existing image and production-audio resolver where the authored item has approved media, with an explicit supported alternative or unscored unavailable-media record when required audio cannot be delivered. Connected-print word finding remains a separate Poem activity in Adventure Map; it is not part of Cycle Practice or its check.

The result is saved against the teacher-controlled session through an RPC that checks the assigned cycle, the 30-minute minimum, the check payload, and the student token. A non-session teacher preview retains its result on the device only; it does not enter the learner progress queue or claim teacher acknowledgment.

## Practice, timing and check blueprint

Policy v2 is defined by `src/policy/cyclePracticePolicy.js`; [Learning policy](../design/LEARNING_POLICY.md#cycle-practice-activity-and-check-evidence) defines the explicit foreground, pause and idle rule. Duration is client-reported activity, bounded by server session time, not proof of learning. Check time never increases practice time.

`src/components/cycle-practice/cyclePracticeState.js` owns the Cycle-only blueprint. It excludes poem tracking and support-only phrase rehearsal before choosing check items, includes every remaining eligible construct, then fills to ten where content permits. The display and saved manifest use the actual item count. No mixed-cycle score establishes every named skill as secure.

Practice passes rotate through each station's full eligible pool before repeating; answer arrangements change with the pass. Wrong responses stay on the same item for coaching and supported retry. First-response records remain intact, and subsequent passes revisit mappings after intervening activity. Check responses get neutral transitions; coaching appears only after submission in the teacher's **Practise next** panel.

The learner can pause/resume; refresh retains the session, pass, current item, support history and check responses. The final payload is frozen once. Retry uses the same attempt ID and answers, including after a network interruption or renewed learner sign-in. Server acknowledgment is distinct from local storage. Supported and media-failed items remain unscored and make independent check evidence incomplete. Teacher results disclose the independent denominator, support/media counts and separate durations; CSV exports retain those distinctions.

## EL-aligned research boundary

EL Education's official K-2 Skills Block materials describe modules as a series of cycles, with repeated instructional practices followed by a cycle assessment and goal-setting. The official implementation guide describes a typical one-hour block as whole-group instruction plus differentiated small-group/independent work. LiteracyPath uses those structural ideas while keeping the Cycle Practice content, media, UI, and assessment records original to this product.

Sources:

- [EL Education: Implementing the K-2 Reading Foundations Skills Block](https://curriculum.eleducation.org/sites/default/files/curriculumtools_implementingthek-2readingfoundationsskillsblock_052217.pdf)
- [EL Education Grade K Skills Block curriculum](https://curriculum.eleducation.org/curriculum/ela/grade-K/skillsblock-2)
- [EL Education K-2 Skills Block Resource Manual](https://eleducation.org/documents/1619/Curriculum_Tools_K2_Skills_Block_Resource_Manual-0124.pdf)
- [EL Education Grade 1 Cycle 18](https://curriculum.eleducation.org/curriculum/ela/grade-1/skillsblock-3/cycle-18)
