# High-frequency word depth review — 28 September 2026

Scope: direct text review of the 100 authored row pairs in
`tools/assessmentRebuild/authoring/depth/hfw_*.mjs`, their shared builder, and
the expanded sentence, spoken cue, correct answer, rivals and spelling tiles.
These are 200 new contexts across the four existing 25-word bands. They add
recognition and spelling evidence for the approved 100 words; they do not add
200 vocabulary targets or establish a measured percentage increase in quality.

Each Level 1 item supplies the complete sentence in approved narration and asks
the learner to recognize its missing printed word. Some rivals also produce
a grammatical sentence: the administered spoken sentence, rather than grammar
alone, specifies the answer. Level 2 uses a different context and requires the
word's letters, including repeated letters, with two additional competing
tiles. This review does not claim that heard-word recognition is independent
decoding. The relevant source and construct labels retain that distinction.

The semantic regression still reads the current authoring pipeline. It pins
the original 50 ordinary cloze rows and four explicitly identified retention
rows per band. Two prior fixture hashes remained valid. The two other hashes
needed review because commit `0c02f9408` had changed these literal rows without
updating their earlier fingerprints:

| Current item | Reviewed change | Why the answer remains valid |
| --- | --- | --- |
| `lp3.hfw_1_25.l1.B.at.v2` | “Dinner starts ___ six o'clock.” replaced lunch at that time. Options remain at/on/as/of. | “At” introduces the stated clock time and is spoken in the complete cue. |
| `lp3.hfw_51_75.l1.A.will.v1` | “We ___ bake a cake tomorrow.” replaced a forecast-certainty sentence. Options remain will/would/was/are. | The complete recording explicitly supplies “will”; this is heard-word recognition, not an inference that future time excludes every modal alternative. |
| `lp3.hfw_51_75.l1.R.write.v7r` | “Students ___ answers with pencils during the test.” now offers write/would/which/were. | “Write” is the spoken action and the only offered complete verb for this clause. Rivals cannot complete the sentence by themselves. |

The new 200-context fixture is pinned separately, including spelling tiles and
construct claims. Its checks require 25 distinct words in each band, one new
recognition and one new spelling context per word, 50 distinct contexts per
band, a complete spoken cue, and enough copies of every letter to build the
answer. Existing rival-exclusion checks remain intact. Neither this text
review nor the fixture hashes certify human listening, physical iPad use, or
hosted classroom persistence; those require their separate evidence.
