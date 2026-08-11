# Maths content launch pack

All text in this document is original LiteracyPath launch content. Number Stories
are narrated read-with-help experiences. A child may listen, point, move objects
and discuss mathematics without being assessed on decoding.

## 1. Number Story format

```ts
type MathsStory = {
  id: string;
  title: string;
  year: "F" | "1" | "2";
  skillIds: string[];
  mathsPromise: string;
  vocabulary: string[];
  pages: Array<{
    pageNumber: number;
    exactText: string;
    illustrationBeat: string;
    interactiveModel?: Record<string, unknown>;
  }>;
  teacherPrompts: string[];
  familyPrompt: string;
};
```

Page art may contain countable objects only when their exact number and placement
are specified. Decorative objects must not look countable or be placed near the
mathematical collection.

## 2. Complete Number Stories

### Story 1 — Five Buns for the Picnic

- ID: `maths-story-f-five-buns`
- Year/skills: Foundation; `F-N-SUBITISE-5`, `F-N-PART-5`
- Promise: five remains the whole when separated into different parts.
- Vocabulary: five, altogether, part, whole, same

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | Cuddly carries five buns to the picnic. | One plain basket containing exactly five identical buns in a clear 4-and-1 arrangement. |
| 2 | “Five altogether,” says Cuddly. | Five buns move into a canonical five-frame; no other food visible. |
| 3 | Two buns sit on the red cloth. | Exactly two buns on a red cloth; three remain visibly in basket. |
| 4 | Three buns stay in the basket. | Close view of exactly three buns in basket and two on cloth. |
| 5 | Two and three make five. | Interactive part–whole model: parts 2 and 3, whole 5. |
| 6 | Splashy moves one bun. Now three are on the cloth. | One animated move from basket to cloth; state becomes 3 and 2. |
| 7 | Three and two still make five. | Part–whole model updates to parts 3 and 2, whole 5. |
| 8 | The parts changed. The whole stayed five. | All five buns reunite in one row; simple final equation `2 + 3 = 5` appears outside art. |

Teacher prompts: “How did you see five?” “What changed?” “What stayed the same?”
Family prompt: Arrange five safe household objects in two groups. Move one and say
the two parts and the whole.

### Story 2 — Ten Lights at the Barn

- ID: `maths-story-f-ten-lights`
- Year/skills: Foundation; `F-N-PART-10`
- Promise: ten can be composed in many ways using a ten frame.
- Vocabulary: ten, empty, full, more, altogether

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | The barn has ten hooks for ten little lights. | Empty two-row ten-frame shaped as barn hooks. |
| 2 | Muddy hangs five lights on the top row. | Top row exactly five filled; bottom row empty. |
| 3 | “Five more will fill the frame,” says Splashy. | Five empty cells visibly pulse without colour-only cue. |
| 4 | Splashy adds two lights below. | Bottom row contains exactly two; total seven. |
| 5 | Five and two make seven. Three spaces are empty. | Frame plus part–whole model 5, 2, total 7; three outlined vacancies. |
| 6 | Muddy adds three more lights. | Three lights move into remaining cells. |
| 7 | Seven and three make ten. The frame is full. | Full ten frame and equation `7 + 3 = 10`. |
| 8 | Ten lights glow. Five above and five below. | Stable full frame; equation `5 + 5 = 10`; restrained warm glow. |

Teacher prompts: “How many empty spaces?” “How many more to make ten?” “Show a
different way to split ten.”
Family prompt: Draw ten boxes and place small objects in some boxes. Ask how many
more are needed to fill all ten.

### Story 3 — Where Did the Duckling Go?

- ID: `maths-story-f-duckling-away`
- Year/skills: Foundation; `F-N-ADD-TAKE`
- Promise: taking away changes the quantity; the missing part can be found.
- Vocabulary: first, went away, left, take away, now

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | Four ducklings paddle beside Splashy. | Exactly four yellow ducklings, separate from Splashy. |
| 2 | Splashy counts them: one, two, three, four. | Ducklings align with four count markers. |
| 3 | One duckling follows a dragonfly behind the reeds. | One of the four visibly moves behind a reed screen. |
| 4 | Four take away one leaves three. | Exactly three ducklings visible; covered region labelled with one hidden marker for teacher view. |
| 5 | Splashy sees three ducklings. “One is away.” | Three remain, with one empty place in a four-frame. |
| 6 | The dragonfly loops back. The duckling follows. | Hidden duckling returns along a clear path. |
| 7 | Three and one make four again. | Three visible plus returning one; equation `3 + 1 = 4`. |
| 8 | All four ducklings paddle beside Splashy. | Exactly four in a compact group; no extra birds. |

Teacher prompts: “What was the whole?” “Which part went away?” “How do the two
equations tell the same story?”
Family prompt: Tell take-away stories with four spoons or blocks; always recount the
starting whole and what remains.

### Story 4 — Berries for Every Plate

- ID: `maths-story-f-fair-share`
- Year/skills: Foundation/Year 1; `F-N-SHARE`, `1-N-SHARE-GROUP`
- Promise: equal sharing gives each group the same amount.
- Vocabulary: share, equal, each, same, left over

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | Woolly finds six berries for two picnic plates. | Exactly six berries in central bowl; two empty plates. |
| 2 | Woolly puts two berries on one plate and four on the other. | Unequal 2/4 distribution, clearly separated. |
| 3 | “That is not equal,” says Tiny. | Comparison brackets show different quantities without red shame cue. |
| 4 | Tiny deals one berry to each plate. | Reset to six in bowl; first deal creates 1/1. |
| 5 | Tiny deals one to each plate again. | Second deal creates 2/2. |
| 6 | Tiny deals the last two berries. | Final deal creates 3/3 and empty bowl. |
| 7 | Each plate has three. The share is equal. | Two plates, exactly three berries each; `6 shared into 2 equal groups`. |
| 8 | Woolly and Tiny each choose one berry. Plenty remain for the picnic. | Keep two plates at 3/3 before eating; consumption shown only after maths state is established. |

Teacher prompts: “How do you know it is equal?” “What is the number of groups?”
“How many are in each group?”
Family prompt: Share an even number of safe objects between two people by dealing
one at a time.

### Story 5 — The Short Bridge and the Long Bridge

- ID: `maths-story-f-compare-length`
- Year/skills: Foundation/Year 1; `F-M-COMPARE`, `1-M-LENGTH`
- Promise: length comparison requires the same starting point and uniform units.
- Vocabulary: longer, shorter, same start, unit, end

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | Brave needs a bridge across a narrow stream. | Narrow stream and two loose planks; no misleading perspective. |
| 2 | One plank looks longer because it starts farther ahead. | Misaligned planks shown parallel with different start points. |
| 3 | Tiny lines up both planks at the same stone. | Left ends aligned to one visible baseline. |
| 4 | Now the blue plank reaches farther. It is longer. | Aligned comparison; blue plank endpoint visibly beyond tan. |
| 5 | They measure the blue plank with six equal blocks. | Exactly six identical, gap-free blocks along plank. |
| 6 | The tan plank is four equal blocks long. | Exactly four identical blocks, same unit size. |
| 7 | Six is more than four. The blue plank is longer. | Both measurements shown together with `6 > 4`. |
| 8 | The long plank reaches across. Brave walks over safely. | Blue plank spans stream; blocks removed so they are not recounted. |

Teacher prompts: “Why must the ends line up?” “What would happen if our units had
different sizes?”
Family prompt: Compare two pencils or ribbons from the same starting line.

### Story 6 — The Shape Parade

- ID: `maths-story-f-shape-attributes`
- Year/skills: Foundation/Year 1; `F-SP-SHAPES`, `1-SP-SHAPES`
- Promise: defining attributes stay true when size, colour or orientation changes.
- Vocabulary: side, corner, curved, straight, turn

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | Four shapes wait for the Meadow Parade. | Circle, triangle, square and non-square rectangle, neutral colours. |
| 2 | The triangle turns. It still has three straight sides. | Same triangle rotates 90 degrees; sides highlighted sequentially. |
| 3 | The square grows bigger. It still has four equal sides. | Small and large square side-by-side. |
| 4 | The rectangle turns tall. It still has four straight sides. | Same rectangle rotates; corners remain marked. |
| 5 | The circle rolls. It has one curved edge and no corners. | Circle rolls along baseline; no face or wheel context. |
| 6 | Cuddly sorts shapes with three sides. | Several varied triangles selected; nonexamples remain. |
| 7 | Splashy sorts shapes with four straight sides. | Squares and rectangles of varied orientation selected. |
| 8 | Shapes can turn, grow or change colour. Their defining clues stay true. | Attribute chart with icons for sides/corners, not colour categories. |

Teacher prompts: “Which clues matter?” “Which details do not change the shape’s
name?”
Family prompt: Find shapes around the room and describe sides, corners and curves.

### Story 7 — Twelve Seeds for the Garden

- ID: `maths-story-1-teen-number`
- Year/skills: Year 1; `1-N-PLACE`, `1-N-PARTITION`
- Promise: twelve is one ten and two ones.
- Vocabulary: twelve, ten, ones, bundle, partition

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | Tiny has twelve seeds for a new garden row. | Exactly twelve large countable seed tokens in tray. |
| 2 | Counting loose seeds is slow. One rolls away, then comes back. | Twelve remain after brief movement; no quantity change claimed. |
| 3 | Tiny fills one ten-frame. | Exactly ten seeds fill frame; two remain loose. |
| 4 | One full ten and two ones make twelve. | Ten-frame plus two loose; numeral 12 with place-value labels. |
| 5 | The 1 in twelve means one ten. | Tens digit connected to full frame. |
| 6 | The 2 in twelve means two ones. | Ones digit connected to two loose seeds. |
| 7 | Tiny plants one row of ten and one row of two. | Exact 10-and-2 garden layout. |
| 8 | Twelve can be seen as ten and two. The garden is ready. | Stable representation plus `12 = 10 + 2`. |

Teacher prompts: “What does each digit tell us?” “Show twelve another way.”
Family prompt: Make teen numbers with one bundle of ten and loose objects.

### Story 8 — Two Paths to Twenty

- ID: `maths-story-1-two-paths-twenty`
- Year/skills: Year 1/2; `1-N-ADD-20`, `2-N-FACTS-20`
- Promise: different strategies can produce the same total.
- Vocabulary: count on, make ten, double, strategy, total

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | Bouncy needs twenty flags. He has eight red flags and twelve blue flags. | Exact collections 8 and 12, arranged in frames. |
| 2 | Bouncy counts every flag from one. He reaches twenty, but it takes a while. | Count markers 1–20 appear; no speed judgement. |
| 3 | Woolly moves two blue flags beside the eight red flags. | Visible compensation: 8 + 2 becomes 10; 10 blue remain. |
| 4 | Ten and ten make twenty. | Two full ten-frames and `10 + 10 = 20`. |
| 5 | Splashy starts at twelve and counts on eight. | Open number line from 12 with jumps +5 and +3 to 20. |
| 6 | Twelve plus eight also makes twenty. | Equation `12 + 8 = 20` linked to line. |
| 7 | Counting all, making ten and counting on reached the same total. | Three strategy cards; none ranked universally best. |
| 8 | Bouncy chooses making ten and hangs all twenty flags. | Exactly twenty flags in two rows of ten. |

Teacher prompts: “Which strategy was easiest to explain?” “Would the same strategy
help with 9 + 11?”
Family prompt: Solve one addition in two ways and draw both strategies.

### Story 9 — Bundles in the Barn

- ID: `maths-story-2-place-value`
- Year/skills: Year 2; `2-N-PLACE`
- Promise: a three-digit number can be renamed without changing its value.
- Vocabulary: hundred, tens, ones, regroup, rename

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | The barn stores one hundred twenty-three craft sticks. | Place-value model: 1 hundred flat, 2 ten bundles, 3 ones. |
| 2 | One hundred, two tens and three ones make 123. | Place-value chart and numeral 123. |
| 3 | Cuddly opens the hundred pack. | Hundred flat transforms into ten bundles of ten. |
| 4 | Now there are twelve tens and three ones. | Exactly twelve ten-rods and three ones; `123 = 12 tens + 3 ones`. |
| 5 | The amount did not change. Only the groups changed. | Balance/equivalence bridge between representations. |
| 6 | Cuddly opens one ten bundle. | One ten transforms into ten ones. |
| 7 | Eleven tens and thirteen ones still make 123. | Exact 11 tens and 13 ones, grouped countably. |
| 8 | A number can be renamed when its total value stays the same. | Three equivalent place-value cards connected by equals signs. |

Teacher prompts: “What changed?” “What stayed equal?” “Why can 123 have thirteen
ones?”
Family prompt: Bundle straws or draw tens and ones; trade one ten for ten ones.

### Story 10 — The Two-by-Five Garden

- ID: `maths-story-2-arrays`
- Year/skills: Year 2; `2-N-MULT-2`, `2-N-GROUP-SHARE`
- Promise: equal groups and arrays show multiplicative structure.
- Vocabulary: row, equal groups, two groups, five in each, total

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | Muddy has ten seedlings and two garden rows. | Exactly ten seedling tokens and two empty row guides. |
| 2 | He puts six in one row and four in the other. | Unequal 6/4 state. |
| 3 | “The rows need equal spaces,” says Tiny. | Row guides highlight mismatched length without calling answer wrong emotionally. |
| 4 | They move one seedling. | One moves from 6-row to 4-row. |
| 5 | Now there are two equal rows of five. | Clear 2 × 5 array. |
| 6 | Five plus five makes ten. | Rows bracketed as 5 + 5. |
| 7 | Two groups of five also make ten. | Same array labelled `2 groups of 5`. |
| 8 | The garden array helps them see the groups and the total. | Final planted array; no extra flowers. |

Teacher prompts: “How many groups?” “How many in each group?” “What does the array
make easy to see?”
Family prompt: Arrange ten objects into equal rows in more than one way.

### Story 11 — Picnic at Half Past Three

- ID: `maths-story-2-time`
- Year/skills: Year 2; `2-M-TIME`
- Promise: the minute hand and hour hand work together to show time.
- Vocabulary: hour hand, minute hand, half past, before, after

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | The picnic begins at half past three. | Analogue clock set exactly 3:30; digital text outside art. |
| 2 | At three o’clock, the long minute hand points to twelve. | Clock 3:00; hour hand at 3, minute hand at 12. |
| 3 | Thirty minutes pass. The minute hand moves halfway around. | Animated half-turn ending at 6. |
| 4 | The short hour hand moves halfway between three and four. | Clock 3:30 with accurate hour-hand position. |
| 5 | This is half past three. | Labelled clock 3:30; no ambiguous straight-up hour hand. |
| 6 | Woolly arrives at three o’clock. She is early. | Timeline: 3:00 before 3:30. |
| 7 | Splashy arrives at four o’clock. He is late. | Timeline: 4:00 after 3:30. |
| 8 | At half past three, the friends open the picnic basket together. | Clock remains 3:30; action begins only then. |

Teacher prompts: “Where is the hour hand at half past?” “Which time is before the
picnic?”
Family prompt: Find an analogue clock and make an o’clock and half-past time.

### Story 12 — A Blanket in Equal Parts

- ID: `maths-story-2-fractions`
- Year/skills: Year 2; `2-N-FRACTIONS`
- Promise: fractional parts must be equal parts of the same whole.
- Vocabulary: whole, half, quarter, eighth, equal parts

| Page | Exact narration text | Illustration and interaction beat |
|---:|---|---|
| 1 | Cuddly makes one rectangular picnic blanket. | One clean rectangle on grid, no pattern yet. |
| 2 | A line down the middle makes two equal parts. | Vertical midpoint line; halves congruent. |
| 3 | Each equal part is one half of the whole blanket. | One half shaded with outline and `1/2` outside art. |
| 4 | Another middle line makes four equal parts. | Horizontal midpoint line creates four equal rectangles. |
| 5 | Each equal part is one quarter of the whole. | One quarter identified; all remain visibly equal. |
| 6 | Cuddly splits every quarter into two equal parts. | Each quarter bisected consistently, making eight equal parts. |
| 7 | Now the blanket has eight equal parts. Each is one eighth. | One eighth identified and `1/8` shown. |
| 8 | The names changed because the whole was divided into more equal parts. | Side-by-side same-size wholes divided into 2, 4, 8 equal parts. |

Teacher prompts: “Why must the parts be equal?” “Which is larger, one half or one
eighth of the same whole?”
Family prompt: Fold equal sheets of paper into halves and quarters and name one part.

## 3. Original maths songs

Songs support recall, language and movement. A song performance is not assessment
evidence. Produce an instrumental mix and a LEDA guide-vocal mix; use original or
properly licensed music only.

### Song 1 — Step and Count to Twenty

Target: stable number sequence and one action per count. Tempo: 104 BPM, 4/4.

```text
Verse 1
One, two, step with you,
Three, four, touch the floor,
Five, six, gentle kicks,
Seven, eight, stand up straight,
Nine, ten, start again.

Verse 2
Eleven, twelve, reach the shelf,
Thirteen, fourteen, march between,
Fifteen, sixteen, keep the beat,
Seventeen, eighteen, move your feet,
Nineteen, twenty — stop! We counted plenty.

Chorus
One word, one step, keep them side by side.
The last number tells how many in the line.
```

### Song 2 — Five and Some More

Target: subitising five as an anchor. Tempo: 92 BPM, hand-clap groove.

```text
Five in the frame and one down low:
Five and one makes six — I know.
Five in the frame and two in view:
Five and two makes seven — true.
Five and three makes eight for me.
Five and four makes nine once more.
Five and five makes ten — full frame!
See the five, then add the same.
```

### Song 3 — Friends of Ten

Target: number bonds to ten. Tempo: 112 BPM, call-and-response.

```text
Leader: Zero needs a friend.
Group: Ten!
Leader: One needs a friend.
Group: Nine!
Leader: Two needs a friend.
Group: Eight!
Leader: Three needs a friend.
Group: Seven!
Leader: Four needs a friend.
Group: Six!
Leader: Five meets five in the middle.
Group: Every pair makes ten!

Chorus
Parts can change, the whole stays ten.
Break it, make it, build it again.
```

### Song 4 — Count On, Don’t Start Over

Target: counting-on addition strategy. Tempo: 100 BPM.

```text
Keep the bigger number safe inside your head.
Show the extra hops that still must travel ahead.
Start at eight: nine, ten, eleven.
Eight plus three is eleven.

Count on, don’t start over.
Hold the start and move along.
Each hop lands on one new number.
The landing tells where you belong.
```

### Song 5 — Back We Go

Target: subtraction as movement back while retaining start/landing distinction.

```text
Start at nine, mark the place.
Take away three at a steady pace.
One hop: eight. Two hops: seven.
Three hops: six is where we land.

Back we go, one hop at a time.
Count the hops, then read the line.
The start is nine, the change is three.
Six are left for us to see.
```

### Song 6 — Tens and Ones Workshop

Target: place value. Tempo: 96 BPM, light workshop percussion.

```text
Ten little ones make one bundle of ten.
Tie them together, then count on again.
Two tens, three ones: twenty-three.
The place of each digit shows its value to me.

Tens on the left, ones on the right.
Build it with blocks and check that it’s right.
A zero can hold an empty place:
Two-oh-five has no tens in that space.
```

### Song 7 — Twos, Fives and Tens Train

Target: grouped skip counting. Tempo: 118 BPM.

```text
Two wheels per bike: two, four, six, eight, ten.
Count equal groups and do it again.
Five fingers per hand: five, ten, fifteen, twenty.
Count equal groups — there are plenty.
Ten in each frame: ten, twenty, thirty, forty.
Skip-count the groups, then check every quantity.

Chorus
Do not just chant — show every group.
Count what is grouped in each number loop.
```

### Song 8 — Share It Fair

Target: equal sharing. Tempo: 88 BPM, gentle waltz.

```text
One for you and one for me,
Deal each turn as equally.
Round by round until they’re gone,
Then compare what’s on each one.

Same in every group means fair.
Count each group and check the share.
Name the groups, name each amount,
Multiply or add to check the count.
```

### Song 9 — Shape Clue Crew

Target: defining shape attributes, not prototypes.

```text
Turn a triangle upside down:
Three straight sides are still around.
Stretch a rectangle tall and thin:
Four straight sides and corners win.
A circle curves with corners none.
A square has equal sides — all four, not one.

Chorus
Size can change and colours can too.
Sides, corners, faces — follow the clue.
```

### Song 10 — Measure from the Start

Target: iterating uniform units with aligned origin.

```text
Line up the start, leave no gap,
No overlap along the map.
Use the same unit end to end,
Count each unit, then check again.

Longer, shorter, equal length:
Same-size units give the evidence strength.
Line up the start, measure each part,
That is the way that measures begin.
```

## 4. Story discussion and evidence boundary

Each story supplies:

- one before-reading notice prompt;
- two pause-and-model interactions;
- one after-reading “show it another way” prompt;
- one printable family activity using common objects;
- no scored comprehension quiz required for access;
- optional teacher observation saved only when the teacher explicitly records it.

The story reader must expose narration, page replay, large text, image description,
interactive model reset and teacher pause controls. It must never record a child’s
voice or image.
