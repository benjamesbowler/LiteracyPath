# LiteracyPath Worksheet Design Bible

**Policy version:** `2026-08-01.1`
**Applies to:** every generated, downloaded or printed LiteracyPath worksheet and practice pack for learners aged 4–12.
**Parent standard:** [Question Design Bible](QUESTION_DESIGN_BIBLE.md).
**Permanent gates:** `npm run check:worksheet-design-policy` and `npm run check:worksheet-print-layout`

This is the canonical standard for a worksheet as a complete learning object. The Question Design Bible still governs every closed question, answer, distractor and evidence claim inside it. This Bible adds the rules that only appear at page and pack level: sequence, print layout, writing space, images, examples, accessibility, page uniqueness and deterministic generation.

A worksheet is not finished because it fills an A4 page. It is finished when a child can understand what to do, practise the intended construct without avoidable barriers, produce an interpretable response, and move through a genuine progression. Repeating page 1 with a new page number or rotating the same small list is a release failure.

Routine human sign-off is not required. Automated policy checks, rendered print checks and content evidence are publication gates; observation by children and teachers informs later improvements.

---

## Part I — Research base

### 1. Instruction comes before decoration

The DfE Reading Framework treats phonemic awareness, phonics, handwriting, spelling, fluency and comprehension as related but distinct instructional work. It describes handwriting as explicit teaching of posture, grip, movement and correct letter formation, and it requires early reading material to align with taught grapheme–phoneme correspondences. A worksheet must therefore name its exact construct and use only knowledge available at that curriculum point. [DfE Reading Framework](https://www.gov.uk/government/publications/the-reading-framework-teaching-the-foundations-of-literacy)

The DfE Writing Framework describes writing as transcription and composition supported by explicit teaching, practice and increasingly independent application. LiteracyPath uses that direction to organise packs from modelled access through supported construction to retrieval, rather than making every page the same activity with more items. [DfE Writing Framework](https://www.gov.uk/government/publications/the-writing-framework)

The What Works Clearinghouse recommends explicit sound–letter instruction, decoding and word analysis, and daily connected-text reading for early readers. Older pupils need purposeful fluency, vocabulary, knowledge and comprehension work, not enlarged early-years tracing sheets. [IES/WWC Foundational Skills, K–3](https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published) and [IES/WWC Reading Interventions, Grades 4–9](https://ies.ed.gov/ncee/WWC/PracticeGuide/29)

### 2. Young learners need visible examples and concrete response mechanics

Cambridge Pre A1 Starters gives an example before each task type, uses familiar topics, short instructions, picture-led items, letter-count dashes, jumbled-letter spelling, picture-supported cloze and one-word responses. These features reduce irrelevant language and memory load while leaving the literacy target visible. LiteracyPath adopts the same principles for Band A and unfamiliar mechanics in every band. [Cambridge Pre A1 Starters format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/format/) and [Young Learners handbook](https://www.cambridgeenglish.org/images/153612-yle-handbook-for-teachers.pdf)

CAST's UDL Guidelines call for multiple ways to perceive information, clarification of vocabulary and symbols, support for decoding, purposeful use of multiple media, visible patterns, graduated challenge, useful feedback and varied forms of response. A worksheet can therefore combine image, print, example, oral support from an adult and writing—but each support must preserve the construct rather than reveal the answer. [CAST UDL Guidelines 3.0](https://udlguidelines.cast.org/more/about-guidelines-3-0/)

### 3. Readability is an access requirement

The British Dyslexia Association recommends clear sans-serif type, sufficient letter and word spacing, larger regular text, left alignment, adequate line spacing, and avoidance of long passages in italics, underlining or all capitals. LiteracyPath uses those as minimum print conventions, while allowing larger type and writing spaces for younger learners. [BDA Style Guide](https://cdn.bdadyslexia.org.uk/uploads/documents/Advice/style-guide/BDA-Style-Guide-2023.pdf?v=1680084017)

RNIB describes 14-point text as clear print. LiteracyPath treats 14 point as a floor for ordinary child-facing printed instructions and uses larger text for Band A targets. [RNIB Confident Living: Reading](https://media.rnib.org.uk/documents/Confident_Living_-_Reading_2022.pdf)

WCAG 2.2 requires at least 4.5:1 contrast for ordinary text and 3:1 for large text, and says colour cannot be the only way information is conveyed. Although worksheets are printed, the same perceptual principles apply to generated HTML and to colour or greyscale printing. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), [contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) and [use of colour](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)

### 4. Images must do instructional work

Representational images can support a task when they carry necessary meaning, while irrelevant decorative images can compete for attention. Research on test items found that the multimedia and coherence principles transfer to educational testing, and experimental work has found a small detrimental comprehension effect from irrelevant decorative pictures in some contexts. LiteracyPath therefore uses images to identify an object, action, sequence, relationship or context—not to fill empty space. [Lindner et al., *Learning and Instruction*](https://www.leibniz-ipn.de/en/research/publications/representational-and-decorative-pictures-in-science-and-mathematics-tests) and [González et al., *Australasian Journal of Educational Technology*](https://ajet.org.au/index.php/AJET/article/view/4577)

### 5. Closed questions still need measurement quality

The AERA/APA/NCME testing standards make validity, reliability and fairness central to educational evidence. Haladyna, Downing and Rodriguez's evidence-based multiple-choice guidance requires clear stems, simple language, independent items, one best answer, plausible homogeneous distractors and no unintended cues. Every closed worksheet item follows the same contract as an online assessment item even when no score is stored. [Standards for Educational and Psychological Testing](https://www.testingstandards.net/) and [Haladyna et al.](https://www.tandfonline.com/doi/abs/10.1207/S15324818AME1503_5)

---

## Part II — The LiteracyPath standard

## 6. Age and access bands

Age guides presentation; demonstrated reading level governs language demand. An older beginner in English may need Band A sentence structure with age-respectful subjects and art.

| Band | Typical age | Printed instruction | Page density | Response space and support |
|---|---:|---|---|---|
| A — Entry | 4–6 | one familiar action; normally no more than 12 words; model the mechanic | normally 2–3 clearly separated task blocks and 2–6 responses per block | target text normally 18–30 pt; large boxes/lines; concrete pictures; adult-read direction permitted |
| B — Early | 6–8 | one step, or two visibly separated steps; normally no more than 16 words | normally 3–4 task blocks with generous white space | 14 pt minimum ordinary text; picture support where it carries context; short construction |
| C — Developing | 8–10 | explicit evidence, comparison or morphology; define unusual terms | several short sections, never a dense undifferentiated page | diagrams, tables, short response and evidence lines sized to the expected answer |
| D — Extending | 10–12 | concise multi-step direction with numbered steps | denser only when the construct requires sustained reading or composition | longer response areas, annotation space and source/evidence references |

The current EL Skills Block generator is a Band A to early Band B tool. Its language, image and spacing rules must not be weakened because a teacher requests more pages.

## 7. The non-negotiable worksheet contract

Every worksheet must satisfy all of these:

1. **Declared construct and band.** The cycle, skill, intended learner band and response mode are known before content is generated.
2. **Taught-content integrity.** Decoding and spelling tasks contain only taught graphemes and permitted word structures. A picture does not justify an untaught spelling.
3. **One clear action at a time.** Each block has a direct instruction that describes the response actually required.
4. **Complete stimulus.** The child receives every picture, word bank, passage, diagram or example needed to answer.
5. **One defensible answer for closed work.** Literal prompt plus visible evidence produces exactly one key.
6. **Meaningful support.** Images, examples, boxes and word banks support access without replacing the skill being practised.
7. **Adequate response space.** Lines, boxes and grids fit the expected handwriting length and learner age.
8. **Readable print.** Text, boundaries and critical marks remain legible on A4 in colour and greyscale.
9. **Genuine multi-page progression.** Every page has a different instructional role and materially different task content.
10. **Deterministic evidence.** The same recipe produces the same bytes; automated checks can identify pages, tasks, answers and assets.

## 8. The six-page progression

One- to five-page packs take the first stages in order. A six-page pack contains all six. A generator may adapt the exact activity to the construct, but may not skip the learning purpose or repeat a previous page.

| Page | Stage | Required learning purpose | Acceptable examples |
|---:|---|---|---|
| 1 | Meet it | model and supported access | trace a correct form; study a worked example; hear/read a model |
| 2 | Try it | guided recognition | find the target; complete one missing unit with a strong cue |
| 3 | Tell it apart | discrimination | match forms; choose among plausible alternatives; sort by an explicit rule |
| 4 | Make it | supported construction | order letters; complete a word; build a response in shown boxes |
| 5 | Use it | transfer to a new format or context | match picture to print; use the pattern in a sentence; compare two patterns |
| 6 | Remember it | independent retrieval and brief review | spell from a picture; write from memory; repeated fluent read |

Pack rules:

- Page uniqueness is based on the instructional body after headers, footers, page numbers and stage labels are removed.
- A changed page number, shuffled display order or rotated target list does not make a new page by itself.
- No page may be a byte-equivalent or semantic duplicate of another page in the same pack.
- Each page has at least two purposeful task blocks unless one sustained Band C/D passage or composition task legitimately occupies the page.
- Difficulty rises through reduced scaffolding, increased transfer or deeper thinking—not smaller type, longer instructions or obscure vocabulary.
- Later pages may retrieve earlier targets, but must require a different cognitive action.

## 9. Instruction and example rules

- Start with a concrete verb: **Circle, Match, Write, Read, Draw, Put, Sort, Underline** or **Check**.
- Name the exact unit. Use **letter**, **sound**, **grapheme**, **word**, **sentence** or **pattern** accurately.
- “Build the word” requires a whole word. A single blank says “Write the missing first letter,” not “Build the word.”
- A printed missing vowel is a missing **middle letter** unless the task supplies spoken audio and explicitly measures the phoneme.
- Keep the required action before optional explanation.
- Give a worked, unscored example whenever the mechanic is new or changes substantially.
- Do not depend on a teacher inventing missing instructions. Teacher-led dictation must say that an adult reads the words and the answer record must name those words.
- Avoid “easy,” “hard,” “baby,” “trick,” “tricky” and performance labels on child pages.
- Never use reward decoration, jokes or story dressing that obscures the response area.

## 10. Answer, distractor and open-response rules

### Closed items

- Store or derive one exact answer for every closed response.
- Insert every option into the full prompt during validation.
- Options are mutually exclusive, similar in form and independently plausible.
- Two choices are acceptable for Band A when only two taught, plausible alternatives exist. Do not add an untaught or silly third choice to meet a cosmetic count.
- Three choices are preferred when three genuine alternatives exist; four require four genuine alternatives.
- A picture-word choice must change the entire option set between items where practical and must not leave the previous answer as the only changed tile.
- Word banks contain every required answer once unless reuse is explicitly instructed. They do not contain another answer that also fits.
- Matching columns use each answer once and do not leave every pair horizontally aligned.

### Constructed responses

- Boxes show the number and order of required letters or graphemes.
- A line is long enough for the expected response plus normal beginner spacing.
- “Write any real word” is open practice, not a closed scored item. The allowed response set or review rule must be explicit.
- Sentence writing provides space proportionate to the expected sentence and does not hide a second grammar or drawing task in the instruction.

### Ambiguity audit

Before release, argue for every alternative as if it were correct. Add context or replace the task if more than one answer remains defensible. Common failures include location cloze without an image, noun-number questions with two valid plural nouns, overlapping sound/letter units, a picture that can be named two common ways, and word banks with two grammatically valid choices.

## 11. Construct-specific worksheet rules

### Letter formation

- Show a correct model before independent writing.
- Teach capital and lowercase forms as related but distinct forms.
- Writing guides remain visible on ordinary school printers.
- Formation practice does not claim phoneme mastery; picture sorting or sound work is a separate labelled block.
- Multi-letter graphemes are copied as graphemes; capital/lowercase matching is used only for single letters.

### Phonics, spelling and word building

- Use only taught graphemes in words the child is asked to decode or spell.
- Every missing-letter item for entry learners has a clear picture cue.
- The picture supports meaning, while the printed partial word determines which letter is missing.
- Avoid pictures with two equally common names unless every valid label is accepted.
- Ordered boxes match the answer length. Letter tiles include all and only the letters needed for that item unless sorting extra letters is the declared construct.
- First, middle and last positions are named correctly.

### Sight words

- Separate recognition, copying, contextual use and spelling from memory.
- Use the normal printed form; **I** is capitalised.
- Hunt grids contain a declared number of targets and the gate verifies the count.
- Cloze sentences are natural, age-appropriate and have one answer from the supplied bank.
- Repeated reading is not represented as silent word spotting.

### Pattern and fluency

- Pattern labels state the visible unit precisely, such as “end with -ay” or “contain ng.”
- Sorts include genuine yes/no examples and do not rely on colour alone.
- Word chains change only the declared number of letters at each step and show enough boxes for each answer.
- Poems and passages include the words the child is asked to find.
- A repeated-reading page gives a readable text and separate marks for each read; it does not duplicate the same poem on every page.

### Comprehension, vocabulary and writing for Bands B–D

- Supply the complete passage, image, diagram or source.
- Question language is no harder than the source unless that language is the construct.
- Evidence questions provide enough space for the required quotation or explanation.
- Vocabulary work supports meaning in context rather than isolated copying alone.
- Writing pages separate planning, drafting and revising; do not compress all three into one cramped box.

## 12. Images and visual hierarchy

- Every image has a defined instructional role: identify, compare, sequence, locate, explain or provide context.
- Missing-letter tasks for Band A are image-backed. Letter-formation pages use pictures when asking about initial sounds.
- Images are large enough for the relevant feature to remain identifiable in print; current Band A cues are at least 14 mm high and primary choice images are larger.
- Each object has a meaningful `alt` value in the generated HTML. Accessible text describes the object or scene; it does not add evidence unavailable to a sighted learner.
- Use consistent illustration style within a block. Do not mix photographic, pixel and storybook assets without an instructional reason.
- Decorative art is omitted when it competes with text, response areas or evidence.
- Never encode categories only with colour. Pair colour with a word, shape, border or position label.
- Critical text is live text, not raster text embedded in an image.

## 13. Print and accessibility specification

- Default format is A4 portrait with a safe printable margin of at least 12 mm.
- Child-facing ordinary text is at least 14 pt; Band A instructions are normally larger. Target letters and words are substantially larger.
- Use a clear sans-serif reading face with system fallbacks. Printing must not depend on a network font request.
- Use left-aligned running text. Avoid justified paragraphs, italics, underlining and all-capital sentences.
- Ordinary text reaches 4.5:1 contrast; large text reaches 3:1. Pencil guides and tracing models remain visible after greyscale printing.
- Blocks do not split across pages. Each requested worksheet page produces exactly one physical A4 page at standard scale.
- Headers include learner name and date. Footers include cycle, type and page position without replacing instructional space.
- Writing lines have adequate vertical spacing; boxes accommodate beginner handwriting rather than typed glyph width.
- The page remains understandable in greyscale and when CSS background colours are not printed.
- Generated HTML declares its language and viewport and preserves a logical source order for screen-reader or digital use.

## 14. Deterministic generation and QA

Every generated page exposes stable machine-readable metadata:

- `data-worksheet-page` for page position;
- `data-worksheet-stage` for the six-stage progression;
- `data-task-kind` and `data-task-id` for each task block;
- `data-answer` for closed responses or ordered teacher prompts.

The permanent gate checks every available type for every cycle, normally at six pages:

1. same recipe, same HTML bytes;
2. exact requested page count, clamped to the supported 1–6 range;
3. all six stage IDs in the defined order;
4. six unique instructional bodies after page furniture and metadata are removed;
5. at least two task blocks per generated early-years page;
6. unique task IDs inside a document;
7. no empty task or empty answer attribute;
8. every missing-letter task contains picture cues with non-empty alt text;
9. every referenced local image exists;
10. instructions stay within Band A/B limits and avoid banned wording;
11. no external network font or image dependency;
12. A4, margin, break-inside and print-colour rules are present;
13. sight-word and letter hunts contain the declared number of targets;
14. word-building answers contain only letters taught by that cycle;
15. representative PDFs produce one physical page per logical page with no clipped instructional content.

The release gate fails on any hard error. It may not be made green by suppressing a worksheet type, reducing the expected page count, changing the normaliser to count page labels, or recording a waiver without a versioned policy change.

## 15. Authoring and release workflow

1. Declare cycle/skill, age band, construct and response mode.
2. Select content already taught at that point.
3. Write the key or acceptable response set before writing the prompt.
4. Choose the six-stage pack progression appropriate to the construct.
5. Add exact image requirements and verify each asset.
6. Add direct instructions and worked examples for unfamiliar mechanics.
7. Run the ambiguity audit and insert every option into its full context.
8. Generate one-, four- and six-page recipes and inspect their semantic signatures.
9. Run the policy gate, unit tests and representative print render.
10. Publish only with zero hard failures; record genuine limitations rather than claiming unsupported quality.

## 16. Quick release checklist

- [ ] Is the construct explicit and limited to taught content?
- [ ] Can the child understand every instruction without invented teacher explanation?
- [ ] Does each closed response have one defensible answer?
- [ ] Are all missing-letter prompts pictured and named clearly?
- [ ] Do boxes and lines fit the expected response?
- [ ] Does every image carry instructional meaning?
- [ ] Are text and guides readable in colour and greyscale?
- [ ] Are the requested pages genuinely different after page furniture is removed?
- [ ] Does the pack move from modelling to independent retrieval?
- [ ] Does the same recipe reproduce exactly?
- [ ] Do all local assets resolve, with no network-only print dependency?
- [ ] Do the automated gate and print-render checks pass?
