# FINAL media production request — Skills assessments v3 (all 30 skills)

Generated 2026-08-01T03:31:00.623Z from the shipped v3 banks. Regenerate with `node tools/assessmentRebuild/mediaRequest.mjs` after any bank change — never edit by hand. Machine-readable copy with the FULL per-item mapping: `MEDIA_REQUEST.json` (`items[]` maps every question id to its exact audio files and image paths).

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
| Instruction/prompt lines | 1715 | 0 |
| Sentence read-alouds | 615 | 0 |
| Passage read-alouds | 0 | 0 |
| Single-word recordings | 1483 | 0 |
| Phrase recordings | 185 | 0 |
| Image slots | 1517 | 0 |

## Per-skill volume

| Skill | Items | Prompts | Sentences | Passages | Words | Phrases | Image slots | Missing images |
|---|---|---|---|---|---|---|---|---|
| adjectives | 60 | 60 | 17 | 0 | 240 | 0 | 93 | 0 |
| antonyms_synonyms | 60 | 60 | 14 | 0 | 269 | 0 | 114 | 0 |
| blends | 106 | 106 | 0 | 0 | 503 | 0 | 148 | 0 |
| cvc_short_vowels | 70 | 70 | 0 | 0 | 271 | 0 | 70 | 0 |
| digraphs | 60 | 60 | 0 | 0 | 276 | 0 | 132 | 0 |
| final_sounds | 82 | 82 | 0 | 0 | 410 | 0 | 121 | 0 |
| hfw_1_25 | 135 | 135 | 108 | 0 | 381 | 0 | 135 | 0 |
| hfw_26_50 | 135 | 135 | 108 | 0 | 378 | 0 | 135 | 0 |
| hfw_51_75 | 135 | 135 | 108 | 0 | 378 | 0 | 135 | 0 |
| hfw_76_100 | 135 | 135 | 108 | 0 | 378 | 0 | 135 | 0 |
| homophones_homonyms | 80 | 80 | 41 | 0 | 304 | 16 | 80 | 0 |
| initial_sounds | 160 | 160 | 0 | 0 | 800 | 0 | 325 | 0 |
| long_vowels_silent_e | 68 | 68 | 0 | 0 | 188 | 112 | 68 | 0 |
| nouns | 60 | 60 | 12 | 0 | 208 | 32 | 102 | 0 |
| plurals | 60 | 60 | 31 | 0 | 240 | 0 | 60 | 0 |
| prefixes_suffixes | 78 | 78 | 16 | 0 | 296 | 52 | 78 | 0 |
| prepositions_of_place | 76 | 76 | 34 | 0 | 207 | 97 | 76 | 0 |
| r_controlled_vowels | 70 | 70 | 0 | 0 | 333 | 0 | 70 | 0 |
| rhyming | 145 | 145 | 0 | 0 | 697 | 0 | 349 | 0 |
| short_vowel_discrimination | 70 | 70 | 0 | 0 | 310 | 0 | 106 | 0 |
| verbs | 58 | 58 | 18 | 0 | 232 | 0 | 100 | 0 |
| vowel_teams | 90 | 90 | 0 | 0 | 408 | 0 | 90 | 0 |

## 1. Instruction/prompt recordings — record each line verbatim

| File | Script (read exactly) | Used by |
|---|---|---|
| /audio/production/en-US/supplemental/which-one-is-very-big-5744a411f5.mp3 | Which one is very big? | 1 |
| /audio/production/en-US/supplemental/which-one-is-tiny-308181c343.mp3 | Which one is tiny? | 1 |
| /audio/production/en-US/supplemental/which-one-is-very-tall-c4084a4972.mp3 | Which one is very tall? | 1 |
| /audio/production/en-US/supplemental/which-word-is-a-describing-word-for-size-4d41cf199a.mp3 | Which word is a describing word for size? | 4 |
| /audio/production/en-US/supplemental/which-one-is-green-811ab75cbb.mp3 | Which one is green? | 1 |
| /audio/production/en-US/supplemental/which-one-is-yellow-c9c2311893.mp3 | Which one is yellow? | 1 |
| /audio/production/en-US/supplemental/which-word-is-a-colour-word-df608fcd5f.mp3 | Which word is a colour word? | 5 |
| /audio/production/en-US/supplemental/which-one-feels-soft-fe042432ba.mp3 | Which one feels soft? | 1 |
| /audio/production/en-US/supplemental/which-one-feels-wet-04df609a9b.mp3 | Which one feels wet? | 1 |
| /audio/production/en-US/supplemental/which-one-feels-hard-428d97c587.mp3 | Which one feels hard? | 1 |
| /audio/production/en-US/supplemental/which-word-is-a-describing-word-for-how-things-feel-8a88ce3138.mp3 | Which word is a describing word for how things feel? | 4 |
| /audio/production/en-US/supplemental/which-one-shows-a-happy-face-bdfff68830.mp3 | Which one shows a happy face? | 1 |
| /audio/production/en-US/supplemental/which-word-is-a-feeling-word-faa25ca35a.mp3 | Which word is a feeling word? | 7 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-soup-burned-my-lip-cf411d62b7.mp3 | Which describing word finishes the sentence? The … soup burned my lip. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-my-boots-let-the-rain-in-89533093ed.mp3 | Which describing word finishes the sentence? My … boots let the rain in. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-box-needed-two-of-us-to-e6fae9eb6a.mp3 | Which describing word finishes the sentence? The … box needed two of us to lift. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-we-squinted-in-the-sunshine-05980ec61c.mp3 | Which describing word finishes the sentence? We squinted in the … sunshine. | 1 |
| /audio/production/en-US/supplemental/which-word-in-this-sentence-is-the-describing-word-the-muddy-pup-shook-i-5a9073e719.mp3 | Which word in this sentence is the describing word? "The muddy pup shook itself." | 1 |
| /audio/production/en-US/supplemental/which-word-in-this-sentence-is-the-describing-word-a-gentle-breeze-turne-001275d996.mp3 | Which word in this sentence is the describing word? "A gentle breeze turned the pages." | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-kitten-slept-through-the-d1ca40812e.mp3 | Which describing word finishes the sentence? The … kitten slept through the storm. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-her-scarf-trailed-on-the-gro-7552dfb11a.mp3 | Which describing word finishes the sentence? Her … scarf trailed on the ground. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-path-was-after-days-of-r-2bb2977b6b.mp3 | Which describing word finishes the sentence? The path was … after days of rain. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-lemonade-was-and-made-ou-4e6318780c.mp3 | Which describing word finishes the sentence? The lemonade was … and made our mouths pucker. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-old-stairs-were-and-groa-1bb971a8d9.mp3 | Which describing word finishes the sentence? The old stairs were … and groaned under our feet. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-wear-the-coat-it-is-snowing-6e0a80955e.mp3 | Which describing word finishes the sentence? Wear the … coat — it is snowing hard. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-fits-best-for-a-street-with-no-sound-at-all-0fb3fda27d.mp3 | Which describing word fits best for a street with no sound at all? | 1 |
| /audio/production/en-US/supplemental/which-describing-word-fits-best-for-bread-just-out-of-the-oven-358b0218e9.mp3 | Which describing word fits best for bread just out of the oven? | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-knife-went-through-the-p-1d717deb5f.mp3 | Which describing word finishes the sentence? The … knife went through the pumpkin easily. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-our-tent-felt-with-five-of-u-cb909ca5e2.mp3 | Which describing word finishes the sentence? Our tent felt … with five of us in it. | 1 |
| /audio/production/en-US/supplemental/which-word-is-a-describing-word-not-a-naming-or-doing-word-184fc3bdc3.mp3 | Which word is a describing word, not a naming or doing word? | 7 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-sea-tossed-the-little-bo-7dc20f6513.mp3 | Which describing word finishes the sentence? The … sea tossed the little boat. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-a-morning-is-best-for-kites-5ebd7f9fc4.mp3 | Which describing word finishes the sentence? A … morning is best for kites. | 1 |
| /audio/production/en-US/supplemental/which-one-is-very-small-6c736d3027.mp3 | Which one is very small? | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-floor-squeaked-with-ever-1e9078d25e.mp3 | Which describing word finishes the sentence? The … floor squeaked with every step. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-rope-was-too-to-snap-05505d1d35.mp3 | Which describing word finishes the sentence? The rope was too … to snap. | 1 |
| /audio/production/en-US/supplemental/which-one-feels-bumpy-1a98fa4fc2.mp3 | Which one feels bumpy? | 1 |
| /audio/production/en-US/supplemental/which-describing-word-finishes-the-sentence-the-moth-circled-the-lamp-81b2b8d57e.mp3 | Which describing word finishes the sentence? The … moth circled the lamp. | 1 |
| /audio/production/en-US/supplemental/which-describing-word-fits-best-for-socks-left-out-in-the-snow-93f6266291.mp3 | Which describing word fits best for socks left out in the snow? | 1 |
| /audio/production/en-US/supplemental/what-is-the-opposite-of-hot-4a48472a14.mp3 | What is the opposite of hot? | 1 |
| /audio/production/en-US/supplemental/what-is-the-opposite-of-big-81206321a8.mp3 | What is the opposite of big? | 1 |
| /audio/production/en-US/supplemental/what-is-the-opposite-of-up-aa2f83cf3a.mp3 | What is the opposite of up? | 1 |
| /audio/production/en-US/supplemental/what-is-the-opposite-of-wet-d4b08a507f.mp3 | What is the opposite of wet? | 1 |
| /audio/production/en-US/supplemental/the-picture-shows-something-hot-pick-the-opposite-of-hot-26ff42428a.mp3 | The picture shows something hot. Pick the opposite of hot. | 1 |
| /audio/production/en-US/supplemental/the-whale-in-the-picture-is-big-pick-the-opposite-of-big-9f4904f311.mp3 | The whale in the picture is big. Pick the opposite of big. | 1 |
| /audio/production/en-US/supplemental/which-word-means-about-the-same-as-happy-d13757f675.mp3 | Which word means about the same as happy? | 1 |
| /audio/production/en-US/supplemental/which-word-means-about-the-same-as-shout-259f9cb88e.mp3 | Which word means about the same as shout? | 1 |
| /audio/production/en-US/supplemental/which-word-means-about-the-same-as-little-a969e93a0b.mp3 | Which word means about the same as little? | 1 |
| /audio/production/en-US/supplemental/which-word-means-about-the-same-as-begin-05d7025c96.mp3 | Which word means about the same as begin? | 1 |
| /audio/production/en-US/supplemental/the-picture-shows-the-sea-which-word-is-closest-to-sea-7d766a2b7b.mp3 | The picture shows the sea. Which word is closest to 'sea'? | 1 |
| /audio/production/en-US/supplemental/the-rain-makes-things-wet-which-word-is-closest-to-wet-ef52ea34d4.mp3 | The rain makes things wet. Which word is closest to 'wet'? | 1 |
| /audio/production/en-US/supplemental/the-arrow-points-up-pick-the-opposite-of-up-b2ecc451ca.mp3 | The arrow points up. Pick the opposite of up. | 1 |
| /audio/production/en-US/supplemental/it-is-night-in-the-picture-pick-the-opposite-of-night-64fe425143.mp3 | It is night in the picture. Pick the opposite of night. | 1 |
| /audio/production/en-US/supplemental/the-shoes-in-the-picture-are-new-pick-the-opposite-of-new-0eb73b2b21.mp3 | The shoes in the picture are new. Pick the opposite of new. | 1 |
| /audio/production/en-US/supplemental/the-door-in-the-picture-is-open-pick-the-opposite-of-open-a0136fd130.mp3 | The door in the picture is open. Pick the opposite of open. | 1 |
| /audio/production/en-US/supplemental/what-is-the-opposite-of-day-b9b9b5051b.mp3 | What is the opposite of day? | 1 |
| /audio/production/en-US/supplemental/what-is-the-opposite-of-tall-05e1c12fa0.mp3 | What is the opposite of tall? | 1 |
| /audio/production/en-US/supplemental/the-sun-is-bright-which-word-is-closest-to-bright-189eb3d2be.mp3 | The sun is bright. Which word is closest to 'bright'? | 1 |
| /audio/production/en-US/supplemental/the-rock-is-hard-which-word-is-closest-to-hard-3db82951d4.mp3 | The rock is hard. Which word is closest to 'hard'? | 1 |
| /audio/production/en-US/supplemental/snow-is-cold-which-word-is-closest-to-cold-1ba6284f25.mp3 | Snow is cold. Which word is closest to 'cold'? | 1 |
| /audio/production/en-US/supplemental/the-ant-is-tiny-which-word-is-closest-to-tiny-b5559aba1b.mp3 | The ant is tiny. Which word is closest to 'tiny'? | 1 |
| /audio/production/en-US/supplemental/pick-a-synonym-for-quick-880aedfb64.mp3 | Pick a synonym for quick. | 1 |
| /audio/production/en-US/supplemental/which-word-means-about-the-same-as-sleepy-8be47fdc2d.mp3 | Which word means about the same as sleepy? | 1 |
| /audio/production/en-US/supplemental/which-is-the-exact-opposite-of-whisper-f5c159bc7c.mp3 | Which is the exact opposite of 'whisper'? | 1 |
| /audio/production/en-US/supplemental/which-is-the-exact-opposite-of-freezing-1616c4b4e0.mp3 | Which is the exact opposite of 'freezing'? | 1 |
| /audio/production/en-US/supplemental/which-is-the-exact-opposite-of-giant-fad6436e74.mp3 | Which is the exact opposite of 'giant'? | 1 |
| /audio/production/en-US/supplemental/pick-the-antonym-of-noisy-569f6a75d4.mp3 | Pick the antonym of 'noisy'. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-the-kitten-is-tame-the-tiger-is-20ed9b473e.mp3 | Which word fits the swap? The kitten is tame. The tiger is …. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-this-puzzle-is-simple-its-opposite-is-347a2d8590.mp3 | Which word fits the swap? This puzzle is simple. Its opposite is …. | 1 |
| /audio/production/en-US/supplemental/which-word-is-closest-to-giggle-81a3b69ed2.mp3 | Which word is closest to 'giggle'? | 1 |
| /audio/production/en-US/supplemental/which-word-is-closest-to-huge-8745556ce6.mp3 | Which word is closest to 'huge'? | 1 |
| /audio/production/en-US/supplemental/which-word-is-closest-to-sprint-9f15a68c5e.mp3 | Which word is closest to 'sprint'? | 1 |
| /audio/production/en-US/supplemental/which-word-is-closest-to-grin-10083a0378.mp3 | Which word is closest to 'grin'? | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-the-mouse-is-not-just-small-it-is-a9e6a0fd71.mp3 | Which word fits the swap? The mouse is not just small. It is …. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-not-just-cold-the-pond-was-this-morning-54642ea04d.mp3 | Which word fits the swap? Not just cold — the pond was … this morning. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-the-morning-was-noisy-the-night-was-167c65d5b6.mp3 | Which word fits the swap? The morning was noisy. The night was …. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-this-bag-is-heavy-that-bag-is-f991619c08.mp3 | Which word fits the swap? This bag is heavy. That bag is …. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-the-turtle-is-slow-the-hare-is-94bed9e939.mp3 | Which word fits the swap? The turtle is slow. The hare is …. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-my-hands-were-dirty-now-they-are-ae933d0fcd.mp3 | Which word fits the swap? My hands were dirty. Now they are …. | 1 |
| /audio/production/en-US/supplemental/which-word-is-the-opposite-of-above-f005c988cc.mp3 | Which word is the opposite of 'above'? | 1 |
| /audio/production/en-US/supplemental/which-word-is-the-opposite-of-early-01d2e5a1f0.mp3 | Which word is the opposite of 'early'? | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-dad-fixed-the-gate-in-the-same-way-he-the-fence-9b2192f775.mp3 | Which word fits the swap? Dad fixed the gate. In the same way, he … the fence. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-the-soup-was-tasty-its-twin-word-is-eb7029238a.mp3 | Which word fits the swap? The soup was tasty. Its twin word is …. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-we-shouted-with-joy-joy-s-twin-word-is-001b3e8677.mp3 | Which word fits the swap? We shouted with joy. Joy's twin word is …. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-the-path-was-narrow-its-twin-word-is-906cab6599.mp3 | Which word fits the swap? The path was narrow. Its twin word is …. | 1 |
| /audio/production/en-US/supplemental/which-word-is-closest-to-angry-74594ac328.mp3 | Which word is closest to 'angry'? | 1 |
| /audio/production/en-US/supplemental/which-word-is-closest-to-friend-db637e5cba.mp3 | Which word is closest to 'friend'? | 1 |
| /audio/production/en-US/supplemental/what-is-the-opposite-of-high-ad6ffb36f6.mp3 | What is the opposite of high? | 1 |
| /audio/production/en-US/supplemental/the-boots-are-old-pick-the-opposite-of-old-8f9e5b1cff.mp3 | The boots are old. Pick the opposite of old. | 1 |
| /audio/production/en-US/supplemental/pick-a-synonym-for-jump-f8c3f33cba.mp3 | Pick a synonym for jump. | 1 |
| /audio/production/en-US/supplemental/pick-a-synonym-for-yell-bee036f63e.mp3 | Pick a synonym for yell. | 1 |
| /audio/production/en-US/supplemental/the-arrow-points-down-pick-the-opposite-of-down-64a515221c.mp3 | The arrow points down. Pick the opposite of down. | 1 |
| /audio/production/en-US/supplemental/the-moon-glows-which-is-closest-to-glow-26f4071562.mp3 | The moon glows. Which is closest to 'glow'? | 1 |
| /audio/production/en-US/supplemental/which-is-the-exact-opposite-of-arrive-dec1ddb559.mp3 | Which is the exact opposite of 'arrive'? | 1 |
| /audio/production/en-US/supplemental/which-is-the-exact-opposite-of-sunrise-3bcc049617.mp3 | Which is the exact opposite of 'sunrise'? | 1 |
| /audio/production/en-US/supplemental/which-word-is-closest-to-soaked-245e5f8f97.mp3 | Which word is closest to 'soaked'? | 1 |
| /audio/production/en-US/supplemental/which-word-is-closest-to-spotless-7795f65da4.mp3 | Which word is closest to 'spotless'? | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-the-oven-is-hot-the-fridge-is-fabf76a6f9.mp3 | Which word fits the swap? The oven is hot. The fridge is …. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-swap-the-old-map-was-torn-it-was-d6686d5135.mp3 | Which word fits the swap? The old map was torn. It was …. | 1 |
| /audio/production/en-US/supplemental/block-which-letters-finish-the-word-block-099c16973e.mp3 | block. Which letters finish the word block? | 1 |
| /audio/production/en-US/supplemental/blue-which-one-starts-with-the-same-sounds-as-blue-8acb468b51.mp3 | blue. Which one starts with the same sounds as blue? | 1 |
| /audio/production/en-US/supplemental/which-word-goes-with-the-picture-78b86586a3.mp3 | Which word goes with the picture? | 78 |
| /audio/production/en-US/supplemental/blue-which-letters-finish-the-word-blue-27245c4720.mp3 | blue. Which letters finish the word blue? | 1 |
| /audio/production/en-US/supplemental/clap-which-letters-finish-the-word-clap-fb570310b0.mp3 | clap. Which letters finish the word clap? | 1 |
| /audio/production/en-US/supplemental/clap-which-one-starts-with-the-same-sounds-as-clap-a8117b78ed.mp3 | clap. Which one starts with the same sounds as clap? | 1 |
| /audio/production/en-US/supplemental/cloth-which-letters-finish-the-word-cloth-c8e8d4f0c0.mp3 | cloth. Which letters finish the word cloth? | 1 |
| /audio/production/en-US/supplemental/flag-which-letters-finish-the-word-flag-7abf3cb12a.mp3 | flag. Which letters finish the word flag? | 1 |
| /audio/production/en-US/supplemental/flower-which-one-starts-with-the-same-sounds-as-flower-b3220653e4.mp3 | flower. Which one starts with the same sounds as flower? | 1 |
| /audio/production/en-US/supplemental/flute-which-letters-finish-the-word-flute-bb88761cbe.mp3 | flute. Which letters finish the word flute? | 1 |
| /audio/production/en-US/supplemental/plug-which-letters-finish-the-word-plug-7072861e84.mp3 | plug. Which letters finish the word plug? | 1 |
| /audio/production/en-US/supplemental/play-which-one-starts-with-the-same-sounds-as-play-24c1bb57f3.mp3 | play. Which one starts with the same sounds as play? | 1 |
| /audio/production/en-US/supplemental/plant-which-letters-finish-the-word-plant-33f6140b6a.mp3 | plant. Which letters finish the word plant? | 1 |
| /audio/production/en-US/supplemental/sled-which-letters-finish-the-word-sled-325d6f5914.mp3 | sled. Which letters finish the word sled? | 1 |
| /audio/production/en-US/supplemental/slip-which-one-starts-with-the-same-sounds-as-slip-2452a32043.mp3 | slip. Which one starts with the same sounds as slip? | 1 |
| /audio/production/en-US/supplemental/slide-which-letters-finish-the-word-slide-435c5d8ee6.mp3 | slide. Which letters finish the word slide? | 1 |
| /audio/production/en-US/supplemental/bread-which-letters-finish-the-word-bread-874ba3d922.mp3 | bread. Which letters finish the word bread? | 1 |
| /audio/production/en-US/supplemental/brown-which-one-starts-with-the-same-sounds-as-brown-686374cd51.mp3 | brown. Which one starts with the same sounds as brown? | 1 |
| /audio/production/en-US/supplemental/brick-which-letters-finish-the-word-brick-4e959c6d47.mp3 | brick. Which letters finish the word brick? | 1 |
| /audio/production/en-US/supplemental/crab-which-letters-finish-the-word-crab-e662b1caf7.mp3 | crab. Which letters finish the word crab? | 1 |
| /audio/production/en-US/supplemental/crown-which-one-starts-with-the-same-sounds-as-crown-a1c5bbebc6.mp3 | crown. Which one starts with the same sounds as crown? | 1 |
| /audio/production/en-US/supplemental/crown-which-letters-finish-the-word-crown-3455822ea7.mp3 | crown. Which letters finish the word crown? | 1 |
| /audio/production/en-US/supplemental/drum-which-letters-finish-the-word-drum-885ffad159.mp3 | drum. Which letters finish the word drum? | 1 |
| /audio/production/en-US/supplemental/dress-which-one-starts-with-the-same-sounds-as-dress-47dfaeaac3.mp3 | dress. Which one starts with the same sounds as dress? | 1 |
| /audio/production/en-US/supplemental/draw-which-letters-finish-the-word-draw-b39f62ce1a.mp3 | draw. Which letters finish the word draw? | 2 |
| /audio/production/en-US/supplemental/frog-which-letters-finish-the-word-frog-b2e1d73ad1.mp3 | frog. Which letters finish the word frog? | 1 |
| /audio/production/en-US/supplemental/fruit-which-one-starts-with-the-same-sounds-as-fruit-f8c286fcf4.mp3 | fruit. Which one starts with the same sounds as fruit? | 1 |
| /audio/production/en-US/supplemental/fruit-which-letters-finish-the-word-fruit-d3106b7256.mp3 | fruit. Which letters finish the word fruit? | 1 |
| /audio/production/en-US/supplemental/grapes-which-letters-finish-the-word-grapes-002fe7350c.mp3 | grapes. Which letters finish the word grapes? | 1 |
| /audio/production/en-US/supplemental/green-which-one-starts-with-the-same-sounds-as-green-680fbc1cb5.mp3 | green. Which one starts with the same sounds as green? | 1 |
| /audio/production/en-US/supplemental/green-which-letters-finish-the-word-green-e8ce6b5692.mp3 | green. Which letters finish the word green? | 2 |
| /audio/production/en-US/supplemental/star-which-letters-finish-the-word-star-3084787517.mp3 | star. Which letters finish the word star? | 2 |
| /audio/production/en-US/supplemental/star-which-one-starts-with-the-same-sounds-as-star-a114c4ec20.mp3 | star. Which one starts with the same sounds as star? | 1 |
| /audio/production/en-US/supplemental/stop-which-letters-finish-the-word-stop-59f7c29681.mp3 | stop. Which letters finish the word stop? | 1 |
| /audio/production/en-US/supplemental/swim-which-letters-finish-the-word-swim-36c49f835b.mp3 | swim. Which letters finish the word swim? | 1 |
| /audio/production/en-US/supplemental/sweet-which-one-starts-with-the-same-sounds-as-sweet-ec0b283965.mp3 | sweet. Which one starts with the same sounds as sweet? | 1 |
| /audio/production/en-US/supplemental/swing-which-letters-finish-the-word-swing-9a847fab5c.mp3 | swing. Which letters finish the word swing? | 1 |
| /audio/production/en-US/supplemental/scarf-which-letters-finish-the-word-scarf-9e91a0c2ad.mp3 | scarf. Which letters finish the word scarf? | 2 |
| /audio/production/en-US/supplemental/scooter-which-letters-finish-the-word-scooter-5aa812bd1c.mp3 | scooter. Which letters finish the word scooter? | 1 |
| /audio/production/en-US/supplemental/score-which-letters-finish-the-word-score-5bfc6c5309.mp3 | score. Which letters finish the word score? | 1 |
| /audio/production/en-US/supplemental/skateboard-which-letters-finish-the-word-skateboard-23d9ed65fc.mp3 | skateboard. Which letters finish the word skateboard? | 1 |
| /audio/production/en-US/supplemental/skip-which-letters-finish-the-word-skip-aee61052ca.mp3 | skip. Which letters finish the word skip? | 1 |
| /audio/production/en-US/supplemental/skin-which-letters-finish-the-word-skin-b9ca75f496.mp3 | skin. Which letters finish the word skin? | 1 |
| /audio/production/en-US/supplemental/smile-which-letters-finish-the-word-smile-9dd6684a74.mp3 | smile. Which letters finish the word smile? | 1 |
| /audio/production/en-US/supplemental/smell-which-letters-finish-the-word-smell-0dcbeaf842.mp3 | smell. Which letters finish the word smell? | 1 |
| /audio/production/en-US/supplemental/smoke-which-letters-finish-the-word-smoke-6473232d69.mp3 | smoke. Which letters finish the word smoke? | 1 |
| /audio/production/en-US/supplemental/snake-which-letters-finish-the-word-snake-6b8643c07c.mp3 | snake. Which letters finish the word snake? | 1 |
| /audio/production/en-US/supplemental/snail-which-letters-finish-the-word-snail-d34cc2add7.mp3 | snail. Which letters finish the word snail? | 1 |
| /audio/production/en-US/supplemental/snow-which-letters-finish-the-word-snow-f2bd932685.mp3 | snow. Which letters finish the word snow? | 2 |
| /audio/production/en-US/supplemental/spoon-which-letters-finish-the-word-spoon-03ff09d5df.mp3 | spoon. Which letters finish the word spoon? | 2 |
| /audio/production/en-US/supplemental/sport-which-letters-finish-the-word-sport-990deff37e.mp3 | sport. Which letters finish the word sport? | 2 |
| /audio/production/en-US/supplemental/spot-which-letters-finish-the-word-spot-7f46177667.mp3 | spot. Which letters finish the word spot? | 1 |
| /audio/production/en-US/supplemental/truck-which-letters-finish-the-word-truck-ff0fbeba50.mp3 | truck. Which letters finish the word truck? | 1 |
| /audio/production/en-US/supplemental/train-which-letters-finish-the-word-train-ccf6739ea3.mp3 | train. Which letters finish the word train? | 2 |
| /audio/production/en-US/supplemental/tray-which-letters-finish-the-word-tray-f40e05d962.mp3 | tray. Which letters finish the word tray? | 2 |
| /audio/production/en-US/supplemental/hand-which-letters-finish-the-word-hand-a02f9b8c07.mp3 | hand. Which letters finish the word hand? | 1 |
| /audio/production/en-US/supplemental/pond-which-letters-finish-the-word-pond-f45cff800a.mp3 | pond. Which letters finish the word pond? | 1 |
| /audio/production/en-US/supplemental/sand-which-letters-finish-the-word-sand-ab9be80e75.mp3 | sand. Which letters finish the word sand? | 1 |
| /audio/production/en-US/supplemental/tent-which-letters-finish-the-word-tent-77242a70d3.mp3 | tent. Which letters finish the word tent? | 1 |
| /audio/production/en-US/supplemental/print-which-letters-finish-the-word-print-1eba7fbae1.mp3 | print. Which letters finish the word print? | 1 |
| /audio/production/en-US/supplemental/paint-which-letters-finish-the-word-paint-305a036f0e.mp3 | paint. Which letters finish the word paint? | 1 |
| /audio/production/en-US/supplemental/lamp-which-letters-finish-the-word-lamp-85409eeb20.mp3 | lamp. Which letters finish the word lamp? | 1 |
| /audio/production/en-US/supplemental/jump-which-letters-finish-the-word-jump-b85559980a.mp3 | jump. Which letters finish the word jump? | 1 |
| /audio/production/en-US/supplemental/camp-which-letters-finish-the-word-camp-595a170e2a.mp3 | camp. Which letters finish the word camp? | 1 |
| /audio/production/en-US/supplemental/ink-which-letters-finish-the-word-ink-30a86ade02.mp3 | ink. Which letters finish the word ink? | 1 |
| /audio/production/en-US/supplemental/think-which-letters-finish-the-word-think-2efc01f560.mp3 | think. Which letters finish the word think? | 1 |
| /audio/production/en-US/supplemental/bank-which-letters-finish-the-word-bank-ca52d7d1cf.mp3 | bank. Which letters finish the word bank? | 1 |
| /audio/production/en-US/supplemental/belt-which-letters-finish-the-word-belt-3454a9200a.mp3 | belt. Which letters finish the word belt? | 1 |
| /audio/production/en-US/supplemental/quilt-which-letters-finish-the-word-quilt-5d93783654.mp3 | quilt. Which letters finish the word quilt? | 1 |
| /audio/production/en-US/supplemental/tilt-which-letters-finish-the-word-tilt-f072c0c4ee.mp3 | tilt. Which letters finish the word tilt? | 1 |
| /audio/production/en-US/supplemental/gift-which-letters-finish-the-word-gift-1a13e25c60.mp3 | gift. Which letters finish the word gift? | 1 |
| /audio/production/en-US/supplemental/left-which-letters-finish-the-word-left-c258306a63.mp3 | left. Which letters finish the word left? | 1 |
| /audio/production/en-US/supplemental/soft-which-letters-finish-the-word-soft-287687e19e.mp3 | soft. Which letters finish the word soft? | 1 |
| /audio/production/en-US/supplemental/brush-which-letters-finish-the-word-brush-7feafb743e.mp3 | brush. Which letters finish the word brush? | 1 |
| /audio/production/en-US/supplemental/broom-which-letters-finish-the-word-broom-a63d372207.mp3 | broom. Which letters finish the word broom? | 1 |
| /audio/production/en-US/supplemental/plate-which-one-starts-with-the-same-sounds-as-plate-260cf5e4fd.mp3 | plate. Which one starts with the same sounds as plate? | 1 |
| /audio/production/en-US/supplemental/snack-which-letters-finish-the-word-snack-4cdd2e8306.mp3 | snack. Which letters finish the word snack? | 1 |
| /audio/production/en-US/supplemental/raft-which-letters-finish-the-word-raft-0065a42496.mp3 | raft. Which letters finish the word raft? | 1 |
| /audio/production/en-US/supplemental/stand-which-letters-finish-the-word-stand-e05e1fbf6e.mp3 | stand. Which letters finish the word stand? | 1 |
| /audio/production/en-US/supplemental/clown-which-one-starts-with-the-same-sounds-as-clown-47c9d61d5c.mp3 | clown. Which one starts with the same sounds as clown? | 1 |
| /audio/production/en-US/supplemental/cat-which-vowel-finishes-the-word-cat-89c10c421e.mp3 | cat. Which vowel finishes the word cat? | 1 |
| /audio/production/en-US/supplemental/hat-which-vowel-finishes-the-word-hat-0d1af7acf2.mp3 | hat. Which vowel finishes the word hat? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-short-a-sound-listen-a-e7621f3f3a.mp3 | Which word has the short a sound? Listen: a. | 3 |
| /audio/production/en-US/supplemental/flag-which-vowel-finishes-the-word-flag-9814fd0153.mp3 | flag. Which vowel finishes the word flag? | 1 |
| /audio/production/en-US/supplemental/hand-which-vowel-finishes-the-word-hand-5bf10e9cf9.mp3 | hand. Which vowel finishes the word hand? | 1 |
| /audio/production/en-US/supplemental/flag-put-the-sounds-in-order-to-build-flag-a5383a1c8f.mp3 | flag. Put the sounds in order to build flag. | 1 |
| /audio/production/en-US/supplemental/crab-put-the-sounds-in-order-to-build-crab-f8c4e3f239.mp3 | crab. Put the sounds in order to build crab. | 1 |
| /audio/production/en-US/supplemental/bed-which-vowel-finishes-the-word-bed-d1fb466d6f.mp3 | bed. Which vowel finishes the word bed? | 1 |
| /audio/production/en-US/supplemental/net-which-vowel-finishes-the-word-net-8ecd3f8c15.mp3 | net. Which vowel finishes the word net? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-short-e-sound-listen-e-35c189c123.mp3 | Which word has the short e sound? Listen: e. | 2 |
| /audio/production/en-US/supplemental/nest-which-vowel-finishes-the-word-nest-73fd844efc.mp3 | nest. Which vowel finishes the word nest? | 1 |
| /audio/production/en-US/supplemental/desk-which-vowel-finishes-the-word-desk-76e1510672.mp3 | desk. Which vowel finishes the word desk? | 1 |
| /audio/production/en-US/supplemental/nest-put-the-sounds-in-order-to-build-nest-c3af872354.mp3 | nest. Put the sounds in order to build nest. | 1 |
| /audio/production/en-US/supplemental/vest-put-the-sounds-in-order-to-build-vest-53a80ac9e0.mp3 | vest. Put the sounds in order to build vest. | 1 |
| /audio/production/en-US/supplemental/pig-which-vowel-finishes-the-word-pig-20cab8ca4e.mp3 | pig. Which vowel finishes the word pig? | 1 |
| /audio/production/en-US/supplemental/pin-which-vowel-finishes-the-word-pin-a5d6c8769d.mp3 | pin. Which vowel finishes the word pin? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-short-i-sound-listen-i-335fac5b44.mp3 | Which word has the short i sound? Listen: i. | 2 |
| /audio/production/en-US/supplemental/brick-which-vowel-finishes-the-word-brick-0e5f22d4af.mp3 | brick. Which vowel finishes the word brick? | 1 |
| /audio/production/en-US/supplemental/gift-which-vowel-finishes-the-word-gift-a4b4485c2c.mp3 | gift. Which vowel finishes the word gift? | 1 |
| /audio/production/en-US/supplemental/swim-put-the-sounds-in-order-to-build-swim-4051688b1a.mp3 | swim. Put the sounds in order to build swim. | 1 |
| /audio/production/en-US/supplemental/fish-put-the-sounds-in-order-to-build-fish-7b63887f93.mp3 | fish. Put the sounds in order to build fish. | 1 |
| /audio/production/en-US/supplemental/dog-which-vowel-finishes-the-word-dog-14b2a883ad.mp3 | dog. Which vowel finishes the word dog? | 1 |
| /audio/production/en-US/supplemental/pot-which-vowel-finishes-the-word-pot-6dc35fff4c.mp3 | pot. Which vowel finishes the word pot? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-short-o-sound-listen-o-78ef5fd4ac.mp3 | Which word has the short o sound? Listen: o. | 3 |
| /audio/production/en-US/supplemental/sock-which-vowel-finishes-the-word-sock-2146bb25ec.mp3 | sock. Which vowel finishes the word sock? | 1 |
| /audio/production/en-US/supplemental/clock-which-vowel-finishes-the-word-clock-c3bb77a11a.mp3 | clock. Which vowel finishes the word clock? | 1 |
| /audio/production/en-US/supplemental/frog-put-the-sounds-in-order-to-build-frog-55f9110708.mp3 | frog. Put the sounds in order to build frog. | 1 |
| /audio/production/en-US/supplemental/sock-put-the-sounds-in-order-to-build-sock-9149fde93c.mp3 | sock. Put the sounds in order to build sock. | 1 |
| /audio/production/en-US/supplemental/bug-which-vowel-finishes-the-word-bug-6af69cc1b3.mp3 | bug. Which vowel finishes the word bug? | 1 |
| /audio/production/en-US/supplemental/sun-which-vowel-finishes-the-word-sun-0b6b0c3b54.mp3 | sun. Which vowel finishes the word sun? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-short-u-sound-listen-u-24d28772f7.mp3 | Which word has the short u sound? Listen: u. | 2 |
| /audio/production/en-US/supplemental/drum-which-vowel-finishes-the-word-drum-cb2b0c44b0.mp3 | drum. Which vowel finishes the word drum? | 1 |
| /audio/production/en-US/supplemental/truck-which-vowel-finishes-the-word-truck-6186a68607.mp3 | truck. Which vowel finishes the word truck? | 1 |
| /audio/production/en-US/supplemental/drum-put-the-sounds-in-order-to-build-drum-7bb7a7752e.mp3 | drum. Put the sounds in order to build drum. | 1 |
| /audio/production/en-US/supplemental/brush-put-the-sounds-in-order-to-build-brush-1b46a363f8.mp3 | brush. Put the sounds in order to build brush. | 1 |
| /audio/production/en-US/supplemental/hut-which-vowel-finishes-the-word-hut-b601aedfeb.mp3 | hut. Which vowel finishes the word hut? | 1 |
| /audio/production/en-US/supplemental/mug-which-vowel-finishes-the-word-mug-36c3f42188.mp3 | mug. Which vowel finishes the word mug? | 1 |
| /audio/production/en-US/supplemental/sled-which-vowel-finishes-the-word-sled-c8478d4ec0.mp3 | sled. Which vowel finishes the word sled? | 1 |
| /audio/production/en-US/supplemental/plug-put-the-sounds-in-order-to-build-plug-23677a3b89.mp3 | plug. Put the sounds in order to build plug. | 1 |
| /audio/production/en-US/supplemental/fin-which-vowel-finishes-the-word-fin-2400e41b16.mp3 | fin. Which vowel finishes the word fin? | 1 |
| /audio/production/en-US/supplemental/chair-which-one-starts-with-the-same-sound-as-chair-acf282dcb1.mp3 | Chair. Which one starts with the same sound as chair? | 2 |
| /audio/production/en-US/supplemental/chain-finish-the-word-chain-fbf078436c.mp3 | chain. Finish the word chain. | 1 |
| /audio/production/en-US/supplemental/cherry-finish-the-word-cherry-399ac3bda9.mp3 | cherry. Finish the word cherry. | 1 |
| /audio/production/en-US/supplemental/bench-finish-the-word-bench-55d0806753.mp3 | bench. Finish the word bench. | 1 |
| /audio/production/en-US/supplemental/watch-finish-the-word-watch-1f82fd2a91.mp3 | watch. Finish the word watch. | 1 |
| /audio/production/en-US/supplemental/lunch-which-one-ends-with-the-same-sound-as-lunch-513e135839.mp3 | Lunch. Which one ends with the same sound as lunch? | 1 |
| /audio/production/en-US/supplemental/watch-which-one-ends-with-the-same-sound-as-watch-4dfdc34497.mp3 | Watch. Which one ends with the same sound as watch? | 1 |
| /audio/production/en-US/supplemental/shell-which-one-starts-with-the-same-sound-as-shell-c86e6fe287.mp3 | Shell. Which one starts with the same sound as shell? | 3 |
| /audio/production/en-US/supplemental/ship-finish-the-word-ship-f8e720d413.mp3 | ship. Finish the word ship. | 1 |
| /audio/production/en-US/supplemental/shirt-finish-the-word-shirt-9add130c88.mp3 | shirt. Finish the word shirt. | 1 |
| /audio/production/en-US/supplemental/fish-finish-the-word-fish-7d167f3869.mp3 | fish. Finish the word fish. | 1 |
| /audio/production/en-US/supplemental/brush-finish-the-word-brush-9a85cdcff4.mp3 | brush. Finish the word brush. | 1 |
| /audio/production/en-US/supplemental/fish-which-one-ends-with-the-same-sound-as-fish-18c3063535.mp3 | Fish. Which one ends with the same sound as fish? | 1 |
| /audio/production/en-US/supplemental/brush-which-one-ends-with-the-same-sound-as-brush-d3d8fb3016.mp3 | Brush. Which one ends with the same sound as brush? | 1 |
| /audio/production/en-US/supplemental/thumb-which-one-starts-with-the-same-sound-as-thumb-cd6e380702.mp3 | Thumb. Which one starts with the same sound as thumb? | 2 |
| /audio/production/en-US/supplemental/thumb-finish-the-word-thumb-3fc49cd8bc.mp3 | thumb. Finish the word thumb. | 1 |
| /audio/production/en-US/supplemental/thorn-finish-the-word-thorn-f8e54f775d.mp3 | thorn. Finish the word thorn. | 1 |
| /audio/production/en-US/supplemental/tooth-finish-the-word-tooth-2a9aa09c26.mp3 | tooth. Finish the word tooth. | 1 |
| /audio/production/en-US/supplemental/bath-finish-the-word-bath-610cd3f3e3.mp3 | bath. Finish the word bath. | 1 |
| /audio/production/en-US/supplemental/bath-which-one-ends-with-the-same-sound-as-bath-edc804eda7.mp3 | Bath. Which one ends with the same sound as bath? | 1 |
| /audio/production/en-US/supplemental/tooth-which-one-ends-with-the-same-sound-as-tooth-34509237f8.mp3 | Tooth. Which one ends with the same sound as tooth? | 1 |
| /audio/production/en-US/supplemental/whale-which-one-starts-with-the-same-sound-as-whale-435644a485.mp3 | Whale. Which one starts with the same sound as whale? | 2 |
| /audio/production/en-US/supplemental/wheel-finish-the-word-wheel-0a3928f9ba.mp3 | wheel. Finish the word wheel. | 1 |
| /audio/production/en-US/supplemental/whistle-finish-the-word-whistle-bf3387a1c0.mp3 | whistle. Finish the word whistle. | 1 |
| /audio/production/en-US/supplemental/wheelbarrow-finish-the-word-wheelbarrow-ad7d5424c9.mp3 | wheelbarrow. Finish the word wheelbarrow. | 1 |
| /audio/production/en-US/supplemental/whisker-finish-the-word-whisker-87ebef806b.mp3 | whisker. Finish the word whisker. | 1 |
| /audio/production/en-US/supplemental/whistle-which-one-starts-with-the-same-sound-as-whistle-d5f85398b1.mp3 | Whistle. Which one starts with the same sound as whistle? | 1 |
| /audio/production/en-US/supplemental/whale-find-the-one-that-starts-the-same-as-whale-5956f279e1.mp3 | Whale. Find the one that starts the same as whale. | 2 |
| /audio/production/en-US/supplemental/phone-which-one-starts-with-the-same-sound-as-phone-555b2eff52.mp3 | Phone. Which one starts with the same sound as phone? | 2 |
| /audio/production/en-US/supplemental/phone-finish-the-word-phone-46c66bd988.mp3 | phone. Finish the word phone. | 1 |
| /audio/production/en-US/supplemental/photo-finish-the-word-photo-cc6597b9fb.mp3 | photo. Finish the word photo. | 1 |
| /audio/production/en-US/supplemental/dolphin-finish-the-word-dolphin-fc526bc2fb.mp3 | dolphin. Finish the word dolphin. | 1 |
| /audio/production/en-US/supplemental/elephant-finish-the-word-elephant-822a7e4721.mp3 | elephant. Finish the word elephant. | 1 |
| /audio/production/en-US/supplemental/graph-finish-the-word-graph-b162cb354a.mp3 | graph. Finish the word graph. | 1 |
| /audio/production/en-US/supplemental/photo-which-one-starts-with-the-same-sound-as-photo-7d23f223cd.mp3 | Photo. Which one starts with the same sound as photo? | 1 |
| /audio/production/en-US/supplemental/duck-finish-the-word-duck-694eb57d99.mp3 | duck. Finish the word duck. | 1 |
| /audio/production/en-US/supplemental/sock-finish-the-word-sock-0eaead5388.mp3 | sock. Finish the word sock. | 1 |
| /audio/production/en-US/supplemental/duck-which-one-ends-with-the-same-sound-as-duck-afd61e3c34.mp3 | Duck. Which one ends with the same sound as duck? | 1 |
| /audio/production/en-US/supplemental/rock-which-one-ends-with-the-same-sound-as-rock-175c46b591.mp3 | Rock. Which one ends with the same sound as rock? | 1 |
| /audio/production/en-US/supplemental/brick-finish-the-word-brick-98b6a9ac42.mp3 | brick. Finish the word brick. | 1 |
| /audio/production/en-US/supplemental/clock-finish-the-word-clock-f80baa7635.mp3 | clock. Finish the word clock. | 1 |
| /audio/production/en-US/supplemental/neck-finish-the-word-neck-27aa60fcf2.mp3 | neck. Finish the word neck. | 1 |
| /audio/production/en-US/supplemental/neck-which-one-ends-with-the-same-sound-as-neck-8acb143258.mp3 | Neck. Which one ends with the same sound as neck? | 1 |
| /audio/production/en-US/supplemental/chip-finish-the-word-chip-c967a012eb.mp3 | chip. Finish the word chip. | 1 |
| /audio/production/en-US/supplemental/lunch-finish-the-word-lunch-f6a113a20e.mp3 | lunch. Finish the word lunch. | 1 |
| /audio/production/en-US/supplemental/dish-finish-the-word-dish-f3cd2c3774.mp3 | dish. Finish the word dish. | 1 |
| /audio/production/en-US/supplemental/three-finish-the-word-three-3151f7eb09.mp3 | three. Finish the word three. | 1 |
| /audio/production/en-US/supplemental/moth-finish-the-word-moth-ce041ad474.mp3 | moth. Finish the word moth. | 1 |
| /audio/production/en-US/supplemental/wheat-finish-the-word-wheat-29197d1bdf.mp3 | wheat. Finish the word wheat. | 1 |
| /audio/production/en-US/supplemental/headphones-finish-the-word-headphones-ab5d1a6ba7.mp3 | headphones. Finish the word headphones. | 1 |
| /audio/production/en-US/supplemental/microphone-finish-the-word-microphone-50573031c6.mp3 | microphone. Finish the word microphone. | 1 |
| /audio/production/en-US/supplemental/truck-finish-the-word-truck-552c91ade0.mp3 | truck. Finish the word truck. | 1 |
| /audio/production/en-US/supplemental/stick-finish-the-word-stick-1377339ea3.mp3 | stick. Finish the word stick. | 1 |
| /audio/production/en-US/supplemental/web-which-ending-sound-finishes-the-word-web-e0dead38b8.mp3 | web. Which ending sound finishes the word web? | 1 |
| /audio/production/en-US/supplemental/web-which-one-ends-with-the-same-sound-as-web-641b12ca57.mp3 | web. Which one ends with the same sound as web? | 1 |
| /audio/production/en-US/supplemental/tub-which-word-ends-with-the-same-sound-as-tub-71fe078bb5.mp3 | tub. Which word ends with the same sound as tub? | 1 |
| /audio/production/en-US/supplemental/tub-which-ending-sound-finishes-the-word-tub-002a5fac4f.mp3 | tub. Which ending sound finishes the word tub? | 1 |
| /audio/production/en-US/supplemental/bread-which-ending-sound-finishes-the-word-bread-a81145a544.mp3 | bread. Which ending sound finishes the word bread? | 1 |
| /audio/production/en-US/supplemental/bread-which-one-ends-with-the-same-sound-as-bread-5d8e31fbef.mp3 | bread. Which one ends with the same sound as bread? | 1 |
| /audio/production/en-US/supplemental/road-which-word-ends-with-the-same-sound-as-road-4aa5a63fbe.mp3 | road. Which word ends with the same sound as road? | 1 |
| /audio/production/en-US/supplemental/road-which-ending-sound-finishes-the-word-road-17979d150b.mp3 | road. Which ending sound finishes the word road? | 1 |
| /audio/production/en-US/supplemental/flag-which-ending-sound-finishes-the-word-flag-59bfee6999.mp3 | flag. Which ending sound finishes the word flag? | 1 |
| /audio/production/en-US/supplemental/frog-which-one-ends-with-the-same-sound-as-frog-8e0fc851a8.mp3 | frog. Which one ends with the same sound as frog? | 1 |
| /audio/production/en-US/supplemental/flag-which-word-ends-with-the-same-sound-as-flag-56bb512cf2.mp3 | flag. Which word ends with the same sound as flag? | 1 |
| /audio/production/en-US/supplemental/frog-which-ending-sound-finishes-the-word-frog-8261f9a2e5.mp3 | frog. Which ending sound finishes the word frog? | 1 |
| /audio/production/en-US/supplemental/wheel-which-ending-sound-finishes-the-word-wheel-6fbecc945e.mp3 | wheel. Which ending sound finishes the word wheel? | 1 |
| /audio/production/en-US/supplemental/wheel-which-one-ends-with-the-same-sound-as-wheel-b7c5840ca9.mp3 | wheel. Which one ends with the same sound as wheel? | 1 |
| /audio/production/en-US/supplemental/wheel-which-word-ends-with-the-same-sound-as-wheel-97b2c71d8c.mp3 | wheel. Which word ends with the same sound as wheel? | 1 |
| /audio/production/en-US/supplemental/whirlpool-which-ending-sound-finishes-the-word-whirlpool-836228beb5.mp3 | whirlpool. Which ending sound finishes the word whirlpool? | 1 |
| /audio/production/en-US/supplemental/drum-which-ending-sound-finishes-the-word-drum-57bb35b8b4.mp3 | drum. Which ending sound finishes the word drum? | 1 |
| /audio/production/en-US/supplemental/drum-which-one-ends-with-the-same-sound-as-drum-609b7bb3bb.mp3 | drum. Which one ends with the same sound as drum? | 1 |
| /audio/production/en-US/supplemental/jam-which-word-ends-with-the-same-sound-as-jam-229eb28c05.mp3 | jam. Which word ends with the same sound as jam? | 1 |
| /audio/production/en-US/supplemental/jam-which-ending-sound-finishes-the-word-jam-1240376a04.mp3 | jam. Which ending sound finishes the word jam? | 1 |
| /audio/production/en-US/supplemental/ten-which-ending-sound-finishes-the-word-ten-8cc3ccd7e6.mp3 | ten. Which ending sound finishes the word ten? | 1 |
| /audio/production/en-US/supplemental/pin-which-one-ends-with-the-same-sound-as-pin-d47ea767ca.mp3 | pin. Which one ends with the same sound as pin? | 1 |
| /audio/production/en-US/supplemental/hen-which-word-ends-with-the-same-sound-as-hen-e258a68bc5.mp3 | hen. Which word ends with the same sound as hen? | 1 |
| /audio/production/en-US/supplemental/fin-which-ending-sound-finishes-the-word-fin-5d36286dbb.mp3 | fin. Which ending sound finishes the word fin? | 1 |
| /audio/production/en-US/supplemental/sheep-which-ending-sound-finishes-the-word-sheep-4baa7cbcc6.mp3 | sheep. Which ending sound finishes the word sheep? | 1 |
| /audio/production/en-US/supplemental/cap-which-one-ends-with-the-same-sound-as-cap-e2b9f90bd9.mp3 | cap. Which one ends with the same sound as cap? | 1 |
| /audio/production/en-US/supplemental/mop-which-word-ends-with-the-same-sound-as-mop-0787d911c8.mp3 | mop. Which word ends with the same sound as mop? | 1 |
| /audio/production/en-US/supplemental/sleep-which-ending-sound-finishes-the-word-sleep-cdafa36cb0.mp3 | sleep. Which ending sound finishes the word sleep? | 1 |
| /audio/production/en-US/supplemental/net-which-ending-sound-finishes-the-word-net-9a45cc6124.mp3 | net. Which ending sound finishes the word net? | 1 |
| /audio/production/en-US/supplemental/hat-which-one-ends-with-the-same-sound-as-hat-2004c1112d.mp3 | hat. Which one ends with the same sound as hat? | 1 |
| /audio/production/en-US/supplemental/goat-which-word-ends-with-the-same-sound-as-goat-94ec37cce7.mp3 | goat. Which word ends with the same sound as goat? | 1 |
| /audio/production/en-US/supplemental/boat-which-ending-sound-finishes-the-word-boat-31971ddf7f.mp3 | boat. Which ending sound finishes the word boat? | 1 |
| /audio/production/en-US/supplemental/fish-which-two-ending-letters-finish-the-word-fish-49e60cd3f9.mp3 | fish. Which two ending letters finish the word fish? | 1 |
| /audio/production/en-US/supplemental/wish-which-one-ends-with-the-same-two-letters-as-wish-02ebb88c41.mp3 | wish. Which one ends with the same two letters as wish? | 1 |
| /audio/production/en-US/supplemental/brush-which-two-ending-letters-finish-the-word-brush-5401a0d4aa.mp3 | brush. Which two ending letters finish the word brush? | 1 |
| /audio/production/en-US/supplemental/splash-which-two-ending-letters-finish-the-word-splash-f955444325.mp3 | splash. Which two ending letters finish the word splash? | 1 |
| /audio/production/en-US/supplemental/moth-which-two-ending-letters-finish-the-word-moth-c0226da918.mp3 | moth. Which two ending letters finish the word moth? | 1 |
| /audio/production/en-US/supplemental/bath-which-one-ends-with-the-same-two-letters-as-bath-dabd28e822.mp3 | bath. Which one ends with the same two letters as bath? | 1 |
| /audio/production/en-US/supplemental/bath-which-two-ending-letters-finish-the-word-bath-2b52b710e9.mp3 | bath. Which two ending letters finish the word bath? | 1 |
| /audio/production/en-US/supplemental/cloth-which-two-ending-letters-finish-the-word-cloth-264faebcff.mp3 | cloth. Which two ending letters finish the word cloth? | 1 |
| /audio/production/en-US/supplemental/bell-which-two-ending-letters-finish-the-word-bell-5129b291fc.mp3 | bell. Which two ending letters finish the word bell? | 1 |
| /audio/production/en-US/supplemental/shell-which-word-ends-with-the-same-two-letters-as-shell-e6792318a9.mp3 | shell. Which word ends with the same two letters as shell? | 1 |
| /audio/production/en-US/supplemental/hill-which-two-ending-letters-finish-the-word-hill-962af29f0d.mp3 | hill. Which two ending letters finish the word hill? | 1 |
| /audio/production/en-US/supplemental/small-which-two-ending-letters-finish-the-word-small-d12df012b5.mp3 | small. Which two ending letters finish the word small? | 1 |
| /audio/production/en-US/supplemental/ring-which-two-ending-letters-finish-the-word-ring-6eafa7f258.mp3 | ring. Which two ending letters finish the word ring? | 1 |
| /audio/production/en-US/supplemental/song-which-one-ends-with-the-same-two-letters-as-song-1661f46033.mp3 | song. Which one ends with the same two letters as song? | 1 |
| /audio/production/en-US/supplemental/king-which-two-ending-letters-finish-the-word-king-bdbbb70303.mp3 | king. Which two ending letters finish the word king? | 1 |
| /audio/production/en-US/supplemental/swing-which-two-ending-letters-finish-the-word-swing-44f699a300.mp3 | swing. Which two ending letters finish the word swing? | 1 |
| /audio/production/en-US/supplemental/hand-which-two-ending-letters-finish-the-word-hand-54cb961b09.mp3 | hand. Which two ending letters finish the word hand? | 1 |
| /audio/production/en-US/supplemental/hand-which-word-ends-with-the-same-two-letters-as-hand-7d2d3988f9.mp3 | hand. Which word ends with the same two letters as hand? | 1 |
| /audio/production/en-US/supplemental/pond-which-two-ending-letters-finish-the-word-pond-5f4a343e97.mp3 | pond. Which two ending letters finish the word pond? | 1 |
| /audio/production/en-US/supplemental/wind-which-two-ending-letters-finish-the-word-wind-ac8906ea2e.mp3 | wind. Which two ending letters finish the word wind? | 1 |
| /audio/production/en-US/supplemental/drink-which-two-ending-letters-finish-the-word-drink-85b21a3247.mp3 | drink. Which two ending letters finish the word drink? | 1 |
| /audio/production/en-US/supplemental/tank-which-word-ends-with-the-same-two-letters-as-tank-17f1be629c.mp3 | tank. Which word ends with the same two letters as tank? | 1 |
| /audio/production/en-US/supplemental/trunk-which-two-ending-letters-finish-the-word-trunk-317367ceab.mp3 | trunk. Which two ending letters finish the word trunk? | 1 |
| /audio/production/en-US/supplemental/blink-which-two-ending-letters-finish-the-word-blink-a2f8d5f172.mp3 | blink. Which two ending letters finish the word blink? | 1 |
| /audio/production/en-US/supplemental/nest-which-two-ending-letters-finish-the-word-nest-4c2d20618a.mp3 | nest. Which two ending letters finish the word nest? | 1 |
| /audio/production/en-US/supplemental/list-which-one-ends-with-the-same-two-letters-as-list-2233f07dac.mp3 | list. Which one ends with the same two letters as list? | 1 |
| /audio/production/en-US/supplemental/vest-which-two-ending-letters-finish-the-word-vest-9bd48f47a6.mp3 | vest. Which two ending letters finish the word vest? | 1 |
| /audio/production/en-US/supplemental/list-which-two-ending-letters-finish-the-word-list-62ae81f3d8.mp3 | list. Which two ending letters finish the word list? | 1 |
| /audio/production/en-US/supplemental/desk-which-two-ending-letters-finish-the-word-desk-59c1675256.mp3 | desk. Which two ending letters finish the word desk? | 1 |
| /audio/production/en-US/supplemental/desk-which-word-ends-with-the-same-two-letters-as-desk-d74d7918a6.mp3 | desk. Which word ends with the same two letters as desk? | 1 |
| /audio/production/en-US/supplemental/mask-which-two-ending-letters-finish-the-word-mask-ad18f3a9a4.mp3 | mask. Which two ending letters finish the word mask? | 1 |
| /audio/production/en-US/supplemental/tusk-which-two-ending-letters-finish-the-word-tusk-a746bc1350.mp3 | tusk. Which two ending letters finish the word tusk? | 1 |
| /audio/production/en-US/supplemental/gift-which-two-ending-letters-finish-the-word-gift-70caa7a737.mp3 | gift. Which two ending letters finish the word gift? | 1 |
| /audio/production/en-US/supplemental/raft-which-word-ends-with-the-same-two-letters-as-raft-fbdefd689b.mp3 | raft. Which word ends with the same two letters as raft? | 1 |
| /audio/production/en-US/supplemental/left-which-two-ending-letters-finish-the-word-left-c45abb6e44.mp3 | left. Which two ending letters finish the word left? | 1 |
| /audio/production/en-US/supplemental/raft-which-two-ending-letters-finish-the-word-raft-0713510393.mp3 | raft. Which two ending letters finish the word raft? | 1 |
| /audio/production/en-US/supplemental/melt-which-two-ending-letters-finish-the-word-melt-7ff0bdb7e2.mp3 | melt. Which two ending letters finish the word melt? | 1 |
| /audio/production/en-US/supplemental/belt-which-word-ends-with-the-same-two-letters-as-belt-ff19145d04.mp3 | belt. Which word ends with the same two letters as belt? | 1 |
| /audio/production/en-US/supplemental/salt-which-two-ending-letters-finish-the-word-salt-1782a8b908.mp3 | salt. Which two ending letters finish the word salt? | 1 |
| /audio/production/en-US/supplemental/felt-which-two-ending-letters-finish-the-word-felt-3165ece839.mp3 | felt. Which two ending letters finish the word felt? | 1 |
| /audio/production/en-US/supplemental/web-which-word-ends-with-the-same-sound-as-web-7761cf2282.mp3 | web. Which word ends with the same sound as web? | 1 |
| /audio/production/en-US/supplemental/mud-which-word-ends-with-the-same-sound-as-mud-83d6ee318b.mp3 | mud. Which word ends with the same sound as mud? | 1 |
| /audio/production/en-US/supplemental/gum-which-ending-sound-finishes-the-word-gum-5146d2c35d.mp3 | gum. Which ending sound finishes the word gum? | 1 |
| /audio/production/en-US/supplemental/mat-which-ending-sound-finishes-the-word-mat-5b5b060833.mp3 | mat. Which ending sound finishes the word mat? | 1 |
| /audio/production/en-US/supplemental/ten-which-one-ends-with-the-same-sound-as-ten-b6ec357cca.mp3 | ten. Which one ends with the same sound as ten? | 1 |
| /audio/production/en-US/supplemental/dish-which-two-ending-letters-finish-the-word-dish-4dbb10a60b.mp3 | dish. Which two ending letters finish the word dish? | 1 |
| /audio/production/en-US/supplemental/sting-which-two-ending-letters-finish-the-word-sting-81ed9d1e5c.mp3 | sting. Which two ending letters finish the word sting? | 1 |
| /audio/production/en-US/supplemental/twist-which-two-ending-letters-finish-the-word-twist-5d8f28475f.mp3 | twist. Which two ending letters finish the word twist? | 1 |
| /audio/production/en-US/supplemental/melt-which-word-ends-with-the-same-two-letters-as-melt-51aa6188cb.mp3 | melt. Which word ends with the same two letters as melt? | 1 |
| /audio/production/en-US/supplemental/think-which-two-ending-letters-finish-the-word-think-0dcb1c6636.mp3 | think. Which two ending letters finish the word think? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-see-red-hen-f5e935da3a.mp3 | Which word finishes the sentence? I see … red hen. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-had-nap-at-two-90aa06221a.mp3 | Which word finishes the sentence? We had … nap at two. | 1 |
| /audio/production/en-US/supplemental/a-find-the-word-a-6a3e728256.mp3 | a. Find the word a. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-have-both-jam-bread-350b268312.mp3 | Which word finishes the sentence? We have both jam … bread. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-she-has-both-a-cat-a-dog-0867d46b3b.mp3 | Which word finishes the sentence? She has both a cat … a dog. | 1 |
| /audio/production/en-US/supplemental/and-find-the-word-and-baadb1add4.mp3 | and. Find the word and. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-pigs-in-the-mud-dfcf6bafb5.mp3 | Which word finishes the sentence? The pigs … in the mud. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-you-my-best-pal-71e21f1e43.mp3 | Which word finishes the sentence? You … my best pal. | 1 |
| /audio/production/en-US/supplemental/are-find-the-word-are-0fbf2b9d8f.mp3 | are. Find the word are. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-it-is-big-a-bus-ce72db0441.mp3 | Which word finishes the sentence? It is big … a bus. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-sam-is-fast-a-fox-c291dd1f21.mp3 | Which word finishes the sentence? Sam is fast … a fox. | 1 |
| /audio/production/en-US/supplemental/as-find-the-word-as-ac52cbbbbc.mp3 | as. Find the word as. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-nap-two-aec063dd1e.mp3 | Which word finishes the sentence? We nap … two. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-bus-stops-my-home-2d64c5fa1f.mp3 | Which word finishes the sentence? The bus stops … my home. | 1 |
| /audio/production/en-US/supplemental/at-find-the-word-at-eb04d37715.mp3 | at. Find the word at. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-you-can-my-helper-b3576e6344.mp3 | Which word finishes the sentence? You can … my helper. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-it-will-hot-at-two-5e871a973e.mp3 | Which word finishes the sentence? It will … hot at two. | 1 |
| /audio/production/en-US/supplemental/be-find-the-word-be-41b3232e8e.mp3 | be. Find the word be. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-made-this-gift-you-77bc268231.mp3 | Which word finishes the sentence? I made this gift … you. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-cheered-our-team-ddb1e9d67b.mp3 | Which word finishes the sentence? We cheered … our team. | 1 |
| /audio/production/en-US/supplemental/for-find-the-word-for-d980822587.mp3 | for. Find the word for. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-gran-sent-the-card-her-house-302767442f.mp3 | Which word finishes the sentence? Gran sent the card … her house. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-he-came-home-the-park-fa9037cdd3.mp3 | Which word finishes the sentence? He came home … the park. | 1 |
| /audio/production/en-US/supplemental/from-find-the-word-from-be9295fede.mp3 | from. Find the word from. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-ten-hens-b852932079.mp3 | Which word finishes the sentence? We … ten hens. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-they-a-big-red-van-a898abafd8.mp3 | Which word finishes the sentence? They … a big red van. | 1 |
| /audio/production/en-US/supplemental/have-find-the-word-have-641d236a50.mp3 | have. Find the word have. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-dad-is-tall-has-big-boots-b40a65d6f7.mp3 | Which word finishes the sentence? Dad is tall. … has big boots. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-ben-naps-is-in-bed-2cc9202f7d.mp3 | Which word finishes the sentence? Ben naps. … is in bed. | 1 |
| /audio/production/en-US/supplemental/he-find-the-word-he-df417acde0.mp3 | he. Find the word he. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-sam-hurt-leg-f7dc60d2dd.mp3 | Which word finishes the sentence? Sam hurt … leg. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-dog-wags-tail-e23b047df9.mp3 | Which word finishes the sentence? The dog wags … tail. | 1 |
| /audio/production/en-US/supplemental/his-find-the-word-his-c49a6e94ff.mp3 | his. Find the word his. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-mom-and-bake-buns-daa5f8ff29.mp3 | Which word finishes the sentence? Mom and … bake buns. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-am-ready-for-my-turn-71c30fd18a.mp3 | Which word finishes the sentence? … am ready for my turn. | 1 |
| /audio/production/en-US/supplemental/i-find-the-word-i-90bcba137b.mp3 | i. Find the word i. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-jam-is-the-jar-83eabf1498.mp3 | Which word finishes the sentence? The jam is … the jar. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-fish-swim-the-sea-2162e34637.mp3 | Which word finishes the sentence? The fish swim … the sea. | 1 |
| /audio/production/en-US/supplemental/in-find-the-word-in-95d67759a7.mp3 | in. Find the word in. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-sun-hot-16d939207b.mp3 | Which word finishes the sentence? The sun … hot. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-my-cup-full-ed91d60b27.mp3 | Which word finishes the sentence? My cup … full. | 1 |
| /audio/production/en-US/supplemental/is-find-the-word-is-d90daf0e42.mp3 | is. Find the word is. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-egg-fell-has-a-crack-1c251292c9.mp3 | Which word finishes the sentence? The egg fell. … has a crack. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-like-the-hat-is-red-31aea304dd.mp3 | Which word finishes the sentence? I like the hat. … is red. | 1 |
| /audio/production/en-US/supplemental/it-find-the-word-it-3f07f47003.mp3 | it. Find the word it. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-want-a-cup-milk-77468441a9.mp3 | Which word finishes the sentence? I want a cup … milk. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-that-is-a-map-the-zoo-3514736661.mp3 | Which word finishes the sentence? That is a map … the zoo. | 1 |
| /audio/production/en-US/supplemental/of-find-the-word-of-ffd7f7c2f8.mp3 | of. Find the word of. | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-cat-naps-the-rug-582aa6372c.mp3 | Which word finishes the sentence? The cat naps … the rug. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-put-the-lid-the-pot-8498d7dae7.mp3 | Which word finishes the sentence? Put the lid … the pot. | 1 |
| /audio/production/en-US/supplemental/on-find-the-word-on-bb578177bb.mp3 | on. Find the word on. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-see-ship-far-far-out-5d89a1ea11.mp3 | Which word finishes the sentence? See … ship far, far out? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-sang-song-long-ago-21db08e613.mp3 | Which word finishes the sentence? I sang … song long ago. | 1 |
| /audio/production/en-US/supplemental/that-find-the-word-that-2c8bdaf59e.mp3 | that. Find the word that. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-look-at-big-red-sun-217a04a63d.mp3 | Which word finishes the sentence? Look at … big red sun! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-fed-hens-at-six-abcb1843d6.mp3 | Which word finishes the sentence? We fed … hens at six. | 1 |
| /audio/production/en-US/supplemental/the-find-the-word-the-3b763175c2.mp3 | the. Find the word the. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-pigs-sat-are-muddy-d90f18a33b.mp3 | Which word finishes the sentence? The pigs sat. … are muddy! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-my-socks-are-wet-0470c1f38f.mp3 | Which word finishes the sentence? My socks? … are wet. | 1 |
| /audio/production/en-US/supplemental/they-find-the-word-they-e914adaf60.mp3 | they. Find the word they. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-look-at-bug-on-my-hand-a1b0af6f3b.mp3 | Which word finishes the sentence? Look at … bug on my hand! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-hat-here-is-mine-bc0f7dbb92.mp3 | Which word finishes the sentence? … hat here is mine. | 1 |
| /audio/production/en-US/supplemental/this-find-the-word-this-1a10d0729a.mp3 | this. Find the word this. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-go-the-park-ab77ff6fa3.mp3 | Which word finishes the sentence? We go … the park. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-gave-the-pen-ben-153d39af26.mp3 | Which word finishes the sentence? I gave the pen … Ben. | 1 |
| /audio/production/en-US/supplemental/to-find-the-word-to-78298f0e1a.mp3 | to. Find the word to. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-yesterday-the-cat-on-the-bed-5b3a850bcf.mp3 | Which word finishes the sentence? Yesterday the cat … on the bed. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-yesterday-the-milk-cold-a840cf7d52.mp3 | Which word finishes the sentence? Yesterday the milk … cold. | 1 |
| /audio/production/en-US/supplemental/was-find-the-word-was-b5b3cc7f7b.mp3 | was. Find the word was. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-hop-my-dog-daa0813078.mp3 | Which word finishes the sentence? I hop … my dog. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-she-sang-me-at-camp-d77f739f5a.mp3 | Which word finishes the sentence? She sang … me at camp. | 1 |
| /audio/production/en-US/supplemental/with-find-the-word-with-38a895c990.mp3 | with. Find the word with. | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-are-my-best-pal-507f80fb2a.mp3 | Which word finishes the sentence? … are my best pal. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-can-see-the-big-top-8b6a65d08d.mp3 | Which word finishes the sentence? Can … see the big top? | 1 |
| /audio/production/en-US/supplemental/you-find-the-word-you-932165d9eb.mp3 | you. Find the word you. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-he-has-pet-rat-f0e24e18ff.mp3 | Build the missing word. He has … pet rat. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-met-vet-today-12c0d43d27.mp3 | Build the missing word. I met … vet today. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-six-ten-make-sixteen-eb879d348a.mp3 | Build the missing word. Six … ten make sixteen. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-mum-gran-sat-down-dd6ef4d0a5.mp3 | Build the missing word. Mum … Gran sat down. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-cubs-so-soft-9bdd657ee2.mp3 | Build the missing word. The cubs … so soft. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-my-hands-cold-b294620069.mp3 | Build the missing word. My hands … cold. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-he-is-fast-a-jet-0c94126b13.mp3 | Build the missing word. He is fast … a jet. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-it-is-cold-ice-3f096c69eb.mp3 | Build the missing word. It is cold … ice. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-met-the-pond-09d0251de1.mp3 | Build the missing word. We met … the pond. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-look-my-sandcastle-01a6458892.mp3 | Build the missing word. Look … my sandcastle! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-dad-will-back-soon-fbc7161f7f.mp3 | Build the missing word. Dad will … back soon. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-it-can-windy-up-here-fd78d71a0e.mp3 | Build the missing word. It can … windy up here. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-this-bun-is-gran-41d7e106ba.mp3 | Build the missing word. This bun is … Gran. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-sang-the-class-c509e1e0a6.mp3 | Build the missing word. We sang … the class. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-gift-came-gramps-2fd3c33333.mp3 | Build the missing word. The gift came … Gramps. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-milk-comes-cows-1b2af33418.mp3 | Build the missing word. Milk comes … cows. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-twins-red-hats-47b2c5ee4e.mp3 | Build the missing word. The twins … red hats. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-six-eggs-left-1b8abc0c7e.mp3 | Build the missing word. We … six eggs left. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-gramps-naps-when-can-59dd031e3f.mp3 | Build the missing word. Gramps naps when … can. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-tom-grins-when-wins-c9eb8674fb.mp3 | Build the missing word. Tom grins when … wins. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-dan-lost-left-sock-06cc993d9e.mp3 | Build the missing word. Dan lost … left sock. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-king-sat-on-throne-285709befc.mp3 | Build the missing word. The king sat on … throne. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-mum-and-swim-on-sundays-9a43a3e9d4.mp3 | Build the missing word. Mum and … swim on Sundays. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-may-pet-the-pup-91985eb368.mp3 | Build the missing word. May … pet the pup? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-frogs-hop-the-pond-2fa4a922ed.mp3 | Build the missing word. The frogs hop … the pond. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-pop-the-coins-the-tin-bc75f70898.mp3 | Build the missing word. Pop the coins … the tin. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-soup-hot-ad3b504d11.mp3 | Build the missing word. The soup … hot. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-my-bike-new-ebc81b7ae1.mp3 | Build the missing word. My bike … new. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-nest-sits-up-high-b0a9d7f209.mp3 | Build the missing word. The nest? … sits up high. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-grab-the-rope-and-pull-50513defc6.mp3 | Build the missing word. Grab the rope and pull …! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-had-a-mug-milk-c920826cd9.mp3 | Build the missing word. I had a mug … milk. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-here-is-a-box-pins-acf5cf3fd2.mp3 | Build the missing word. Here is a box … pins. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-clock-hangs-the-wall-6cb58c4aab.mp3 | Build the missing word. The clock hangs … the wall. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-hop-the-bus-quick-dcd5e4d9d0.mp3 | Build the missing word. Hop … the bus, quick! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-who-left-mess-there-7625a1269d.mp3 | Build the missing word. Who left … mess there? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-drew-map-myself-e101e56921.mp3 | Build the missing word. I drew … map myself. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-shut-gate-please-fe22619a16.mp3 | Build the missing word. Shut … gate, please. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-feed-fish-at-nine-2815f8008c.mp3 | Build the missing word. Feed … fish at nine. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-elves-hid-well-ad3c09792b.mp3 | Build the missing word. The elves? … hid well. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-my-boots-got-wet-90a98d6f73.mp3 | Build the missing word. My boots? … got wet. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-smell-rose-right-here-e2b08345a1.mp3 | Build the missing word. Smell … rose right here. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-hold-end-of-the-rope-98a2e7c740.mp3 | Build the missing word. Hold … end of the rope. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-row-the-dock-c1107f1e32.mp3 | Build the missing word. We row … the dock. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-pass-the-jam-gran-a500567bbf.mp3 | Build the missing word. Pass the jam … Gran. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-soup-too-hot-d3fbf14f57.mp3 | Build the missing word. The soup … too hot. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-trip-so-much-fun-73fa2b4bab.mp3 | Build the missing word. The trip … so much fun. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-come-camp-us-d14b3c45ed.mp3 | Build the missing word. Come camp … us! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-mix-the-eggs-a-fork-ced29de4ba.mp3 | Build the missing word. Mix the eggs … a fork. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-did-see-the-comet-a7ea0f23a9.mp3 | Build the missing word. Did … see the comet? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-made-this-card-for-b93828ea99.mp3 | Build the missing word. I made this card for …. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-she-fed-small-lamb-f3766fe0dc.mp3 | Which word finishes the sentence? She fed … small lamb. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-baked-this-dad-abfd903a3b.mp3 | Which word finishes the sentence? I baked this … Dad. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-pond-full-of-frogs-4b2c73a5d6.mp3 | Which word finishes the sentence? The pond … full of frogs. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-ducks-swam-off-ffa14437a1.mp3 | Which word finishes the sentence? The ducks? … swam off. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-sweep-steps-please-494341e4f2.mp3 | Build the missing word. Sweep … steps, please. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-can-lift-this-log-8e981b5401.mp3 | Build the missing word. Can … lift this log? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-hid-the-rain-ebc7975634.mp3 | Build the missing word. We hid … the rain. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-bob-packs-own-lunch-8dec28163c.mp3 | Build the missing word. Bob packs … own lunch. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-she-fed-of-the-cats-cdde3b9983.mp3 | Which word finishes the sentence? She fed … of the cats. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-he-drank-the-milk-the-jug-is-empty-2ebc50cd76.mp3 | Which word finishes the sentence? He drank … the milk. The jug is empty! | 1 |
| /audio/production/en-US/supplemental/all-find-the-word-all-f06ca403c8.mp3 | all. Find the word all. | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-ate-egg-cd2b51cd76.mp3 | Which word finishes the sentence? I ate … egg. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-she-saw-owl-at-dusk-0ebf9d0d3a.mp3 | Which word finishes the sentence? She saw … owl at dusk. | 1 |
| /audio/production/en-US/supplemental/an-find-the-word-an-a74c71e36a.mp3 | an. Find the word an. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-ran-fast-i-missed-the-bus-333663df60.mp3 | Which word finishes the sentence? I ran fast, … I missed the bus. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-sun-is-out-it-is-cold-4e1dd73f7a.mp3 | Which word finishes the sentence? The sun is out, … it is cold. | 1 |
| /audio/production/en-US/supplemental/but-find-the-word-but-d8a4658635.mp3 | but. Find the word but. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-nest-is-the-gate-198a8516e3.mp3 | Which word finishes the sentence? The nest is … the gate. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-sat-the-pond-112de75e60.mp3 | Which word finishes the sentence? We sat … the pond. | 1 |
| /audio/production/en-US/supplemental/by-find-the-word-by-e7c4ae6a54.mp3 | by. Find the word by. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-you-hop-like-a-frog-858f2f5cb5.mp3 | Which word finishes the sentence? … you hop like a frog? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-twins-swim-fast-404afce0fb.mp3 | Which word finishes the sentence? The twins … swim fast. | 1 |
| /audio/production/en-US/supplemental/can-find-the-word-can-b2cecde707.mp3 | can. Find the word can. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-you-like-plums-0dc0388b90.mp3 | Which word finishes the sentence? … you like plums? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-what-cows-eat-d3cdc933ea.mp3 | Which word finishes the sentence? What … cows eat? | 1 |
| /audio/production/en-US/supplemental/do-find-the-word-do-46499d0c40.mp3 | do. Find the word do. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-kid-got-a-badge-430baf52f3.mp3 | Which word finishes the sentence? … kid got a badge. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-put-a-cup-at-desk-7bb0892153.mp3 | Which word finishes the sentence? Put a cup at … desk. | 1 |
| /audio/production/en-US/supplemental/each-find-the-word-each-7cc9ff2bcd.mp3 | each. Find the word each. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-last-week-we-a-picnic-a6b50d53cd.mp3 | Which word finishes the sentence? Last week we … a picnic. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-gran-six-cats-long-ago-3845704734.mp3 | Which word finishes the sentence? Gran … six cats long ago. | 1 |
| /audio/production/en-US/supplemental/had-find-the-word-had-64773ee93f.mp3 | had. Find the word had. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-do-you-make-jam-69acd795fb.mp3 | Which word finishes the sentence? … do you make jam? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-tell-me-the-trick-works-96f183c443.mp3 | Which word finishes the sentence? Tell me … the trick works. | 1 |
| /audio/production/en-US/supplemental/how-find-the-word-how-0c9010c990.mp3 | how. Find the word how. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-ask-me-you-get-stuck-60045005bf.mp3 | Which word finishes the sentence? Ask me … you get stuck. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-it-rains-we-stay-in-5a1a8f3599.mp3 | Which word finishes the sentence? … it rains, we stay in. | 1 |
| /audio/production/en-US/supplemental/if-find-the-word-if-e124a01c0a.mp3 | if. Find the word if. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-sums-are-hard-they-are-easy-4f7f73dd79.mp3 | Which word finishes the sentence? The sums are … hard — they are easy! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-that-is-my-hat-c11e9bc096.mp3 | Which word finishes the sentence? That is … my hat! | 1 |
| /audio/production/en-US/supplemental/not-find-the-word-not-6c3aadf947.mp3 | not. Find the word not. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-have-just-wish-b553d7a015.mp3 | Which word finishes the sentence? I have just … wish. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-duck-swam-off-two-stayed-5e995f886e.mp3 | Which word finishes the sentence? … duck swam off; two stayed. | 1 |
| /audio/production/en-US/supplemental/one-find-the-word-one-e3ea329eae.mp3 | one. Find the word one. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-do-you-want-jam-ham-1c608eb29a.mp3 | Which word finishes the sentence? Do you want jam … ham? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-is-the-cup-full-empty-366158a2f1.mp3 | Which word finishes the sentence? Is the cup full … empty? | 1 |
| /audio/production/en-US/supplemental/or-find-the-word-or-4346edb9ca.mp3 | or. Find the word or. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-mum-we-can-camp-6c098685f1.mp3 | Which word finishes the sentence? Mum … we can camp! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-dad-yes-at-last-087851b93c.mp3 | Which word finishes the sentence? Dad … yes at last. | 1 |
| /audio/production/en-US/supplemental/said-find-the-word-said-1a24a3bd2f.mp3 | said. Find the word said. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-my-aunt-naps-when-can-2568d1af11.mp3 | Which word finishes the sentence? My aunt naps when … can. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-gran-hums-as-bakes-573cfe3408.mp3 | Which word finishes the sentence? Gran hums as … bakes. | 1 |
| /audio/production/en-US/supplemental/she-find-the-word-she-c78b090b35.mp3 | she. Find the word she. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-twins-lost-kite-9569bf5d7f.mp3 | Which word finishes the sentence? The twins lost … kite. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-cubs-drank-milk-4342f7187b.mp3 | Which word finishes the sentence? The cubs drank … milk. | 1 |
| /audio/production/en-US/supplemental/their-find-the-word-their-1cd5cddf72.mp3 | their. Find the word their. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-look-the-bus-is-over-c3d6a60a2a.mp3 | Which word finishes the sentence? Look — the bus is over …! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-got-just-in-time-d09db60bfe.mp3 | Which word finishes the sentence? We got … just in time. | 1 |
| /audio/production/en-US/supplemental/there-find-the-word-there-d7dfb9bcec.mp3 | there. Find the word there. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-key-to-open-the-box-86d88e1dec.mp3 | Which word finishes the sentence? … the key to open the box. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-mud-to-make-bricks-1cee664214.mp3 | Which word finishes the sentence? We … mud to make bricks. | 1 |
| /audio/production/en-US/supplemental/use-find-the-word-use-1e7ffbbcc3.mp3 | use. Find the word use. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-sis-and-i-hid-both-grinned-264b7818bc.mp3 | Which word finishes the sentence? Sis and I hid. … both grinned. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-dad-and-i-fish-catch-cod-4f0a64c8ae.mp3 | Which word finishes the sentence? Dad and I fish. … catch cod! | 1 |
| /audio/production/en-US/supplemental/we-find-the-word-we-a1d529eba8.mp3 | we. Find the word we. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-shops-shut-at-ten-bde0ebcf94.mp3 | Which word finishes the sentence? The shops … shut at ten. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-you-so-brave-at-the-vet-cd730ff1c0.mp3 | Which word finishes the sentence? You … so brave at the vet! | 1 |
| /audio/production/en-US/supplemental/were-find-the-word-were-ca1592dd33.mp3 | were. Find the word were. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-is-in-the-big-box-cef9306231.mp3 | Which word finishes the sentence? … is in the big box? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-guess-i-made-for-you-f70bfa7383.mp3 | Which word finishes the sentence? Guess … I made for you! | 1 |
| /audio/production/en-US/supplemental/what-find-the-word-what-85ab81db56.mp3 | what. Find the word what. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-does-the-show-start-8db633968c.mp3 | Which word finishes the sentence? … does the show start? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-clap-you-sing-25ea122069.mp3 | Which word finishes the sentence? I clap … you sing. | 1 |
| /audio/production/en-US/supplemental/when-find-the-word-when-823068f46b.mp3 | when. Find the word when. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-hat-is-yours-red-or-blue-57103f8989.mp3 | Which word finishes the sentence? … hat is yours — red or blue? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-tell-me-pup-you-like-best-a4b9150a33.mp3 | Which word finishes the sentence? Tell me … pup you like best. | 1 |
| /audio/production/en-US/supplemental/which-find-the-word-which-078d74d384.mp3 | which. Find the word which. | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-read-six-new-today-92ae225437.mp3 | Which word finishes the sentence? We read six new … today. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-big-can-be-fun-to-spell-685f05dd9d.mp3 | Which word finishes the sentence? Big … can be fun to spell. | 1 |
| /audio/production/en-US/supplemental/words-find-the-word-words-e063b924ec.mp3 | words. Find the word words. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-is-this-scarf-3161bf03bc.mp3 | Which word finishes the sentence? Is this … scarf? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-pack-bags-for-camp-f0fef243c3.mp3 | Which word finishes the sentence? Pack … bags for camp. | 1 |
| /audio/production/en-US/supplemental/your-find-the-word-your-f609f50827.mp3 | your. Find the word your. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-ate-the-grapes-259a1f60cd.mp3 | Build the missing word. We ate … the grapes. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-my-pens-ran-out-10c1282ca9.mp3 | Build the missing word. … my pens ran out. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-he-fed-ox-at-the-farm-341161f8a9.mp3 | Build the missing word. He fed … ox at the farm. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-need-extra-bed-4a5ee44543.mp3 | Build the missing word. I need … extra bed. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-tried-i-slipped-f858c74ca2.mp3 | Build the missing word. I tried, … I slipped. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-small-strong-7f200ca555.mp3 | Build the missing word. Small … strong! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-stand-the-door-please-7a6ca9076c.mp3 | Build the missing word. Stand … the door, please. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-mill-sits-a-stream-2a06651a32.mp3 | Build the missing word. The mill sits … a stream. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-foxes-jump-high-a30a28148a.mp3 | Build the missing word. Foxes … jump high. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-camp-out-back-510add5664.mp3 | Build the missing word. … we camp out back? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-frogs-sleep-in-mud-a47968bc1d.mp3 | Build the missing word. … frogs sleep in mud? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-sums-after-lunch-d7c252968e.mp3 | Build the missing word. We … sums after lunch. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-give-hen-some-corn-5f6b449db5.mp3 | Build the missing word. Give … hen some corn. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-box-has-a-lid-660d3c9c78.mp3 | Build the missing word. … box has a lid. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-fun-at-the-fair-af72fdc43c.mp3 | Build the missing word. We … fun at the fair. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-pup-my-sock-39127d43df.mp3 | Build the missing word. The pup … my sock! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-do-bees-make-honey-6ab471df22.mp3 | Build the missing word. … do bees make honey? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-show-me-to-knit-5b04dca411.mp3 | Build the missing word. Show me … to knit. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-yell-you-spot-land-1d4b0c5ce9.mp3 | Build the missing word. Yell … you spot land! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ask-dad-we-may-go-dc45f83c88.mp3 | Build the missing word. Ask Dad … we may go. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-that-is-my-cup-a836e69c17.mp3 | Build the missing word. That is … my cup. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-do-wake-the-baby-098405c36f.mp3 | Build the missing word. Do … wake the baby! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-just-more-lap-to-run-91467a6a5d.mp3 | Build the missing word. Just … more lap to run! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-star-shone-first-94777dc49e.mp3 | Build the missing word. … star shone first. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-milk-water-with-lunch-5a24a6fa8c.mp3 | Build the missing word. Milk … water with lunch? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-walk-ride-you-pick-5431b7a39a.mp3 | Build the missing word. Walk … ride — you pick. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-vet-to-rest-the-pup-af5d6f40ed.mp3 | Build the missing word. The vet … to rest the pup. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-gran-bedtime-is-nine-66d06c3ce7.mp3 | Build the missing word. Gran … bedtime is nine. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-may-join-our-team-7f54f3675b.mp3 | Build the missing word. May … join our team? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-dug-up-a-gem-b620de7674.mp3 | Build the missing word. … dug up a gem! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-bees-kept-honey-safe-d00d4b1e73.mp3 | Build the missing word. The bees kept … honey safe. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-kids-lost-ball-again-0c4f564420.mp3 | Build the missing word. The kids lost … ball again. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-park-the-bikes-over-0ba5689aa7.mp3 | Build the missing word. Park the bikes over …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-is-anybody-146c45683d.mp3 | Build the missing word. Is anybody …? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-both-hands-to-lift-it-39b4395397.mp3 | Build the missing word. … both hands to lift it. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-twigs-for-the-nest-e2963a5e44.mp3 | Build the missing word. We … twigs for the nest. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-can-bake-a-plum-pie-c80581fb7c.mp3 | Build the missing word. Can … bake a plum pie? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-swam-till-six-9f2eac0843.mp3 | Build the missing word. … swam till six. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-socks-still-damp-9c1e1e69c1.mp3 | Build the missing word. The socks … still damp. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-you-fast-today-b0982ddfaf.mp3 | Build the missing word. You … fast today! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-fell-off-the-shelf-53787a8fa0.mp3 | Build the missing word. … fell off the shelf? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-guess-i-found-b6145bf814.mp3 | Build the missing word. Guess … I found! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-does-the-pool-open-55ad11d937.mp3 | Build the missing word. … does the pool open? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-clap-the-song-ends-1599d33741.mp3 | Build the missing word. Clap … the song ends. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-sock-is-mine-46f9431de4.mp3 | Build the missing word. … sock is mine? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-pick-game-we-play-e5ae0810eb.mp3 | Build the missing word. Pick … game we play. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-rhyming-end-the-same-f48613b485.mp3 | Build the missing word. Rhyming … end the same. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-long-need-long-tiles-f852a3f8ba.mp3 | Build the missing word. Long … need long tiles. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-tie-laces-up-tight-2d2c639959.mp3 | Build the missing word. Tie … laces up tight. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-bring-kit-on-monday-4c6044c1f7.mp3 | Build the missing word. Bring … kit on Monday. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-coach-to-rest-up-1a2ee6d046.mp3 | Which word finishes the sentence? The coach … to rest up. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-ants-built-nest-fast-f09847925a.mp3 | Which word finishes the sentence? The ants built … nest fast. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-buns-still-warm-7a684754e8.mp3 | Which word finishes the sentence? The buns … still warm. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-just-bun-is-left-2a1eae6921.mp3 | Which word finishes the sentence? Just … bun is left. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-sit-by-the-window-b561eef28c.mp3 | Build the missing word. Sit … by the window. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-who-that-f20451e6bd.mp3 | Build the missing word. Who … that? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-crabs-nip-take-care-cfa3e793cf.mp3 | Build the missing word. Crabs … nip — take care! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-is-this-pen-or-mine-c479d09035.mp3 | Build the missing word. Is this … pen or mine? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-this-book-is-ants-e94a6360df.mp3 | Which word finishes the sentence? This book is … ants. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-tell-me-the-trip-d4b022d598.mp3 | Which word finishes the sentence? Tell me … the trip! | 1 |
| /audio/production/en-US/supplemental/about-find-the-word-about-e8b02426e8.mp3 | about. Find the word about. | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-may-we-to-the-fair-e1bace6cc2.mp3 | Which word finishes the sentence? May we … to the fair? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-vans-up-the-hill-dc38aad04d.mp3 | Which word finishes the sentence? The vans … up the hill. | 1 |
| /audio/production/en-US/supplemental/go-find-the-word-go-7cea943710.mp3 | go. Find the word go. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-my-bike-a-bell-0816c4a04d.mp3 | Which word finishes the sentence? My bike … a bell. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-ren-two-pet-mice-9e1819af91.mp3 | Which word finishes the sentence? Ren … two pet mice. | 1 |
| /audio/production/en-US/supplemental/has-find-the-word-has-379d1d45b8.mp3 | has. Find the word has. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-meg-lost-mitten-7dcbeb9082.mp3 | Which word finishes the sentence? Meg lost … mitten. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-gran-naps-in-chair-7607d1ce5a.mp3 | Which word finishes the sentence? Gran naps in … chair. | 1 |
| /audio/production/en-US/supplemental/her-find-the-word-her-d8fbc49c61.mp3 | her. Find the word her. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-dad-waved-so-i-waved-at-93c9772d83.mp3 | Which word finishes the sentence? Dad waved, so I waved at …. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-tom-fell-help-up-277dc13606.mp3 | Which word finishes the sentence? Tom fell — help … up! | 1 |
| /audio/production/en-US/supplemental/him-find-the-word-him-760c58d6de.mp3 | him. Find the word him. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-frog-hopped-the-pond-91cad1ca74.mp3 | Which word finishes the sentence? The frog hopped … the pond. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-pour-the-milk-the-jug-7bf01729a0.mp3 | Which word finishes the sentence? Pour the milk … the jug. | 1 |
| /audio/production/en-US/supplemental/into-find-the-word-into-14fc70f942.mp3 | into. Find the word into. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-plums-best-of-all-252ea67070.mp3 | Which word finishes the sentence? I … plums best of all. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-clouds-can-look-sheep-d9da743e0e.mp3 | Which word finishes the sentence? Clouds can look … sheep. | 1 |
| /audio/production/en-US/supplemental/like-find-the-word-like-ffaa5fb8bd.mp3 | like. Find the word like. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-at-the-double-rainbow-230f091a0e.mp3 | Which word finishes the sentence? … at the double rainbow! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-for-shells-at-the-beach-35199e709d.mp3 | Which word finishes the sentence? We … for shells at the beach. | 1 |
| /audio/production/en-US/supplemental/look-find-the-word-look-2ac4d0116a.mp3 | look. Find the word look. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-let-s-a-mud-pie-a5a6887f98.mp3 | Which word finishes the sentence? Let's … a mud pie! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-bees-wax-and-honey-b0fcf5eab5.mp3 | Which word finishes the sentence? Bees … wax and honey. | 1 |
| /audio/production/en-US/supplemental/make-find-the-word-make-ddbb5d3d93.mp3 | make. Find the word make. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-hands-make-light-work-d84b2d8808.mp3 | Which word finishes the sentence? … hands make light work. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-how-eggs-are-left-e382d70459.mp3 | Which word finishes the sentence? How … eggs are left? | 1 |
| /audio/production/en-US/supplemental/many-find-the-word-many-d48dd5ef40.mp3 | many. Find the word many. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-may-i-have-peas-please-3ac2522da1.mp3 | Which word finishes the sentence? May I have … peas, please? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-this-box-holds-than-that-one-563c1f4d73.mp3 | Which word finishes the sentence? This box holds … than that one. | 1 |
| /audio/production/en-US/supplemental/more-find-the-word-more-68c139f203.mp3 | more. Find the word more. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-one-mitten-is-dry-my-mitten-is-lost-7ce21d71e7.mp3 | Which word finishes the sentence? One mitten is dry. My … mitten is lost. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-try-your-hand-2d45b52db9.mp3 | Which word finishes the sentence? Try your … hand. | 1 |
| /audio/production/en-US/supplemental/other-find-the-word-other-94e4cb5b67.mp3 | other. Find the word other. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-cat-ran-of-the-shed-1430f3a4bc.mp3 | Which word finishes the sentence? The cat ran … of the shed. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-turn-the-lamp-at-nine-c447ea2333.mp3 | Which word finishes the sentence? Turn the lamp … at nine. | 1 |
| /audio/production/en-US/supplemental/out-find-the-word-out-1de381eda2.mp3 | out. Find the word out. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-owls-can-well-at-night-c0ef732de6.mp3 | Which word finishes the sentence? Owls can … well at night. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-come-and-my-fort-3ec1ccdca2.mp3 | Which word finishes the sentence? Come and … my fort! | 1 |
| /audio/production/en-US/supplemental/see-find-the-word-see-aba7c0462b.mp3 | see. Find the word see. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-tea-was-hot-i-let-it-cool-6947069125.mp3 | Which word finishes the sentence? The tea was hot, … I let it cool. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-that-joke-is-funny-2936fc302c.mp3 | Which word finishes the sentence? That joke is … funny! | 1 |
| /audio/production/en-US/supplemental/so-find-the-word-so-24c19a85ff.mp3 | so. Find the word so. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-save-cake-for-gran-f0d8a228b0.mp3 | Which word finishes the sentence? Save … cake for Gran. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-birds-sing-at-dawn-5ee89de7a9.mp3 | Which word finishes the sentence? … birds sing at dawn. | 1 |
| /audio/production/en-US/supplemental/some-find-the-word-some-7d2f654b5e.mp3 | some. Find the word some. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-cups-i-washed-all-d3348dc93c.mp3 | Which word finishes the sentence? The cups? I washed … all. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-find-the-twins-and-tell-to-come-745f02a13c.mp3 | Which word finishes the sentence? Find the twins and tell … to come. | 1 |
| /audio/production/en-US/supplemental/them-find-the-word-them-05bef71357.mp3 | them. Find the word them. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-swam-we-had-lunch-ccf6146a60.mp3 | Which word finishes the sentence? We swam, … we had lunch. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-first-mix-bake-54156c15b7.mp3 | Which word finishes the sentence? First mix, … bake. | 1 |
| /audio/production/en-US/supplemental/then-find-the-word-then-0e8f19a60f.mp3 | then. Find the word then. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-boots-here-are-muddy-902c2b3088.mp3 | Which word finishes the sentence? … boots here are muddy. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-are-your-keys-right-here-b59ac09785.mp3 | Which word finishes the sentence? Are … your keys right here? | 1 |
| /audio/production/en-US/supplemental/these-find-the-word-these-b7aea1c091.mp3 | these. Find the word these. | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-what-does-the-pool-open-ebd2b91495.mp3 | Which word finishes the sentence? What … does the pool open? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-it-is-for-bed-sleepyhead-1a33b614f3.mp3 | Which word finishes the sentence? It is … for bed, sleepyhead. | 1 |
| /audio/production/en-US/supplemental/time-find-the-word-time-cd551fcc10.mp3 | time. Find the word time. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-have-thumbs-and-eight-fingers-5d295015b8.mp3 | Which word finishes the sentence? I have … thumbs and eight fingers. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-recipe-needs-eggs-869ee81583.mp3 | Which word finishes the sentence? The recipe needs … eggs. | 1 |
| /audio/production/en-US/supplemental/two-find-the-word-two-67ebb518c3.mp3 | two. Find the word two. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-kite-went-and-away-3f7ca9335d.mp3 | Which word finishes the sentence? The kite went … and away. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-roll-your-sleeping-bag-024a1df6af.mp3 | Which word finishes the sentence? Roll … your sleeping bag. | 1 |
| /audio/production/en-US/supplemental/up-find-the-word-up-6459039bff.mp3 | up. Find the word up. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-it-rain-later-i-think-6905135b6f.mp3 | Which word finishes the sentence? It … rain later, I think. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-you-hold-my-kite-a-bit-28ba36fbfd.mp3 | Which word finishes the sentence? … you hold my kite a bit? | 1 |
| /audio/production/en-US/supplemental/will-find-the-word-will-9e85786c41.mp3 | will. Find the word will. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-you-like-a-hot-roll-3968fdb794.mp3 | Which word finishes the sentence? … you like a hot roll? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-he-said-he-help-us-pack-2d3e33c635.mp3 | Which word finishes the sentence? He said he … help us pack. | 1 |
| /audio/production/en-US/supplemental/would-find-the-word-would-647c88f2ba.mp3 | would. Find the word would. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-please-your-name-at-the-top-3c5630b1e6.mp3 | Which word finishes the sentence? Please … your name at the top. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-to-my-pen-pal-weekly-19cdfe7bbd.mp3 | Which word finishes the sentence? I … to my pen pal weekly. | 1 |
| /audio/production/en-US/supplemental/write-find-the-word-write-ea7600851d.mp3 | write. Find the word write. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-this-song-is-the-sea-fea3249c47.mp3 | Build the missing word. This song is … the sea. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ask-me-my-hobby-7b3db14b8b.mp3 | Build the missing word. Ask me … my hobby. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-time-to-home-now-fae8365cfd.mp3 | Build the missing word. Time to … home now. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ready-steady-beea91f14e.mp3 | Build the missing word. Ready, steady, …! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-hive-ten-bees-860b0ffb95.mp3 | Build the missing word. The hive … ten bees. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-who-my-pencil-3d5a0a9d86.mp3 | Build the missing word. Who … my pencil? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-val-fed-rabbit-6465be6422.mp3 | Build the missing word. Val fed … rabbit. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-is-this-scarf-or-yours-842779a0ee.mp3 | Build the missing word. Is this … scarf or yours? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-pass-the-map-to-8e0b0afc0f.mp3 | Build the missing word. Pass the map to …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-picked-for-our-team-09f70a0800.mp3 | Build the missing word. We picked … for our team. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-hop-the-boat-quick-079f6bb335.mp3 | Build the missing word. Hop … the boat, quick! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-seeds-went-the-soil-3078e14f37.mp3 | Build the missing word. The seeds went … the soil. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ducks-wet-weather-0e74c2e817.mp3 | Build the missing word. Ducks … wet weather. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-my-toast-crunchy-b3d878a9ee.mp3 | Build the missing word. I … my toast crunchy. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-both-ways-first-e89ba95d3b.mp3 | Build the missing word. … both ways first. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-come-at-the-tadpoles-4803e5956c.mp3 | Build the missing word. Come … at the tadpoles! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-let-s-lemonade-7d8a14da27.mp3 | Build the missing word. Let's … lemonade. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-spiders-silk-webs-7763ceb3aa.mp3 | Build the missing word. Spiders … silk webs. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-moths-came-to-the-lamp-7849061a27.mp3 | Build the missing word. … moths came to the lamp. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-how-steps-to-the-top-072528562e.mp3 | Build the missing word. How … steps to the top? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-one-lap-then-rest-7284ba6a9e.mp3 | Build the missing word. One … lap, then rest. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-plant-needs-sun-5a9b38c718.mp3 | Build the missing word. The plant needs … sun. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-hold-it-with-your-hand-22cc8539a1.mp3 | Build the missing word. Hold it with your … hand. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-team-wore-red-b195d2fc92.mp3 | Build the missing word. The … team wore red. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-school-lets-at-three-acbc03b95b.mp3 | Build the missing word. School lets … at three. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-tide-went-fast-e7c14fb283.mp3 | Build the missing word. The tide went … fast. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-can-you-the-lighthouse-d3054db17c.mp3 | Build the missing word. Can you … the lighthouse? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-three-sails-021fe723ab.mp3 | Build the missing word. I … three sails! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-bag-was-heavy-32c37a4bd1.mp3 | Build the missing word. The bag was … heavy! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-trained-hard-i-won-0704936303.mp3 | Build the missing word. I trained hard, … I won. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-take-grapes-for-the-trip-2fa8664ddb.mp3 | Build the missing word. Take … grapes for the trip. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-crabs-hide-under-rocks-1508864a8f.mp3 | Build the missing word. … crabs hide under rocks. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-chicks-feed-at-five-1928e7e050.mp3 | Build the missing word. The chicks? Feed … at five. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-stack-the-chairs-and-count-2da766da8e.mp3 | Build the missing word. Stack the chairs and count …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-wash-up-dry-your-hands-658d97ff45.mp3 | Build the missing word. Wash up, … dry your hands. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-first-stretch-sprint-a5433e9411.mp3 | Build the missing word. First stretch, … sprint. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-shells-here-are-tiny-cb398c0eb7.mp3 | Build the missing word. … shells here are tiny. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-are-seats-taken-6258da738f.mp3 | Build the missing word. Are … seats taken? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-it-is-snack-10fbf686bd.mp3 | Build the missing word. It is snack …! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-what-is-kickoff-c4a0f92d6c.mp3 | Build the missing word. What … is kickoff? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-a-bike-has-wheels-b63391bbdf.mp3 | Build the missing word. A bike has … wheels. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-crows-sat-on-the-fence-bc737aabff.mp3 | Build the missing word. … crows sat on the fence. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-balloon-drifted-189b210c29.mp3 | Build the missing word. The balloon drifted …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-climb-the-ladder-slowly-d6fc7108e4.mp3 | Build the missing word. Climb … the ladder slowly. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-gran-knit-you-a-hat-205d55af9e.mp3 | Build the missing word. Gran … knit you a hat. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-bread-rise-by-noon-0bc71e71f5.mp3 | Build the missing word. The bread … rise by noon. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-you-feed-my-fish-a0ea4c1375.mp3 | Build the missing word. … you feed my fish? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-she-said-she-come-19076459c5.mp3 | Build the missing word. She said she … come. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-a-list-before-we-shop-8796e472e8.mp3 | Build the missing word. … a list before we shop. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-with-my-left-hand-5e8e9e69a8.mp3 | Build the missing word. I … with my left hand. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-it-be-ok-to-sit-here-5d9bd43480.mp3 | Which word finishes the sentence? … it be OK to sit here? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-scribes-all-day-long-9385ca3f7d.mp3 | Which word finishes the sentence? Scribes … all day long. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ben-trade-his-apple-e41b27e1bd.mp3 | Build the missing word. Ben … trade his apple. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-neatly-on-the-line-2c303acd99.mp3 | Build the missing word. … neatly on the line. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-socks-come-in-sets-of-d1792fa726.mp3 | Which word finishes the sentence? Socks come in sets of …. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-so-stars-are-out-tonight-2ec398e09d.mp3 | Which word finishes the sentence? So … stars are out tonight! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-before-you-leap-340e421355.mp3 | Build the missing word. … before you leap! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-bath-for-the-pup-b566822c1b.mp3 | Build the missing word. Bath … for the pup! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-where-have-you-all-day-b5d5f5cc24.mp3 | Which word finishes the sentence? Where have you … all day? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-pups-have-fed-0ef48b8579.mp3 | Which word finishes the sentence? The pups have … fed. | 1 |
| /audio/production/en-US/supplemental/been-find-the-word-been-205906c6a4.mp3 | been. Find the word been. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-gran-us-in-for-tea-6fada019bb.mp3 | Which word finishes the sentence? Gran … us in for tea. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-our-cat-is-pickle-c0a76903fb.mp3 | Which word finishes the sentence? Our cat is … Pickle. | 1 |
| /audio/production/en-US/supplemental/called-find-the-word-called-7001d7d45a.mp3 | called. Find the word called. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-and-warm-up-by-the-fire-8c43a597f0.mp3 | Which word finishes the sentence? … and warm up by the fire. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-foxes-out-after-dark-e035dfc604.mp3 | Which word finishes the sentence? Foxes … out after dark. | 1 |
| /audio/production/en-US/supplemental/come-find-the-word-come-643330ed81.mp3 | come. Find the word come. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-you-pass-the-jam-1beef17a93.mp3 | Which word finishes the sentence? … you pass the jam? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-long-ago-gran-skate-fast-a3b6dd81bf.mp3 | Which word finishes the sentence? Long ago, Gran … skate fast. | 1 |
| /audio/production/en-US/supplemental/could-find-the-word-could-11f9a70c45.mp3 | could. Find the word could. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-what-is-the-fair-on-4e87049770.mp3 | Which word finishes the sentence? What … is the fair on? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-what-a-windy-for-kites-6740d2d5ce.mp3 | Which word finishes the sentence? What a windy … for kites! | 1 |
| /audio/production/en-US/supplemental/day-find-the-word-day-e5c1499f49.mp3 | day. Find the word day. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-you-lock-the-gate-c5105f125a.mp3 | Which word finishes the sentence? … you lock the gate? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-our-best-at-the-quiz-59d4c491b2.mp3 | Which word finishes the sentence? We … our best at the quiz. | 1 |
| /audio/production/en-US/supplemental/did-find-the-word-did-ed54314938.mp3 | did. Find the word did. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-otter-slid-the-bank-07eb55615d.mp3 | Which word finishes the sentence? The otter slid … the bank. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-write-it-so-you-remember-1ece8253ec.mp3 | Which word finishes the sentence? Write it … so you remember. | 1 |
| /audio/production/en-US/supplemental/down-find-the-word-down-96cd3d69ed.mp3 | down. Find the word down. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-can-you-the-hidden-key-4fe0412f1b.mp3 | Which word finishes the sentence? Can you … the hidden key? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-bats-moths-at-night-40e16cee81.mp3 | Which word finishes the sentence? Bats … moths at night. | 1 |
| /audio/production/en-US/supplemental/find-find-the-word-find-23b4ae8d27.mp3 | find. Find the word find. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-tie-the-knot-then-pull-9b666b055c.mp3 | Which word finishes the sentence? Tie the knot …, then pull. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-ana-came-in-the-race-dc843a5366.mp3 | Which word finishes the sentence? Ana came … in the race. | 1 |
| /audio/production/en-US/supplemental/first-find-the-word-first-2614736b4e.mp3 | first. Find the word first. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-please-my-coat-from-the-peg-856a8f2900.mp3 | Which word finishes the sentence? Please … my coat from the peg. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-ducks-muddy-and-stay-happy-b844898105.mp3 | Which word finishes the sentence? Ducks … muddy and stay happy. | 1 |
| /audio/production/en-US/supplemental/get-find-the-word-get-5b44c93268.mp3 | get. Find the word get. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-a-snake-is-and-thin-379ff2a8c1.mp3 | Which word finishes the sentence? A snake is … and thin. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-how-is-the-train-ride-d83eca1982.mp3 | Which word finishes the sentence? How … is the train ride? | 1 |
| /audio/production/en-US/supplemental/long-find-the-word-long-00d97a18cb.mp3 | long. Find the word long. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-gramps-this-stool-himself-9c51b54383.mp3 | Which word finishes the sentence? Gramps … this stool himself. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-chef-soup-from-scraps-6275fa8952.mp3 | Which word finishes the sentence? The chef … soup from scraps. | 1 |
| /audio/production/en-US/supplemental/made-find-the-word-made-c4e7c1d31f.mp3 | made. Find the word made. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-there-is-a-chance-it-rain-c164fbd9d2.mp3 | Which word finishes the sentence? There is a chance it … rain. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-it-snow-before-dawn-1399c8f62c.mp3 | Which word finishes the sentence? It … snow before dawn. | 1 |
| /audio/production/en-US/supplemental/may-find-the-word-may-e195ce6b8b.mp3 | may. Find the word may. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-this-is-bike-not-yours-19e6eac200.mp3 | Which word finishes the sentence? This is … bike, not yours. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-lost-left-glove-a68252445c.mp3 | Which word finishes the sentence? I lost … left glove. | 1 |
| /audio/production/en-US/supplemental/my-find-the-word-my-6b97621c32.mp3 | my. Find the word my. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-there-are-plums-left-2069b2e14f.mp3 | Which word finishes the sentence? There are … plums left. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-dogs-on-the-sand-says-the-sign-b148f2f0a0.mp3 | Which word finishes the sentence? … dogs on the sand, says the sign. | 1 |
| /audio/production/en-US/supplemental/no-find-the-word-no-4161282055.mp3 | no. Find the word no. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-glue-is-dry-af431d055e.mp3 | Which word finishes the sentence? The glue is dry …. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-it-is-my-turn-13516cd0ac.mp3 | Which word finishes the sentence? … it is my turn! | 1 |
| /audio/production/en-US/supplemental/now-find-the-word-now-8cba5d51f1.mp3 | now. Find the word now. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-pick-a-from-one-to-ten-29306f5f3c.mp3 | Which word finishes the sentence? Pick a … from one to ten. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-what-is-your-house-96edbd1c71.mp3 | Which word finishes the sentence? What … is your house? | 1 |
| /audio/production/en-US/supplemental/number-find-the-word-number-bdd3ec90b3.mp3 | number. Find the word number. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-dad-put-on-the-squeaky-hinge-d76cc39b59.mp3 | Which word finishes the sentence? Dad put … on the squeaky hinge. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-and-water-will-not-mix-af7ba06d60.mp3 | Which word finishes the sentence? … and water will not mix. | 1 |
| /audio/production/en-US/supplemental/oil-find-the-word-oil-b0fdd99cd8.mp3 | oil. Find the word oil. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-best-of-camp-was-the-raft-ebd36c3bbc.mp3 | Which word finishes the sentence? The best … of camp was the raft. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-each-of-the-model-snaps-in-42a341cbf9.mp3 | Which word finishes the sentence? Each … of the model snaps in. | 1 |
| /audio/production/en-US/supplemental/part-find-the-word-part-f6c9f23c3d.mp3 | part. Find the word part. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-hall-was-full-of-ca286223cf.mp3 | Which word finishes the sentence? The hall was full of …. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-waved-from-the-bridge-d00a6d1e52.mp3 | Which word finishes the sentence? … waved from the bridge. | 1 |
| /audio/production/en-US/supplemental/people-find-the-word-people-7b90c57809.mp3 | people. Find the word people. | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-come-by-me-at-lunch-7a7ffa5f61.mp3 | Which word finishes the sentence? Come … by me at lunch. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-hens-on-their-eggs-b2922e19da.mp3 | Which word finishes the sentence? Hens … on their eggs. | 1 |
| /audio/production/en-US/supplemental/sit-find-the-word-sit-6b33c78fff.mp3 | sit. Find the word sit. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-a-whale-is-bigger-a-bus-79e7195fe4.mp3 | Which word finishes the sentence? A whale is bigger … a bus. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-would-rather-walk-wait-c5980b3430.mp3 | Which word finishes the sentence? I would rather walk … wait. | 1 |
| /audio/production/en-US/supplemental/than-find-the-word-than-ea5f43d14f.mp3 | than. Find the word than. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-plants-need-sun-and-31c9ea0aef.mp3 | Which word finishes the sentence? Plants need sun and …. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-in-the-pool-is-cold-d3c49b4990.mp3 | Which word finishes the sentence? The … in the pool is cold. | 1 |
| /audio/production/en-US/supplemental/water-find-the-word-water-29a015cb3f.mp3 | water. Find the word water. | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-is-this-the-to-the-beach-a40c1ecb1e.mp3 | Which word finishes the sentence? Is this the … to the beach? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-show-me-the-you-fold-it-d876b78a9b.mp3 | Which word finishes the sentence? Show me the … you fold it. | 1 |
| /audio/production/en-US/supplemental/way-find-the-word-way-3fd9c27214.mp3 | way. Find the word way. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-left-the-tap-running-aba5119c2f.mp3 | Which word finishes the sentence? … left the tap running? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-guess-won-the-raffle-738a7b4073.mp3 | Which word finishes the sentence? Guess … won the raffle! | 1 |
| /audio/production/en-US/supplemental/who-find-the-word-who-b4d4ba4222.mp3 | who. Find the word who. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-have-you-to-the-fair-0a0e84c8d6.mp3 | Build the missing word. Have you … to the fair? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-barn-has-painted-e53c15e490.mp3 | Build the missing word. The barn has … painted. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-pup-is-biscuit-20d675f0e7.mp3 | Build the missing word. The pup is … Biscuit. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-mum-the-vet-at-once-4c763c7974.mp3 | Build the missing word. Mum … the vet at once. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-and-see-the-chicks-7dd5e7af77.mp3 | Build the missing word. … and see the chicks! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-storms-fast-at-sea-bc2e44303a.mp3 | Build the missing word. Storms … fast at sea. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-camp-by-the-lake-0e4ea587dd.mp3 | Build the missing word. … we camp by the lake? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-owls-hear-a-pin-drop-010ebbb9a6.mp3 | Build the missing word. Owls … hear a pin drop. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-sports-is-on-friday-3c8392b08e.mp3 | Build the missing word. Sports … is on Friday. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-what-a-fine-for-a-hike-f867593762.mp3 | Build the missing word. What a fine … for a hike! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-alarm-ring-c7e8a34c63.mp3 | Build the missing word. … the alarm ring? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-you-a-fine-job-3725f34735.mp3 | Build the missing word. You … a fine job. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-roll-the-barrel-the-ramp-669edf981f.mp3 | Build the missing word. Roll the barrel … the ramp. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-sun-went-at-eight-7840da7b70.mp3 | Build the missing word. The sun went … at eight. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-help-me-my-keys-9a5281b14a.mp3 | Build the missing word. Help me … my keys. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-crows-shiny-things-697aaffd1b.mp3 | Build the missing word. Crows … shiny things. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ladders-then-paint-9fb878831b.mp3 | Build the missing word. Ladders …, then paint. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-who-came-in-the-quiz-1af82006c5.mp3 | Build the missing word. Who came … in the quiz? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-your-boots-it-snowed-515b4a5a4a.mp3 | Build the missing word. … your boots — it snowed! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-eggs-from-the-coop-e605bb047c.mp3 | Build the missing word. We … eggs from the coop. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-giraffes-have-necks-7919ead7d1.mp3 | Build the missing word. Giraffes have … necks. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-queue-was-so-995c82cbae.mp3 | Build the missing word. The queue was so …! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-jam-tarts-today-3c0f435563.mp3 | Build the missing word. We … jam tarts today. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ants-a-nest-by-the-step-1e45ca5d92.mp3 | Build the missing word. Ants … a nest by the step. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-i-ring-the-bell-a3453cd531.mp3 | Build the missing word. … I ring the bell? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-it-thunder-later-233cee339b.mp3 | Build the missing word. It … thunder later. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-where-is-other-mitten-c71cede903.mp3 | Build the missing word. Where is … other mitten? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-turn-on-the-swing-4ebc5cd681.mp3 | Build the missing word. … turn on the swing! | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-there-is-milk-left-8526bb8185.mp3 | Build the missing word. There is … milk left. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-two-snowflakes-match-a1f3a2339f.mp3 | Build the missing word. … two snowflakes match. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-paint-is-dry-16668a9dc2.mp3 | Build the missing word. The paint is dry …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-add-the-flour-slowly-95a6b147e6.mp3 | Build the missing word. … add the flour slowly. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ring-this-if-lost-dc11d9a697.mp3 | Build the missing word. Ring this … if lost. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-seven-is-my-lucky-1c3f8b09a9.mp3 | Build the missing word. Seven is my lucky …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-bike-chains-need-752c2aba6c.mp3 | Build the missing word. Bike chains need …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-wheels-please-bc2d62389a.mp3 | Build the missing word. … the wheels, please. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-this-clips-on-last-391615df47.mp3 | Build the missing word. This … clips on last. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-play-your-in-the-show-517b24467f.mp3 | Build the missing word. Play your … in the show. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-six-fit-in-the-lift-158ef50df1.mp3 | Build the missing word. Six … fit in the lift. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-kind-share-the-bench-0b60f5fb38.mp3 | Build the missing word. Kind … share the bench. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-still-for-the-photo-6e5dde819b.mp3 | Build the missing word. … still for the photo. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-cats-where-they-please-699bff6d7c.mp3 | Build the missing word. Cats … where they please. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-silk-is-softer-wool-928d605de2.mp3 | Build the missing word. Silk is softer … wool. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ice-is-colder-snow-b867d3a74f.mp3 | Build the missing word. Ice is colder … snow. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-fill-the-trough-with-3d9be85257.mp3 | Build the missing word. Fill the trough with …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-the-froze-overnight-153e85898e.mp3 | Build the missing word. The … froze overnight. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-this-to-the-exit-f7b6c858d2.mp3 | Build the missing word. This … to the exit. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-a-compass-shows-the-f833808357.mp3 | Build the missing word. A compass shows the …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ate-the-last-plum-0daf398e43.mp3 | Build the missing word. … ate the last plum? | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-ask-owns-the-scooter-7a139e7a36.mp3 | Build the missing word. Ask … owns the scooter. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-wish-i-fly-like-a-hawk-e2ae040db0.mp3 | Which word finishes the sentence? I wish I … fly like a hawk. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-post-has-already-5119065139.mp3 | Which word finishes the sentence? The post has already …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-we-hear-the-sea-from-camp-3f17a76a12.mp3 | Build the missing word. We … hear the sea from camp. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-it-has-ages-70998a4447.mp3 | Build the missing word. It has … ages! | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-knows-the-answer-36ca32cd43.mp3 | Which word finishes the sentence? … knows the answer? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-feathers-weigh-less-stones-abbd67c3ce.mp3 | Which word finishes the sentence? Feathers weigh less … stones. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-pick-an-odd-6e7128b931.mp3 | Build the missing word. Pick an odd …. | 1 |
| /audio/production/en-US/supplemental/build-the-missing-word-save-take-short-showers-3c38c7c9da.mp3 | Build the missing word. Save … — take short showers. | 1 |
| /audio/production/en-US/supplemental/which-spelling-names-the-big-salty-water-db663527d4.mp3 | Which spelling names the big salty water? | 1 |
| /audio/production/en-US/supplemental/which-spelling-means-you-look-with-your-eyes-eafe2a4715.mp3 | Which spelling means you look with your eyes? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-we-sailed-far-out-on-the-deep-blue-6d2867eb3d.mp3 | Which spelling finishes the sentence? We sailed far out on the deep blue …. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-close-your-eyes-now-open-and-304f548111.mp3 | Which spelling finishes the sentence? Close your eyes — now open and …! | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-hot-star-in-the-sky-e5326f5cd4.mp3 | Which spelling is the hot star in the sky? | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-a-boy-in-a-family-2113afc7ae.mp3 | Which spelling is a boy in a family? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-rose-over-the-hill-at-dawn-bd7290bfd0.mp3 | Which spelling finishes the sentence? The … rose over the hill at dawn. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-grandpa-hugged-his-at-the-gate-95e28f5e31.mp3 | Which spelling finishes the sentence? Grandpa hugged his … at the gate. | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-buzzing-insect-c71334ba46.mp3 | Which spelling is the buzzing insect? | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-doing-word-in-let-it-a6f6c86ca7.mp3 | Which spelling is the doing word in 'Let it … '? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-a-landed-on-the-flower-ffa450394d.mp3 | Which spelling finishes the sentence? A … landed on the flower. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-i-will-seven-on-my-next-birthday-1bccb9c28b.mp3 | Which spelling finishes the sentence? I will … seven on my next birthday. | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-word-for-not-yes-db7f337a95.mp3 | Which spelling is the word for 'not yes'? | 1 |
| /audio/production/en-US/supplemental/which-spelling-fits-to-the-answer-a5641e2b90.mp3 | Which spelling fits 'to … the answer'? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-dad-said-when-i-asked-for-sweets-bbd4a07f97.mp3 | Which spelling finishes the sentence? Dad said … when I asked for sweets. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-do-you-the-way-to-school-33767bac85.mp3 | Which spelling finishes the sentence? Do you … the way to school? | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-number-after-zero-9474004ca5.mp3 | Which spelling is the number after zero? | 1 |
| /audio/production/en-US/supplemental/which-spelling-tells-that-your-team-came-first-6173653cfb.mp3 | Which spelling tells that your team came first? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-pick-just-card-from-the-pack-14e9872026.mp3 | Which spelling finishes the sentence? Pick just … card from the pack. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-our-team-the-cup-last-year-e4b64cc3d0.mp3 | Which spelling finishes the sentence? Our team … the cup last year! | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-number-after-seven-b0aa6ba4b3.mp3 | Which spelling is the number after seven? | 1 |
| /audio/production/en-US/supplemental/which-spelling-tells-that-lunch-is-all-gone-2890f2ce14.mp3 | Which spelling tells that lunch is all gone? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-ben-all-his-peas-at-dinner-13b51fd55d.mp3 | Which spelling finishes the sentence? Ben … all his peas at dinner. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-there-are-legs-on-a-spider-a685920fe4.mp3 | Which spelling finishes the sentence? There are … legs on a spider. | 1 |
| /audio/production/en-US/supplemental/which-spelling-uses-your-ears-7fa82959aa.mp3 | Which spelling uses your ears? | 1 |
| /audio/production/en-US/supplemental/which-spelling-points-to-this-place-6ee2294bfa.mp3 | Which spelling points to this place? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-shh-i-can-the-owl-outside-723b6ff340.mp3 | Which spelling finishes the sentence? Shh! I can … the owl outside. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-bus-stops-right-at-this-very-co-1e346bd7c7.mp3 | Which spelling finishes the sentence? The bus stops right …, at this very corner. | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-color-of-the-sky-36ceb3bc76.mp3 | Which spelling is the color of the sky? | 1 |
| /audio/production/en-US/supplemental/which-spelling-tells-what-the-wind-did-a661aee7f6.mp3 | Which spelling tells what the wind did? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-wind-my-hat-into-the-pond-b57e7008c9.mp3 | Which spelling finishes the sentence? The wind … my hat into the pond! | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-milo-wore-his-scarf-blue-like-the-s-1a7a2e835f.mp3 | Which spelling finishes the sentence? Milo wore his … scarf, blue like the sea. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-may-i-come-the-park-with-you-6944f43470.mp3 | Which spelling finishes the sentence? May I come … the park with you? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-nan-baked-pies-one-for-each-hand-7bd55dacea.mp3 | Which spelling finishes the sentence? Nan baked … pies, one for each hand. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-that-soup-is-hot-to-eat-6f50ee5ab0.mp3 | Which spelling finishes the sentence? That soup is … hot to eat! | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-number-142b66ef8b.mp3 | Which spelling is the number? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-twins-packed-bags-for-camp-3a87170764.mp3 | Which spelling finishes the sentence? The twins packed … bags for camp. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-look-over-the-parade-is-coming-ceaa1e636b.mp3 | Which spelling finishes the sentence? Look over … — the parade is coming! | 1 |
| /audio/production/en-US/supplemental/which-spelling-shows-something-belongs-to-them-147f19d1ec.mp3 | Which spelling shows something belongs to them? | 1 |
| /audio/production/en-US/supplemental/which-spelling-points-to-a-place-1a3dc660cc.mp3 | Which spelling points to a place? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-teacher-ticked-it-my-sum-was-898fa93d7e.mp3 | Which spelling finishes the sentence? The teacher ticked it — my sum was …. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-i-will-a-letter-to-gran-tonight-6a120e6016.mp3 | Which spelling finishes the sentence? I will … a letter to Gran tonight. | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-opposite-of-left-44f09012fa.mp3 | Which spelling is the opposite of left? | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-done-with-a-pencil-493230f3e6.mp3 | Which spelling is done with a pencil? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-my-shoes-are-i-got-them-today-e86305ba71.mp3 | Which spelling finishes the sentence? My shoes are … — I got them today. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-i-the-answer-before-anyone-else-2734537204.mp3 | Which spelling finishes the sentence? I … the answer before anyone else. | 1 |
| /audio/production/en-US/supplemental/which-spelling-tells-you-understood-it-all-along-0ef894ae8b.mp3 | Which spelling tells you understood it all along? | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-the-opposite-of-old-5bf37b3e02.mp3 | Which spelling is the opposite of old? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-cake-bakes-for-one-def801b614.mp3 | Which spelling finishes the sentence? The cake bakes for one …. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-that-swing-is-special-spot-2907e67cc7.mp3 | Which spelling finishes the sentence? That swing is … special spot. | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-sixty-minutes-31a317fddc.mp3 | Which spelling is sixty minutes? | 1 |
| /audio/production/en-US/supplemental/which-spelling-means-it-belongs-to-us-f496428e55.mp3 | Which spelling means it belongs to us? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-sift-the-into-the-bowl-for-the-cake-fd81fe16db.mp3 | Which spelling finishes the sentence? Sift the … into the bowl for the cake. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-a-bee-landed-on-the-pink-ef9aaa39ac.mp3 | Which spelling finishes the sentence? A bee landed on the pink …. | 1 |
| /audio/production/en-US/supplemental/which-spelling-grows-in-the-garden-b81c56f1db.mp3 | Which spelling grows in the garden? | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-powder-for-baking-ecb758a58a.mp3 | Which spelling is powder for baking? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-you-like-some-juice-2ec34c8126.mp3 | Which spelling finishes the sentence? … you like some juice? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-bench-is-made-of-from-the-old-o-afc7948f27.mp3 | Which spelling finishes the sentence? The bench is made of … from the old oak. | 1 |
| /audio/production/en-US/supplemental/which-spelling-comes-from-trees-3bb3cb71a9.mp3 | Which spelling comes from trees? | 1 |
| /audio/production/en-US/supplemental/which-spelling-asks-politely-as-in-you-help-me-5718472fb3.mp3 | Which spelling asks politely, as in ' … you help me?' | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-gran-pancakes-for-breakfast-823568c2b3.mp3 | Which spelling finishes the sentence? Gran … pancakes for breakfast. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-swept-the-castle-floor-63757b86f3.mp3 | Which spelling finishes the sentence? The … swept the castle floor. | 1 |
| /audio/production/en-US/supplemental/which-spelling-tells-that-you-built-something-b47ae3cbe7.mp3 | Which spelling tells that you built something? | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-a-castle-helper-3a31044d16.mp3 | Which spelling is a castle helper? | 1 |
| /audio/production/en-US/supplemental/which-sentence-uses-bat-to-mean-the-animal-968cdc8705.mp3 | Which sentence uses bat to mean the animal? | 1 |
| /audio/production/en-US/supplemental/which-sentence-uses-bat-as-the-thing-you-hit-with-4fd4d22443.mp3 | Which sentence uses bat as the thing you HIT with? | 1 |
| /audio/production/en-US/supplemental/a-ring-can-be-jewelry-or-a-sound-which-sentence-uses-ring-as-the-sound-f68f40b03c.mp3 | A ring can be jewelry or a sound. Which sentence uses ring as the SOUND? | 1 |
| /audio/production/en-US/supplemental/which-sentence-uses-ring-as-the-thing-you-wear-366fc3a1aa.mp3 | Which sentence uses ring as the thing you WEAR? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-shells-wash-up-from-the-ea5ca9736a.mp3 | Which spelling finishes the sentence? Shells wash up from the …. | 1 |
| /audio/production/en-US/supplemental/which-spelling-warms-the-earth-f90ba0b67c.mp3 | Which spelling warms the earth? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-buzzed-from-rose-to-rose-ef0744d7f8.mp3 | Which spelling finishes the sentence? The … buzzed from rose to rose. | 1 |
| /audio/production/en-US/supplemental/which-spelling-fits-i-my-phone-number-by-heart-747dba1f83.mp3 | Which spelling fits: I … my phone number by heart? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-we-the-quiz-by-a-single-point-6bad159680.mp3 | Which spelling finishes the sentence? We … the quiz by a single point! | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-how-many-legs-an-octopus-has-1020e0af51.mp3 | Which spelling is how many legs an octopus has? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-stand-still-and-you-can-the-waves-5a282833d0.mp3 | Which spelling finishes the sentence? Stand still and you can … the waves. | 1 |
| /audio/production/en-US/supplemental/which-spelling-is-a-color-6d2a8a220b.mp3 | Which spelling is a color? | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-it-is-dark-to-read-outside-now-b24374e967.mp3 | Which spelling finishes the sentence? It is … dark to read outside now. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-the-birds-built-nest-in-the-oak-4c5f9c6467.mp3 | Which spelling finishes the sentence? The birds built … nest in the oak. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-use-the-pencil-to-your-name-6c63a73332.mp3 | Which spelling finishes the sentence? Use the pencil to … your name. | 1 |
| /audio/production/en-US/supplemental/which-spelling-finishes-the-sentence-we-a-fort-out-of-pillows-6b251f63aa.mp3 | Which spelling finishes the sentence? We … a fort out of pillows. | 1 |
| /audio/production/en-US/supplemental/apple-which-letter-makes-the-first-sound-in-apple-21f52b5a67.mp3 | apple. Which letter makes the first sound in apple? | 1 |
| /audio/production/en-US/supplemental/ant-which-letter-makes-the-first-sound-in-ant-2955a46b38.mp3 | ant. Which letter makes the first sound in ant? | 1 |
| /audio/production/en-US/supplemental/ant-which-one-starts-with-the-same-sound-as-ant-fa1337ce0e.mp3 | ant. Which one starts with the same sound as ant? | 1 |
| /audio/production/en-US/supplemental/astronaut-which-letter-makes-the-first-sound-in-astronaut-7240cba90c.mp3 | astronaut. Which letter makes the first sound in astronaut? | 1 |
| /audio/production/en-US/supplemental/alligator-which-letter-makes-the-first-sound-in-alligator-916d4ddce3.mp3 | alligator. Which letter makes the first sound in alligator? | 1 |
| /audio/production/en-US/supplemental/apple-which-one-starts-with-the-same-sound-as-apple-5b23e60152.mp3 | apple. Which one starts with the same sound as apple? | 1 |
| /audio/production/en-US/supplemental/boat-which-letter-makes-the-first-sound-in-boat-04af4258e1.mp3 | boat. Which letter makes the first sound in boat? | 1 |
| /audio/production/en-US/supplemental/bike-which-letter-makes-the-first-sound-in-bike-9c1a9eaf75.mp3 | bike. Which letter makes the first sound in bike? | 1 |
| /audio/production/en-US/supplemental/boat-which-one-starts-with-the-same-sound-as-boat-8d7045b716.mp3 | boat. Which one starts with the same sound as boat? | 1 |
| /audio/production/en-US/supplemental/banana-which-letter-makes-the-first-sound-in-banana-d538558729.mp3 | banana. Which letter makes the first sound in banana? | 1 |
| /audio/production/en-US/supplemental/butterfly-which-letter-makes-the-first-sound-in-butterfly-28629616dc.mp3 | butterfly. Which letter makes the first sound in butterfly? | 1 |
| /audio/production/en-US/supplemental/bread-which-one-starts-with-the-same-sound-as-bread-b6b8d03874.mp3 | bread. Which one starts with the same sound as bread? | 1 |
| /audio/production/en-US/supplemental/corn-which-letter-makes-the-first-sound-in-corn-1b27d04c22.mp3 | corn. Which letter makes the first sound in corn? | 1 |
| /audio/production/en-US/supplemental/cap-which-letter-makes-the-first-sound-in-cap-8b9304df2c.mp3 | cap. Which letter makes the first sound in cap? | 1 |
| /audio/production/en-US/supplemental/cake-which-one-starts-with-the-same-sound-as-cake-1a7cab64b4.mp3 | cake. Which one starts with the same sound as cake? | 1 |
| /audio/production/en-US/supplemental/caterpillar-which-letter-makes-the-first-sound-in-caterpillar-a9035d0ad4.mp3 | caterpillar. Which letter makes the first sound in caterpillar? | 1 |
| /audio/production/en-US/supplemental/camera-which-letter-makes-the-first-sound-in-camera-5fc92711cf.mp3 | camera. Which letter makes the first sound in camera? | 1 |
| /audio/production/en-US/supplemental/cap-which-one-starts-with-the-same-sound-as-cap-4ef5a8078f.mp3 | cap. Which one starts with the same sound as cap? | 1 |
| /audio/production/en-US/supplemental/dog-which-letter-makes-the-first-sound-in-dog-7acf9a4021.mp3 | dog. Which letter makes the first sound in dog? | 1 |
| /audio/production/en-US/supplemental/duck-which-letter-makes-the-first-sound-in-duck-10195326c3.mp3 | duck. Which letter makes the first sound in duck? | 1 |
| /audio/production/en-US/supplemental/dog-which-one-starts-with-the-same-sound-as-dog-2a04c68a09.mp3 | dog. Which one starts with the same sound as dog? | 1 |
| /audio/production/en-US/supplemental/dinosaur-which-letter-makes-the-first-sound-in-dinosaur-3159c7bc85.mp3 | dinosaur. Which letter makes the first sound in dinosaur? | 1 |
| /audio/production/en-US/supplemental/dolphin-which-letter-makes-the-first-sound-in-dolphin-23311de2d7.mp3 | dolphin. Which letter makes the first sound in dolphin? | 1 |
| /audio/production/en-US/supplemental/drum-which-one-starts-with-the-same-sound-as-drum-b5ad7b9f50.mp3 | drum. Which one starts with the same sound as drum? | 1 |
| /audio/production/en-US/supplemental/egg-which-letter-makes-the-first-sound-in-egg-698d2b002e.mp3 | egg. Which letter makes the first sound in egg? | 1 |
| /audio/production/en-US/supplemental/envelope-which-letter-makes-the-first-sound-in-envelope-e926172d65.mp3 | envelope. Which letter makes the first sound in envelope? | 1 |
| /audio/production/en-US/supplemental/egg-which-one-starts-with-the-same-sound-as-egg-c5cfc20f11.mp3 | egg. Which one starts with the same sound as egg? | 1 |
| /audio/production/en-US/supplemental/elephant-which-letter-makes-the-first-sound-in-elephant-62c18886ae.mp3 | elephant. Which letter makes the first sound in elephant? | 1 |
| /audio/production/en-US/supplemental/elbow-which-letter-makes-the-first-sound-in-elbow-b684d8ab8f.mp3 | elbow. Which letter makes the first sound in elbow? | 1 |
| /audio/production/en-US/supplemental/envelope-which-one-starts-with-the-same-sound-as-envelope-55133cb8d6.mp3 | envelope. Which one starts with the same sound as envelope? | 1 |
| /audio/production/en-US/supplemental/fan-which-letter-makes-the-first-sound-in-fan-a1a360d498.mp3 | fan. Which letter makes the first sound in fan? | 1 |
| /audio/production/en-US/supplemental/fox-which-letter-makes-the-first-sound-in-fox-e4da9ccf65.mp3 | fox. Which letter makes the first sound in fox? | 1 |
| /audio/production/en-US/supplemental/fish-which-one-starts-with-the-same-sound-as-fish-5836cb93eb.mp3 | fish. Which one starts with the same sound as fish? | 1 |
| /audio/production/en-US/supplemental/feather-which-letter-makes-the-first-sound-in-feather-b42c047969.mp3 | feather. Which letter makes the first sound in feather? | 1 |
| /audio/production/en-US/supplemental/flamingo-which-letter-makes-the-first-sound-in-flamingo-e5389367bd.mp3 | flamingo. Which letter makes the first sound in flamingo? | 1 |
| /audio/production/en-US/supplemental/fan-which-one-starts-with-the-same-sound-as-fan-a89ea7cd62.mp3 | fan. Which one starts with the same sound as fan? | 1 |
| /audio/production/en-US/supplemental/goat-which-letter-makes-the-first-sound-in-goat-f052f86177.mp3 | goat. Which letter makes the first sound in goat? | 1 |
| /audio/production/en-US/supplemental/gate-which-letter-makes-the-first-sound-in-gate-a5eb94bd5f.mp3 | gate. Which letter makes the first sound in gate? | 1 |
| /audio/production/en-US/supplemental/goat-which-one-starts-with-the-same-sound-as-goat-ee6bcc1233.mp3 | goat. Which one starts with the same sound as goat? | 2 |
| /audio/production/en-US/supplemental/guitar-which-letter-makes-the-first-sound-in-guitar-a214bd14b4.mp3 | guitar. Which letter makes the first sound in guitar? | 1 |
| /audio/production/en-US/supplemental/gorilla-which-letter-makes-the-first-sound-in-gorilla-8b1c686e51.mp3 | gorilla. Which letter makes the first sound in gorilla? | 1 |
| /audio/production/en-US/supplemental/gate-which-one-starts-with-the-same-sound-as-gate-7cb6362a9d.mp3 | gate. Which one starts with the same sound as gate? | 1 |
| /audio/production/en-US/supplemental/hat-which-letter-makes-the-first-sound-in-hat-bada118bd7.mp3 | hat. Which letter makes the first sound in hat? | 1 |
| /audio/production/en-US/supplemental/hen-which-letter-makes-the-first-sound-in-hen-e4ed3a74e4.mp3 | hen. Which letter makes the first sound in hen? | 1 |
| /audio/production/en-US/supplemental/hat-which-one-starts-with-the-same-sound-as-hat-7261addc2b.mp3 | hat. Which one starts with the same sound as hat? | 1 |
| /audio/production/en-US/supplemental/helicopter-which-letter-makes-the-first-sound-in-helicopter-c341a94d7c.mp3 | helicopter. Which letter makes the first sound in helicopter? | 1 |
| /audio/production/en-US/supplemental/hedgehog-which-letter-makes-the-first-sound-in-hedgehog-678c107098.mp3 | hedgehog. Which letter makes the first sound in hedgehog? | 1 |
| /audio/production/en-US/supplemental/hen-which-one-starts-with-the-same-sound-as-hen-146bbabfd1.mp3 | hen. Which one starts with the same sound as hen? | 1 |
| /audio/production/en-US/supplemental/igloo-which-letter-makes-the-first-sound-in-igloo-75aee832d0.mp3 | igloo. Which letter makes the first sound in igloo? | 1 |
| /audio/production/en-US/supplemental/ink-which-letter-makes-the-first-sound-in-ink-328220cd47.mp3 | ink. Which letter makes the first sound in ink? | 1 |
| /audio/production/en-US/supplemental/ink-which-one-starts-with-the-same-sound-as-ink-4dd5393e9b.mp3 | ink. Which one starts with the same sound as ink? | 1 |
| /audio/production/en-US/supplemental/insect-which-letter-makes-the-first-sound-in-insect-fe3e3f65f1.mp3 | insect. Which letter makes the first sound in insect? | 1 |
| /audio/production/en-US/supplemental/instrument-which-letter-makes-the-first-sound-in-instrument-22feb5587f.mp3 | instrument. Which letter makes the first sound in instrument? | 1 |
| /audio/production/en-US/supplemental/igloo-which-one-starts-with-the-same-sound-as-igloo-b5d6ae3a3e.mp3 | igloo. Which one starts with the same sound as igloo? | 1 |
| /audio/production/en-US/supplemental/jet-which-letter-makes-the-first-sound-in-jet-8eddfa1b74.mp3 | jet. Which letter makes the first sound in jet? | 1 |
| /audio/production/en-US/supplemental/jam-which-letter-makes-the-first-sound-in-jam-576838afbf.mp3 | jam. Which letter makes the first sound in jam? | 1 |
| /audio/production/en-US/supplemental/jug-which-one-starts-with-the-same-sound-as-jug-71065e6cb3.mp3 | jug. Which one starts with the same sound as jug? | 1 |
| /audio/production/en-US/supplemental/jacket-which-letter-makes-the-first-sound-in-jacket-737628f38b.mp3 | jacket. Which letter makes the first sound in jacket? | 1 |
| /audio/production/en-US/supplemental/jellyfish-which-letter-makes-the-first-sound-in-jellyfish-d1c5074234.mp3 | jellyfish. Which letter makes the first sound in jellyfish? | 1 |
| /audio/production/en-US/supplemental/jet-which-one-starts-with-the-same-sound-as-jet-68509b0cf6.mp3 | jet. Which one starts with the same sound as jet? | 1 |
| /audio/production/en-US/supplemental/kite-which-letter-makes-the-first-sound-in-kite-73f5af04e2.mp3 | kite. Which letter makes the first sound in kite? | 1 |
| /audio/production/en-US/supplemental/king-which-letter-makes-the-first-sound-in-king-0c0a86ba96.mp3 | king. Which letter makes the first sound in king? | 1 |
| /audio/production/en-US/supplemental/kite-which-one-starts-with-the-same-sound-as-kite-da25514813.mp3 | kite. Which one starts with the same sound as kite? | 1 |
| /audio/production/en-US/supplemental/kangaroo-which-letter-makes-the-first-sound-in-kangaroo-570d217844.mp3 | kangaroo. Which letter makes the first sound in kangaroo? | 1 |
| /audio/production/en-US/supplemental/kettle-which-letter-makes-the-first-sound-in-kettle-daad5cabbe.mp3 | kettle. Which letter makes the first sound in kettle? | 1 |
| /audio/production/en-US/supplemental/king-which-one-starts-with-the-same-sound-as-king-ab39342ce8.mp3 | king. Which one starts with the same sound as king? | 1 |
| /audio/production/en-US/supplemental/lamp-which-letter-makes-the-first-sound-in-lamp-59c08046fb.mp3 | lamp. Which letter makes the first sound in lamp? | 1 |
| /audio/production/en-US/supplemental/leg-which-letter-makes-the-first-sound-in-leg-33b75c2171.mp3 | leg. Which letter makes the first sound in leg? | 1 |
| /audio/production/en-US/supplemental/lamp-which-one-starts-with-the-same-sound-as-lamp-42259bb97c.mp3 | lamp. Which one starts with the same sound as lamp? | 1 |
| /audio/production/en-US/supplemental/lemon-which-letter-makes-the-first-sound-in-lemon-894822fe85.mp3 | lemon. Which letter makes the first sound in lemon? | 1 |
| /audio/production/en-US/supplemental/lion-which-letter-makes-the-first-sound-in-lion-3a84a70da5.mp3 | lion. Which letter makes the first sound in lion? | 1 |
| /audio/production/en-US/supplemental/lion-which-one-starts-with-the-same-sound-as-lion-947641c03b.mp3 | lion. Which one starts with the same sound as lion? | 1 |
| /audio/production/en-US/supplemental/map-which-letter-makes-the-first-sound-in-map-bab044bc59.mp3 | map. Which letter makes the first sound in map? | 1 |
| /audio/production/en-US/supplemental/mug-which-letter-makes-the-first-sound-in-mug-0c06d28a40.mp3 | mug. Which letter makes the first sound in mug? | 1 |
| /audio/production/en-US/supplemental/moon-which-one-starts-with-the-same-sound-as-moon-2c31bfc26f.mp3 | moon. Which one starts with the same sound as moon? | 1 |
| /audio/production/en-US/supplemental/mountain-which-letter-makes-the-first-sound-in-mountain-a2de8a8dd8.mp3 | mountain. Which letter makes the first sound in mountain? | 1 |
| /audio/production/en-US/supplemental/microphone-which-letter-makes-the-first-sound-in-microphone-4d6d1358c6.mp3 | microphone. Which letter makes the first sound in microphone? | 1 |
| /audio/production/en-US/supplemental/mug-which-one-starts-with-the-same-sound-as-mug-f045d8fc8b.mp3 | mug. Which one starts with the same sound as mug? | 1 |
| /audio/production/en-US/supplemental/net-which-letter-makes-the-first-sound-in-net-df1d099f4c.mp3 | net. Which letter makes the first sound in net? | 1 |
| /audio/production/en-US/supplemental/nose-which-letter-makes-the-first-sound-in-nose-eb2bf3d627.mp3 | nose. Which letter makes the first sound in nose? | 1 |
| /audio/production/en-US/supplemental/net-which-one-starts-with-the-same-sound-as-net-8f9effaed2.mp3 | net. Which one starts with the same sound as net? | 1 |
| /audio/production/en-US/supplemental/necklace-which-letter-makes-the-first-sound-in-necklace-d10d8267e2.mp3 | necklace. Which letter makes the first sound in necklace? | 1 |
| /audio/production/en-US/supplemental/newspaper-which-letter-makes-the-first-sound-in-newspaper-a4b8bf014f.mp3 | newspaper. Which letter makes the first sound in newspaper? | 1 |
| /audio/production/en-US/supplemental/nut-which-one-starts-with-the-same-sound-as-nut-b1209e2ae3.mp3 | nut. Which one starts with the same sound as nut? | 1 |
| /audio/production/en-US/supplemental/ox-which-letter-makes-the-first-sound-in-ox-48c70aa2e7.mp3 | ox. Which letter makes the first sound in ox? | 1 |
| /audio/production/en-US/supplemental/octopus-which-letter-makes-the-first-sound-in-octopus-dd06776463.mp3 | octopus. Which letter makes the first sound in octopus? | 1 |
| /audio/production/en-US/supplemental/ox-which-one-starts-with-the-same-sound-as-ox-0b0b9afa24.mp3 | ox. Which one starts with the same sound as ox? | 1 |
| /audio/production/en-US/supplemental/otter-which-letter-makes-the-first-sound-in-otter-5028a56a2b.mp3 | otter. Which letter makes the first sound in otter? | 1 |
| /audio/production/en-US/supplemental/olive-which-letter-makes-the-first-sound-in-olive-f7cae1db48.mp3 | olive. Which letter makes the first sound in olive? | 1 |
| /audio/production/en-US/supplemental/octopus-which-one-starts-with-the-same-sound-as-octopus-d89f158a6a.mp3 | octopus. Which one starts with the same sound as octopus? | 1 |
| /audio/production/en-US/supplemental/pig-which-letter-makes-the-first-sound-in-pig-3e9af10cea.mp3 | pig. Which letter makes the first sound in pig? | 1 |
| /audio/production/en-US/supplemental/pen-which-letter-makes-the-first-sound-in-pen-a97314d96e.mp3 | pen. Which letter makes the first sound in pen? | 1 |
| /audio/production/en-US/supplemental/pig-which-one-starts-with-the-same-sound-as-pig-0950b9bcd1.mp3 | pig. Which one starts with the same sound as pig? | 1 |
| /audio/production/en-US/supplemental/penguin-which-letter-makes-the-first-sound-in-penguin-289a96facb.mp3 | penguin. Which letter makes the first sound in penguin? | 1 |
| /audio/production/en-US/supplemental/pumpkin-which-letter-makes-the-first-sound-in-pumpkin-2c0766b6a3.mp3 | pumpkin. Which letter makes the first sound in pumpkin? | 1 |
| /audio/production/en-US/supplemental/pen-which-one-starts-with-the-same-sound-as-pen-b4656b3f3d.mp3 | pen. Which one starts with the same sound as pen? | 1 |
| /audio/production/en-US/supplemental/queen-which-letter-makes-the-first-sound-in-queen-904fa4d08a.mp3 | queen. Which letter makes the first sound in queen? | 1 |
| /audio/production/en-US/supplemental/quilt-which-letter-makes-the-first-sound-in-quilt-f0d18f2a67.mp3 | quilt. Which letter makes the first sound in quilt? | 1 |
| /audio/production/en-US/supplemental/queen-which-one-starts-with-the-same-sound-as-queen-bf887f2107.mp3 | queen. Which one starts with the same sound as queen? | 1 |
| /audio/production/en-US/supplemental/question-which-letter-makes-the-first-sound-in-question-c06c183e7c.mp3 | question. Which letter makes the first sound in question? | 1 |
| /audio/production/en-US/supplemental/quarter-which-letter-makes-the-first-sound-in-quarter-82ba65eb7f.mp3 | quarter. Which letter makes the first sound in quarter? | 1 |
| /audio/production/en-US/supplemental/question-which-one-starts-with-the-same-sound-as-question-16813b7fdb.mp3 | question. Which one starts with the same sound as question? | 1 |
| /audio/production/en-US/supplemental/rug-which-letter-makes-the-first-sound-in-rug-dface3113b.mp3 | rug. Which letter makes the first sound in rug? | 1 |
| /audio/production/en-US/supplemental/ring-which-letter-makes-the-first-sound-in-ring-508c97c67a.mp3 | ring. Which letter makes the first sound in ring? | 1 |
| /audio/production/en-US/supplemental/ring-which-one-starts-with-the-same-sound-as-ring-1d5a028d92.mp3 | ring. Which one starts with the same sound as ring? | 1 |
| /audio/production/en-US/supplemental/rainbow-which-letter-makes-the-first-sound-in-rainbow-427b7531e6.mp3 | rainbow. Which letter makes the first sound in rainbow? | 1 |
| /audio/production/en-US/supplemental/rocket-which-letter-makes-the-first-sound-in-rocket-c6801678c0.mp3 | rocket. Which letter makes the first sound in rocket? | 1 |
| /audio/production/en-US/supplemental/rug-which-one-starts-with-the-same-sound-as-rug-838cd268d5.mp3 | rug. Which one starts with the same sound as rug? | 1 |
| /audio/production/en-US/supplemental/sun-which-letter-makes-the-first-sound-in-sun-ed4502959c.mp3 | sun. Which letter makes the first sound in sun? | 1 |
| /audio/production/en-US/supplemental/sock-which-letter-makes-the-first-sound-in-sock-7be2931951.mp3 | sock. Which letter makes the first sound in sock? | 1 |
| /audio/production/en-US/supplemental/sun-which-one-starts-with-the-same-sound-as-sun-5de1756a58.mp3 | sun. Which one starts with the same sound as sun? | 1 |
| /audio/production/en-US/supplemental/sunflower-which-letter-makes-the-first-sound-in-sunflower-907a04bc96.mp3 | sunflower. Which letter makes the first sound in sunflower? | 1 |
| /audio/production/en-US/supplemental/sandwich-which-letter-makes-the-first-sound-in-sandwich-7a817f496d.mp3 | sandwich. Which letter makes the first sound in sandwich? | 1 |
| /audio/production/en-US/supplemental/sock-which-one-starts-with-the-same-sound-as-sock-697f80979e.mp3 | sock. Which one starts with the same sound as sock? | 1 |
| /audio/production/en-US/supplemental/tent-which-letter-makes-the-first-sound-in-tent-5b38797464.mp3 | tent. Which letter makes the first sound in tent? | 1 |
| /audio/production/en-US/supplemental/toe-which-letter-makes-the-first-sound-in-toe-f8041d2564.mp3 | toe. Which letter makes the first sound in toe? | 1 |
| /audio/production/en-US/supplemental/tent-which-one-starts-with-the-same-sound-as-tent-7e92e9b672.mp3 | tent. Which one starts with the same sound as tent? | 1 |
| /audio/production/en-US/supplemental/tiger-which-letter-makes-the-first-sound-in-tiger-3daf4ca519.mp3 | tiger. Which letter makes the first sound in tiger? | 1 |
| /audio/production/en-US/supplemental/tomato-which-letter-makes-the-first-sound-in-tomato-39c3317f6e.mp3 | tomato. Which letter makes the first sound in tomato? | 1 |
| /audio/production/en-US/supplemental/tooth-which-one-starts-with-the-same-sound-as-tooth-08b0734ac1.mp3 | tooth. Which one starts with the same sound as tooth? | 1 |
| /audio/production/en-US/supplemental/umbrella-which-letter-makes-the-first-sound-in-umbrella-53ef35da52.mp3 | umbrella. Which letter makes the first sound in umbrella? | 1 |
| /audio/production/en-US/supplemental/uncle-which-letter-makes-the-first-sound-in-uncle-ee56e28319.mp3 | uncle. Which letter makes the first sound in uncle? | 1 |
| /audio/production/en-US/supplemental/umbrella-which-one-starts-with-the-same-sound-as-umbrella-c96d13b196.mp3 | umbrella. Which one starts with the same sound as umbrella? | 1 |
| /audio/production/en-US/supplemental/umpire-which-letter-makes-the-first-sound-in-umpire-ad25c3fa03.mp3 | umpire. Which letter makes the first sound in umpire? | 1 |
| /audio/production/en-US/supplemental/uniform-which-letter-makes-the-first-sound-in-uniform-8e94194bd0.mp3 | uniform. Which letter makes the first sound in uniform? | 1 |
| /audio/production/en-US/supplemental/uncle-which-one-starts-with-the-same-sound-as-uncle-bd80ee857d.mp3 | uncle. Which one starts with the same sound as uncle? | 1 |
| /audio/production/en-US/supplemental/van-which-letter-makes-the-first-sound-in-van-0e66e91d22.mp3 | van. Which letter makes the first sound in van? | 1 |
| /audio/production/en-US/supplemental/vet-which-letter-makes-the-first-sound-in-vet-81f7b18758.mp3 | vet. Which letter makes the first sound in vet? | 1 |
| /audio/production/en-US/supplemental/van-which-one-starts-with-the-same-sound-as-van-9f5fc36207.mp3 | van. Which one starts with the same sound as van? | 1 |
| /audio/production/en-US/supplemental/volcano-which-letter-makes-the-first-sound-in-volcano-61a5d15531.mp3 | volcano. Which letter makes the first sound in volcano? | 1 |
| /audio/production/en-US/supplemental/vulture-which-letter-makes-the-first-sound-in-vulture-7655945ab6.mp3 | vulture. Which letter makes the first sound in vulture? | 1 |
| /audio/production/en-US/supplemental/vet-which-one-starts-with-the-same-sound-as-vet-f294a8df42.mp3 | vet. Which one starts with the same sound as vet? | 1 |
| /audio/production/en-US/supplemental/web-which-letter-makes-the-first-sound-in-web-6329316f9b.mp3 | web. Which letter makes the first sound in web? | 1 |
| /audio/production/en-US/supplemental/worm-which-letter-makes-the-first-sound-in-worm-722a3b8ae8.mp3 | worm. Which letter makes the first sound in worm? | 1 |
| /audio/production/en-US/supplemental/web-which-one-starts-with-the-same-sound-as-web-0e2245d7cd.mp3 | web. Which one starts with the same sound as web? | 1 |
| /audio/production/en-US/supplemental/watermelon-which-letter-makes-the-first-sound-in-watermelon-b2c29c66c1.mp3 | watermelon. Which letter makes the first sound in watermelon? | 1 |
| /audio/production/en-US/supplemental/window-which-letter-makes-the-first-sound-in-window-8287fd327a.mp3 | window. Which letter makes the first sound in window? | 1 |
| /audio/production/en-US/supplemental/wasp-which-one-starts-with-the-same-sound-as-wasp-c0a0616a96.mp3 | wasp. Which one starts with the same sound as wasp? | 1 |
| /audio/production/en-US/supplemental/yak-which-letter-makes-the-first-sound-in-yak-cf6da7e2c8.mp3 | yak. Which letter makes the first sound in yak? | 1 |
| /audio/production/en-US/supplemental/yarn-which-letter-makes-the-first-sound-in-yarn-bdb9897744.mp3 | yarn. Which letter makes the first sound in yarn? | 1 |
| /audio/production/en-US/supplemental/yak-which-one-starts-with-the-same-sound-as-yak-dd9bd96eba.mp3 | yak. Which one starts with the same sound as yak? | 1 |
| /audio/production/en-US/supplemental/yoghurt-which-letter-makes-the-first-sound-in-yoghurt-f151ac2e2b.mp3 | yoghurt. Which letter makes the first sound in yoghurt? | 1 |
| /audio/production/en-US/supplemental/yawn-which-letter-makes-the-first-sound-in-yawn-255adf2a81.mp3 | yawn. Which letter makes the first sound in yawn? | 1 |
| /audio/production/en-US/supplemental/yarn-which-one-starts-with-the-same-sound-as-yarn-75fb25b6b8.mp3 | yarn. Which one starts with the same sound as yarn? | 1 |
| /audio/production/en-US/supplemental/zip-which-letter-makes-the-first-sound-in-zip-8b4aa8436e.mp3 | zip. Which letter makes the first sound in zip? | 1 |
| /audio/production/en-US/supplemental/zoo-which-letter-makes-the-first-sound-in-zoo-10fd7b966c.mp3 | zoo. Which letter makes the first sound in zoo? | 1 |
| /audio/production/en-US/supplemental/zip-which-one-starts-with-the-same-sound-as-zip-9f32b922e3.mp3 | zip. Which one starts with the same sound as zip? | 1 |
| /audio/production/en-US/supplemental/zebra-which-letter-makes-the-first-sound-in-zebra-c962ff0408.mp3 | zebra. Which letter makes the first sound in zebra? | 1 |
| /audio/production/en-US/supplemental/zigzag-which-letter-makes-the-first-sound-in-zigzag-6d095d2034.mp3 | zigzag. Which letter makes the first sound in zigzag? | 1 |
| /audio/production/en-US/supplemental/zoo-which-one-starts-with-the-same-sound-as-zoo-5b19929b42.mp3 | zoo. Which one starts with the same sound as zoo? | 1 |
| /audio/production/en-US/supplemental/ambulance-which-letter-makes-the-first-sound-in-ambulance-f9e3a31ff7.mp3 | ambulance. Which letter makes the first sound in ambulance? | 1 |
| /audio/production/en-US/supplemental/engine-which-letter-makes-the-first-sound-in-engine-98d31fb1b3.mp3 | engine. Which letter makes the first sound in engine? | 1 |
| /audio/production/en-US/supplemental/mat-which-letter-makes-the-first-sound-in-mat-3402aa326c.mp3 | mat. Which letter makes the first sound in mat? | 1 |
| /audio/production/en-US/supplemental/sandcastle-which-letter-makes-the-first-sound-in-sandcastle-2cfcc7fb9a.mp3 | sandcastle. Which letter makes the first sound in sandcastle? | 1 |
| /audio/production/en-US/supplemental/table-which-letter-makes-the-first-sound-in-table-1c461cb3d0.mp3 | table. Which letter makes the first sound in table? | 1 |
| /audio/production/en-US/supplemental/bike-which-one-starts-with-the-same-sound-as-bike-af31f43cbf.mp3 | bike. Which one starts with the same sound as bike? | 1 |
| /audio/production/en-US/supplemental/nose-which-one-starts-with-the-same-sound-as-nose-7b7c3890ed.mp3 | nose. Which one starts with the same sound as nose? | 1 |
| /audio/production/en-US/supplemental/rose-which-one-starts-with-the-same-sound-as-rose-13e47e9a4e.mp3 | rose. Which one starts with the same sound as rose? | 1 |
| /audio/production/en-US/supplemental/wheel-which-one-starts-with-the-same-sound-as-wheel-d829437b4b.mp3 | wheel. Which one starts with the same sound as wheel? | 1 |
| /audio/production/en-US/supplemental/cake-which-pattern-finishes-the-word-cake-0a7564dc3d.mp3 | cake. Which pattern finishes the word cake? | 1 |
| /audio/production/en-US/supplemental/gate-which-pattern-finishes-the-word-gate-b2e937429e.mp3 | gate. Which pattern finishes the word gate? | 1 |
| /audio/production/en-US/supplemental/snake-which-pattern-finishes-the-word-snake-38f940f421.mp3 | snake. Which pattern finishes the word snake? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-cap-what-word-do-you-make-2674a58d64.mp3 | Add e to the end of cap. What word do you make? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-tap-what-word-do-you-make-d1a8e6be0f.mp3 | Add e to the end of tap. What word do you make? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-man-what-word-do-you-make-2867d175ad.mp3 | Add e to the end of man. What word do you make? | 1 |
| /audio/production/en-US/supplemental/kite-which-pattern-finishes-the-word-kite-5f08a50df4.mp3 | kite. Which pattern finishes the word kite? | 1 |
| /audio/production/en-US/supplemental/five-which-pattern-finishes-the-word-five-aa56bbe53f.mp3 | five. Which pattern finishes the word five? | 1 |
| /audio/production/en-US/supplemental/smile-which-pattern-finishes-the-word-smile-8fe8e4bddd.mp3 | smile. Which pattern finishes the word smile? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-kit-what-word-do-you-make-8d49790b31.mp3 | Add e to the end of kit. What word do you make? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-pin-what-word-do-you-make-664f1b3ed8.mp3 | Add e to the end of pin. What word do you make? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-rid-what-word-do-you-make-f53f3f393c.mp3 | Add e to the end of rid. What word do you make? | 1 |
| /audio/production/en-US/supplemental/bone-which-pattern-finishes-the-word-bone-c8dc188257.mp3 | bone. Which pattern finishes the word bone? | 1 |
| /audio/production/en-US/supplemental/rope-which-pattern-finishes-the-word-rope-f1ad9b10aa.mp3 | rope. Which pattern finishes the word rope? | 1 |
| /audio/production/en-US/supplemental/rose-which-pattern-finishes-the-word-rose-7ba1e7d9dd.mp3 | rose. Which pattern finishes the word rose? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-hop-what-word-do-you-make-98cdd79c8f.mp3 | Add e to the end of hop. What word do you make? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-not-what-word-do-you-make-e92784398d.mp3 | Add e to the end of not. What word do you make? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-rob-what-word-do-you-make-347cdf0ae4.mp3 | Add e to the end of rob. What word do you make? | 1 |
| /audio/production/en-US/supplemental/cube-which-pattern-finishes-the-word-cube-4df806d8a2.mp3 | cube. Which pattern finishes the word cube? | 1 |
| /audio/production/en-US/supplemental/mule-which-pattern-finishes-the-word-mule-6d69d230bb.mp3 | mule. Which pattern finishes the word mule? | 1 |
| /audio/production/en-US/supplemental/tube-which-pattern-finishes-the-word-tube-b8c6a18006.mp3 | tube. Which pattern finishes the word tube? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-cub-what-word-do-you-make-82a72350d4.mp3 | Add e to the end of cub. What word do you make? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-cut-what-word-do-you-make-f6a79d017b.mp3 | Add e to the end of cut. What word do you make? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-tub-what-word-do-you-make-b304b4f2ce.mp3 | Add e to the end of tub. What word do you make? | 1 |
| /audio/production/en-US/supplemental/theme-which-pattern-finishes-the-word-theme-9a4ca8b65e.mp3 | theme. Which pattern finishes the word theme? | 1 |
| /audio/production/en-US/supplemental/scene-which-pattern-finishes-the-word-scene-be5943ebe8.mp3 | scene. Which pattern finishes the word scene? | 1 |
| /audio/production/en-US/supplemental/these-which-pattern-finishes-the-word-these-fe0f829a14.mp3 | these. Which pattern finishes the word these? | 1 |
| /audio/production/en-US/supplemental/complete-which-pattern-finishes-the-word-complete-ce801a37e2.mp3 | complete. Which pattern finishes the word complete? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-long-a-sound-the-a-that-says-its-own-name-b9c46dcb2c.mp3 | Which word has the long a sound, the a that says its own name? | 3 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-tape-what-word-is-left-e4b513500a.mp3 | Take the silent e away from tape. What word is left? | 1 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-made-what-word-is-left-45defde149.mp3 | Take the silent e away from made. What word is left? | 1 |
| /audio/production/en-US/supplemental/plane-which-pattern-finishes-the-word-plane-d39894ac34.mp3 | plane. Which pattern finishes the word plane? | 1 |
| /audio/production/en-US/supplemental/grape-which-pattern-finishes-the-word-grape-a45ac53460.mp3 | grape. Which pattern finishes the word grape? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-long-i-sound-the-i-that-says-its-own-name-1d7a2c4027.mp3 | Which word has the long i sound, the i that says its own name? | 3 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-bite-what-word-is-left-f00c426ce4.mp3 | Take the silent e away from bite. What word is left? | 1 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-ripe-what-word-is-left-65db1ce098.mp3 | Take the silent e away from ripe. What word is left? | 1 |
| /audio/production/en-US/supplemental/prize-which-pattern-finishes-the-word-prize-5e5900380a.mp3 | prize. Which pattern finishes the word prize? | 1 |
| /audio/production/en-US/supplemental/slide-which-pattern-finishes-the-word-slide-4a954cf6c3.mp3 | slide. Which pattern finishes the word slide? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-long-o-sound-the-o-that-says-its-own-name-12b6c8ca5f.mp3 | Which word has the long o sound, the o that says its own name? | 3 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-hope-what-word-is-left-d835b22b5d.mp3 | Take the silent e away from hope. What word is left? | 1 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-robe-what-word-is-left-54c04b758b.mp3 | Take the silent e away from robe. What word is left? | 1 |
| /audio/production/en-US/supplemental/cone-which-pattern-finishes-the-word-cone-cdb76aefe2.mp3 | Cone. Which pattern finishes the word cone? | 1 |
| /audio/production/en-US/supplemental/note-which-pattern-finishes-the-word-note-59ceeab707.mp3 | note. Which pattern finishes the word note? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-long-u-sound-the-u-that-says-its-own-name-60c6ba30cc.mp3 | Which word has the long u sound, the u that says its own name? | 3 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-cube-what-word-is-left-c0ac96dbc6.mp3 | Take the silent e away from cube. What word is left? | 1 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-cute-what-word-is-left-02be8249b5.mp3 | Take the silent e away from cute. What word is left? | 1 |
| /audio/production/en-US/supplemental/flute-which-pattern-finishes-the-word-flute-266f1f01c6.mp3 | flute. Which pattern finishes the word flute? | 1 |
| /audio/production/en-US/supplemental/huge-which-pattern-finishes-the-word-huge-9b361e0812.mp3 | huge. Which pattern finishes the word huge? | 1 |
| /audio/production/en-US/supplemental/lake-which-pattern-finishes-the-word-lake-60f4e85ddc.mp3 | lake. Which pattern finishes the word lake? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-pan-what-word-do-you-make-0665fc050f.mp3 | Add e to the end of pan. What word do you make? | 1 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-cane-what-word-is-left-de0a6ec712.mp3 | Take the silent e away from cane. What word is left? | 1 |
| /audio/production/en-US/supplemental/bike-which-pattern-finishes-the-word-bike-dc5933e85d.mp3 | bike. Which pattern finishes the word bike? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-fin-what-word-do-you-make-b1a9338920.mp3 | Add e to the end of fin. What word do you make? | 1 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-hide-what-word-is-left-24b407f0a1.mp3 | Take the silent e away from hide. What word is left? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-rod-what-word-do-you-make-aff2cd71a3.mp3 | Add e to the end of rod. What word do you make? | 1 |
| /audio/production/en-US/supplemental/home-which-pattern-finishes-the-word-home-675fda6297.mp3 | home. Which pattern finishes the word home? | 1 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-rode-what-word-is-left-f408b9e867.mp3 | Take the silent e away from rode. What word is left? | 1 |
| /audio/production/en-US/supplemental/add-e-to-the-end-of-hug-what-word-do-you-make-8f5eba5d21.mp3 | Add e to the end of hug. What word do you make? | 1 |
| /audio/production/en-US/supplemental/cute-which-pattern-finishes-the-word-cute-23cdc5d76f.mp3 | cute. Which pattern finishes the word cute? | 1 |
| /audio/production/en-US/supplemental/take-the-silent-e-away-from-tube-what-word-is-left-a9d6cbd9c3.mp3 | Take the silent e away from tube. What word is left? | 1 |
| /audio/production/en-US/supplemental/which-one-shows-a-person-e2f12c0f06.mp3 | Which one shows a person? | 4 |
| /audio/production/en-US/supplemental/which-word-names-a-person-69d693ebc0.mp3 | Which word names a person? | 4 |
| /audio/production/en-US/supplemental/which-one-shows-an-animal-66fa0f1dca.mp3 | Which one shows an animal? | 4 |
| /audio/production/en-US/assessment_prompt/which-word-names-an-animal-c868b5ef31.mp3 | Which word names an animal? | 4 |
| /audio/production/en-US/supplemental/which-one-shows-a-place-0ebbbfce31.mp3 | Which one shows a place? | 3 |
| /audio/production/en-US/supplemental/which-word-names-a-place-6ad743fb63.mp3 | Which word names a place? | 4 |
| /audio/production/en-US/supplemental/which-one-shows-a-thing-you-can-hold-5b6731383a.mp3 | Which one shows a thing you can hold? | 3 |
| /audio/production/en-US/supplemental/which-word-names-a-thing-08f065e085.mp3 | Which word names a thing? | 4 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-the-sailed-into-the-bay-7eb4f1d1a8.mp3 | Which naming word finishes the sentence? The … sailed into the bay. | 1 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-a-buzzed-by-my-ear-857023486b.mp3 | Which naming word finishes the sentence? A … buzzed by my ear. | 1 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-the-dripped-on-the-rug-6d50b4e017.mp3 | Which naming word finishes the sentence? The … dripped on the rug. | 1 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-our-creaks-in-the-wind-19894c525c.mp3 | Which naming word finishes the sentence? Our … creaks in the wind. | 1 |
| /audio/production/en-US/supplemental/which-word-in-this-sentence-is-a-naming-word-the-kite-dipped-and-spun-d23bb276cc.mp3 | Which word in this sentence is a naming word? "The kite dipped and spun." | 1 |
| /audio/production/en-US/supplemental/which-word-in-this-sentence-is-a-naming-word-my-boots-got-soaked-8bacdffb3a.mp3 | Which word in this sentence is a naming word? "My boots got soaked." | 1 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-the-hooted-all-night-long-7fca3a384d.mp3 | Which naming word finishes the sentence? The … hooted all night long. | 1 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-a-rolled-off-the-shelf-674bc5d727.mp3 | Which naming word finishes the sentence? A … rolled off the shelf. | 1 |
| /audio/production/en-US/supplemental/which-word-names-a-thing-not-a-doing-word-660b05b2af.mp3 | Which word names a thing, not a doing word? | 6 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-the-sang-to-the-crowd-a027cf6ea0.mp3 | Which naming word finishes the sentence? The … sang to the crowd. | 1 |
| /audio/production/en-US/supplemental/which-word-is-a-doing-word-not-a-naming-word-fd2cabebc4.mp3 | Which word is a doing word, not a naming word? | 9 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-our-reads-to-us-after-lunch-b480594463.mp3 | Which naming word finishes the sentence? Our … reads to us after lunch. | 1 |
| /audio/production/en-US/supplemental/which-sentence-names-two-things-5e74442e57.mp3 | Which sentence names TWO things? | 8 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-the-cat-and-the-hid-in-the-barn-a00c1ed0b5.mp3 | Which naming word finishes the sentence? The cat and the … hid in the barn. | 1 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-a-fork-and-a-sat-by-the-plate-74b16e5623.mp3 | Which naming word finishes the sentence? A fork and a … sat by the plate. | 1 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-the-chimed-at-noon-a2431282f6.mp3 | Which naming word finishes the sentence? The … chimed at noon. | 1 |
| /audio/production/en-US/supplemental/which-naming-word-finishes-the-sentence-a-nested-in-our-chimney-a0e976a271.mp3 | Which naming word finishes the sentence? A … nested in our chimney. | 1 |
| /audio/production/en-US/supplemental/which-word-tells-what-you-see-9d0116dae9.mp3 | Which word tells what you see? | 3 |
| /audio/production/en-US/supplemental/pick-the-word-that-fits-the-picture-363940d1e1.mp3 | Pick the word that fits the picture. | 1 |
| /audio/production/en-US/supplemental/what-does-the-picture-show-7b1b8b18cf.mp3 | What does the picture show? | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-picture-fce4883120.mp3 | Which word fits the picture? | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-two-sat-on-the-wall-baad2d4cfb.mp3 | Which word finishes the sentence? Two … sat on the wall. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-three-wag-their-tails-269904e3f2.mp3 | Which word finishes the sentence? The three … wag their tails. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-both-lay-open-on-the-desk-79246a2a55.mp3 | Which word finishes the sentence? Both … lay open on the desk. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-six-shine-over-the-barn-7a42f5cb4a.mp3 | Which word finishes the sentence? Six … shine over the barn. | 1 |
| /audio/production/en-US/supplemental/just-one-which-word-fits-4579f5565e.mp3 | Just one! Which word fits? | 1 |
| /audio/production/en-US/supplemental/more-than-one-which-word-fits-504fb556aa.mp3 | More than one! Which word fits? | 1 |
| /audio/production/en-US/supplemental/more-than-one-pick-the-word-782e140fc8.mp3 | More than one! Pick the word. | 1 |
| /audio/production/en-US/supplemental/just-one-pick-the-word-f6a6fab057.mp3 | Just one! Pick the word. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-i-see-one-by-the-door-cd0e7e3f8e.mp3 | Which word finishes the sentence? I see one … by the door. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-many-twinkle-at-night-e2084acc95.mp3 | Which word finishes the sentence? Many … twinkle at night. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-one-quacks-as-it-floats-on-the-pond-0b5dbc97e1.mp3 | Which word finishes the sentence? One … quacks as it floats on the pond. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-lots-of-hop-in-the-grass-fba50c0a1b.mp3 | Which word finishes the sentence? Lots of … hop in the grass. | 1 |
| /audio/production/en-US/supplemental/pick-the-word-for-the-picture-0876086dff.mp3 | Pick the word for the picture. | 2 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-packed-six-for-the-trip-17cb6391d0.mp3 | Which word finishes the sentence? We packed six … for the trip. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-from-dinner-included-plates-and-bow-a343794c67.mp3 | Which word finishes the sentence? The … from dinner included plates and bowls. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-three-chugged-up-the-hill-6381049a87.mp3 | Which word finishes the sentence? Three … chugged up the hill. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-scrubbed-the-mud-off-our-boots-5097adb355.mp3 | Which word finishes the sentence? The … scrubbed the mud off our boots. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-two-red-hid-in-the-den-e9eb6fef23.mp3 | Which word finishes the sentence? Two red … hid in the den. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-newborn-giggled-in-their-cots-6f2042e4f8.mp3 | Which word finishes the sentence? The newborn … giggled in their cots. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-three-planned-the-fair-828736492d.mp3 | Which word finishes the sentence? Three … planned the fair. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-we-hung-balloons-for-both-birthday-6fa4902c3b.mp3 | Which word finishes the sentence? We hung balloons for both birthday …. | 1 |
| /audio/production/en-US/supplemental/one-word-is-written-wrong-spot-it-the-babys-slept-in-their-cots-3289b3a72c.mp3 | One word is written wrong. Spot it: The babys slept in their cots. | 1 |
| /audio/production/en-US/supplemental/one-word-is-written-wrong-spot-it-two-citys-glow-at-night-7363c309b5.mp3 | One word is written wrong. Spot it: Two citys glow at night. | 1 |
| /audio/production/en-US/supplemental/which-is-the-plural-of-pony-48b9083e67.mp3 | Which is the plural of pony? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-marched-in-the-band-186e92159e.mp3 | Which word finishes the sentence? The … marched in the band. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-both-six-year-old-lost-a-milk-tooth-tod-890873bb3e.mp3 | Which word finishes the sentence? Both six-year-old … lost a milk tooth today. | 1 |
| /audio/production/en-US/supplemental/one-word-is-written-wrong-spot-it-the-mouses-hid-in-the-kitchen-8c9b4e86ac.mp3 | One word is written wrong. Spot it: The mouses hid in the kitchen. | 1 |
| /audio/production/en-US/supplemental/one-word-is-written-wrong-spot-it-both-foots-splashed-in-the-puddle-0ec946e61a.mp3 | One word is written wrong. Spot it: Both foots splashed in the puddle. | 1 |
| /audio/production/en-US/supplemental/which-is-the-plural-of-child-c5ef81a612.mp3 | Which is the plural of child? | 1 |
| /audio/production/en-US/supplemental/which-is-the-plural-of-foot-64cbb62e4c.mp3 | Which is the plural of foot? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-autumn-blew-across-the-path-a2907e6710.mp3 | Which word finishes the sentence? Autumn … blew across the path. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-howled-on-the-hill-e0431d9730.mp3 | Which word finishes the sentence? The … howled on the hill. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-chef-laid-five-by-the-plates-d553ec73e9.mp3 | Which word finishes the sentence? The chef laid five … by the plates. | 1 |
| /audio/production/en-US/supplemental/one-word-is-written-wrong-spot-it-the-leafs-drifted-onto-the-doorstep-f87b256c89.mp3 | One word is written wrong. Spot it: The leafs drifted onto the doorstep. | 1 |
| /audio/production/en-US/supplemental/one-word-is-written-wrong-spot-it-wolfs-howled-outside-the-window-cb784103e8.mp3 | One word is written wrong. Spot it: Wolfs howled outside the window. | 1 |
| /audio/production/en-US/supplemental/which-is-the-plural-of-leaf-d999497cba.mp3 | Which is the plural of leaf? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-all-the-newborn-slept-in-the-dog-bed-d6918f9299.mp3 | Which word finishes the sentence? All the newborn … slept in the dog bed. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-one-was-left-on-the-plate-7853e60091.mp3 | Which word finishes the sentence? One … was left on the plate. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-two-of-bread-sat-in-the-basket-b84e973bd0.mp3 | Which word finishes the sentence? Two … of bread sat in the basket. | 1 |
| /audio/production/en-US/supplemental/one-word-is-written-wrong-spot-it-three-sheeps-grazed-in-the-meadow-0652fc06e2.mp3 | One word is written wrong. Spot it: Three sheeps grazed in the meadow. | 1 |
| /audio/production/en-US/supplemental/which-fits-the-are-ripe-72dac1ee34.mp3 | Which fits: The … are ripe? | 1 |
| /audio/production/en-US/supplemental/which-fits-one-is-barking-363d596408.mp3 | Which fits: One … is barking? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-ten-bark-at-the-gate-3c7156a9ed.mp3 | Which word finishes the sentence? Ten … bark at the gate. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-four-played-near-the-barn-38a75d0806.mp3 | Which word finishes the sentence? Four … played near the barn. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-just-one-purred-by-the-fire-6d50fda910.mp3 | Which word finishes the sentence? Just one … purred by the fire. | 1 |
| /audio/production/en-US/supplemental/more-than-one-which-word-c3cbf053c0.mp3 | More than one! Which word? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-both-told-long-stories-4ba1493eda.mp3 | Which word finishes the sentence? Both … told long stories. | 1 |
| /audio/production/en-US/supplemental/one-word-is-written-wrong-spot-it-the-ponys-trotted-around-the-field-8a174b10ef.mp3 | One word is written wrong. Spot it: The ponys trotted around the field. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-two-white-squeaked-and-nibbled-the-chee-dd9729975c.mp3 | Which word finishes the sentence? Two white … squeaked and nibbled the cheese. | 1 |
| /audio/production/en-US/supplemental/which-is-the-plural-of-tooth-fad0f669db.mp3 | Which is the plural of tooth? | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-the-baker-sliced-two-for-lunch-b60feb78c0.mp3 | Which word finishes the sentence? The baker sliced two … for lunch. | 1 |
| /audio/production/en-US/supplemental/which-word-finishes-the-sentence-all-four-chirped-at-dawn-57166d5bd8.mp3 | Which word finishes the sentence? All four … chirped at dawn. | 1 |
| /audio/production/en-US/supplemental/which-word-means-not-happy-00fd20e027.mp3 | Which word means not happy? | 1 |
| /audio/production/en-US/supplemental/which-word-means-not-fair-63640a0628.mp3 | Which word means not fair? | 1 |
| /audio/production/en-US/supplemental/which-word-means-not-kind-38cf3ca364.mp3 | Which word means not kind? | 1 |
| /audio/production/en-US/supplemental/mia-feels-sad-which-word-also-means-not-happy-00c37bba1e.mp3 | Mia feels sad. Which word also means not happy? | 1 |
| /audio/production/en-US/supplemental/the-game-is-not-fair-which-word-means-not-fair-0fe4e673a7.mp3 | The game is not fair. Which word means not fair? | 1 |
| /audio/production/en-US/supplemental/the-words-were-not-kind-which-word-means-not-kind-7d70c45697.mp3 | The words were not kind. Which word means not kind? | 1 |
| /audio/production/en-US/supplemental/which-word-means-play-again-b61430901d.mp3 | Which word means play again? | 1 |
| /audio/production/en-US/supplemental/which-word-means-make-again-226b908743.mp3 | Which word means make again? | 1 |
| /audio/production/en-US/supplemental/which-word-means-read-again-18a8ddb8fd.mp3 | Which word means read again? | 1 |
| /audio/production/en-US/supplemental/the-picture-went-wrong-i-will-make-it-again-which-word-fits-3616d6e16e.mp3 | The picture went wrong. I will make it again. Which word fits? | 1 |
| /audio/production/en-US/supplemental/i-missed-the-page-i-will-read-it-again-which-word-fits-a67b5b8758.mp3 | I missed the page. I will read it again. Which word fits? | 1 |
| /audio/production/en-US/supplemental/we-loved-the-song-we-will-play-it-again-which-word-fits-533b9dedb6.mp3 | We loved the song. We will play it again. Which word fits? | 1 |
| /audio/production/en-US/supplemental/which-word-means-ready-to-help-6841ccead8.mp3 | Which word means ready to help? | 1 |
| /audio/production/en-US/supplemental/which-word-means-full-of-joy-b9aa6e6f6e.mp3 | Which word means full of joy? | 1 |
| /audio/production/en-US/supplemental/which-word-means-using-care-5186de0e67.mp3 | Which word means using care? | 1 |
| /audio/production/en-US/supplemental/ava-helps-her-friend-which-word-describes-ava-59e74c6fbc.mp3 | Ava helps her friend. Which word describes Ava? | 1 |
| /audio/production/en-US/supplemental/noah-smiles-with-joy-which-word-describes-noah-549e7aa48c.mp3 | Noah smiles with joy. Which word describes Noah? | 1 |
| /audio/production/en-US/supplemental/kim-carries-the-glass-slowly-which-word-describes-kim-240287dfdc.mp3 | Kim carries the glass slowly. Which word describes Kim? | 1 |
| /audio/production/en-US/supplemental/which-word-means-without-hope-adbeb2348f.mp3 | Which word means without hope? | 1 |
| /audio/production/en-US/supplemental/which-word-means-without-fear-a9c8c68cad.mp3 | Which word means without fear? | 1 |
| /audio/production/en-US/supplemental/which-word-means-without-harm-16250da953.mp3 | Which word means without harm? | 1 |
| /audio/production/en-US/supplemental/the-tiny-butterfly-cannot-hurt-you-which-word-describes-it-fde7386e12.mp3 | The tiny butterfly cannot hurt you. Which word describes it? | 1 |
| /audio/production/en-US/supplemental/leo-is-not-afraid-to-try-which-word-describes-leo-7c7a42d5b7.mp3 | Leo is not afraid to try. Which word describes Leo? | 1 |
| /audio/production/en-US/supplemental/the-team-thinks-it-cannot-win-which-word-describes-the-team-e2babc9bf2.mp3 | The team thinks it cannot win. Which word describes the team? | 1 |
| /audio/production/en-US/supplemental/a-person-who-sings-is-a-eff39ae543.mp3 | A person who sings is a… | 1 |
| /audio/production/en-US/supplemental/a-person-who-teaches-is-a-17763a43ba.mp3 | A person who teaches is a… | 1 |
| /audio/production/en-US/supplemental/a-person-who-helps-is-a-a142ff1926.mp3 | A person who helps is a… | 1 |
| /audio/production/en-US/supplemental/who-reads-books-to-the-class-1694506240.mp3 | Who reads books to the class? | 1 |
| /audio/production/en-US/supplemental/who-paints-a-picture-2bb1370ff6.mp3 | Who paints a picture? | 1 |
| /audio/production/en-US/supplemental/who-works-on-a-farm-1e67199c6e.mp3 | Who works on a farm? | 1 |
| /audio/production/en-US/supplemental/add-s-to-hen-45ef7049c6.mp3 | Add -s to hen. | 1 |
| /audio/production/en-US/supplemental/add-es-to-fox-214fd70226.mp3 | Add -es to fox. | 1 |
| /audio/production/en-US/supplemental/add-s-to-cup-1ee57ddd50.mp3 | Add -s to cup. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-every-day-dad-the-car-2b42a094f2.mp3 | Which word fits? Every day, Dad … the car. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-my-cat-on-the-mat-each-day-f1cd4c86b6.mp3 | Which word fits? My cat … on the mat each day. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-gran-bread-every-sunday-436c742a5e.mp3 | Which word fits? Gran … bread every Sunday. | 1 |
| /audio/production/en-US/supplemental/add-ing-to-jump-0e497978cd.mp3 | Add -ing to jump. | 1 |
| /audio/production/en-US/supplemental/add-ing-to-read-d6d99cbd09.mp3 | Add -ing to read. | 1 |
| /audio/production/en-US/supplemental/add-ing-to-play-fbfa523ce8.mp3 | Add -ing to play. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-right-now-the-pot-is-on-the-stove-eaa1977828.mp3 | Which word fits? Right now, the pot is … on the stove. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-we-are-a-sandcastle-today-55ef0c58bc.mp3 | Which word fits? We are … a sandcastle today. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-keep-the-finish-line-is-close-32ab8738df.mp3 | Which word fits? Keep …! The finish line is close. | 1 |
| /audio/production/en-US/supplemental/add-ed-to-walk-0c8dd7a5a0.mp3 | Add -ed to walk. | 1 |
| /audio/production/en-US/supplemental/add-ed-to-help-184a500cec.mp3 | Add -ed to help. | 1 |
| /audio/production/en-US/supplemental/add-ed-to-jump-008d31c407.mp3 | Add -ed to jump. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-yesterday-we-to-the-park-8f57cf609b.mp3 | Which word fits? Yesterday we … to the park. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-last-night-the-baby-for-hours-0201dbbb4e.mp3 | Which word fits? Last night, the baby … for hours. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-we-the-door-before-bed-4ea9e5265f.mp3 | Which word fits? We … the door before bed. | 1 |
| /audio/production/en-US/supplemental/add-est-to-tall-9e0ce894f8.mp3 | Add -est to tall. | 1 |
| /audio/production/en-US/supplemental/add-er-to-fast-c6f9e87d90.mp3 | Add -er to fast. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-ben-is-tall-but-ana-is-even-a6a5663e61.mp3 | Which word fits? Ben is tall, but Ana is even …. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-of-all-three-dogs-rex-is-the-99551ba035.mp3 | Which word fits? Of all three dogs, Rex is the …. | 1 |
| /audio/production/en-US/supplemental/which-word-compares-two-tall-things-a1086af85b.mp3 | Which word compares two tall things? | 1 |
| /audio/production/en-US/supplemental/which-word-picks-the-slow-one-from-every-snail-b63e0c4be2.mp3 | Which word picks the slow one from every snail? | 1 |
| /audio/production/en-US/supplemental/add-ly-to-quick-bff74fe1a9.mp3 | Add -ly to quick. | 1 |
| /audio/production/en-US/supplemental/add-ly-to-soft-b6f8395289.mp3 | Add -ly to soft. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-set-the-eggs-down-with-no-bumps-8660d6ed1d.mp3 | Which word fits? Set the eggs down …, with no bumps. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-mouse-crept-past-the-cat-eab9f13f3a.mp3 | Which word fits? The mouse crept … past the cat. | 1 |
| /audio/production/en-US/supplemental/what-does-bravely-mean-6a71b87dc8.mp3 | What does bravely mean? | 1 |
| /audio/production/en-US/supplemental/what-does-proudly-mean-51eaf42023.mp3 | What does proudly mean? | 1 |
| /audio/production/en-US/supplemental/add-pre-to-heat-a754ce2ac5.mp3 | Add pre- to heat. | 1 |
| /audio/production/en-US/supplemental/add-pre-to-view-c622fa65b7.mp3 | Add pre- to view. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-the-oven-before-you-mix-the-batter-36c46fb0d1.mp3 | Which word fits? … the oven before you mix the batter. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-we-watched-a-before-the-film-opened-bd5a0f88a9.mp3 | Which word fits? We watched a … before the film opened. | 1 |
| /audio/production/en-US/supplemental/what-is-a-pretest-596f635eb6.mp3 | What is a pretest? | 1 |
| /audio/production/en-US/supplemental/what-does-preorder-mean-c77f1f0760.mp3 | What does preorder mean? | 1 |
| /audio/production/en-US/supplemental/which-word-means-not-safe-b753833e05.mp3 | Which word means not safe? | 1 |
| /audio/production/en-US/supplemental/which-word-means-paint-again-b78252d75a.mp3 | Which word means paint again? | 1 |
| /audio/production/en-US/supplemental/which-word-means-full-of-hope-b9933ec8f8.mp3 | Which word means full of hope? | 1 |
| /audio/production/en-US/supplemental/which-word-means-without-care-d5f82ec105.mp3 | Which word means without care? | 1 |
| /audio/production/en-US/supplemental/a-person-who-bakes-is-a-aaa52385a9.mp3 | A person who bakes is a… | 1 |
| /audio/production/en-US/supplemental/the-block-tower-fell-which-word-means-build-again-0b75946f55.mp3 | The block tower fell. Which word means build again? | 1 |
| /audio/production/en-US/supplemental/add-es-to-bus-dfde1c2494.mp3 | Add -es to bus. | 1 |
| /audio/production/en-US/supplemental/add-ing-to-cook-03974d8ca6.mp3 | Add -ing to cook. | 1 |
| /audio/production/en-US/supplemental/add-ed-to-play-30f62842fa.mp3 | Add -ed to play. | 1 |
| /audio/production/en-US/supplemental/which-word-fits-sam-is-quick-but-ali-is-even-d9d0293102.mp3 | Which word fits? Sam is quick, but Ali is even …. | 1 |
| /audio/production/en-US/supplemental/add-ly-to-brave-1dcb1c48b6.mp3 | Add -ly to brave. | 1 |
| /audio/production/en-US/supplemental/add-pre-to-school-87607f4b61.mp3 | Add pre- to school. | 1 |
| /audio/production/en-US/assessment_prompt/where-is-the-cat-a06cf94083.mp3 | Where is the cat? | 1 |
| /audio/production/en-US/supplemental/where-is-the-goat-1e210ea857.mp3 | Where is the goat? | 1 |
| /audio/production/en-US/supplemental/the-cat-is-the-box-d682ad00fd.mp3 | The cat is … the box. | 1 |
| /audio/production/en-US/supplemental/the-goat-is-the-barn-9e19a24d5d.mp3 | The goat is … the barn. | 1 |
| /audio/production/en-US/assessment_prompt/where-is-the-ball-ac2635de39.mp3 | Where is the ball? | 1 |
| /audio/production/en-US/supplemental/where-is-the-snow-507279367f.mp3 | Where is the snow? | 1 |
| /audio/production/en-US/supplemental/the-ball-is-the-chair-4ca45d6d0f.mp3 | The ball is … the chair. | 1 |
| /audio/production/en-US/supplemental/the-snow-is-the-roof-9cef680b09.mp3 | The snow is … the roof. | 1 |
| /audio/production/en-US/assessment_prompt/where-is-the-dog-9624e77b0a.mp3 | Where is the dog? | 1 |
| /audio/production/en-US/supplemental/where-are-the-slippers-ba677a60ee.mp3 | Where are the slippers? | 1 |
| /audio/production/en-US/supplemental/the-dog-is-the-table-e8e398a213.mp3 | The dog is … the table. | 1 |
| /audio/production/en-US/supplemental/the-slippers-are-the-bed-7563d5f3c4.mp3 | The slippers are … the bed. | 1 |
| /audio/production/en-US/supplemental/where-is-the-bear-53eaf53223.mp3 | Where is the bear? | 1 |
| /audio/production/en-US/supplemental/where-is-the-child-ea0f19db96.mp3 | Where is the child? | 1 |
| /audio/production/en-US/supplemental/the-bear-is-the-tree-a429dcec21.mp3 | The bear is … the tree. | 1 |
| /audio/production/en-US/supplemental/the-child-is-the-curtain-f2f4b082b4.mp3 | The child is … the curtain. | 1 |
| /audio/production/en-US/supplemental/where-is-the-rabbit-e12e322525.mp3 | Where is the rabbit? | 1 |
| /audio/production/en-US/supplemental/where-is-the-cup-c6133332e5.mp3 | Where is the cup? | 2 |
| /audio/production/en-US/supplemental/the-rabbit-is-the-basket-4050eea424.mp3 | The rabbit is … the basket. | 1 |
| /audio/production/en-US/supplemental/the-cup-is-the-plate-cbb19bffb6.mp3 | The cup is … the plate. | 1 |
| /audio/production/en-US/supplemental/where-is-the-teddy-9bcd91f7da.mp3 | Where is the teddy? | 1 |
| /audio/production/en-US/supplemental/the-cup-is-the-books-2ea6babd5b.mp3 | The cup is … the books. | 1 |
| /audio/production/en-US/supplemental/the-teddy-is-the-pillows-15a0dab41a.mp3 | The teddy is … the pillows. | 1 |
| /audio/production/en-US/supplemental/where-is-the-tree-3948df8aca.mp3 | Where is the tree? | 2 |
| /audio/production/en-US/supplemental/where-is-the-bike-bf6286ec21.mp3 | Where is the bike? | 1 |
| /audio/production/en-US/supplemental/the-tree-is-the-bear-bdd7ef32ef.mp3 | The tree is … the bear. | 1 |
| /audio/production/en-US/supplemental/the-bike-is-the-garage-4dcd639942.mp3 | The bike is … the garage. | 1 |
| /audio/production/en-US/assessment_prompt/where-is-the-bird-3bd4085cc0.mp3 | Where is the bird? | 1 |
| /audio/production/en-US/supplemental/where-is-the-clock-cef2a2459b.mp3 | Where is the clock? | 1 |
| /audio/production/en-US/supplemental/the-bird-is-the-tree-6fd58602ef.mp3 | The bird is … the tree. | 1 |
| /audio/production/en-US/supplemental/the-clock-is-the-door-f913ff7117.mp3 | The clock is … the door. | 1 |
| /audio/production/en-US/supplemental/where-is-the-fish-54bd7e4c9a.mp3 | Where is the fish? | 1 |
| /audio/production/en-US/supplemental/the-tree-is-the-bird-de64c667dc.mp3 | The tree is … the bird. | 1 |
| /audio/production/en-US/supplemental/the-fish-is-the-bridge-6be5e77fc4.mp3 | The fish is … the bridge. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-plane-flew-the-town-5bec26d465.mp3 | Which where-word finishes the sentence? The plane flew … the town. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-horse-leapt-the-gate-4b52f5192d.mp3 | Which where-word finishes the sentence? The horse leapt … the gate. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-high-in-the-sky-the-plane-passed-the-town-129a677e1c.mp3 | Which where-word fits exactly? High in the sky, the plane passed … the town. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-the-horse-jumped-the-locked-gate-68f44f39ba.mp3 | Which where-word fits exactly? The horse jumped … the locked gate. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-train-roared-the-tunnel-46396d5625.mp3 | Which where-word finishes the sentence? The train roared … the tunnel. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-rain-dripped-the-crack-in-the-ten-42d21871a5.mp3 | Which where-word finishes the sentence? Rain dripped … the crack in the tent. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-the-train-entered-one-end-and-left-the-oth-7fa99c93b9.mp3 | Which where-word fits exactly? The train entered one end and left the other: … the tunnel. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-the-tent-leaked-because-rain-came-a-small-04119acc32.mp3 | Which where-word fits exactly? The tent leaked because rain came … a small crack. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-our-house-is-the-school-on-the-sa-20f623be8a.mp3 | Which where-word finishes the sentence? Our house is … the school on the same short street. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-keep-the-bucket-the-door-for-spil-1e8f072e01.mp3 | Which where-word finishes the sentence? Keep the bucket … the door for spills. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-home-is-a-short-walk-away-our-house-is-the-a34df1d374.mp3 | Which where-word fits exactly? Home is a short walk away. Our house is … the school. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-keep-the-bucket-the-door-so-it-is-quick-to-89a04dfe06.mp3 | Which where-word fits exactly? Keep the bucket … the door so it is quick to reach. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-bakery-is-the-bank-just-acros-72fa447676.mp3 | Which where-word finishes the sentence? The bakery is … the bank, just across the road. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-two-goals-stand-each-other-ef73b3cc90.mp3 | Which where-word finishes the sentence? The two goals stand … each other. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-the-bakery-faces-the-bank-across-the-road-34b2a2ec3a.mp3 | Which where-word fits exactly? The bakery faces the bank across the road: … the bank. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-the-goals-at-the-two-ends-stand-each-other-9bb4395b36.mp3 | Which where-word fits exactly? The goals at the two ends stand … each other. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-a-red-tulip-grew-the-yellow-tulip-a15396b381.mp3 | Which where-word finishes the sentence? A red tulip grew … the yellow tulips. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-deer-stood-the-trees-1820a212f0.mp3 | Which where-word finishes the sentence? The deer stood … the trees. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-one-red-flower-grows-many-yellow-flowers-291ddbc773.mp3 | Which where-word fits exactly? One red flower grows … many yellow flowers. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-a-deer-stood-the-trees-hard-to-spot-003395c4e7.mp3 | Which where-word fits exactly? A deer stood … the trees, hard to spot. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-fence-runs-the-whole-garden-d5d86ca6f1.mp3 | Which where-word finishes the sentence? The fence runs … the whole garden. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-path-bends-the-puddle-b7ce9c90f6.mp3 | Which where-word finishes the sentence? The path bends … the puddle. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-we-walked-the-puddle-to-keep-our-shoes-dry-e9aa001222.mp3 | Which where-word fits exactly? We walked … the puddle to keep our shoes dry. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-the-fence-makes-a-complete-ring-the-garden-90011bf285.mp3 | Which where-word fits exactly? The fence makes a complete ring … the garden. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-it-poured-with-rain-so-we-played-4026a1d76e.mp3 | Which where-word finishes the sentence? It poured with rain, so we played … the house. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-leave-the-muddy-boots-the-door-5a66fb991b.mp3 | Which where-word finishes the sentence? Leave the muddy boots … the door. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-leave-your-muddy-boots-the-door-then-come-153ca45797.mp3 | Which where-word fits exactly? Leave your muddy boots … the door, then come in. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-rain-is-falling-outdoors-but-the-children-5ad016b4f2.mp3 | Which where-word fits exactly? Rain is falling outdoors, but the children are dry … the house. | 1 |
| /audio/production/en-US/supplemental/where-is-the-chair-e125ed5a2a.mp3 | Where is the chair? | 1 |
| /audio/production/en-US/supplemental/where-are-the-books-7c68f6254f.mp3 | Where are the books? | 1 |
| /audio/production/en-US/supplemental/choose-the-word-the-goat-waits-the-barn-967a5037f3.mp3 | Choose the word: the goat waits … the barn. | 1 |
| /audio/production/en-US/supplemental/choose-the-word-the-dog-rests-the-table-0096706701.mp3 | Choose the word: the dog rests … the table. | 1 |
| /audio/production/en-US/supplemental/choose-the-word-the-clock-hangs-the-door-af7d51f925.mp3 | Choose the word: the clock hangs … the door. | 1 |
| /audio/production/en-US/supplemental/choose-the-words-the-rabbit-sits-the-basket-e0f3638983.mp3 | Choose the words: the rabbit sits … the basket. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-horse-is-jumping-the-gate-32f9cd3c52.mp3 | Which where-word finishes the sentence? The horse is jumping … the gate. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-train-is-passing-the-tunnel-4c6e2be8f7.mp3 | Which where-word finishes the sentence? The train is passing … the tunnel. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-a-short-path-joins-home-and-school-they-ar-4268b45b3c.mp3 | Which where-word fits exactly? A short path joins home and school. They are … each other. | 1 |
| /audio/production/en-US/supplemental/which-where-word-fits-exactly-the-single-red-tulip-stands-the-yellow-tul-7fb4f203ca.mp3 | Which where-word fits exactly? The single red tulip stands … the yellow tulips. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-fence-curves-the-garden-72df6ffa1e.mp3 | Which where-word finishes the sentence? The fence curves … the garden. | 1 |
| /audio/production/en-US/supplemental/which-where-word-finishes-the-sentence-the-children-stay-dry-the-house-a3f7d1e3c7.mp3 | Which where-word finishes the sentence? The children stay dry … the house. | 1 |
| /audio/production/en-US/supplemental/car-which-letters-finish-the-word-car-7f95a8145c.mp3 | car. Which letters finish the word car? | 1 |
| /audio/production/en-US/supplemental/farm-which-letters-finish-the-word-farm-2674d753d9.mp3 | farm. Which letters finish the word farm? | 1 |
| /audio/production/en-US/supplemental/shark-which-letters-make-the-r-sound-in-shark-a1178dedc5.mp3 | shark. Which letters make the r sound in shark? | 1 |
| /audio/production/en-US/supplemental/yarn-which-letters-make-the-r-sound-in-yarn-54d3403906.mp3 | yarn. Which letters make the r sound in yarn? | 1 |
| /audio/production/en-US/supplemental/park-which-letters-make-the-r-sound-in-park-b4e68d3f21.mp3 | park. Which letters make the r sound in park? | 1 |
| /audio/production/en-US/supplemental/sharp-which-letters-finish-the-word-sharp-f3cd085fb5.mp3 | sharp. Which letters finish the word sharp? | 1 |
| /audio/production/en-US/supplemental/barn-which-letters-finish-the-word-barn-c515947a66.mp3 | barn. Which letters finish the word barn? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-ar-as-in-car-sound-58ebc39a78.mp3 | Which word has the ar (as in car) sound? | 4 |
| /audio/production/en-US/supplemental/corn-which-letters-finish-the-word-corn-bf9e1963e1.mp3 | corn. Which letters finish the word corn? | 1 |
| /audio/production/en-US/supplemental/fork-which-letters-finish-the-word-fork-8e6d97f141.mp3 | fork. Which letters finish the word fork? | 1 |
| /audio/production/en-US/supplemental/storm-which-letters-finish-the-word-storm-48f7149980.mp3 | storm. Which letters finish the word storm? | 1 |
| /audio/production/en-US/supplemental/corn-which-letters-make-the-r-sound-in-corn-ae0d37952a.mp3 | corn. Which letters make the r sound in corn? | 1 |
| /audio/production/en-US/supplemental/fork-which-letters-make-the-r-sound-in-fork-af44d92a6a.mp3 | fork. Which letters make the r sound in fork? | 1 |
| /audio/production/en-US/supplemental/horn-which-letters-make-the-r-sound-in-horn-486ec903a5.mp3 | horn. Which letters make the r sound in horn? | 1 |
| /audio/production/en-US/supplemental/short-which-letters-finish-the-word-short-0a9832748b.mp3 | short. Which letters finish the word short? | 1 |
| /audio/production/en-US/supplemental/fort-which-letters-finish-the-word-fort-27ce4fecbf.mp3 | fort. Which letters finish the word fort? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-or-as-in-corn-sound-5d63c2b772.mp3 | Which word has the or (as in corn) sound? | 3 |
| /audio/production/en-US/supplemental/her-which-letters-finish-the-word-her-5206c58ae7.mp3 | her. Which letters finish the word her? | 2 |
| /audio/production/en-US/supplemental/fern-which-letters-finish-the-word-fern-c81247d9dc.mp3 | fern. Which letters finish the word fern? | 1 |
| /audio/production/en-US/supplemental/herd-which-letters-finish-the-word-herd-71f1d9dec9.mp3 | herd. Which letters finish the word herd? | 1 |
| /audio/production/en-US/supplemental/tiger-which-letters-make-the-r-sound-in-tiger-6b4073ff72.mp3 | tiger. Which letters make the r sound in tiger? | 1 |
| /audio/production/en-US/supplemental/flower-which-letters-make-the-r-sound-in-flower-aa2032fc69.mp3 | flower. Which letters make the r sound in flower? | 1 |
| /audio/production/en-US/supplemental/spider-which-letters-make-the-r-sound-in-spider-fdb3eafe53.mp3 | spider. Which letters make the r sound in spider? | 1 |
| /audio/production/en-US/supplemental/letter-which-letters-finish-the-word-letter-ced20d832b.mp3 | letter. Which letters finish the word letter? | 1 |
| /audio/production/en-US/supplemental/winter-which-letters-finish-the-word-winter-787d84abae.mp3 | winter. Which letters finish the word winter? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-er-as-in-her-sound-11105d9bf6.mp3 | Which word has the er (as in her) sound? | 3 |
| /audio/production/en-US/supplemental/bird-which-letters-finish-the-word-bird-bc71fc9005.mp3 | bird. Which letters finish the word bird? | 1 |
| /audio/production/en-US/supplemental/girl-which-letters-finish-the-word-girl-3328721ec5.mp3 | girl. Which letters finish the word girl? | 1 |
| /audio/production/en-US/supplemental/shirt-which-letters-finish-the-word-shirt-d86ec0823c.mp3 | shirt. Which letters finish the word shirt? | 1 |
| /audio/production/en-US/supplemental/bird-which-letters-make-the-r-sound-in-bird-f47413c904.mp3 | bird. Which letters make the r sound in bird? | 1 |
| /audio/production/en-US/supplemental/girl-which-letters-make-the-r-sound-in-girl-65bb480e3f.mp3 | girl. Which letters make the r sound in girl? | 1 |
| /audio/production/en-US/supplemental/shirt-which-letters-make-the-r-sound-in-shirt-eb0fb90f9f.mp3 | shirt. Which letters make the r sound in shirt? | 1 |
| /audio/production/en-US/supplemental/first-which-letters-finish-the-word-first-a3ebd016d2.mp3 | first. Which letters finish the word first? | 2 |
| /audio/production/en-US/supplemental/third-which-letters-finish-the-word-third-ae2faf5734.mp3 | third. Which letters finish the word third? | 1 |
| /audio/production/en-US/supplemental/dirt-which-letters-finish-the-word-dirt-c8585fc9bc.mp3 | dirt. Which letters finish the word dirt? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-ir-as-in-bird-sound-8e824f7b39.mp3 | Which word has the ir (as in bird) sound? | 4 |
| /audio/production/en-US/supplemental/hurt-which-letters-finish-the-word-hurt-6735f88541.mp3 | hurt. Which letters finish the word hurt? | 1 |
| /audio/production/en-US/supplemental/nurse-which-letters-finish-the-word-nurse-04f1bf951d.mp3 | nurse. Which letters finish the word nurse? | 2 |
| /audio/production/en-US/supplemental/burn-which-letters-finish-the-word-burn-588f73d9e4.mp3 | burn. Which letters finish the word burn? | 1 |
| /audio/production/en-US/supplemental/purse-which-letters-make-the-r-sound-in-purse-e000f460ab.mp3 | purse. Which letters make the r sound in purse? | 1 |
| /audio/production/en-US/supplemental/surf-which-letters-make-the-r-sound-in-surf-a8c9b8dae9.mp3 | surf. Which letters make the r sound in surf? | 1 |
| /audio/production/en-US/supplemental/turtle-which-letters-make-the-r-sound-in-turtle-91895219a1.mp3 | turtle. Which letters make the r sound in turtle? | 1 |
| /audio/production/en-US/supplemental/curl-which-letters-finish-the-word-curl-01dbb7f35b.mp3 | curl. Which letters finish the word curl? | 1 |
| /audio/production/en-US/supplemental/turnip-which-letters-finish-the-word-turnip-4ead20099a.mp3 | turnip. Which letters finish the word turnip? | 1 |
| /audio/production/en-US/supplemental/burst-which-letters-finish-the-word-burst-3605d44153.mp3 | burst. Which letters finish the word burst? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-ur-as-in-turn-sound-cdaeda216d.mp3 | Which word has the ur (as in turn) sound? | 3 |
| /audio/production/en-US/supplemental/jar-which-letters-finish-the-word-jar-b224c61b4a.mp3 | jar. Which letters finish the word jar? | 1 |
| /audio/production/en-US/supplemental/horn-which-letters-finish-the-word-horn-b00ce279d2.mp3 | horn. Which letters finish the word horn? | 1 |
| /audio/production/en-US/supplemental/car-which-letters-make-the-r-sound-in-car-2f70d3c3e0.mp3 | car. Which letters make the r sound in car? | 1 |
| /audio/production/en-US/supplemental/storm-which-letters-make-the-r-sound-in-storm-9a6cb2f88a.mp3 | storm. Which letters make the r sound in storm? | 1 |
| /audio/production/en-US/supplemental/sister-which-letters-finish-the-word-sister-c0bff4847a.mp3 | sister. Which letters finish the word sister? | 1 |
| /audio/production/en-US/supplemental/fur-which-letters-finish-the-word-fur-1c70dbf695.mp3 | fur. Which letters finish the word fur? | 1 |
| /audio/production/en-US/supplemental/cat-which-one-rhymes-with-cat-d75df56b2c.mp3 | cat. Which one rhymes with cat? | 1 |
| /audio/production/en-US/supplemental/sat-which-one-rhymes-with-sat-df892db2ce.mp3 | sat. Which one rhymes with sat? | 1 |
| /audio/production/en-US/supplemental/bat-which-one-rhymes-with-bat-53ebdb500d.mp3 | bat. Which one rhymes with bat? | 1 |
| /audio/production/en-US/supplemental/man-which-one-rhymes-with-man-3e21d4c0f0.mp3 | man. Which one rhymes with man? | 1 |
| /audio/production/en-US/supplemental/can-which-one-rhymes-with-can-2f2417f8f2.mp3 | can. Which one rhymes with can? | 1 |
| /audio/production/en-US/supplemental/tan-which-one-rhymes-with-tan-2588432b2a.mp3 | tan. Which one rhymes with tan? | 1 |
| /audio/production/en-US/supplemental/cap-which-one-rhymes-with-cap-aee7f9e0bb.mp3 | cap. Which one rhymes with cap? | 1 |
| /audio/production/en-US/supplemental/map-which-one-rhymes-with-map-0091c37190.mp3 | map. Which one rhymes with map? | 1 |
| /audio/production/en-US/supplemental/lap-which-one-rhymes-with-lap-e4f8429e42.mp3 | lap. Which one rhymes with lap? | 1 |
| /audio/production/en-US/supplemental/ham-which-one-rhymes-with-ham-55b489be81.mp3 | ham. Which one rhymes with ham? | 1 |
| /audio/production/en-US/supplemental/ram-which-one-rhymes-with-ram-4ec97f7563.mp3 | ram. Which one rhymes with ram? | 1 |
| /audio/production/en-US/supplemental/jam-which-one-rhymes-with-jam-f810d875be.mp3 | jam. Which one rhymes with jam? | 1 |
| /audio/production/en-US/supplemental/bag-which-one-rhymes-with-bag-e32adcd68f.mp3 | bag. Which one rhymes with bag? | 1 |
| /audio/production/en-US/supplemental/rag-which-one-rhymes-with-rag-823e06fb32.mp3 | rag. Which one rhymes with rag? | 1 |
| /audio/production/en-US/supplemental/tag-which-one-rhymes-with-tag-44e9c96e26.mp3 | tag. Which one rhymes with tag? | 1 |
| /audio/production/en-US/supplemental/dad-which-one-rhymes-with-dad-8af42d18a3.mp3 | dad. Which one rhymes with dad? | 1 |
| /audio/production/en-US/supplemental/sad-which-one-rhymes-with-sad-cc4612e62c.mp3 | sad. Which one rhymes with sad? | 1 |
| /audio/production/en-US/supplemental/mad-which-one-rhymes-with-mad-28a813f676.mp3 | mad. Which one rhymes with mad? | 1 |
| /audio/production/en-US/supplemental/red-which-one-rhymes-with-red-1cec6615d8.mp3 | red. Which one rhymes with red? | 1 |
| /audio/production/en-US/supplemental/fed-which-one-rhymes-with-fed-06ae2e2529.mp3 | fed. Which one rhymes with fed? | 1 |
| /audio/production/en-US/supplemental/wed-which-one-rhymes-with-wed-c5ba88a858.mp3 | wed. Which one rhymes with wed? | 1 |
| /audio/production/en-US/supplemental/den-which-one-rhymes-with-den-136903a104.mp3 | den. Which one rhymes with den? | 1 |
| /audio/production/en-US/supplemental/men-which-one-rhymes-with-men-58dc7a3d81.mp3 | men. Which one rhymes with men? | 1 |
| /audio/production/en-US/supplemental/hen-which-one-rhymes-with-hen-fd0eb203ad.mp3 | hen. Which one rhymes with hen? | 1 |
| /audio/production/en-US/supplemental/pet-which-one-rhymes-with-pet-6f17b2e74f.mp3 | pet. Which one rhymes with pet? | 1 |
| /audio/production/en-US/supplemental/wet-which-one-rhymes-with-wet-4e86ac963c.mp3 | wet. Which one rhymes with wet? | 1 |
| /audio/production/en-US/supplemental/set-which-one-rhymes-with-set-f34e0f9dd8.mp3 | set. Which one rhymes with set? | 1 |
| /audio/production/en-US/supplemental/peg-which-one-rhymes-with-peg-b2008d7a82.mp3 | peg. Which one rhymes with peg? | 2 |
| /audio/production/en-US/supplemental/leg-which-one-rhymes-with-leg-1e52f7e83d.mp3 | leg. Which one rhymes with leg? | 1 |
| /audio/production/en-US/supplemental/fig-which-one-rhymes-with-fig-c12c58265d.mp3 | fig. Which one rhymes with fig? | 1 |
| /audio/production/en-US/supplemental/twig-which-one-rhymes-with-twig-bb1ad2264a.mp3 | twig. Which one rhymes with twig? | 1 |
| /audio/production/en-US/supplemental/jig-which-one-rhymes-with-jig-68015c2da6.mp3 | jig. Which one rhymes with jig? | 1 |
| /audio/production/en-US/supplemental/win-which-one-rhymes-with-win-d9466cbdcb.mp3 | win. Which one rhymes with win? | 1 |
| /audio/production/en-US/supplemental/tin-which-one-rhymes-with-tin-d7b8106464.mp3 | tin. Which one rhymes with tin? | 1 |
| /audio/production/en-US/supplemental/chin-which-one-rhymes-with-chin-6c8e106fe9.mp3 | chin. Which one rhymes with chin? | 1 |
| /audio/production/en-US/supplemental/dip-which-one-rhymes-with-dip-5cf1e0a975.mp3 | dip. Which one rhymes with dip? | 1 |
| /audio/production/en-US/supplemental/rip-which-one-rhymes-with-rip-208147ca39.mp3 | rip. Which one rhymes with rip? | 1 |
| /audio/production/en-US/supplemental/lip-which-one-rhymes-with-lip-9c426eaf9a.mp3 | lip. Which one rhymes with lip? | 1 |
| /audio/production/en-US/supplemental/bit-which-one-rhymes-with-bit-4e97f1e6af.mp3 | bit. Which one rhymes with bit? | 1 |
| /audio/production/en-US/supplemental/fit-which-one-rhymes-with-fit-5058686878.mp3 | fit. Which one rhymes with fit? | 1 |
| /audio/production/en-US/supplemental/kit-which-one-rhymes-with-kit-182a60ff82.mp3 | kit. Which one rhymes with kit? | 1 |
| /audio/production/en-US/supplemental/fog-which-one-rhymes-with-fog-789b2ffacb.mp3 | fog. Which one rhymes with fog? | 1 |
| /audio/production/en-US/supplemental/jog-which-one-rhymes-with-jog-95f9968b10.mp3 | jog. Which one rhymes with jog? | 1 |
| /audio/production/en-US/supplemental/hog-which-one-rhymes-with-hog-12a738b01f.mp3 | hog. Which one rhymes with hog? | 1 |
| /audio/production/en-US/supplemental/pop-which-one-rhymes-with-pop-430a355941.mp3 | pop. Which one rhymes with pop? | 1 |
| /audio/production/en-US/supplemental/drop-which-one-rhymes-with-drop-7ffed03b34.mp3 | drop. Which one rhymes with drop? | 1 |
| /audio/production/en-US/supplemental/stop-which-one-rhymes-with-stop-836011ef4e.mp3 | stop. Which one rhymes with stop? | 1 |
| /audio/production/en-US/supplemental/not-which-one-rhymes-with-not-31e2c8df14.mp3 | not. Which one rhymes with not? | 1 |
| /audio/production/en-US/supplemental/got-which-one-rhymes-with-got-c4eb46a6dd.mp3 | got. Which one rhymes with got? | 1 |
| /audio/production/en-US/supplemental/lot-which-one-rhymes-with-lot-5d391f5919.mp3 | lot. Which one rhymes with lot? | 1 |
| /audio/production/en-US/supplemental/tug-which-one-rhymes-with-tug-c9756b7bf7.mp3 | tug. Which one rhymes with tug? | 1 |
| /audio/production/en-US/supplemental/dug-which-one-rhymes-with-dug-6fe4cf3cdf.mp3 | dug. Which one rhymes with dug? | 1 |
| /audio/production/en-US/supplemental/hug-which-one-rhymes-with-hug-6b9fc9e9a0.mp3 | hug. Which one rhymes with hug? | 1 |
| /audio/production/en-US/supplemental/fun-which-one-rhymes-with-fun-ad1c0b21d7.mp3 | fun. Which one rhymes with fun? | 1 |
| /audio/production/en-US/supplemental/bun-which-one-rhymes-with-bun-ac45484752.mp3 | bun. Which one rhymes with bun? | 1 |
| /audio/production/en-US/supplemental/sun-which-one-rhymes-with-sun-cedce11810.mp3 | sun. Which one rhymes with sun? | 1 |
| /audio/production/en-US/supplemental/pup-which-one-rhymes-with-pup-585d660db5.mp3 | pup. Which one rhymes with pup? | 2 |
| /audio/production/en-US/supplemental/cup-which-one-rhymes-with-cup-b7e0b79856.mp3 | cup. Which one rhymes with cup? | 1 |
| /audio/production/en-US/supplemental/shut-which-one-rhymes-with-shut-fca3b0c749.mp3 | shut. Which one rhymes with shut? | 2 |
| /audio/production/en-US/supplemental/but-which-one-rhymes-with-but-3be6b41c0c.mp3 | but. Which one rhymes with but? | 1 |
| /audio/production/en-US/supplemental/sing-which-word-rhymes-with-sing-37eef6c44b.mp3 | sing. Which word rhymes with sing? | 1 |
| /audio/production/en-US/supplemental/king-which-word-rhymes-with-king-83122c3c8a.mp3 | king. Which word rhymes with king? | 1 |
| /audio/production/en-US/supplemental/which-word-does-not-rhyme-with-the-others-50985dbe1f.mp3 | Which word does not rhyme with the others? | 28 |
| /audio/production/en-US/supplemental/bang-which-word-rhymes-with-bang-2c4e7ad2de.mp3 | bang. Which word rhymes with bang? | 1 |
| /audio/production/en-US/supplemental/sang-which-word-rhymes-with-sang-ba1002982a.mp3 | sang. Which word rhymes with sang? | 1 |
| /audio/production/en-US/supplemental/song-which-word-rhymes-with-song-e525540f60.mp3 | song. Which word rhymes with song? | 1 |
| /audio/production/en-US/supplemental/long-which-word-rhymes-with-long-3b57d3a4d8.mp3 | long. Which word rhymes with long? | 1 |
| /audio/production/en-US/supplemental/pink-which-word-rhymes-with-pink-8b9c6149ff.mp3 | pink. Which word rhymes with pink? | 1 |
| /audio/production/en-US/supplemental/wink-which-word-rhymes-with-wink-cc9dec4792.mp3 | wink. Which word rhymes with wink? | 1 |
| /audio/production/en-US/supplemental/sock-which-word-rhymes-with-sock-aa12d9a5a1.mp3 | sock. Which word rhymes with sock? | 1 |
| /audio/production/en-US/supplemental/lock-which-word-rhymes-with-lock-7f7e61f452.mp3 | lock. Which word rhymes with lock? | 1 |
| /audio/production/en-US/supplemental/back-which-word-rhymes-with-back-402117c59a.mp3 | back. Which word rhymes with back? | 1 |
| /audio/production/en-US/supplemental/pack-which-word-rhymes-with-pack-1f239c2dfc.mp3 | pack. Which word rhymes with pack? | 1 |
| /audio/production/en-US/supplemental/stick-which-word-rhymes-with-stick-1e97a4e7f7.mp3 | stick. Which word rhymes with stick? | 1 |
| /audio/production/en-US/supplemental/kick-which-word-rhymes-with-kick-e7adb097f0.mp3 | kick. Which word rhymes with kick? | 1 |
| /audio/production/en-US/supplemental/hill-which-word-rhymes-with-hill-e500d0c788.mp3 | hill. Which word rhymes with hill? | 1 |
| /audio/production/en-US/supplemental/mill-which-word-rhymes-with-mill-9f7e8721c3.mp3 | mill. Which word rhymes with mill? | 1 |
| /audio/production/en-US/supplemental/ball-which-word-rhymes-with-ball-5d031d358f.mp3 | ball. Which word rhymes with ball? | 1 |
| /audio/production/en-US/supplemental/wall-which-word-rhymes-with-wall-c988c40b52.mp3 | wall. Which word rhymes with wall? | 1 |
| /audio/production/en-US/supplemental/bell-which-word-rhymes-with-bell-606967200b.mp3 | bell. Which word rhymes with bell? | 1 |
| /audio/production/en-US/supplemental/well-which-word-rhymes-with-well-bf7e7d8f1e.mp3 | well. Which word rhymes with well? | 1 |
| /audio/production/en-US/supplemental/cash-which-word-rhymes-with-cash-1bf753063c.mp3 | cash. Which word rhymes with cash? | 1 |
| /audio/production/en-US/supplemental/splash-which-word-rhymes-with-splash-171c91b756.mp3 | splash. Which word rhymes with splash? | 1 |
| /audio/production/en-US/supplemental/wish-which-word-rhymes-with-wish-1c3f35dc71.mp3 | wish. Which word rhymes with wish? | 1 |
| /audio/production/en-US/supplemental/fish-which-word-rhymes-with-fish-1e1aea4550.mp3 | fish. Which word rhymes with fish? | 1 |
| /audio/production/en-US/supplemental/duck-which-word-rhymes-with-duck-7fa73db8d6.mp3 | duck. Which word rhymes with duck? | 1 |
| /audio/production/en-US/supplemental/luck-which-word-rhymes-with-luck-c96da9cbe0.mp3 | luck. Which word rhymes with luck? | 1 |
| /audio/production/en-US/supplemental/cake-which-word-rhymes-with-cake-a7500458ed.mp3 | cake. Which word rhymes with cake? | 1 |
| /audio/production/en-US/supplemental/snake-which-word-rhymes-with-snake-fc20cca534.mp3 | snake. Which word rhymes with snake? | 1 |
| /audio/production/en-US/supplemental/game-which-word-rhymes-with-game-87ec5bbcdf.mp3 | game. Which word rhymes with game? | 1 |
| /audio/production/en-US/supplemental/same-which-word-rhymes-with-same-2b6caa274d.mp3 | same. Which word rhymes with same? | 1 |
| /audio/production/en-US/supplemental/ride-which-word-rhymes-with-ride-13fecc9bab.mp3 | ride. Which word rhymes with ride? | 1 |
| /audio/production/en-US/supplemental/side-which-word-rhymes-with-side-f759766a0c.mp3 | side. Which word rhymes with side? | 1 |
| /audio/production/en-US/supplemental/light-which-word-rhymes-with-light-35be5f22cb.mp3 | light. Which word rhymes with light? | 1 |
| /audio/production/en-US/supplemental/night-which-word-rhymes-with-night-677d15cf0a.mp3 | night. Which word rhymes with night? | 1 |
| /audio/production/en-US/supplemental/boat-which-word-rhymes-with-boat-70ec50d5da.mp3 | boat. Which word rhymes with boat? | 1 |
| /audio/production/en-US/supplemental/coat-which-word-rhymes-with-coat-b0134a4d14.mp3 | coat. Which word rhymes with coat? | 1 |
| /audio/production/en-US/supplemental/sheep-which-word-rhymes-with-sheep-5d730cb963.mp3 | sheep. Which word rhymes with sheep? | 1 |
| /audio/production/en-US/supplemental/jeep-which-word-rhymes-with-jeep-b37e61df29.mp3 | jeep. Which word rhymes with jeep? | 1 |
| /audio/production/en-US/supplemental/bird-which-word-rhymes-with-bird-c563d78a04.mp3 | bird. Which word rhymes with bird? | 1 |
| /audio/production/en-US/supplemental/third-which-word-rhymes-with-third-e9dc91b0e3.mp3 | third. Which word rhymes with third? | 1 |
| /audio/production/en-US/supplemental/burn-which-word-rhymes-with-burn-58d8d615da.mp3 | burn. Which word rhymes with burn? | 1 |
| /audio/production/en-US/supplemental/turn-which-word-rhymes-with-turn-755f26f232.mp3 | turn. Which word rhymes with turn? | 1 |
| /audio/production/en-US/supplemental/car-which-word-rhymes-with-car-93c588809b.mp3 | car. Which word rhymes with car? | 1 |
| /audio/production/en-US/supplemental/jar-which-word-rhymes-with-jar-1f90442603.mp3 | jar. Which word rhymes with jar? | 1 |
| /audio/production/en-US/supplemental/corn-which-word-rhymes-with-corn-04b2fe4eb9.mp3 | corn. Which word rhymes with corn? | 1 |
| /audio/production/en-US/supplemental/fort-which-word-rhymes-with-fort-00fad9da0b.mp3 | fort. Which word rhymes with fort? | 1 |
| /audio/production/en-US/supplemental/rat-which-one-rhymes-with-rat-ea9744b2e7.mp3 | rat. Which one rhymes with rat? | 1 |
| /audio/production/en-US/supplemental/log-which-one-rhymes-with-log-63692b1ba5.mp3 | log. Which one rhymes with log? | 1 |
| /audio/production/en-US/supplemental/pen-which-one-rhymes-with-pen-4dc8198974.mp3 | pen. Which one rhymes with pen? | 1 |
| /audio/production/en-US/supplemental/jug-which-one-rhymes-with-jug-eeb6c38861.mp3 | jug. Which one rhymes with jug? | 1 |
| /audio/production/en-US/supplemental/tip-which-one-rhymes-with-tip-b56904f1bf.mp3 | tip. Which one rhymes with tip? | 1 |
| /audio/production/en-US/supplemental/ring-which-word-rhymes-with-ring-275769d4b3.mp3 | ring. Which word rhymes with ring? | 1 |
| /audio/production/en-US/supplemental/bake-which-word-rhymes-with-bake-4943332ea9.mp3 | bake. Which word rhymes with bake? | 1 |
| /audio/production/en-US/supplemental/goat-which-word-rhymes-with-goat-0a9454e22a.mp3 | goat. Which word rhymes with goat? | 1 |
| /audio/production/en-US/supplemental/bag-which-vowel-do-you-hear-in-the-middle-of-bag-406bfb03bc.mp3 | bag. Which vowel do you hear in the middle of bag? | 1 |
| /audio/production/en-US/supplemental/ram-which-vowel-do-you-hear-in-the-middle-of-ram-21736b7e06.mp3 | ram. Which vowel do you hear in the middle of ram? | 1 |
| /audio/production/en-US/supplemental/tap-which-vowel-do-you-hear-in-the-middle-of-tap-b764b8eaf7.mp3 | tap. Which vowel do you hear in the middle of tap? | 1 |
| /audio/production/en-US/supplemental/hand-which-vowel-do-you-hear-in-the-middle-of-hand-52d74027ea.mp3 | hand. Which vowel do you hear in the middle of hand? | 1 |
| /audio/production/en-US/supplemental/flag-which-vowel-do-you-hear-in-the-middle-of-flag-3b5f279cbd.mp3 | flag. Which vowel do you hear in the middle of flag? | 1 |
| /audio/production/en-US/supplemental/which-picture-s-word-has-the-short-a-sound-in-the-middle-e71af3a6b3.mp3 | Which picture's word has the short a sound in the middle? | 2 |
| /audio/production/en-US/supplemental/web-which-vowel-do-you-hear-in-the-middle-of-web-f5838ed659.mp3 | web. Which vowel do you hear in the middle of web? | 1 |
| /audio/production/en-US/supplemental/ten-which-vowel-do-you-hear-in-the-middle-of-ten-a356051cf8.mp3 | ten. Which vowel do you hear in the middle of ten? | 1 |
| /audio/production/en-US/supplemental/leg-which-vowel-do-you-hear-in-the-middle-of-leg-e415499f17.mp3 | leg. Which vowel do you hear in the middle of leg? | 1 |
| /audio/production/en-US/supplemental/nest-which-vowel-do-you-hear-in-the-middle-of-nest-4b12c81282.mp3 | nest. Which vowel do you hear in the middle of nest? | 1 |
| /audio/production/en-US/supplemental/shell-which-vowel-do-you-hear-in-the-middle-of-shell-731efc30b1.mp3 | shell. Which vowel do you hear in the middle of shell? | 1 |
| /audio/production/en-US/supplemental/which-picture-s-word-has-the-short-e-sound-in-the-middle-8105e4d9b2.mp3 | Which picture's word has the short e sound in the middle? | 3 |
| /audio/production/en-US/supplemental/bin-which-vowel-do-you-hear-in-the-middle-of-bin-8dfb374efb.mp3 | bin. Which vowel do you hear in the middle of bin? | 1 |
| /audio/production/en-US/supplemental/zip-which-vowel-do-you-hear-in-the-middle-of-zip-cf0925a608.mp3 | zip. Which vowel do you hear in the middle of zip? | 1 |
| /audio/production/en-US/supplemental/hit-which-vowel-do-you-hear-in-the-middle-of-hit-8686ca6d36.mp3 | hit. Which vowel do you hear in the middle of hit? | 1 |
| /audio/production/en-US/supplemental/brick-which-vowel-do-you-hear-in-the-middle-of-brick-b57bf31ee0.mp3 | brick. Which vowel do you hear in the middle of brick? | 1 |
| /audio/production/en-US/supplemental/gift-which-vowel-do-you-hear-in-the-middle-of-gift-2e58e20ebd.mp3 | gift. Which vowel do you hear in the middle of gift? | 1 |
| /audio/production/en-US/supplemental/which-picture-s-word-has-the-short-i-sound-in-the-middle-41a2a48c8c.mp3 | Which picture's word has the short i sound in the middle? | 2 |
| /audio/production/en-US/supplemental/fox-which-vowel-do-you-hear-in-the-middle-of-fox-c7b4dd1b65.mp3 | fox. Which vowel do you hear in the middle of fox? | 1 |
| /audio/production/en-US/supplemental/mop-which-vowel-do-you-hear-in-the-middle-of-mop-25dc1d5832.mp3 | mop. Which vowel do you hear in the middle of mop? | 1 |
| /audio/production/en-US/supplemental/dot-which-vowel-do-you-hear-in-the-middle-of-dot-dd1b29a6e9.mp3 | dot. Which vowel do you hear in the middle of dot? | 1 |
| /audio/production/en-US/supplemental/sock-which-vowel-do-you-hear-in-the-middle-of-sock-bff0906a77.mp3 | sock. Which vowel do you hear in the middle of sock? | 1 |
| /audio/production/en-US/supplemental/clock-which-vowel-do-you-hear-in-the-middle-of-clock-8c9388c29c.mp3 | clock. Which vowel do you hear in the middle of clock? | 1 |
| /audio/production/en-US/supplemental/which-picture-s-word-has-the-short-o-sound-in-the-middle-109b54cebb.mp3 | Which picture's word has the short o sound in the middle? | 3 |
| /audio/production/en-US/supplemental/jug-which-vowel-do-you-hear-in-the-middle-of-jug-56f6808149.mp3 | jug. Which vowel do you hear in the middle of jug? | 1 |
| /audio/production/en-US/supplemental/cup-which-vowel-do-you-hear-in-the-middle-of-cup-eb5d4039a2.mp3 | cup. Which vowel do you hear in the middle of cup? | 1 |
| /audio/production/en-US/supplemental/mud-which-vowel-do-you-hear-in-the-middle-of-mud-34d0345480.mp3 | mud. Which vowel do you hear in the middle of mud? | 1 |
| /audio/production/en-US/supplemental/drum-which-vowel-do-you-hear-in-the-middle-of-drum-bb394b5256.mp3 | drum. Which vowel do you hear in the middle of drum? | 1 |
| /audio/production/en-US/supplemental/brush-which-vowel-do-you-hear-in-the-middle-of-brush-1c613b5302.mp3 | brush. Which vowel do you hear in the middle of brush? | 1 |
| /audio/production/en-US/supplemental/which-picture-s-word-has-the-short-u-sound-in-the-middle-3d583c59e1.mp3 | Which picture's word has the short u sound in the middle? | 2 |
| /audio/production/en-US/supplemental/hen-which-vowel-do-you-hear-in-the-middle-of-hen-02a5cec1ec.mp3 | hen. Which vowel do you hear in the middle of hen? | 1 |
| /audio/production/en-US/supplemental/hut-which-vowel-do-you-hear-in-the-middle-of-hut-2a0e5d899e.mp3 | hut. Which vowel do you hear in the middle of hut? | 1 |
| /audio/production/en-US/supplemental/hop-which-vowel-do-you-hear-in-the-middle-of-hop-c6c6f51f0e.mp3 | hop. Which vowel do you hear in the middle of hop? | 1 |
| /audio/production/en-US/supplemental/sit-which-vowel-do-you-hear-in-the-middle-of-sit-f9046e421e.mp3 | sit. Which vowel do you hear in the middle of sit? | 1 |
| /audio/production/en-US/supplemental/crab-which-vowel-do-you-hear-in-the-middle-of-crab-164685a3df.mp3 | crab. Which vowel do you hear in the middle of crab? | 1 |
| /audio/production/en-US/supplemental/which-one-shows-a-doing-word-something-you-do-f76d8c4db4.mp3 | Which one shows a doing word — something you do? | 4 |
| /audio/production/en-US/supplemental/which-word-is-a-doing-word-441896c1f0.mp3 | Which word is a doing word? | 15 |
| /audio/production/en-US/supplemental/which-one-shows-a-doing-word-something-you-do-to-things-23013a3ef9.mp3 | Which one shows a doing word — something you do to things? | 5 |
| /audio/production/en-US/supplemental/which-one-shows-a-doing-word-something-you-do-every-day-625f5cf568.mp3 | Which one shows a doing word — something you do every day? | 5 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-we-the-raft-to-the-dock-ce874cc2af.mp3 | Which doing word finishes the sentence? We … the raft to the dock. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-the-twins-over-the-puddle-cc2ba65f59.mp3 | Which doing word finishes the sentence? The twins … over the puddle. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-please-the-door-quietly-fddb91f664.mp3 | Which doing word finishes the sentence? Please … the door quietly. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-owls-after-dark-d55e1c13ab.mp3 | Which doing word finishes the sentence? Owls … after dark. | 1 |
| /audio/production/en-US/supplemental/which-word-in-this-sentence-is-the-doing-word-the-pup-chased-its-dinner-655d3fadd9.mp3 | Which word in this sentence is the doing word? "The pup chased its dinner." | 1 |
| /audio/production/en-US/supplemental/which-word-in-this-sentence-is-the-doing-word-gran-knits-thick-socks-17be592ca3.mp3 | Which word in this sentence is the doing word? "Gran knits thick socks." | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-crabs-across-the-sand-90e4405295.mp3 | Which doing word finishes the sentence? Crabs … across the sand. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-we-the-seeds-each-morning-0aab653b84.mp3 | Which doing word finishes the sentence? We … the seeds each morning. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-the-swims-fifty-laps-a-day-6c021a6c90.mp3 | Which doing word finishes the sentence? The … swims fifty laps a day. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-the-twirled-across-the-stage-c451856c21.mp3 | Which doing word finishes the sentence? The … twirled across the stage. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-the-frog-over-the-log-in-one-big-9f40b74fa7.mp3 | Which doing word finishes the sentence? The frog … over the log in one big spring. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-the-soup-in-the-pot-until-bubbles-80996c76bc.mp3 | Which doing word finishes the sentence? The soup … in the pot until bubbles rose. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-fits-best-for-water-falling-drop-by-drop-02347e9109.mp3 | Which doing word fits best for water falling drop by drop? | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-she-the-note-in-half-and-half-aga-15cd897e88.mp3 | Which doing word finishes the sentence? She … the note in half and half again. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-the-snail-along-leaving-a-silver-24701b5060.mp3 | Which doing word finishes the sentence? The snail … along, leaving a silver line. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-he-the-balloon-until-it-nearly-bu-22c0e12397.mp3 | Which doing word finishes the sentence? He … the balloon until it nearly burst. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-fits-best-for-moving-on-tiptoe-without-a-sound-ace3727e60.mp3 | Which doing word fits best for moving on tiptoe without a sound? | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-dad-the-squeaky-wheel-with-oil-6eaf76a34e.mp3 | Which doing word finishes the sentence? Dad … the squeaky wheel with oil. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-bees-from-rose-to-rose-b94c4726fa.mp3 | Which doing word finishes the sentence? Bees … from rose to rose. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-the-ice-slowly-in-the-warm-sun-f52ac5f2b6.mp3 | Which doing word finishes the sentence? The ice … slowly in the warm sun. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-the-wind-the-washing-dry-45b721ccea.mp3 | Which doing word finishes the sentence? The wind … the washing dry. | 1 |
| /audio/production/en-US/supplemental/which-doing-word-finishes-the-sentence-the-baby-at-every-funny-face-d4631f149a.mp3 | Which doing word finishes the sentence? The baby … at every funny face. | 1 |
| /audio/production/en-US/supplemental/rain-which-letters-finish-the-word-rain-66841b4d7b.mp3 | rain. Which letters finish the word rain? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-long-a-sound-d4a7f94df4.mp3 | Which word has the long a sound? | 4 |
| /audio/production/en-US/supplemental/snail-which-is-the-real-way-to-write-snail-f2d965c86d.mp3 | snail. Which is the real way to write snail? | 1 |
| /audio/production/en-US/supplemental/paint-which-is-the-real-way-to-write-paint-6626f8c56a.mp3 | paint. Which is the real way to write paint? | 1 |
| /audio/production/en-US/supplemental/play-which-letters-finish-the-word-play-79f2602ced.mp3 | play. Which letters finish the word play? | 1 |
| /audio/production/en-US/supplemental/day-which-is-the-real-way-to-write-day-fd51764525.mp3 | day. Which is the real way to write day? | 1 |
| /audio/production/en-US/supplemental/stay-which-is-the-real-way-to-write-stay-8fc9676a47.mp3 | stay. Which is the real way to write stay? | 1 |
| /audio/production/en-US/supplemental/sheep-which-letters-finish-the-word-sheep-e498eb7809.mp3 | sheep. Which letters finish the word sheep? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-long-e-sound-c662e346e1.mp3 | Which word has the long e sound? | 4 |
| /audio/production/en-US/supplemental/sheep-which-is-the-real-way-to-write-sheep-526af7b5bd.mp3 | sheep. Which is the real way to write sheep? | 1 |
| /audio/production/en-US/supplemental/bee-which-is-the-real-way-to-write-bee-73bfead293.mp3 | bee. Which is the real way to write bee? | 1 |
| /audio/production/en-US/supplemental/leaf-which-letters-finish-the-word-leaf-07d533876f.mp3 | leaf. Which letters finish the word leaf? | 1 |
| /audio/production/en-US/supplemental/meat-which-letters-finish-the-word-meat-4e1a36f965.mp3 | meat. Which letters finish the word meat? | 1 |
| /audio/production/en-US/assessment_prompt/which-word-has-the-short-e-sound-3faad18a40.mp3 | Which word has the short e sound? | 2 |
| /audio/production/en-US/supplemental/beach-which-is-the-real-way-to-write-beach-660fd6ac0b.mp3 | beach. Which is the real way to write beach? | 1 |
| /audio/production/en-US/supplemental/boat-which-letters-finish-the-word-boat-e122ce3305.mp3 | boat. Which letters finish the word boat? | 1 |
| /audio/production/en-US/supplemental/goat-which-letters-finish-the-word-goat-5ffecd4f55.mp3 | goat. Which letters finish the word goat? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-long-o-sound-131c0863fe.mp3 | Which word has the long o sound? | 2 |
| /audio/production/en-US/supplemental/boat-which-is-the-real-way-to-write-boat-01598ab236.mp3 | boat. Which is the real way to write boat? | 1 |
| /audio/production/en-US/supplemental/coat-which-is-the-real-way-to-write-coat-e93f4c6175.mp3 | coat. Which is the real way to write coat? | 1 |
| /audio/production/en-US/supplemental/light-which-letters-finish-the-word-light-c0d26fcbe6.mp3 | light. Which letters finish the word light? | 1 |
| /audio/production/en-US/supplemental/night-which-letters-finish-the-word-night-55150bd123.mp3 | night. Which letters finish the word night? | 1 |
| /audio/production/en-US/supplemental/which-word-has-the-long-i-sound-bc920d2d63.mp3 | Which word has the long i sound? | 2 |
| /audio/production/en-US/supplemental/light-which-is-the-real-way-to-write-light-f3c7dbae81.mp3 | light. Which is the real way to write light? | 1 |
| /audio/production/en-US/supplemental/night-which-is-the-real-way-to-write-night-29e4e4b784.mp3 | night. Which is the real way to write night? | 1 |
| /audio/production/en-US/supplemental/moon-which-letters-finish-the-word-moon-33a858c5e4.mp3 | moon. Which letters finish the word moon? | 1 |
| /audio/production/en-US/supplemental/blue-which-word-has-the-same-middle-sound-as-blue-176f3cadfc.mp3 | blue. Which word has the same middle sound as blue? | 1 |
| /audio/production/en-US/supplemental/glue-which-word-has-the-same-middle-sound-as-glue-5f5e2d93cc.mp3 | glue. Which word has the same middle sound as glue? | 1 |
| /audio/production/en-US/supplemental/which-word-does-not-have-the-oo-as-in-moon-sound-191ee0581b.mp3 | Which word does not have the oo (as in moon) sound? | 3 |
| /audio/production/en-US/supplemental/grow-which-letters-finish-the-word-grow-7349b6d2bc.mp3 | grow. Which letters finish the word grow? | 1 |
| /audio/production/en-US/supplemental/boat-which-word-has-the-same-middle-sound-as-boat-d83aa0c9ce.mp3 | boat. Which word has the same middle sound as boat? | 1 |
| /audio/production/en-US/supplemental/loud-which-word-has-the-same-middle-sound-as-loud-e64e33e8e8.mp3 | loud. Which word has the same middle sound as loud? | 1 |
| /audio/production/en-US/supplemental/which-word-does-not-have-the-ow-as-in-cow-sound-f9c5e68b6c.mp3 | Which word does not have the ow (as in cow) sound? | 1 |
| /audio/production/en-US/supplemental/which-word-does-not-have-the-ow-as-in-snow-sound-4f42ef59a2.mp3 | Which word does not have the ow (as in snow) sound? | 2 |
| /audio/production/en-US/supplemental/cloud-which-letters-finish-the-word-cloud-c9cc6a3056.mp3 | cloud. Which letters finish the word cloud? | 1 |
| /audio/production/en-US/supplemental/house-which-letters-finish-the-word-house-db47cec7c0.mp3 | house. Which letters finish the word house? | 1 |
| /audio/production/en-US/supplemental/cow-which-word-has-the-same-middle-sound-as-cow-5eefa679b5.mp3 | cow. Which word has the same middle sound as cow? | 1 |
| /audio/production/en-US/supplemental/how-which-word-has-the-same-middle-sound-as-how-af20dc8e4c.mp3 | how. Which word has the same middle sound as how? | 1 |
| /audio/production/en-US/supplemental/which-word-does-not-have-the-ou-as-in-cloud-sound-446cfa64e2.mp3 | Which word does not have the ou (as in cloud) sound? | 2 |
| /audio/production/en-US/supplemental/coin-which-letters-finish-the-word-coin-dbea9837ef.mp3 | coin. Which letters finish the word coin? | 1 |
| /audio/production/en-US/supplemental/boil-which-letters-finish-the-word-boil-41d5a25484.mp3 | boil. Which letters finish the word boil? | 1 |
| /audio/production/en-US/supplemental/toy-which-word-has-the-same-middle-sound-as-toy-17dabc663c.mp3 | toy. Which word has the same middle sound as toy? | 1 |
| /audio/production/en-US/supplemental/boy-which-word-has-the-same-middle-sound-as-boy-78a46b8508.mp3 | boy. Which word has the same middle sound as boy? | 1 |
| /audio/production/en-US/supplemental/coin-which-is-the-real-way-to-write-coin-10e366a42f.mp3 | coin. Which is the real way to write coin? | 1 |
| /audio/production/en-US/supplemental/point-which-is-the-real-way-to-write-point-55be435fb9.mp3 | point. Which is the real way to write point? | 1 |
| /audio/production/en-US/supplemental/boy-which-letters-finish-the-word-boy-ea062df213.mp3 | boy. Which letters finish the word boy? | 1 |
| /audio/production/en-US/supplemental/joy-which-letters-finish-the-word-joy-5ec7b6f278.mp3 | joy. Which letters finish the word joy? | 1 |
| /audio/production/en-US/supplemental/coin-which-word-has-the-same-middle-sound-as-coin-826a94003e.mp3 | coin. Which word has the same middle sound as coin? | 1 |
| /audio/production/en-US/supplemental/oil-which-word-has-the-same-middle-sound-as-oil-eadb6a2ddf.mp3 | oil. Which word has the same middle sound as oil? | 1 |
| /audio/production/en-US/supplemental/boy-which-is-the-real-way-to-write-boy-0ec28167ad.mp3 | boy. Which is the real way to write boy? | 1 |
| /audio/production/en-US/supplemental/toy-which-is-the-real-way-to-write-toy-82e81ed9a1.mp3 | toy. Which is the real way to write toy? | 1 |
| /audio/production/en-US/supplemental/screw-which-letters-finish-the-word-screw-b37ab286fa.mp3 | screw. Which letters finish the word screw? | 1 |
| /audio/production/en-US/supplemental/chew-which-letters-finish-the-word-chew-14e11fa0e1.mp3 | chew. Which letters finish the word chew? | 1 |
| /audio/production/en-US/supplemental/moon-which-word-has-the-same-middle-sound-as-moon-adc2b18403.mp3 | moon. Which word has the same middle sound as moon? | 1 |
| /audio/production/en-US/supplemental/zoo-which-word-has-the-same-middle-sound-as-zoo-732ba4adcb.mp3 | zoo. Which word has the same middle sound as zoo? | 1 |
| /audio/production/en-US/supplemental/new-which-is-the-real-way-to-write-new-e730be284e.mp3 | new. Which is the real way to write new? | 1 |
| /audio/production/en-US/supplemental/grew-which-is-the-real-way-to-write-grew-d4982a189e.mp3 | grew. Which is the real way to write grew? | 1 |
| /audio/production/en-US/supplemental/yawn-which-letters-finish-the-word-yawn-87939c9c23.mp3 | yawn. Which letters finish the word yawn? | 1 |
| /audio/production/en-US/supplemental/ball-which-word-has-the-same-middle-sound-as-ball-627e4a4eb8.mp3 | ball. Which word has the same middle sound as ball? | 2 |
| /audio/production/en-US/supplemental/tall-which-word-has-the-same-middle-sound-as-tall-96059d7470.mp3 | tall. Which word has the same middle sound as tall? | 1 |
| /audio/production/en-US/supplemental/saw-which-is-the-real-way-to-write-saw-76d095770c.mp3 | saw. Which is the real way to write saw? | 1 |
| /audio/production/en-US/supplemental/claw-which-is-the-real-way-to-write-claw-5814b5b263.mp3 | claw. Which is the real way to write claw? | 1 |
| /audio/production/en-US/supplemental/tail-which-letters-finish-the-word-tail-fe9e6c45f9.mp3 | tail. Which letters finish the word tail? | 1 |
| /audio/production/en-US/supplemental/toast-which-letters-finish-the-word-toast-c4776e7285.mp3 | toast. Which letters finish the word toast? | 1 |
| /audio/production/en-US/supplemental/flew-which-word-has-the-same-middle-sound-as-flew-ce99e4d893.mp3 | flew. Which word has the same middle sound as flew? | 1 |
| /audio/production/en-US/supplemental/rain-which-is-the-real-way-to-write-rain-8c85bbae50.mp3 | rain. Which is the real way to write rain? | 1 |
| /audio/production/en-US/supplemental/road-which-letters-finish-the-word-road-78d8ab1db2.mp3 | road. Which letters finish the word road? | 1 |
| /audio/production/en-US/supplemental/joy-which-word-has-the-same-middle-sound-as-joy-556f1b5836.mp3 | joy. Which word has the same middle sound as joy? | 1 |
| /audio/production/en-US/supplemental/new-which-letters-finish-the-word-new-c6d7938df3.mp3 | new. Which letters finish the word new? | 1 |
| /audio/production/en-US/supplemental/crawl-which-letters-finish-the-word-crawl-8544739df4.mp3 | crawl. Which letters finish the word crawl? | 1 |

## 2. Sentence read-alouds — voice the … as a short pause

| File | Script | Used by |
|---|---|---|
| /audio/production/en-US/supplemental/the-soup-burned-my-lip-238a1addbd.mp3 | The … soup burned my lip. | 1 |
| /audio/production/en-US/supplemental/my-boots-let-the-rain-in-d4a0afa7e2.mp3 | My … boots let the rain in. | 1 |
| /audio/production/en-US/supplemental/the-box-needed-two-of-us-to-lift-61f6356b65.mp3 | The … box needed two of us to lift. | 1 |
| /audio/production/en-US/supplemental/we-squinted-in-the-sunshine-f226b4901c.mp3 | We squinted in the … sunshine. | 1 |
| /audio/production/en-US/supplemental/the-kitten-slept-through-the-storm-8a9c4f78d0.mp3 | The … kitten slept through the storm. | 1 |
| /audio/production/en-US/supplemental/her-scarf-trailed-on-the-ground-26afda0b3d.mp3 | Her … scarf trailed on the ground. | 1 |
| /audio/production/en-US/supplemental/the-path-was-after-days-of-rain-e2ea094084.mp3 | The path was … after days of rain. | 1 |
| /audio/production/en-US/supplemental/the-lemonade-was-and-made-our-mouths-pucker-e62b6ed7ba.mp3 | The lemonade was … and made our mouths pucker. | 1 |
| /audio/production/en-US/supplemental/the-old-stairs-were-and-groaned-under-our-feet-d29abb188e.mp3 | The old stairs were … and groaned under our feet. | 1 |
| /audio/production/en-US/supplemental/wear-the-coat-it-is-snowing-hard-a14d638ff7.mp3 | Wear the … coat — it is snowing hard. | 1 |
| /audio/production/en-US/supplemental/the-knife-went-through-the-pumpkin-easily-270037f215.mp3 | The … knife went through the pumpkin easily. | 1 |
| /audio/production/en-US/supplemental/our-tent-felt-with-five-of-us-in-it-d9fd3661fc.mp3 | Our tent felt … with five of us in it. | 1 |
| /audio/production/en-US/supplemental/the-sea-tossed-the-little-boat-20fbf95d5b.mp3 | The … sea tossed the little boat. | 1 |
| /audio/production/en-US/supplemental/a-morning-is-best-for-kites-b4e2717998.mp3 | A … morning is best for kites. | 1 |
| /audio/production/en-US/supplemental/the-floor-squeaked-with-every-step-f1223f44b2.mp3 | The … floor squeaked with every step. | 1 |
| /audio/production/en-US/supplemental/the-rope-was-too-to-snap-299ac51cf4.mp3 | The rope was too … to snap. | 1 |
| /audio/production/en-US/supplemental/the-moth-circled-the-lamp-f80e56b0e5.mp3 | The … moth circled the lamp. | 1 |
| /audio/production/en-US/supplemental/the-kitten-is-tame-the-tiger-is-1c5c392411.mp3 | The kitten is tame. The tiger is …. | 1 |
| /audio/production/en-US/supplemental/this-puzzle-is-simple-its-opposite-is-fae48980a4.mp3 | This puzzle is simple. Its opposite is …. | 1 |
| /audio/production/en-US/supplemental/the-mouse-is-not-just-small-it-is-7020fd78f5.mp3 | The mouse is not just small. It is …. | 1 |
| /audio/production/en-US/supplemental/not-just-cold-the-pond-was-this-morning-5217bdd8eb.mp3 | Not just cold — the pond was … this morning. | 1 |
| /audio/production/en-US/supplemental/the-morning-was-noisy-the-night-was-5c16c4f070.mp3 | The morning was noisy. The night was …. | 1 |
| /audio/production/en-US/supplemental/this-bag-is-heavy-that-bag-is-4a47be3c5f.mp3 | This bag is heavy. That bag is …. | 1 |
| /audio/production/en-US/supplemental/the-turtle-is-slow-the-hare-is-9929cb678a.mp3 | The turtle is slow. The hare is …. | 1 |
| /audio/production/en-US/supplemental/my-hands-were-dirty-now-they-are-6fb56df655.mp3 | My hands were dirty. Now they are …. | 1 |
| /audio/production/en-US/supplemental/dad-fixed-the-gate-in-the-same-way-he-the-fence-1e24c0e298.mp3 | Dad fixed the gate. In the same way, he … the fence. | 1 |
| /audio/production/en-US/supplemental/the-soup-was-tasty-its-twin-word-is-35f09c9bd7.mp3 | The soup was tasty. Its twin word is …. | 1 |
| /audio/production/en-US/supplemental/we-shouted-with-joy-joy-s-twin-word-is-77419119d7.mp3 | We shouted with joy. Joy's twin word is …. | 1 |
| /audio/production/en-US/supplemental/the-path-was-narrow-its-twin-word-is-4a47ba5446.mp3 | The path was narrow. Its twin word is …. | 1 |
| /audio/production/en-US/supplemental/the-oven-is-hot-the-fridge-is-52428feed2.mp3 | The oven is hot. The fridge is …. | 1 |
| /audio/production/en-US/supplemental/the-old-map-was-torn-it-was-0d7189a7af.mp3 | The old map was torn. It was …. | 1 |
| /audio/production/en-US/supplemental/i-see-red-hen-a009490a66.mp3 | I see … red hen. | 1 |
| /audio/production/en-US/supplemental/we-had-nap-at-two-4664ccd7c7.mp3 | We had … nap at two. | 1 |
| /audio/production/en-US/supplemental/we-have-both-jam-bread-6aac1d0116.mp3 | We have both jam … bread. | 1 |
| /audio/production/en-US/supplemental/she-has-both-a-cat-a-dog-6731694532.mp3 | She has both a cat … a dog. | 1 |
| /audio/production/en-US/supplemental/the-pigs-in-the-mud-835b0a9cb8.mp3 | The pigs … in the mud. | 1 |
| /audio/production/en-US/supplemental/you-my-best-pal-b25fc6066c.mp3 | You … my best pal. | 1 |
| /audio/production/en-US/supplemental/it-is-big-a-bus-274a10c4cd.mp3 | It is big … a bus. | 1 |
| /audio/production/en-US/supplemental/sam-is-fast-a-fox-80cb10c6de.mp3 | Sam is fast … a fox. | 1 |
| /audio/production/en-US/supplemental/we-nap-two-e88a5e10ef.mp3 | We nap … two. | 1 |
| /audio/production/en-US/supplemental/the-bus-stops-my-home-d48c5b8024.mp3 | The bus stops … my home. | 1 |
| /audio/production/en-US/supplemental/you-can-my-helper-a5623b9c69.mp3 | You can … my helper. | 1 |
| /audio/production/en-US/supplemental/it-will-hot-at-two-395bd7e5fb.mp3 | It will … hot at two. | 1 |
| /audio/production/en-US/supplemental/i-made-this-gift-you-ca82eaf7ae.mp3 | I made this gift … you. | 1 |
| /audio/production/en-US/supplemental/we-cheered-our-team-e9cf768d28.mp3 | We cheered … our team. | 1 |
| /audio/production/en-US/supplemental/gran-sent-the-card-her-house-71e4aef0ed.mp3 | Gran sent the card … her house. | 1 |
| /audio/production/en-US/supplemental/he-came-home-the-park-d7807e4e1f.mp3 | He came home … the park. | 1 |
| /audio/production/en-US/supplemental/we-ten-hens-a56a42d67a.mp3 | We … ten hens. | 1 |
| /audio/production/en-US/supplemental/they-a-big-red-van-fcc149072d.mp3 | They … a big red van. | 1 |
| /audio/production/en-US/supplemental/dad-is-tall-has-big-boots-032a253f13.mp3 | Dad is tall. … has big boots. | 1 |
| /audio/production/en-US/supplemental/ben-naps-is-in-bed-ab0ac1b79c.mp3 | Ben naps. … is in bed. | 1 |
| /audio/production/en-US/supplemental/sam-hurt-leg-5253e16270.mp3 | Sam hurt … leg. | 1 |
| /audio/production/en-US/supplemental/the-dog-wags-tail-d576382b49.mp3 | The dog wags … tail. | 1 |
| /audio/production/en-US/supplemental/mom-and-bake-buns-6968a4eb8f.mp3 | Mom and … bake buns. | 1 |
| /audio/production/en-US/supplemental/am-ready-for-my-turn-b0a6cdff57.mp3 | … am ready for my turn. | 1 |
| /audio/production/en-US/supplemental/the-jam-is-the-jar-4d2428c446.mp3 | The jam is … the jar. | 1 |
| /audio/production/en-US/supplemental/the-fish-swim-the-sea-036268b419.mp3 | The fish swim … the sea. | 1 |
| /audio/production/en-US/supplemental/the-sun-hot-adbad7ba36.mp3 | The sun … hot. | 1 |
| /audio/production/en-US/supplemental/my-cup-full-addf4115fe.mp3 | My cup … full. | 1 |
| /audio/production/en-US/supplemental/the-egg-fell-has-a-crack-b7b8f1e544.mp3 | The egg fell. … has a crack. | 1 |
| /audio/production/en-US/supplemental/i-like-the-hat-is-red-a37563649b.mp3 | I like the hat. … is red. | 1 |
| /audio/production/en-US/supplemental/i-want-a-cup-milk-4e71627bfe.mp3 | I want a cup … milk. | 1 |
| /audio/production/en-US/supplemental/that-is-a-map-the-zoo-d6dcb8fafd.mp3 | That is a map … the zoo. | 1 |
| /audio/production/en-US/supplemental/the-cat-naps-the-rug-da1dd4a7ca.mp3 | The cat naps … the rug. | 1 |
| /audio/production/en-US/supplemental/put-the-lid-the-pot-7fc85bd49f.mp3 | Put the lid … the pot. | 1 |
| /audio/production/en-US/supplemental/see-ship-far-far-out-8bd0e480c5.mp3 | See … ship far, far out? | 1 |
| /audio/production/en-US/supplemental/i-sang-song-long-ago-4b1831e2ac.mp3 | I sang … song long ago. | 1 |
| /audio/production/en-US/supplemental/look-at-big-red-sun-b649584e39.mp3 | Look at … big red sun! | 1 |
| /audio/production/en-US/supplemental/we-fed-hens-at-six-31c3563080.mp3 | We fed … hens at six. | 1 |
| /audio/production/en-US/supplemental/the-pigs-sat-are-muddy-ae40568db5.mp3 | The pigs sat. … are muddy! | 1 |
| /audio/production/en-US/supplemental/my-socks-are-wet-bbf80ae80b.mp3 | My socks? … are wet. | 1 |
| /audio/production/en-US/supplemental/look-at-bug-on-my-hand-40559938f5.mp3 | Look at … bug on my hand! | 1 |
| /audio/production/en-US/supplemental/hat-here-is-mine-fbb887d408.mp3 | … hat here is mine. | 1 |
| /audio/production/en-US/supplemental/we-go-the-park-9e5b86c4d7.mp3 | We go … the park. | 1 |
| /audio/production/en-US/supplemental/i-gave-the-pen-ben-8c3cee7cad.mp3 | I gave the pen … Ben. | 1 |
| /audio/production/en-US/supplemental/yesterday-the-cat-on-the-bed-08155990c8.mp3 | Yesterday the cat … on the bed. | 1 |
| /audio/production/en-US/supplemental/yesterday-the-milk-cold-8a8134910d.mp3 | Yesterday the milk … cold. | 1 |
| /audio/production/en-US/supplemental/i-hop-my-dog-6b748d268b.mp3 | I hop … my dog. | 1 |
| /audio/production/en-US/supplemental/she-sang-me-at-camp-661946b2e2.mp3 | She sang … me at camp. | 1 |
| /audio/production/en-US/supplemental/are-my-best-pal-94d9d4bd33.mp3 | … are my best pal. | 1 |
| /audio/production/en-US/supplemental/can-see-the-big-top-04cf537164.mp3 | Can … see the big top? | 1 |
| /audio/production/en-US/supplemental/he-has-pet-rat-82cbf70ee2.mp3 | He has … pet rat. | 1 |
| /audio/production/en-US/supplemental/i-met-vet-today-0df3ecf538.mp3 | I met … vet today. | 1 |
| /audio/production/en-US/supplemental/six-ten-make-sixteen-cc6665a93b.mp3 | Six … ten make sixteen. | 1 |
| /audio/production/en-US/supplemental/mum-gran-sat-down-429b640741.mp3 | Mum … Gran sat down. | 1 |
| /audio/production/en-US/supplemental/the-cubs-so-soft-d18d291d7d.mp3 | The cubs … so soft. | 1 |
| /audio/production/en-US/supplemental/my-hands-cold-b9420a4fd4.mp3 | My hands … cold. | 1 |
| /audio/production/en-US/supplemental/he-is-fast-a-jet-c0dbf605f0.mp3 | He is fast … a jet. | 1 |
| /audio/production/en-US/supplemental/it-is-cold-ice-273854781c.mp3 | It is cold … ice. | 1 |
| /audio/production/en-US/supplemental/we-met-the-pond-e8ea362bf1.mp3 | We met … the pond. | 1 |
| /audio/production/en-US/supplemental/look-my-sandcastle-e4b7000485.mp3 | Look … my sandcastle! | 1 |
| /audio/production/en-US/supplemental/dad-will-back-soon-8546c085d0.mp3 | Dad will … back soon. | 1 |
| /audio/production/en-US/supplemental/it-can-windy-up-here-f841984940.mp3 | It can … windy up here. | 1 |
| /audio/production/en-US/supplemental/this-bun-is-gran-648c001532.mp3 | This bun is … Gran. | 1 |
| /audio/production/en-US/supplemental/we-sang-the-class-51e1b97e6d.mp3 | We sang … the class. | 1 |
| /audio/production/en-US/supplemental/the-gift-came-gramps-4abb9d853c.mp3 | The gift came … Gramps. | 1 |
| /audio/production/en-US/supplemental/milk-comes-cows-052de37a45.mp3 | Milk comes … cows. | 1 |
| /audio/production/en-US/supplemental/the-twins-red-hats-9d765556ee.mp3 | The twins … red hats. | 1 |
| /audio/production/en-US/supplemental/we-six-eggs-left-be04f0cd63.mp3 | We … six eggs left. | 1 |
| /audio/production/en-US/supplemental/gramps-naps-when-can-c78548bd93.mp3 | Gramps naps when … can. | 1 |
| /audio/production/en-US/supplemental/tom-grins-when-wins-168d4b4b8b.mp3 | Tom grins when … wins. | 1 |
| /audio/production/en-US/supplemental/dan-lost-left-sock-b77668a668.mp3 | Dan lost … left sock. | 1 |
| /audio/production/en-US/supplemental/the-king-sat-on-throne-ca97974b27.mp3 | The king sat on … throne. | 1 |
| /audio/production/en-US/supplemental/mum-and-swim-on-sundays-fc8f815b15.mp3 | Mum and … swim on Sundays. | 1 |
| /audio/production/en-US/supplemental/may-pet-the-pup-6971860e59.mp3 | May … pet the pup? | 1 |
| /audio/production/en-US/supplemental/the-frogs-hop-the-pond-8c203ef0e4.mp3 | The frogs hop … the pond. | 1 |
| /audio/production/en-US/supplemental/pop-the-coins-the-tin-4a36fc09fa.mp3 | Pop the coins … the tin. | 1 |
| /audio/production/en-US/supplemental/the-soup-hot-d7915347d0.mp3 | The soup … hot. | 1 |
| /audio/production/en-US/supplemental/my-bike-new-19ba03dd67.mp3 | My bike … new. | 1 |
| /audio/production/en-US/supplemental/the-nest-sits-up-high-f737a904d3.mp3 | The nest? … sits up high. | 1 |
| /audio/production/en-US/supplemental/grab-the-rope-and-pull-4ab13c867e.mp3 | Grab the rope and pull …! | 1 |
| /audio/production/en-US/supplemental/i-had-a-mug-milk-8baa5de0e3.mp3 | I had a mug … milk. | 1 |
| /audio/production/en-US/supplemental/here-is-a-box-pins-7f2a6d970f.mp3 | Here is a box … pins. | 1 |
| /audio/production/en-US/supplemental/the-clock-hangs-the-wall-627e24703b.mp3 | The clock hangs … the wall. | 1 |
| /audio/production/en-US/supplemental/hop-the-bus-quick-0c5a398872.mp3 | Hop … the bus, quick! | 1 |
| /audio/production/en-US/supplemental/who-left-mess-there-ef3e36ec7f.mp3 | Who left … mess there? | 1 |
| /audio/production/en-US/supplemental/i-drew-map-myself-1841ea6d42.mp3 | I drew … map myself. | 1 |
| /audio/production/en-US/supplemental/shut-gate-please-2eec9a6fa0.mp3 | Shut … gate, please. | 1 |
| /audio/production/en-US/supplemental/feed-fish-at-nine-7201124b27.mp3 | Feed … fish at nine. | 1 |
| /audio/production/en-US/supplemental/the-elves-hid-well-ff175dc116.mp3 | The elves? … hid well. | 1 |
| /audio/production/en-US/supplemental/my-boots-got-wet-129771d9b7.mp3 | My boots? … got wet. | 1 |
| /audio/production/en-US/supplemental/smell-rose-right-here-bf04fb331d.mp3 | Smell … rose right here. | 1 |
| /audio/production/en-US/supplemental/hold-end-of-the-rope-23f53bc3ac.mp3 | Hold … end of the rope. | 1 |
| /audio/production/en-US/supplemental/we-row-the-dock-68e6c3f9d4.mp3 | We row … the dock. | 1 |
| /audio/production/en-US/supplemental/pass-the-jam-gran-1f13e5cef6.mp3 | Pass the jam … Gran. | 1 |
| /audio/production/en-US/supplemental/the-soup-too-hot-b6bb9a8def.mp3 | The soup … too hot. | 1 |
| /audio/production/en-US/supplemental/the-trip-so-much-fun-04dee1f59b.mp3 | The trip … so much fun. | 1 |
| /audio/production/en-US/supplemental/come-camp-us-1771f88219.mp3 | Come camp … us! | 1 |
| /audio/production/en-US/supplemental/mix-the-eggs-a-fork-1e9579c9c4.mp3 | Mix the eggs … a fork. | 1 |
| /audio/production/en-US/supplemental/did-see-the-comet-6daeef967a.mp3 | Did … see the comet? | 1 |
| /audio/production/en-US/supplemental/i-made-this-card-for-365b744a45.mp3 | I made this card for …. | 1 |
| /audio/production/en-US/supplemental/she-fed-small-lamb-a903996334.mp3 | She fed … small lamb. | 1 |
| /audio/production/en-US/supplemental/i-baked-this-dad-f165d0f92e.mp3 | I baked this … Dad. | 1 |
| /audio/production/en-US/supplemental/the-pond-full-of-frogs-3711d55cab.mp3 | The pond … full of frogs. | 1 |
| /audio/production/en-US/supplemental/the-ducks-swam-off-d06742eca3.mp3 | The ducks? … swam off. | 1 |
| /audio/production/en-US/supplemental/sweep-steps-please-773c6efab7.mp3 | Sweep … steps, please. | 1 |
| /audio/production/en-US/supplemental/can-lift-this-log-802ebd71d8.mp3 | Can … lift this log? | 1 |
| /audio/production/en-US/supplemental/we-hid-the-rain-9cd3c42ae4.mp3 | We hid … the rain. | 1 |
| /audio/production/en-US/supplemental/bob-packs-own-lunch-e21f520f8b.mp3 | Bob packs … own lunch. | 1 |
| /audio/production/en-US/supplemental/she-fed-of-the-cats-01093a16bf.mp3 | She fed … of the cats. | 1 |
| /audio/production/en-US/supplemental/he-drank-the-milk-the-jug-is-empty-15067a174f.mp3 | He drank … the milk. The jug is empty! | 1 |
| /audio/production/en-US/supplemental/i-ate-egg-fb4be36d7e.mp3 | I ate … egg. | 1 |
| /audio/production/en-US/supplemental/she-saw-owl-at-dusk-15ccf6c0d5.mp3 | She saw … owl at dusk. | 1 |
| /audio/production/en-US/supplemental/i-ran-fast-i-missed-the-bus-47b5780dd9.mp3 | I ran fast, … I missed the bus. | 1 |
| /audio/production/en-US/supplemental/the-sun-is-out-it-is-cold-de9f11e456.mp3 | The sun is out, … it is cold. | 1 |
| /audio/production/en-US/supplemental/the-nest-is-the-gate-5ee8e4505f.mp3 | The nest is … the gate. | 1 |
| /audio/production/en-US/supplemental/we-sat-the-pond-d50e0bc1e7.mp3 | We sat … the pond. | 1 |
| /audio/production/en-US/supplemental/you-hop-like-a-frog-21ecee9421.mp3 | … you hop like a frog? | 1 |
| /audio/production/en-US/supplemental/the-twins-swim-fast-f4d26861d6.mp3 | The twins … swim fast. | 1 |
| /audio/production/en-US/supplemental/you-like-plums-da997d2abf.mp3 | … you like plums? | 1 |
| /audio/production/en-US/supplemental/what-cows-eat-00f5486c3b.mp3 | What … cows eat? | 1 |
| /audio/production/en-US/supplemental/kid-got-a-badge-475ea0e9c3.mp3 | … kid got a badge. | 1 |
| /audio/production/en-US/supplemental/put-a-cup-at-desk-31e6465dae.mp3 | Put a cup at … desk. | 1 |
| /audio/production/en-US/supplemental/last-week-we-a-picnic-399bbcd7b7.mp3 | Last week we … a picnic. | 1 |
| /audio/production/en-US/supplemental/gran-six-cats-long-ago-74df0bb490.mp3 | Gran … six cats long ago. | 1 |
| /audio/production/en-US/supplemental/do-you-make-jam-4a727743e7.mp3 | … do you make jam? | 1 |
| /audio/production/en-US/supplemental/tell-me-the-trick-works-27e003a82f.mp3 | Tell me … the trick works. | 1 |
| /audio/production/en-US/supplemental/ask-me-you-get-stuck-e72f03aaae.mp3 | Ask me … you get stuck. | 1 |
| /audio/production/en-US/supplemental/it-rains-we-stay-in-31c027638d.mp3 | … it rains, we stay in. | 1 |
| /audio/production/en-US/supplemental/the-sums-are-hard-they-are-easy-c94905a0ed.mp3 | The sums are … hard — they are easy! | 1 |
| /audio/production/en-US/supplemental/that-is-my-hat-70da3aa31b.mp3 | That is … my hat! | 1 |
| /audio/production/en-US/supplemental/i-have-just-wish-8c16c79478.mp3 | I have just … wish. | 1 |
| /audio/production/en-US/supplemental/duck-swam-off-two-stayed-666418c12d.mp3 | … duck swam off; two stayed. | 1 |
| /audio/production/en-US/supplemental/do-you-want-jam-ham-1c2d4ed9a0.mp3 | Do you want jam … ham? | 1 |
| /audio/production/en-US/supplemental/is-the-cup-full-empty-875be8cf18.mp3 | Is the cup full … empty? | 1 |
| /audio/production/en-US/supplemental/mum-we-can-camp-c5103533da.mp3 | Mum … we can camp! | 1 |
| /audio/production/en-US/supplemental/dad-yes-at-last-45ff17cde1.mp3 | Dad … yes at last. | 1 |
| /audio/production/en-US/supplemental/my-aunt-naps-when-can-72a53749a6.mp3 | My aunt naps when … can. | 1 |
| /audio/production/en-US/supplemental/gran-hums-as-bakes-53eb5a0777.mp3 | Gran hums as … bakes. | 1 |
| /audio/production/en-US/supplemental/the-twins-lost-kite-0a436f212f.mp3 | The twins lost … kite. | 1 |
| /audio/production/en-US/supplemental/the-cubs-drank-milk-802fb519c8.mp3 | The cubs drank … milk. | 1 |
| /audio/production/en-US/supplemental/look-the-bus-is-over-5cfda9dad1.mp3 | Look — the bus is over …! | 1 |
| /audio/production/en-US/supplemental/we-got-just-in-time-43461270bd.mp3 | We got … just in time. | 1 |
| /audio/production/en-US/supplemental/the-key-to-open-the-box-99d911bc0f.mp3 | … the key to open the box. | 1 |
| /audio/production/en-US/supplemental/we-mud-to-make-bricks-4535fc56fa.mp3 | We … mud to make bricks. | 1 |
| /audio/production/en-US/supplemental/sis-and-i-hid-both-grinned-8382867886.mp3 | Sis and I hid. … both grinned. | 1 |
| /audio/production/en-US/supplemental/dad-and-i-fish-catch-cod-77b9e2ea6a.mp3 | Dad and I fish. … catch cod! | 1 |
| /audio/production/en-US/supplemental/the-shops-shut-at-ten-cd427aede5.mp3 | The shops … shut at ten. | 1 |
| /audio/production/en-US/supplemental/you-so-brave-at-the-vet-8aa72406ad.mp3 | You … so brave at the vet! | 1 |
| /audio/production/en-US/supplemental/is-in-the-big-box-9d5229c6dd.mp3 | … is in the big box? | 1 |
| /audio/production/en-US/supplemental/guess-i-made-for-you-42edb5adf3.mp3 | Guess … I made for you! | 1 |
| /audio/production/en-US/supplemental/does-the-show-start-8fa6d4f94f.mp3 | … does the show start? | 1 |
| /audio/production/en-US/supplemental/i-clap-you-sing-bbb9106906.mp3 | I clap … you sing. | 1 |
| /audio/production/en-US/supplemental/hat-is-yours-red-or-blue-fca663aec5.mp3 | … hat is yours — red or blue? | 1 |
| /audio/production/en-US/supplemental/tell-me-pup-you-like-best-65b17d3e0d.mp3 | Tell me … pup you like best. | 1 |
| /audio/production/en-US/supplemental/we-read-six-new-today-41af4d0787.mp3 | We read six new … today. | 1 |
| /audio/production/en-US/supplemental/big-can-be-fun-to-spell-9762f73f65.mp3 | Big … can be fun to spell. | 1 |
| /audio/production/en-US/supplemental/is-this-scarf-b526261baf.mp3 | Is this … scarf? | 1 |
| /audio/production/en-US/supplemental/pack-bags-for-camp-e1fa6e80b9.mp3 | Pack … bags for camp. | 1 |
| /audio/production/en-US/supplemental/we-ate-the-grapes-556a695f67.mp3 | We ate … the grapes. | 1 |
| /audio/production/en-US/supplemental/my-pens-ran-out-b2a2390498.mp3 | … my pens ran out. | 1 |
| /audio/production/en-US/supplemental/he-fed-ox-at-the-farm-8965f38cf7.mp3 | He fed … ox at the farm. | 1 |
| /audio/production/en-US/supplemental/i-need-extra-bed-4c54e0d5d9.mp3 | I need … extra bed. | 1 |
| /audio/production/en-US/supplemental/i-tried-i-slipped-2a52f9b83a.mp3 | I tried, … I slipped. | 1 |
| /audio/production/en-US/supplemental/small-strong-8a9af89674.mp3 | Small … strong! | 1 |
| /audio/production/en-US/supplemental/stand-the-door-please-907a57eb1c.mp3 | Stand … the door, please. | 1 |
| /audio/production/en-US/supplemental/the-mill-sits-a-stream-a9c3fbb1dd.mp3 | The mill sits … a stream. | 1 |
| /audio/production/en-US/supplemental/foxes-jump-high-27256a2ca1.mp3 | Foxes … jump high. | 1 |
| /audio/production/en-US/supplemental/we-camp-out-back-7fd3008984.mp3 | … we camp out back? | 1 |
| /audio/production/en-US/supplemental/frogs-sleep-in-mud-115055a7f8.mp3 | … frogs sleep in mud? | 1 |
| /audio/production/en-US/supplemental/we-sums-after-lunch-bc8824d08e.mp3 | We … sums after lunch. | 1 |
| /audio/production/en-US/supplemental/give-hen-some-corn-b6e9a0e494.mp3 | Give … hen some corn. | 1 |
| /audio/production/en-US/supplemental/box-has-a-lid-3223a1419f.mp3 | … box has a lid. | 1 |
| /audio/production/en-US/supplemental/we-fun-at-the-fair-66572d6644.mp3 | We … fun at the fair. | 1 |
| /audio/production/en-US/supplemental/the-pup-my-sock-6284d3ce36.mp3 | The pup … my sock! | 1 |
| /audio/production/en-US/supplemental/do-bees-make-honey-0786a9b7bb.mp3 | … do bees make honey? | 1 |
| /audio/production/en-US/supplemental/show-me-to-knit-6585bcab73.mp3 | Show me … to knit. | 1 |
| /audio/production/en-US/supplemental/yell-you-spot-land-04cbe30128.mp3 | Yell … you spot land! | 1 |
| /audio/production/en-US/supplemental/ask-dad-we-may-go-ef6ee5c8c2.mp3 | Ask Dad … we may go. | 1 |
| /audio/production/en-US/supplemental/that-is-my-cup-fcd2f017d4.mp3 | That is … my cup. | 1 |
| /audio/production/en-US/supplemental/do-wake-the-baby-3d75efe60a.mp3 | Do … wake the baby! | 1 |
| /audio/production/en-US/supplemental/just-more-lap-to-run-aa6a508cd0.mp3 | Just … more lap to run! | 1 |
| /audio/production/en-US/supplemental/star-shone-first-b613d0319d.mp3 | … star shone first. | 1 |
| /audio/production/en-US/supplemental/milk-water-with-lunch-e1d8bd77ff.mp3 | Milk … water with lunch? | 1 |
| /audio/production/en-US/supplemental/walk-ride-you-pick-85f18ff859.mp3 | Walk … ride — you pick. | 1 |
| /audio/production/en-US/supplemental/the-vet-to-rest-the-pup-46deafeaed.mp3 | The vet … to rest the pup. | 1 |
| /audio/production/en-US/supplemental/gran-bedtime-is-nine-62fe794261.mp3 | Gran … bedtime is nine. | 1 |
| /audio/production/en-US/supplemental/may-join-our-team-ac02a9d55c.mp3 | May … join our team? | 1 |
| /audio/production/en-US/supplemental/dug-up-a-gem-e8b3652394.mp3 | … dug up a gem! | 1 |
| /audio/production/en-US/supplemental/the-bees-kept-honey-safe-88a0ba71ba.mp3 | The bees kept … honey safe. | 1 |
| /audio/production/en-US/supplemental/the-kids-lost-ball-again-43a1f5d009.mp3 | The kids lost … ball again. | 1 |
| /audio/production/en-US/supplemental/park-the-bikes-over-07debdd812.mp3 | Park the bikes over …. | 1 |
| /audio/production/en-US/supplemental/is-anybody-ffe0ce2027.mp3 | Is anybody …? | 1 |
| /audio/production/en-US/supplemental/both-hands-to-lift-it-6e51a0c65e.mp3 | … both hands to lift it. | 1 |
| /audio/production/en-US/supplemental/we-twigs-for-the-nest-c4d2a8f41c.mp3 | We … twigs for the nest. | 1 |
| /audio/production/en-US/supplemental/can-bake-a-plum-pie-8ec43da954.mp3 | Can … bake a plum pie? | 1 |
| /audio/production/en-US/supplemental/swam-till-six-10ab6ae989.mp3 | … swam till six. | 1 |
| /audio/production/en-US/supplemental/the-socks-still-damp-187f676f33.mp3 | The socks … still damp. | 1 |
| /audio/production/en-US/supplemental/you-fast-today-b34cd92b3a.mp3 | You … fast today! | 1 |
| /audio/production/en-US/supplemental/fell-off-the-shelf-ad2ef0d6e2.mp3 | … fell off the shelf? | 1 |
| /audio/production/en-US/supplemental/guess-i-found-8e99600226.mp3 | Guess … I found! | 1 |
| /audio/production/en-US/supplemental/does-the-pool-open-45fc1ac3da.mp3 | … does the pool open? | 1 |
| /audio/production/en-US/supplemental/clap-the-song-ends-c7f6fcb274.mp3 | Clap … the song ends. | 1 |
| /audio/production/en-US/supplemental/sock-is-mine-1731a63cc7.mp3 | … sock is mine? | 1 |
| /audio/production/en-US/supplemental/pick-game-we-play-13d532b40b.mp3 | Pick … game we play. | 1 |
| /audio/production/en-US/supplemental/rhyming-end-the-same-c540eaf24e.mp3 | Rhyming … end the same. | 1 |
| /audio/production/en-US/supplemental/long-need-long-tiles-65046cbbfc.mp3 | Long … need long tiles. | 1 |
| /audio/production/en-US/supplemental/tie-laces-up-tight-7006ac980e.mp3 | Tie … laces up tight. | 1 |
| /audio/production/en-US/supplemental/bring-kit-on-monday-793b189863.mp3 | Bring … kit on Monday. | 1 |
| /audio/production/en-US/supplemental/the-coach-to-rest-up-6006e64a51.mp3 | The coach … to rest up. | 1 |
| /audio/production/en-US/supplemental/the-ants-built-nest-fast-f7698d73b3.mp3 | The ants built … nest fast. | 1 |
| /audio/production/en-US/supplemental/the-buns-still-warm-f07a7eb0bf.mp3 | The buns … still warm. | 1 |
| /audio/production/en-US/supplemental/just-bun-is-left-5f1948fb81.mp3 | Just … bun is left. | 1 |
| /audio/production/en-US/supplemental/sit-by-the-window-6a17e9ba6a.mp3 | Sit … by the window. | 1 |
| /audio/production/en-US/supplemental/who-that-5bf85e6182.mp3 | Who … that? | 1 |
| /audio/production/en-US/supplemental/crabs-nip-take-care-7a71fae973.mp3 | Crabs … nip — take care! | 1 |
| /audio/production/en-US/supplemental/is-this-pen-or-mine-927fe5be60.mp3 | Is this … pen or mine? | 1 |
| /audio/production/en-US/supplemental/this-book-is-ants-343434a649.mp3 | This book is … ants. | 1 |
| /audio/production/en-US/supplemental/tell-me-the-trip-f2d8fe98d2.mp3 | Tell me … the trip! | 1 |
| /audio/production/en-US/supplemental/may-we-to-the-fair-632b88192f.mp3 | May we … to the fair? | 1 |
| /audio/production/en-US/supplemental/the-vans-up-the-hill-811f3f182f.mp3 | The vans … up the hill. | 1 |
| /audio/production/en-US/supplemental/my-bike-a-bell-585effdfb2.mp3 | My bike … a bell. | 1 |
| /audio/production/en-US/supplemental/ren-two-pet-mice-826e4a27f7.mp3 | Ren … two pet mice. | 1 |
| /audio/production/en-US/supplemental/meg-lost-mitten-eefaa77392.mp3 | Meg lost … mitten. | 1 |
| /audio/production/en-US/supplemental/gran-naps-in-chair-0a50a724ae.mp3 | Gran naps in … chair. | 1 |
| /audio/production/en-US/supplemental/dad-waved-so-i-waved-at-9b0c297b62.mp3 | Dad waved, so I waved at …. | 1 |
| /audio/production/en-US/supplemental/tom-fell-help-up-aa07ccafd9.mp3 | Tom fell — help … up! | 1 |
| /audio/production/en-US/supplemental/the-frog-hopped-the-pond-c07f9fa63e.mp3 | The frog hopped … the pond. | 1 |
| /audio/production/en-US/supplemental/pour-the-milk-the-jug-f469d66c89.mp3 | Pour the milk … the jug. | 1 |
| /audio/production/en-US/supplemental/i-plums-best-of-all-caae6fe16f.mp3 | I … plums best of all. | 1 |
| /audio/production/en-US/supplemental/clouds-can-look-sheep-b8cc966d95.mp3 | Clouds can look … sheep. | 1 |
| /audio/production/en-US/supplemental/at-the-double-rainbow-1dcd981deb.mp3 | … at the double rainbow! | 1 |
| /audio/production/en-US/supplemental/we-for-shells-at-the-beach-84f2294922.mp3 | We … for shells at the beach. | 1 |
| /audio/production/en-US/supplemental/let-s-a-mud-pie-eda37d947c.mp3 | Let's … a mud pie! | 1 |
| /audio/production/en-US/supplemental/bees-wax-and-honey-8bf00c66af.mp3 | Bees … wax and honey. | 1 |
| /audio/production/en-US/supplemental/hands-make-light-work-780e2ca050.mp3 | … hands make light work. | 1 |
| /audio/production/en-US/supplemental/how-eggs-are-left-fa61973111.mp3 | How … eggs are left? | 1 |
| /audio/production/en-US/supplemental/may-i-have-peas-please-168e5dc137.mp3 | May I have … peas, please? | 1 |
| /audio/production/en-US/supplemental/this-box-holds-than-that-one-bb23d9b9fc.mp3 | This box holds … than that one. | 1 |
| /audio/production/en-US/supplemental/one-mitten-is-dry-my-mitten-is-lost-721fd34210.mp3 | One mitten is dry. My … mitten is lost. | 1 |
| /audio/production/en-US/supplemental/try-your-hand-984ec88300.mp3 | Try your … hand. | 1 |
| /audio/production/en-US/supplemental/the-cat-ran-of-the-shed-f69412b9cd.mp3 | The cat ran … of the shed. | 1 |
| /audio/production/en-US/supplemental/turn-the-lamp-at-nine-d03df72991.mp3 | Turn the lamp … at nine. | 1 |
| /audio/production/en-US/supplemental/owls-can-well-at-night-db3e71d677.mp3 | Owls can … well at night. | 1 |
| /audio/production/en-US/supplemental/come-and-my-fort-6895d2c6c3.mp3 | Come and … my fort! | 1 |
| /audio/production/en-US/supplemental/the-tea-was-hot-i-let-it-cool-9f29c0ddf8.mp3 | The tea was hot, … I let it cool. | 1 |
| /audio/production/en-US/supplemental/that-joke-is-funny-795f59f07c.mp3 | That joke is … funny! | 1 |
| /audio/production/en-US/supplemental/save-cake-for-gran-7878bc18d6.mp3 | Save … cake for Gran. | 1 |
| /audio/production/en-US/supplemental/birds-sing-at-dawn-98f9c3c689.mp3 | … birds sing at dawn. | 1 |
| /audio/production/en-US/supplemental/the-cups-i-washed-all-065d12a6f4.mp3 | The cups? I washed … all. | 1 |
| /audio/production/en-US/supplemental/find-the-twins-and-tell-to-come-70cdd416dd.mp3 | Find the twins and tell … to come. | 1 |
| /audio/production/en-US/supplemental/we-swam-we-had-lunch-706e6d03a9.mp3 | We swam, … we had lunch. | 1 |
| /audio/production/en-US/supplemental/first-mix-bake-8b96c0961c.mp3 | First mix, … bake. | 1 |
| /audio/production/en-US/supplemental/boots-here-are-muddy-65dd9353e0.mp3 | … boots here are muddy. | 1 |
| /audio/production/en-US/supplemental/are-your-keys-right-here-7a4ede7968.mp3 | Are … your keys right here? | 1 |
| /audio/production/en-US/supplemental/what-does-the-pool-open-60721e1386.mp3 | What … does the pool open? | 1 |
| /audio/production/en-US/supplemental/it-is-for-bed-sleepyhead-8c26578378.mp3 | It is … for bed, sleepyhead. | 1 |
| /audio/production/en-US/supplemental/i-have-thumbs-and-eight-fingers-13108bdc3d.mp3 | I have … thumbs and eight fingers. | 1 |
| /audio/production/en-US/supplemental/the-recipe-needs-eggs-f873ccd884.mp3 | The recipe needs … eggs. | 1 |
| /audio/production/en-US/supplemental/the-kite-went-and-away-280ed5ae46.mp3 | The kite went … and away. | 1 |
| /audio/production/en-US/supplemental/roll-your-sleeping-bag-45f077561c.mp3 | Roll … your sleeping bag. | 1 |
| /audio/production/en-US/supplemental/it-rain-later-i-think-959b4df8a6.mp3 | It … rain later, I think. | 1 |
| /audio/production/en-US/supplemental/you-hold-my-kite-a-bit-1fdcedaf08.mp3 | … you hold my kite a bit? | 1 |
| /audio/production/en-US/supplemental/you-like-a-hot-roll-9097d0f9b2.mp3 | … you like a hot roll? | 1 |
| /audio/production/en-US/supplemental/he-said-he-help-us-pack-80c672289a.mp3 | He said he … help us pack. | 1 |
| /audio/production/en-US/supplemental/please-your-name-at-the-top-26e01db5fb.mp3 | Please … your name at the top. | 1 |
| /audio/production/en-US/supplemental/i-to-my-pen-pal-weekly-30a691d0f6.mp3 | I … to my pen pal weekly. | 1 |
| /audio/production/en-US/supplemental/this-song-is-the-sea-6f48d6ba2d.mp3 | This song is … the sea. | 1 |
| /audio/production/en-US/supplemental/ask-me-my-hobby-d106c62ab0.mp3 | Ask me … my hobby. | 1 |
| /audio/production/en-US/supplemental/time-to-home-now-392ac8cf4e.mp3 | Time to … home now. | 1 |
| /audio/production/en-US/supplemental/ready-steady-2f1876dd2f.mp3 | Ready, steady, …! | 1 |
| /audio/production/en-US/supplemental/the-hive-ten-bees-ddd0107ed8.mp3 | The hive … ten bees. | 1 |
| /audio/production/en-US/supplemental/who-my-pencil-d05a5eab71.mp3 | Who … my pencil? | 1 |
| /audio/production/en-US/supplemental/val-fed-rabbit-eb4b0d62bd.mp3 | Val fed … rabbit. | 1 |
| /audio/production/en-US/supplemental/is-this-scarf-or-yours-3cb6eff63d.mp3 | Is this … scarf or yours? | 1 |
| /audio/production/en-US/supplemental/pass-the-map-to-85ed31a596.mp3 | Pass the map to …. | 1 |
| /audio/production/en-US/supplemental/we-picked-for-our-team-b5564814ed.mp3 | We picked … for our team. | 1 |
| /audio/production/en-US/supplemental/hop-the-boat-quick-705059e9a5.mp3 | Hop … the boat, quick! | 1 |
| /audio/production/en-US/supplemental/the-seeds-went-the-soil-9d2e633b59.mp3 | The seeds went … the soil. | 1 |
| /audio/production/en-US/supplemental/ducks-wet-weather-b982505ebe.mp3 | Ducks … wet weather. | 1 |
| /audio/production/en-US/supplemental/i-my-toast-crunchy-9b0bfc1d06.mp3 | I … my toast crunchy. | 1 |
| /audio/production/en-US/supplemental/both-ways-first-3ba1d8a1f6.mp3 | … both ways first. | 1 |
| /audio/production/en-US/supplemental/come-at-the-tadpoles-c0151de8ab.mp3 | Come … at the tadpoles! | 1 |
| /audio/production/en-US/supplemental/let-s-lemonade-4c819ebd2b.mp3 | Let's … lemonade. | 1 |
| /audio/production/en-US/supplemental/spiders-silk-webs-2d4f1ee11b.mp3 | Spiders … silk webs. | 1 |
| /audio/production/en-US/supplemental/moths-came-to-the-lamp-3da724e46b.mp3 | … moths came to the lamp. | 1 |
| /audio/production/en-US/supplemental/how-steps-to-the-top-fcd1e1f337.mp3 | How … steps to the top? | 1 |
| /audio/production/en-US/supplemental/one-lap-then-rest-3dcf2244a7.mp3 | One … lap, then rest. | 1 |
| /audio/production/en-US/supplemental/the-plant-needs-sun-1730803e64.mp3 | The plant needs … sun. | 1 |
| /audio/production/en-US/supplemental/hold-it-with-your-hand-cab6cd160e.mp3 | Hold it with your … hand. | 1 |
| /audio/production/en-US/supplemental/the-team-wore-red-473f67b000.mp3 | The … team wore red. | 1 |
| /audio/production/en-US/supplemental/school-lets-at-three-00c0c35d7b.mp3 | School lets … at three. | 1 |
| /audio/production/en-US/supplemental/the-tide-went-fast-2aca36f526.mp3 | The tide went … fast. | 1 |
| /audio/production/en-US/supplemental/can-you-the-lighthouse-2a57b099ae.mp3 | Can you … the lighthouse? | 1 |
| /audio/production/en-US/supplemental/i-three-sails-6521f741cb.mp3 | I … three sails! | 1 |
| /audio/production/en-US/supplemental/the-bag-was-heavy-3c3bd9fd55.mp3 | The bag was … heavy! | 1 |
| /audio/production/en-US/supplemental/i-trained-hard-i-won-5ad44df370.mp3 | I trained hard, … I won. | 1 |
| /audio/production/en-US/supplemental/take-grapes-for-the-trip-a431f52a7f.mp3 | Take … grapes for the trip. | 1 |
| /audio/production/en-US/supplemental/crabs-hide-under-rocks-7172e4c770.mp3 | … crabs hide under rocks. | 1 |
| /audio/production/en-US/supplemental/the-chicks-feed-at-five-bfbe213be4.mp3 | The chicks? Feed … at five. | 1 |
| /audio/production/en-US/supplemental/stack-the-chairs-and-count-8b77ba135a.mp3 | Stack the chairs and count …. | 1 |
| /audio/production/en-US/supplemental/wash-up-dry-your-hands-132cd988ba.mp3 | Wash up, … dry your hands. | 1 |
| /audio/production/en-US/supplemental/first-stretch-sprint-323fcd08d9.mp3 | First stretch, … sprint. | 1 |
| /audio/production/en-US/supplemental/shells-here-are-tiny-9c4151ac23.mp3 | … shells here are tiny. | 1 |
| /audio/production/en-US/supplemental/are-seats-taken-3e795d768b.mp3 | Are … seats taken? | 1 |
| /audio/production/en-US/supplemental/it-is-snack-a1124c3e2f.mp3 | It is snack …! | 1 |
| /audio/production/en-US/supplemental/what-is-kickoff-5d4f912b9e.mp3 | What … is kickoff? | 1 |
| /audio/production/en-US/supplemental/a-bike-has-wheels-afe2de029c.mp3 | A bike has … wheels. | 1 |
| /audio/production/en-US/supplemental/crows-sat-on-the-fence-9567947a18.mp3 | … crows sat on the fence. | 1 |
| /audio/production/en-US/supplemental/the-balloon-drifted-a53d60b767.mp3 | The balloon drifted …. | 1 |
| /audio/production/en-US/supplemental/climb-the-ladder-slowly-57f4d0c111.mp3 | Climb … the ladder slowly. | 1 |
| /audio/production/en-US/supplemental/gran-knit-you-a-hat-f79b36c1e4.mp3 | Gran … knit you a hat. | 1 |
| /audio/production/en-US/supplemental/the-bread-rise-by-noon-f29acf6638.mp3 | The bread … rise by noon. | 1 |
| /audio/production/en-US/supplemental/you-feed-my-fish-ce15e1791d.mp3 | … you feed my fish? | 1 |
| /audio/production/en-US/supplemental/she-said-she-come-58f505f8de.mp3 | She said she … come. | 1 |
| /audio/production/en-US/supplemental/a-list-before-we-shop-579c58e1fa.mp3 | … a list before we shop. | 1 |
| /audio/production/en-US/supplemental/i-with-my-left-hand-df3a909f6a.mp3 | I … with my left hand. | 1 |
| /audio/production/en-US/supplemental/it-be-ok-to-sit-here-5a2e6ede9b.mp3 | … it be OK to sit here? | 1 |
| /audio/production/en-US/supplemental/scribes-all-day-long-17975bdade.mp3 | Scribes … all day long. | 1 |
| /audio/production/en-US/supplemental/ben-trade-his-apple-b021e01908.mp3 | Ben … trade his apple. | 1 |
| /audio/production/en-US/supplemental/neatly-on-the-line-35b4645e16.mp3 | … neatly on the line. | 1 |
| /audio/production/en-US/supplemental/socks-come-in-sets-of-5aecf7254d.mp3 | Socks come in sets of …. | 1 |
| /audio/production/en-US/supplemental/so-stars-are-out-tonight-7c5b1f29ca.mp3 | So … stars are out tonight! | 1 |
| /audio/production/en-US/supplemental/before-you-leap-9e886d0ba9.mp3 | … before you leap! | 1 |
| /audio/production/en-US/supplemental/bath-for-the-pup-caac2c2542.mp3 | Bath … for the pup! | 1 |
| /audio/production/en-US/supplemental/where-have-you-all-day-91d075785c.mp3 | Where have you … all day? | 1 |
| /audio/production/en-US/supplemental/the-pups-have-fed-f140a7d907.mp3 | The pups have … fed. | 1 |
| /audio/production/en-US/supplemental/gran-us-in-for-tea-b2e9546341.mp3 | Gran … us in for tea. | 1 |
| /audio/production/en-US/supplemental/our-cat-is-pickle-f3c9b99d1c.mp3 | Our cat is … Pickle. | 1 |
| /audio/production/en-US/supplemental/and-warm-up-by-the-fire-25e627d656.mp3 | … and warm up by the fire. | 1 |
| /audio/production/en-US/supplemental/foxes-out-after-dark-0aebb6d334.mp3 | Foxes … out after dark. | 1 |
| /audio/production/en-US/supplemental/you-pass-the-jam-e5e81400c5.mp3 | … you pass the jam? | 1 |
| /audio/production/en-US/supplemental/long-ago-gran-skate-fast-e63b2c8160.mp3 | Long ago, Gran … skate fast. | 1 |
| /audio/production/en-US/supplemental/what-is-the-fair-on-001c6c4b8e.mp3 | What … is the fair on? | 1 |
| /audio/production/en-US/supplemental/what-a-windy-for-kites-a9caba13f5.mp3 | What a windy … for kites! | 1 |
| /audio/production/en-US/supplemental/you-lock-the-gate-59cac4b3bd.mp3 | … you lock the gate? | 1 |
| /audio/production/en-US/supplemental/we-our-best-at-the-quiz-557a2a4fb2.mp3 | We … our best at the quiz. | 1 |
| /audio/production/en-US/supplemental/the-otter-slid-the-bank-d78c4ff192.mp3 | The otter slid … the bank. | 1 |
| /audio/production/en-US/supplemental/write-it-so-you-remember-c54d8e1a27.mp3 | Write it … so you remember. | 1 |
| /audio/production/en-US/supplemental/can-you-the-hidden-key-e9046e2c26.mp3 | Can you … the hidden key? | 1 |
| /audio/production/en-US/supplemental/bats-moths-at-night-5d51bfa55f.mp3 | Bats … moths at night. | 1 |
| /audio/production/en-US/supplemental/tie-the-knot-then-pull-9a8b1e6844.mp3 | Tie the knot …, then pull. | 1 |
| /audio/production/en-US/supplemental/ana-came-in-the-race-b71417a3f2.mp3 | Ana came … in the race. | 1 |
| /audio/production/en-US/supplemental/please-my-coat-from-the-peg-e286b08de0.mp3 | Please … my coat from the peg. | 1 |
| /audio/production/en-US/supplemental/ducks-muddy-and-stay-happy-18d97df12c.mp3 | Ducks … muddy and stay happy. | 1 |
| /audio/production/en-US/supplemental/a-snake-is-and-thin-f1645ca1f9.mp3 | A snake is … and thin. | 1 |
| /audio/production/en-US/supplemental/how-is-the-train-ride-12136e243f.mp3 | How … is the train ride? | 1 |
| /audio/production/en-US/supplemental/gramps-this-stool-himself-7031a12c35.mp3 | Gramps … this stool himself. | 1 |
| /audio/production/en-US/supplemental/the-chef-soup-from-scraps-ddbf089a7a.mp3 | The chef … soup from scraps. | 1 |
| /audio/production/en-US/supplemental/there-is-a-chance-it-rain-fd90f2ba21.mp3 | There is a chance it … rain. | 1 |
| /audio/production/en-US/supplemental/it-snow-before-dawn-147475683e.mp3 | It … snow before dawn. | 1 |
| /audio/production/en-US/supplemental/this-is-bike-not-yours-894b8ebee8.mp3 | This is … bike, not yours. | 1 |
| /audio/production/en-US/supplemental/i-lost-left-glove-db761f7170.mp3 | I lost … left glove. | 1 |
| /audio/production/en-US/supplemental/there-are-plums-left-888d006ba5.mp3 | There are … plums left. | 1 |
| /audio/production/en-US/supplemental/dogs-on-the-sand-says-the-sign-c337c92c09.mp3 | … dogs on the sand, says the sign. | 1 |
| /audio/production/en-US/supplemental/the-glue-is-dry-bf81c8a9eb.mp3 | The glue is dry …. | 1 |
| /audio/production/en-US/supplemental/it-is-my-turn-039371abd6.mp3 | … it is my turn! | 1 |
| /audio/production/en-US/supplemental/pick-a-from-one-to-ten-12167dbcf2.mp3 | Pick a … from one to ten. | 1 |
| /audio/production/en-US/supplemental/what-is-your-house-490a8c0cf7.mp3 | What … is your house? | 1 |
| /audio/production/en-US/supplemental/dad-put-on-the-squeaky-hinge-34f82a078c.mp3 | Dad put … on the squeaky hinge. | 1 |
| /audio/production/en-US/supplemental/and-water-will-not-mix-b09e966edd.mp3 | … and water will not mix. | 1 |
| /audio/production/en-US/supplemental/the-best-of-camp-was-the-raft-9a396dedb1.mp3 | The best … of camp was the raft. | 1 |
| /audio/production/en-US/supplemental/each-of-the-model-snaps-in-c5dc74fafa.mp3 | Each … of the model snaps in. | 1 |
| /audio/production/en-US/supplemental/the-hall-was-full-of-c8db708b6e.mp3 | The hall was full of …. | 1 |
| /audio/production/en-US/supplemental/waved-from-the-bridge-e212013eaf.mp3 | … waved from the bridge. | 1 |
| /audio/production/en-US/supplemental/come-by-me-at-lunch-7f53648d82.mp3 | Come … by me at lunch. | 1 |
| /audio/production/en-US/supplemental/hens-on-their-eggs-e4acf5a13c.mp3 | Hens … on their eggs. | 1 |
| /audio/production/en-US/supplemental/a-whale-is-bigger-a-bus-6ccf9fd73e.mp3 | A whale is bigger … a bus. | 1 |
| /audio/production/en-US/supplemental/i-would-rather-walk-wait-b46d3fa3fc.mp3 | I would rather walk … wait. | 1 |
| /audio/production/en-US/supplemental/plants-need-sun-and-6089c94694.mp3 | Plants need sun and …. | 1 |
| /audio/production/en-US/supplemental/the-in-the-pool-is-cold-03b292fdad.mp3 | The … in the pool is cold. | 1 |
| /audio/production/en-US/supplemental/is-this-the-to-the-beach-65b977470f.mp3 | Is this the … to the beach? | 1 |
| /audio/production/en-US/supplemental/show-me-the-you-fold-it-23602135ea.mp3 | Show me the … you fold it. | 1 |
| /audio/production/en-US/supplemental/left-the-tap-running-26c8580b22.mp3 | … left the tap running? | 1 |
| /audio/production/en-US/supplemental/guess-won-the-raffle-dda2b6ced4.mp3 | Guess … won the raffle! | 1 |
| /audio/production/en-US/supplemental/have-you-to-the-fair-47b59ac90c.mp3 | Have you … to the fair? | 1 |
| /audio/production/en-US/supplemental/the-barn-has-painted-f0da6bdcae.mp3 | The barn has … painted. | 1 |
| /audio/production/en-US/supplemental/the-pup-is-biscuit-522b44eca7.mp3 | The pup is … Biscuit. | 1 |
| /audio/production/en-US/supplemental/mum-the-vet-at-once-7cf74d1cbe.mp3 | Mum … the vet at once. | 1 |
| /audio/production/en-US/supplemental/and-see-the-chicks-83b5b46af8.mp3 | … and see the chicks! | 1 |
| /audio/production/en-US/supplemental/storms-fast-at-sea-9ac8064c47.mp3 | Storms … fast at sea. | 1 |
| /audio/production/en-US/supplemental/we-camp-by-the-lake-481699a69f.mp3 | … we camp by the lake? | 1 |
| /audio/production/en-US/supplemental/owls-hear-a-pin-drop-bd92fc1c62.mp3 | Owls … hear a pin drop. | 1 |
| /audio/production/en-US/supplemental/sports-is-on-friday-706fc2d789.mp3 | Sports … is on Friday. | 1 |
| /audio/production/en-US/supplemental/what-a-fine-for-a-hike-121e18f864.mp3 | What a fine … for a hike! | 1 |
| /audio/production/en-US/supplemental/the-alarm-ring-972eafdf9c.mp3 | … the alarm ring? | 1 |
| /audio/production/en-US/supplemental/you-a-fine-job-50ba65966e.mp3 | You … a fine job. | 1 |
| /audio/production/en-US/supplemental/roll-the-barrel-the-ramp-f6605c2a07.mp3 | Roll the barrel … the ramp. | 1 |
| /audio/production/en-US/supplemental/the-sun-went-at-eight-31d9c01c03.mp3 | The sun went … at eight. | 1 |
| /audio/production/en-US/supplemental/help-me-my-keys-90f8c66986.mp3 | Help me … my keys. | 1 |
| /audio/production/en-US/supplemental/crows-shiny-things-db251972b0.mp3 | Crows … shiny things. | 1 |
| /audio/production/en-US/supplemental/ladders-then-paint-ba46de469f.mp3 | Ladders …, then paint. | 1 |
| /audio/production/en-US/supplemental/who-came-in-the-quiz-0127f2ba58.mp3 | Who came … in the quiz? | 1 |
| /audio/production/en-US/supplemental/your-boots-it-snowed-ceb24db800.mp3 | … your boots — it snowed! | 1 |
| /audio/production/en-US/supplemental/we-eggs-from-the-coop-7f936b7084.mp3 | We … eggs from the coop. | 1 |
| /audio/production/en-US/supplemental/giraffes-have-necks-c567b16bee.mp3 | Giraffes have … necks. | 1 |
| /audio/production/en-US/supplemental/the-queue-was-so-eb88404fb0.mp3 | The queue was so …! | 1 |
| /audio/production/en-US/supplemental/we-jam-tarts-today-82bf8c1903.mp3 | We … jam tarts today. | 1 |
| /audio/production/en-US/supplemental/ants-a-nest-by-the-step-b1f8876be0.mp3 | Ants … a nest by the step. | 1 |
| /audio/production/en-US/supplemental/i-ring-the-bell-3e4f7596a4.mp3 | … I ring the bell? | 1 |
| /audio/production/en-US/supplemental/it-thunder-later-389859ce59.mp3 | It … thunder later. | 1 |
| /audio/production/en-US/supplemental/where-is-other-mitten-2bc0a5fcd2.mp3 | Where is … other mitten? | 1 |
| /audio/production/en-US/supplemental/turn-on-the-swing-98223655f6.mp3 | … turn on the swing! | 1 |
| /audio/production/en-US/supplemental/there-is-milk-left-a7158e0bad.mp3 | There is … milk left. | 1 |
| /audio/production/en-US/supplemental/two-snowflakes-match-58ae5ef888.mp3 | … two snowflakes match. | 1 |
| /audio/production/en-US/supplemental/the-paint-is-dry-a7cde70e28.mp3 | The paint is dry …. | 1 |
| /audio/production/en-US/supplemental/add-the-flour-slowly-c23883d4cc.mp3 | … add the flour slowly. | 1 |
| /audio/production/en-US/supplemental/ring-this-if-lost-92bc1f639e.mp3 | Ring this … if lost. | 1 |
| /audio/production/en-US/supplemental/seven-is-my-lucky-f7dc30f5ca.mp3 | Seven is my lucky …. | 1 |
| /audio/production/en-US/supplemental/bike-chains-need-6a3e181988.mp3 | Bike chains need …. | 1 |
| /audio/production/en-US/supplemental/the-wheels-please-28fb6fd179.mp3 | … the wheels, please. | 1 |
| /audio/production/en-US/supplemental/this-clips-on-last-d35a13ca2a.mp3 | This … clips on last. | 1 |
| /audio/production/en-US/supplemental/play-your-in-the-show-93674c148e.mp3 | Play your … in the show. | 1 |
| /audio/production/en-US/supplemental/six-fit-in-the-lift-c83e4bf4d1.mp3 | Six … fit in the lift. | 1 |
| /audio/production/en-US/supplemental/kind-share-the-bench-81281f9811.mp3 | Kind … share the bench. | 1 |
| /audio/production/en-US/supplemental/still-for-the-photo-262a544c3d.mp3 | … still for the photo. | 1 |
| /audio/production/en-US/supplemental/cats-where-they-please-64be719cc6.mp3 | Cats … where they please. | 1 |
| /audio/production/en-US/supplemental/silk-is-softer-wool-a396f0ac33.mp3 | Silk is softer … wool. | 1 |
| /audio/production/en-US/supplemental/ice-is-colder-snow-8526756096.mp3 | Ice is colder … snow. | 1 |
| /audio/production/en-US/supplemental/fill-the-trough-with-73d170d863.mp3 | Fill the trough with …. | 1 |
| /audio/production/en-US/supplemental/the-froze-overnight-f0169b8d50.mp3 | The … froze overnight. | 1 |
| /audio/production/en-US/supplemental/this-to-the-exit-c1a5a079d1.mp3 | This … to the exit. | 1 |
| /audio/production/en-US/supplemental/a-compass-shows-the-4ecedc0642.mp3 | A compass shows the …. | 1 |
| /audio/production/en-US/supplemental/ate-the-last-plum-ed5095ed0a.mp3 | … ate the last plum? | 1 |
| /audio/production/en-US/supplemental/ask-owns-the-scooter-0da89c670c.mp3 | Ask … owns the scooter. | 1 |
| /audio/production/en-US/supplemental/i-wish-i-fly-like-a-hawk-63889bf933.mp3 | I wish I … fly like a hawk. | 1 |
| /audio/production/en-US/supplemental/the-post-has-already-6426601835.mp3 | The post has already …. | 1 |
| /audio/production/en-US/supplemental/we-hear-the-sea-from-camp-63e7d4a826.mp3 | We … hear the sea from camp. | 1 |
| /audio/production/en-US/supplemental/it-has-ages-95445af2e5.mp3 | It has … ages! | 1 |
| /audio/production/en-US/supplemental/knows-the-answer-b11dec0b2e.mp3 | … knows the answer? | 1 |
| /audio/production/en-US/supplemental/feathers-weigh-less-stones-62421d6276.mp3 | Feathers weigh less … stones. | 1 |
| /audio/production/en-US/supplemental/pick-an-odd-6fad542fc8.mp3 | Pick an odd …. | 1 |
| /audio/production/en-US/supplemental/save-take-short-showers-9fc9c70878.mp3 | Save … — take short showers. | 1 |
| /audio/production/en-US/supplemental/we-sailed-far-out-on-the-deep-blue-176ea94b0b.mp3 | We sailed far out on the deep blue …. | 1 |
| /audio/production/en-US/supplemental/close-your-eyes-now-open-and-e066cd36d3.mp3 | Close your eyes — now open and …! | 1 |
| /audio/production/en-US/supplemental/the-rose-over-the-hill-at-dawn-3c54733255.mp3 | The … rose over the hill at dawn. | 1 |
| /audio/production/en-US/supplemental/grandpa-hugged-his-at-the-gate-2f2dd6294a.mp3 | Grandpa hugged his … at the gate. | 1 |
| /audio/production/en-US/supplemental/a-landed-on-the-flower-961ff671b8.mp3 | A … landed on the flower. | 1 |
| /audio/production/en-US/supplemental/i-will-seven-on-my-next-birthday-571cf66867.mp3 | I will … seven on my next birthday. | 1 |
| /audio/production/en-US/supplemental/dad-said-when-i-asked-for-sweets-d885037147.mp3 | Dad said … when I asked for sweets. | 1 |
| /audio/production/en-US/supplemental/do-you-the-way-to-school-29b9982a0e.mp3 | Do you … the way to school? | 1 |
| /audio/production/en-US/supplemental/pick-just-card-from-the-pack-53d4d1f507.mp3 | Pick just … card from the pack. | 1 |
| /audio/production/en-US/supplemental/our-team-the-cup-last-year-3b0374f56a.mp3 | Our team … the cup last year! | 1 |
| /audio/production/en-US/supplemental/ben-all-his-peas-at-dinner-d5fed2a4c4.mp3 | Ben … all his peas at dinner. | 1 |
| /audio/production/en-US/supplemental/there-are-legs-on-a-spider-7cc73e2e94.mp3 | There are … legs on a spider. | 1 |
| /audio/production/en-US/supplemental/shh-i-can-the-owl-outside-cccd2ac1cd.mp3 | Shh! I can … the owl outside. | 1 |
| /audio/production/en-US/supplemental/the-bus-stops-right-at-this-very-corner-cacd20a127.mp3 | The bus stops right …, at this very corner. | 1 |
| /audio/production/en-US/supplemental/the-wind-my-hat-into-the-pond-4975104fa1.mp3 | The wind … my hat into the pond! | 1 |
| /audio/production/en-US/supplemental/milo-wore-his-scarf-blue-like-the-sea-596cb6e596.mp3 | Milo wore his … scarf, blue like the sea. | 1 |
| /audio/production/en-US/supplemental/may-i-come-the-park-with-you-2b3045ff7c.mp3 | May I come … the park with you? | 1 |
| /audio/production/en-US/supplemental/nan-baked-pies-one-for-each-hand-18e4b9ac5a.mp3 | Nan baked … pies, one for each hand. | 1 |
| /audio/production/en-US/supplemental/that-soup-is-hot-to-eat-4132306cfb.mp3 | That soup is … hot to eat! | 1 |
| /audio/production/en-US/supplemental/the-twins-packed-bags-for-camp-fc5a4a6f0c.mp3 | The twins packed … bags for camp. | 1 |
| /audio/production/en-US/supplemental/look-over-the-parade-is-coming-8a5af3e1eb.mp3 | Look over … — the parade is coming! | 1 |
| /audio/production/en-US/supplemental/the-teacher-ticked-it-my-sum-was-bc0d39b0d0.mp3 | The teacher ticked it — my sum was …. | 1 |
| /audio/production/en-US/supplemental/i-will-a-letter-to-gran-tonight-be9cce4cd8.mp3 | I will … a letter to Gran tonight. | 1 |
| /audio/production/en-US/supplemental/my-shoes-are-i-got-them-today-862d9d7d65.mp3 | My shoes are … — I got them today. | 1 |
| /audio/production/en-US/supplemental/i-the-answer-before-anyone-else-5378d72aa2.mp3 | I … the answer before anyone else. | 1 |
| /audio/production/en-US/supplemental/the-cake-bakes-for-one-7fa8feff32.mp3 | The cake bakes for one …. | 1 |
| /audio/production/en-US/supplemental/that-swing-is-special-spot-fa98514f95.mp3 | That swing is … special spot. | 1 |
| /audio/production/en-US/supplemental/sift-the-into-the-bowl-for-the-cake-1f7cd527e8.mp3 | Sift the … into the bowl for the cake. | 1 |
| /audio/production/en-US/supplemental/a-bee-landed-on-the-pink-ea47ebb95c.mp3 | A bee landed on the pink …. | 1 |
| /audio/production/en-US/supplemental/you-like-some-juice-50729be169.mp3 | … you like some juice? | 1 |
| /audio/production/en-US/supplemental/the-bench-is-made-of-from-the-old-oak-9919f891e1.mp3 | The bench is made of … from the old oak. | 1 |
| /audio/production/en-US/supplemental/gran-pancakes-for-breakfast-8ce3d573ee.mp3 | Gran … pancakes for breakfast. | 1 |
| /audio/production/en-US/supplemental/the-swept-the-castle-floor-97a1b4da9e.mp3 | The … swept the castle floor. | 1 |
| /audio/production/en-US/supplemental/shells-wash-up-from-the-07ce56540d.mp3 | Shells wash up from the …. | 1 |
| /audio/production/en-US/supplemental/the-buzzed-from-rose-to-rose-5a4d3ecd52.mp3 | The … buzzed from rose to rose. | 1 |
| /audio/production/en-US/supplemental/we-the-quiz-by-a-single-point-9cb524a33e.mp3 | We … the quiz by a single point! | 1 |
| /audio/production/en-US/supplemental/stand-still-and-you-can-the-waves-6ee12f1c66.mp3 | Stand still and you can … the waves. | 1 |
| /audio/production/en-US/supplemental/it-is-dark-to-read-outside-now-17011f3e57.mp3 | It is … dark to read outside now. | 1 |
| /audio/production/en-US/supplemental/the-birds-built-nest-in-the-oak-931591cb72.mp3 | The birds built … nest in the oak. | 1 |
| /audio/production/en-US/supplemental/use-the-pencil-to-your-name-a3ddd9605b.mp3 | Use the pencil to … your name. | 1 |
| /audio/production/en-US/supplemental/we-a-fort-out-of-pillows-afc4b9ef50.mp3 | We … a fort out of pillows. | 1 |
| /audio/production/en-US/supplemental/the-sailed-into-the-bay-01f5b7632e.mp3 | The … sailed into the bay. | 1 |
| /audio/production/en-US/supplemental/a-buzzed-by-my-ear-4291feea87.mp3 | A … buzzed by my ear. | 1 |
| /audio/production/en-US/supplemental/the-dripped-on-the-rug-f28b18f37e.mp3 | The … dripped on the rug. | 1 |
| /audio/production/en-US/supplemental/our-creaks-in-the-wind-3d53e3c050.mp3 | Our … creaks in the wind. | 1 |
| /audio/production/en-US/supplemental/the-hooted-all-night-long-b2d0cf519d.mp3 | The … hooted all night long. | 1 |
| /audio/production/en-US/supplemental/a-rolled-off-the-shelf-43cf4cf5a7.mp3 | A … rolled off the shelf. | 1 |
| /audio/production/en-US/supplemental/the-sang-to-the-crowd-ba78814cf6.mp3 | The … sang to the crowd. | 1 |
| /audio/production/en-US/supplemental/our-reads-to-us-after-lunch-969f0aec69.mp3 | Our … reads to us after lunch. | 1 |
| /audio/production/en-US/supplemental/the-cat-and-the-hid-in-the-barn-6f1d6fb083.mp3 | The cat and the … hid in the barn. | 1 |
| /audio/production/en-US/supplemental/a-fork-and-a-sat-by-the-plate-e07af2cf5f.mp3 | A fork and a … sat by the plate. | 1 |
| /audio/production/en-US/supplemental/the-chimed-at-noon-977c89aa49.mp3 | The … chimed at noon. | 1 |
| /audio/production/en-US/supplemental/a-nested-in-our-chimney-5efa87c031.mp3 | A … nested in our chimney. | 1 |
| /audio/production/en-US/supplemental/two-sat-on-the-wall-c7f74c4b9d.mp3 | Two … sat on the wall. | 1 |
| /audio/production/en-US/supplemental/the-three-wag-their-tails-e7129dd7a7.mp3 | The three … wag their tails. | 1 |
| /audio/production/en-US/supplemental/both-lay-open-on-the-desk-9cc18412a2.mp3 | Both … lay open on the desk. | 1 |
| /audio/production/en-US/supplemental/six-shine-over-the-barn-e4371b2824.mp3 | Six … shine over the barn. | 1 |
| /audio/production/en-US/supplemental/i-see-one-by-the-door-3249aa8be8.mp3 | I see one … by the door. | 1 |
| /audio/production/en-US/supplemental/many-twinkle-at-night-051de84460.mp3 | Many … twinkle at night. | 1 |
| /audio/production/en-US/supplemental/one-quacks-as-it-floats-on-the-pond-9b46692b6a.mp3 | One … quacks as it floats on the pond. | 1 |
| /audio/production/en-US/supplemental/lots-of-hop-in-the-grass-daaabe1c3c.mp3 | Lots of … hop in the grass. | 1 |
| /audio/production/en-US/supplemental/we-packed-six-for-the-trip-958b68b734.mp3 | We packed six … for the trip. | 1 |
| /audio/production/en-US/supplemental/the-from-dinner-included-plates-and-bowls-18fdd62038.mp3 | The … from dinner included plates and bowls. | 1 |
| /audio/production/en-US/supplemental/three-chugged-up-the-hill-66e1d31490.mp3 | Three … chugged up the hill. | 1 |
| /audio/production/en-US/supplemental/the-scrubbed-the-mud-off-our-boots-889a04496a.mp3 | The … scrubbed the mud off our boots. | 1 |
| /audio/production/en-US/supplemental/two-red-hid-in-the-den-40ee104bec.mp3 | Two red … hid in the den. | 1 |
| /audio/production/en-US/supplemental/the-newborn-giggled-in-their-cots-f92dd96f80.mp3 | The newborn … giggled in their cots. | 1 |
| /audio/production/en-US/supplemental/three-planned-the-fair-a1458b6655.mp3 | Three … planned the fair. | 1 |
| /audio/production/en-US/supplemental/we-hung-balloons-for-both-birthday-2c430634c7.mp3 | We hung balloons for both birthday …. | 1 |
| /audio/production/en-US/supplemental/the-marched-in-the-band-2437ddd776.mp3 | The … marched in the band. | 1 |
| /audio/production/en-US/supplemental/both-six-year-old-lost-a-milk-tooth-today-655c6aa92c.mp3 | Both six-year-old … lost a milk tooth today. | 1 |
| /audio/production/en-US/supplemental/autumn-blew-across-the-path-e1870e41c6.mp3 | Autumn … blew across the path. | 1 |
| /audio/production/en-US/supplemental/the-howled-on-the-hill-c00d281c5d.mp3 | The … howled on the hill. | 1 |
| /audio/production/en-US/supplemental/the-chef-laid-five-by-the-plates-283f752927.mp3 | The chef laid five … by the plates. | 1 |
| /audio/production/en-US/supplemental/all-the-newborn-slept-in-the-dog-bed-620a8efc7c.mp3 | All the newborn … slept in the dog bed. | 1 |
| /audio/production/en-US/supplemental/one-was-left-on-the-plate-4b529b0cf7.mp3 | One … was left on the plate. | 1 |
| /audio/production/en-US/supplemental/two-of-bread-sat-in-the-basket-085e202b4f.mp3 | Two … of bread sat in the basket. | 1 |
| /audio/production/en-US/supplemental/ten-bark-at-the-gate-dfcf4907d7.mp3 | Ten … bark at the gate. | 1 |
| /audio/production/en-US/supplemental/four-played-near-the-barn-ec8dc81eaf.mp3 | Four … played near the barn. | 1 |
| /audio/production/en-US/supplemental/just-one-purred-by-the-fire-c0ebadb34b.mp3 | Just one … purred by the fire. | 1 |
| /audio/production/en-US/supplemental/both-told-long-stories-2b27da1867.mp3 | Both … told long stories. | 1 |
| /audio/production/en-US/supplemental/two-white-squeaked-and-nibbled-the-cheese-50994eb032.mp3 | Two white … squeaked and nibbled the cheese. | 1 |
| /audio/production/en-US/supplemental/the-baker-sliced-two-for-lunch-d2ee77049e.mp3 | The baker sliced two … for lunch. | 1 |
| /audio/production/en-US/supplemental/all-four-chirped-at-dawn-dee12e506e.mp3 | All four … chirped at dawn. | 1 |
| /audio/production/en-US/supplemental/every-day-dad-the-car-88633564d5.mp3 | Every day, Dad … the car. | 1 |
| /audio/production/en-US/supplemental/my-cat-on-the-mat-each-day-9a561da83b.mp3 | My cat … on the mat each day. | 1 |
| /audio/production/en-US/supplemental/gran-bread-every-sunday-1dbf07752f.mp3 | Gran … bread every Sunday. | 1 |
| /audio/production/en-US/supplemental/right-now-the-pot-is-on-the-stove-f8cd25dd96.mp3 | Right now, the pot is … on the stove. | 1 |
| /audio/production/en-US/supplemental/we-are-a-sandcastle-today-864d86bf56.mp3 | We are … a sandcastle today. | 1 |
| /audio/production/en-US/supplemental/keep-the-finish-line-is-close-163b46128c.mp3 | Keep …! The finish line is close. | 1 |
| /audio/production/en-US/supplemental/yesterday-we-to-the-park-2ec23ffff8.mp3 | Yesterday we … to the park. | 1 |
| /audio/production/en-US/supplemental/last-night-the-baby-for-hours-565eabb799.mp3 | Last night, the baby … for hours. | 1 |
| /audio/production/en-US/supplemental/we-the-door-before-bed-bcc6f89615.mp3 | We … the door before bed. | 1 |
| /audio/production/en-US/supplemental/ben-is-tall-but-ana-is-even-15d4095da4.mp3 | Ben is tall, but Ana is even …. | 1 |
| /audio/production/en-US/supplemental/of-all-three-dogs-rex-is-the-3662ca7a0a.mp3 | Of all three dogs, Rex is the …. | 1 |
| /audio/production/en-US/supplemental/set-the-eggs-down-with-no-bumps-de342b2699.mp3 | Set the eggs down …, with no bumps. | 1 |
| /audio/production/en-US/supplemental/the-mouse-crept-past-the-cat-32d98a7482.mp3 | The mouse crept … past the cat. | 1 |
| /audio/production/en-US/supplemental/the-oven-before-you-mix-the-batter-51370a88d1.mp3 | … the oven before you mix the batter. | 1 |
| /audio/production/en-US/supplemental/we-watched-a-before-the-film-opened-7255fa7799.mp3 | We watched a … before the film opened. | 1 |
| /audio/production/en-US/supplemental/sam-is-quick-but-ali-is-even-3845c3108b.mp3 | Sam is quick, but Ali is even …. | 1 |
| /audio/production/en-US/supplemental/the-plane-flew-the-town-0b107a57fb.mp3 | The plane flew … the town. | 1 |
| /audio/production/en-US/supplemental/the-horse-leapt-the-gate-7aa47787dd.mp3 | The horse leapt … the gate. | 1 |
| /audio/production/en-US/supplemental/high-in-the-sky-the-plane-passed-the-town-eca222e124.mp3 | High in the sky, the plane passed … the town. | 1 |
| /audio/production/en-US/supplemental/the-horse-jumped-the-locked-gate-e8ed6b07eb.mp3 | The horse jumped … the locked gate. | 1 |
| /audio/production/en-US/supplemental/the-train-roared-the-tunnel-3ffe568fde.mp3 | The train roared … the tunnel. | 1 |
| /audio/production/en-US/supplemental/rain-dripped-the-crack-in-the-tent-64a0f2a7f6.mp3 | Rain dripped … the crack in the tent. | 1 |
| /audio/production/en-US/supplemental/the-train-entered-one-end-and-left-the-other-the-tunnel-894e14971d.mp3 | The train entered one end and left the other: … the tunnel. | 1 |
| /audio/production/en-US/supplemental/the-tent-leaked-because-rain-came-a-small-crack-95b68f8279.mp3 | The tent leaked because rain came … a small crack. | 1 |
| /audio/production/en-US/supplemental/our-house-is-the-school-on-the-same-short-street-cab6f9dcbb.mp3 | Our house is … the school on the same short street. | 1 |
| /audio/production/en-US/supplemental/keep-the-bucket-the-door-for-spills-02b22a0125.mp3 | Keep the bucket … the door for spills. | 1 |
| /audio/production/en-US/supplemental/home-is-a-short-walk-away-our-house-is-the-school-d7489c3f9a.mp3 | Home is a short walk away. Our house is … the school. | 1 |
| /audio/production/en-US/supplemental/keep-the-bucket-the-door-so-it-is-quick-to-reach-c48011be21.mp3 | Keep the bucket … the door so it is quick to reach. | 1 |
| /audio/production/en-US/supplemental/the-bakery-is-the-bank-just-across-the-road-cb2da82e33.mp3 | The bakery is … the bank, just across the road. | 1 |
| /audio/production/en-US/supplemental/the-two-goals-stand-each-other-a872986652.mp3 | The two goals stand … each other. | 1 |
| /audio/production/en-US/supplemental/the-bakery-faces-the-bank-across-the-road-the-bank-b733b937ac.mp3 | The bakery faces the bank across the road: … the bank. | 1 |
| /audio/production/en-US/supplemental/the-goals-at-the-two-ends-stand-each-other-27760621c7.mp3 | The goals at the two ends stand … each other. | 1 |
| /audio/production/en-US/supplemental/a-red-tulip-grew-the-yellow-tulips-9c130ecdea.mp3 | A red tulip grew … the yellow tulips. | 1 |
| /audio/production/en-US/supplemental/the-deer-stood-the-trees-28ea5b79dd.mp3 | The deer stood … the trees. | 1 |
| /audio/production/en-US/supplemental/one-red-flower-grows-many-yellow-flowers-d9105a98fe.mp3 | One red flower grows … many yellow flowers. | 1 |
| /audio/production/en-US/supplemental/a-deer-stood-the-trees-hard-to-spot-c49706bcd4.mp3 | A deer stood … the trees, hard to spot. | 1 |
| /audio/production/en-US/supplemental/the-fence-runs-the-whole-garden-8d3a409b8a.mp3 | The fence runs … the whole garden. | 1 |
| /audio/production/en-US/supplemental/the-path-bends-the-puddle-d5b592c9a0.mp3 | The path bends … the puddle. | 1 |
| /audio/production/en-US/supplemental/we-walked-the-puddle-to-keep-our-shoes-dry-21d5b98501.mp3 | We walked … the puddle to keep our shoes dry. | 1 |
| /audio/production/en-US/supplemental/the-fence-makes-a-complete-ring-the-garden-4c1ab9933a.mp3 | The fence makes a complete ring … the garden. | 1 |
| /audio/production/en-US/supplemental/it-poured-with-rain-so-we-played-the-house-4362c0ca17.mp3 | It poured with rain, so we played … the house. | 1 |
| /audio/production/en-US/supplemental/leave-the-muddy-boots-the-door-974e3344ad.mp3 | Leave the muddy boots … the door. | 1 |
| /audio/production/en-US/supplemental/leave-your-muddy-boots-the-door-then-come-in-cc41e654da.mp3 | Leave your muddy boots … the door, then come in. | 1 |
| /audio/production/en-US/supplemental/rain-is-falling-outdoors-but-the-children-are-dry-the-house-70024b24b7.mp3 | Rain is falling outdoors, but the children are dry … the house. | 1 |
| /audio/production/en-US/supplemental/the-horse-is-jumping-the-gate-cdc1cbfa63.mp3 | The horse is jumping … the gate. | 1 |
| /audio/production/en-US/supplemental/the-train-is-passing-the-tunnel-e13902bba2.mp3 | The train is passing … the tunnel. | 1 |
| /audio/production/en-US/supplemental/a-short-path-joins-home-and-school-they-are-each-other-7c319b7af8.mp3 | A short path joins home and school. They are … each other. | 1 |
| /audio/production/en-US/supplemental/the-single-red-tulip-stands-the-yellow-tulips-9b116248bf.mp3 | The single red tulip stands … the yellow tulips. | 1 |
| /audio/production/en-US/supplemental/the-fence-curves-the-garden-ae45a92de5.mp3 | The fence curves … the garden. | 1 |
| /audio/production/en-US/supplemental/the-children-stay-dry-the-house-0b22c21abd.mp3 | The children stay dry … the house. | 1 |
| /audio/production/en-US/supplemental/we-the-raft-to-the-dock-7475942382.mp3 | We … the raft to the dock. | 1 |
| /audio/production/en-US/supplemental/the-twins-over-the-puddle-89ee59d8ed.mp3 | The twins … over the puddle. | 1 |
| /audio/production/en-US/supplemental/please-the-door-quietly-1e74b5bc1a.mp3 | Please … the door quietly. | 1 |
| /audio/production/en-US/supplemental/owls-after-dark-bc0a5b5a23.mp3 | Owls … after dark. | 1 |
| /audio/production/en-US/supplemental/crabs-across-the-sand-dbcd175ba7.mp3 | Crabs … across the sand. | 1 |
| /audio/production/en-US/supplemental/we-the-seeds-each-morning-b722f1f114.mp3 | We … the seeds each morning. | 1 |
| /audio/production/en-US/supplemental/the-swims-fifty-laps-a-day-1dfa69bc49.mp3 | The … swims fifty laps a day. | 1 |
| /audio/production/en-US/supplemental/the-twirled-across-the-stage-2c33d6b87f.mp3 | The … twirled across the stage. | 1 |
| /audio/production/en-US/supplemental/the-frog-over-the-log-in-one-big-spring-bda9315bee.mp3 | The frog … over the log in one big spring. | 1 |
| /audio/production/en-US/supplemental/the-soup-in-the-pot-until-bubbles-rose-98b96642d4.mp3 | The soup … in the pot until bubbles rose. | 1 |
| /audio/production/en-US/supplemental/she-the-note-in-half-and-half-again-56998701c9.mp3 | She … the note in half and half again. | 1 |
| /audio/production/en-US/supplemental/the-snail-along-leaving-a-silver-line-ae18ce9097.mp3 | The snail … along, leaving a silver line. | 1 |
| /audio/production/en-US/supplemental/he-the-balloon-until-it-nearly-burst-7ea6c9e7e6.mp3 | He … the balloon until it nearly burst. | 1 |
| /audio/production/en-US/supplemental/dad-the-squeaky-wheel-with-oil-8935dfdeb5.mp3 | Dad … the squeaky wheel with oil. | 1 |
| /audio/production/en-US/supplemental/bees-from-rose-to-rose-4e1171f803.mp3 | Bees … from rose to rose. | 1 |
| /audio/production/en-US/supplemental/the-ice-slowly-in-the-warm-sun-6aecc787da.mp3 | The ice … slowly in the warm sun. | 1 |
| /audio/production/en-US/supplemental/the-wind-the-washing-dry-fc8a2ba1f6.mp3 | The wind … the washing dry. | 1 |
| /audio/production/en-US/supplemental/the-baby-at-every-funny-face-291185dc57.mp3 | The baby … at every funny face. | 1 |

## 3. Passage read-alouds

| File | Script | Used by |
|---|---|---|

## 4. Single-word recordings (shared pool /audio/child-mode/words)

0 of 1483 are missing — record the missing set below; the rest already exist in the pool.

| File | Word | Used by |
|---|---|---|

## 5. Phrase recordings (shared pool /audio/child-mode/phrases)

| File | Script | Used by |
|---|---|---|

## 6. Images — missing slots with drawing briefs

All 1517 image slots resolve to existing art on disk. Any NEW art must follow the image spec above.

## Delivery

1. Land audio under `public/audio/…` and images under `public/images/…` at the exact paths above.
2. Wire prompt/sentence/passage audio in `audioPreferenceManifest` keyed by script text; word/phrase pools are picked up by the existing resolvers.
3. Run `node tools/assessmentRebuild/mediaRequest.mjs` — the missing counts above must all reach 0.
4. Run the media QA pass; nothing ships with `qaStatus` below approved.
