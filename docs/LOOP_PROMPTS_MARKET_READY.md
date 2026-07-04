# Five Loop Prompts — Market-Ready LiteracyPath

Paste ONE prompt per session, in order. Each follows the loop rule:
inspect → root cause → fix → check → re-check until clean → final gate →
hand me the push command. Never claim success without evidence.

---

## PROMPT 1 — Screen-by-screen layout & polish sweep

> Do a screen-by-screen layout sweep of every child-facing AND teacher-facing
> screen in the app. For each screen: render or reconstruct it (use the deck
> preview harness, static HTML previews in docs/previews/, or my Chrome via
> the extension where possible), and check it at three sizes — laptop
> (1440px), projector/TV (1920px+), and iPad (1024px). Hunt for: dead empty
> space, content pushed off-centre or down the page, narrow single columns on
> wide screens, cramped or overlapping elements, cut-off sections, mismatched
> spacing/radii/shadows between neighbouring screens, and any screen that
> still looks like "the old app" next to the new vibrant ones. Fix everything
> you find in student-vibrant.css or the owning stylesheet, re-verify each
> fix visually the same way you found it, and generate an updated set of
> before/after previews in docs/previews/ so I can spot-check. Loop until you
> find nothing new on two consecutive passes. Then run the full final gate
> and give me the push command. List every screen you checked and what
> changed on each.

---

## PROMPT 2 — Competitor research & design parity

> Research the current versions of Raz-Kids/Kids A-Z, Teach Your Monster to
> Read, Starfall, Khan Academy Kids and Duolingo ABC (use web search and
> fetch real screenshots/reviews). Produce a short comparison in
> docs/COMPETITOR_NOTES.md: how each handles (a) the child home screen, (b)
> lesson/level maps, (c) reward loops, (d) game feedback and celebration
> moments, (e) session flow for a 4-7 year old, and (f) the teacher
> dashboard. Then read the installed design skills in .agents/skills
> (design-taste-frontend, high-end-visual-design, redesign-existing-projects)
> and turn the research into a ranked list of concrete gaps in OUR app.
> Implement the top 5 gaps that need no new artwork, one at a time, with the
> loop (fix → verify → test) per gap. Anything needing new art or audio goes
> into a properly-specified Kimi request doc instead. Full gate, push
> command, and tell me exactly which 5 gaps you closed and which you queued.

---

## PROMPT 3 — Games: depth, testing and one new flagship game

> Play-test every game in the app by reading its logic end-to-end and writing
> unit tests that simulate full playthroughs (right answers, wrong answers,
> retries, edge cases like 1-word pools, blocked audio words, and repeat
> plays). Fix every bug, dead-end, unwinnable round, repeated question, or
> missing feedback moment you find. Then improve gamification per game:
> difficulty that ramps within a session, celebration moments that scale with
> streaks, and a reason to replay (beat your score / earn gems). Finally,
> design and build ONE new flagship game using only existing art and audio —
> pitch me 3 concepts first with a one-line description each and wait for my
> pick before building. New game must have full unit tests, mission/reward
> integration, and an entry in the arcade. Loop everything until tests and
> the full gate are green, then give me the push command.

---

## PROMPT 4 — Educational content & curriculum correctness audit

> Re-audit ALL educational content against the EL curriculum data as the
> single source of truth: every quest round type, deck slide, worksheet,
> game word pool, book level, poem, and assessment bank. Check specifically:
> (1) nothing tests a letter, sound, or word before the cycle that teaches
> it; (2) every spoken cue matches what is displayed; (3) distractors are
> fair (no giveaways, no impossible items); (4) reading levels of books match
> their banding; (5) instructions a 4-7 year old hears are consistent across
> the app ("tap", not a mix of "tap/click/choose"); (6) anything a teacher
> projects is accurate enough for a classroom. Where audio quality can't be
> verified in code, extend the ear-check pages in docs/previews/ so I can
> verify in minutes, and wire anything I report into the existing blocklist
> system. Write new unit tests that lock in every rule you verified. Loop
> until two full passes find nothing, then gate + push command.

---

## PROMPT 5 — Market-readiness QA: usability, resilience, performance

> Final pre-market QA pass. (1) USABILITY: walk every child flow as a
> 5-year-old would — count taps to start learning from login, find any
> dead-end screens, unlabelled buttons, text a non-reader can't act on, or
> states with no way back; fix them. (2) RESILIENCE: test what happens with
> slow network, missing media, double-taps, mid-game refresh, two students on
> one device, and a teacher reset mid-session; every failure must degrade
> gracefully (no blank screens, no broken-image icons, no lost progress).
> (3) PERFORMANCE: audit bundle sizes and startup on a school-grade device —
> code-split the biggest chunks flagged by the build, lazy-load what students
> don't need at login, and verify the audio manifest and images aren't
> blocking first paint. (4) ACCESSIBILITY: keyboard/focus states, contrast,
> reduced-motion behaviour (teaching animations still play, decoration
> calms down). Add regression tests or checks for each class of fix so it
> can't come back. Loop until the full gate plus your new checks are green
> twice in a row, then give me the push command and a one-page
> MARKET_READINESS.md verdict with anything still outstanding.

---

**Standing rules for every prompt above:**
- Never change educational logic or Supabase structure without asking first.
- Never overwrite approved media; anything needing new art/audio becomes a
  precise Kimi request doc.
- Never claim done without: unit tests green, ESLint 0 errors, and the full
  final gate output pasted or requested from me.
- Always end with the exact copy-paste push command.
