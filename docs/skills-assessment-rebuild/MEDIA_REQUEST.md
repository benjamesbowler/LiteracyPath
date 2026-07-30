# FINAL media production request — Skills assessments v3 (all 30 skills)

Generated 2026-07-30T10:34:58.136Z from the shipped v3 banks. Regenerate with `node tools/assessmentRebuild/mediaRequest.mjs` after any bank change — never edit by hand. Machine-readable copy with the FULL per-item mapping: `MEDIA_REQUEST.json` (`items[]` maps every question id to its exact audio files and image paths).

## Audio spec (applies to every recording)

- **Voice:** Google Cloud Text-to-Speech en-US-Chirp3-HD-Leda: one consistent warm, natural, neutral General American voice for the whole set, ~145–155 wpm, no character acting.
- **Format:** mp3, 44.1 kHz, mono, normalized to -16 LUFS integrated, < 1 dB true peak, no leading/trailing silence beyond 150 ms.
- **Style:** Natural full sentences exactly as scripted. Cloze blanks are voiced as a short beat of silence (the … marks), never the word 'blank'. No isolated robotic phonemes — letter-sound lines say the sound naturally.
- **Wiring:** Wire prompts/sentences/passages via audioPreferenceManifest keyed by the exact script text; words land in the existing /audio/child-mode/words pool; phrases in /audio/child-mode/phrases.

## Image spec (applies to every illustration)

- **Style:** Flat, warm, friendly illustration matching public/images/assessment house style. 512x512 minimum, png or webp. No embedded text, no letters, no numbers.
- **Law:** Answer-neutral: an image must never reveal the answer of the item it appears in (see AUTHORING_STANDARDS.md). Scene images must have exactly ONE unambiguous reading of the target relation.

## Volume summary

| Asset class | Unique assets | Still missing |
|---|---|---|
| Instruction/prompt lines | 2081 | 2033 |
| Sentence read-alouds | 615 | 615 |
| Passage read-alouds | 525 | 482 |
| Single-word recordings | 1595 | 419 |
| Phrase recordings | 2153 | 1999 |
| Image slots | 2111 | 0 |

## Per-skill volume

| Skill | Items | Prompts | Sentences | Passages | Words | Phrases | Image slots | Missing images |
|---|---|---|---|---|---|---|---|---|
| adjectives | 60 | 60 | 17 | 0 | 240 | 0 | 93 | 0 |
| antonyms_synonyms | 60 | 60 | 14 | 0 | 270 | 0 | 114 | 0 |
| blends | 106 | 106 | 0 | 0 | 503 | 0 | 148 | 0 |
| cause_effect | 64 | 64 | 0 | 64 | 0 | 256 | 64 | 0 |
| context_clues | 64 | 64 | 0 | 64 | 64 | 256 | 64 | 0 |
| cvc_short_vowels | 70 | 70 | 0 | 0 | 271 | 0 | 70 | 0 |
| digraphs | 60 | 60 | 0 | 0 | 276 | 0 | 132 | 0 |
| final_sounds | 82 | 82 | 0 | 0 | 410 | 0 | 121 | 0 |
| hfw_1_25 | 135 | 135 | 108 | 0 | 381 | 0 | 135 | 0 |
| hfw_26_50 | 135 | 135 | 108 | 0 | 378 | 0 | 135 | 0 |
| hfw_51_75 | 135 | 135 | 108 | 0 | 378 | 0 | 135 | 0 |
| hfw_76_100 | 135 | 135 | 108 | 0 | 378 | 0 | 135 | 0 |
| homophones_homonyms | 80 | 80 | 41 | 0 | 304 | 16 | 80 | 0 |
| inference | 64 | 64 | 0 | 64 | 34 | 222 | 64 | 0 |
| initial_sounds | 160 | 160 | 0 | 0 | 800 | 0 | 325 | 0 |
| key_details | 71 | 71 | 0 | 71 | 48 | 236 | 71 | 0 |
| long_vowels_silent_e | 68 | 68 | 0 | 0 | 188 | 112 | 68 | 0 |
| main_idea | 64 | 64 | 0 | 64 | 0 | 256 | 64 | 0 |
| nouns | 60 | 60 | 12 | 0 | 208 | 32 | 102 | 0 |
| plurals | 60 | 60 | 31 | 0 | 240 | 0 | 60 | 0 |
| prefixes_suffixes | 78 | 78 | 16 | 0 | 296 | 52 | 78 | 0 |
| prepositions_of_place | 76 | 76 | 34 | 0 | 207 | 97 | 76 | 0 |
| r_controlled_vowels | 70 | 70 | 0 | 0 | 333 | 0 | 70 | 0 |
| rhyming | 145 | 145 | 0 | 0 | 697 | 0 | 349 | 0 |
| sentence_comprehension | 72 | 72 | 0 | 72 | 15 | 273 | 72 | 0 |
| sequencing | 62 | 62 | 0 | 62 | 0 | 248 | 122 | 0 |
| short_vowel_discrimination | 70 | 70 | 0 | 0 | 310 | 0 | 106 | 0 |
| theme_higher_comprehension | 64 | 64 | 0 | 64 | 0 | 256 | 64 | 0 |
| verbs | 58 | 58 | 18 | 0 | 232 | 0 | 100 | 0 |
| vowel_teams | 90 | 90 | 0 | 0 | 408 | 0 | 90 | 0 |

## 1. Instruction/prompt recordings — record each line verbatim

| File | Script (read exactly) | Used by |
|---|---|---|
| /audio/assessment/v3/prompts/which-one-is-very-big-f2e30c.mp3 | Which one is very big? | 1 |
| /audio/assessment/v3/prompts/which-one-is-tiny-92a754.mp3 | Which one is tiny? | 1 |
| /audio/assessment/v3/prompts/which-one-is-very-tall-508607.mp3 | Which one is very tall? | 1 |
| /audio/assessment/v3/prompts/which-word-is-a-describing-word-for-size-99103d.mp3 | Which word is a describing word for size? | 4 |
| /audio/assessment/v3/prompts/which-one-is-green-c9dc75.mp3 | Which one is green? | 1 |
| /audio/assessment/v3/prompts/which-one-is-yellow-5132f5.mp3 | Which one is yellow? | 1 |
| /audio/assessment/v3/prompts/which-word-is-a-colour-word-fd6f4e.mp3 | Which word is a colour word? | 5 |
| /audio/assessment/v3/prompts/which-one-feels-soft-99fff7.mp3 | Which one feels soft? | 1 |
| /audio/assessment/v3/prompts/which-one-feels-wet-c69d2f.mp3 | Which one feels wet? | 1 |
| /audio/assessment/v3/prompts/which-one-feels-hard-99316d.mp3 | Which one feels hard? | 1 |
| /audio/assessment/v3/prompts/which-word-is-a-describing-word-for-how-thin-ff7361.mp3 | Which word is a describing word for how things feel? | 4 |
| /audio/assessment/v3/prompts/which-one-shows-a-happy-face-2de786.mp3 | Which one shows a happy face? | 1 |
| /audio/assessment/v3/prompts/which-word-is-a-feeling-word-6674bb.mp3 | Which word is a feeling word? | 7 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-191c22.mp3 | Which describing word finishes the sentence? The … soup burned my lip. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-898a7f.mp3 | Which describing word finishes the sentence? My … boots let the rain in. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-1a764b.mp3 | Which describing word finishes the sentence? The … box needed two of us to lift. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-56959e.mp3 | Which describing word finishes the sentence? We squinted in the … sunshine. | 1 |
| /audio/assessment/v3/prompts/which-word-in-this-sentence-is-the-describin-66031e.mp3 | Which word in this sentence is the describing word? "The muddy pup shook itself." | 1 |
| /audio/assessment/v3/prompts/which-word-in-this-sentence-is-the-describin-5bb2b4.mp3 | Which word in this sentence is the describing word? "A gentle breeze turned the pages." | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-563ba2.mp3 | Which describing word finishes the sentence? The … kitten slept through the storm. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-2a566d.mp3 | Which describing word finishes the sentence? Her … scarf trailed on the ground. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-d49244.mp3 | Which describing word finishes the sentence? The path was … after days of rain. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-f90f0f.mp3 | Which describing word finishes the sentence? The lemonade was … enough to make us wince. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-88fdb0.mp3 | Which describing word finishes the sentence? The old stairs were … under our feet. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-8d369d.mp3 | Which describing word finishes the sentence? Wear the … coat — it is snowing hard. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-fits-best-for-a-street-443818.mp3 | Which describing word fits best for a street with no sound at all? | 1 |
| /audio/assessment/v3/prompts/which-describing-word-fits-best-for-bread-ju-ef20bd.mp3 | Which describing word fits best for bread just out of the oven? | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-2eda99.mp3 | Which describing word finishes the sentence? The … knife went through the pumpkin easily. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-7d2472.mp3 | Which describing word finishes the sentence? Our tent felt … with five of us in it. | 1 |
| /audio/assessment/v3/prompts/which-word-is-a-describing-word-not-a-naming-1a1a01.mp3 | Which word is a describing word, not a naming or doing word? | 7 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-484aa5.mp3 | Which describing word finishes the sentence? The … sea tossed the little boat. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-879fd1.mp3 | Which describing word finishes the sentence? A … morning is best for kites. | 1 |
| /audio/assessment/v3/prompts/which-one-is-very-small-5fc4eb.mp3 | Which one is very small? | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-25805a.mp3 | Which describing word finishes the sentence? The … floor squeaked with every step. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-a2e662.mp3 | Which describing word finishes the sentence? The rope was too … to snap. | 1 |
| /audio/assessment/v3/prompts/which-one-feels-bumpy-b2c791.mp3 | Which one feels bumpy? | 1 |
| /audio/assessment/v3/prompts/which-describing-word-finishes-the-sentence-b8c531.mp3 | Which describing word finishes the sentence? The … moth circled the lamp. | 1 |
| /audio/assessment/v3/prompts/which-describing-word-fits-best-for-socks-le-edafd5.mp3 | Which describing word fits best for socks left out in the snow? | 1 |
| /audio/assessment/v3/prompts/what-is-the-opposite-of-hot-44de87.mp3 | What is the opposite of hot? | 1 |
| /audio/assessment/v3/prompts/what-is-the-opposite-of-big-44db22.mp3 | What is the opposite of big? | 1 |
| /audio/assessment/v3/prompts/what-is-the-opposite-of-up-47e7ed.mp3 | What is the opposite of up? | 1 |
| /audio/assessment/v3/prompts/what-is-the-opposite-of-wet-44e697.mp3 | What is the opposite of wet? | 1 |
| /audio/assessment/v3/prompts/the-picture-shows-something-hot-pick-the-opp-d74d5f.mp3 | The picture shows something hot. Pick the opposite of hot. | 1 |
| /audio/assessment/v3/prompts/the-whale-in-the-picture-is-big-pick-the-opp-e8bfd9.mp3 | The whale in the picture is big. Pick the opposite of big. | 1 |
| /audio/assessment/v3/prompts/which-word-means-about-the-same-as-happy-62d9e4.mp3 | Which word means about the same as happy? | 1 |
| /audio/assessment/v3/prompts/which-word-means-about-the-same-as-shout-7d00d7.mp3 | Which word means about the same as shout? | 1 |
| /audio/assessment/v3/prompts/which-word-means-about-the-same-as-small-7d537d.mp3 | Which word means about the same as small? | 1 |
| /audio/assessment/v3/prompts/which-word-means-about-the-same-as-begin-551e44.mp3 | Which word means about the same as begin? | 1 |
| /audio/assessment/v3/prompts/the-picture-shows-the-sea-which-word-is-clos-608c8f.mp3 | The picture shows the sea. Which word is closest to 'sea'? | 1 |
| /audio/assessment/v3/prompts/the-rain-makes-things-wet-which-word-is-clos-c6d33d.mp3 | The rain makes things wet. Which word is closest to 'wet'? | 1 |
| /audio/assessment/v3/prompts/the-arrow-points-up-pick-the-opposite-of-up-802cbb.mp3 | The arrow points up. Pick the opposite of up. | 1 |
| /audio/assessment/v3/prompts/it-is-night-in-the-picture-pick-the-opposite-7a10ee.mp3 | It is night in the picture. Pick the opposite of night. | 1 |
| /audio/assessment/v3/prompts/the-shoes-in-the-picture-are-new-pick-the-op-1a33ed.mp3 | The shoes in the picture are new. Pick the opposite of new. | 1 |
| /audio/assessment/v3/prompts/the-door-in-the-picture-is-open-pick-the-opp-e89628.mp3 | The door in the picture is open. Pick the opposite of open. | 1 |
| /audio/assessment/v3/prompts/what-is-the-opposite-of-day-44dc1b.mp3 | What is the opposite of day? | 1 |
| /audio/assessment/v3/prompts/what-is-the-opposite-of-tall-e180e1.mp3 | What is the opposite of tall? | 1 |
| /audio/assessment/v3/prompts/the-sun-is-bright-which-word-is-closest-to-b-25696c.mp3 | The sun is bright. Which word is closest to 'bright'? | 1 |
| /audio/assessment/v3/prompts/the-rock-is-hard-which-word-is-closest-to-ha-b3dab8.mp3 | The rock is hard. Which word is closest to 'hard'? | 1 |
| /audio/assessment/v3/prompts/snow-is-cold-which-word-is-closest-to-cold-fcc7f8.mp3 | Snow is cold. Which word is closest to 'cold'? | 1 |
| /audio/assessment/v3/prompts/the-ant-is-tiny-which-word-is-closest-to-tin-6bd229.mp3 | The ant is tiny. Which word is closest to 'tiny'? | 1 |
| /audio/assessment/v3/prompts/pick-a-synonym-for-quick-438f78.mp3 | Pick a synonym for quick. | 1 |
| /audio/assessment/v3/prompts/which-word-means-about-the-same-as-sleepy-25b29b.mp3 | Which word means about the same as sleepy? | 1 |
| /audio/assessment/v3/prompts/which-is-the-exact-opposite-of-whisper-12cba5.mp3 | Which is the exact opposite of 'whisper'? | 1 |
| /audio/assessment/v3/prompts/which-is-the-exact-opposite-of-freezing-e54d3a.mp3 | Which is the exact opposite of 'freezing'? | 1 |
| /audio/assessment/v3/prompts/which-is-the-exact-opposite-of-giant-447858.mp3 | Which is the exact opposite of 'giant'? | 1 |
| /audio/assessment/v3/prompts/pick-the-antonym-of-noisy-6e716d.mp3 | Pick the antonym of 'noisy'. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-the-kitten-is-tame-eaee55.mp3 | Which word fits the swap? The kitten is tame. The tiger is …. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-this-puzzle-is-simp-3a11ee.mp3 | Which word fits the swap? This puzzle is simple. Its opposite is …. | 1 |
| /audio/assessment/v3/prompts/which-word-is-closest-to-giggle-6ffeb5.mp3 | Which word is closest to 'giggle'? | 1 |
| /audio/assessment/v3/prompts/which-word-is-closest-to-huge-3d9533.mp3 | Which word is closest to 'huge'? | 1 |
| /audio/assessment/v3/prompts/which-word-is-closest-to-sprint-b7baa1.mp3 | Which word is closest to 'sprint'? | 1 |
| /audio/assessment/v3/prompts/which-word-is-closest-to-grin-3b0b00.mp3 | Which word is closest to 'grin'? | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-the-mouse-is-not-ju-81171d.mp3 | Which word fits the swap? The mouse is not just small. It is …. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-not-just-cold-the-p-25fdbb.mp3 | Which word fits the swap? Not just cold — the pond was … this morning. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-the-morning-was-noi-3032ed.mp3 | Which word fits the swap? The morning was noisy. The night was …. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-this-bag-is-heavy-t-d149a3.mp3 | Which word fits the swap? This bag is heavy. That bag is …. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-the-turtle-is-slow-deedca.mp3 | Which word fits the swap? The turtle is slow. The hare is …. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-my-hands-were-dirty-494194.mp3 | Which word fits the swap? My hands were dirty. Now they are …. | 1 |
| /audio/assessment/v3/prompts/which-word-is-the-opposite-of-above-1a3c8e.mp3 | Which word is the opposite of 'above'? | 1 |
| /audio/assessment/v3/prompts/which-word-is-the-opposite-of-early-4c017b.mp3 | Which word is the opposite of 'early'? | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-dad-fixed-the-gate-be2e07.mp3 | Which word fits the swap? Dad fixed the gate. Dad also … the fence. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-the-soup-was-tasty-e3ef41.mp3 | Which word fits the swap? The soup was tasty. Its twin word is …. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-we-shouted-with-joy-57b4c5.mp3 | Which word fits the swap? We shouted with joy. Joy's twin word is …. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-the-path-was-narrow-b03d67.mp3 | Which word fits the swap? The path was narrow. Its twin word is …. | 1 |
| /audio/assessment/v3/prompts/which-word-is-closest-to-angry-c5185d.mp3 | Which word is closest to 'angry'? | 1 |
| /audio/assessment/v3/prompts/which-word-is-closest-to-friend-3d1037.mp3 | Which word is closest to 'friend'? | 1 |
| /audio/assessment/v3/prompts/what-is-the-opposite-of-full-e08e82.mp3 | What is the opposite of full? | 1 |
| /audio/assessment/v3/prompts/the-boots-are-old-pick-the-opposite-of-old-24048e.mp3 | The boots are old. Pick the opposite of old. | 1 |
| /audio/assessment/v3/prompts/pick-a-synonym-for-jump-37db15.mp3 | Pick a synonym for jump. | 1 |
| /audio/assessment/v3/prompts/which-word-means-about-the-same-as-yell-42441c.mp3 | Which word means about the same as yell? | 1 |
| /audio/assessment/v3/prompts/the-arrow-points-down-pick-the-opposite-of-d-4268c0.mp3 | The arrow points down. Pick the opposite of down. | 1 |
| /audio/assessment/v3/prompts/the-moon-glows-which-is-closest-to-glow-ac8523.mp3 | The moon glows. Which is closest to 'glow'? | 1 |
| /audio/assessment/v3/prompts/which-is-the-exact-opposite-of-arrive-2613e2.mp3 | Which is the exact opposite of 'arrive'? | 1 |
| /audio/assessment/v3/prompts/which-is-the-exact-opposite-of-sunrise-be4882.mp3 | Which is the exact opposite of 'sunrise'? | 1 |
| /audio/assessment/v3/prompts/which-word-is-closest-to-soaked-4337af.mp3 | Which word is closest to 'soaked'? | 1 |
| /audio/assessment/v3/prompts/which-word-is-closest-to-spotless-155568.mp3 | Which word is closest to 'spotless'? | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-the-oven-is-hot-the-804a31.mp3 | Which word fits the swap? The oven is hot. The fridge is …. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-swap-the-old-map-was-tor-683e93.mp3 | Which word fits the swap? The old map was torn. It was …. | 1 |
| /audio/assessment/v3/prompts/block-which-letters-finish-the-word-block-c44cbc.mp3 | block. Which letters finish the word block? | 1 |
| /audio/assessment/v3/prompts/blue-which-one-starts-with-the-same-sounds-a-ca45aa.mp3 | blue. Which one starts with the same sounds as blue? | 1 |
| /audio/assessment/v3/prompts/which-word-goes-with-the-picture-6d1d2e.mp3 | Which word goes with the picture? | 78 |
| /audio/assessment/v3/prompts/blue-which-letters-finish-the-word-blue-91aa7c.mp3 | blue. Which letters finish the word blue? | 1 |
| /audio/assessment/v3/prompts/clap-which-letters-finish-the-word-clap-692211.mp3 | clap. Which letters finish the word clap? | 1 |
| /audio/assessment/v3/prompts/clap-which-one-starts-with-the-same-sounds-a-21d209.mp3 | clap. Which one starts with the same sounds as clap? | 1 |
| /audio/assessment/v3/prompts/cloth-which-letters-finish-the-word-cloth-4cc34a.mp3 | cloth. Which letters finish the word cloth? | 1 |
| /audio/assessment/v3/prompts/flag-which-letters-finish-the-word-flag-f9be27.mp3 | flag. Which letters finish the word flag? | 1 |
| /audio/assessment/v3/prompts/flower-which-one-starts-with-the-same-sounds-39bc52.mp3 | flower. Which one starts with the same sounds as flower? | 1 |
| /audio/assessment/v3/prompts/flute-which-letters-finish-the-word-flute-c784b6.mp3 | flute. Which letters finish the word flute? | 1 |
| /audio/assessment/v3/prompts/plug-which-letters-finish-the-word-plug-e1c992.mp3 | plug. Which letters finish the word plug? | 1 |
| /audio/assessment/v3/prompts/play-which-one-starts-with-the-same-sounds-a-dc29ee.mp3 | play. Which one starts with the same sounds as play? | 1 |
| /audio/assessment/v3/prompts/plant-which-letters-finish-the-word-plant-4d444b.mp3 | plant. Which letters finish the word plant? | 1 |
| /audio/assessment/v3/prompts/sled-which-letters-finish-the-word-sled-1941e4.mp3 | sled. Which letters finish the word sled? | 1 |
| /audio/assessment/v3/prompts/slip-which-one-starts-with-the-same-sounds-a-8d6e0a.mp3 | slip. Which one starts with the same sounds as slip? | 1 |
| /audio/assessment/v3/prompts/slide-which-letters-finish-the-word-slide-d1280c.mp3 | slide. Which letters finish the word slide? | 1 |
| /audio/assessment/v3/prompts/bread-which-letters-finish-the-word-bread-931d80.mp3 | bread. Which letters finish the word bread? | 1 |
| /audio/assessment/v3/prompts/brown-which-one-starts-with-the-same-sounds-a78c2d.mp3 | brown. Which one starts with the same sounds as brown? | 1 |
| /audio/assessment/v3/prompts/brick-which-letters-finish-the-word-brick-2eddc5.mp3 | brick. Which letters finish the word brick? | 1 |
| /audio/assessment/v3/prompts/crab-which-letters-finish-the-word-crab-9e3bfe.mp3 | crab. Which letters finish the word crab? | 1 |
| /audio/assessment/v3/prompts/crown-which-one-starts-with-the-same-sounds-bf47e4.mp3 | crown. Which one starts with the same sounds as crown? | 1 |
| /audio/assessment/v3/prompts/crown-which-letters-finish-the-word-crown-b82639.mp3 | crown. Which letters finish the word crown? | 1 |
| /audio/assessment/v3/prompts/drum-which-letters-finish-the-word-drum-c3fc5c.mp3 | drum. Which letters finish the word drum? | 1 |
| /audio/assessment/v3/prompts/dress-which-one-starts-with-the-same-sounds-1314ed.mp3 | dress. Which one starts with the same sounds as dress? | 1 |
| /audio/assessment/v3/prompts/draw-which-letters-finish-the-word-draw-e72238.mp3 | draw. Which letters finish the word draw? | 2 |
| /audio/assessment/v3/prompts/frog-which-letters-finish-the-word-frog-98a64d.mp3 | frog. Which letters finish the word frog? | 1 |
| /audio/assessment/v3/prompts/fruit-which-one-starts-with-the-same-sounds-ffdadd.mp3 | fruit. Which one starts with the same sounds as fruit? | 1 |
| /audio/assessment/v3/prompts/fruit-which-letters-finish-the-word-fruit-fc5d14.mp3 | fruit. Which letters finish the word fruit? | 1 |
| /audio/assessment/v3/prompts/grapes-which-letters-finish-the-word-grapes-3b63cc.mp3 | grapes. Which letters finish the word grapes? | 1 |
| /audio/assessment/v3/prompts/green-which-one-starts-with-the-same-sounds-b94388.mp3 | green. Which one starts with the same sounds as green? | 1 |
| /audio/assessment/v3/prompts/green-which-letters-finish-the-word-green-ff2d26.mp3 | green. Which letters finish the word green? | 2 |
| /audio/assessment/v3/prompts/star-which-letters-finish-the-word-star-e482ed.mp3 | star. Which letters finish the word star? | 2 |
| /audio/assessment/v3/prompts/star-which-one-starts-with-the-same-sounds-a-e20bb9.mp3 | star. Which one starts with the same sounds as star? | 1 |
| /audio/assessment/v3/prompts/stop-which-letters-finish-the-word-stop-3dda5a.mp3 | stop. Which letters finish the word stop? | 1 |
| /audio/assessment/v3/prompts/swim-which-letters-finish-the-word-swim-d0c6e5.mp3 | swim. Which letters finish the word swim? | 1 |
| /audio/assessment/v3/prompts/sweet-which-one-starts-with-the-same-sounds-6e0ab8.mp3 | sweet. Which one starts with the same sounds as sweet? | 1 |
| /audio/assessment/v3/prompts/swing-which-letters-finish-the-word-swing-9c5f67.mp3 | swing. Which letters finish the word swing? | 1 |
| /audio/assessment/v3/prompts/scarf-which-letters-finish-the-word-scarf-b4a63f.mp3 | scarf. Which letters finish the word scarf? | 2 |
| /audio/assessment/v3/prompts/scooter-which-letters-finish-the-word-scoote-64a02d.mp3 | scooter. Which letters finish the word scooter? | 1 |
| /audio/assessment/v3/prompts/score-which-letters-finish-the-word-score-ffcbd1.mp3 | score. Which letters finish the word score? | 1 |
| /audio/assessment/v3/prompts/skateboard-which-letters-finish-the-word-ska-be0768.mp3 | skateboard. Which letters finish the word skateboard? | 1 |
| /audio/assessment/v3/prompts/skip-which-letters-finish-the-word-skip-acd96c.mp3 | skip. Which letters finish the word skip? | 1 |
| /audio/assessment/v3/prompts/skin-which-letters-finish-the-word-skin-6aca93.mp3 | skin. Which letters finish the word skin? | 1 |
| /audio/assessment/v3/prompts/smile-which-letters-finish-the-word-smile-5021e2.mp3 | smile. Which letters finish the word smile? | 1 |
| /audio/assessment/v3/prompts/smell-which-letters-finish-the-word-smell-50f1e3.mp3 | smell. Which letters finish the word smell? | 1 |
| /audio/assessment/v3/prompts/smoke-which-letters-finish-the-word-smoke-c2e14d.mp3 | smoke. Which letters finish the word smoke? | 1 |
| /audio/assessment/v3/prompts/snake-which-letters-finish-the-word-snake-3017a8.mp3 | snake. Which letters finish the word snake? | 1 |
| /audio/assessment/v3/prompts/snail-which-letters-finish-the-word-snail-7ca074.mp3 | snail. Which letters finish the word snail? | 1 |
| /audio/assessment/v3/prompts/snow-which-letters-finish-the-word-snow-a18c73.mp3 | snow. Which letters finish the word snow? | 2 |
| /audio/assessment/v3/prompts/spoon-which-letters-finish-the-word-spoon-5c5934.mp3 | spoon. Which letters finish the word spoon? | 2 |
| /audio/assessment/v3/prompts/sport-which-letters-finish-the-word-sport-9342ef.mp3 | sport. Which letters finish the word sport? | 2 |
| /audio/assessment/v3/prompts/spot-which-letters-finish-the-word-spot-bfa178.mp3 | spot. Which letters finish the word spot? | 1 |
| /audio/assessment/v3/prompts/truck-which-letters-finish-the-word-truck-e54e38.mp3 | truck. Which letters finish the word truck? | 1 |
| /audio/assessment/v3/prompts/train-which-letters-finish-the-word-train-ae3cce.mp3 | train. Which letters finish the word train? | 2 |
| /audio/assessment/v3/prompts/tray-which-letters-finish-the-word-tray-5dd5e9.mp3 | tray. Which letters finish the word tray? | 2 |
| /audio/assessment/v3/prompts/hand-which-letters-finish-the-word-hand-103fa3.mp3 | hand. Which letters finish the word hand? | 1 |
| /audio/assessment/v3/prompts/pond-which-letters-finish-the-word-pond-b2c119.mp3 | pond. Which letters finish the word pond? | 1 |
| /audio/assessment/v3/prompts/sand-which-letters-finish-the-word-sand-e470f8.mp3 | sand. Which letters finish the word sand? | 1 |
| /audio/assessment/v3/prompts/tent-which-letters-finish-the-word-tent-a88a6b.mp3 | tent. Which letters finish the word tent? | 1 |
| /audio/assessment/v3/prompts/print-which-letters-finish-the-word-print-c4efe8.mp3 | print. Which letters finish the word print? | 1 |
| /audio/assessment/v3/prompts/paint-which-letters-finish-the-word-paint-a59020.mp3 | paint. Which letters finish the word paint? | 1 |
| /audio/assessment/v3/prompts/lamp-which-letters-finish-the-word-lamp-27cced.mp3 | lamp. Which letters finish the word lamp? | 1 |
| /audio/assessment/v3/prompts/jump-which-letters-finish-the-word-jump-ce93bb.mp3 | jump. Which letters finish the word jump? | 1 |
| /audio/assessment/v3/prompts/camp-which-letters-finish-the-word-camp-7a3034.mp3 | camp. Which letters finish the word camp? | 1 |
| /audio/assessment/v3/prompts/ink-which-letters-finish-the-word-ink-107538.mp3 | ink. Which letters finish the word ink? | 1 |
| /audio/assessment/v3/prompts/think-which-letters-finish-the-word-think-3de420.mp3 | think. Which letters finish the word think? | 1 |
| /audio/assessment/v3/prompts/bank-which-letters-finish-the-word-bank-3b5cbb.mp3 | bank. Which letters finish the word bank? | 1 |
| /audio/assessment/v3/prompts/belt-which-letters-finish-the-word-belt-2b6529.mp3 | belt. Which letters finish the word belt? | 1 |
| /audio/assessment/v3/prompts/quilt-which-letters-finish-the-word-quilt-f72719.mp3 | quilt. Which letters finish the word quilt? | 1 |
| /audio/assessment/v3/prompts/tilt-which-letters-finish-the-word-tilt-88f531.mp3 | tilt. Which letters finish the word tilt? | 1 |
| /audio/assessment/v3/prompts/gift-which-letters-finish-the-word-gift-271241.mp3 | gift. Which letters finish the word gift? | 1 |
| /audio/assessment/v3/prompts/left-which-letters-finish-the-word-left-608e12.mp3 | left. Which letters finish the word left? | 1 |
| /audio/assessment/v3/prompts/soft-which-letters-finish-the-word-soft-ed6ea5.mp3 | soft. Which letters finish the word soft? | 1 |
| /audio/assessment/v3/prompts/brush-which-letters-finish-the-word-brush-d8f9a6.mp3 | brush. Which letters finish the word brush? | 1 |
| /audio/assessment/v3/prompts/broom-which-letters-finish-the-word-broom-2d19ad.mp3 | broom. Which letters finish the word broom? | 1 |
| /audio/assessment/v3/prompts/plate-which-one-starts-with-the-same-sounds-23ea16.mp3 | plate. Which one starts with the same sounds as plate? | 1 |
| /audio/assessment/v3/prompts/snack-which-letters-finish-the-word-snack-b72cc4.mp3 | snack. Which letters finish the word snack? | 1 |
| /audio/assessment/v3/prompts/raft-which-letters-finish-the-word-raft-d1f54e.mp3 | raft. Which letters finish the word raft? | 1 |
| /audio/assessment/v3/prompts/stand-which-letters-finish-the-word-stand-4dc790.mp3 | stand. Which letters finish the word stand? | 1 |
| /audio/assessment/v3/prompts/clown-which-one-starts-with-the-same-sounds-e982da.mp3 | clown. Which one starts with the same sounds as clown? | 1 |
| /audio/assessment/v3/prompts/what-happened-because-the-nights-were-so-col-bd2f46.mp3 | What happened BECAUSE the nights were so cold? | 1 |
| /audio/assessment/v3/prompts/what-happened-because-the-seeds-spilled-on-t-cc72de.mp3 | What happened because the seeds spilled on the path? | 1 |
| /audio/assessment/v3/prompts/what-happened-after-gran-oiled-the-hinge-c27060.mp3 | What happened after Gran oiled the hinge? | 1 |
| /audio/assessment/v3/prompts/what-happened-because-the-plant-had-no-water-5a4c85.mp3 | What happened because the plant had no water? | 1 |
| /audio/assessment/v3/prompts/what-did-the-hot-car-do-to-the-crayons-882a55.mp3 | What did the hot car do to the crayons? | 1 |
| /audio/assessment/v3/prompts/what-happened-because-leah-rubbed-the-balloo-f9948d.mp3 | What happened because Leah rubbed the balloon? | 1 |
| /audio/assessment/v3/prompts/what-happened-because-of-the-deep-snow-a3e0e5.mp3 | What happened because of the deep snow? | 1 |
| /audio/assessment/v3/prompts/what-happened-because-the-lid-was-off-8b10f7.mp3 | What happened because the lid was off? | 1 |
| /audio/assessment/v3/prompts/why-did-the-kettle-whistle-eda028.mp3 | WHY did the kettle whistle? | 1 |
| /audio/assessment/v3/prompts/how-did-bruno-know-someone-was-coming-87d018.mp3 | How did Bruno know someone was coming? | 1 |
| /audio/assessment/v3/prompts/why-did-the-rocket-drawing-disappear-d92c85.mp3 | Why did the rocket drawing disappear? | 1 |
| /audio/assessment/v3/prompts/why-was-the-ice-cream-dripping-3e6b8a.mp3 | Why was the ice cream dripping? | 1 |
| /audio/assessment/v3/prompts/why-did-finn-s-voice-come-back-to-him-ac5675.mp3 | Why did Finn's voice come back to him? | 1 |
| /audio/assessment/v3/prompts/why-did-the-bike-get-rusty-5bfa93.mp3 | Why did the bike get rusty? | 1 |
| /audio/assessment/v3/prompts/why-did-the-castle-turn-into-a-smooth-hill-42a72d.mp3 | Why did the castle turn into a smooth hill? | 1 |
| /audio/assessment/v3/prompts/why-did-one-pair-of-curtains-go-pale-4c0e6b.mp3 | Why did one pair of curtains go pale? | 1 |
| /audio/assessment/v3/prompts/choose-the-sentence-that-says-it-best-e6cf53.mp3 | Choose the sentence that says it best. | 10 |
| /audio/assessment/v3/prompts/what-happened-right-before-the-flour-spilled-1123ac.mp3 | What happened RIGHT BEFORE the flour spilled? | 1 |
| /audio/assessment/v3/prompts/why-did-the-rosemary-tip-over-ce9e90.mp3 | Why did the rosemary tip over? | 1 |
| /audio/assessment/v3/prompts/what-happened-right-before-the-mark-appeared-dc7bb4.mp3 | What happened RIGHT BEFORE the mark appeared on the ceiling? | 1 |
| /audio/assessment/v3/prompts/why-did-so-many-balls-land-in-the-tomatoes-790b27.mp3 | Why did so many balls land in the tomatoes? | 1 |
| /audio/assessment/v3/prompts/what-happened-right-before-the-pea-bags-froz-1def8f.mp3 | What happened RIGHT BEFORE the pea bags froze together? | 1 |
| /audio/assessment/v3/prompts/why-was-priya-nearly-late-aebb70.mp3 | Why was Priya nearly late? | 1 |
| /audio/assessment/v3/prompts/why-did-the-string-wrap-around-the-flagpole-4156c2.mp3 | Why did the string wrap around the flagpole? | 1 |
| /audio/assessment/v3/prompts/what-happened-right-before-amir-washed-the-m-676219.mp3 | What happened RIGHT BEFORE Amir washed the mirror properly? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-reason-the-fair-did-ac3f37.mp3 | Which of these was NOT a reason the fair did well? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-reason-rui-overslep-e8a802.mp3 | Which of these was NOT a reason Rui overslept? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-cause-of-the-cactus-a5a781.mp3 | Which of these was NOT a cause of the cactus dying? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-reason-the-cold-spr-81ee85.mp3 | Which of these was NOT a reason the cold spread? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-cause-of-the-snap-9e0cc4.mp3 | Which of these was NOT a cause of the snap? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-reason-for-the-long-e36620.mp3 | Which of these was NOT a reason for the long queue? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-reason-the-ring-wen-4fb620.mp3 | Which of these was NOT a reason the ring went unheard? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-reason-the-rowing-w-cc7e22.mp3 | Which of these was NOT a reason the rowing was hard? | 1 |
| /audio/assessment/v3/prompts/what-really-made-children-and-cat-end-up-tog-228f3f.mp3 | What REALLY made children and cat end up together? | 1 |
| /audio/assessment/v3/prompts/what-does-the-passage-suggest-really-made-jo-5d322c.mp3 | What does the passage suggest REALLY made Jo fast? | 1 |
| /audio/assessment/v3/prompts/what-really-brought-the-food-a8f881.mp3 | What REALLY brought the food? | 1 |
| /audio/assessment/v3/prompts/what-does-the-passage-say-about-the-noise-ae59a3.mp3 | What does the passage say about the noise? | 1 |
| /audio/assessment/v3/prompts/why-do-umbrellas-and-rain-arrive-together-fab9f0.mp3 | Why do umbrellas and rain arrive together? | 1 |
| /audio/assessment/v3/prompts/what-really-explains-tam-s-four-o-clock-hung-f1c475.mp3 | What REALLY explains Tam's four o'clock hunger? | 1 |
| /audio/assessment/v3/prompts/which-explanation-does-the-passage-support-cbeeb3.mp3 | Which explanation does the passage support? | 1 |
| /audio/assessment/v3/prompts/what-is-the-right-way-round-according-to-the-92ec98.mp3 | What is the right way round, according to the poster? | 1 |
| /audio/assessment/v3/prompts/what-happened-because-the-can-was-shaken-b32303.mp3 | What happened because the can was shaken? | 1 |
| /audio/assessment/v3/prompts/what-did-the-long-cold-do-to-the-torch-111d53.mp3 | What did the long cold do to the torch? | 1 |
| /audio/assessment/v3/prompts/why-was-auntie-bel-sneezing-4cb399.mp3 | Why was Auntie Bel sneezing? | 1 |
| /audio/assessment/v3/prompts/why-did-the-strawberries-grow-fur-77503d.mp3 | Why did the strawberries grow fur? | 1 |
| /audio/assessment/v3/prompts/what-happened-because-the-seagull-swooped-497770.mp3 | What happened because the seagull swooped? | 1 |
| /audio/assessment/v3/prompts/why-did-the-trolley-squeak-96ba37.mp3 | Why did the trolley squeak? | 1 |
| /audio/assessment/v3/prompts/what-started-the-whole-chain-41fecc.mp3 | What started the whole chain? | 1 |
| /audio/assessment/v3/prompts/why-did-the-door-need-painting-twice-cc4cc6.mp3 | Why did the door need painting twice? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-reason-the-washing-278c01.mp3 | Which of these was NOT a reason the washing dried slowly? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-cause-of-the-escape-2a67a4.mp3 | Which of these was NOT a cause of the escape? | 1 |
| /audio/assessment/v3/prompts/what-really-links-ice-cream-and-sunburn-9ba8da.mp3 | What REALLY links ice cream and sunburn? | 1 |
| /audio/assessment/v3/prompts/what-really-explains-the-lights-and-the-yawn-504b29.mp3 | What REALLY explains the lights and the yawns? | 1 |
| /audio/assessment/v3/prompts/why-did-the-group-walk-in-a-loop-a10803.mp3 | Why did the group walk in a loop? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-a-reason-the-candles-88f752.mp3 | Which of these was NOT a reason the candles kept going out? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-drowsy-mean-2272ce.mp3 | In this passage, what does "drowsy" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-fragile-mean-8d9bf4.mp3 | In this passage, what does "fragile" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-sturdy-mean-6397e2.mp3 | In this passage, what does "sturdy" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-murmur-mean-5a7cc0.mp3 | In this passage, what does "murmur" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-jagged-mean-92c073.mp3 | In this passage, what does "jagged" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-hollow-mean-661512.mp3 | In this passage, what does "hollow" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-chilly-mean-6d8a8c.mp3 | In this passage, what does "chilly" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-mend-mean-286313.mp3 | In this passage, what does "mend" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-feast-mean-10df65.mp3 | In this passage, what does "feast" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-clutter-mean-94be83.mp3 | In this passage, what does "clutter" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-enormous-mean-3391ad.mp3 | In this passage, what does "enormous" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-gleaming-mean-4f040b.mp3 | In this passage, what does "gleaming" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-timid-mean-b3266a.mp3 | In this passage, what does "timid" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-swift-mean-23c2ad.mp3 | In this passage, what does "swift" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-ancient-mean-4528ea.mp3 | In this passage, what does "ancient" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-soggy-mean-28d7ab.mp3 | In this passage, what does "soggy" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-gobbled-mean-6159ac.mp3 | In this passage, what does "gobbled" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-glided-mean-bdb211.mp3 | In this passage, what does "glided" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-scampered-mean-446f74.mp3 | In this passage, what does "scampered" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-pleaded-mean-75a770.mp3 | In this passage, what does "pleaded" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-trembled-mean-bc8cca.mp3 | In this passage, what does "trembled" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-grumbled-mean-67dccf.mp3 | In this passage, what does "grumbled" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-drifted-mean-2a2507.mp3 | In this passage, what does "drifted" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-gazed-mean-6e7c9d.mp3 | In this passage, what does "gazed" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-dazzling-mean-9e9e78.mp3 | In this passage, what does "dazzling" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-weary-mean-79d54f.mp3 | In this passage, what does "weary" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-commotion-mean-3203d0.mp3 | In this passage, what does "commotion" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-drenched-mean-2e3bbc.mp3 | In this passage, what does "drenched" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-nibbled-mean-23e106.mp3 | In this passage, what does "nibbled" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-spotless-mean-632199.mp3 | In this passage, what does "spotless" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-soared-mean-16aee1.mp3 | In this passage, what does "soared" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-bitter-mean-853b49.mp3 | In this passage, what does "bitter" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-bashful-mean-d3d1ca.mp3 | In this passage, what does "bashful" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-rickety-mean-a7ec74.mp3 | In this passage, what does "rickety" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-bare-mean-1b709d.mp3 | In this passage, what does "bare" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-nippy-mean-2a5f7b.mp3 | In this passage, what does "nippy" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-brisk-mean-e4cb31.mp3 | In this passage, what does "brisk" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-mutter-mean-39b912.mp3 | In this passage, what does "mutter" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-lively-mean-12407b.mp3 | In this passage, what does "lively" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-dim-mean-2116a7.mp3 | In this passage, what does "dim" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-vanish-mean-8a87e1.mp3 | In this passage, what does "vanish" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-slumber-mean-5a7af4.mp3 | In this passage, what does "slumber" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-scent-mean-4c3dc8.mp3 | In this passage, what does "scent" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-repaid-mean-3b7af1.mp3 | In this passage, what does "repaid" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-peered-mean-5482f3.mp3 | In this passage, what does "peered" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-bobbed-mean-1612e2.mp3 | In this passage, what does "bobbed" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-patched-mean-5b82f4.mp3 | In this passage, what does "patched" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-dashed-mean-fae94a.mp3 | In this passage, what does "dashed" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-snug-mean-611b02.mp3 | In this passage, what does "snug" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-faint-mean-d552e4.mp3 | In this passage, what does "faint" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-gigantic-mean-f65cda.mp3 | In this passage, what does "gigantic" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-delicate-mean-613bac.mp3 | In this passage, what does "delicate" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-grumpy-mean-aadd2c.mp3 | In this passage, what does "grumpy" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-darted-mean-a60b62.mp3 | In this passage, what does "darted" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-elderly-mean-97c5eb.mp3 | In this passage, what does "elderly" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-jumble-mean-8d6414.mp3 | In this passage, what does "jumble" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-famished-mean-618991.mp3 | In this passage, what does "famished" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-baffled-mean-bb2651.mp3 | In this passage, what does "baffled" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-placid-mean-2b0aef.mp3 | In this passage, what does "placid" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-cunning-mean-ad59a2.mp3 | In this passage, what does "cunning" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-cumbersome-mean-31a497.mp3 | In this passage, what does "cumbersome" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-rancid-mean-750933.mp3 | In this passage, what does "rancid" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-loyal-mean-3a61ab.mp3 | In this passage, what does "loyal" mean? | 1 |
| /audio/assessment/v3/prompts/in-this-passage-what-does-beamed-mean-d3a8c4.mp3 | In this passage, what does "beamed" mean? | 1 |
| /audio/assessment/v3/prompts/cat-which-vowel-finishes-the-word-cat-772cf9.mp3 | cat. Which vowel finishes the word cat? | 1 |
| /audio/assessment/v3/prompts/hat-which-vowel-finishes-the-word-hat-40f8bb.mp3 | hat. Which vowel finishes the word hat? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-short-a-sound-listen-a-e4e158.mp3 | Which word has the short a sound? Listen: a. | 3 |
| /audio/assessment/v3/prompts/flag-which-vowel-finishes-the-word-flag-6b8e79.mp3 | flag. Which vowel finishes the word flag? | 1 |
| /audio/assessment/v3/prompts/hand-which-vowel-finishes-the-word-hand-820ff5.mp3 | hand. Which vowel finishes the word hand? | 1 |
| /audio/assessment/v3/prompts/flag-put-the-sounds-in-order-to-build-flag-60e9c2.mp3 | flag. Put the sounds in order to build flag. | 1 |
| /audio/assessment/v3/prompts/crab-put-the-sounds-in-order-to-build-crab-7d5cad.mp3 | crab. Put the sounds in order to build crab. | 1 |
| /audio/assessment/v3/prompts/bed-which-vowel-finishes-the-word-bed-409766.mp3 | bed. Which vowel finishes the word bed? | 1 |
| /audio/assessment/v3/prompts/net-which-vowel-finishes-the-word-net-50d7cd.mp3 | net. Which vowel finishes the word net? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-short-e-sound-listen-e-a84af2.mp3 | Which word has the short e sound? Listen: e. | 2 |
| /audio/assessment/v3/prompts/nest-which-vowel-finishes-the-word-nest-d26441.mp3 | nest. Which vowel finishes the word nest? | 1 |
| /audio/assessment/v3/prompts/desk-which-vowel-finishes-the-word-desk-683a67.mp3 | desk. Which vowel finishes the word desk? | 1 |
| /audio/assessment/v3/prompts/nest-put-the-sounds-in-order-to-build-nest-cf4f66.mp3 | nest. Put the sounds in order to build nest. | 1 |
| /audio/assessment/v3/prompts/vest-put-the-sounds-in-order-to-build-vest-fa2535.mp3 | vest. Put the sounds in order to build vest. | 1 |
| /audio/assessment/v3/prompts/pig-which-vowel-finishes-the-word-pig-6ec677.mp3 | pig. Which vowel finishes the word pig? | 1 |
| /audio/assessment/v3/prompts/pin-which-vowel-finishes-the-word-pin-3b997f.mp3 | pin. Which vowel finishes the word pin? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-short-i-sound-listen-i-6bb48b.mp3 | Which word has the short i sound? Listen: i. | 2 |
| /audio/assessment/v3/prompts/brick-which-vowel-finishes-the-word-brick-dab868.mp3 | brick. Which vowel finishes the word brick? | 1 |
| /audio/assessment/v3/prompts/gift-which-vowel-finishes-the-word-gift-744176.mp3 | gift. Which vowel finishes the word gift? | 1 |
| /audio/assessment/v3/prompts/swim-put-the-sounds-in-order-to-build-swim-42eb7b.mp3 | swim. Put the sounds in order to build swim. | 1 |
| /audio/assessment/v3/prompts/fish-put-the-sounds-in-order-to-build-fish-c63f30.mp3 | fish. Put the sounds in order to build fish. | 1 |
| /audio/assessment/v3/prompts/dog-which-vowel-finishes-the-word-dog-1d707f.mp3 | dog. Which vowel finishes the word dog? | 1 |
| /audio/assessment/v3/prompts/pot-which-vowel-finishes-the-word-pot-1f0d51.mp3 | pot. Which vowel finishes the word pot? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-short-o-sound-listen-o-90d2f2.mp3 | Which word has the short o sound? Listen: o. | 3 |
| /audio/assessment/v3/prompts/sock-which-vowel-finishes-the-word-sock-701d16.mp3 | sock. Which vowel finishes the word sock? | 1 |
| /audio/assessment/v3/prompts/clock-which-vowel-finishes-the-word-clock-349601.mp3 | clock. Which vowel finishes the word clock? | 1 |
| /audio/assessment/v3/prompts/frog-put-the-sounds-in-order-to-build-frog-9cf5c8.mp3 | frog. Put the sounds in order to build frog. | 1 |
| /audio/assessment/v3/prompts/sock-put-the-sounds-in-order-to-build-sock-2e31cb.mp3 | sock. Put the sounds in order to build sock. | 1 |
| /audio/assessment/v3/prompts/bug-which-vowel-finishes-the-word-bug-5fb20a.mp3 | bug. Which vowel finishes the word bug? | 1 |
| /audio/assessment/v3/prompts/sun-which-vowel-finishes-the-word-sun-dd371f.mp3 | sun. Which vowel finishes the word sun? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-short-u-sound-listen-u-b5f158.mp3 | Which word has the short u sound? Listen: u. | 2 |
| /audio/assessment/v3/prompts/drum-which-vowel-finishes-the-word-drum-35ccaf.mp3 | drum. Which vowel finishes the word drum? | 1 |
| /audio/assessment/v3/prompts/truck-which-vowel-finishes-the-word-truck-9128db.mp3 | truck. Which vowel finishes the word truck? | 1 |
| /audio/assessment/v3/prompts/drum-put-the-sounds-in-order-to-build-drum-e30aab.mp3 | drum. Put the sounds in order to build drum. | 1 |
| /audio/assessment/v3/prompts/brush-put-the-sounds-in-order-to-build-brush-e5672a.mp3 | brush. Put the sounds in order to build brush. | 1 |
| /audio/assessment/v3/prompts/hut-which-vowel-finishes-the-word-hut-d58d8d.mp3 | hut. Which vowel finishes the word hut? | 1 |
| /audio/assessment/v3/prompts/mug-which-vowel-finishes-the-word-mug-b53f1a.mp3 | mug. Which vowel finishes the word mug? | 1 |
| /audio/assessment/v3/prompts/sled-which-vowel-finishes-the-word-sled-8b1237.mp3 | sled. Which vowel finishes the word sled? | 1 |
| /audio/assessment/v3/prompts/plug-put-the-sounds-in-order-to-build-plug-235e01.mp3 | plug. Put the sounds in order to build plug. | 1 |
| /audio/assessment/v3/prompts/fin-which-vowel-finishes-the-word-fin-a801fc.mp3 | fin. Which vowel finishes the word fin? | 1 |
| /audio/assessment/v3/prompts/chair-which-one-starts-with-the-same-sound-a-8ebe9d.mp3 | Chair. Which one starts with the same sound as chair? | 2 |
| /audio/assessment/v3/prompts/chain-finish-the-word-chain-3fcf59.mp3 | chain. Finish the word chain. | 1 |
| /audio/assessment/v3/prompts/cherry-finish-the-word-cherry-e64747.mp3 | cherry. Finish the word cherry. | 1 |
| /audio/assessment/v3/prompts/bench-finish-the-word-bench-b91f0d.mp3 | bench. Finish the word bench. | 1 |
| /audio/assessment/v3/prompts/watch-finish-the-word-watch-e4872a.mp3 | watch. Finish the word watch. | 1 |
| /audio/assessment/v3/prompts/lunch-which-one-ends-with-the-same-sound-as-5cfd8e.mp3 | Lunch. Which one ends with the same sound as lunch? | 1 |
| /audio/assessment/v3/prompts/watch-which-one-ends-with-the-same-sound-as-9ae468.mp3 | Watch. Which one ends with the same sound as watch? | 1 |
| /audio/assessment/v3/prompts/shell-which-one-starts-with-the-same-sound-a-cdbd44.mp3 | Shell. Which one starts with the same sound as shell? | 3 |
| /audio/assessment/v3/prompts/ship-finish-the-word-ship-9af789.mp3 | ship. Finish the word ship. | 1 |
| /audio/assessment/v3/prompts/shirt-finish-the-word-shirt-13781d.mp3 | shirt. Finish the word shirt. | 1 |
| /audio/assessment/v3/prompts/fish-finish-the-word-fish-db10cb.mp3 | fish. Finish the word fish. | 1 |
| /audio/assessment/v3/prompts/brush-finish-the-word-brush-d67533.mp3 | brush. Finish the word brush. | 1 |
| /audio/assessment/v3/prompts/fish-which-one-ends-with-the-same-sound-as-f-d0b30a.mp3 | Fish. Which one ends with the same sound as fish? | 1 |
| /audio/assessment/v3/prompts/brush-which-one-ends-with-the-same-sound-as-5ff718.mp3 | Brush. Which one ends with the same sound as brush? | 1 |
| /audio/assessment/v3/prompts/thumb-which-one-starts-with-the-same-sound-a-bcaa83.mp3 | Thumb. Which one starts with the same sound as thumb? | 2 |
| /audio/assessment/v3/prompts/thumb-finish-the-word-thumb-d03970.mp3 | thumb. Finish the word thumb. | 1 |
| /audio/assessment/v3/prompts/thorn-finish-the-word-thorn-583115.mp3 | thorn. Finish the word thorn. | 1 |
| /audio/assessment/v3/prompts/tooth-finish-the-word-tooth-40a738.mp3 | tooth. Finish the word tooth. | 1 |
| /audio/assessment/v3/prompts/bath-finish-the-word-bath-f282a8.mp3 | bath. Finish the word bath. | 1 |
| /audio/assessment/v3/prompts/bath-which-one-ends-with-the-same-sound-as-b-f06294.mp3 | Bath. Which one ends with the same sound as bath? | 1 |
| /audio/assessment/v3/prompts/tooth-which-one-ends-with-the-same-sound-as-77aab0.mp3 | Tooth. Which one ends with the same sound as tooth? | 1 |
| /audio/assessment/v3/prompts/whale-which-one-starts-with-the-same-sound-a-8f2a7b.mp3 | Whale. Which one starts with the same sound as whale? | 2 |
| /audio/assessment/v3/prompts/wheel-finish-the-word-wheel-61cff6.mp3 | wheel. Finish the word wheel. | 1 |
| /audio/assessment/v3/prompts/whistle-finish-the-word-whistle-99217c.mp3 | whistle. Finish the word whistle. | 1 |
| /audio/assessment/v3/prompts/wheelbarrow-finish-the-word-wheelbarrow-db3a7f.mp3 | wheelbarrow. Finish the word wheelbarrow. | 1 |
| /audio/assessment/v3/prompts/whisker-finish-the-word-whisker-7d035c.mp3 | whisker. Finish the word whisker. | 1 |
| /audio/assessment/v3/prompts/whistle-which-one-starts-with-the-same-sound-9f0ced.mp3 | Whistle. Which one starts with the same sound as whistle? | 1 |
| /audio/assessment/v3/prompts/whale-find-the-one-that-starts-the-same-as-w-dabd2e.mp3 | Whale. Find the one that starts the same as whale. | 2 |
| /audio/assessment/v3/prompts/phone-which-one-starts-with-the-same-sound-a-740ffb.mp3 | Phone. Which one starts with the same sound as phone? | 2 |
| /audio/assessment/v3/prompts/phone-finish-the-word-phone-2d06fa.mp3 | phone. Finish the word phone. | 1 |
| /audio/assessment/v3/prompts/photo-finish-the-word-photo-ca8673.mp3 | photo. Finish the word photo. | 1 |
| /audio/assessment/v3/prompts/dolphin-finish-the-word-dolphin-67edf9.mp3 | dolphin. Finish the word dolphin. | 1 |
| /audio/assessment/v3/prompts/elephant-finish-the-word-elephant-c7c221.mp3 | elephant. Finish the word elephant. | 1 |
| /audio/assessment/v3/prompts/graph-finish-the-word-graph-fdc1a9.mp3 | graph. Finish the word graph. | 1 |
| /audio/assessment/v3/prompts/photo-which-one-starts-with-the-same-sound-a-f8e6f7.mp3 | Photo. Which one starts with the same sound as photo? | 1 |
| /audio/assessment/v3/prompts/duck-finish-the-word-duck-c77898.mp3 | duck. Finish the word duck. | 1 |
| /audio/assessment/v3/prompts/sock-finish-the-word-sock-d1cce7.mp3 | sock. Finish the word sock. | 1 |
| /audio/assessment/v3/prompts/duck-which-one-ends-with-the-same-sound-as-d-7e7731.mp3 | Duck. Which one ends with the same sound as duck? | 1 |
| /audio/assessment/v3/prompts/rock-which-one-ends-with-the-same-sound-as-r-c18dd6.mp3 | Rock. Which one ends with the same sound as rock? | 1 |
| /audio/assessment/v3/prompts/brick-finish-the-word-brick-fedf0b.mp3 | brick. Finish the word brick. | 1 |
| /audio/assessment/v3/prompts/clock-finish-the-word-clock-3c1566.mp3 | clock. Finish the word clock. | 1 |
| /audio/assessment/v3/prompts/neck-finish-the-word-neck-98b47d.mp3 | neck. Finish the word neck. | 1 |
| /audio/assessment/v3/prompts/neck-which-one-ends-with-the-same-sound-as-n-855d3e.mp3 | Neck. Which one ends with the same sound as neck? | 1 |
| /audio/assessment/v3/prompts/chip-finish-the-word-chip-62448d.mp3 | chip. Finish the word chip. | 1 |
| /audio/assessment/v3/prompts/lunch-finish-the-word-lunch-586b55.mp3 | lunch. Finish the word lunch. | 1 |
| /audio/assessment/v3/prompts/dish-finish-the-word-dish-e69aad.mp3 | dish. Finish the word dish. | 1 |
| /audio/assessment/v3/prompts/three-finish-the-word-three-20ffc3.mp3 | three. Finish the word three. | 1 |
| /audio/assessment/v3/prompts/moth-finish-the-word-moth-5d6b2f.mp3 | moth. Finish the word moth. | 1 |
| /audio/assessment/v3/prompts/wheat-finish-the-word-wheat-607b27.mp3 | wheat. Finish the word wheat. | 1 |
| /audio/assessment/v3/prompts/headphones-finish-the-word-headphones-6c29ed.mp3 | headphones. Finish the word headphones. | 1 |
| /audio/assessment/v3/prompts/microphone-finish-the-word-microphone-e50934.mp3 | microphone. Finish the word microphone. | 1 |
| /audio/assessment/v3/prompts/truck-finish-the-word-truck-208621.mp3 | truck. Finish the word truck. | 1 |
| /audio/assessment/v3/prompts/stick-finish-the-word-stick-63bd91.mp3 | stick. Finish the word stick. | 1 |
| /audio/assessment/v3/prompts/web-web-ends-with-a-sound-which-ending-finis-dbc960.mp3 | web. web ends with a sound. Which ending finishes the word web? | 1 |
| /audio/assessment/v3/prompts/web-which-one-ends-with-the-same-sound-as-we-d308ec.mp3 | web. Which one ends with the same sound as web? | 1 |
| /audio/assessment/v3/prompts/tub-which-word-ends-with-the-same-sound-as-t-8a61fb.mp3 | tub. Which word ends with the same sound as tub? | 1 |
| /audio/assessment/v3/prompts/tub-tub-ends-with-a-sound-which-ending-finis-5af6fe.mp3 | tub. tub ends with a sound. Which ending finishes the word tub? | 1 |
| /audio/assessment/v3/prompts/bread-bread-ends-with-a-sound-which-ending-f-9b10c8.mp3 | bread. bread ends with a sound. Which ending finishes the word bread? | 1 |
| /audio/assessment/v3/prompts/bread-which-one-ends-with-the-same-sound-as-92c0b5.mp3 | bread. Which one ends with the same sound as bread? | 1 |
| /audio/assessment/v3/prompts/road-which-word-ends-with-the-same-sound-as-258dc0.mp3 | road. Which word ends with the same sound as road? | 1 |
| /audio/assessment/v3/prompts/road-road-ends-with-a-sound-which-ending-fin-7fa6b3.mp3 | road. road ends with a sound. Which ending finishes the word road? | 1 |
| /audio/assessment/v3/prompts/flag-flag-ends-with-a-sound-which-ending-fin-b41534.mp3 | flag. flag ends with a sound. Which ending finishes the word flag? | 1 |
| /audio/assessment/v3/prompts/frog-which-one-ends-with-the-same-sound-as-f-34cd1c.mp3 | frog. Which one ends with the same sound as frog? | 1 |
| /audio/assessment/v3/prompts/flag-which-word-ends-with-the-same-sound-as-7a0bcf.mp3 | flag. Which word ends with the same sound as flag? | 1 |
| /audio/assessment/v3/prompts/frog-frog-ends-with-a-sound-which-ending-fin-c41f38.mp3 | frog. frog ends with a sound. Which ending finishes the word frog? | 1 |
| /audio/assessment/v3/prompts/wheel-wheel-ends-with-a-sound-which-ending-f-c2ac5d.mp3 | wheel. wheel ends with a sound. Which ending finishes the word wheel? | 1 |
| /audio/assessment/v3/prompts/wheel-which-one-ends-with-the-same-sound-as-c295d6.mp3 | wheel. Which one ends with the same sound as wheel? | 1 |
| /audio/assessment/v3/prompts/wheel-which-word-ends-with-the-same-sound-as-e858b1.mp3 | wheel. Which word ends with the same sound as wheel? | 1 |
| /audio/assessment/v3/prompts/whirlpool-whirlpool-ends-with-a-sound-which-8aa195.mp3 | whirlpool. whirlpool ends with a sound. Which ending finishes the word whirlpool? | 1 |
| /audio/assessment/v3/prompts/drum-drum-ends-with-a-sound-which-ending-fin-acc39d.mp3 | drum. drum ends with a sound. Which ending finishes the word drum? | 1 |
| /audio/assessment/v3/prompts/drum-which-one-ends-with-the-same-sound-as-d-5ee1d6.mp3 | drum. Which one ends with the same sound as drum? | 1 |
| /audio/assessment/v3/prompts/jam-which-word-ends-with-the-same-sound-as-j-28fb8c.mp3 | jam. Which word ends with the same sound as jam? | 1 |
| /audio/assessment/v3/prompts/jam-jam-ends-with-a-sound-which-ending-finis-87a40f.mp3 | jam. jam ends with a sound. Which ending finishes the word jam? | 1 |
| /audio/assessment/v3/prompts/ten-ten-ends-with-a-sound-which-ending-finis-e8884e.mp3 | ten. ten ends with a sound. Which ending finishes the word ten? | 1 |
| /audio/assessment/v3/prompts/pin-which-one-ends-with-the-same-sound-as-pi-d9cd64.mp3 | pin. Which one ends with the same sound as pin? | 1 |
| /audio/assessment/v3/prompts/hen-which-word-ends-with-the-same-sound-as-h-e2f0f5.mp3 | hen. Which word ends with the same sound as hen? | 1 |
| /audio/assessment/v3/prompts/fin-fin-ends-with-a-sound-which-ending-finis-2ffbf4.mp3 | fin. fin ends with a sound. Which ending finishes the word fin? | 1 |
| /audio/assessment/v3/prompts/sheep-sheep-ends-with-a-sound-which-ending-f-cb1cb7.mp3 | sheep. sheep ends with a sound. Which ending finishes the word sheep? | 1 |
| /audio/assessment/v3/prompts/cap-which-one-ends-with-the-same-sound-as-ca-4bb497.mp3 | cap. Which one ends with the same sound as cap? | 1 |
| /audio/assessment/v3/prompts/mop-which-word-ends-with-the-same-sound-as-m-265cdc.mp3 | mop. Which word ends with the same sound as mop? | 1 |
| /audio/assessment/v3/prompts/sleep-sleep-ends-with-a-sound-which-ending-f-c6b829.mp3 | sleep. sleep ends with a sound. Which ending finishes the word sleep? | 1 |
| /audio/assessment/v3/prompts/net-net-ends-with-a-sound-which-ending-finis-34ec41.mp3 | net. net ends with a sound. Which ending finishes the word net? | 1 |
| /audio/assessment/v3/prompts/hat-which-one-ends-with-the-same-sound-as-ha-5a1036.mp3 | hat. Which one ends with the same sound as hat? | 1 |
| /audio/assessment/v3/prompts/goat-which-word-ends-with-the-same-sound-as-4bcb6d.mp3 | goat. Which word ends with the same sound as goat? | 1 |
| /audio/assessment/v3/prompts/boat-boat-ends-with-a-sound-which-ending-fin-7a6321.mp3 | boat. boat ends with a sound. Which ending finishes the word boat? | 1 |
| /audio/assessment/v3/prompts/fish-fish-ends-with-a-sound-which-ending-fin-a60d93.mp3 | fish. fish ends with a sound. Which ending finishes the word fish? | 1 |
| /audio/assessment/v3/prompts/wish-which-one-ends-with-the-same-sound-as-w-69cf70.mp3 | wish. Which one ends with the same sound as wish? | 1 |
| /audio/assessment/v3/prompts/brush-brush-ends-with-a-sound-which-ending-f-d883cf.mp3 | brush. brush ends with a sound. Which ending finishes the word brush? | 1 |
| /audio/assessment/v3/prompts/splash-splash-ends-with-a-sound-which-ending-c2d434.mp3 | splash. splash ends with a sound. Which ending finishes the word splash? | 1 |
| /audio/assessment/v3/prompts/moth-moth-ends-with-a-sound-which-ending-fin-f10174.mp3 | moth. moth ends with a sound. Which ending finishes the word moth? | 1 |
| /audio/assessment/v3/prompts/bath-which-one-ends-with-the-same-sound-as-b-539754.mp3 | bath. Which one ends with the same sound as bath? | 1 |
| /audio/assessment/v3/prompts/bath-bath-ends-with-a-sound-which-ending-fin-984b8d.mp3 | bath. bath ends with a sound. Which ending finishes the word bath? | 1 |
| /audio/assessment/v3/prompts/cloth-cloth-ends-with-a-sound-which-ending-f-b7a74d.mp3 | cloth. cloth ends with a sound. Which ending finishes the word cloth? | 1 |
| /audio/assessment/v3/prompts/bell-bell-ends-with-a-sound-which-ending-fin-12f9bd.mp3 | bell. bell ends with a sound. Which ending finishes the word bell? | 1 |
| /audio/assessment/v3/prompts/shell-which-word-ends-like-shell-d8e6dc.mp3 | shell. Which word ends like shell? | 1 |
| /audio/assessment/v3/prompts/hill-hill-ends-with-a-sound-which-ending-fin-c2d8d4.mp3 | hill. hill ends with a sound. Which ending finishes the word hill? | 1 |
| /audio/assessment/v3/prompts/small-small-ends-with-a-sound-which-ending-f-3fc6dd.mp3 | small. small ends with a sound. Which ending finishes the word small? | 1 |
| /audio/assessment/v3/prompts/ring-ring-ends-with-a-sound-which-ending-fin-382374.mp3 | ring. ring ends with a sound. Which ending finishes the word ring? | 1 |
| /audio/assessment/v3/prompts/song-which-one-ends-with-the-same-sound-as-s-3098b0.mp3 | song. Which one ends with the same sound as song? | 1 |
| /audio/assessment/v3/prompts/king-king-ends-with-a-sound-which-ending-fin-6dc038.mp3 | king. king ends with a sound. Which ending finishes the word king? | 1 |
| /audio/assessment/v3/prompts/swing-swing-ends-with-a-sound-which-ending-f-52e03c.mp3 | swing. swing ends with a sound. Which ending finishes the word swing? | 1 |
| /audio/assessment/v3/prompts/hand-hand-ends-with-a-sound-which-ending-fin-f7e60e.mp3 | hand. hand ends with a sound. Which ending finishes the word hand? | 1 |
| /audio/assessment/v3/prompts/hand-which-word-ends-like-hand-1e487c.mp3 | hand. Which word ends like hand? | 1 |
| /audio/assessment/v3/prompts/pond-pond-ends-with-a-sound-which-ending-fin-8c2849.mp3 | pond. pond ends with a sound. Which ending finishes the word pond? | 1 |
| /audio/assessment/v3/prompts/wind-wind-ends-with-a-sound-which-ending-fin-1c17e7.mp3 | wind. wind ends with a sound. Which ending finishes the word wind? | 1 |
| /audio/assessment/v3/prompts/drink-drink-ends-with-a-sound-which-ending-f-ef73c8.mp3 | drink. drink ends with a sound. Which ending finishes the word drink? | 1 |
| /audio/assessment/v3/prompts/tank-which-word-ends-like-tank-ba5672.mp3 | tank. Which word ends like tank? | 1 |
| /audio/assessment/v3/prompts/trunk-trunk-ends-with-a-sound-which-ending-f-6562a4.mp3 | trunk. trunk ends with a sound. Which ending finishes the word trunk? | 1 |
| /audio/assessment/v3/prompts/blink-blink-ends-with-a-sound-which-ending-f-3e85cc.mp3 | blink. blink ends with a sound. Which ending finishes the word blink? | 1 |
| /audio/assessment/v3/prompts/nest-nest-ends-with-a-sound-which-ending-fin-18d0f7.mp3 | nest. nest ends with a sound. Which ending finishes the word nest? | 1 |
| /audio/assessment/v3/prompts/list-which-one-ends-with-the-same-sound-as-l-fe7c26.mp3 | list. Which one ends with the same sound as list? | 1 |
| /audio/assessment/v3/prompts/vest-vest-ends-with-a-sound-which-ending-fin-24b017.mp3 | vest. vest ends with a sound. Which ending finishes the word vest? | 1 |
| /audio/assessment/v3/prompts/list-list-ends-with-a-sound-which-ending-fin-bcd0ee.mp3 | list. list ends with a sound. Which ending finishes the word list? | 1 |
| /audio/assessment/v3/prompts/desk-desk-ends-with-a-sound-which-ending-fin-5f950d.mp3 | desk. desk ends with a sound. Which ending finishes the word desk? | 1 |
| /audio/assessment/v3/prompts/desk-which-word-ends-like-desk-965cbc.mp3 | desk. Which word ends like desk? | 1 |
| /audio/assessment/v3/prompts/mask-mask-ends-with-a-sound-which-ending-fin-85f853.mp3 | mask. mask ends with a sound. Which ending finishes the word mask? | 1 |
| /audio/assessment/v3/prompts/tusk-tusk-ends-with-a-sound-which-ending-fin-133247.mp3 | tusk. tusk ends with a sound. Which ending finishes the word tusk? | 1 |
| /audio/assessment/v3/prompts/gift-gift-ends-with-a-sound-which-ending-fin-e5ec1b.mp3 | gift. gift ends with a sound. Which ending finishes the word gift? | 1 |
| /audio/assessment/v3/prompts/raft-which-word-ends-like-raft-a9a4fb.mp3 | raft. Which word ends like raft? | 1 |
| /audio/assessment/v3/prompts/left-left-ends-with-a-sound-which-ending-fin-65fd12.mp3 | left. left ends with a sound. Which ending finishes the word left? | 1 |
| /audio/assessment/v3/prompts/raft-raft-ends-with-a-sound-which-ending-fin-684f6a.mp3 | raft. raft ends with a sound. Which ending finishes the word raft? | 1 |
| /audio/assessment/v3/prompts/melt-melt-ends-with-a-sound-which-ending-fin-ec89e0.mp3 | melt. melt ends with a sound. Which ending finishes the word melt? | 1 |
| /audio/assessment/v3/prompts/belt-which-word-ends-like-belt-1f44a5.mp3 | belt. Which word ends like belt? | 1 |
| /audio/assessment/v3/prompts/salt-salt-ends-with-a-sound-which-ending-fin-4e797a.mp3 | salt. salt ends with a sound. Which ending finishes the word salt? | 1 |
| /audio/assessment/v3/prompts/felt-felt-ends-with-a-sound-which-ending-fin-2226a4.mp3 | felt. felt ends with a sound. Which ending finishes the word felt? | 1 |
| /audio/assessment/v3/prompts/web-which-word-ends-with-the-same-sound-as-w-72a57e.mp3 | web. Which word ends with the same sound as web? | 1 |
| /audio/assessment/v3/prompts/mud-which-word-ends-with-the-same-sound-as-m-c3743b.mp3 | mud. Which word ends with the same sound as mud? | 1 |
| /audio/assessment/v3/prompts/gum-gum-ends-with-a-sound-which-ending-finis-2dad63.mp3 | gum. gum ends with a sound. Which ending finishes the word gum? | 1 |
| /audio/assessment/v3/prompts/mat-mat-ends-with-a-sound-which-ending-finis-7f723f.mp3 | mat. mat ends with a sound. Which ending finishes the word mat? | 1 |
| /audio/assessment/v3/prompts/ten-which-one-ends-with-the-same-sound-as-te-d50e55.mp3 | ten. Which one ends with the same sound as ten? | 1 |
| /audio/assessment/v3/prompts/dish-dish-ends-with-a-sound-which-ending-fin-2315cb.mp3 | dish. dish ends with a sound. Which ending finishes the word dish? | 1 |
| /audio/assessment/v3/prompts/sting-sting-ends-with-a-sound-which-ending-f-962ba7.mp3 | sting. sting ends with a sound. Which ending finishes the word sting? | 1 |
| /audio/assessment/v3/prompts/twist-twist-ends-with-a-sound-which-ending-f-b35722.mp3 | twist. twist ends with a sound. Which ending finishes the word twist? | 1 |
| /audio/assessment/v3/prompts/melt-which-word-ends-like-melt-7b1e49.mp3 | melt. Which word ends like melt? | 1 |
| /audio/assessment/v3/prompts/think-think-ends-with-a-sound-which-ending-f-3695b8.mp3 | think. think ends with a sound. Which ending finishes the word think? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-see-red-h-fcfcd0.mp3 | Which word finishes the sentence? I see … red hen. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-had-nap-75d548.mp3 | Which word finishes the sentence? We had … nap at two. | 1 |
| /audio/assessment/v3/prompts/a-find-the-word-a-a0a6fb.mp3 | a. Find the word a. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-have-jam-6a638c.mp3 | Which word finishes the sentence? We have jam … bread. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-she-has-a-c-e98754.mp3 | Which word finishes the sentence? She has a cat … a dog. | 1 |
| /audio/assessment/v3/prompts/and-find-the-word-and-4da621.mp3 | and. Find the word and. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-pigs-in-279c97.mp3 | Which word finishes the sentence? The pigs … in the mud. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-you-my-best-bf5983.mp3 | Which word finishes the sentence? You … my best pal. | 1 |
| /audio/assessment/v3/prompts/are-find-the-word-are-696457.mp3 | are. Find the word are. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-it-is-big-a-a4952e.mp3 | Which word finishes the sentence? It is big … a bus. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-sam-is-fast-b55e1a.mp3 | Which word finishes the sentence? Sam is fast … a fox. | 1 |
| /audio/assessment/v3/prompts/as-find-the-word-as-7fe1c2.mp3 | as. Find the word as. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-nap-two-fac18e.mp3 | Which word finishes the sentence? We nap … two. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-bus-sto-228825.mp3 | Which word finishes the sentence? The bus stops … my home. | 1 |
| /audio/assessment/v3/prompts/at-find-the-word-at-4c08f1.mp3 | at. Find the word at. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-you-can-my-6aaf8e.mp3 | Which word finishes the sentence? You can … my helper. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-it-will-hot-6aa55b.mp3 | Which word finishes the sentence? It will … hot at two. | 1 |
| /audio/assessment/v3/prompts/be-find-the-word-be-a6ca36.mp3 | be. Find the word be. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-this-gift-i-898f70.mp3 | Which word finishes the sentence? This gift is … you. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-ran-the-b8ec03.mp3 | Which word finishes the sentence? We ran … the bus. | 1 |
| /audio/assessment/v3/prompts/for-find-the-word-for-1816fd.mp3 | for. Find the word for. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-card-is-c6ca0a.mp3 | Which word finishes the sentence? The card is … Gran. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-he-ran-back-98d15d.mp3 | Which word finishes the sentence? He ran back … the park. | 1 |
| /audio/assessment/v3/prompts/from-find-the-word-from-8b53ef.mp3 | from. Find the word from. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-ten-hens-f0ab9d.mp3 | Which word finishes the sentence? We … ten hens. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-they-a-big-a4c84a.mp3 | Which word finishes the sentence? They … a big red van. | 1 |
| /audio/assessment/v3/prompts/have-find-the-word-have-a33ae6.mp3 | have. Find the word have. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-dad-is-tall-efe04a.mp3 | Which word finishes the sentence? Dad is tall. … has big boots. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-ben-naps-is-e321cb.mp3 | Which word finishes the sentence? Ben naps. … is in bed. | 1 |
| /audio/assessment/v3/prompts/he-find-the-word-he-8d182e.mp3 | he. Find the word he. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-sam-hurt-le-da6e41.mp3 | Which word finishes the sentence? Sam hurt … leg. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-dog-wag-fb49cd.mp3 | Which word finishes the sentence? The dog wags … tail. | 1 |
| /audio/assessment/v3/prompts/his-find-the-word-his-498674.mp3 | his. Find the word his. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-mom-and-bak-e07226.mp3 | Which word finishes the sentence? Mom and … bake buns. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-may-have-a-64a77f.mp3 | Which word finishes the sentence? May … have a go? | 1 |
| /audio/assessment/v3/prompts/i-find-the-word-i-277a2e.mp3 | i. Find the word i. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-jam-is-76cc32.mp3 | Which word finishes the sentence? The jam is … the jar. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-fish-sw-3b6f2f.mp3 | Which word finishes the sentence? The fish swim … the sea. | 1 |
| /audio/assessment/v3/prompts/in-find-the-word-in-b85d00.mp3 | in. Find the word in. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-sun-hot-f3c529.mp3 | Which word finishes the sentence? The sun … hot. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-my-cup-full-7cf2cc.mp3 | Which word finishes the sentence? My cup … full. | 1 |
| /audio/assessment/v3/prompts/is-find-the-word-is-849b89.mp3 | is. Find the word is. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-egg-fel-cca7fa.mp3 | Which word finishes the sentence? The egg fell. … has a crack. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-like-the-d8f458.mp3 | Which word finishes the sentence? I like the hat. … is red. | 1 |
| /audio/assessment/v3/prompts/it-find-the-word-it-d470e7.mp3 | it. Find the word it. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-want-a-cu-2481f3.mp3 | Which word finishes the sentence? I want a cup … milk. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-that-is-a-m-d9bb90.mp3 | Which word finishes the sentence? That is a map … the zoo. | 1 |
| /audio/assessment/v3/prompts/of-find-the-word-of-909a54.mp3 | of. Find the word of. | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-cat-nap-6ba2cf.mp3 | Which word finishes the sentence? The cat naps … the rug. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-put-the-lid-31ee15.mp3 | Which word finishes the sentence? Put the lid … the pot. | 1 |
| /audio/assessment/v3/prompts/on-find-the-word-on-f1d3c8.mp3 | on. Find the word on. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-see-ship-fa-4c43da.mp3 | Which word finishes the sentence? See … ship far, far out? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-sang-song-450699.mp3 | Which word finishes the sentence? I sang … song long ago. | 1 |
| /audio/assessment/v3/prompts/that-find-the-word-that-1048d1.mp3 | that. Find the word that. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-look-at-big-b1e47b.mp3 | Which word finishes the sentence? Look at … big red sun! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-fed-hens-567141.mp3 | Which word finishes the sentence? We fed … hens at six. | 1 |
| /audio/assessment/v3/prompts/the-find-the-word-the-caae76.mp3 | the. Find the word the. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-pigs-sa-ec2d58.mp3 | Which word finishes the sentence? The pigs sat. … are muddy! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-my-socks-ar-3cf4ee.mp3 | Which word finishes the sentence? My socks? … are wet. | 1 |
| /audio/assessment/v3/prompts/they-find-the-word-they-6e7cd3.mp3 | they. Find the word they. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-look-at-bug-dca5fa.mp3 | Which word finishes the sentence? Look at … bug on my hand! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-hat-here-is-301f07.mp3 | Which word finishes the sentence? … hat here is mine. | 1 |
| /audio/assessment/v3/prompts/this-find-the-word-this-df499e.mp3 | this. Find the word this. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-go-the-p-8a29f1.mp3 | Which word finishes the sentence? We go … the park. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-gave-the-f11142.mp3 | Which word finishes the sentence? I gave the pen … Ben. | 1 |
| /audio/assessment/v3/prompts/to-find-the-word-to-533bf0.mp3 | to. Find the word to. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-cat-on-1ea0ae.mp3 | Which word finishes the sentence? The cat … on the bed. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-milk-co-54896c.mp3 | Which word finishes the sentence? The milk … cold. | 1 |
| /audio/assessment/v3/prompts/was-find-the-word-was-6f5084.mp3 | was. Find the word was. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-hop-my-do-875444.mp3 | Which word finishes the sentence? I hop … my dog. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-she-sang-me-fe2c0f.mp3 | Which word finishes the sentence? She sang … me at camp. | 1 |
| /audio/assessment/v3/prompts/with-find-the-word-with-5f99af.mp3 | with. Find the word with. | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-are-my-best-aa4c59.mp3 | Which word finishes the sentence? … are my best pal. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-can-see-the-8c8f59.mp3 | Which word finishes the sentence? Can … see the big top? | 1 |
| /audio/assessment/v3/prompts/you-find-the-word-you-e74320.mp3 | you. Find the word you. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-he-has-pet-rat-23af22.mp3 | Build the missing word. He has … pet rat. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-met-vet-today-ed45ba.mp3 | Build the missing word. I met … vet today. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-six-ten-make-sixteen-8c55a8.mp3 | Build the missing word. Six … ten make sixteen. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-mum-gran-sat-down-15d531.mp3 | Build the missing word. Mum … Gran sat down. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-cubs-so-soft-5fdd93.mp3 | Build the missing word. The cubs … so soft. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-my-hands-cold-600828.mp3 | Build the missing word. My hands … cold. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-he-is-fast-a-jet-a7c765.mp3 | Build the missing word. He is fast … a jet. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-it-is-cold-ice-cc5694.mp3 | Build the missing word. It is cold … ice. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-met-the-pond-d959d2.mp3 | Build the missing word. We met … the pond. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-look-my-sandcastle-d13d63.mp3 | Build the missing word. Look … my sandcastle! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-dad-will-back-soon-31edb8.mp3 | Build the missing word. Dad will … back soon. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-it-can-windy-up-here-205bb7.mp3 | Build the missing word. It can … windy up here. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-this-bun-is-gran-a719e4.mp3 | Build the missing word. This bun is … Gran. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-sang-the-class-c7c304.mp3 | Build the missing word. We sang … the class. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-gift-came-gramps-913585.mp3 | Build the missing word. The gift came … Gramps. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-milk-comes-cows-2dd1e2.mp3 | Build the missing word. Milk comes … cows. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-twins-red-hats-575a37.mp3 | Build the missing word. The twins … red hats. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-six-eggs-left-adb210.mp3 | Build the missing word. We … six eggs left. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-gramps-naps-when-can-3c80fc.mp3 | Build the missing word. Gramps naps when … can. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-tom-grins-when-wins-a9fead.mp3 | Build the missing word. Tom grins when … wins. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-dan-lost-left-sock-d93a8e.mp3 | Build the missing word. Dan lost … left sock. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-king-sat-on-thron-f49957.mp3 | Build the missing word. The king sat on … throne. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-mum-and-swim-on-sunda-c76f78.mp3 | Build the missing word. Mum and … swim on Sundays. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-may-pet-the-pup-35af96.mp3 | Build the missing word. May … pet the pup? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-frogs-hop-the-pon-326aa6.mp3 | Build the missing word. The frogs hop … the pond. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-pop-the-coins-the-tin-ac50e7.mp3 | Build the missing word. Pop the coins … the tin. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-soup-hot-41030f.mp3 | Build the missing word. The soup … hot. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-my-bike-new-2694fe.mp3 | Build the missing word. My bike … new. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-nest-sits-up-high-42cea7.mp3 | Build the missing word. The nest? … sits up high. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-grab-the-rope-and-pul-7621e8.mp3 | Build the missing word. Grab the rope and pull …! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-had-a-mug-milk-7df55c.mp3 | Build the missing word. I had a mug … milk. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-here-is-a-box-pins-cc8f07.mp3 | Build the missing word. Here is a box … pins. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-clock-hangs-the-w-442a59.mp3 | Build the missing word. The clock hangs … the wall. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-hop-the-bus-quick-823005.mp3 | Build the missing word. Hop … the bus, quick! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-who-left-mess-there-b0e688.mp3 | Build the missing word. Who left … mess there? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-drew-map-myself-6aaf03.mp3 | Build the missing word. I drew … map myself. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-shut-gate-please-50983d.mp3 | Build the missing word. Shut … gate, please. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-feed-fish-at-nine-9a341b.mp3 | Build the missing word. Feed … fish at nine. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-elves-hid-well-1e853a.mp3 | Build the missing word. The elves? … hid well. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-my-boots-got-wet-572a7a.mp3 | Build the missing word. My boots? … got wet. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-smell-rose-right-here-c73695.mp3 | Build the missing word. Smell … rose right here. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-hold-end-of-the-rope-b115cb.mp3 | Build the missing word. Hold … end of the rope. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-row-the-dock-7bc0ca.mp3 | Build the missing word. We row … the dock. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-pass-the-jam-gran-b86a7e.mp3 | Build the missing word. Pass the jam … Gran. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-soup-too-hot-20ae6e.mp3 | Build the missing word. The soup … too hot. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-trip-so-much-fun-119331.mp3 | Build the missing word. The trip … so much fun. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-come-camp-us-700250.mp3 | Build the missing word. Come camp … us! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-mix-the-eggs-a-fork-cc1922.mp3 | Build the missing word. Mix the eggs … a fork. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-did-see-the-comet-e64eac.mp3 | Build the missing word. Did … see the comet? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-made-this-card-for-3c8eaa.mp3 | Build the missing word. I made this card for …. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-she-fed-sma-5dc53e.mp3 | Which word finishes the sentence? She fed … small lamb. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-baked-thi-ad231a.mp3 | Which word finishes the sentence? I baked this … Dad. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-pond-fu-e2a020.mp3 | Which word finishes the sentence? The pond … full of frogs. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-ducks-s-9fc11b.mp3 | Which word finishes the sentence? The ducks? … swam off. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-sweep-steps-please-103ea0.mp3 | Build the missing word. Sweep … steps, please. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-can-lift-this-log-6c8620.mp3 | Build the missing word. Can … lift this log? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-hid-the-rain-d45d36.mp3 | Build the missing word. We hid … the rain. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-bob-packs-own-lunch-e52fac.mp3 | Build the missing word. Bob packs … own lunch. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-she-fed-of-a78c45.mp3 | Which word finishes the sentence? She fed … of the cats. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-he-drank-th-54675b.mp3 | Which word finishes the sentence? He drank … the milk. The jug is empty! | 1 |
| /audio/assessment/v3/prompts/all-find-the-word-all-f0b558.mp3 | all. Find the word all. | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-ate-egg-44db53.mp3 | Which word finishes the sentence? I ate … egg. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-she-saw-owl-3da61b.mp3 | Which word finishes the sentence? She saw … owl at dusk. | 1 |
| /audio/assessment/v3/prompts/an-find-the-word-an-831dd9.mp3 | an. Find the word an. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-ran-fast-152792.mp3 | Which word finishes the sentence? I ran fast, … I missed the bus. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-sun-is-9433db.mp3 | Which word finishes the sentence? The sun is out, … it is cold. | 1 |
| /audio/assessment/v3/prompts/but-find-the-word-but-49621f.mp3 | but. Find the word but. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-nest-is-44b138.mp3 | Which word finishes the sentence? The nest is … the gate. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-sat-the-56e814.mp3 | Which word finishes the sentence? We sat … the pond. | 1 |
| /audio/assessment/v3/prompts/by-find-the-word-by-99d9d8.mp3 | by. Find the word by. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-you-hop-lik-8210b4.mp3 | Which word finishes the sentence? … you hop like a frog? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-twins-s-3ac405.mp3 | Which word finishes the sentence? The twins … swim fast. | 1 |
| /audio/assessment/v3/prompts/can-find-the-word-can-35d440.mp3 | can. Find the word can. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-you-like-pl-ffeff6.mp3 | Which word finishes the sentence? … you like plums? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-what-cows-e-6f41f6.mp3 | Which word finishes the sentence? What … cows eat? | 1 |
| /audio/assessment/v3/prompts/do-find-the-word-do-426c04.mp3 | do. Find the word do. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-kid-got-a-b-5017d1.mp3 | Which word finishes the sentence? … kid got a badge. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-put-a-cup-a-c6df81.mp3 | Which word finishes the sentence? Put a cup at … desk. | 1 |
| /audio/assessment/v3/prompts/each-find-the-word-each-81be33.mp3 | each. Find the word each. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-last-week-w-c0dc0b.mp3 | Which word finishes the sentence? Last week we … a picnic. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-gran-six-ca-437a7c.mp3 | Which word finishes the sentence? Gran … six cats long ago. | 1 |
| /audio/assessment/v3/prompts/had-find-the-word-had-f4614e.mp3 | had. Find the word had. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-do-you-make-96c322.mp3 | Which word finishes the sentence? … do you make jam? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-tell-me-the-5aaa9e.mp3 | Which word finishes the sentence? Tell me … the trick works. | 1 |
| /audio/assessment/v3/prompts/how-find-the-word-how-3dc438.mp3 | how. Find the word how. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-ask-me-you-3dd1d9.mp3 | Which word finishes the sentence? Ask me … you get stuck. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-it-rains-we-235544.mp3 | Which word finishes the sentence? … it rains, we stay in. | 1 |
| /audio/assessment/v3/prompts/if-find-the-word-if-aa4c5b.mp3 | if. Find the word if. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-sums-ar-6b0995.mp3 | Which word finishes the sentence? The sums are … hard — they are easy! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-that-is-my-3a685e.mp3 | Which word finishes the sentence? That is … my hat! | 1 |
| /audio/assessment/v3/prompts/not-find-the-word-not-fbe24b.mp3 | not. Find the word not. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-have-just-b5d9c0.mp3 | Which word finishes the sentence? I have just … wish. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-duck-swam-o-964947.mp3 | Which word finishes the sentence? … duck swam off; two stayed. | 1 |
| /audio/assessment/v3/prompts/one-find-the-word-one-91a978.mp3 | one. Find the word one. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-do-you-want-c6b234.mp3 | Which word finishes the sentence? Do you want jam … ham? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-is-the-cup-ff584f.mp3 | Which word finishes the sentence? Is the cup full … empty? | 1 |
| /audio/assessment/v3/prompts/or-find-the-word-or-227082.mp3 | or. Find the word or. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-mum-we-can-a75a7f.mp3 | Which word finishes the sentence? Mum … we can camp! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-dad-yes-at-64f1e8.mp3 | Which word finishes the sentence? Dad … yes at last. | 1 |
| /audio/assessment/v3/prompts/said-find-the-word-said-d2a0bb.mp3 | said. Find the word said. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-my-aunt-nap-e78f59.mp3 | Which word finishes the sentence? My aunt naps when … can. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-gran-hums-a-7b2dbd.mp3 | Which word finishes the sentence? Gran hums as … bakes. | 1 |
| /audio/assessment/v3/prompts/she-find-the-word-she-2784b5.mp3 | she. Find the word she. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-twins-l-8b947c.mp3 | Which word finishes the sentence? The twins lost … kite. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-cubs-dr-fef6ee.mp3 | Which word finishes the sentence? The cubs drank … milk. | 1 |
| /audio/assessment/v3/prompts/their-find-the-word-their-a1f3da.mp3 | their. Find the word their. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-look-the-bu-53d352.mp3 | Which word finishes the sentence? Look — the bus is over …! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-got-just-310080.mp3 | Which word finishes the sentence? We got … just in time. | 1 |
| /audio/assessment/v3/prompts/there-find-the-word-there-bd701d.mp3 | there. Find the word there. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-key-to-652338.mp3 | Which word finishes the sentence? … the key to open the box. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-mud-to-m-6c21c0.mp3 | Which word finishes the sentence? We … mud to make bricks. | 1 |
| /audio/assessment/v3/prompts/use-find-the-word-use-804c05.mp3 | use. Find the word use. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-sis-and-i-h-27e8fb.mp3 | Which word finishes the sentence? Sis and I hid. … both grinned. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-dad-and-i-f-b9ad5e.mp3 | Which word finishes the sentence? Dad and I fish. … catch cod! | 1 |
| /audio/assessment/v3/prompts/we-find-the-word-we-4cdb1c.mp3 | we. Find the word we. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-shops-s-c22ae1.mp3 | Which word finishes the sentence? The shops … shut at ten. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-you-so-brav-3d7db0.mp3 | Which word finishes the sentence? You … so brave at the vet! | 1 |
| /audio/assessment/v3/prompts/were-find-the-word-were-3b817c.mp3 | were. Find the word were. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-is-in-the-b-361377.mp3 | Which word finishes the sentence? … is in the big box? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-guess-i-mad-bf11f5.mp3 | Which word finishes the sentence? Guess … I made for you! | 1 |
| /audio/assessment/v3/prompts/what-find-the-word-what-14c814.mp3 | what. Find the word what. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-does-the-sh-79ac88.mp3 | Which word finishes the sentence? … does the show start? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-clap-you-c682e2.mp3 | Which word finishes the sentence? I clap … you sing. | 1 |
| /audio/assessment/v3/prompts/when-find-the-word-when-8594df.mp3 | when. Find the word when. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-hat-is-your-cb80db.mp3 | Which word finishes the sentence? … hat is yours — red or blue? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-tell-me-pup-f7cf03.mp3 | Which word finishes the sentence? Tell me … pup you like best. | 1 |
| /audio/assessment/v3/prompts/which-find-the-word-which-e830ff.mp3 | which. Find the word which. | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-read-six-d02744.mp3 | Which word finishes the sentence? We read six new … today. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-big-can-be-e84ae9.mp3 | Which word finishes the sentence? Big … can be fun to spell. | 1 |
| /audio/assessment/v3/prompts/words-find-the-word-words-a8b9ba.mp3 | words. Find the word words. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-is-this-sca-5c8c4b.mp3 | Which word finishes the sentence? Is this … scarf? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-pack-bags-f-367388.mp3 | Which word finishes the sentence? Pack … bags for camp. | 1 |
| /audio/assessment/v3/prompts/your-find-the-word-your-d45b28.mp3 | your. Find the word your. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-ate-the-grapes-5e7845.mp3 | Build the missing word. We ate … the grapes. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-my-pens-ran-out-b2fc5b.mp3 | Build the missing word. … my pens ran out. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-he-fed-ox-at-the-farm-1fe6e3.mp3 | Build the missing word. He fed … ox at the farm. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-need-extra-bed-f3a88d.mp3 | Build the missing word. I need … extra bed. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-tried-i-slipped-e179b9.mp3 | Build the missing word. I tried, … I slipped. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-small-strong-feeaee.mp3 | Build the missing word. Small … strong! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-stand-the-door-please-904d19.mp3 | Build the missing word. Stand … the door, please. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-mill-sits-a-strea-c47fe6.mp3 | Build the missing word. The mill sits … a stream. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-foxes-jump-high-aa89bb.mp3 | Build the missing word. Foxes … jump high. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-camp-out-back-beb14e.mp3 | Build the missing word. … we camp out back? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-frogs-sleep-in-mud-1635e2.mp3 | Build the missing word. … frogs sleep in mud? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-sums-after-lunch-e98f7e.mp3 | Build the missing word. We … sums after lunch. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-give-hen-some-corn-12ab57.mp3 | Build the missing word. Give … hen some corn. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-box-has-a-lid-90caa2.mp3 | Build the missing word. … box has a lid. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-fun-at-the-fair-f4706a.mp3 | Build the missing word. We … fun at the fair. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-pup-my-sock-6cacd7.mp3 | Build the missing word. The pup … my sock! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-do-bees-make-honey-646728.mp3 | Build the missing word. … do bees make honey? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-show-me-to-knit-cfe667.mp3 | Build the missing word. Show me … to knit. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-yell-you-spot-land-5ef1b2.mp3 | Build the missing word. Yell … you spot land! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ask-dad-we-may-go-d2152a.mp3 | Build the missing word. Ask Dad … we may go. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-that-is-my-cup-109ef7.mp3 | Build the missing word. That is … my cup. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-do-wake-the-baby-a88081.mp3 | Build the missing word. Do … wake the baby! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-just-more-lap-to-run-8edc7b.mp3 | Build the missing word. Just … more lap to run! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-star-shone-first-5458d3.mp3 | Build the missing word. … star shone first. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-milk-water-with-lunch-24834f.mp3 | Build the missing word. Milk … water with lunch? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-walk-ride-you-pick-de5f01.mp3 | Build the missing word. Walk … ride — you pick. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-vet-to-rest-the-p-98cc19.mp3 | Build the missing word. The vet … to rest the pup. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-gran-bedtime-is-nine-67692a.mp3 | Build the missing word. Gran … bedtime is nine. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-may-join-our-team-2b6e8f.mp3 | Build the missing word. May … join our team? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-dug-up-a-gem-843475.mp3 | Build the missing word. … dug up a gem! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-bees-kept-honey-s-d4cbc6.mp3 | Build the missing word. The bees kept … honey safe. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-kids-lost-ball-ag-2f65cd.mp3 | Build the missing word. The kids lost … ball again. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-park-the-bikes-over-ced50c.mp3 | Build the missing word. Park the bikes over …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-is-anybody-daf583.mp3 | Build the missing word. Is anybody …? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-both-hands-to-lift-it-5387a3.mp3 | Build the missing word. … both hands to lift it. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-twigs-for-the-nest-a7f58b.mp3 | Build the missing word. We … twigs for the nest. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-can-bake-a-plum-pie-d08b33.mp3 | Build the missing word. Can … bake a plum pie? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-swam-till-six-edb3c5.mp3 | Build the missing word. … swam till six. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-socks-still-damp-a69416.mp3 | Build the missing word. The socks … still damp. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-you-fast-today-7163e0.mp3 | Build the missing word. You … fast today! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-fell-off-the-shelf-209118.mp3 | Build the missing word. … fell off the shelf? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-guess-i-found-b2654c.mp3 | Build the missing word. Guess … I found! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-does-the-pool-open-6645e9.mp3 | Build the missing word. … does the pool open? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-clap-the-song-ends-6ee14c.mp3 | Build the missing word. Clap … the song ends. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-sock-is-mine-5e8e2a.mp3 | Build the missing word. … sock is mine? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-pick-game-we-play-e58af7.mp3 | Build the missing word. Pick … game we play. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-rhyming-end-the-same-296582.mp3 | Build the missing word. Rhyming … end the same. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-long-need-long-tiles-7a5902.mp3 | Build the missing word. Long … need long tiles. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-tie-laces-up-tight-fa9bf7.mp3 | Build the missing word. Tie … laces up tight. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-bring-kit-on-monday-4e9ac6.mp3 | Build the missing word. Bring … kit on Monday. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-coach-t-ecae60.mp3 | Which word finishes the sentence? The coach … to rest up. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-ants-bu-6abd63.mp3 | Which word finishes the sentence? The ants built … nest fast. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-buns-st-16721b.mp3 | Which word finishes the sentence? The buns … still warm. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-just-bun-is-acc6a4.mp3 | Which word finishes the sentence? Just … bun is left. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-sit-by-the-window-8e38f9.mp3 | Build the missing word. Sit … by the window. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-who-that-815899.mp3 | Build the missing word. Who … that? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-crabs-nip-take-care-6285b5.mp3 | Build the missing word. Crabs … nip — take care! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-is-this-pen-or-mine-eef1e1.mp3 | Build the missing word. Is this … pen or mine? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-this-book-i-feaff1.mp3 | Which word finishes the sentence? This book is … ants. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-tell-me-the-c71953.mp3 | Which word finishes the sentence? Tell me … the trip! | 1 |
| /audio/assessment/v3/prompts/about-find-the-word-about-e4be13.mp3 | about. Find the word about. | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-may-we-to-t-5e69ff.mp3 | Which word finishes the sentence? May we … to the fair? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-vans-up-2952e8.mp3 | Which word finishes the sentence? The vans … up the hill. | 1 |
| /audio/assessment/v3/prompts/go-find-the-word-go-359301.mp3 | go. Find the word go. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-my-bike-a-b-b89531.mp3 | Which word finishes the sentence? My bike … a bell. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-ren-two-pet-7fe0da.mp3 | Which word finishes the sentence? Ren … two pet mice. | 1 |
| /audio/assessment/v3/prompts/has-find-the-word-has-b423fd.mp3 | has. Find the word has. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-meg-lost-mi-161c9f.mp3 | Which word finishes the sentence? Meg lost … mitten. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-gran-naps-i-ce17f8.mp3 | Which word finishes the sentence? Gran naps in … chair. | 1 |
| /audio/assessment/v3/prompts/her-find-the-word-her-2dc83e.mp3 | her. Find the word her. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-dad-waved-s-e8405c.mp3 | Which word finishes the sentence? Dad waved, so I waved at …. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-tom-fell-he-d16ea9.mp3 | Which word finishes the sentence? Tom fell — help … up! | 1 |
| /audio/assessment/v3/prompts/him-find-the-word-him-633894.mp3 | him. Find the word him. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-frog-ho-4a8dbc.mp3 | Which word finishes the sentence? The frog hopped … the pond. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-pour-the-mi-e85a29.mp3 | Which word finishes the sentence? Pour the milk … the jug. | 1 |
| /audio/assessment/v3/prompts/into-find-the-word-into-228fe9.mp3 | into. Find the word into. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-plums-bes-8cc986.mp3 | Which word finishes the sentence? I … plums best of all. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-clouds-can-4184af.mp3 | Which word finishes the sentence? Clouds can look … sheep. | 1 |
| /audio/assessment/v3/prompts/like-find-the-word-like-97df75.mp3 | like. Find the word like. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-at-the-doub-203c29.mp3 | Which word finishes the sentence? … at the double rainbow! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-for-shel-927c40.mp3 | Which word finishes the sentence? We … for shells at the beach. | 1 |
| /audio/assessment/v3/prompts/look-find-the-word-look-423bd5.mp3 | look. Find the word look. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-let-s-a-mud-71cfa8.mp3 | Which word finishes the sentence? Let's … a mud pie! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-bees-wax-an-2e89ef.mp3 | Which word finishes the sentence? Bees … wax and honey. | 1 |
| /audio/assessment/v3/prompts/make-find-the-word-make-ccb9c6.mp3 | make. Find the word make. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-hands-make-7d04b0.mp3 | Which word finishes the sentence? … hands make light work. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-how-eggs-ar-2ecd33.mp3 | Which word finishes the sentence? How … eggs are left? | 1 |
| /audio/assessment/v3/prompts/many-find-the-word-many-1ad087.mp3 | many. Find the word many. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-may-i-have-c04756.mp3 | Which word finishes the sentence? May I have … peas, please? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-this-box-ho-a401a9.mp3 | Which word finishes the sentence? This box holds … than that one. | 1 |
| /audio/assessment/v3/prompts/more-find-the-word-more-96fd69.mp3 | more. Find the word more. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-one-mitten-aa4f31.mp3 | Which word finishes the sentence? One mitten is dry. My … mitten is lost. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-try-your-ha-1605dd.mp3 | Which word finishes the sentence? Try your … hand. | 1 |
| /audio/assessment/v3/prompts/other-find-the-word-other-340ad8.mp3 | other. Find the word other. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-cat-ran-7443f5.mp3 | Which word finishes the sentence? The cat ran … of the shed. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-turn-the-la-77467b.mp3 | Which word finishes the sentence? Turn the lamp … at nine. | 1 |
| /audio/assessment/v3/prompts/out-find-the-word-out-74224f.mp3 | out. Find the word out. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-owls-can-we-512a6c.mp3 | Which word finishes the sentence? Owls can … well at night. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-come-and-my-b1664c.mp3 | Which word finishes the sentence? Come and … my fort! | 1 |
| /audio/assessment/v3/prompts/see-find-the-word-see-aa735e.mp3 | see. Find the word see. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-tea-was-ff3c7d.mp3 | Which word finishes the sentence? The tea was hot, … I let it cool. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-that-joke-i-e08437.mp3 | Which word finishes the sentence? That joke is … funny! | 1 |
| /audio/assessment/v3/prompts/so-find-the-word-so-22ef22.mp3 | so. Find the word so. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-save-cake-f-675578.mp3 | Which word finishes the sentence? Save … cake for Gran. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-birds-sing-794a96.mp3 | Which word finishes the sentence? … birds sing at dawn. | 1 |
| /audio/assessment/v3/prompts/some-find-the-word-some-b6efbf.mp3 | some. Find the word some. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-cups-i-a18cbe.mp3 | Which word finishes the sentence? The cups? I washed … all. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-find-the-tw-a98cdd.mp3 | Which word finishes the sentence? Find the twins and tell … to come. | 1 |
| /audio/assessment/v3/prompts/them-find-the-word-them-e69523.mp3 | them. Find the word them. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-swam-we-2c8422.mp3 | Which word finishes the sentence? We swam, … we had lunch. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-first-mix-b-a35d60.mp3 | Which word finishes the sentence? First mix, … bake. | 1 |
| /audio/assessment/v3/prompts/then-find-the-word-then-81159c.mp3 | then. Find the word then. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-boots-here-e6acf3.mp3 | Which word finishes the sentence? … boots here are muddy. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-are-your-ke-a129a0.mp3 | Which word finishes the sentence? Are … your keys right here? | 1 |
| /audio/assessment/v3/prompts/these-find-the-word-these-8c5998.mp3 | these. Find the word these. | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-what-does-t-a6ac80.mp3 | Which word finishes the sentence? What … does the pool open? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-it-is-for-b-f1155b.mp3 | Which word finishes the sentence? It is … for bed, sleepyhead. | 1 |
| /audio/assessment/v3/prompts/time-find-the-word-time-899e17.mp3 | time. Find the word time. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-have-thum-d9726a.mp3 | Which word finishes the sentence? I have … thumbs and eight fingers. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-recipe-2c9545.mp3 | Which word finishes the sentence? The recipe needs … eggs. | 1 |
| /audio/assessment/v3/prompts/two-find-the-word-two-ad48e0.mp3 | two. Find the word two. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-kite-we-c4efe3.mp3 | Which word finishes the sentence? The kite went … and away. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-roll-your-s-be13cc.mp3 | Which word finishes the sentence? Roll … your sleeping bag. | 1 |
| /audio/assessment/v3/prompts/up-find-the-word-up-70701e.mp3 | up. Find the word up. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-it-rain-lat-6542d1.mp3 | Which word finishes the sentence? It … rain later, I think. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-you-hold-my-a87872.mp3 | Which word finishes the sentence? … you hold my kite a bit? | 1 |
| /audio/assessment/v3/prompts/will-find-the-word-will-e89dc2.mp3 | will. Find the word will. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-you-like-a-36873d.mp3 | Which word finishes the sentence? … you like a hot roll? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-he-said-he-a51ec4.mp3 | Which word finishes the sentence? He said he … help us pack. | 1 |
| /audio/assessment/v3/prompts/would-find-the-word-would-692be2.mp3 | would. Find the word would. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-please-your-2f0d53.mp3 | Which word finishes the sentence? Please … your name at the top. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-to-my-pen-fc7313.mp3 | Which word finishes the sentence? I … to my pen pal weekly. | 1 |
| /audio/assessment/v3/prompts/write-find-the-word-write-252144.mp3 | write. Find the word write. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-this-song-is-the-sea-ccebd9.mp3 | Build the missing word. This song is … the sea. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ask-me-my-hobby-b37f0e.mp3 | Build the missing word. Ask me … my hobby. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-time-to-home-now-c09aad.mp3 | Build the missing word. Time to … home now. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ready-steady-e9b408.mp3 | Build the missing word. Ready, steady, …! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-hive-ten-bees-26b30b.mp3 | Build the missing word. The hive … ten bees. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-who-my-pencil-f38666.mp3 | Build the missing word. Who … my pencil? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-val-fed-rabbit-e12ef8.mp3 | Build the missing word. Val fed … rabbit. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-is-this-scarf-or-your-a5672d.mp3 | Build the missing word. Is this … scarf or yours? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-pass-the-map-to-b99e17.mp3 | Build the missing word. Pass the map to …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-picked-for-our-tea-9c7a6c.mp3 | Build the missing word. We picked … for our team. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-hop-the-boat-quick-d1b684.mp3 | Build the missing word. Hop … the boat, quick! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-seeds-went-the-so-25770c.mp3 | Build the missing word. The seeds went … the soil. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ducks-wet-weather-17aa71.mp3 | Build the missing word. Ducks … wet weather. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-my-toast-crunchy-fe6b8a.mp3 | Build the missing word. I … my toast crunchy. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-both-ways-first-ca6d13.mp3 | Build the missing word. … both ways first. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-come-at-the-tadpoles-f1ceea.mp3 | Build the missing word. Come … at the tadpoles! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-let-s-lemonade-c92ffa.mp3 | Build the missing word. Let's … lemonade. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-spiders-silk-webs-d71702.mp3 | Build the missing word. Spiders … silk webs. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-moths-came-to-the-lam-7270fb.mp3 | Build the missing word. … moths came to the lamp. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-how-steps-to-the-top-f00094.mp3 | Build the missing word. How … steps to the top? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-one-lap-then-rest-39f4c4.mp3 | Build the missing word. One … lap, then rest. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-plant-needs-sun-94a28f.mp3 | Build the missing word. The plant needs … sun. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-hold-it-with-your-han-965eb2.mp3 | Build the missing word. Hold it with your … hand. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-team-wore-red-dbf6db.mp3 | Build the missing word. The … team wore red. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-school-lets-at-three-f3c4de.mp3 | Build the missing word. School lets … at three. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-tide-went-fast-a22409.mp3 | Build the missing word. The tide went … fast. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-can-you-the-lighthous-daf41a.mp3 | Build the missing word. Can you … the lighthouse? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-three-sails-38c02d.mp3 | Build the missing word. I … three sails! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-bag-was-heavy-f2c2db.mp3 | Build the missing word. The bag was … heavy! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-trained-hard-i-won-386b3e.mp3 | Build the missing word. I trained hard, … I won. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-take-grapes-for-the-t-a4484f.mp3 | Build the missing word. Take … grapes for the trip. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-crabs-hide-under-rock-d39c9b.mp3 | Build the missing word. … crabs hide under rocks. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-chicks-feed-at-fi-5c24fb.mp3 | Build the missing word. The chicks? Feed … at five. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-stack-the-chairs-and-781084.mp3 | Build the missing word. Stack the chairs and count …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-wash-up-dry-your-hand-3f9024.mp3 | Build the missing word. Wash up, … dry your hands. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-first-stretch-sprint-efe5be.mp3 | Build the missing word. First stretch, … sprint. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-shells-here-are-tiny-4ba887.mp3 | Build the missing word. … shells here are tiny. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-are-seats-taken-eccd1d.mp3 | Build the missing word. Are … seats taken? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-it-is-snack-a35886.mp3 | Build the missing word. It is snack …! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-what-is-kickoff-c5254c.mp3 | Build the missing word. What … is kickoff? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-a-bike-has-wheels-a9bac1.mp3 | Build the missing word. A bike has … wheels. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-crows-sat-on-the-fenc-32eabb.mp3 | Build the missing word. … crows sat on the fence. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-balloon-drifted-2636ec.mp3 | Build the missing word. The balloon drifted …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-climb-the-ladder-slow-bbd7d0.mp3 | Build the missing word. Climb … the ladder slowly. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-gran-knit-you-a-hat-ca452c.mp3 | Build the missing word. Gran … knit you a hat. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-bread-rise-by-noo-d52176.mp3 | Build the missing word. The bread … rise by noon. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-you-feed-my-fish-9d2ea2.mp3 | Build the missing word. … you feed my fish? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-she-said-she-come-3e700d.mp3 | Build the missing word. She said she … come. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-a-list-before-we-shop-eb21ef.mp3 | Build the missing word. … a list before we shop. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-with-my-left-hand-1e8e99.mp3 | Build the missing word. I … with my left hand. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-it-be-ok-to-114457.mp3 | Which word finishes the sentence? … it be OK to sit here? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-scribes-all-3ef78a.mp3 | Which word finishes the sentence? Scribes … all day long. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ben-trade-his-apple-ceacd0.mp3 | Build the missing word. Ben … trade his apple. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-neatly-on-the-line-f7c7d4.mp3 | Build the missing word. … neatly on the line. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-socks-come-9be14f.mp3 | Which word finishes the sentence? Socks come in sets of …. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-so-stars-ar-42011b.mp3 | Which word finishes the sentence? So … stars are out tonight! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-before-you-leap-d96dce.mp3 | Build the missing word. … before you leap! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-bath-for-the-pup-fc8ea3.mp3 | Build the missing word. Bath … for the pup! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-where-have-505949.mp3 | Which word finishes the sentence? Where have you … all day? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-pups-ha-bffef0.mp3 | Which word finishes the sentence? The pups have … fed. | 1 |
| /audio/assessment/v3/prompts/been-find-the-word-been-f95c04.mp3 | been. Find the word been. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-gran-us-in-6c0260.mp3 | Which word finishes the sentence? Gran … us in for tea. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-our-cat-is-346c74.mp3 | Which word finishes the sentence? Our cat is … Pickle. | 1 |
| /audio/assessment/v3/prompts/called-find-the-word-called-818c86.mp3 | called. Find the word called. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-and-warm-up-bd4384.mp3 | Which word finishes the sentence? … and warm up by the fire. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-foxes-out-a-b45167.mp3 | Which word finishes the sentence? Foxes … out after dark. | 1 |
| /audio/assessment/v3/prompts/come-find-the-word-come-f44907.mp3 | come. Find the word come. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-you-pass-th-277878.mp3 | Which word finishes the sentence? … you pass the jam? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-long-ago-gr-87a3f3.mp3 | Which word finishes the sentence? Long ago, Gran … skate fast. | 1 |
| /audio/assessment/v3/prompts/could-find-the-word-could-b50ee4.mp3 | could. Find the word could. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-what-is-the-e081d6.mp3 | Which word finishes the sentence? What … is the fair on? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-what-a-wind-70a6ff.mp3 | Which word finishes the sentence? What a windy … for kites! | 1 |
| /audio/assessment/v3/prompts/day-find-the-word-day-799930.mp3 | day. Find the word day. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-you-lock-th-46678f.mp3 | Which word finishes the sentence? … you lock the gate? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-our-best-f15a73.mp3 | Which word finishes the sentence? We … our best at the quiz. | 1 |
| /audio/assessment/v3/prompts/did-find-the-word-did-68eb18.mp3 | did. Find the word did. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-otter-s-a31ab6.mp3 | Which word finishes the sentence? The otter slid … the bank. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-write-it-so-998a70.mp3 | Which word finishes the sentence? Write it … so you remember. | 1 |
| /audio/assessment/v3/prompts/down-find-the-word-down-7a9a71.mp3 | down. Find the word down. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-can-you-the-9731a5.mp3 | Which word finishes the sentence? Can you … the hidden key? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-bats-moths-b9efcc.mp3 | Which word finishes the sentence? Bats … moths at night. | 1 |
| /audio/assessment/v3/prompts/find-find-the-word-find-74d58e.mp3 | find. Find the word find. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-tie-the-kno-6a1adf.mp3 | Which word finishes the sentence? Tie the knot …, then pull. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-ana-came-in-5c50b0.mp3 | Which word finishes the sentence? Ana came … in the race. | 1 |
| /audio/assessment/v3/prompts/first-find-the-word-first-2ae8ca.mp3 | first. Find the word first. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-please-my-c-dac79a.mp3 | Which word finishes the sentence? Please … my coat from the peg. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-ducks-muddy-86942e.mp3 | Which word finishes the sentence? Ducks … muddy and stay happy. | 1 |
| /audio/assessment/v3/prompts/get-find-the-word-get-7ac089.mp3 | get. Find the word get. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-a-snake-is-a2b1b7.mp3 | Which word finishes the sentence? A snake is … and thin. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-how-is-the-f8fe92.mp3 | Which word finishes the sentence? How … is the train ride? | 1 |
| /audio/assessment/v3/prompts/long-find-the-word-long-af5507.mp3 | long. Find the word long. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-gramps-this-326c43.mp3 | Which word finishes the sentence? Gramps … this stool himself. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-chef-so-597666.mp3 | Which word finishes the sentence? The chef … soup from scraps. | 1 |
| /audio/assessment/v3/prompts/made-find-the-word-made-534251.mp3 | made. Find the word made. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-leave-the-f1eab4.mp3 | Which word finishes the sentence? … I leave the table? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-it-snow-bef-f53f16.mp3 | Which word finishes the sentence? It … snow before dawn. | 1 |
| /audio/assessment/v3/prompts/may-find-the-word-may-8380b5.mp3 | may. Find the word may. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-that-bike-i-b896e9.mp3 | Which word finishes the sentence? That bike is …, not yours. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-lost-left-bd3c55.mp3 | Which word finishes the sentence? I lost … left glove. | 1 |
| /audio/assessment/v3/prompts/my-find-the-word-my-1568ca.mp3 | my. Find the word my. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-there-are-p-69803c.mp3 | Which word finishes the sentence? There are … plums left. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-dogs-on-the-3cd929.mp3 | Which word finishes the sentence? … dogs on the sand, says the sign. | 1 |
| /audio/assessment/v3/prompts/no-find-the-word-no-6cedf8.mp3 | no. Find the word no. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-glue-is-8b1ac8.mp3 | Which word finishes the sentence? The glue is dry …. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-it-is-my-tu-d5014a.mp3 | Which word finishes the sentence? … it is my turn! | 1 |
| /audio/assessment/v3/prompts/now-find-the-word-now-ef093b.mp3 | now. Find the word now. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-pick-a-from-809c40.mp3 | Which word finishes the sentence? Pick a … from one to ten. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-what-is-you-9813b9.mp3 | Which word finishes the sentence? What … is your house? | 1 |
| /audio/assessment/v3/prompts/number-find-the-word-number-f34698.mp3 | number. Find the word number. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-dad-put-on-f7d415.mp3 | Which word finishes the sentence? Dad put … on the squeaky hinge. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-and-water-w-6f42f5.mp3 | Which word finishes the sentence? … and water will not mix. | 1 |
| /audio/assessment/v3/prompts/oil-find-the-word-oil-8ba6c8.mp3 | oil. Find the word oil. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-best-of-362f66.mp3 | Which word finishes the sentence? The best … of camp was the raft. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-each-of-the-e6a071.mp3 | Which word finishes the sentence? Each … of the model snaps in. | 1 |
| /audio/assessment/v3/prompts/part-find-the-word-part-2c8dfc.mp3 | part. Find the word part. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-hall-wa-2e58a1.mp3 | Which word finishes the sentence? The hall was full of …. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-waved-from-5e31e3.mp3 | Which word finishes the sentence? … waved from the bridge. | 1 |
| /audio/assessment/v3/prompts/people-find-the-word-people-d83398.mp3 | people. Find the word people. | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-come-by-me-4170d6.mp3 | Which word finishes the sentence? Come … by me at lunch. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-hens-on-the-9c8e0e.mp3 | Which word finishes the sentence? Hens … on their eggs. | 1 |
| /audio/assessment/v3/prompts/sit-find-the-word-sit-34e749.mp3 | sit. Find the word sit. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-a-whale-is-581d55.mp3 | Which word finishes the sentence? A whale is bigger … a bus. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-would-rat-670f41.mp3 | Which word finishes the sentence? I would rather walk … wait. | 1 |
| /audio/assessment/v3/prompts/than-find-the-word-than-603f10.mp3 | than. Find the word than. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-plants-need-5b4534.mp3 | Which word finishes the sentence? Plants need sun and …. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-in-the-bd92d8.mp3 | Which word finishes the sentence? The … in the pool is cold. | 1 |
| /audio/assessment/v3/prompts/water-find-the-word-water-72bc32.mp3 | water. Find the word water. | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-is-this-the-b4aa8b.mp3 | Which word finishes the sentence? Is this the … to the beach? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-show-me-the-3bb985.mp3 | Which word finishes the sentence? Show me the … you fold it. | 1 |
| /audio/assessment/v3/prompts/way-find-the-word-way-559e64.mp3 | way. Find the word way. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-left-the-ta-102a9c.mp3 | Which word finishes the sentence? … left the tap running? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-guess-won-t-31f24e.mp3 | Which word finishes the sentence? Guess … won the raffle! | 1 |
| /audio/assessment/v3/prompts/who-find-the-word-who-4dd2c2.mp3 | who. Find the word who. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-have-you-to-the-fair-75cfb8.mp3 | Build the missing word. Have you … to the fair? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-barn-has-painted-547689.mp3 | Build the missing word. The barn has … painted. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-pup-is-biscuit-7afe40.mp3 | Build the missing word. The pup is … Biscuit. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-mum-the-vet-at-once-b0a586.mp3 | Build the missing word. Mum … the vet at once. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-and-see-the-chicks-54d8dd.mp3 | Build the missing word. … and see the chicks! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-storms-fast-at-sea-8bcc2f.mp3 | Build the missing word. Storms … fast at sea. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-camp-by-the-lake-d7c1d0.mp3 | Build the missing word. … we camp by the lake? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-owls-hear-a-pin-drop-f03f47.mp3 | Build the missing word. Owls … hear a pin drop. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-sports-is-on-friday-bc7d3c.mp3 | Build the missing word. Sports … is on Friday. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-what-a-fine-for-a-hik-a54f8c.mp3 | Build the missing word. What a fine … for a hike! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-alarm-ring-41be8b.mp3 | Build the missing word. … the alarm ring? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-you-a-fine-job-a6eae2.mp3 | Build the missing word. You … a fine job. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-roll-the-barrel-the-r-6166a4.mp3 | Build the missing word. Roll the barrel … the ramp. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-sun-went-at-eight-68a776.mp3 | Build the missing word. The sun went … at eight. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-help-me-my-keys-ccc6ba.mp3 | Build the missing word. Help me … my keys. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-crows-shiny-things-763ccf.mp3 | Build the missing word. Crows … shiny things. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ladders-then-paint-cfb0d1.mp3 | Build the missing word. Ladders …, then paint. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-who-came-in-the-quiz-84cf71.mp3 | Build the missing word. Who came … in the quiz? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-your-boots-it-snowed-f53546.mp3 | Build the missing word. … your boots — it snowed! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-eggs-from-the-coop-36dbdf.mp3 | Build the missing word. We … eggs from the coop. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-giraffes-have-necks-7d8e46.mp3 | Build the missing word. Giraffes have … necks. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-queue-was-so-52f80d.mp3 | Build the missing word. The queue was so …! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-jam-tarts-today-5bf8a6.mp3 | Build the missing word. We … jam tarts today. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ants-a-nest-by-the-st-5a847a.mp3 | Build the missing word. Ants … a nest by the step. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-i-ring-the-bell-4b1d5b.mp3 | Build the missing word. … I ring the bell? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-it-thunder-later-42b412.mp3 | Build the missing word. It … thunder later. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-where-is-other-mitten-d5a6c4.mp3 | Build the missing word. Where is … other mitten? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-turn-on-the-swing-921829.mp3 | Build the missing word. … turn on the swing! | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-there-is-milk-left-d05686.mp3 | Build the missing word. There is … milk left. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-two-snowflakes-match-640dc5.mp3 | Build the missing word. … two snowflakes match. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-paint-is-dry-ad329b.mp3 | Build the missing word. The paint is dry …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-add-the-flour-slowly-1e0a73.mp3 | Build the missing word. … add the flour slowly. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ring-this-if-lost-911d79.mp3 | Build the missing word. Ring this … if lost. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-seven-is-my-lucky-7d836f.mp3 | Build the missing word. Seven is my lucky …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-bike-chains-need-752d2a.mp3 | Build the missing word. Bike chains need …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-wheels-please-e773df.mp3 | Build the missing word. … the wheels, please. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-this-clips-on-last-c55fa3.mp3 | Build the missing word. This … clips on last. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-play-your-in-the-show-368628.mp3 | Build the missing word. Play your … in the show. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-six-fit-in-the-lift-d713a3.mp3 | Build the missing word. Six … fit in the lift. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-kind-share-the-bench-1f4a71.mp3 | Build the missing word. Kind … share the bench. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-still-for-the-photo-6f497a.mp3 | Build the missing word. … still for the photo. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-cats-where-they-pleas-76a81b.mp3 | Build the missing word. Cats … where they please. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-silk-is-softer-wool-8e7674.mp3 | Build the missing word. Silk is softer … wool. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ice-is-colder-snow-512b11.mp3 | Build the missing word. Ice is colder … snow. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-fill-the-trough-with-6154f9.mp3 | Build the missing word. Fill the trough with …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-the-froze-overnight-ea4f2f.mp3 | Build the missing word. The … froze overnight. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-this-to-the-exit-2a1e87.mp3 | Build the missing word. This … to the exit. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-a-compass-shows-the-2000f5.mp3 | Build the missing word. A compass shows the …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ate-the-last-plum-9def9f.mp3 | Build the missing word. … ate the last plum? | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-ask-owns-the-scooter-582677.mp3 | Build the missing word. Ask … owns the scooter. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-wish-i-fl-30d0af.mp3 | Which word finishes the sentence? I wish I … fly like a hawk. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-post-ha-803de2.mp3 | Which word finishes the sentence? The post has already …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-we-hear-the-sea-from-48683c.mp3 | Build the missing word. We … hear the sea from camp. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-it-has-ages-9aca0f.mp3 | Build the missing word. It has … ages! | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-knows-the-a-1bb75e.mp3 | Which word finishes the sentence? … knows the answer? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-feathers-we-1249cd.mp3 | Which word finishes the sentence? Feathers weigh less … stones. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-pick-an-odd-6c9ff3.mp3 | Build the missing word. Pick an odd …. | 1 |
| /audio/assessment/v3/prompts/build-the-missing-word-save-take-short-showe-5709ea.mp3 | Build the missing word. Save … — take short showers. | 1 |
| /audio/assessment/v3/prompts/which-spelling-names-the-big-salty-water-3b21e3.mp3 | Which spelling names the big salty water? | 1 |
| /audio/assessment/v3/prompts/which-spelling-means-you-look-with-your-eyes-27ffdc.mp3 | Which spelling means you look with your eyes? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-we-sail-6bf1da.mp3 | Which spelling finishes the sentence? We sailed far out on the deep blue …. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-close-y-4b6cca.mp3 | Which spelling finishes the sentence? Close your eyes — now open and …! | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-hot-star-in-the-sky-bdea11.mp3 | Which spelling is the hot star in the sky? | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-a-boy-in-a-family-5199e8.mp3 | Which spelling is a boy in a family? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-ros-80b3b6.mp3 | Which spelling finishes the sentence? The … rose over the hill at dawn. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-grandpa-dd2182.mp3 | Which spelling finishes the sentence? Grandpa hugged his … at the gate. | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-buzzing-insect-7c615f.mp3 | Which spelling is the buzzing insect? | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-doing-word-in-let-it-68c391.mp3 | Which spelling is the doing word in 'Let it … '? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-a-lande-d25f74.mp3 | Which spelling finishes the sentence? A … landed on the flower. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-i-will-3fe43e.mp3 | Which spelling finishes the sentence? I will … seven on my next birthday. | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-word-for-not-yes-b4e837.mp3 | Which spelling is the word for 'not yes'? | 1 |
| /audio/assessment/v3/prompts/which-spelling-fits-to-the-answer-7220c2.mp3 | Which spelling fits 'to … the answer'? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-dad-sai-f8ce8d.mp3 | Which spelling finishes the sentence? Dad said … when I asked for sweets. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-do-you-bf8224.mp3 | Which spelling finishes the sentence? Do you … the way to school? | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-number-after-zero-464784.mp3 | Which spelling is the number after zero? | 1 |
| /audio/assessment/v3/prompts/which-spelling-tells-that-your-team-came-fir-404aec.mp3 | Which spelling tells that your team came first? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-pick-ju-98cb9e.mp3 | Which spelling finishes the sentence? Pick just … card from the pack. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-our-tea-338e8e.mp3 | Which spelling finishes the sentence? Our team … the cup last year! | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-number-after-seven-fee60b.mp3 | Which spelling is the number after seven? | 1 |
| /audio/assessment/v3/prompts/which-spelling-tells-that-lunch-is-all-gone-9a919d.mp3 | Which spelling tells that lunch is all gone? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-ben-all-be15b2.mp3 | Which spelling finishes the sentence? Ben … all his peas at dinner. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-there-a-ba922f.mp3 | Which spelling finishes the sentence? There are … legs on a spider. | 1 |
| /audio/assessment/v3/prompts/which-spelling-uses-your-ears-d961a3.mp3 | Which spelling uses your ears? | 1 |
| /audio/assessment/v3/prompts/which-spelling-points-to-this-place-7141a6.mp3 | Which spelling points to this place? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-shh-i-c-9ef61d.mp3 | Which spelling finishes the sentence? Shh! I can … the owl outside. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-bus-63269b.mp3 | Which spelling finishes the sentence? The bus stops right …, at this very corner. | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-color-of-the-sky-eb2ef5.mp3 | Which spelling is the color of the sky? | 1 |
| /audio/assessment/v3/prompts/which-spelling-tells-what-the-wind-did-d94888.mp3 | Which spelling tells what the wind did? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-win-8d4684.mp3 | Which spelling finishes the sentence? The wind … my hat into the pond! | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-milo-wo-4947a3.mp3 | Which spelling finishes the sentence? Milo wore his … scarf, blue like the sea. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-may-i-c-fdb338.mp3 | Which spelling finishes the sentence? May I come … the park with you? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-nan-bak-f8c84d.mp3 | Which spelling finishes the sentence? Nan baked … pies, one for each hand. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-that-so-73ef5b.mp3 | Which spelling finishes the sentence? That soup is … hot to eat! | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-number-1a3c2e.mp3 | Which spelling is the number? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-twi-f6e3a2.mp3 | Which spelling finishes the sentence? The twins packed … bags for camp. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-look-ov-9fef0d.mp3 | Which spelling finishes the sentence? Look over … — the parade is coming! | 1 |
| /audio/assessment/v3/prompts/which-spelling-shows-something-belongs-to-th-a79cf1.mp3 | Which spelling shows something belongs to them? | 1 |
| /audio/assessment/v3/prompts/which-spelling-points-to-a-place-78ca95.mp3 | Which spelling points to a place? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-tea-37c419.mp3 | Which spelling finishes the sentence? The teacher ticked it — my sum was …. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-i-will-ba0ba8.mp3 | Which spelling finishes the sentence? I will … a letter to Gran tonight. | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-opposite-of-left-92ebf5.mp3 | Which spelling is the opposite of left? | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-done-with-a-pencil-e26294.mp3 | Which spelling is done with a pencil? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-my-shoe-187cb7.mp3 | Which spelling finishes the sentence? My shoes are … — I got them today. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-i-the-a-e10dee.mp3 | Which spelling finishes the sentence? I … the answer before anyone else. | 1 |
| /audio/assessment/v3/prompts/which-spelling-tells-you-understood-it-all-a-3abbaf.mp3 | Which spelling tells you understood it all along? | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-the-opposite-of-old-7110aa.mp3 | Which spelling is the opposite of old? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-cak-b6bca6.mp3 | Which spelling finishes the sentence? The cake bakes for one …. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-that-sw-a8ead2.mp3 | Which spelling finishes the sentence? That swing is … special spot. | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-sixty-minutes-2672cd.mp3 | Which spelling is sixty minutes? | 1 |
| /audio/assessment/v3/prompts/which-spelling-means-it-belongs-to-us-dd5636.mp3 | Which spelling means it belongs to us? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-sift-th-2318a7.mp3 | Which spelling finishes the sentence? Sift the … into the bowl for the cake. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-a-bee-l-115cc1.mp3 | Which spelling finishes the sentence? A bee landed on the pink …. | 1 |
| /audio/assessment/v3/prompts/which-spelling-grows-in-the-garden-5a9bad.mp3 | Which spelling grows in the garden? | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-powder-for-baking-50776f.mp3 | Which spelling is powder for baking? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-you-lik-9f52c1.mp3 | Which spelling finishes the sentence? … you like some juice? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-ben-2437ff.mp3 | Which spelling finishes the sentence? The bench is made of … from the old oak. | 1 |
| /audio/assessment/v3/prompts/which-spelling-comes-from-trees-2aee86.mp3 | Which spelling comes from trees? | 1 |
| /audio/assessment/v3/prompts/which-spelling-asks-politely-as-in-you-help-5b46ee.mp3 | Which spelling asks politely, as in ' … you help me?' | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-gran-pa-ae03fe.mp3 | Which spelling finishes the sentence? Gran … pancakes for breakfast. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-swe-edbf97.mp3 | Which spelling finishes the sentence? The … swept the castle floor. | 1 |
| /audio/assessment/v3/prompts/which-spelling-tells-that-you-built-somethin-c1ea3d.mp3 | Which spelling tells that you built something? | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-a-castle-helper-ccefb1.mp3 | Which spelling is a castle helper? | 1 |
| /audio/assessment/v3/prompts/which-sentence-uses-bat-to-mean-the-animal-193177.mp3 | Which sentence uses bat to mean the animal? | 1 |
| /audio/assessment/v3/prompts/which-sentence-uses-bat-as-the-thing-you-hit-3a44d0.mp3 | Which sentence uses bat as the thing you HIT with? | 1 |
| /audio/assessment/v3/prompts/a-ring-can-be-jewelry-or-a-sound-which-sente-6512e6.mp3 | A ring can be jewelry or a sound. Which sentence uses ring as the SOUND? | 1 |
| /audio/assessment/v3/prompts/which-sentence-uses-ring-as-the-thing-you-we-e5af16.mp3 | Which sentence uses ring as the thing you WEAR? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-shells-ae8c5b.mp3 | Which spelling finishes the sentence? Shells wash up from the …. | 1 |
| /audio/assessment/v3/prompts/which-spelling-warms-the-earth-753afb.mp3 | Which spelling warms the earth? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-buz-d9568a.mp3 | Which spelling finishes the sentence? The … buzzed from rose to rose. | 1 |
| /audio/assessment/v3/prompts/which-spelling-fits-i-my-phone-number-by-hea-77c37d.mp3 | Which spelling fits: I … my phone number by heart? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-we-the-63022a.mp3 | Which spelling finishes the sentence? We … the quiz by a single point! | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-how-many-legs-an-octopus-h-419196.mp3 | Which spelling is how many legs an octopus has? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-stand-s-2b24f8.mp3 | Which spelling finishes the sentence? Stand still and you can … the waves. | 1 |
| /audio/assessment/v3/prompts/which-spelling-is-a-color-1662e5.mp3 | Which spelling is a color? | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-it-is-d-28c842.mp3 | Which spelling finishes the sentence? It is … dark to read outside now. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-the-bir-cbcf82.mp3 | Which spelling finishes the sentence? The birds built … nest in the oak. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-use-the-7db79f.mp3 | Which spelling finishes the sentence? Use the pencil to … your name. | 1 |
| /audio/assessment/v3/prompts/which-spelling-finishes-the-sentence-we-a-fo-d919a8.mp3 | Which spelling finishes the sentence? We … a fort out of pillows. | 1 |
| /audio/assessment/v3/prompts/how-does-sami-most-likely-feel-231e73.mp3 | How does Sami most likely feel? | 1 |
| /audio/assessment/v3/prompts/how-does-lena-feel-at-the-end-dfa38f.mp3 | How does Lena feel at the end? | 1 |
| /audio/assessment/v3/prompts/how-does-dara-feel-about-finishing-7f38db.mp3 | How does Dara feel about finishing? | 1 |
| /audio/assessment/v3/prompts/how-does-ivo-most-likely-feel-3b0d08.mp3 | How does Ivo most likely feel? | 1 |
| /audio/assessment/v3/prompts/how-does-bea-feel-1b3662.mp3 | How does Bea feel? | 1 |
| /audio/assessment/v3/prompts/how-does-kofi-most-likely-feel-675f8c.mp3 | How does Kofi most likely feel? | 1 |
| /audio/assessment/v3/prompts/how-does-noor-feel-in-the-dark-d5ed7e.mp3 | How does Noor feel in the dark? | 1 |
| /audio/assessment/v3/prompts/how-does-ren-most-likely-feel-d50d5c.mp3 | How does Ren most likely feel? | 1 |
| /audio/assessment/v3/prompts/where-does-this-take-place-35d66b.mp3 | Where does this take place? | 5 |
| /audio/assessment/v3/prompts/where-is-mara-14928c.mp3 | Where is Mara? | 1 |
| /audio/assessment/v3/prompts/where-is-tia-d217eb.mp3 | Where is Tia? | 1 |
| /audio/assessment/v3/prompts/where-are-they-6e8b6d.mp3 | Where are they? | 2 |
| /audio/assessment/v3/prompts/where-is-omar-14bd0c.mp3 | Where is Omar? | 1 |
| /audio/assessment/v3/prompts/what-will-most-likely-happen-next-c33c90.mp3 | What will most likely happen next? | 8 |
| /audio/assessment/v3/prompts/what-most-likely-happened-to-the-sandwich-3004ea.mp3 | What most likely happened to the sandwich? | 1 |
| /audio/assessment/v3/prompts/why-did-ma-change-the-plans-a2fc55.mp3 | Why did Ma change the plans? | 1 |
| /audio/assessment/v3/prompts/why-did-marco-give-lily-his-orange-938cbc.mp3 | Why did Marco give Lily his orange? | 1 |
| /audio/assessment/v3/prompts/why-did-pia-walk-instead-of-ride-4bd694.mp3 | Why did Pia walk instead of ride? | 1 |
| /audio/assessment/v3/prompts/why-did-gran-go-to-the-hallway-b227c2.mp3 | Why did Gran go to the hallway? | 1 |
| /audio/assessment/v3/prompts/why-did-the-coach-move-jonah-5305ff.mp3 | Why did the coach move Jonah? | 1 |
| /audio/assessment/v3/prompts/why-does-auntie-fern-use-sealed-jars-f304a5.mp3 | Why does Auntie Fern use sealed jars? | 1 |
| /audio/assessment/v3/prompts/why-did-asha-sit-at-the-front-with-her-ticke-747b12.mp3 | Why did Asha sit at the front with her ticket out? | 1 |
| /audio/assessment/v3/prompts/why-did-mr-okafor-keep-moving-the-ladder-9e27d8.mp3 | Why did Mr Okafor keep moving the ladder? | 1 |
| /audio/assessment/v3/prompts/what-must-have-happened-before-jess-came-in-34af83.mp3 | What must have happened before Jess came in? | 1 |
| /audio/assessment/v3/prompts/what-must-have-happened-overnight-b3ff81.mp3 | What must have happened overnight? | 1 |
| /audio/assessment/v3/prompts/what-went-wrong-while-they-were-out-cd22cf.mp3 | What went wrong while they were out? | 1 |
| /audio/assessment/v3/prompts/what-had-happened-at-home-4a56ca.mp3 | What had happened at home? | 1 |
| /audio/assessment/v3/prompts/who-has-most-likely-been-moving-the-gnome-c93eba.mp3 | Who has most likely been moving the gnome? | 1 |
| /audio/assessment/v3/prompts/what-most-likely-visited-in-the-night-bff9ed.mp3 | What most likely visited in the night? | 1 |
| /audio/assessment/v3/prompts/what-had-mum-been-doing-71b8fc.mp3 | What had Mum been doing? | 1 |
| /audio/assessment/v3/prompts/what-must-have-happened-while-they-were-out-7a39ba.mp3 | What must have happened while they were out? | 1 |
| /audio/assessment/v3/prompts/which-words-from-the-story-show-how-tilly-re-d7b6e1.mp3 | Which words from the story show how Tilly REALLY feels? | 1 |
| /audio/assessment/v3/prompts/which-words-show-that-ba-wanted-that-dog-c7fe02.mp3 | Which words show that Ba wanted THAT dog? | 1 |
| /audio/assessment/v3/prompts/which-clue-points-to-femi-5a2c0b.mp3 | Which clue points to Femi? | 1 |
| /audio/assessment/v3/prompts/which-words-show-the-win-did-matter-to-harri-9e4599.mp3 | Which words show the win DID matter to Harri? | 1 |
| /audio/assessment/v3/prompts/which-words-show-the-new-boy-had-played-ches-29e346.mp3 | Which words show the new boy HAD played chess? | 1 |
| /audio/assessment/v3/prompts/which-words-show-mum-was-actually-asleep-1e0c55.mp3 | Which words show Mum was actually asleep? | 1 |
| /audio/assessment/v3/prompts/which-words-show-the-caretaker-loves-the-cat-3c69dc.mp3 | Which words show the caretaker loves the cat? | 1 |
| /audio/assessment/v3/prompts/which-words-show-priti-was-scared-of-the-thu-5e4ea1.mp3 | Which words show Priti WAS scared of the thunder? | 1 |
| /audio/assessment/v3/prompts/how-does-milo-feel-at-the-end-4ce547.mp3 | How does Milo feel at the end? | 1 |
| /audio/assessment/v3/prompts/how-does-wren-most-likely-feel-62b6cc.mp3 | How does Wren most likely feel? | 1 |
| /audio/assessment/v3/prompts/where-is-ana-d20d95.mp3 | Where is Ana? | 1 |
| /audio/assessment/v3/prompts/what-will-josh-most-likely-do-88e399.mp3 | What will Josh most likely do? | 1 |
| /audio/assessment/v3/prompts/how-did-ola-feel-about-the-slide-by-the-end-965566.mp3 | How did Ola feel about the slide by the end? | 1 |
| /audio/assessment/v3/prompts/why-did-ade-hide-the-dinosaur-d0c7a1.mp3 | Why did Ade hide the dinosaur? | 1 |
| /audio/assessment/v3/prompts/why-did-the-owner-most-likely-make-these-cha-defb13.mp3 | Why did the owner most likely make these changes? | 1 |
| /audio/assessment/v3/prompts/what-must-have-happened-204112.mp3 | What must have happened? | 1 |
| /audio/assessment/v3/prompts/what-is-dad-most-likely-hiding-6ce8e1.mp3 | What is Dad most likely hiding? | 1 |
| /audio/assessment/v3/prompts/which-words-show-sol-truly-cared-about-the-l-b0d1a0.mp3 | Which words show Sol truly cared about the lambs? | 1 |
| /audio/assessment/v3/prompts/which-words-show-there-probably-was-a-mouse-1fdf0f.mp3 | Which words show there probably WAS a mouse? | 1 |
| /audio/assessment/v3/prompts/why-did-nina-wrap-the-book-26c20b.mp3 | Why did Nina wrap the book? | 1 |
| /audio/assessment/v3/prompts/what-makes-the-plants-lean-6f118b.mp3 | What makes the plants lean? | 1 |
| /audio/assessment/v3/prompts/apple-which-letter-makes-the-first-sound-in-e556d2.mp3 | apple. Which letter makes the first sound in apple? | 1 |
| /audio/assessment/v3/prompts/ant-which-letter-makes-the-first-sound-in-an-945a3b.mp3 | ant. Which letter makes the first sound in ant? | 1 |
| /audio/assessment/v3/prompts/ant-which-one-starts-with-the-same-sound-as-172a87.mp3 | ant. Which one starts with the same sound as ant? | 1 |
| /audio/assessment/v3/prompts/astronaut-which-letter-makes-the-first-sound-5102f4.mp3 | astronaut. Which letter makes the first sound in astronaut? | 1 |
| /audio/assessment/v3/prompts/alligator-which-letter-makes-the-first-sound-7db9a2.mp3 | alligator. Which letter makes the first sound in alligator? | 1 |
| /audio/assessment/v3/prompts/apple-which-one-starts-with-the-same-sound-a-2da079.mp3 | apple. Which one starts with the same sound as apple? | 1 |
| /audio/assessment/v3/prompts/boat-which-letter-makes-the-first-sound-in-b-a6ed2d.mp3 | boat. Which letter makes the first sound in boat? | 1 |
| /audio/assessment/v3/prompts/bike-which-letter-makes-the-first-sound-in-b-cfec25.mp3 | bike. Which letter makes the first sound in bike? | 1 |
| /audio/assessment/v3/prompts/boat-which-one-starts-with-the-same-sound-as-36d539.mp3 | boat. Which one starts with the same sound as boat? | 1 |
| /audio/assessment/v3/prompts/banana-which-letter-makes-the-first-sound-in-a525f0.mp3 | banana. Which letter makes the first sound in banana? | 1 |
| /audio/assessment/v3/prompts/butterfly-which-letter-makes-the-first-sound-d9ab69.mp3 | butterfly. Which letter makes the first sound in butterfly? | 1 |
| /audio/assessment/v3/prompts/bread-which-one-starts-with-the-same-sound-a-c10065.mp3 | bread. Which one starts with the same sound as bread? | 1 |
| /audio/assessment/v3/prompts/corn-which-letter-makes-the-first-sound-in-c-137b8f.mp3 | corn. Which letter makes the first sound in corn? | 1 |
| /audio/assessment/v3/prompts/cap-which-letter-makes-the-first-sound-in-ca-1aefe8.mp3 | cap. Which letter makes the first sound in cap? | 1 |
| /audio/assessment/v3/prompts/cake-which-one-starts-with-the-same-sound-as-a677aa.mp3 | cake. Which one starts with the same sound as cake? | 1 |
| /audio/assessment/v3/prompts/caterpillar-which-letter-makes-the-first-sou-10ed0d.mp3 | caterpillar. Which letter makes the first sound in caterpillar? | 1 |
| /audio/assessment/v3/prompts/camera-which-letter-makes-the-first-sound-in-b241c0.mp3 | camera. Which letter makes the first sound in camera? | 1 |
| /audio/assessment/v3/prompts/cap-which-one-starts-with-the-same-sound-as-96248d.mp3 | cap. Which one starts with the same sound as cap? | 1 |
| /audio/assessment/v3/prompts/dog-which-letter-makes-the-first-sound-in-do-5dee86.mp3 | dog. Which letter makes the first sound in dog? | 1 |
| /audio/assessment/v3/prompts/duck-which-letter-makes-the-first-sound-in-d-be7470.mp3 | duck. Which letter makes the first sound in duck? | 1 |
| /audio/assessment/v3/prompts/dog-which-one-starts-with-the-same-sound-as-8ff504.mp3 | dog. Which one starts with the same sound as dog? | 1 |
| /audio/assessment/v3/prompts/dinosaur-which-letter-makes-the-first-sound-e90a27.mp3 | dinosaur. Which letter makes the first sound in dinosaur? | 1 |
| /audio/assessment/v3/prompts/dolphin-which-letter-makes-the-first-sound-i-96d3cc.mp3 | dolphin. Which letter makes the first sound in dolphin? | 1 |
| /audio/assessment/v3/prompts/drum-which-one-starts-with-the-same-sound-as-4d46fe.mp3 | drum. Which one starts with the same sound as drum? | 1 |
| /audio/assessment/v3/prompts/egg-which-letter-makes-the-first-sound-in-eg-470135.mp3 | egg. Which letter makes the first sound in egg? | 1 |
| /audio/assessment/v3/prompts/envelope-which-letter-makes-the-first-sound-1c6845.mp3 | envelope. Which letter makes the first sound in envelope? | 1 |
| /audio/assessment/v3/prompts/egg-which-one-starts-with-the-same-sound-as-6abc5e.mp3 | egg. Which one starts with the same sound as egg? | 1 |
| /audio/assessment/v3/prompts/elephant-which-letter-makes-the-first-sound-72dfc4.mp3 | elephant. Which letter makes the first sound in elephant? | 1 |
| /audio/assessment/v3/prompts/elbow-which-letter-makes-the-first-sound-in-5cbc2e.mp3 | elbow. Which letter makes the first sound in elbow? | 1 |
| /audio/assessment/v3/prompts/envelope-which-one-starts-with-the-same-soun-f8bcc4.mp3 | envelope. Which one starts with the same sound as envelope? | 1 |
| /audio/assessment/v3/prompts/fan-which-letter-makes-the-first-sound-in-fa-e88a87.mp3 | fan. Which letter makes the first sound in fan? | 1 |
| /audio/assessment/v3/prompts/fox-which-letter-makes-the-first-sound-in-fo-63a5aa.mp3 | fox. Which letter makes the first sound in fox? | 1 |
| /audio/assessment/v3/prompts/fish-which-one-starts-with-the-same-sound-as-f6e996.mp3 | fish. Which one starts with the same sound as fish? | 1 |
| /audio/assessment/v3/prompts/feather-which-letter-makes-the-first-sound-i-3cac76.mp3 | feather. Which letter makes the first sound in feather? | 1 |
| /audio/assessment/v3/prompts/flamingo-which-letter-makes-the-first-sound-86222b.mp3 | flamingo. Which letter makes the first sound in flamingo? | 1 |
| /audio/assessment/v3/prompts/fan-which-one-starts-with-the-same-sound-as-2de6c0.mp3 | fan. Which one starts with the same sound as fan? | 1 |
| /audio/assessment/v3/prompts/goat-which-letter-makes-the-first-sound-in-g-b6c7e6.mp3 | goat. Which letter makes the first sound in goat? | 1 |
| /audio/assessment/v3/prompts/gate-which-letter-makes-the-first-sound-in-g-d25712.mp3 | gate. Which letter makes the first sound in gate? | 1 |
| /audio/assessment/v3/prompts/goat-which-one-starts-with-the-same-sound-as-27b787.mp3 | goat. Which one starts with the same sound as goat? | 2 |
| /audio/assessment/v3/prompts/guitar-which-letter-makes-the-first-sound-in-f5820b.mp3 | guitar. Which letter makes the first sound in guitar? | 1 |
| /audio/assessment/v3/prompts/gorilla-which-letter-makes-the-first-sound-i-e7a4bc.mp3 | gorilla. Which letter makes the first sound in gorilla? | 1 |
| /audio/assessment/v3/prompts/gate-which-one-starts-with-the-same-sound-as-8313b1.mp3 | gate. Which one starts with the same sound as gate? | 1 |
| /audio/assessment/v3/prompts/hat-which-letter-makes-the-first-sound-in-ha-7044d5.mp3 | hat. Which letter makes the first sound in hat? | 1 |
| /audio/assessment/v3/prompts/hen-which-letter-makes-the-first-sound-in-he-41f20b.mp3 | hen. Which letter makes the first sound in hen? | 1 |
| /audio/assessment/v3/prompts/hat-which-one-starts-with-the-same-sound-as-88c050.mp3 | hat. Which one starts with the same sound as hat? | 1 |
| /audio/assessment/v3/prompts/helicopter-which-letter-makes-the-first-soun-1295c8.mp3 | helicopter. Which letter makes the first sound in helicopter? | 1 |
| /audio/assessment/v3/prompts/hedgehog-which-letter-makes-the-first-sound-4633cd.mp3 | hedgehog. Which letter makes the first sound in hedgehog? | 1 |
| /audio/assessment/v3/prompts/hen-which-one-starts-with-the-same-sound-as-7a4cdd.mp3 | hen. Which one starts with the same sound as hen? | 1 |
| /audio/assessment/v3/prompts/igloo-which-letter-makes-the-first-sound-in-7f6f6a.mp3 | igloo. Which letter makes the first sound in igloo? | 1 |
| /audio/assessment/v3/prompts/ink-which-letter-makes-the-first-sound-in-in-394cf1.mp3 | ink. Which letter makes the first sound in ink? | 1 |
| /audio/assessment/v3/prompts/ink-which-one-starts-with-the-same-sound-as-b10459.mp3 | ink. Which one starts with the same sound as ink? | 1 |
| /audio/assessment/v3/prompts/insect-which-letter-makes-the-first-sound-in-ea2d53.mp3 | insect. Which letter makes the first sound in insect? | 1 |
| /audio/assessment/v3/prompts/instrument-which-letter-makes-the-first-soun-727d74.mp3 | instrument. Which letter makes the first sound in instrument? | 1 |
| /audio/assessment/v3/prompts/igloo-which-one-starts-with-the-same-sound-a-1e15b2.mp3 | igloo. Which one starts with the same sound as igloo? | 1 |
| /audio/assessment/v3/prompts/jet-which-letter-makes-the-first-sound-in-je-c9ac59.mp3 | jet. Which letter makes the first sound in jet? | 1 |
| /audio/assessment/v3/prompts/jam-which-letter-makes-the-first-sound-in-ja-1d48b2.mp3 | jam. Which letter makes the first sound in jam? | 1 |
| /audio/assessment/v3/prompts/jug-which-one-starts-with-the-same-sound-as-8bdcc7.mp3 | jug. Which one starts with the same sound as jug? | 1 |
| /audio/assessment/v3/prompts/jacket-which-letter-makes-the-first-sound-in-881647.mp3 | jacket. Which letter makes the first sound in jacket? | 1 |
| /audio/assessment/v3/prompts/jellyfish-which-letter-makes-the-first-sound-7e1b8b.mp3 | jellyfish. Which letter makes the first sound in jellyfish? | 1 |
| /audio/assessment/v3/prompts/jet-which-one-starts-with-the-same-sound-as-d5266e.mp3 | jet. Which one starts with the same sound as jet? | 1 |
| /audio/assessment/v3/prompts/kite-which-letter-makes-the-first-sound-in-k-6b6dbe.mp3 | kite. Which letter makes the first sound in kite? | 1 |
| /audio/assessment/v3/prompts/king-which-letter-makes-the-first-sound-in-k-ab575c.mp3 | king. Which letter makes the first sound in king? | 1 |
| /audio/assessment/v3/prompts/kite-which-one-starts-with-the-same-sound-as-764050.mp3 | kite. Which one starts with the same sound as kite? | 1 |
| /audio/assessment/v3/prompts/kangaroo-which-letter-makes-the-first-sound-a2172a.mp3 | kangaroo. Which letter makes the first sound in kangaroo? | 1 |
| /audio/assessment/v3/prompts/kettle-which-letter-makes-the-first-sound-in-ea3715.mp3 | kettle. Which letter makes the first sound in kettle? | 1 |
| /audio/assessment/v3/prompts/king-which-one-starts-with-the-same-sound-as-6bf26f.mp3 | king. Which one starts with the same sound as king? | 1 |
| /audio/assessment/v3/prompts/lamp-which-letter-makes-the-first-sound-in-l-125db8.mp3 | lamp. Which letter makes the first sound in lamp? | 1 |
| /audio/assessment/v3/prompts/leg-which-letter-makes-the-first-sound-in-le-608364.mp3 | leg. Which letter makes the first sound in leg? | 1 |
| /audio/assessment/v3/prompts/lamp-which-one-starts-with-the-same-sound-as-5f4ae5.mp3 | lamp. Which one starts with the same sound as lamp? | 1 |
| /audio/assessment/v3/prompts/lemon-which-letter-makes-the-first-sound-in-945365.mp3 | lemon. Which letter makes the first sound in lemon? | 1 |
| /audio/assessment/v3/prompts/lion-which-letter-makes-the-first-sound-in-l-1c64da.mp3 | lion. Which letter makes the first sound in lion? | 1 |
| /audio/assessment/v3/prompts/lion-which-one-starts-with-the-same-sound-as-f4dcfa.mp3 | lion. Which one starts with the same sound as lion? | 1 |
| /audio/assessment/v3/prompts/map-which-letter-makes-the-first-sound-in-ma-52b355.mp3 | map. Which letter makes the first sound in map? | 1 |
| /audio/assessment/v3/prompts/mug-which-letter-makes-the-first-sound-in-mu-b8b240.mp3 | mug. Which letter makes the first sound in mug? | 1 |
| /audio/assessment/v3/prompts/moon-which-one-starts-with-the-same-sound-as-8ae3eb.mp3 | moon. Which one starts with the same sound as moon? | 1 |
| /audio/assessment/v3/prompts/mountain-which-letter-makes-the-first-sound-9f1603.mp3 | mountain. Which letter makes the first sound in mountain? | 1 |
| /audio/assessment/v3/prompts/microphone-which-letter-makes-the-first-soun-700507.mp3 | microphone. Which letter makes the first sound in microphone? | 1 |
| /audio/assessment/v3/prompts/mug-which-one-starts-with-the-same-sound-as-952b5e.mp3 | mug. Which one starts with the same sound as mug? | 1 |
| /audio/assessment/v3/prompts/net-which-letter-makes-the-first-sound-in-ne-acc751.mp3 | net. Which letter makes the first sound in net? | 1 |
| /audio/assessment/v3/prompts/nose-which-letter-makes-the-first-sound-in-n-a57889.mp3 | nose. Which letter makes the first sound in nose? | 1 |
| /audio/assessment/v3/prompts/net-which-one-starts-with-the-same-sound-as-e18f37.mp3 | net. Which one starts with the same sound as net? | 1 |
| /audio/assessment/v3/prompts/necklace-which-letter-makes-the-first-sound-7eff29.mp3 | necklace. Which letter makes the first sound in necklace? | 1 |
| /audio/assessment/v3/prompts/newspaper-which-letter-makes-the-first-sound-cede32.mp3 | newspaper. Which letter makes the first sound in newspaper? | 1 |
| /audio/assessment/v3/prompts/nut-which-one-starts-with-the-same-sound-as-fa5619.mp3 | nut. Which one starts with the same sound as nut? | 1 |
| /audio/assessment/v3/prompts/ox-which-letter-makes-the-first-sound-in-ox-e12885.mp3 | ox. Which letter makes the first sound in ox? | 1 |
| /audio/assessment/v3/prompts/octopus-which-letter-makes-the-first-sound-i-d12246.mp3 | octopus. Which letter makes the first sound in octopus? | 1 |
| /audio/assessment/v3/prompts/ox-which-one-starts-with-the-same-sound-as-o-5fdbcb.mp3 | ox. Which one starts with the same sound as ox? | 1 |
| /audio/assessment/v3/prompts/otter-which-letter-makes-the-first-sound-in-f49fa4.mp3 | otter. Which letter makes the first sound in otter? | 1 |
| /audio/assessment/v3/prompts/olive-which-letter-makes-the-first-sound-in-27be4d.mp3 | olive. Which letter makes the first sound in olive? | 1 |
| /audio/assessment/v3/prompts/octopus-which-one-starts-with-the-same-sound-395b4a.mp3 | octopus. Which one starts with the same sound as octopus? | 1 |
| /audio/assessment/v3/prompts/pig-which-letter-makes-the-first-sound-in-pi-2b7864.mp3 | pig. Which letter makes the first sound in pig? | 1 |
| /audio/assessment/v3/prompts/pen-which-letter-makes-the-first-sound-in-pe-827fc7.mp3 | pen. Which letter makes the first sound in pen? | 1 |
| /audio/assessment/v3/prompts/pig-which-one-starts-with-the-same-sound-as-cbe4cc.mp3 | pig. Which one starts with the same sound as pig? | 1 |
| /audio/assessment/v3/prompts/penguin-which-letter-makes-the-first-sound-i-d9cfa9.mp3 | penguin. Which letter makes the first sound in penguin? | 1 |
| /audio/assessment/v3/prompts/pumpkin-which-letter-makes-the-first-sound-i-490a37.mp3 | pumpkin. Which letter makes the first sound in pumpkin? | 1 |
| /audio/assessment/v3/prompts/pen-which-one-starts-with-the-same-sound-as-931e71.mp3 | pen. Which one starts with the same sound as pen? | 1 |
| /audio/assessment/v3/prompts/queen-which-letter-makes-the-first-sound-in-ae3f0e.mp3 | queen. Which letter makes the first sound in queen? | 1 |
| /audio/assessment/v3/prompts/quilt-which-letter-makes-the-first-sound-in-ca2405.mp3 | quilt. Which letter makes the first sound in quilt? | 1 |
| /audio/assessment/v3/prompts/queen-which-one-starts-with-the-same-sound-a-cc4cb7.mp3 | queen. Which one starts with the same sound as queen? | 1 |
| /audio/assessment/v3/prompts/question-which-letter-makes-the-first-sound-39cb2b.mp3 | question. Which letter makes the first sound in question? | 1 |
| /audio/assessment/v3/prompts/quarter-which-letter-makes-the-first-sound-i-bc210a.mp3 | quarter. Which letter makes the first sound in quarter? | 1 |
| /audio/assessment/v3/prompts/question-which-one-starts-with-the-same-soun-4eb491.mp3 | question. Which one starts with the same sound as question? | 1 |
| /audio/assessment/v3/prompts/rug-which-letter-makes-the-first-sound-in-ru-5493f7.mp3 | rug. Which letter makes the first sound in rug? | 1 |
| /audio/assessment/v3/prompts/ring-which-letter-makes-the-first-sound-in-r-20e7ab.mp3 | ring. Which letter makes the first sound in ring? | 1 |
| /audio/assessment/v3/prompts/ring-which-one-starts-with-the-same-sound-as-57fbfa.mp3 | ring. Which one starts with the same sound as ring? | 1 |
| /audio/assessment/v3/prompts/rainbow-which-letter-makes-the-first-sound-i-c87dfa.mp3 | rainbow. Which letter makes the first sound in rainbow? | 1 |
| /audio/assessment/v3/prompts/rocket-which-letter-makes-the-first-sound-in-fe0c9b.mp3 | rocket. Which letter makes the first sound in rocket? | 1 |
| /audio/assessment/v3/prompts/rug-which-one-starts-with-the-same-sound-as-a4ae5a.mp3 | rug. Which one starts with the same sound as rug? | 1 |
| /audio/assessment/v3/prompts/sun-which-letter-makes-the-first-sound-in-su-d1e454.mp3 | sun. Which letter makes the first sound in sun? | 1 |
| /audio/assessment/v3/prompts/sock-which-letter-makes-the-first-sound-in-s-4b6d44.mp3 | sock. Which letter makes the first sound in sock? | 1 |
| /audio/assessment/v3/prompts/sun-which-one-starts-with-the-same-sound-as-b533ea.mp3 | sun. Which one starts with the same sound as sun? | 1 |
| /audio/assessment/v3/prompts/sunflower-which-letter-makes-the-first-sound-a20cf6.mp3 | sunflower. Which letter makes the first sound in sunflower? | 1 |
| /audio/assessment/v3/prompts/sandwich-which-letter-makes-the-first-sound-c086d0.mp3 | sandwich. Which letter makes the first sound in sandwich? | 1 |
| /audio/assessment/v3/prompts/sock-which-one-starts-with-the-same-sound-as-121a43.mp3 | sock. Which one starts with the same sound as sock? | 1 |
| /audio/assessment/v3/prompts/tent-which-letter-makes-the-first-sound-in-t-128fb2.mp3 | tent. Which letter makes the first sound in tent? | 1 |
| /audio/assessment/v3/prompts/toe-which-letter-makes-the-first-sound-in-to-8da0cd.mp3 | toe. Which letter makes the first sound in toe? | 1 |
| /audio/assessment/v3/prompts/tent-which-one-starts-with-the-same-sound-as-c33c17.mp3 | tent. Which one starts with the same sound as tent? | 1 |
| /audio/assessment/v3/prompts/tiger-which-letter-makes-the-first-sound-in-625743.mp3 | tiger. Which letter makes the first sound in tiger? | 1 |
| /audio/assessment/v3/prompts/tomato-which-letter-makes-the-first-sound-in-d8909c.mp3 | tomato. Which letter makes the first sound in tomato? | 1 |
| /audio/assessment/v3/prompts/tooth-which-one-starts-with-the-same-sound-a-559ca5.mp3 | tooth. Which one starts with the same sound as tooth? | 1 |
| /audio/assessment/v3/prompts/umbrella-which-letter-makes-the-first-sound-236ede.mp3 | umbrella. Which letter makes the first sound in umbrella? | 1 |
| /audio/assessment/v3/prompts/uncle-which-letter-makes-the-first-sound-in-e107c0.mp3 | uncle. Which letter makes the first sound in uncle? | 1 |
| /audio/assessment/v3/prompts/umbrella-which-one-starts-with-the-same-soun-3c573a.mp3 | umbrella. Which one starts with the same sound as umbrella? | 1 |
| /audio/assessment/v3/prompts/umpire-which-letter-makes-the-first-sound-in-eabe45.mp3 | umpire. Which letter makes the first sound in umpire? | 1 |
| /audio/assessment/v3/prompts/uniform-which-letter-makes-the-first-sound-i-bb95a6.mp3 | uniform. Which letter makes the first sound in uniform? | 1 |
| /audio/assessment/v3/prompts/uncle-which-one-starts-with-the-same-sound-a-4ae12c.mp3 | uncle. Which one starts with the same sound as uncle? | 1 |
| /audio/assessment/v3/prompts/van-which-letter-makes-the-first-sound-in-va-74f669.mp3 | van. Which letter makes the first sound in van? | 1 |
| /audio/assessment/v3/prompts/vet-which-letter-makes-the-first-sound-in-ve-72fd43.mp3 | vet. Which letter makes the first sound in vet? | 1 |
| /audio/assessment/v3/prompts/van-which-one-starts-with-the-same-sound-as-5f89e6.mp3 | van. Which one starts with the same sound as van? | 1 |
| /audio/assessment/v3/prompts/volcano-which-letter-makes-the-first-sound-i-eeda64.mp3 | volcano. Which letter makes the first sound in volcano? | 1 |
| /audio/assessment/v3/prompts/vulture-which-letter-makes-the-first-sound-i-e63dd2.mp3 | vulture. Which letter makes the first sound in vulture? | 1 |
| /audio/assessment/v3/prompts/vet-which-one-starts-with-the-same-sound-as-fa60ca.mp3 | vet. Which one starts with the same sound as vet? | 1 |
| /audio/assessment/v3/prompts/web-which-letter-makes-the-first-sound-in-we-e93d8b.mp3 | web. Which letter makes the first sound in web? | 1 |
| /audio/assessment/v3/prompts/worm-which-letter-makes-the-first-sound-in-w-d8eff3.mp3 | worm. Which letter makes the first sound in worm? | 1 |
| /audio/assessment/v3/prompts/web-which-one-starts-with-the-same-sound-as-ff8b7b.mp3 | web. Which one starts with the same sound as web? | 1 |
| /audio/assessment/v3/prompts/watermelon-which-letter-makes-the-first-soun-60be5e.mp3 | watermelon. Which letter makes the first sound in watermelon? | 1 |
| /audio/assessment/v3/prompts/window-which-letter-makes-the-first-sound-in-472702.mp3 | window. Which letter makes the first sound in window? | 1 |
| /audio/assessment/v3/prompts/wasp-which-one-starts-with-the-same-sound-as-83d6c1.mp3 | wasp. Which one starts with the same sound as wasp? | 1 |
| /audio/assessment/v3/prompts/yak-which-letter-makes-the-first-sound-in-ya-94343b.mp3 | yak. Which letter makes the first sound in yak? | 1 |
| /audio/assessment/v3/prompts/yarn-which-letter-makes-the-first-sound-in-y-e38877.mp3 | yarn. Which letter makes the first sound in yarn? | 1 |
| /audio/assessment/v3/prompts/yak-which-one-starts-with-the-same-sound-as-3e85e8.mp3 | yak. Which one starts with the same sound as yak? | 1 |
| /audio/assessment/v3/prompts/yoghurt-which-letter-makes-the-first-sound-i-29966a.mp3 | yoghurt. Which letter makes the first sound in yoghurt? | 1 |
| /audio/assessment/v3/prompts/yawn-which-letter-makes-the-first-sound-in-y-7f6785.mp3 | yawn. Which letter makes the first sound in yawn? | 1 |
| /audio/assessment/v3/prompts/yarn-which-one-starts-with-the-same-sound-as-3dfec8.mp3 | yarn. Which one starts with the same sound as yarn? | 1 |
| /audio/assessment/v3/prompts/zip-which-letter-makes-the-first-sound-in-zi-847f0c.mp3 | zip. Which letter makes the first sound in zip? | 1 |
| /audio/assessment/v3/prompts/zoo-which-letter-makes-the-first-sound-in-zo-b1e94a.mp3 | zoo. Which letter makes the first sound in zoo? | 1 |
| /audio/assessment/v3/prompts/zip-which-one-starts-with-the-same-sound-as-69e285.mp3 | zip. Which one starts with the same sound as zip? | 1 |
| /audio/assessment/v3/prompts/zebra-which-letter-makes-the-first-sound-in-46ec85.mp3 | zebra. Which letter makes the first sound in zebra? | 1 |
| /audio/assessment/v3/prompts/zigzag-which-letter-makes-the-first-sound-in-4e2008.mp3 | zigzag. Which letter makes the first sound in zigzag? | 1 |
| /audio/assessment/v3/prompts/zoo-which-one-starts-with-the-same-sound-as-9a66e8.mp3 | zoo. Which one starts with the same sound as zoo? | 1 |
| /audio/assessment/v3/prompts/ambulance-which-letter-makes-the-first-sound-635eb0.mp3 | ambulance. Which letter makes the first sound in ambulance? | 1 |
| /audio/assessment/v3/prompts/engine-which-letter-makes-the-first-sound-in-5a062a.mp3 | engine. Which letter makes the first sound in engine? | 1 |
| /audio/assessment/v3/prompts/mat-which-letter-makes-the-first-sound-in-ma-c268c5.mp3 | mat. Which letter makes the first sound in mat? | 1 |
| /audio/assessment/v3/prompts/sandcastle-which-letter-makes-the-first-soun-b61bea.mp3 | sandcastle. Which letter makes the first sound in sandcastle? | 1 |
| /audio/assessment/v3/prompts/table-which-letter-makes-the-first-sound-in-7896cc.mp3 | table. Which letter makes the first sound in table? | 1 |
| /audio/assessment/v3/prompts/bike-which-one-starts-with-the-same-sound-as-a8c1fb.mp3 | bike. Which one starts with the same sound as bike? | 1 |
| /audio/assessment/v3/prompts/nose-which-one-starts-with-the-same-sound-as-69881d.mp3 | nose. Which one starts with the same sound as nose? | 1 |
| /audio/assessment/v3/prompts/rose-which-one-starts-with-the-same-sound-as-2a3d28.mp3 | rose. Which one starts with the same sound as rose? | 1 |
| /audio/assessment/v3/prompts/wheel-which-one-starts-with-the-same-sound-a-affc8b.mp3 | wheel. Which one starts with the same sound as wheel? | 1 |
| /audio/production/en-US/assessment_prompt/what-kind-of-book-did-owen-choose-9d814f1125.mp3 | What kind of book did Owen choose? | 1 |
| /audio/production/en-US/assessment_prompt/what-did-leo-paint-with-the-thinner-brush-574aed6fc3.mp3 | What did Leo paint with the thinner brush? | 1 |
| /audio/production/en-US/assessment_prompt/why-did-jonah-leave-one-shell-on-the-sand-cbb6baac8c.mp3 | Why did Jonah leave one shell on the sand? | 1 |
| /audio/production/en-US/assessment_prompt/what-happened-to-arlo-s-first-bag-ae07318d54.mp3 | What happened to Arlo's first bag? | 1 |
| /audio/production/en-US/assessment_prompt/why-did-nina-stop-riding-68f55a5cc1.mp3 | Why did Nina stop riding? | 1 |
| /audio/production/en-US/assessment_prompt/what-did-the-squirrel-hold-38caad5b81.mp3 | What did the squirrel hold? | 1 |
| /audio/production/en-US/assessment_prompt/which-day-did-nora-circle-a2b1df449d.mp3 | Which day did Nora circle? | 1 |
| /audio/production/en-US/assessment_prompt/why-did-lucas-lift-out-the-eggs-first-153e3c1fe8.mp3 | Why did Lucas lift out the eggs first? | 1 |
| /audio/production/en-US/assessment_prompt/where-did-maya-place-the-pot-e90d668b2c.mp3 | Where did Maya place the pot? | 1 |
| /audio/production/en-US/assessment_prompt/where-did-miss-green-move-the-class-ca0d1b5043.mp3 | Where did Miss Green move the class? | 1 |
| /audio/production/en-US/assessment_prompt/where-did-finn-put-the-large-books-cb34475711.mp3 | Where did Finn put the large books? | 1 |
| /audio/production/en-US/assessment_prompt/where-was-the-dinosaur-room-on-the-map-e2feb3884e.mp3 | Where was the dinosaur room on the map? | 1 |
| /audio/production/en-US/assessment_prompt/where-did-hana-put-the-card-games-4f46b06588.mp3 | Where did Hana put the card games? | 1 |
| /audio/production/en-US/assessment_prompt/where-did-toby-pack-the-towel-7d09d7ce3f.mp3 | Where did Toby pack the towel? | 1 |
| /audio/production/en-US/assessment_prompt/where-did-ms-lopez-put-the-coin-55c6f8a36a.mp3 | Where did Ms. Lopez put the coin? | 1 |
| /audio/production/en-US/assessment_prompt/where-was-the-glove-first-found-4428d5884a.mp3 | Where was the glove first found? | 1 |
| /audio/production/en-US/assessment_prompt/who-did-ava-give-the-ball-to-066c85a124.mp3 | Who did Ava give the ball to? | 1 |
| /audio/production/en-US/assessment_prompt/who-held-the-bag-open-0b3cbe78a8.mp3 | Who held the bag open? | 1 |
| /audio/production/en-US/assessment_prompt/who-lent-grace-a-red-pencil-0927427dda.mp3 | Who lent Grace a red pencil? | 1 |
| /audio/production/en-US/assessment_prompt/who-caught-the-beach-ball-b04242ad0e.mp3 | Who caught the beach ball? | 1 |
| /audio/production/en-US/assessment_prompt/who-was-standing-beside-zoe-in-the-photo-5948b6a304.mp3 | Who was standing beside Zoe in the photo? | 1 |
| /audio/production/en-US/assessment_prompt/how-many-more-cups-did-mara-add-569f941985.mp3 | How many more cups did Mara add? | 1 |
| /audio/production/en-US/assessment_prompt/how-many-high-notes-did-mr-hill-play-7d6374f292.mp3 | How many high notes did Mr. Hill play? | 1 |
| /audio/production/en-US/assessment_prompt/how-many-cushions-did-max-carry-2a30926e9d.mp3 | How many cushions did Max carry? | 1 |
| /audio/production/en-US/assessment_prompt/when-did-mr-reed-change-the-battery-8f5caa5296.mp3 | When did Mr. Reed change the battery? | 1 |
| /audio/production/en-US/assessment_prompt/which-rolls-did-talia-put-near-the-front-counter-d90d6f9ab8.mp3 | Which rolls did Talia put near the front counter? | 1 |
| /audio/production/en-US/assessment_prompt/which-plants-did-the-students-water-first-eae366c290.mp3 | Which plants did the students water first? | 1 |
| /audio/production/en-US/assessment_prompt/whose-name-was-on-the-bookmark-314c0c5ff2.mp3 | Whose name was on the bookmark? | 1 |
| /audio/production/en-US/assessment_prompt/which-part-of-the-song-was-difficult-for-sofia-abf1599dbb.mp3 | Which part of the song was difficult for Sofia? | 1 |
| /audio/production/en-US/assessment_prompt/which-picture-did-the-teacher-choose-e307088acd.mp3 | Which picture did the teacher choose? | 1 |
| /audio/production/en-US/assessment_prompt/which-soil-felt-softer-8cf4c29146.mp3 | Which soil felt softer? | 1 |
| /audio/production/en-US/assessment_prompt/which-snacks-went-in-the-fridge-4f886777de.mp3 | Which snacks went in the fridge? | 1 |
| /audio/production/en-US/assessment_prompt/what-did-priya-draw-on-the-poster-24c3d54a2f.mp3 | What did Priya draw on the poster? | 1 |
| /audio/production/en-US/assessment_prompt/what-surprised-sienna-about-the-jacket-dd0047aad1.mp3 | What surprised Sienna about the jacket? | 1 |
| /audio/production/en-US/assessment_prompt/what-did-jalen-use-to-wipe-the-table-71d3d28974.mp3 | What did Jalen use to wipe the table? | 1 |
| /audio/production/en-US/assessment_prompt/where-did-nora-put-her-sticker-78c8f2b568.mp3 | Where did Nora put her sticker? | 1 |
| /audio/production/en-US/assessment_prompt/where-was-amara-s-flute-case-851baf6386.mp3 | Where was Amara's flute case? | 1 |
| /audio/production/en-US/assessment_prompt/where-did-marcus-fill-his-jar-ccc4559696.mp3 | Where did Marcus fill his jar? | 1 |
| /audio/production/en-US/assessment_prompt/what-did-noah-and-his-uncle-notice-on-the-bridge-a1f6eb1e7c.mp3 | What did Noah and his uncle notice on the bridge? | 1 |
| /audio/production/en-US/assessment_prompt/what-did-the-firefighter-clip-to-her-jacket-f21c02bb7d.mp3 | What did the firefighter clip to her jacket? | 1 |
| /audio/production/en-US/assessment_prompt/how-many-butterflies-did-chloe-s-partner-count-fb3865e82e.mp3 | How many butterflies did Chloe's partner count? | 1 |
| /audio/production/en-US/assessment_prompt/what-time-did-the-screen-say-the-train-would-arrive-8398297dda.mp3 | What time did the screen say the train would arrive? | 1 |
| /audio/production/en-US/assessment_prompt/what-did-mateo-put-in-the-recycling-bag-a59d7b9e80.mp3 | What did Mateo put in the recycling bag? | 1 |
| /audio/assessment/v3/prompts/who-took-the-guinea-pig-home-65d5c3.mp3 | Who took the guinea pig home? | 1 |
| /audio/assessment/v3/prompts/who-lent-the-whistle-981316.mp3 | Who lent the whistle? | 1 |
| /audio/assessment/v3/prompts/who-mopped-the-puddle-7cc7df.mp3 | Who mopped the puddle? | 1 |
| /audio/assessment/v3/prompts/how-many-eggs-were-on-the-list-7ef16a.mp3 | How many eggs were on the list? | 1 |
| /audio/assessment/v3/prompts/how-many-butterflies-did-the-class-count-54adc3.mp3 | How many butterflies did the class count? | 1 |
| /audio/assessment/v3/prompts/when-did-the-bake-sale-open-59acf3.mp3 | When did the bake sale open? | 1 |
| /audio/assessment/v3/prompts/how-many-blue-blocks-were-in-the-tower-309a8e.mp3 | How many blue blocks were in the tower? | 1 |
| /audio/assessment/v3/prompts/how-did-cal-know-which-lunchbox-was-his-d384c1.mp3 | How did Cal know which lunchbox was his? | 1 |
| /audio/assessment/v3/prompts/how-long-did-the-seeds-last-575b2f.mp3 | How long did the seeds last? | 1 |
| /audio/assessment/v3/prompts/which-treasure-was-still-there-on-saturday-a7c7df.mp3 | Which treasure was still there on Saturday? | 1 |
| /audio/assessment/v3/prompts/whose-tree-gives-the-most-fruit-864ea1.mp3 | Whose tree gives the most fruit? | 1 |
| /audio/assessment/v3/prompts/where-did-the-sword-come-from-b5e985.mp3 | Where did the sword come from? | 1 |
| /audio/assessment/v3/prompts/what-is-keya-allowed-to-do-now-61fee5.mp3 | What is Keya allowed to do now? | 1 |
| /audio/assessment/v3/prompts/how-much-did-each-twin-pocket-this-week-f8928a.mp3 | How much did each twin pocket this week? | 1 |
| /audio/assessment/v3/prompts/why-did-priya-skip-the-watering-1d4566.mp3 | Why did Priya skip the watering? | 1 |
| /audio/assessment/v3/prompts/which-bench-has-a-seed-dish-and-why-bcf07e.mp3 | Which bench has a seed dish, and why? | 1 |
| /audio/assessment/v3/prompts/which-of-these-is-not-in-the-story-b9ad08.mp3 | Which of these is NOT in the story? | 2 |
| /audio/assessment/v3/prompts/which-of-these-does-the-story-not-mention-5def24.mp3 | Which of these does the story NOT mention? | 1 |
| /audio/assessment/v3/prompts/which-item-is-not-in-amir-s-bag-94b16f.mp3 | Which item is NOT in Amir's bag? | 1 |
| /audio/assessment/v3/prompts/which-of-these-is-not-described-in-the-shed-6e659f.mp3 | Which of these is NOT described in the shed? | 1 |
| /audio/assessment/v3/prompts/which-of-these-did-not-happen-at-the-fair-71af09.mp3 | Which of these did NOT happen at the fair? | 1 |
| /audio/assessment/v3/prompts/which-of-these-is-not-part-of-the-story-8c5db0.mp3 | Which of these is NOT part of the story? | 1 |
| /audio/assessment/v3/prompts/which-rule-is-not-on-the-door-67e8d0.mp3 | Which rule is NOT on the door? | 1 |
| /audio/assessment/v3/prompts/who-watered-the-plants-b87ade.mp3 | Who watered the plants? | 1 |
| /audio/assessment/v3/prompts/how-long-does-the-ferry-take-dae789.mp3 | How long does the ferry take? | 1 |
| /audio/assessment/v3/prompts/which-of-these-was-not-on-the-table-c40a4b.mp3 | Which of these was NOT on the table? | 1 |
| /audio/assessment/v3/prompts/why-did-omar-run-last-fd09ac.mp3 | Why did Omar run last? | 1 |
| /audio/assessment/v3/prompts/cake-which-pattern-finishes-the-word-cake-50dee5.mp3 | cake. Which pattern finishes the word cake? | 1 |
| /audio/assessment/v3/prompts/gate-which-pattern-finishes-the-word-gate-6872f7.mp3 | gate. Which pattern finishes the word gate? | 1 |
| /audio/assessment/v3/prompts/snake-which-pattern-finishes-the-word-snake-b63645.mp3 | snake. Which pattern finishes the word snake? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-cap-what-word-do-you-mak-faf7b3.mp3 | Add e to the end of cap. What word do you make? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-tap-what-word-do-you-mak-46023e.mp3 | Add e to the end of tap. What word do you make? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-man-what-word-do-you-mak-6581f5.mp3 | Add e to the end of man. What word do you make? | 1 |
| /audio/assessment/v3/prompts/kite-which-pattern-finishes-the-word-kite-e13082.mp3 | kite. Which pattern finishes the word kite? | 1 |
| /audio/assessment/v3/prompts/five-which-pattern-finishes-the-word-five-3cc71c.mp3 | five. Which pattern finishes the word five? | 1 |
| /audio/assessment/v3/prompts/smile-which-pattern-finishes-the-word-smile-3bea92.mp3 | smile. Which pattern finishes the word smile? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-kit-what-word-do-you-mak-c03752.mp3 | Add e to the end of kit. What word do you make? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-pin-what-word-do-you-mak-1902d4.mp3 | Add e to the end of pin. What word do you make? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-rid-what-word-do-you-mak-8701c4.mp3 | Add e to the end of rid. What word do you make? | 1 |
| /audio/assessment/v3/prompts/bone-which-pattern-finishes-the-word-bone-77d354.mp3 | bone. Which pattern finishes the word bone? | 1 |
| /audio/assessment/v3/prompts/rope-which-pattern-finishes-the-word-rope-c0fce2.mp3 | rope. Which pattern finishes the word rope? | 1 |
| /audio/assessment/v3/prompts/rose-which-pattern-finishes-the-word-rose-faa58e.mp3 | rose. Which pattern finishes the word rose? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-hop-what-word-do-you-mak-f03af3.mp3 | Add e to the end of hop. What word do you make? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-not-what-word-do-you-mak-1572ca.mp3 | Add e to the end of not. What word do you make? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-rob-what-word-do-you-mak-49a151.mp3 | Add e to the end of rob. What word do you make? | 1 |
| /audio/assessment/v3/prompts/cube-which-pattern-finishes-the-word-cube-30d87f.mp3 | cube. Which pattern finishes the word cube? | 1 |
| /audio/assessment/v3/prompts/mule-which-pattern-finishes-the-word-mule-86be6e.mp3 | mule. Which pattern finishes the word mule? | 1 |
| /audio/assessment/v3/prompts/tube-which-pattern-finishes-the-word-tube-15bd2d.mp3 | tube. Which pattern finishes the word tube? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-cub-what-word-do-you-mak-405927.mp3 | Add e to the end of cub. What word do you make? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-cut-what-word-do-you-mak-5a0efd.mp3 | Add e to the end of cut. What word do you make? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-tub-what-word-do-you-mak-8b63b2.mp3 | Add e to the end of tub. What word do you make? | 1 |
| /audio/assessment/v3/prompts/theme-which-pattern-finishes-the-word-theme-43ada9.mp3 | theme. Which pattern finishes the word theme? | 1 |
| /audio/assessment/v3/prompts/scene-which-pattern-finishes-the-word-scene-f274eb.mp3 | scene. Which pattern finishes the word scene? | 1 |
| /audio/assessment/v3/prompts/these-which-pattern-finishes-the-word-these-2126c1.mp3 | these. Which pattern finishes the word these? | 1 |
| /audio/assessment/v3/prompts/complete-which-pattern-finishes-the-word-com-d12250.mp3 | complete. Which pattern finishes the word complete? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-long-a-sound-the-a-that-s-7a94c1.mp3 | Which word has the long a sound, the a that says its own name? | 3 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-tape-what-word-i-828004.mp3 | Take the silent e away from tape. What word is left? | 1 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-made-what-word-i-7a0a44.mp3 | Take the silent e away from made. What word is left? | 1 |
| /audio/assessment/v3/prompts/plane-which-pattern-finishes-the-word-plane-8277b7.mp3 | plane. Which pattern finishes the word plane? | 1 |
| /audio/assessment/v3/prompts/grape-which-pattern-finishes-the-word-grape-e683e2.mp3 | grape. Which pattern finishes the word grape? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-long-i-sound-the-i-that-s-e392be.mp3 | Which word has the long i sound, the i that says its own name? | 3 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-bite-what-word-i-273c90.mp3 | Take the silent e away from bite. What word is left? | 1 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-ripe-what-word-i-265a0c.mp3 | Take the silent e away from ripe. What word is left? | 1 |
| /audio/assessment/v3/prompts/prize-which-pattern-finishes-the-word-prize-f40a34.mp3 | prize. Which pattern finishes the word prize? | 1 |
| /audio/assessment/v3/prompts/slide-which-pattern-finishes-the-word-slide-64990d.mp3 | slide. Which pattern finishes the word slide? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-long-o-sound-the-o-that-s-b2513c.mp3 | Which word has the long o sound, the o that says its own name? | 3 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-hope-what-word-i-c27d20.mp3 | Take the silent e away from hope. What word is left? | 1 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-robe-what-word-i-922fb0.mp3 | Take the silent e away from robe. What word is left? | 1 |
| /audio/assessment/v3/prompts/cone-which-pattern-finishes-the-word-cone-f6cfbd.mp3 | Cone. Which pattern finishes the word cone? | 1 |
| /audio/assessment/v3/prompts/note-which-pattern-finishes-the-word-note-52f80e.mp3 | note. Which pattern finishes the word note? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-long-u-sound-the-u-that-s-810fb9.mp3 | Which word has the long u sound, the u that says its own name? | 3 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-cube-what-word-i-23c371.mp3 | Take the silent e away from cube. What word is left? | 1 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-cute-what-word-i-33e0b0.mp3 | Take the silent e away from cute. What word is left? | 1 |
| /audio/assessment/v3/prompts/flute-which-pattern-finishes-the-word-flute-28b567.mp3 | flute. Which pattern finishes the word flute? | 1 |
| /audio/assessment/v3/prompts/huge-which-pattern-finishes-the-word-huge-5bcb77.mp3 | huge. Which pattern finishes the word huge? | 1 |
| /audio/assessment/v3/prompts/lake-which-pattern-finishes-the-word-lake-246704.mp3 | lake. Which pattern finishes the word lake? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-pan-what-word-do-you-mak-9fed3b.mp3 | Add e to the end of pan. What word do you make? | 1 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-cane-what-word-i-dfa68a.mp3 | Take the silent e away from cane. What word is left? | 1 |
| /audio/assessment/v3/prompts/bike-which-pattern-finishes-the-word-bike-60ae5f.mp3 | bike. Which pattern finishes the word bike? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-fin-what-word-do-you-mak-5647eb.mp3 | Add e to the end of fin. What word do you make? | 1 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-hide-what-word-i-b127e8.mp3 | Take the silent e away from hide. What word is left? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-rod-what-word-do-you-mak-a1d1f7.mp3 | Add e to the end of rod. What word do you make? | 1 |
| /audio/assessment/v3/prompts/home-which-pattern-finishes-the-word-home-f1a085.mp3 | home. Which pattern finishes the word home? | 1 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-rode-what-word-i-778845.mp3 | Take the silent e away from rode. What word is left? | 1 |
| /audio/assessment/v3/prompts/add-e-to-the-end-of-hug-what-word-do-you-mak-fe303a.mp3 | Add e to the end of hug. What word do you make? | 1 |
| /audio/assessment/v3/prompts/cute-which-pattern-finishes-the-word-cute-8acc86.mp3 | cute. Which pattern finishes the word cute? | 1 |
| /audio/assessment/v3/prompts/take-the-silent-e-away-from-tube-what-word-i-e14456.mp3 | Take the silent e away from tube. What word is left? | 1 |
| /audio/assessment/v3/prompts/what-is-this-story-mostly-about-f1acdd.mp3 | What is this story mostly about? | 11 |
| /audio/assessment/v3/prompts/what-is-this-passage-mostly-about-63fced.mp3 | What is this passage mostly about? | 21 |
| /audio/assessment/v3/prompts/which-title-fits-this-passage-best-6c9317.mp3 | Which title fits this passage best? | 11 |
| /audio/assessment/v3/prompts/all-of-these-are-true-which-one-is-the-main-992e03.mp3 | All of these are true. Which one is the MAIN idea? | 10 |
| /audio/assessment/v3/prompts/which-sentence-sums-up-the-whole-passage-bes-689092.mp3 | Which sentence sums up the whole passage best? | 11 |
| /audio/assessment/v3/prompts/which-one-shows-a-person-f855dd.mp3 | Which one shows a person? | 4 |
| /audio/assessment/v3/prompts/which-word-names-a-person-2dd1a2.mp3 | Which word names a person? | 4 |
| /audio/assessment/v3/prompts/which-one-shows-an-animal-6e75a9.mp3 | Which one shows an animal? | 4 |
| /audio/production/en-US/assessment_prompt/which-word-names-an-animal-c868b5ef31.mp3 | Which word names an animal? | 4 |
| /audio/assessment/v3/prompts/which-one-shows-a-place-a32258.mp3 | Which one shows a place? | 3 |
| /audio/assessment/v3/prompts/which-word-names-a-place-cb8af1.mp3 | Which word names a place? | 4 |
| /audio/assessment/v3/prompts/which-one-shows-a-thing-you-can-hold-deebd5.mp3 | Which one shows a thing you can hold? | 3 |
| /audio/assessment/v3/prompts/which-word-names-a-thing-d49bc4.mp3 | Which word names a thing? | 4 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-the-2b2fe7.mp3 | Which naming word finishes the sentence? The … sailed into the bay. | 1 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-a-bu-c4f81f.mp3 | Which naming word finishes the sentence? A … buzzed by my ear. | 1 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-the-45978d.mp3 | Which naming word finishes the sentence? The … dripped on the rug. | 1 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-our-b300c6.mp3 | Which naming word finishes the sentence? Our … creaks in the wind. | 1 |
| /audio/assessment/v3/prompts/which-word-in-this-sentence-is-a-naming-word-d18b17.mp3 | Which word in this sentence is a naming word? "The kite dipped and spun." | 1 |
| /audio/assessment/v3/prompts/which-word-in-this-sentence-is-a-naming-word-56ab45.mp3 | Which word in this sentence is a naming word? "My boots got soaked." | 1 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-the-d00396.mp3 | Which naming word finishes the sentence? The … hooted all night long. | 1 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-a-ro-e868be.mp3 | Which naming word finishes the sentence? A … rolled off the shelf. | 1 |
| /audio/assessment/v3/prompts/which-word-names-a-thing-not-a-doing-word-991ad3.mp3 | Which word names a thing, not a doing word? | 6 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-the-7d3922.mp3 | Which naming word finishes the sentence? The … sang to the crowd. | 1 |
| /audio/assessment/v3/prompts/which-word-is-a-doing-word-not-a-naming-word-21f661.mp3 | Which word is a doing word, not a naming word? | 9 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-our-e5d9d9.mp3 | Which naming word finishes the sentence? Our … reads to us after lunch. | 1 |
| /audio/assessment/v3/prompts/which-sentence-names-two-things-f5e3bb.mp3 | Which sentence names TWO things? | 8 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-the-e03eeb.mp3 | Which naming word finishes the sentence? The cat and the … hid in the barn. | 1 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-a-fo-2d613a.mp3 | Which naming word finishes the sentence? A fork and a … sat by the plate. | 1 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-the-18db5d.mp3 | Which naming word finishes the sentence? The … chimed at noon. | 1 |
| /audio/assessment/v3/prompts/which-naming-word-finishes-the-sentence-a-ne-5b4294.mp3 | Which naming word finishes the sentence? A … nested in our chimney. | 1 |
| /audio/assessment/v3/prompts/which-word-tells-what-you-see-137a7f.mp3 | Which word tells what you see? | 3 |
| /audio/assessment/v3/prompts/pick-the-word-that-fits-the-picture-35acc5.mp3 | Pick the word that fits the picture. | 1 |
| /audio/assessment/v3/prompts/what-does-the-picture-show-77b318.mp3 | What does the picture show? | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-picture-5eb2fd.mp3 | Which word fits the picture? | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-two-sat-on-dc71b0.mp3 | Which word finishes the sentence? Two … sat on the wall. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-three-w-d00bca.mp3 | Which word finishes the sentence? The three … wag their tails. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-both-lay-op-f21670.mp3 | Which word finishes the sentence? Both … lay open on the desk. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-six-shine-o-65e1c5.mp3 | Which word finishes the sentence? Six … shine over the barn. | 1 |
| /audio/assessment/v3/prompts/just-one-which-word-fits-4c7f77.mp3 | Just one! Which word fits? | 1 |
| /audio/assessment/v3/prompts/more-than-one-which-word-fits-fe10e2.mp3 | More than one! Which word fits? | 1 |
| /audio/assessment/v3/prompts/more-than-one-pick-the-word-e3dfaa.mp3 | More than one! Pick the word. | 1 |
| /audio/assessment/v3/prompts/just-one-pick-the-word-9cb144.mp3 | Just one! Pick the word. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-i-see-one-b-1f90a9.mp3 | Which word finishes the sentence? I see one … by the door. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-many-twinkl-ddd99d.mp3 | Which word finishes the sentence? Many … twinkle at night. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-one-floats-b65429.mp3 | Which word finishes the sentence? One … floats on the pond. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-lots-of-hop-c75b03.mp3 | Which word finishes the sentence? Lots of … hop in the grass. | 1 |
| /audio/assessment/v3/prompts/pick-the-word-for-the-picture-865f5c.mp3 | Pick the word for the picture. | 2 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-packed-s-47a590.mp3 | Which word finishes the sentence? We packed six … for the trip. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-dried-b-73d8ba.mp3 | Which word finishes the sentence? The … dried by the sink. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-three-chugg-823669.mp3 | Which word finishes the sentence? Three … chugged up the hill. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-scrubbe-406a18.mp3 | Which word finishes the sentence? The … scrubbed the mud off our boots. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-two-red-hid-28c6da.mp3 | Which word finishes the sentence? Two red … hid in the den. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-giggled-d3fb50.mp3 | Which word finishes the sentence? The … giggled in their cots. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-three-plann-3db8eb.mp3 | Which word finishes the sentence? Three … planned the fair. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-we-hung-lig-4c8800.mp3 | Which word finishes the sentence? We hung lights for both …. | 1 |
| /audio/assessment/v3/prompts/one-word-is-written-wrong-spot-it-the-babys-483cfc.mp3 | One word is written wrong. Spot it: The babys slept in their cots. | 1 |
| /audio/assessment/v3/prompts/one-word-is-written-wrong-spot-it-two-citys-47ebea.mp3 | One word is written wrong. Spot it: Two citys glow at night. | 1 |
| /audio/assessment/v3/prompts/which-is-the-plural-of-pony-c28f83.mp3 | Which is the plural of pony? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-marched-9da9d7.mp3 | Which word finishes the sentence? The … marched in the band. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-both-six-ye-b92032.mp3 | Which word finishes the sentence? Both six-year-old … lost a milk tooth today. | 1 |
| /audio/assessment/v3/prompts/one-word-is-written-wrong-spot-it-the-mouses-12a59d.mp3 | One word is written wrong. Spot it: The mouses hid in the kitchen. | 1 |
| /audio/assessment/v3/prompts/one-word-is-written-wrong-spot-it-both-foots-3775fc.mp3 | One word is written wrong. Spot it: Both foots splashed in the puddle. | 1 |
| /audio/assessment/v3/prompts/which-is-the-plural-of-child-f5ab53.mp3 | Which is the plural of child? | 1 |
| /audio/assessment/v3/prompts/which-is-the-plural-of-foot-c1da92.mp3 | Which is the plural of foot? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-autumn-blew-3a1a8c.mp3 | Which word finishes the sentence? Autumn … blew across the path. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-howled-ccee17.mp3 | Which word finishes the sentence? The … howled on the hill. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-chef-la-d9e077.mp3 | Which word finishes the sentence? The chef laid five … by the plates. | 1 |
| /audio/assessment/v3/prompts/one-word-is-written-wrong-spot-it-the-leafs-4d43c6.mp3 | One word is written wrong. Spot it: The leafs drifted onto the doorstep. | 1 |
| /audio/assessment/v3/prompts/one-word-is-written-wrong-spot-it-wolfs-howl-a7060f.mp3 | One word is written wrong. Spot it: Wolfs howled outside the window. | 1 |
| /audio/assessment/v3/prompts/which-is-the-plural-of-leaf-c2416c.mp3 | Which is the plural of leaf? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-all-the-wer-a8ad76.mp3 | Which word finishes the sentence? All the … were fast asleep. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-one-was-lef-1107a0.mp3 | Which word finishes the sentence? One … was left on the plate. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-two-of-brea-a827e6.mp3 | Which word finishes the sentence? Two … of bread sat in the basket. | 1 |
| /audio/assessment/v3/prompts/one-word-is-written-wrong-spot-it-three-shee-bff1c9.mp3 | One word is written wrong. Spot it: Three sheeps grazed in the meadow. | 1 |
| /audio/assessment/v3/prompts/which-fits-the-are-ripe-4f4afa.mp3 | Which fits: The … are ripe? | 1 |
| /audio/assessment/v3/prompts/which-fits-one-is-barking-635882.mp3 | Which fits: One … is barking? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-ten-bark-at-20ed65.mp3 | Which word finishes the sentence? Ten … bark at the gate. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-four-played-9b1142.mp3 | Which word finishes the sentence? Four … played near the barn. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-just-one-pu-2ac42f.mp3 | Which word finishes the sentence? Just one … purred by the fire. | 1 |
| /audio/assessment/v3/prompts/more-than-one-which-word-ca36fa.mp3 | More than one! Which word? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-both-told-l-4af334.mp3 | Which word finishes the sentence? Both … told long stories. | 1 |
| /audio/assessment/v3/prompts/one-word-is-written-wrong-spot-it-the-ponys-b4149a.mp3 | One word is written wrong. Spot it: The ponys trotted around the field. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-two-white-n-e6ad26.mp3 | Which word finishes the sentence? Two white … nibbled the cheese. | 1 |
| /audio/assessment/v3/prompts/which-is-the-plural-of-tooth-1dd51e.mp3 | Which is the plural of tooth? | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-the-baker-s-e68f49.mp3 | Which word finishes the sentence? The baker sliced two … for lunch. | 1 |
| /audio/assessment/v3/prompts/which-word-finishes-the-sentence-all-four-ch-a780ea.mp3 | Which word finishes the sentence? All four … chirped at dawn. | 1 |
| /audio/assessment/v3/prompts/which-word-means-not-happy-6c2fa0.mp3 | Which word means not happy? | 1 |
| /audio/assessment/v3/prompts/which-word-means-not-fair-dc5941.mp3 | Which word means not fair? | 1 |
| /audio/assessment/v3/prompts/which-word-means-not-kind-dcb832.mp3 | Which word means not kind? | 1 |
| /audio/assessment/v3/prompts/mia-feels-sad-which-word-also-means-not-happ-c31fe4.mp3 | Mia feels sad. Which word also means not happy? | 1 |
| /audio/assessment/v3/prompts/the-game-is-not-fair-which-word-means-not-fa-c2d5a8.mp3 | The game is not fair. Which word means not fair? | 1 |
| /audio/assessment/v3/prompts/the-words-were-not-kind-which-word-means-not-9829cf.mp3 | The words were not kind. Which word means not kind? | 1 |
| /audio/assessment/v3/prompts/which-word-means-play-again-c7578f.mp3 | Which word means play again? | 1 |
| /audio/assessment/v3/prompts/which-word-means-make-again-2284fb.mp3 | Which word means make again? | 1 |
| /audio/assessment/v3/prompts/which-word-means-read-again-54608b.mp3 | Which word means read again? | 1 |
| /audio/assessment/v3/prompts/the-picture-went-wrong-i-will-make-it-again-8c51e5.mp3 | The picture went wrong. I will make it again. Which word fits? | 1 |
| /audio/assessment/v3/prompts/i-missed-the-page-i-will-read-it-again-which-3f7026.mp3 | I missed the page. I will read it again. Which word fits? | 1 |
| /audio/assessment/v3/prompts/we-loved-the-song-we-will-play-it-again-whic-f398b7.mp3 | We loved the song. We will play it again. Which word fits? | 1 |
| /audio/assessment/v3/prompts/which-word-means-ready-to-help-235ced.mp3 | Which word means ready to help? | 1 |
| /audio/assessment/v3/prompts/which-word-means-full-of-joy-e9ef3d.mp3 | Which word means full of joy? | 1 |
| /audio/assessment/v3/prompts/which-word-means-using-care-bcffbf.mp3 | Which word means using care? | 1 |
| /audio/assessment/v3/prompts/ava-helps-her-friend-which-word-describes-av-419c52.mp3 | Ava helps her friend. Which word describes Ava? | 1 |
| /audio/assessment/v3/prompts/noah-smiles-with-joy-which-word-describes-no-8a1434.mp3 | Noah smiles with joy. Which word describes Noah? | 1 |
| /audio/assessment/v3/prompts/kim-carries-the-glass-slowly-which-word-desc-b98e05.mp3 | Kim carries the glass slowly. Which word describes Kim? | 1 |
| /audio/assessment/v3/prompts/which-word-means-without-hope-edf66d.mp3 | Which word means without hope? | 1 |
| /audio/assessment/v3/prompts/which-word-means-without-fear-edcc82.mp3 | Which word means without fear? | 1 |
| /audio/assessment/v3/prompts/which-word-means-without-harm-edeec9.mp3 | Which word means without harm? | 1 |
| /audio/assessment/v3/prompts/the-tiny-butterfly-cannot-hurt-you-which-wor-eaa52d.mp3 | The tiny butterfly cannot hurt you. Which word describes it? | 1 |
| /audio/assessment/v3/prompts/leo-is-not-afraid-to-try-which-word-describe-e9afdc.mp3 | Leo is not afraid to try. Which word describes Leo? | 1 |
| /audio/assessment/v3/prompts/the-team-thinks-it-cannot-win-which-word-des-1d8d4d.mp3 | The team thinks it cannot win. Which word describes the team? | 1 |
| /audio/assessment/v3/prompts/a-person-who-sings-is-a-5cc502.mp3 | A person who sings is a… | 1 |
| /audio/assessment/v3/prompts/a-person-who-teaches-is-a-48fda2.mp3 | A person who teaches is a… | 1 |
| /audio/assessment/v3/prompts/a-person-who-helps-is-a-f6f68e.mp3 | A person who helps is a… | 1 |
| /audio/assessment/v3/prompts/who-reads-books-to-the-class-d60ef0.mp3 | Who reads books to the class? | 1 |
| /audio/assessment/v3/prompts/who-paints-a-picture-2fff3f.mp3 | Who paints a picture? | 1 |
| /audio/assessment/v3/prompts/who-works-on-a-farm-fac15b.mp3 | Who works on a farm? | 1 |
| /audio/assessment/v3/prompts/add-s-to-hen-5c464f.mp3 | Add -s to hen. | 1 |
| /audio/assessment/v3/prompts/add-es-to-fox-1f4f7f.mp3 | Add -es to fox. | 1 |
| /audio/assessment/v3/prompts/add-s-to-cup-5c43d5.mp3 | Add -s to cup. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-every-day-dad-the-car-de5e86.mp3 | Which word fits? Every day, Dad … the car. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-my-cat-on-the-mat-each-day-15222b.mp3 | Which word fits? My cat … on the mat each day. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-gran-bread-every-sunday-39d3bb.mp3 | Which word fits? Gran … bread every Sunday. | 1 |
| /audio/assessment/v3/prompts/add-ing-to-jump-fb230d.mp3 | Add -ing to jump. | 1 |
| /audio/assessment/v3/prompts/add-ing-to-read-fbaad7.mp3 | Add -ing to read. | 1 |
| /audio/assessment/v3/prompts/add-ing-to-play-fb8a7f.mp3 | Add -ing to play. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-right-now-the-pot-is-on-the-3b2e5d.mp3 | Which word fits? Right now, the pot is … on the stove. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-we-are-a-sandcastle-today-3bc6c3.mp3 | Which word fits? We are … a sandcastle today. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-keep-the-finish-line-is-clos-4786b6.mp3 | Which word fits? Keep …! The finish line is close. | 1 |
| /audio/assessment/v3/prompts/add-ed-to-walk-cdccbd.mp3 | Add -ed to walk. | 1 |
| /audio/assessment/v3/prompts/add-ed-to-help-ccbf7f.mp3 | Add -ed to help. | 1 |
| /audio/assessment/v3/prompts/add-ed-to-jump-ccec7b.mp3 | Add -ed to jump. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-yesterday-we-to-the-park-ae32bb.mp3 | Which word fits? Yesterday we … to the park. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-last-night-the-baby-for-hour-49db4e.mp3 | Which word fits? Last night, the baby … for hours. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-we-the-door-before-bed-93a7f1.mp3 | Which word fits? We … the door before bed. | 1 |
| /audio/assessment/v3/prompts/add-est-to-tall-7587a0.mp3 | Add -est to tall. | 1 |
| /audio/assessment/v3/prompts/add-er-to-fast-52d2b5.mp3 | Add -er to fast. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-ben-is-tall-but-ana-is-even-6b1587.mp3 | Which word fits? Ben is tall, but Ana is even …. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-of-all-three-dogs-rex-is-the-e33bd7.mp3 | Which word fits? Of all three dogs, Rex is the …. | 1 |
| /audio/assessment/v3/prompts/which-word-compares-two-tall-things-bf764a.mp3 | Which word compares two tall things? | 1 |
| /audio/assessment/v3/prompts/which-word-picks-the-slow-one-from-every-sna-4ede80.mp3 | Which word picks the slow one from every snail? | 1 |
| /audio/assessment/v3/prompts/add-ly-to-quick-c21004.mp3 | Add -ly to quick. | 1 |
| /audio/assessment/v3/prompts/add-ly-to-soft-c7f2cc.mp3 | Add -ly to soft. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-set-the-eggs-down-with-no-bu-de1499.mp3 | Which word fits? Set the eggs down …, with no bumps. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-mouse-crept-past-the-cat-c9f8d6.mp3 | Which word fits? The mouse crept … past the cat. | 1 |
| /audio/assessment/v3/prompts/what-does-bravely-mean-4d2c01.mp3 | What does bravely mean? | 1 |
| /audio/assessment/v3/prompts/what-does-proudly-mean-76e96e.mp3 | What does proudly mean? | 1 |
| /audio/assessment/v3/prompts/add-pre-to-heat-debc68.mp3 | Add pre- to heat. | 1 |
| /audio/assessment/v3/prompts/add-pre-to-view-dfbc02.mp3 | Add pre- to view. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-the-oven-before-you-mix-the-57ede8.mp3 | Which word fits? … the oven before you mix the batter. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-we-watched-a-before-the-film-b3b8e1.mp3 | Which word fits? We watched a … before the film opened. | 1 |
| /audio/assessment/v3/prompts/what-is-a-pretest-dbee52.mp3 | What is a pretest? | 1 |
| /audio/assessment/v3/prompts/what-does-preorder-mean-5f1213.mp3 | What does preorder mean? | 1 |
| /audio/assessment/v3/prompts/which-word-means-not-safe-dd4471.mp3 | Which word means not safe? | 1 |
| /audio/assessment/v3/prompts/which-word-means-paint-again-2c2f94.mp3 | Which word means paint again? | 1 |
| /audio/assessment/v3/prompts/which-word-means-full-of-hope-27b297.mp3 | Which word means full of hope? | 1 |
| /audio/assessment/v3/prompts/which-word-means-without-care-ed944d.mp3 | Which word means without care? | 1 |
| /audio/assessment/v3/prompts/a-person-who-bakes-is-a-2b4f73.mp3 | A person who bakes is a… | 1 |
| /audio/assessment/v3/prompts/the-block-tower-fell-which-word-means-build-8443b7.mp3 | The block tower fell. Which word means build again? | 1 |
| /audio/assessment/v3/prompts/add-es-to-bus-1f4d67.mp3 | Add -es to bus. | 1 |
| /audio/assessment/v3/prompts/add-ing-to-cook-faa11f.mp3 | Add -ing to cook. | 1 |
| /audio/assessment/v3/prompts/add-ed-to-play-cd53ec.mp3 | Add -ed to play. | 1 |
| /audio/assessment/v3/prompts/which-word-fits-sam-is-quick-but-ali-is-even-2ed364.mp3 | Which word fits? Sam is quick, but Ali is even …. | 1 |
| /audio/assessment/v3/prompts/add-ly-to-brave-9ed846.mp3 | Add -ly to brave. | 1 |
| /audio/assessment/v3/prompts/add-pre-to-school-ca0cc5.mp3 | Add pre- to school. | 1 |
| /audio/production/en-US/assessment_prompt/where-is-the-cat-a06cf94083.mp3 | Where is the cat? | 1 |
| /audio/assessment/v3/prompts/where-is-the-goat-b57f7b.mp3 | Where is the goat? | 1 |
| /audio/assessment/v3/prompts/the-cat-is-the-box-331c2c.mp3 | The cat is … the box. | 1 |
| /audio/assessment/v3/prompts/the-goat-is-the-barn-5bcb47.mp3 | The goat is … the barn. | 1 |
| /audio/production/en-US/assessment_prompt/where-is-the-ball-ac2635de39.mp3 | Where is the ball? | 1 |
| /audio/assessment/v3/prompts/where-is-the-snow-b65850.mp3 | Where is the snow? | 1 |
| /audio/assessment/v3/prompts/the-ball-is-the-chair-d36d95.mp3 | The ball is … the chair. | 1 |
| /audio/assessment/v3/prompts/the-snow-is-the-roof-e5a4e5.mp3 | The snow is … the roof. | 1 |
| /audio/production/en-US/assessment_prompt/where-is-the-dog-9624e77b0a.mp3 | Where is the dog? | 1 |
| /audio/assessment/v3/prompts/where-are-the-slippers-bdff5d.mp3 | Where are the slippers? | 1 |
| /audio/assessment/v3/prompts/the-dog-is-the-table-d4cd7d.mp3 | The dog is … the table. | 1 |
| /audio/assessment/v3/prompts/the-slippers-are-the-bed-a20b6d.mp3 | The slippers are … the bed. | 1 |
| /audio/assessment/v3/prompts/where-is-the-bear-b51f84.mp3 | Where is the bear? | 1 |
| /audio/assessment/v3/prompts/where-is-the-child-5b9fdc.mp3 | Where is the child? | 1 |
| /audio/assessment/v3/prompts/the-bear-is-the-tree-838e7a.mp3 | The bear is … the tree. | 1 |
| /audio/assessment/v3/prompts/the-child-is-the-curtain-dfe017.mp3 | The child is … the curtain. | 1 |
| /audio/assessment/v3/prompts/where-is-the-rabbit-416cc8.mp3 | Where is the rabbit? | 1 |
| /audio/assessment/v3/prompts/where-is-the-cup-e67623.mp3 | Where is the cup? | 2 |
| /audio/assessment/v3/prompts/the-rabbit-is-the-basket-b241d6.mp3 | The rabbit is … the basket. | 1 |
| /audio/assessment/v3/prompts/the-cup-is-the-plate-d992d6.mp3 | The cup is … the plate. | 1 |
| /audio/assessment/v3/prompts/where-is-the-teddy-830e68.mp3 | Where is the teddy? | 1 |
| /audio/assessment/v3/prompts/the-cup-is-the-books-b92870.mp3 | The cup is … the books. | 1 |
| /audio/assessment/v3/prompts/the-teddy-is-the-pillows-b3eff6.mp3 | The teddy is … the pillows. | 1 |
| /audio/assessment/v3/prompts/where-is-the-tree-b66c6e.mp3 | Where is the tree? | 2 |
| /audio/assessment/v3/prompts/where-is-the-bike-b521df.mp3 | Where is the bike? | 1 |
| /audio/assessment/v3/prompts/the-tree-is-the-bear-b57118.mp3 | The tree is … the bear. | 1 |
| /audio/assessment/v3/prompts/the-bike-is-the-garage-93a84f.mp3 | The bike is … the garage. | 1 |
| /audio/production/en-US/assessment_prompt/where-is-the-bird-3bd4085cc0.mp3 | Where is the bird? | 1 |
| /audio/assessment/v3/prompts/where-is-the-clock-5beb63.mp3 | Where is the clock? | 1 |
| /audio/assessment/v3/prompts/the-bird-is-the-tree-5176f2.mp3 | The bird is … the tree. | 1 |
| /audio/assessment/v3/prompts/the-clock-is-the-door-78919c.mp3 | The clock is … the door. | 1 |
| /audio/assessment/v3/prompts/where-is-the-fish-b56a63.mp3 | Where is the fish? | 1 |
| /audio/assessment/v3/prompts/the-tree-is-the-bird-b57390.mp3 | The tree is … the bird. | 1 |
| /audio/assessment/v3/prompts/the-fish-is-the-bridge-cf151d.mp3 | The fish is … the bridge. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-p-4e5123.mp3 | Which where-word finishes the sentence? The plane flew … the town. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-h-8fe0a9.mp3 | Which where-word finishes the sentence? The horse leapt … the gate. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-high-in-the-sk-6d7583.mp3 | Which where-word fits exactly? High in the sky, the plane passed … the town. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-the-horse-jump-74b5e8.mp3 | Which where-word fits exactly? The horse jumped … the locked gate. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-t-baae5c.mp3 | Which where-word finishes the sentence? The train roared … the tunnel. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-rain-e166f6.mp3 | Which where-word finishes the sentence? Rain dripped … the crack in the tent. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-the-train-ente-b53411.mp3 | Which where-word fits exactly? The train entered one end and left the other: … the tunnel. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-the-tent-leake-bcb12c.mp3 | Which where-word fits exactly? The tent leaked because rain came … a small crack. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-our-h-d7f407.mp3 | Which where-word finishes the sentence? Our house is … the school on the same short street. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-keep-8b80d2.mp3 | Which where-word finishes the sentence? Keep the bucket … the door for spills. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-home-is-a-shor-94bab3.mp3 | Which where-word fits exactly? Home is a short walk away. Our house is … the school. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-keep-the-bucke-ca05bf.mp3 | Which where-word fits exactly? Keep the bucket … the door so it is quick to reach. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-b-2fef83.mp3 | Which where-word finishes the sentence? The bakery is … the bank, just across the road. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-t-6a3cc5.mp3 | Which where-word finishes the sentence? The two goals stand … each other. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-the-bakery-fac-cce2f7.mp3 | Which where-word fits exactly? The bakery faces the bank across the road: … the bank. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-the-goals-at-t-d6f561.mp3 | Which where-word fits exactly? The goals at the two ends stand … each other. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-a-red-376541.mp3 | Which where-word finishes the sentence? A red tulip grew … the yellow tulips. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-d-b61853.mp3 | Which where-word finishes the sentence? The deer stood … the trees. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-one-red-flower-b1aaab.mp3 | Which where-word fits exactly? One red flower grows … many yellow flowers. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-a-deer-stood-t-6559dd.mp3 | Which where-word fits exactly? A deer stood … the trees, hard to spot. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-f-351cd1.mp3 | Which where-word finishes the sentence? The fence runs … the whole garden. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-p-32184f.mp3 | Which where-word finishes the sentence? The path bends … the puddle. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-we-walked-the-cadf3a.mp3 | Which where-word fits exactly? We walked … the puddle to keep our shoes dry. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-the-fence-make-5b8631.mp3 | Which where-word fits exactly? The fence makes a complete ring … the garden. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-it-po-5dc947.mp3 | Which where-word finishes the sentence? It poured with rain, so we played … the house. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-leave-173688.mp3 | Which where-word finishes the sentence? Leave the muddy boots … the door. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-leave-your-mud-4f96ff.mp3 | Which where-word fits exactly? Leave your muddy boots … the door, then come in. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-rain-is-fallin-8f41de.mp3 | Which where-word fits exactly? Rain is falling outdoors, but the children are dry … the house. | 1 |
| /audio/assessment/v3/prompts/where-is-the-chair-5b9b6e.mp3 | Where is the chair? | 1 |
| /audio/assessment/v3/prompts/where-are-the-books-1e0b3f.mp3 | Where are the books? | 1 |
| /audio/assessment/v3/prompts/choose-the-word-the-goat-waits-the-barn-f9d206.mp3 | Choose the word: the goat waits … the barn. | 1 |
| /audio/assessment/v3/prompts/choose-the-word-the-dog-rests-the-table-3367df.mp3 | Choose the word: the dog rests … the table. | 1 |
| /audio/assessment/v3/prompts/choose-the-word-the-clock-hangs-the-door-77800b.mp3 | Choose the word: the clock hangs … the door. | 1 |
| /audio/assessment/v3/prompts/choose-the-words-the-rabbit-sits-the-basket-61c1ed.mp3 | Choose the words: the rabbit sits … the basket. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-h-7f353b.mp3 | Which where-word finishes the sentence? The horse is jumping … the gate. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-t-9ab8fc.mp3 | Which where-word finishes the sentence? The train is passing … the tunnel. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-a-short-path-j-400457.mp3 | Which where-word fits exactly? A short path joins home and school. They are … each other. | 1 |
| /audio/assessment/v3/prompts/which-where-word-fits-exactly-the-single-red-9e19f8.mp3 | Which where-word fits exactly? The single red tulip stands … the yellow tulips. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-f-f5df97.mp3 | Which where-word finishes the sentence? The fence curves … the garden. | 1 |
| /audio/assessment/v3/prompts/which-where-word-finishes-the-sentence-the-c-5bbc23.mp3 | Which where-word finishes the sentence? The children stay dry … the house. | 1 |
| /audio/assessment/v3/prompts/car-which-letters-finish-the-word-car-242636.mp3 | car. Which letters finish the word car? | 1 |
| /audio/assessment/v3/prompts/farm-which-letters-finish-the-word-farm-9ac1ef.mp3 | farm. Which letters finish the word farm? | 1 |
| /audio/assessment/v3/prompts/shark-which-letters-make-the-r-sound-in-shar-5af21e.mp3 | shark. Which letters make the r sound in shark? | 1 |
| /audio/assessment/v3/prompts/yarn-which-letters-make-the-r-sound-in-yarn-7c6212.mp3 | yarn. Which letters make the r sound in yarn? | 1 |
| /audio/assessment/v3/prompts/park-which-letters-make-the-r-sound-in-park-ebbf7c.mp3 | park. Which letters make the r sound in park? | 1 |
| /audio/assessment/v3/prompts/sharp-which-letters-finish-the-word-sharp-abccec.mp3 | sharp. Which letters finish the word sharp? | 1 |
| /audio/assessment/v3/prompts/barn-which-letters-finish-the-word-barn-eea026.mp3 | barn. Which letters finish the word barn? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-ar-as-in-car-sound-bf4442.mp3 | Which word has the ar (as in car) sound? | 4 |
| /audio/assessment/v3/prompts/corn-which-letters-finish-the-word-corn-a197d2.mp3 | corn. Which letters finish the word corn? | 1 |
| /audio/assessment/v3/prompts/fork-which-letters-finish-the-word-fork-60e21f.mp3 | fork. Which letters finish the word fork? | 1 |
| /audio/assessment/v3/prompts/storm-which-letters-finish-the-word-storm-2ed3a0.mp3 | storm. Which letters finish the word storm? | 1 |
| /audio/assessment/v3/prompts/corn-which-letters-make-the-r-sound-in-corn-c8dace.mp3 | corn. Which letters make the r sound in corn? | 1 |
| /audio/assessment/v3/prompts/fork-which-letters-make-the-r-sound-in-fork-656b00.mp3 | fork. Which letters make the r sound in fork? | 1 |
| /audio/assessment/v3/prompts/horn-which-letters-make-the-r-sound-in-horn-31054c.mp3 | horn. Which letters make the r sound in horn? | 1 |
| /audio/assessment/v3/prompts/short-which-letters-finish-the-word-short-c0bb82.mp3 | short. Which letters finish the word short? | 1 |
| /audio/assessment/v3/prompts/fort-which-letters-finish-the-word-fort-a24f23.mp3 | fort. Which letters finish the word fort? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-or-as-in-corn-sound-ffeff1.mp3 | Which word has the or (as in corn) sound? | 3 |
| /audio/assessment/v3/prompts/her-which-letters-finish-the-word-her-720fbb.mp3 | her. Which letters finish the word her? | 2 |
| /audio/assessment/v3/prompts/fern-which-letters-finish-the-word-fern-3e1ff1.mp3 | fern. Which letters finish the word fern? | 1 |
| /audio/assessment/v3/prompts/herd-which-letters-finish-the-word-herd-1a6a4c.mp3 | herd. Which letters finish the word herd? | 1 |
| /audio/assessment/v3/prompts/tiger-which-letters-make-the-r-sound-in-tige-b04813.mp3 | tiger. Which letters make the r sound in tiger? | 1 |
| /audio/assessment/v3/prompts/flower-which-letters-make-the-r-sound-in-flo-72e149.mp3 | flower. Which letters make the r sound in flower? | 1 |
| /audio/assessment/v3/prompts/spider-which-letters-make-the-r-sound-in-spi-71029b.mp3 | spider. Which letters make the r sound in spider? | 1 |
| /audio/assessment/v3/prompts/letter-which-letters-finish-the-word-letter-12b7fc.mp3 | letter. Which letters finish the word letter? | 1 |
| /audio/assessment/v3/prompts/winter-which-letters-finish-the-word-winter-70e72a.mp3 | winter. Which letters finish the word winter? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-er-as-in-her-sound-ae71fb.mp3 | Which word has the er (as in her) sound? | 3 |
| /audio/assessment/v3/prompts/bird-which-letters-finish-the-word-bird-a90310.mp3 | bird. Which letters finish the word bird? | 1 |
| /audio/assessment/v3/prompts/girl-which-letters-finish-the-word-girl-11b1fa.mp3 | girl. Which letters finish the word girl? | 1 |
| /audio/assessment/v3/prompts/shirt-which-letters-finish-the-word-shirt-4d66fa.mp3 | shirt. Which letters finish the word shirt? | 1 |
| /audio/assessment/v3/prompts/bird-which-letters-make-the-r-sound-in-bird-344081.mp3 | bird. Which letters make the r sound in bird? | 1 |
| /audio/assessment/v3/prompts/girl-which-letters-make-the-r-sound-in-girl-6e61a9.mp3 | girl. Which letters make the r sound in girl? | 1 |
| /audio/assessment/v3/prompts/shirt-which-letters-make-the-r-sound-in-shir-a0c232.mp3 | shirt. Which letters make the r sound in shirt? | 1 |
| /audio/assessment/v3/prompts/first-which-letters-finish-the-word-first-7bad99.mp3 | first. Which letters finish the word first? | 2 |
| /audio/assessment/v3/prompts/third-which-letters-finish-the-word-third-f2858e.mp3 | third. Which letters finish the word third? | 1 |
| /audio/assessment/v3/prompts/dirt-which-letters-finish-the-word-dirt-e00e77.mp3 | dirt. Which letters finish the word dirt? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-ir-as-in-bird-sound-71ea2a.mp3 | Which word has the ir (as in bird) sound? | 4 |
| /audio/assessment/v3/prompts/hurt-which-letters-finish-the-word-hurt-343b6c.mp3 | hurt. Which letters finish the word hurt? | 1 |
| /audio/assessment/v3/prompts/nurse-which-letters-finish-the-word-nurse-fd92be.mp3 | nurse. Which letters finish the word nurse? | 2 |
| /audio/assessment/v3/prompts/burn-which-letters-finish-the-word-burn-fa510f.mp3 | burn. Which letters finish the word burn? | 1 |
| /audio/assessment/v3/prompts/purse-which-letters-make-the-r-sound-in-purs-68f274.mp3 | purse. Which letters make the r sound in purse? | 1 |
| /audio/assessment/v3/prompts/surf-which-letters-make-the-r-sound-in-surf-fd8997.mp3 | surf. Which letters make the r sound in surf? | 1 |
| /audio/assessment/v3/prompts/turtle-which-letters-make-the-r-sound-in-tur-83631f.mp3 | turtle. Which letters make the r sound in turtle? | 1 |
| /audio/assessment/v3/prompts/curl-which-letters-finish-the-word-curl-cb8c83.mp3 | curl. Which letters finish the word curl? | 1 |
| /audio/assessment/v3/prompts/turnip-which-letters-finish-the-word-turnip-513035.mp3 | turnip. Which letters finish the word turnip? | 1 |
| /audio/assessment/v3/prompts/burst-which-letters-finish-the-word-burst-25be35.mp3 | burst. Which letters finish the word burst? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-ur-as-in-turn-sound-104f24.mp3 | Which word has the ur (as in turn) sound? | 3 |
| /audio/assessment/v3/prompts/jar-which-letters-finish-the-word-jar-71dd12.mp3 | jar. Which letters finish the word jar? | 1 |
| /audio/assessment/v3/prompts/horn-which-letters-finish-the-word-horn-6a8d00.mp3 | horn. Which letters finish the word horn? | 1 |
| /audio/assessment/v3/prompts/car-which-letters-make-the-r-sound-in-car-aee3db.mp3 | car. Which letters make the r sound in car? | 1 |
| /audio/assessment/v3/prompts/storm-which-letters-make-the-r-sound-in-stor-20a705.mp3 | storm. Which letters make the r sound in storm? | 1 |
| /audio/assessment/v3/prompts/sister-which-letters-finish-the-word-sister-4e64da.mp3 | sister. Which letters finish the word sister? | 1 |
| /audio/assessment/v3/prompts/fur-which-letters-finish-the-word-fur-fe9baf.mp3 | fur. Which letters finish the word fur? | 1 |
| /audio/assessment/v3/prompts/cat-which-one-rhymes-with-cat-fcab1d.mp3 | cat. Which one rhymes with cat? | 1 |
| /audio/assessment/v3/prompts/sat-which-one-rhymes-with-sat-c900df.mp3 | sat. Which one rhymes with sat? | 1 |
| /audio/assessment/v3/prompts/bat-which-one-rhymes-with-bat-2fe5c1.mp3 | bat. Which one rhymes with bat? | 1 |
| /audio/assessment/v3/prompts/man-which-one-rhymes-with-man-f7b931.mp3 | man. Which one rhymes with man? | 1 |
| /audio/assessment/v3/prompts/can-which-one-rhymes-with-can-f80397.mp3 | can. Which one rhymes with can? | 1 |
| /audio/assessment/v3/prompts/tan-which-one-rhymes-with-tan-911eb6.mp3 | tan. Which one rhymes with tan? | 1 |
| /audio/assessment/v3/prompts/cap-which-one-rhymes-with-cap-a43b6f.mp3 | cap. Which one rhymes with cap? | 1 |
| /audio/assessment/v3/prompts/map-which-one-rhymes-with-map-a3f108.mp3 | map. Which one rhymes with map? | 1 |
| /audio/assessment/v3/prompts/lap-which-one-rhymes-with-lap-d72bac.mp3 | lap. Which one rhymes with lap? | 1 |
| /audio/assessment/v3/prompts/ham-which-one-rhymes-with-ham-21c278.mp3 | ham. Which one rhymes with ham? | 1 |
| /audio/assessment/v3/prompts/ram-which-one-rhymes-with-ram-217812.mp3 | ram. Which one rhymes with ram? | 1 |
| /audio/assessment/v3/prompts/jam-which-one-rhymes-with-jam-bb4d31.mp3 | jam. Which one rhymes with jam? | 1 |
| /audio/assessment/v3/prompts/bag-which-one-rhymes-with-bag-507aca.mp3 | bag. Which one rhymes with bag? | 1 |
| /audio/assessment/v3/prompts/rag-which-one-rhymes-with-rag-1cd08c.mp3 | rag. Which one rhymes with rag? | 1 |
| /audio/assessment/v3/prompts/tag-which-one-rhymes-with-tag-b65b44.mp3 | tag. Which one rhymes with tag? | 1 |
| /audio/assessment/v3/prompts/dad-which-one-rhymes-with-dad-67b1bf.mp3 | dad. Which one rhymes with dad? | 1 |
| /audio/assessment/v3/prompts/sad-which-one-rhymes-with-sad-674225.mp3 | sad. Which one rhymes with sad? | 1 |
| /audio/assessment/v3/prompts/mad-which-one-rhymes-with-mad-9aa1fc.mp3 | mad. Which one rhymes with mad? | 1 |
| /audio/assessment/v3/prompts/red-which-one-rhymes-with-red-e248f1.mp3 | red. Which one rhymes with red? | 1 |
| /audio/assessment/v3/prompts/fed-which-one-rhymes-with-fed-67a1f7.mp3 | fed. Which one rhymes with fed? | 1 |
| /audio/assessment/v3/prompts/wed-which-one-rhymes-with-wed-bd159b.mp3 | wed. Which one rhymes with wed? | 1 |
| /audio/assessment/v3/prompts/den-which-one-rhymes-with-den-2b2e73.mp3 | den. Which one rhymes with den? | 1 |
| /audio/assessment/v3/prompts/men-which-one-rhymes-with-men-5e1eb0.mp3 | men. Which one rhymes with men? | 1 |
| /audio/assessment/v3/prompts/hen-which-one-rhymes-with-hen-5e43e3.mp3 | hen. Which one rhymes with hen? | 1 |
| /audio/assessment/v3/prompts/pet-which-one-rhymes-with-pet-c9164a.mp3 | pet. Which one rhymes with pet? | 1 |
| /audio/assessment/v3/prompts/wet-which-one-rhymes-with-wet-627bcf.mp3 | wet. Which one rhymes with wet? | 1 |
| /audio/assessment/v3/prompts/set-which-one-rhymes-with-set-2f665f.mp3 | set. Which one rhymes with set? | 1 |
| /audio/assessment/v3/prompts/peg-which-one-rhymes-with-peg-e9ab53.mp3 | peg. Which one rhymes with peg? | 2 |
| /audio/assessment/v3/prompts/leg-which-one-rhymes-with-leg-b695e3.mp3 | leg. Which one rhymes with leg? | 1 |
| /audio/assessment/v3/prompts/fig-which-one-rhymes-with-fig-505b39.mp3 | fig. Which one rhymes with fig? | 1 |
| /audio/assessment/v3/prompts/twig-which-one-rhymes-with-twig-ab4bbf.mp3 | twig. Which one rhymes with twig? | 1 |
| /audio/assessment/v3/prompts/jig-which-one-rhymes-with-jig-8370aa.mp3 | jig. Which one rhymes with jig? | 1 |
| /audio/assessment/v3/prompts/win-which-one-rhymes-with-win-c439c9.mp3 | win. Which one rhymes with win? | 1 |
| /audio/assessment/v3/prompts/tin-which-one-rhymes-with-tin-5de9b5.mp3 | tin. Which one rhymes with tin? | 1 |
| /audio/assessment/v3/prompts/chin-which-one-rhymes-with-chin-2768a9.mp3 | chin. Which one rhymes with chin? | 1 |
| /audio/assessment/v3/prompts/dip-which-one-rhymes-with-dip-3dcbca.mp3 | dip. Which one rhymes with dip? | 1 |
| /audio/assessment/v3/prompts/rip-which-one-rhymes-with-rip-7096d4.mp3 | rip. Which one rhymes with rip? | 1 |
| /audio/assessment/v3/prompts/lip-which-one-rhymes-with-lip-a3f6ab.mp3 | lip. Which one rhymes with lip? | 1 |
| /audio/assessment/v3/prompts/bit-which-one-rhymes-with-bit-fcb0c0.mp3 | bit. Which one rhymes with bit? | 1 |
| /audio/assessment/v3/prompts/fit-which-one-rhymes-with-fit-2fc631.mp3 | fit. Which one rhymes with fit? | 1 |
| /audio/assessment/v3/prompts/kit-which-one-rhymes-with-kit-2fa0fd.mp3 | kit. Which one rhymes with kit? | 1 |
| /audio/assessment/v3/prompts/fog-which-one-rhymes-with-fog-e9f379.mp3 | fog. Which one rhymes with fog? | 1 |
| /audio/assessment/v3/prompts/jog-which-one-rhymes-with-jog-1d08e9.mp3 | jog. Which one rhymes with jog? | 1 |
| /audio/assessment/v3/prompts/hog-which-one-rhymes-with-hog-837e31.mp3 | hog. Which one rhymes with hog? | 1 |
| /audio/assessment/v3/prompts/pop-which-one-rhymes-with-pop-70a45b.mp3 | pop. Which one rhymes with pop? | 1 |
| /audio/assessment/v3/prompts/drop-which-one-rhymes-with-drop-2e3b80.mp3 | drop. Which one rhymes with drop? | 1 |
| /audio/assessment/v3/prompts/stop-which-one-rhymes-with-stop-fc4e14.mp3 | stop. Which one rhymes with stop? | 1 |
| /audio/assessment/v3/prompts/not-which-one-rhymes-with-not-2f8951.mp3 | not. Which one rhymes with not? | 1 |
| /audio/assessment/v3/prompts/got-which-one-rhymes-with-got-9623cc.mp3 | got. Which one rhymes with got? | 1 |
| /audio/assessment/v3/prompts/lot-which-one-rhymes-with-lot-95fe99.mp3 | lot. Which one rhymes with lot? | 1 |
| /audio/assessment/v3/prompts/tug-which-one-rhymes-with-tug-b656c2.mp3 | tug. Which one rhymes with tug? | 1 |
| /audio/assessment/v3/prompts/dug-which-one-rhymes-with-dug-ea0100.mp3 | dug. Which one rhymes with dug? | 1 |
| /audio/assessment/v3/prompts/hug-which-one-rhymes-with-hug-1d1670.mp3 | hug. Which one rhymes with hug? | 1 |
| /audio/assessment/v3/prompts/fun-which-one-rhymes-with-fun-5e4f29.mp3 | fun. Which one rhymes with fun? | 1 |
| /audio/assessment/v3/prompts/bun-which-one-rhymes-with-bun-2b39b9.mp3 | bun. Which one rhymes with bun? | 1 |
| /audio/assessment/v3/prompts/sun-which-one-rhymes-with-sun-c454d7.mp3 | sun. Which one rhymes with sun? | 1 |
| /audio/assessment/v3/prompts/pup-which-one-rhymes-with-pup-a3c9a6.mp3 | pup. Which one rhymes with pup? | 2 |
| /audio/assessment/v3/prompts/cup-which-one-rhymes-with-cup-a436ec.mp3 | cup. Which one rhymes with cup? | 1 |
| /audio/assessment/v3/prompts/shut-which-one-rhymes-with-shut-6ed888.mp3 | shut. Which one rhymes with shut? | 2 |
| /audio/assessment/v3/prompts/but-which-one-rhymes-with-but-2fe13f.mp3 | but. Which one rhymes with but? | 1 |
| /audio/assessment/v3/prompts/sing-which-word-rhymes-with-sing-fe4406.mp3 | sing. Which word rhymes with sing? | 1 |
| /audio/assessment/v3/prompts/king-which-word-rhymes-with-king-3c3121.mp3 | king. Which word rhymes with king? | 1 |
| /audio/assessment/v3/prompts/which-word-does-not-rhyme-with-the-others-7d414d.mp3 | Which word does not rhyme with the others? | 28 |
| /audio/assessment/v3/prompts/bang-which-word-rhymes-with-bang-b8195d.mp3 | bang. Which word rhymes with bang? | 1 |
| /audio/assessment/v3/prompts/sang-which-word-rhymes-with-sang-748183.mp3 | sang. Which word rhymes with sang? | 1 |
| /audio/assessment/v3/prompts/song-which-word-rhymes-with-song-6595e9.mp3 | song. Which word rhymes with song? | 1 |
| /audio/assessment/v3/prompts/long-which-word-rhymes-with-long-dbc560.mp3 | long. Which word rhymes with long? | 1 |
| /audio/assessment/v3/prompts/pink-which-word-rhymes-with-pink-889030.mp3 | pink. Which word rhymes with pink? | 1 |
| /audio/assessment/v3/prompts/wink-which-word-rhymes-with-wink-1260b8.mp3 | wink. Which word rhymes with wink? | 1 |
| /audio/assessment/v3/prompts/sock-which-word-rhymes-with-sock-3d9663.mp3 | sock. Which word rhymes with sock? | 1 |
| /audio/assessment/v3/prompts/lock-which-word-rhymes-with-lock-b3c5da.mp3 | lock. Which word rhymes with lock? | 1 |
| /audio/assessment/v3/prompts/back-which-word-rhymes-with-back-9019d7.mp3 | back. Which word rhymes with back? | 1 |
| /audio/assessment/v3/prompts/pack-which-word-rhymes-with-pack-a3bae7.mp3 | pack. Which word rhymes with pack? | 1 |
| /audio/assessment/v3/prompts/stick-which-word-rhymes-with-stick-57b91a.mp3 | stick. Which word rhymes with stick? | 1 |
| /audio/assessment/v3/prompts/kick-which-word-rhymes-with-kick-14319b.mp3 | kick. Which word rhymes with kick? | 1 |
| /audio/assessment/v3/prompts/hill-which-word-rhymes-with-hill-c88483.mp3 | hill. Which word rhymes with hill? | 1 |
| /audio/assessment/v3/prompts/mill-which-word-rhymes-with-mill-e1d052.mp3 | mill. Which word rhymes with mill? | 1 |
| /audio/assessment/v3/prompts/ball-which-word-rhymes-with-ball-ed33d4.mp3 | ball. Which word rhymes with ball? | 1 |
| /audio/assessment/v3/prompts/wall-which-word-rhymes-with-wall-8aa56d.mp3 | wall. Which word rhymes with wall? | 1 |
| /audio/assessment/v3/prompts/bell-which-word-rhymes-with-bell-321515.mp3 | bell. Which word rhymes with bell? | 1 |
| /audio/assessment/v3/prompts/well-which-word-rhymes-with-well-cf86ae.mp3 | well. Which word rhymes with well? | 1 |
| /audio/assessment/v3/prompts/cash-which-word-rhymes-with-cash-b7fa86.mp3 | cash. Which word rhymes with cash? | 1 |
| /audio/assessment/v3/prompts/splash-which-word-rhymes-with-splash-e24202.mp3 | splash. Which word rhymes with splash? | 1 |
| /audio/assessment/v3/prompts/wish-which-word-rhymes-with-wish-a6ec45.mp3 | wish. Which word rhymes with wish? | 1 |
| /audio/assessment/v3/prompts/fish-which-word-rhymes-with-fish-ea841f.mp3 | fish. Which word rhymes with fish? | 1 |
| /audio/assessment/v3/prompts/duck-which-word-rhymes-with-duck-5904d8.mp3 | duck. Which word rhymes with duck? | 1 |
| /audio/assessment/v3/prompts/luck-which-word-rhymes-with-luck-1b17bd.mp3 | luck. Which word rhymes with luck? | 1 |
| /audio/assessment/v3/prompts/cake-which-word-rhymes-with-cake-26b5b5.mp3 | cake. Which word rhymes with cake? | 1 |
| /audio/assessment/v3/prompts/snake-which-word-rhymes-with-snake-49f6e3.mp3 | snake. Which word rhymes with snake? | 1 |
| /audio/assessment/v3/prompts/game-which-word-rhymes-with-game-d27cc0.mp3 | game. Which word rhymes with game? | 1 |
| /audio/assessment/v3/prompts/same-which-word-rhymes-with-same-759917.mp3 | same. Which word rhymes with same? | 1 |
| /audio/assessment/v3/prompts/ride-which-word-rhymes-with-ride-36c411.mp3 | ride. Which word rhymes with ride? | 1 |
| /audio/assessment/v3/prompts/side-which-word-rhymes-with-side-6f066d.mp3 | side. Which word rhymes with side? | 1 |
| /audio/assessment/v3/prompts/light-which-word-rhymes-with-light-eafaf3.mp3 | light. Which word rhymes with light? | 1 |
| /audio/assessment/v3/prompts/night-which-word-rhymes-with-night-fa48e5.mp3 | night. Which word rhymes with night? | 1 |
| /audio/assessment/v3/prompts/boat-which-word-rhymes-with-boat-e95bf3.mp3 | boat. Which word rhymes with boat? | 1 |
| /audio/assessment/v3/prompts/coat-which-word-rhymes-with-coat-219e4f.mp3 | coat. Which word rhymes with coat? | 1 |
| /audio/assessment/v3/prompts/sheep-which-word-rhymes-with-sheep-a8bcc7.mp3 | sheep. Which word rhymes with sheep? | 1 |
| /audio/assessment/v3/prompts/jeep-which-word-rhymes-with-jeep-61a3a5.mp3 | jeep. Which word rhymes with jeep? | 1 |
| /audio/assessment/v3/prompts/bird-which-word-rhymes-with-bird-7108a0.mp3 | bird. Which word rhymes with bird? | 1 |
| /audio/assessment/v3/prompts/third-which-word-rhymes-with-third-b08acd.mp3 | third. Which word rhymes with third? | 1 |
| /audio/assessment/v3/prompts/burn-which-word-rhymes-with-burn-3f5c84.mp3 | burn. Which word rhymes with burn? | 1 |
| /audio/assessment/v3/prompts/turn-which-word-rhymes-with-turn-340707.mp3 | turn. Which word rhymes with turn? | 1 |
| /audio/assessment/v3/prompts/car-which-word-rhymes-with-car-6dfe32.mp3 | car. Which word rhymes with car? | 1 |
| /audio/assessment/v3/prompts/jar-which-word-rhymes-with-jar-339980.mp3 | jar. Which word rhymes with jar? | 1 |
| /audio/assessment/v3/prompts/corn-which-word-rhymes-with-corn-104cfe.mp3 | corn. Which word rhymes with corn? | 1 |
| /audio/assessment/v3/prompts/fort-which-word-rhymes-with-fort-85b0f3.mp3 | fort. Which word rhymes with fort? | 1 |
| /audio/assessment/v3/prompts/rat-which-one-rhymes-with-rat-fc3b83.mp3 | rat. Which one rhymes with rat? | 1 |
| /audio/assessment/v3/prompts/log-which-one-rhymes-with-log-b693a1.mp3 | log. Which one rhymes with log? | 1 |
| /audio/assessment/v3/prompts/pen-which-one-rhymes-with-pen-c46ec5.mp3 | pen. Which one rhymes with pen? | 1 |
| /audio/assessment/v3/prompts/jug-which-one-rhymes-with-jug-b6a128.mp3 | jug. Which one rhymes with jug? | 1 |
| /audio/assessment/v3/prompts/tip-which-one-rhymes-with-tip-a218c5.mp3 | tip. Which one rhymes with tip? | 1 |
| /audio/assessment/v3/prompts/ring-which-word-rhymes-with-ring-c601aa.mp3 | ring. Which word rhymes with ring? | 1 |
| /audio/assessment/v3/prompts/bake-which-word-rhymes-with-bake-ee7358.mp3 | bake. Which word rhymes with bake? | 1 |
| /audio/assessment/v3/prompts/goat-which-word-rhymes-with-goat-2a7c24.mp3 | goat. Which word rhymes with goat? | 1 |
| /audio/assessment/v3/prompts/who-planted-the-tulips-356293.mp3 | Who planted the tulips? | 1 |
| /audio/assessment/v3/prompts/what-did-milo-get-131cd1.mp3 | What did Milo get? | 1 |
| /audio/assessment/v3/prompts/who-whistles-the-tunes-295ee3.mp3 | Who whistles the tunes? | 1 |
| /audio/assessment/v3/prompts/what-did-baby-ren-stack-8a1415.mp3 | What did Baby Ren stack? | 1 |
| /audio/assessment/v3/prompts/what-did-uncle-dip-burn-4f9c8a.mp3 | What did Uncle Dip burn? | 1 |
| /audio/assessment/v3/prompts/who-painted-the-door-ee106a.mp3 | Who painted the door? | 1 |
| /audio/assessment/v3/prompts/what-did-the-magpie-steal-b98f42.mp3 | What did the magpie steal? | 1 |
| /audio/assessment/v3/prompts/what-did-miss-faro-use-1a3771.mp3 | What did Miss Faro use? | 1 |
| /audio/assessment/v3/prompts/when-does-the-choir-practise-da172f.mp3 | When does the choir practise? | 1 |
| /audio/assessment/v3/prompts/where-does-dad-keep-his-glasses-fd40f0.mp3 | Where does Dad keep his glasses? | 1 |
| /audio/assessment/v3/prompts/where-did-the-frog-hide-b303e8.mp3 | Where did the frog hide? | 1 |
| /audio/assessment/v3/prompts/when-do-the-lessons-start-249126.mp3 | When do the lessons start? | 1 |
| /audio/assessment/v3/prompts/where-does-the-bike-go-6366ee.mp3 | Where does the bike go? | 1 |
| /audio/assessment/v3/prompts/when-does-the-market-open-f0eb0e.mp3 | When does the market open? | 1 |
| /audio/assessment/v3/prompts/where-does-grandpa-nap-435091.mp3 | Where does Grandpa nap? | 1 |
| /audio/assessment/v3/prompts/where-was-the-kitten-found-9bd073.mp3 | Where was the kitten found? | 1 |
| /audio/assessment/v3/prompts/which-sentence-tells-about-this-scene-d25d6a.mp3 | Which sentence tells about this scene? | 10 |
| /audio/assessment/v3/prompts/what-did-pia-do-95240d.mp3 | What did Pia do? | 1 |
| /audio/assessment/v3/prompts/what-did-the-waiter-do-61b31b.mp3 | What did the waiter do? | 1 |
| /audio/assessment/v3/prompts/what-did-nan-do-e9718d.mp3 | What did Nan do? | 1 |
| /audio/assessment/v3/prompts/what-did-the-goalkeeper-do-50b0b1.mp3 | What did the goalkeeper do? | 1 |
| /audio/assessment/v3/prompts/what-did-kofi-do-7ae74d.mp3 | What did Kofi do? | 1 |
| /audio/assessment/v3/prompts/what-did-the-parrot-do-113ced.mp3 | What did the parrot do? | 1 |
| /audio/assessment/v3/prompts/what-did-ada-do-6d0b2c.mp3 | What did Ada do? | 1 |
| /audio/assessment/v3/prompts/what-did-the-librarian-do-83511f.mp3 | What did the librarian do? | 1 |
| /audio/assessment/v3/prompts/why-did-the-men-use-the-stairs-dbc543.mp3 | Why did the men use the stairs? | 1 |
| /audio/assessment/v3/prompts/why-did-the-footprints-look-enormous-a82d25.mp3 | Why did the footprints look enormous? | 1 |
| /audio/assessment/v3/prompts/how-did-people-feel-about-moving-indoors-32443c.mp3 | How did people feel about moving indoors? | 1 |
| /audio/assessment/v3/prompts/what-did-the-red-flag-warn-d2fa47.mp3 | What did the red flag warn? | 1 |
| /audio/assessment/v3/prompts/why-did-jin-save-his-bus-money-f8ea39.mp3 | Why did Jin save his bus money? | 1 |
| /audio/assessment/v3/prompts/why-did-the-bench-have-a-flag-99b647.mp3 | Why did the bench have a flag? | 1 |
| /audio/assessment/v3/prompts/what-did-tara-do-in-the-final-9c7926.mp3 | What did Tara do in the final? | 1 |
| /audio/assessment/v3/prompts/why-did-nobody-eat-the-bread-2b4d59.mp3 | Why did nobody eat the bread? | 1 |
| /audio/assessment/v3/prompts/who-wanted-the-fence-painted-blue-9b26e8.mp3 | Who wanted the fence painted blue? | 1 |
| /audio/assessment/v3/prompts/what-sailed-out-of-the-bay-b54bf5.mp3 | What sailed out of the bay? | 1 |
| /audio/assessment/v3/prompts/whose-pencil-got-the-teeth-marks-664701.mp3 | Whose pencil got the teeth marks? | 1 |
| /audio/assessment/v3/prompts/who-taught-the-card-game-21000d.mp3 | Who taught the card game? | 1 |
| /audio/assessment/v3/prompts/what-grew-too-tall-876fb9.mp3 | What grew too tall? | 1 |
| /audio/assessment/v3/prompts/who-built-the-robot-748bb6.mp3 | Who built the robot? | 1 |
| /audio/assessment/v3/prompts/who-was-full-and-sleepy-108499.mp3 | Who was full and sleepy? | 1 |
| /audio/assessment/v3/prompts/who-was-on-the-train-22a29f.mp3 | Who was on the train? | 1 |
| /audio/assessment/v3/prompts/which-sentence-means-the-same-f684ed.mp3 | Which sentence means the SAME? | 10 |
| /audio/assessment/v3/prompts/who-won-the-prize-58072b.mp3 | Who won the prize? | 1 |
| /audio/assessment/v3/prompts/when-does-the-hamster-run-9abda8.mp3 | When does the hamster run? | 1 |
| /audio/assessment/v3/prompts/what-did-the-baker-do-3a0a8b.mp3 | What did the baker do? | 1 |
| /audio/assessment/v3/prompts/who-taught-the-parrot-f10e7f.mp3 | Who taught the parrot? | 1 |
| /audio/assessment/v3/prompts/where-is-the-sports-kit-f69387.mp3 | Where is the sports kit? | 1 |
| /audio/assessment/v3/prompts/what-did-mrs-cho-do-421e8f.mp3 | What did Mrs Cho do? | 1 |
| /audio/assessment/v3/prompts/why-were-the-candles-relit-bd2428.mp3 | Why were the candles relit? | 1 |
| /audio/assessment/v3/prompts/what-did-nan-think-about-the-wait-65f96e.mp3 | What did Nan think about the wait? | 1 |
| /audio/assessment/v3/prompts/who-fell-asleep-944216.mp3 | Who fell asleep? | 1 |
| /audio/assessment/v3/prompts/who-packed-away-the-cones-c541e8.mp3 | Who packed away the cones? | 1 |
| /audio/assessment/v3/prompts/what-did-the-window-cleaner-do-4bcfac.mp3 | What did the window cleaner do? | 1 |
| /audio/assessment/v3/prompts/who-spotted-the-heron-3ab126.mp3 | Who spotted the heron? | 1 |
| /audio/assessment/v3/prompts/the-cat-jumped-on-the-box-curled-into-a-ball-2df43c.mp3 | The cat jumped on the box, curled into a ball, and fell asleep. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/mia-put-a-seed-in-soil-watered-it-and-saw-a-817cdd.mp3 | Mia put a seed in soil, watered it, and saw a green shoot. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/ben-wet-his-hands-rubbed-in-soap-and-rinsed-e39cfd.mp3 | Ben wet his hands, rubbed in soap, and rinsed the bubbles away. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/zara-put-on-her-shirt-pulled-on-her-trousers-dabd3e.mp3 | Zara put on her shirt, pulled on her trousers, and tied her shoes. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/dad-put-bread-in-the-toaster-waited-for-it-t-7b3ddd.mp3 | Dad put bread in the toaster, waited for it to pop, and spread butter. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/noah-threw-the-ball-the-dog-chased-it-and-th-6f1ca4.mp3 | Noah threw the ball, the dog chased it, and the dog brought it back. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/lina-drew-a-circle-added-sun-rays-and-colour-e25f48.mp3 | Lina drew a circle, added sun rays, and coloured the sun yellow. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/omar-set-down-blocks-stacked-a-tower-and-smi-a5b59f.mp3 | Omar set down blocks, stacked a tower, and smiled at the top. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/ava-laid-down-bread-added-cheese-and-closed-ee61cc.mp3 | Ava laid down bread, added cheese, and closed the sandwich. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/rain-began-eli-put-on-boots-opened-an-umbrel-81e8d4.mp3 | Rain began. Eli put on boots, opened an umbrella, and walked outside. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/the-girl-opened-her-book-read-one-page-and-p-f0de6b.mp3 | The girl opened her book, read one page, and put in a bookmark. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/kai-filled-a-cup-drank-the-water-and-put-the-b1f764.mp3 | Kai filled a cup, drank the water, and put the cup in the sink. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/mum-cracked-an-egg-whisked-it-and-cooked-it-837460.mp3 | Mum cracked an egg, whisked it, and cooked it in the pan. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/the-boy-kicked-the-ball-it-hit-the-goal-and-f3ea4b.mp3 | The boy kicked the ball, it hit the goal, and his team cheered. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/nia-brushed-the-dog-clipped-on-its-lead-and-50f7e5.mp3 | Nia brushed the dog, clipped on its lead, and took it for a walk. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/the-baker-mixed-dough-shaped-a-loaf-and-put-d40924.mp3 | The baker mixed dough, shaped a loaf, and put it in the oven. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/sam-brushed-his-teeth-put-on-pyjamas-and-cli-4b8622.mp3 | Sam brushed his teeth, put on pyjamas, and climbed into bed. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/the-child-found-paper-folded-a-plane-and-fle-c51424.mp3 | The child found paper, folded a plane, and flew it across the room. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/ivy-picked-an-apple-washed-it-and-took-a-bit-b04987.mp3 | Ivy picked an apple, washed it, and took a bite. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/the-boy-built-a-snowball-added-a-head-and-ga-fd397a.mp3 | The boy built a snowball, added a head, and gave the snowman a hat. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/ana-wrapped-the-gift-tied-a-bow-and-gave-it-bc7a7d.mp3 | Ana wrapped the gift, tied a bow, and gave it to her friend. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/the-class-dug-a-hole-planted-the-tree-and-wa-8b4183.mp3 | The class dug a hole, planted the tree, and watered its roots. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/leo-put-rubbish-in-a-bag-tied-it-shut-and-pl-114c15.mp3 | Leo put rubbish in a bag, tied it shut, and placed it in the bin. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/the-bus-stopped-the-doors-opened-and-the-chi-c014c8.mp3 | The bus stopped, the doors opened, and the children stepped off. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/rae-picked-up-a-pencil-drew-a-star-and-colou-5fe24a.mp3 | Rae picked up a pencil, drew a star, and coloured it red. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/max-opened-the-gate-led-the-pony-through-and-263f9a.mp3 | Max opened the gate, led the pony through, and shut the gate. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/the-frog-sat-jumped-into-the-pond-and-swam-a-d8676e.mp3 | The frog sat, jumped into the pond, and swam away. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/jo-poured-cereal-added-milk-and-ate-breakfas-f8d604.mp3 | Jo poured cereal, added milk, and ate breakfast. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/the-child-zipped-a-coat-put-on-a-hat-and-wen-a903a6.mp3 | The child zipped a coat, put on a hat, and went into the snow. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/mia-washed-a-plate-dried-it-and-put-it-on-th-845285.mp3 | Mia washed a plate, dried it, and put it on the shelf. Put the three pictures in story order. | 1 |
| /audio/assessment/v3/prompts/what-happened-right-before-the-jars-were-fil-17dd0c.mp3 | What happened right BEFORE the jars were filled? | 1 |
| /audio/assessment/v3/prompts/what-happened-right-after-the-first-crack-ap-784737.mp3 | What happened right AFTER the first crack appeared? | 1 |
| /audio/assessment/v3/prompts/when-did-the-lollipop-jar-come-down-f80b6e.mp3 | When did the lollipop jar come down? | 1 |
| /audio/assessment/v3/prompts/what-did-the-class-do-right-before-lunch-ff016d.mp3 | What did the class do right BEFORE lunch? | 1 |
| /audio/assessment/v3/prompts/when-did-the-plants-move-outside-eb2cc5.mp3 | When did the plants move outside? | 1 |
| /audio/assessment/v3/prompts/when-were-the-boots-cleaned-e99fde.mp3 | When were the boots cleaned? | 1 |
| /audio/assessment/v3/prompts/what-was-the-shadow-like-just-after-twelve-422f8f.mp3 | What was the shadow like just AFTER twelve? | 1 |
| /audio/assessment/v3/prompts/what-happened-right-before-the-books-went-ba-7d8106.mp3 | What happened right BEFORE the books went back? | 1 |
| /audio/assessment/v3/prompts/which-of-these-must-have-happened-first-befo-683998.mp3 | Which of these must have happened FIRST, before everything else? | 1 |
| /audio/assessment/v3/prompts/which-of-these-happened-last-after-all-the-r-7aef81.mp3 | Which of these happened LAST, after all the rest? | 1 |
| /audio/assessment/v3/prompts/which-of-these-must-have-happened-first-7a5908.mp3 | Which of these must have happened FIRST? | 2 |
| /audio/assessment/v3/prompts/what-must-have-happened-before-the-lifeguard-510cd3.mp3 | What must have happened BEFORE the lifeguard got the pole? | 1 |
| /audio/assessment/v3/prompts/which-of-these-happened-first-902cc3.mp3 | Which of these happened FIRST? | 1 |
| /audio/assessment/v3/prompts/which-of-these-came-first-long-before-tonigh-10b602.mp3 | Which of these came FIRST, long before tonight? | 1 |
| /audio/assessment/v3/prompts/which-of-these-must-have-happened-before-the-713cbf.mp3 | Which of these must have happened BEFORE the worms went in? | 1 |
| /audio/assessment/v3/prompts/which-goal-happened-first-91b44c.mp3 | Which goal happened FIRST? | 1 |
| /audio/assessment/v3/prompts/what-happens-right-after-the-box-is-emptied-39b248.mp3 | What happens right AFTER the box is emptied? | 1 |
| /audio/assessment/v3/prompts/what-happens-right-before-the-beans-are-roas-f967d9.mp3 | What happens right BEFORE the beans are roasted? | 1 |
| /audio/assessment/v3/prompts/what-happens-right-after-the-glass-is-smashe-837bdc.mp3 | What happens right AFTER the glass is smashed into crumbs? | 1 |
| /audio/assessment/v3/prompts/in-ari-s-list-what-happens-right-after-the-t-a248cc.mp3 | In Ari's list, what happens right AFTER the tooth goes under the pillow? | 1 |
| /audio/assessment/v3/prompts/what-do-the-bees-do-right-before-capping-the-2cef0a.mp3 | What do the bees do right BEFORE capping the cell? | 1 |
| /audio/assessment/v3/prompts/what-happens-right-after-the-crew-reach-the-61c541.mp3 | What happens right AFTER the crew reach the station? | 1 |
| /audio/assessment/v3/prompts/what-happens-right-after-the-book-comes-back-f211e3.mp3 | What happens right AFTER the book comes back through the slot? | 1 |
| /audio/assessment/v3/prompts/what-happens-right-before-the-vegetables-are-4da5b8.mp3 | What happens right BEFORE the vegetables are pulled? | 1 |
| /audio/assessment/v3/prompts/what-happened-right-before-the-marble-crosse-eac220.mp3 | What happened right BEFORE the marble crossed? | 1 |
| /audio/assessment/v3/prompts/when-was-the-garden-checked-for-hedgehogs-2eb2c3.mp3 | When was the garden checked for hedgehogs? | 1 |
| /audio/assessment/v3/prompts/which-of-these-happened-first-before-the-res-b9bae7.mp3 | Which of these happened FIRST, before the rest? | 1 |
| /audio/assessment/v3/prompts/what-happens-right-after-the-fleece-is-washe-b26e17.mp3 | What happens right AFTER the fleece is washed? | 1 |
| /audio/assessment/v3/prompts/what-happens-right-before-the-outdoor-pen-48bd16.mp3 | What happens right BEFORE the outdoor pen? | 1 |
| /audio/assessment/v3/prompts/what-happened-right-after-the-glove-was-put-335b20.mp3 | What happened right AFTER the glove was put on the wall? | 1 |
| /audio/assessment/v3/prompts/what-happens-right-after-the-cars-get-their-850306.mp3 | What happens right AFTER the cars get their red light? | 1 |
| /audio/assessment/v3/prompts/bag-which-vowel-do-you-hear-in-the-middle-of-c09c1c.mp3 | bag. Which vowel do you hear in the middle of bag? | 1 |
| /audio/assessment/v3/prompts/ram-which-vowel-do-you-hear-in-the-middle-of-ed5c09.mp3 | ram. Which vowel do you hear in the middle of ram? | 1 |
| /audio/assessment/v3/prompts/tap-which-vowel-do-you-hear-in-the-middle-of-5018e3.mp3 | tap. Which vowel do you hear in the middle of tap? | 1 |
| /audio/assessment/v3/prompts/hand-which-vowel-do-you-hear-in-the-middle-o-15d407.mp3 | hand. Which vowel do you hear in the middle of hand? | 1 |
| /audio/assessment/v3/prompts/flag-which-vowel-do-you-hear-in-the-middle-o-973156.mp3 | flag. Which vowel do you hear in the middle of flag? | 1 |
| /audio/assessment/v3/prompts/which-picture-s-word-has-the-short-a-sound-i-d06789.mp3 | Which picture's word has the short a sound in the middle? | 2 |
| /audio/assessment/v3/prompts/web-which-vowel-do-you-hear-in-the-middle-of-19be98.mp3 | web. Which vowel do you hear in the middle of web? | 1 |
| /audio/assessment/v3/prompts/ten-which-vowel-do-you-hear-in-the-middle-of-b966b8.mp3 | ten. Which vowel do you hear in the middle of ten? | 1 |
| /audio/assessment/v3/prompts/leg-which-vowel-do-you-hear-in-the-middle-of-cc183e.mp3 | leg. Which vowel do you hear in the middle of leg? | 1 |
| /audio/assessment/v3/prompts/nest-which-vowel-do-you-hear-in-the-middle-o-3cd499.mp3 | nest. Which vowel do you hear in the middle of nest? | 1 |
| /audio/assessment/v3/prompts/shell-which-vowel-do-you-hear-in-the-middle-be4826.mp3 | shell. Which vowel do you hear in the middle of shell? | 1 |
| /audio/assessment/v3/prompts/which-picture-s-word-has-the-short-e-sound-i-9b18b4.mp3 | Which picture's word has the short e sound in the middle? | 3 |
| /audio/assessment/v3/prompts/bin-which-vowel-do-you-hear-in-the-middle-of-944054.mp3 | bin. Which vowel do you hear in the middle of bin? | 1 |
| /audio/assessment/v3/prompts/zip-which-vowel-do-you-hear-in-the-middle-of-cebfe4.mp3 | zip. Which vowel do you hear in the middle of zip? | 1 |
| /audio/assessment/v3/prompts/hit-which-vowel-do-you-hear-in-the-middle-of-e3647f.mp3 | hit. Which vowel do you hear in the middle of hit? | 1 |
| /audio/assessment/v3/prompts/brick-which-vowel-do-you-hear-in-the-middle-45da53.mp3 | brick. Which vowel do you hear in the middle of brick? | 1 |
| /audio/assessment/v3/prompts/gift-which-vowel-do-you-hear-in-the-middle-o-624641.mp3 | gift. Which vowel do you hear in the middle of gift? | 1 |
| /audio/assessment/v3/prompts/which-picture-s-word-has-the-short-i-sound-i-65c9de.mp3 | Which picture's word has the short i sound in the middle? | 2 |
| /audio/assessment/v3/prompts/fox-which-vowel-do-you-hear-in-the-middle-of-6f9240.mp3 | fox. Which vowel do you hear in the middle of fox? | 1 |
| /audio/assessment/v3/prompts/mop-which-vowel-do-you-hear-in-the-middle-of-af5791.mp3 | mop. Which vowel do you hear in the middle of mop? | 1 |
| /audio/assessment/v3/prompts/dot-which-vowel-do-you-hear-in-the-middle-of-5cc2b3.mp3 | dot. Which vowel do you hear in the middle of dot? | 1 |
| /audio/assessment/v3/prompts/sock-which-vowel-do-you-hear-in-the-middle-o-9ef8f5.mp3 | sock. Which vowel do you hear in the middle of sock? | 1 |
| /audio/assessment/v3/prompts/clock-which-vowel-do-you-hear-in-the-middle-bcd6f9.mp3 | clock. Which vowel do you hear in the middle of clock? | 1 |
| /audio/assessment/v3/prompts/which-picture-s-word-has-the-short-o-sound-i-15d39e.mp3 | Which picture's word has the short o sound in the middle? | 3 |
| /audio/assessment/v3/prompts/jug-which-vowel-do-you-hear-in-the-middle-of-3114fd.mp3 | jug. Which vowel do you hear in the middle of jug? | 1 |
| /audio/assessment/v3/prompts/cup-which-vowel-do-you-hear-in-the-middle-of-c2dc16.mp3 | cup. Which vowel do you hear in the middle of cup? | 1 |
| /audio/assessment/v3/prompts/mud-which-vowel-do-you-hear-in-the-middle-of-ef5c97.mp3 | mud. Which vowel do you hear in the middle of mud? | 1 |
| /audio/assessment/v3/prompts/drum-which-vowel-do-you-hear-in-the-middle-o-616cbd.mp3 | drum. Which vowel do you hear in the middle of drum? | 1 |
| /audio/assessment/v3/prompts/brush-which-vowel-do-you-hear-in-the-middle-7eadf9.mp3 | brush. Which vowel do you hear in the middle of brush? | 1 |
| /audio/assessment/v3/prompts/which-picture-s-word-has-the-short-u-sound-i-c5dd5e.mp3 | Which picture's word has the short u sound in the middle? | 2 |
| /audio/assessment/v3/prompts/hen-which-vowel-do-you-hear-in-the-middle-of-edb35a.mp3 | hen. Which vowel do you hear in the middle of hen? | 1 |
| /audio/assessment/v3/prompts/hut-which-vowel-do-you-hear-in-the-middle-of-8987ac.mp3 | hut. Which vowel do you hear in the middle of hut? | 1 |
| /audio/assessment/v3/prompts/hop-which-vowel-do-you-hear-in-the-middle-of-afccd5.mp3 | hop. Which vowel do you hear in the middle of hop? | 1 |
| /audio/assessment/v3/prompts/sit-which-vowel-do-you-hear-in-the-middle-of-48c8eb.mp3 | sit. Which vowel do you hear in the middle of sit? | 1 |
| /audio/assessment/v3/prompts/crab-which-vowel-do-you-hear-in-the-middle-o-d9fbf0.mp3 | crab. Which vowel do you hear in the middle of crab? | 1 |
| /audio/assessment/v3/prompts/what-lesson-does-this-story-teach-cf01f3.mp3 | What lesson does this story teach? | 32 |
| /audio/assessment/v3/prompts/two-lessons-seem-possible-which-one-does-the-a9a6a0.mp3 | Two lessons seem possible. Which one does the story support MOST? | 6 |
| /audio/assessment/v3/prompts/which-lesson-fits-best-cff9a8.mp3 | Which lesson fits best? | 5 |
| /audio/assessment/v3/prompts/which-of-these-is-the-theme-not-just-what-ha-e3c71f.mp3 | Which of these is the THEME — not just what happened? | 10 |
| /audio/assessment/v3/prompts/which-new-situation-shows-the-same-lesson-10f03e.mp3 | Which new situation shows the SAME lesson? | 11 |
| /audio/assessment/v3/prompts/which-one-shows-a-doing-word-something-you-d-f62ea3.mp3 | Which one shows a doing word — something you do? | 4 |
| /audio/assessment/v3/prompts/which-word-is-a-doing-word-166fb9.mp3 | Which word is a doing word? | 15 |
| /audio/assessment/v3/prompts/which-one-shows-a-doing-word-something-you-d-1a4fc8.mp3 | Which one shows a doing word — something you do to things? | 5 |
| /audio/assessment/v3/prompts/which-one-shows-a-doing-word-something-you-d-435b67.mp3 | Which one shows a doing word — something you do every day? | 5 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-we-th-558f8d.mp3 | Which doing word finishes the sentence? We … the raft to the dock. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-the-t-d9737f.mp3 | Which doing word finishes the sentence? The twins … over the puddle. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-pleas-21ff4b.mp3 | Which doing word finishes the sentence? Please … the door quietly. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-owls-45add5.mp3 | Which doing word finishes the sentence? Owls … after dark. | 1 |
| /audio/assessment/v3/prompts/which-word-in-this-sentence-is-the-doing-wor-cdea5b.mp3 | Which word in this sentence is the doing word? "The pup chased its dinner." | 1 |
| /audio/assessment/v3/prompts/which-word-in-this-sentence-is-the-doing-wor-5e63e9.mp3 | Which word in this sentence is the doing word? "Gran knits thick socks." | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-crabs-f05a86.mp3 | Which doing word finishes the sentence? Crabs … across the sand. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-we-th-37baee.mp3 | Which doing word finishes the sentence? We … the seeds each morning. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-the-s-bd7dfe.mp3 | Which doing word finishes the sentence? The … swims fifty laps a day. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-the-t-37c9f0.mp3 | Which doing word finishes the sentence? The … twirled across the stage. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-the-f-9469fe.mp3 | Which doing word finishes the sentence? The frog … over the log in one big spring. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-the-s-2327ba.mp3 | Which doing word finishes the sentence? The soup … in the pot until bubbles rose. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-fits-best-for-water-falling-1640b6.mp3 | Which doing word fits best for water falling drop by drop? | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-she-t-a4595c.mp3 | Which doing word finishes the sentence? She … the note in half and half again. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-the-s-5628f3.mp3 | Which doing word finishes the sentence? The snail … along, leaving a silver line. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-he-th-5c826e.mp3 | Which doing word finishes the sentence? He … the balloon until it nearly burst. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-fits-best-for-moving-on-tip-602514.mp3 | Which doing word fits best for moving on tiptoe without a sound? | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-dad-t-d19126.mp3 | Which doing word finishes the sentence? Dad … the squeaky wheel with oil. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-bees-785787.mp3 | Which doing word finishes the sentence? Bees … from rose to rose. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-the-i-fbb417.mp3 | Which doing word finishes the sentence? The ice … slowly in the warm sun. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-the-w-2f89c0.mp3 | Which doing word finishes the sentence? The wind … the washing dry. | 1 |
| /audio/assessment/v3/prompts/which-doing-word-finishes-the-sentence-the-b-721408.mp3 | Which doing word finishes the sentence? The baby … at every funny face. | 1 |
| /audio/assessment/v3/prompts/rain-which-letters-finish-the-word-rain-51a7d1.mp3 | rain. Which letters finish the word rain? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-long-a-sound-4a06fe.mp3 | Which word has the long a sound? | 4 |
| /audio/assessment/v3/prompts/snail-which-is-the-real-way-to-write-snail-a6ee10.mp3 | snail. Which is the real way to write snail? | 1 |
| /audio/assessment/v3/prompts/paint-which-is-the-real-way-to-write-paint-ea9b3e.mp3 | paint. Which is the real way to write paint? | 1 |
| /audio/assessment/v3/prompts/play-which-letters-finish-the-word-play-d2ad43.mp3 | play. Which letters finish the word play? | 1 |
| /audio/assessment/v3/prompts/day-which-is-the-real-way-to-write-day-10cc79.mp3 | day. Which is the real way to write day? | 1 |
| /audio/assessment/v3/prompts/stay-which-is-the-real-way-to-write-stay-9fee14.mp3 | stay. Which is the real way to write stay? | 1 |
| /audio/assessment/v3/prompts/sheep-which-letters-finish-the-word-sheep-f11d76.mp3 | sheep. Which letters finish the word sheep? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-long-e-sound-fb0e51.mp3 | Which word has the long e sound? | 4 |
| /audio/assessment/v3/prompts/sheep-which-is-the-real-way-to-write-sheep-b859ab.mp3 | sheep. Which is the real way to write sheep? | 1 |
| /audio/assessment/v3/prompts/bee-which-is-the-real-way-to-write-bee-82e0c4.mp3 | bee. Which is the real way to write bee? | 1 |
| /audio/assessment/v3/prompts/leaf-which-letters-finish-the-word-leaf-c85d06.mp3 | leaf. Which letters finish the word leaf? | 1 |
| /audio/assessment/v3/prompts/meat-which-letters-finish-the-word-meat-aa0f47.mp3 | meat. Which letters finish the word meat? | 1 |
| /audio/assessment/v3/prompts/which-word-does-not-have-the-long-e-sound-e7a871.mp3 | Which word does not have the long e sound? | 2 |
| /audio/assessment/v3/prompts/beach-which-is-the-real-way-to-write-beach-dc45cb.mp3 | beach. Which is the real way to write beach? | 1 |
| /audio/assessment/v3/prompts/boat-which-letters-finish-the-word-boat-dbb667.mp3 | boat. Which letters finish the word boat? | 1 |
| /audio/assessment/v3/prompts/goat-which-letters-finish-the-word-goat-3c29ea.mp3 | goat. Which letters finish the word goat? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-long-o-sound-35a0a2.mp3 | Which word has the long o sound? | 2 |
| /audio/assessment/v3/prompts/boat-which-is-the-real-way-to-write-boat-56a981.mp3 | boat. Which is the real way to write boat? | 1 |
| /audio/assessment/v3/prompts/coat-which-is-the-real-way-to-write-coat-d0fa6f.mp3 | coat. Which is the real way to write coat? | 1 |
| /audio/assessment/v3/prompts/light-which-letters-finish-the-word-light-3c6cd4.mp3 | light. Which letters finish the word light? | 1 |
| /audio/assessment/v3/prompts/night-which-letters-finish-the-word-night-c54a18.mp3 | night. Which letters finish the word night? | 1 |
| /audio/assessment/v3/prompts/which-word-has-the-long-i-sound-ac15a5.mp3 | Which word has the long i sound? | 2 |
| /audio/assessment/v3/prompts/light-which-is-the-real-way-to-write-light-75b089.mp3 | light. Which is the real way to write light? | 1 |
| /audio/assessment/v3/prompts/night-which-is-the-real-way-to-write-night-84ec1d.mp3 | night. Which is the real way to write night? | 1 |
| /audio/assessment/v3/prompts/moon-which-letters-finish-the-word-moon-852175.mp3 | moon. Which letters finish the word moon? | 1 |
| /audio/assessment/v3/prompts/blue-which-word-has-the-same-middle-sound-as-714a0b.mp3 | blue. Which word has the same middle sound as blue? | 1 |
| /audio/assessment/v3/prompts/glue-which-word-has-the-same-middle-sound-as-622c58.mp3 | glue. Which word has the same middle sound as glue? | 1 |
| /audio/assessment/v3/prompts/which-word-does-not-have-the-oo-as-in-moon-s-3af107.mp3 | Which word does not have the oo (as in moon) sound? | 3 |
| /audio/assessment/v3/prompts/grow-which-letters-finish-the-word-grow-bc6766.mp3 | grow. Which letters finish the word grow? | 1 |
| /audio/assessment/v3/prompts/boat-which-word-has-the-same-middle-sound-as-ad6fcb.mp3 | boat. Which word has the same middle sound as boat? | 1 |
| /audio/assessment/v3/prompts/loud-which-word-has-the-same-middle-sound-as-b46f14.mp3 | loud. Which word has the same middle sound as loud? | 1 |
| /audio/assessment/v3/prompts/which-word-does-not-have-the-ow-as-in-cow-so-d14fa6.mp3 | Which word does not have the ow (as in cow) sound? | 1 |
| /audio/assessment/v3/prompts/which-word-does-not-have-the-ow-as-in-snow-s-44ce58.mp3 | Which word does not have the ow (as in snow) sound? | 2 |
| /audio/assessment/v3/prompts/cloud-which-letters-finish-the-word-cloud-458464.mp3 | cloud. Which letters finish the word cloud? | 1 |
| /audio/assessment/v3/prompts/house-which-letters-finish-the-word-house-bebfa5.mp3 | house. Which letters finish the word house? | 1 |
| /audio/assessment/v3/prompts/cow-which-word-has-the-same-middle-sound-as-a878ed.mp3 | cow. Which word has the same middle sound as cow? | 1 |
| /audio/assessment/v3/prompts/how-which-word-has-the-same-middle-sound-as-b7fbe8.mp3 | how. Which word has the same middle sound as how? | 1 |
| /audio/assessment/v3/prompts/which-word-does-not-have-the-ou-as-in-cloud-d41d49.mp3 | Which word does not have the ou (as in cloud) sound? | 2 |
| /audio/assessment/v3/prompts/coin-which-letters-finish-the-word-coin-387c50.mp3 | coin. Which letters finish the word coin? | 1 |
| /audio/assessment/v3/prompts/boil-which-letters-finish-the-word-boil-e32329.mp3 | boil. Which letters finish the word boil? | 1 |
| /audio/assessment/v3/prompts/toy-which-word-has-the-same-middle-sound-as-4ec2a9.mp3 | toy. Which word has the same middle sound as toy? | 1 |
| /audio/assessment/v3/prompts/boy-which-word-has-the-same-middle-sound-as-16eb1e.mp3 | boy. Which word has the same middle sound as boy? | 1 |
| /audio/assessment/v3/prompts/coin-which-is-the-real-way-to-write-coin-49e553.mp3 | coin. Which is the real way to write coin? | 1 |
| /audio/assessment/v3/prompts/point-which-is-the-real-way-to-write-point-88fd36.mp3 | point. Which is the real way to write point? | 1 |
| /audio/assessment/v3/prompts/boy-which-letters-finish-the-word-boy-fd6bde.mp3 | boy. Which letters finish the word boy? | 1 |
| /audio/assessment/v3/prompts/joy-which-letters-finish-the-word-joy-d18472.mp3 | joy. Which letters finish the word joy? | 1 |
| /audio/assessment/v3/prompts/coin-which-word-has-the-same-middle-sound-as-d1fe46.mp3 | coin. Which word has the same middle sound as coin? | 1 |
| /audio/assessment/v3/prompts/oil-which-word-has-the-same-middle-sound-as-f3e490.mp3 | oil. Which word has the same middle sound as oil? | 1 |
| /audio/assessment/v3/prompts/boy-which-is-the-real-way-to-write-boy-ab0775.mp3 | boy. Which is the real way to write boy? | 1 |
| /audio/assessment/v3/prompts/toy-which-is-the-real-way-to-write-toy-b58d14.mp3 | toy. Which is the real way to write toy? | 1 |
| /audio/assessment/v3/prompts/screw-which-letters-finish-the-word-screw-d51daa.mp3 | screw. Which letters finish the word screw? | 1 |
| /audio/assessment/v3/prompts/chew-which-letters-finish-the-word-chew-d5d38a.mp3 | chew. Which letters finish the word chew? | 1 |
| /audio/assessment/v3/prompts/moon-which-word-has-the-same-middle-sound-as-17e7d8.mp3 | moon. Which word has the same middle sound as moon? | 1 |
| /audio/assessment/v3/prompts/zoo-which-word-has-the-same-middle-sound-as-29a1e4.mp3 | zoo. Which word has the same middle sound as zoo? | 1 |
| /audio/assessment/v3/prompts/new-which-is-the-real-way-to-write-new-dc6a28.mp3 | new. Which is the real way to write new? | 1 |
| /audio/assessment/v3/prompts/grew-which-is-the-real-way-to-write-grew-3c1be1.mp3 | grew. Which is the real way to write grew? | 1 |
| /audio/assessment/v3/prompts/yawn-which-letters-finish-the-word-yawn-741635.mp3 | yawn. Which letters finish the word yawn? | 1 |
| /audio/assessment/v3/prompts/ball-which-word-has-the-same-middle-sound-as-aad589.mp3 | ball. Which word has the same middle sound as ball? | 2 |
| /audio/assessment/v3/prompts/tall-which-word-has-the-same-middle-sound-as-e043ae.mp3 | tall. Which word has the same middle sound as tall? | 1 |
| /audio/assessment/v3/prompts/saw-which-is-the-real-way-to-write-saw-d7824f.mp3 | saw. Which is the real way to write saw? | 1 |
| /audio/assessment/v3/prompts/claw-which-is-the-real-way-to-write-claw-dd2f2d.mp3 | claw. Which is the real way to write claw? | 1 |
| /audio/assessment/v3/prompts/tail-which-letters-finish-the-word-tail-362d92.mp3 | tail. Which letters finish the word tail? | 1 |
| /audio/assessment/v3/prompts/toast-which-letters-finish-the-word-toast-d0db2d.mp3 | toast. Which letters finish the word toast? | 1 |
| /audio/assessment/v3/prompts/flew-which-word-has-the-same-middle-sound-as-bc43e6.mp3 | flew. Which word has the same middle sound as flew? | 1 |
| /audio/assessment/v3/prompts/rain-which-is-the-real-way-to-write-rain-6788ac.mp3 | rain. Which is the real way to write rain? | 1 |
| /audio/assessment/v3/prompts/road-which-letters-finish-the-word-road-ffe473.mp3 | road. Which letters finish the word road? | 1 |
| /audio/assessment/v3/prompts/joy-which-word-has-the-same-middle-sound-as-2fbcb1.mp3 | joy. Which word has the same middle sound as joy? | 1 |
| /audio/assessment/v3/prompts/new-which-letters-finish-the-word-new-6b8c59.mp3 | new. Which letters finish the word new? | 1 |
| /audio/assessment/v3/prompts/crawl-which-letters-finish-the-word-crawl-2721a4.mp3 | crawl. Which letters finish the word crawl? | 1 |

## 2. Sentence read-alouds — voice the … as a short pause

| File | Script | Used by |
|---|---|---|
| /audio/assessment/v3/sentences/the-soup-burned-my-lip-e90728.mp3 | The … soup burned my lip. | 1 |
| /audio/assessment/v3/sentences/my-boots-let-the-rain-in-23f214.mp3 | My … boots let the rain in. | 1 |
| /audio/assessment/v3/sentences/the-box-needed-two-of-us-to-lift-e43c39.mp3 | The … box needed two of us to lift. | 1 |
| /audio/assessment/v3/sentences/we-squinted-in-the-sunshine-26bf3d.mp3 | We squinted in the … sunshine. | 1 |
| /audio/assessment/v3/sentences/the-kitten-slept-through-the-storm-a9328e.mp3 | The … kitten slept through the storm. | 1 |
| /audio/assessment/v3/sentences/her-scarf-trailed-on-the-ground-20efd2.mp3 | Her … scarf trailed on the ground. | 1 |
| /audio/assessment/v3/sentences/the-path-was-after-days-of-rain-cb2ba8.mp3 | The path was … after days of rain. | 1 |
| /audio/assessment/v3/sentences/the-lemonade-was-enough-to-make-us-wince-b37c55.mp3 | The lemonade was … enough to make us wince. | 1 |
| /audio/assessment/v3/sentences/the-old-stairs-were-under-our-feet-dbf49c.mp3 | The old stairs were … under our feet. | 1 |
| /audio/assessment/v3/sentences/wear-the-coat-it-is-snowing-hard-5bca55.mp3 | Wear the … coat — it is snowing hard. | 1 |
| /audio/assessment/v3/sentences/the-knife-went-through-the-pumpkin-easily-36f0ac.mp3 | The … knife went through the pumpkin easily. | 1 |
| /audio/assessment/v3/sentences/our-tent-felt-with-five-of-us-in-it-2ef8d3.mp3 | Our tent felt … with five of us in it. | 1 |
| /audio/assessment/v3/sentences/the-sea-tossed-the-little-boat-11b424.mp3 | The … sea tossed the little boat. | 1 |
| /audio/assessment/v3/sentences/a-morning-is-best-for-kites-ae0879.mp3 | A … morning is best for kites. | 1 |
| /audio/assessment/v3/sentences/the-floor-squeaked-with-every-step-787746.mp3 | The … floor squeaked with every step. | 1 |
| /audio/assessment/v3/sentences/the-rope-was-too-to-snap-3d4df7.mp3 | The rope was too … to snap. | 1 |
| /audio/assessment/v3/sentences/the-moth-circled-the-lamp-a01f53.mp3 | The … moth circled the lamp. | 1 |
| /audio/assessment/v3/sentences/the-kitten-is-tame-the-tiger-is-f838ce.mp3 | The kitten is tame. The tiger is …. | 1 |
| /audio/assessment/v3/sentences/this-puzzle-is-simple-its-opposite-is-4302e3.mp3 | This puzzle is simple. Its opposite is …. | 1 |
| /audio/assessment/v3/sentences/the-mouse-is-not-just-small-it-is-ae45e7.mp3 | The mouse is not just small. It is …. | 1 |
| /audio/assessment/v3/sentences/not-just-cold-the-pond-was-this-morning-467278.mp3 | Not just cold — the pond was … this morning. | 1 |
| /audio/assessment/v3/sentences/the-morning-was-noisy-the-night-was-6254f6.mp3 | The morning was noisy. The night was …. | 1 |
| /audio/assessment/v3/sentences/this-bag-is-heavy-that-bag-is-716354.mp3 | This bag is heavy. That bag is …. | 1 |
| /audio/assessment/v3/sentences/the-turtle-is-slow-the-hare-is-823d9f.mp3 | The turtle is slow. The hare is …. | 1 |
| /audio/assessment/v3/sentences/my-hands-were-dirty-now-they-are-ffdb31.mp3 | My hands were dirty. Now they are …. | 1 |
| /audio/assessment/v3/sentences/dad-fixed-the-gate-dad-also-the-fence-f6d8bc.mp3 | Dad fixed the gate. Dad also … the fence. | 1 |
| /audio/assessment/v3/sentences/the-soup-was-tasty-its-twin-word-is-16114a.mp3 | The soup was tasty. Its twin word is …. | 1 |
| /audio/assessment/v3/sentences/we-shouted-with-joy-joy-s-twin-word-is-f397ba.mp3 | We shouted with joy. Joy's twin word is …. | 1 |
| /audio/assessment/v3/sentences/the-path-was-narrow-its-twin-word-is-26a094.mp3 | The path was narrow. Its twin word is …. | 1 |
| /audio/assessment/v3/sentences/the-oven-is-hot-the-fridge-is-a81e54.mp3 | The oven is hot. The fridge is …. | 1 |
| /audio/assessment/v3/sentences/the-old-map-was-torn-it-was-adf97c.mp3 | The old map was torn. It was …. | 1 |
| /audio/assessment/v3/sentences/i-see-red-hen-86e468.mp3 | I see … red hen. | 1 |
| /audio/assessment/v3/sentences/we-had-nap-at-two-60c85a.mp3 | We had … nap at two. | 1 |
| /audio/assessment/v3/sentences/we-have-jam-bread-55569e.mp3 | We have jam … bread. | 1 |
| /audio/assessment/v3/sentences/she-has-a-cat-a-dog-5d866b.mp3 | She has a cat … a dog. | 1 |
| /audio/assessment/v3/sentences/the-pigs-in-the-mud-9b9bad.mp3 | The pigs … in the mud. | 1 |
| /audio/assessment/v3/sentences/you-my-best-pal-6188c0.mp3 | You … my best pal. | 1 |
| /audio/assessment/v3/sentences/it-is-big-a-bus-46c46b.mp3 | It is big … a bus. | 1 |
| /audio/assessment/v3/sentences/sam-is-fast-a-fox-a0512c.mp3 | Sam is fast … a fox. | 1 |
| /audio/assessment/v3/sentences/we-nap-two-3de4d4.mp3 | We nap … two. | 1 |
| /audio/assessment/v3/sentences/the-bus-stops-my-home-92a770.mp3 | The bus stops … my home. | 1 |
| /audio/assessment/v3/sentences/you-can-my-helper-55a2a0.mp3 | You can … my helper. | 1 |
| /audio/assessment/v3/sentences/it-will-hot-at-two-b3faa9.mp3 | It will … hot at two. | 1 |
| /audio/assessment/v3/sentences/this-gift-is-you-71a652.mp3 | This gift is … you. | 1 |
| /audio/assessment/v3/sentences/we-ran-the-bus-7fc6a8.mp3 | We ran … the bus. | 1 |
| /audio/assessment/v3/sentences/the-card-is-gran-aee0ec.mp3 | The card is … Gran. | 1 |
| /audio/assessment/v3/sentences/he-ran-back-the-park-8cb348.mp3 | He ran back … the park. | 1 |
| /audio/assessment/v3/sentences/we-ten-hens-e5fbc1.mp3 | We … ten hens. | 1 |
| /audio/assessment/v3/sentences/they-a-big-red-van-ee1d99.mp3 | They … a big red van. | 1 |
| /audio/assessment/v3/sentences/dad-is-tall-has-big-boots-25352b.mp3 | Dad is tall. … has big boots. | 1 |
| /audio/assessment/v3/sentences/ben-naps-is-in-bed-5720e1.mp3 | Ben naps. … is in bed. | 1 |
| /audio/assessment/v3/sentences/sam-hurt-leg-79c2d9.mp3 | Sam hurt … leg. | 1 |
| /audio/assessment/v3/sentences/the-dog-wags-tail-e63cdf.mp3 | The dog wags … tail. | 1 |
| /audio/assessment/v3/sentences/mom-and-bake-buns-cb6538.mp3 | Mom and … bake buns. | 1 |
| /audio/assessment/v3/sentences/may-have-a-go-ee8f18.mp3 | May … have a go? | 1 |
| /audio/assessment/v3/sentences/the-jam-is-the-jar-c02180.mp3 | The jam is … the jar. | 1 |
| /audio/assessment/v3/sentences/the-fish-swim-the-sea-ab8e7b.mp3 | The fish swim … the sea. | 1 |
| /audio/assessment/v3/sentences/the-sun-hot-e9154d.mp3 | The sun … hot. | 1 |
| /audio/assessment/v3/sentences/my-cup-full-7242f0.mp3 | My cup … full. | 1 |
| /audio/assessment/v3/sentences/the-egg-fell-has-a-crack-88743f.mp3 | The egg fell. … has a crack. | 1 |
| /audio/assessment/v3/sentences/i-like-the-hat-is-red-4cfd0f.mp3 | I like the hat. … is red. | 1 |
| /audio/assessment/v3/sentences/i-want-a-cup-milk-f7504f.mp3 | I want a cup … milk. | 1 |
| /audio/assessment/v3/sentences/that-is-a-map-the-zoo-49dadb.mp3 | That is a map … the zoo. | 1 |
| /audio/assessment/v3/sentences/the-cat-naps-the-rug-5f84ba.mp3 | The cat naps … the rug. | 1 |
| /audio/assessment/v3/sentences/put-the-lid-the-pot-a5ed2c.mp3 | Put the lid … the pot. | 1 |
| /audio/assessment/v3/sentences/see-ship-far-far-out-bc6325.mp3 | See … ship far, far out? | 1 |
| /audio/assessment/v3/sentences/i-sang-song-long-ago-38e884.mp3 | I sang … song long ago. | 1 |
| /audio/assessment/v3/sentences/look-at-big-red-sun-25e392.mp3 | Look at … big red sun! | 1 |
| /audio/assessment/v3/sentences/we-fed-hens-at-six-9fc68f.mp3 | We fed … hens at six. | 1 |
| /audio/assessment/v3/sentences/the-pigs-sat-are-muddy-e14d08.mp3 | The pigs sat. … are muddy! | 1 |
| /audio/assessment/v3/sentences/my-socks-are-wet-27e800.mp3 | My socks? … are wet. | 1 |
| /audio/assessment/v3/sentences/look-at-bug-on-my-hand-50aeb2.mp3 | Look at … bug on my hand! | 1 |
| /audio/assessment/v3/sentences/hat-here-is-mine-1835e8.mp3 | … hat here is mine. | 1 |
| /audio/assessment/v3/sentences/we-go-the-park-510496.mp3 | We go … the park. | 1 |
| /audio/assessment/v3/sentences/i-gave-the-pen-ben-3a6690.mp3 | I gave the pen … Ben. | 1 |
| /audio/assessment/v3/sentences/the-cat-on-the-bed-67f5fc.mp3 | The cat … on the bed. | 1 |
| /audio/assessment/v3/sentences/the-milk-cold-de7104.mp3 | The milk … cold. | 1 |
| /audio/assessment/v3/sentences/i-hop-my-dog-26a8dc.mp3 | I hop … my dog. | 1 |
| /audio/assessment/v3/sentences/she-sang-me-at-camp-722b26.mp3 | She sang … me at camp. | 1 |
| /audio/assessment/v3/sentences/are-my-best-pal-4c7b96.mp3 | … are my best pal. | 1 |
| /audio/assessment/v3/sentences/can-see-the-big-top-8e6fff.mp3 | Can … see the big top? | 1 |
| /audio/assessment/v3/sentences/he-has-pet-rat-1450c5.mp3 | He has … pet rat. | 1 |
| /audio/assessment/v3/sentences/i-met-vet-today-f21bc3.mp3 | I met … vet today. | 1 |
| /audio/assessment/v3/sentences/six-ten-make-sixteen-f46dc0.mp3 | Six … ten make sixteen. | 1 |
| /audio/assessment/v3/sentences/mum-gran-sat-down-a84f88.mp3 | Mum … Gran sat down. | 1 |
| /audio/assessment/v3/sentences/the-cubs-so-soft-ff74ad.mp3 | The cubs … so soft. | 1 |
| /audio/assessment/v3/sentences/my-hands-cold-8e1c91.mp3 | My hands … cold. | 1 |
| /audio/assessment/v3/sentences/he-is-fast-a-jet-475e7f.mp3 | He is fast … a jet. | 1 |
| /audio/assessment/v3/sentences/it-is-cold-ice-bcf838.mp3 | It is cold … ice. | 1 |
| /audio/assessment/v3/sentences/we-met-the-pond-126ba5.mp3 | We met … the pond. | 1 |
| /audio/assessment/v3/sentences/look-my-sandcastle-b302a3.mp3 | Look … my sandcastle! | 1 |
| /audio/assessment/v3/sentences/dad-will-back-soon-13b2f8.mp3 | Dad will … back soon. | 1 |
| /audio/assessment/v3/sentences/it-can-windy-up-here-8873cf.mp3 | It can … windy up here. | 1 |
| /audio/assessment/v3/sentences/this-bun-is-gran-46b0fe.mp3 | This bun is … Gran. | 1 |
| /audio/assessment/v3/sentences/we-sang-the-class-5a3d5c.mp3 | We sang … the class. | 1 |
| /audio/assessment/v3/sentences/the-gift-came-gramps-f94d9c.mp3 | The gift came … Gramps. | 1 |
| /audio/assessment/v3/sentences/milk-comes-cows-32a7eb.mp3 | Milk comes … cows. | 1 |
| /audio/assessment/v3/sentences/the-twins-red-hats-391f78.mp3 | The twins … red hats. | 1 |
| /audio/assessment/v3/sentences/we-six-eggs-left-aa723a.mp3 | We … six eggs left. | 1 |
| /audio/assessment/v3/sentences/gramps-naps-when-can-a49913.mp3 | Gramps naps when … can. | 1 |
| /audio/assessment/v3/sentences/tom-grins-when-wins-250d40.mp3 | Tom grins when … wins. | 1 |
| /audio/assessment/v3/sentences/dan-lost-left-sock-baffcf.mp3 | Dan lost … left sock. | 1 |
| /audio/assessment/v3/sentences/the-king-sat-on-throne-c314f5.mp3 | The king sat on … throne. | 1 |
| /audio/assessment/v3/sentences/mum-and-swim-on-sundays-655edb.mp3 | Mum and … swim on Sundays. | 1 |
| /audio/assessment/v3/sentences/may-pet-the-pup-3a859f.mp3 | May … pet the pup? | 1 |
| /audio/assessment/v3/sentences/the-frogs-hop-the-pond-e64474.mp3 | The frogs hop … the pond. | 1 |
| /audio/assessment/v3/sentences/pop-the-coins-the-tin-176beb.mp3 | Pop the coins … the tin. | 1 |
| /audio/assessment/v3/sentences/the-soup-hot-8ffbeb.mp3 | The soup … hot. | 1 |
| /audio/assessment/v3/sentences/my-bike-new-bc5e79.mp3 | My bike … new. | 1 |
| /audio/assessment/v3/sentences/the-nest-sits-up-high-114a46.mp3 | The nest? … sits up high. | 1 |
| /audio/assessment/v3/sentences/grab-the-rope-and-pull-d5ddbc.mp3 | Grab the rope and pull …! | 1 |
| /audio/assessment/v3/sentences/i-had-a-mug-milk-1d8c76.mp3 | I had a mug … milk. | 1 |
| /audio/assessment/v3/sentences/here-is-a-box-pins-ae5448.mp3 | Here is a box … pins. | 1 |
| /audio/assessment/v3/sentences/the-clock-hangs-the-wall-a0062e.mp3 | The clock hangs … the wall. | 1 |
| /audio/assessment/v3/sentences/hop-the-bus-quick-63f546.mp3 | Hop … the bus, quick! | 1 |
| /audio/assessment/v3/sentences/who-left-mess-there-cb53de.mp3 | Who left … mess there? | 1 |
| /audio/assessment/v3/sentences/i-drew-map-myself-fd295a.mp3 | I drew … map myself. | 1 |
| /audio/assessment/v3/sentences/shut-gate-please-e31294.mp3 | Shut … gate, please. | 1 |
| /audio/assessment/v3/sentences/feed-fish-at-nine-2cae73.mp3 | Feed … fish at nine. | 1 |
| /audio/assessment/v3/sentences/the-elves-hid-well-38f290.mp3 | The elves? … hid well. | 1 |
| /audio/assessment/v3/sentences/my-boots-got-wet-e9a4d2.mp3 | My boots? … got wet. | 1 |
| /audio/assessment/v3/sentences/smell-rose-right-here-32519a.mp3 | Smell … rose right here. | 1 |
| /audio/assessment/v3/sentences/hold-end-of-the-rope-192de3.mp3 | Hold … end of the rope. | 1 |
| /audio/assessment/v3/sentences/we-row-the-dock-8096d3.mp3 | We row … the dock. | 1 |
| /audio/assessment/v3/sentences/pass-the-jam-gran-4ae4d5.mp3 | Pass the jam … Gran. | 1 |
| /audio/assessment/v3/sentences/the-soup-too-hot-c04588.mp3 | The soup … too hot. | 1 |
| /audio/assessment/v3/sentences/the-trip-so-much-fun-79ab49.mp3 | The trip … so much fun. | 1 |
| /audio/assessment/v3/sentences/come-camp-us-55f901.mp3 | Come camp … us! | 1 |
| /audio/assessment/v3/sentences/mix-the-eggs-a-fork-e68678.mp3 | Mix the eggs … a fork. | 1 |
| /audio/assessment/v3/sentences/did-see-the-comet-78c903.mp3 | Did … see the comet? | 1 |
| /audio/assessment/v3/sentences/i-made-this-card-for-a4a6c1.mp3 | I made this card for …. | 1 |
| /audio/assessment/v3/sentences/she-fed-small-lamb-a71a8c.mp3 | She fed … small lamb. | 1 |
| /audio/assessment/v3/sentences/i-baked-this-dad-9539fb.mp3 | I baked this … Dad. | 1 |
| /audio/assessment/v3/sentences/the-pond-full-of-frogs-56a8d8.mp3 | The pond … full of frogs. | 1 |
| /audio/assessment/v3/sentences/the-ducks-swam-off-13c032.mp3 | The ducks? … swam off. | 1 |
| /audio/assessment/v3/sentences/sweep-steps-please-2aabf6.mp3 | Sweep … steps, please. | 1 |
| /audio/assessment/v3/sentences/can-lift-this-log-ff0077.mp3 | Can … lift this log? | 1 |
| /audio/assessment/v3/sentences/we-hid-the-rain-d9333f.mp3 | We hid … the rain. | 1 |
| /audio/assessment/v3/sentences/bob-packs-own-lunch-ff9d02.mp3 | Bob packs … own lunch. | 1 |
| /audio/assessment/v3/sentences/she-fed-of-the-cats-1b8b5b.mp3 | She fed … of the cats. | 1 |
| /audio/assessment/v3/sentences/he-drank-the-milk-the-jug-is-empty-d16c72.mp3 | He drank … the milk. The jug is empty! | 1 |
| /audio/assessment/v3/sentences/i-ate-egg-1f7832.mp3 | I ate … egg. | 1 |
| /audio/assessment/v3/sentences/she-saw-owl-at-dusk-b1a531.mp3 | She saw … owl at dusk. | 1 |
| /audio/assessment/v3/sentences/i-ran-fast-i-missed-the-bus-f339d0.mp3 | I ran fast, … I missed the bus. | 1 |
| /audio/assessment/v3/sentences/the-sun-is-out-it-is-cold-c988bd.mp3 | The sun is out, … it is cold. | 1 |
| /audio/assessment/v3/sentences/the-nest-is-the-gate-389323.mp3 | The nest is … the gate. | 1 |
| /audio/assessment/v3/sentences/we-sat-the-pond-f91751.mp3 | We sat … the pond. | 1 |
| /audio/assessment/v3/sentences/you-hop-like-a-frog-f60fcb.mp3 | … you hop like a frog? | 1 |
| /audio/assessment/v3/sentences/the-twins-swim-fast-aec31c.mp3 | The twins … swim fast. | 1 |
| /audio/assessment/v3/sentences/you-like-plums-c6ca9b.mp3 | … you like plums? | 1 |
| /audio/assessment/v3/sentences/what-cows-eat-f9298e.mp3 | What … cows eat? | 1 |
| /audio/assessment/v3/sentences/kid-got-a-badge-f2470e.mp3 | … kid got a badge. | 1 |
| /audio/assessment/v3/sentences/put-a-cup-at-desk-b1d293.mp3 | Put a cup at … desk. | 1 |
| /audio/assessment/v3/sentences/last-week-we-a-picnic-30fb56.mp3 | Last week we … a picnic. | 1 |
| /audio/assessment/v3/sentences/gran-six-cats-long-ago-b78334.mp3 | Gran … six cats long ago. | 1 |
| /audio/assessment/v3/sentences/do-you-make-jam-38f25f.mp3 | … do you make jam? | 1 |
| /audio/assessment/v3/sentences/tell-me-the-trick-works-4fca4e.mp3 | Tell me … the trick works. | 1 |
| /audio/assessment/v3/sentences/ask-me-you-get-stuck-31b3c4.mp3 | Ask me … you get stuck. | 1 |
| /audio/assessment/v3/sentences/it-rains-we-stay-in-17372f.mp3 | … it rains, we stay in. | 1 |
| /audio/assessment/v3/sentences/the-sums-are-hard-they-are-easy-8b320d.mp3 | The sums are … hard — they are easy! | 1 |
| /audio/assessment/v3/sentences/that-is-my-hat-143037.mp3 | That is … my hat! | 1 |
| /audio/assessment/v3/sentences/i-have-just-wish-9df0a2.mp3 | I have just … wish. | 1 |
| /audio/assessment/v3/sentences/duck-swam-off-two-stayed-52158b.mp3 | … duck swam off; two stayed. | 1 |
| /audio/assessment/v3/sentences/do-you-want-jam-ham-3ab14a.mp3 | Do you want jam … ham? | 1 |
| /audio/assessment/v3/sentences/is-the-cup-full-empty-6f779b.mp3 | Is the cup full … empty? | 1 |
| /audio/assessment/v3/sentences/mum-we-can-camp-4989bd.mp3 | Mum … we can camp! | 1 |
| /audio/assessment/v3/sentences/dad-yes-at-last-721253.mp3 | Dad … yes at last. | 1 |
| /audio/assessment/v3/sentences/my-aunt-naps-when-can-57aea4.mp3 | My aunt naps when … can. | 1 |
| /audio/assessment/v3/sentences/gran-hums-as-bakes-c4830c.mp3 | Gran hums as … bakes. | 1 |
| /audio/assessment/v3/sentences/the-twins-lost-kite-ff9393.mp3 | The twins lost … kite. | 1 |
| /audio/assessment/v3/sentences/the-cubs-drank-milk-72f605.mp3 | The cubs drank … milk. | 1 |
| /audio/assessment/v3/sentences/look-the-bus-is-over-c7dc0a.mp3 | Look — the bus is over …! | 1 |
| /audio/assessment/v3/sentences/we-got-just-in-time-a4ff96.mp3 | We got … just in time. | 1 |
| /audio/assessment/v3/sentences/the-key-to-open-the-box-5a42e8.mp3 | … the key to open the box. | 1 |
| /audio/assessment/v3/sentences/we-mud-to-make-bricks-dc410c.mp3 | We … mud to make bricks. | 1 |
| /audio/assessment/v3/sentences/sis-and-i-hid-both-grinned-e26f99.mp3 | Sis and I hid. … both grinned. | 1 |
| /audio/assessment/v3/sentences/dad-and-i-fish-catch-cod-7579a3.mp3 | Dad and I fish. … catch cod! | 1 |
| /audio/assessment/v3/sentences/the-shops-shut-at-ten-324a2c.mp3 | The shops … shut at ten. | 1 |
| /audio/assessment/v3/sentences/you-so-brave-at-the-vet-329d61.mp3 | You … so brave at the vet! | 1 |
| /audio/assessment/v3/sentences/is-in-the-big-box-ee5449.mp3 | … is in the big box? | 1 |
| /audio/assessment/v3/sentences/guess-i-made-for-you-b2f3e0.mp3 | Guess … I made for you! | 1 |
| /audio/assessment/v3/sentences/does-the-show-start-edab9e.mp3 | … does the show start? | 1 |
| /audio/assessment/v3/sentences/i-clap-you-sing-68b220.mp3 | I clap … you sing. | 1 |
| /audio/assessment/v3/sentences/hat-is-yours-red-or-blue-d5bcbd.mp3 | … hat is yours — red or blue? | 1 |
| /audio/assessment/v3/sentences/tell-me-pup-you-like-best-b39b48.mp3 | Tell me … pup you like best. | 1 |
| /audio/assessment/v3/sentences/we-read-six-new-today-40468f.mp3 | We read six new … today. | 1 |
| /audio/assessment/v3/sentences/big-can-be-fun-to-spell-dd6a99.mp3 | Big … can be fun to spell. | 1 |
| /audio/assessment/v3/sentences/is-this-scarf-e673e4.mp3 | Is this … scarf? | 1 |
| /audio/assessment/v3/sentences/pack-bags-for-camp-7fc8d6.mp3 | Pack … bags for camp. | 1 |
| /audio/assessment/v3/sentences/we-ate-the-grapes-f0f29c.mp3 | We ate … the grapes. | 1 |
| /audio/assessment/v3/sentences/my-pens-ran-out-b7d263.mp3 | … my pens ran out. | 1 |
| /audio/assessment/v3/sentences/he-fed-ox-at-the-farm-8b01e8.mp3 | He fed … ox at the farm. | 1 |
| /audio/assessment/v3/sentences/i-need-extra-bed-933fa7.mp3 | I need … extra bed. | 1 |
| /audio/assessment/v3/sentences/i-tried-i-slipped-c33ef9.mp3 | I tried, … I slipped. | 1 |
| /audio/assessment/v3/sentences/small-strong-4de3ca.mp3 | Small … strong! | 1 |
| /audio/assessment/v3/sentences/stand-the-door-please-5ec8b7.mp3 | Stand … the door, please. | 1 |
| /audio/assessment/v3/sentences/the-mill-sits-a-stream-92fb84.mp3 | The mill sits … a stream. | 1 |
| /audio/assessment/v3/sentences/foxes-jump-high-af5fc3.mp3 | Foxes … jump high. | 1 |
| /audio/assessment/v3/sentences/we-camp-out-back-5e4868.mp3 | … we camp out back? | 1 |
| /audio/assessment/v3/sentences/frogs-sleep-in-mud-f7fb23.mp3 | … frogs sleep in mud? | 1 |
| /audio/assessment/v3/sentences/we-sums-after-lunch-3fcd4c.mp3 | We … sums after lunch. | 1 |
| /audio/assessment/v3/sentences/give-hen-some-corn-f47098.mp3 | Give … hen some corn. | 1 |
| /audio/assessment/v3/sentences/box-has-a-lid-bedf0c.mp3 | … box has a lid. | 1 |
| /audio/assessment/v3/sentences/we-fun-at-the-fair-d635aa.mp3 | We … fun at the fair. | 1 |
| /audio/assessment/v3/sentences/the-pup-my-sock-7182df.mp3 | The pup … my sock! | 1 |
| /audio/assessment/v3/sentences/do-bees-make-honey-462c69.mp3 | … do bees make honey? | 1 |
| /audio/assessment/v3/sentences/show-me-to-knit-d4bc70.mp3 | Show me … to knit. | 1 |
| /audio/assessment/v3/sentences/yell-you-spot-land-40b6f3.mp3 | Yell … you spot land! | 1 |
| /audio/assessment/v3/sentences/ask-dad-we-may-go-648f81.mp3 | Ask Dad … we may go. | 1 |
| /audio/assessment/v3/sentences/that-is-my-cup-1409a3.mp3 | That is … my cup. | 1 |
| /audio/assessment/v3/sentences/do-wake-the-baby-48179b.mp3 | Do … wake the baby! | 1 |
| /audio/assessment/v3/sentences/just-more-lap-to-run-f6f493.mp3 | Just … more lap to run! | 1 |
| /audio/assessment/v3/sentences/star-shone-first-f3efed.mp3 | … star shone first. | 1 |
| /audio/assessment/v3/sentences/milk-water-with-lunch-8f9e53.mp3 | Milk … water with lunch? | 1 |
| /audio/assessment/v3/sentences/walk-ride-you-pick-467719.mp3 | Walk … ride — you pick. | 1 |
| /audio/assessment/v3/sentences/the-vet-to-rest-the-pup-36bb7d.mp3 | The vet … to rest the pup. | 1 |
| /audio/assessment/v3/sentences/gran-bedtime-is-nine-cf8142.mp3 | Gran … bedtime is nine. | 1 |
| /audio/assessment/v3/sentences/may-join-our-team-bde8e6.mp3 | May … join our team? | 1 |
| /audio/assessment/v3/sentences/dug-up-a-gem-d32d52.mp3 | … dug up a gem! | 1 |
| /audio/assessment/v3/sentences/the-bees-kept-honey-safe-30a79b.mp3 | The bees kept … honey safe. | 1 |
| /audio/assessment/v3/sentences/the-kids-lost-ball-again-8b41a2.mp3 | The kids lost … ball again. | 1 |
| /audio/assessment/v3/sentences/park-the-bikes-over-e94262.mp3 | Park the bikes over …. | 1 |
| /audio/assessment/v3/sentences/is-anybody-7aa649.mp3 | Is anybody …? | 1 |
| /audio/assessment/v3/sentences/both-hands-to-lift-it-bea2a8.mp3 | … both hands to lift it. | 1 |
| /audio/assessment/v3/sentences/we-twigs-for-the-nest-131090.mp3 | We … twigs for the nest. | 1 |
| /audio/assessment/v3/sentences/can-bake-a-plum-pie-eaf889.mp3 | Can … bake a plum pie? | 1 |
| /audio/assessment/v3/sentences/swam-till-six-1bc82f.mp3 | … swam till six. | 1 |
| /audio/assessment/v3/sentences/the-socks-still-damp-eac2da.mp3 | The socks … still damp. | 1 |
| /audio/assessment/v3/sentences/you-fast-today-620583.mp3 | You … fast today! | 1 |
| /audio/assessment/v3/sentences/fell-off-the-shelf-25658d.mp3 | … fell off the shelf? | 1 |
| /audio/assessment/v3/sentences/guess-i-found-e079b6.mp3 | Guess … I found! | 1 |
| /audio/assessment/v3/sentences/does-the-pool-open-480b29.mp3 | … does the pool open? | 1 |
| /audio/assessment/v3/sentences/clap-the-song-ends-50a68c.mp3 | Clap … the song ends. | 1 |
| /audio/assessment/v3/sentences/sock-is-mine-ad8707.mp3 | … sock is mine? | 1 |
| /audio/assessment/v3/sentences/pick-game-we-play-78054e.mp3 | Pick … game we play. | 1 |
| /audio/assessment/v3/sentences/rhyming-end-the-same-917d99.mp3 | Rhyming … end the same. | 1 |
| /audio/assessment/v3/sentences/long-need-long-tiles-e2711a.mp3 | Long … need long tiles. | 1 |
| /audio/assessment/v3/sentences/tie-laces-up-tight-dc6138.mp3 | Tie … laces up tight. | 1 |
| /audio/assessment/v3/sentences/bring-kit-on-monday-69081c.mp3 | Bring … kit on Monday. | 1 |
| /audio/assessment/v3/sentences/the-coach-to-rest-up-e0904b.mp3 | The coach … to rest up. | 1 |
| /audio/assessment/v3/sentences/the-ants-built-nest-fast-9fc18a.mp3 | The ants built … nest fast. | 1 |
| /audio/assessment/v3/sentences/the-buns-still-warm-8a7132.mp3 | The buns … still warm. | 1 |
| /audio/assessment/v3/sentences/just-bun-is-left-94dd86.mp3 | Just … bun is left. | 1 |
| /audio/assessment/v3/sentences/sit-by-the-window-20b351.mp3 | Sit … by the window. | 1 |
| /audio/assessment/v3/sentences/who-that-f435f8.mp3 | Who … that? | 1 |
| /audio/assessment/v3/sentences/crabs-nip-take-care-cda0ba.mp3 | Crabs … nip — take care! | 1 |
| /audio/assessment/v3/sentences/is-this-pen-or-mine-95f372.mp3 | Is this … pen or mine? | 1 |
| /audio/assessment/v3/sentences/this-book-is-ants-e9a303.mp3 | This book is … ants. | 1 |
| /audio/assessment/v3/sentences/tell-me-the-trip-af3035.mp3 | Tell me … the trip! | 1 |
| /audio/assessment/v3/sentences/may-we-to-the-fair-a7bf4e.mp3 | May we … to the fair? | 1 |
| /audio/assessment/v3/sentences/the-vans-up-the-hill-1d34d4.mp3 | The vans … up the hill. | 1 |
| /audio/assessment/v3/sentences/my-bike-a-bell-7f6fd5.mp3 | My bike … a bell. | 1 |
| /audio/assessment/v3/sentences/ren-two-pet-mice-67f7bb.mp3 | Ren … two pet mice. | 1 |
| /audio/assessment/v3/sentences/meg-lost-mitten-b84bdc.mp3 | Meg lost … mitten. | 1 |
| /audio/assessment/v3/sentences/gran-naps-in-chair-176d46.mp3 | Gran naps in … chair. | 1 |
| /audio/assessment/v3/sentences/dad-waved-so-i-waved-at-815611.mp3 | Dad waved, so I waved at …. | 1 |
| /audio/assessment/v3/sentences/tom-fell-help-up-1ac3f7.mp3 | Tom fell — help … up! | 1 |
| /audio/assessment/v3/sentences/the-frog-hopped-the-pond-e3a370.mp3 | The frog hopped … the pond. | 1 |
| /audio/assessment/v3/sentences/pour-the-milk-the-jug-587975.mp3 | Pour the milk … the jug. | 1 |
| /audio/assessment/v3/sentences/i-plums-best-of-all-c89d0f.mp3 | I … plums best of all. | 1 |
| /audio/assessment/v3/sentences/clouds-can-look-sheep-743796.mp3 | Clouds can look … sheep. | 1 |
| /audio/assessment/v3/sentences/at-the-double-rainbow-905b74.mp3 | … at the double rainbow! | 1 |
| /audio/assessment/v3/sentences/we-for-shells-at-the-beach-c7d121.mp3 | We … for shells at the beach. | 1 |
| /audio/assessment/v3/sentences/let-s-a-mud-pie-13fee5.mp3 | Let's … a mud pie! | 1 |
| /audio/assessment/v3/sentences/bees-wax-and-honey-77df3d.mp3 | Bees … wax and honey. | 1 |
| /audio/assessment/v3/sentences/hands-make-light-work-ed23fc.mp3 | … hands make light work. | 1 |
| /audio/assessment/v3/sentences/how-eggs-are-left-19c045.mp3 | How … eggs are left? | 1 |
| /audio/assessment/v3/sentences/may-i-have-peas-please-b56706.mp3 | May I have … peas, please? | 1 |
| /audio/assessment/v3/sentences/this-box-holds-than-that-one-8213e7.mp3 | This box holds … than that one. | 1 |
| /audio/assessment/v3/sentences/one-mitten-is-dry-my-mitten-is-lost-fb34c2.mp3 | One mitten is dry. My … mitten is lost. | 1 |
| /audio/assessment/v3/sentences/try-your-hand-9fed75.mp3 | Try your … hand. | 1 |
| /audio/assessment/v3/sentences/the-cat-ran-of-the-shed-6963a5.mp3 | The cat ran … of the shed. | 1 |
| /audio/assessment/v3/sentences/turn-the-lamp-at-nine-e765c6.mp3 | Turn the lamp … at nine. | 1 |
| /audio/assessment/v3/sentences/owls-can-well-at-night-c53324.mp3 | Owls can … well at night. | 1 |
| /audio/assessment/v3/sentences/come-and-my-fort-997d2d.mp3 | Come and … my fort! | 1 |
| /audio/assessment/v3/sentences/the-tea-was-hot-i-let-it-cool-aad648.mp3 | The tea was hot, … I let it cool. | 1 |
| /audio/assessment/v3/sentences/that-joke-is-funny-29d985.mp3 | That joke is … funny! | 1 |
| /audio/assessment/v3/sentences/save-cake-for-gran-b0aac6.mp3 | Save … cake for Gran. | 1 |
| /audio/assessment/v3/sentences/birds-sing-at-dawn-c29fe4.mp3 | … birds sing at dawn. | 1 |
| /audio/assessment/v3/sentences/the-cups-i-washed-all-159576.mp3 | The cups? I washed … all. | 1 |
| /audio/assessment/v3/sentences/find-the-twins-and-tell-to-come-c86000.mp3 | Find the twins and tell … to come. | 1 |
| /audio/assessment/v3/sentences/we-swam-we-had-lunch-9ca36d.mp3 | We swam, … we had lunch. | 1 |
| /audio/assessment/v3/sentences/first-mix-bake-458c9d.mp3 | First mix, … bake. | 1 |
| /audio/assessment/v3/sentences/boots-here-are-muddy-da8ede.mp3 | … boots here are muddy. | 1 |
| /audio/assessment/v3/sentences/are-your-keys-right-here-3a3f55.mp3 | Are … your keys right here? | 1 |
| /audio/assessment/v3/sentences/what-does-the-pool-open-9bcc30.mp3 | What … does the pool open? | 1 |
| /audio/assessment/v3/sentences/it-is-for-bed-sleepyhead-ace1a0.mp3 | It is … for bed, sleepyhead. | 1 |
| /audio/assessment/v3/sentences/i-have-thumbs-and-eight-fingers-f8458e.mp3 | I have … thumbs and eight fingers. | 1 |
| /audio/assessment/v3/sentences/the-recipe-needs-eggs-9cb491.mp3 | The recipe needs … eggs. | 1 |
| /audio/assessment/v3/sentences/the-kite-went-and-away-38f89b.mp3 | The kite went … and away. | 1 |
| /audio/assessment/v3/sentences/roll-your-sleeping-bag-321c84.mp3 | Roll … your sleeping bag. | 1 |
| /audio/assessment/v3/sentences/it-rain-later-i-think-d94b89.mp3 | It … rain later, I think. | 1 |
| /audio/assessment/v3/sentences/you-hold-my-kite-a-bit-1c812a.mp3 | … you hold my kite a bit? | 1 |
| /audio/assessment/v3/sentences/you-like-a-hot-roll-aa8653.mp3 | … you like a hot roll? | 1 |
| /audio/assessment/v3/sentences/he-said-he-help-us-pack-9a3e75.mp3 | He said he … help us pack. | 1 |
| /audio/assessment/v3/sentences/please-your-name-at-the-top-efe5ce.mp3 | Please … your name at the top. | 1 |
| /audio/assessment/v3/sentences/i-to-my-pen-pal-weekly-707bca.mp3 | I … to my pen pal weekly. | 1 |
| /audio/assessment/v3/sentences/this-song-is-the-sea-74e6d4.mp3 | This song is … the sea. | 1 |
| /audio/assessment/v3/sentences/ask-me-my-hobby-b85516.mp3 | Ask me … my hobby. | 1 |
| /audio/assessment/v3/sentences/time-to-home-now-6031c7.mp3 | Time to … home now. | 1 |
| /audio/assessment/v3/sentences/ready-steady-da55ab.mp3 | Ready, steady, …! | 1 |
| /audio/assessment/v3/sentences/the-hive-ten-bees-b92d63.mp3 | The hive … ten bees. | 1 |
| /audio/assessment/v3/sentences/who-my-pencil-219ad0.mp3 | Who … my pencil? | 1 |
| /audio/assessment/v3/sentences/val-fed-rabbit-d1d09b.mp3 | Val fed … rabbit. | 1 |
| /audio/assessment/v3/sentences/is-this-scarf-or-yours-73e2cc.mp3 | Is this … scarf or yours? | 1 |
| /audio/assessment/v3/sentences/pass-the-map-to-be7420.mp3 | Pass the map to …. | 1 |
| /audio/assessment/v3/sentences/we-picked-for-our-team-6af60a.mp3 | We picked … for our team. | 1 |
| /audio/assessment/v3/sentences/hop-the-boat-quick-ec23da.mp3 | Hop … the boat, quick! | 1 |
| /audio/assessment/v3/sentences/the-seeds-went-the-soil-c36670.mp3 | The seeds went … the soil. | 1 |
| /audio/assessment/v3/sentences/ducks-wet-weather-aa24c8.mp3 | Ducks … wet weather. | 1 |
| /audio/assessment/v3/sentences/i-my-toast-crunchy-e030cb.mp3 | I … my toast crunchy. | 1 |
| /audio/assessment/v3/sentences/both-ways-first-cf431b.mp3 | … both ways first. | 1 |
| /audio/assessment/v3/sentences/come-at-the-tadpoles-59e701.mp3 | Come … at the tadpoles! | 1 |
| /audio/assessment/v3/sentences/let-s-lemonade-b9d19d.mp3 | Let's … lemonade. | 1 |
| /audio/assessment/v3/sentences/spiders-silk-webs-69915a.mp3 | Spiders … silk webs. | 1 |
| /audio/assessment/v3/sentences/moths-came-to-the-lamp-40ec99.mp3 | … moths came to the lamp. | 1 |
| /audio/assessment/v3/sentences/how-steps-to-the-top-5818ac.mp3 | How … steps to the top? | 1 |
| /audio/assessment/v3/sentences/one-lap-then-rest-1bba05.mp3 | One … lap, then rest. | 1 |
| /audio/assessment/v3/sentences/the-plant-needs-sun-af0fe5.mp3 | The plant needs … sun. | 1 |
| /audio/assessment/v3/sentences/hold-it-with-your-hand-64da50.mp3 | Hold it with your … hand. | 1 |
| /audio/assessment/v3/sentences/the-team-wore-red-6e7132.mp3 | The … team wore red. | 1 |
| /audio/assessment/v3/sentences/school-lets-at-three-5bdcf5.mp3 | School lets … at three. | 1 |
| /audio/assessment/v3/sentences/the-tide-went-fast-83e94a.mp3 | The tide went … fast. | 1 |
| /audio/assessment/v3/sentences/can-you-the-lighthouse-a96fb8.mp3 | Can you … the lighthouse? | 1 |
| /audio/assessment/v3/sentences/i-three-sails-66d497.mp3 | I … three sails! | 1 |
| /audio/assessment/v3/sentences/the-bag-was-heavy-a1a684.mp3 | The bag was … heavy! | 1 |
| /audio/assessment/v3/sentences/i-trained-hard-i-won-a38643.mp3 | I trained hard, … I won. | 1 |
| /audio/assessment/v3/sentences/take-grapes-for-the-trip-242427.mp3 | Take … grapes for the trip. | 1 |
| /audio/assessment/v3/sentences/crabs-hide-under-rocks-a21839.mp3 | … crabs hide under rocks. | 1 |
| /audio/assessment/v3/sentences/the-chicks-feed-at-five-b800d0.mp3 | The chicks? Feed … at five. | 1 |
| /audio/assessment/v3/sentences/stack-the-chairs-and-count-3a353f.mp3 | Stack the chairs and count …. | 1 |
| /audio/assessment/v3/sentences/wash-up-dry-your-hands-dd7f87.mp3 | Wash up, … dry your hands. | 1 |
| /audio/assessment/v3/sentences/first-stretch-sprint-5b00c3.mp3 | First stretch, … sprint. | 1 |
| /audio/assessment/v3/sentences/shells-here-are-tiny-b3c09e.mp3 | … shells here are tiny. | 1 |
| /audio/assessment/v3/sentences/are-seats-taken-f1a325.mp3 | Are … seats taken? | 1 |
| /audio/assessment/v3/sentences/it-is-snack-392201.mp3 | It is snack …! | 1 |
| /audio/assessment/v3/sentences/what-is-kickoff-11285d.mp3 | What … is kickoff? | 1 |
| /audio/assessment/v3/sentences/a-bike-has-wheels-3c3519.mp3 | A bike has … wheels. | 1 |
| /audio/assessment/v3/sentences/crows-sat-on-the-fence-16659e.mp3 | … crows sat on the fence. | 1 |
| /audio/assessment/v3/sentences/the-balloon-drifted-40a442.mp3 | The balloon drifted …. | 1 |
| /audio/assessment/v3/sentences/climb-the-ladder-slowly-59c733.mp3 | Climb … the ladder slowly. | 1 |
| /audio/assessment/v3/sentences/gran-knit-you-a-hat-e4b282.mp3 | Gran … knit you a hat. | 1 |
| /audio/assessment/v3/sentences/the-bread-rise-by-noon-a39d14.mp3 | The bread … rise by noon. | 1 |
| /audio/assessment/v3/sentences/you-feed-my-fish-3cc5bc.mp3 | … you feed my fish? | 1 |
| /audio/assessment/v3/sentences/she-said-she-come-d0ea64.mp3 | She said she … come. | 1 |
| /audio/assessment/v3/sentences/a-list-before-we-shop-563cf4.mp3 | … a list before we shop. | 1 |
| /audio/assessment/v3/sentences/i-with-my-left-hand-38fbef.mp3 | I … with my left hand. | 1 |
| /audio/assessment/v3/sentences/it-be-ok-to-sit-here-526429.mp3 | … it be OK to sit here? | 1 |
| /audio/assessment/v3/sentences/scribes-all-day-long-32d975.mp3 | Scribes … all day long. | 1 |
| /audio/assessment/v3/sentences/ben-trade-his-apple-e91a26.mp3 | Ben … trade his apple. | 1 |
| /audio/assessment/v3/sentences/neatly-on-the-line-f141bd.mp3 | … neatly on the line. | 1 |
| /audio/assessment/v3/sentences/socks-come-in-sets-of-c009b4.mp3 | Socks come in sets of …. | 1 |
| /audio/assessment/v3/sentences/so-stars-are-out-tonight-db16d0.mp3 | So … stars are out tonight! | 1 |
| /audio/assessment/v3/sentences/before-you-leap-de43d6.mp3 | … before you leap! | 1 |
| /audio/assessment/v3/sentences/bath-for-the-pup-9c25bd.mp3 | Bath … for the pup! | 1 |
| /audio/assessment/v3/sentences/where-have-you-all-day-c46201.mp3 | Where have you … all day? | 1 |
| /audio/assessment/v3/sentences/the-pups-have-fed-aaf202.mp3 | The pups have … fed. | 1 |
| /audio/assessment/v3/sentences/gran-us-in-for-tea-b557ae.mp3 | Gran … us in for tea. | 1 |
| /audio/assessment/v3/sentences/our-cat-is-pickle-1f5f85.mp3 | Our cat is … Pickle. | 1 |
| /audio/assessment/v3/sentences/and-warm-up-by-the-fire-b26334.mp3 | … and warm up by the fire. | 1 |
| /audio/assessment/v3/sentences/foxes-out-after-dark-a83352.mp3 | Foxes … out after dark. | 1 |
| /audio/assessment/v3/sentences/you-pass-the-jam-f8f5a7.mp3 | … you pass the jam? | 1 |
| /audio/assessment/v3/sentences/long-ago-gran-skate-fast-437038.mp3 | Long ago, Gran … skate fast. | 1 |
| /audio/assessment/v3/sentences/what-is-the-fair-on-5480ed.mp3 | What … is the fair on? | 1 |
| /audio/assessment/v3/sentences/what-a-windy-for-kites-e4afb7.mp3 | What a windy … for kites! | 1 |
| /audio/assessment/v3/sentences/you-lock-the-gate-315aa1.mp3 | … you lock the gate? | 1 |
| /audio/assessment/v3/sentences/we-our-best-at-the-quiz-e67a23.mp3 | We … our best at the quiz. | 1 |
| /audio/assessment/v3/sentences/the-otter-slid-the-bank-983a67.mp3 | The otter slid … the bank. | 1 |
| /audio/assessment/v3/sentences/write-it-so-you-remember-a2ae5b.mp3 | Write it … so you remember. | 1 |
| /audio/assessment/v3/sentences/can-you-the-hidden-key-b3a5ce.mp3 | Can you … the hidden key? | 1 |
| /audio/assessment/v3/sentences/bats-moths-at-night-2deee2.mp3 | Bats … moths at night. | 1 |
| /audio/assessment/v3/sentences/tie-the-knot-then-pull-5f3a8f.mp3 | Tie the knot …, then pull. | 1 |
| /audio/assessment/v3/sentences/ana-came-in-the-race-f9a6f6.mp3 | Ana came … in the race. | 1 |
| /audio/assessment/v3/sentences/please-my-coat-from-the-peg-bab8a3.mp3 | Please … my coat from the peg. | 1 |
| /audio/assessment/v3/sentences/ducks-muddy-and-stay-happy-bbe90f.mp3 | Ducks … muddy and stay happy. | 1 |
| /audio/assessment/v3/sentences/a-snake-is-and-thin-16b0ce.mp3 | A snake is … and thin. | 1 |
| /audio/assessment/v3/sentences/how-is-the-train-ride-691dde.mp3 | How … is the train ride? | 1 |
| /audio/assessment/v3/sentences/gramps-this-stool-himself-ee3888.mp3 | Gramps … this stool himself. | 1 |
| /audio/assessment/v3/sentences/the-chef-soup-from-scraps-1542aa.mp3 | The chef … soup from scraps. | 1 |
| /audio/assessment/v3/sentences/i-leave-the-table-dcddc6.mp3 | … I leave the table? | 1 |
| /audio/assessment/v3/sentences/it-snow-before-dawn-693e2d.mp3 | It … snow before dawn. | 1 |
| /audio/assessment/v3/sentences/that-bike-is-not-yours-adb699.mp3 | That bike is …, not yours. | 1 |
| /audio/assessment/v3/sentences/i-lost-left-glove-a82f66.mp3 | I lost … left glove. | 1 |
| /audio/assessment/v3/sentences/there-are-plums-left-5d6227.mp3 | There are … plums left. | 1 |
| /audio/assessment/v3/sentences/dogs-on-the-sand-says-the-sign-5bac4c.mp3 | … dogs on the sand, says the sign. | 1 |
| /audio/assessment/v3/sentences/the-glue-is-dry-aae0e9.mp3 | The glue is dry …. | 1 |
| /audio/assessment/v3/sentences/it-is-my-turn-5ee8e2.mp3 | … it is my turn! | 1 |
| /audio/assessment/v3/sentences/pick-a-from-one-to-ten-f4a4f7.mp3 | Pick a … from one to ten. | 1 |
| /audio/assessment/v3/sentences/what-is-your-house-e16907.mp3 | What … is your house? | 1 |
| /audio/assessment/v3/sentences/dad-put-on-the-squeaky-hinge-d5e653.mp3 | Dad put … on the squeaky hinge. | 1 |
| /audio/assessment/v3/sentences/and-water-will-not-mix-e34bad.mp3 | … and water will not mix. | 1 |
| /audio/assessment/v3/sentences/the-best-of-camp-was-the-raft-d68964.mp3 | The best … of camp was the raft. | 1 |
| /audio/assessment/v3/sentences/each-of-the-model-snaps-in-1bf552.mp3 | Each … of the model snaps in. | 1 |
| /audio/assessment/v3/sentences/the-hall-was-full-of-223a8c.mp3 | The hall was full of …. | 1 |
| /audio/assessment/v3/sentences/waved-from-the-bridge-ce512f.mp3 | … waved from the bridge. | 1 |
| /audio/assessment/v3/sentences/come-by-me-at-lunch-b56fed.mp3 | Come … by me at lunch. | 1 |
| /audio/assessment/v3/sentences/hens-on-their-eggs-531e2f.mp3 | Hens … on their eggs. | 1 |
| /audio/assessment/v3/sentences/a-whale-is-bigger-a-bus-faa185.mp3 | A whale is bigger … a bus. | 1 |
| /audio/assessment/v3/sentences/i-would-rather-walk-wait-24f5f7.mp3 | I would rather walk … wait. | 1 |
| /audio/assessment/v3/sentences/plants-need-sun-and-cf444a.mp3 | Plants need sun and …. | 1 |
| /audio/assessment/v3/sentences/the-in-the-pool-is-cold-b2b288.mp3 | The … in the pool is cold. | 1 |
| /audio/assessment/v3/sentences/is-this-the-to-the-beach-4dc03f.mp3 | Is this the … to the beach? | 1 |
| /audio/assessment/v3/sentences/show-me-the-you-fold-it-30d935.mp3 | Show me the … you fold it. | 1 |
| /audio/assessment/v3/sentences/left-the-tap-running-40c873.mp3 | … left the tap running? | 1 |
| /audio/assessment/v3/sentences/guess-won-the-raffle-25d439.mp3 | Guess … won the raffle! | 1 |
| /audio/assessment/v3/sentences/have-you-to-the-fair-dde7cf.mp3 | Have you … to the fair? | 1 |
| /audio/assessment/v3/sentences/the-barn-has-painted-bc8ea0.mp3 | The barn has … painted. | 1 |
| /audio/assessment/v3/sentences/the-pup-is-biscuit-5cc381.mp3 | The pup is … Biscuit. | 1 |
| /audio/assessment/v3/sentences/mum-the-vet-at-once-cb12dc.mp3 | Mum … the vet at once. | 1 |
| /audio/assessment/v3/sentences/and-see-the-chicks-369e1d.mp3 | … and see the chicks! | 1 |
| /audio/assessment/v3/sentences/storms-fast-at-sea-6d9170.mp3 | Storms … fast at sea. | 1 |
| /audio/assessment/v3/sentences/we-camp-by-the-lake-f22f26.mp3 | … we camp by the lake? | 1 |
| /audio/assessment/v3/sentences/owls-hear-a-pin-drop-58575e.mp3 | Owls … hear a pin drop. | 1 |
| /audio/assessment/v3/sentences/sports-is-on-friday-d6ea92.mp3 | Sports … is on Friday. | 1 |
| /audio/assessment/v3/sentences/what-a-fine-for-a-hike-73cb2a.mp3 | What a fine … for a hike! | 1 |
| /audio/assessment/v3/sentences/the-alarm-ring-32602e.mp3 | … the alarm ring? | 1 |
| /audio/assessment/v3/sentences/you-a-fine-job-fb1051.mp3 | You … a fine job. | 1 |
| /audio/assessment/v3/sentences/roll-the-barrel-the-ramp-bd4279.mp3 | Roll the barrel … the ramp. | 1 |
| /audio/assessment/v3/sentences/the-sun-went-at-eight-71a57c.mp3 | The sun went … at eight. | 1 |
| /audio/assessment/v3/sentences/help-me-my-keys-d19cc2.mp3 | Help me … my keys. | 1 |
| /audio/assessment/v3/sentences/crows-shiny-things-580210.mp3 | Crows … shiny things. | 1 |
| /audio/assessment/v3/sentences/ladders-then-paint-ea1e27.mp3 | Ladders …, then paint. | 1 |
| /audio/assessment/v3/sentences/who-came-in-the-quiz-ece789.mp3 | Who came … in the quiz? | 1 |
| /audio/assessment/v3/sentences/your-boots-it-snowed-c3b0e5.mp3 | … your boots — it snowed! | 1 |
| /audio/assessment/v3/sentences/we-eggs-from-the-coop-a1f6e3.mp3 | We … eggs from the coop. | 1 |
| /audio/assessment/v3/sentences/giraffes-have-necks-97fb9c.mp3 | Giraffes have … necks. | 1 |
| /audio/assessment/v3/sentences/the-queue-was-so-f28f27.mp3 | The queue was so …! | 1 |
| /audio/assessment/v3/sentences/we-jam-tarts-today-3dbde7.mp3 | We … jam tarts today. | 1 |
| /audio/assessment/v3/sentences/ants-a-nest-by-the-step-f873de.mp3 | Ants … a nest by the step. | 1 |
| /audio/assessment/v3/sentences/i-ring-the-bell-4ff364.mp3 | … I ring the bell? | 1 |
| /audio/assessment/v3/sentences/it-thunder-later-e24b2c.mp3 | It … thunder later. | 1 |
| /audio/assessment/v3/sentences/where-is-other-mitten-40c1c9.mp3 | Where is … other mitten? | 1 |
| /audio/assessment/v3/sentences/turn-on-the-swing-249281.mp3 | … turn on the swing! | 1 |
| /audio/assessment/v3/sentences/there-is-milk-left-b21bc6.mp3 | There is … milk left. | 1 |
| /audio/assessment/v3/sentences/two-snowflakes-match-cc25dd.mp3 | … two snowflakes match. | 1 |
| /audio/assessment/v3/sentences/the-paint-is-dry-4cc9b5.mp3 | The paint is dry …. | 1 |
| /audio/assessment/v3/sentences/add-the-flour-slowly-86228a.mp3 | … add the flour slowly. | 1 |
| /audio/assessment/v3/sentences/ring-this-if-lost-2397d0.mp3 | Ring this … if lost. | 1 |
| /audio/assessment/v3/sentences/seven-is-my-lucky-ffdc6e.mp3 | Seven is my lucky …. | 1 |
| /audio/assessment/v3/sentences/bike-chains-need-14c444.mp3 | Bike chains need …. | 1 |
| /audio/assessment/v3/sentences/the-wheels-please-c93920.mp3 | … the wheels, please. | 1 |
| /audio/assessment/v3/sentences/this-clips-on-last-a724e3.mp3 | This … clips on last. | 1 |
| /audio/assessment/v3/sentences/play-your-in-the-show-a1a12d.mp3 | Play your … in the show. | 1 |
| /audio/assessment/v3/sentences/six-fit-in-the-lift-f180f9.mp3 | Six … fit in the lift. | 1 |
| /audio/assessment/v3/sentences/kind-share-the-bench-876288.mp3 | Kind … share the bench. | 1 |
| /audio/assessment/v3/sentences/still-for-the-photo-89b6d0.mp3 | … still for the photo. | 1 |
| /audio/assessment/v3/sentences/cats-where-they-please-4523ba.mp3 | Cats … where they please. | 1 |
| /audio/assessment/v3/sentences/silk-is-softer-wool-a8e3ca.mp3 | Silk is softer … wool. | 1 |
| /audio/assessment/v3/sentences/ice-is-colder-snow-32f052.mp3 | Ice is colder … snow. | 1 |
| /audio/assessment/v3/sentences/fill-the-trough-with-c96d10.mp3 | Fill the trough with …. | 1 |
| /audio/assessment/v3/sentences/the-froze-overnight-4bc85d.mp3 | The … froze overnight. | 1 |
| /audio/assessment/v3/sentences/this-to-the-exit-c9b5a1.mp3 | This … to the exit. | 1 |
| /audio/assessment/v3/sentences/a-compass-shows-the-3a6e4b.mp3 | A compass shows the …. | 1 |
| /audio/assessment/v3/sentences/ate-the-last-plum-3069f6.mp3 | … ate the last plum? | 1 |
| /audio/assessment/v3/sentences/ask-owns-the-scooter-c03e8f.mp3 | Ask … owns the scooter. | 1 |
| /audio/assessment/v3/sentences/i-wish-i-fly-like-a-hawk-c9e664.mp3 | I wish I … fly like a hawk. | 1 |
| /audio/assessment/v3/sentences/the-post-has-already-741fcd.mp3 | The post has already …. | 1 |
| /audio/assessment/v3/sentences/we-hear-the-sea-from-camp-1fbeae.mp3 | We … hear the sea from camp. | 1 |
| /audio/assessment/v3/sentences/it-has-ages-9f761c.mp3 | It has … ages! | 1 |
| /audio/assessment/v3/sentences/knows-the-answer-3ce3fa.mp3 | … knows the answer? | 1 |
| /audio/assessment/v3/sentences/feathers-weigh-less-stones-479eae.mp3 | Feathers weigh less … stones. | 1 |
| /audio/assessment/v3/sentences/pick-an-odd-9c937a.mp3 | Pick an odd …. | 1 |
| /audio/assessment/v3/sentences/save-take-short-showers-2e605c.mp3 | Save … — take short showers. | 1 |
| /audio/assessment/v3/sentences/we-sailed-far-out-on-the-deep-blue-fa3d29.mp3 | We sailed far out on the deep blue …. | 1 |
| /audio/assessment/v3/sentences/close-your-eyes-now-open-and-612c62.mp3 | Close your eyes — now open and …! | 1 |
| /audio/assessment/v3/sentences/the-rose-over-the-hill-at-dawn-96734d.mp3 | The … rose over the hill at dawn. | 1 |
| /audio/assessment/v3/sentences/grandpa-hugged-his-at-the-gate-2391af.mp3 | Grandpa hugged his … at the gate. | 1 |
| /audio/assessment/v3/sentences/a-landed-on-the-flower-e7005a.mp3 | A … landed on the flower. | 1 |
| /audio/assessment/v3/sentences/i-will-seven-on-my-next-birthday-c3e6aa.mp3 | I will … seven on my next birthday. | 1 |
| /audio/assessment/v3/sentences/dad-said-when-i-asked-for-sweets-7cd0f8.mp3 | Dad said … when I asked for sweets. | 1 |
| /audio/assessment/v3/sentences/do-you-the-way-to-school-7ff59f.mp3 | Do you … the way to school? | 1 |
| /audio/assessment/v3/sentences/pick-just-card-from-the-pack-38a715.mp3 | Pick just … card from the pack. | 1 |
| /audio/assessment/v3/sentences/our-team-the-cup-last-year-decaad.mp3 | Our team … the cup last year! | 1 |
| /audio/assessment/v3/sentences/ben-all-his-peas-at-dinner-6951d0.mp3 | Ben … all his peas at dinner. | 1 |
| /audio/assessment/v3/sentences/there-are-legs-on-a-spider-65ce4e.mp3 | There are … legs on a spider. | 1 |
| /audio/assessment/v3/sentences/shh-i-can-the-owl-outside-4a323b.mp3 | Shh! I can … the owl outside. | 1 |
| /audio/assessment/v3/sentences/the-bus-stops-right-at-this-very-corner-7f18f7.mp3 | The bus stops right …, at this very corner. | 1 |
| /audio/assessment/v3/sentences/the-wind-my-hat-into-the-pond-4fdfb7.mp3 | The wind … my hat into the pond! | 1 |
| /audio/assessment/v3/sentences/milo-wore-his-scarf-blue-like-the-sea-a846eb.mp3 | Milo wore his … scarf, blue like the sea. | 1 |
| /audio/assessment/v3/sentences/may-i-come-the-park-with-you-68720b.mp3 | May I come … the park with you? | 1 |
| /audio/assessment/v3/sentences/nan-baked-pies-one-for-each-hand-fd1829.mp3 | Nan baked … pies, one for each hand. | 1 |
| /audio/assessment/v3/sentences/that-soup-is-hot-to-eat-1cad09.mp3 | That soup is … hot to eat! | 1 |
| /audio/assessment/v3/sentences/the-twins-packed-bags-for-camp-ca3397.mp3 | The twins packed … bags for camp. | 1 |
| /audio/assessment/v3/sentences/look-over-the-parade-is-coming-23f178.mp3 | Look over … — the parade is coming! | 1 |
| /audio/assessment/v3/sentences/the-teacher-ticked-it-my-sum-was-c60f69.mp3 | The teacher ticked it — my sum was …. | 1 |
| /audio/assessment/v3/sentences/i-will-a-letter-to-gran-tonight-87be28.mp3 | I will … a letter to Gran tonight. | 1 |
| /audio/assessment/v3/sentences/my-shoes-are-i-got-them-today-e62f36.mp3 | My shoes are … — I got them today. | 1 |
| /audio/assessment/v3/sentences/i-the-answer-before-anyone-else-aec06e.mp3 | I … the answer before anyone else. | 1 |
| /audio/assessment/v3/sentences/the-cake-bakes-for-one-cb5d8c.mp3 | The cake bakes for one …. | 1 |
| /audio/assessment/v3/sentences/that-swing-is-special-spot-5426f1.mp3 | That swing is … special spot. | 1 |
| /audio/assessment/v3/sentences/sift-the-into-the-bowl-for-the-cake-7acdef.mp3 | Sift the … into the bowl for the cake. | 1 |
| /audio/assessment/v3/sentences/a-bee-landed-on-the-pink-d1d03b.mp3 | A bee landed on the pink …. | 1 |
| /audio/assessment/v3/sentences/you-like-some-juice-c0de67.mp3 | … you like some juice? | 1 |
| /audio/assessment/v3/sentences/the-bench-is-made-of-from-the-old-oak-3e5ec3.mp3 | The bench is made of … from the old oak. | 1 |
| /audio/assessment/v3/sentences/gran-pancakes-for-breakfast-c0c3f5.mp3 | Gran … pancakes for breakfast. | 1 |
| /audio/assessment/v3/sentences/the-swept-the-castle-floor-98fbb6.mp3 | The … swept the castle floor. | 1 |
| /audio/assessment/v3/sentences/shells-wash-up-from-the-574a0a.mp3 | Shells wash up from the …. | 1 |
| /audio/assessment/v3/sentences/the-buzzed-from-rose-to-rose-44155d.mp3 | The … buzzed from rose to rose. | 1 |
| /audio/assessment/v3/sentences/we-the-quiz-by-a-single-point-259b5d.mp3 | We … the quiz by a single point! | 1 |
| /audio/assessment/v3/sentences/stand-still-and-you-can-the-waves-7022b2.mp3 | Stand still and you can … the waves. | 1 |
| /audio/assessment/v3/sentences/it-is-dark-to-read-outside-now-184c1b.mp3 | It is … dark to read outside now. | 1 |
| /audio/assessment/v3/sentences/the-birds-built-nest-in-the-oak-998201.mp3 | The birds built … nest in the oak. | 1 |
| /audio/assessment/v3/sentences/use-the-pencil-to-your-name-907795.mp3 | Use the pencil to … your name. | 1 |
| /audio/assessment/v3/sentences/we-a-fort-out-of-pillows-998d23.mp3 | We … a fort out of pillows. | 1 |
| /audio/assessment/v3/sentences/the-sailed-into-the-bay-f56356.mp3 | The … sailed into the bay. | 1 |
| /audio/assessment/v3/sentences/a-buzzed-by-my-ear-c283e2.mp3 | A … buzzed by my ear. | 1 |
| /audio/assessment/v3/sentences/the-dripped-on-the-rug-c7d72c.mp3 | The … dripped on the rug. | 1 |
| /audio/assessment/v3/sentences/our-creaks-in-the-wind-354065.mp3 | Our … creaks in the wind. | 1 |
| /audio/assessment/v3/sentences/the-hooted-all-night-long-f4d194.mp3 | The … hooted all night long. | 1 |
| /audio/assessment/v3/sentences/a-rolled-off-the-shelf-6aa85d.mp3 | A … rolled off the shelf. | 1 |
| /audio/assessment/v3/sentences/the-sang-to-the-crowd-fd4a94.mp3 | The … sang to the crowd. | 1 |
| /audio/assessment/v3/sentences/our-reads-to-us-after-lunch-761ef5.mp3 | Our … reads to us after lunch. | 1 |
| /audio/assessment/v3/sentences/the-cat-and-the-hid-in-the-barn-897f45.mp3 | The cat and the … hid in the barn. | 1 |
| /audio/assessment/v3/sentences/a-fork-and-a-sat-by-the-plate-e35e05.mp3 | A fork and a … sat by the plate. | 1 |
| /audio/assessment/v3/sentences/the-chimed-at-noon-16671f.mp3 | The … chimed at noon. | 1 |
| /audio/assessment/v3/sentences/a-nested-in-our-chimney-257604.mp3 | A … nested in our chimney. | 1 |
| /audio/assessment/v3/sentences/two-sat-on-the-wall-5070c7.mp3 | Two … sat on the wall. | 1 |
| /audio/assessment/v3/sentences/the-three-wag-their-tails-8bd80f.mp3 | The three … wag their tails. | 1 |
| /audio/assessment/v3/sentences/both-lay-open-on-the-desk-ade2b5.mp3 | Both … lay open on the desk. | 1 |
| /audio/assessment/v3/sentences/six-shine-over-the-barn-5b0176.mp3 | Six … shine over the barn. | 1 |
| /audio/assessment/v3/sentences/i-see-one-by-the-door-8faff5.mp3 | I see one … by the door. | 1 |
| /audio/assessment/v3/sentences/many-twinkle-at-night-4df8e8.mp3 | Many … twinkle at night. | 1 |
| /audio/assessment/v3/sentences/one-floats-on-the-pond-7f6dfa.mp3 | One … floats on the pond. | 1 |
| /audio/assessment/v3/sentences/lots-of-hop-in-the-grass-6070b7.mp3 | Lots of … hop in the grass. | 1 |
| /audio/assessment/v3/sentences/we-packed-six-for-the-trip-7cfa71.mp3 | We packed six … for the trip. | 1 |
| /audio/assessment/v3/sentences/the-dried-by-the-sink-e3f805.mp3 | The … dried by the sink. | 1 |
| /audio/assessment/v3/sentences/three-chugged-up-the-hill-3e02ae.mp3 | Three … chugged up the hill. | 1 |
| /audio/assessment/v3/sentences/the-scrubbed-the-mud-off-our-boots-65a18d.mp3 | The … scrubbed the mud off our boots. | 1 |
| /audio/assessment/v3/sentences/two-red-hid-in-the-den-9ccf92.mp3 | Two red … hid in the den. | 1 |
| /audio/assessment/v3/sentences/the-giggled-in-their-cots-8fc795.mp3 | The … giggled in their cots. | 1 |
| /audio/assessment/v3/sentences/three-planned-the-fair-b1c1a3.mp3 | Three … planned the fair. | 1 |
| /audio/assessment/v3/sentences/we-hung-lights-for-both-41a7b0.mp3 | We hung lights for both …. | 1 |
| /audio/assessment/v3/sentences/the-marched-in-the-band-92c988.mp3 | The … marched in the band. | 1 |
| /audio/assessment/v3/sentences/both-six-year-old-lost-a-milk-tooth-today-a427dd.mp3 | Both six-year-old … lost a milk tooth today. | 1 |
| /audio/assessment/v3/sentences/autumn-blew-across-the-path-1a0b95.mp3 | Autumn … blew across the path. | 1 |
| /audio/assessment/v3/sentences/the-howled-on-the-hill-40f6cf.mp3 | The … howled on the hill. | 1 |
| /audio/assessment/v3/sentences/the-chef-laid-five-by-the-plates-d317fe.mp3 | The chef laid five … by the plates. | 1 |
| /audio/assessment/v3/sentences/all-the-were-fast-asleep-41c32b.mp3 | All the … were fast asleep. | 1 |
| /audio/assessment/v3/sentences/one-was-left-on-the-plate-ccd3e5.mp3 | One … was left on the plate. | 1 |
| /audio/assessment/v3/sentences/two-of-bread-sat-in-the-basket-53c1b1.mp3 | Two … of bread sat in the basket. | 1 |
| /audio/assessment/v3/sentences/ten-bark-at-the-gate-f5f0c1.mp3 | Ten … bark at the gate. | 1 |
| /audio/assessment/v3/sentences/four-played-near-the-barn-56dd87.mp3 | Four … played near the barn. | 1 |
| /audio/assessment/v3/sentences/just-one-purred-by-the-fire-ab538d.mp3 | Just one … purred by the fire. | 1 |
| /audio/assessment/v3/sentences/both-told-long-stories-befbeb.mp3 | Both … told long stories. | 1 |
| /audio/assessment/v3/sentences/two-white-nibbled-the-cheese-c4bf64.mp3 | Two white … nibbled the cheese. | 1 |
| /audio/assessment/v3/sentences/the-baker-sliced-two-for-lunch-922914.mp3 | The baker sliced two … for lunch. | 1 |
| /audio/assessment/v3/sentences/all-four-chirped-at-dawn-40969f.mp3 | All four … chirped at dawn. | 1 |
| /audio/assessment/v3/sentences/every-day-dad-the-car-f6c064.mp3 | Every day, Dad … the car. | 1 |
| /audio/assessment/v3/sentences/my-cat-on-the-mat-each-day-227486.mp3 | My cat … on the mat each day. | 1 |
| /audio/assessment/v3/sentences/gran-bread-every-sunday-5e7150.mp3 | Gran … bread every Sunday. | 1 |
| /audio/assessment/v3/sentences/right-now-the-pot-is-on-the-stove-420eb5.mp3 | Right now, the pot is … on the stove. | 1 |
| /audio/assessment/v3/sentences/we-are-a-sandcastle-today-fe1e97.mp3 | We are … a sandcastle today. | 1 |
| /audio/assessment/v3/sentences/keep-the-finish-line-is-close-29d88f.mp3 | Keep …! The finish line is close. | 1 |
| /audio/assessment/v3/sentences/yesterday-we-to-the-park-6682f8.mp3 | Yesterday we … to the park. | 1 |
| /audio/assessment/v3/sentences/last-night-the-baby-for-hours-2c2d28.mp3 | Last night, the baby … for hours. | 1 |
| /audio/assessment/v3/sentences/we-the-door-before-bed-ac09cf.mp3 | We … the door before bed. | 1 |
| /audio/assessment/v3/sentences/ben-is-tall-but-ana-is-even-166dc2.mp3 | Ben is tall, but Ana is even …. | 1 |
| /audio/assessment/v3/sentences/of-all-three-dogs-rex-is-the-f99b69.mp3 | Of all three dogs, Rex is the …. | 1 |
| /audio/assessment/v3/sentences/set-the-eggs-down-with-no-bumps-9c43d2.mp3 | Set the eggs down …, with no bumps. | 1 |
| /audio/assessment/v3/sentences/the-mouse-crept-past-the-cat-755111.mp3 | The mouse crept … past the cat. | 1 |
| /audio/assessment/v3/sentences/the-oven-before-you-mix-the-batter-5ece40.mp3 | … the oven before you mix the batter. | 1 |
| /audio/assessment/v3/sentences/we-watched-a-before-the-film-opened-96a430.mp3 | We watched a … before the film opened. | 1 |
| /audio/assessment/v3/sentences/sam-is-quick-but-ali-is-even-4532f6.mp3 | Sam is quick, but Ali is even …. | 1 |
| /audio/assessment/v3/sentences/the-plane-flew-the-town-d5cbb7.mp3 | The plane flew … the town. | 1 |
| /audio/assessment/v3/sentences/the-horse-leapt-the-gate-6adcdb.mp3 | The horse leapt … the gate. | 1 |
| /audio/assessment/v3/sentences/high-in-the-sky-the-plane-passed-the-town-9b83ed.mp3 | High in the sky, the plane passed … the town. | 1 |
| /audio/assessment/v3/sentences/the-horse-jumped-the-locked-gate-ec7df9.mp3 | The horse jumped … the locked gate. | 1 |
| /audio/assessment/v3/sentences/the-train-roared-the-tunnel-ee04b6.mp3 | The train roared … the tunnel. | 1 |
| /audio/assessment/v3/sentences/rain-dripped-the-crack-in-the-tent-bf8ae8.mp3 | Rain dripped … the crack in the tent. | 1 |
| /audio/assessment/v3/sentences/the-train-entered-one-end-and-left-the-other-16e2cf.mp3 | The train entered one end and left the other: … the tunnel. | 1 |
| /audio/assessment/v3/sentences/the-tent-leaked-because-rain-came-a-small-cr-a3197e.mp3 | The tent leaked because rain came … a small crack. | 1 |
| /audio/assessment/v3/sentences/our-house-is-the-school-on-the-same-short-st-51e92c.mp3 | Our house is … the school on the same short street. | 1 |
| /audio/assessment/v3/sentences/keep-the-bucket-the-door-for-spills-2e22f7.mp3 | Keep the bucket … the door for spills. | 1 |
| /audio/assessment/v3/sentences/home-is-a-short-walk-away-our-house-is-the-s-eee1d7.mp3 | Home is a short walk away. Our house is … the school. | 1 |
| /audio/assessment/v3/sentences/keep-the-bucket-the-door-so-it-is-quick-to-r-7d7844.mp3 | Keep the bucket … the door so it is quick to reach. | 1 |
| /audio/assessment/v3/sentences/the-bakery-is-the-bank-just-across-the-road-5b9673.mp3 | The bakery is … the bank, just across the road. | 1 |
| /audio/assessment/v3/sentences/the-two-goals-stand-each-other-172a21.mp3 | The two goals stand … each other. | 1 |
| /audio/assessment/v3/sentences/the-bakery-faces-the-bank-across-the-road-th-6bee86.mp3 | The bakery faces the bank across the road: … the bank. | 1 |
| /audio/assessment/v3/sentences/the-goals-at-the-two-ends-stand-each-other-503caf.mp3 | The goals at the two ends stand … each other. | 1 |
| /audio/assessment/v3/sentences/a-red-tulip-grew-the-yellow-tulips-158932.mp3 | A red tulip grew … the yellow tulips. | 1 |
| /audio/assessment/v3/sentences/the-deer-stood-the-trees-2ce576.mp3 | The deer stood … the trees. | 1 |
| /audio/assessment/v3/sentences/one-red-flower-grows-many-yellow-flowers-6a7af5.mp3 | One red flower grows … many yellow flowers. | 1 |
| /audio/assessment/v3/sentences/a-deer-stood-the-trees-hard-to-spot-b212cb.mp3 | A deer stood … the trees, hard to spot. | 1 |
| /audio/assessment/v3/sentences/the-fence-runs-the-whole-garden-7fb5b0.mp3 | The fence runs … the whole garden. | 1 |
| /audio/assessment/v3/sentences/the-path-bends-the-puddle-8289ee.mp3 | The path bends … the puddle. | 1 |
| /audio/assessment/v3/sentences/we-walked-the-puddle-to-keep-our-shoes-dry-f8eda4.mp3 | We walked … the puddle to keep our shoes dry. | 1 |
| /audio/assessment/v3/sentences/the-fence-makes-a-complete-ring-the-garden-89949a.mp3 | The fence makes a complete ring … the garden. | 1 |
| /audio/assessment/v3/sentences/it-poured-with-rain-so-we-played-the-house-385237.mp3 | It poured with rain, so we played … the house. | 1 |
| /audio/assessment/v3/sentences/leave-the-muddy-boots-the-door-c423e4.mp3 | Leave the muddy boots … the door. | 1 |
| /audio/assessment/v3/sentences/leave-your-muddy-boots-the-door-then-come-in-a4aa22.mp3 | Leave your muddy boots … the door, then come in. | 1 |
| /audio/assessment/v3/sentences/rain-is-falling-outdoors-but-the-children-ar-95887a.mp3 | Rain is falling outdoors, but the children are dry … the house. | 1 |
| /audio/assessment/v3/sentences/the-horse-is-jumping-the-gate-e18a00.mp3 | The horse is jumping … the gate. | 1 |
| /audio/assessment/v3/sentences/the-train-is-passing-the-tunnel-54446f.mp3 | The train is passing … the tunnel. | 1 |
| /audio/assessment/v3/sentences/a-short-path-joins-home-and-school-they-are-450591.mp3 | A short path joins home and school. They are … each other. | 1 |
| /audio/assessment/v3/sentences/the-single-red-tulip-stands-the-yellow-tulip-f32d1b.mp3 | The single red tulip stands … the yellow tulips. | 1 |
| /audio/assessment/v3/sentences/the-fence-curves-the-garden-2935f1.mp3 | The fence curves … the garden. | 1 |
| /audio/assessment/v3/sentences/the-children-stay-dry-the-house-a65502.mp3 | The children stay dry … the house. | 1 |
| /audio/assessment/v3/sentences/we-the-raft-to-the-dock-db2131.mp3 | We … the raft to the dock. | 1 |
| /audio/assessment/v3/sentences/the-twins-over-the-puddle-9fbc7a.mp3 | The twins … over the puddle. | 1 |
| /audio/assessment/v3/sentences/please-the-door-quietly-a790ef.mp3 | Please … the door quietly. | 1 |
| /audio/assessment/v3/sentences/owls-after-dark-861427.mp3 | Owls … after dark. | 1 |
| /audio/assessment/v3/sentences/crabs-across-the-sand-d9e8a5.mp3 | Crabs … across the sand. | 1 |
| /audio/assessment/v3/sentences/we-the-seeds-each-morning-3403f6.mp3 | We … the seeds each morning. | 1 |
| /audio/assessment/v3/sentences/the-swims-fifty-laps-a-day-ff0f44.mp3 | The … swims fifty laps a day. | 1 |
| /audio/assessment/v3/sentences/the-twirled-across-the-stage-22c58a.mp3 | The … twirled across the stage. | 1 |
| /audio/assessment/v3/sentences/the-frog-over-the-log-in-one-big-spring-3be845.mp3 | The frog … over the log in one big spring. | 1 |
| /audio/assessment/v3/sentences/the-soup-in-the-pot-until-bubbles-rose-c361db.mp3 | The soup … in the pot until bubbles rose. | 1 |
| /audio/assessment/v3/sentences/she-the-note-in-half-and-half-again-e6c9ba.mp3 | She … the note in half and half again. | 1 |
| /audio/assessment/v3/sentences/the-snail-along-leaving-a-silver-line-f66314.mp3 | The snail … along, leaving a silver line. | 1 |
| /audio/assessment/v3/sentences/he-the-balloon-until-it-nearly-burst-ecfe9b.mp3 | He … the balloon until it nearly burst. | 1 |
| /audio/assessment/v3/sentences/dad-the-squeaky-wheel-with-oil-69de35.mp3 | Dad … the squeaky wheel with oil. | 1 |
| /audio/assessment/v3/sentences/bees-from-rose-to-rose-93a984.mp3 | Bees … from rose to rose. | 1 |
| /audio/assessment/v3/sentences/the-ice-slowly-in-the-warm-sun-940126.mp3 | The ice … slowly in the warm sun. | 1 |
| /audio/assessment/v3/sentences/the-wind-the-washing-dry-674fd2.mp3 | The wind … the washing dry. | 1 |
| /audio/assessment/v3/sentences/the-baby-at-every-funny-face-5d0fa2.mp3 | The baby … at every funny face. | 1 |

## 3. Passage read-alouds

| File | Script | Used by |
|---|---|---|
| /audio/assessment/v3/passages/all-week-the-nights-were-freezing-cold-by-sa-21a2ba.mp3 | All week the nights were freezing cold. By Saturday, the park pond wore a lid of grey ice. The ducks stood on top of it, looking puzzled, and slid about on flat orange feet. | 1 |
| /audio/assessment/v3/passages/zack-tipped-the-seed-packet-too-fast-seeds-s-5d0f2a.mp3 | Zack tipped the seed packet too fast. Seeds sprayed all over the path instead of the flower bed. Within a minute, six pigeons landed and began pecking up every last one. | 1 |
| /audio/assessment/v3/passages/gran-put-three-drops-of-oil-on-the-door-hing-6313bf.mp3 | Gran put three drops of oil on the door hinge. She swung the door back and forth to work the oil in. After that, the door opened without its awful screech, and the baby could nap in peace. | 1 |
| /audio/assessment/v3/passages/nobody-watered-the-classroom-plant-over-half-79dd44.mp3 | Nobody watered the classroom plant over half term. When the children came back, its leaves hung down like tired flags, and the soil in the pot was hard and pale. | 1 |
| /audio/assessment/v3/passages/dad-left-the-crayon-box-on-the-back-seat-of-dc0752.mp3 | Dad left the crayon box on the back seat of the car on the hottest day of summer. When Mina opened the door after lunch, the crayons had melted together into one rainbow lump. | 1 |
| /audio/assessment/v3/passages/leah-rubbed-the-balloon-on-her-jumper-ten-ti-cbee5f.mp3 | Leah rubbed the balloon on her jumper ten times. Then she held it just above her head. Her hair rose up toward the balloon in thin strands, as if it wanted to follow it around the room. | 1 |
| /audio/assessment/v3/passages/snow-fell-all-night-without-stopping-by-morn-408d33.mp3 | Snow fell all night without stopping. By morning it lay deeper than Papa's boots. The radio read a list of closed schools, and Amini's school was third on the list. | 1 |
| /audio/assessment/v3/passages/omar-forgot-to-press-the-lid-onto-the-popcor-192030.mp3 | Omar forgot to press the lid onto the popcorn pot. When the corn began to pop, it leapt from the pot like tiny white fireworks, bouncing off the counter and skittering across the kitchen floor. | 1 |
| /audio/assessment/v3/passages/the-kettle-began-to-whistle-high-and-loud-au-2a6008.mp3 | The kettle began to whistle, high and loud. Auntie hurried in from the garden, still holding her trowel, and lifted it off the heat. The whistling faded to a sigh. | 1 |
| /audio/assessment/v3/passages/bruno-barked-before-anyone-knocked-two-secon-840e79.mp3 | Bruno barked before anyone knocked. Two seconds later, the doorbell rang, and the delivery man stood on the step. Bruno's ears had heard the gate creak long before any human did. | 1 |
| /audio/assessment/v3/passages/hana-s-chalk-drawing-of-a-rocket-covered-the-73dba8.mp3 | Hana's chalk drawing of a rocket covered the whole path. That night, rain fell for hours. In the morning only a faint pink cloud remained where the rocket had been. | 1 |
| /audio/assessment/v3/passages/by-the-end-of-the-walk-milly-was-carrying-he-7cdb99.mp3 | By the end of the walk, Milly was carrying her ice cream cone at a slant, licking fast. Sweet white drips raced down her fingers and dotted the pavement behind her like a trail. | 1 |
| /audio/assessment/v3/passages/in-the-tunnel-under-the-railway-finn-shouted-8de755.mp3 | In the tunnel under the railway, Finn shouted 'HELLO!' His own voice bounced straight back at him, twice. He grinned and tried a bark, a whoop, and a tiny polite cough. | 1 |
| /audio/assessment/v3/passages/mo-s-bike-had-spent-the-whole-winter-outside-6b7cc4.mp3 | Mo's bike had spent the whole winter outside under no cover. In spring, the chain was stiff and the handlebars wore freckles of orange rust that had not been there before. | 1 |
| /audio/assessment/v3/passages/at-the-beach-rosa-built-her-sandcastle-close-7d2636.mp3 | At the beach, Rosa built her sandcastle close to the shining wet sand. She worked on it all afternoon. By teatime, the sea had crept up the beach, and her castle softened into a smooth little hill. | 1 |
| /audio/assessment/v3/passages/all-the-curtains-in-the-front-room-used-to-b-e69a7a.mp3 | All the curtains in the front room used to be deep blue. The pair by the big sunny window are now pale, almost grey, while the pair in the shady corner still look brand new. | 1 |
| /audio/assessment/v3/passages/the-moth-circled-the-porch-light-for-the-ten-69d1e7.mp3 | The moth circled the porch light for the tenth time. Round and round it went, tapping the warm glass, ignoring the whole dark garden behind it. | 1 |
| /audio/assessment/v3/passages/pia-s-shoes-had-fitted-at-the-start-of-summe-43adbd.mp3 | Pia's shoes had fitted at the start of summer. Now her toes pressed the ends, and by home time her feet ached. Mum measured her feet and laughed: a whole size bigger. | 1 |
| /audio/assessment/v3/passages/nobody-wrapped-the-bread-after-breakfast-it-47abbf.mp3 | Nobody wrapped the bread after breakfast. It sat on the board all day and all night. By morning the slices were hard at the edges and curled up like little rooftops. | 1 |
| /audio/assessment/v3/passages/the-little-ramp-was-set-up-on-the-rug-kip-le-ecc489.mp3 | The little ramp was set up on the rug. Kip let go of the marble at the top. It rolled faster and faster, shot off the end, and did not stop until it clicked against the skirting board. | 1 |
| /audio/assessment/v3/passages/it-rained-hard-all-morning-when-it-stopped-t-848d6c.mp3 | It rained hard all morning. When it stopped, the path through the grass was dotted with worms, dozens of them, stretched out on the wet stones. | 1 |
| /audio/assessment/v3/passages/ivy-laughed-first-at-nothing-much-at-all-the-c95ca7.mp3 | Ivy laughed first, at nothing much at all. Then her brother caught it, then Dad, then even Grandma behind her newspaper. Soon the whole room was laughing and nobody could say why. | 1 |
| /audio/assessment/v3/passages/the-candle-flame-stood-tall-and-still-until-4cf727.mp3 | The candle flame stood tall and still until Dad opened the hallway door. Then it bent sideways, flickered wildly, and almost went out before the door clicked shut again. | 1 |
| /audio/assessment/v3/passages/warm-milk-a-dim-lamp-one-last-story-halfway-2aba77.mp3 | Warm milk, a dim lamp, one last story. Halfway through the second page, Suki's eyes closed all by themselves, and Papa tiptoed out with the book still open in his hand. | 1 |
| /audio/assessment/v3/passages/a-wasp-smelled-the-open-jam-jar-on-the-windo-20beb8.mp3 | A wasp smelled the open jam jar on the windowsill. It flew in through the kitchen window. Startled, Uncle Josh jumped back from the counter, knocked the flour bag with his elbow, and a white cloud settled slowly over the clean dishes. | 1 |
| /audio/assessment/v3/passages/the-night-frost-cracked-the-old-clay-pot-on-3477f8.mp3 | The night frost cracked the old clay pot on the balcony. Soil trickled out of the crack all week. With half its soil gone, the rosemary plant tipped over in the next strong wind, and the falling pot startled the pigeons off the rail. | 1 |
| /audio/assessment/v3/passages/dee-left-the-bath-tap-running-while-she-answ-b7a027.mp3 | Dee left the bath tap running while she answered the phone. The call was long. Water crept over the edge of the bath, found the gap by the pipe, and by the time Dee hung up, a brown ring was spreading on the kitchen ceiling below. | 1 |
| /audio/assessment/v3/passages/the-football-pitch-flooded-on-friday-so-satu-ea482c.mp3 | The football pitch flooded on Friday, so Saturday's match moved to the school yard. The yard's hard ground made the ball bounce twice as high, and twice-as-high bounces sailed over the fence, which is how Mr Njoku's tomatoes met seven footballs in one afternoon. | 1 |
| /audio/assessment/v3/passages/someone-propped-the-freezer-door-open-with-a-f92d41.mp3 | Someone propped the freezer door open with a yoghurt pot during the party. Overnight the ice cream softened to milkshake. In the morning, the melting tub dripped through the shelf onto the peas, gluing the bags together in one frosty block. | 1 |
| /audio/assessment/v3/passages/the-lift-was-crowded-and-somebody-s-rucksack-81666f.mp3 | The lift was crowded, and somebody's rucksack pressed every button at once. The lift began stopping at every single floor. All the stopping made Priya late to the dentist upstairs, and her name was called just as she burst out of the lift doors, breathing hard. | 1 |
| /audio/assessment/v3/passages/a-strong-gust-snapped-the-kite-s-thin-tail-w-3c314b.mp3 | A strong gust snapped the kite's thin tail. Without its tail, the kite began spinning instead of gliding. The spinning wound the string around the flagpole three times, and that is where the kite stayed, rattling like a trapped bird, until the caretaker fetched his ladder. | 1 |
| /audio/assessment/v3/passages/the-bathroom-mirror-steamed-up-during-amir-s-b1346e.mp3 | The bathroom mirror steamed up during Amir's hot shower. He wiped it with a towel, which left fine fluff all over the glass. When the mirror dried, the fluff showed worse than the steam had, so he washed the mirror properly, which is how one hot shower led to cleaning the whole bathroom. | 1 |
| /audio/assessment/v3/passages/the-school-fair-made-more-money-than-ever-th-5f1bca.mp3 | The school fair made more money than ever this year. The weather was warm and dry, so crowds stayed all afternoon. The new baking stall sold out twice. And because the fair fell on payday weekend, purses were a little fuller than usual. | 1 |
| /audio/assessment/v3/passages/rui-slept-through-his-alarm-for-three-reason-7d383c.mp3 | Rui slept through his alarm for three reasons. He had stayed up late finishing his comic. His phone had died in the night, so the alarm never rang. And the thick new curtains kept his room as dark as a cave long past sunrise. | 1 |
| /audio/assessment/v3/passages/the-cactus-on-the-windowsill-turned-soft-and-465e2e.mp3 | The cactus on the windowsill turned soft and brown. Grandpa had watered it every single day, though a cactus wants water rarely. The pot had no hole, so the water sat around its roots. And the cold glass at night chilled it again and again. | 1 |
| /audio/assessment/v3/passages/half-the-class-had-colds-by-friday-all-week-50969b.mp3 | Half the class had colds by Friday. All week the rain had kept everyone crowded indoors at break. The window monitor was away, so no one aired the stuffy room. And two children had come in sniffing on Monday instead of resting at home. | 1 |
| /audio/assessment/v3/passages/the-old-rope-swing-finally-snapped-on-sunday-4ee887.mp3 | The old rope swing finally snapped on Sunday. Years of rain and sun had chewed at the fibres. The knot rubbed the same branch groove every swing. And that afternoon, for the first time, two riders had squeezed on together. | 1 |
| /audio/assessment/v3/passages/the-bakery-queue-stretched-round-the-corner-e98c1d.mp3 | The bakery queue stretched round the corner on Saturday. A food show had filmed there on Tuesday, and clips were everywhere. The rival bakery across town was shut for repairs. And Saturday was the first day of the famous plum tarts. | 1 |
| /audio/assessment/v3/passages/nobody-heard-the-phone-ring-at-lunch-the-ble-b5839a.mp3 | Nobody heard the phone ring at lunch. The blender was roaring through a smoothie. The radio was on for the cricket. And the phone itself was buried somewhere under the sofa cushions, ringing into the springs. | 1 |
| /audio/assessment/v3/passages/the-little-boat-was-hard-to-row-home-the-tid-f9031d.mp3 | The little boat was hard to row home. The tide had turned against them. The wind blew straight off the shore into their faces. And the afternoon's happy swimming had left both rowers with arms like wet spaghetti. | 1 |
| /audio/assessment/v3/passages/wherever-the-school-cat-sat-children-gathere-d2b861.mp3 | Wherever the school cat sat, children gathered. New visitors sometimes thought the children attracted the cat. The dinner ladies knew better: the cat chose the sunniest spot first, and the children simply followed him to it. | 1 |
| /audio/assessment/v3/passages/on-sports-day-jo-wore-her-lucky-red-socks-an-ea2440.mp3 | On sports day, Jo wore her lucky red socks and won three races. 'The socks make me fast,' she told everyone. Her coach smiled and pointed at the training chart on the wall: every square of the last two months was ticked. | 1 |
| /audio/assessment/v3/passages/every-time-the-floorboard-by-the-kitchen-cre-9bb46b.mp3 | Every time the floorboard by the kitchen creaked, Biscuit the dog appeared, and moments later food hit his bowl. A visitor might think the creak fed the dog. In truth, Dad stepping on that board meant Dad was fetching the dog food tin from that exact cupboard. | 1 |
| /audio/assessment/v3/passages/the-louder-the-crowd-sang-the-harder-the-ban-9c7639.mp3 | The louder the crowd sang, the harder the band played. And the harder the band played, the louder the crowd sang. By the last song, no one could say who was driving whom — the whole hall had become one big engine of noise. | 1 |
| /audio/assessment/v3/passages/umbrellas-do-not-bring-the-rain-gran-says-th-487d35.mp3 | Umbrellas do not bring the rain, Gran says, though on our street it can look that way: the moment umbrellas bloom along the pavement, down it comes. Of course, everyone opens them because the first drops have already begun to fall. | 1 |
| /audio/assessment/v3/passages/whenever-the-ice-cream-van-s-tune-started-ta-929d56.mp3 | Whenever the ice-cream van's tune started, Tam's tummy rumbled. Tam decided the tune made him hungry. Mum laughed: the van always came at four o'clock — exactly the hour a boy who skipped his lunchtime peas gets hungry anyway. | 1 |
| /audio/assessment/v3/passages/the-rooster-crowed-and-the-sun-came-up-it-ha-f5c191.mp3 | The rooster crowed, and the sun came up. It happened every single morning, in that order. The farmer liked to joke that his rooster raised the sun. The vet put it differently: the first grey light wakes the rooster, and the crowing follows. | 1 |
| /audio/assessment/v3/passages/firefighters-arrive-at-big-fires-and-small-f-b2d2e9.mp3 | Firefighters arrive at big fires, and small fires have no firefighters at all. Looking only at that, you might decide firefighters make fires bigger. Ana's project poster explained it the right way round: the bigger the fire already is, the more firefighters get sent to it. | 1 |
| /audio/assessment/v3/passages/joss-shook-the-fizzy-drink-can-all-the-way-h-eae27f.mp3 | Joss shook the fizzy drink can all the way home, just to hear it slosh. When Dad opened it at the table, a hissing fountain leapt out and rained on the tablecloth. | 1 |
| /audio/assessment/v3/passages/the-torch-had-sat-in-the-freezing-shed-all-w-bc014d.mp3 | The torch had sat in the freezing shed all winter. When Ben clicked it on for the camp-out, the beam glowed dull orange for a minute and then gave up completely. | 1 |
| /audio/assessment/v3/passages/auntie-bel-sneezed-six-times-before-she-even-3306a1.mp3 | Auntie Bel sneezed six times before she even said hello. Her eyes were pink and watery. On her lap, completely comfortable, sat the neighbour's fluffy white cat. | 1 |
| /audio/assessment/v3/passages/the-strawberries-were-forgotten-at-the-back-776df2.mp3 | The strawberries were forgotten at the back of the fridge for two weeks. When Val found the box, a soft grey fur had crept over every berry. | 1 |
| /audio/assessment/v3/passages/the-plug-chain-had-slipped-off-its-hook-into-8ed92d.mp3 | The plug chain had slipped off its hook into the water. Nobody noticed while the bath emptied itself, glug by glug, until only a cold puddle was left around Otto's toes. | 1 |
| /audio/assessment/v3/passages/nia-s-birthday-balloon-slipped-out-of-her-ha-5e4265.mp3 | Nia's birthday balloon slipped out of her hand indoors. It sailed straight up and bumped softly against the ceiling, where it stayed all week, just out of reach of the broom. | 1 |
| /audio/assessment/v3/passages/a-seagull-spotted-pia-s-chip-bag-the-moment-157d86.mp3 | A seagull spotted Pia's chip bag the moment she sat on the sea wall. It swooped once, low and bold, and a heartbeat later the biggest chip was travelling down the beach at wing-speed. | 1 |
| /audio/assessment/v3/passages/the-trolley-sang-a-squeaky-song-all-round-th-26b3d3.mp3 | The trolley sang a squeaky song all round the supermarket — eee-aww, eee-aww. Dad crouched by the front wheel and found a flattened piece of chewing gum stuck right around it. | 1 |
| /audio/assessment/v3/passages/marta-s-hiccups-started-when-she-gulped-her-ecb429.mp3 | Marta's hiccups started when she gulped her fizzy lemonade too fast. The hiccups made her giggle. The giggling shook more bubbles loose, which brought more hiccups, and soon she had to put the glass down until both the giggles and the hiccups wore themselves out. | 1 |
| /audio/assessment/v3/passages/the-paint-tin-was-left-open-overnight-by-mor-1dd591.mp3 | The paint tin was left open overnight. By morning a skin had formed across the top. When Dad stirred the skin in, little rubbery flecks spread through the paint, and every stroke he brushed onto the door left tiny lumps, so the whole door had to be sanded and painted again. | 1 |
| /audio/assessment/v3/passages/the-washing-took-all-day-to-dry-the-morning-c31ced.mp3 | The washing took all day to dry. The morning was misty and damp. The line hung in the shadiest corner of the yard. And Mum had wrung nothing out, pegging everything up still dripping. | 1 |
| /audio/assessment/v3/passages/the-school-hamster-escaped-in-the-night-his-eebdeb.mp3 | The school hamster escaped in the night. His cage door had a weak latch that never quite clicked. The caretaker had moved the cage next to the shelf, making a perfect bridge. And carrot night meant the door had been opened one extra time. | 1 |
| /audio/assessment/v3/passages/ice-cream-sales-and-sunburn-both-jump-in-jul-d7ad77.mp3 | Ice-cream sales and sunburn both jump in July. One silly newspaper joked that ice cream causes sunburn. Class 4 worked out the truth for their science wall: hot sunny weather causes BOTH — more cones eaten, more skin burned. | 1 |
| /audio/assessment/v3/passages/grandad-noticed-that-the-streetlights-always-b3777f.mp3 | Grandad noticed that the streetlights always came on just as he yawned his first evening yawn. 'My yawns switch them on,' he liked to say. Actually both had the same cause: the sky growing dark — dark enough for lights, late enough for yawns. | 1 |
| /audio/assessment/v3/passages/the-magnet-in-theo-s-pocket-sat-right-next-t-3ad0c0.mp3 | The magnet in Theo's pocket sat right next to his compass on the hike. The needle swung to point at the magnet instead of north. Trusting the needle, the group turned left at the fork, and the left path took them in a long loop back to their own starting stile. | 1 |
| /audio/assessment/v3/passages/the-candles-on-the-cake-would-not-stay-lit-t-f9aa66.mp3 | The candles on the cake would not stay lit. The back door stood open to the garden. The ceiling fan spun on full. And two excited cousins were bouncing on the bench, puffing with laughter right at candle height. | 1 |
| /audio/assessment/v3/passages/by-eight-o-clock-tara-was-drowsy-so-sleepy-t-d0df04.mp3 | By eight o'clock Tara was drowsy — so sleepy that her eyes kept sliding shut in the middle of her favourite programme. | 1 |
| /audio/assessment/v3/passages/the-vase-was-fragile-which-means-it-could-br-31a480.mp3 | The vase was fragile, which means it could break very easily, so Mum carried it across the room with two careful hands. | 1 |
| /audio/assessment/v3/passages/our-new-tent-is-sturdy-strongly-made-and-har-fb0ec9.mp3 | Our new tent is sturdy — strongly made and hard to knock over. Even the wild wind on the hilltop could not flatten it. | 1 |
| /audio/assessment/v3/passages/a-murmur-is-a-soft-low-sound-of-voices-from-23bc8b.mp3 | A murmur is a soft, low sound of voices. From the top of the stairs, Lila could hear the murmur of the grown-ups talking downstairs. | 1 |
| /audio/assessment/v3/passages/the-path-was-covered-in-jagged-stones-sharp-620d19.mp3 | The path was covered in jagged stones — sharp, pointy ones with rough edges — so everyone kept their shoes on all the way to the waterfall. | 1 |
| /audio/assessment/v3/passages/hollow-means-empty-inside-the-old-log-by-the-1dc7d8.mp3 | Hollow means empty inside. The old log by the fence was hollow, and a whole family of mice had moved into the space within it. | 1 |
| /audio/assessment/v3/passages/the-lane-was-chilly-that-morning-cold-enough-8acba4.mp3 | The lane was chilly that morning — cold enough to make your fingers ache — so Pip pulled his sleeves down over his hands. | 1 |
| /audio/assessment/v3/passages/to-mend-something-is-to-fix-it-grandpa-mende-49452f.mp3 | To mend something is to fix it. Grandpa mended the torn net with a needle and green string, and by tea time it was good as new. | 1 |
| /audio/assessment/v3/passages/the-picnic-was-a-real-feast-sandwiches-sausa-9bfd87.mp3 | The picnic was a real feast: sandwiches, sausage rolls, two kinds of cake, a bowl of cherries, and a jug of cold lemonade that never seemed to empty. | 1 |
| /audio/assessment/v3/passages/milo-s-desk-was-full-of-clutter-old-wrappers-fdecfc.mp3 | Milo's desk was full of clutter — old wrappers, dried-up pens, a single glove, broken crayons, and three notes from last term he never took home. | 1 |
| /audio/assessment/v3/passages/enormous-things-filled-the-museum-hall-a-wha-808160.mp3 | Enormous things filled the museum hall: a whale skeleton longer than a bus, a boulder taller than Dad, and a footprint big enough for Nia to sit inside. | 1 |
| /audio/assessment/v3/passages/everything-about-the-morning-was-gleaming-th-10afb6.mp3 | Everything about the morning was gleaming: the polished trumpet, the wet road after rain, the foil stars on the classroom window, and Dad's freshly washed car. | 1 |
| /audio/assessment/v3/passages/timid-creatures-live-in-the-hedge-the-mouse-3f24b1.mp3 | Timid creatures live in the hedge: the mouse that bolts at a footstep, the wren that hides deep in the leaves, and the rabbit that thumps once and vanishes down its hole. | 1 |
| /audio/assessment/v3/passages/swift-things-flashed-past-the-window-all-jou-505347.mp3 | Swift things flashed past the window all journey: racing motorbikes, a hawk stooping after a sparrow, and express trains that were gone almost before you saw them. | 1 |
| /audio/assessment/v3/passages/ancient-things-filled-great-uncle-ho-s-shelf-c0db7f.mp3 | Ancient things filled Great-Uncle Ho's shelf: a coin worn smooth by a thousand years of thumbs, a map of countries that no longer exist, and a cracked pot older than the town itself. | 1 |
| /audio/assessment/v3/passages/all-the-soggy-things-went-by-the-radiator-ke-deddfe.mp3 | All the soggy things went by the radiator: Ken's socks after the puddle, the towel from swimming, and the newspaper that had spent the night on the wet step. | 1 |
| /audio/assessment/v3/passages/the-hungry-puppy-did-not-chew-politely-he-go-576cc5.mp3 | The hungry puppy did not chew politely. He gobbled his whole dinner in four huge mouthfuls and then licked the empty bowl across the floor. | 1 |
| /audio/assessment/v3/passages/the-swans-glided-across-the-lake-their-bodie-849a18.mp3 | The swans glided across the lake. Their bodies slid along smooth as paper boats, without one splash, while their feet paddled secretly below. | 1 |
| /audio/assessment/v3/passages/the-squirrel-scampered-along-the-fence-quick-95a6c2.mp3 | The squirrel scampered along the fence — quick light steps, a leap, more quick steps — and was up the oak tree before Milo could point. | 1 |
| /audio/assessment/v3/passages/please-please-please-can-we-keep-him-sol-ple-adc245.mp3 | 'Please, please, PLEASE can we keep him?' Sol pleaded, hands pressed together, following Mum from room to room with enormous hopeful eyes. | 1 |
| /audio/assessment/v3/passages/thunder-boomed-and-pepper-the-cat-trembled-u-e19548.mp3 | Thunder boomed, and Pepper the cat trembled under the bed — her whole small body shaking like a leaf in the wind until the storm rolled away. | 1 |
| /audio/assessment/v3/passages/grandpa-grumbled-all-the-way-up-the-hill-a-l-b3625f.mp3 | Grandpa grumbled all the way up the hill — a low, cross mutter about his knees, the weather, and whoever had invented hills in the first place. | 1 |
| /audio/assessment/v3/passages/one-by-one-the-soap-bubbles-drifted-over-the-8ad075.mp3 | One by one the soap bubbles drifted over the wall — floating wherever the breeze carried them, in no hurry to be anywhere at all. | 1 |
| /audio/assessment/v3/passages/baby-yara-gazed-at-the-mobile-above-her-cot-80808c.mp3 | Baby Yara gazed at the mobile above her cot — eyes wide, mouth open, watching the slow silver fish go round and round for a whole quiet hour. | 1 |
| /audio/assessment/v3/passages/the-fireworks-were-dazzling-the-display-was-1d3c5d.mp3 | The fireworks were dazzling. The display was so bright that people shielded their eyes, and so brilliant that even the streetlights seemed dim afterwards. | 1 |
| /audio/assessment/v3/passages/after-the-mountain-walk-the-hikers-were-wear-b66802.mp3 | After the mountain walk, the hikers were weary. Exhausted, worn out, done in — they dropped their packs at the hut door and nobody spoke for ten minutes. | 1 |
| /audio/assessment/v3/passages/a-strange-commotion-filled-the-yard-such-an-6dd6d4.mp3 | A strange commotion filled the yard — such an uproar, such a racket of clanging and squawking, that three teachers hurried out to see what the fuss could be. | 1 |
| /audio/assessment/v3/passages/caught-in-the-downpour-without-a-coat-priya-22dc07.mp3 | Caught in the downpour without a coat, Priya arrived drenched — soaked to the skin, wet through, dripping a little lake onto the doormat. | 1 |
| /audio/assessment/v3/passages/the-mouse-nibbled-the-cheese-tiny-bite-after-1bd339.mp3 | The mouse nibbled the cheese — tiny bite after tiny bite, nothing like the dog, who would have swallowed it whole in one gulp. | 1 |
| /audio/assessment/v3/passages/the-baker-kept-his-kitchen-spotless-not-a-cr-f54daa.mp3 | The baker kept his kitchen spotless. Not a crumb on the counters, not a smudge on the steel — so perfectly clean that the health inspector once asked for his secret. | 1 |
| /audio/assessment/v3/passages/the-kestrel-soared-over-the-cliff-rising-hig-36a746.mp3 | The kestrel soared over the cliff — rising higher and higher on the warm air, climbing without a single wing-beat until it was only a speck. | 1 |
| /audio/assessment/v3/passages/the-soup-was-bitter-sharp-and-sour-on-the-to-13a31d.mp3 | The soup was bitter — sharp and sour on the tongue, nothing like the sweet tomato soup from the tin — and Jonah's whole face folded up at the first spoonful. | 1 |
| /audio/assessment/v3/passages/unlike-her-sister-who-charged-into-every-new-38b47a.mp3 | Unlike her sister, who charged into every new place shouting hello, Faye was bashful, hanging back by the door until someone gently waved her in. | 1 |
| /audio/assessment/v3/passages/the-new-bridge-stood-firm-in-any-storm-but-t-8d6230.mp3 | The new bridge stood firm in any storm, but the old rope bridge was rickety — it wobbled and creaked at every single step, and two planks were missing. | 1 |
| /audio/assessment/v3/passages/while-the-town-square-buzzed-all-evening-the-26e09f.mp3 | While the town square buzzed all evening, the side streets were bare — no stalls, no lanterns, not a single person — as if the party had gathered every soul into one place. | 1 |
| /audio/assessment/v3/passages/everyone-expected-the-head-teacher-s-office-77c100.mp3 | Everyone expected the head teacher's office to be warm, but it was nippy in there — so much so that she kept a blanket on her chair while the corridor outside stayed toasty. | 1 |
| /audio/assessment/v3/passages/dad-walks-at-a-stroll-on-sundays-but-on-scho-91d7c5.mp3 | Dad walks at a stroll on Sundays, but on school mornings his pace is brisk — quick enough that Ida has to trot every few steps just to stay level. | 1 |
| /audio/assessment/v3/passages/the-twins-could-not-have-sounded-more-differ-564283.mp3 | The twins could not have sounded more different: Ade spoke up clearly for the whole hall to hear, while Bola preferred to mutter, so that only her own collar caught the words. | 1 |
| /audio/assessment/v3/passages/by-day-the-harbour-was-lively-but-at-midnigh-ffd122.mp3 | By day the harbour was lively, but at midnight it fell still: not one engine, not one voice, only rope against mast and the slow breathing of the sea. | 1 |
| /audio/assessment/v3/passages/instead-of-the-sharp-midday-light-the-lamp-g-b2f4a8.mp3 | Instead of the sharp midday light, the lamp gave only a dim glow — so faint that Noor had to hold her book almost against the bulb to read at all. | 1 |
| /audio/assessment/v3/passages/when-the-magician-clapped-the-coin-seemed-to-a732df.mp3 | When the magician clapped, the coin seemed to vanish. One moment it flashed between his fingers; the next his hands were empty, and the children searched the stage floor for a coin that simply was not there. | 1 |
| /audio/assessment/v3/passages/the-bear-s-winter-slumber-lasted-for-months-c35a9c.mp3 | The bear's winter slumber lasted for months. Snow piled over the den mouth, storms came and went, and still nothing inside stirred until the first warm week of spring. | 1 |
| /audio/assessment/v3/passages/one-whiff-of-the-scent-drifting-from-the-kit-6d5ece.mp3 | One whiff of the scent drifting from the kitchen told Omar everything: cinnamon, warm sugar, a promise of apples. His homework could wait. | 1 |
| /audio/assessment/v3/passages/the-path-was-steep-and-the-day-was-hot-but-t-f3f3f4.mp3 | The path was steep and the day was hot, but the view from the top repaid every step: the whole valley lay below them like a green map, and nobody regretted the climb. | 1 |
| /audio/assessment/v3/passages/dev-peered-through-the-keyhole-then-through-f0d5f4.mp3 | Dev peered through the keyhole, then through the gap under the door, then through the frosted glass — anything for a glimpse of the birthday preparations he was strictly banned from seeing. | 1 |
| /audio/assessment/v3/passages/the-old-rowing-boat-bobbed-by-the-jetty-up-w-d3734b.mp3 | The old rowing boat bobbed by the jetty — up with each small wave, down again after it, gentle as a cork, never drifting from its rope. | 1 |
| /audio/assessment/v3/passages/roz-patched-the-knee-of-her-jeans-with-a-squ-9cbc6f.mp3 | Roz patched the knee of her jeans with a square of star-print cloth. The hole disappeared under the stars, the stitches held through every playtime, and the jeans lasted the whole year after all. | 1 |
| /audio/assessment/v3/passages/at-the-first-drops-everyone-dashed-for-the-b-353fc2.mp3 | At the first drops, everyone dashed for the bandstand — coats over heads, pushchairs bumping, ice creams abandoned — and reached its roof just as the sky truly opened. | 1 |
| /audio/assessment/v3/passages/snug-means-warm-comfortable-and-safe-inside-22f9ec.mp3 | Snug means warm, comfortable and safe. Inside her blanket nest with a book and the rain outside, Mia felt perfectly snug. | 1 |
| /audio/assessment/v3/passages/a-faint-sound-is-one-so-quiet-you-can-barely-1f6c33.mp3 | A faint sound is one so quiet you can barely hear it. From two gardens away came the faint tinkle of a wind chime. | 1 |
| /audio/assessment/v3/passages/gigantic-things-filled-theo-s-dinosaur-book-49946f.mp3 | Gigantic things filled Theo's dinosaur book: legs like tree trunks, teeth as long as rulers, and one footprint that could have held his whole paddling pool. | 1 |
| /audio/assessment/v3/passages/everything-delicate-went-on-the-top-shelf-th-56be62.mp3 | Everything delicate went on the top shelf: the paper lanterns, Gran's thin china cups, the sugar swan from the wedding, and the model ship made of matchsticks. | 1 |
| /audio/assessment/v3/passages/all-through-dinner-uncle-ray-was-grumpy-he-f-77ad79.mp3 | All through dinner Uncle Ray was grumpy — he frowned at the peas, sighed at the weather, and answered every question with a single flat word. | 1 |
| /audio/assessment/v3/passages/the-lizard-darted-across-the-hot-stone-path-53a54e.mp3 | The lizard darted across the hot stone path — there one blink, gone the next — and vanished under the rosemary bush before anyone could crouch for a look. | 1 |
| /audio/assessment/v3/passages/elderly-means-old-especially-for-a-person-th-6d51ad.mp3 | Elderly means old, especially for a person. The elderly man at number nine has lived on our street longer than every other neighbour put together. | 1 |
| /audio/assessment/v3/passages/the-junk-drawer-was-a-jumble-rubber-bands-ro-cfa864.mp3 | The junk drawer was a jumble: rubber bands round old keys, a torch tangled in string, batteries mixed with buttons, and somewhere underneath, the missing bicycle bell. | 1 |
| /audio/assessment/v3/passages/the-stray-kitten-was-famished-starving-truly-a3e021.mp3 | The stray kitten was famished — starving, truly hollow-bellied — and it emptied the saucer of food before Ella had even stood back up. | 1 |
| /audio/assessment/v3/passages/the-riddle-baffled-the-whole-family-it-puzzl-d8e7f7.mp3 | The riddle baffled the whole family. It puzzled Dad, confused Gran, and stumped even Priya, who does the crossword in pen. | 1 |
| /audio/assessment/v3/passages/most-days-the-sea-slapped-the-rocks-in-fury-acb799.mp3 | Most days the sea slapped the rocks in fury, but this morning it was placid — flat, quiet water without one white wave from the beach to the buoy. | 1 |
| /audio/assessment/v3/passages/the-first-clue-was-simple-enough-for-anyone-28ed17.mp3 | The first clue was simple enough for anyone, but the last was so cunning that even the puzzle club's champion chewed her pencil over it until the bell. | 1 |
| /audio/assessment/v3/passages/the-parcel-was-so-cumbersome-that-jai-had-to-26d737.mp3 | The parcel was so cumbersome that Jai had to carry it with both arms wrapped right around, walking sideways through doorways and resting at every corner. | 1 |
| /audio/assessment/v3/passages/one-sniff-of-the-milk-made-asha-wince-and-ho-2c9b16.mp3 | One sniff of the milk made Asha wince and hold the bottle at arm's length. It had turned rancid days ago, somewhere at the warm back of the van. | 1 |
| /audio/assessment/v3/passages/loyal-to-the-end-the-old-sheepdog-shadowed-f-a785a6.mp3 | Loyal to the end, the old sheepdog shadowed Farmer Bell everywhere — faithful through rain, market days, and even trips to the vet. | 1 |
| /audio/assessment/v3/passages/the-classroom-fell-silent-as-the-results-wer-2fb2c4.mp3 | The classroom fell silent as the results were read, and when her name came last — first place — Zainab beamed, a smile so wide it seemed to light the room. | 1 |
| /audio/assessment/v3/passages/sami-stood-in-the-wings-holding-his-recorder-aa7a42.mp3 | Sami stood in the wings holding his recorder. He wiped his hands on his shirt three times. Through the curtain he could see all the chairs were full. He peeped at the audience, then quickly stepped back and checked his music again. | 1 |
| /audio/assessment/v3/passages/lena-s-cat-had-been-at-the-vet-all-day-when-65ae76.mp3 | Lena's cat had been at the vet all day. When Mum's phone finally rang, Lena froze. Mum listened, then smiled and gave a thumbs up. Lena let out a long breath and flopped onto the sofa like a rag doll. | 1 |
| /audio/assessment/v3/passages/everyone-else-had-finished-the-race-dara-was-c28083.mp3 | Everyone else had finished the race. Dara was still running, last by a whole lap. She kept her eyes on the finish line and pumped her arms. When she crossed it, she punched the air as if she had come first. | 1 |
| /audio/assessment/v3/passages/at-the-new-school-gate-ivo-held-dad-s-hand-a-f9d4ad.mp3 | At the new school gate, Ivo held Dad's hand a little too hard. He watched the other children stream past, laughing in twos and threes. He did not know a single name. He practised saying 'hello' very quietly to himself. | 1 |
| /audio/assessment/v3/passages/bea-s-balloon-slipped-off-her-wrist-at-the-f-8db353.mp3 | Bea's balloon slipped off her wrist at the fair. She watched the red dot get smaller and smaller in the sky. Her lip wobbled. Then she looked down at the string still in her hand and quickly wiped one eye with her sleeve. | 1 |
| /audio/assessment/v3/passages/kofi-had-studied-his-spelling-words-all-week-5c1996.mp3 | Kofi had studied his spelling words all week. When Miss Reed handed back the tests, she gave his desk a little tap and a wink. Kofi looked at the top of his page, sat up very straight, and could not stop smiling for the whole lesson. | 1 |
| /audio/assessment/v3/passages/the-tour-guide-switched-off-the-lights-insid-123cd8.mp3 | The tour guide switched off the lights inside the cave. The dark was thicker than any night. Noor squeezed her torch but did not turn it on. 'One minute of true dark,' the guide had promised. Noor counted slowly and kept both feet very still. | 1 |
| /audio/assessment/v3/passages/ren-watched-his-sister-open-her-birthday-par-d95f75.mp3 | Ren watched his sister open her birthday parcel. Inside was the robot he had wanted for months. He clapped along with everyone else, but his clap was slow. He kept looking at the robot, then at his own empty hands. | 1 |
| /audio/assessment/v3/passages/everything-smelled-of-warm-bread-rows-of-bun-7df555.mp3 | Everything smelled of warm bread. Rows of buns sat behind curved glass. A bell above the door jingled, and a lady in a floury apron called out, 'Next, please!' | 1 |
| /audio/assessment/v3/passages/mara-pulled-her-armbands-tight-the-air-smell-376c66.mp3 | Mara pulled her armbands tight. The air smelled of chlorine, and shouts echoed off the high ceiling. Somewhere a whistle blew, and the big clock on the wall had only one long red hand. | 1 |
| /audio/assessment/v3/passages/hush-hung-over-the-long-tables-pages-turned-11ca48.mp3 | Hush hung over the long tables. Pages turned with tiny whispers. A trolley of books rolled softly past, and a lady stamped a date inside a cover. 'Two weeks,' she mouthed, almost silently. | 1 |
| /audio/assessment/v3/passages/straw-crunched-under-tia-s-boots-something-w-295254.mp3 | Straw crunched under Tia's boots. Something warm and huge breathed near her shoulder, smelling of grass. A bucket clanked, and a man in muddy overalls said, 'She likes you. Want to hold the brush?' | 1 |
| /audio/assessment/v3/passages/the-floor-hummed-under-their-feet-fields-sli-8dad1e.mp3 | The floor hummed under their feet. Fields slid past the window, faster and faster. A voice from the ceiling said the next stop was in ten minutes, and a trolley of snacks squeaked up the aisle. | 1 |
| /audio/assessment/v3/passages/blue-light-rippled-across-everyone-s-faces-a-49349a.mp3 | Blue light rippled across everyone's faces. A long shadow glided by behind the glass, and a hundred silver shapes turned at once like one creature. 'No flash photos,' whispered the guide. | 1 |
| /audio/assessment/v3/passages/trays-clattered-somewhere-behind-the-counter-f0b56f.mp3 | Trays clattered somewhere behind the counter. The smell of gravy filled the hall. Omar slid his tray along the rails, said 'yes please' to the peas, and looked for an empty seat beside his friends. | 1 |
| /audio/assessment/v3/passages/gulls-screamed-overhead-wind-tugged-the-flag-b9f9c7.mp3 | Gulls screamed overhead. Wind tugged the flags on the sandcastles. Somewhere an ice-cream van sang its tinkling song, and Dad rubbed cream on Zoe's nose, saying the sun was strong today. | 1 |
| /audio/assessment/v3/passages/black-clouds-rolled-over-the-park-the-wind-f-1d4d72.mp3 | Black clouds rolled over the park. The wind flipped the picnic blanket corner over the sandwiches. Far away, thunder grumbled. Mum started packing the food back into the basket, fast. | 1 |
| /audio/assessment/v3/passages/theo-filled-the-tub-with-warm-water-he-fetch-af062b.mp3 | Theo filled the tub with warm water. He fetched the dog shampoo and an old towel. Then he opened the back door and called, 'Biscuit! Here, boy!' From the garden came the sound of happy, muddy paws. | 1 |
| /audio/assessment/v3/passages/the-smell-of-toast-turned-sharp-and-smoky-a-f204d2.mp3 | The smell of toast turned sharp and smoky. A thin grey wisp curled out of the toaster. Dad sniffed twice, dropped his newspaper, and ran for the kitchen. | 1 |
| /audio/assessment/v3/passages/aya-counted-her-pocket-money-twice-she-put-o-3827b4.mp3 | Aya counted her pocket money twice. She put on her coat and took the empty honey jar from the shelf. 'Back soon,' she called, 'we need more for the pancakes!' | 1 |
| /audio/assessment/v3/passages/the-torch-blinked-went-dim-then-died-raj-sho-e162a8.mp3 | The torch blinked, went dim, then died. Raj shook it, but the dark stayed. He remembered the drawer in the kitchen where the little round batteries lived, and he felt his way toward the stairs. | 1 |
| /audio/assessment/v3/passages/nell-s-baby-brother-finally-fell-asleep-in-h-e68e44.mp3 | Nell's baby brother finally fell asleep in his cot. Mum tiptoed out backwards. Just then, Nell's music box began to plink loudly in her pocket. Mum spun round with wide eyes. | 1 |
| /audio/assessment/v3/passages/frost-had-turned-the-path-to-glass-overnight-9daf38.mp3 | Frost had turned the path to glass overnight. Grandad tested it with one boot and slid an arm's length. 'Not today,' he said, looking at the gritting sand by the gate. | 1 |
| /audio/assessment/v3/passages/the-jam-sandwich-was-gone-only-crumbs-led-aw-1d2125.mp3 | The jam sandwich was gone. Only crumbs led away across the kitchen floor, and the cat flap was still swinging gently. Outside, a magpie sat on the fence with something red and sticky on its beak. | 1 |
| /audio/assessment/v3/passages/ma-put-two-umbrellas-by-the-door-instead-of-1a763e.mp3 | Ma put two umbrellas by the door instead of one. She checked the window again, then rolled up the picnic rug and slid it back on top of the cupboard. 'We'll do the indoor museum instead,' she said, 'and take the bus, not walk.' | 1 |
| /audio/assessment/v3/passages/at-lunch-marco-slid-his-orange-across-to-lil-b997e3.mp3 | At lunch, Marco slid his orange across to Lily without a word. Lily's lunchbox had fallen in a puddle that morning, and everyone had seen her empty tray. Marco kept his eyes on his own sandwich, as if nothing had happened. | 1 |
| /audio/assessment/v3/passages/pia-usually-raced-her-scooter-down-hill-lane-3534ff.mp3 | Pia usually raced her scooter down Hill Lane. Today she got off at the top and walked it down slowly, holding the brake lever the whole way. Halfway down, she stepped carefully around a patch where the council had painted a wet, shining square of new tar. | 1 |
| /audio/assessment/v3/passages/gran-turned-the-television-right-down-when-t-8a0730.mp3 | Gran turned the television right down when the phone rang. She carried the phone to the quiet hallway and shut the kitchen door behind her. 'Yes, doctor, I can hear you clearly now,' she said. | 1 |
| /audio/assessment/v3/passages/coach-adams-moved-jonah-from-striker-to-goal-902627.mp3 | Coach Adams moved Jonah from striker to goalkeeper for the final. Some parents muttered. But in training all week, Jonah had tipped every single shot over the bar, even the hard low ones. When the final whistle blew, Jonah had kept the only clean sheet of the season. | 1 |
| /audio/assessment/v3/passages/auntie-fern-always-kept-her-seed-packets-in-9a9b42.mp3 | Auntie Fern always kept her seed packets in old jam jars with the lids screwed tight. 'One flood in this shed was enough,' she would say, tapping a jar. On the top shelf, a faded brown tide mark still ran along the wooden wall. | 1 |
| /audio/assessment/v3/passages/on-the-first-bus-ride-to-school-by-herself-a-f230dc.mp3 | On the first bus ride to school by herself, Asha sat directly behind the driver, even though the back seats were empty and her friends always said the back was best. She held her ticket in her hand the whole way instead of putting it in her bag. | 1 |
| /audio/assessment/v3/passages/mr-okafor-propped-his-ladder-against-the-wal-f64447.mp3 | Mr Okafor propped his ladder against the wall, then moved it twice before climbing. Each time he pushed the feet a little farther from the wall and pressed down on a rung with his boot. Only when the ladder did not wobble at all did he pick up his paintbrush. | 1 |
| /audio/assessment/v3/passages/when-jess-came-in-from-the-garden-a-dripping-6ec926.mp3 | When Jess came in from the garden, a dripping umbrella already stood open in the bath. Two coats hung heavy on the radiator, and Mum was stuffing newspaper into a pair of dark, shining boots. | 1 |
| /audio/assessment/v3/passages/the-classroom-hamster-wheel-was-still-spinni-6951d6.mp3 | The classroom hamster wheel was still spinning slowly when the children arrived. The food bowl, full last night, held only two pellets, and the tissue-paper mountain in the corner now had a perfectly round doorway. | 1 |
| /audio/assessment/v3/passages/dad-met-them-at-the-door-wearing-one-oven-gl-721e48.mp3 | Dad met them at the door wearing one oven glove and a guilty smile. The kitchen window was wide open in the cold, a tea towel was flapping over the smoke alarm, and a very dark cake sat in the bin. | 1 |
| /audio/assessment/v3/passages/marta-s-recorder-case-felt-strangely-light-o-398347.mp3 | Marta's recorder case felt strangely light on the walk to school. When the music teacher asked everyone to play, Marta opened the case and found only a folded note from her little brother: 'Borrowed it for my pirate band. Sorry!' | 1 |
| /audio/assessment/v3/passages/the-garden-gnome-had-moved-again-on-monday-h-d9ddcb.mp3 | The garden gnome had moved again. On Monday he faced the pond; by Friday he was under the rose bush, wearing a doll's scarf. Grandpa swore he never touched him. From the fence, the little girl next door watched with a very serious face, and one more doll's scarf in her hand. | 1 |
| /audio/assessment/v3/passages/by-morning-the-bird-feeder-lay-on-the-grass-72ebb4.mp3 | By morning the bird feeder lay on the grass, split open and licked clean. The pole it hung from was bent in a smooth curve, like a drinking straw. In the flower bed below, deep five-toed prints led away toward the woods, each one wider than Dad's boot. | 1 |
| /audio/assessment/v3/passages/the-whole-flat-smelled-of-paint-though-the-w-4b3868.mp3 | The whole flat smelled of paint, though the walls were the same colour as ever. Newspaper was taped inside the bath tub, and tiny silver spots freckled Mum's glasses. On the balcony, Ela's old bicycle stood drying — suddenly, gloriously silver from wheel to wheel. | 1 |
| /audio/assessment/v3/passages/when-the-lights-came-back-on-the-ice-cream-t-bc9451.mp3 | When the lights came back on, the ice-cream tub on the counter was soft as soup, and the freezer drawers stood in puddles. The oven clock blinked 00:00, 00:00, 00:00, and every radio in the house had forgotten its stations. | 1 |
| /audio/assessment/v3/passages/tilly-said-she-did-not-mind-missing-the-trip-25293e.mp3 | Tilly said she did not mind missing the trip. She said it twice, in a bright voice. But all through art she drew the same picture: a little bus on a long road, with a girl waving from the window seat. | 1 |
| /audio/assessment/v3/passages/any-dog-would-do-said-ba-shrugging-at-the-sh-136554.mp3 | 'Any dog would do,' said Ba, shrugging at the shelter. Then a grey terrier pressed its nose to the bars. Ba knelt down for a long time. On the way home he asked, twice, whether terriers like long walks, and he kept the shelter's leaflet in his top pocket all week. | 1 |
| /audio/assessment/v3/passages/nobody-saw-who-tidied-the-book-corner-but-mi-1e752b.mp3 | Nobody saw who tidied the book corner. But Miss Diaz noticed that the shelves were sorted by colour, exactly like Femi sorts his pencil tin, and that the beanbag was patted into a neat square, just the way Femi leaves his chair cushion after lunch. | 1 |
| /audio/assessment/v3/passages/harri-claimed-the-win-did-not-matter-yet-the-411cb6.mp3 | Harri claimed the win did not matter. Yet the medal hung over his bed, polished every Sunday. The race photograph moved from the drawer, to the shelf, to a frame on the wall. And whenever visitors came, somehow the talk always found its way to that rainy sports day. | 1 |
| /audio/assessment/v3/passages/the-new-boy-said-he-had-never-played-chess-b-994a01.mp3 | The new boy said he had never played chess before. Then he set up every piece without looking at the box lid. He moved his knight in that funny L-shape straight away, and when Mr Salt's queen crept forward, the new boy smiled a small, knowing smile. | 1 |
| /audio/assessment/v3/passages/mum-insisted-she-was-wide-awake-for-the-film-24cda8.mp3 | Mum insisted she was wide awake for the film. Halfway through, her mug tipped gently in her hand, and Leo caught it. By the big ending, her head had found the cushion, and the credits rolled to the sound of long, slow breathing. | 1 |
| /audio/assessment/v3/passages/the-caretaker-grumbled-that-the-school-cat-w-8a691a.mp3 | The caretaker grumbled that the school cat was 'nothing but a nuisance'. But the nuisance had a cushion in the boiler room, a bowl marked C-A-T in the caretaker's own careful letters, and on cold mornings, the first warm lap it looked for was his. | 1 |
| /audio/assessment/v3/passages/priti-told-everyone-the-thunder-did-not-scar-70a4cc.mp3 | Priti told everyone the thunder did not scare her one bit. Still, at the first rumble she turned her music up very loud. At the second, she remembered an urgent reason to visit the kitchen, where Gran was. At the third, she decided the safest place to read was under her blanket with a torch. | 1 |
| /audio/assessment/v3/passages/the-splinter-was-tiny-but-it-was-in-milo-s-f-6e93de.mp3 | The splinter was tiny but it was IN Milo's finger. He looked away while Dad held the tweezers. 'Done,' said Dad, before Milo had even squeezed his eyes shut properly. Milo stared at his finger, then laughed out loud. | 1 |
| /audio/assessment/v3/passages/wren-had-saved-her-pocket-money-for-six-week-84e809.mp3 | Wren had saved her pocket money for six weeks. At the till, the shopkeeper counted her coins slowly and slid the paint set across the counter. Wren carried the bag with both hands all the way home, checking inside at every corner. | 1 |
| /audio/assessment/v3/passages/rows-of-red-seats-sloped-down-toward-the-glo-246b81.mp3 | Rows of red seats sloped down toward the glowing screen. Ana balanced the popcorn on her knees. The lights dimmed slowly, and a hush spread as the first music swelled. | 1 |
| /audio/assessment/v3/passages/everything-here-had-a-price-sticker-and-a-wo-3cbebc.mp3 | Everything here had a price sticker and a wobbling tower of tins. A voice announced that spilled grapes were being cleaned on aisle four. Mum ticked the last thing off her list and steered the rattling trolley toward the shortest queue. | 1 |
| /audio/assessment/v3/passages/kip-s-tummy-growled-in-the-quiet-classroom-l-cfc463.mp3 | Kip's tummy growled in the quiet classroom, loud as a bear. The clock said one minute until the lunch bell. He slid his workbook into his tray and looked at the door. | 1 |
| /audio/assessment/v3/passages/snow-had-fallen-all-night-thick-and-perfect-b4d9f4.mp3 | Snow had fallen all night, thick and perfect. Two carrots, a scarf, and a bag of coal buttons waited by the back door. Josh pulled on his mittens and pushed the door open into the white garden. | 1 |
| /audio/assessment/v3/passages/it-was-ola-s-turn-on-the-tall-slide-at-last-120270.mp3 | It was Ola's turn on the tall slide at last. From the top, the ground looked very far away. She gripped the rail, sang her favourite song under her breath, and let go. At the bottom she shouted, 'AGAIN!' | 1 |
| /audio/assessment/v3/passages/white-coats-hurried-past-on-soft-shoes-a-mac-8e8fef.mp3 | White coats hurried past on soft shoes. A machine somewhere beeped a steady, patient beep. Gran sat up in the high bed and grinned at the grapes they had brought her. | 1 |
| /audio/assessment/v3/passages/half-an-hour-before-the-guests-arrived-ade-h-e4b425.mp3 | Half an hour before the guests arrived, Ade hid his favourite dinosaur under his pillow. His baby cousins were coming, and last time, the smallest one had chewed the tail of his second-favourite dinosaur into a soggy stump. | 1 |
| /audio/assessment/v3/passages/the-cafe-owner-started-opening-one-hour-earl-137ddf.mp3 | The cafe owner started opening one hour earlier, at six. She put out a basket of day-old rolls marked 'help yourself' and left the outside light on in the dark mornings. The bin men, the postwoman, and the night-shift nurses began to wave through the window like old friends. | 1 |
| /audio/assessment/v3/passages/the-trail-of-tiny-muddy-paw-prints-began-at-8fc2bd.mp3 | The trail of tiny muddy paw prints began at the cat flap. It crossed the clean kitchen floor, climbed impossibly onto the counter, and ended in the middle of the fresh white birthday cake — where one candle now leaned at a guilty angle. | 1 |
| /audio/assessment/v3/passages/dad-came-home-from-the-allotment-whistling-w-f040a3.mp3 | Dad came home from the allotment whistling, which he never did. His muddy bag, usually flat, bulged in one huge round shape. He hid it behind his back through the whole kitchen, then said, far too casually, 'So... is the village show still on Saturday?' | 1 |
| /audio/assessment/v3/passages/sol-said-the-baby-lambs-were-fine-whatever-b-9a8f9c.mp3 | Sol said the baby lambs were 'fine, whatever'. But he was first up in the cold every morning to warm their bottles. He gave up Saturday football when the smallest lamb was poorly, and he kept a photo of it standing up for the first time. | 1 |
| /audio/assessment/v3/passages/the-head-teacher-announced-that-the-school-d-6f50b5.mp3 | The head teacher announced that the school definitely, absolutely did not have a mouse. Meanwhile, the caretaker was seen carrying a tiny humane trap and a jar of peanut butter toward the store room, and the cook had moved every open sack of flour onto the highest shelf. | 1 |
| /audio/assessment/v3/passages/nina-wrapped-her-library-book-in-a-plastic-b-b2d252.mp3 | Nina wrapped her library book in a plastic bag before putting it in her rucksack, even though the sky was blue. Her water bottle had leaked once before, all over her spelling homework, and the librarian's eyebrows were famous across three year groups. | 1 |
| /audio/assessment/v3/passages/every-plant-on-the-windowsill-leaned-the-sam-af796a.mp3 | Every plant on the windowsill leaned the same way, like dancers frozen mid-bow. The cactus alone stood up straight. Gran turned each pot half a circle, and by the next week, the leaners were bowing toward the window all over again. | 1 |
| /audio/production/en-US/assessment_passage/owen-wanted-a-book-about-storms-for-his-weather-project-he-looked-on-the-a57ab398de.mp3 | Owen wanted a book about storms for his weather project. He looked on the science shelf but could not find one. The librarian showed him a basket of weather books near the window. Owen chose a book with photographs of lightning. | 1 |
| /audio/production/en-US/assessment_passage/leo-painted-a-red-fire-truck-during-art-class-his-wide-brush-made-the-la-43212ba020.mp3 | Leo painted a red fire truck during art class. His wide brush made the ladder look messy. Ms. Chen gave him a thinner brush from the art box. Leo used the new brush to paint neat silver ladder lines. | 1 |
| /audio/production/en-US/assessment_passage/jonah-walked-on-the-beach-with-his-aunt-they-collected-empty-shells-for--085725b3ad.mp3 | Jonah walked on the beach with his aunt. They collected empty shells for a science tray. One shell had a tiny crab tucked inside it. Jonah left that shell on the sand and chose three empty shells instead. | 1 |
| /audio/production/en-US/assessment_passage/arlo-carried-warm-rolls-from-the-bakery-counter-the-paper-bag-tore-befor-0dfa67b143.mp3 | Arlo carried warm rolls from the bakery counter. The paper bag tore before he reached the door. Two rolls slipped onto a clean tray near the counter. Baker Tom gave Arlo a stronger bag. | 1 |
| /audio/production/en-US/assessment_passage/nina-rode-her-bike-along-the-park-path-a-loose-chain-made-the-pedals-sto-5c623edbcf.mp3 | Nina rode her bike along the park path. A loose chain made the pedals stop turning. She walked the bike to a repair bench near the gate. Her dad fixed the chain with a small tool. | 1 |
| /audio/production/en-US/assessment_passage/eli-saw-a-small-squirrel-near-the-park-bench-it-held-an-acorn-and-stayed-503e25bc60.mp3 | Eli saw a small squirrel near the park bench. It held an acorn and stayed very still. Park Ranger Kim asked the children to step back quietly. After a minute, the squirrel ran up the tree. | 1 |
| /audio/production/en-US/assessment_passage/nora-was-in-charge-of-the-class-calendar-she-crossed-off-monday-after-mo-deddd177da.mp3 | Nora was in charge of the class calendar. She crossed off Monday after morning meeting. Then she circled Friday because the class trip was on Friday. Several students asked how many days were left. | 1 |
| /audio/production/en-US/assessment_passage/lucas-helped-unpack-groceries-after-school-the-eggs-were-in-a-carton-at--870f7520ac.mp3 | Lucas helped unpack groceries after school. The eggs were in a carton at the top of the bag. Lucas lifted them out first so they would not crack. Then he put the heavier cans on the shelf. | 1 |
| /audio/production/en-US/assessment_passage/maya-planted-sunflower-seeds-in-a-small-pot-she-wrote-her-name-on-a-pape-1ccf227dc6.mp3 | Maya planted sunflower seeds in a small pot. She wrote her name on a paper label and pushed it into the soil. After watering the pot, she placed it on the sunny classroom window ledge. On Friday, a tiny green shoot appeared. | 1 |
| /audio/production/en-US/assessment_passage/ruby-watched-dark-clouds-gather-over-the-field-her-class-had-planned-to--b8633fc82b.mp3 | Ruby watched dark clouds gather over the field. Her class had planned to eat lunch outside. Miss Green heard thunder in the distance. She moved everyone into the hall before the rain began. | 1 |
| /audio/production/en-US/assessment_passage/finn-helped-his-neighbor-carry-books-to-a-little-free-library-the-shelf--de87e9bad7.mp3 | Finn helped his neighbor carry books to a little free library. The shelf was almost full. Finn placed the small books upright and stacked the large books on the bottom. Then there was room for the whole pile. | 1 |
| /audio/production/en-US/assessment_passage/dylan-studied-a-map-before-the-museum-trip-he-found-the-dinosaur-room-be-124f44dd94.mp3 | Dylan studied a map before the museum trip. He found the dinosaur room beside the stairs. He showed the map to his partner on the bus. When they arrived, they walked straight to the dinosaur room. | 1 |
| /audio/production/en-US/assessment_passage/hana-sorted-classroom-games-after-indoor-recess-she-put-puzzles-on-the-t-6624e7dfd0.mp3 | Hana sorted classroom games after indoor recess. She put puzzles on the top shelf and card games in the red bin. One puzzle box was open, so she checked that every piece was inside. Then she closed the lid. | 1 |
| /audio/production/en-US/assessment_passage/toby-brought-a-striped-towel-to-swimming-class-he-folded-it-on-the-bench-a5c5aa3b87.mp3 | Toby brought a striped towel to swimming class. He folded it on the bench before getting into the pool. After the lesson, he dried his hair with the towel. Then he packed it in the side pocket of his bag. | 1 |
| /audio/production/en-US/assessment_passage/ivy-found-a-coin-near-the-classroom-door-she-did-not-put-it-in-her-pocke-495696f321.mp3 | Ivy found a coin near the classroom door. She did not put it in her pocket. She gave it to Ms. Lopez, who placed it in the lost property box. At the end of the day, Omar came back to look for it. | 1 |
| /audio/production/en-US/assessment_passage/a-red-glove-was-lying-beside-the-playground-gate-hassan-picked-it-up-bef-e1e4a07fd5.mp3 | A red glove was lying beside the playground gate. Hassan picked it up before the wind blew it away. He took it to the office after recess. The secretary pinned it to the lost items board. | 1 |
| /audio/production/en-US/assessment_passage/the-playground-ball-rolled-under-the-bench-during-recess-ava-saw-it-befo-ba66b8b22b.mp3 | The playground ball rolled under the bench during recess. Ava saw it before anyone stepped on it. She picked it up and gave it to Coach Lee. Coach Lee put the ball back in the equipment basket. | 1 |
| /audio/production/en-US/assessment_passage/miles-helped-his-grandad-rake-leaves-the-wind-blew-leaves-back-across-th-e373c6452e.mp3 | Miles helped his grandad rake leaves. The wind blew leaves back across the path. Grandad held the bag open while Miles pushed the leaves inside. They tied the bag before the wind could scatter them again. | 1 |
| /audio/production/en-US/assessment_passage/grace-opened-her-pencil-box-during-writing-time-her-red-pencil-was-missi-bdc6d39e2b.mp3 | Grace opened her pencil box during writing time. Her red pencil was missing, but a blue pencil was still inside. She borrowed a red pencil from Noah. At the end of class, she returned it to him. | 1 |
| /audio/production/en-US/assessment_passage/at-the-family-picnic-rosa-brought-a-beach-ball-a-gust-of-wind-pushed-it--a622dd67d6.mp3 | At the family picnic, Rosa brought a beach ball. A gust of wind pushed it toward the pond. Her cousin caught it before it reached the water. Rosa thanked him and put the ball under the picnic blanket. | 1 |
| /audio/production/en-US/assessment_passage/dad-printed-a-photo-from-the-school-concert-it-showed-zoe-standing-besid-f476f5d4af.mp3 | Dad printed a photo from the school concert. It showed Zoe standing beside the choir teacher. Zoe placed the photo in a yellow frame. She put the frame on the shelf above her desk. | 1 |
| /audio/production/en-US/assessment_passage/mara-helped-set-out-cups-for-the-school-picnic-she-counted-twenty-studen-1097c0e1e4.mp3 | Mara helped set out cups for the school picnic. She counted twenty students but placed only eighteen cups. Her friend noticed the mistake before lunch began. Mara added two more cups to the table. | 1 |
| /audio/production/en-US/assessment_passage/lena-listened-carefully-during-music-class-mr-hill-played-three-high-not-fb4507b952.mp3 | Lena listened carefully during music class. Mr. Hill played three high notes on the piano. Then Lena copied the notes on a small keyboard. Mr. Hill smiled because she played them in the correct order. | 1 |
| /audio/production/en-US/assessment_passage/the-reading-corner-felt-cold-after-the-window-was-opened-max-carried-two-ae53407ff5.mp3 | The reading corner felt cold after the window was opened. Max carried two cushions from the shelf. He put one cushion on the blue chair and one on the rug. His group sat there during story time. | 1 |
| /audio/production/en-US/assessment_passage/the-classroom-clock-stopped-during-maths-ella-noticed-that-both-hands-st-74fd86a481.mp3 | The classroom clock stopped during maths. Ella noticed that both hands stayed on twelve. Mr. Reed changed the battery after lunch. The clock began ticking again before home time. | 1 |
| /audio/production/en-US/assessment_passage/before-the-bakery-opened-talia-helped-stack-trays-of-rolls-one-tray-held-8d3b0d0aac.mp3 | Before the bakery opened, Talia helped stack trays of rolls. One tray held plain rolls, and another held rolls with seeds on top. Baker Tom asked her to put the seeded rolls near the front counter. Customers usually bought those first. | 1 |
| /audio/production/en-US/assessment_passage/the-school-garden-club-checked-the-vegetable-beds-after-a-hot-weekend-th-f0c8c565b7.mp3 | The school garden club checked the vegetable beds after a hot weekend. The lettuce leaves looked limp, but the tomato plants were still strong. Mr. Hayes asked the students to water the lettuce first. Then they wrote the change in the garden notebook. | 1 |
| /audio/production/en-US/assessment_passage/during-reading-time-amira-found-a-bookmark-on-the-floor-near-the-mystery-ab204bd7d5.mp3 | During reading time, Amira found a bookmark on the floor near the mystery shelf. The bookmark had Daniel's name written in blue ink. Amira gave it to the librarian instead of keeping it. The librarian placed it in Daniel's book box. | 1 |
| /audio/production/en-US/assessment_passage/sofia-practiced-piano-before-the-school-concert-she-kept-missing-the-las-66f458046f.mp3 | Sofia practiced piano before the school concert. She kept missing the last note of the song. Her teacher asked her to play the final line slowly three times. After that, Sofia played the ending without stopping. | 1 |
| /audio/production/en-US/assessment_passage/nadia-took-photographs-for-the-class-newsletter-she-photographed-the-che-86fb38a0a3.mp3 | Nadia took photographs for the class newsletter. She photographed the chess club, the art display, and the garden team. Her clearest picture showed the garden team holding fresh carrots. The teacher chose that picture for the front page. | 1 |
| /audio/production/en-US/assessment_passage/in-the-science-corner-two-cups-held-the-same-kind-of-soil-one-cup-was-dr-afeda23a48.mp3 | In the science corner, two cups held the same kind of soil. One cup was dry, and the other had been watered. Priya pressed a finger gently into each cup. The watered soil felt softer than the dry soil. | 1 |
| /audio/production/en-US/assessment_passage/the-class-made-a-snack-chart-for-the-field-trip-apples-and-cheese-went-i-198cbf74e5.mp3 | The class made a snack chart for the field trip. Apples and cheese went in the fridge until morning. Crackers stayed in a sealed box on the counter. Ms. Reed checked both places before loading the cooler. | 1 |
| /audio/production/en-US/assessment_passage/priya-made-a-poster-about-sea-turtles-she-wrote-the-title-at-the-top-in--1873cc9d23.mp3 | Priya made a poster about sea turtles. She wrote the title at the top in large letters. Then she drew a turtle crawling toward the water. Her teacher asked her to label the beach and the ocean. | 1 |
| /audio/production/en-US/assessment_passage/sienna-visited-the-fire-station-with-her-class-a-firefighter-showed-them-6c99327af9.mp3 | Sienna visited the fire station with her class. A firefighter showed them a heavy jacket and helmet. Sienna tried to lift the jacket with both hands. She was surprised because it weighed more than her school bag. | 1 |
| /audio/production/en-US/assessment_passage/jalen-helped-clean-the-lunch-tables-he-sprayed-the-first-table-and-wiped-02061a8a90.mp3 | Jalen helped clean the lunch tables. He sprayed the first table and wiped it with a blue cloth. A sticky spot was still there, so he wiped it again. When the spot was gone, he moved to the next table. | 1 |
| /audio/production/en-US/assessment_passage/after-reading-time-nora-chose-a-silver-sticker-from-the-reward-box-she-p-4a3a499aef.mp3 | After reading time, Nora chose a silver sticker from the reward box. She placed it on the front of her notebook. Her friend chose a star-shaped sticker. Nora showed her notebook to her mother after school. | 1 |
| /audio/production/en-US/assessment_passage/during-music-practice-amara-forgot-her-flute-case-under-the-chair-jacob--d87e858248.mp3 | During music practice, Amara forgot her flute case under the chair. Jacob saw it after the lesson ended. He carried it to Amara before she reached the hallway. Amara thanked him and zipped the case closed. | 1 |
| /audio/production/en-US/assessment_passage/marcus-joined-his-class-for-a-river-study-the-teacher-gave-each-group-a--0690d9ff9e.mp3 | Marcus joined his class for a river study. The teacher gave each group a clear jar and a label. Marcus filled his jar where the water moved slowly near the reeds. Back at school, his group compared the river water with tap water. | 1 |
| /audio/production/en-US/assessment_passage/noah-crossed-the-old-stone-bridge-with-his-uncle-halfway-across-they-saw-42ae22f7f6.mp3 | Noah crossed the old stone bridge with his uncle. Halfway across, they saw a loose board beside the railing. His uncle called the park office from his phone. A worker arrived and closed that side of the bridge. | 1 |
| /audio/production/en-US/assessment_passage/the-firefighters-showed-the-class-how-they-prepare-for-a-call-first-they-981cd38555.mp3 | The firefighters showed the class how they prepare for a call. First, they checked the oxygen tanks on the truck. Then one firefighter clipped a radio to her jacket. She explained that the radio helped the team hear directions. | 1 |
| /audio/production/en-US/assessment_passage/on-the-meadow-walk-chloe-carried-a-small-field-guide-she-saw-yellow-butt-9a1e6459c1.mp3 | On the meadow walk, Chloe carried a small field guide. She saw yellow butterflies landing on purple flowers. Her partner counted five butterflies before they flew away. Chloe wrote the number beside a quick drawing in her guide. | 1 |
| /audio/production/en-US/assessment_passage/ethan-waited-at-the-station-with-his-grandmother-their-train-was-late-be-23fe248556.mp3 | Ethan waited at the station with his grandmother. Their train was late because workers were checking the track. A message on the screen said the train would arrive at ten thirty. Ethan read the time aloud so his grandmother could hear it. | 1 |
| /audio/production/en-US/assessment_passage/the-class-cleaned-the-playground-after-the-spring-fair-mateo-found-paper-e1ae57bbec.mp3 | The class cleaned the playground after the spring fair. Mateo found paper cups near the fence and plastic spoons under a table. He put the cups in the recycling bag. The spoons went into the trash bag because they were dirty. | 1 |
| /audio/assessment/v3/passages/the-class-guinea-pig-needed-a-holiday-home-f-f17d8b.mp3 | The class guinea pig needed a holiday home for half term. Four children offered. Miss Adu picked names from a cup, and the folded paper said 'Femi'. Femi carried the travel cage to the taxi very, very slowly. | 1 |
| /audio/assessment/v3/passages/the-whistle-for-the-sack-race-was-lost-mr-po-3fc0e0.mp3 | The whistle for the sack race was lost. Mr Pole checked his pockets twice. In the end, little Sana lent him the silver whistle from her charm bracelet, and the race began only one minute late. | 1 |
| /audio/assessment/v3/passages/on-wet-wednesdays-someone-always-mopped-the-482f69.mp3 | On wet Wednesdays, someone always mopped the puddle by the school door before the bell. Nobody knew who. One early morning, Priya spotted the mystery mopper through the window: it was Bill, the bus driver, mop in one hand, tea in the other. | 1 |
| /audio/assessment/v3/passages/gran-s-shopping-list-was-short-six-eggs-two-451ce8.mp3 | Gran's shopping list was short: six eggs, two lemons, and one small bag of sugar. Tayo repeated it all the way to the shop like a song. He came home with everything on the list — and one free sticker from the shopkeeper. | 1 |
| /audio/assessment/v3/passages/the-nature-walk-had-a-counting-game-class-2-8d0872.mp3 | The nature walk had a counting game. Class 2 counted five snails on the wall, three white butterflies by the hedge, and one very slow worm crossing the path. The worm got a round of applause when it finally made it. | 1 |
| /audio/assessment/v3/passages/the-bake-sale-opened-at-ten-o-clock-sharp-by-b49a97.mp3 | The bake sale opened at ten o'clock sharp. By half past ten every flapjack was gone. The last brownie survived until eleven, when the head teacher bought it 'for research'. | 1 |
| /audio/assessment/v3/passages/nita-s-tower-used-every-block-in-the-box-twe-8b24ca.mp3 | Nita's tower used every block in the box: twenty red ones for the bottom, ten blue ones for the middle, and four yellow ones balanced on top. It stood for one glorious minute before the cat inspected it. | 1 |
| /audio/assessment/v3/passages/two-lunchboxes-sat-on-the-bench-nearly-twins-d486cb.mp3 | Two lunchboxes sat on the bench, nearly twins. Both were blue, both had a rocket sticker. But Cal's had a dent in one corner from the great playground drop, and Robi's still smelled faintly of yesterday's orange. Cal checked for the dent, took his box, and left the orange-smelling twin for Robi. | 1 |
| /audio/assessment/v3/passages/ola-filled-the-bird-feeder-with-seeds-at-bre-fa4d61.mp3 | Ola filled the bird feeder with seeds at breakfast. At lunchtime the feeder was already half empty. By home time only dust was left, and one very round pigeon sat on the fence looking innocent. | 1 |
| /audio/assessment/v3/passages/the-lost-property-box-gave-up-three-treasure-73d48d.mp3 | The lost property box gave up three treasures on Friday. Jun claimed the stripy scarf at morning break. The water bottle went home with Ivy after lunch. The dinosaur glove stayed unclaimed, so it guarded the box all weekend. | 1 |
| /audio/assessment/v3/passages/dad-planted-a-tree-when-each-child-was-born-522499.mp3 | Dad planted a tree when each child was born. Asha's cherry tree is the tallest now. Ben's apple tree gives the most fruit. The plum tree, the youngest, belongs to baby Mo — it is still shorter than the garden fence. | 1 |
| /audio/assessment/v3/passages/the-school-play-needed-props-from-three-plac-87dfa7.mp3 | The school play needed props from three places. The crown came from Nell's dressing-up box. The cardboard sword came from Raj's recycling pile. The throne was two chairs from the staff room, taped together and painted gold by the whole class. | 1 |
| /audio/assessment/v3/passages/monday-s-swimming-lesson-had-a-ladder-of-gro-fade3e.mp3 | Monday's swimming lesson had a ladder of groups. Beginners stayed where they could stand. Improvers swam widths with a float. The sharks — the top group — swam whole lengths, no floats allowed. Keya, an improver since spring, finally moved up on Monday, and handed her float to a beginner on the way. | 1 |
| /audio/assessment/v3/passages/the-twins-divided-the-paper-round-money-the-f18bbc.mp3 | The twins divided the paper-round money the same way every week. Half went into the shared bike jar on the shelf. The rest they split evenly between them. This week the round paid ten pounds, so five went into the jar, and each twin pocketed exactly the same as the other. | 1 |
| /audio/assessment/v3/passages/the-window-box-plan-was-strict-water-on-mond-3f2725.mp3 | The window box plan was strict: water on Mondays and Thursdays, feed on the first Monday of the month, and never water on a day when it had rained. This Thursday the sky poured all morning. Priya looked at the streaming glass, put the watering can back under the sink, and ticked the chart anyway. | 1 |
| /audio/assessment/v3/passages/every-bench-in-the-park-remembers-somebody-t-e1fe63.mp3 | Every bench in the park remembers somebody. The oak bench by the pond remembers Captain Reya. The curly iron bench remembers the twins' great-grandmother. And the newest bench, still smelling of paint, remembers Mr Alam, who fed the sparrows here for forty years — which is why the carpenter cut a little seed dish into its arm. | 1 |
| /audio/assessment/v3/passages/the-class-aquarium-got-its-spring-clean-on-f-2fe58f.mp3 | The class aquarium got its spring clean on Friday. The gravel was rinsed in a sieve. The glass was wiped inside and out. The plastic castle came back shinier than ever, and the fish watched the whole operation from a bucket. | 1 |
| /audio/assessment/v3/passages/sports-day-morning-was-all-preparation-lanes-9a17fc.mp3 | Sports day morning was all preparation. Lanes were painted white on the grass. Bean bags were counted into buckets. The finishing tape was tied between two posts, and somebody tested the megaphone by saying 'sausages' across the whole field. | 1 |
| /audio/assessment/v3/passages/the-night-before-the-trip-amir-packed-like-a-53fc81.mp3 | The night before the trip, Amir packed like an explorer. Raincoat, rolled tight. Sandwiches, wrapped and slightly squashed by the water bottle. Notebook and pencil, for bird spotting. His torch went in last, right at the top, in case of tunnels. | 1 |
| /audio/assessment/v3/passages/grandpa-s-shed-had-a-place-for-everything-sc-331023.mp3 | Grandpa's shed had a place for everything. Screwdrivers hung on hooks in size order. Jam jars of screws lined the window shelf. The lawnmower lived under a blanket like a pet, and the radio kept its place by the door, always tuned to the cricket. | 1 |
| /audio/assessment/v3/passages/the-book-fair-filled-the-hall-for-one-whole-bbbbbd.mp3 | The book fair filled the hall for one whole day. Tables sagged under picture books and joke books. A signing corner had a real author with a real fountain pen. Tokens from the summer reading club counted double, and the librarian wore her legendary book-print dress. | 1 |
| /audio/assessment/v3/passages/when-the-lights-went-out-on-the-street-the-n-84241c.mp3 | When the lights went out on the street, the neighbours made their own evening. Candles appeared in jam jars on doorsteps. Mr Okoye carried his guitar to the wall and played requests. The chip van, which ran on its own gas, did the best business of its life. | 1 |
| /audio/assessment/v3/passages/the-museum-s-new-dinosaur-room-opened-with-t-e77bc9.mp3 | The museum's new dinosaur room opened with three rules on the door. Walk, don't run, because the floor was polished like ice. Whisper, because sound bounced off the bones. And photographs were welcome — but only without the flash, which was hard on the painted cave-wall copy. | 1 |
| /audio/assessment/v3/passages/harvest-week-at-the-allotment-brought-jobs-f-b1266d.mp3 | Harvest week at the allotment brought jobs for everyone. The tall cousins picked the runner beans. The small cousins hunted potatoes with trowels, shouting at every find. Gran weighed everything on her old kitchen scales, and the biggest marrow rode home in the wheelbarrow with a seatbelt of garden string. | 1 |
| /audio/assessment/v3/passages/the-classroom-plants-drooped-over-the-holida-11df78.mp3 | The classroom plants drooped over the holidays until the secret waterer struck. On the first day back, the soil was damp and a tiny note said 'You are welcome — G.' Gita went pink when everyone looked at her. | 1 |
| /audio/assessment/v3/passages/the-ferry-to-the-island-takes-twenty-minutes-375af1.mp3 | The ferry to the island takes twenty minutes. The bus from the harbour takes ten more. Door to door, Nan's visit is half an hour of travelling and a whole afternoon of cake. | 1 |
| /audio/assessment/v3/passages/the-car-boot-sale-table-was-carefully-arrang-cf36bb.mp3 | The car boot sale table was carefully arranged. Board games with all their pieces, checked twice. A shoebox of dinosaur figures, priced per dinosaur. The outgrown wellies stood in a row, smallest to biggest, and the old toy till sat ready to be the real till. | 1 |
| /audio/assessment/v3/passages/the-relay-team-ran-in-a-fixed-order-jaya-sta-f07bc1.mp3 | The relay team ran in a fixed order. Jaya started, because her starts were lightning. Ben ran second and Priw third, keeping the pace steady. The last leg belonged to Omar — not the fastest starter, but nobody, ever, caught him from in front. | 1 |
| /audio/assessment/v3/passages/rana-planted-three-bean-seeds-in-a-paper-cup-699026.mp3 | Rana planted three bean seeds in a paper cup. She watered them every morning before school. For days, nothing happened. Then one green stem pushed up through the soil. Rana cheered so loudly that her dog barked. | 1 |
| /audio/assessment/v3/passages/tom-could-not-find-his-library-book-anywhere-7314bf.mp3 | Tom could not find his library book anywhere. He looked under his bed and behind the sofa. He even checked the fridge. At last he found it inside his pillow case, right where he had read it last night. | 1 |
| /audio/assessment/v3/passages/amara-s-bike-squeaked-all-the-way-to-the-par-6c47c1.mp3 | Amara's bike squeaked all the way to the park. Squeak, squeak, squeak. Her uncle showed her how to drip oil on the chain. On the ride home, the bike rolled along quietly, and Amara grinned the whole way. | 1 |
| /audio/assessment/v3/passages/milo-s-tooth-had-wobbled-for-a-week-he-wiggl-20f3db.mp3 | Milo's tooth had wobbled for a week. He wiggled it at breakfast and at bath time. Then, while he was laughing at dinner, it popped out into his hand. Milo put it under his pillow that night. | 1 |
| /audio/assessment/v3/passages/a-thin-grey-kitten-kept-visiting-priya-s-ste-fae46f.mp3 | A thin grey kitten kept visiting Priya's steps. Each day Priya set out a little dish of water. Each day the kitten crept closer. On Friday it finally curled up on her lap, purring like a tiny engine. | 1 |
| /audio/assessment/v3/passages/dev-dropped-his-mitten-somewhere-in-the-snow-c56afc.mp3 | Dev dropped his mitten somewhere in the snow. He walked back along his own footprints to look. Near the gate he saw a flash of red on the fence post. Someone had found his mitten and left it where he would see it. | 1 |
| /audio/assessment/v3/passages/the-choir-had-one-last-practice-before-the-s-9ff3e6.mp3 | The choir had one last practice before the show. First the singing was too quiet. Then it was too fast. Miss Obi clapped a steady beat, and slowly all the voices came together like one big voice. | 1 |
| /audio/assessment/v3/passages/jin-practised-flipping-pancakes-with-a-cold-8a7b2f.mp3 | Jin practised flipping pancakes with a cold, empty pan. Flip, catch. Flip, catch. On Sunday he tried it with a real pancake while his dad watched. The pancake spun in the air and landed back in the pan. | 1 |
| /audio/assessment/v3/passages/bees-visit-many-flowers-on-one-trip-they-dri-3f87c6.mp3 | Bees visit many flowers on one trip. They drink a sweet juice called nectar. Back at the hive, they pass the nectar to other bees. Slowly the nectar thickens into honey. One jar of honey takes thousands of flower visits. | 1 |
| /audio/assessment/v3/passages/a-tadpole-does-not-look-like-a-frog-it-has-a-3bc041.mp3 | A tadpole does not look like a frog. It has a tail and no legs. First the back legs grow. Then the front legs appear, and the tail gets shorter. At last the little frog can hop out of the pond. | 1 |
| /audio/assessment/v3/passages/old-paper-does-not-have-to-be-rubbish-trucks-15f142.mp3 | Old paper does not have to be rubbish. Trucks take it to a special factory. There it is mashed with water into a grey soup. The soup is rolled flat and dried. It comes out as fresh, clean paper, ready to use again. | 1 |
| /audio/assessment/v3/passages/a-lighthouse-stands-where-the-rocks-are-dang-b6f30b.mp3 | A lighthouse stands where the rocks are dangerous. At night its big lamp turns round and round. Ships far out at sea watch for the flashing light. The light tells them where the rocks are, so they can steer safely past. | 1 |
| /audio/assessment/v3/passages/an-ant-is-small-but-it-is-a-strong-helper-an-7c3dfc.mp3 | An ant is small, but it is a strong helper. Ants work in long lines. One ant finds a crumb and leaves a smell trail. The others follow the trail. Together they carry food back to the nest, piece by piece. | 1 |
| /audio/assessment/v3/passages/shadows-are-not-the-same-all-day-in-the-morn-3fd977.mp3 | Shadows are not the same all day. In the morning, the sun is low and shadows are long. At midday, the sun is high and shadows shrink small. In the evening they stretch long again, pointing the other way. | 1 |
| /audio/assessment/v3/passages/a-spider-web-starts-with-one-thin-thread-the-bc38b2.mp3 | A spider web starts with one thin thread. The spider lets the wind carry it across a gap. Then she walks the thread and adds more lines, round and round. The finished web is sticky, ready to catch her dinner. | 1 |
| /audio/assessment/v3/passages/the-moon-seems-to-change-shape-but-it-does-n-ae1206.mp3 | The moon seems to change shape, but it does not really. The moon circles the Earth. Sunlight lights up one side of it. Some nights we see all of the bright side, some nights only a sliver. That is why the moon looks different. | 1 |
| /audio/assessment/v3/passages/every-morning-mr-pole-stands-at-the-school-c-eb909c.mp3 | Every morning Mr Pole stands at the school crossing. He holds up his round sign, and the cars stop. He waves the children across, grinning his good-morning grin. Rain or shine, he is there before the first bell rings. | 1 |
| /audio/assessment/v3/passages/class-2-had-a-tidy-up-race-before-home-time-e1b6d4.mp3 | Class 2 had a tidy-up race before home time. One team stacked the chairs. Another team collected the pencils. The last team wiped the tables. In five minutes the whole room was neat, and everyone won a sticker. | 1 |
| /audio/assessment/v3/passages/saturday-is-market-day-nan-gives-ade-the-sho-426fca.mp3 | Saturday is market day. Nan gives Ade the shopping list. He finds the oranges, and Nan picks the fish. The stall man always adds one free plum for Ade. They walk home with heavy bags and happy plans for dinner. | 1 |
| /audio/assessment/v3/passages/the-launderette-on-our-street-hums-all-morni-14ea3f.mp3 | The launderette on our street hums all morning. Round windows spin with socks and shirts. Mrs Kaur folds warm towels into tall piles. People chat while they wait, and the whole shop smells like clean cotton. | 1 |
| /audio/assessment/v3/passages/after-the-rain-the-playground-was-full-of-pu-d27df4.mp3 | After the rain, the playground was full of puddles. Small boots splashed in the big one by the slide. Two friends raced leaf boats along the gutter stream. By lunch, the sun had drunk the puddles all up. | 1 |
| /audio/assessment/v3/passages/dad-flips-the-calendar-to-a-new-month-everyo-a08923.mp3 | Dad flips the calendar to a new month. Everyone adds their days. Swimming badge test for Lena. Dentist for Dad. Grandma's visit gets a big red circle. The little squares fill up with the family's plans. | 1 |
| /audio/assessment/v3/passages/the-postman-s-trolley-squeaks-up-our-road-at-a1fc0f.mp3 | The postman's trolley squeaks up our road at nine. Letters slide through doors, flap, flap, flap. Number 12 gets a parcel and signs for it happily. Our dog waits by the letter box every single morning. | 1 |
| /audio/assessment/v3/passages/the-bakery-opens-before-the-sun-is-up-trays-a1bcf6.mp3 | The bakery opens before the sun is up. Trays of rolls slide into the big oven. The smell of warm bread drifts down the street. By eight o'clock a little queue waits at the door, sniffing happily. | 1 |
| /audio/assessment/v3/passages/nobody-wanted-the-muddy-corner-of-the-school-1108a3.mp3 | Nobody wanted the muddy corner of the school garden. Weeds grew tall, and crisp packets blew against the fence. Then Year 2 claimed it. They pulled the weeds, dug in compost, and planted sunflower seeds in careful rows. All summer the corner blazed yellow, and even the caretaker stopped to take photographs. | 1 |
| /audio/assessment/v3/passages/when-the-old-footbridge-closed-for-repairs-e-a2c404.mp3 | When the old footbridge closed for repairs, everyone grumbled. The walk to school took ten minutes longer, right around the stream. But on the long way, children found blackberries, a heron, and a hollow tree that echoed. By the time the bridge reopened, some families kept taking the long way on purpose. | 1 |
| /audio/assessment/v3/passages/asha-s-drum-kit-lived-in-the-garage-because-fcff33.mp3 | Asha's drum kit lived in the garage, because drums are loud. Every evening she practised the same tricky rhythm, and every evening it fell apart in the middle. Her mum suggested slowing right down. Boring, thought Asha, but she tried it. Two slow weeks later, her sticks flew through the rhythm at full speed without a single slip. | 1 |
| /audio/assessment/v3/passages/the-city-aquarium-had-a-problem-the-otters-k-2e02f1.mp3 | The city aquarium had a problem: the otters kept escaping their pool at night and sliding down the corridors. Cameras showed them stacking rocks by the glass wall like little stairs. The keepers did not punish the clever climbers. Instead they built a bigger pool with waterfalls, tunnels, and plenty of rocks to move around. | 1 |
| /audio/assessment/v3/passages/grandpa-folds-a-square-of-paper-in-silence-c-4b1e7b.mp3 | Grandpa folds a square of paper in silence. Corner to corner, crease by crease. Suddenly it has wings. He taught this plane to Dad thirty years ago, and today he is teaching it to me. Mine flies crooked, then straight, then right across the kitchen. Grandpa says the fold matters more than the throw. | 1 |
| /audio/assessment/v3/passages/at-first-the-new-rain-gauge-seemed-dull-a-pl-8d40b5.mp3 | At first the new rain gauge seemed dull. A plastic tube, a ruler, an empty chart. But day by day the chart filled in. A dry week made a flat line. A stormy Tuesday shot the line up like a mountain. By the end of term, Class 3 could read their whole spring in one zigzag picture. | 1 |
| /audio/assessment/v3/passages/the-escalator-at-the-station-broke-on-monday-f84ef0.mp3 | The escalator at the station broke on Monday, and a sign said SORRY. Some people sighed and took the stairs. A busker moved to the bottom step and played cheerful songs for the climbers. Strangers started counting the steps out loud together, laughing when they lost count. It was, everyone agreed, a strangely happy week. | 1 |
| /audio/assessment/v3/passages/every-seed-in-the-seed-bank-sleeps-in-a-silv-5d7b1.mp3 | Every seed in the seed bank sleeps in a silver packet. Wheat from one valley, beans from another, a pumpkin seed saved from a hundred years ago. If a flood or a fire ever destroys a crop, farmers can borrow its seeds and start again. The freezer hums quietly, keeping tomorrow's fields safe on its cold shelves. | 1 |
| /audio/assessment/v3/passages/the-class-made-soup-for-the-winter-fair-priy-43f608.mp3 | The class made soup for the winter fair. Priya chopped carrots into little moons. Sam stirred so the bottom would not stick. Miss Lee added one secret spoonful of ginger. When the pot finally bubbled, the whole corridor smelled wonderful, and the soup sold out in twenty minutes. | 1 |
| /audio/assessment/v3/passages/hedgehogs-need-help-in-autumn-they-look-for-bd8f15.mp3 | Hedgehogs need help in autumn. They look for a safe pile of leaves to sleep in all winter. People can leave a wild corner in the garden and check bonfires before lighting them. A small gap in the fence lets hedgehogs walk from garden to garden to find food. | 1 |
| /audio/assessment/v3/passages/maya-kept-a-moon-diary-for-a-month-on-clear-48f989.mp3 | Maya kept a moon diary for a month. On clear nights she drew the moon's shape in silver pencil. On cloudy nights she wrote 'hidden' in the box. Slowly her pages showed the moon growing round, then shrinking thin. Her diary turned a whole month of sky into one small story. | 1 |
| /audio/assessment/v3/passages/the-old-phone-box-on-elm-street-does-not-hol-784900.mp3 | The old phone box on Elm Street does not hold a phone any more. The town filled it with books instead. Anyone may take one home, as long as they leave another. The shelves change every week: cookbooks, comics, mysteries. The little red box is now the smallest library in town. | 1 |
| /audio/assessment/v3/passages/dad-s-allotment-gives-us-vegetables-nearly-a-f2c24d.mp3 | Dad's allotment gives us vegetables nearly all year. In spring we pull sweet little radishes. Summer brings beans that climb higher than me. In autumn we dig up potatoes like buried treasure. Even in winter there is kale, standing green in the frost. | 1 |
| /audio/assessment/v3/passages/the-fire-station-opened-its-doors-on-saturda-177fc9.mp3 | The fire station opened its doors on Saturday. Children tried on helmets that wobbled on their heads. A firefighter showed how the long ladder unfolds to reach high windows. Everyone got to spray the practice hose at a target. By home time, half the visitors wanted the job one day. | 1 |
| /audio/assessment/v3/passages/a-wind-farm-stands-on-the-hill-above-our-tow-ddf09c.mp3 | A wind farm stands on the hill above our town. Each turbine is taller than the church tower. When the blades spin, they turn wind into electricity for hundreds of homes. On still days the blades rest, and on wild days they whirl like giant white pinwheels. | 1 |
| /audio/assessment/v3/passages/our-street-planned-a-surprise-for-mr-chen-s-eeac84.mp3 | Our street planned a surprise for Mr Chen's hundredth birthday. Neighbours strung flags from lamp post to lamp post. The cafe baked a cake with exactly one hundred candles, which took three tries to light. Children painted a banner as long as a bus. When Mr Chen stepped outside, the whole street sang at once. | 1 |
| /audio/assessment/v3/passages/leo-wanted-to-swim-the-whole-length-of-the-p-265937.mp3 | Leo wanted to swim the whole length of the pool. At first he could only manage halfway before standing up, coughing. His coach gave him one tip each week: slower arms, bubbles out, long legs. Six Saturdays later, Leo touched the far wall for the first time and burst up grinning. | 1 |
| /audio/assessment/v3/passages/the-museum-s-dinosaur-skeleton-arrived-in-ni-1f7fc2.mp3 | The museum's dinosaur skeleton arrived in ninety-two boxes. For a month, visitors watched scientists fit bone to bone behind a glass wall. A neck as long as a slide rose slowly toward the ceiling. When the last tail bone clicked into place, the hall finally looked the way it did in the posters. | 1 |
| /audio/assessment/v3/passages/when-the-power-went-out-the-flat-went-quiet-164309.mp3 | When the power went out, the flat went quiet and dark. Mum found candles, and we ate supper by their small light. With no screens, Gran taught us a clapping game from when she was small. The lights blinked on at bedtime, but we asked to keep one candle burning anyway. | 1 |
| /audio/assessment/v3/passages/the-tide-pool-looked-empty-at-first-then-nad-851374.mp3 | The tide pool looked empty at first. Then Nadia crouched still and waited. A crab sidled out from under a stone. A blob on the rock turned out to be an anemone, waving tiny arms. The longer she stayed still, the more the pool came alive around her. | 1 |
| /audio/assessment/v3/passages/robots-vacuum-some-homes-now-but-they-need-h-effd06.mp3 | Robots vacuum some homes now, but they need help to do it well. Cables must be lifted off the floor, or the robot eats them. Chairs become fences that trap it in corners. One sock can end the whole clean. Tidy first, the instructions say, and the robot will do the rest. | 1 |
| /audio/assessment/v3/passages/the-ferry-crosses-the-bay-eight-times-a-day-295d3c.mp3 | The ferry crosses the bay eight times a day. Islanders set their clocks by its horn. It carries schoolchildren in the morning, shopping crates at noon, and tired workers at dusk. In storms it stays tied to the dock, and the whole island seems to hold its breath until it sails again. | 1 |
| /audio/assessment/v3/passages/amir-s-baby-sister-cried-every-time-he-pract-60f187.mp3 | Amir's baby sister cried every time he practised trumpet. He tried playing in the garden, but the neighbours leaned out of windows. He tried the bathroom, where the echo was wonderful but the space was not. In the end, the wardrobe full of winter coats swallowed the sound perfectly, and everyone was happy. | 1 |
| /audio/assessment/v3/passages/the-street-mural-began-as-one-painted-door-t-1a398a.mp3 | The street mural began as one painted door. The artist added a whale above it the next week, then waves along three more houses. Neighbours started leaving paint tins by their walls as an invitation. By summer, the grey street had become a sea scene that visitors crossed town to photograph. | 1 |
| /audio/assessment/v3/passages/bo-built-a-tower-of-blocks-taller-than-the-t-df51ab.mp3 | Bo built a tower of blocks taller than the table. His baby brother reached out one finger. Crash! Blocks rolled everywhere. Bo took a big breath. Then he handed his brother two blocks and they started a new tower together. | 1 |
| /audio/assessment/v3/passages/nia-s-kite-would-not-fly-it-flopped-on-the-g-a13c86.mp3 | Nia's kite would not fly. It flopped on the grass like a tired fish. Grandad tied on a longer tail made from his old scarf. The next gust lifted the kite high over the hill, and Nia ran laughing beneath it. | 1 |
| /audio/assessment/v3/passages/a-magnet-does-not-pull-everything-it-grabs-p-f599b9.mp3 | A magnet does not pull everything. It grabs paper clips, keys, and the fridge door. It ignores plastic bricks, wooden spoons, and glass marbles. Magnets only pull some metals. That is why one side of your toy sticks and the other side slides off. | 1 |
| /audio/assessment/v3/passages/compost-turns-old-scraps-into-new-soil-peeli-f7b36d.mp3 | Compost turns old scraps into new soil. Peelings, leaves, and eggshells go into the bin. Tiny creatures chew them up for months. Slowly the scraps turn dark and crumbly. Gardeners spread this new soil to feed their plants. | 1 |
| /audio/assessment/v3/passages/the-dentist-s-waiting-room-has-a-fish-tank-a-6b19b0.mp3 | The dentist's waiting room has a fish tank and a box of old comics. Ben watches the stripy fish glide while Mum reads. A buzzer sounds, a nurse smiles round the door, and it is Ben's turn to hop into the big moving chair. | 1 |
| /audio/assessment/v3/passages/on-sunday-the-whole-flat-smells-of-coconut-r-64d0a3.mp3 | On Sunday the whole flat smells of coconut rice. Aunty stirs the big silver pot. Cousins squeeze around the small table, elbow to elbow. There is always one more chair, one more plate, one more story before the food is gone. | 1 |
| /audio/assessment/v3/passages/the-classroom-hamster-escaped-on-friday-all-472557.mp3 | The classroom hamster escaped on Friday. All weekend he was loose in the school. On Monday the children followed a trail of seed shells past the library. They found him asleep in the lost-property box, curled inside a woolly hat. | 1 |
| /audio/assessment/v3/passages/rock-pools-change-twice-a-day-when-the-tide-ef74b8.mp3 | Rock pools change twice a day. When the tide is out, the pools sit still in the sun, and you can peer in. When the tide rolls back, the sea covers everything, bringing fresh water and food. The creatures in the pool live by this in-and-out clock. | 1 |
| /audio/assessment/v3/passages/the-night-bus-is-a-different-world-streetlig-e9d7c9.mp3 | The night bus is a different world. Streetlights slide across sleepy faces. A nurse heads to her shift; a baker heads home, dusted in flour. The driver knows the regulars by name and waits an extra breath at every stop, because nobody should run at midnight. | 1 |
| /audio/assessment/v3/passages/the-campfire-needed-three-tries-the-first-pi-39b524.mp3 | The campfire needed three tries. The first pile of sticks was too wet. The second caught, then sulked into smoke. For the third try, Sana peeled dry bark shavings, stacked the sticks like a little tent, and shielded the match with her hand. The flame climbed, crackled, and settled in for the evening. | 1 |
| /audio/assessment/v3/passages/swifts-are-astonishing-birds-they-eat-while-d1b1ba.mp3 | Swifts are astonishing birds. They eat while flying and even sleep on the wing. Their nests are tucked under roofs, and when the chicks leave, they may not land again for two whole years. In late summer the sky over town fills with their screaming, swooping games. | 1 |
| /audio/assessment/v3/passages/the-repair-cafe-opens-in-the-hall-on-the-fir-6c3229.mp3 | The repair cafe opens in the hall on the first Saturday of the month. People bring broken toasters, wobbly chairs, and jackets with stuck zips. Volunteers with toolboxes sit at long tables and mend things for free, explaining as they go. Most visitors leave with their things working and a new trick learned. | 1 |
| /audio/assessment/v3/passages/the-twins-entered-the-sandcastle-contest-wit-2386e1.mp3 | The twins entered the sandcastle contest with a plan. Ria dug the moat while Rafi packed the towers. Halfway through, a wave stole their gate. They rebuilt it farther up the beach, faster this time. Their castle did not win first prize, but the judges gave it a ribbon for Best Teamwork. | 1 |
| /audio/assessment/v3/passages/every-window-on-wren-street-has-a-different-268ec1.mp3 | Every window on Wren Street has a different bird sticker, because of one shop. The bookshop owner noticed birds bumping the big clear glass. She stuck a paper owl in the window, and the bumping stopped. She printed spare stickers, left them in a basket by the till, and week by week the whole street joined in. | 1 |
| /audio/assessment/v3/passages/dad-s-old-radio-only-played-crackles-until-a-133dc9.mp3 | Dad's old radio only played crackles until Amal turned the dial a hair at a time. A voice swam up out of the fuzz, then music, clear as water. Now the radio lives on the windowsill, and every breakfast starts with Amal's steady hand finding the station again. | 1 |
| /audio/assessment/v3/passages/the-school-s-old-apple-tree-gives-more-fruit-52b32a.mp3 | The school's old apple tree gives more fruit than anyone can eat. This year the cook dried rings of apple for snack time. Class 1 pressed juice with a squeaky hand press. The rest went in crates by the gate with a sign saying HELP YOURSELF, and by Friday every crate was empty. | 1 |
| /audio/assessment/v3/passages/granny-bola-planted-red-tulips-along-the-gar-2d64b0.mp3 | Granny Bola planted red tulips along the garden path. | 1 |
| /audio/assessment/v3/passages/the-dentist-gave-milo-a-green-sticker-for-br-536d2b.mp3 | The dentist gave Milo a green sticker for brave sitting. | 1 |
| /audio/assessment/v3/passages/our-postlady-whistles-show-tunes-on-her-whol-dadf98.mp3 | Our postlady whistles show tunes on her whole round. | 1 |
| /audio/assessment/v3/passages/baby-ren-stacked-four-wooden-blocks-all-by-h-b0fc27.mp3 | Baby Ren stacked four wooden blocks all by himself. | 1 |
| /audio/assessment/v3/passages/uncle-dip-burned-the-toast-twice-before-brea-623d3d.mp3 | Uncle Dip burned the toast twice before breakfast. | 1 |
| /audio/assessment/v3/passages/the-twins-painted-their-bedroom-door-bright-bf7dca.mp3 | The twins painted their bedroom door bright orange. | 1 |
| /audio/assessment/v3/passages/a-magpie-stole-the-shiny-bottle-top-from-our-e38c86.mp3 | A magpie stole the shiny bottle top from our step. | 1 |
| /audio/assessment/v3/passages/miss-faro-fixed-the-wobbly-table-with-folded-90aea9.mp3 | Miss Faro fixed the wobbly table with folded card. | 1 |
| /audio/assessment/v3/passages/the-choir-practises-in-the-hall-every-tuesda-659eb7.mp3 | The choir practises in the hall every Tuesday. | 1 |
| /audio/assessment/v3/passages/dad-keeps-his-glasses-in-the-fruit-bowl-for-abc0d6.mp3 | Dad keeps his glasses in the fruit bowl, for some reason. | 1 |
| /audio/assessment/v3/passages/the-frog-hid-under-the-biggest-lily-pad-b670ba.mp3 | The frog hid under the biggest lily pad. | 1 |
| /audio/assessment/v3/passages/swimming-lessons-start-straight-after-lunch-460d48.mp3 | Swimming lessons start straight after lunch on Fridays. | 1 |
| /audio/assessment/v3/passages/mum-parks-the-bike-behind-the-recycling-bins-37615e.mp3 | Mum parks the bike behind the recycling bins. | 1 |
| /audio/assessment/v3/passages/the-market-opens-at-seven-long-before-school-db3198.mp3 | The market opens at seven, long before school. | 1 |
| /audio/assessment/v3/passages/grandpa-naps-in-the-striped-deckchair-by-the-24a2c8.mp3 | Grandpa naps in the striped deckchair by the roses. | 1 |
| /audio/assessment/v3/passages/the-lost-kitten-was-found-at-the-bottom-of-t-1c86cf.mp3 | The lost kitten was found at the bottom of the airing cupboard. | 1 |
| /audio/assessment/v3/passages/scene-a-girl-in-wellies-jumping-over-a-puddl-bfb379.mp3 | Scene: a girl in wellies jumping over a puddle. | 1 |
| /audio/assessment/v3/passages/scene-two-boys-carrying-a-long-ladder-past-a-8db381.mp3 | Scene: two boys carrying a long ladder past a bakery. | 1 |
| /audio/assessment/v3/passages/scene-a-cat-asleep-inside-an-open-umbrella-fc4fc6.mp3 | Scene: a cat asleep inside an open umbrella. | 1 |
| /audio/assessment/v3/passages/scene-a-grandad-and-a-child-flying-one-red-k-5a3052.mp3 | Scene: a grandad and a child flying one red kite together. | 1 |
| /audio/assessment/v3/passages/scene-a-full-washing-line-with-one-red-sock-d09da7.mp3 | Scene: a full washing line with one red sock dropping to the grass. | 1 |
| /audio/assessment/v3/passages/scene-three-ducks-queuing-at-an-ice-cream-va-c6dace.mp3 | Scene: three ducks queuing at an ice-cream van. | 1 |
| /audio/assessment/v3/passages/scene-a-boy-proudly-holding-up-a-wobbly-jell-4a3b4f.mp3 | Scene: a boy proudly holding up a wobbly jelly taller than his head. | 1 |
| /audio/assessment/v3/passages/scene-a-snowman-wearing-sunglasses-on-a-sunn-8620a1.mp3 | Scene: a snowman wearing sunglasses on a sunny winter day. | 1 |
| /audio/assessment/v3/passages/pia-tiptoed-past-the-sleeping-dog-499571.mp3 | Pia tiptoed past the sleeping dog. | 1 |
| /audio/assessment/v3/passages/the-waiter-balanced-six-plates-on-one-arm-4776af.mp3 | The waiter balanced six plates on one arm. | 1 |
| /audio/assessment/v3/passages/nan-squeezed-three-fat-lemons-for-the-lemona-864455.mp3 | Nan squeezed three fat lemons for the lemonade. | 1 |
| /audio/assessment/v3/passages/the-goalkeeper-tipped-the-ball-over-the-bar-f2bc8c.mp3 | The goalkeeper tipped the ball over the bar. | 1 |
| /audio/assessment/v3/passages/kofi-taped-the-torn-map-back-together-2506eb.mp3 | Kofi taped the torn map back together. | 1 |
| /audio/assessment/v3/passages/the-parrot-copied-grandpa-s-cough-all-aftern-1d48e3.mp3 | The parrot copied Grandpa's cough all afternoon. | 1 |
| /audio/assessment/v3/passages/ada-rolled-the-biggest-snowball-in-the-whole-aef50e.mp3 | Ada rolled the biggest snowball in the whole street. | 1 |
| /audio/assessment/v3/passages/the-librarian-stamped-the-book-with-tomorrow-8c7f28.mp3 | The librarian stamped the book with tomorrow's date by mistake. | 1 |
| /audio/assessment/v3/passages/because-the-lift-was-broken-the-removal-men-480be1.mp3 | Because the lift was broken, the removal men used the stairs. | 1 |
| /audio/assessment/v3/passages/rosa-wore-her-brother-s-boots-so-her-footpri-cf1c7d.mp3 | Rosa wore her brother's boots, so her footprints looked enormous. | 1 |
| /audio/assessment/v3/passages/the-picnic-moved-indoors-but-nobody-minded-b-8bf4c8.mp3 | The picnic moved indoors, but nobody minded because of the cake. | 1 |
| /audio/assessment/v3/passages/although-the-sea-looked-calm-the-flag-on-the-598c61.mp3 | Although the sea looked calm, the flag on the beach was red. | 1 |
| /audio/assessment/v3/passages/jin-saved-his-bus-money-all-month-so-that-he-51ec4b.mp3 | Jin saved his bus money all month so that he could buy Mum's birthday plant. | 1 |
| /audio/assessment/v3/passages/the-paint-was-still-wet-so-the-bench-wore-a-888240.mp3 | The paint was still wet, so the bench wore a little paper flag all day. | 1 |
| /audio/assessment/v3/passages/even-though-tara-practised-in-goal-every-day-244e5b.mp3 | Even though Tara practised in goal every day, she chose to play striker in the final. | 1 |
| /audio/assessment/v3/passages/the-bread-smelled-wonderful-but-it-was-for-t-e5663e.mp3 | The bread smelled wonderful, but it was for the fair, so nobody got a slice. | 1 |
| /audio/assessment/v3/passages/maya-handed-the-brush-to-elena-because-she-w-33416b.mp3 | Maya handed the brush to Elena because she wanted the fence painted blue. | 1 |
| /audio/assessment/v3/passages/the-seagull-followed-the-fishing-boat-until-ef38c1.mp3 | The seagull followed the fishing boat until it sailed out of the bay. | 1 |
| /audio/assessment/v3/passages/sam-lent-ollie-his-lucky-pencil-and-it-came-b24c10.mp3 | Sam lent Ollie his lucky pencil, and it came back with teeth marks. | 1 |
| /audio/assessment/v3/passages/when-the-twins-visited-auntie-vee-she-taught-c39bd3.mp3 | When the twins visited Auntie Vee, she taught them a card game from her childhood. | 1 |
| /audio/assessment/v3/passages/nia-put-the-seedling-next-to-the-cactus-but-3e9ae8.mp3 | Nia put the seedling next to the cactus, but it soon grew too tall for the shelf. | 1 |
| /audio/assessment/v3/passages/carmen-showed-grandpa-the-robot-she-had-buil-917dbe.mp3 | Carmen showed Grandpa the robot she had built out of cereal boxes. | 1 |
| /audio/assessment/v3/passages/the-keeper-fed-the-penguins-before-the-visit-7f1e70.mp3 | The keeper fed the penguins before the visitors arrived, so they were already full and sleepy. | 1 |
| /audio/assessment/v3/passages/effie-waved-at-her-cousin-from-the-train-unt-a8e328.mp3 | Effie waved at her cousin from the train until she could not see the platform any more. | 1 |
| /audio/assessment/v3/passages/not-a-single-ticket-for-the-puppet-show-was-9425d0.mp3 | Not a single ticket for the puppet show was left by lunchtime. | 1 |
| /audio/assessment/v3/passages/ravi-knows-the-way-to-the-pool-with-his-eyes-c490c2.mp3 | Ravi knows the way to the pool with his eyes shut. | 1 |
| /audio/assessment/v3/passages/the-whole-class-was-on-its-feet-before-the-f-a60e15.mp3 | The whole class was on its feet before the final whistle. | 1 |
| /audio/assessment/v3/passages/gran-s-soup-could-wake-up-a-sleepy-street-da-830934.mp3 | Gran's soup could wake up a sleepy street, Dad always says. | 1 |
| /audio/assessment/v3/passages/by-the-time-the-bus-appeared-omar-s-patience-38ed9c.mp3 | By the time the bus appeared, Omar's patience had completely run out. | 1 |
| /audio/assessment/v3/passages/the-new-puppy-treated-every-shoe-in-the-hous-b86bbb.mp3 | The new puppy treated every shoe in the house as a chew toy. | 1 |
| /audio/assessment/v3/passages/keeping-the-secret-until-friday-nearly-finis-9e4dbe.mp3 | Keeping the secret until Friday nearly finished poor Lila off. | 1 |
| /audio/assessment/v3/passages/the-hailstorm-turned-the-trampoline-into-a-g-6885f7.mp3 | The hailstorm turned the trampoline into a giant popcorn machine. | 1 |
| /audio/assessment/v3/passages/auntie-meg-won-the-biggest-marrow-prize-at-t-94d84b.mp3 | Auntie Meg won the biggest marrow prize at the village show. | 1 |
| /audio/assessment/v3/passages/the-school-hamster-sleeps-all-day-and-runs-a-514b6e.mp3 | The school hamster sleeps all day and runs all night. | 1 |
| /audio/assessment/v3/passages/scene-a-very-small-dog-walking-a-very-tall-m-5f1c00.mp3 | Scene: a very small dog walking a very tall man on a lead. | 1 |
| /audio/assessment/v3/passages/the-baker-hid-a-lucky-coin-inside-one-of-the-58f27c.mp3 | The baker hid a lucky coin inside one of the hundred buns. | 1 |
| /audio/assessment/v3/passages/little-ivo-taught-the-parrot-to-say-good-mor-895811.mp3 | Little Ivo taught the parrot to say 'good morning' in a week. | 1 |
| /audio/assessment/v3/passages/sports-kit-lives-in-the-blue-drawer-under-ro-7c1f3d.mp3 | Sports kit lives in the blue drawer under Robi's bed. | 1 |
| /audio/assessment/v3/passages/scene-a-whole-family-asleep-on-the-sofa-whil-44961e.mp3 | Scene: a whole family asleep on the sofa while the film credits roll. | 1 |
| /audio/assessment/v3/passages/mrs-cho-rescued-the-football-from-the-school-111823.mp3 | Mrs Cho rescued the football from the school roof with a mop. | 1 |
| /audio/assessment/v3/passages/the-candles-were-relit-twice-because-baby-bo-26ffba.mp3 | The candles were relit twice, because baby Bo blew them out from Mum's lap both times. | 1 |
| /audio/assessment/v3/passages/although-the-queue-curled-twice-around-the-s-b7699f.mp3 | Although the queue curled twice around the square, Nan said the dumplings were worth every minute. | 1 |
| /audio/assessment/v3/passages/priya-read-to-her-little-brother-until-he-fi-38d9f2.mp3 | Priya read to her little brother until he finally fell asleep. | 1 |
| /audio/assessment/v3/passages/the-coach-thanked-the-parents-after-they-had-23b937.mp3 | The coach thanked the parents after they had packed away every last cone and bib. | 1 |
| /audio/assessment/v3/passages/the-tide-had-swallowed-the-whole-sandcastle-3c9922.mp3 | The tide had swallowed the whole sandcastle by tea time. | 1 |
| /audio/assessment/v3/passages/one-sniff-of-the-cheese-sent-the-whole-kitch-3fd386.mp3 | One sniff of the cheese sent the whole kitchen running for the windows. | 1 |
| /audio/assessment/v3/passages/the-window-cleaner-waved-his-squeegee-at-eve-41619e.mp3 | The window cleaner waved his squeegee at every child on the top deck of the bus. | 1 |
| /audio/assessment/v3/passages/gran-passed-jonah-the-binoculars-just-as-he-2b7790.mp3 | Gran passed Jonah the binoculars just as he spotted the heron landing. | 1 |
| /audio/assessment/v3/passages/the-cat-jumped-on-the-box-curled-into-a-ball-ca441f.mp3 | The cat jumped on the box, curled into a ball, and fell asleep. | 1 |
| /audio/assessment/v3/passages/mia-put-a-seed-in-soil-watered-it-and-saw-a-90cc24.mp3 | Mia put a seed in soil, watered it, and saw a green shoot. | 1 |
| /audio/assessment/v3/passages/ben-wet-his-hands-rubbed-in-soap-and-rinsed-546fcd.mp3 | Ben wet his hands, rubbed in soap, and rinsed the bubbles away. | 1 |
| /audio/assessment/v3/passages/zara-put-on-her-shirt-pulled-on-her-trousers-7467ce.mp3 | Zara put on her shirt, pulled on her trousers, and tied her shoes. | 1 |
| /audio/assessment/v3/passages/dad-put-bread-in-the-toaster-waited-for-it-t-3fc182.mp3 | Dad put bread in the toaster, waited for it to pop, and spread butter. | 1 |
| /audio/assessment/v3/passages/noah-threw-the-ball-the-dog-chased-it-and-th-d42a2d.mp3 | Noah threw the ball, the dog chased it, and the dog brought it back. | 1 |
| /audio/assessment/v3/passages/lina-drew-a-circle-added-sun-rays-and-colour-32702f.mp3 | Lina drew a circle, added sun rays, and coloured the sun yellow. | 1 |
| /audio/assessment/v3/passages/omar-set-down-blocks-stacked-a-tower-and-smi-f38992.mp3 | Omar set down blocks, stacked a tower, and smiled at the top. | 1 |
| /audio/assessment/v3/passages/ava-laid-down-bread-added-cheese-and-closed-c25ad6.mp3 | Ava laid down bread, added cheese, and closed the sandwich. | 1 |
| /audio/assessment/v3/passages/rain-began-eli-put-on-boots-opened-an-umbrel-9584b8.mp3 | Rain began. Eli put on boots, opened an umbrella, and walked outside. | 1 |
| /audio/assessment/v3/passages/the-girl-opened-her-book-read-one-page-and-p-8b240f.mp3 | The girl opened her book, read one page, and put in a bookmark. | 1 |
| /audio/assessment/v3/passages/kai-filled-a-cup-drank-the-water-and-put-the-4831b4.mp3 | Kai filled a cup, drank the water, and put the cup in the sink. | 1 |
| /audio/assessment/v3/passages/mum-cracked-an-egg-whisked-it-and-cooked-it-c55686.mp3 | Mum cracked an egg, whisked it, and cooked it in the pan. | 1 |
| /audio/assessment/v3/passages/the-boy-kicked-the-ball-it-hit-the-goal-and-7a7809.mp3 | The boy kicked the ball, it hit the goal, and his team cheered. | 1 |
| /audio/assessment/v3/passages/nia-brushed-the-dog-clipped-on-its-lead-and-ef6b92.mp3 | Nia brushed the dog, clipped on its lead, and took it for a walk. | 1 |
| /audio/assessment/v3/passages/the-baker-mixed-dough-shaped-a-loaf-and-put-1a959f.mp3 | The baker mixed dough, shaped a loaf, and put it in the oven. | 1 |
| /audio/assessment/v3/passages/sam-brushed-his-teeth-put-on-pyjamas-and-cli-8854eb.mp3 | Sam brushed his teeth, put on pyjamas, and climbed into bed. | 1 |
| /audio/assessment/v3/passages/the-child-found-paper-folded-a-plane-and-fle-9e58d4.mp3 | The child found paper, folded a plane, and flew it across the room. | 1 |
| /audio/assessment/v3/passages/ivy-picked-an-apple-washed-it-and-took-a-bit-676533.mp3 | Ivy picked an apple, washed it, and took a bite. | 1 |
| /audio/assessment/v3/passages/the-boy-built-a-snowball-added-a-head-and-ga-1a1a54.mp3 | The boy built a snowball, added a head, and gave the snowman a hat. | 1 |
| /audio/assessment/v3/passages/ana-wrapped-the-gift-tied-a-bow-and-gave-it-37dead.mp3 | Ana wrapped the gift, tied a bow, and gave it to her friend. | 1 |
| /audio/assessment/v3/passages/the-class-dug-a-hole-planted-the-tree-and-wa-778208.mp3 | The class dug a hole, planted the tree, and watered its roots. | 1 |
| /audio/assessment/v3/passages/leo-put-rubbish-in-a-bag-tied-it-shut-and-pl-b2b6c9.mp3 | Leo put rubbish in a bag, tied it shut, and placed it in the bin. | 1 |
| /audio/assessment/v3/passages/the-bus-stopped-the-doors-opened-and-the-chi-feb721.mp3 | The bus stopped, the doors opened, and the children stepped off. | 1 |
| /audio/assessment/v3/passages/rae-picked-up-a-pencil-drew-a-star-and-colou-9c738f.mp3 | Rae picked up a pencil, drew a star, and coloured it red. | 1 |
| /audio/assessment/v3/passages/max-opened-the-gate-led-the-pony-through-and-bb8dc4.mp3 | Max opened the gate, led the pony through, and shut the gate. | 1 |
| /audio/assessment/v3/passages/the-frog-sat-jumped-into-the-pond-and-swam-a-96fb56.mp3 | The frog sat, jumped into the pond, and swam away. | 1 |
| /audio/assessment/v3/passages/jo-poured-cereal-added-milk-and-ate-breakfas-b7a26b.mp3 | Jo poured cereal, added milk, and ate breakfast. | 1 |
| /audio/assessment/v3/passages/the-child-zipped-a-coat-put-on-a-hat-and-wen-2bb402.mp3 | The child zipped a coat, put on a hat, and went into the snow. | 1 |
| /audio/assessment/v3/passages/mia-washed-a-plate-dried-it-and-put-it-on-th-3e9f3d.mp3 | Mia washed a plate, dried it, and put it on the shelf. | 1 |
| /audio/assessment/v3/passages/jam-morning-ran-to-gran-s-strict-order-berri-e0d90d.mp3 | Jam morning ran to Gran's strict order: berries picked before the sun got hot, then washed, then boiled with sugar until the kitchen windows wept steam. Only when a drop wrinkled on a cold saucer did the jars get filled, and the labels went on last, once the glass had cooled. | 1 |
| /audio/assessment/v3/passages/the-egg-diary-told-the-whole-story-day-one-s-a08b58.mp3 | The egg diary told the whole story. Day one: six eggs under the warm lamp. Day nineteen: the first tiny crack. Day twenty: cheeping from inside the shells. Day twenty-one: five wet chicks, then a sixth, late and loud. Day twenty-three: six fluffy escape artists. | 1 |
| /audio/assessment/v3/passages/hair-cut-saturday-followed-its-ritual-the-go-f6c306.mp3 | Hair-cut Saturday followed its ritual. The gown went on backwards like a superhero cape. The spray bottle made Otto shiver. The scissors talked their snip-snip talk around his ears. And only after the little mirror had shown him the back of his own head did the lollipop jar come down from the shelf. | 1 |
| /audio/assessment/v3/passages/the-museum-trip-ran-like-clockwork-coats-and-326ff0.mp3 | The museum trip ran like clockwork. Coats and bags went into the big lockers first. The dinosaur hall came before lunch, because Mr Idris knew nobody could concentrate after seeing the gift shop. Lunch happened in the echoing basement room. The gift shop came last — five pounds, one bag, no swaps. | 1 |
| /audio/assessment/v3/passages/the-salad-took-all-spring-seeds-went-into-po-abb3e4.mp3 | The salad took all spring. Seeds went into pots on the cold windowsill in March. In April, after the last frost had passed, the little plants moved out to the raised bed. May brought watering duty and one dramatic slug battle. In June, at last, scissors met lettuce, and lunch tasted of the whole spring. | 1 |
| /audio/assessment/v3/passages/match-day-afternoons-had-a-fixed-shape-boots-e03343.mp3 | Match-day afternoons had a fixed shape. Boots were cleaned the night before — always the night before, never the morning, that was the rule. The team sheet went up at noon. Warm-up laps started at one. And the moment the whistle blew at two, every stomach butterfly vanished until full time. | 1 |
| /audio/assessment/v3/passages/the-shadow-experiment-lasted-from-breakfast-bcb20e.mp3 | The shadow experiment lasted from breakfast to tea. At nine, Asha chalked round her friend's shadow — long and thin, stretching to the fence. Just after twelve she drew it again: a squat puddle right at his feet. At three the shadow had crept out the other side, and by five it touched the hedge, longer than ever. | 1 |
| /audio/assessment/v3/passages/moving-the-bookcase-needed-planning-every-bo-bbef10.mp3 | Moving the bookcase needed planning. Every book came off the shelves before anything else — Dad had learned that lesson the hard way. The empty case walked across the room on little waddles. Then the carpet fluff where it had stood got its first hoover in years. Only after that did the books go back, in Robi's brand-new rainbow order. | 1 |
| /audio/assessment/v3/passages/noor-licked-the-last-of-the-icing-from-her-f-faa03d.mp3 | Noor licked the last of the icing from her fingers. The kitchen still smelled of warm sponge, and two greasy tins soaked in the sink. On the table sat the finished cake, iced and cherried, next to the recipe book still open at page nine. | 1 |
| /audio/assessment/v3/passages/the-sledge-stood-dripping-in-the-hall-three-d37755.mp3 | The sledge stood dripping in the hall. Three pairs of soaked gloves lay on the radiator, and a carrot with a bite-shaped dent waited by the back door. Out in the garden, a lopsided white figure wore Dad's second-best scarf. | 1 |
| /audio/assessment/v3/passages/by-the-gate-stood-a-wheelbarrow-of-weeds-sti-6de622.mp3 | By the gate stood a wheelbarrow of weeds, still green. The flower bed's soil lay dark and freshly turned, and a tray of empty little pots had been stacked by the shed. In the bed itself, twelve small marigolds stood in a crisp new row, looking slightly surprised. | 1 |
| /audio/assessment/v3/passages/rio-hopped-to-the-bench-with-one-bare-foot-o-66f1c9.mp3 | Rio hopped to the bench with one bare foot. Out in the shallow end, a lifeguard fished patiently with a long pole. On the tiles lay one wet sock, and somewhere between the changing room and the water, the story of how his flip-flop had ended up floating told itself. | 1 |
| /audio/assessment/v3/passages/the-parcel-for-aunt-zainab-was-ready-at-last-aa0bd0.mp3 | The parcel for Aunt Zainab was ready at last: taped, addressed, and heavy with marmalade jars wrapped in yesterday's crossword pages. Bubble wrap scraps littered the floor, the sellotape had surrendered its final inch, and the address label — third attempt — finally spelled 'Fentiman Road' right. | 1 |
| /audio/assessment/v3/passages/curtain-call-flowers-rained-onto-the-stage-a-61ff59.mp3 | Curtain call. Flowers rained onto the stage as the cast bowed in their painted cardboard armour. In the wings, the prompt book sat closed on its stool at last, and backstage a whole term's worth of rehearsal notes filled the bin — three drafts of the script, the audition list, the first clumsy set sketches. | 1 |
| /audio/assessment/v3/passages/the-wormery-finally-stood-complete-on-the-ba-d4c3f9.mp3 | The wormery finally stood complete on the balcony: layers of sand and dark soil striped like a cake, damp leaves on top, and five worms already tunnelling their first wavy lines past the glass. A bag of leftover sand slumped by the door, and Juno's soil-crusted trowel soaked in a jam jar. | 1 |
| /audio/assessment/v3/passages/half-time-the-score-sat-at-two-one-and-coach-1ec56b.mp3 | Half-time. The score sat at two-one, and Coach passed the orange quarters down the line of muddy knees. Nobody mentioned the first goal any more — the lucky bounce off the post — and everybody mentioned the second, Ffion's header, over and over, louder each telling. | 1 |
| /audio/assessment/v3/passages/a-letter-s-journey-has-stages-it-is-posted-i-ec331f.mp3 | A letter's journey has stages. It is posted into the box on the corner. A postal worker empties the box into a big sack. At the sorting office, machines read the postcode and fling it into the right tray. A van carries the tray across the country, and a walking postie brings the letter the last few steps to the right door. | 1 |
| /audio/assessment/v3/passages/from-cocoa-pod-to-chocolate-bar-takes-many-s-be68b9.mp3 | From cocoa pod to chocolate bar takes many steps. Farmers cut the pods and scoop out the beans. The beans dry in the sun for days. Roasting wakes up their flavour. Then grinding turns them into a thick brown paste, and only after sugar and milk join in does the paste set into the bars on the shop shelf. | 1 |
| /audio/assessment/v3/passages/recycled-glass-goes-round-in-a-loop-bottles-6967b1.mp3 | Recycled glass goes round in a loop. Bottles from the kerbside boxes travel to the plant. There they are sorted by colour and smashed into sparkling crumbs. A furnace melts the crumbs into glowing liquid. The liquid is blown or pressed into brand-new bottles — which, with luck, come back in the kerbside boxes to start again. | 1 |
| /audio/assessment/v3/passages/a-tooth-s-visit-from-the-tooth-fairy-follows-79de93.mp3 | A tooth's visit from the tooth fairy follows steps, Ari explained seriously. The tooth wobbles for days. It comes out — usually in an apple or a laugh. It goes under the pillow at bedtime. In the morning, a coin has taken its place. The tooth itself, Ari suspected, joins a very large collection somewhere. | 1 |
| /audio/assessment/v3/passages/honey-is-a-relay-race-bees-drink-nectar-from-c9532d.mp3 | Honey is a relay race. Bees drink nectar from flowers and carry it home. House bees pass it mouth to mouth, thickening it as it goes. The thickened nectar is packed into wax cells. Bees fan it with their wings until enough water has gone. Only then is the cell capped with wax, honey sealed inside like a tiny jar. | 1 |
| /audio/assessment/v3/passages/the-lifeboat-launch-runs-on-drilled-order-pa-864368.mp3 | The lifeboat launch runs on drilled order. Pagers beep in kitchens and workshops across the town. Crew drop everything and run to the station. Kit goes on in ninety seconds — boots, suit, lifejacket. The doors roll up, the boat thunders down the slipway, and only out past the harbour wall does anyone have breath to ask where they are going. | 1 |
| /audio/assessment/v3/passages/a-library-book-s-life-is-a-circle-it-is-chos-dfd67c.mp3 | A library book's life is a circle. It is chosen and borrowed at the desk. It lives in a reader's house for a while — beside beds, in bags, once or twice in a garden. It comes back through the return slot. It is checked, sometimes mended with careful tape, and then reshelved in its exact place, ready to be chosen all over again. | 1 |
| /audio/assessment/v3/passages/school-soup-follows-the-garden-calendar-seed-b3d551.mp3 | School soup follows the garden calendar. Seeds are sown in trays in early spring. Seedlings move to the vegetable patch after the frosts. All term the watering rota keeps them alive — mostly. In autumn the vegetables are pulled, scrubbed, and chopped, and the whole school eats a soup that took half a year to make. | 1 |
| /audio/assessment/v3/passages/the-bridge-of-books-rose-across-the-classroo-1671e4.mp3 | The bridge of books rose across the classroom floor all week. Monday: two towers, one at each side. Tuesday: the towers grew waist-high. Wednesday: the first careful plank of atlases went across the gap. Thursday: the marble made its maiden crossing. Friday, by head teacher's decree, the whole marvellous thing went back on the shelves. | 1 |
| /audio/assessment/v3/passages/bonfire-night-ran-on-a-strict-timetable-the-9e743c.mp3 | Bonfire night ran on a strict timetable. The garden was checked for hedgehogs while it was still light — always first, always in daylight. Sparklers came out at six, one each, held at arm's length. The bonfire was lit at seven. And the rockets waited until full dark, because Dad said stars deserve a black sky. | 1 |
| /audio/assessment/v3/passages/the-sandcastle-stood-finished-at-last-moat-a-5b1b70.mp3 | The sandcastle stood finished at last, moat and all, with a seagull feather flying from the top tower. Around it lay the story of the morning: a ring of shells not quite used up, two buckets with wet sand still crusting their rims, and one very sandy pair of knees. | 1 |
| /audio/assessment/v3/passages/the-concert-was-over-on-the-piano-stood-a-ja-df39d3.mp3 | The concert was over. On the piano stood a jar of garden flowers and a thank-you card signed by the whole street. The borrowed chairs were going back next door two at a time, and in the kitchen, the tea urn — hero of the interval — steamed gently through its final cups. | 1 |
| /audio/assessment/v3/passages/wool-has-a-long-journey-to-a-jumper-the-shee-91fed7.mp3 | Wool has a long journey to a jumper. The sheep is sheared in early summer — a quick, tickly haircut. The fleece is washed until the water runs clear. Carding combs untangle every fibre the same way. The spinning wheel twists the fibres into one long thread, and the knitting needles do the rest, loop by loop. | 1 |
| /audio/assessment/v3/passages/a-rescued-hedgehog-moves-through-the-wildlif-c95ffb.mp3 | A rescued hedgehog moves through the wildlife centre in stages. New arrivals are weighed and checked the moment they come in. Poorly ones stay warm in the quiet room until they feed by themselves. Then comes the outdoor pen, to practise being wild again. Release night is last — back to the exact hedge where each one was found. | 1 |
| /audio/assessment/v3/passages/the-lost-glove-s-week-went-like-this-monday-8df5a9.mp3 | The lost glove's week went like this. Monday it fell at the bus stop. Tuesday someone balanced it on the wall, in case its owner came back. Wednesday it wore a dusting of frost. Thursday Priya recognised it from the bus window. And on Friday, glove and girl went home together at last. | 1 |
| /audio/assessment/v3/passages/the-pedestrian-crossing-does-its-dance-in-st-c32bab.mp3 | The pedestrian crossing does its dance in strict order. The button is pressed, and the little light says WAIT. Traffic gets its amber warning, then red. Only then does the green walking man appear, with his beeps. When he starts to blink, finish crossing — and then the cars get their turn again. | 1 |
| /audio/assessment/v3/passages/jory-borrowed-ann-s-comic-and-left-it-out-in-be9d34.mp3 | Jory borrowed Ann's comic and left it out in the rain. The pages wrinkled like crisps. He wanted to hide it under his bed. Instead he showed Ann, said sorry, and spent his pocket money on a new copy. Ann was sad about the comic — but glad he had told the truth. | 1 |
| /audio/assessment/v3/passages/bel-s-first-batch-of-biscuits-came-out-black-60c816.mp3 | Bel's first batch of biscuits came out black as coal. She nearly threw her apron in the bin. Instead she read the recipe again and found her mistake — the oven had been far too hot. The second batch came out golden, and the kitchen smelled like a hug. | 1 |
| /audio/assessment/v3/passages/kit-snapped-the-blue-crayon-and-quickly-slid-fdda3d.mp3 | Kit snapped the blue crayon and quickly slid it back in the tin, broken ends together. All morning it bothered him like a stone in a shoe. At last he told Miss May. She smiled, taped the crayon, and said broken things mend easier than secrets. | 1 |
| /audio/assessment/v3/passages/ravi-got-off-the-bus-one-stop-early-to-avoid-69eb0b.mp3 | Ravi got off the bus one stop early to avoid sitting next to a new boy. The walk was long, his bag was heavy, and he still met the new boy at the school gate — who grinned and carried the bag the last stretch. The next day they sat together. | 1 |
| /audio/assessment/v3/passages/lena-bragged-that-her-wobbly-tooth-would-com-17b458.mp3 | Lena bragged that her wobbly tooth would come out first, before Sam's. She wiggled it all day just to win. It came out at last — but it hurt, and there was no prize, only Sam saying 'well done' kindly. Lena wished she had let it happen in its own time. | 1 |
| /audio/assessment/v3/passages/min-fed-the-class-goldfish-twice-then-once-m-d411b0.mp3 | Min fed the class goldfish twice, then once more, because it always looked hungry. The tank turned cloudy and the fish went slow and sad. The pet-shop lady explained: too much food is its own kind of unkindness. Min learned to feed a pinch, no more, and the water cleared. | 1 |
| /audio/assessment/v3/passages/in-the-quiet-library-posy-whispered-a-joke-t-97701f.mp3 | In the quiet library, Posy whispered a joke, then a story, then a song. The librarian did not scold. She just pointed at the reading corner, where a small boy had lost his place three times. Posy saw his cross little face — and understood without one word being said. | 1 |
| /audio/assessment/v3/passages/dara-promised-to-water-next-door-s-plum-tree-c4068b.mp3 | Dara promised to water next-door's plum tree during the holiday, then forgot for a whole hot week. The leaves curled. She watered it every evening after that, twice on the hottest days, and by the end of summer the tree stood green again — and Dara never made a promise carelessly again. | 1 |
| /audio/assessment/v3/passages/every-wet-morning-iris-carried-her-little-br-bc0977.mp3 | Every wet morning, Iris carried her little brother's boots so he could climb the bus steps. One icy day, Iris slipped and her books flew everywhere. Before she could blink, her brother and three of his small friends were gathering pages from every puddle. | 1 |
| /audio/assessment/v3/passages/the-new-girl-ate-lunch-alone-so-bo-moved-his-72f9f7.mp3 | The new girl ate lunch alone, so Bo moved his tray next to hers and shared his grapes. Weeks later, when Bo broke his arm and could not cut his food, a tray slid quietly next to his — and the new girl cut his dinner into pieces without being asked. | 1 |
| /audio/assessment/v3/passages/grandpa-tan-fixed-umbrellas-for-the-whole-st-301704.mp3 | Grandpa Tan fixed umbrellas for the whole street and never took a penny. 'Rain falls on everyone,' he said. When his roof leaked in the big storm, half the street appeared at his door with ladders, buckets, and a hot dinner in a basket. | 1 |
| /audio/assessment/v3/passages/at-the-fair-nia-s-last-coin-rolled-under-the-5f0ff9.mp3 | At the fair, Nia's last coin rolled under the lost-and-found table. The boy behind the table crawled in the dust to fetch it, and Nia used it to buy two toffee apples — one for herself, and one for a dusty, grinning boy. | 1 |
| /audio/assessment/v3/passages/wren-was-the-quietest-singer-in-choir-so-qui-deb549.mp3 | Wren was the quietest singer in choir, so quiet her words were mostly shapes. Ana stood beside her every week and sang a little softer, so Wren could hear her own voice. At the concert, two voices rose together — and one of them had never sounded so brave. | 1 |
| /audio/assessment/v3/passages/old-mr-price-s-tractor-sank-in-the-mud-and-h-5fcb4e.mp3 | Old Mr Price's tractor sank in the mud, and he sat a long time, too proud to wave for help. The Okafor children saw anyway. They fetched planks, their mother, and a rope — and afterwards Mr Price's orchard gate, locked for years, stood open with a sign: APPLES, HELP YOURSELVES. | 1 |
| /audio/assessment/v3/passages/jude-found-a-splinter-of-glass-on-the-slide-69ea43.mp3 | Jude found a splinter of glass on the slide and spent his whole break carefully clearing every piece, missing the football game. Nobody noticed — he thought. On Friday, a note appeared in his tray: 'Thank you from the little ones. You didn't know we saw.' | 1 |
| /audio/assessment/v3/passages/one-skipping-rope-eleven-children-quarrels-e-626a9b.mp3 | One skipping rope, eleven children. Quarrels every break — until Fern started counting everyone in: two turns each, jumpers become turners, turners become jumpers. The rope never rested, the queue sang the counting song, and break time stopped ending in tears. | 1 |
| /audio/assessment/v3/passages/pip-s-sunflower-seed-sat-in-the-soil-doing-n-97af55.mp3 | Pip's sunflower seed sat in the soil doing nothing while Marco's shot up like a green rocket. Pip watered anyway, every day, even when it felt silly. In week five, a late little stem appeared — and by August, Pip's flower was the tallest in the whole garden. | 1 |
| /audio/assessment/v3/passages/the-monkey-bars-defeated-ola-all-autumn-each-22f6cb.mp3 | The monkey bars defeated Ola all autumn. Each break she got one bar farther before dropping. Winter gloves, spring blisters, a hundred small tries. On the last day of term she swung across the whole row — and the playground burst into cheering she never expected. | 1 |
| /audio/assessment/v3/passages/tam-wanted-to-fold-one-hundred-paper-cranes-21fd46.mp3 | Tam wanted to fold one hundred paper cranes like the ones in the library book. By crane twenty his folds were crooked; by fifty, his thumbs ached. He folded on the bus, at breakfast, in the bath queue. Crane one hundred sat perfectly on his windowsill before his birthday. | 1 |
| /audio/assessment/v3/passages/nobody-wanted-goalkeeper-so-quiet-emil-took-b46617.mp3 | Nobody wanted goalkeeper, so quiet Emil took the gloves. He practised alone against the garage wall all season — thud, catch, thud, catch. In the last match, with the score level, Emil flew sideways and tipped the ball over the bar, and his name was the loudest word on the pitch. | 1 |
| /audio/assessment/v3/passages/the-first-snow-would-not-stick-and-ceri-chec-335b1d.mp3 | The first snow would not stick, and Ceri checked the window a hundred times. Gran said watching would not hurry the sky, so Ceri stopped watching and got ready instead: gloves dried, sledge waxed, carrot saved. When the deep snow finally came, she was first — and readiest — on the hill. | 1 |
| /audio/assessment/v3/passages/the-jigsaw-s-last-corner-piece-was-missing-a-74be0f.mp3 | The jigsaw's last corner piece was missing, and everyone gave up — except Ash, who liked finishing things. He searched the sofa, the stairs, the dog's basket, and finally the turn-up of Grandad's trouser leg. The picture on the table was complete because one person would not stop looking. | 1 |
| /audio/assessment/v3/passages/grandpa-s-watch-ran-five-minutes-slow-and-he-73552d.mp3 | Grandpa's watch ran five minutes slow, and he liked it that way — but the mending of it became Suvi's winter project. Springs, screws, a magnifying glass, three failed tries, one bent tool. When the watch finally ticked true, Grandpa wore it proudly... set five minutes slow again, for old times' sake. | 1 |
| /audio/assessment/v3/passages/the-school-s-litter-picking-robot-kept-jammi-70a606.mp3 | The school's litter-picking robot kept jamming, and Class 5 kept unjamming it — new wheels from a skateboard, a brush from the lost kit box, tape, more tape. The head teacher said buy a new one. Class 5 said their patched robot, wobbling proudly down the corridor, was already the best one in the world. | 1 |
| /audio/assessment/v3/passages/two-ladders-leaned-on-the-orchard-wall-jo-s-6285e3.mp3 | Two ladders leaned on the orchard wall: Jo's new silver one and the old wooden one Jo's mum had climbed as a girl. Jo always chose the silver ladder — until the day it slid on wet grass and the wooden one, with its worn, deep-gripped rungs, carried her safely up to the highest apples. That autumn Jo oiled the old ladder's joints herself, and the silver one waited under a sheet. | 1 |
| /audio/assessment/v3/passages/yusuf-practised-the-trumpet-loudly-and-often-3a216b.mp3 | Yusuf practised the trumpet loudly and often, and told everyone about the concert. His sister Amal practised the harp quietly behind a closed door, and told no one. At the concert Yusuf played brilliantly and bowed twice. Amal played one simple tune so beautifully that the hall forgot to clap for a moment. On the way home, Yusuf asked, for the first time, if she would teach him the quiet way of practising. | 1 |
| /audio/assessment/v3/passages/the-night-light-argument-ran-all-week-dad-sa-f2c084.mp3 | The night-light argument ran all week: Dad said seven-year-olds do not need one, and Milo said the dark had shapes in it. The compromise was a torch on the pillow, 'for emergencies'. Milo used it the first night, held it the second, and by Friday it lay under the bed, forgotten — because knowing he COULD switch it on had quietly shrunk every shape in the dark. | 1 |
| /audio/assessment/v3/passages/priya-found-the-spelling-list-for-friday-s-t-716390.mp3 | Priya found the spelling list for Friday's test lying by the photocopier — every word, a day early. She looked at it a long moment, then posted it back under the staffroom door. Her score on Friday was seven out of ten, her ordinary score. But when Mr Field told the class someone had returned the list unread, Priya sat a little taller than any ten out of ten had ever made her sit. | 1 |
| /audio/assessment/v3/passages/when-the-storm-knocked-the-nest-from-the-hed-403933.mp3 | When the storm knocked the nest from the hedge, Etta wanted to carry the eggs indoors at once, to save them with blankets and a lamp. Her grandmother stopped her: 'The mother is watching from the fence. Help small, not big.' They wedged the nest back, moved away, and watched the mother return. All three chicks hatched in the hedge, wild and loud, needing nobody's lamp. | 1 |
| /audio/assessment/v3/passages/the-junior-bake-off-allowed-one-entry-each-z-1b270a.mp3 | The junior bake-off allowed one entry each. Zeke's jam roll collapsed an hour before judging, and he stood in the wreckage of sponge, out of time and out of hope. Nell looked at her own perfect lemon cake, then cut it in half, plated the halves separately, and told the judges the second entry was Zeke's idea as much as hers. They did not win. Neither of them ever called it a loss. | 1 |
| /audio/assessment/v3/passages/every-evening-kofi-s-echo-game-in-the-stairw-3d4296.mp3 | Every evening, Kofi's echo game in the stairwell — HELLO... hello... hello — annoyed the third floor. Mrs Adjei came down, and everyone waited for the telling-off. Instead she taught him the trick her own father taught her: the softer you call, the closer the echo leans in to listen. After that, the stairwell heard whisper-games, and the third floor heard nothing at all. | 1 |
| /audio/assessment/v3/passages/the-class-voted-to-spend-the-prize-money-on-d57068.mp3 | The class voted to spend the prize money on a party. Robin alone voted for new goal nets, and lost, nineteen to one. At the party, Robin neither sulked in the corner nor pretended the nets had been a silly idea. He handed out cake, laughed at the games — and in spring, when the nets budget came round again, nineteen hands remembered his good grace and went up with his. | 1 |
| /audio/assessment/v3/passages/sana-s-telescope-was-the-envy-of-the-street-c80da8.mp3 | Sana's telescope was the envy of the street, and she guarded it jealously — until the comet week, when she discovered that a wonder seen alone goes quiet quickly. She chalked VIEWINGS, FREE on the pavement. Neighbours queued past bedtime, gasping in turn, and Sana found that the comet grew more amazing every time someone new cried out at it. | 1 |
| /audio/assessment/v3/passages/the-wrong-bus-stop-turned-out-to-be-the-righ-b116c3.mp3 | The wrong bus stop turned out to be the right one. Dropped a street early by a rain-blind driver, Marisol sheltered in a doorway that happened to belong to the town's tiny museum — free on Thursdays. She spent the hour among ship models and whale bones she had never known existed, and afterwards she sometimes got off early on purpose, just to see what else the town was hiding. | 1 |
| /audio/assessment/v3/passages/every-apology-tom-had-ever-given-was-a-mumbl-46cfcb.mp3 | Every apology Tom had ever given was a mumbled 'sorry' with his eyes on his shoes. But breaking Gran's teapot — the one from her wedding — mumbled words felt too small. He wrote a letter instead: what he did, why it was careless, what he would save up to mend. Gran kept the taped-together teapot on the shelf. The letter she kept in her purse, for years. | 1 |
| /audio/assessment/v3/passages/the-lighthouse-keeper-kept-a-list-of-every-s-f3edcc.mp3 | The lighthouse keeper kept a list of every ship that passed safely in the night. Nobody asked him to; the ships never knew. When he retired after forty years, the harbourmaster read the list's last page aloud — four thousand names — and the whole quay stood silent, understanding at last what steady, unseen work had been holding their sea-road open. | 1 |
| /audio/assessment/v3/passages/at-the-lantern-festival-the-prize-always-wen-405cc7.mp3 | At the lantern festival, the prize always went to the biggest lantern — until the year of the great wind. One by one the giant paper palaces guttered and tore, while Amaya's stubby little lantern, built low and snug around its flame, bobbed on through the dark like a heartbeat. It crossed the finish line alone, the only light left on the river. | 1 |
| /audio/assessment/v3/passages/priw-the-goldfish-ate-everything-first-flake-ea74ce.mp3 | Priw the goldfish ate everything first — flakes meant for three fish vanished into one round mouth. He grew grand and golden while Tup and Lin thinned behind the pump. Then came the week the family forgot the flakes. Priw, who had never learned to hunt the tank's green threads, drifted hungry — and it was quick little Tup and Lin who nosed him toward the water-weed and showed him how. | 1 |
| /audio/assessment/v3/passages/mud-season-ruined-every-shoe-in-the-village-a2b1f9.mp3 | Mud season ruined every shoe in the village school, and the cloakroom filled with squelching and complaints. Little Ede said nothing. Each break, she simply lined the worst boots by the radiator and turned them as they dried. Nobody knew for weeks. When the head finally caught her at it and asked why, Ede shrugged: warm boots made people kinder all afternoon, and she liked the school kinder. | 1 |
| /audio/assessment/v3/passages/the-twins-divided-the-attic-with-a-chalk-lin-752208.mp3 | The twins divided the attic with a chalk line the day they stopped sharing: her books that side, his models this side. The line worked perfectly. It kept out borrowing, and mess, and quarrels — and stories read aloud, and glue passed at the right moment, and company on rainy days. By October the attic was the tidiest, quietest, loneliest room in the house, and the chalk was the first thing they washed away together. | 1 |
| /audio/assessment/v3/passages/remember-pip-who-watered-a-seed-that-showed-8e4e5e.mp3 | Remember Pip, who watered a seed that showed nothing for five weeks and grew the garden's tallest sunflower? Keep Pip's lesson in mind. | 1 |
| /audio/assessment/v3/passages/remember-jory-who-ruined-ann-s-comic-in-the-3fbdcd.mp3 | Remember Jory, who ruined Ann's comic in the rain and chose telling the truth over hiding it. Keep that lesson in mind. | 1 |
| /audio/assessment/v3/passages/remember-etta-and-the-fallen-nest-her-grandm-437d5e.mp3 | Remember Etta and the fallen nest: her grandmother taught her to 'help small, not big', wedging the nest back and letting the mother bird do the rest. Keep that lesson in mind. | 1 |
| /audio/assessment/v3/passages/remember-the-lighthouse-keeper-s-list-forty-5ae041.mp3 | Remember the lighthouse keeper's list — forty years of steady, unseen work that kept the sea-road open. Keep that lesson in mind. | 1 |
| /audio/assessment/v3/passages/remember-nell-at-the-bake-off-who-cut-her-pe-6911ca.mp3 | Remember Nell at the bake-off, who cut her perfect cake in half so her friend still had an entry, and never called it a loss. Keep that lesson in mind. | 1 |
| /audio/assessment/v3/passages/remember-amaya-s-little-lantern-built-low-an-65c96f.mp3 | Remember Amaya's little lantern, built low and snug around its flame, still burning when the grand paper palaces had torn. Keep that lesson in mind. | 1 |
| /audio/assessment/v3/passages/remember-priya-and-the-spelling-list-she-pos-379bab.mp3 | Remember Priya and the spelling list she posted back under the staffroom door unread, and how seven honest marks felt taller than ten unfair ones. Keep that lesson in mind. | 1 |
| /audio/assessment/v3/passages/remember-the-twins-chalk-line-how-a-wall-tha-706ea6.mp3 | Remember the twins' chalk line — how a wall that kept out mess and quarrels kept out company too, until washing it away was the happiest chore in the house. Keep that lesson in mind. | 1 |
| /audio/assessment/v3/passages/zia-copied-ola-s-homework-to-save-time-and-g-d33ac2.mp3 | Zia copied Ola's homework to save time, and got the same three answers wrong. Worse, she could not explain them at the board. That night she did the page herself, slowly. Next test her answers were her own — and she could explain every one. | 1 |
| /audio/assessment/v3/passages/on-the-coldest-morning-ffion-cleared-frost-f-cd1347.mp3 | On the coldest morning, Ffion cleared frost from her neighbour's windscreen along with her mum's, just because she was out there anyway with the scraper. All winter after that, on bin day, Ffion's family bins came back up the drive before they were even awake — wheeled by a neighbour who was out there anyway. | 1 |
| /audio/assessment/v3/passages/rosa-could-not-swim-a-stroke-in-june-she-wou-cc5e91.mp3 | Rosa could not swim a stroke in June. She would not go in past her waist. All summer she practised floating, then kicking, then one arm, then the other. On the last beach day, she swam out to the yellow buoy and back — not fast, not far, but every metre of it hers. | 1 |
| /audio/assessment/v3/passages/ben-teased-ollie-about-his-taped-glasses-and-aab010.mp3 | Ben teased Ollie about his taped glasses, and the laugh he expected never came — only a horrible quiet. Sorry felt impossible to say, so Ben did it the slow way: a saved seat, a defending word at football, and at last the words themselves. 'Took you long enough,' said Ollie — and shoved up to make room. | 1 |
| /audio/assessment/v3/passages/the-lunch-queue-crush-always-squeezed-out-li-3d401c.mp3 | The lunch queue crush always squeezed out little Yani, last and smallest. Big Aron noticed, and simply stood behind him each day like a friendly wall. Years later — Aron on crutches after his accident, the corridor crowded — it was a much taller Yani who walked behind him, all the way, like a friendly wall. | 1 |
| /audio/assessment/v3/passages/the-recorder-squeaked-for-everyone-but-for-d-84ae10.mp3 | The recorder squeaked for everyone, but for Dot it SCREECHED. Her family bought earplugs; the dog left the room. Dot practised in the shed, ten minutes a day, no more, no matter what. By the spring concert, the screech had worn away like a rough edge, and the shed concerts had quietly become rather good. | 1 |
| /audio/assessment/v3/passages/nobody-saw-wolf-knock-the-class-globe-off-it-5b3b7f.mp3 | Nobody saw Wolf knock the class globe off its stand — but Wolf saw the dent, and Wolf knew. The secret felt like a marble in his shoe. When he finally told Mr Otieno, the telling took ten seconds, the gluing five minutes, and the marble was gone by lunch. | 1 |
| /audio/assessment/v3/passages/half-moon-lane-flooded-and-the-corner-shop-s-59fea9.mp3 | Half Moon Lane flooded, and the corner shop stood in brown water. Mrs Vo had given credit, sweets, and kind words for twenty years. By noon, without one phone call, the lane filled with neighbours in wellies, carrying and mopping — and by evening the shop's OPEN sign was the driest thing on the street. | 1 |
| /audio/assessment/v3/passages/the-chess-club-s-best-player-ines-could-beat-597346.mp3 | The chess club's best player, Ines, could beat anyone — and said so, often. The club shrank to three. New teacher Ms Drew asked Ines to spend one term coaching instead of winning. It itched at first, losing on purpose to show a trick. But by summer the club filled two classrooms, and when a small coached beginner finally beat her fair and square, Ines was surprised to find she had never enjoyed chess more. | 1 |
| /audio/assessment/v3/passages/papa-s-garden-was-chaos-beans-in-with-roses-7f8386.mp3 | Papa's garden was chaos — beans in with roses, pumpkins wandering the path — and next door's garden was ruler-straight rows. Next door teased; Papa just picked. When blight took the whole street's tomatoes, it hopped easily down next door's tidy tomato rows but got lost in Papa's jumble, where marigolds and garlic broke its path. That autumn, next door's rows had two new residents: marigolds, and a little wandering pumpkin. | 1 |
| /audio/assessment/v3/passages/the-school-play-needed-a-horse-and-the-horse-c70a8c.mp3 | The school play needed a horse, and the horse costume needed two children who could move as one. Rehearsals were disaster — front legs turning left, back legs right, the audience of teachers crying with laughter. So Fen and Alba practised everything together for a month: walking home, queueing, even yawning. On the night, the horse trotted, reared, and bowed — and two very different girls came out of one costume as best friends. | 1 |
| /audio/assessment/v3/passages/great-aunt-bess-left-callum-her-treasure-and-975c19.mp3 | Great-Aunt Bess left Callum her 'treasure', and the whole family imagined jewellery. The box held a trowel, seed packets, and a notebook: fifty years of what she had planted, for whom, and why — a tree for every new baby on the street, roses for every wedding. Callum was disappointed for exactly one spring. Then the first of HIS trees blossomed outside the maternity window, and he understood what kind of rich his aunt had been. | 1 |
| /audio/assessment/v3/passages/remember-wolf-and-the-dented-globe-how-confe-beb179.mp3 | Remember Wolf and the dented globe — how confessing took ten seconds and carrying the secret had felt like a marble in his shoe. Keep that lesson in mind. | 1 |
| /audio/assessment/v3/passages/remember-ede-drying-the-village-school-s-boo-ef5fa5.mp3 | Remember Ede drying the village school's boots by the radiator — small quiet care that made a whole school kinder. Keep that lesson in mind. | 1 |
| /audio/assessment/v3/passages/the-sponsored-silence-raised-money-for-the-l-8420c9.mp3 | The sponsored silence raised money for the library, and chatterbox Vin was everyone's favourite joke entry. He lasted the whole day — but the surprise was what he heard in his own silence: Priw's chair squeaking for a cushion, quiet Lom's brilliant mutterings over the maths, the lonely hum of the boy by the window. Vin never became a quiet boy. But he became a boy who sometimes chose to listen, and three people's days got better when he did. | 1 |
| /audio/assessment/v3/passages/remember-the-little-lantern-that-finished-al-e7f2aa.mp3 | Remember the little lantern that finished alone because it was built for the wind, not for the judges. Keep that lesson in mind. | 1 |

## 4. Single-word recordings (shared pool /audio/child-mode/words)

419 of 1595 are missing — record the missing set below; the rest already exist in the pool.

| File | Word | Used by |
|---|---|---|
| /audio/child-mode/words/lung.mp3 | lung | 3 |
| /audio/child-mode/words/brow.mp3 | brow | 1 |
| /audio/child-mode/words/colt.mp3 | colt | 1 |
| /audio/child-mode/words/hoppy.mp3 | hoppy | 1 |
| /audio/child-mode/words/hippo.mp3 | hippo | 1 |
| /audio/child-mode/words/tries.mp3 | tries | 1 |
| /audio/child-mode/words/crust.mp3 | crust | 1 |
| /audio/child-mode/words/pound.mp3 | pound | 1 |
| /audio/child-mode/words/torn.mp3 | torn | 3 |
| /audio/child-mode/words/leaky.mp3 | leaky | 1 |
| /audio/child-mode/words/lengthen.mp3 | lengthen | 1 |
| /audio/child-mode/words/longs.mp3 | longs | 1 |
| /audio/child-mode/words/creaky.mp3 | creaky | 1 |
| /audio/child-mode/words/frozen.mp3 | frozen | 3 |
| /audio/child-mode/words/blunt.mp3 | blunt | 1 |
| /audio/child-mode/words/airy.mp3 | airy | 1 |
| /audio/child-mode/words/crowded.mp3 | crowded | 1 |
| /audio/child-mode/words/roomy.mp3 | roomy | 1 |
| /audio/child-mode/words/winding.mp3 | winding | 1 |
| /audio/child-mode/words/storms.mp3 | storms | 1 |
| /audio/child-mode/words/stormed.mp3 | stormed | 1 |
| /audio/child-mode/words/stormy.mp3 | stormy | 1 |
| /audio/child-mode/words/duster.mp3 | duster | 1 |
| /audio/child-mode/words/dusting.mp3 | dusting | 1 |
| /audio/child-mode/words/salute.mp3 | salute | 1 |
| /audio/child-mode/words/breezy.mp3 | breezy | 1 |
| /audio/child-mode/words/breezes.mp3 | breezes | 1 |
| /audio/child-mode/words/curling.mp3 | curling | 1 |
| /audio/child-mode/words/curly.mp3 | curly | 1 |
| /audio/child-mode/words/curler.mp3 | curler | 1 |
| /audio/child-mode/words/grab.mp3 | grab | 2 |
| /audio/child-mode/words/rust.mp3 | rust | 1 |
| /audio/child-mode/words/rustle.mp3 | rustle | 1 |
| /audio/child-mode/words/russet.mp3 | russet | 1 |
| /audio/child-mode/words/rusty.mp3 | rusty | 1 |
| /audio/child-mode/words/wade.mp3 | wade | 2 |
| /audio/child-mode/words/dusts.mp3 | dusts | 1 |
| /audio/child-mode/words/dusted.mp3 | dusted | 1 |
| /audio/child-mode/words/boiling.mp3 | boiling | 4 |
| /audio/child-mode/words/locked.mp3 | locked | 2 |
| /audio/child-mode/words/giant.mp3 | giant | 2 |
| /audio/child-mode/words/mumble.mp3 | mumble | 1 |
| /audio/child-mode/words/melting.mp3 | melting | 1 |
| /audio/child-mode/words/icy.mp3 | icy | 1 |
| /audio/child-mode/words/sob.mp3 | sob | 1 |
| /audio/child-mode/words/chuckle.mp3 | chuckle | 1 |
| /audio/child-mode/words/frown.mp3 | frown | 3 |
| /audio/child-mode/words/built.mp3 | built | 2 |
| /audio/child-mode/words/mended.mp3 | mended | 2 |
| /audio/child-mode/words/delicious.mp3 | delicious | 1 |
| /audio/child-mode/words/glee.mp3 | glee | 1 |
| /audio/child-mode/words/fear.mp3 | fear | 1 |
| /audio/child-mode/words/luck.mp3 | luck | 2 |
| /audio/child-mode/words/enemy.mp3 | enemy | 1 |
| /audio/child-mode/words/fade.mp3 | fade | 1 |
| /audio/child-mode/words/rise.mp3 | rise | 1 |
| /audio/child-mode/words/drenched.mp3 | drenched | 2 |
| /audio/child-mode/words/ripped.mp3 | ripped | 1 |
| /audio/child-mode/words/lag.mp3 | lag | 3 |
| /audio/child-mode/words/lug.mp3 | lug | 3 |
| /audio/child-mode/words/raw.mp3 | raw | 1 |
| /audio/child-mode/words/grand.mp3 | grand | 1 |
| /audio/child-mode/words/sc.mp3 | sc | 19 |
| /audio/child-mode/words/tar.mp3 | tar | 1 |
| /audio/child-mode/words/scar.mp3 | scar | 2 |
| /audio/child-mode/words/scooter.mp3 | scooter | 1 |
| /audio/child-mode/words/score.mp3 | score | 1 |
| /audio/child-mode/words/surfboard.mp3 | surfboard | 1 |
| /audio/child-mode/words/scoreboard.mp3 | scoreboard | 1 |
| /audio/child-mode/words/snowboard.mp3 | snowboard | 1 |
| /audio/child-mode/words/mile.mp3 | mile | 1 |
| /audio/child-mode/words/rake.mp3 | rake | 1 |
| /audio/child-mode/words/sport.mp3 | sport | 3 |
| /audio/child-mode/words/tuck.mp3 | tuck | 1 |
| /audio/child-mode/words/print.mp3 | print | 1 |
| /audio/child-mode/words/bet.mp3 | bet | 3 |
| /audio/child-mode/words/tilt.mp3 | tilt | 1 |
| /audio/child-mode/words/drowsy.mp3 | drowsy | 1 |
| /audio/child-mode/words/murmur.mp3 | murmur | 1 |
| /audio/child-mode/words/jagged.mp3 | jagged | 1 |
| /audio/child-mode/words/mend.mp3 | mend | 2 |
| /audio/child-mode/words/feast.mp3 | feast | 1 |
| /audio/child-mode/words/clutter.mp3 | clutter | 1 |
| /audio/child-mode/words/gleaming.mp3 | gleaming | 1 |
| /audio/child-mode/words/timid.mp3 | timid | 1 |
| /audio/child-mode/words/swift.mp3 | swift | 1 |
| /audio/child-mode/words/soggy.mp3 | soggy | 1 |
| /audio/child-mode/words/gobbled.mp3 | gobbled | 1 |
| /audio/child-mode/words/scampered.mp3 | scampered | 1 |
| /audio/child-mode/words/pleaded.mp3 | pleaded | 1 |
| /audio/child-mode/words/trembled.mp3 | trembled | 1 |
| /audio/child-mode/words/grumbled.mp3 | grumbled | 1 |
| /audio/child-mode/words/gazed.mp3 | gazed | 1 |
| /audio/child-mode/words/dazzling.mp3 | dazzling | 1 |
| /audio/child-mode/words/weary.mp3 | weary | 1 |
| /audio/child-mode/words/commotion.mp3 | commotion | 1 |
| /audio/child-mode/words/nibbled.mp3 | nibbled | 1 |
| /audio/child-mode/words/soared.mp3 | soared | 1 |
| /audio/child-mode/words/bitter.mp3 | bitter | 1 |
| /audio/child-mode/words/bashful.mp3 | bashful | 1 |
| /audio/child-mode/words/rickety.mp3 | rickety | 1 |
| /audio/child-mode/words/nippy.mp3 | nippy | 1 |
| /audio/child-mode/words/brisk.mp3 | brisk | 1 |
| /audio/child-mode/words/mutter.mp3 | mutter | 1 |
| /audio/child-mode/words/lively.mp3 | lively | 1 |
| /audio/child-mode/words/vanish.mp3 | vanish | 1 |
| /audio/child-mode/words/slumber.mp3 | slumber | 1 |
| /audio/child-mode/words/scent.mp3 | scent | 1 |
| /audio/child-mode/words/repaid.mp3 | repaid | 1 |
| /audio/child-mode/words/peered.mp3 | peered | 1 |
| /audio/child-mode/words/bobbed.mp3 | bobbed | 1 |
| /audio/child-mode/words/patched.mp3 | patched | 1 |
| /audio/child-mode/words/dashed.mp3 | dashed | 1 |
| /audio/child-mode/words/snug.mp3 | snug | 1 |
| /audio/child-mode/words/faint.mp3 | faint | 1 |
| /audio/child-mode/words/gigantic.mp3 | gigantic | 1 |
| /audio/child-mode/words/delicate.mp3 | delicate | 1 |
| /audio/child-mode/words/elderly.mp3 | elderly | 1 |
| /audio/child-mode/words/jumble.mp3 | jumble | 1 |
| /audio/child-mode/words/famished.mp3 | famished | 1 |
| /audio/child-mode/words/baffled.mp3 | baffled | 1 |
| /audio/child-mode/words/placid.mp3 | placid | 1 |
| /audio/child-mode/words/cunning.mp3 | cunning | 1 |
| /audio/child-mode/words/cumbersome.mp3 | cumbersome | 1 |
| /audio/child-mode/words/rancid.mp3 | rancid | 1 |
| /audio/child-mode/words/loyal.mp3 | loyal | 1 |
| /audio/child-mode/words/tint.mp3 | tint | 1 |
| /audio/child-mode/words/hunt.mp3 | hunt | 2 |
| /audio/child-mode/words/pug.mp3 | pug | 1 |
| /audio/child-mode/words/swum.mp3 | swum | 1 |
| /audio/child-mode/words/bog.mp3 | bog | 1 |
| /audio/child-mode/words/mid.mp3 | mid | 1 |
| /audio/child-mode/words/crush.mp3 | crush | 2 |
| /audio/child-mode/words/le.mp3 | le | 3 |
| /audio/child-mode/words/shed.mp3 | shed | 1 |
| /audio/child-mode/words/blink.mp3 | blink | 1 |
| /audio/child-mode/words/tusk.mp3 | tusk | 1 |
| /audio/child-mode/words/art.mp3 | art | 2 |
| /audio/child-mode/words/fort.mp3 | fort | 5 |
| /audio/child-mode/words/wit.mp3 | wit | 2 |
| /audio/child-mode/words/says.mp3 | says | 4 |
| /audio/child-mode/words/fuse.mp3 | fuse | 1 |
| /audio/child-mode/words/witch.mp3 | witch | 11 |
| /audio/child-mode/words/wands.mp3 | wands | 1 |
| /audio/child-mode/words/hum.mp3 | hum | 1 |
| /audio/child-mode/words/core.mp3 | core | 1 |
| /audio/child-mode/words/spare.mp3 | spare | 1 |
| /audio/child-mode/words/lime.mp3 | lime | 1 |
| /audio/child-mode/words/tow.mp3 | tow | 2 |
| /audio/child-mode/words/named.mp3 | named | 1 |
| /audio/child-mode/words/calmed.mp3 | calmed | 1 |
| /audio/child-mode/words/comb.mp3 | comb | 2 |
| /audio/child-mode/words/does.mp3 | does | 1 |
| /audio/child-mode/words/gown.mp3 | gown | 1 |
| /audio/child-mode/words/maze.mp3 | maze | 1 |
| /audio/child-mode/words/nimble.mp3 | nimble | 1 |
| /audio/child-mode/words/numbers.mp3 | numbers | 1 |
| /audio/child-mode/words/lumber.mp3 | lumber | 1 |
| /audio/child-mode/words/boil.mp3 | boil | 4 |
| /audio/child-mode/words/peoples.mp3 | peoples | 2 |
| /audio/child-mode/words/crowds.mp3 | crowds | 1 |
| /audio/child-mode/words/silt.mp3 | silt | 1 |
| /audio/child-mode/words/waiter.mp3 | waiter | 2 |
| /audio/child-mode/words/wax.mp3 | wax | 1 |
| /audio/child-mode/words/wander.mp3 | wander | 1 |
| /audio/child-mode/words/nod.mp3 | nod | 2 |
| /audio/child-mode/words/oops.mp3 | oops | 1 |
| /audio/child-mode/words/eighty.mp3 | eighty | 1 |
| /audio/child-mode/words/sixty.mp3 | sixty | 1 |
| /audio/child-mode/words/heart.mp3 | heart | 1 |
| /audio/child-mode/words/oar.mp3 | oar | 1 |
| /audio/child-mode/words/ours.mp3 | ours | 1 |
| /audio/child-mode/words/flow.mp3 | flow | 1 |
| /audio/child-mode/words/crow.mp3 | crow | 1 |
| /audio/child-mode/words/wound.mp3 | wound | 1 |
| /audio/child-mode/words/jealous.mp3 | jealous | 3 |
| /audio/child-mode/words/ashamed.mp3 | ashamed | 1 |
| /audio/child-mode/words/furious.mp3 | furious | 1 |
| /audio/child-mode/words/thrilled.mp3 | thrilled | 1 |
| /audio/child-mode/words/delighted.mp3 | delighted | 1 |
| /audio/child-mode/words/astronaut.mp3 | astronaut | 1 |
| /audio/child-mode/words/camera.mp3 | camera | 1 |
| /audio/child-mode/words/elbow.mp3 | elbow | 1 |
| /audio/child-mode/words/feather.mp3 | feather | 1 |
| /audio/child-mode/words/flamingo.mp3 | flamingo | 1 |
| /audio/child-mode/words/guitar.mp3 | guitar | 1 |
| /audio/child-mode/words/gorilla.mp3 | gorilla | 1 |
| /audio/child-mode/words/helicopter.mp3 | helicopter | 1 |
| /audio/child-mode/words/instrument.mp3 | instrument | 1 |
| /audio/child-mode/words/kettle.mp3 | kettle | 1 |
| /audio/child-mode/words/necklace.mp3 | necklace | 1 |
| /audio/child-mode/words/umpire.mp3 | umpire | 1 |
| /audio/child-mode/words/uniform.mp3 | uniform | 1 |
| /audio/child-mode/words/vulture.mp3 | vulture | 1 |
| /audio/child-mode/words/watermelon.mp3 | watermelon | 1 |
| /audio/child-mode/words/yoghurt.mp3 | yoghurt | 1 |
| /audio/child-mode/words/zigzag.mp3 | zigzag | 1 |
| /audio/child-mode/words/ambulance.mp3 | ambulance | 1 |
| /audio/child-mode/words/engine.mp3 | engine | 1 |
| /audio/child-mode/words/sandcastle.mp3 | sandcastle | 1 |
| /audio/child-mode/words/femi.mp3 | femi | 1 |
| /audio/child-mode/words/sana.mp3 | sana | 1 |
| /audio/child-mode/words/priya.mp3 | priya | 2 |
| /audio/child-mode/words/forty.mp3 | forty | 1 |
| /audio/child-mode/words/ben's.mp3 | ben's | 1 |
| /audio/child-mode/words/asha's.mp3 | asha's | 1 |
| /audio/child-mode/words/gita.mp3 | gita | 1 |
| /audio/child-mode/words/cope.mp3 | cope | 1 |
| /audio/child-mode/words/tape.mp3 | tape | 2 |
| /audio/child-mode/words/tip.mp3 | tip | 5 |
| /audio/child-mode/words/pane.mp3 | pane | 2 |
| /audio/child-mode/words/rid.mp3 | rid | 1 |
| /audio/child-mode/words/hate.mp3 | hate | 1 |
| /audio/child-mode/words/rob.mp3 | rob | 2 |
| /audio/child-mode/words/gas.mp3 | gas | 1 |
| /audio/child-mode/words/shin.mp3 | shin | 2 |
| /audio/child-mode/words/hog.mp3 | hog | 2 |
| /audio/child-mode/words/lace.mp3 | lace | 1 |
| /audio/child-mode/words/lick.mp3 | lick | 4 |
| /audio/child-mode/words/spilt.mp3 | spilt | 1 |
| /audio/child-mode/words/dipped.mp3 | dipped | 1 |
| /audio/child-mode/words/sung.mp3 | sung | 1 |
| /audio/child-mode/words/scrub.mp3 | scrub | 1 |
| /audio/child-mode/words/wipe.mp3 | wipe | 1 |
| /audio/child-mode/words/sweep.mp3 | sweep | 2 |
| /audio/child-mode/words/soar.mp3 | soar | 2 |
| /audio/child-mode/words/glide.mp3 | glide | 1 |
| /audio/child-mode/words/drift.mp3 | drift | 2 |
| /audio/child-mode/words/teaches.mp3 | teaches | 2 |
| /audio/child-mode/words/perch.mp3 | perch | 1 |
| /audio/child-mode/words/cots.mp3 | cots | 1 |
| /audio/child-mode/words/citys.mp3 | citys | 1 |
| /audio/child-mode/words/ponies.mp3 | ponies | 2 |
| /audio/child-mode/words/pony.mp3 | pony | 2 |
| /audio/child-mode/words/mouses.mp3 | mouses | 1 |
| /audio/child-mode/words/foots.mp3 | foots | 1 |
| /audio/child-mode/words/wolfs.mp3 | wolfs | 1 |
| /audio/child-mode/words/howled.mp3 | howled | 1 |
| /audio/child-mode/words/slices.mp3 | slices | 1 |
| /audio/child-mode/words/grazed.mp3 | grazed | 1 |
| /audio/child-mode/words/ponys.mp3 | ponys | 1 |
| /audio/child-mode/words/chicks.mp3 | chicks | 1 |
| /audio/child-mode/words/remake.mp3 | remake | 7 |
| /audio/child-mode/words/maker.mp3 | maker | 2 |
| /audio/child-mode/words/unmake.mp3 | unmake | 1 |
| /audio/child-mode/words/unread.mp3 | unread | 1 |
| /audio/child-mode/words/unplayed.mp3 | unplayed | 1 |
| /audio/child-mode/words/helpless.mp3 | helpless | 2 |
| /audio/child-mode/words/rehelp.mp3 | rehelp | 1 |
| /audio/child-mode/words/rejoice.mp3 | rejoice | 1 |
| /audio/child-mode/words/joyless.mp3 | joyless | 2 |
| /audio/child-mode/words/recare.mp3 | recare | 1 |
| /audio/child-mode/words/carer.mp3 | carer | 1 |
| /audio/child-mode/words/rehope.mp3 | rehope | 1 |
| /audio/child-mode/words/fearful.mp3 | fearful | 2 |
| /audio/child-mode/words/refear.mp3 | refear | 1 |
| /audio/child-mode/words/harmful.mp3 | harmful | 2 |
| /audio/child-mode/words/reharm.mp3 | reharm | 1 |
| /audio/child-mode/words/harmless.mp3 | harmless | 2 |
| /audio/child-mode/words/sings.mp3 | sings | 1 |
| /audio/child-mode/words/teaching.mp3 | teaching | 1 |
| /audio/child-mode/words/farming.mp3 | farming | 1 |
| /audio/child-mode/words/hennes.mp3 | hennes | 1 |
| /audio/child-mode/words/washing.mp3 | washing | 1 |
| /audio/child-mode/words/washes.mp3 | washes | 1 |
| /audio/child-mode/words/naps.mp3 | naps | 1 |
| /audio/child-mode/words/napping.mp3 | napping | 1 |
| /audio/child-mode/words/napped.mp3 | napped | 1 |
| /audio/child-mode/words/bakes.mp3 | bakes | 2 |
| /audio/child-mode/words/baking.mp3 | baking | 2 |
| /audio/child-mode/words/boils.mp3 | boils | 1 |
| /audio/child-mode/words/cries.mp3 | cries | 1 |
| /audio/child-mode/words/crying.mp3 | crying | 1 |
| /audio/child-mode/words/locks.mp3 | locks | 1 |
| /audio/child-mode/words/locking.mp3 | locking | 1 |
| /audio/child-mode/words/slower.mp3 | slower | 1 |
| /audio/child-mode/words/quickest.mp3 | quickest | 2 |
| /audio/child-mode/words/quicker.mp3 | quicker | 2 |
| /audio/child-mode/words/gentler.mp3 | gentler | 1 |
| /audio/child-mode/words/heated.mp3 | heated | 2 |
| /audio/child-mode/words/heats.mp3 | heats | 1 |
| /audio/child-mode/words/views.mp3 | views | 1 |
| /audio/child-mode/words/viewed.mp3 | viewed | 2 |
| /audio/child-mode/words/safety.mp3 | safety | 1 |
| /audio/child-mode/words/resafe.mp3 | resafe | 1 |
| /audio/child-mode/words/unpaint.mp3 | unpaint | 1 |
| /audio/child-mode/words/paintful.mp3 | paintful | 1 |
| /audio/child-mode/words/hoping.mp3 | hoping | 1 |
| /audio/child-mode/words/caring.mp3 | caring | 1 |
| /audio/child-mode/words/builder.mp3 | builder | 1 |
| /audio/child-mode/words/unbuilt.mp3 | unbuilt | 1 |
| /audio/child-mode/words/cooked.mp3 | cooked | 1 |
| /audio/child-mode/words/braver.mp3 | braver | 1 |
| /audio/child-mode/words/bravely.mp3 | bravely | 1 |
| /audio/child-mode/words/schools.mp3 | schools | 1 |
| /audio/child-mode/words/schooling.mp3 | schooling | 1 |
| /audio/child-mode/words/surf.mp3 | surf | 2 |
| /audio/child-mode/words/turnip.mp3 | turnip | 1 |
| /audio/child-mode/words/se.mp3 | se | 1 |
| /audio/child-mode/words/ce.mp3 | ce | 1 |
| /audio/child-mode/words/sister.mp3 | sister | 1 |
| /audio/child-mode/words/wed.mp3 | wed | 1 |
| /audio/child-mode/words/jig.mp3 | jig | 2 |
| /audio/child-mode/words/rung.mp3 | rung | 2 |
| /audio/child-mode/words/fang.mp3 | fang | 1 |
| /audio/child-mode/words/sank.mp3 | sank | 2 |
| /audio/child-mode/words/stiff.mp3 | stiff | 1 |
| /audio/child-mode/words/bill.mp3 | bill | 3 |
| /audio/child-mode/words/bald.mp3 | bald | 1 |
| /audio/child-mode/words/splat.mp3 | splat | 1 |
| /audio/child-mode/words/blouse.mp3 | blouse | 3 |
| /audio/child-mode/words/churn.mp3 | churn | 1 |
| /audio/child-mode/words/cord.mp3 | cord | 1 |
| /audio/child-mode/words/rink.mp3 | rink | 1 |
| /audio/child-mode/words/goal.mp3 | goal | 1 |
| /audio/child-mode/words/elena.mp3 | elena | 1 |
| /audio/child-mode/words/nobody's.mp3 | nobody's | 1 |
| /audio/child-mode/words/sam's.mp3 | sam's | 1 |
| /audio/child-mode/words/ollie's.mp3 | ollie's | 1 |
| /audio/child-mode/words/grandpa.mp3 | grandpa | 2 |
| /audio/child-mode/words/carmen.mp3 | carmen | 1 |
| /audio/child-mode/words/effie.mp3 | effie | 1 |
| /audio/child-mode/words/ivo.mp3 | ivo | 1 |
| /audio/child-mode/words/jonah.mp3 | jonah | 1 |
| /audio/child-mode/words/gran.mp3 | gran | 2 |
| /audio/child-mode/words/rim.mp3 | rim | 1 |
| /audio/child-mode/words/flop.mp3 | flop | 1 |
| /audio/child-mode/words/mast.mp3 | mast | 1 |
| /audio/child-mode/words/bolt.mp3 | bolt | 1 |
| /audio/child-mode/words/zap.mp3 | zap | 1 |
| /audio/child-mode/words/loft.mp3 | loft | 1 |
| /audio/child-mode/words/rig.mp3 | rig | 1 |
| /audio/child-mode/words/plot.mp3 | plot | 1 |
| /audio/child-mode/words/trick.mp3 | trick | 1 |
| /audio/child-mode/words/vat.mp3 | vat | 1 |
| /audio/child-mode/words/hinge.mp3 | hinge | 1 |
| /audio/child-mode/words/knits.mp3 | knits | 1 |
| /audio/child-mode/words/creep.mp3 | creep | 1 |
| /audio/child-mode/words/claw.mp3 | claw | 2 |
| /audio/child-mode/words/oven.mp3 | oven | 1 |
| /audio/child-mode/words/swimmer.mp3 | swimmer | 1 |
| /audio/child-mode/words/dancing.mp3 | dancing | 1 |
| /audio/child-mode/words/dancer.mp3 | dancer | 2 |
| /audio/child-mode/words/dances.mp3 | dances | 1 |
| /audio/child-mode/words/danced.mp3 | danced | 1 |
| /audio/child-mode/words/froze.mp3 | froze | 1 |
| /audio/child-mode/words/spilled.mp3 | spilled | 1 |
| /audio/child-mode/words/boiled.mp3 | boiled | 1 |
| /audio/child-mode/words/drain.mp3 | drain | 1 |
| /audio/child-mode/words/crawled.mp3 | crawled | 1 |
| /audio/child-mode/words/popped.mp3 | popped | 1 |
| /audio/child-mode/words/sneak.mp3 | sneak | 1 |
| /audio/child-mode/words/stomp.mp3 | stomp | 1 |
| /audio/child-mode/words/gallop.mp3 | gallop | 1 |
| /audio/child-mode/words/frowned.mp3 | frowned | 1 |
| /audio/child-mode/words/wept.mp3 | wept | 1 |
| /audio/child-mode/words/snale.mp3 | snale | 1 |
| /audio/child-mode/words/snayl.mp3 | snayl | 1 |
| /audio/child-mode/words/snaile.mp3 | snaile | 1 |
| /audio/child-mode/words/pante.mp3 | pante | 1 |
| /audio/child-mode/words/painte.mp3 | painte | 1 |
| /audio/child-mode/words/paynt.mp3 | paynt | 1 |
| /audio/child-mode/words/dae.mp3 | dae | 1 |
| /audio/child-mode/words/dai.mp3 | dai | 1 |
| /audio/child-mode/words/daye.mp3 | daye | 1 |
| /audio/child-mode/words/stai.mp3 | stai | 1 |
| /audio/child-mode/words/staye.mp3 | staye | 1 |
| /audio/child-mode/words/stae.mp3 | stae | 1 |
| /audio/child-mode/words/sheap.mp3 | sheap | 1 |
| /audio/child-mode/words/shepe.mp3 | shepe | 1 |
| /audio/child-mode/words/shiep.mp3 | shiep | 1 |
| /audio/child-mode/words/bie.mp3 | bie | 1 |
| /audio/child-mode/words/beey.mp3 | beey | 1 |
| /audio/child-mode/words/bea.mp3 | bea | 1 |
| /audio/child-mode/words/beech.mp3 | beech | 1 |
| /audio/child-mode/words/beache.mp3 | beache | 1 |
| /audio/child-mode/words/biech.mp3 | biech | 1 |
| /audio/child-mode/words/bote.mp3 | bote | 1 |
| /audio/child-mode/words/boet.mp3 | boet | 1 |
| /audio/child-mode/words/boate.mp3 | boate | 1 |
| /audio/child-mode/words/coate.mp3 | coate | 1 |
| /audio/child-mode/words/koat.mp3 | koat | 1 |
| /audio/child-mode/words/cote.mp3 | cote | 1 |
| /audio/child-mode/words/lyte.mp3 | lyte | 1 |
| /audio/child-mode/words/lite.mp3 | lite | 1 |
| /audio/child-mode/words/liht.mp3 | liht | 1 |
| /audio/child-mode/words/nite.mp3 | nite | 1 |
| /audio/child-mode/words/niht.mp3 | niht | 1 |
| /audio/child-mode/words/nighte.mp3 | nighte | 1 |
| /audio/child-mode/words/aw.mp3 | aw | 5 |
| /audio/child-mode/words/koin.mp3 | koin | 1 |
| /audio/child-mode/words/coine.mp3 | coine | 1 |
| /audio/child-mode/words/coyn.mp3 | coyn | 1 |
| /audio/child-mode/words/poynt.mp3 | poynt | 1 |
| /audio/child-mode/words/poient.mp3 | poient | 1 |
| /audio/child-mode/words/pointe.mp3 | pointe | 1 |
| /audio/child-mode/words/joy.mp3 | joy | 3 |
| /audio/child-mode/words/boi.mp3 | boi | 1 |
| /audio/child-mode/words/boye.mp3 | boye | 1 |
| /audio/child-mode/words/boey.mp3 | boey | 1 |
| /audio/child-mode/words/toey.mp3 | toey | 1 |
| /audio/child-mode/words/toi.mp3 | toi | 1 |
| /audio/child-mode/words/toye.mp3 | toye | 1 |
| /audio/child-mode/words/fled.mp3 | fled | 1 |
| /audio/child-mode/words/nue.mp3 | nue | 1 |
| /audio/child-mode/words/newe.mp3 | newe | 1 |
| /audio/child-mode/words/noo.mp3 | noo | 1 |
| /audio/child-mode/words/groo.mp3 | groo | 1 |
| /audio/child-mode/words/grue.mp3 | grue | 1 |
| /audio/child-mode/words/grewe.mp3 | grewe | 1 |
| /audio/child-mode/words/sau.mp3 | sau | 1 |
| /audio/child-mode/words/sawe.mp3 | sawe | 1 |
| /audio/child-mode/words/cloar.mp3 | cloar | 1 |
| /audio/child-mode/words/clau.mp3 | clau | 1 |
| /audio/child-mode/words/clawe.mp3 | clawe | 1 |
| /audio/child-mode/words/raine.mp3 | raine | 1 |
| /audio/child-mode/words/rane.mp3 | rane | 1 |
| /audio/child-mode/words/rayn.mp3 | rayn | 1 |
| /audio/child-mode/words/straw.mp3 | straw | 1 |

## 5. Phrase recordings (shared pool /audio/child-mode/phrases)

| File | Script | Used by |
|---|---|---|
| /audio/child-mode/phrases/the-pond-froze-over-153e8f.mp3 | the pond froze over | 1 |
| /audio/child-mode/phrases/the-ducks-flew-south-802640.mp3 | the ducks flew south | 1 |
| /audio/child-mode/phrases/the-park-closed-241ad3.mp3 | the park closed | 1 |
| /audio/child-mode/phrases/the-nights-were-freezing-ee5a88.mp3 | the nights were freezing | 1 |
| /audio/child-mode/phrases/it-began-to-rain-8336ea.mp3 | it began to rain | 1 |
| /audio/child-mode/phrases/pigeons-came-to-eat-them-5ec98f.mp3 | pigeons came to eat them | 1 |
| /audio/child-mode/phrases/the-flowers-grew-on-the-path-f9c34b.mp3 | the flowers grew on the path | 1 |
| /audio/child-mode/phrases/zack-tipped-the-packet-fast-6e5a46.mp3 | Zack tipped the packet fast | 1 |
| /audio/child-mode/phrases/gran-bought-a-new-door-742452.mp3 | Gran bought a new door | 1 |
| /audio/child-mode/phrases/the-baby-woke-up-crying-fff59e.mp3 | the baby woke up crying | 1 |
| /audio/child-mode/phrases/the-door-stopped-screeching-cfb78e.mp3 | the door stopped screeching | 1 |
| /audio/child-mode/phrases/the-door-screeched-louder-1ba68e.mp3 | the door screeched louder | 1 |
| /audio/child-mode/phrases/its-flowers-turned-blue-fd8a6f.mp3 | its flowers turned blue | 1 |
| /audio/child-mode/phrases/its-leaves-drooped-61dc52.mp3 | its leaves drooped | 1 |
| /audio/child-mode/phrases/it-grew-taller-60e40a.mp3 | it grew taller | 1 |
| /audio/child-mode/phrases/the-children-came-back-5a72c7.mp3 | the children came back | 1 |
| /audio/child-mode/phrases/made-them-longer-a536e6.mp3 | made them longer | 1 |
| /audio/child-mode/phrases/left-them-on-the-seat-58ec68.mp3 | left them on the seat | 1 |
| /audio/child-mode/phrases/melted-them-into-one-lump-fe120e.mp3 | melted them into one lump | 1 |
| /audio/child-mode/phrases/snapped-them-in-half-4d65b1.mp3 | snapped them in half | 1 |
| /audio/child-mode/phrases/the-balloon-popped-41ed83.mp3 | the balloon popped | 1 |
| /audio/child-mode/phrases/her-jumper-changed-colour-5a2498.mp3 | her jumper changed colour | 1 |
| /audio/child-mode/phrases/she-held-it-above-her-head-da3b7b.mp3 | she held it above her head | 1 |
| /audio/child-mode/phrases/her-hair-stuck-up-toward-it-733d33.mp3 | her hair stuck up toward it | 1 |
| /audio/child-mode/phrases/papa-lost-his-boots-6c5618.mp3 | Papa lost his boots | 1 |
| /audio/child-mode/phrases/snow-fell-all-night-a7a0b4.mp3 | snow fell all night | 1 |
| /audio/child-mode/phrases/school-was-closed-9db8ad.mp3 | school was closed | 1 |
| /audio/child-mode/phrases/the-radio-broke-1bbe23.mp3 | the radio broke | 1 |
| /audio/child-mode/phrases/the-corn-would-not-pop-86ae08.mp3 | the corn would not pop | 1 |
| /audio/child-mode/phrases/the-pot-went-cold-2d99e0.mp3 | the pot went cold | 1 |
| /audio/child-mode/phrases/omar-pressed-the-lid-on-f9ce5b.mp3 | Omar pressed the lid on | 1 |
| /audio/child-mode/phrases/popcorn-jumped-out-of-the-pot-9131c7.mp3 | popcorn jumped out of the pot | 1 |
| /audio/child-mode/phrases/auntie-hurried-inside-a26430.mp3 | Auntie hurried inside | 1 |
| /audio/child-mode/phrases/the-garden-was-noisy-267593.mp3 | the garden was noisy | 1 |
| /audio/child-mode/phrases/the-trowel-banged-it-5a5619.mp3 | the trowel banged it | 1 |
| /audio/child-mode/phrases/the-water-inside-had-boiled-1cc9cb.mp3 | the water inside had boiled | 1 |
| /audio/child-mode/phrases/his-ears-noticed-movement-at-the-entrance-707d66.mp3 | his ears noticed movement at the entrance | 1 |
| /audio/child-mode/phrases/he-saw-the-doorbell-ring-ec7afa.mp3 | he saw the doorbell ring | 1 |
| /audio/child-mode/phrases/he-smelled-the-dinner-2919e2.mp3 | he smelled the dinner | 1 |
| /audio/child-mode/phrases/the-delivery-man-called-his-name-eace7b.mp3 | the delivery man called his name | 1 |
| /audio/child-mode/phrases/the-rain-washed-the-chalk-away-5e92d2.mp3 | the rain washed the chalk away | 1 |
| /audio/child-mode/phrases/someone-rubbed-it-out-73ec7d.mp3 | someone rubbed it out | 1 |
| /audio/child-mode/phrases/the-chalk-was-invisible-2d3fe1.mp3 | the chalk was invisible | 1 |
| /audio/child-mode/phrases/a-faint-cloud-remained-3ff1fc.mp3 | a faint cloud remained | 1 |
| /audio/child-mode/phrases/the-warm-day-was-melting-it-a6c927.mp3 | the warm day was melting it | 1 |
| /audio/child-mode/phrases/the-cone-had-a-hole-73ce36.mp3 | the cone had a hole | 1 |
| /audio/child-mode/phrases/milly-licked-too-fast-5832f5.mp3 | Milly licked too fast | 1 |
| /audio/child-mode/phrases/the-pavement-was-sticky-ca021a.mp3 | the pavement was sticky | 1 |
| /audio/child-mode/phrases/a-train-was-passing-528197.mp3 | a train was passing | 1 |
| /audio/child-mode/phrases/the-tunnel-walls-bounced-the-sound-9f7773.mp3 | the tunnel walls bounced the sound | 1 |
| /audio/child-mode/phrases/someone-else-was-hiding-there-cdd39f.mp3 | someone else was hiding there | 1 |
| /audio/child-mode/phrases/he-shouted-hello-1f82b4.mp3 | he shouted hello | 1 |
| /audio/child-mode/phrases/someone-painted-it-orange-5b0b55.mp3 | someone painted it orange | 1 |
| /audio/child-mode/phrases/it-stood-out-in-the-wet-all-winter-cfbbf1.mp3 | it stood out in the wet all winter | 1 |
| /audio/child-mode/phrases/mo-rode-it-too-fast-56d85f.mp3 | Mo rode it too fast | 1 |
| /audio/child-mode/phrases/the-chain-was-stiff-450eb7.mp3 | the chain was stiff | 1 |
| /audio/child-mode/phrases/a-dog-dug-it-up-93376e.mp3 | a dog dug it up | 1 |
| /audio/child-mode/phrases/the-tide-came-in-over-it-6d3c5c.mp3 | the tide came in over it | 1 |
| /audio/child-mode/phrases/rosa-stamped-on-it-b7abe1.mp3 | Rosa stamped on it | 1 |
| /audio/child-mode/phrases/she-built-it-all-afternoon-94e30e.mp3 | she built it all afternoon | 1 |
| /audio/child-mode/phrases/the-shady-corner-protected-them-3ef1be.mp3 | the shady corner protected them | 1 |
| /audio/child-mode/phrases/someone-swapped-the-curtains-1bce01.mp3 | someone swapped the curtains | 1 |
| /audio/child-mode/phrases/years-of-sunlight-faded-them-a22adb.mp3 | years of sunlight faded them | 1 |
| /audio/child-mode/phrases/they-were-washed-wrong-once-661c2c.mp3 | they were washed wrong once | 1 |
| /audio/child-mode/phrases/the-moth-circled-because-the-garden-was-loud-931f0f.mp3 | The moth circled because the garden was loud. | 1 |
| /audio/child-mode/phrases/the-moth-slept-because-the-light-was-warm-d906e0.mp3 | The moth slept because the light was warm. | 1 |
| /audio/child-mode/phrases/the-moth-circled-because-the-light-attracted-1c2f5c.mp3 | The moth circled because the light attracted it. | 1 |
| /audio/child-mode/phrases/the-light-glowed-because-the-moth-circled-it-71970c.mp3 | The light glowed because the moth circled it. | 1 |
| /audio/child-mode/phrases/pia-s-feet-grew-because-her-shoes-hurt-e0842b.mp3 | Pia's feet grew because her shoes hurt. | 1 |
| /audio/child-mode/phrases/pia-s-shoes-hurt-because-they-got-wet-931959.mp3 | Pia's shoes hurt because they got wet. | 1 |
| /audio/child-mode/phrases/pia-s-feet-ached-because-she-skipped-lunch-9b5226.mp3 | Pia's feet ached because she skipped lunch. | 1 |
| /audio/child-mode/phrases/pia-s-shoes-hurt-because-her-feet-had-grown-eb7df8.mp3 | Pia's shoes hurt because her feet had grown. | 1 |
| /audio/child-mode/phrases/the-bread-went-hard-because-the-board-was-ol-16c26e.mp3 | The bread went hard because the board was old. | 1 |
| /audio/child-mode/phrases/the-bread-stayed-soft-because-it-was-covered-6d5b35.mp3 | The bread stayed soft because it was covered. | 1 |
| /audio/child-mode/phrases/the-bread-went-hard-because-it-was-left-unco-daf547.mp3 | The bread went hard because it was left uncovered. | 1 |
| /audio/child-mode/phrases/the-bread-was-left-out-because-it-went-hard-56664f.mp3 | The bread was left out because it went hard. | 1 |
| /audio/child-mode/phrases/the-ramp-sloped-because-the-marble-rolled-256590.mp3 | The ramp sloped because the marble rolled. | 1 |
| /audio/child-mode/phrases/the-marble-rolled-because-the-rug-was-red-f81728.mp3 | The marble rolled because the rug was red. | 1 |
| /audio/child-mode/phrases/the-marble-stopped-because-kip-let-go-20e25e.mp3 | The marble stopped because Kip let go. | 1 |
| /audio/child-mode/phrases/the-marble-rolled-because-the-ramp-sloped-do-bd871e.mp3 | The marble rolled because the ramp sloped down. | 1 |
| /audio/child-mode/phrases/the-worms-came-up-because-their-soil-filled-8d88ba.mp3 | The worms came up because their soil filled with rain. | 1 |
| /audio/child-mode/phrases/the-rain-fell-because-the-worms-came-up-14bab4.mp3 | The rain fell because the worms came up. | 1 |
| /audio/child-mode/phrases/the-worms-came-up-because-the-stones-were-wa-d7a072.mp3 | The worms came up because the stones were warm. | 1 |
| /audio/child-mode/phrases/the-worms-hid-because-the-path-was-wet-8819aa.mp3 | The worms hid because the path was wet. | 1 |
| /audio/child-mode/phrases/ivy-laughed-because-the-family-was-laughing-707eff.mp3 | Ivy laughed because the family was laughing. | 1 |
| /audio/child-mode/phrases/the-family-laughed-because-the-newspaper-was-4e226c.mp3 | The family laughed because the newspaper was funny. | 1 |
| /audio/child-mode/phrases/grandma-stopped-laughing-because-of-dad-935012.mp3 | Grandma stopped laughing because of Dad. | 1 |
| /audio/child-mode/phrases/the-family-laughed-because-laughing-spreads-ad4765.mp3 | The family laughed because laughing spreads. | 1 |
| /audio/child-mode/phrases/the-flame-flickered-because-the-door-let-in-c365aa.mp3 | The flame flickered because the door let in a draught. | 1 |
| /audio/child-mode/phrases/the-door-opened-because-the-flame-flickered-b98342.mp3 | The door opened because the flame flickered. | 1 |
| /audio/child-mode/phrases/the-flame-flickered-because-the-wax-was-old-82f56f.mp3 | The flame flickered because the wax was old. | 1 |
| /audio/child-mode/phrases/the-flame-grew-taller-because-of-the-wind-b3551e.mp3 | The flame grew taller because of the wind. | 1 |
| /audio/child-mode/phrases/suki-stayed-awake-because-of-the-milk-5fdc56.mp3 | Suki stayed awake because of the milk. | 1 |
| /audio/child-mode/phrases/the-bedtime-routine-relaxed-suki-until-she-s-59009d.mp3 | The bedtime routine relaxed Suki until she slept. | 1 |
| /audio/child-mode/phrases/papa-read-the-story-because-suki-fell-asleep-3267d6.mp3 | Papa read the story because Suki fell asleep. | 1 |
| /audio/child-mode/phrases/suki-fell-asleep-because-the-story-was-scary-3ffede.mp3 | Suki fell asleep because the story was scary. | 1 |
| /audio/child-mode/phrases/someone-washed-the-dishes-5023ff.mp3 | someone washed the dishes | 1 |
| /audio/child-mode/phrases/he-moved-suddenly-and-struck-the-bag-with-hi-7af949.mp3 | he moved suddenly and struck the bag with his elbow | 1 |
| /audio/child-mode/phrases/the-wasp-smelled-the-jam-bf3e96.mp3 | the wasp smelled the jam | 1 |
| /audio/child-mode/phrases/flour-settled-on-the-dishes-a48b08.mp3 | flour settled on the dishes | 1 |
| /audio/child-mode/phrases/its-cracked-pot-had-lost-half-its-soil-ff7fdd.mp3 | its cracked pot had lost half its soil | 1 |
| /audio/child-mode/phrases/the-pigeons-knocked-it-fb8886.mp3 | the pigeons knocked it | 1 |
| /audio/child-mode/phrases/it-startled-the-pigeons-fe9c05.mp3 | it startled the pigeons | 1 |
| /audio/child-mode/phrases/the-frost-landed-on-its-leaves-fc1736.mp3 | the frost landed on its leaves | 1 |
| /audio/child-mode/phrases/dee-answered-the-phone-2ea8e2.mp3 | Dee answered the phone | 1 |
| /audio/child-mode/phrases/dee-hung-up-the-phone-d14c46.mp3 | Dee hung up the phone | 1 |
| /audio/child-mode/phrases/the-kitchen-ceiling-was-painted-4bcc9b.mp3 | the kitchen ceiling was painted | 1 |
| /audio/child-mode/phrases/water-found-the-gap-by-the-pipe-94fe3d.mp3 | water found the gap by the pipe | 1 |
| /audio/child-mode/phrases/mr-njoku-threw-them-back-7e12ac.mp3 | Mr Njoku threw them back | 1 |
| /audio/child-mode/phrases/the-tomatoes-attracted-the-balls-45311b.mp3 | the tomatoes attracted the balls | 1 |
| /audio/child-mode/phrases/the-firm-ground-sent-each-bounce-over-the-fe-6e157a.mp3 | the firm ground sent each bounce over the fence | 1 |
| /audio/child-mode/phrases/the-pitch-flooded-on-friday-5f37a7.mp3 | the pitch flooded on Friday | 1 |
| /audio/child-mode/phrases/someone-bought-more-peas-44dc7a.mp3 | someone bought more peas | 1 |
| /audio/child-mode/phrases/meltwater-from-above-glued-them-into-one-blo-fff99e.mp3 | meltwater from above glued them into one block | 1 |
| /audio/child-mode/phrases/the-door-was-propped-open-9f5bd8.mp3 | the door was propped open | 1 |
| /audio/child-mode/phrases/the-party-guests-arrived-28dda0.mp3 | the party guests arrived | 1 |
| /audio/child-mode/phrases/the-lift-stopped-at-every-floor-eef166.mp3 | the lift stopped at every floor | 1 |
| /audio/child-mode/phrases/her-name-was-called-early-9093e1.mp3 | her name was called early | 1 |
| /audio/child-mode/phrases/she-pressed-every-button-6c6cb7.mp3 | she pressed every button | 1 |
| /audio/child-mode/phrases/she-burst-out-of-the-doors-9a87e4.mp3 | she burst out of the doors | 1 |
| /audio/child-mode/phrases/the-caretaker-wound-it-there-498170.mp3 | the caretaker wound it there | 1 |
| /audio/child-mode/phrases/the-kite-rattled-like-a-bird-7d0fe8.mp3 | the kite rattled like a bird | 1 |
| /audio/child-mode/phrases/the-string-was-too-short-ca2c12.mp3 | the string was too short | 1 |
| /audio/child-mode/phrases/the-tailless-kite-went-into-a-spin-47e1e7.mp3 | the tailless kite went into a spin | 1 |
| /audio/child-mode/phrases/he-cleaned-the-whole-bathroom-d8deb1.mp3 | he cleaned the whole bathroom | 1 |
| /audio/child-mode/phrases/the-towel-fell-in-the-bath-f4fd43.mp3 | the towel fell in the bath | 1 |
| /audio/child-mode/phrases/the-first-wipe-left-visible-fibres-behind-5b27f4.mp3 | the first wipe left visible fibres behind | 1 |
| /audio/child-mode/phrases/the-shower-steamed-the-mirror-3b5a26.mp3 | the shower steamed the mirror | 1 |
| /audio/child-mode/phrases/the-fair-sold-out-of-tickets-early-59c592.mp3 | the fair sold out of tickets early | 1 |
| /audio/child-mode/phrases/the-warm-dry-weather-5f8b25.mp3 | the warm, dry weather | 1 |
| /audio/child-mode/phrases/the-popular-baking-stall-f943cc.mp3 | the popular baking stall | 1 |
| /audio/child-mode/phrases/payday-weekend-211816.mp3 | payday weekend | 1 |
| /audio/child-mode/phrases/staying-up-late-with-his-comic-79818c.mp3 | staying up late with his comic | 1 |
| /audio/child-mode/phrases/his-phone-dying-overnight-c6dec7.mp3 | his phone dying overnight | 1 |
| /audio/child-mode/phrases/the-thick-dark-curtains-442127.mp3 | the thick dark curtains | 1 |
| /audio/child-mode/phrases/his-little-sister-woke-him-early-ff8f5c.mp3 | his little sister woke him early | 1 |
| /audio/child-mode/phrases/cold-nights-by-the-glass-af11c1.mp3 | cold nights by the glass | 1 |
| /audio/child-mode/phrases/too-little-water-3378b6.mp3 | too little water | 1 |
| /audio/child-mode/phrases/daily-watering-275ef1.mp3 | daily watering | 1 |
| /audio/child-mode/phrases/a-pot-with-no-drain-hole-707171.mp3 | a pot with no drain hole | 1 |
| /audio/child-mode/phrases/children-coming-in-already-sniffing-201cbe.mp3 | children coming in already sniffing | 1 |
| /audio/child-mode/phrases/the-class-played-outside-too-long-28ef78.mp3 | the class played outside too long | 1 |
| /audio/child-mode/phrases/crowding-indoors-all-week-d00fe5.mp3 | crowding indoors all week | 1 |
| /audio/child-mode/phrases/the-unaired-stuffy-room-37a71b.mp3 | the unaired, stuffy room | 1 |
| /audio/child-mode/phrases/someone-cut-the-rope-with-scissors-a70008.mp3 | someone cut the rope with scissors | 1 |
| /audio/child-mode/phrases/years-of-weather-wearing-the-fibres-ba4758.mp3 | years of weather wearing the fibres | 1 |
| /audio/child-mode/phrases/the-knot-rubbing-the-branch-cb246f.mp3 | the knot rubbing the branch | 1 |
| /audio/child-mode/phrases/two-riders-at-once-c9e7c8.mp3 | two riders at once | 1 |
| /audio/child-mode/phrases/the-rival-bakery-being-shut-6723ee.mp3 | the rival bakery being shut | 1 |
| /audio/child-mode/phrases/the-first-plum-tarts-of-the-year-fbbd67.mp3 | the first plum tarts of the year | 1 |
| /audio/child-mode/phrases/the-bakery-had-cut-all-its-prices-759418.mp3 | the bakery had cut all its prices | 1 |
| /audio/child-mode/phrases/the-food-show-clips-285828.mp3 | the food show clips | 1 |
| /audio/child-mode/phrases/the-radio-playing-cricket-d3a478.mp3 | the radio playing cricket | 1 |
| /audio/child-mode/phrases/the-phone-buried-in-the-sofa-260f5b.mp3 | the phone buried in the sofa | 1 |
| /audio/child-mode/phrases/the-phone-was-switched-off-3aa3da.mp3 | the phone was switched off | 1 |
| /audio/child-mode/phrases/the-roaring-blender-1d21e2.mp3 | the roaring blender | 1 |
| /audio/child-mode/phrases/tired-arms-from-swimming-1dee46.mp3 | tired arms from swimming | 1 |
| /audio/child-mode/phrases/a-leak-let-water-into-the-boat-faa513.mp3 | a leak let water into the boat | 1 |
| /audio/child-mode/phrases/the-tide-against-them-e039a3.mp3 | the tide against them | 1 |
| /audio/child-mode/phrases/the-wind-in-their-faces-3107fb.mp3 | the wind in their faces | 1 |
| /audio/child-mode/phrases/the-children-picked-a-spot-and-the-cat-follo-3ae424.mp3 | the children picked a spot and the cat followed | 1 |
| /audio/child-mode/phrases/the-dinner-ladies-called-them-together-2d23a8.mp3 | the dinner ladies called them together | 1 |
| /audio/child-mode/phrases/the-sun-followed-the-children-4e605c.mp3 | the sun followed the children | 1 |
| /audio/child-mode/phrases/the-cat-picked-a-spot-and-children-followed-cce16d.mp3 | the cat picked a spot and children followed | 1 |
| /audio/child-mode/phrases/winning-three-races-bd834d.mp3 | winning three races | 1 |
| /audio/child-mode/phrases/the-coach-s-smile-641edd.mp3 | the coach's smile | 1 |
| /audio/child-mode/phrases/her-steady-practice-over-many-weeks-92979d.mp3 | her steady practice over many weeks | 1 |
| /audio/child-mode/phrases/the-lucky-red-socks-a861d0.mp3 | the lucky red socks | 1 |
| /audio/child-mode/phrases/the-creaking-floorboard-itself-386b1b.mp3 | the creaking floorboard itself | 1 |
| /audio/child-mode/phrases/biscuit-appearing-in-the-kitchen-f46fbf.mp3 | Biscuit appearing in the kitchen | 1 |
| /audio/child-mode/phrases/the-visitor-watching-7fd75b.mp3 | the visitor watching | 1 |
| /audio/child-mode/phrases/dad-going-to-the-food-cupboard-f4c9e3.mp3 | Dad going to the food cupboard | 1 |
| /audio/child-mode/phrases/crowd-and-band-drove-each-other-louder-644a43.mp3 | crowd and band drove each other louder | 1 |
| /audio/child-mode/phrases/only-the-band-made-the-crowd-loud-4f92d5.mp3 | only the band made the crowd loud | 1 |
| /audio/child-mode/phrases/only-the-crowd-made-the-band-loud-253555.mp3 | only the crowd made the band loud | 1 |
| /audio/child-mode/phrases/the-hall-s-engine-made-the-noise-f2ad3e.mp3 | the hall's engine made the noise | 1 |
| /audio/child-mode/phrases/open-umbrellas-pull-down-the-rain-94b25a.mp3 | open umbrellas pull down the rain | 1 |
| /audio/child-mode/phrases/gran-signals-the-street-3dfc65.mp3 | Gran signals the street | 1 |
| /audio/child-mode/phrases/the-pavement-attracts-clouds-1116af.mp3 | the pavement attracts clouds | 1 |
| /audio/child-mode/phrases/first-drops-make-people-open-umbrellas-28bb99.mp3 | first drops make people open umbrellas | 1 |
| /audio/child-mode/phrases/hours-had-passed-since-his-small-lunch-fa1a78.mp3 | hours had passed since his small lunch | 1 |
| /audio/child-mode/phrases/the-van-s-tune-made-him-hungry-5a074b.mp3 | the van's tune made him hungry | 1 |
| /audio/child-mode/phrases/his-rumbling-tummy-called-the-van-c0dcf8.mp3 | his rumbling tummy called the van | 1 |
| /audio/child-mode/phrases/mum-s-laughing-reminded-him-3dbe08.mp3 | Mum's laughing reminded him | 1 |
| /audio/child-mode/phrases/the-vet-taught-the-rooster-to-crow-c7ee96.mp3 | the vet taught the rooster to crow | 1 |
| /audio/child-mode/phrases/dawn-light-wakes-the-rooster-so-he-crows-322c90.mp3 | dawn light wakes the rooster, so he crows | 1 |
| /audio/child-mode/phrases/the-rooster-s-crow-raises-the-sun-b8446e.mp3 | the rooster's crow raises the sun | 1 |
| /audio/child-mode/phrases/the-farmer-wakes-the-rooster-c75a7c.mp3 | the farmer wakes the rooster | 1 |
| /audio/child-mode/phrases/big-fires-bring-many-firefighters-985a3f.mp3 | big fires bring many firefighters | 1 |
| /audio/child-mode/phrases/many-firefighters-make-fires-big-af9817.mp3 | many firefighters make fires big | 1 |
| /audio/child-mode/phrases/small-fires-send-firefighters-away-af8945.mp3 | small fires send firefighters away | 1 |
| /audio/child-mode/phrases/posters-cause-fewer-fires-8c1984.mp3 | posters cause fewer fires | 1 |
| /audio/child-mode/phrases/the-can-went-cold-584b09.mp3 | the can went cold | 1 |
| /audio/child-mode/phrases/the-drink-sprayed-out-when-opened-902685.mp3 | the drink sprayed out when opened | 1 |
| /audio/child-mode/phrases/the-drink-went-flat-6ab4a8.mp3 | the drink went flat | 1 |
| /audio/child-mode/phrases/dad-opened-it-at-the-table-1c8374.mp3 | Dad opened it at the table | 1 |
| /audio/child-mode/phrases/it-made-the-beam-brighter-7f88d6.mp3 | it made the beam brighter | 1 |
| /audio/child-mode/phrases/it-started-the-camp-out-f16b34.mp3 | it started the camp-out | 1 |
| /audio/child-mode/phrases/it-drained-the-batteries-aa84d6.mp3 | it drained the batteries | 1 |
| /audio/child-mode/phrases/it-cracked-the-glass-d3b97b.mp3 | it cracked the glass | 1 |
| /audio/child-mode/phrases/she-had-caught-a-cold-saying-hello-e31a91.mp3 | she had caught a cold saying hello | 1 |
| /audio/child-mode/phrases/her-watery-eyes-made-her-sneeze-41cb27.mp3 | her watery eyes made her sneeze | 1 |
| /audio/child-mode/phrases/the-neighbour-was-dusty-52c290.mp3 | the neighbour was dusty | 1 |
| /audio/child-mode/phrases/the-cat-s-fur-set-off-her-allergy-3d3733.mp3 | the cat's fur set off her allergy | 1 |
| /audio/child-mode/phrases/mould-grew-on-them-over-the-weeks-77bf8a.mp3 | mould grew on them over the weeks | 1 |
| /audio/child-mode/phrases/the-fridge-froze-them-167646.mp3 | the fridge froze them | 1 |
| /audio/child-mode/phrases/val-found-the-box-241051.mp3 | Val found the box | 1 |
| /audio/child-mode/phrases/a-mouse-slept-on-them-f45743.mp3 | a mouse slept on them | 1 |
| /audio/child-mode/phrases/the-bath-stayed-full-because-of-the-chain-8ee1dc.mp3 | The bath stayed full because of the chain. | 1 |
| /audio/child-mode/phrases/the-bath-emptied-because-the-plug-had-come-l-49c1f1.mp3 | The bath emptied because the plug had come loose. | 1 |
| /audio/child-mode/phrases/the-plug-came-loose-because-the-bath-emptied-8c60d8.mp3 | The plug came loose because the bath emptied. | 1 |
| /audio/child-mode/phrases/the-bath-emptied-because-the-water-was-cold-4f9eec.mp3 | The bath emptied because the water was cold. | 1 |
| /audio/child-mode/phrases/the-balloon-rose-because-nia-held-it-tight-405d1f.mp3 | The balloon rose because Nia held it tight. | 1 |
| /audio/child-mode/phrases/the-broom-kept-the-balloon-up-4ad18e.mp3 | The broom kept the balloon up. | 1 |
| /audio/child-mode/phrases/light-gas-carried-the-balloon-upward-ff7a68.mp3 | Light gas carried the balloon upward. | 1 |
| /audio/child-mode/phrases/the-ceiling-pulled-the-balloon-up-2f9c8d.mp3 | The ceiling pulled the balloon up. | 1 |
| /audio/child-mode/phrases/pia-sat-on-the-wall-8ce889.mp3 | Pia sat on the wall | 1 |
| /audio/child-mode/phrases/the-bag-blew-away-9d2cf7.mp3 | the bag blew away | 1 |
| /audio/child-mode/phrases/the-tide-came-in-88d400.mp3 | the tide came in | 1 |
| /audio/child-mode/phrases/it-stole-a-chip-60d64d.mp3 | it stole a chip | 1 |
| /audio/child-mode/phrases/chewing-gum-stopped-one-wheel-turning-smooth-61d1d0.mp3 | chewing gum stopped one wheel turning smoothly | 1 |
| /audio/child-mode/phrases/the-shopping-was-too-heavy-188f20.mp3 | the shopping was too heavy | 1 |
| /audio/child-mode/phrases/its-song-annoyed-dad-b6d037.mp3 | its song annoyed Dad | 1 |
| /audio/child-mode/phrases/the-floor-was-wet-bf8386.mp3 | the floor was wet | 1 |
| /audio/child-mode/phrases/gulping-the-fizzy-drink-too-fast-b6bf14.mp3 | gulping the fizzy drink too fast | 1 |
| /audio/child-mode/phrases/the-giggling-7533e5.mp3 | the giggling | 1 |
| /audio/child-mode/phrases/putting-the-glass-down-3d4408.mp3 | putting the glass down | 1 |
| /audio/child-mode/phrases/a-scary-story-24eb15.mp3 | a scary story | 1 |
| /audio/child-mode/phrases/the-brush-was-too-wide-6b5a74.mp3 | the brush was too wide | 1 |
| /audio/child-mode/phrases/the-first-coat-dried-with-bumps-in-it-549dd8.mp3 | the first coat dried with bumps in it | 1 |
| /audio/child-mode/phrases/the-tin-was-left-open-overnight-882a18.mp3 | the tin was left open overnight | 1 |
| /audio/child-mode/phrases/dad-sanded-the-door-50dff8.mp3 | Dad sanded the door | 1 |
| /audio/child-mode/phrases/the-shady-corner-5423d4.mp3 | the shady corner | 1 |
| /audio/child-mode/phrases/clothes-pegged-up-dripping-ffef35.mp3 | clothes pegged up dripping | 1 |
| /audio/child-mode/phrases/a-hot-wind-blew-all-day-aedd8e.mp3 | a hot wind blew all day | 1 |
| /audio/child-mode/phrases/the-damp-misty-morning-a62e79.mp3 | the damp, misty morning | 1 |
| /audio/child-mode/phrases/the-weak-latch-f9c022.mp3 | the weak latch | 1 |
| /audio/child-mode/phrases/the-shelf-right-beside-the-cage-d282ad.mp3 | the shelf right beside the cage | 1 |
| /audio/child-mode/phrases/the-extra-carrot-night-opening-be8e45.mp3 | the extra carrot-night opening | 1 |
| /audio/child-mode/phrases/a-child-took-him-home-1b5b67.mp3 | a child took him home | 1 |
| /audio/child-mode/phrases/hot-sun-causes-both-at-once-e0cc67.mp3 | hot sun causes both at once | 1 |
| /audio/child-mode/phrases/ice-cream-causes-sunburn-4ef8c7.mp3 | ice cream causes sunburn | 1 |
| /audio/child-mode/phrases/sunburn-makes-people-buy-cones-daf1b5.mp3 | sunburn makes people buy cones | 1 |
| /audio/child-mode/phrases/the-newspaper-causes-july-b5eefb.mp3 | the newspaper causes July | 1 |
| /audio/child-mode/phrases/the-switch-is-in-his-chair-14b5ac.mp3 | the switch is in his chair | 1 |
| /audio/child-mode/phrases/evening-darkness-triggers-both-347e0e.mp3 | evening darkness triggers both | 1 |
| /audio/child-mode/phrases/grandad-s-yawns-switch-on-the-lights-b7483d.mp3 | Grandad's yawns switch on the lights | 1 |
| /audio/child-mode/phrases/the-streetlights-make-him-yawn-23076d.mp3 | the streetlights make him yawn | 1 |
| /audio/child-mode/phrases/they-turned-left-at-the-fork-e2896a.mp3 | they turned left at the fork | 1 |
| /audio/child-mode/phrases/the-stile-moved-f81677.mp3 | the stile moved | 1 |
| /audio/child-mode/phrases/a-pocket-magnet-misdirected-the-needle-5113e8.mp3 | a pocket magnet misdirected the needle | 1 |
| /audio/child-mode/phrases/the-compass-broke-in-the-rain-716996.mp3 | the compass broke in the rain | 1 |
| /audio/child-mode/phrases/the-open-back-door-8a1f7a.mp3 | the open back door | 1 |
| /audio/child-mode/phrases/the-ceiling-fan-4eefcc.mp3 | the ceiling fan | 1 |
| /audio/child-mode/phrases/the-puffing-cousins-d0a542.mp3 | the puffing cousins | 1 |
| /audio/child-mode/phrases/the-wax-was-too-soft-a454fc.mp3 | the wax was too soft | 1 |
| /audio/child-mode/phrases/quite-angry-278159.mp3 | quite angry | 1 |
| /audio/child-mode/phrases/very-hungry-213bea.mp3 | very hungry | 3 |
| /audio/child-mode/phrases/wide-awake-d7d617.mp3 | wide awake | 1 |
| /audio/child-mode/phrases/very-heavy-f174f4.mp3 | very heavy | 1 |
| /audio/child-mode/phrases/impossible-to-break-1402d3.mp3 | impossible to break | 1 |
| /audio/child-mode/phrases/full-of-flowers-ec70d9.mp3 | full of flowers | 1 |
| /audio/child-mode/phrases/bright-and-colourful-5b9567.mp3 | bright and colourful | 1 |
| /audio/child-mode/phrases/weak-and-floppy-8848d9.mp3 | weak and floppy | 1 |
| /audio/child-mode/phrases/brand-new-f19e13.mp3 | brand new | 2 |
| /audio/child-mode/phrases/strong-and-well-made-123aed.mp3 | strong and well made | 1 |
| /audio/child-mode/phrases/a-kind-of-stair-92d464.mp3 | a kind of stair | 1 |
| /audio/child-mode/phrases/a-bright-light-411b39.mp3 | a bright light | 1 |
| /audio/child-mode/phrases/a-soft-sound-of-talking-c4dfd0.mp3 | a soft sound of talking | 1 |
| /audio/child-mode/phrases/a-loud-crash-2494cb.mp3 | a loud crash | 1 |
| /audio/child-mode/phrases/small-and-light-b6636b.mp3 | small and light | 1 |
| /audio/child-mode/phrases/sharp-and-rough-at-the-edges-2127c5.mp3 | sharp and rough at the edges | 1 |
| /audio/child-mode/phrases/smooth-and-round-c38851.mp3 | smooth and round | 1 |
| /audio/child-mode/phrases/wet-and-shiny-9db1cd.mp3 | wet and shiny | 1 |
| /audio/child-mode/phrases/empty-on-the-inside-cd460f.mp3 | empty on the inside | 1 |
| /audio/child-mode/phrases/solid-all-the-way-through-dd3e23.mp3 | solid all the way through | 1 |
| /audio/child-mode/phrases/covered-in-leaves-5f8ef7.mp3 | covered in leaves | 1 |
| /audio/child-mode/phrases/very-long-3da10f.mp3 | very long | 1 |
| /audio/child-mode/phrases/nice-and-warm-da77d1.mp3 | nice and warm | 1 |
| /audio/child-mode/phrases/very-narrow-2dd353.mp3 | very narrow | 1 |
| /audio/child-mode/phrases/too-dark-ef7047.mp3 | too dark | 1 |
| /audio/child-mode/phrases/uncomfortably-cold-435ff5.mp3 | uncomfortably cold | 2 |
| /audio/child-mode/phrases/to-paint-something-5b4891.mp3 | to paint something | 1 |
| /audio/child-mode/phrases/to-hide-something-12fc42.mp3 | to hide something | 1 |
| /audio/child-mode/phrases/to-fix-something-b15b8a.mp3 | to fix something | 1 |
| /audio/child-mode/phrases/to-throw-something-away-783d74.mp3 | to throw something away | 1 |
| /audio/child-mode/phrases/a-big-special-meal-620fa4.mp3 | a big special meal | 1 |
| /audio/child-mode/phrases/a-small-snack-db1125.mp3 | a small snack | 1 |
| /audio/child-mode/phrases/a-kind-of-basket-e9f7c2.mp3 | a kind of basket | 1 |
| /audio/child-mode/phrases/a-long-walk-903703.mp3 | a long walk | 1 |
| /audio/child-mode/phrases/a-neat-row-of-books-4d4505.mp3 | a neat row of books | 1 |
| /audio/child-mode/phrases/a-set-of-school-rules-537496.mp3 | a set of school rules | 1 |
| /audio/child-mode/phrases/a-kind-of-desk-aaa6a6.mp3 | a kind of desk | 1 |
| /audio/child-mode/phrases/a-mess-of-things-not-needed-547c4c.mp3 | a mess of things not needed | 1 |
| /audio/child-mode/phrases/made-of-stone-73e00d.mp3 | made of stone | 1 |
| /audio/child-mode/phrases/very-old-d35281.mp3 | very old | 3 |
| /audio/child-mode/phrases/tiny-and-light-11e3b3.mp3 | tiny and light | 1 |
| /audio/child-mode/phrases/very-expensive-58120f.mp3 | very expensive | 2 |
| /audio/child-mode/phrases/dull-and-dirty-ee2809.mp3 | dull and dirty | 1 |
| /audio/child-mode/phrases/out-of-tune-3901b7.mp3 | out of tune | 2 |
| /audio/child-mode/phrases/easily-frightened-4ecc69.mp3 | easily frightened | 1 |
| /audio/child-mode/phrases/bold-and-fierce-862134.mp3 | bold and fierce | 1 |
| /audio/child-mode/phrases/green-and-leafy-28d71e.mp3 | green and leafy | 1 |
| /audio/child-mode/phrases/far-away-d52580.mp3 | far away | 1 |
| /audio/child-mode/phrases/very-slow-3da4d9.mp3 | very slow | 1 |
| /audio/child-mode/phrases/very-valuable-443559.mp3 | very valuable | 1 |
| /audio/child-mode/phrases/made-of-clay-1abfd0.mp3 | made of clay | 1 |
| /audio/child-mode/phrases/torn-to-bits-a34e37.mp3 | torn to bits | 1 |
| /audio/child-mode/phrases/wet-through-ae94eb.mp3 | wet through | 1 |
| /audio/child-mode/phrases/dry-and-crisp-cfb355.mp3 | dry and crisp | 1 |
| /audio/child-mode/phrases/warm-and-cosy-deca82.mp3 | warm and cosy | 1 |
| /audio/child-mode/phrases/buried-in-the-garden-18d7aa.mp3 | buried in the garden | 1 |
| /audio/child-mode/phrases/ate-very-slowly-e1325c.mp3 | ate very slowly | 1 |
| /audio/child-mode/phrases/sniffed-carefully-96d0f0.mp3 | sniffed carefully | 1 |
| /audio/child-mode/phrases/ate-very-fast-18aae5.mp3 | ate very fast | 1 |
| /audio/child-mode/phrases/sank-slowly-dc76cf.mp3 | sank slowly | 1 |
| /audio/child-mode/phrases/flew-high-up-a50ca9.mp3 | flew high up | 1 |
| /audio/child-mode/phrases/moved-smoothly-along-1a33aa.mp3 | moved smoothly along | 1 |
| /audio/child-mode/phrases/splashed-noisily-a524ab.mp3 | splashed noisily | 1 |
| /audio/child-mode/phrases/slept-in-the-sun-28d197.mp3 | slept in the sun | 2 |
| /audio/child-mode/phrases/crawled-very-slowly-a00319.mp3 | crawled very slowly | 1 |
| /audio/child-mode/phrases/dug-a-deep-hole-a99096.mp3 | dug a deep hole | 1 |
| /audio/child-mode/phrases/ran-with-quick-little-steps-ef48c2.mp3 | ran with quick little steps | 1 |
| /audio/child-mode/phrases/begged-with-all-his-heart-987e3b.mp3 | begged with all his heart | 1 |
| /audio/child-mode/phrases/shouted-angrily-fb6803.mp3 | shouted angrily | 1 |
| /audio/child-mode/phrases/whispered-a-secret-106820.mp3 | whispered a secret | 1 |
| /audio/child-mode/phrases/gave-up-quietly-ba2740.mp3 | gave up quietly | 1 |
| /audio/child-mode/phrases/purred-happily-3fafda.mp3 | purred happily | 1 |
| /audio/child-mode/phrases/stretched-out-flat-97239b.mp3 | stretched out flat | 1 |
| /audio/child-mode/phrases/fell-fast-asleep-365944.mp3 | fell fast asleep | 1 |
| /audio/child-mode/phrases/shook-with-fear-ca7105.mp3 | shook with fear | 1 |
| /audio/child-mode/phrases/complained-in-a-low-voice-34eb1a.mp3 | complained in a low voice | 1 |
| /audio/child-mode/phrases/sang-a-cheerful-song-86e2a0.mp3 | sang a cheerful song | 1 |
| /audio/child-mode/phrases/climbed-very-fast-31fdba.mp3 | climbed very fast | 1 |
| /audio/child-mode/phrases/waved-at-neighbours-c8c48c.mp3 | waved at neighbours | 1 |
| /audio/child-mode/phrases/turned-to-rain-cdfa4b.mp3 | turned to rain | 1 |
| /audio/child-mode/phrases/floated-slowly-along-49691f.mp3 | floated slowly along | 1 |
| /audio/child-mode/phrases/popped-at-once-2a7b5e.mp3 | popped at once | 1 |
| /audio/child-mode/phrases/shot-up-like-rockets-d1bf80.mp3 | shot up like rockets | 1 |
| /audio/child-mode/phrases/looked-for-a-long-time-f1fcb5.mp3 | looked for a long time | 1 |
| /audio/child-mode/phrases/glanced-away-quickly-a6ca2b.mp3 | glanced away quickly | 1 |
| /audio/child-mode/phrases/cried-loudly-347d17.mp3 | cried loudly | 1 |
| /audio/child-mode/phrases/reached-and-grabbed-6cc0e2.mp3 | reached and grabbed | 1 |
| /audio/child-mode/phrases/blindingly-bright-a1c4a1.mp3 | blindingly bright | 2 |
| /audio/child-mode/phrases/disappointingly-small-14d1b1.mp3 | disappointingly small | 1 |
| /audio/child-mode/phrases/dangerously-loud-2e1a3f.mp3 | dangerously loud | 1 |
| /audio/child-mode/phrases/over-too-quickly-6ea35f.mp3 | over too quickly | 1 |
| /audio/child-mode/phrases/lost-on-the-path-c46954.mp3 | lost on the path | 1 |
| /audio/child-mode/phrases/completely-tired-out-bbf921.mp3 | completely tired out | 1 |
| /audio/child-mode/phrases/full-of-energy-909695.mp3 | full of energy | 1 |
| /audio/child-mode/phrases/very-thirsty-c5cc89.mp3 | very thirsty | 1 |
| /audio/child-mode/phrases/a-kind-of-bird-aaa59e.mp3 | a kind of bird | 1 |
| /audio/child-mode/phrases/a-school-lesson-339e2a.mp3 | a school lesson | 1 |
| /audio/child-mode/phrases/a-noisy-disturbance-f7f456.mp3 | a noisy disturbance | 1 |
| /audio/child-mode/phrases/a-peaceful-hush-452831.mp3 | a peaceful hush | 1 |
| /audio/child-mode/phrases/out-of-breath-561755.mp3 | out of breath | 1 |
| /audio/child-mode/phrases/completely-soaked-538b29.mp3 | completely soaked | 1 |
| /audio/child-mode/phrases/perfectly-dry-ae914c.mp3 | perfectly dry | 1 |
| /audio/child-mode/phrases/very-late-3da0d4.mp3 | very late | 1 |
| /audio/child-mode/phrases/pushed-away-b5eac6.mp3 | pushed away | 1 |
| /audio/child-mode/phrases/sniffed-and-left-160748.mp3 | sniffed and left | 1 |
| /audio/child-mode/phrases/ate-with-small-bites-8427db.mp3 | ate with small bites | 1 |
| /audio/child-mode/phrases/swallowed-in-one-go-742e4c.mp3 | swallowed in one go | 1 |
| /audio/child-mode/phrases/covered-in-flour-bcab58.mp3 | covered in flour | 1 |
| /audio/child-mode/phrases/very-small-f24063.mp3 | very small | 1 |
| /audio/child-mode/phrases/closed-on-sundays-513682.mp3 | closed on Sundays | 1 |
| /audio/child-mode/phrases/perfectly-clean-980041.mp3 | perfectly clean | 1 |
| /audio/child-mode/phrases/built-a-nest-67e21f.mp3 | built a nest | 1 |
| /audio/child-mode/phrases/called-loudly-84a30e.mp3 | called loudly | 1 |
| /audio/child-mode/phrases/flew-high-upward-483aa2.mp3 | flew high upward | 1 |
| /audio/child-mode/phrases/dived-to-the-ground-729fd4.mp3 | dived to the ground | 1 |
| /audio/child-mode/phrases/sweet-as-honey-4cf541.mp3 | sweet as honey | 1 |
| /audio/child-mode/phrases/too-hot-to-eat-1eafad.mp3 | too hot to eat | 1 |
| /audio/child-mode/phrases/thick-and-lumpy-6e7db6.mp3 | thick and lumpy | 1 |
| /audio/child-mode/phrases/sharp-and-unpleasant-to-taste-b5f71e.mp3 | sharp and unpleasant to taste | 1 |
| /audio/child-mode/phrases/loud-and-confident-7b90b2.mp3 | loud and confident | 1 |
| /audio/child-mode/phrases/angry-at-her-sister-cbdff7.mp3 | angry at her sister | 1 |
| /audio/child-mode/phrases/tired-of-visiting-c5539c.mp3 | tired of visiting | 1 |
| /audio/child-mode/phrases/shy-around-new-people-1c6d00.mp3 | shy around new people | 1 |
| /audio/child-mode/phrases/shaky-and-likely-to-break-1c8d34.mp3 | shaky and likely to break | 1 |
| /audio/child-mode/phrases/solid-and-safe-1614f6.mp3 | solid and safe | 1 |
| /audio/child-mode/phrases/newly-painted-b8d815.mp3 | newly painted | 1 |
| /audio/child-mode/phrases/too-high-to-cross-6fcdf1.mp3 | too high to cross | 1 |
| /audio/child-mode/phrases/empty-with-nothing-there-fc9863.mp3 | empty, with nothing there | 1 |
| /audio/child-mode/phrases/crowded-and-busy-26b7ab.mp3 | crowded and busy | 1 |
| /audio/child-mode/phrases/dark-green-a10ac0.mp3 | dark green | 1 |
| /audio/child-mode/phrases/freshly-swept-fb2eea.mp3 | freshly swept | 1 |
| /audio/child-mode/phrases/cosily-warm-1017b3.mp3 | cosily warm | 1 |
| /audio/child-mode/phrases/strangely-quiet-f3fd75.mp3 | strangely quiet | 1 |
| /audio/child-mode/phrases/very-tidy-3da558.mp3 | very tidy | 1 |
| /audio/child-mode/phrases/lost-and-confused-9803d6.mp3 | lost and confused | 1 |
| /audio/child-mode/phrases/fast-and-energetic-5ef385.mp3 | fast and energetic | 1 |
| /audio/child-mode/phrases/slow-and-lazy-833dc5.mp3 | slow and lazy | 1 |
| /audio/child-mode/phrases/quiet-and-careful-48a4e8.mp3 | quiet and careful | 1 |
| /audio/child-mode/phrases/stay-silent-2a4f41.mp3 | stay silent | 1 |
| /audio/child-mode/phrases/speak-low-and-unclearly-1b5160.mp3 | speak low and unclearly | 1 |
| /audio/child-mode/phrases/shout-to-the-whole-hall-6d56f0.mp3 | shout to the whole hall | 1 |
| /audio/child-mode/phrases/sing-in-tune-c1918b.mp3 | sing in tune | 1 |
| /audio/child-mode/phrases/closed-for-winter-fce590.mp3 | closed for winter | 1 |
| /audio/child-mode/phrases/full-of-activity-332c69.mp3 | full of activity | 1 |
| /audio/child-mode/phrases/silent-and-still-85ac80.mp3 | silent and still | 1 |
| /audio/child-mode/phrases/deep-under-water-27462e.mp3 | deep under water | 1 |
| /audio/child-mode/phrases/warm-to-touch-4b219d.mp3 | warm to touch | 1 |
| /audio/child-mode/phrases/newly-bought-3b4ad9.mp3 | newly bought | 1 |
| /audio/child-mode/phrases/giving-very-little-light-eebec9.mp3 | giving very little light | 1 |
| /audio/child-mode/phrases/shine-more-brightly-f126db.mp3 | shine more brightly | 1 |
| /audio/child-mode/phrases/stay-in-plain-sight-5e9d1a.mp3 | stay in plain sight | 1 |
| /audio/child-mode/phrases/disappear-completely-93df28.mp3 | disappear completely | 1 |
| /audio/child-mode/phrases/grow-much-bigger-4521d1.mp3 | grow much bigger | 1 |
| /audio/child-mode/phrases/a-hunting-trip-b415b9.mp3 | a hunting trip | 1 |
| /audio/child-mode/phrases/a-loud-growl-24dd69.mp3 | a loud growl | 1 |
| /audio/child-mode/phrases/a-morning-walk-ddeb48.mp3 | a morning walk | 1 |
| /audio/child-mode/phrases/a-long-deep-sleep-6d7139.mp3 | a long deep sleep | 1 |
| /audio/child-mode/phrases/a-kind-of-pie-52c09f.mp3 | a kind of pie | 1 |
| /audio/child-mode/phrases/a-cold-draught-d01b65.mp3 | a cold draught | 1 |
| /audio/child-mode/phrases/a-smell-in-the-air-397ca9.mp3 | a smell in the air | 1 |
| /audio/child-mode/phrases/a-loud-timer-25c3ad.mp3 | a loud timer | 1 |
| /audio/child-mode/phrases/cost-extra-money-f34c6c.mp3 | cost extra money | 1 |
| /audio/child-mode/phrases/ruined-completely-54767b.mp3 | ruined completely | 1 |
| /audio/child-mode/phrases/measured-exactly-57df00.mp3 | measured exactly | 1 |
| /audio/child-mode/phrases/made-the-effort-worth-it-db1e99.mp3 | made the effort worth it | 1 |
| /audio/child-mode/phrases/looked-hard-and-closely-67cae7.mp3 | looked hard and closely | 1 |
| /audio/child-mode/phrases/knocked-politely-5b2f84.mp3 | knocked politely | 1 |
| /audio/child-mode/phrases/walked-away-9ffecc.mp3 | walked away | 1 |
| /audio/child-mode/phrases/listened-carefully-b3e3fe.mp3 | listened carefully | 1 |
| /audio/child-mode/phrases/sank-to-the-bottom-a2581f.mp3 | sank to the bottom | 1 |
| /audio/child-mode/phrases/sped-across-the-lake-71b7fc.mp3 | sped across the lake | 1 |
| /audio/child-mode/phrases/leaked-at-the-seams-e9c161.mp3 | leaked at the seams | 1 |
| /audio/child-mode/phrases/floated-up-and-down-b08d1a.mp3 | floated up and down | 1 |
| /audio/child-mode/phrases/covered-a-hole-to-fix-it-289ab2.mp3 | covered a hole to fix it | 1 |
| /audio/child-mode/phrases/cut-a-bigger-hole-792060.mp3 | cut a bigger hole | 1 |
| /audio/child-mode/phrases/washed-in-hot-water-e3d3f1.mp3 | washed in hot water | 1 |
| /audio/child-mode/phrases/folded-and-put-away-b4fa37.mp3 | folded and put away | 1 |
| /audio/child-mode/phrases/queued-politely-f1e9bf.mp3 | queued politely | 1 |
| /audio/child-mode/phrases/ran-very-quickly-1186a9.mp3 | ran very quickly | 1 |
| /audio/child-mode/phrases/strolled-slowly-46f8d9.mp3 | strolled slowly | 1 |
| /audio/child-mode/phrases/danced-in-circles-a22b3c.mp3 | danced in circles | 1 |
| /audio/child-mode/phrases/warm-and-comfortable-96bb0a.mp3 | warm and comfortable | 1 |
| /audio/child-mode/phrases/cold-and-damp-4343fb.mp3 | cold and damp | 1 |
| /audio/child-mode/phrases/bored-and-restless-c1e16b.mp3 | bored and restless | 1 |
| /audio/child-mode/phrases/half-asleep-71b8d8.mp3 | half asleep | 1 |
| /audio/child-mode/phrases/far-too-slow-31c2cc.mp3 | far too slow | 1 |
| /audio/child-mode/phrases/very-quiet-f220b6.mp3 | very quiet | 1 |
| /audio/child-mode/phrases/booming-loud-2fda1a.mp3 | booming loud | 1 |
| /audio/child-mode/phrases/scaly-and-green-2b40cb.mp3 | scaly and green | 1 |
| /audio/child-mode/phrases/very-fierce-1bb3b0.mp3 | very fierce | 1 |
| /audio/child-mode/phrases/huge-beyond-belief-500eda.mp3 | huge beyond belief | 1 |
| /audio/child-mode/phrases/tiny-and-neat-c27c4a.mp3 | tiny and neat | 1 |
| /audio/child-mode/phrases/tough-as-old-boots-b8a192.mp3 | tough as old boots | 1 |
| /audio/child-mode/phrases/high-up-45d770.mp3 | high up | 1 |
| /audio/child-mode/phrases/easily-damaged-77895d.mp3 | easily damaged | 1 |
| /audio/child-mode/phrases/in-a-bad-mood-4e773e.mp3 | in a bad mood | 1 |
| /audio/child-mode/phrases/full-of-jokes-61d40c.mp3 | full of jokes | 1 |
| /audio/child-mode/phrases/fast-asleep-820029.mp3 | fast asleep | 1 |
| /audio/child-mode/phrases/hissed-a-warning-390bf0.mp3 | hissed a warning | 1 |
| /audio/child-mode/phrases/moved-suddenly-and-fast-fa784a.mp3 | moved suddenly and fast | 1 |
| /audio/child-mode/phrases/changed-its-colour-f52357.mp3 | changed its colour | 1 |
| /audio/child-mode/phrases/new-to-the-street-9d86f3.mp3 | new to the street | 1 |
| /audio/child-mode/phrases/tall-and-thin-fba1ee.mp3 | tall and thin | 1 |
| /audio/child-mode/phrases/old-in-age-88a0e8.mp3 | old in age | 1 |
| /audio/child-mode/phrases/very-young-f2ae64.mp3 | very young | 1 |
| /audio/child-mode/phrases/a-tidy-line-d2c024.mp3 | a tidy line | 1 |
| /audio/child-mode/phrases/a-locked-box-43a495.mp3 | a locked box | 1 |
| /audio/child-mode/phrases/a-shopping-list-e55992.mp3 | a shopping list | 1 |
| /audio/child-mode/phrases/a-muddle-of-mixed-up-things-75280c.mp3 | a muddle of mixed-up things | 1 |
| /audio/child-mode/phrases/afraid-of-people-df76b9.mp3 | afraid of people | 1 |
| /audio/child-mode/phrases/extremely-hungry-64542f.mp3 | extremely hungry | 1 |
| /audio/child-mode/phrases/completely-full-148046.mp3 | completely full | 1 |
| /audio/child-mode/phrases/soft-and-fluffy-9119f8.mp3 | soft and fluffy | 1 |
| /audio/child-mode/phrases/made-everyone-laugh-97db97.mp3 | made everyone laugh | 1 |
| /audio/child-mode/phrases/was-solved-at-once-98aec3.mp3 | was solved at once | 1 |
| /audio/child-mode/phrases/completely-puzzled-edcd5f.mp3 | completely puzzled | 1 |
| /audio/child-mode/phrases/bored-quickly-2031bd.mp3 | bored quickly | 1 |
| /audio/child-mode/phrases/wild-and-stormy-a69b76.mp3 | wild and stormy | 1 |
| /audio/child-mode/phrases/deep-and-cold-3416e7.mp3 | deep and cold | 1 |
| /audio/child-mode/phrases/full-of-boats-61431f.mp3 | full of boats | 1 |
| /audio/child-mode/phrases/calm-and-peaceful-8cbc59.mp3 | calm and peaceful | 1 |
| /audio/child-mode/phrases/cleverly-tricky-8d965e.mp3 | cleverly tricky | 1 |
| /audio/child-mode/phrases/plain-and-easy-842429.mp3 | plain and easy | 1 |
| /audio/child-mode/phrases/written-in-ink-5ba161.mp3 | written in ink | 1 |
| /audio/child-mode/phrases/missing-a-piece-6463af.mp3 | missing a piece | 1 |
| /audio/child-mode/phrases/full-of-books-614359.mp3 | full of books | 1 |
| /audio/child-mode/phrases/big-and-awkward-to-carry-aae50c.mp3 | big and awkward to carry | 1 |
| /audio/child-mode/phrases/light-as-a-feather-4eb6d6.mp3 | light as a feather | 1 |
| /audio/child-mode/phrases/tied-with-ribbon-d8756d.mp3 | tied with ribbon | 1 |
| /audio/child-mode/phrases/frozen-solid-1d495d.mp3 | frozen solid | 1 |
| /audio/child-mode/phrases/watered-down-eb90a3.mp3 | watered down | 1 |
| /audio/child-mode/phrases/gone-bad-and-smelly-975967.mp3 | gone bad and smelly | 1 |
| /audio/child-mode/phrases/fresh-and-creamy-54f308.mp3 | fresh and creamy | 1 |
| /audio/child-mode/phrases/quick-to-run-off-207b57.mp3 | quick to run off | 1 |
| /audio/child-mode/phrases/afraid-of-sheep-3d4adf.mp3 | afraid of sheep | 1 |
| /audio/child-mode/phrases/always-faithful-9b3846.mp3 | always faithful | 1 |
| /audio/child-mode/phrases/smiled-hugely-2cf62e.mp3 | smiled hugely | 1 |
| /audio/child-mode/phrases/burst-into-tears-65252e.mp3 | burst into tears | 1 |
| /audio/child-mode/phrases/frowned-crossly-fb2d3f.mp3 | frowned crossly | 1 |
| /audio/child-mode/phrases/left-the-room-1f8efe.mp3 | left the room | 1 |
| /audio/child-mode/phrases/ben-swung-the-bat-at-the-ball-b13578.mp3 | Ben swung the bat at the ball. | 1 |
| /audio/child-mode/phrases/the-bat-cracked-when-it-hit-the-post-e807c6.mp3 | The bat cracked when it hit the post. | 1 |
| /audio/child-mode/phrases/dad-bought-a-new-bat-for-cricket-1e9c4d.mp3 | Dad bought a new bat for cricket. | 1 |
| /audio/child-mode/phrases/the-bat-slept-upside-down-in-the-cave-323b61.mp3 | The bat slept upside down in the cave. | 1 |
| /audio/child-mode/phrases/a-baby-bat-clung-to-its-mother-3146b2.mp3 | A baby bat clung to its mother. | 1 |
| /audio/child-mode/phrases/the-bat-hung-from-the-branch-by-its-feet-e46f33.mp3 | The bat hung from the branch by its feet. | 1 |
| /audio/child-mode/phrases/mia-gripped-the-bat-and-faced-the-bowler-1d8230.mp3 | Mia gripped the bat and faced the bowler. | 1 |
| /audio/child-mode/phrases/the-bat-flew-out-at-dusk-to-catch-moths-aebf7e.mp3 | The bat flew out at dusk to catch moths. | 1 |
| /audio/child-mode/phrases/we-heard-the-ring-of-the-doorbell-7369cc.mp3 | We heard the ring of the doorbell. | 1 |
| /audio/child-mode/phrases/her-gold-ring-sparkled-in-the-sun-ab44b4.mp3 | Her gold ring sparkled in the sun. | 1 |
| /audio/child-mode/phrases/the-ring-slipped-off-her-finger-497679.mp3 | The ring slipped off her finger. | 1 |
| /audio/child-mode/phrases/gran-keeps-her-ring-in-a-tiny-box-ac1465.mp3 | Gran keeps her ring in a tiny box. | 1 |
| /audio/child-mode/phrases/we-heard-the-phone-ring-twice-8047d3.mp3 | We heard the phone ring twice. | 1 |
| /audio/child-mode/phrases/give-the-bell-a-loud-ring-at-noon-59be30.mp3 | Give the bell a loud ring at noon. | 1 |
| /audio/child-mode/phrases/the-ring-of-laughter-filled-the-hall-136d3e.mp3 | The ring of laughter filled the hall. | 1 |
| /audio/child-mode/phrases/the-silver-ring-fit-her-thumb-perfectly-94378e.mp3 | The silver ring fit her thumb perfectly. | 1 |
| /audio/child-mode/phrases/terrified-and-running-aa8a31.mp3 | terrified and running | 1 |
| /audio/child-mode/phrases/a-library-132ad3.mp3 | a library | 2 |
| /audio/child-mode/phrases/a-swimming-pool-39dd0f.mp3 | a swimming pool | 2 |
| /audio/child-mode/phrases/a-garden-974b67.mp3 | a garden | 1 |
| /audio/child-mode/phrases/a-bakery-8b9dcb.mp3 | a bakery | 1 |
| /audio/child-mode/phrases/a-football-pitch-9b8570.mp3 | a football pitch | 1 |
| /audio/child-mode/phrases/a-cinema-8e855c.mp3 | a cinema | 3 |
| /audio/child-mode/phrases/a-farm-eca014.mp3 | a farm | 1 |
| /audio/child-mode/phrases/a-bookshop-29ae87.mp3 | a bookshop | 1 |
| /audio/child-mode/phrases/a-playground-59587a.mp3 | a playground | 1 |
| /audio/child-mode/phrases/a-kitchen-c76e32.mp3 | a kitchen | 2 |
| /audio/child-mode/phrases/a-stable-b497c6.mp3 | a stable | 1 |
| /audio/child-mode/phrases/a-pet-shop-19de69.mp3 | a pet shop | 1 |
| /audio/child-mode/phrases/a-classroom-ec35cd.mp3 | a classroom | 1 |
| /audio/child-mode/phrases/a-beach-805c24.mp3 | a beach | 1 |
| /audio/child-mode/phrases/a-lift-eca37f.mp3 | a lift | 1 |
| /audio/child-mode/phrases/a-train-81a8fe.mp3 | a train | 1 |
| /audio/child-mode/phrases/a-bus-eed859.mp3 | a bus | 1 |
| /audio/child-mode/phrases/a-boat-ec9e1c.mp3 | a boat | 1 |
| /audio/child-mode/phrases/a-cave-ec9e6f.mp3 | a cave | 1 |
| /audio/child-mode/phrases/an-aquarium-571098.mp3 | an aquarium | 1 |
| /audio/child-mode/phrases/a-museum-of-paintings-3af3c2.mp3 | a museum of paintings | 1 |
| /audio/child-mode/phrases/the-school-library-bbf6e0.mp3 | the school library | 1 |
| /audio/child-mode/phrases/the-school-dinner-hall-61be26.mp3 | the school dinner hall | 1 |
| /audio/child-mode/phrases/his-kitchen-at-home-3ab212.mp3 | his kitchen at home | 1 |
| /audio/child-mode/phrases/a-sweet-shop-2cd4ce.mp3 | a sweet shop | 1 |
| /audio/child-mode/phrases/a-forest-95f39b.mp3 | a forest | 1 |
| /audio/child-mode/phrases/a-car-park-e1f193.mp3 | a car park | 1 |
| /audio/child-mode/phrases/the-beach-65c3b4.mp3 | the beach | 1 |
| /audio/child-mode/phrases/a-funfair-621ddf.mp3 | a funfair | 1 |
| /audio/child-mode/phrases/the-family-will-go-swimming-29a2bb.mp3 | the family will go swimming | 1 |
| /audio/child-mode/phrases/the-family-will-fall-asleep-on-the-grass-893e35.mp3 | the family will fall asleep on the grass | 1 |
| /audio/child-mode/phrases/the-family-will-hurry-home-before-the-rain-fe6401.mp3 | the family will hurry home before the rain | 1 |
| /audio/child-mode/phrases/the-family-will-start-a-barbecue-6d7318.mp3 | the family will start a barbecue | 1 |
| /audio/child-mode/phrases/theo-will-take-a-bath-himself-756b44.mp3 | Theo will take a bath himself | 1 |
| /audio/child-mode/phrases/theo-will-feed-the-cat-86bc27.mp3 | Theo will feed the cat | 1 |
| /audio/child-mode/phrases/theo-will-go-to-bed-207ee7.mp3 | Theo will go to bed | 1 |
| /audio/child-mode/phrases/theo-will-wash-the-dog-bbf83f.mp3 | Theo will wash the dog | 1 |
| /audio/child-mode/phrases/dad-will-eat-the-toast-happily-b46bb1.mp3 | Dad will eat the toast happily | 1 |
| /audio/child-mode/phrases/dad-will-read-another-page-de6576.mp3 | Dad will read another page | 1 |
| /audio/child-mode/phrases/dad-will-pop-out-the-burnt-toast-145f41.mp3 | Dad will pop out the burnt toast | 1 |
| /audio/child-mode/phrases/dad-will-water-the-plants-739ea1.mp3 | Dad will water the plants | 1 |
| /audio/child-mode/phrases/aya-will-throw-the-jar-away-f67dd7.mp3 | Aya will throw the jar away | 1 |
| /audio/child-mode/phrases/aya-will-make-her-bed-10e3bc.mp3 | Aya will make her bed | 1 |
| /audio/child-mode/phrases/aya-will-eat-the-pancakes-now-1df15d.mp3 | Aya will eat the pancakes now | 1 |
| /audio/child-mode/phrases/aya-will-go-and-buy-honey-5f4df4.mp3 | Aya will go and buy honey | 1 |
| /audio/child-mode/phrases/raj-will-get-new-batteries-a7100e.mp3 | Raj will get new batteries | 1 |
| /audio/child-mode/phrases/raj-will-throw-the-torch-in-the-bin-3f4a86.mp3 | Raj will throw the torch in the bin | 1 |
| /audio/child-mode/phrases/raj-will-shine-the-torch-again-at-once-8a7386.mp3 | Raj will shine the torch again at once | 1 |
| /audio/child-mode/phrases/raj-will-go-outside-to-play-961d44.mp3 | Raj will go outside to play | 1 |
| /audio/child-mode/phrases/nell-will-turn-the-music-up-6c2295.mp3 | Nell will turn the music up | 1 |
| /audio/child-mode/phrases/nell-will-start-singing-along-650208.mp3 | Nell will start singing along | 1 |
| /audio/child-mode/phrases/nell-will-open-the-window-114b41.mp3 | Nell will open the window | 1 |
| /audio/child-mode/phrases/nell-will-rush-to-switch-off-the-music-6e51e0.mp3 | Nell will rush to switch off the music | 1 |
| /audio/child-mode/phrases/grandad-will-spread-sand-on-the-icy-path-17e24b.mp3 | Grandad will spread sand on the icy path | 1 |
| /audio/child-mode/phrases/grandad-will-run-down-the-path-c6f99f.mp3 | Grandad will run down the path | 1 |
| /audio/child-mode/phrases/grandad-will-plant-flowers-cc9012.mp3 | Grandad will plant flowers | 1 |
| /audio/child-mode/phrases/grandad-will-wash-the-windows-984bf4.mp3 | Grandad will wash the windows | 1 |
| /audio/child-mode/phrases/the-postman-ate-it-cea2d3.mp3 | the postman ate it | 1 |
| /audio/child-mode/phrases/a-bird-took-it-9dbc7f.mp3 | a bird took it | 1 |
| /audio/child-mode/phrases/mum-tidied-it-away-32542e.mp3 | Mum tidied it away | 1 |
| /audio/child-mode/phrases/it-is-still-on-the-plate-210307.mp3 | it is still on the plate | 1 |
| /audio/child-mode/phrases/she-had-lost-the-picnic-rug-c4e2ec.mp3 | she had lost the picnic rug | 1 |
| /audio/child-mode/phrases/she-could-tell-rain-was-coming-370d0e.mp3 | she could tell rain was coming | 1 |
| /audio/child-mode/phrases/she-was-tired-of-picnics-forever-1e1201.mp3 | she was tired of picnics forever | 1 |
| /audio/child-mode/phrases/the-museum-was-free-that-day-35ac00.mp3 | the museum was free that day | 1 |
| /audio/child-mode/phrases/he-wanted-to-help-her-without-a-fuss-1e3e42.mp3 | he wanted to help her without a fuss | 1 |
| /audio/child-mode/phrases/he-hated-oranges-d1f493.mp3 | he hated oranges | 1 |
| /audio/child-mode/phrases/the-teacher-told-him-to-share-72a208.mp3 | the teacher told him to share | 1 |
| /audio/child-mode/phrases/he-wanted-everyone-to-praise-him-6abdb3.mp3 | he wanted everyone to praise him | 1 |
| /audio/child-mode/phrases/her-scooter-was-stolen-3452ef.mp3 | her scooter was stolen | 1 |
| /audio/child-mode/phrases/she-was-bored-of-scooting-5a1138.mp3 | she was bored of scooting | 1 |
| /audio/child-mode/phrases/she-wanted-to-be-late-for-tea-b785e9.mp3 | she wanted to be late for tea | 1 |
| /audio/child-mode/phrases/the-lane-was-not-safe-to-ride-today-adab4d.mp3 | the lane was not safe to ride today | 1 |
| /audio/child-mode/phrases/the-kitchen-was-too-cold-3c3cb9.mp3 | the kitchen was too cold | 1 |
| /audio/child-mode/phrases/she-was-hiding-from-grandad-6dcbe4.mp3 | she was hiding from Grandad | 1 |
| /audio/child-mode/phrases/she-needed-quiet-to-hear-the-call-2e6a9e.mp3 | she needed quiet to hear the call | 1 |
| /audio/child-mode/phrases/she-wanted-to-watch-television-8ee3ef.mp3 | she wanted to watch television | 1 |
| /audio/child-mode/phrases/the-parents-asked-for-the-change-e99624.mp3 | the parents asked for the change | 1 |
| /audio/child-mode/phrases/jonah-had-shown-he-was-brilliant-in-goal-d7716d.mp3 | Jonah had shown he was brilliant in goal | 1 |
| /audio/child-mode/phrases/jonah-was-too-slow-to-run-eed8c5.mp3 | Jonah was too slow to run | 1 |
| /audio/child-mode/phrases/the-coach-wanted-the-team-to-lose-58b623.mp3 | the coach wanted the team to lose | 1 |
| /audio/child-mode/phrases/a-flood-once-ruined-her-seeds-9d9f5a.mp3 | a flood once ruined her seeds | 1 |
| /audio/child-mode/phrases/she-likes-collecting-jam-90324f.mp3 | she likes collecting jam | 1 |
| /audio/child-mode/phrases/the-jars-look-pretty-on-the-shelf-3b43c0.mp3 | the jars look pretty on the shelf | 1 |
| /audio/child-mode/phrases/seeds-grow-better-inside-glass-2591ca.mp3 | seeds grow better inside glass | 1 |
| /audio/child-mode/phrases/the-back-seats-were-broken-f9b989.mp3 | the back seats were broken | 1 |
| /audio/child-mode/phrases/she-wanted-to-annoy-her-friends-b57856.mp3 | she wanted to annoy her friends | 1 |
| /audio/child-mode/phrases/the-driver-was-her-uncle-97cd47.mp3 | the driver was her uncle | 1 |
| /audio/child-mode/phrases/being-new-to-riding-alone-she-wanted-to-feel-4be2a4.mp3 | being new to riding alone, she wanted to feel safe and ready | 1 |
| /audio/child-mode/phrases/he-was-trying-to-break-the-ladder-46830a.mp3 | he was trying to break the ladder | 1 |
| /audio/child-mode/phrases/he-had-forgotten-his-paintbrush-fb057f.mp3 | he had forgotten his paintbrush | 1 |
| /audio/child-mode/phrases/he-was-making-sure-it-would-not-slip-72e52e.mp3 | he was making sure it would not slip | 1 |
| /audio/child-mode/phrases/he-could-not-decide-which-wall-to-paint-380a66.mp3 | he could not decide which wall to paint | 1 |
| /audio/child-mode/phrases/someone-had-been-out-in-heavy-rain-16ab77.mp3 | someone had been out in heavy rain | 1 |
| /audio/child-mode/phrases/the-family-had-been-at-the-beach-9da6f1.mp3 | the family had been at the beach | 1 |
| /audio/child-mode/phrases/mum-had-bought-new-boots-73abef.mp3 | Mum had bought new boots | 1 |
| /audio/child-mode/phrases/the-bath-had-overflowed-a6c5e0.mp3 | the bath had overflowed | 1 |
| /audio/child-mode/phrases/a-child-fed-the-hamster-at-dawn-1bddee.mp3 | a child fed the hamster at dawn | 1 |
| /audio/child-mode/phrases/the-caretaker-cleaned-the-cage-8235df.mp3 | the caretaker cleaned the cage | 1 |
| /audio/child-mode/phrases/the-hamster-slept-all-night-b0ebff.mp3 | the hamster slept all night | 1 |
| /audio/child-mode/phrases/the-hamster-was-busy-while-everyone-was-away-1a8337.mp3 | the hamster was busy while everyone was away | 1 |
| /audio/child-mode/phrases/the-oven-had-never-worked-1d8b5b.mp3 | the oven had never worked | 1 |
| /audio/child-mode/phrases/dad-burnt-the-cake-he-was-baking-e83a7f.mp3 | Dad burnt the cake he was baking | 1 |
| /audio/child-mode/phrases/dad-forgot-to-bake-anything-68dd2d.mp3 | Dad forgot to bake anything | 1 |
| /audio/child-mode/phrases/burglars-had-opened-the-window-86ad91.mp3 | burglars had opened the window | 1 |
| /audio/child-mode/phrases/marta-forgot-she-owned-a-recorder-13583b.mp3 | Marta forgot she owned a recorder | 1 |
| /audio/child-mode/phrases/her-brother-had-taken-the-recorder-without-a-a61710.mp3 | her brother had taken the recorder without asking | 1 |
| /audio/child-mode/phrases/marta-had-sold-her-recorder-5d0927.mp3 | Marta had sold her recorder | 1 |
| /audio/child-mode/phrases/the-teacher-had-collected-the-recorders-9a5a5b.mp3 | the teacher had collected the recorders | 1 |
| /audio/child-mode/phrases/the-girl-next-door-8288c7.mp3 | the girl next door | 1 |
| /audio/child-mode/phrases/grandpa-though-he-swore-he-never-touched-him-35d514.mp3 | Grandpa, though he swore he never touched him | 1 |
| /audio/child-mode/phrases/the-wind-bd4f94.mp3 | the wind | 1 |
| /audio/child-mode/phrases/nobody-it-never-moved-4207c3.mp3 | nobody — it never moved | 1 |
| /audio/child-mode/phrases/a-naughty-child-from-next-door-f5d83c.mp3 | a naughty child from next door | 1 |
| /audio/child-mode/phrases/a-strong-gust-of-wind-a18772.mp3 | a strong gust of wind | 1 |
| /audio/child-mode/phrases/a-large-heavy-animal-from-the-woods-b33f4d.mp3 | a large, heavy animal from the woods | 1 |
| /audio/child-mode/phrases/a-small-garden-bird-568088.mp3 | a small garden bird | 1 |
| /audio/child-mode/phrases/cleaning-her-glasses-abf6ea.mp3 | cleaning her glasses | 1 |
| /audio/child-mode/phrases/buying-a-brand-new-bicycle-b863d9.mp3 | buying a brand-new bicycle | 1 |
| /audio/child-mode/phrases/spray-painting-ela-s-bicycle-as-a-surprise-75fe81.mp3 | spray-painting Ela's bicycle as a surprise | 1 |
| /audio/child-mode/phrases/painting-the-bathroom-walls-a-new-colour-731033.mp3 | painting the bathroom walls a new colour | 1 |
| /audio/child-mode/phrases/a-burglar-reset-the-clocks-251f86.mp3 | a burglar reset the clocks | 1 |
| /audio/child-mode/phrases/the-electricity-had-been-off-for-a-long-time-815726.mp3 | the electricity had been off for a long time | 1 |
| /audio/child-mode/phrases/someone-left-the-freezer-drawers-hanging-ope-5c5e1c.mp3 | someone left the freezer drawers hanging open | 1 |
| /audio/child-mode/phrases/the-family-bought-soft-ice-cream-cae6f4.mp3 | the family bought soft ice cream | 1 |
| /audio/child-mode/phrases/she-said-twice-in-a-bright-voice-that-she-di-951b11.mp3 | she said twice, in a bright voice, that she did not mind missing it | 1 |
| /audio/child-mode/phrases/it-was-time-for-art-dccc62.mp3 | it was time for art | 1 |
| /audio/child-mode/phrases/her-voice-was-bright-d5f346.mp3 | her voice was bright | 1 |
| /audio/child-mode/phrases/she-drew-a-girl-waving-from-the-bus-window-2ba133.mp3 | she drew a girl waving from the bus window | 1 |
| /audio/child-mode/phrases/the-terrier-was-grey-124063.mp3 | the terrier was grey | 1 |
| /audio/child-mode/phrases/they-went-home-7eafa0.mp3 | they went home | 1 |
| /audio/child-mode/phrases/he-kept-the-shelter-s-leaflet-all-week-962671.mp3 | he kept the shelter's leaflet all week | 1 |
| /audio/child-mode/phrases/he-shrugged-at-the-shelter-and-said-any-dog-bcc6dd.mp3 | he shrugged at the shelter and said any dog would do | 1 |
| /audio/child-mode/phrases/nobody-saw-who-tidied-the-book-corner-shelve-ef47fe.mp3 | nobody saw who tidied the book corner shelves | 1 |
| /audio/child-mode/phrases/the-classroom-has-a-book-corner-e30a9d.mp3 | the classroom has a book corner | 1 |
| /audio/child-mode/phrases/it-happened-after-lunch-f8e2d8.mp3 | it happened after lunch | 1 |
| /audio/child-mode/phrases/the-shelves-were-sorted-the-way-femi-sorts-h-fb311b.mp3 | the shelves were sorted the way Femi sorts his pencils | 1 |
| /audio/child-mode/phrases/the-medal-was-polished-every-sunday-f95bf0.mp3 | the medal was polished every Sunday | 1 |
| /audio/child-mode/phrases/harri-claimed-the-win-did-not-matter-at-all-f255f0.mp3 | Harri claimed the win did not matter at all | 1 |
| /audio/child-mode/phrases/sports-day-was-rainy-4e5e87.mp3 | sports day was rainy | 1 |
| /audio/child-mode/phrases/visitors-came-to-the-house-1d0e36.mp3 | visitors came to the house | 1 |
| /audio/child-mode/phrases/he-said-he-had-never-played-c4e10e.mp3 | he said he had never played | 1 |
| /audio/child-mode/phrases/there-was-a-box-lid-4c6025.mp3 | there was a box lid | 1 |
| /audio/child-mode/phrases/mr-salt-had-a-queen-ea7067.mp3 | Mr Salt had a queen | 1 |
| /audio/child-mode/phrases/he-set-up-every-piece-without-looking-2e4549.mp3 | he set up every piece without looking | 1 |
| /audio/child-mode/phrases/the-credits-rolled-to-long-slow-breathing-d011c3.mp3 | the credits rolled to long, slow breathing | 1 |
| /audio/child-mode/phrases/she-insisted-she-was-wide-awake-for-the-whol-c8a2db.mp3 | she insisted she was wide awake for the whole film | 1 |
| /audio/child-mode/phrases/they-watched-a-film-f3aa21.mp3 | they watched a film | 1 |
| /audio/child-mode/phrases/leo-sat-beside-her-61b6c8.mp3 | Leo sat beside her | 1 |
| /audio/child-mode/phrases/mornings-were-cold-184d96.mp3 | mornings were cold | 2 |
| /audio/child-mode/phrases/a-bowl-marked-c-a-t-in-his-own-careful-lette-eb77d7.mp3 | a bowl marked C-A-T in his own careful letters | 1 |
| /audio/child-mode/phrases/he-grumbled-that-the-cat-was-nothing-but-a-n-d9c9bd.mp3 | he grumbled that the cat was nothing but a nuisance | 1 |
| /audio/child-mode/phrases/the-school-had-a-boiler-room-a92a76.mp3 | the school had a boiler room | 1 |
| /audio/child-mode/phrases/she-hid-away-to-read-under-a-blanket-3b108e.mp3 | she hid away to read under a blanket | 1 |
| /audio/child-mode/phrases/she-told-everyone-the-thunder-did-not-scare-93bd4f.mp3 | she told everyone the thunder did not scare her one bit | 1 |
| /audio/child-mode/phrases/she-owned-some-music-dc2816.mp3 | she owned some music | 1 |
| /audio/child-mode/phrases/gran-was-in-the-kitchen-c8c5ce.mp3 | Gran was in the kitchen | 1 |
| /audio/child-mode/phrases/surprised-it-was-so-easy-38905b.mp3 | surprised it was so easy | 1 |
| /audio/child-mode/phrases/still-terrified-1bc7a1.mp3 | still terrified | 1 |
| /audio/child-mode/phrases/angry-with-dad-a391de.mp3 | angry with Dad | 1 |
| /audio/child-mode/phrases/frightened-of-the-shop-f94481.mp3 | frightened of the shop | 1 |
| /audio/child-mode/phrases/bored-by-painting-39fe2d.mp3 | bored by painting | 1 |
| /audio/child-mode/phrases/proud-and-careful-with-her-prize-63e0ec.mp3 | proud and careful with her prize | 1 |
| /audio/child-mode/phrases/sorry-she-bought-it-22a0dd.mp3 | sorry she bought it | 1 |
| /audio/child-mode/phrases/a-theatre-with-actors-on-stage-5eaea3.mp3 | a theatre with actors on stage | 1 |
| /audio/child-mode/phrases/her-bedroom-8399e0.mp3 | her bedroom | 1 |
| /audio/child-mode/phrases/a-stadium-479198.mp3 | a stadium | 1 |
| /audio/child-mode/phrases/a-supermarket-d91ac3.mp3 | a supermarket | 1 |
| /audio/child-mode/phrases/a-street-market-583b1b.mp3 | a street market | 1 |
| /audio/child-mode/phrases/a-garage-974b5a.mp3 | a garage | 1 |
| /audio/child-mode/phrases/kip-will-fall-asleep-c78471.mp3 | Kip will fall asleep | 1 |
| /audio/child-mode/phrases/kip-will-go-to-lunch-when-the-bell-rings-90e036.mp3 | Kip will go to lunch when the bell rings | 1 |
| /audio/child-mode/phrases/kip-will-sit-in-the-quiet-classroom-doing-wo-db6759.mp3 | Kip will sit in the quiet classroom doing worksheets | 1 |
| /audio/child-mode/phrases/kip-will-go-home-for-the-day-8eebc8.mp3 | Kip will go home for the day | 1 |
| /audio/child-mode/phrases/go-back-to-bed-82c9dd.mp3 | go back to bed | 1 |
| /audio/child-mode/phrases/water-the-flowers-6d7666.mp3 | water the flowers | 1 |
| /audio/child-mode/phrases/build-a-snowman-4584b4.mp3 | build a snowman | 1 |
| /audio/child-mode/phrases/cook-carrot-soup-df8059.mp3 | cook carrot soup | 1 |
| /audio/child-mode/phrases/too-scared-to-try-again-956165.mp3 | too scared to try again | 1 |
| /audio/child-mode/phrases/cross-with-the-queue-dd5439.mp3 | cross with the queue | 1 |
| /audio/child-mode/phrases/a-hospital-bce356.mp3 | a hospital | 1 |
| /audio/child-mode/phrases/a-hotel-80ce84.mp3 | a hotel | 1 |
| /audio/child-mode/phrases/a-school-b36833.mp3 | a school | 1 |
| /audio/child-mode/phrases/a-greenhouse-acfdc2.mp3 | a greenhouse | 1 |
| /audio/child-mode/phrases/to-keep-it-safe-from-his-little-cousins-20b859.mp3 | to keep it safe from his little cousins | 1 |
| /audio/child-mode/phrases/he-was-tired-of-dinosaurs-995e27.mp3 | he was tired of dinosaurs | 1 |
| /audio/child-mode/phrases/his-mum-told-him-to-tidy-his-whole-room-18971a.mp3 | his mum told him to tidy his whole room | 1 |
| /audio/child-mode/phrases/he-wanted-to-sleep-with-it-b944e0.mp3 | he wanted to sleep with it | 1 |
| /audio/child-mode/phrases/because-the-council-made-her-680381.mp3 | because the council made her | 1 |
| /audio/child-mode/phrases/to-look-after-the-town-s-early-workers-f752d5.mp3 | to look after the town's early workers | 1 |
| /audio/child-mode/phrases/to-sell-her-rolls-for-more-money-e6e066.mp3 | to sell her rolls for more money | 1 |
| /audio/child-mode/phrases/because-she-could-not-sleep-8d0f9c.mp3 | because she could not sleep | 1 |
| /audio/child-mode/phrases/the-baker-made-the-cake-wrong-5ef8a5.mp3 | the baker made the cake wrong | 1 |
| /audio/child-mode/phrases/a-candle-fell-by-itself-78efbb.mp3 | a candle fell by itself | 1 |
| /audio/child-mode/phrases/the-cat-walked-through-mud-and-over-the-cake-5bbaff.mp3 | the cat walked through mud and over the cake | 1 |
| /audio/child-mode/phrases/someone-dropped-the-birthday-cake-on-the-flo-6e0522.mp3 | someone dropped the birthday cake on the floor | 1 |
| /audio/child-mode/phrases/his-usual-flat-and-empty-muddy-bag-3aa381.mp3 | his usual flat and empty muddy bag | 1 |
| /audio/child-mode/phrases/a-lost-kitten-a46370.mp3 | a lost kitten | 1 |
| /audio/child-mode/phrases/his-gardening-gloves-9336a7.mp3 | his gardening gloves | 1 |
| /audio/child-mode/phrases/a-giant-vegetable-he-grew-for-the-show-a90b35.mp3 | a giant vegetable he grew for the show | 1 |
| /audio/child-mode/phrases/he-was-first-up-every-morning-to-warm-their-bcf846.mp3 | he was first up every morning to warm their bottles | 1 |
| /audio/child-mode/phrases/he-said-the-baby-lambs-were-fine-whatever-2ea068.mp3 | he said the baby lambs were fine, whatever | 1 |
| /audio/child-mode/phrases/there-was-football-on-saturday-a3fe8b.mp3 | there was football on Saturday | 1 |
| /audio/child-mode/phrases/the-cook-moved-every-open-sack-of-flour-up-h-90fbd5.mp3 | the cook moved every open sack of flour up high | 1 |
| /audio/child-mode/phrases/a-humane-trap-and-peanut-butter-went-to-the-3f9ebe.mp3 | a humane trap and peanut butter went to the store room | 1 |
| /audio/child-mode/phrases/the-head-said-the-school-absolutely-had-no-m-668d93.mp3 | the head said the school absolutely had no mouse | 1 |
| /audio/child-mode/phrases/the-school-had-a-store-room-a6a2df.mp3 | the school had a store room | 1 |
| /audio/child-mode/phrases/to-hide-the-book-from-her-friends-c67676.mp3 | to hide the book from her friends | 1 |
| /audio/child-mode/phrases/because-the-bag-looked-nice-c16334.mp3 | because the bag looked nice | 1 |
| /audio/child-mode/phrases/to-protect-it-in-case-her-bottle-leaked-agai-815443.mp3 | to protect it in case her bottle leaked again | 1 |
| /audio/child-mode/phrases/because-rain-was-pouring-on-the-walk-to-scho-6d573c.mp3 | because rain was pouring on the walk to school | 1 |
| /audio/child-mode/phrases/gran-turning-the-pots-knocks-each-plant-side-e94e2c.mp3 | Gran turning the pots knocks each plant sideways | 1 |
| /audio/child-mode/phrases/the-wind-pushes-them-71ed10.mp3 | the wind pushes them | 1 |
| /audio/child-mode/phrases/the-pots-are-broken-6fc6ef.mp3 | the pots are broken | 1 |
| /audio/child-mode/phrases/they-grow-toward-the-light-from-the-window-f9f39e.mp3 | they grow toward the light from the window | 1 |
| /audio/child-mode/phrases/in-the-calmest-patch-of-the-stream-e6fe69.mp3 | in the calmest patch of the stream | 1 |
| /audio/child-mode/phrases/a-red-backpack-against-the-railing-bcab4d.mp3 | a red backpack against the railing | 1 |
| /audio/child-mode/phrases/a-painted-warning-sign-by-the-entrance-db306b.mp3 | a painted warning sign by the entrance | 1 |
| /audio/child-mode/phrases/one-plank-that-was-not-secure-f115ed.mp3 | one plank that was not secure | 1 |
| /audio/child-mode/phrases/a-sleeping-dog-beside-the-path-942902.mp3 | a sleeping dog beside the path | 1 |
| /audio/child-mode/phrases/a-laminated-pass-for-the-lunchroom-4f2c25.mp3 | a laminated pass for the lunchroom | 1 |
| /audio/child-mode/phrases/a-silver-badge-used-for-classroom-play-2693c8.mp3 | a silver badge used for classroom play | 1 |
| /audio/child-mode/phrases/a-folded-visitor-map-from-the-zoo-bf4a6e.mp3 | a folded visitor map from the zoo | 1 |
| /audio/child-mode/phrases/portable-communication-equipment-6f1f04.mp3 | portable communication equipment | 1 |
| /audio/child-mode/phrases/the-caretaker-3252cb.mp3 | the caretaker | 2 |
| /audio/child-mode/phrases/miss-adu-32982d.mp3 | Miss Adu | 1 |
| /audio/child-mode/phrases/the-taxi-driver-1eb322.mp3 | the taxi driver | 1 |
| /audio/child-mode/phrases/mr-pole-3760d0.mp3 | Mr Pole | 1 |
| /audio/child-mode/phrases/the-winner-4f8642.mp3 | the winner | 1 |
| /audio/child-mode/phrases/a-parent-ac49da.mp3 | a parent | 1 |
| /audio/child-mode/phrases/bill-the-bus-driver-84dd8a.mp3 | Bill the bus driver | 1 |
| /audio/child-mode/phrases/the-head-teacher-cc7645.mp3 | the head teacher | 2 |
| /audio/child-mode/phrases/at-ten-o-clock-f3ce78.mp3 | at ten o'clock | 1 |
| /audio/child-mode/phrases/at-half-past-ten-982c7b.mp3 | at half past ten | 1 |
| /audio/child-mode/phrases/at-eleven-b5d42d.mp3 | at eleven | 1 |
| /audio/child-mode/phrases/at-lunchtime-f4d391.mp3 | at lunchtime | 3 |
| /audio/child-mode/phrases/it-smelled-of-orange-90b12b.mp3 | it smelled of orange | 1 |
| /audio/child-mode/phrases/it-had-a-rocket-sticker-cab5db.mp3 | it had a rocket sticker | 1 |
| /audio/child-mode/phrases/it-had-his-name-on-it-384388.mp3 | it had his name on it | 1 |
| /audio/child-mode/phrases/it-had-a-dent-in-one-corner-eaf879.mp3 | it had a dent in one corner | 1 |
| /audio/child-mode/phrases/exactly-one-hour-996d55.mp3 | exactly one hour | 1 |
| /audio/child-mode/phrases/a-whole-week-9c232f.mp3 | a whole week | 1 |
| /audio/child-mode/phrases/until-the-next-morning-3a19f4.mp3 | until the next morning | 1 |
| /audio/child-mode/phrases/for-the-whole-school-day-df5d58.mp3 | for the whole school day | 1 |
| /audio/child-mode/phrases/the-dinosaur-glove-3983d1.mp3 | the dinosaur glove | 1 |
| /audio/child-mode/phrases/the-stripy-scarf-f8431f.mp3 | the stripy scarf | 1 |
| /audio/child-mode/phrases/the-water-bottle-bb8cc3.mp3 | the water bottle | 1 |
| /audio/child-mode/phrases/a-woolly-hat-e1f93f.mp3 | a woolly hat | 1 |
| /audio/child-mode/phrases/baby-mo-s-a32c13.mp3 | baby Mo's | 1 |
| /audio/child-mode/phrases/raj-s-recycling-pile-322d68.mp3 | Raj's recycling pile | 1 |
| /audio/child-mode/phrases/nell-s-dressing-up-box-806741.mp3 | Nell's dressing-up box | 1 |
| /audio/child-mode/phrases/the-staff-room-d9f061.mp3 | the staff room | 1 |
| /audio/child-mode/phrases/the-art-shop-b9c722.mp3 | the art shop | 1 |
| /audio/child-mode/phrases/dive-from-the-high-board-906c2c.mp3 | dive from the high board | 1 |
| /audio/child-mode/phrases/swim-whole-lengths-without-a-float-4fb31e.mp3 | swim whole lengths without a float | 1 |
| /audio/child-mode/phrases/swim-widths-with-a-float-b0599d.mp3 | swim widths with a float | 1 |
| /audio/child-mode/phrases/stay-where-she-can-stand-103324.mp3 | stay where she can stand | 1 |
| /audio/child-mode/phrases/nothing-at-all-9640d8.mp3 | nothing at all | 2 |
| /audio/child-mode/phrases/two-pounds-fifty-1cfdcd.mp3 | two pounds fifty | 1 |
| /audio/child-mode/phrases/five-pounds-4aa8a1.mp3 | five pounds | 1 |
| /audio/child-mode/phrases/ten-pounds-307db8.mp3 | ten pounds | 1 |
| /audio/child-mode/phrases/it-was-a-feeding-day-instead-1129d2.mp3 | it was a feeding day instead | 1 |
| /audio/child-mode/phrases/rain-days-mean-no-watering-and-it-had-rained-b8a13c.mp3 | rain days mean no watering, and it had rained | 1 |
| /audio/child-mode/phrases/thursday-was-not-a-watering-day-8fba86.mp3 | Thursday was not a watering day | 1 |
| /audio/child-mode/phrases/the-can-was-lost-b59fdd.mp3 | the can was lost | 1 |
| /audio/child-mode/phrases/the-iron-bench-because-of-the-twins-fae771.mp3 | the iron bench, because of the twins | 1 |
| /audio/child-mode/phrases/no-bench-has-one-cbdd19.mp3 | no bench has one | 1 |
| /audio/child-mode/phrases/mr-alam-s-bench-to-remember-the-birds-he-fed-53f689.mp3 | Mr Alam's bench, to remember the birds he fed | 1 |
| /audio/child-mode/phrases/the-oak-bench-because-of-captain-reya-9056d0.mp3 | the oak bench, because of Captain Reya | 1 |
| /audio/child-mode/phrases/the-glass-was-wiped-43c0fc.mp3 | the glass was wiped | 1 |
| /audio/child-mode/phrases/the-fish-waited-in-a-bucket-3625b8.mp3 | the fish waited in a bucket | 1 |
| /audio/child-mode/phrases/the-fish-were-given-new-food-cdfc9c.mp3 | the fish were given new food | 1 |
| /audio/child-mode/phrases/the-gravel-was-rinsed-be794d.mp3 | the gravel was rinsed | 1 |
| /audio/child-mode/phrases/lanes-were-painted-e87113.mp3 | lanes were painted | 1 |
| /audio/child-mode/phrases/bean-bags-were-counted-d68f8f.mp3 | bean bags were counted | 1 |
| /audio/child-mode/phrases/the-megaphone-was-tested-4337a0.mp3 | the megaphone was tested | 1 |
| /audio/child-mode/phrases/medals-were-polished-667ee2.mp3 | medals were polished | 1 |
| /audio/child-mode/phrases/a-notebook-47f885.mp3 | a notebook | 1 |
| /audio/child-mode/phrases/a-torch-81a7a1.mp3 | a torch | 1 |
| /audio/child-mode/phrases/a-camera-8df40c.mp3 | a camera | 1 |
| /audio/child-mode/phrases/a-raincoat-aa4b2e.mp3 | a raincoat | 1 |
| /audio/child-mode/phrases/screwdrivers-on-hooks-f65df6.mp3 | screwdrivers on hooks | 1 |
| /audio/child-mode/phrases/jars-of-screws-354ff9.mp3 | jars of screws | 1 |
| /audio/child-mode/phrases/a-radio-by-the-door-63bc40.mp3 | a radio by the door | 1 |
| /audio/child-mode/phrases/a-box-of-old-paintbrushes-1c5af1.mp3 | a box of old paintbrushes | 1 |
| /audio/child-mode/phrases/a-poetry-competition-was-judged-cab766.mp3 | a poetry competition was judged | 1 |
| /audio/child-mode/phrases/an-author-signed-books-801368.mp3 | an author signed books | 1 |
| /audio/child-mode/phrases/reading-tokens-counted-double-5cfecd.mp3 | reading tokens counted double | 1 |
| /audio/child-mode/phrases/the-librarian-wore-her-book-dress-8950a5.mp3 | the librarian wore her book dress | 1 |
| /audio/child-mode/phrases/candles-stood-in-jam-jars-96a9b2.mp3 | candles stood in jam jars | 1 |
| /audio/child-mode/phrases/a-guitar-played-requests-18e6b6.mp3 | a guitar played requests | 1 |
| /audio/child-mode/phrases/the-chip-van-kept-selling-7d1707.mp3 | the chip van kept selling | 1 |
| /audio/child-mode/phrases/a-bonfire-was-lit-in-the-road-6e4ed7.mp3 | a bonfire was lit in the road | 1 |
| /audio/child-mode/phrases/no-eating-or-drinking-27d2f4.mp3 | no eating or drinking | 1 |
| /audio/child-mode/phrases/walk-don-t-run-b9adba.mp3 | walk, don't run | 1 |
| /audio/child-mode/phrases/no-flash-photographs-37f576.mp3 | no flash photographs | 1 |
| /audio/child-mode/phrases/the-marrow-rode-the-wheelbarrow-a93594.mp3 | the marrow rode the wheelbarrow | 1 |
| /audio/child-mode/phrases/carrots-were-pulled-and-washed-b8df14.mp3 | carrots were pulled and washed | 1 |
| /audio/child-mode/phrases/beans-were-picked-f1367c.mp3 | beans were picked | 1 |
| /audio/child-mode/phrases/potatoes-were-hunted-ecc60d.mp3 | potatoes were hunted | 1 |
| /audio/child-mode/phrases/the-rain-bd4cb3.mp3 | the rain | 1 |
| /audio/child-mode/phrases/half-an-hour-97ccb7.mp3 | half an hour | 1 |
| /audio/child-mode/phrases/an-afternoon-ceac80.mp3 | an afternoon | 1 |
| /audio/child-mode/phrases/twenty-minutes-97df36.mp3 | twenty minutes | 1 |
| /audio/child-mode/phrases/ten-minutes-4acc88.mp3 | ten minutes | 1 |
| /audio/child-mode/phrases/board-games-75d76e.mp3 | board games | 1 |
| /audio/child-mode/phrases/dinosaur-figures-c8c0e9.mp3 | dinosaur figures | 1 |
| /audio/child-mode/phrases/outgrown-wellies-42cc72.mp3 | outgrown wellies | 1 |
| /audio/child-mode/phrases/a-basket-of-picture-books-c884d9.mp3 | a basket of picture books | 1 |
| /audio/child-mode/phrases/no-one-could-catch-him-from-in-front-15e01b.mp3 | no one could catch him from in front | 1 |
| /audio/child-mode/phrases/his-starts-were-lightning-fa32e4.mp3 | his starts were lightning | 1 |
| /audio/child-mode/phrases/he-kept-the-pace-steady-90475e.mp3 | he kept the pace steady | 1 |
| /audio/child-mode/phrases/he-was-the-captain-ecbd0e.mp3 | he was the captain | 1 |
| /audio/child-mode/phrases/everything-about-paper-cups-d26676.mp3 | everything about paper cups | 1 |
| /audio/child-mode/phrases/a-girl-who-hates-plants-ea92ff.mp3 | a girl who hates plants | 1 |
| /audio/child-mode/phrases/waiting-for-a-seed-to-grow-3cb334.mp3 | waiting for a seed to grow | 1 |
| /audio/child-mode/phrases/a-dog-that-barked-f71c3d.mp3 | a dog that barked | 1 |
| /audio/child-mode/phrases/looking-inside-the-fridge-c518a4.mp3 | looking inside the fridge | 1 |
| /audio/child-mode/phrases/how-libraries-lend-books-acc81f.mp3 | how libraries lend books | 1 |
| /audio/child-mode/phrases/a-boy-who-loves-tidying-3649b1.mp3 | a boy who loves tidying | 1 |
| /audio/child-mode/phrases/searching-everywhere-for-a-lost-book-6e6c15.mp3 | searching everywhere for a lost book | 1 |
| /audio/child-mode/phrases/fixing-a-noisy-bike-23736b.mp3 | fixing a noisy bike | 1 |
| /audio/child-mode/phrases/a-ride-to-the-park-ebfbd5.mp3 | a ride to the park | 1 |
| /audio/child-mode/phrases/all-the-parts-of-a-bicycle-63214d.mp3 | all the parts of a bicycle | 1 |
| /audio/child-mode/phrases/a-broken-bike-nobody-fixed-9e0a42.mp3 | a broken bike nobody fixed | 1 |
| /audio/child-mode/phrases/laughing-at-dinner-4e0853.mp3 | laughing at dinner | 1 |
| /audio/child-mode/phrases/how-to-brush-your-teeth-d7b813.mp3 | how to brush your teeth | 1 |
| /audio/child-mode/phrases/a-boy-scared-of-the-dentist-b4045b.mp3 | a boy scared of the dentist | 1 |
| /audio/child-mode/phrases/a-wobbly-tooth-finally-coming-out-d3d046.mp3 | a wobbly tooth finally coming out | 1 |
| /audio/child-mode/phrases/slowly-making-friends-with-a-kitten-edc9da.mp3 | slowly making friends with a kitten | 1 |
| /audio/child-mode/phrases/a-dish-of-water-on-the-steps-aa8763.mp3 | a dish of water on the steps | 1 |
| /audio/child-mode/phrases/how-to-look-after-every-pet-5f05f9.mp3 | how to look after every pet | 1 |
| /audio/child-mode/phrases/a-kitten-that-ran-away-forever-fe138b.mp3 | a kitten that ran away forever | 1 |
| /audio/child-mode/phrases/a-boy-who-lost-his-hat-19d70a.mp3 | a boy who lost his hat | 1 |
| /audio/child-mode/phrases/finding-a-lost-mitten-354286.mp3 | finding a lost mitten | 1 |
| /audio/child-mode/phrases/footprints-in-the-snow-656f0f.mp3 | footprints in the snow | 1 |
| /audio/child-mode/phrases/all-kinds-of-winter-clothes-dd66b5.mp3 | all kinds of winter clothes | 1 |
| /audio/child-mode/phrases/a-choir-learning-to-sing-together-7897a8.mp3 | a choir learning to sing together | 1 |
| /audio/child-mode/phrases/miss-obi-clapping-a-beat-e2943d.mp3 | Miss Obi clapping a beat | 1 |
| /audio/child-mode/phrases/every-kind-of-music-cd452a.mp3 | every kind of music | 1 |
| /audio/child-mode/phrases/a-show-that-was-cancelled-8053f4.mp3 | a show that was cancelled | 1 |
| /audio/child-mode/phrases/a-pancake-that-fell-on-the-floor-19c6a9.mp3 | a pancake that fell on the floor | 1 |
| /audio/child-mode/phrases/practising-until-a-pancake-flip-works-5f9c4e.mp3 | practising until a pancake flip works | 1 |
| /audio/child-mode/phrases/a-dad-watching-on-sunday-63bba2.mp3 | a dad watching on Sunday | 1 |
| /audio/child-mode/phrases/what-people-eat-for-breakfast-8ddf31.mp3 | what people eat for breakfast | 1 |
| /audio/child-mode/phrases/why-bees-never-leave-the-hive-2ca0f1.mp3 | why bees never leave the hive | 1 |
| /audio/child-mode/phrases/how-bees-turn-nectar-into-honey-e61ebb.mp3 | how bees turn nectar into honey | 1 |
| /audio/child-mode/phrases/a-sweet-juice-called-nectar-82d357.mp3 | a sweet juice called nectar | 1 |
| /audio/child-mode/phrases/every-insect-in-the-garden-4c16ba.mp3 | every insect in the garden | 1 |
| /audio/child-mode/phrases/animals-that-live-in-ponds-bde506.mp3 | animals that live in ponds | 1 |
| /audio/child-mode/phrases/how-frogs-build-nests-e2f78a.mp3 | how frogs build nests | 1 |
| /audio/child-mode/phrases/how-a-tadpole-becomes-a-frog-1aed64.mp3 | how a tadpole becomes a frog | 1 |
| /audio/child-mode/phrases/back-legs-growing-first-226e47.mp3 | back legs growing first | 1 |
| /audio/child-mode/phrases/everything-factories-can-make-54901d.mp3 | everything factories can make | 1 |
| /audio/child-mode/phrases/why-paper-must-be-thrown-away-b7cbed.mp3 | why paper must be thrown away | 1 |
| /audio/child-mode/phrases/how-old-paper-is-made-new-again-68e23d.mp3 | how old paper is made new again | 1 |
| /audio/child-mode/phrases/a-grey-soup-of-paper-and-water-640119.mp3 | a grey soup of paper and water | 1 |
| /audio/child-mode/phrases/different-kinds-of-tall-buildings-804c33.mp3 | different kinds of tall buildings | 1 |
| /audio/child-mode/phrases/ships-that-sail-only-in-the-day-3ac6b9.mp3 | ships that sail only in the day | 1 |
| /audio/child-mode/phrases/how-a-lighthouse-keeps-ships-safe-3ca4de.mp3 | how a lighthouse keeps ships safe | 1 |
| /audio/child-mode/phrases/a-big-lamp-that-turns-a91108.mp3 | a big lamp that turns | 1 |
| /audio/child-mode/phrases/one-ant-finds-a-crumb-and-leaves-a-trail-6e2a5e.mp3 | one ant finds a crumb and leaves a trail | 1 |
| /audio/child-mode/phrases/all-the-tiny-animals-in-the-world-b588a9.mp3 | all the tiny animals in the world | 1 |
| /audio/child-mode/phrases/ants-that-live-all-alone-f47c78.mp3 | ants that live all alone | 1 |
| /audio/child-mode/phrases/how-ants-work-together-to-gather-food-e282ab.mp3 | how ants work together to gather food | 1 |
| /audio/child-mode/phrases/small-shadows-at-midday-8631a1.mp3 | small shadows at midday | 1 |
| /audio/child-mode/phrases/why-the-sky-is-blue-609050.mp3 | why the sky is blue | 1 |
| /audio/child-mode/phrases/shadows-that-never-move-4957d8.mp3 | shadows that never move | 1 |
| /audio/child-mode/phrases/how-shadows-change-through-the-day-289050.mp3 | how shadows change through the day | 1 |
| /audio/child-mode/phrases/wind-carrying-one-thread-374746.mp3 | wind carrying one thread | 1 |
| /audio/child-mode/phrases/every-animal-that-makes-a-home-edda39.mp3 | every animal that makes a home | 1 |
| /audio/child-mode/phrases/a-spider-that-hates-webs-ab6abc.mp3 | a spider that hates webs | 1 |
| /audio/child-mode/phrases/how-a-spider-builds-its-web-32f7fb.mp3 | how a spider builds its web | 1 |
| /audio/child-mode/phrases/why-the-moon-looks-different-each-night-e03501.mp3 | why the moon looks different each night | 1 |
| /audio/child-mode/phrases/seeing-only-a-sliver-of-the-bright-side-ba59fb.mp3 | seeing only a sliver of the bright side | 1 |
| /audio/child-mode/phrases/all-the-stars-in-space-265b60.mp3 | all the stars in space | 1 |
| /audio/child-mode/phrases/how-astronauts-fly-to-the-moon-66cee4.mp3 | how astronauts fly to the moon | 1 |
| /audio/child-mode/phrases/a-crossing-guard-helping-children-every-day-7cfd63.mp3 | a crossing guard helping children every day | 1 |
| /audio/child-mode/phrases/a-round-sign-held-up-to-stop-the-cars-e753df.mp3 | a round sign held up to stop the cars | 1 |
| /audio/child-mode/phrases/all-the-jobs-grown-ups-do-884afd.mp3 | all the jobs grown-ups do | 1 |
| /audio/child-mode/phrases/children-who-cross-alone-6936c6.mp3 | children who cross alone | 1 |
| /audio/child-mode/phrases/a-room-that-stayed-messy-525c1a.mp3 | a room that stayed messy | 1 |
| /audio/child-mode/phrases/a-class-tidying-their-room-together-a106f1.mp3 | a class tidying their room together | 1 |
| /audio/child-mode/phrases/one-team-stacking-chairs-480058.mp3 | one team stacking chairs | 1 |
| /audio/child-mode/phrases/every-rule-at-school-8a1538.mp3 | every rule at school | 1 |
| /audio/child-mode/phrases/a-saturday-trip-to-buy-food-with-nan-bcacaa.mp3 | a Saturday trip to buy food with Nan | 1 |
| /audio/child-mode/phrases/one-free-plum-from-the-stall-man-56c666.mp3 | one free plum from the stall man | 1 |
| /audio/child-mode/phrases/how-all-shops-sell-food-c10c4d.mp3 | how all shops sell food | 1 |
| /audio/child-mode/phrases/a-boy-who-stayed-at-home-7c79fb.mp3 | a boy who stayed at home | 1 |
| /audio/child-mode/phrases/clothes-nobody-ever-washes-900e23.mp3 | clothes nobody ever washes | 1 |
| /audio/child-mode/phrases/a-busy-morning-at-the-launderette-7e0577.mp3 | a busy morning at the launderette | 1 |
| /audio/child-mode/phrases/towels-folded-into-tall-piles-c5e005.mp3 | towels folded into tall piles | 1 |
| /audio/child-mode/phrases/every-shop-on-the-street-242105.mp3 | every shop on the street | 1 |
| /audio/child-mode/phrases/why-weather-changes-857aad.mp3 | why weather changes | 1 |
| /audio/child-mode/phrases/children-stuck-indoors-all-day-665eef.mp3 | children stuck indoors all day | 1 |
| /audio/child-mode/phrases/playing-outside-after-the-rain-5deb40.mp3 | playing outside after the rain | 1 |
| /audio/child-mode/phrases/leaf-boats-in-the-gutter-fac3af.mp3 | leaf boats in the gutter | 1 |
| /audio/child-mode/phrases/a-family-with-nothing-to-do-d3b1ed.mp3 | a family with nothing to do | 1 |
| /audio/child-mode/phrases/a-family-filling-in-their-calendar-c38acd.mp3 | a family filling in their calendar | 1 |
| /audio/child-mode/phrases/a-big-red-circle-for-grandma-384464.mp3 | a big red circle for Grandma | 1 |
| /audio/child-mode/phrases/how-to-count-all-the-months-e29359.mp3 | how to count all the months | 1 |
| /audio/child-mode/phrases/how-dogs-guard-houses-9e1001.mp3 | how dogs guard houses | 1 |
| /audio/child-mode/phrases/a-road-that-gets-no-letters-4a27c9.mp3 | a road that gets no letters | 1 |
| /audio/child-mode/phrases/the-post-arriving-on-our-road-894fc5.mp3 | the post arriving on our road | 1 |
| /audio/child-mode/phrases/a-parcel-for-number-12-9b32be.mp3 | a parcel for number 12 | 1 |
| /audio/child-mode/phrases/a-queue-at-eight-o-clock-e36fee.mp3 | a queue at eight o'clock | 1 |
| /audio/child-mode/phrases/every-food-people-like-ca218b.mp3 | every food people like | 1 |
| /audio/child-mode/phrases/a-shop-that-never-opens-bcf4d7.mp3 | a shop that never opens | 1 |
| /audio/child-mode/phrases/a-bakery-starting-its-morning-13a0fa.mp3 | a bakery starting its morning | 1 |
| /audio/child-mode/phrases/crisp-packets-by-the-fence-b6b293.mp3 | Crisp Packets by the Fence | 1 |
| /audio/child-mode/phrases/a-guide-to-every-garden-flower-875bbd.mp3 | A Guide to Every Garden Flower | 1 |
| /audio/child-mode/phrases/the-year-the-garden-failed-aec95f.mp3 | The Year the Garden Failed | 1 |
| /audio/child-mode/phrases/the-corner-nobody-wanted-f41935.mp3 | The Corner Nobody Wanted | 1 |
| /audio/child-mode/phrases/all-about-herons-799626.mp3 | All About Herons | 1 |
| /audio/child-mode/phrases/the-shortest-path-to-school-430799.mp3 | The Shortest Path to School | 1 |
| /audio/child-mode/phrases/the-long-way-round-61fe00.mp3 | The Long Way Round | 1 |
| /audio/child-mode/phrases/fixing-the-old-footbridge-d4e5e8.mp3 | Fixing the Old Footbridge | 1 |
| /audio/child-mode/phrases/the-girl-who-gave-up-music-60284c.mp3 | The Girl Who Gave Up Music | 1 |
| /audio/child-mode/phrases/slow-first-fast-later-466f02.mp3 | Slow First, Fast Later | 1 |
| /audio/child-mode/phrases/a-drum-kit-in-the-garage-2df573.mp3 | A Drum Kit in the Garage | 1 |
| /audio/child-mode/phrases/famous-drummers-of-the-world-a3235d.mp3 | Famous Drummers of the World | 1 |
| /audio/child-mode/phrases/the-otters-who-outsmarted-the-aquarium-fd0d18.mp3 | The Otters Who Outsmarted the Aquarium | 1 |
| /audio/child-mode/phrases/cameras-by-the-glass-wall-3dc583.mp3 | Cameras by the Glass Wall | 1 |
| /audio/child-mode/phrases/how-to-visit-a-city-aquarium-2f847b.mp3 | How to Visit a City Aquarium | 1 |
| /audio/child-mode/phrases/the-otters-who-never-moved-1534d4.mp3 | The Otters Who Never Moved | 1 |
| /audio/child-mode/phrases/a-flight-across-the-kitchen-4ba10f.mp3 | A Flight Across the Kitchen | 1 |
| /audio/child-mode/phrases/the-history-of-real-aeroplanes-60af8c.mp3 | The History of Real Aeroplanes | 1 |
| /audio/child-mode/phrases/the-plane-that-would-not-fly-95686c.mp3 | The Plane That Would Not Fly | 1 |
| /audio/child-mode/phrases/a-paper-plane-passed-down-9edf38.mp3 | A Paper Plane Passed Down | 1 |
| /audio/child-mode/phrases/why-storms-happen-7c8aa3.mp3 | Why Storms Happen | 1 |
| /audio/child-mode/phrases/the-chart-nobody-filled-in-281fce.mp3 | The Chart Nobody Filled In | 1 |
| /audio/child-mode/phrases/our-spring-drawn-in-rain-e0041e.mp3 | Our Spring, Drawn in Rain | 1 |
| /audio/child-mode/phrases/a-plastic-tube-and-a-ruler-c78ccb.mp3 | A Plastic Tube and a Ruler | 1 |
| /audio/child-mode/phrases/the-week-the-busker-stayed-home-8916fa.mp3 | The Week the Busker Stayed Home | 1 |
| /audio/child-mode/phrases/the-week-the-escalator-broke-166fe7.mp3 | The Week the Escalator Broke | 1 |
| /audio/child-mode/phrases/the-sign-that-said-sorry-all-week-16764d.mp3 | The Sign That Said Sorry All Week | 1 |
| /audio/child-mode/phrases/how-train-stations-are-built-9e56fc.mp3 | How Train Stations Are Built | 1 |
| /audio/child-mode/phrases/a-bank-that-saves-tomorrow-s-fields-15a5f5.mp3 | A Bank That Saves Tomorrow's Fields | 1 |
| /audio/child-mode/phrases/a-pumpkin-seed-from-long-ago-5a6c3b.mp3 | A Pumpkin Seed from Long Ago | 1 |
| /audio/child-mode/phrases/how-to-cook-with-beans-dd7fea.mp3 | How to Cook with Beans | 1 |
| /audio/child-mode/phrases/the-bank-that-lost-its-seeds-a77256.mp3 | The Bank That Lost Its Seeds | 1 |
| /audio/child-mode/phrases/miss-lee-added-some-ginger-30ecfb.mp3 | Miss Lee added some ginger | 1 |
| /audio/child-mode/phrases/sam-stirred-the-pot-3a36b3.mp3 | Sam stirred the pot | 1 |
| /audio/child-mode/phrases/the-class-made-soup-that-everyone-loved-baee1b.mp3 | the class made soup that everyone loved | 1 |
| /audio/child-mode/phrases/carrots-were-cut-into-little-moons-65d6ad.mp3 | carrots were cut into little moons | 1 |
| /audio/child-mode/phrases/bonfires-should-be-checked-6532dc.mp3 | bonfires should be checked | 1 |
| /audio/child-mode/phrases/people-can-make-gardens-safer-for-hedgehogs-893256.mp3 | people can make gardens safer for hedgehogs | 1 |
| /audio/child-mode/phrases/hedgehogs-sleep-in-piles-of-leaves-c4fbba.mp3 | hedgehogs sleep in piles of leaves | 1 |
| /audio/child-mode/phrases/a-gap-in-a-fence-helps-hedgehogs-walk-throug-8b45bb.mp3 | a gap in a fence helps hedgehogs walk through | 1 |
| /audio/child-mode/phrases/she-drew-with-a-silver-pencil-a8c3c5.mp3 | she drew with a silver pencil | 1 |
| /audio/child-mode/phrases/some-nights-she-wrote-hidden-71a9f5.mp3 | some nights she wrote 'hidden' | 1 |
| /audio/child-mode/phrases/she-kept-the-diary-for-a-month-8118d5.mp3 | she kept the diary for a month | 1 |
| /audio/child-mode/phrases/maya-s-diary-recorded-how-the-moon-changed-889f3e.mp3 | Maya's diary recorded how the moon changed | 1 |
| /audio/child-mode/phrases/the-box-is-red-88fc8c.mp3 | the box is red | 1 |
| /audio/child-mode/phrases/the-shelves-change-every-week-f5a3c8.mp3 | the shelves change every week | 1 |
| /audio/child-mode/phrases/people-leave-a-book-when-they-take-one-12def6.mp3 | people leave a book when they take one | 1 |
| /audio/child-mode/phrases/the-phone-box-became-a-tiny-library-9075d5.mp3 | the phone box became a tiny library | 1 |
| /audio/child-mode/phrases/potatoes-are-dug-in-autumn-4df12d.mp3 | potatoes are dug in autumn | 1 |
| /audio/child-mode/phrases/kale-stands-in-the-frost-72fd27.mp3 | kale stands in the frost | 1 |
| /audio/child-mode/phrases/the-allotment-grows-food-in-every-season-6f4059.mp3 | the allotment grows food in every season | 1 |
| /audio/child-mode/phrases/beans-climb-very-high-2455b1.mp3 | beans climb very high | 1 |
| /audio/child-mode/phrases/a-day-of-visitors-trying-out-the-station-400035.mp3 | a day of visitors trying out the station | 1 |
| /audio/child-mode/phrases/the-helmets-wobbled-b01585.mp3 | the helmets wobbled | 1 |
| /audio/child-mode/phrases/the-long-ladder-unfolds-to-reach-high-window-b49e46.mp3 | the long ladder unfolds to reach high windows | 1 |
| /audio/child-mode/phrases/children-sprayed-a-practice-hose-f7f421.mp3 | children sprayed a practice hose | 1 |
| /audio/child-mode/phrases/the-wind-farm-makes-electricity-from-wind-b33c7d.mp3 | the wind farm makes electricity from wind | 1 |
| /audio/child-mode/phrases/turbines-are-taller-than-the-church-e60e3c.mp3 | turbines are taller than the church | 1 |
| /audio/child-mode/phrases/blades-rest-on-still-days-4f6228.mp3 | blades rest on still days | 1 |
| /audio/child-mode/phrases/the-blades-look-like-pinwheels-54395a.mp3 | the blades look like pinwheels | 1 |
| /audio/child-mode/phrases/the-cake-had-one-hundred-candles-7f0026.mp3 | the cake had one hundred candles | 1 |
| /audio/child-mode/phrases/the-banner-was-as-long-as-a-bus-4f9a74.mp3 | the banner was as long as a bus | 1 |
| /audio/child-mode/phrases/flags-were-strung-from-lamp-post-to-lamp-pos-ffb540.mp3 | flags were strung from lamp post to lamp post | 1 |
| /audio/child-mode/phrases/the-street-celebrated-mr-chen-s-birthday-tog-9d9b5f.mp3 | the street celebrated Mr Chen's birthday together | 1 |
| /audio/child-mode/phrases/leo-decided-swimming-was-not-for-him-3fedf9.mp3 | Leo decided swimming was not for him. | 1 |
| /audio/child-mode/phrases/weekly-tips-and-practice-carried-leo-to-a-fu-d250cf.mp3 | Weekly tips and practice carried Leo to a full length at last. | 1 |
| /audio/child-mode/phrases/at-first-leo-stood-up-coughing-halfway-down-1f7e57.mp3 | At first Leo stood up coughing halfway down the pool. | 1 |
| /audio/child-mode/phrases/swimming-pools-hold-lessons-every-saturday-819094.mp3 | Swimming pools hold lessons every Saturday. | 1 |
| /audio/child-mode/phrases/scientists-rebuilt-a-huge-dinosaur-skeleton-54db06.mp3 | Scientists rebuilt a huge dinosaur skeleton while visitors watched. | 1 |
| /audio/child-mode/phrases/the-skeleton-arrived-in-ninety-two-boxes-29cbd3.mp3 | The skeleton arrived in ninety-two boxes. | 1 |
| /audio/child-mode/phrases/museums-keep-many-kinds-of-old-things-90af2d.mp3 | Museums keep many kinds of old things. | 1 |
| /audio/child-mode/phrases/the-dinosaur-could-never-be-put-together-9d2c72.mp3 | The dinosaur could never be put together. | 1 |
| /audio/child-mode/phrases/the-family-sat-bored-until-the-lights-return-120be8.mp3 | The family sat bored until the lights returned. | 1 |
| /audio/child-mode/phrases/a-power-cut-turned-into-a-cosy-evening-of-ol-1415ca.mp3 | A power cut turned into a cosy evening of old games. | 1 |
| /audio/child-mode/phrases/mum-found-some-candles-7a26ed.mp3 | Mum found some candles. | 1 |
| /audio/child-mode/phrases/electricity-comes-into-homes-through-wires-5b8318.mp3 | Electricity comes into homes through wires. | 1 |
| /audio/child-mode/phrases/the-seaside-has-sand-rocks-and-waves-2ba6ad.mp3 | The seaside has sand, rocks and waves. | 1 |
| /audio/child-mode/phrases/nadia-found-nothing-in-the-empty-pool-3c5ab4.mp3 | Nadia found nothing in the empty pool. | 1 |
| /audio/child-mode/phrases/by-waiting-quietly-nadia-discovered-the-tide-5d4491.mp3 | By waiting quietly, Nadia discovered the tide pool was full of life. | 1 |
| /audio/child-mode/phrases/a-crab-came-out-from-under-a-stone-b236d3.mp3 | A crab came out from under a stone. | 1 |
| /audio/child-mode/phrases/robot-vacuums-work-best-in-messy-rooms-f1b692.mp3 | Robot vacuums work best in messy rooms. | 1 |
| /audio/child-mode/phrases/a-robot-cleans-well-only-in-a-home-tidied-fo-655c0f.mp3 | A robot cleans well only in a home tidied for it first. | 1 |
| /audio/child-mode/phrases/a-sock-can-stop-a-robot-vacuum-fed114.mp3 | A sock can stop a robot vacuum. | 1 |
| /audio/child-mode/phrases/machines-do-many-jobs-in-houses-366a79.mp3 | Machines do many jobs in houses. | 1 |
| /audio/child-mode/phrases/boats-come-in-many-shapes-and-sizes-4ac52a.mp3 | Boats come in many shapes and sizes. | 1 |
| /audio/child-mode/phrases/the-islanders-ignore-the-ferry-completely-86132c.mp3 | The islanders ignore the ferry completely. | 1 |
| /audio/child-mode/phrases/the-island-s-daily-life-moves-to-the-rhythm-88d6b1.mp3 | The island's daily life moves to the rhythm of its ferry. | 1 |
| /audio/child-mode/phrases/the-ferry-carries-crates-at-noon-ec56bb.mp3 | The ferry carries crates at noon. | 1 |
| /audio/child-mode/phrases/the-bathroom-had-a-wonderful-echo-87a824.mp3 | The bathroom had a wonderful echo. | 1 |
| /audio/child-mode/phrases/trumpets-are-brass-instruments-83f42c.mp3 | Trumpets are brass instruments. | 1 |
| /audio/child-mode/phrases/amir-gave-his-trumpet-away-d3b180.mp3 | Amir gave his trumpet away. | 1 |
| /audio/child-mode/phrases/amir-searched-the-flat-until-he-found-a-good-d35569.mp3 | Amir searched the flat until he found a good place to practise. | 1 |
| /audio/child-mode/phrases/artists-use-many-colours-of-paint-6da0c4.mp3 | Artists use many colours of paint. | 1 |
| /audio/child-mode/phrases/the-street-stayed-grey-and-plain-f0f227.mp3 | The street stayed grey and plain. | 1 |
| /audio/child-mode/phrases/one-painted-door-slowly-grew-into-a-whole-st-645580.mp3 | One painted door slowly grew into a whole street of art. | 1 |
| /audio/child-mode/phrases/a-whale-was-painted-above-a-door-d5cd10.mp3 | A whale was painted above a door. | 1 |
| /audio/child-mode/phrases/blocks-rolling-everywhere-33c651.mp3 | blocks rolling everywhere | 1 |
| /audio/child-mode/phrases/how-to-build-real-houses-e34c70.mp3 | how to build real houses | 1 |
| /audio/child-mode/phrases/a-brother-sent-out-of-the-room-818eff.mp3 | a brother sent out of the room | 1 |
| /audio/child-mode/phrases/starting-again-after-a-tower-falls-28208b.mp3 | starting again after a tower falls | 1 |
| /audio/child-mode/phrases/getting-a-kite-to-fly-at-last-6f2ad2.mp3 | getting a kite to fly at last | 1 |
| /audio/child-mode/phrases/a-tail-made-from-a-scarf-e4ac42.mp3 | a tail made from a scarf | 1 |
| /audio/child-mode/phrases/all-the-things-wind-can-do-7ee36c.mp3 | all the things wind can do | 1 |
| /audio/child-mode/phrases/a-kite-lost-in-a-tree-16a344.mp3 | a kite lost in a tree | 1 |
| /audio/child-mode/phrases/magnets-that-pull-everything-3ccfb6.mp3 | magnets that pull everything | 1 |
| /audio/child-mode/phrases/what-magnets-do-and-do-not-pull-715cb4.mp3 | what magnets do and do not pull | 1 |
| /audio/child-mode/phrases/a-magnet-grabbing-paper-clips-8b40ef.mp3 | a magnet grabbing paper clips | 1 |
| /audio/child-mode/phrases/every-toy-in-the-toy-box-f56632.mp3 | every toy in the toy box | 1 |
| /audio/child-mode/phrases/all-the-creatures-in-a-garden-9ae50d.mp3 | all the creatures in a garden | 1 |
| /audio/child-mode/phrases/why-scraps-must-go-to-the-tip-642e62.mp3 | why scraps must go to the tip | 1 |
| /audio/child-mode/phrases/how-scraps-become-soil-for-plants-231873.mp3 | how scraps become soil for plants | 1 |
| /audio/child-mode/phrases/eggshells-going-into-the-bin-b7ea40.mp3 | eggshells going into the bin | 1 |
| /audio/child-mode/phrases/a-tank-with-stripy-fish-7d6c78.mp3 | a tank with stripy fish | 1 |
| /audio/child-mode/phrases/how-teeth-grow-cbbe6f.mp3 | how teeth grow | 1 |
| /audio/child-mode/phrases/a-boy-who-ran-out-of-the-door-405d13.mp3 | a boy who ran out of the door | 1 |
| /audio/child-mode/phrases/waiting-for-a-turn-at-the-dentist-d7f66a.mp3 | waiting for a turn at the dentist | 1 |
| /audio/child-mode/phrases/a-family-crowding-together-for-sunday-dinner-badd81.mp3 | a family crowding together for Sunday dinner | 1 |
| /audio/child-mode/phrases/a-big-silver-pot-139184.mp3 | a big silver pot | 1 |
| /audio/child-mode/phrases/recipes-from-around-the-world-866519.mp3 | recipes from around the world | 1 |
| /audio/child-mode/phrases/a-quiet-dinner-eaten-alone-28afb1.mp3 | a quiet dinner eaten alone | 1 |
| /audio/child-mode/phrases/a-hamster-that-never-left-its-cage-889fee.mp3 | a hamster that never left its cage | 1 |
| /audio/child-mode/phrases/tracking-down-an-escaped-hamster-ad54b3.mp3 | tracking down an escaped hamster | 1 |
| /audio/child-mode/phrases/seed-shells-by-the-library-4e3fce.mp3 | seed shells by the library | 1 |
| /audio/child-mode/phrases/how-to-care-for-small-pets-7f1f1a.mp3 | how to care for small pets | 1 |
| /audio/child-mode/phrases/every-animal-in-the-sea-dbfbe9.mp3 | every animal in the sea | 1 |
| /audio/child-mode/phrases/pools-the-sea-never-touches-8e8cdd.mp3 | pools the sea never touches | 1 |
| /audio/child-mode/phrases/how-the-tide-changes-life-in-a-rock-pool-fdf7a8.mp3 | how the tide changes life in a rock pool | 1 |
| /audio/child-mode/phrases/pools-sitting-still-in-the-sun-47b9e0.mp3 | pools sitting still in the sun | 1 |
| /audio/child-mode/phrases/how-buses-are-driven-85e92f.mp3 | How Buses Are Driven | 1 |
| /audio/child-mode/phrases/the-bus-that-stopped-running-4ca101.mp3 | The Bus That Stopped Running | 1 |
| /audio/child-mode/phrases/riders-of-the-night-bus-b2f142.mp3 | Riders of the Night Bus | 1 |
| /audio/child-mode/phrases/a-baker-dusted-in-flour-b73fe0.mp3 | A Baker Dusted in Flour | 1 |
| /audio/child-mode/phrases/a-match-behind-a-hand-58c0f7.mp3 | A Match Behind a Hand | 1 |
| /audio/child-mode/phrases/forests-and-their-trees-6cdb89.mp3 | Forests and Their Trees | 1 |
| /audio/child-mode/phrases/the-fire-that-never-lit-e7d2bb.mp3 | The Fire That Never Lit | 1 |
| /audio/child-mode/phrases/third-time-lucky-at-the-campfire-4570d5.mp3 | Third Time Lucky at the Campfire | 1 |
| /audio/child-mode/phrases/swifts-live-almost-their-whole-lives-in-the-a7cbb8.mp3 | swifts live almost their whole lives in the air | 1 |
| /audio/child-mode/phrases/their-nests-are-under-roofs-74e130.mp3 | their nests are under roofs | 1 |
| /audio/child-mode/phrases/they-scream-over-town-in-late-summer-f1ec6f.mp3 | they scream over town in late summer | 1 |
| /audio/child-mode/phrases/chicks-may-not-land-for-two-years-94d5b6.mp3 | chicks may not land for two years | 1 |
| /audio/child-mode/phrases/volunteers-sit-at-long-tables-with-toolboxes-35e7c1.mp3 | volunteers sit at long tables with toolboxes | 1 |
| /audio/child-mode/phrases/volunteers-fix-people-s-broken-things-for-fr-d1983d.mp3 | volunteers fix people's broken things for free | 1 |
| /audio/child-mode/phrases/it-happens-in-the-hall-23ca88.mp3 | it happens in the hall | 1 |
| /audio/child-mode/phrases/some-jackets-have-stuck-zips-45796f.mp3 | some jackets have stuck zips | 1 |
| /audio/child-mode/phrases/beaches-are-made-of-sand-and-shells-b73afa.mp3 | Beaches are made of sand and shells. | 1 |
| /audio/child-mode/phrases/the-twins-gave-up-after-the-wave-b926d5.mp3 | The twins gave up after the wave. | 1 |
| /audio/child-mode/phrases/the-twins-worked-as-a-team-and-won-a-special-f38a06.mp3 | The twins worked as a team and won a special ribbon. | 1 |
| /audio/child-mode/phrases/a-wave-stole-the-castle-gate-684426.mp3 | A wave stole the castle gate. | 1 |
| /audio/child-mode/phrases/a-paper-owl-was-stuck-in-the-bookshop-window-580b58.mp3 | A paper owl was stuck in the bookshop window. | 1 |
| /audio/child-mode/phrases/bookshops-sell-many-kinds-of-books-859d8d.mp3 | Bookshops sell many kinds of books. | 1 |
| /audio/child-mode/phrases/the-street-took-every-sticker-down-49818a.mp3 | The street took every sticker down. | 1 |
| /audio/child-mode/phrases/one-shop-s-idea-spread-until-the-whole-stree-c4836f.mp3 | One shop's idea spread until the whole street protected birds. | 1 |
| /audio/child-mode/phrases/the-radio-that-came-back-to-life-32a57c.mp3 | The Radio That Came Back to Life | 1 |
| /audio/child-mode/phrases/crackles-at-breakfast-12c46f.mp3 | Crackles at Breakfast | 1 |
| /audio/child-mode/phrases/how-sound-travels-5f04db.mp3 | How Sound Travels | 1 |
| /audio/child-mode/phrases/the-radio-they-threw-away-f51910.mp3 | The Radio They Threw Away | 1 |
| /audio/child-mode/phrases/the-apples-were-left-to-rot-a241c5.mp3 | The apples were left to rot. | 1 |
| /audio/child-mode/phrases/the-school-found-ways-to-share-a-huge-apple-8528ad.mp3 | The school found ways to share a huge apple harvest. | 1 |
| /audio/child-mode/phrases/class-1-pressed-juice-with-a-hand-press-cea298.mp3 | Class 1 pressed juice with a hand press. | 1 |
| /audio/child-mode/phrases/apple-trees-blossom-in-the-spring-1ad74b.mp3 | Apple trees blossom in the spring. | 1 |
| /audio/child-mode/phrases/we-went-out-late-1c5a2e.mp3 | We went out late. | 1 |
| /audio/child-mode/phrases/run-fast-and-jump-high-83cea4.mp3 | Run fast and jump high. | 1 |
| /audio/child-mode/phrases/she-is-very-happy-ba1beb.mp3 | She is very happy. | 1 |
| /audio/child-mode/phrases/the-dog-dug-up-a-bone-203a3c.mp3 | The dog dug up a bone. | 1 |
| /audio/child-mode/phrases/he-hops-and-skips-well-3e9bd9.mp3 | He hops and skips well. | 1 |
| /audio/child-mode/phrases/they-are-so-tall-e11652.mp3 | They are so tall. | 1 |
| /audio/child-mode/phrases/i-ran-off-quickly-4938c6.mp3 | I ran off quickly. | 1 |
| /audio/child-mode/phrases/you-did-so-well-939a16.mp3 | You did so well. | 1 |
| /audio/child-mode/phrases/a-frog-sat-on-a-log-eb3b9f.mp3 | A frog sat on a log. | 1 |
| /audio/child-mode/phrases/she-sang-and-danced-1fe917.mp3 | She sang and danced. | 1 |
| /audio/child-mode/phrases/it-is-too-cold-5699c6.mp3 | It is too cold. | 1 |
| /audio/child-mode/phrases/they-ran-and-hid-198deb.mp3 | They ran and hid. | 1 |
| /audio/child-mode/phrases/my-hat-fell-in-the-mud-111ba2.mp3 | My hat fell in the mud. | 1 |
| /audio/child-mode/phrases/sit-down-and-rest-up-dea1ee.mp3 | Sit down and rest up. | 1 |
| /audio/child-mode/phrases/it-was-so-loud-6ba673.mp3 | It was so loud. | 1 |
| /audio/child-mode/phrases/she-is-quite-quick-20dca6.mp3 | She is quite quick. | 1 |
| /audio/child-mode/phrases/he-will-not-stop-34c746.mp3 | He will not stop. | 1 |
| /audio/child-mode/phrases/the-bee-flew-to-the-rose-3bff53.mp3 | The bee flew to the rose. | 1 |
| /audio/child-mode/phrases/come-in-and-dry-off-9e3185.mp3 | Come in and dry off. | 1 |
| /audio/child-mode/phrases/hop-up-and-hold-on-c63aa8.mp3 | Hop up and hold on. | 1 |
| /audio/child-mode/phrases/it-got-very-dark-1ec5c3.mp3 | It got very dark. | 1 |
| /audio/child-mode/phrases/you-may-go-in-38fa9b.mp3 | You may go in. | 1 |
| /audio/child-mode/phrases/a-crab-hid-under-a-rock-ebee97.mp3 | A crab hid under a rock. | 1 |
| /audio/child-mode/phrases/the-hen-laid-an-egg-9576a0.mp3 | The hen laid an egg. | 1 |
| /audio/child-mode/phrases/duck-down-and-creep-in-c368a0.mp3 | Duck down and creep in. | 1 |
| /audio/child-mode/phrases/it-is-far-too-wet-af7f68.mp3 | It is far too wet. | 1 |
| /audio/child-mode/phrases/she-may-not-come-6fc874.mp3 | She may not come. | 1 |
| /audio/child-mode/phrases/spin-round-and-sit-down-16248c.mp3 | Spin round and sit down. | 1 |
| /audio/child-mode/phrases/he-was-not-there-46f4b3.mp3 | He was not there. | 1 |
| /audio/child-mode/phrases/you-can-all-go-51b06b.mp3 | You can all go. | 1 |
| /audio/child-mode/phrases/the-moth-flew-at-the-lamp-eaa055.mp3 | The moth flew at the lamp. | 1 |
| /audio/child-mode/phrases/child-feeling-unhappy-967c25.mp3 | child-feeling-unhappy | 1 |
| /audio/child-mode/phrases/two-children-unfair-share-d5c063.mp3 | two-children-unfair-share | 1 |
| /audio/child-mode/phrases/child-being-unkind-d6679a.mp3 | child-being-unkind | 1 |
| /audio/child-mode/phrases/sad-child-4ce725.mp3 | sad-child | 1 |
| /audio/child-mode/phrases/unfair-game-29d122.mp3 | unfair-game | 1 |
| /audio/child-mode/phrases/unkind-words-84d0e2.mp3 | unkind-words | 1 |
| /audio/child-mode/phrases/children-replay-game-835819.mp3 | children-replay-game | 1 |
| /audio/child-mode/phrases/child-remakes-model-c920db.mp3 | child-remakes-model | 1 |
| /audio/child-mode/phrases/child-rereads-book-e88d42.mp3 | child-rereads-book | 1 |
| /audio/child-mode/phrases/child-remakes-picture-6dab3b.mp3 | child-remakes-picture | 1 |
| /audio/child-mode/phrases/child-rereads-page-e894b3.mp3 | child-rereads-page | 1 |
| /audio/child-mode/phrases/children-replay-song-835ee9.mp3 | children-replay-song | 1 |
| /audio/child-mode/phrases/helpful-child-50c663.mp3 | helpful-child | 1 |
| /audio/child-mode/phrases/joyful-child-a70803.mp3 | joyful-child | 1 |
| /audio/child-mode/phrases/careful-child-carrying-glass-79cd8e.mp3 | careful-child-carrying-glass | 1 |
| /audio/child-mode/phrases/child-helping-friend-294f0f.mp3 | child-helping-friend | 1 |
| /audio/child-mode/phrases/child-smiling-with-joy-7fe858.mp3 | child-smiling-with-joy | 1 |
| /audio/child-mode/phrases/child-carefully-carrying-glass-b83c66.mp3 | child-carefully-carrying-glass | 1 |
| /audio/child-mode/phrases/child-feeling-hopeless-c69295.mp3 | child-feeling-hopeless | 1 |
| /audio/child-mode/phrases/fearless-child-b7b6f6.mp3 | fearless-child | 1 |
| /audio/child-mode/phrases/harmless-butterfly-25caca.mp3 | harmless-butterfly | 1 |
| /audio/child-mode/phrases/harmless-butterfly-on-hand-fb1cb6.mp3 | harmless-butterfly-on-hand | 1 |
| /audio/child-mode/phrases/child-trying-bravely-377b87.mp3 | child-trying-bravely | 1 |
| /audio/child-mode/phrases/team-feeling-hopeless-dfc047.mp3 | team-feeling-hopeless | 1 |
| /audio/child-mode/phrases/person-singing-e4fa9d.mp3 | person-singing | 1 |
| /audio/child-mode/phrases/teacher-with-class-14ed38.mp3 | teacher-with-class | 1 |
| /audio/child-mode/phrases/child-helper-cebdb5.mp3 | child-helper | 1 |
| /audio/child-mode/phrases/person-reading-to-class-4a4143.mp3 | person-reading-to-class | 1 |
| /audio/child-mode/phrases/person-painting-4c91b4.mp3 | person-painting | 1 |
| /audio/child-mode/phrases/farmer-on-farm-b38001.mp3 | farmer-on-farm | 1 |
| /audio/child-mode/phrases/in-a-brave-way-aeaf3c.mp3 | in a brave way | 1 |
| /audio/child-mode/phrases/a-brave-person-a7530b.mp3 | a brave person | 1 |
| /audio/child-mode/phrases/being-afraid-acb011.mp3 | being afraid | 1 |
| /audio/child-mode/phrases/in-a-proud-way-40c57b.mp3 | in a proud way | 1 |
| /audio/child-mode/phrases/a-proud-person-2c77d0.mp3 | a proud person | 1 |
| /audio/child-mode/phrases/the-best-test-d8ef95.mp3 | the best test | 1 |
| /audio/child-mode/phrases/a-look-before-6ed29f.mp3 | a look before | 1 |
| /audio/child-mode/phrases/a-test-after-af0295.mp3 | a test after | 1 |
| /audio/child-mode/phrases/order-after-it-is-out-73e5cc.mp3 | order after it is out | 1 |
| /audio/child-mode/phrases/heat-the-order-5f2060.mp3 | heat the order | 1 |
| /audio/child-mode/phrases/order-more-8a8b13.mp3 | order more | 1 |
| /audio/child-mode/phrases/order-before-it-is-out-7ffe66.mp3 | order before it is out | 1 |
| /audio/child-mode/phrases/unsafe-bridge-4111a9.mp3 | unsafe-bridge | 1 |
| /audio/child-mode/phrases/child-repaints-wall-aa5024.mp3 | child-repaints-wall | 1 |
| /audio/child-mode/phrases/hopeful-child-2346a2.mp3 | hopeful-child | 1 |
| /audio/child-mode/phrases/careless-spill-44140d.mp3 | careless-spill | 1 |
| /audio/child-mode/phrases/baker-with-bread-5cd949.mp3 | baker-with-bread | 1 |
| /audio/child-mode/phrases/child-rebuilds-block-tower-500f8d.mp3 | child-rebuilds-block-tower | 1 |
| /audio/child-mode/phrases/under-the-box-af36ba.mp3 | under the box | 1 |
| /audio/child-mode/phrases/behind-the-box-41f31c.mp3 | behind the box | 1 |
| /audio/child-mode/phrases/on-the-box-6728e6.mp3 | on the box | 1 |
| /audio/child-mode/phrases/on-the-barn-4c4580.mp3 | on the barn | 1 |
| /audio/child-mode/phrases/behind-the-barn-805673.mp3 | behind the barn | 1 |
| /audio/child-mode/phrases/under-the-barn-960dc8.mp3 | under the barn | 1 |
| /audio/child-mode/phrases/in-the-barn-2c1940.mp3 | in the barn | 1 |
| /audio/child-mode/phrases/in-the-chair-af56ff.mp3 | in the chair | 1 |
| /audio/child-mode/phrases/behind-the-chair-8b3a94.mp3 | behind the chair | 1 |
| /audio/child-mode/phrases/on-the-roof-4c4e81.mp3 | on the roof | 1 |
| /audio/child-mode/phrases/in-the-roof-2c2241.mp3 | in the roof | 1 |
| /audio/child-mode/phrases/under-the-roof-9616c9.mp3 | under the roof | 1 |
| /audio/child-mode/phrases/behind-the-roof-805f75.mp3 | behind the roof | 1 |
| /audio/child-mode/phrases/in-the-table-b086cd.mp3 | in the table | 1 |
| /audio/child-mode/phrases/next-to-the-table-a7feef.mp3 | next to the table | 1 |
| /audio/child-mode/phrases/on-the-table-d63afe.mp3 | on the table | 1 |
| /audio/child-mode/phrases/next-to-the-bed-eac2d1.mp3 | next to the bed | 1 |
| /audio/child-mode/phrases/under-the-bed-af36b8.mp3 | under the bed | 1 |
| /audio/child-mode/phrases/on-the-bed-6728e5.mp3 | on the bed | 1 |
| /audio/child-mode/phrases/behind-the-bed-41f31b.mp3 | behind the bed | 1 |
| /audio/child-mode/phrases/behind-the-tree-806099.mp3 | behind the tree | 1 |
| /audio/child-mode/phrases/in-front-of-the-tree-ac9547.mp3 | in front of the tree | 1 |
| /audio/child-mode/phrases/in-the-tree-2c2366.mp3 | in the tree | 2 |
| /audio/child-mode/phrases/above-the-curtain-c0419d.mp3 | above the curtain | 1 |
| /audio/child-mode/phrases/next-to-the-curtain-b6a686.mp3 | next to the curtain | 1 |
| /audio/child-mode/phrases/in-front-of-the-curtain-f2d20f.mp3 | in front of the curtain | 1 |
| /audio/child-mode/phrases/under-the-basket-50a072.mp3 | under the basket | 1 |
| /audio/child-mode/phrases/behind-the-basket-efc341.mp3 | behind the basket | 1 |
| /audio/child-mode/phrases/next-to-the-basket-7de948.mp3 | next to the basket | 1 |
| /audio/child-mode/phrases/in-the-basket-976cfd.mp3 | in the basket | 1 |
| /audio/child-mode/phrases/under-the-plate-58c9e0.mp3 | under the plate | 1 |
| /audio/child-mode/phrases/behind-the-plate-8c2806.mp3 | behind the plate | 1 |
| /audio/child-mode/phrases/on-the-plate-d5f8a1.mp3 | on the plate | 1 |
| /audio/child-mode/phrases/next-to-the-plate-a7bc92.mp3 | next to the plate | 1 |
| /audio/child-mode/phrases/between-the-books-ea2bda.mp3 | between the books | 1 |
| /audio/child-mode/phrases/on-the-books-d4fd29.mp3 | on the books | 1 |
| /audio/child-mode/phrases/under-the-books-57ce69.mp3 | under the books | 1 |
| /audio/child-mode/phrases/behind-the-books-8b2c8e.mp3 | behind the books | 1 |
| /audio/child-mode/phrases/between-the-pillows-4c0646.mp3 | between the pillows | 1 |
| /audio/child-mode/phrases/on-the-pillows-3068b6.mp3 | on the pillows | 1 |
| /audio/child-mode/phrases/under-the-pillows-ac8972.mp3 | under the pillows | 1 |
| /audio/child-mode/phrases/behind-the-pillows-30061a.mp3 | behind the pillows | 1 |
| /audio/child-mode/phrases/on-the-bear-4c458f.mp3 | on the bear | 1 |
| /audio/child-mode/phrases/under-the-bear-960dd6.mp3 | under the bear | 1 |
| /audio/child-mode/phrases/in-front-of-the-bear-ac8b30.mp3 | in front of the bear | 1 |
| /audio/child-mode/phrases/behind-the-bear-805682.mp3 | behind the bear | 1 |
| /audio/child-mode/phrases/inside-the-garage-888e8e.mp3 | inside the garage | 1 |
| /audio/child-mode/phrases/in-front-of-the-garage-7842ac.mp3 | in front of the garage | 1 |
| /audio/child-mode/phrases/behind-the-garage-fb6c56.mp3 | behind the garage | 1 |
| /audio/child-mode/phrases/above-the-garage-157fca.mp3 | above the garage | 1 |
| /audio/child-mode/phrases/under-the-tree-9617ed.mp3 | under the tree | 1 |
| /audio/child-mode/phrases/next-to-the-tree-43270a.mp3 | next to the tree | 1 |
| /audio/child-mode/phrases/behind-the-door-8057c7.mp3 | behind the door | 1 |
| /audio/child-mode/phrases/in-the-door-2c1a94.mp3 | in the door | 1 |
| /audio/child-mode/phrases/above-the-door-fda9d7.mp3 | above the door | 1 |
| /audio/child-mode/phrases/under-the-door-960f1b.mp3 | under the door | 1 |
| /audio/child-mode/phrases/behind-the-bird-805695.mp3 | behind the bird | 1 |
| /audio/child-mode/phrases/next-to-the-bird-431d06.mp3 | next to the bird | 1 |
| /audio/child-mode/phrases/below-the-bird-376122.mp3 | below the bird | 1 |
| /audio/child-mode/phrases/above-the-bird-fda8a5.mp3 | above the bird | 1 |
| /audio/child-mode/phrases/above-the-bridge-b04bd0.mp3 | above the bridge | 1 |
| /audio/child-mode/phrases/behind-the-bridge-f0f148.mp3 | behind the bridge | 1 |
| /audio/child-mode/phrases/on-the-bridge-74d53e.mp3 | on the bridge | 1 |
| /audio/child-mode/phrases/below-the-bridge-94d2cd.mp3 | below the bridge | 1 |
| /audio/child-mode/phrases/on-the-ball-4c457f.mp3 | on the ball | 1 |
| /audio/child-mode/phrases/in-the-ball-2c193f.mp3 | in the ball | 1 |
| /audio/child-mode/phrases/behind-the-ball-805673.mp3 | behind the ball | 1 |
| /audio/child-mode/phrases/under-the-ball-960dc7.mp3 | under the ball | 1 |
| /audio/child-mode/phrases/next-to-the-cup-eac2d7.mp3 | next to the cup | 1 |
| /audio/child-mode/phrases/in-the-cup-4ee984.mp3 | in the cup | 1 |
| /audio/child-mode/phrases/under-the-cup-af36bf.mp3 | under the cup | 1 |
| /audio/child-mode/phrases/above-the-cup-45bf50.mp3 | above the cup | 1 |
| /audio/child-mode/phrases/the-gardener-26d0b2.mp3 | the gardener | 1 |
| /audio/child-mode/phrases/the-twins-67136f.mp3 | the twins | 3 |
| /audio/child-mode/phrases/nobody-did-37c5c8.mp3 | nobody did | 1 |
| /audio/child-mode/phrases/granny-bola-8c746e.mp3 | Granny Bola | 1 |
| /audio/child-mode/phrases/a-balloon-ff6d15.mp3 | a balloon | 1 |
| /audio/child-mode/phrases/a-green-sticker-10ef32.mp3 | a green sticker | 1 |
| /audio/child-mode/phrases/a-new-toothbrush-9c1f23.mp3 | a new toothbrush | 1 |
| /audio/child-mode/phrases/the-radio-66e318.mp3 | the radio | 1 |
| /audio/child-mode/phrases/the-postlady-ae4ad0.mp3 | the postlady | 1 |
| /audio/child-mode/phrases/the-milkman-3e6278.mp3 | the milkman | 1 |
| /audio/child-mode/phrases/a-blackbird-51cd2f.mp3 | a blackbird | 1 |
| /audio/child-mode/phrases/dinner-plates-6318d8.mp3 | dinner plates | 1 |
| /audio/child-mode/phrases/story-books-1436b3.mp3 | story books | 1 |
| /audio/child-mode/phrases/shoe-boxes-7a119e.mp3 | shoe boxes | 1 |
| /audio/child-mode/phrases/the-soup-bd4d7d.mp3 | the soup | 1 |
| /audio/child-mode/phrases/his-hand-17d3b3.mp3 | his hand | 1 |
| /audio/child-mode/phrases/the-kettle-33435d.mp3 | the kettle | 1 |
| /audio/child-mode/phrases/the-toast-670eeb.mp3 | the toast | 1 |
| /audio/child-mode/phrases/a-decorator-7b69ed.mp3 | a decorator | 1 |
| /audio/child-mode/phrases/the-neighbours-aacce7.mp3 | the neighbours | 1 |
| /audio/child-mode/phrases/their-dad-110808.mp3 | their dad | 1 |
| /audio/child-mode/phrases/a-garden-glove-8ea22d.mp3 | a garden glove | 1 |
| /audio/child-mode/phrases/a-shiny-bottle-top-f85383.mp3 | a shiny bottle top | 1 |
| /audio/child-mode/phrases/a-slice-of-bread-1d4573.mp3 | a slice of bread | 1 |
| /audio/child-mode/phrases/a-silver-ring-a565ca.mp3 | a silver ring | 1 |
| /audio/child-mode/phrases/folded-card-879e9d.mp3 | folded card | 1 |
| /audio/child-mode/phrases/sticky-tape-16b493.mp3 | sticky tape | 1 |
| /audio/child-mode/phrases/a-hammer-999df8.mp3 | a hammer | 1 |
| /audio/child-mode/phrases/on-saturdays-a53119.mp3 | on Saturdays | 1 |
| /audio/child-mode/phrases/every-tuesday-a9673a.mp3 | every Tuesday | 1 |
| /audio/child-mode/phrases/every-morning-20c0cd.mp3 | every morning | 1 |
| /audio/child-mode/phrases/on-his-head-a6d554.mp3 | on his head | 1 |
| /audio/child-mode/phrases/in-the-fruit-bowl-871803.mp3 | in the fruit bowl | 1 |
| /audio/child-mode/phrases/on-his-desk-a6d325.mp3 | on his desk | 1 |
| /audio/child-mode/phrases/in-the-car-4ee982.mp3 | in the car | 1 |
| /audio/child-mode/phrases/behind-a-rock-d09f24.mp3 | behind a rock | 1 |
| /audio/child-mode/phrases/in-the-reeds-b064da.mp3 | in the reeds | 1 |
| /audio/child-mode/phrases/on-the-bank-4c457f.mp3 | on the bank | 1 |
| /audio/child-mode/phrases/under-the-biggest-lily-pad-bf6acb.mp3 | under the biggest lily pad | 1 |
| /audio/child-mode/phrases/at-bedtime-7903f2.mp3 | at bedtime | 1 |
| /audio/child-mode/phrases/in-the-morning-f4652b.mp3 | in the morning | 1 |
| /audio/child-mode/phrases/straight-after-lunch-c08fc3.mp3 | straight after lunch | 1 |
| /audio/child-mode/phrases/by-the-front-door-c4c03e.mp3 | by the front door | 1 |
| /audio/child-mode/phrases/under-a-cover-50b83f.mp3 | under a cover | 1 |
| /audio/child-mode/phrases/behind-the-recycling-bins-64bed3.mp3 | behind the recycling bins | 1 |
| /audio/child-mode/phrases/inside-the-shed-4416ce.mp3 | inside the shed | 1 |
| /audio/child-mode/phrases/at-seven-3507f6.mp3 | at seven | 1 |
| /audio/child-mode/phrases/after-school-b9bfc3.mp3 | after school | 1 |
| /audio/child-mode/phrases/at-nine-3fa83a.mp3 | at nine | 1 |
| /audio/child-mode/phrases/in-the-deckchair-by-the-roses-e480ca.mp3 | in the deckchair by the roses | 1 |
| /audio/child-mode/phrases/on-the-sofa-4c4f0c.mp3 | on the sofa | 1 |
| /audio/child-mode/phrases/in-the-hammock-527ed3.mp3 | in the hammock | 1 |
| /audio/child-mode/phrases/at-the-kitchen-table-67a688.mp3 | at the kitchen table | 1 |
| /audio/child-mode/phrases/under-the-car-af36bc.mp3 | under the car | 1 |
| /audio/child-mode/phrases/up-a-tree-fd9ee1.mp3 | up a tree | 1 |
| /audio/child-mode/phrases/next-door-5becc6.mp3 | next door | 1 |
| /audio/child-mode/phrases/in-the-airing-cupboard-b03604.mp3 | in the airing cupboard | 1 |
| /audio/child-mode/phrases/a-girl-paints-a-picture-of-rain-dd424f.mp3 | A girl paints a picture of rain. | 1 |
| /audio/child-mode/phrases/a-girl-in-wellies-jumps-over-a-puddle-4373ad.mp3 | A girl in wellies jumps over a puddle. | 1 |
| /audio/child-mode/phrases/a-girl-sleeps-in-her-warm-bed-646e4e.mp3 | A girl sleeps in her warm bed. | 1 |
| /audio/child-mode/phrases/a-boy-in-wellies-fills-a-puddle-22b8be.mp3 | A boy in wellies fills a puddle. | 1 |
| /audio/child-mode/phrases/two-boys-carry-a-ladder-past-the-bakery-785d08.mp3 | Two boys carry a ladder past the bakery. | 1 |
| /audio/child-mode/phrases/two-boys-buy-buns-at-the-bakery-7b36e4.mp3 | Two boys buy buns at the bakery. | 1 |
| /audio/child-mode/phrases/one-boy-climbs-a-ladder-at-home-7be26b.mp3 | One boy climbs a ladder at home. | 1 |
| /audio/child-mode/phrases/two-bakers-carry-a-table-f4435b.mp3 | Two bakers carry a table. | 1 |
| /audio/child-mode/phrases/a-cat-plays-with-a-ball-of-wool-f6261d.mp3 | A cat plays with a ball of wool. | 1 |
| /audio/child-mode/phrases/a-cat-sleeps-inside-an-open-umbrella-f21b11.mp3 | A cat sleeps inside an open umbrella. | 1 |
| /audio/child-mode/phrases/a-cat-hides-from-the-rain-indoors-46f9f2.mp3 | A cat hides from the rain indoors. | 1 |
| /audio/child-mode/phrases/a-dog-sleeps-under-an-umbrella-2da532.mp3 | A dog sleeps under an umbrella. | 1 |
| /audio/child-mode/phrases/two-children-fly-two-kites-281858.mp3 | Two children fly two kites. | 1 |
| /audio/child-mode/phrases/grandad-reads-about-kites-fc2e18.mp3 | Grandad reads about kites. | 1 |
| /audio/child-mode/phrases/grandad-and-a-child-fly-a-red-kite-970a68.mp3 | Grandad and a child fly a red kite. | 1 |
| /audio/child-mode/phrases/grandad-buys-a-child-a-red-ball-b1563a.mp3 | Grandad buys a child a red ball. | 1 |
| /audio/child-mode/phrases/someone-irons-a-red-shirt-80ad37.mp3 | Someone irons a red shirt. | 1 |
| /audio/child-mode/phrases/one-red-sock-falls-from-the-washing-line-f765f3.mp3 | One red sock falls from the washing line. | 1 |
| /audio/child-mode/phrases/a-red-sock-hangs-safely-on-the-line-1b35a6.mp3 | A red sock hangs safely on the line. | 1 |
| /audio/child-mode/phrases/the-empty-line-swings-in-the-wind-c3b3a8.mp3 | The empty line swings in the wind. | 1 |
| /audio/child-mode/phrases/an-ice-cream-van-drives-past-a-farm-462646.mp3 | An ice-cream van drives past a farm. | 1 |
| /audio/child-mode/phrases/one-duck-swims-away-from-a-boat-795334.mp3 | One duck swims away from a boat. | 1 |
| /audio/child-mode/phrases/three-ducks-wait-in-line-at-the-ice-cream-va-e90f0f.mp3 | Three ducks wait in line at the ice-cream van. | 1 |
| /audio/child-mode/phrases/three-children-feed-ducks-at-the-pond-7f0eb2.mp3 | Three children feed ducks at the pond. | 1 |
| /audio/child-mode/phrases/a-boy-eats-a-small-spoon-of-jelly-1fd060.mp3 | A boy eats a small spoon of jelly. | 1 |
| /audio/child-mode/phrases/a-chef-drops-a-tall-cake-142111.mp3 | A chef drops a tall cake. | 1 |
| /audio/child-mode/phrases/a-boy-washes-a-tall-glass-cb6ac9.mp3 | A boy washes a tall glass. | 1 |
| /audio/child-mode/phrases/a-boy-holds-up-a-giant-wobbly-jelly-19e976.mp3 | A boy holds up a giant wobbly jelly. | 1 |
| /audio/child-mode/phrases/a-child-wears-sunglasses-at-the-beach-121371.mp3 | A child wears sunglasses at the beach. | 1 |
| /audio/child-mode/phrases/a-snowman-wears-a-woolly-scarf-at-night-b33d4b.mp3 | A snowman wears a woolly scarf at night. | 1 |
| /audio/child-mode/phrases/a-snowman-wears-sunglasses-in-the-sunshine-143270.mp3 | A snowman wears sunglasses in the sunshine. | 1 |
| /audio/child-mode/phrases/a-snowman-melts-away-in-the-rain-7207c3.mp3 | A snowman melts away in the rain. | 1 |
| /audio/child-mode/phrases/tiptoed-past-the-dog-1be6b4.mp3 | tiptoed past the dog | 1 |
| /audio/child-mode/phrases/woke-the-dog-up-46737d.mp3 | woke the dog up | 1 |
| /audio/child-mode/phrases/fed-the-dog-8a8efa.mp3 | fed the dog | 1 |
| /audio/child-mode/phrases/ran-to-the-park-fb492a.mp3 | ran to the park | 1 |
| /audio/child-mode/phrases/dropped-six-plates-88e60c.mp3 | dropped six plates | 1 |
| /audio/child-mode/phrases/wrote-down-an-order-e6c1e4.mp3 | wrote down an order | 1 |
| /audio/child-mode/phrases/balanced-six-plates-on-one-arm-2ab980.mp3 | balanced six plates on one arm | 1 |
| /audio/child-mode/phrases/planted-a-lemon-tree-c45104.mp3 | planted a lemon tree | 1 |
| /audio/child-mode/phrases/drank-the-lemonade-d1631a.mp3 | drank the lemonade | 1 |
| /audio/child-mode/phrases/bought-some-oranges-bb9a8d.mp3 | bought some oranges | 1 |
| /audio/child-mode/phrases/squeezed-lemons-1c0a9c.mp3 | squeezed lemons | 1 |
| /audio/child-mode/phrases/blew-the-whistle-26e3ff.mp3 | blew the whistle | 1 |
| /audio/child-mode/phrases/tipped-the-ball-over-the-bar-1f4826.mp3 | tipped the ball over the bar | 1 |
| /audio/child-mode/phrases/let-the-ball-in-e2a84b.mp3 | let the ball in | 1 |
| /audio/child-mode/phrases/scored-a-goal-658a19.mp3 | scored a goal | 1 |
| /audio/child-mode/phrases/mended-the-map-with-tape-2ceac4.mp3 | mended the map with tape | 1 |
| /audio/child-mode/phrases/tore-the-map-in-half-34f4d7.mp3 | tore the map in half | 1 |
| /audio/child-mode/phrases/drew-a-new-map-c3a516.mp3 | drew a new map | 1 |
| /audio/child-mode/phrases/folded-the-map-away-694197.mp3 | folded the map away | 1 |
| /audio/child-mode/phrases/copied-grandpa-s-cough-24d735.mp3 | copied Grandpa's cough | 1 |
| /audio/child-mode/phrases/sang-a-sailor-song-d1973c.mp3 | sang a sailor song | 1 |
| /audio/child-mode/phrases/flew-out-the-window-c83058.mp3 | flew out the window | 1 |
| /audio/child-mode/phrases/slept-on-its-perch-107602.mp3 | slept on its perch | 1 |
| /audio/child-mode/phrases/shovelled-the-path-f0946f.mp3 | shovelled the path | 1 |
| /audio/child-mode/phrases/stayed-indoors-71e4f3.mp3 | stayed indoors | 1 |
| /audio/child-mode/phrases/rolled-a-huge-snowball-82cc17.mp3 | rolled a huge snowball | 1 |
| /audio/child-mode/phrases/threw-a-small-snowball-afeafb.mp3 | threw a small snowball | 1 |
| /audio/child-mode/phrases/mended-the-cover-2f9f46.mp3 | mended the cover | 1 |
| /audio/child-mode/phrases/stamped-the-wrong-date-c5f945.mp3 | stamped the wrong date | 1 |
| /audio/child-mode/phrases/lost-the-book-b12703.mp3 | lost the book | 1 |
| /audio/child-mode/phrases/read-the-book-aloud-c5ff39.mp3 | read the book aloud | 1 |
| /audio/child-mode/phrases/they-liked-climbing-stairs-e93b57.mp3 | they liked climbing stairs | 1 |
| /audio/child-mode/phrases/the-lift-was-full-ee1d4f.mp3 | the lift was full | 1 |
| /audio/child-mode/phrases/the-lift-was-out-of-order-d77c28.mp3 | the lift was out of order | 1 |
| /audio/child-mode/phrases/the-stairs-were-quicker-f46779.mp3 | the stairs were quicker | 1 |
| /audio/child-mode/phrases/rosa-s-own-feet-were-enormous-e8dc2f.mp3 | Rosa's own feet were enormous | 1 |
| /audio/child-mode/phrases/the-mud-made-the-footprints-deep-1f8822.mp3 | the mud made the footprints deep | 1 |
| /audio/child-mode/phrases/a-giant-walked-down-the-road-f9f21f.mp3 | a giant walked down the road | 1 |
| /audio/child-mode/phrases/the-boots-were-far-too-big-for-her-f3a3d6.mp3 | the boots were far too big for her | 1 |
| /audio/child-mode/phrases/they-did-not-mind-thanks-to-the-cake-b5df14.mp3 | they did not mind, thanks to the cake | 1 |
| /audio/child-mode/phrases/they-were-very-cross-348f80.mp3 | they were very cross | 1 |
| /audio/child-mode/phrases/they-cancelled-the-picnic-straight-away-b50e0a.mp3 | they cancelled the picnic straight away | 1 |
| /audio/child-mode/phrases/they-forgot-the-cake-214b3d.mp3 | they forgot the cake | 1 |
| /audio/child-mode/phrases/the-beach-was-closing-for-winter-e7df68.mp3 | the beach was closing for winter | 1 |
| /audio/child-mode/phrases/a-race-was-starting-631847.mp3 | a race was starting | 1 |
| /audio/child-mode/phrases/the-calm-sea-was-safe-c39efe.mp3 | the calm sea was safe | 1 |
| /audio/child-mode/phrases/the-sea-was-not-as-safe-as-it-looked-b9d77b.mp3 | the sea was not as safe as it looked | 1 |
| /audio/child-mode/phrases/to-buy-a-plant-for-mum-s-birthday-9492a6.mp3 | to buy a plant for Mum's birthday | 1 |
| /audio/child-mode/phrases/to-buy-his-own-birthday-plant-d11f42.mp3 | to buy his own birthday plant | 1 |
| /audio/child-mode/phrases/to-ride-the-bus-every-month-b35386.mp3 | to ride the bus every month | 1 |
| /audio/child-mode/phrases/because-he-lost-his-money-ca3462.mp3 | because he lost his money | 1 |
| /audio/child-mode/phrases/because-the-bench-was-new-e2b2db.mp3 | because the bench was new | 1 |
| /audio/child-mode/phrases/to-warn-that-the-paint-was-wet-937b59.mp3 | to warn that the paint was wet | 1 |
| /audio/child-mode/phrases/to-celebrate-a-holiday-46b30e.mp3 | to celebrate a holiday | 1 |
| /audio/child-mode/phrases/because-a-race-finished-there-3d4869.mp3 | because a race finished there | 1 |
| /audio/child-mode/phrases/played-striker-55eb48.mp3 | played striker | 1 |
| /audio/child-mode/phrases/played-in-goal-405913.mp3 | played in goal | 1 |
| /audio/child-mode/phrases/watched-from-the-bench-fad005.mp3 | watched from the bench | 1 |
| /audio/child-mode/phrases/refereed-the-match-ade59e.mp3 | refereed the match | 1 |
| /audio/child-mode/phrases/nobody-was-hungry-9ddab6.mp3 | nobody was hungry | 1 |
| /audio/child-mode/phrases/it-was-being-saved-for-the-fair-d6f489.mp3 | it was being saved for the fair | 1 |
| /audio/child-mode/phrases/it-smelled-bad-1d8ca8.mp3 | it smelled bad | 1 |
| /audio/child-mode/phrases/it-was-burnt-black-b3f9a5.mp3 | it was burnt black | 1 |
| /audio/child-mode/phrases/the-neighbour-33b8a2.mp3 | the neighbour | 1 |
| /audio/child-mode/phrases/the-painter-127363.mp3 | the painter | 1 |
| /audio/child-mode/phrases/a-ferry-80a4d0.mp3 | a ferry | 1 |
| /audio/child-mode/phrases/the-harbour-master-f97ad7.mp3 | the harbour master | 1 |
| /audio/child-mode/phrases/the-fishing-boat-2bac48.mp3 | the fishing boat | 1 |
| /audio/child-mode/phrases/the-seagull-222267.mp3 | the seagull | 1 |
| /audio/child-mode/phrases/the-teacher-s-7d7e67.mp3 | the teacher's | 1 |
| /audio/child-mode/phrases/their-mother-eebd06.mp3 | their mother | 2 |
| /audio/child-mode/phrases/a-grandparent-d8f87d.mp3 | a grandparent | 1 |
| /audio/child-mode/phrases/auntie-vee-db0dba.mp3 | Auntie Vee | 1 |
| /audio/child-mode/phrases/the-cactus-204865.mp3 | the cactus | 1 |
| /audio/child-mode/phrases/the-shelf-66f90c.mp3 | the shelf | 1 |
| /audio/child-mode/phrases/a-sunflower-4c2f2f.mp3 | a sunflower | 1 |
| /audio/child-mode/phrases/the-seedling-4f8052.mp3 | the seedling | 1 |
| /audio/child-mode/phrases/her-dad-3d237f.mp3 | her dad | 1 |
| /audio/child-mode/phrases/a-toymaker-ddbd72.mp3 | a toymaker | 1 |
| /audio/child-mode/phrases/the-visitors-6935f4.mp3 | the visitors | 1 |
| /audio/child-mode/phrases/the-keepers-9a9d4e.mp3 | the keepers | 1 |
| /audio/child-mode/phrases/the-seals-66f755.mp3 | the seals | 1 |
| /audio/child-mode/phrases/the-penguins-9ff47a.mp3 | the penguins | 1 |
| /audio/child-mode/phrases/both-of-them-e9845e.mp3 | both of them | 2 |
| /audio/child-mode/phrases/neither-of-them-5cdb1c.mp3 | neither of them | 1 |
| /audio/child-mode/phrases/the-puppet-show-sold-out-before-lunch-8d632e.mp3 | The puppet show sold out before lunch. | 1 |
| /audio/child-mode/phrases/the-puppet-show-was-cancelled-at-lunch-8e8ac9.mp3 | The puppet show was cancelled at lunch. | 1 |
| /audio/child-mode/phrases/many-tickets-were-left-after-lunch-fd94a8.mp3 | Many tickets were left after lunch. | 1 |
| /audio/child-mode/phrases/the-puppets-had-their-lunch-771479.mp3 | The puppets had their lunch. | 1 |
| /audio/child-mode/phrases/ravi-walks-to-the-pool-asleep-12a5ad.mp3 | Ravi walks to the pool asleep. | 1 |
| /audio/child-mode/phrases/ravi-knows-the-route-extremely-well-5e051b.mp3 | Ravi knows the route extremely well. | 1 |
| /audio/child-mode/phrases/ravi-swims-with-his-eyes-shut-bd3be8.mp3 | Ravi swims with his eyes shut. | 1 |
| /audio/child-mode/phrases/ravi-keeps-getting-lost-17f266.mp3 | Ravi keeps getting lost. | 1 |
| /audio/child-mode/phrases/everyone-stood-up-before-the-match-ended-2d23ee.mp3 | Everyone stood up before the match ended. | 1 |
| /audio/child-mode/phrases/everyone-left-before-the-match-ended-a6793d.mp3 | Everyone left before the match ended. | 1 |
| /audio/child-mode/phrases/the-class-sat-quietly-to-the-end-acdc5f.mp3 | The class sat quietly to the end. | 1 |
| /audio/child-mode/phrases/the-referee-lost-the-whistle-e2e012.mp3 | The referee lost the whistle. | 1 |
| /audio/child-mode/phrases/dad-dislikes-gran-s-soup-709197.mp3 | Dad dislikes Gran's soup. | 1 |
| /audio/child-mode/phrases/dad-says-gran-s-soup-smells-very-strong-35d6cb.mp3 | Dad says Gran's soup smells very strong. | 1 |
| /audio/child-mode/phrases/gran-s-soup-is-always-cold-e0f67f.mp3 | Gran's soup is always cold. | 1 |
| /audio/child-mode/phrases/gran-cooks-while-the-street-sleeps-1faeb2.mp3 | Gran cooks while the street sleeps. | 1 |
| /audio/child-mode/phrases/omar-waited-calmly-and-quietly-for-the-bus-9bf4b9.mp3 | Omar waited calmly and quietly for the bus. | 1 |
| /audio/child-mode/phrases/the-bus-never-appeared-at-all-c30c15.mp3 | The bus never appeared at all. | 1 |
| /audio/child-mode/phrases/omar-had-stopped-being-patient-before-the-bu-957c46.mp3 | Omar had stopped being patient before the bus came. | 1 |
| /audio/child-mode/phrases/omar-ran-after-the-bus-56f0e6.mp3 | Omar ran after the bus. | 1 |
| /audio/child-mode/phrases/the-house-needed-new-carpets-6a96ac.mp3 | The house needed new carpets. | 1 |
| /audio/child-mode/phrases/the-puppy-chewed-all-the-shoes-2650e1.mp3 | The puppy chewed all the shoes. | 1 |
| /audio/child-mode/phrases/the-puppy-fetched-shoes-politely-5f5c24.mp3 | The puppy fetched shoes politely. | 1 |
| /audio/child-mode/phrases/the-puppy-had-its-own-toys-209931.mp3 | The puppy had its own toys. | 1 |
| /audio/child-mode/phrases/lila-forgot-the-secret-by-friday-82c9ea.mp3 | Lila forgot the secret by Friday. | 1 |
| /audio/child-mode/phrases/lila-finished-her-work-on-friday-e2f9f8.mp3 | Lila finished her work on Friday. | 1 |
| /audio/child-mode/phrases/lila-found-it-hard-not-to-tell-the-secret-608175.mp3 | Lila found it hard not to tell the secret. | 1 |
| /audio/child-mode/phrases/lila-told-the-secret-on-monday-d07892.mp3 | Lila told the secret on Monday. | 1 |
| /audio/child-mode/phrases/popcorn-spilled-onto-the-trampoline-c87313.mp3 | Popcorn spilled onto the trampoline. | 1 |
| /audio/child-mode/phrases/the-trampoline-blew-away-in-the-storm-ca22aa.mp3 | The trampoline blew away in the storm. | 1 |
| /audio/child-mode/phrases/the-children-made-popcorn-indoors-ed5275.mp3 | The children made popcorn indoors. | 1 |
| /audio/child-mode/phrases/hailstones-bounced-all-over-the-trampoline-e13fa4.mp3 | Hailstones bounced all over the trampoline. | 1 |
| /audio/child-mode/phrases/next-door-s-gardener-7bd2fb.mp3 | next door's gardener | 1 |
| /audio/child-mode/phrases/nobody-this-year-ef26d4.mp3 | nobody this year | 1 |
| /audio/child-mode/phrases/auntie-meg-db0d94.mp3 | Auntie Meg | 1 |
| /audio/child-mode/phrases/the-judge-665d4b.mp3 | the judge | 1 |
| /audio/child-mode/phrases/all-day-32335f.mp3 | all day | 1 |
| /audio/child-mode/phrases/on-mondays-be25e4.mp3 | on Mondays | 1 |
| /audio/child-mode/phrases/at-night-34af6e.mp3 | at night | 1 |
| /audio/child-mode/phrases/a-small-dog-leads-a-tall-man-down-the-street-546f08.mp3 | A small dog leads a tall man down the street. | 1 |
| /audio/child-mode/phrases/a-tall-man-carries-a-small-dog-643df4.mp3 | A tall man carries a small dog. | 1 |
| /audio/child-mode/phrases/two-dogs-chase-a-ball-7bf706.mp3 | Two dogs chase a ball. | 1 |
| /audio/child-mode/phrases/a-man-buys-a-dog-lead-7fdd9d.mp3 | A man buys a dog lead. | 1 |
| /audio/child-mode/phrases/counted-his-money-a2f3fc.mp3 | counted his money | 1 |
| /audio/child-mode/phrases/hid-a-coin-in-one-bun-ca0f89.mp3 | hid a coin in one bun | 1 |
| /audio/child-mode/phrases/ate-a-hundred-buns-4c0e12.mp3 | ate a hundred buns | 1 |
| /audio/child-mode/phrases/dropped-the-tray-102048.mp3 | dropped the tray | 1 |
| /audio/child-mode/phrases/the-vet-def2e0.mp3 | the vet | 1 |
| /audio/child-mode/phrases/the-parrot-learned-alone-88af9a.mp3 | the parrot learned alone | 1 |
| /audio/child-mode/phrases/in-the-wardrobe-853d8a.mp3 | in the wardrobe | 1 |
| /audio/child-mode/phrases/at-school-d5db12.mp3 | at school | 1 |
| /audio/child-mode/phrases/in-the-wash-2c24c4.mp3 | in the wash | 1 |
| /audio/child-mode/phrases/in-the-drawer-under-the-bed-bc0bff.mp3 | in the drawer under the bed | 1 |
| /audio/child-mode/phrases/the-family-fell-asleep-before-the-film-ended-402fb1.mp3 | The family fell asleep before the film ended. | 1 |
| /audio/child-mode/phrases/the-family-cheers-at-the-film-s-ending-db2f07.mp3 | The family cheers at the film's ending. | 1 |
| /audio/child-mode/phrases/the-family-queues-for-cinema-tickets-b82bd7.mp3 | The family queues for cinema tickets. | 1 |
| /audio/child-mode/phrases/one-child-watches-cartoons-at-breakfast-d19229.mp3 | One child watches cartoons at breakfast. | 1 |
| /audio/child-mode/phrases/bought-a-new-football-27975d.mp3 | bought a new football | 1 |
| /audio/child-mode/phrases/got-the-ball-down-with-a-mop-41d271.mp3 | got the ball down with a mop | 1 |
| /audio/child-mode/phrases/threw-the-ball-onto-the-roof-df41e4.mp3 | threw the ball onto the roof | 1 |
| /audio/child-mode/phrases/cleaned-the-classroom-floor-c99b32.mp3 | cleaned the classroom floor | 1 |
| /audio/child-mode/phrases/the-wind-blew-them-out-8d8db2.mp3 | the wind blew them out | 1 |
| /audio/child-mode/phrases/they-burned-down-to-stubs-81d695.mp3 | they burned down to stubs | 1 |
| /audio/child-mode/phrases/the-party-started-again-a31789.mp3 | the party started again | 1 |
| /audio/child-mode/phrases/the-baby-kept-blowing-them-out-22af0e.mp3 | the baby kept blowing them out | 1 |
| /audio/child-mode/phrases/the-dumplings-made-the-long-wait-worthwhile-31d740.mp3 | the dumplings made the long wait worthwhile | 1 |
| /audio/child-mode/phrases/the-queue-was-far-too-long-to-bother-ced39d.mp3 | the queue was far too long to bother | 1 |
| /audio/child-mode/phrases/the-dumplings-were-disappointing-ddd286.mp3 | the dumplings were disappointing | 1 |
| /audio/child-mode/phrases/the-square-was-too-crowded-to-visit-52e86f.mp3 | the square was too crowded to visit | 1 |
| /audio/child-mode/phrases/her-little-brother-c52962.mp3 | her little brother | 1 |
| /audio/child-mode/phrases/the-players-2b9128.mp3 | the players | 1 |
| /audio/child-mode/phrases/the-groundskeeper-1ef3f3.mp3 | the groundskeeper | 1 |
| /audio/child-mode/phrases/the-parents-131138.mp3 | the parents | 1 |
| /audio/child-mode/phrases/the-coach-65db48.mp3 | the coach | 1 |
| /audio/child-mode/phrases/the-sandcastle-survived-until-dark-343fcc.mp3 | The sandcastle survived until dark. | 1 |
| /audio/child-mode/phrases/someone-ate-tea-on-the-sandcastle-c85ae4.mp3 | Someone ate tea on the sandcastle. | 1 |
| /audio/child-mode/phrases/the-castle-was-rebuilt-at-tea-time-db4763.mp3 | The castle was rebuilt at tea time. | 1 |
| /audio/child-mode/phrases/the-sea-covered-the-sandcastle-before-tea-fb1963.mp3 | The sea covered the sandcastle before tea. | 1 |
| /audio/child-mode/phrases/the-cheese-smelled-so-bad-everyone-opened-th-b66880.mp3 | The cheese smelled so bad everyone opened the windows. | 1 |
| /audio/child-mode/phrases/everyone-raced-to-taste-the-cheese-f33a53.mp3 | Everyone raced to taste the cheese. | 1 |
| /audio/child-mode/phrases/the-kitchen-windows-were-broken-b1ca6c.mp3 | The kitchen windows were broken. | 1 |
| /audio/child-mode/phrases/the-cheese-was-served-right-beside-the-windo-e70610.mp3 | The cheese was served right beside the window. | 1 |
| /audio/child-mode/phrases/dropped-his-squeegee-9f30cd.mp3 | dropped his squeegee | 1 |
| /audio/child-mode/phrases/waved-at-the-children-on-the-bus-ba1cc3.mp3 | waved at the children on the bus | 1 |
| /audio/child-mode/phrases/cleaned-the-bus-windows-29194f.mp3 | cleaned the bus windows | 1 |
| /audio/child-mode/phrases/drove-the-bus-to-school-a96591.mp3 | drove the bus to school | 1 |
| /audio/child-mode/phrases/a-birdwatcher-305fcd.mp3 | a birdwatcher | 1 |
| /audio/child-mode/phrases/nobody-saw-it-6dc8f3.mp3 | nobody saw it | 1 |
| /audio/child-mode/phrases/curled-into-a-ball-jumped-on-the-box-fell-as-150d09.mp3 | curled into a ball → jumped on the box → fell asleep | 1 |
| /audio/child-mode/phrases/jumped-on-the-box-fell-asleep-curled-into-a-f732a5.mp3 | jumped on the box → fell asleep → curled into a ball | 1 |
| /audio/child-mode/phrases/fell-asleep-curled-into-a-ball-jumped-on-the-f5ce8d.mp3 | fell asleep → curled into a ball → jumped on the box | 1 |
| /audio/child-mode/phrases/jumped-on-the-box-curled-into-a-ball-fell-as-8084aa.mp3 | jumped on the box → curled into a ball → fell asleep | 1 |
| /audio/child-mode/phrases/put-in-the-seed-saw-a-green-shoot-watered-th-f1c457.mp3 | put in the seed → saw a green shoot → watered the soil | 1 |
| /audio/child-mode/phrases/saw-a-green-shoot-watered-the-soil-put-in-th-15975c.mp3 | saw a green shoot → watered the soil → put in the seed | 1 |
| /audio/child-mode/phrases/put-in-the-seed-watered-the-soil-saw-a-green-e77e70.mp3 | put in the seed → watered the soil → saw a green shoot | 1 |
| /audio/child-mode/phrases/watered-the-soil-put-in-the-seed-saw-a-green-aab748.mp3 | watered the soil → put in the seed → saw a green shoot | 1 |
| /audio/child-mode/phrases/rinsed-his-hands-rubbed-in-soap-wet-his-hand-f2fe55.mp3 | rinsed his hands → rubbed in soap → wet his hands | 1 |
| /audio/child-mode/phrases/wet-his-hands-rubbed-in-soap-rinsed-his-hand-36f85c.mp3 | wet his hands → rubbed in soap → rinsed his hands | 1 |
| /audio/child-mode/phrases/rubbed-in-soap-wet-his-hands-rinsed-his-hand-ceaac2.mp3 | rubbed in soap → wet his hands → rinsed his hands | 1 |
| /audio/child-mode/phrases/wet-his-hands-rinsed-his-hands-rubbed-in-soa-c8217d.mp3 | wet his hands → rinsed his hands → rubbed in soap | 1 |
| /audio/child-mode/phrases/put-on-her-shirt-put-on-her-trousers-tied-he-41e4e6.mp3 | put on her shirt → put on her trousers → tied her shoes | 1 |
| /audio/child-mode/phrases/put-on-her-trousers-put-on-her-shirt-tied-he-38518d.mp3 | put on her trousers → put on her shirt → tied her shoes | 1 |
| /audio/child-mode/phrases/put-on-her-shirt-tied-her-shoes-put-on-her-t-189879.mp3 | put on her shirt → tied her shoes → put on her trousers | 1 |
| /audio/child-mode/phrases/tied-her-shoes-put-on-her-trousers-put-on-he-cf16ff.mp3 | tied her shoes → put on her trousers → put on her shirt | 1 |
| /audio/child-mode/phrases/toast-popped-up-put-bread-in-spread-the-butt-86c44b.mp3 | toast popped up → put bread in → spread the butter | 1 |
| /audio/child-mode/phrases/put-bread-in-spread-the-butter-toast-popped-677c96.mp3 | put bread in → spread the butter → toast popped up | 1 |
| /audio/child-mode/phrases/spread-the-butter-toast-popped-up-put-bread-46b85b.mp3 | spread the butter → toast popped up → put bread in | 1 |
| /audio/child-mode/phrases/put-bread-in-toast-popped-up-spread-the-butt-2a754d.mp3 | put bread in → toast popped up → spread the butter | 1 |
| /audio/child-mode/phrases/threw-the-ball-dog-brought-it-back-dog-chase-c38c70.mp3 | threw the ball → dog brought it back → dog chased it | 1 |
| /audio/child-mode/phrases/dog-brought-it-back-dog-chased-it-threw-the-ff02c6.mp3 | dog brought it back → dog chased it → threw the ball | 1 |
| /audio/child-mode/phrases/threw-the-ball-dog-chased-it-dog-brought-it-f6ec8f.mp3 | threw the ball → dog chased it → dog brought it back | 1 |
| /audio/child-mode/phrases/dog-chased-it-threw-the-ball-dog-brought-it-c37e99.mp3 | dog chased it → threw the ball → dog brought it back | 1 |
| /audio/child-mode/phrases/coloured-the-sun-added-the-rays-drew-a-circl-ebded7.mp3 | coloured the sun → added the rays → drew a circle | 1 |
| /audio/child-mode/phrases/drew-a-circle-added-the-rays-coloured-the-su-57bf3f.mp3 | drew a circle → added the rays → coloured the sun | 1 |
| /audio/child-mode/phrases/added-the-rays-drew-a-circle-coloured-the-su-2e14b3.mp3 | added the rays → drew a circle → coloured the sun | 1 |
| /audio/child-mode/phrases/drew-a-circle-coloured-the-sun-added-the-ray-696aa3.mp3 | drew a circle → coloured the sun → added the rays | 1 |
| /audio/child-mode/phrases/set-down-blocks-stacked-the-tower-smiled-at-ae8584.mp3 | set down blocks → stacked the tower → smiled at the tower | 1 |
| /audio/child-mode/phrases/stacked-the-tower-set-down-blocks-smiled-at-d8cf7c.mp3 | stacked the tower → set down blocks → smiled at the tower | 1 |
| /audio/child-mode/phrases/set-down-blocks-smiled-at-the-tower-stacked-e2e821.mp3 | set down blocks → smiled at the tower → stacked the tower | 1 |
| /audio/child-mode/phrases/smiled-at-the-tower-stacked-the-tower-set-do-9077fa.mp3 | smiled at the tower → stacked the tower → set down blocks | 1 |
| /audio/child-mode/phrases/laid-down-bread-closed-the-sandwich-added-th-daabfa.mp3 | laid down bread → closed the sandwich → added the cheese | 1 |
| /audio/child-mode/phrases/closed-the-sandwich-added-the-cheese-laid-do-ca5d4b.mp3 | closed the sandwich → added the cheese → laid down bread | 1 |
| /audio/child-mode/phrases/laid-down-bread-added-the-cheese-closed-the-3fb845.mp3 | laid down bread → added the cheese → closed the sandwich | 1 |
| /audio/child-mode/phrases/added-the-cheese-laid-down-bread-closed-the-334de4.mp3 | added the cheese → laid down bread → closed the sandwich | 1 |
| /audio/child-mode/phrases/walked-outside-opened-an-umbrella-put-on-boo-e2e2e1.mp3 | walked outside → opened an umbrella → put on boots | 1 |
| /audio/child-mode/phrases/put-on-boots-opened-an-umbrella-walked-outsi-1f0881.mp3 | put on boots → opened an umbrella → walked outside | 1 |
| /audio/child-mode/phrases/opened-an-umbrella-put-on-boots-walked-outsi-8fa8e7.mp3 | opened an umbrella → put on boots → walked outside | 1 |
| /audio/child-mode/phrases/put-on-boots-walked-outside-opened-an-umbrel-ec349d.mp3 | put on boots → walked outside → opened an umbrella | 1 |
| /audio/child-mode/phrases/read-the-page-opened-the-book-put-in-a-bookm-5dae23.mp3 | read the page → opened the book → put in a bookmark | 1 |
| /audio/child-mode/phrases/opened-the-book-put-in-a-bookmark-read-the-p-a4cf65.mp3 | opened the book → put in a bookmark → read the page | 1 |
| /audio/child-mode/phrases/put-in-a-bookmark-read-the-page-opened-the-b-193e3d.mp3 | put in a bookmark → read the page → opened the book | 1 |
| /audio/child-mode/phrases/opened-the-book-read-the-page-put-in-a-bookm-164312.mp3 | opened the book → read the page → put in a bookmark | 1 |
| /audio/child-mode/phrases/drank-the-water-filled-the-cup-put-cup-in-si-a5c629.mp3 | drank the water → filled the cup → put cup in sink | 1 |
| /audio/child-mode/phrases/filled-the-cup-put-cup-in-sink-drank-the-wat-623f26.mp3 | filled the cup → put cup in sink → drank the water | 1 |
| /audio/child-mode/phrases/put-cup-in-sink-drank-the-water-filled-the-c-b7ac0f.mp3 | put cup in sink → drank the water → filled the cup | 1 |
| /audio/child-mode/phrases/filled-the-cup-drank-the-water-put-cup-in-si-620431.mp3 | filled the cup → drank the water → put cup in sink | 1 |
| /audio/child-mode/phrases/cracked-the-egg-cooked-the-egg-whisked-the-e-d70b1c.mp3 | cracked the egg → cooked the egg → whisked the egg | 1 |
| /audio/child-mode/phrases/cooked-the-egg-whisked-the-egg-cracked-the-e-f75034.mp3 | cooked the egg → whisked the egg → cracked the egg | 1 |
| /audio/child-mode/phrases/cracked-the-egg-whisked-the-egg-cooked-the-e-3d573f.mp3 | cracked the egg → whisked the egg → cooked the egg | 1 |
| /audio/child-mode/phrases/whisked-the-egg-cracked-the-egg-cooked-the-e-1afc14.mp3 | whisked the egg → cracked the egg → cooked the egg | 1 |
| /audio/child-mode/phrases/kicked-the-ball-ball-went-in-goal-team-cheer-c763f1.mp3 | kicked the ball → ball went in goal → team cheered | 1 |
| /audio/child-mode/phrases/ball-went-in-goal-kicked-the-ball-team-cheer-eb2af2.mp3 | ball went in goal → kicked the ball → team cheered | 1 |
| /audio/child-mode/phrases/kicked-the-ball-team-cheered-ball-went-in-go-2a9731.mp3 | kicked the ball → team cheered → ball went in goal | 1 |
| /audio/child-mode/phrases/team-cheered-ball-went-in-goal-kicked-the-ba-fd14c5.mp3 | team cheered → ball went in goal → kicked the ball | 1 |
| /audio/child-mode/phrases/brushed-the-dog-clipped-on-the-lead-walked-t-f10d65.mp3 | brushed the dog → clipped on the lead → walked the dog | 1 |
| /audio/child-mode/phrases/clipped-on-the-lead-brushed-the-dog-walked-t-7b4011.mp3 | clipped on the lead → brushed the dog → walked the dog | 1 |
| /audio/child-mode/phrases/brushed-the-dog-walked-the-dog-clipped-on-th-d3a9d4.mp3 | brushed the dog → walked the dog → clipped on the lead | 1 |
| /audio/child-mode/phrases/walked-the-dog-clipped-on-the-lead-brushed-t-a1b8a0.mp3 | walked the dog → clipped on the lead → brushed the dog | 1 |
| /audio/child-mode/phrases/shaped-the-loaf-mixed-the-dough-put-loaf-in-581c20.mp3 | shaped the loaf → mixed the dough → put loaf in oven | 1 |
| /audio/child-mode/phrases/mixed-the-dough-put-loaf-in-oven-shaped-the-2faa83.mp3 | mixed the dough → put loaf in oven → shaped the loaf | 1 |
| /audio/child-mode/phrases/put-loaf-in-oven-shaped-the-loaf-mixed-the-d-1a4be3.mp3 | put loaf in oven → shaped the loaf → mixed the dough | 1 |
| /audio/child-mode/phrases/mixed-the-dough-shaped-the-loaf-put-loaf-in-6270c7.mp3 | mixed the dough → shaped the loaf → put loaf in oven | 1 |
| /audio/child-mode/phrases/climbed-into-bed-put-on-pyjamas-brushed-his-6b0d14.mp3 | climbed into bed → put on pyjamas → brushed his teeth | 1 |
| /audio/child-mode/phrases/brushed-his-teeth-put-on-pyjamas-climbed-int-bbff5b.mp3 | brushed his teeth → put on pyjamas → climbed into bed | 1 |
| /audio/child-mode/phrases/put-on-pyjamas-brushed-his-teeth-climbed-int-b62789.mp3 | put on pyjamas → brushed his teeth → climbed into bed | 1 |
| /audio/child-mode/phrases/brushed-his-teeth-climbed-into-bed-put-on-py-f64155.mp3 | brushed his teeth → climbed into bed → put on pyjamas | 1 |
| /audio/child-mode/phrases/found-the-paper-folded-a-plane-flew-the-plan-befcb1.mp3 | found the paper → folded a plane → flew the plane | 1 |
| /audio/child-mode/phrases/folded-a-plane-found-the-paper-flew-the-plan-78550d.mp3 | folded a plane → found the paper → flew the plane | 1 |
| /audio/child-mode/phrases/found-the-paper-flew-the-plane-folded-a-plan-a58eb5.mp3 | found the paper → flew the plane → folded a plane | 1 |
| /audio/child-mode/phrases/flew-the-plane-folded-a-plane-found-the-pape-479c08.mp3 | flew the plane → folded a plane → found the paper | 1 |
| /audio/child-mode/phrases/bit-the-apple-washed-the-apple-picked-the-ap-7d7250.mp3 | bit the apple → washed the apple → picked the apple | 1 |
| /audio/child-mode/phrases/picked-the-apple-washed-the-apple-bit-the-ap-667db5.mp3 | picked the apple → washed the apple → bit the apple | 1 |
| /audio/child-mode/phrases/washed-the-apple-picked-the-apple-bit-the-ap-cb0ade.mp3 | washed the apple → picked the apple → bit the apple | 1 |
| /audio/child-mode/phrases/picked-the-apple-bit-the-apple-washed-the-ap-8e0e85.mp3 | picked the apple → bit the apple → washed the apple | 1 |
| /audio/child-mode/phrases/made-a-snowball-added-the-hat-added-the-head-7a3a0b.mp3 | made a snowball → added the hat → added the head | 1 |
| /audio/child-mode/phrases/added-the-hat-added-the-head-made-a-snowball-665f9b.mp3 | added the hat → added the head → made a snowball | 1 |
| /audio/child-mode/phrases/made-a-snowball-added-the-head-added-the-hat-5ada62.mp3 | made a snowball → added the head → added the hat | 1 |
| /audio/child-mode/phrases/added-the-head-made-a-snowball-added-the-hat-33ad08.mp3 | added the head → made a snowball → added the hat | 1 |
| /audio/child-mode/phrases/gave-the-gift-tied-the-bow-wrapped-the-gift-93da28.mp3 | gave the gift → tied the bow → wrapped the gift | 1 |
| /audio/child-mode/phrases/wrapped-the-gift-tied-the-bow-gave-the-gift-3af648.mp3 | wrapped the gift → tied the bow → gave the gift | 1 |
| /audio/child-mode/phrases/tied-the-bow-wrapped-the-gift-gave-the-gift-aee3cc.mp3 | tied the bow → wrapped the gift → gave the gift | 1 |
| /audio/child-mode/phrases/wrapped-the-gift-gave-the-gift-tied-the-bow-96593a.mp3 | wrapped the gift → gave the gift → tied the bow | 1 |
| /audio/child-mode/phrases/dug-the-hole-watered-the-roots-planted-the-t-cf3f3f.mp3 | dug the hole → watered the roots → planted the tree | 1 |
| /audio/child-mode/phrases/watered-the-roots-planted-the-tree-dug-the-h-55db21.mp3 | watered the roots → planted the tree → dug the hole | 1 |
| /audio/child-mode/phrases/dug-the-hole-planted-the-tree-watered-the-ro-c6e102.mp3 | dug the hole → planted the tree → watered the roots | 1 |
| /audio/child-mode/phrases/planted-the-tree-dug-the-hole-watered-the-ro-6d34e3.mp3 | planted the tree → dug the hole → watered the roots | 1 |
| /audio/child-mode/phrases/tied-the-bag-filled-the-bag-put-bag-in-bin-67bb82.mp3 | tied the bag → filled the bag → put bag in bin | 1 |
| /audio/child-mode/phrases/filled-the-bag-put-bag-in-bin-tied-the-bag-e60c3f.mp3 | filled the bag → put bag in bin → tied the bag | 1 |
| /audio/child-mode/phrases/put-bag-in-bin-tied-the-bag-filled-the-bag-50ea48.mp3 | put bag in bin → tied the bag → filled the bag | 1 |
| /audio/child-mode/phrases/filled-the-bag-tied-the-bag-put-bag-in-bin-c94468.mp3 | filled the bag → tied the bag → put bag in bin | 1 |
| /audio/child-mode/phrases/bus-stopped-children-stepped-off-doors-opene-3b0708.mp3 | bus stopped → children stepped off → doors opened | 1 |
| /audio/child-mode/phrases/children-stepped-off-doors-opened-bus-stoppe-807d06.mp3 | children stepped off → doors opened → bus stopped | 1 |
| /audio/child-mode/phrases/bus-stopped-doors-opened-children-stepped-of-5f0bf5.mp3 | bus stopped → doors opened → children stepped off | 1 |
| /audio/child-mode/phrases/doors-opened-bus-stopped-children-stepped-of-12ca49.mp3 | doors opened → bus stopped → children stepped off | 1 |
| /audio/child-mode/phrases/picked-up-pencil-coloured-it-red-drew-the-st-6e1517.mp3 | picked up pencil → coloured it red → drew the star | 1 |
| /audio/child-mode/phrases/coloured-it-red-drew-the-star-picked-up-penc-f9d5f7.mp3 | coloured it red → drew the star → picked up pencil | 1 |
| /audio/child-mode/phrases/picked-up-pencil-drew-the-star-coloured-it-r-8037bd.mp3 | picked up pencil → drew the star → coloured it red | 1 |
| /audio/child-mode/phrases/drew-the-star-picked-up-pencil-coloured-it-r-8315f2.mp3 | drew the star → picked up pencil → coloured it red | 1 |
| /audio/child-mode/phrases/led-pony-through-opened-the-gate-shut-the-ga-4523d7.mp3 | led pony through → opened the gate → shut the gate | 1 |
| /audio/child-mode/phrases/opened-the-gate-shut-the-gate-led-pony-throu-7108f4.mp3 | opened the gate → shut the gate → led pony through | 1 |
| /audio/child-mode/phrases/shut-the-gate-led-pony-through-opened-the-ga-e77aa8.mp3 | shut the gate → led pony through → opened the gate | 1 |
| /audio/child-mode/phrases/opened-the-gate-led-pony-through-shut-the-ga-f5b853.mp3 | opened the gate → led pony through → shut the gate | 1 |
| /audio/child-mode/phrases/frog-sat-frog-jumped-frog-swam-away-18a51a.mp3 | frog sat → frog jumped → frog swam away | 1 |
| /audio/child-mode/phrases/frog-jumped-frog-sat-frog-swam-away-f278db.mp3 | frog jumped → frog sat → frog swam away | 1 |
| /audio/child-mode/phrases/frog-sat-frog-swam-away-frog-jumped-5e6961.mp3 | frog sat → frog swam away → frog jumped | 1 |
| /audio/child-mode/phrases/frog-swam-away-frog-jumped-frog-sat-46116e.mp3 | frog swam away → frog jumped → frog sat | 1 |
| /audio/child-mode/phrases/ate-breakfast-added-milk-poured-cereal-e08bc1.mp3 | ate breakfast → added milk → poured cereal | 1 |
| /audio/child-mode/phrases/poured-cereal-added-milk-ate-breakfast-16aa05.mp3 | poured cereal → added milk → ate breakfast | 1 |
| /audio/child-mode/phrases/added-milk-poured-cereal-ate-breakfast-d99de5.mp3 | added milk → poured cereal → ate breakfast | 1 |
| /audio/child-mode/phrases/poured-cereal-ate-breakfast-added-milk-8fcad8.mp3 | poured cereal → ate breakfast → added milk | 1 |
| /audio/child-mode/phrases/zipped-the-coat-went-into-snow-put-on-the-ha-958947.mp3 | zipped the coat → went into snow → put on the hat | 1 |
| /audio/child-mode/phrases/went-into-snow-put-on-the-hat-zipped-the-coa-d54e72.mp3 | went into snow → put on the hat → zipped the coat | 1 |
| /audio/child-mode/phrases/zipped-the-coat-put-on-the-hat-went-into-sno-61d279.mp3 | zipped the coat → put on the hat → went into snow | 1 |
| /audio/child-mode/phrases/put-on-the-hat-zipped-the-coat-went-into-sno-cb43b1.mp3 | put on the hat → zipped the coat → went into snow | 1 |
| /audio/child-mode/phrases/dried-the-plate-washed-the-plate-put-plate-o-24c760.mp3 | dried the plate → washed the plate → put plate on shelf | 1 |
| /audio/child-mode/phrases/washed-the-plate-put-plate-on-shelf-dried-th-27005e.mp3 | washed the plate → put plate on shelf → dried the plate | 1 |
| /audio/child-mode/phrases/put-plate-on-shelf-dried-the-plate-washed-th-7fc950.mp3 | put plate on shelf → dried the plate → washed the plate | 1 |
| /audio/child-mode/phrases/washed-the-plate-dried-the-plate-put-plate-o-92a3a7.mp3 | washed the plate → dried the plate → put plate on shelf | 1 |
| /audio/child-mode/phrases/the-labels-went-on-dc790a.mp3 | the labels went on | 1 |
| /audio/child-mode/phrases/the-jars-were-bought-96ab23.mp3 | the jars were bought | 1 |
| /audio/child-mode/phrases/the-jam-passed-the-cold-saucer-test-8dfd55.mp3 | the jam passed the cold-saucer test | 1 |
| /audio/child-mode/phrases/the-berries-were-picked-ec3ad5.mp3 | the berries were picked | 1 |
| /audio/child-mode/phrases/the-eggs-went-under-the-lamp-a5c4cd.mp3 | the eggs went under the lamp | 1 |
| /audio/child-mode/phrases/the-chicks-turned-fluffy-3505db.mp3 | the chicks turned fluffy | 1 |
| /audio/child-mode/phrases/a-seventh-egg-arrived-bc854b.mp3 | a seventh egg arrived | 1 |
| /audio/child-mode/phrases/cheeping-came-from-inside-the-shells-df7db5.mp3 | cheeping came from inside the shells | 1 |
| /audio/child-mode/phrases/once-otto-had-seen-the-finished-haircut-227a7f.mp3 | once Otto had seen the finished haircut | 1 |
| /audio/child-mode/phrases/before-the-gown-went-on-d02fa0.mp3 | before the gown went on | 1 |
| /audio/child-mode/phrases/while-the-spray-bottle-worked-c622e1.mp3 | while the spray bottle worked | 1 |
| /audio/child-mode/phrases/it-stayed-on-the-shelf-4e04cd.mp3 | it stayed on the shelf | 1 |
| /audio/child-mode/phrases/put-bags-in-the-lockers-eeb433.mp3 | put bags in the lockers | 1 |
| /audio/child-mode/phrases/visited-the-gift-shop-970eb6.mp3 | visited the gift shop | 1 |
| /audio/child-mode/phrases/rode-the-bus-home-6d6612.mp3 | rode the bus home | 1 |
| /audio/child-mode/phrases/visited-the-dinosaur-hall-960655.mp3 | visited the dinosaur hall | 1 |
| /audio/child-mode/phrases/once-the-winter-frosts-had-ended-1d9e0f.mp3 | once the winter frosts had ended | 1 |
| /audio/child-mode/phrases/before-the-seeds-were-potted-aea1f8.mp3 | before the seeds were potted | 1 |
| /audio/child-mode/phrases/after-the-lettuce-was-cut-6b808f.mp3 | after the lettuce was cut | 1 |
| /audio/child-mode/phrases/during-the-slug-battle-72fa08.mp3 | during the slug battle | 1 |
| /audio/child-mode/phrases/during-the-warm-up-laps-5ccad0.mp3 | during the warm-up laps | 1 |
| /audio/child-mode/phrases/on-the-evening-ahead-of-match-day-534586.mp3 | on the evening ahead of match day | 1 |
| /audio/child-mode/phrases/at-noon-with-the-team-sheet-a2ed3f.mp3 | at noon with the team sheet | 1 |
| /audio/child-mode/phrases/after-the-whistle-blew-405a9a.mp3 | after the whistle blew | 1 |
| /audio/child-mode/phrases/short-and-close-to-his-feet-795a3f.mp3 | short and close to his feet | 1 |
| /audio/child-mode/phrases/stretching-long-to-the-fence-a247b9.mp3 | stretching long to the fence | 1 |
| /audio/child-mode/phrases/touching-the-hedge-ec68d5.mp3 | touching the hedge | 1 |
| /audio/child-mode/phrases/gone-completely-6d0b6a.mp3 | gone completely | 1 |
| /audio/child-mode/phrases/new-shelves-were-built-e52fb6.mp3 | new shelves were built | 1 |
| /audio/child-mode/phrases/the-old-spot-was-hoovered-2e89ec.mp3 | the old spot was hoovered | 1 |
| /audio/child-mode/phrases/the-books-came-off-the-shelves-74af26.mp3 | the books came off the shelves | 1 |
| /audio/child-mode/phrases/the-case-waddled-across-the-room-7723c3.mp3 | the case waddled across the room | 1 |
| /audio/child-mode/phrases/the-tins-went-into-the-sink-4ff634.mp3 | the tins went into the sink | 1 |
| /audio/child-mode/phrases/the-sponge-was-baked-in-the-tins-9f010c.mp3 | the sponge was baked in the tins | 1 |
| /audio/child-mode/phrases/the-icing-was-licked-off-fingers-ff3a61.mp3 | the icing was licked off fingers | 1 |
| /audio/child-mode/phrases/the-cherry-went-on-top-7b950e.mp3 | the cherry went on top | 1 |
| /audio/child-mode/phrases/the-sledging-on-the-hill-happened-74f7b6.mp3 | the sledging on the hill happened | 1 |
| /audio/child-mode/phrases/snow-began-to-fall-64b1c9.mp3 | snow began to fall | 1 |
| /audio/child-mode/phrases/the-wet-things-were-brought-in-to-dry-914670.mp3 | the wet things were brought in to dry | 1 |
| /audio/child-mode/phrases/the-lopsided-snowman-was-built-in-the-garden-b9394b.mp3 | the lopsided snowman was built in the garden | 1 |
| /audio/child-mode/phrases/the-empty-pots-were-stacked-99f46d.mp3 | the empty pots were stacked | 1 |
| /audio/child-mode/phrases/the-barrow-was-emptied-438221.mp3 | the barrow was emptied | 1 |
| /audio/child-mode/phrases/the-weeds-were-pulled-out-52ccde.mp3 | the weeds were pulled out | 1 |
| /audio/child-mode/phrases/the-marigolds-were-planted-83a967.mp3 | the marigolds were planted | 1 |
| /audio/child-mode/phrases/the-flip-flop-was-fished-out-4e5c0c.mp3 | the flip-flop was fished out | 1 |
| /audio/child-mode/phrases/the-pool-was-closed-166b85.mp3 | the pool was closed | 1 |
| /audio/child-mode/phrases/the-flip-flop-went-into-the-water-7617af.mp3 | the flip-flop went into the water | 1 |
| /audio/child-mode/phrases/rio-hopped-to-the-bench-222bdd.mp3 | Rio hopped to the bench | 1 |
| /audio/child-mode/phrases/the-box-was-taped-shut-b1fb97.mp3 | the box was taped shut | 1 |
| /audio/child-mode/phrases/the-third-label-was-written-af4971.mp3 | the third label was written | 1 |
| /audio/child-mode/phrases/the-parcel-was-posted-8659c2.mp3 | the parcel was posted | 1 |
| /audio/child-mode/phrases/the-jars-were-wrapped-in-newspaper-8eeee6.mp3 | the jars were wrapped in newspaper | 1 |
| /audio/child-mode/phrases/the-cast-took-their-bows-2c0e0a.mp3 | the cast took their bows | 1 |
| /audio/child-mode/phrases/flowers-landed-on-the-stage-712dbb.mp3 | flowers landed on the stage | 1 |
| /audio/child-mode/phrases/the-prompt-book-closed-d78e47.mp3 | the prompt book closed | 1 |
| /audio/child-mode/phrases/the-auditions-were-held-e8316d.mp3 | the auditions were held | 1 |
| /audio/child-mode/phrases/the-worms-drew-wavy-tunnel-lines-past-the-gl-51aaa0.mp3 | the worms drew wavy tunnel lines past the glass | 1 |
| /audio/child-mode/phrases/the-trowel-went-into-the-jar-3fd89b.mp3 | the trowel went into the jar | 1 |
| /audio/child-mode/phrases/the-wormery-was-emptied-out-9ddc62.mp3 | the wormery was emptied out | 1 |
| /audio/child-mode/phrases/the-sand-and-soil-were-layered-ff6048.mp3 | the sand and soil were layered | 1 |
| /audio/child-mode/phrases/the-lucky-bounce-off-the-post-1bac3e.mp3 | the lucky bounce off the post | 1 |
| /audio/child-mode/phrases/ffion-s-header-fd2449.mp3 | Ffion's header | 1 |
| /audio/child-mode/phrases/the-half-time-oranges-d4f22b.mp3 | the half-time oranges | 1 |
| /audio/child-mode/phrases/the-winning-penalty-5402c9.mp3 | the winning penalty | 1 |
| /audio/child-mode/phrases/the-letter-is-sorted-by-postcode-977d9d.mp3 | the letter is sorted by postcode | 1 |
| /audio/child-mode/phrases/the-letter-is-posted-in-the-box-5b3726.mp3 | the letter is posted in the box | 1 |
| /audio/child-mode/phrases/the-postie-brings-it-to-the-door-7763ab.mp3 | the postie brings it to the door | 1 |
| /audio/child-mode/phrases/the-letter-is-written-536a9e.mp3 | the letter is written | 1 |
| /audio/child-mode/phrases/the-bars-reach-the-shops-bbb28c.mp3 | the bars reach the shops | 1 |
| /audio/child-mode/phrases/they-dry-in-the-sun-92cb4c.mp3 | they dry in the sun | 1 |
| /audio/child-mode/phrases/they-are-ground-to-paste-1479a1.mp3 | they are ground to paste | 1 |
| /audio/child-mode/phrases/sugar-and-milk-join-in-a058e8.mp3 | sugar and milk join in | 1 |
| /audio/child-mode/phrases/the-furnace-melts-the-crumbs-b44c91.mp3 | the furnace melts the crumbs | 1 |
| /audio/child-mode/phrases/bottles-are-collected-from-kerbsides-aa9350.mp3 | bottles are collected from kerbsides | 1 |
| /audio/child-mode/phrases/new-bottles-are-blown-4dcfc5.mp3 | new bottles are blown | 1 |
| /audio/child-mode/phrases/the-bottles-are-sorted-by-colour-dbe0d5.mp3 | the bottles are sorted by colour | 1 |
| /audio/child-mode/phrases/the-dentist-is-telephoned-691860.mp3 | the dentist is telephoned | 1 |
| /audio/child-mode/phrases/a-coin-appears-by-morning-b03f2c.mp3 | a coin appears by morning | 1 |
| /audio/child-mode/phrases/the-tooth-starts-to-wobble-e79023.mp3 | the tooth starts to wobble | 1 |
| /audio/child-mode/phrases/the-tooth-comes-out-b1d340.mp3 | the tooth comes out | 1 |
| /audio/child-mode/phrases/pass-it-mouth-to-mouth-adc7da.mp3 | pass it mouth to mouth | 1 |
| /audio/child-mode/phrases/break-the-wax-open-e26a09.mp3 | break the wax open | 1 |
| /audio/child-mode/phrases/fan-the-nectar-with-their-wings-80e6de.mp3 | fan the nectar with their wings | 1 |
| /audio/child-mode/phrases/drink-nectar-from-flowers-cc6e2f.mp3 | drink nectar from flowers | 1 |
| /audio/child-mode/phrases/they-ask-where-they-are-going-cfc23a.mp3 | they ask where they are going | 1 |
| /audio/child-mode/phrases/they-put-on-their-kit-969fe5.mp3 | they put on their kit | 1 |
| /audio/child-mode/phrases/the-pagers-beep-614a58.mp3 | the pagers beep | 1 |
| /audio/child-mode/phrases/the-boat-goes-down-the-slipway-818e93.mp3 | the boat goes down the slipway | 1 |
| /audio/child-mode/phrases/it-lives-beside-someone-s-bed-3ca293.mp3 | it lives beside someone's bed | 1 |
| /audio/child-mode/phrases/it-is-reshelved-immediately-unchecked-fb8f86.mp3 | it is reshelved immediately unchecked | 1 |
| /audio/child-mode/phrases/it-is-checked-and-mended-if-needed-5efc53.mp3 | it is checked and mended if needed | 1 |
| /audio/child-mode/phrases/it-is-borrowed-at-the-desk-60788c.mp3 | it is borrowed at the desk | 1 |
| /audio/child-mode/phrases/the-seeds-are-sown-in-trays-91900f.mp3 | the seeds are sown in trays | 1 |
| /audio/child-mode/phrases/the-soup-is-eaten-c0ef69.mp3 | the soup is eaten | 1 |
| /audio/child-mode/phrases/the-trays-are-washed-81ac9f.mp3 | the trays are washed | 1 |
| /audio/child-mode/phrases/a-whole-term-of-watering-c102c4.mp3 | a whole term of watering | 1 |
| /audio/child-mode/phrases/the-two-towers-were-started-c9d733.mp3 | the two towers were started | 1 |
| /audio/child-mode/phrases/the-books-went-back-on-shelves-1c8ec2.mp3 | the books went back on shelves | 1 |
| /audio/child-mode/phrases/a-second-marble-was-found-681c08.mp3 | a second marble was found | 1 |
| /audio/child-mode/phrases/the-atlas-plank-bridged-the-gap-43e003.mp3 | the atlas plank bridged the gap | 1 |
| /audio/child-mode/phrases/at-the-start-before-sunset-e386a6.mp3 | at the start, before sunset | 1 |
| /audio/child-mode/phrases/after-the-bonfire-was-lit-cdf558.mp3 | after the bonfire was lit | 1 |
| /audio/child-mode/phrases/during-the-rockets-4950ef.mp3 | during the rockets | 1 |
| /audio/child-mode/phrases/at-six-with-the-sparklers-6451c8.mp3 | at six with the sparklers | 1 |
| /audio/child-mode/phrases/the-tide-later-washed-the-castle-away-70397c.mp3 | the tide later washed the castle away | 1 |
| /audio/child-mode/phrases/the-buckets-were-filled-and-turned-over-bc8a6c.mp3 | the buckets were filled and turned over | 1 |
| /audio/child-mode/phrases/the-feather-flag-was-placed-on-the-top-tower-71a38c.mp3 | the feather flag was placed on the top tower | 1 |
| /audio/child-mode/phrases/the-shells-were-arranged-around-the-castle-4cae0c.mp3 | the shells were arranged around the castle | 1 |
| /audio/child-mode/phrases/the-chairs-went-back-two-at-a-time-99cb2d.mp3 | the chairs went back two at a time | 1 |
| /audio/child-mode/phrases/the-flowers-wilted-c813ed.mp3 | the flowers wilted | 1 |
| /audio/child-mode/phrases/the-neighbours-lent-their-chairs-8c055e.mp3 | the neighbours lent their chairs | 1 |
| /audio/child-mode/phrases/the-thank-you-card-was-signed-35f9f8.mp3 | the thank-you card was signed | 1 |
| /audio/child-mode/phrases/the-sheep-is-sheared-in-early-summer-bad2b0.mp3 | the sheep is sheared in early summer | 1 |
| /audio/child-mode/phrases/the-thread-is-knitted-bfac27.mp3 | the thread is knitted | 1 |
| /audio/child-mode/phrases/the-jumper-is-worn-c3881d.mp3 | the jumper is worn | 1 |
| /audio/child-mode/phrases/carding-combs-untangle-the-fibres-6d546c.mp3 | carding combs untangle the fibres | 1 |
| /audio/child-mode/phrases/feeding-by-themselves-in-the-quiet-room-1e0abb.mp3 | feeding by themselves in the quiet room | 1 |
| /audio/child-mode/phrases/being-weighed-on-arrival-b97542.mp3 | being weighed on arrival | 1 |
| /audio/child-mode/phrases/release-at-the-hedge-ebc70e.mp3 | release at the hedge | 1 |
| /audio/child-mode/phrases/hibernating-all-winter-a705bc.mp3 | hibernating all winter | 1 |
| /audio/child-mode/phrases/it-was-posted-to-the-school-4ff206.mp3 | it was posted to the school | 1 |
| /audio/child-mode/phrases/it-got-a-dusting-of-frost-929934.mp3 | it got a dusting of frost | 1 |
| /audio/child-mode/phrases/it-fell-at-the-bus-stop-45b828.mp3 | it fell at the bus stop | 1 |
| /audio/child-mode/phrases/priya-took-it-home-566210.mp3 | Priya took it home | 1 |
| /audio/child-mode/phrases/the-amber-warning-shows-af3ca3.mp3 | the amber warning shows | 1 |
| /audio/child-mode/phrases/the-wait-light-switches-on-f95adf.mp3 | the WAIT light switches on | 1 |
| /audio/child-mode/phrases/the-green-man-and-the-beeps-arrive-da824d.mp3 | the green man and the beeps arrive | 1 |
| /audio/child-mode/phrases/the-button-is-pressed-950276.mp3 | the button is pressed | 1 |
| /audio/child-mode/phrases/a-comic-was-left-out-in-the-rain-38ea21.mp3 | a comic was left out in the rain | 1 |
| /audio/child-mode/phrases/never-lend-anything-to-anyone-37a191.mp3 | never lend anything to anyone | 1 |
| /audio/child-mode/phrases/comics-cost-pocket-money-83a02c.mp3 | comics cost pocket money | 1 |
| /audio/child-mode/phrases/owning-up-to-a-mistake-is-better-than-hiding-f810d2.mp3 | owning up to a mistake is better than hiding it | 1 |
| /audio/child-mode/phrases/baking-always-goes-wrong-ce08c1.mp3 | baking always goes wrong | 1 |
| /audio/child-mode/phrases/ovens-can-be-hot-32787e.mp3 | ovens can be hot | 1 |
| /audio/child-mode/phrases/a-mistake-can-teach-you-how-to-do-better-1e6f7d.mp3 | a mistake can teach you how to do better | 1 |
| /audio/child-mode/phrases/the-first-biscuits-burned-black-89b071.mp3 | the first biscuits burned black | 1 |
| /audio/child-mode/phrases/tape-can-fix-many-things-4c2e93.mp3 | tape can fix many things | 1 |
| /audio/child-mode/phrases/a-secret-mistake-feels-heavier-than-a-told-o-da44b2.mp3 | a secret mistake feels heavier than a told one | 1 |
| /audio/child-mode/phrases/a-blue-crayon-got-snapped-11de2f.mp3 | a blue crayon got snapped | 1 |
| /audio/child-mode/phrases/crayons-should-never-be-shared-e3c73e.mp3 | crayons should never be shared | 1 |
| /audio/child-mode/phrases/do-not-judge-someone-before-you-know-them-51cdfb.mp3 | do not judge someone before you know them | 1 |
| /audio/child-mode/phrases/ravi-s-bag-was-heavy-4d8570.mp3 | Ravi's bag was heavy | 1 |
| /audio/child-mode/phrases/always-get-off-the-bus-early-dbe2a3.mp3 | always get off the bus early | 1 |
| /audio/child-mode/phrases/school-gates-are-meeting-places-452a01.mp3 | school gates are meeting places | 1 |
| /audio/child-mode/phrases/lena-s-tooth-was-wobbly-bb0fcc.mp3 | Lena's tooth was wobbly | 1 |
| /audio/child-mode/phrases/teeth-should-never-come-out-23f7a9.mp3 | teeth should never come out | 1 |
| /audio/child-mode/phrases/sam-said-well-done-1f4b22.mp3 | Sam said well done | 1 |
| /audio/child-mode/phrases/racing-to-be-first-can-spoil-the-fun-3dc23f.mp3 | racing to be first can spoil the fun | 1 |
| /audio/child-mode/phrases/goldfish-should-not-be-fed-913e0b.mp3 | goldfish should not be fed | 1 |
| /audio/child-mode/phrases/pet-shops-know-about-fish-c99aef.mp3 | pet shops know about fish | 1 |
| /audio/child-mode/phrases/too-much-of-a-good-thing-can-do-harm-d50160.mp3 | too much of a good thing can do harm | 1 |
| /audio/child-mode/phrases/the-tank-water-turned-cloudy-1e642e.mp3 | the tank water turned cloudy | 1 |
| /audio/child-mode/phrases/librarians-point-at-corners-cbb3e5.mp3 | librarians point at corners | 1 |
| /audio/child-mode/phrases/your-noise-can-spoil-things-for-others-7d0ded.mp3 | your noise can spoil things for others | 1 |
| /audio/child-mode/phrases/posy-whispered-a-song-1cb938.mp3 | Posy whispered a song | 1 |
| /audio/child-mode/phrases/libraries-should-ban-jokes-d7b99f.mp3 | libraries should ban jokes | 1 |
| /audio/child-mode/phrases/a-promise-matters-even-when-it-is-hard-to-ke-73770f.mp3 | a promise matters even when it is hard to keep | 1 |
| /audio/child-mode/phrases/the-plum-leaves-curled-up-eb43ef.mp3 | the plum leaves curled up | 1 |
| /audio/child-mode/phrases/never-help-your-neighbours-1a5f93.mp3 | never help your neighbours | 1 |
| /audio/child-mode/phrases/summer-weeks-can-be-hot-31162f.mp3 | summer weeks can be hot | 1 |
| /audio/child-mode/phrases/icy-days-are-for-staying-home-3451aa.mp3 | icy days are for staying home | 1 |
| /audio/child-mode/phrases/little-brothers-are-a-nuisance-65ac41.mp3 | little brothers are a nuisance | 1 |
| /audio/child-mode/phrases/kindness-you-give-comes-back-to-you-171cee.mp3 | kindness you give comes back to you | 1 |
| /audio/child-mode/phrases/books-flew-into-the-puddles-b812f5.mp3 | books flew into the puddles | 1 |
| /audio/child-mode/phrases/broken-arms-make-eating-hard-dba340.mp3 | broken arms make eating hard | 1 |
| /audio/child-mode/phrases/small-kindnesses-grow-into-friendship-8ba3e8.mp3 | small kindnesses grow into friendship | 1 |
| /audio/child-mode/phrases/bo-shared-his-grapes-275ef9.mp3 | Bo shared his grapes | 1 |
| /audio/child-mode/phrases/eat-lunch-alone-if-you-can-d50f56.mp3 | eat lunch alone if you can | 1 |
| /audio/child-mode/phrases/grandpa-tan-fixed-umbrellas-2bea61.mp3 | Grandpa Tan fixed umbrellas | 1 |
| /audio/child-mode/phrases/keep-your-pennies-for-yourself-cddc68.mp3 | keep your pennies for yourself | 1 |
| /audio/child-mode/phrases/storms-can-break-roofs-5586d8.mp3 | storms can break roofs | 1 |
| /audio/child-mode/phrases/a-helper-is-never-left-to-struggle-alone-7812ee.mp3 | a helper is never left to struggle alone | 1 |
| /audio/child-mode/phrases/a-coin-rolled-under-a-table-4bb493.mp3 | a coin rolled under a table | 1 |
| /audio/child-mode/phrases/keep-both-toffee-apples-3ed8e0.mp3 | keep both toffee apples | 1 |
| /audio/child-mode/phrases/fairs-sell-toffee-apples-92f85d.mp3 | fairs sell toffee apples | 1 |
| /audio/child-mode/phrases/sharing-doubles-a-good-moment-4a204e.mp3 | sharing doubles a good moment | 1 |
| /audio/child-mode/phrases/loud-singers-matter-most-4dab44.mp3 | loud singers matter most | 1 |
| /audio/child-mode/phrases/choirs-give-concerts-82b5d0.mp3 | choirs give concerts | 1 |
| /audio/child-mode/phrases/gentle-support-helps-courage-grow-e75939.mp3 | gentle support helps courage grow | 1 |
| /audio/child-mode/phrases/wren-sang-very-quietly-d36cc4.mp3 | Wren sang very quietly | 1 |
| /audio/child-mode/phrases/helping-without-being-asked-opens-hearts-44b0ba.mp3 | helping without being asked opens hearts | 1 |
| /audio/child-mode/phrases/a-tractor-sank-in-the-mud-b4e3c4.mp3 | a tractor sank in the mud | 1 |
| /audio/child-mode/phrases/pride-is-always-right-a7518c.mp3 | pride is always right | 1 |
| /audio/child-mode/phrases/orchards-grow-apples-3b8b4a.mp3 | orchards grow apples | 1 |
| /audio/child-mode/phrases/quiet-good-deeds-are-still-seen-8e204e.mp3 | quiet good deeds are still seen | 1 |
| /audio/child-mode/phrases/there-was-glass-on-the-slide-95008d.mp3 | there was glass on the slide | 1 |
| /audio/child-mode/phrases/football-matters-more-than-safety-d04590.mp3 | football matters more than safety | 1 |
| /audio/child-mode/phrases/notes-go-in-trays-44c615.mp3 | notes go in trays | 1 |
| /audio/child-mode/phrases/eleven-children-wanted-one-rope-f11857.mp3 | eleven children wanted one rope | 1 |
| /audio/child-mode/phrases/the-strongest-should-keep-the-rope-a11a12.mp3 | the strongest should keep the rope | 1 |
| /audio/child-mode/phrases/skipping-has-counting-songs-4a0d85.mp3 | skipping has counting songs | 1 |
| /audio/child-mode/phrases/fair-sharing-lets-everyone-enjoy-more-1144ce.mp3 | fair sharing lets everyone enjoy more | 1 |
| /audio/child-mode/phrases/sunflowers-grow-in-gardens-944000.mp3 | sunflowers grow in gardens | 1 |
| /audio/child-mode/phrases/keep-trying-when-progress-is-slow-f41efc.mp3 | keep trying when progress is slow | 1 |
| /audio/child-mode/phrases/marco-s-flower-grew-first-7ab15d.mp3 | Marco's flower grew first | 1 |
| /audio/child-mode/phrases/slow-seeds-never-grow-939e35.mp3 | slow seeds never grow | 1 |
| /audio/child-mode/phrases/many-small-tries-add-up-to-a-big-win-d458d3.mp3 | many small tries add up to a big win | 1 |
| /audio/child-mode/phrases/ola-wore-winter-gloves-d2f322.mp3 | Ola wore winter gloves | 1 |
| /audio/child-mode/phrases/give-up-after-one-autumn-4aa20b.mp3 | give up after one autumn | 1 |
| /audio/child-mode/phrases/playgrounds-have-monkey-bars-b449e4.mp3 | playgrounds have monkey bars | 1 |
| /audio/child-mode/phrases/libraries-have-craft-books-ecef74.mp3 | libraries have craft books | 1 |
| /audio/child-mode/phrases/big-goals-are-finished-one-small-step-at-a-t-1a2c96.mp3 | big goals are finished one small step at a time | 1 |
| /audio/child-mode/phrases/his-thumbs-ached-at-fifty-4c8455.mp3 | his thumbs ached at fifty | 1 |
| /audio/child-mode/phrases/one-hundred-is-too-many-99befd.mp3 | one hundred is too many | 1 |
| /audio/child-mode/phrases/goalkeepers-never-matter-ba68f8.mp3 | goalkeepers never matter | 1 |
| /audio/child-mode/phrases/matches-can-end-level-97bc60.mp3 | matches can end level | 1 |
| /audio/child-mode/phrases/practice-done-quietly-still-shines-in-the-en-12073e.mp3 | practice done quietly still shines in the end | 1 |
| /audio/child-mode/phrases/emil-practised-against-a-garage-989671.mp3 | Emil practised against a garage | 1 |
| /audio/child-mode/phrases/sledges-go-on-hills-72a9d7.mp3 | sledges go on hills | 1 |
| /audio/child-mode/phrases/use-waiting-time-to-get-ready-336538.mp3 | use waiting time to get ready | 1 |
| /audio/child-mode/phrases/the-first-snow-would-not-stick-c30978.mp3 | the first snow would not stick | 1 |
| /audio/child-mode/phrases/watching-the-sky-brings-snow-4c2f39.mp3 | watching the sky brings snow | 1 |
| /audio/child-mode/phrases/lost-pieces-stay-lost-8a3f25.mp3 | lost pieces stay lost | 1 |
| /audio/child-mode/phrases/dogs-sleep-in-baskets-c9f56d.mp3 | dogs sleep in baskets | 1 |
| /audio/child-mode/phrases/finishing-takes-one-person-who-will-not-quit-c1265c.mp3 | finishing takes one person who will not quit | 1 |
| /audio/child-mode/phrases/the-piece-was-in-a-trouser-turn-up-7de9d5.mp3 | the piece was in a trouser turn-up | 1 |
| /audio/child-mode/phrases/the-watch-ran-five-minutes-slow-97aed7.mp3 | the watch ran five minutes slow | 1 |
| /audio/child-mode/phrases/old-watches-cannot-be-fixed-4ff68e.mp3 | old watches cannot be fixed | 1 |
| /audio/child-mode/phrases/winter-is-for-projects-730227.mp3 | winter is for projects | 1 |
| /audio/child-mode/phrases/hard-work-is-worth-it-even-for-small-things-efc0f3.mp3 | hard work is worth it even for small things | 1 |
| /audio/child-mode/phrases/broken-things-belong-in-bins-2e3ff0.mp3 | broken things belong in bins | 1 |
| /audio/child-mode/phrases/schools-have-corridors-874308.mp3 | schools have corridors | 1 |
| /audio/child-mode/phrases/caring-for-something-makes-it-precious-acf1fd.mp3 | caring for something makes it precious | 1 |
| /audio/child-mode/phrases/the-robot-got-skateboard-wheels-9e36d4.mp3 | the robot got skateboard wheels | 1 |
| /audio/child-mode/phrases/picking-apples-is-dangerous-d6f241.mp3 | picking apples is dangerous | 1 |
| /audio/child-mode/phrases/a-ladder-slid-on-the-wet-grass-2b8d62.mp3 | a ladder slid on the wet grass | 1 |
| /audio/child-mode/phrases/old-things-earn-trust-that-shiny-things-have-b8e13e.mp3 | old things earn trust that shiny things have not | 1 |
| /audio/child-mode/phrases/never-buy-anything-new-when-something-old-st-de6ed5.mp3 | never buy anything new when something old still works | 1 |
| /audio/child-mode/phrases/trumpets-are-better-than-harps-7f799d.mp3 | trumpets are better than harps | 1 |
| /audio/child-mode/phrases/never-tell-anyone-about-a-concert-6abb98.mp3 | never tell anyone about a concert | 1 |
| /audio/child-mode/phrases/the-hall-forgot-to-clap-once-adf146.mp3 | the hall forgot to clap once | 1 |
| /audio/child-mode/phrases/quiet-skill-can-speak-louder-than-showing-of-9f86a1.mp3 | quiet skill can speak louder than showing off | 1 |
| /audio/child-mode/phrases/knowing-help-is-near-can-build-courage-bbb13c.mp3 | knowing help is near can build courage | 1 |
| /audio/child-mode/phrases/darkness-is-truly-dangerous-7a24e6.mp3 | darkness is truly dangerous | 1 |
| /audio/child-mode/phrases/torches-belong-on-pillows-b8ff0c.mp3 | torches belong on pillows | 1 |
| /audio/child-mode/phrases/fathers-are-always-right-2fdebe.mp3 | fathers are always right | 1 |
| /audio/child-mode/phrases/always-aim-for-ten-out-of-ten-b76c0a.mp3 | always aim for ten out of ten | 1 |
| /audio/child-mode/phrases/spelling-tests-do-not-matter-d67d1f.mp3 | spelling tests do not matter | 1 |
| /audio/child-mode/phrases/a-list-lay-by-the-photocopier-ca6355.mp3 | a list lay by the photocopier | 1 |
| /audio/child-mode/phrases/being-honest-feels-better-than-winning-unfai-313a00.mp3 | being honest feels better than winning unfairly | 1 |
| /audio/child-mode/phrases/small-help-can-be-the-kindest-help-377279.mp3 | small help can be the kindest help | 1 |
| /audio/child-mode/phrases/never-touch-anything-outdoors-a749f6.mp3 | never touch anything outdoors | 1 |
| /audio/child-mode/phrases/storms-knock-down-nests-d7615a.mp3 | storms knock down nests | 1 |
| /audio/child-mode/phrases/lamps-can-keep-eggs-warm-4430db.mp3 | lamps can keep eggs warm | 1 |
| /audio/child-mode/phrases/a-jam-roll-collapsed-before-judging-b4d6e2.mp3 | a jam roll collapsed before judging | 1 |
| /audio/child-mode/phrases/friendship-can-matter-more-than-prizes-a040f0.mp3 | friendship can matter more than prizes | 1 |
| /audio/child-mode/phrases/never-enter-a-bake-off-202c0e.mp3 | never enter a bake-off | 1 |
| /audio/child-mode/phrases/lemon-cakes-beat-jam-rolls-b53460.mp3 | lemon cakes beat jam rolls | 1 |
| /audio/child-mode/phrases/gentle-words-teach-better-than-anger-a6d875.mp3 | gentle words teach better than anger | 1 |
| /audio/child-mode/phrases/echoes-live-in-stairwells-ad95a9.mp3 | echoes live in stairwells | 1 |
| /audio/child-mode/phrases/games-should-be-banned-indoors-d6c0d7.mp3 | games should be banned indoors | 1 |
| /audio/child-mode/phrases/third-floors-are-grumpy-dbfd42.mp3 | third floors are grumpy | 1 |
| /audio/child-mode/phrases/the-vote-was-nineteen-to-one-51166f.mp3 | the vote was nineteen to one | 1 |
| /audio/child-mode/phrases/lose-well-now-gain-friends-later-eb8bf4.mp3 | lose well now; gain friends later | 1 |
| /audio/child-mode/phrases/parties-are-better-than-nets-e9d35b.mp3 | parties are better than nets | 1 |
| /audio/child-mode/phrases/never-vote-against-the-class-503b55.mp3 | never vote against the class | 1 |
| /audio/child-mode/phrases/a-girl-owned-a-telescope-e9852c.mp3 | a girl owned a telescope | 1 |
| /audio/child-mode/phrases/wonders-grow-when-they-are-shared-b2f2db.mp3 | wonders grow when they are shared | 1 |
| /audio/child-mode/phrases/sana-chalked-a-sign-and-neighbours-queued-be352a.mp3 | Sana chalked a sign and neighbours queued | 1 |
| /audio/child-mode/phrases/a-comet-passed-during-one-week-e2e510.mp3 | a comet passed during one week | 1 |
| /audio/child-mode/phrases/the-museum-was-free-on-thursdays-829b1d.mp3 | the museum was free on Thursdays | 1 |
| /audio/child-mode/phrases/marisol-saw-whale-bones-cab770.mp3 | Marisol saw whale bones | 1 |
| /audio/child-mode/phrases/wrong-turns-can-lead-to-good-discoveries-c159bd.mp3 | wrong turns can lead to good discoveries | 1 |
| /audio/child-mode/phrases/a-driver-stopped-a-street-early-7d2618.mp3 | a driver stopped a street early | 1 |
| /audio/child-mode/phrases/the-teapot-was-taped-back-together-7acfc0.mp3 | the teapot was taped back together | 1 |
| /audio/child-mode/phrases/gran-kept-a-letter-in-her-purse-65dac6.mp3 | Gran kept a letter in her purse | 1 |
| /audio/child-mode/phrases/a-true-apology-names-the-wrong-and-mends-it-ca18a8.mp3 | a true apology names the wrong and mends it | 1 |
| /audio/child-mode/phrases/tom-broke-his-gran-s-teapot-8f5fd7.mp3 | Tom broke his gran's teapot | 1 |
| /audio/child-mode/phrases/the-harbourmaster-read-a-list-aloud-16cb76.mp3 | the harbourmaster read a list aloud | 1 |
| /audio/child-mode/phrases/the-keeper-retired-after-forty-years-cba029.mp3 | the keeper retired after forty years | 1 |
| /audio/child-mode/phrases/steady-unseen-work-holds-the-world-together-bd094d.mp3 | steady unseen work holds the world together | 1 |
| /audio/child-mode/phrases/a-keeper-wrote-down-ships-names-f4ea49.mp3 | a keeper wrote down ships' names | 1 |
| /audio/child-mode/phrases/a-great-wind-blew-at-the-festival-c07d68.mp3 | a great wind blew at the festival | 1 |
| /audio/child-mode/phrases/big-lanterns-tore-one-by-one-c063aa.mp3 | big lanterns tore one by one | 1 |
| /audio/child-mode/phrases/one-lantern-crossed-the-line-7784e4.mp3 | one lantern crossed the line | 1 |
| /audio/child-mode/phrases/what-is-built-to-last-beats-what-is-built-to-e4a140.mp3 | what is built to last beats what is built to impress | 1 |
| /audio/child-mode/phrases/one-goldfish-ate-the-others-flakes-aca98b.mp3 | one goldfish ate the others' flakes | 1 |
| /audio/child-mode/phrases/the-family-forgot-to-feed-the-fish-438401.mp3 | the family forgot to feed the fish | 1 |
| /audio/child-mode/phrases/two-fish-ate-water-weed-39b3ed.mp3 | two fish ate water-weed | 1 |
| /audio/child-mode/phrases/grabbing-the-most-can-leave-you-knowing-the-1a8497.mp3 | grabbing the most can leave you knowing the least | 1 |
| /audio/child-mode/phrases/mud-season-ruined-the-shoes-c05f61.mp3 | mud season ruined the shoes | 1 |
| /audio/child-mode/phrases/boots-were-dried-by-a-radiator-984844.mp3 | boots were dried by a radiator | 1 |
| /audio/child-mode/phrases/the-head-caught-ede-one-day-c97dc5.mp3 | the head caught Ede one day | 1 |
| /audio/child-mode/phrases/small-quiet-care-can-change-a-whole-place-a7beca.mp3 | small quiet care can change a whole place | 1 |
| /audio/child-mode/phrases/blocking-trouble-can-also-block-friendship-4f1b0b.mp3 | blocking trouble can also block friendship | 1 |
| /audio/child-mode/phrases/twins-drew-a-chalk-line-in-the-attic-fc9459.mp3 | twins drew a chalk line in the attic | 1 |
| /audio/child-mode/phrases/the-attic-became-very-tidy-3b6783.mp3 | the attic became very tidy | 1 |
| /audio/child-mode/phrases/the-chalk-was-washed-away-38889a.mp3 | the chalk was washed away | 1 |
| /audio/child-mode/phrases/ines-keeps-practising-her-times-tables-that-461dd3.mp3 | Ines keeps practising her times tables that will not stick, until one day they do | 1 |
| /audio/child-mode/phrases/ines-plants-a-sunflower-seed-in-a-pot-on-her-1875ce.mp3 | Ines plants a sunflower seed in a pot on her own windowsill at home | 1 |
| /audio/child-mode/phrases/ines-gives-up-learning-the-violin-after-one-c8923d.mp3 | Ines gives up learning the violin after one single squeaky week of lessons | 1 |
| /audio/child-mode/phrases/ines-waters-her-plant-once-and-forgets-it-574c31.mp3 | Ines waters her plant once and forgets it | 1 |
| /audio/child-mode/phrases/cam-saves-his-pocket-money-for-weeks-to-buy-c884d4.mp3 | Cam saves his pocket money for weeks to buy a brand-new comic | 1 |
| /audio/child-mode/phrases/cam-scratches-dad-s-bike-and-leaves-a-note-o-24154a.mp3 | Cam scratches Dad's bike and leaves a note owning up before Dad sees | 1 |
| /audio/child-mode/phrases/cam-reads-comics-carefully-indoors-39a38c.mp3 | Cam reads comics carefully indoors | 1 |
| /audio/child-mode/phrases/cam-hides-the-mug-he-broke-behind-the-cereal-b4918d.mp3 | Cam hides the mug he broke behind the cereal boxes where nobody looks | 1 |
| /audio/child-mode/phrases/ray-stays-with-a-lost-toddler-and-calls-a-gu-dd82d8.mp3 | Ray stays with a lost toddler and calls a guard | 1 |
| /audio/child-mode/phrases/ray-builds-every-bird-in-the-garden-a-wooden-639d1f.mp3 | Ray builds every bird in the garden a wooden house | 1 |
| /audio/child-mode/phrases/ray-carries-a-fallen-chick-home-to-raise-it-970c7a.mp3 | Ray carries a fallen chick home to raise it himself in a shoebox by his bed | 1 |
| /audio/child-mode/phrases/ray-watches-an-egg-hatch-on-television-ea2f5a.mp3 | Ray watches an egg hatch on television | 1 |
| /audio/child-mode/phrases/a-keeper-who-paints-his-lighthouse-red-5e075a.mp3 | a keeper who paints his lighthouse red | 1 |
| /audio/child-mode/phrases/the-caretaker-who-salts-the-school-steps-bef-92759e.mp3 | the caretaker who salts the school steps before anyone arrives, every icy morning, unthanked | 1 |
| /audio/child-mode/phrases/a-singer-who-performs-on-television-so-that-9e55a9.mp3 | a singer who performs on television so that millions can applaud her name | 1 |
| /audio/child-mode/phrases/a-sailor-who-names-his-boat-after-a-lighthou-dcd32d.mp3 | a sailor who names his boat after a lighthouse | 1 |
| /audio/child-mode/phrases/on-sports-day-vic-guards-his-bag-of-sweets-s-242777.mp3 | On sports day, Vic guards his bag of sweets so that nobody else gets a single one | 1 |
| /audio/child-mode/phrases/vic-enters-two-contests-in-one-day-7d6c1d.mp3 | Vic enters two contests in one day | 1 |
| /audio/child-mode/phrases/on-sports-day-vic-stops-mid-race-to-pull-up-2c2c45.mp3 | On sports day, Vic stops mid-race to pull up a fallen runner, finishing last together | 1 |
| /audio/child-mode/phrases/vic-bakes-a-lemon-cake-for-the-fair-cdf6ef.mp3 | Vic bakes a lemon cake for the fair | 1 |
| /audio/child-mode/phrases/jo-enters-the-festival-every-single-year-2e8b7c.mp3 | Jo enters the festival every single year | 1 |
| /audio/child-mode/phrases/jo-writes-three-strong-sentences-instead-of-378df4.mp3 | Jo writes three strong sentences instead of an unfinished epic | 1 |
| /audio/child-mode/phrases/jo-starts-building-the-biggest-grandest-sand-b02268.mp3 | Jo starts building the biggest, grandest sandcastle the beach has ever seen | 1 |
| /audio/child-mode/phrases/jo-carries-a-lantern-on-the-camping-trip-7692ff.mp3 | Jo carries a lantern on the camping trip | 1 |
| /audio/child-mode/phrases/dev-peeks-at-his-sister-s-cards-when-she-lea-adc126.mp3 | Dev peeks at his sister's cards when she leaves the room, and wins the game | 1 |
| /audio/child-mode/phrases/dev-posts-a-letter-for-his-teacher-24bf88.mp3 | Dev posts a letter for his teacher | 1 |
| /audio/child-mode/phrases/dev-s-ball-lands-over-the-line-he-calls-it-o-e6e763.mp3 | Dev's ball lands over the line; he calls it out himself, though no one saw | 1 |
| /audio/child-mode/phrases/dev-studies-spelling-every-thursday-night-856fea.mp3 | Dev studies spelling every Thursday night | 1 |
| /audio/child-mode/phrases/mia-chalks-a-hopscotch-grid-on-the-path-6203e9.mp3 | Mia chalks a hopscotch grid on the path | 1 |
| /audio/child-mode/phrases/after-a-quarrel-mia-labels-every-pencil-she-7ff46e.mp3 | After a quarrel, Mia labels every pencil she owns so nobody can ever borrow one | 1 |
| /audio/child-mode/phrases/mia-tidies-the-attic-every-sunday-f66d64.mp3 | Mia tidies the attic every Sunday | 1 |
| /audio/child-mode/phrases/mia-opens-the-blocked-den-and-welcomes-her-b-552a92.mp3 | Mia opens the blocked den and welcomes her brother back | 1 |
| /audio/child-mode/phrases/homework-is-a-waste-of-time-549368.mp3 | homework is a waste of time | 1 |
| /audio/child-mode/phrases/teachers-use-whiteboards-8f0bc6.mp3 | teachers use whiteboards | 1 |
| /audio/child-mode/phrases/copying-steals-your-own-chance-to-learn-82cd97.mp3 | copying steals your own chance to learn | 1 |
| /audio/child-mode/phrases/zia-got-three-answers-wrong-faaee5.mp3 | Zia got three answers wrong | 1 |
| /audio/child-mode/phrases/a-windscreen-had-frost-on-it-cab162.mp3 | a windscreen had frost on it | 1 |
| /audio/child-mode/phrases/bins-should-stay-by-the-road-287543.mp3 | bins should stay by the road | 1 |
| /audio/child-mode/phrases/winter-mornings-are-cold-e064e6.mp3 | winter mornings are cold | 1 |
| /audio/child-mode/phrases/neighbourly-kindness-circles-back-around-ba7168.mp3 | neighbourly kindness circles back around | 1 |
| /audio/child-mode/phrases/step-by-step-effort-builds-real-skill-80249e.mp3 | step-by-step effort builds real skill | 1 |
| /audio/child-mode/phrases/rosa-touched-the-yellow-buoy-80d198.mp3 | Rosa touched the yellow buoy | 1 |
| /audio/child-mode/phrases/stay-out-of-the-sea-in-june-6159f5.mp3 | stay out of the sea in June | 1 |
| /audio/child-mode/phrases/beaches-have-buoys-a1b183.mp3 | beaches have buoys | 1 |
| /audio/child-mode/phrases/football-happens-at-lunch-cd7dc3.mp3 | football happens at lunch | 1 |
| /audio/child-mode/phrases/a-wrong-can-be-mended-even-slowly-ce3fc3.mp3 | a wrong can be mended, even slowly | 1 |
| /audio/child-mode/phrases/ollie-s-glasses-were-taped-52ffa4.mp3 | Ollie's glasses were taped | 1 |
| /audio/child-mode/phrases/teasing-makes-people-laugh-329f3c.mp3 | teasing makes people laugh | 1 |
| /audio/child-mode/phrases/small-children-should-queue-elsewhere-44991a.mp3 | small children should queue elsewhere | 1 |
| /audio/child-mode/phrases/corridors-get-crowded-604e3f.mp3 | corridors get crowded | 1 |
| /audio/child-mode/phrases/protection-given-is-remembered-and-returned-54893c.mp3 | protection given is remembered and returned | 1 |
| /audio/child-mode/phrases/the-lunch-queue-had-a-crush-e674ec.mp3 | the lunch queue had a crush | 1 |
| /audio/child-mode/phrases/the-dog-left-the-room-e9214c.mp3 | the dog left the room | 1 |
| /audio/child-mode/phrases/recorders-are-hopeless-instruments-66a82d.mp3 | recorders are hopeless instruments | 1 |
| /audio/child-mode/phrases/sheds-are-for-practising-b2f95d.mp3 | sheds are for practising | 1 |
| /audio/child-mode/phrases/a-little-practice-every-day-wears-problems-s-42ec66.mp3 | a little practice every day wears problems smooth | 1 |
| /audio/child-mode/phrases/confessing-is-quicker-and-lighter-than-hidin-2c18b7.mp3 | confessing is quicker and lighter than hiding | 1 |
| /audio/child-mode/phrases/the-globe-got-a-dent-d8aae2.mp3 | the globe got a dent | 1 |
| /audio/child-mode/phrases/globes-should-be-bolted-down-d75979.mp3 | globes should be bolted down | 1 |
| /audio/child-mode/phrases/secrets-keep-you-company-d5348c.mp3 | secrets keep you company | 1 |
| /audio/child-mode/phrases/floods-happen-on-lanes-90aeb6.mp3 | floods happen on lanes | 1 |
| /audio/child-mode/phrases/long-kindness-may-be-repaid-quickly-65b7eb.mp3 | long kindness may be repaid quickly | 1 |
| /audio/child-mode/phrases/a-foot-of-water-entered-the-shop-284779.mp3 | a foot of water entered the shop | 1 |
| /audio/child-mode/phrases/shops-should-not-give-credit-96731a.mp3 | shops should not give credit | 1 |
| /audio/child-mode/phrases/chess-clubs-need-two-classrooms-dcb08b.mp3 | chess clubs need two classrooms | 1 |
| /audio/child-mode/phrases/never-let-anyone-win-7dea79.mp3 | never let anyone win | 1 |
| /audio/child-mode/phrases/beginners-ruin-clubs-b85379.mp3 | beginners ruin clubs | 1 |
| /audio/child-mode/phrases/lifting-others-can-beat-winning-alone-2bebae.mp3 | lifting others can beat winning alone | 1 |
| /audio/child-mode/phrases/there-is-hidden-wisdom-in-ways-that-look-unt-466183.mp3 | there is hidden wisdom in ways that look untidy | 1 |
| /audio/child-mode/phrases/blight-took-the-street-s-tomatoes-eea34d.mp3 | blight took the street's tomatoes | 1 |
| /audio/child-mode/phrases/neat-rows-are-always-wrong-14eda9.mp3 | neat rows are always wrong | 1 |
| /audio/child-mode/phrases/pumpkins-wander-paths-59fc2b.mp3 | pumpkins wander paths | 1 |
| /audio/child-mode/phrases/the-horse-bowed-on-the-night-21de27.mp3 | the horse bowed on the night | 1 |
| /audio/child-mode/phrases/working-as-one-can-join-people-for-good-bbf931.mp3 | working as one can join people for good | 1 |
| /audio/child-mode/phrases/a-play-needed-a-horse-costume-6b8af9.mp3 | a play needed a horse costume | 1 |
| /audio/child-mode/phrases/rehearsals-went-badly-at-first-e28e9d.mp3 | rehearsals went badly at first | 1 |
| /audio/child-mode/phrases/the-family-expected-jewellery-c5a1ba.mp3 | the family expected jewellery | 1 |
| /audio/child-mode/phrases/a-tree-blossomed-in-spring-61640b.mp3 | a tree blossomed in spring | 1 |
| /audio/child-mode/phrases/a-life-spent-giving-is-its-own-treasure-2bf2c9.mp3 | a life spent giving is its own treasure | 1 |
| /audio/child-mode/phrases/a-box-held-a-trowel-and-seeds-9b954e.mp3 | a box held a trowel and seeds | 1 |
| /audio/child-mode/phrases/tess-polishes-the-class-globe-till-it-shines-b5aae5.mp3 | Tess polishes the class globe till it shines | 1 |
| /audio/child-mode/phrases/tess-quietly-slides-the-juice-stained-book-t-e30c20.mp3 | Tess quietly slides the juice-stained book to the very bottom of the returns pile | 1 |
| /audio/child-mode/phrases/tess-reads-with-juice-far-away-from-books-72761f.mp3 | Tess reads with juice far away from books | 1 |
| /audio/child-mode/phrases/tess-tells-the-librarian-today-about-the-jui-ace69c.mp3 | Tess tells the librarian TODAY about the juice she spilled on page nine | 1 |
| /audio/child-mode/phrases/ojas-sharpens-the-class-pencil-pot-every-mor-6e8fc8.mp3 | Ojas sharpens the class pencil pot every morning before anyone notices | 1 |
| /audio/child-mode/phrases/ojas-wins-the-school-kindness-certificate-on-c07c3c.mp3 | Ojas wins the school kindness certificate on stage | 1 |
| /audio/child-mode/phrases/ojas-dries-his-own-boots-by-the-radiator-and-261d79.mp3 | Ojas dries his own boots by the radiator and leaves everyone else's dripping | 1 |
| /audio/child-mode/phrases/ojas-buys-new-boots-for-himself-5e5195.mp3 | Ojas buys new boots for himself | 1 |
| /audio/child-mode/phrases/libraries-need-cushions-42d907.mp3 | libraries need cushions | 1 |
| /audio/child-mode/phrases/listening-shows-you-what-talking-drowns-out-30ad19.mp3 | listening shows you what talking drowns out | 1 |
| /audio/child-mode/phrases/a-sponsored-silence-raised-money-aad889.mp3 | a sponsored silence raised money | 1 |
| /audio/child-mode/phrases/talking-is-always-wrong-3e6357.mp3 | talking is always wrong | 1 |
| /audio/child-mode/phrases/bea-enters-the-lantern-festival-next-year-5e7319.mp3 | Bea enters the lantern festival next year | 1 |
| /audio/child-mode/phrases/bea-judges-the-fair-with-the-teachers-375d48.mp3 | Bea judges the fair with the teachers | 1 |
| /audio/child-mode/phrases/bea-makes-a-small-volcano-that-works-every-t-754da2.mp3 | Bea makes a small volcano that works every time | 1 |
| /audio/child-mode/phrases/bea-spends-every-evening-decorating-her-proj-b4b2ff.mp3 | Bea spends every evening decorating her project with gold ribbon and glitter | 1 |

## 6. Images — missing slots with drawing briefs

All 2111 image slots resolve to existing art on disk. Any NEW art must follow the image spec above.

## Delivery

1. Land audio under `public/audio/…` and images under `public/images/…` at the exact paths above.
2. Wire prompt/sentence/passage audio in `audioPreferenceManifest` keyed by script text; word/phrase pools are picked up by the existing resolvers.
3. Run `node tools/assessmentRebuild/mediaRequest.mjs` — the missing counts above must all reach 0.
4. Run the media QA pass; nothing ships with `qaStatus` below approved.
