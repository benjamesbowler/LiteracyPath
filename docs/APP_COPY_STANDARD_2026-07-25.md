# App-Wide Copy Standard — plain words, everywhere
**Adopted:** 2026-07-25 · **Teacher taxonomy updated:** 2026-07-27
**Scope: THE ENTIRE PRODUCT.** Every string a human can see: student screens, teacher screens, parent-facing reports, assessment runner, dialogs, toasts, empty states, errors, tooltips, emails, exports, printables, accessible names read by screen readers. The Students-page rewrite in §6 is the *worked example*, not the scope. Treat any surface whose copy violates this standard as a bug, wherever it lives.
This standard changes surface language only. It does not change the underlying
models, current thresholds, or class-average calculations.

**Current teacher terminology:** use **student / students** and **assessment /
assessments**. This replaces the original child/check wording on teacher-facing
surfaces following the owner's explicit 2026-07-27 direction. Student-facing
copy remains age-appropriate and normally avoids both words.

---

## 1. Universal rules (every audience, every surface)

1. **The umbrella product name is “Literacy Guide”.** “Little Literacy Guides” is the child-area sub-brand. “Literacy Path” and “LiteracyPath” are retired display names and must never reach a screen, install label, browser title, public page, report, export, printable, accessible name, or authored credit. Lowercase legacy technical identifiers may remain only where changing them would break package, deployment, cache, database, or saved-browser-data compatibility; they never render. `src/data/teacherBrand.js` is the runtime name authority, and `npm run check:product-brand` enforces the public and install surfaces.
2. **Name things by what the person does or gets — never by internal mechanism.** "Saving & syncing", not "Evidence delivery". "Results", not "learning events".
3. **One name per concept, product-wide.** Sign-in (never login/access on surfaces) · assessment (teacher surfaces; never checkpoint/check) · results (never evidence) · class code · coins · Sparks. Student-facing copy normally names the task itself ("Find the sound", "Read this page") instead of saying assessment. If two screens disagree, that's a bug — fix toward this doc.
4. **Internal identifiers never render.** No range labels ("Kindergarten BOY: Middle Pre baseline" — D-007), no content slugs ("level-c", "moonwood-tales", "longer-story-pages" — A1.7), no status tokens ("not-assessed"), and no raw policy thresholds ("70% required"). If a value comes from a catalog/config field, it must pass through a display-mapping function — rendering a raw config string to any human is banned.
5. **Sentence case everywhere.** Buttons start with verbs. No Title Case Headings.
6. **Numbers read as sentences:** "3 of 24", never "3/24" (teacher/parent surfaces). Students get words or pictures, not fractions.
7. **Empty states say what to do next** (one sentence + the button that does it). **Error states are three beats:** what happened → what it means for their stuff (usually "nothing is lost") → the action. Never expose transport ("RPC", "telemetry", "in this browser").
8. **Every string lives in a copy module** (`src/copy/childCopy.js`, `teacherCopy.js`, `familyCopy.js`), not inline in components — one home for audits, consistency, and future translation. Migrate as you touch each surface.

## 2. Register A — Students (ages 4–7)

The student may be a pre-reader. Assume every string is **heard** (paired audio) or **decodable/sight-word simple**; never rely on a student reading a word they haven't been taught to decode.

- ≤ 8 words per line; one idea per line; concrete words only ("Tap the sound you hear", not "Select the matching phoneme").
- Buttons say the action a student understands: "Play", "Read to me", "Hear it again", "Try again", "My Hollow".
- **Never negative labels.** "Not yet — try again!" is fine; "Wrong", "Failed", "Needs teaching" must never reach a student's screen.
- No abbreviations, no parentheses, no ellipses-as-meaning, no internal names (trail ids, level letters, series slugs — A1.7: show a friendly level badge instead).
- Warmth without noise: at most one "!" per screen; celebration copy names what they did ("You built the word!").
- Accessible names (screen readers) describe the *active surface*: "Close Make your creature", not "Close Sound Seekers" (A2.10).
- Progress shown as pictures/words ("2 more to go"), never "3/5".

## 3. Register B — Teachers (busy, non-technical)

1. A teacher new to the app must understand any label in **under 5 seconds without the tooltip**. The ⓘ adds precision; it never rescues a bad label.
2. **Banned on surfaces** (word-boundary, case-insensitive): *evidence delivery, learning event, telemetry, sync health, policy, policy-ready, learner-weighted, response-weighted, cumulative, roster administration, access activity, evidence trail, drill down, provenance, contract, scope, baseline (as a label), BOY/MOY/EOY (abbreviations)* — and **"learner(s)" or "child/children" → "student/students"** on teacher-facing surfaces.
3. **Policy thresholds are never printed on the surface.** "0 of 2 required policy-ready learners; 70% required" → "This appears once at least 2 students have completed enough assessments to be measured fairly." Exact rule goes in the ⓘ.
4. **The ⓘ tooltip contract** (satisfies A6.6): every metric's tooltip answers, in ≤3 short lines: **what it counts · over what time window · what it does NOT include.** The same three lines ship inside exports next to the figure. Weighting formulas, thresholds, policy versions live here — never on the surface.
5. Assessment-runner scripts (D-005): every item shows a real task heading + an imperative teacher directive ≥16px ("Say aloud: 'Do *moon* and *spoon* rhyme?' Never show this screen."). "SAY EXACTLY" blocks keep their styling; the directive explains what the student should do.

## 4. Register C — Parents / family (reports, printables, notes home)

- Strengths-based and action-oriented: what the child worked on, 2–3 things now secure (plain words), ONE thing to practise at home, books read. (A7.10)
- No percentages without context, no status jargon, no gamification currency, no internal skill names — "the 'sh' sound in ship", not "digraph sh (s9)".
- Reading age ~ non-specialist adult; may be read via translation apps, so short sentences, no idioms.

## 5. Register D — Admin / developer surfaces (the ONLY jargon zone)

Admin QA consoles, release dashboards, content tooling may use precise internal vocabulary — that's their job. Rule 3 (raw config strings) still applies where an admin surface is reachable by teachers.

## 6. Worked example — the Students page, line by line (current → replacement)

### Navigation
| Current | Replace with |
|---|---|
| Today / Classes / Assess / Progress / Plan/Resources / Admin | **Dashboard / Students / Assessments / Reports / Resources / Settings** |
| Student Page | **Student preview** (with the "Previewing as…" banner, plan A5.9) |

### Header, school, code, board
| Current | Replace with |
|---|---|
| "Classes — Manage Trial's roster, access, and class settings." | "**Students** — add students, set up sign-in, and see how Trial is doing." |
| "SchoolBens0 students" | "School: Bens · 0 students" |
| Class code explainer | "Students enter this on their device to sign in. Keep it inside the classroom." |
| "Automatic expiry / No automatic expiry / In 7 days…" | "**Code expires:** Never · After 7 days · After 30 days · After 90 days" |
| "Checking recent access activity..." / "View access history" | "Checking recent sign-ins…" / "See sign-in history" |
| "Class nicknames — Children only see generated Reader nicknames. Class-only is the privacy default." | "Students appear under friendly made-up nicknames — never real names." |
| "Include this school" | "Show the whole school's board" (sub-line: "Off = your class only.") |
| "Could not load class dashboard." | "We couldn't load this page. Your class data is safe — check your internet and try again. **[Try again]**" |

### First-time checklist
| Current | Replace with |
|---|---|
| "First class setup — Four steps to your first useful result. Progress comes from saved class data, so it stays accurate on every device." | "**Get set up in four steps** — do these once, and results appear on their own." |
| "Create a class — Use the class name your learners already know." | "Create your class — use the name your students know, like 'Willow Class'." |
| "Add or import learners — Use English names or classroom nicknames, never surnames." | "Add your students — first names or nicknames only, no surnames." |
| "Set login pictures — Every learner needs three teacher-set pictures." | "Choose sign-in pictures — each student signs in by tapping their three pictures. You choose them." |
| "Run the first check — One recorded response makes the evidence trail live." | "Do your first assessment with one student — results appear as soon as you save it." |
| "Continue: Add or import learners" / "Done / Next / Waiting" | "Next: Add your students" / "Done / Next / Later" |

### Sync panel (worst offender)
| Current | Replace with |
|---|---|
| "Evidence delivery" | "**Saving & syncing**" |
| "Learning event sync health" | "Are students' results reaching your dashboard?" |
| "Trial · cumulative delivery from devices seen in the last 7 days" | "Devices used in the last 7 days" |
| "Sync health unavailable — Health telemetry could not be loaded. Learner evidence is unchanged; retry when the connection returns." | "**Can't check right now** — we couldn't reach the server. Nothing is lost: results are safe on students' devices. **[Try again]**" |

### Summary tiles
| Current | Replace with |
|---|---|
| "Students 0" | "Students — 0" |
| "Logins ready 0/0" | "Ready to sign in — 0 of 0" |
| "Started 0/0 ⓘ" | "Have played — 0 of 0" · ⓘ "Students with at least one saved answer, ever." |
| "Learner-weighted (0) Not checked" + "Response-weighted (0) Not checked" | **One tile:** "Class accuracy — not enough results yet". Expanded view still shows both figures (A4.3 unchanged) relabelled "**Averaging students equally**" / "**Averaging every answer equally**", each with counts. |
| "Active today 0/0 ⓘ" | "Played today — 0 of 0" · ⓘ "Any saved activity today, school timezone." |
| "No single class average: 0 of 2 required policy-ready learners; 0% of learners are policy-ready; 70% required." | "A class average appears once at least **2 students** have completed enough assessments to be measured fairly." · ⓘ carries the exact rule. |

### Groups + bottom
| Current | Replace with |
|---|---|
| "Class groups — Drill down without leaving Trial" | "**Groups** — open a group to see those students" |
| "Whole class / Needs attention / Not started / Active today" | "Everyone / **Needs support** / Not started yet / Played today" |
| "Question type guide" (inline on dashboard) | "**What each assessment measures**" — moved into Help / ⓘ system (A6.3) |
| "Roster administration — Add, import, transfer, archive, or change learner logins. 0 active learners" | "**Manage students** — add, move, archive, or update sign-in. 0 students" |

## 7. Known offenders elsewhere in the app (sweep these with the same rules)

- Assessment runner: "Kindergarten BOY: Middle Pre baseline" (D-007) → "Beginning of year · starting point: Middle Pre"; tiny strand tags → task heading + directive (D-005).
- Guided Reading student mode: "level-c", "moonwood-tales", "longer-story-pages" under titles (A1.7) → friendly level badge only.
- Reports/exports use one status vocabulary: **Secure · Developing · Needs support · Not enough results · Not checked**. Boilerplate interpretations are replaced by the ⓘ contract lines.
- Empty states claiming "in this browser" on cloud-hydrated data → three-beat error/empty pattern.
- Student sign-in errors (A2.6): distinguish "code not found" / "no internet" / "ask your teacher", spoken + illustrated, student register.
- Overlay/close accessible names derived from the active surface (A2.10).

## 8. Enforcement (how this sticks — do these, not just the rewrites)

1. **Copy gate in CI:** `tools/checkAppCopy.js` — banned-term scan per register. Authoritative mode renders the seeded routes (teacher + student + a report export) and scans the DOM/output, per the plan's route-level rule; source scan is a fast pre-filter only. Wire into `check:release`.
2. **Product-name gate:** `npm run check:product-brand` verifies browser/install metadata, the no-script loading screen, public pages, and customer-facing runtime sources against the current name authority.
3. **String centralization** (§1.8) as each surface is touched.
4. **The 5-second test:** in Loop C-lite reviews, a fresh-eyes session is shown each screen and asked "what would you do here?" — any label it can't act on in one reading is filed to `DISCOVERED.md` as a copy bug.
5. **Sweep order:** Students (this doc) → Dashboard → assessment runner (D-005/D-007 together) → Reports → student home + Guided Reading (A1.7) → dialogs/toasts/errors → exports & printables → emails. One commit per surface, each referencing this doc.

*This is not dumbing down. The model, both averages, and the fairness rules stay exactly as built — teachers get a plain sentence, students get words they can hear or decode, parents get plain English, and the ⓘ carries the statistics degree.*
