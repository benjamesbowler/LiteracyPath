# Reserved Progress Test authoring

These original questions are reserved for the separate adaptive instrument.
They never enter ordinary Skills phases, practice, modeling or retention pools.
Generate the runtime view with `node tools/assessmentRebuild/buildProgressBank.mjs
--write`; check it without changing files by omitting `--write`.

Each of the six tracks measures one named construct. Three ordinal tiers describe
authored task demand, not calibrated ability. Fixed word/sound inventories reuse
words and approved recordings; each contrast has its own authored options.
Reading texts are original. Listening questions are original but deliberately
reuse approved recorded passages: their public source family is retained, prior
exposure is unknown, and the report must disclose this familiarity limitation.
Known exposure to that family excludes the item. New identifiers never imply
that an existing public passage is unseen.

Single-format tracks use the mechanic that preserves their construct. They do
not invent another mechanic to inflate format counts. Readiness counts distinct
families within each tier and simulates both administrations; raw item totals
alone cannot establish branch readiness. Missing or failed required audio
invalidates an item, and all items sharing its source are excluded.

Instructions may use ordinary speech access when no exact recording exists.
Pronunciation-sensitive targets/choices and listening passages always require
the exact approved recording. Reading passages and printed answer choices in
word-recognition tracks may never be narrated.
