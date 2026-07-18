# LiteracyPath — Multi-Perspective Review

**Project:** LiteracyPath (English AI Literacy / Phonics Game)  
**Tech Stack:** Vite + React (main), Vite + React + TypeScript + Tailwind + shadcn/ui (extension), Supabase backend, Phaser, React Three Fiber, Playwright, Node test runner  
**Review Date:** 18 July 2026  
**Reviewer Perspectives:** Engineer, Designer (UI/UX), Educator, Child User, Businessman

---

## 1. Engineer / Coder

### 1. App.jsx is a monolith — needs decomposition
**File:** `src/App.jsx` — **8,558 lines**

This single file contains the entire application's routing logic, state management, assessment orchestration, data normalization, export utilities, and dozens of pure helper functions. It imports from 30+ modules and defines 20+ inline utility functions. This is a classic "god component" that makes code review painful, increases merge-conflict risk, and makes unit testing nearly impossible.

**Recommendation:** Extract the pure utility functions into `utils/assessmentHelpers.js`, the question normalization logic into `utils/questionNormalization.js`, and the routing/view state machine into a dedicated `AppRouter.jsx` or `useAppViewMachine()` hook. The App component itself should only mount shells and pass props.

---

### 2. Two apps with divergent tech stacks create maintenance debt
**Files:** Root `package.json` vs `Phonics app extension/package.json`

The main app uses plain CSS, JSX, and hand-rolled components. The extension uses TypeScript, Tailwind CSS, shadcn/ui, and Radix primitives. Over time this will mean duplicated design systems, inconsistent component behavior, and engineers needing to context-switch between two different ways of building the same product.

**Recommendation:** Either merge the extension into the main app with a unified component library, or formally split it into a separate repository with its own release cycle. The current "extension inside the monorepo but not sharing anything" model is the worst of both worlds.

---

### 3. Generated data files are enormous and checked into source control
**Files:** `src/data/generated/*.js` — some exceeding 370,000 lines

`mediaQaReviewItems.generated.js` (370k+ lines), `skillWordBank.generated.js` (273k+ lines), and `languageSkillQuestions.generated.js` (114k+ lines) are checked into Git. This bloats clone times, slows CI, inflates bundle size if accidentally imported, and makes diffs unreadable.

**Recommendation:** Move generated artifacts to a build-time step (as some already are via `prebuild`) and store them in `.gitignore`. For assets that must be versioned, store them as compressed JSON blobs or in a dedicated CMS/storage bucket, not as committed JS modules.

---

### 4. The missing Supabase client is a silent failure trap
**File:** `src/supabaseClient.js`

The `createMissingSupabaseClient()` factory returns a mock that resolves every method with an empty success. This means if a developer forgets env vars, the app will appear to work (login "succeeds," data "saves") while actually doing nothing. Debugging this in production would be a nightmare.

**Recommendation:** Make the missing-config client throw loudly on any mutation, or gate the app behind a `SupabaseConfiguredGate` that shows a blocking setup screen. Better to fail fast than fail silently.

---

### 5. Tooling proliferation is becoming a burden
**Observation:** 80+ files in `/tools`, many with overlapping concerns.

There are separate tools for `checkHfwRuntimeSmoke.js`, `checkHfwDistractorAmbiguity.js`, `checkDistractorOnsetGiveaway.js`, `checkAssessmentRuntimeSafety.js`, `checkAssessmentShellRegressions.js`, etc. While thorough, this indicates the core assessment engine is too complex to reason about locally.

**Recommendation:** Merge related validators into a single plugin-based linter (e.g., `tools/assessmentLint.js --rules=all`). Adopt a proper schema-validation library (Zod, JSON Schema, or Yup) for question definitions so many of these checks become declarative rather than imperative.

---

### 6. No strict type safety in the core application
**Observation:** The 8,558-line App.jsx and most core logic are plain JavaScript.

With a codebase of this size and complexity — hundreds of question shapes, skill IDs, audio roles, and media paths — the lack of TypeScript in the main app means refactors are high-risk. The extension has TypeScript, which makes the main app's absence more glaring.

**Recommendation:** Gradually adopt TypeScript in the main app, starting with the `data/` contracts and `utils/` pure functions. Even a 20% type coverage would catch the most expensive bugs.

---

### 7. Error boundary fallback is too vague for children
**File:** `src/components/ErrorBoundary.jsx`

The fallback says: *"Something went wrong. Please refresh or go back."* — and nothing else. For a child-facing app, this is a dead-end experience. There's no error logging to a crash-reporting service (Sentry, LogRocket, etc.) and no telemetry event fired.

**Recommendation:** Add a child-friendly error illustration, a "Try again" button that resets the boundary, and silently log the error to an error-tracking service. Consider a "Report this" flow that sends the stack trace to the teacher dashboard.

---

### 8. Bundle size is likely huge and unmeasured
**Observation:** Dependencies include `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `phaser`, `postprocessing`, `framer-motion`, `howler`, `exceljs`, and `jszip`.

All of these are heavy libraries. The main app lazy-loads the Quest world and teacher pages, which is good, but there's no evidence of bundle-budget enforcement or route-level code-splitting beyond the two lazy imports.

**Recommendation:** Add `rollup-plugin-visualizer` to the build pipeline and set a bundle budget (e.g., 200KB initial, 500KB async). Audit whether `exceljs` (used only for teacher exports) and `jszip` (offline assets?) can be deferred until the user actually needs them.

---

### 9. The `prebuild` script is a long sequential chain
**File:** `package.json` scripts

```json
"prebuild": "node tools/generateAudioManifest.js && node tools/generateBookIndex.js && ..."
```

These five scripts run sequentially. If the first fails, the rest don't run. If they don't depend on each other, this wastes build time.

**Recommendation:** Use `concurrently` or `npm-run-all` to parallelize independent generators. Better yet, move them to a Makefile or `zx` script that can cache outputs based on file hashes.

---

### 10. Inline styles and CSS class composition are inconsistent
**Observation:** `StudentHomePage.jsx` uses inline `style={{ fontSize: 34, color: "var(--hs-ink)" }}` while other components use CSS modules or plain class strings. The `SageIcon` component defines SVG paths in a constant object rather than as imported SVG assets.

**Recommendation:** Adopt a single styling strategy — CSS Modules or Tailwind (as used in the extension) — and eliminate inline styles. Move SVG icons to proper `.svg` files or a shared icon component library so designers can edit them without touching JS.

---

## 2. Designer / UI/UX

### 1. Two home skins are a maintenance liability
**Files:** `StudentHomePage.jsx` (comic + sage), `src/styles/home-sage.css`

The "comic" and "sage" skins share logic but duplicate layout structures. The sage skin is described as "calmer" but without a documented design system, future changes must be made in two places. The comic skin uses `student-home-card-*` classes while sage uses `hs-card`, `hs-thumb`, etc.

**Recommendation:** Formalize a single design system with tokens (colors, spacing, radii, typography) and implement both skins as CSS-only theme overrides on the same JSX structure. Delete the conditional skin branches in the component.

---

### 2. The student home has no clear visual hierarchy
**Observation:** The comic home page shows 7+ cards (mission banner, phonics, map, arcade, story, library) plus a topbar with coins, progress, account, and Sound Seekers button.

For a 5–7-year-old, this is a lot of choices. The "Sage" skin is better with its sidebar navigation, but the main content area still shows 6 equally-weighted cards with no clear "start here" signal.

**Recommendation:** Use progressive disclosure — show the "next recommended activity" as a hero card, and collapse the rest into a secondary grid. The child's eye should land on one obvious action, not scan six equal options.

---

### 3. No visible loading states for heavy media
**Observation:** The app lazy-loads the Quest world, assessment banks, and guided reading books. The `LazyPageFallback` is a plain spinner with the text "Loading..." — no skeleton, no progress bar, no fun animation.

**Recommendation:** Replace the generic spinner with branded, game-themed loading sequences (e.g., the companion character walking across a progress bar, or a "packing my backpack" animation). For long loads, show a tip or fun fact about reading.

---

### 4. Typography scale is not systematically defined
**Observation:** Font sizes appear as magic numbers: `fontSize: 34`, `size={16}`, `size={18}`, `size={30}`, `strokeWidth="1.9"`. There's no evidence of a type scale (e.g., 12/14/16/20/24/32/40/48).

**Recommendation:** Define a type scale as CSS custom properties or Tailwind config tokens: `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--text-3xl`, and enforce them via linting. Consistent typography is the fastest way to make an app feel polished.

---

### 5. Color tokens are inconsistent between surfaces
**Observation:** The sage skin references `var(--hs-ink)` but the comic skin uses no CSS custom properties for color. The assessment shell, quest world, and hollow economy likely each have their own palette definitions.

**Recommendation:** Create a single `theme.css` file with semantic tokens: `--color-primary`, `--color-success`, `--color-warning`, `--surface-card`, `--surface-elevated`, etc. Map each surface to these tokens so the app feels cohesive even when the art style varies.

---

### 6. Arcade lock state is invisible in the UI
**Code:** `ARCADE_REQUIRES_DAILY_TASKS = false` (hardcoded)

The arcade card has a `locked` prop and a `lockedLabel` but the global flag is always `false`. When this eventually flips to `true`, children will see a locked arcade with no explanation of *why* it's locked or *how long* until it unlocks.

**Recommendation:** Design a "locked state" pattern with a countdown, a progress checklist ("Read 1 book → Play 1 quest → Arcade unlocks!"), and a celebratory unlock animation when the final task completes.

---

### 7. Assessment transitions are abrupt
**Observation:** The `AssessmentShell` is a bare `<main>` wrapper. Between questions, there's no transition animation — just a hard swap. For children, especially those with attention or anxiety issues, this can feel jarring.

**Recommendation:** Add gentle, quick transitions between questions (e.g., a 200ms fade or a card-swap animation). The `framer-motion` dependency is already in the project — use it here.

---

### 8. The "Hollow" economy lacks visual affordances
**Observation:** Coins are displayed as a number next to a generic coin icon. There's no visual connection between earning coins in activities and spending them in the Hollow. Children may not understand the economy loop.

**Recommendation:** Add a persistent "coin jar" animation that fills up as children earn coins, and show a "You have enough for X!" celebratory call-to-action when they cross a purchase threshold. Make the economy tangible, not numerical.

---

### 9. Companion picker has no search/filter
**Observation:** `COMPANIONS.map(item => ...)` renders all companions in a grid. If the list grows beyond 8–10, this becomes overwhelming.

**Recommendation:** Add category filters ("Flying," "Furry," "Magical") or a search input. For younger children, use icon-based filters rather than text. Consider a "Random" button for indecisive kids.

---

### 10. No empty state design for missing content
**Observation:** The `hideOnError` function for images simply sets `display: none`.

If a card's artwork fails to load, the card collapses visually. There's no placeholder, no fallback illustration, no skeleton.

**Recommendation:** Design a branded placeholder system — a colored card with the companion character and a pattern — so missing images never break the layout. Use `onError` to swap to the placeholder, not to hide the element entirely.

---

## 3. Educator

### 1. Assessment question types are numerous but not scaffolded for teachers
**Observation:** There are 20+ question formats (`INITIAL_SOUND_PAIR_SELECT`, `FINAL_SOUND_PAIR_SELECT`, `RHYME_PAIR_SELECT`, `BLEND_SOUNDS`, `PUT_SOUNDS_IN_ORDER`, `SENTENCE_MATCHES_PICTURE`, etc.).

Teachers using the dashboard may not understand what each format tests or why a child struggled with one versus another. The formats are engineering labels, not pedagogical descriptions.

**Recommendation:** Provide a "Question Type Guide" in the teacher dashboard that maps each format to a plain-English description, a sample question, and the specific literacy skill it assesses (e.g., "Phonemic Awareness — Onset-Rime Blending").

---

### 2. No visible differentiation for diverse learners
**Observation:** The app has a `prefers-reduced-motion` check for View Transitions, but there's no evidence of accommodations for dyslexia, color blindness, ADHD, or English language learners.

**Recommendation:** Add a "Learning Preferences" panel (teacher or child-facing) with options like: OpenDyslexic font toggle, high-contrast mode, extended time limits, audio-only mode, and larger touch targets. These are critical for inclusive education.

---

### 3. The mastery system is opaque
**Observation:** `getMasteryRule()` is imported from `./masterySystem` but there's no UI that shows *how* mastery is calculated or *why* a child hasn't mastered a skill.

Children (and teachers) need to see that mastery requires 5 correct answers across 3 different words, or whatever the rule is. Hidden thresholds feel arbitrary.

**Recommendation:** Surface the mastery criteria in the UI. For example: "Mastered: 5/5 correct on 3 different words" with a visual tracker. When a child is close, show a "Almost there! Try 2 more words." message.

---

### 4. Weakness detection exists but lacks remediation depth
**Observation:** `PROJECT_STATUS.md` lists "Weakness detection and targeted review" as a feature, but the review system appears to be simple repetition of missed questions.

**Recommendation:** Implement a true diagnostic-remediation loop. If a child misses initial sounds for "b," don't just give them more "b" questions — show them a letter formation animation, a mouth-position video, and a minimal-pair contrast ("b vs. p") before reassessing.

---

### 5. No evidence of multi-sensory instruction beyond audio
**Observation:** The app uses images and audio (text-to-speech or pre-recorded MP3s) but there's no kinesthetic component — no letter tracing, no drag-and-drop blending, no physical movement prompts.

**Recommendation:** Add tactile interactions: trace letters with a finger/mouse, drag phoneme tiles to build words, or "tap out" syllables on the screen. Multi-sensory instruction is the gold standard for early literacy.

---

### 6. Guided reading lacks comprehension depth checks
**Observation:** `GuidedReadingPage.jsx` and `BookQuiz.jsx` exist, but the quizzes likely focus on literal recall ("What color was the cat?") rather than inferential or critical thinking.

**Recommendation:** Add question types that assess comprehension depth: prediction ("What might happen next?"), inference ("Why do you think the character is sad?"), and connection ("Have you ever felt like this character?"). This aligns with reading comprehension research (e.g., Bloom's Taxonomy, Cunnningham & Stanovich).

---

### 7. Teacher dashboard priorities are underdeveloped
**Observation:** `PROJECT_STATUS.md` lists "Teacher dashboard improvements" as priority #3, but the current dashboard appears to be a basic table of student progress.

**Recommendation:** Add: (1) a "Students who need attention" alert panel, (2) a class-wide skill gap heatmap, (3) suggested grouping ("These 4 students are all struggling with final sounds — pair them for a small group"), and (4) one-click printable practice packs tailored to each child's gaps.

---

### 8. No parent/teacher communication channel
**Observation:** The app has student and teacher views, but no messaging, note-sharing, or parent portal.

**Recommendation:** Add a simple "Share with parent" button that generates a weekly progress email or printable report. Teachers should be able to leave encouraging notes for children that appear on the home screen.

---

### 9. Content lacks cultural and linguistic diversity
**Observation:** The vocabulary and book content are likely centered on a single cultural context (the default "cat, dog, bag, pen" word lists suggest Western English).

**Recommendation:** Audit all content for cultural bias. Add books and vocabulary that reflect diverse family structures, foods, names, and environments. Include decodable texts that use names from various cultures (e.g., "Raj has a jam," "Sofia has a bag").

---

### 10. No alignment with established literacy curricula
**Observation:** The skill tree (`skillTree.js`) exists but there's no explicit mapping to popular frameworks like Letters and Sounds (UK), Wilson FUNdations, Orton-Gillingham, or Jolly Phonics.

**Recommendation:** Publish a "Curriculum Alignment Guide" that maps LiteracyPath's skills to major phonics programs. This makes the app sellable to schools that already follow a specific curriculum and need to justify the purchase to administrators.

---

## 4. Child User (5–7 years old)

### 1. Too many choices on the home screen
**Observation:** The comic home screen shows 7+ clickable areas with no obvious starting point. Research on young children (Miller's Law, 7±2 items) suggests this is overwhelming.

**Recommendation:** Lead with ONE big, animated button: "Start your mission!" that auto-routes to the next unfinished daily task. Only show the full grid after the daily mission is complete.

---

### 2. The coin economy is abstract
**Observation:** Coins are earned and spent, but children may not understand what they mean or why they should care. A number next to a coin icon is not motivating for a 6-year-old.

**Recommendation:** Make coins physical — show them dropping into a jar, or let children physically "shake" their device to hear the coins rattle. When they earn coins, play a satisfying sound and show a big "+5!" animation that floats to the jar.

---

### 3. No immediate reward after each correct answer
**Observation:** The assessment shell evaluates answers but there's no micro-reward (a sparkle, a sound, a thumbs-up from the companion) after each correct response.

**Recommendation:** Add instant positive feedback: a 200ms sparkle burst, a "Yes!" from the companion, or a small coin drop. Instant feedback is critical for sustaining engagement in young learners.

---

### 4. Error feedback is too generic
**Observation:** When a child gets a question wrong, the assessment likely just shows a red cross or moves on. For a 5-year-old, "wrong" is discouraging without a path forward.

**Recommendation:** Replace "wrong" with "Let's look closer!" and show a hint: highlight the correct answer, play the sound again, or show a mouth-position video. Never end on failure — always end on a teachable moment.

---

### 5. Text is too dense in some places
**Observation:** The `sage` skin has card labels like "Phonics Learning — Letters, writing, sounds, and word building." That's 7 words. A 5-year-old may not read that fluently.

**Recommendation:** Use single-word labels with icons: "Sounds 🔊", "Books 📚", "Games 🎮". Add optional voiceover for all text labels so pre-readers can navigate independently.

---

### 6. The companion system is underutilized
**Observation:** Children pick a companion, but it appears to be a static avatar. It doesn't react to their successes, failures, or streaks.

**Recommendation:** Make the companion an active coach: celebrate with them, look sad when they skip a day, wear the gear they've bought, and offer hints ("Try listening to the first sound again!"). This is the emotional anchor of the app.

---

### 7. No break or "I'm tired" button
**Observation:** Children can get assessment fatigue, but there's no evidence of a pause button, a break reminder, or a "save my progress and come back later" flow.

**Recommendation:** Add a "Take a break" button that pauses the session, saves state, and shows a 1-minute breathing animation or a joke. After 10 minutes of assessment, auto-suggest a break.

---

### 8. Story quests may lack interagency
**Observation:** "Story Quests" are described as "Read and choose" — this sounds like a branching narrative. But if the choices don't meaningfully change the story, children will feel tricked.

**Recommendation:** Ensure every choice in a story quest has a visible consequence, even if small. "You chose to help the dragon → the dragon gives you a map." Agency is the difference between a game and a worksheet.

---

### 9. No social or cooperative play
**Observation:** The app is entirely single-player. Children at this age are highly social and love showing off achievements.

**Recommendation:** Add a simple "Buddy Read" feature where two children can read the same book together (one reads aloud, the other listens, then they swap). Or a "Send a gift" feature where children can send a companion sticker to a classmate.

---

### 10. The daily mission is a chore, not a quest
**Observation:** The daily mission is literally called "A quest, a book and a game" — three tasks. This feels like homework, not adventure.

**Recommendation:** Rename it to a narrative framework: "Today's Adventure: Find the Sound Crystal!" with steps disguised as story beats: "Cross the Phonics Bridge (do a quest) → Read the Ancient Scroll (read a book) → Win the Mini-Game (play a game)." The tasks are the same; the framing changes everything.

---

## 5. Businessman / Product Strategist

### 1. No clear monetization model is visible
**Observation:** The app has no in-app purchases, no subscription gating, no premium tier, and no ads. The `hollow.market` has gear and eggs but they appear to be bought with in-game coins, not real currency.

**Recommendation:** Define a freemium model before launch. For example: free = 1 quest + 1 book + 1 game per day; premium = unlimited access + parent reports + printable worksheets. The Hollow market could sell real-money cosmetic packs for companions (low margin, high delight).

---

### 2. Teacher dashboard is a retention tool, not a sales tool
**Observation:** The teacher dashboard is a basic progress tracker. It doesn't demonstrate ROI to a school administrator.

**Recommendation:** Add an "Impact Report" feature that shows: "Your class improved 23% on initial sounds this month." Include benchmarks against national averages (if available) or the class's own baseline. Schools buy outcomes, not features.

---

### 3. No viral loop or referral mechanism
**Observation:** There's no "Invite a friend," "Share your streak," or "Gift a subscription" feature.

**Recommendation:** Add a simple referral: "Give 7 free days to another teacher." Teachers are the most credible salespeople to other teachers. A referral program with a tangible reward (e.g., free companion skin) is cheap CAC.

---

### 4. The "Phonics app extension" is a product identity crisis
**Observation:** Two apps with different names, different tech stacks, and different UI systems. This splits the brand and confuses customers.

**Recommendation:** Merge or kill the extension. If it has a unique purpose (e.g., a lightweight home-practice app), rebrand it as "LiteracyPath Lite" with a unified design system. Never sell two apps that do the same thing.

---

### 5. No evidence of GDPR/COPPA compliance infrastructure
**Observation:** The app collects student data (names, progress, assessment history) via Supabase. There's no visible privacy policy, consent flow, or data-deletion mechanism.

**Recommendation:** For the US school market, COPPA compliance is non-negotiable. Implement: (1) a parent consent email flow, (2) a data-deletion portal, (3) a published privacy policy, and (4) a Data Processing Agreement with Supabase. For EU, add GDPR-compliant consent and right-to-erasure flows.

---

### 6. Content creation is not scalable
**Observation:** Guided reading books, question banks, and audio are manually generated or heavily curated. The `tools/` directory has 80+ scripts for auditing and generating content, which suggests the content pipeline is labor-intensive.

**Recommendation:** Invest in a generative pipeline (as the project seems to be doing with `generateQuestionImages.js` and `generateGameSprites.mjs`) but wrap it in a CMS. Teachers or content creators should be able to input a book title and skill target, and the system generates a decodable book + quiz + audio in minutes, not days.

---

### 7. No competitive differentiation messaging
**Observation:** The project status says "English AI Game" but doesn't articulate what makes LiteracyPath different from ABCmouse, Reading Eggs, or Lalilo.

**Recommendation:** Define the unique value proposition and bake it into the product. If it's the AI-adaptive engine, show teachers a real-time "AI is personalizing for Sarah" indicator. If it's the 3D quest world, make it the hero of the marketing site. Differentiation must be visible, not just true.

---

### 8. The offline mode is a competitive advantage but under-marketed
**Observation:** The project has an extensive offline system (`dist-quest-offline`, `offlineShell.js`, service worker fixtures). This is huge for schools with poor connectivity or rural families.

**Recommendation:** Make offline capability a headline feature. Add a "Works on the bus, at the park, anywhere!" badge. For schools, offer a "download for the whole class" admin feature that preloads the app onto a cart of tablets.

---

### 9. No upsell path from free to paid
**Observation:** The Hollow economy, companion system, and quest world are all free-to-play. There's no premium feature that a child would nag their parent to buy.

**Recommendation:** Add a "Premium Companion Pack" or "Rare Egg" that requires a subscription or one-time purchase. Children are powerful motivators for parent spending if the desire is built emotionally ("I want the dragon for my companion").

---

### 10. Analytics and telemetry are present but not productized
**Observation:** `questTelemetry.js` and `progressSync.js` log detailed events, but there's no evidence of a business intelligence dashboard, funnel analysis, or cohort retention tracking.

**Recommendation:** Build a "Product Health Dashboard" that tracks: D1/D7/D30 retention, session length by age, most-abandoned question types, and teacher activation rate. Use this to prioritize features — if 40% of children quit at the "final sounds" assessment, that's the highest-impact fix.

---

## Summary Table

| # | Engineer | Designer | Educator | Child User | Businessman |
|---|----------|----------|----------|------------|-------------|
| 1 | Decompose App.jsx | Unify design system | Question type guide | Reduce home choices | Define monetization |
| 2 | Merge or split tech stacks | Fix visual hierarchy | Add learning accommodations | Make coins tangible | Add impact reports |
| 3 | Remove generated files from Git | Branded loading states | Surface mastery rules | Instant micro-rewards | Add referral loops |
| 4 | Fail-fast Supabase | Define type scale | True diagnostic remediation | Friendly error feedback | Merge extension identity |
| 5 | Consolidate tooling | Semantic color tokens | Multi-sensory instruction | Simplify text labels | COPPA/GDPR compliance |
| 6 | Add TypeScript gradually | Design lock states | Deeper comprehension checks | Activate companion | Build a CMS pipeline |
| 7 | Add crash reporting | Animate transitions | Improve teacher dashboard | Add break reminders | Articulate differentiation |
| 8 | Enforce bundle budgets | Visualize the economy | Parent communication | Meaningful story choices | Market offline capability |
| 9 | Parallelize prebuild | Companion filters | Diverse content | Add social features | Create upsell paths |
| 10 | Ban inline styles | Design placeholder art | Curriculum alignment | Narrative daily missions | Build product analytics |

---

*This review is based on static code analysis and file structure inspection. No changes were made to the project.*
