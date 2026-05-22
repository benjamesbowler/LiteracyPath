# LiteracyPath — Teacher Assessment Module
## UX / Workflow Architecture Review & Redesign
### Version 1

Status: Planning / UX Architecture Specification

Authoring Source:
- Claude (UX architecture review)
- Human-directed implementation planning
- LiteracyPath instructional framework alignment

Purpose:
This document defines the long-term UX architecture, navigation structure, workflow design, and visual system for the LiteracyPath Teacher Assessment Module.

This document is NOT:
- a database redesign
- a Supabase schema rewrite
- a mastery-engine rewrite
- a replacement for EL assessment/export infrastructure

This document IS:
- a teacher workflow redesign specification
- a cognitive load reduction plan
- a UI/UX consistency framework
- an operational usability architecture guide
- a phased Codex implementation roadmap

Core Principle:
The teacher’s cognitive load is the most important resource in the product.

All UX decisions should prioritize:
- clarity
- speed
- trust
- calm operation
- assessment efficiency
- instructional usefulness

The redesign must preserve:
- EL assessments
- Excel exports
- Supabase logic
- mastery tracking
- existing assessment validity
- reporting infrastructure

Implementation Rule:
Codex should implement this redesign incrementally in phases.
Do NOT attempt a full rewrite in a single implementation pass.

Recommended implementation order:
1. Design tokens and visual system
2. Navigation restructure
3. Assessment screen redesign
4. Student overview redesign
5. Dashboard redesign
6. Intervention workflows
7. Responsive/mobile refinement
8. Advanced analytics/reporting polish

Related documents:
- instructional_standards.md
- QUESTION_VALIDITY_RULES.md
- LiteracyPath_Phonics_Question_Model_Framework_v1.md
- Adaptive_Remediation.md
- child_mode_asset_coverage.md

------------------------------------------------------------
BEGIN UX ARCHITECTURE REVIEW
------------------------------------------------------------

# LiteracyPath — Teacher Assessment Module
## Complete UX/Workflow Architecture Review & Redesign
### Document v1

---

## Framing: The Teacher's Relationship with This Software

Before architecture, a diagnosis.

The reason teacher-facing educational software accumulates visual and operational debt faster than almost any other software category is that it grows from the data outward rather than from the teacher inward. Features are added when a new data point becomes available. Screens multiply when a new workflow is needed. Navigation grows to accommodate new tool categories. The result — universally — is a system that knows a great deal and communicates it poorly.

LiteracyPath's teacher module has this problem. The data is good. The underlying logic is sound. The surface that teachers interact with has grown to reflect the system's internal complexity rather than the teacher's actual needs.

The redesign principle for everything that follows is: **the teacher's cognitive load is the product's most important resource**. Teachers are managing 20–30 children simultaneously, planning instruction, responding to behavior, communicating with families, and completing administrative requirements. The 3 minutes they spend with LiteracyPath before a small group session is not a dedicated focus session. It is a brief, pressured window. Every screen must earn its place in that window.

---

## 1. Overall Teacher Workflow

### Current State Diagnosis

The current workflow requires teachers to make too many navigation decisions before reaching actionable information. The path from login to an intervention decision passes through multiple selection screens, each of which presents the full complexity of the system before the teacher has oriented themselves to their specific task.

The fundamental problem: the system does not know why the teacher has opened it. Is it to run an assessment? To check a student's progress? To plan tomorrow's groups? To export a report? All of these are presented with equal visual weight from the start.

### The Ideal Teacher Workflow

The redesigned workflow is organized around **intent-first navigation** — the system surfaces the most likely teacher intent based on time of day, recent activity, and pending actions, rather than presenting a flat menu of equal options.

**Primary workflow: Daily use (2–5 minutes)**

```
Login
  ↓
Today View (intent surface)
  ↓ system presents: 3 students flagged / 2 assessments pending / 1 mastery milestone
Teacher selects intent
  ↓
Single-focus task screen
  ↓
Action taken (assessment run / note added / group adjusted)
  ↓
Return to Today View (updated)
```

**Secondary workflow: Assessment session (10–20 minutes)**

```
Today View → "Run Assessment" for [student name]
  ↓
Student context card (30 seconds of orientation: last session, current level, what to expect)
  ↓
Assessment screen (focused, minimal chrome)
  ↓
Results screen (immediate, plain-language interpretation)
  ↓
Next step suggestion (one clear recommendation)
  ↓
Return to class view (session logged automatically)
```

**Tertiary workflow: Progress review (5–10 minutes)**

```
Today View → Class Progress
  ↓
Class snapshot (visual, spatial, scannable in 30 seconds)
  ↓
Filter to area of interest (skill / group / flag type)
  ↓
Individual student drill-down if needed
  ↓
Export or note if needed
  ↓
Return
```

### What Changes

The current workflow asks teachers to navigate to information. The redesigned workflow surfaces information and asks teachers to act on it. This is the difference between a filing cabinet and a briefing document.

---

## 2. Navigation Structure

### Current State Diagnosis

The current navigation likely has a flat or shallow hierarchy with items organized by system category (Assessments, Students, Classes, Reports, Settings). This is developer-logical but teacher-illogical. Teachers do not think in system categories. They think in tasks, students, and time.

### Proposed Navigation Architecture

**Top-level navigation: 5 items maximum**

```
1. Today          ← default landing, always
2. My Classes     ← class and student management
3. Assess         ← launch and review assessments
4. Progress       ← mastery tracking, skill coverage, reports
5. Settings       ← account, class setup, export, admin
```

**Critical design decisions:**

"Today" is always item 1 and is always the default landing. It is never a sub-item. It is never grouped with other items. It is the home.

"Assess" and "Progress" are separated intentionally. Assessing (running a session, reviewing results) is a distinct cognitive mode from reviewing progress (analyzing data, making grouping decisions). Conflating them creates the "assessment results buried under analytics" problem common in this category.

"Reports" and "Export" are not top-level items. They live inside Progress → Export. Teachers who need them know where to look. Teachers who don't need them are not distracted by them.

**Second-level navigation (contextual — appears only when needed):**

Under My Classes:
```
  [Class Name]
    ├── All Students
    ├── Groups (teacher-created)
    └── Class Settings
```

Under Assess:
```
  ├── Pending Assessments (flagged by system)
  ├── Run New Assessment
  └── Recent Sessions (last 14 days)
```

Under Progress:
```
  ├── Class Overview
  ├── Skill Coverage
  ├── Individual Students
  ├── Flags & Interventions
  └── Export & Reports
```

**Hidden from primary navigation (accessible but not prominent):**

- Admin tools → under Settings, behind one tap
- Question flagging → within individual assessment result, not a top-level item
- Individual question bank management → Settings → Advanced
- Raw data tables → Progress → Export → Advanced Export

### Navigation Behavior Rules

The top navigation is persistent on desktop (left sidebar, 200px wide, collapsed to icons at 60px on request). On tablet/mobile, it lives in a bottom tab bar (5 items, icon + label).

The currently active section is always clearly indicated. Sub-navigation appears inline below the top navigation item on desktop, as a header row on tablet.

Breadcrumbs appear whenever the teacher is more than 2 levels deep: `My Classes > Class 2B > Maria Chen > Short Vowels` — each segment is tappable to navigate back.

---

## 3. Assessment Flow UX

### Current State Diagnosis

Assessment screens in educational software typically suffer from one of two failure modes: they present so much context information that the assessment itself feels buried, or they present so little context that the teacher loses orientation mid-session. Both create cognitive friction at the moment that should require the least friction — the actual assessment.

A secondary problem specific to adaptive systems: the teacher needs to understand what the system is doing during assessment without seeing the raw algorithm. If the system is adapting and the teacher cannot see why a question is being asked, they distrust the system.

### Assessment Entry: The Context Card

Before any assessment session begins, a **Context Card** appears. This is a single screen — not a dashboard, not a report — that takes 20 seconds to read.

**Context Card contents:**
```
[Student Photo/Avatar]  Maria Chen — Grade K
Last session: 3 days ago
Current focus: Short vowel discrimination — /ă/ and /ĕ/
Ready for: 6–8 questions
Note from last session: "Needed extra time on medial vowels"

[Begin Assessment]  [Not now]
```

Nothing else. No skill tree. No mastery history. No export options. The teacher who needs to know more can tap the student name to access their full profile — but the default is: enough context to begin, not enough to overwhelm.

### Assessment Screen Design

The assessment screen has a single job: present one question clearly and record the response accurately. Every element that is not serving this job is removed.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  Maria Chen    Short /ă/    Q3 of 8   [×]  │  ← minimal header
├─────────────────────────────────────────────┤
│                                             │
│  [Question content — large, centered]       │
│                                             │
│  [Audio control if applicable]              │
│                                             │
├─────────────────────────────────────────────┤
│  [A]  cat     [B]  cot                     │
│  [C]  cut     [D]  cit                     │
├─────────────────────────────────────────────┤
│  [Flag this question]        [Skip]         │
└─────────────────────────────────────────────┘
```

**Header elements (minimal):**
- Student name (confirmation of who is being assessed)
- Current skill label (plain English: "Short /ă/" not "SV_A_MPD_L3")
- Question counter (Q3 of 8)
- Exit button (×) — always accessible, always top-right

**Question content zone (dominant — 50% of screen):**
- Question prompt in large, clear type (minimum 20pt on any device)
- Audio playback control if the question has audio (large, single tap)
- Any supporting image centered, below the question text

**Response zone:**
- 4 choice buttons (or fewer for some formats)
- Choices labeled A, B, C, D for keyboard navigation on desktop
- Large touch targets on tablet (full-width buttons stacked, minimum 56pt height)
- No decorative color on un-selected choices — warm neutral only

**Below the response zone:**
- "Flag this question" — small, text link, not a button. Available but not prominent.
- "Skip" — small, text link. Skipping records a no-response, not an incorrect.

**What is removed from the assessment screen:**
- Progress bars for overall skill mastery
- Student profile information
- Navigation to other sections
- Advertising of the next question or session structure
- Any visual that requires interpretation during the 5-second window of an assessment question

### Assessment Progression

Questions arrive without transition animation between them on desktop (the response zones update in place — the question changes, the layout does not). On tablet, a subtle horizontal wipe (200ms) signals the new question without a jarring cut.

The question counter (Q3 of 8) updates immediately on response recording. The teacher always knows where they are.

**For adaptive sessions where question count is not fixed:** The counter shows "Q3+" rather than "Q3 of 8" — communicating that more questions may follow based on performance. Once the session is determined to be complete by the engine, the counter shows "Final question" for the last item.

### Checkpoint Progression Flow

Checkpoints (skill-level completion milestones) are surfaced differently from individual question results. A checkpoint completion triggers a **Checkpoint Card** between the last question of the checkpoint skill and the first question of the next skill.

```
┌─────────────────────────────────────────────┐
│  ✓ Short /ă/ — Checkpoint Complete           │
│                                             │
│  6 questions answered                        │
│  4 correct  ·  2 incorrect                  │
│  Strongest: initial position                 │
│  Needs review: medial position               │
│                                             │
│  Next: Short /ĕ/ discrimination             │
│                                             │
│  [Continue]    [End session here]            │
└─────────────────────────────────────────────┘
```

This gives the teacher a natural pause point, a brief interpretation, and a choice to continue or stop. It is not a full report — it is a 10-second orientation before the next skill begins.

### Completion States

**Session complete — strong performance:**
```
┌─────────────────────────────────────────────┐
│  Session Complete — Maria Chen              │
│                                             │
│  8 questions  ·  7 correct                  │
│                                             │
│  Short /ă/  ✓ Ready to advance             │
│                                             │
│  Suggested next session:                    │
│  Introduce short /ĕ/ discrimination         │
│                                             │
│  [View Full Report]    [Done]               │
└─────────────────────────────────────────────┘
```

**Session complete — needs review:**
```
┌─────────────────────────────────────────────┐
│  Session Complete — Maria Chen              │
│                                             │
│  8 questions  ·  4 correct                  │
│                                             │
│  Short /ă/  ⚠ More practice needed         │
│                                             │
│  Suggested next session:                    │
│  Return to short /ă/ with image support     │
│                                             │
│  [View Details]    [Done]                   │
└─────────────────────────────────────────────┘
```

Both completion states are calm. No dramatic color. No alarm language. The interpretation is plain. The next step is one sentence. The teacher can act on this in 10 seconds.

### Confusion Points to Eliminate

**Current likely confusion: What is the session assessing?**
Fix: The Context Card and the header skill label give constant orientation. The teacher always knows the current assessment focus.

**Current likely confusion: Why did that question appear?**
Fix: A subtle "Why this question?" information tap is available on the question header — tapping it shows a one-sentence plain-English explanation: "Maria answered /ă/ correctly last session — this question confirms that." This is available but not prominent. It answers the question for teachers who want to understand without cluttering the screen for teachers who don't.

**Current likely confusion: Did my tap register?**
Fix: All response buttons show an immediate pressed state (100ms visual response) before the answer is processed. The teacher never wonders if their tap registered.

**Current likely confusion: Can I go back?**
Fix: Sessions are forward-only. Going back is not permitted (it would compromise assessment validity). The exit button (×) ends the session cleanly and saves progress. This is explained in onboarding and in a tooltip on first use.

---

## 4. Student Overview UX

### Current State Diagnosis

Student overview pages in adaptive assessment systems typically show too much. The temptation is to display all available data — skill by skill, checkpoint by checkpoint, item by item — because the data is available and seems valuable. The result is a screen that takes 3 minutes to parse and leaves the teacher less certain about what to do than before they opened it.

The redesigned student overview operates on a principle of **progressive disclosure**: the most actionable information is immediately visible, supporting detail is available one tap away, and raw data is available behind a secondary tap.

### Student Overview: Three-Layer Structure

**Layer 1 — The 15-Second View (always visible)**

```
┌─────────────────────────────────────────────────────────────────┐
│  Maria Chen   Grade K   [avatar]                                │
│  Last session: Tuesday  ·  3 sessions this week                 │
├─────────────────────────────────────────────────────────────────┤
│  CURRENT FOCUS                                                  │
│  Short vowel discrimination — /ă/                               │
│  ████████░░  Developing  (6/8 items)                            │
├─────────────────────────────────────────────────────────────────┤
│  ATTENTION NEEDED                     NO FLAGS TODAY ✓          │
│  (or if flagged:)                                               │
│  ⚠ Inconsistent on /ĕ/ — 7 exposures below 60%                │
│  Suggested: Direct review of short /ĕ/ in isolation            │
└─────────────────────────────────────────────────────────────────┘
```

The 15-Second View answers: what is this child working on, are they progressing, is anything urgent?

**Layer 2 — Skill Coverage (one tap to expand)**

Tapping the current focus area or a "Skill Coverage" link expands to show the full skill path — but expressed as a simple visual list, not a spreadsheet:

```
  ✓ Initial sounds           Mastered  →  3 weeks ago
  ✓ Final sounds             Mastered  →  2 weeks ago
  ● Short /ă/                Developing
  ○ Short /ĕ/                Not started
  ○ Short /ĭ/                Not started
  ○ Short /ŏ/                Not started
  ○ Short /ŭ/                Not started
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  ○ Blends                   Locked (requires short vowels)
```

Icons: ✓ mastered (green), ● in progress (amber), ○ not started (grey), flag icon for flagged items.

No percentages in this view. No raw counts. Direction and state only.

**Layer 3 — Item-Level Detail (second tap to expand)**

Tapping any skill area expands the individual items:

```
  Short /ă/  →  Developing
  
  cat    ✓ Mastered    cot  ● Practicing  cup  ● Practicing
  bat    ✓ Mastered    cut  ○ Not seen    cap  ○ Not seen
  map    ● Practicing  hat  ○ Not seen    man  ○ Not seen
  
  [Run assessment for these items]
```

This is the only place where item-level granularity appears. It is available but not the default view.

### What Is Visually Prioritized

**Priority 1 (always visible, largest visual weight):**
- Current focus skill
- Progress state (developing / mastered / needs attention)
- Active flags

**Priority 2 (visible on scroll or one-tap expansion):**
- Skill path overview
- Recent session history (last 5 sessions as a sparkline)
- Child Learning World evidence if available (one line: "3 missions completed in Echo Caves this week")

**Priority 3 (behind a second tap or "More" link):**
- Item-level detail
- Individual question history
- Assessment session logs
- Raw response data

### Child Learning World Evidence Integration

The Child Learning World data (from the game layer) appears in the student overview as a single contextual note — not as a separate dashboard, not as a prominent section. It supplements the assessment data, never replaces it.

```
Learning World activity (this week):
Echo Caves — 3 missions completed  ·  Short /ă/ practice consistent
[View Learning World data]
```

Tapping "View Learning World data" opens a dedicated panel showing mission completion, accuracy in the game layer, and any mastery events triggered. This is supplemental evidence for teachers who want it, not required reading.

---

## 5. Information Hierarchy

### The Three Questions Every Screen Must Answer

Before designing any screen in Teacher Mode, answer: what are the three questions a teacher might ask on this screen, ranked by frequency? The most frequently asked question gets the most visual weight, the largest type size, the highest position. The least frequently asked question is accessible but not prominent.

### Hierarchy for Each Major Screen

**Today (Home Dashboard):**
1. Who needs attention today? (Flags panel — top, most prominent)
2. What happened recently? (Recent sessions — middle)
3. What do I need to do? (Pending assessments — middle-right)

**Class View:**
1. Where is the class as a whole? (Skill coverage heatmap — dominant visual)
2. Who is behind? (Students below grade-level expectation — visually distinguished)
3. Who is ahead? (Students above expectation — noted but not alarming)

**Student View:**
1. What is this student working on? (Current focus — top)
2. Are they making progress? (Direction indicator — immediately below)
3. Is anything wrong? (Flag panel — immediately below, empty is explicitly good)

**Assessment Result:**
1. How did they do? (Score in plain English — large)
2. What does this mean? (One-sentence interpretation — immediately below)
3. What should I do next? (One recommendation — below the interpretation)

### What Should Be Hidden by Default

The following information should require an explicit tap or scroll to access. It should never appear in the primary view of any screen:

- Raw response data (which question, what choice was selected, response time)
- Algorithm details (confidence scores, format levels, distractor stages)
- Historical data older than 30 days (accessible via "View history" link)
- Export and report tools (accessible but not visible unless needed)
- Admin and account management (in Settings only)
- Question bank management (in Settings → Advanced only)
- Any data table with more than 6 columns visible simultaneously

---

## 6. Visual Design System

### Design Philosophy

The Teacher Mode visual system should communicate: **I am professional, calm, and trustworthy. I will not waste your time.**

It should evoke good educational publishing — the visual language of a Heinemann assessment guide or a well-designed curriculum resource, not enterprise software and not children's media.

### Color Palette

**Primary neutral palette (80% of UI):**

```
Background primary:    #FAFAF8   Warm off-white — never pure white
Background secondary:  #F3F0EB   Slightly warmer — card backgrounds, sidebar
Border:                #E5E0D8   Subtle warm grey — dividers, card edges
Text primary:          #1A1814   Deep warm charcoal — headings, primary labels
Text secondary:        #6B6560   Medium warm grey — secondary labels, metadata
Text tertiary:         #9B9490   Light warm grey — timestamps, helper text
```

**Accent palette (15% of UI — semantic, never decorative):**

```
Action / CTA:          #2D5F8A   Muted professional blue — primary buttons, links
Mastered / Success:    #2E7D52   Deep calm green — mastery indicators
Developing / Active:   #B45309   Warm amber — in-progress states, current focus
Needs attention:       #B22F2F   Muted red-rose — flags, warnings (not alarming)
Not started:           #9B9490   Same as text tertiary — neutral absence
```

**Color assignment rules:**
- The muted red-rose (#B22F2F) appears ONLY for intervention flags — never for decorative purpose or branding
- The action blue (#2D5F8A) appears ONLY on interactive elements — buttons, links, focus states
- No gradients in Teacher Mode (reserved for Child Mode)
- No more than 3 colors visible on any single screen simultaneously

**Assessment state colors (critical — must be instantly readable):**

| State | Color | Label |
|---|---|---|
| Mastered | #2E7D52 (green) | "Mastered" |
| Developing | #B45309 (amber) | "Developing" |
| Needs attention | #B22F2F (red-rose) | "Needs Review" |
| Not started | #9B9490 (grey) | "Not Started" |
| Locked | #C8C3BC (light grey) | "Locked" |

These five states and five colors are the complete set. No additional states. No intermediate colors. Consistency is more valuable than precision here.

### Typography Hierarchy

**Typeface:** A single, highly legible variable-weight sans-serif. Inter, DM Sans, or a close equivalent. Variable weight allows subtle hierarchy without requiring multiple typefaces.

**Scale:**

```
Display:    28pt / 700 weight  — page titles, dashboard headings
Heading 1:  22pt / 600 weight  — section titles, student names
Heading 2:  18pt / 600 weight  — card titles, skill names
Heading 3:  15pt / 600 weight  — sub-section labels
Body:       15pt / 400 weight  — primary content, descriptions
Body small: 13pt / 400 weight  — secondary content, metadata
Caption:    12pt / 400 weight  — timestamps, helper text
Label:      12pt / 600 weight  — tags, badges, state labels
```

**Line height:** 1.5 for body text, 1.2 for headings. Never less than 1.4 for any text a teacher needs to read at a glance.

**Uppercase usage:** ONLY for label-type elements (state badges, section tabs) at 12pt with 0.5pt letter spacing. Never for headings or body text.

### Spacing System

Base unit: 8px. All spacing values are multiples of 8.

```
4px   — internal component spacing (icon to label, badge padding)
8px   — small — tight groupings within a card
16px  — medium — standard internal card padding, between form fields
24px  — large — between sections within a screen
32px  — x-large — between major UI sections, top-level padding
48px  — xx-large — page margins on desktop
```

### Button System

**Primary button:**
Background: #2D5F8A (action blue), text: white, height: 44px, radius: 8px, padding: 16px horizontal. Used for the most important action on a screen. One per screen maximum.

**Secondary button:**
Background: transparent, border: 1.5px solid #2D5F8A, text: #2D5F8A, same dimensions. Used for important but non-primary actions.

**Ghost/text button:**
No background, no border, text: #2D5F8A, no minimum height constraint. Used for low-emphasis actions (View details, Cancel, Skip).

**Destructive button:**
Background: #B22F2F, text: white. Used only for permanent deletion or assessment session abandonment. Requires confirmation dialog.

**Disabled state:** All buttons: 40% opacity. Never hidden — disabled states communicate system state.

### Card System

Cards are the primary container unit in Teacher Mode. All cards share:

```
Background:    #F3F0EB (background secondary)
Border:        1px solid #E5E0D8
Border radius: 12px
Shadow:        0 1px 3px rgba(0,0,0,0.06)  — subtle, not floating
Padding:       24px
```

**Card variants:**

Standard card: as above.

Flagged card: Left border 4px solid #B22F2F. Background unchanged. No red fill — the border is sufficient signal.

Mastery card: Left border 4px solid #2E7D52.

Active card (currently selected student, current mission): left border 4px solid #2D5F8A.

Interactive card (tappable): adds hover state (background: #EDE9E2, transition 150ms) on desktop. Tap state on touch devices.

### Progress Visuals

Progress bars are used sparingly and only for single-skill progress — never for overall mastery. They are thin (6px height), use the semantic color palette, and never display percentage numbers (the fill level is sufficient).

The skill path view (list of mastered/developing/not-started items) uses icon-based state indicators rather than progress bars — icons communicate categorical state more clearly than continuous bars for the discrete categories in use here.

**What not to use:**
- Pie charts (poor at communicating proportion in this context)
- Radar/spider charts (beautiful, unreadable for quick decisions)
- Heatmaps with more than 4 color values (too much interpretation required)
- Stacked bar charts (ambiguous without legends)
- Any chart that requires a legend to be read

---

## 7. Mobile vs Desktop UX

### The Usage Context Difference

Desktop/laptop Teacher Mode: used at a desk before school, during planning time, or during small group instruction management. Extended use. Keyboard available. Higher information density acceptable.

Tablet Teacher Mode (iPad): used during assessment sessions at a table with a student. One-handed or two-handed interaction. Assessment screen must be touch-optimized. Narrow context (currently assessing one student).

iPhone Teacher Mode: used between classes, during transitions, while walking between rooms. Quick checks only. No extended task flows. Information density must be minimal.

### Desktop Design Decisions

- Left sidebar navigation (persistent, 200px wide)
- Multi-column layouts where appropriate (student list + detail panel side by side)
- Hover states on all interactive elements
- Keyboard navigation for assessment response selection (A/B/C/D keys)
- Dense data tables available for export and admin functions
- Full analytics views with class-level charts

### Tablet Design Decisions

- Bottom tab navigation (5 items, thumb-reachable)
- Single-column layout for most views
- Assessment screen takes full screen during session (no navigation visible)
- All touch targets minimum 44×44pt, preferred 56×56pt for assessment choices
- Swipe gestures for common actions (swipe left on student card to start assessment)
- No hover states — pressed states instead
- Context Card before assessment (covers disorientation when handing device to student)

### iPhone Design Decisions

**iPhone is read-only + quick action only.** The following are available on iPhone:

```
Available on iPhone:
  ✓ Today View (flags and recent activity)
  ✓ Class list and student list (read-only)
  ✓ Student 15-Second View
  ✓ Run quick check assessment (5 questions max)
  ✓ Add note to student profile
  ✓ View session history

NOT available on iPhone (redirect to tablet/desktop):
  ✗ Full assessment session (8+ questions)
  ✗ Export and report generation
  ✗ Class and student management (add/remove)
  ✗ Question bank management
  ✗ Admin tools
```

When a teacher attempts a not-available action on iPhone, a gentle redirect appears: "Run full assessments on iPad or computer for the best experience."

### Responsive Breakpoints

```
Mobile (iPhone):   < 430px width   →  single column, bottom tabs, minimal data
Tablet portrait:   430–768px       →  single column, bottom tabs, touch-optimized
Tablet landscape:  768–1024px      →  two-column where appropriate, bottom tabs
Desktop:           > 1024px        →  sidebar navigation, multi-column, full density
```

---

## 8. Dashboard Redesign

### The Today Dashboard (Primary Landing)

The Today Dashboard is the only screen a teacher needs to open every day. It is not a navigation hub — it is a briefing. It answers: what happened, what needs attention, what should I do.

**Layout (desktop, two-column):**

```
┌─────────────────────────────────────────────────────────────────┐
│  Good morning, Ms. Johnson     Tuesday, March 12              │
│  Class 2B   ·   18 students                                    │
├───────────────────────────┬─────────────────────────────────────┤
│  NEEDS ATTENTION          │  RECENT ACTIVITY                    │
│  ─────────────────────    │  ─────────────────────              │
│  ⚠ Maria — /ĕ/ plateau   │  Yesterday                          │
│  Suggest: review session  │  ● Amir — 6 questions, 5 correct   │
│                           │  ● Sofia — mastered short /ă/ ✓    │
│  ⚠ Liam — 5 days absent  │  ● James — session incomplete       │
│  No recent data           │                                     │
│                           │  Monday                             │
│  ✓ Omar — milestone!      │  ● Maria — 8 questions, 4 correct  │
│  Short /ă/ mastered       │  ● 3 other sessions                 │
│                           │                                     │
│  [View all flags]         │  [View all activity]                │
├───────────────────────────┴─────────────────────────────────────┤
│  PENDING ASSESSMENTS                                            │
│  Maria Chen — Short /ĕ/ intro — suggested today               │
│  James Park — Short /ă/ retry — suggested today                │
│  [Dismiss]  [Schedule]  [Start assessment →]                   │
└─────────────────────────────────────────────────────────────────┘
```

**Design rules for Today:**
- Maximum 3 flags shown by default. "View all flags" if more.
- Maximum 7 days of recent activity shown. Older is in Progress → History.
- Maximum 3 pending assessment suggestions. Teacher can dismiss.
- If no flags: "All students on track — nothing urgent" in the flags panel. This positive state is explicitly shown, not just an empty panel.

### The Class Dashboard

Accessed from Today → class name, or from My Classes.

```
┌─────────────────────────────────────────────────────────────────┐
│  Class 2B   ·   18 students   [Filter ▾]  [Export]            │
├─────────────────────────────────────────────────────────────────┤
│  SKILL COVERAGE OVERVIEW                                        │
│  ─────────────────────────────────────────────────────────      │
│  Initial sounds    ████████████████  16/18 mastered            │
│  Final sounds      ████████████████  15/18 mastered            │
│  Short /ă/         ██████████░░░░░░  10/18 mastered  3 flagged │
│  Short /ĕ/         ████░░░░░░░░░░░░   4/18 mastered            │
│  Short /ĭ/         ░░░░░░░░░░░░░░░░   0/18 not started         │
│  Blends            ░░░░░░░░░░░░░░░░   0/18 locked              │
│                                                                 │
│  [View full skill map]                                          │
├─────────────────────────────────────────────────────────────────┤
│  STUDENTS   (sorted by: current focus ▾)    [Change sort]      │
│  ─────────────────────────────────────────────────────────      │
│  Maria Chen      Short /ă/ developing   ⚠ Needs attention      │
│  Amir Osei       Short /ă/ developing   ✓ On track             │
│  Sofia Rodriguez Short /ă/ mastered     ✓ Moving to /ĕ/        │
│  James Park      Short /ă/ developing   ⚠ Incomplete session   │
│  [+ 14 more students]                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Class dashboard decisions:**

The skill coverage bars show fraction (10/18) not percentage. Fractions are more actionable for teachers — "10 out of 18" is more concrete than "56%."

Students are sorted by current focus by default — grouping students working on the same skill together, which is the information most useful for small-group planning.

The flag indicator on each student row is a single icon with a brief label. No pop-up. No hover. Tapping the student name opens their profile.

The filter at the top allows: filter by skill, filter by flag status, filter by last active date, filter by teacher-created group. All filters are single-tap (dropdown), not a filter panel.

### The Student Dashboard

Covered in detail in Section 4. Three-layer structure: 15-Second View, Skill Coverage, Item-Level Detail.

Additional elements in the student dashboard not covered in Section 4:

**Session history sparkline:**
A simple 14-day accuracy sparkline (line chart, no axes, thin line, 100px wide, 40px tall). Shows trend at a glance. Color: green if trending up, amber if flat, red-rose if trending down. The sparkline is a decorative confirmation of the text-based direction indicator — not primary information.

**Quick actions panel (always visible):**
```
[Run Assessment]   [Add Note]   [View Full History]
```
Three and only three actions. Run Assessment launches the assessment flow for this student. Add Note opens a simple text field with a timestamp. View Full History opens a detailed session log.

### The Intervention Dashboard

Accessed from Today → "View all flags" or from Progress → Flags & Interventions.

This dashboard exists for teachers who want to work systematically through all students with flags — typically during planning periods, not during active instruction.

```
┌─────────────────────────────────────────────────────────────────┐
│  Flags & Interventions   Class 2B                               │
│  3 active flags  ·  Updated: today                              │
├─────────────────────────────────────────────────────────────────┤
│  ⚠ NEEDS IMMEDIATE ATTENTION (1)                                │
│  ─────────────────────────────────────────────────              │
│  Maria Chen — Short /ĕ/ inconsistency                          │
│  7 exposures, 43% accuracy over 2 weeks                         │
│  Recommended: Return to image-supported /ĕ/ practice            │
│  [View student]  [Start review session]  [Dismiss]              │
├─────────────────────────────────────────────────────────────────┤
│  ● MONITOR (2)                                                  │
│  ─────────────────────────────────────────────────              │
│  Liam Torres — Accuracy declining on /ă/                        │
│  4 sessions, accuracy dropped from 88% to 62%                   │
│  Recommended: Check next session before acting                  │
│  [View student]  [Dismiss]                                      │
│                                                                 │
│  James Park — Session not completed (3 days ago)                │
│  Recommended: Reschedule                                        │
│  [View student]  [Schedule session]  [Dismiss]                  │
├─────────────────────────────────────────────────────────────────┤
│  ✓ POSITIVE (1)                                                 │
│  ─────────────────────────────────────────────────              │
│  Sofia Rodriguez — Short /ă/ mastered                           │
│  Ready to advance to short /ĕ/                                  │
│  [View student]  [Dismiss]                                      │
└─────────────────────────────────────────────────────────────────┘
```

Flags are tiered by urgency: needs immediate attention, monitor, positive. Positive flags (mastery milestones, readiness to advance) are included in the intervention dashboard so that advancement decisions happen in the same workflow as intervention decisions.

Each flag has exactly three actions: view the student, take the recommended action, or dismiss. No more options at this level — complexity lives in the student profile.

---

## 9. Assessment Psychology

### The Emotional Experience of Teacher Mode

Teacher Mode should produce a specific set of feelings throughout a session:

**Opening (Today View):** Oriented. Briefed. Ready. The teacher knows in 15 seconds what needs attention today. Nothing is hidden. Nothing requires hunting.

**During assessment:** Calm. Focused. Present with the student. The assessment screen is quiet enough that the teacher's attention is on the child, not the interface.

**After assessment:** Informed. Certain. Directed. The results screen tells the teacher something meaningful and tells them what to do next. They do not leave uncertain.

**During progress review:** Confident. Efficient. The class and student views show the teacher that the system knows what it knows and is honest about what it doesn't.

### What Creates "Overwhelming" — and How to Prevent It

**Too much visible at once:**
Prevention: Progressive disclosure (Layer 1/2/3 structure). Only Layer 1 visible by default.

**Numbers without context:**
Prevention: Replace percentages with plain language states (mastered, developing, needs review). Use fractions where numbers are needed (10/18, not 56%).

**Ambiguous recommendations:**
Prevention: Every flag has exactly one recommended action, in plain English. "Consider direct review of short /ĕ/" not "Performance below threshold — intervention indicated."

**Visual noise:**
Prevention: The 3-color semantic system (green/amber/red-rose) applied consistently. No decorative color. Every color means something.

**Unclear system behavior:**
Prevention: The assessment screen explains why questions are being asked (available on tap). The student view shows the adaptive system's state in plain language.

**Feeling like the system is hiding things:**
Prevention: The Layer 3 item-level detail is always available. Teachers who want to see raw data can access it. But it is not forced on teachers who don't need it.

### The "Spreadsheet Software" Anti-Pattern

Spreadsheet software communicates: all information is equally important, you must look at all of it, the decision is yours to derive. Good assessment software communicates: this information matters most, here is what it means, here is what to consider doing.

The specific anti-patterns to avoid:

**Anti-pattern: Data tables as primary view.** Tables show information; dashboards communicate it. Tables belong in exports and history views — not on primary dashboards.

**Anti-pattern: Percentage everywhere.** Percentages require mental arithmetic to interpret. States (mastered, developing) require no arithmetic.

**Anti-pattern: Unlabeled progress bars.** A progress bar without a label and a state name is decoration. A progress bar with a label, a state color, and a state name is information.

**Anti-pattern: Symmetrical information weight.** When everything has the same visual weight, nothing is prioritized. The teacher's eye has nowhere to land. Use hierarchy aggressively.

**Anti-pattern: Modeless navigation during assessment.** During an assessment session, the navigation should disappear. The teacher is not browsing. They are assessing. Persistent navigation during assessment invites interruption.

### Making the System Feel Trustworthy

Trust in an assessment system is built through three mechanisms:

**Consistency:** The same skill is always called the same thing. The same state always looks the same. The teacher never has to re-learn what amber means.

**Honesty about uncertainty:** The system should not show mastery confidence it doesn't have. When data is limited ("Only 3 exposures — more data needed"), say so explicitly rather than extrapolating a confident state from limited evidence.

**Responsiveness to teacher override:** When a teacher overrides a mastery state (marking something mastered that the system hasn't confirmed, or marking something not-mastered that the system has confirmed), the system accepts the override visibly and adjusts the student's profile immediately. Teachers trust systems that respect their professional judgment.

---

## 10. Codex Refactor Plan

### Guiding Constraint

All three phases of this refactor must leave the following untouched at the data and logic layer:
- Supabase schema and query logic
- EL assessment data flow and storage
- Mastery tracking algorithm and state machine
- Export generation and file format
- All admin and account management logic

The refactor is a surface-layer operation. New components render existing data differently. No data is moved, renamed, or restructured at the database level unless explicitly noted.

---

### PHASE 1: Foundation (Weeks 1–4)
*Goal: Establish the design system and replace the highest-friction screens without touching assessment logic.*

**1.1 — Design system implementation**

Establish the token system: color variables, typography scale, spacing scale, border radius constants, shadow constants. Apply to a global CSS/design token file. All subsequent work references these tokens — never hardcoded values.

This is the most important phase 1 task. Without consistent tokens, every subsequent screen is a negotiation. With tokens, every subsequent screen is a fill-in.

**1.2 — Navigation restructure**

Implement the 5-item top-level navigation architecture. Map existing pages to the new navigation:
- Today (new — built in phase 1)
- My Classes (rename and restructure existing class management)
- Assess (rename existing assessment entry points)
- Progress (consolidate existing analytics, reports, mastery views)
- Settings (consolidate existing admin, account, export)

This is a routing and layout change. Existing page content is not yet redesigned — it is just accessed through the new navigation. This gives teachers the new navigation immediately while the detailed page redesigns follow in Phase 2.

**1.3 — Today Dashboard (new screen)**

Build the Today Dashboard as a new screen. It reads from existing Supabase queries (recent sessions, active flags, mastery milestones). The data is already available — this is a new presentation layer over existing data.

The Today Dashboard becomes the default landing page on login. The previous landing page remains accessible through My Classes.

**1.4 — Assessment screen redesign**

The assessment screen (question presentation, response capture, session completion) is the highest-interaction screen in the system. Redesign the visual layout using the new design system tokens. Touch target sizes, button system, and visual hierarchy are updated. The underlying question delivery logic, response recording, and session management are not touched.

Key change: assessment navigation (sidebar, tabs) is hidden during an active assessment session. It returns on session completion.

**1.5 — Assessment completion states**

Redesign the session complete screen using the new design system. The plain-English result summary, the one-sentence interpretation, and the one recommended next step are added as a presentation layer over existing session result data.

**Phase 1 deliverable:** A teacher can navigate the app through the new navigation structure, land on the Today Dashboard, and complete an assessment session with the redesigned screen. All data is identical to pre-refactor. No EL assessment, export, or mastery logic has been touched.

---

### PHASE 2: Core Screens (Weeks 5–10)
*Goal: Redesign the primary teacher-facing screens using the new design system.*

**2.1 — Student Overview redesign**

Implement the three-layer student overview (15-Second View, Skill Coverage, Item-Level Detail) as a new layout over existing student data. The student profile Supabase query is unchanged. The rendering component is replaced.

Child Learning World evidence integration: add the one-line Learning World summary to the student overview, reading from existing game-layer data. No new data is created — existing session data from the Child Mode is summarized.

**2.2 — Class Dashboard redesign**

Implement the skill coverage bars and student list with sortable columns. The class-level skill coverage data is derived from existing mastery state data in Supabase — no new queries, new presentation logic.

Implement the filter system (by skill, by flag, by last active, by group). Filters operate client-side on the already-loaded student list where possible to avoid additional round trips.

**2.3 — Intervention Dashboard (new screen)**

Build the flagged students view as a dedicated screen under Progress → Flags & Interventions. This reads from the existing flags data (currently surfaced in the teacher dashboard in its original form) and presents it in the tiered structure (needs immediate attention / monitor / positive).

The flag logic itself (what triggers a flag, what the recommended action is) is unchanged. The presentation is new.

**2.4 — Context Card (assessment entry)**

Build the Context Card as a new screen that appears before assessment sessions launch. The Context Card reads from the student's recent session data (already in Supabase) and the current skill focus (from mastery state). It presents this as the 20-second orientation brief.

The assessment session launches from the Context Card — the existing session initialization logic is triggered from the new Context Card screen rather than from the previous entry point.

**2.5 — Checkpoint Card (mid-assessment)**

Build the Checkpoint Card as an interstitial that appears between skill sections during multi-skill assessment sessions. The checkpoint data (what was just assessed, how many correct) is derived from the session result data that already exists mid-session. The card surfaces this data before the teacher chooses to continue or end.

**2.6 — Mobile layout implementation**

Apply the responsive breakpoints to all redesigned screens. Tablet portrait and landscape layouts for all Phase 1 and Phase 2 screens. iPhone layout for Today, Class View, and Student 15-Second View only.

**Phase 2 deliverable:** The complete core teacher workflow — Today → Class → Student → Assessment → Results — is implemented with the new design system. Teachers can complete their daily workflow entirely through the new interface. All existing functionality remains accessible, now through the restructured navigation.

---

### PHASE 3: Polish and Advanced Screens (Weeks 11–16)
*Goal: Complete the redesign, address advanced workflows, and prepare for production.*

**3.1 — Progress analytics redesign**

Redesign the Progress section (class overview, skill coverage, individual history). Replace any existing data tables used as primary views with the new card and chart system. Data tables remain available as a secondary view (e.g., "View as table" option) but are not the default.

Implement the sparkline history view for individual students. Implement the class skill coverage heatmap (a grid of students × skills, using the 5-state color system).

**3.2 — Export and Reports redesign**

Redesign the export and reports workflow within Progress → Export. The export logic, file generation, and Supabase queries are unchanged. The UI for selecting export parameters, previewing report contents, and triggering generation is redesigned with the new design system.

EL assessment exports are tested explicitly at this stage to confirm the new UI is triggering existing export logic correctly.

**3.3 — Settings and Admin redesign**

Redesign the Settings section. Admin tools, class management, student code generation, account management. The underlying logic for all of these is unchanged. The presentation and navigation within Settings uses the new design system.

**3.4 — Question flagging workflow redesign**

The question flagging flow (available during assessment from the "Flag this question" text link) is redesigned. The flag submission flow, the review queue for flagged questions, and the resolution workflow are all implemented with the new design system.

The question bank management tools remain in Settings → Advanced, redesigned to the new visual system.

**3.5 — Onboarding and empty states**

Design and implement onboarding for new teachers (first login, class setup, first student assessment). Design empty states for all major screens (new teacher with no students, class with no recent sessions, student with no assessment data). Empty states should be informative — they tell the teacher what to do next, not just that there is nothing to show.

**3.6 — Cross-browser and cross-device testing**

Systematic testing on Chrome, Safari, Firefox. iOS Safari (iPhone and iPad). Windows Chrome. Specific attention to:
- Touch targets on iPad assessment screen
- Export file generation on all browsers
- EL assessment flow on iPad (primary assessment device in many classrooms)
- Session save/restore on interrupted sessions (tab closed mid-assessment)

**3.7 — Teacher validation sessions**

Conduct 3 structured observation sessions with classroom teachers who have not seen the redesigned interface. Observe where they hesitate, what they misread, what they cannot find. Address findings before launch.

Specific validation questions:
- Can a teacher complete a first-day assessment session in under 8 minutes without instruction?
- Can a teacher identify which students need attention tomorrow in under 60 seconds?
- Can a teacher export an EL assessment report without help?

**3.8 — Transition period**

For schools mid-year during the refactor rollout: maintain the ability to return to the previous interface via Settings → "Classic interface" for a 60-day transition period. This is a fallback only — it is not promoted, and it will be removed after the transition period. It exists to prevent mid-year disruption for teachers who are in the middle of assessment cycles.

**Phase 3 deliverable:** The complete Teacher Mode has been redesigned. All existing functionality is preserved and accessible. The visual system is consistent across all screens. Classroom teacher validation has been completed and feedback addressed. The system is ready for production deployment.

---

*LiteracyPath Teacher Assessment Module — UX/Workflow Architecture Review & Redesign v1*
*Companion documents: Child Learning Experience Layer v1, Adaptive Remediation & Scaffold Logic v1, QUESTION_VALIDITY_RULES.md*
*Preserved systems: EL assessment infrastructure, Supabase schema, mastery tracking logic, exports*
