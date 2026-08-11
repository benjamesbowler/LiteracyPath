# Maths manipulatives, learning activities and arcade games

## 1. Shared manipulative API

Every manipulative is a controlled component. It renders from serialisable state
and emits semantic changes. Assessment never infers meaning from pixel position.

```ts
type MathsManipulativeProps<TState, TAction> = {
  state: TState;
  mode: "explore" | "guided" | "assessment" | "presentation";
  readOnly?: boolean;
  maxValue?: number;
  highlight?: Record<string, unknown>;
  onAction(action: TAction): void;
  onStateChange(next: TState): void;
  announce(message: string): void;
};
```

Required component behaviour:

- pointer, touch and keyboard parity;
- tap-to-place alternative for every drag;
- undo, reset and replay-model controls;
- deterministic state serialisation;
- no correctness styling until the learner submits;
- accessible count/structure summary;
- 56px primary targets and 8px separation;
- no colour-only grouping;
- reduced-motion state transitions;
- no free drawing, camera or child media.

## 2. Launch manipulatives

### 2.1 Counter Tray

- Skills: counting, comparison, sharing, grouping, addition/subtraction.
- State: `{ counters: [{id, groupId, slot}], groups: [{id, capacity}] }`.
- Actions: add, remove, select, move-to-group, deal-next, clear.
- Constraints: maximum 40 visible counters; overflow switches to bundles.
- Accessibility: arrow keys choose group; Space adds/moves; text announces counts.

### 2.2 Five Frame

- Skills: quantities to 5, subitising, parts.
- State: five boolean cells plus optional second-colour partition.
- Fill order can be canonical, learner-chosen or authored.
- Assessment stores occupied cell IDs as well as total.

### 2.3 Ten Frame / Double Ten Frame

- Skills: make ten, teen numbers, facts within 20.
- State: 10 or 20 cells, each `empty | part_a | part_b`.
- Modes: fill-left-to-right, free arrangement, flash/hide, missing part.
- Never animate filled cells into a different count without a visible transition.

### 2.4 Rekenrek

- Skills: five structure, part–whole, addition/subtraction.
- Two rows of 10 beads with five/five colour grouping plus shape/texture cue.
- Tap a target position as alternative to bead dragging.
- State records beads moved per row, not raw pixel offset.

### 2.5 Number Line

- Skills: sequence, compare, count on/back, difference, patterns.
- State: range, start, current, jumps and hidden labels.
- A jump is `{from,to,direction,magnitude}`.
- Assessment can require endpoint, jump sequence or missing label.
- Starting number is visually distinct from first landing.

### 2.6 Part–Whole Model

- Skills: partitioning, bonds, unknown part, inverse operations.
- State: whole plus two or three parts, with one optional unknown.
- Supports counters, numerals and expressions in separate modes.
- No automatic equation until the learner/teacher reveals the bridge.

### 2.7 Base-Ten Blocks and Place-Value Chart

- Skills: tens/ones, hundreds, regrouping and renaming.
- Semantic units: one, ten, hundred; no perspective-driven visual ambiguity.
- Trade action: 10 ones ↔ 1 ten; 10 tens ↔ 1 hundred.
- Every trade visibly conserves quantity and is reversible.

### 2.8 Bar Model

- Skills: additive comparison, part–whole, equal groups.
- Bars snap to semantic values, not freehand length.
- Labels can be hidden while value relationship remains accessible.

### 2.9 Balance Scale

- Skills: equality, missing values, mass comparison.
- State derives tilt from semantic total, with neutral animation.
- Equality means equivalent value, not merely matching object count.

### 2.10 Clock Face

- Skills: o’clock, half-hour, quarter-hour.
- Hands move together according to real clock relationships.
- Tapping a minute marker moves both hands correctly.
- Text alternative announces “half past three,” not only `3:30`.

### 2.11 Coin Tray

- Skills: recognise and combine money values.
- Locale-owned coin set; launch is AUD.
- Coin diameter, colour and face are not the only value cues; value available in
  accessible label.
- Reports store values in minor currency units.

### 2.12 Shape Builder and Sorter

- Skills: attributes, composition, position.
- Shape data is mathematical geometry, not an image classifier.
- Supports rotation, reflection where appropriate, side/corner/face highlights.
- Sorting rules are authored and announced.

## 3. Lesson activity recipes

Each skill ships with five activity recipes:

```ts
type MathsActivityRecipe = {
  id: string;
  skillId: string;
  phase: "retrieve" | "model" | "guided" | "independent" | "transfer";
  manipulativeId: string;
  instructionText: string;
  instructionAudioPath: string;
  initialState: Record<string, unknown>;
  targetState?: Record<string, unknown>;
  feedbackRules: Array<Record<string, unknown>>;
  evidenceSource: "guided_practice" | "independent_practice";
};
```

Example:

```js
{
  id: "F-N-PART-10-guided-make-7",
  skillId: "F-N-PART-10",
  phase: "guided",
  manipulativeId: "ten_frame",
  instructionText: "Make seven with five and some more.",
  instructionAudioPath: "/audio/production/en-US/maths_instruction/make-seven-with-five-and-some-more.mp3",
  initialState: { cells: ["part_a","part_a","part_a","part_a","part_a",null,null,null,null,null] },
  targetState: { total: 7, partA: 5, partB: 2 },
  feedbackRules: [
    { when: { total: 6 }, say: "You made six. Add one more to make seven." },
    { when: { total: 8 }, say: "You made eight. Remove one to make seven." },
    { when: { total: 7 }, say: "Five and two make seven." }
  ],
  evidenceSource: "guided_practice"
}
```

## 4. Arcade games

Every game maps the learning decision directly to the game action. Games generate
practice evidence only and cannot independently create `Secure` status.

### Game 1 — Number Trail

- Target: sequence, compare and number-line magnitude.
- Genre: side-scrolling stepping-stone journey.
- Learning action: select the next valid numbered stone or land at a requested
  number after a shown jump.
- Core loop: hear/read goal → inspect 3–5 reachable stones → choose → specific
  feedback → route extends.
- Levels:
  - F: sequence within 10/20;
  - Y1: missing numbers and ±1/±2 within 120;
  - Y2: open-line jumps within 1,000.
- Wrong response: stone remains stable; Sage says, “You started at 8. One more is
  9. Try the stone marked 9.”
- Anti-guessing: stone positions and distractor distances rotate; no answer glow.
- Completion: 8 mathematical decisions, then a natural campsite stop.

### Game 2 — Ten-Frame Tetris: Frame Foundry

- Target: subitising, make-five/make-ten and number bonds.
- Genre: calm falling-piece placement, no failure timer.
- Learning action: choose or rotate a counter piece to complete a requested frame.
- Pieces represent 1–5 structured counters, never arbitrary decorative blocks.
- F: fill to 5/10; Y1: missing part to 10; Y2: two frames and make-ten facts.
- Accessibility: choose destination cells by tap or keyboard; falling motion can be
  paused/reduced; correctness never depends on reaction speed.

### Game 3 — Parcel Sorter

- Target: place value and number representation.
- Genre: conveyor sorting workshop.
- Learning action: route a parcel labelled with a numeral to the matching base-ten
  model, expanded form or spoken number.
- Levels: teen numbers; tens/ones to 120; hundreds/tens/ones to 1,000.
- Misconception feedback: for 42 routed to 4 ones/2 tens, physically rebuild and
  say, “The 4 is in the tens place: four tens.”
- Conveyor pauses during thinking; no answer can be missed through delay.

### Game 4 — Bridge Builder

- Target: addition/subtraction strategy and equivalence.
- Genre: build a bridge across a stream using value-length segments.
- Learning action: select two or more parts whose values make the target span.
- F: parts to 5/10; Y1: bonds and facts to 20; Y2: equivalent expressions.
- Multiple valid solutions are intentionally accepted and compared.
- Final replay overlays part–whole/bar model, then removes labels for transfer.

### Game 5 — Equal Picnic

- Target: sharing, grouping and early multiplicative thinking.
- Genre: prepare plates for Meadow characters.
- Learning action: deal or group exact quantities equally.
- Game cannot advance until equal groups are mathematically valid; an unequal
  attempt receives a repair invitation, never lost points.
- Levels: two-way sharing; number of groups versus group size; remainders discussed
  but not hidden.

### Game 6 — Shape Shipyard

- Target: shape attributes, composition and position.
- Genre: assemble boats/rockets from geometric pieces that meet specifications.
- Learning action: choose every piece satisfying an attribute rule, then compose.
- Includes rotated, narrow, large and small valid examples plus close nonexamples.
- Creative free-build is separated from assessed/practice rounds and stores no
  mastery evidence.

### Game 7 — Clockwork Station

- Target: sequencing time and reading analogue clocks.
- Genre: schedule trains/characters on a station timeline.
- Learning action: set the clock or select the event before/after a target time.
- Clock hands remain mechanically linked.
- No real-time waiting, countdown pressure or “late” shame.

### Game 8 — Data Detective

- Target: sorting, tallying, graphs and comparison.
- Genre: investigate a Meadow event by organising evidence tokens.
- Learning action: classify a fixed dataset, build a display and answer a question
  whose answer is visible in the completed representation.
- Graph scale and category totals are explicit.
- Y2 introduces comparison and one-step “how many more?” reasoning.

## 5. Game code contract

```ts
type MathsGameDefinition = {
  id: string;
  title: string;
  skillIds: string[];
  constructStatement: string;
  rounds: 8;
  createRound(context: {
    year: "F" | "1" | "2";
    skillId: string;
    seed: string;
    priorItemKeys: string[];
  }): MathsGameRound;
  evaluate(round: MathsGameRound, action: Record<string, unknown>): {
    correct: boolean;
    feedbackText: string;
    misconceptionCodes: string[];
  };
};
```

Deterministic round generation uses a seed stored with evidence. Replays can
reconstruct the exact prompt and mathematical model.

## 6. Teacher resources

### Maths Presentation / Number Talk

Modes:

- flash quantity;
- which one does not belong;
- same total, different representation;
- estimate then reveal;
- build the number;
- true/false equation;
- notice and wonder;
- story problem reveal;
- worked-example comparison.

Teacher controls freeze, reveal, annotate with prepared arrows/frames, switch
representation and launch a paired discussion. No freeform child responses are
uploaded.

### Small-group composer

Inputs: learners, target skill, misconception pattern, duration (8/12/20 minutes),
available physical materials and representation stage.

Output recipe:

```text
Retrieve (2 min) → Model (3 min) → Make/Explain (6 min) → Transfer (4 min)
→ Exit observation (2 min)
```

Every plan includes exact teacher language, likely learner responses, repair
prompts, materials and a `not checked` option.

### Worksheet generator

Launch templates:

- count and match;
- ten-frame make/complete;
- part–whole models;
- number-line hops;
- tens/ones build and partition;
- story problem draw/build/write;
- equal groups and arrays;
- shape attribute sort/cut;
- informal measurement;
- clock matching;
- picture graph read/build;
- family maths game cards.

Print rules: A4 and US Letter, grayscale-safe, no essential colour, 12pt teacher
notes, 18pt child numerals minimum, manipulatives at real-world consistent scale,
answer page always generated, and stable recipe saved rather than a PDF blob.

### Family Bridge

No family account required. Output one five-minute activity using common household
objects, exact adult language, what to notice and one gentle extension. It never
claims completion or asks for child media.

Example:

```text
Find 10 small safe objects. Put 6 on one plate and the rest on another. Ask:
“How many are on this plate? How many are on that plate? How many altogether?”
Move one object. Ask what changed and what stayed the same.
```

## 7. Game release gates

1. learning action is the game action;
2. all round states are reachable and solvable;
3. every accepted solution is mathematically valid;
4. distractors do not reveal the answer through position/art;
5. speed, steering and device performance do not determine correctness;
6. touch, keyboard and tap-alternative paths pass;
7. reduced motion is complete and playable;
8. audio has visible equivalent and replay;
9. evidence is reconstructable from stored seed/model;
10. retry feedback names the mathematical contrast;
11. 320px landscape-height and standard iPad views pass;
12. 100 complete simulated trails contain no unreachable skill or repeated answer
    pattern.
