# Kimi Master Missing Media Request

Generated: 2026-06-05

This is the current consolidated request for missing/insufficient assessment media. It combines the strict workbook priority audit with the variation blockers that are still failing the assessment contract checks.

## Production Totals

| Bucket | Images | Audio | Note |
| --- | --- | --- | --- |
| HFW unique sentence-scene variants | 444 | 0 | Needed because reused HFW images still fail runtime variation. |
| Rhyming unique target-scene variants | 572 | 0 | Needed so repeated targets/families feel genuinely new. |
| Workbook priority non-HFW direct assets | 587 | 169 | Language, grammar, homophones, morphology, plurals, prepositions. |
| Total production ask | 1603 | 169 | Do not include context-only rows as direct media. |

## Priority Counts From Audit

| Priority | Rows |
| --- | --- |
| P1 | 467 |
| P2 | 390 |
| P3 | 0 |
| P4 | 1 |

## Direct Missing Assets By Skill

| Skill | Rows | Images | Audio |
| --- | --- | --- | --- |
| adjectives | 81 | 45 | 80 |
| antonyms_synonyms | 139 | 139 | 0 |
| hfw_1_25 | 21 | 21 | 0 |
| hfw_26_50 | 21 | 21 | 0 |
| hfw_51_75 | 11 | 11 | 0 |
| hfw_76_100 | 6 | 6 | 0 |
| homophones_homonyms | 69 | 69 | 0 |
| nouns | 5 | 2 | 4 |
| plurals | 90 | 90 | 0 |
| prefixes_suffixes | 187 | 187 | 0 |
| prepositions | 6 | 6 | 0 |
| verbs | 90 | 49 | 85 |

## Global Image Rules

- Use warm cartoon-realistic educational style matching the approved LiteracyPath assessment media.
- No printed text, letters, captions, signs, labels, speech bubbles, logos, watermarks, UI, or brand marks.
- Use natural colors unless the target word itself is a color.
- Do not give faces, eyes, smiles, or expressions to ordinary non-living objects unless already required by a character scene.
- Each variant must be visually distinct: different setting, pose, camera angle, action, prop layout, or scene composition.
- Do not generate fake compounds, non-words, obscure padding, or adult/inappropriate items.

## Global Audio Rules

- Use clear child-friendly American English, matching the quality of the approved Kimi non-AI child voice assets where possible.
- Whole word only, spoken once naturally. Do not spell words unless explicitly requested elsewhere.
- No music, sound effects, reverb, robotic voice, compression artifacts, mouth clicks, clipping, or background noise.
- Normalize volume consistently with existing approved vocabulary audio.
- MP3 preferred for audio returns. WEBP preferred for images.

## HFW Unique Scene Variant Request

Create 444 new HFW sentence-scene images total: 111 per HFW band. These are not one-image-per-word flashcards. Each image must support a unique sentence/context so the same HFW word can appear in genuinely different questions.

| Band | New Images | Words |
| --- | --- | --- |
| hfw-1-25 | 111 | the, to, and, a, i, you, it, in, said, for, up, look, is, go, we, little, can, see, me, my, on, one, big, come, like |
| hfw-26-50 | 111 | down, not, play, all, are, as, be, but, came, from, have, he, she, they, was, with, that, then, this, what, when, where, will, help, make |
| hfw-51-75 | 111 | after, again, an, any, around, ask, away, before, by, could, every, find, fly, found, funny, give, going, had, has, her, here, him, his, how, into |
| hfw-76-100 | 111 | just, know, let, live, made, may, must, new, now, of, old, once, open, our, out, over, please, pretty, put, read, round, some, take, thank, yes |

Naming pattern: `public/images/assessment/hfw/variants/{band}/{word}-{phase}-{variant}.webp`

HFW examples that are acceptable:

- `go`: `We ___ home.`, `Can we ___ now?`, `I will ___ with you.`, `They ___ to school.`
- `you`: `Can ___ swim?`, `I like ___.`, `Do ___ like pizza?`, `___ are tall.`

Avoid ambiguous clozes like `I see ___ dog.` if both `a` and `the` appear as choices.

## Rhyming Unique Target-Scene Variant Request

Create 572 new rhyming target-scene images using the existing real rhyming targets/families. Do not create non-words or padding words. The goal is four or more genuinely different visual variants per active target/family, with buffer.

Naming pattern: `public/images/assessment/rhyming/variants/{family}/{target}-{variant}.webp`

Example: `pig` can have separate target images for answer sets using `big`, `wig`, `fig`, etc., but each prompt image must be visually different.

## Non-HFW Direct Production Rows

The CSV and JSON files contain this full list with prompts and suggested paths. The table below is also complete.

| ID | Pri | Skill | Target | Pair | Need Image | Need Audio | Suggested Image Path | Suggested Audio Path | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| wm-0001 | P1 | adjectives | angry |  | yes | yes | public/images/assessment/language/variants/adjectives/angry-01.webp | public/audio/vocabulary/angry.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0002 | P1 | adjectives | awake |  | yes | yes | public/images/assessment/language/variants/adjectives/awake-01.webp | public/audio/vocabulary/awake.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0003 | P1 | adjectives | best |  | no | yes |  | public/audio/vocabulary/best.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0004 | P1 | adjectives | better |  | no | yes |  | public/audio/vocabulary/better.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0005 | P1 | adjectives | brave |  | no | yes |  | public/audio/vocabulary/brave.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0006 | P1 | adjectives | brown |  | no | yes |  | public/audio/vocabulary/brown.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0007 | P1 | adjectives | bumpy |  | no | yes |  | public/audio/vocabulary/bumpy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0008 | P1 | adjectives | busy |  | yes | yes | public/images/assessment/language/variants/adjectives/busy-01.webp | public/audio/vocabulary/busy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0009 | P1 | adjectives | calm |  | no | yes |  | public/audio/vocabulary/calm.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0010 | P1 | adjectives | careful |  | yes | yes | public/images/assessment/language/variants/adjectives/careful-01.webp | public/audio/vocabulary/careful.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0011 | P1 | adjectives | careless |  | yes | yes | public/images/assessment/language/variants/adjectives/careless-01.webp | public/audio/vocabulary/careless.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0012 | P1 | adjectives | clear |  | no | yes |  | public/audio/vocabulary/clear.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0013 | P1 | adjectives | cloudy |  | yes | yes | public/images/assessment/language/variants/adjectives/cloudy-01.webp | public/audio/vocabulary/cloudy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0014 | P1 | adjectives | colorful |  | yes | yes | public/images/assessment/language/variants/adjectives/colorful-01.webp | public/audio/vocabulary/colorful.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0015 | P1 | adjectives | cool |  | no | yes |  | public/audio/vocabulary/cool.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0016 | P1 | adjectives | curved |  | yes | yes | public/images/assessment/language/variants/adjectives/curved-01.webp | public/audio/vocabulary/curved.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0017 | P1 | adjectives | deep |  | no | yes |  | public/audio/vocabulary/deep.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0018 | P1 | adjectives | different |  | no | yes |  | public/audio/vocabulary/different.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0019 | P1 | adjectives | dull |  | yes | yes | public/images/assessment/language/variants/adjectives/dull-01.webp | public/audio/vocabulary/dull.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0020 | P1 | adjectives | early |  | yes | yes | public/images/assessment/language/variants/adjectives/early-01.webp | public/audio/vocabulary/early.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0021 | P1 | adjectives | easy |  | yes | yes | public/images/assessment/language/variants/adjectives/easy-01.webp | public/audio/vocabulary/easy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0022 | P1 | adjectives | fluffy |  | no | yes |  | public/audio/vocabulary/fluffy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0023 | P1 | adjectives | friendly |  | yes | yes | public/images/assessment/language/variants/adjectives/friendly-01.webp | public/audio/vocabulary/friendly.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0024 | P1 | adjectives | funny |  | yes | yes | public/images/assessment/language/variants/adjectives/funny-01.webp | public/audio/vocabulary/funny.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0025 | P1 | adjectives | fuzzy |  | yes | yes | public/images/assessment/language/variants/adjectives/fuzzy-01.webp | public/audio/vocabulary/fuzzy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0026 | P1 | adjectives | gentle |  | no | yes |  | public/audio/vocabulary/gentle.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0027 | P1 | adjectives | gold |  | yes | yes | public/images/assessment/language/variants/adjectives/gold-01.webp | public/audio/vocabulary/gold.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0028 | P1 | adjectives | good |  | no | yes |  | public/audio/vocabulary/good.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0029 | P1 | adjectives | harder |  | yes | yes | public/images/assessment/language/variants/adjectives/harder-01.webp | public/audio/vocabulary/harder.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0030 | P1 | adjectives | helpful |  | yes | yes | public/images/assessment/language/variants/adjectives/helpful-01.webp | public/audio/vocabulary/helpful.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0031 | P1 | adjectives | honest |  | yes | yes | public/images/assessment/language/variants/adjectives/honest-01.webp | public/audio/vocabulary/honest.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0032 | P1 | adjectives | huge |  | no | yes |  | public/audio/vocabulary/huge.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0033 | P1 | adjectives | kind |  | no | yes |  | public/audio/vocabulary/kind.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0034 | P1 | adjectives | large |  | yes | yes | public/images/assessment/language/variants/adjectives/large-01.webp | public/audio/vocabulary/large.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0035 | P1 | adjectives | last |  | no | yes |  | public/audio/vocabulary/last.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0036 | P1 | adjectives | late |  | no | yes |  | public/audio/vocabulary/late.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0037 | P1 | adjectives | lightweight |  | yes | yes | public/images/assessment/language/variants/adjectives/lightweight-01.webp | public/audio/vocabulary/lightweight.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0038 | P1 | adjectives | little |  | yes | no | public/images/assessment/language/variants/adjectives/little-01.webp |  | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0039 | P1 | adjectives | lonely |  | yes | yes | public/images/assessment/language/variants/adjectives/lonely-01.webp | public/audio/vocabulary/lonely.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0040 | P1 | adjectives | messy |  | yes | yes | public/images/assessment/language/variants/adjectives/messy-01.webp | public/audio/vocabulary/messy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0041 | P1 | adjectives | narrow |  | yes | yes | public/images/assessment/language/variants/adjectives/narrow-01.webp | public/audio/vocabulary/narrow.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0042 | P1 | adjectives | neat |  | no | yes |  | public/audio/vocabulary/neat.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0043 | P1 | adjectives | noisy |  | no | yes |  | public/audio/vocabulary/noisy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0044 | P1 | adjectives | old |  | no | yes |  | public/audio/vocabulary/old.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0045 | P1 | adjectives | patient |  | yes | yes | public/images/assessment/language/variants/adjectives/patient-01.webp | public/audio/vocabulary/patient.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0046 | P1 | adjectives | pink |  | no | yes |  | public/audio/vocabulary/pink.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0047 | P1 | adjectives | polite |  | yes | yes | public/images/assessment/language/variants/adjectives/polite-01.webp | public/audio/vocabulary/polite.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0048 | P1 | adjectives | proud |  | no | yes |  | public/audio/vocabulary/proud.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0049 | P1 | adjectives | purple |  | no | yes |  | public/audio/vocabulary/purple.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0050 | P1 | adjectives | rainy |  | yes | yes | public/images/assessment/language/variants/adjectives/rainy-01.webp | public/audio/vocabulary/rainy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0051 | P1 | adjectives | rough |  | no | yes |  | public/audio/vocabulary/rough.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0052 | P1 | adjectives | safe |  | yes | yes | public/images/assessment/language/variants/adjectives/safe-01.webp | public/audio/vocabulary/safe.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0053 | P1 | adjectives | salty |  | yes | yes | public/images/assessment/language/variants/adjectives/salty-01.webp | public/audio/vocabulary/salty.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0054 | P1 | adjectives | same |  | no | yes |  | public/audio/vocabulary/same.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0055 | P1 | adjectives | serious |  | yes | yes | public/images/assessment/language/variants/adjectives/serious-01.webp | public/audio/vocabulary/serious.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0056 | P1 | adjectives | shallow |  | yes | yes | public/images/assessment/language/variants/adjectives/shallow-01.webp | public/audio/vocabulary/shallow.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0057 | P1 | adjectives | sharp |  | no | yes |  | public/audio/vocabulary/sharp.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0058 | P1 | adjectives | shy |  | no | yes |  | public/audio/vocabulary/shy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0059 | P1 | adjectives | silly |  | yes | yes | public/images/assessment/language/variants/adjectives/silly-01.webp | public/audio/vocabulary/silly.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0060 | P1 | adjectives | silver |  | yes | yes | public/images/assessment/language/variants/adjectives/silver-01.webp | public/audio/vocabulary/silver.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0061 | P1 | adjectives | simple |  | yes | yes | public/images/assessment/language/variants/adjectives/simple-01.webp | public/audio/vocabulary/simple.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0062 | P1 | adjectives | sleepy |  | yes | yes | public/images/assessment/language/variants/adjectives/sleepy-01.webp | public/audio/vocabulary/sleepy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0063 | P1 | adjectives | slippery |  | yes | yes | public/images/assessment/language/variants/adjectives/slippery-01.webp | public/audio/vocabulary/slippery.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0064 | P1 | adjectives | smooth |  | no | yes |  | public/audio/vocabulary/smooth.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0065 | P1 | adjectives | snowy |  | yes | yes | public/images/assessment/language/variants/adjectives/snowy-01.webp | public/audio/vocabulary/snowy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0066 | P1 | adjectives | spotted |  | yes | yes | public/images/assessment/language/variants/adjectives/spotted-01.webp | public/audio/vocabulary/spotted.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0067 | P1 | adjectives | square |  | no | yes |  | public/audio/vocabulary/square.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0068 | P1 | adjectives | stale |  | yes | yes | public/images/assessment/language/variants/adjectives/stale-01.webp | public/audio/vocabulary/stale.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0069 | P1 | adjectives | sticky |  | yes | yes | public/images/assessment/language/variants/adjectives/sticky-01.webp | public/audio/vocabulary/sticky.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0070 | P1 | adjectives | straight |  | yes | yes | public/images/assessment/language/variants/adjectives/straight-01.webp | public/audio/vocabulary/straight.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0071 | P1 | adjectives | striped |  | no | yes |  | public/audio/vocabulary/striped.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0072 | P1 | adjectives | strong |  | no | yes |  | public/audio/vocabulary/strong.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0073 | P1 | adjectives | sunny |  | yes | yes | public/images/assessment/language/variants/adjectives/sunny-01.webp | public/audio/vocabulary/sunny.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0074 | P1 | adjectives | sweet |  | no | yes |  | public/audio/vocabulary/sweet.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0075 | P1 | adjectives | thankful |  | yes | yes | public/images/assessment/language/variants/adjectives/thankful-01.webp | public/audio/vocabulary/thankful.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0076 | P1 | adjectives | thick |  | no | yes |  | public/audio/vocabulary/thick.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0077 | P1 | adjectives | tiny |  | no | yes |  | public/audio/vocabulary/tiny.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0078 | P1 | adjectives | tricky |  | yes | yes | public/images/assessment/language/variants/adjectives/tricky-01.webp | public/audio/vocabulary/tricky.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0079 | P1 | adjectives | warm |  | no | yes |  | public/audio/vocabulary/warm.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0080 | P1 | adjectives | wide |  | no | yes |  | public/audio/vocabulary/wide.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0081 | P1 | adjectives | windy |  | yes | yes | public/images/assessment/language/variants/adjectives/windy-01.webp | public/audio/vocabulary/windy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0082 | P1 | antonyms_synonyms | adore | love/adore | yes | no | public/images/assessment/language/variants/antonyms-synonyms/love-adore-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0083 | P1 | antonyms_synonyms | afraid | brave/afraid | yes | no | public/images/assessment/language/variants/antonyms-synonyms/brave-afraid-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0084 | P1 | antonyms_synonyms | afraid | afraid/scared | yes | no | public/images/assessment/language/variants/antonyms-synonyms/afraid-scared-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0085 | P1 | antonyms_synonyms | after | before/after | yes | no | public/images/assessment/language/variants/antonyms-synonyms/before-after-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0086 | P1 | antonyms_synonyms | after | after/later | yes | no | public/images/assessment/language/variants/antonyms-synonyms/after-later-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0087 | P1 | antonyms_synonyms | alive | dead/alive | yes | no | public/images/assessment/language/variants/antonyms-synonyms/dead-alive-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0088 | P1 | antonyms_synonyms | ancient | old/ancient | yes | no | public/images/assessment/language/variants/antonyms-synonyms/old-ancient-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0089 | P1 | antonyms_synonyms | angry | mad/angry | yes | no | public/images/assessment/language/variants/antonyms-synonyms/mad-angry-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0090 | P1 | antonyms_synonyms | answer | answer/reply | yes | no | public/images/assessment/language/variants/antonyms-synonyms/answer-reply-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0091 | P1 | antonyms_synonyms | apart | together/apart | yes | no | public/images/assessment/language/variants/antonyms-synonyms/together-apart-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0092 | P1 | antonyms_synonyms | arid | dry/arid | yes | no | public/images/assessment/language/variants/antonyms-synonyms/dry-arid-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0093 | P1 | antonyms_synonyms | ask | ask/question | yes | no | public/images/assessment/language/variants/antonyms-synonyms/ask-question-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0094 | P1 | antonyms_synonyms | asleep | awake/asleep | yes | no | public/images/assessment/language/variants/antonyms-synonyms/awake-asleep-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0095 | P1 | antonyms_synonyms | assist | help/assist | yes | no | public/images/assessment/language/variants/antonyms-synonyms/help-assist-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0096 | P1 | antonyms_synonyms | attempt | try/attempt | yes | no | public/images/assessment/language/variants/antonyms-synonyms/try-attempt-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0097 | P1 | antonyms_synonyms | awake | awake/asleep | yes | no | public/images/assessment/language/variants/antonyms-synonyms/awake-asleep-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0098 | P1 | antonyms_synonyms | before | before/after | yes | no | public/images/assessment/language/variants/antonyms-synonyms/before-after-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0099 | P1 | antonyms_synonyms | before | before/earlier | yes | no | public/images/assessment/language/variants/antonyms-synonyms/before-earlier-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0100 | P1 | antonyms_synonyms | bold | brave/bold | yes | no | public/images/assessment/language/variants/antonyms-synonyms/brave-bold-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0101 | P1 | antonyms_synonyms | bottom | top/bottom | yes | no | public/images/assessment/language/variants/antonyms-synonyms/top-bottom-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0102 | P1 | antonyms_synonyms | busy | busy/free | yes | no | public/images/assessment/language/variants/antonyms-synonyms/busy-free-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0103 | P1 | antonyms_synonyms | careful | careful/careless | yes | no | public/images/assessment/language/variants/antonyms-synonyms/careful-careless-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0104 | P1 | antonyms_synonyms | careless | careful/careless | yes | no | public/images/assessment/language/variants/antonyms-synonyms/careful-careless-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0105 | P1 | antonyms_synonyms | chilly | cold/chilly | yes | no | public/images/assessment/language/variants/antonyms-synonyms/cold-chilly-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0106 | P1 | antonyms_synonyms | clever | smart/clever | yes | no | public/images/assessment/language/variants/antonyms-synonyms/smart-clever-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0107 | P1 | antonyms_synonyms | cloudy | clear/cloudy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/clear-cloudy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0108 | P1 | antonyms_synonyms | come | come/go | yes | no | public/images/assessment/language/variants/antonyms-synonyms/come-go-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0109 | P1 | antonyms_synonyms | complicated | simple/complicated | yes | no | public/images/assessment/language/variants/antonyms-synonyms/simple-complicated-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0110 | P1 | antonyms_synonyms | conceal | hide/conceal | yes | no | public/images/assessment/language/variants/antonyms-synonyms/hide-conceal-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0111 | P1 | antonyms_synonyms | construct | build/construct | yes | no | public/images/assessment/language/variants/antonyms-synonyms/build-construct-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0112 | P1 | antonyms_synonyms | correct | right/correct | yes | no | public/images/assessment/language/variants/antonyms-synonyms/right-correct-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0113 | P1 | antonyms_synonyms | create | make/create | yes | no | public/images/assessment/language/variants/antonyms-synonyms/make-create-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0114 | P1 | antonyms_synonyms | crooked | straight/crooked | yes | no | public/images/assessment/language/variants/antonyms-synonyms/straight-crooked-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0115 | P1 | antonyms_synonyms | dangerous | safe/dangerous | yes | no | public/images/assessment/language/variants/antonyms-synonyms/safe-dangerous-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0116 | P1 | antonyms_synonyms | dash | run/dash | yes | no | public/images/assessment/language/variants/antonyms-synonyms/run-dash-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0117 | P1 | antonyms_synonyms | delayed | early/delayed | yes | no | public/images/assessment/language/variants/antonyms-synonyms/early-delayed-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0118 | P1 | antonyms_synonyms | difficult | hard/difficult | yes | no | public/images/assessment/language/variants/antonyms-synonyms/hard-difficult-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0119 | P1 | antonyms_synonyms | discover | find/discover | yes | no | public/images/assessment/language/variants/antonyms-synonyms/find-discover-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0120 | P1 | antonyms_synonyms | dishonest | honest/dishonest | yes | no | public/images/assessment/language/variants/antonyms-synonyms/honest-dishonest-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0121 | P1 | antonyms_synonyms | display | show/display | yes | no | public/images/assessment/language/variants/antonyms-synonyms/show-display-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0122 | P1 | antonyms_synonyms | distant | far/distant | yes | no | public/images/assessment/language/variants/antonyms-synonyms/far-distant-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0123 | P1 | antonyms_synonyms | down | up/down | yes | no | public/images/assessment/language/variants/antonyms-synonyms/up-down-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0124 | P1 | antonyms_synonyms | dull | sharp/dull | yes | no | public/images/assessment/language/variants/antonyms-synonyms/sharp-dull-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0125 | P1 | antonyms_synonyms | earlier | before/earlier | yes | no | public/images/assessment/language/variants/antonyms-synonyms/before-earlier-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0126 | P1 | antonyms_synonyms | early | early/late | yes | no | public/images/assessment/language/variants/antonyms-synonyms/early-late-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0127 | P1 | antonyms_synonyms | easy | easy/hard | yes | no | public/images/assessment/language/variants/antonyms-synonyms/easy-hard-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0128 | P1 | antonyms_synonyms | easy | easy/simple | yes | no | public/images/assessment/language/variants/antonyms-synonyms/easy-simple-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0129 | P1 | antonyms_synonyms | employ | use/employ | yes | no | public/images/assessment/language/variants/antonyms-synonyms/use-employ-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0130 | P1 | antonyms_synonyms | end | finish/end | yes | no | public/images/assessment/language/variants/antonyms-synonyms/finish-end-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0131 | P1 | antonyms_synonyms | fake | real/fake | yes | no | public/images/assessment/language/variants/antonyms-synonyms/real-fake-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0132 | P1 | antonyms_synonyms | false | true/false | yes | no | public/images/assessment/language/variants/antonyms-synonyms/true-false-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0133 | P1 | antonyms_synonyms | false | false/untrue | yes | no | public/images/assessment/language/variants/antonyms-synonyms/false-untrue-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0134 | P1 | antonyms_synonyms | filled | empty/filled | yes | no | public/images/assessment/language/variants/antonyms-synonyms/empty-filled-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0135 | P1 | antonyms_synonyms | filled | full/filled | yes | no | public/images/assessment/language/variants/antonyms-synonyms/full-filled-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0136 | P1 | antonyms_synonyms | find | find/discover | yes | no | public/images/assessment/language/variants/antonyms-synonyms/find-discover-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0137 | P1 | antonyms_synonyms | firm | hard/firm | yes | no | public/images/assessment/language/variants/antonyms-synonyms/hard-firm-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0138 | P1 | antonyms_synonyms | fragile | strong/fragile | yes | no | public/images/assessment/language/variants/antonyms-synonyms/strong-fragile-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0139 | P1 | antonyms_synonyms | fragile | weak/fragile | yes | no | public/images/assessment/language/variants/antonyms-synonyms/weak-fragile-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0140 | P1 | antonyms_synonyms | friendly | friendly/unfriendly | yes | no | public/images/assessment/language/variants/antonyms-synonyms/friendly-unfriendly-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0141 | P1 | antonyms_synonyms | front | front/back | yes | no | public/images/assessment/language/variants/antonyms-synonyms/front-back-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0142 | P1 | antonyms_synonyms | funny | funny/silly | yes | no | public/images/assessment/language/variants/antonyms-synonyms/funny-silly-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0143 | P1 | antonyms_synonyms | giggle | laugh/giggle | yes | no | public/images/assessment/language/variants/antonyms-synonyms/laugh-giggle-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0144 | P1 | antonyms_synonyms | give | give/take | yes | no | public/images/assessment/language/variants/antonyms-synonyms/give-take-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0145 | P1 | antonyms_synonyms | give | give/offer | yes | no | public/images/assessment/language/variants/antonyms-synonyms/give-offer-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0146 | P1 | antonyms_synonyms | go | come/go | yes | no | public/images/assessment/language/variants/antonyms-synonyms/come-go-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0147 | P1 | antonyms_synonyms | great | good/great | yes | no | public/images/assessment/language/variants/antonyms-synonyms/good-great-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0148 | P1 | antonyms_synonyms | healthy | healthy/sick | yes | no | public/images/assessment/language/variants/antonyms-synonyms/healthy-sick-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0149 | P1 | antonyms_synonyms | hidden | visible/hidden | yes | no | public/images/assessment/language/variants/antonyms-synonyms/visible-hidden-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0150 | P1 | antonyms_synonyms | honest | honest/dishonest | yes | no | public/images/assessment/language/variants/antonyms-synonyms/honest-dishonest-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0151 | P1 | antonyms_synonyms | important | important/unimportant | yes | no | public/images/assessment/language/variants/antonyms-synonyms/important-unimportant-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0152 | P1 | antonyms_synonyms | impossible | possible/impossible | yes | no | public/images/assessment/language/variants/antonyms-synonyms/possible-impossible-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0153 | P1 | antonyms_synonyms | in | in/out | yes | no | public/images/assessment/language/variants/antonyms-synonyms/in-out-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0154 | P1 | antonyms_synonyms | incorrect | wrong/incorrect | yes | no | public/images/assessment/language/variants/antonyms-synonyms/wrong-incorrect-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0155 | P1 | antonyms_synonyms | large | large/tiny | yes | no | public/images/assessment/language/variants/antonyms-synonyms/large-tiny-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0156 | P1 | antonyms_synonyms | large | big/large | yes | no | public/images/assessment/language/variants/antonyms-synonyms/big-large-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0157 | P1 | antonyms_synonyms | later | after/later | yes | no | public/images/assessment/language/variants/antonyms-synonyms/after-later-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0158 | P1 | antonyms_synonyms | like | like/enjoy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/like-enjoy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0159 | P1 | antonyms_synonyms | little | small/little | yes | no | public/images/assessment/language/variants/antonyms-synonyms/small-little-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0160 | P1 | antonyms_synonyms | loose | loose/tight | yes | no | public/images/assessment/language/variants/antonyms-synonyms/loose-tight-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0161 | P1 | antonyms_synonyms | lose | win/lose | yes | no | public/images/assessment/language/variants/antonyms-synonyms/win-lose-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0162 | P1 | antonyms_synonyms | lots | many/lots | yes | no | public/images/assessment/language/variants/antonyms-synonyms/many-lots-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0163 | P1 | antonyms_synonyms | make | make/create | yes | no | public/images/assessment/language/variants/antonyms-synonyms/make-create-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0164 | P1 | antonyms_synonyms | messy | messy/neat | yes | no | public/images/assessment/language/variants/antonyms-synonyms/messy-neat-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0165 | P1 | antonyms_synonyms | messy | messy/untidy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/messy-untidy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0166 | P1 | antonyms_synonyms | munch | eat/munch | yes | no | public/images/assessment/language/variants/antonyms-synonyms/eat-munch-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0167 | P1 | antonyms_synonyms | narrow | wide/narrow | yes | no | public/images/assessment/language/variants/antonyms-synonyms/wide-narrow-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0168 | P1 | antonyms_synonyms | needy | poor/needy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/poor-needy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0169 | P1 | antonyms_synonyms | offer | give/offer | yes | no | public/images/assessment/language/variants/antonyms-synonyms/give-offer-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0170 | P1 | antonyms_synonyms | on | on/off | yes | no | public/images/assessment/language/variants/antonyms-synonyms/on-off-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0171 | P1 | antonyms_synonyms | out | in/out | yes | no | public/images/assessment/language/variants/antonyms-synonyms/in-out-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0172 | P1 | antonyms_synonyms | polite | polite/rude | yes | no | public/images/assessment/language/variants/antonyms-synonyms/polite-rude-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0173 | P1 | antonyms_synonyms | possible | possible/impossible | yes | no | public/images/assessment/language/variants/antonyms-synonyms/possible-impossible-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0174 | P1 | antonyms_synonyms | powerful | strong/powerful | yes | no | public/images/assessment/language/variants/antonyms-synonyms/strong-powerful-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0175 | P1 | antonyms_synonyms | pretty | pretty/beautiful | yes | no | public/images/assessment/language/variants/antonyms-synonyms/pretty-beautiful-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0176 | P1 | antonyms_synonyms | private | public/private | yes | no | public/images/assessment/language/variants/antonyms-synonyms/public-private-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0177 | P1 | antonyms_synonyms | public | public/private | yes | no | public/images/assessment/language/variants/antonyms-synonyms/public-private-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0178 | P1 | antonyms_synonyms | purchase | buy/purchase | yes | no | public/images/assessment/language/variants/antonyms-synonyms/buy-purchase-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0179 | P1 | antonyms_synonyms | rainy | sunny/rainy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/sunny-rainy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0180 | P1 | antonyms_synonyms | raise | raise/lift | yes | no | public/images/assessment/language/variants/antonyms-synonyms/raise-lift-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0181 | P1 | antonyms_synonyms | real | real/fake | yes | no | public/images/assessment/language/variants/antonyms-synonyms/real-fake-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0182 | P1 | antonyms_synonyms | real | true/real | yes | no | public/images/assessment/language/variants/antonyms-synonyms/true-real-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0183 | P1 | antonyms_synonyms | receive | get/receive | yes | no | public/images/assessment/language/variants/antonyms-synonyms/get-receive-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0184 | P1 | antonyms_synonyms | relax | rest/relax | yes | no | public/images/assessment/language/variants/antonyms-synonyms/rest-relax-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0185 | P1 | antonyms_synonyms | reply | answer/reply | yes | no | public/images/assessment/language/variants/antonyms-synonyms/answer-reply-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0186 | P1 | antonyms_synonyms | require | need/require | yes | no | public/images/assessment/language/variants/antonyms-synonyms/need-require-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0187 | P1 | antonyms_synonyms | rude | polite/rude | yes | no | public/images/assessment/language/variants/antonyms-synonyms/polite-rude-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0188 | P1 | antonyms_synonyms | safe | safe/dangerous | yes | no | public/images/assessment/language/variants/antonyms-synonyms/safe-dangerous-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0189 | P1 | antonyms_synonyms | safe | safe/secure | yes | no | public/images/assessment/language/variants/antonyms-synonyms/safe-secure-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0190 | P1 | antonyms_synonyms | scared | afraid/scared | yes | no | public/images/assessment/language/variants/antonyms-synonyms/afraid-scared-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0191 | P1 | antonyms_synonyms | secure | safe/secure | yes | no | public/images/assessment/language/variants/antonyms-synonyms/safe-secure-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0192 | P1 | antonyms_synonyms | see | look/see | yes | no | public/images/assessment/language/variants/antonyms-synonyms/look-see-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0193 | P1 | antonyms_synonyms | shallow | deep/shallow | yes | no | public/images/assessment/language/variants/antonyms-synonyms/deep-shallow-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0194 | P1 | antonyms_synonyms | sick | healthy/sick | yes | no | public/images/assessment/language/variants/antonyms-synonyms/healthy-sick-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0195 | P1 | antonyms_synonyms | silly | funny/silly | yes | no | public/images/assessment/language/variants/antonyms-synonyms/funny-silly-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0196 | P1 | antonyms_synonyms | simple | simple/complicated | yes | no | public/images/assessment/language/variants/antonyms-synonyms/simple-complicated-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0197 | P1 | antonyms_synonyms | simple | easy/simple | yes | no | public/images/assessment/language/variants/antonyms-synonyms/easy-simple-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0198 | P1 | antonyms_synonyms | sleepy | tired/sleepy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/tired-sleepy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0199 | P1 | antonyms_synonyms | some | few/some | yes | no | public/images/assessment/language/variants/antonyms-synonyms/few-some-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0200 | P1 | antonyms_synonyms | stale | fresh/stale | yes | no | public/images/assessment/language/variants/antonyms-synonyms/fresh-stale-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0201 | P1 | antonyms_synonyms | straight | straight/crooked | yes | no | public/images/assessment/language/variants/antonyms-synonyms/straight-crooked-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0202 | P1 | antonyms_synonyms | stroll | walk/stroll | yes | no | public/images/assessment/language/variants/antonyms-synonyms/walk-stroll-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0203 | P1 | antonyms_synonyms | sunny | sunny/rainy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/sunny-rainy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0204 | P1 | antonyms_synonyms | take | give/take | yes | no | public/images/assessment/language/variants/antonyms-synonyms/give-take-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0205 | P1 | antonyms_synonyms | tidy | neat/tidy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/neat-tidy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0206 | P1 | antonyms_synonyms | tired | tired/sleepy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/tired-sleepy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0207 | P1 | antonyms_synonyms | ugly | beautiful/ugly | yes | no | public/images/assessment/language/variants/antonyms-synonyms/beautiful-ugly-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0208 | P1 | antonyms_synonyms | unfriendly | friendly/unfriendly | yes | no | public/images/assessment/language/variants/antonyms-synonyms/friendly-unfriendly-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0209 | P1 | antonyms_synonyms | unhappy | sad/unhappy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/sad-unhappy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0210 | P1 | antonyms_synonyms | unhurried | slow/unhurried | yes | no | public/images/assessment/language/variants/antonyms-synonyms/slow-unhurried-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0211 | P1 | antonyms_synonyms | unimportant | important/unimportant | yes | no | public/images/assessment/language/variants/antonyms-synonyms/important-unimportant-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0212 | P1 | antonyms_synonyms | untidy | messy/untidy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/messy-untidy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0213 | P1 | antonyms_synonyms | untrue | false/untrue | yes | no | public/images/assessment/language/variants/antonyms-synonyms/false-untrue-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0214 | P1 | antonyms_synonyms | upset | glad/upset | yes | no | public/images/assessment/language/variants/antonyms-synonyms/glad-upset-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0215 | P1 | antonyms_synonyms | visible | visible/hidden | yes | no | public/images/assessment/language/variants/antonyms-synonyms/visible-hidden-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0216 | P1 | antonyms_synonyms | wealthy | rich/wealthy | yes | no | public/images/assessment/language/variants/antonyms-synonyms/rich-wealthy-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0217 | P1 | antonyms_synonyms | weep | cry/weep | yes | no | public/images/assessment/language/variants/antonyms-synonyms/cry-weep-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0218 | P1 | antonyms_synonyms | wild | calm/wild | yes | no | public/images/assessment/language/variants/antonyms-synonyms/calm-wild-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0219 | P1 | antonyms_synonyms | wish | want/wish | yes | no | public/images/assessment/language/variants/antonyms-synonyms/want-wish-01.webp |  | Active language-pair phase gap would benefit from disambiguating image/context media. |
| wm-0220 | P1 | nouns | baby |  | no | yes |  | public/audio/vocabulary/baby.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0221 | P1 | nouns | bee |  | yes | no | public/images/assessment/language/variants/nouns/bee-01.webp |  | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0222 | P1 | nouns | boy |  | no | yes |  | public/audio/vocabulary/boy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0223 | P1 | nouns | school |  | no | yes |  | public/audio/vocabulary/school.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0224 | P1 | nouns | stick |  | yes | yes | public/images/assessment/language/variants/nouns/stick-01.webp | public/audio/vocabulary/stick.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0225 | P1 | plurals | apples | apple/apples | yes | no | public/images/assessment/language/variants/plurals/apple-apples-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0226 | P1 | plurals | arms | arm/arms | yes | no | public/images/assessment/language/variants/plurals/arm-arms-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0227 | P1 | plurals | babies | baby/babies | yes | no | public/images/assessment/language/variants/plurals/baby-babies-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0228 | P1 | plurals | bananas | banana/bananas | yes | no | public/images/assessment/language/variants/plurals/banana-bananas-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0229 | P1 | plurals | bears | bear/bears | yes | no | public/images/assessment/language/variants/plurals/bear-bears-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0230 | P1 | plurals | benches | bench/benches | yes | no | public/images/assessment/language/variants/plurals/bench-benches-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0231 | P1 | plurals | berries | berry/berries | yes | no | public/images/assessment/language/variants/plurals/berry-berries-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0232 | P1 | plurals | birds | bird/birds | yes | no | public/images/assessment/language/variants/plurals/bird-birds-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0233 | P1 | plurals | books | book/books | yes | no | public/images/assessment/language/variants/plurals/book-books-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0234 | P1 | plurals | boxes | box/boxes | yes | no | public/images/assessment/language/variants/plurals/box-boxes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0235 | P1 | plurals | boys | boy/boys | yes | no | public/images/assessment/language/variants/plurals/boy-boys-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0236 | P1 | plurals | brushes | brush/brushes | yes | no | public/images/assessment/language/variants/plurals/brush-brushes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0237 | P1 | plurals | bunnies | bunny/bunnies | yes | no | public/images/assessment/language/variants/plurals/bunny-bunnies-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0238 | P1 | plurals | butterflies | butterfly/butterflies | yes | no | public/images/assessment/language/variants/plurals/butterfly-butterflies-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0239 | P1 | plurals | cakes | cake/cakes | yes | no | public/images/assessment/language/variants/plurals/cake-cakes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0240 | P1 | plurals | calves | calf/calves | yes | no | public/images/assessment/language/variants/plurals/calf-calves-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0241 | P1 | plurals | carrots | carrot/carrots | yes | no | public/images/assessment/language/variants/plurals/carrot-carrots-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0242 | P1 | plurals | cats | cat/cats | yes | no | public/images/assessment/language/variants/plurals/cat-cats-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0243 | P1 | plurals | chairs | chair/chairs | yes | no | public/images/assessment/language/variants/plurals/chair-chairs-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0244 | P1 | plurals | chiefs | chief/chiefs | yes | no | public/images/assessment/language/variants/plurals/chief-chiefs-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0245 | P1 | plurals | church | church/churches | yes | no | public/images/assessment/language/variants/plurals/church-churches-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0246 | P1 | plurals | cities | city/cities | yes | no | public/images/assessment/language/variants/plurals/city-cities-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0247 | P1 | plurals | city | city/cities | yes | no | public/images/assessment/language/variants/plurals/city-cities-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0248 | P1 | plurals | cliffs | cliff/cliffs | yes | no | public/images/assessment/language/variants/plurals/cliff-cliffs-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0249 | P1 | plurals | coats | coat/coats | yes | no | public/images/assessment/language/variants/plurals/coat-coats-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0250 | P1 | plurals | cookies | cookie/cookies | yes | no | public/images/assessment/language/variants/plurals/cookie-cookies-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0251 | P1 | plurals | cows | cow/cows | yes | no | public/images/assessment/language/variants/plurals/cow-cows-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0252 | P1 | plurals | cups | cup/cups | yes | no | public/images/assessment/language/variants/plurals/cup-cups-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0253 | P1 | plurals | days | day/days | yes | no | public/images/assessment/language/variants/plurals/day-days-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0254 | P1 | plurals | desks | desk/desks | yes | no | public/images/assessment/language/variants/plurals/desk-desks-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0255 | P1 | plurals | dishes | dish/dishes | yes | no | public/images/assessment/language/variants/plurals/dish-dishes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0256 | P1 | plurals | dogs | dog/dogs | yes | no | public/images/assessment/language/variants/plurals/dog-dogs-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0257 | P1 | plurals | donkeys | donkey/donkeys | yes | no | public/images/assessment/language/variants/plurals/donkey-donkeys-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0258 | P1 | plurals | doors | door/doors | yes | no | public/images/assessment/language/variants/plurals/door-doors-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0259 | P1 | plurals | ears | ear/ears | yes | no | public/images/assessment/language/variants/plurals/ear-ears-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0260 | P1 | plurals | echo | echo/echoes | yes | no | public/images/assessment/language/variants/plurals/echo-echoes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0261 | P1 | plurals | echoes | echo/echoes | yes | no | public/images/assessment/language/variants/plurals/echo-echoes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0262 | P1 | plurals | eyes | eye/eyes | yes | no | public/images/assessment/language/variants/plurals/eye-eyes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0263 | P1 | plurals | families | family/families | yes | no | public/images/assessment/language/variants/plurals/family-families-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0264 | P1 | plurals | flies | fly/flies | yes | no | public/images/assessment/language/variants/plurals/fly-flies-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0265 | P1 | plurals | forks | fork/forks | yes | no | public/images/assessment/language/variants/plurals/fork-forks-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0266 | P1 | plurals | geese | goose/geese | yes | no | public/images/assessment/language/variants/plurals/goose-geese-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0267 | P1 | plurals | goats | goat/goats | yes | no | public/images/assessment/language/variants/plurals/goat-goats-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0268 | P1 | plurals | half | half/halves | yes | no | public/images/assessment/language/variants/plurals/half-halves-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0269 | P1 | plurals | halves | half/halves | yes | no | public/images/assessment/language/variants/plurals/half-halves-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0270 | P1 | plurals | hands | hand/hands | yes | no | public/images/assessment/language/variants/plurals/hand-hands-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0271 | P1 | plurals | hats | hat/hats | yes | no | public/images/assessment/language/variants/plurals/hat-hats-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0272 | P1 | plurals | hero | hero/heroes | yes | no | public/images/assessment/language/variants/plurals/hero-heroes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0273 | P1 | plurals | heroes | hero/heroes | yes | no | public/images/assessment/language/variants/plurals/hero-heroes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0274 | P1 | plurals | horses | horse/horses | yes | no | public/images/assessment/language/variants/plurals/horse-horses-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0275 | P1 | plurals | kangaroos | kangaroo/kangaroos | yes | no | public/images/assessment/language/variants/plurals/kangaroo-kangaroos-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0276 | P1 | plurals | keys | key/keys | yes | no | public/images/assessment/language/variants/plurals/key-keys-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0277 | P1 | plurals | knives | knife/knives | yes | no | public/images/assessment/language/variants/plurals/knife-knives-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0278 | P1 | plurals | ladies | lady/ladies | yes | no | public/images/assessment/language/variants/plurals/lady-ladies-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0279 | P1 | plurals | leaves | leaf/leaves | yes | no | public/images/assessment/language/variants/plurals/leaf-leaves-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0280 | P1 | plurals | legs | leg/legs | yes | no | public/images/assessment/language/variants/plurals/leg-legs-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0281 | P1 | plurals | lions | lion/lions | yes | no | public/images/assessment/language/variants/plurals/lion-lions-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0282 | P1 | plurals | lives | life/lives | yes | no | public/images/assessment/language/variants/plurals/life-lives-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0283 | P1 | plurals | loaves | loaf/loaves | yes | no | public/images/assessment/language/variants/plurals/loaf-loaves-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0284 | P1 | plurals | match | match/matches | yes | no | public/images/assessment/language/variants/plurals/match-matches-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0285 | P1 | plurals | matches | match/matches | yes | no | public/images/assessment/language/variants/plurals/match-matches-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0286 | P1 | plurals | mice | mouse/mice | yes | no | public/images/assessment/language/variants/plurals/mouse-mice-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0287 | P1 | plurals | monkeys | monkey/monkeys | yes | no | public/images/assessment/language/variants/plurals/monkey-monkeys-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0288 | P1 | plurals | noses | nose/noses | yes | no | public/images/assessment/language/variants/plurals/nose-noses-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0289 | P1 | plurals | parties | party/parties | yes | no | public/images/assessment/language/variants/plurals/party-parties-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0290 | P1 | plurals | party | party/parties | yes | no | public/images/assessment/language/variants/plurals/party-parties-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0291 | P1 | plurals | peaches | peach/peaches | yes | no | public/images/assessment/language/variants/plurals/peach-peaches-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0292 | P1 | plurals | pencils | pencil/pencils | yes | no | public/images/assessment/language/variants/plurals/pencil-pencils-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0293 | P1 | plurals | photos | photo/photos | yes | no | public/images/assessment/language/variants/plurals/photo-photos-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0294 | P1 | plurals | pianos | piano/pianos | yes | no | public/images/assessment/language/variants/plurals/piano-pianos-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0295 | P1 | plurals | plates | plate/plates | yes | no | public/images/assessment/language/variants/plurals/plate-plates-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0296 | P1 | plurals | potatoes | potato/potatoes | yes | no | public/images/assessment/language/variants/plurals/potato-potatoes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0297 | P1 | plurals | puppies | puppy/puppies | yes | no | public/images/assessment/language/variants/plurals/puppy-puppies-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0298 | P1 | plurals | radios | radio/radios | yes | no | public/images/assessment/language/variants/plurals/radio-radios-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0299 | P1 | plurals | roofs | roof/roofs | yes | no | public/images/assessment/language/variants/plurals/roof-roofs-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0300 | P1 | plurals | shelves | shelf/shelves | yes | no | public/images/assessment/language/variants/plurals/shelf-shelves-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0301 | P1 | plurals | shoes | shoe/shoes | yes | no | public/images/assessment/language/variants/plurals/shoe-shoes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0302 | P1 | plurals | socks | sock/socks | yes | no | public/images/assessment/language/variants/plurals/sock-socks-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0303 | P1 | plurals | spoons | spoon/spoons | yes | no | public/images/assessment/language/variants/plurals/spoon-spoons-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0304 | P1 | plurals | stories | story/stories | yes | no | public/images/assessment/language/variants/plurals/story-stories-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0305 | P1 | plurals | tables | table/tables | yes | no | public/images/assessment/language/variants/plurals/table-tables-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0306 | P1 | plurals | tigers | tiger/tigers | yes | no | public/images/assessment/language/variants/plurals/tiger-tigers-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0307 | P1 | plurals | tomatoes | tomato/tomatoes | yes | no | public/images/assessment/language/variants/plurals/tomato-tomatoes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0308 | P1 | plurals | toys | toy/toys | yes | no | public/images/assessment/language/variants/plurals/toy-toys-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0309 | P1 | plurals | trays | tray/trays | yes | no | public/images/assessment/language/variants/plurals/tray-trays-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0310 | P1 | plurals | windows | window/windows | yes | no | public/images/assessment/language/variants/plurals/window-windows-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0311 | P1 | plurals | wish | wish/wishes | yes | no | public/images/assessment/language/variants/plurals/wish-wishes-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0312 | P1 | plurals | wolf | wolf/wolves | yes | no | public/images/assessment/language/variants/plurals/wolf-wolves-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0313 | P1 | plurals | wolves | wolf/wolves | yes | no | public/images/assessment/language/variants/plurals/wolf-wolves-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0314 | P1 | plurals | zoos | zoo/zoos | yes | no | public/images/assessment/language/variants/plurals/zoo-zoos-01.webp |  | Active plural expansion needs imageable singular/plural contrast media. |
| wm-0315 | P1 | prepositions | in |  | yes | no | public/images/assessment/language/variants/prepositions/in-01.webp |  | Common spatial preposition needs real scene images, not word art. |
| wm-0316 | P1 | prepositions | in front of |  | yes | no | public/images/assessment/language/variants/prepositions/in-front-of-01.webp |  | Common spatial preposition needs real scene images, not word art. |
| wm-0317 | P1 | prepositions | next to |  | yes | no | public/images/assessment/language/variants/prepositions/next-to-01.webp |  | Common spatial preposition needs real scene images, not word art. |
| wm-0318 | P1 | prepositions | on |  | yes | no | public/images/assessment/language/variants/prepositions/on-01.webp |  | Common spatial preposition needs real scene images, not word art. |
| wm-0319 | P1 | verbs | add |  | no | yes |  | public/audio/vocabulary/add.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0320 | P1 | verbs | answer |  | yes | yes | public/images/assessment/language/variants/verbs/answer-01.webp | public/audio/vocabulary/answer.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0321 | P1 | verbs | arrange |  | yes | yes | public/images/assessment/language/variants/verbs/arrange-01.webp | public/audio/vocabulary/arrange.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0322 | P1 | verbs | ask |  | yes | yes | public/images/assessment/language/variants/verbs/ask-01.webp | public/audio/vocabulary/ask.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0323 | P1 | verbs | balance |  | yes | yes | public/images/assessment/language/variants/verbs/balance-01.webp | public/audio/vocabulary/balance.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0324 | P1 | verbs | bathe |  | yes | yes | public/images/assessment/language/variants/verbs/bathe-01.webp | public/audio/vocabulary/bathe.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0325 | P1 | verbs | borrow |  | yes | yes | public/images/assessment/language/variants/verbs/borrow-01.webp | public/audio/vocabulary/borrow.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0326 | P1 | verbs | bounce |  | yes | yes | public/images/assessment/language/variants/verbs/bounce-01.webp | public/audio/vocabulary/bounce.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0327 | P1 | verbs | bring |  | no | yes |  | public/audio/vocabulary/bring.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0328 | P1 | verbs | build |  | no | yes |  | public/audio/vocabulary/build.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0329 | P1 | verbs | carry |  | no | yes |  | public/audio/vocabulary/carry.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0330 | P1 | verbs | chase |  | no | yes |  | public/audio/vocabulary/chase.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0331 | P1 | verbs | choose |  | no | yes |  | public/audio/vocabulary/choose.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0332 | P1 | verbs | close |  | no | yes |  | public/audio/vocabulary/close.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0333 | P1 | verbs | collect |  | yes | yes | public/images/assessment/language/variants/verbs/collect-01.webp | public/audio/vocabulary/collect.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0334 | P1 | verbs | color |  | yes | yes | public/images/assessment/language/variants/verbs/color-01.webp | public/audio/vocabulary/color.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0335 | P1 | verbs | come |  | yes | no | public/images/assessment/language/variants/verbs/come-01.webp |  | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0336 | P1 | verbs | compare |  | no | yes |  | public/audio/vocabulary/compare.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0337 | P1 | verbs | connect |  | yes | yes | public/images/assessment/language/variants/verbs/connect-01.webp | public/audio/vocabulary/connect.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0338 | P1 | verbs | copy |  | yes | yes | public/images/assessment/language/variants/verbs/copy-01.webp | public/audio/vocabulary/copy.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0339 | P1 | verbs | count |  | no | yes |  | public/audio/vocabulary/count.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0340 | P1 | verbs | cover |  | yes | yes | public/images/assessment/language/variants/verbs/cover-01.webp | public/audio/vocabulary/cover.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0341 | P1 | verbs | cross |  | no | yes |  | public/audio/vocabulary/cross.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0342 | P1 | verbs | dance |  | no | yes |  | public/audio/vocabulary/dance.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0343 | P1 | verbs | decorate |  | yes | yes | public/images/assessment/language/variants/verbs/decorate-01.webp | public/audio/vocabulary/decorate.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0344 | P1 | verbs | describe |  | yes | yes | public/images/assessment/language/variants/verbs/describe-01.webp | public/audio/vocabulary/describe.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0345 | P1 | verbs | discover |  | yes | yes | public/images/assessment/language/variants/verbs/discover-01.webp | public/audio/vocabulary/discover.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0346 | P1 | verbs | divide |  | yes | yes | public/images/assessment/language/variants/verbs/divide-01.webp | public/audio/vocabulary/divide.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0347 | P1 | verbs | drive |  | no | yes |  | public/audio/vocabulary/drive.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0348 | P1 | verbs | eat |  | no | yes |  | public/audio/vocabulary/eat.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0349 | P1 | verbs | explain |  | no | yes |  | public/audio/vocabulary/explain.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0350 | P1 | verbs | explore |  | yes | yes | public/images/assessment/language/variants/verbs/explore-01.webp | public/audio/vocabulary/explore.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0351 | P1 | verbs | fall |  | no | yes |  | public/audio/vocabulary/fall.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0352 | P1 | verbs | find |  | yes | no | public/images/assessment/language/variants/verbs/find-01.webp |  | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0353 | P1 | verbs | finish |  | no | yes |  | public/audio/vocabulary/finish.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0354 | P1 | verbs | fly |  | no | yes |  | public/audio/vocabulary/fly.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0355 | P1 | verbs | fold |  | yes | yes | public/images/assessment/language/variants/verbs/fold-01.webp | public/audio/vocabulary/fold.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0356 | P1 | verbs | follow |  | no | yes |  | public/audio/vocabulary/follow.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0357 | P1 | verbs | gather |  | yes | yes | public/images/assessment/language/variants/verbs/gather-01.webp | public/audio/vocabulary/gather.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0358 | P1 | verbs | give |  | yes | yes | public/images/assessment/language/variants/verbs/give-01.webp | public/audio/vocabulary/give.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0359 | P1 | verbs | glue |  | yes | yes | public/images/assessment/language/variants/verbs/glue-01.webp | public/audio/vocabulary/glue.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0360 | P1 | verbs | go |  | yes | no | public/images/assessment/language/variants/verbs/go-01.webp |  | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0361 | P1 | verbs | grow |  | no | yes |  | public/audio/vocabulary/grow.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0362 | P1 | verbs | help |  | no | yes |  | public/audio/vocabulary/help.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0363 | P1 | verbs | hide |  | no | yes |  | public/audio/vocabulary/hide.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0364 | P1 | verbs | hold |  | no | yes |  | public/audio/vocabulary/hold.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0365 | P1 | verbs | hug |  | no | yes |  | public/audio/vocabulary/hug.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0366 | P1 | verbs | invite |  | yes | yes | public/images/assessment/language/variants/verbs/invite-01.webp | public/audio/vocabulary/invite.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0367 | P1 | verbs | label |  | yes | yes | public/images/assessment/language/variants/verbs/label-01.webp | public/audio/vocabulary/label.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0368 | P1 | verbs | learn |  | no | yes |  | public/audio/vocabulary/learn.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0369 | P1 | verbs | listen |  | no | yes |  | public/audio/vocabulary/listen.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0370 | P1 | verbs | look |  | no | yes |  | public/audio/vocabulary/look.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0371 | P1 | verbs | make |  | yes | no | public/images/assessment/language/variants/verbs/make-01.webp |  | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0372 | P1 | verbs | measure |  | no | yes |  | public/audio/vocabulary/measure.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0373 | P1 | verbs | move |  | no | yes |  | public/audio/vocabulary/move.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0374 | P1 | verbs | notice |  | yes | yes | public/images/assessment/language/variants/verbs/notice-01.webp | public/audio/vocabulary/notice.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0375 | P1 | verbs | pack |  | yes | yes | public/images/assessment/language/variants/verbs/pack-01.webp | public/audio/vocabulary/pack.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0376 | P1 | verbs | play |  | yes | yes | public/images/assessment/language/variants/verbs/play-01.webp | public/audio/vocabulary/play.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0377 | P1 | verbs | point |  | no | yes |  | public/audio/vocabulary/point.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0378 | P1 | verbs | practice |  | yes | yes | public/images/assessment/language/variants/verbs/practice-01.webp | public/audio/vocabulary/practice.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0379 | P1 | verbs | pretend |  | yes | yes | public/images/assessment/language/variants/verbs/pretend-01.webp | public/audio/vocabulary/pretend.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0380 | P1 | verbs | put |  | yes | yes | public/images/assessment/language/variants/verbs/put-01.webp | public/audio/vocabulary/put.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0381 | P1 | verbs | remember |  | yes | yes | public/images/assessment/language/variants/verbs/remember-01.webp | public/audio/vocabulary/remember.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0382 | P1 | verbs | repeat |  | yes | yes | public/images/assessment/language/variants/verbs/repeat-01.webp | public/audio/vocabulary/repeat.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0383 | P1 | verbs | rest |  | no | yes |  | public/audio/vocabulary/rest.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0384 | P1 | verbs | return |  | yes | yes | public/images/assessment/language/variants/verbs/return-01.webp | public/audio/vocabulary/return.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0385 | P1 | verbs | say |  | no | yes |  | public/audio/vocabulary/say.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0386 | P1 | verbs | search |  | yes | yes | public/images/assessment/language/variants/verbs/search-01.webp | public/audio/vocabulary/search.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0387 | P1 | verbs | see |  | yes | yes | public/images/assessment/language/variants/verbs/see-01.webp | public/audio/vocabulary/see.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0388 | P1 | verbs | separate |  | yes | yes | public/images/assessment/language/variants/verbs/separate-01.webp | public/audio/vocabulary/separate.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0389 | P1 | verbs | sing |  | no | yes |  | public/audio/vocabulary/sing.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0390 | P1 | verbs | solve |  | yes | yes | public/images/assessment/language/variants/verbs/solve-01.webp | public/audio/vocabulary/solve.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0391 | P1 | verbs | sprinkle |  | yes | yes | public/images/assessment/language/variants/verbs/sprinkle-01.webp | public/audio/vocabulary/sprinkle.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0392 | P1 | verbs | stay |  | no | yes |  | public/audio/vocabulary/stay.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0393 | P1 | verbs | stretch |  | yes | yes | public/images/assessment/language/variants/verbs/stretch-01.webp | public/audio/vocabulary/stretch.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0394 | P1 | verbs | take |  | yes | no | public/images/assessment/language/variants/verbs/take-01.webp |  | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0395 | P1 | verbs | talk |  | no | yes |  | public/audio/vocabulary/talk.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0396 | P1 | verbs | taste |  | yes | yes | public/images/assessment/language/variants/verbs/taste-01.webp | public/audio/vocabulary/taste.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0397 | P1 | verbs | think |  | no | yes |  | public/audio/vocabulary/think.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0398 | P1 | verbs | tickle |  | yes | yes | public/images/assessment/language/variants/verbs/tickle-01.webp | public/audio/vocabulary/tickle.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0399 | P1 | verbs | touch |  | no | yes |  | public/audio/vocabulary/touch.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0400 | P1 | verbs | travel |  | yes | yes | public/images/assessment/language/variants/verbs/travel-01.webp | public/audio/vocabulary/travel.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0401 | P1 | verbs | try |  | no | yes |  | public/audio/vocabulary/try.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0402 | P1 | verbs | wait |  | no | yes |  | public/audio/vocabulary/wait.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0403 | P1 | verbs | wake |  | yes | yes | public/images/assessment/language/variants/verbs/wake-01.webp | public/audio/vocabulary/wake.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0404 | P1 | verbs | walk |  | no | yes |  | public/audio/vocabulary/walk.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0405 | P1 | verbs | wear |  | no | yes |  | public/audio/vocabulary/wear.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0406 | P1 | verbs | whisper |  | yes | yes | public/images/assessment/language/variants/verbs/whisper-01.webp | public/audio/vocabulary/whisper.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0407 | P1 | verbs | wonder |  | yes | yes | public/images/assessment/language/variants/verbs/wonder-01.webp | public/audio/vocabulary/wonder.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0408 | P1 | verbs | zip |  | no | yes |  | public/audio/vocabulary/zip.mp3 | Active grammar runtime gap: strict grammar variants need approved image and choice audio. |
| wm-0409 | P2 | homophones_homonyms | bare | bare/bear | yes | no | public/images/assessment/language/variants/homophones-homonyms/bare-bear-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0410 | P2 | homophones_homonyms | be | be/bee | yes | no | public/images/assessment/language/variants/homophones-homonyms/be-bee-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0411 | P2 | homophones_homonyms | bee | be/bee | yes | no | public/images/assessment/language/variants/homophones-homonyms/be-bee-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0412 | P2 | homophones_homonyms | blew | blue/blew | yes | no | public/images/assessment/language/variants/homophones-homonyms/blue-blew-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0413 | P2 | homophones_homonyms | bored | board/bored | yes | no | public/images/assessment/language/variants/homophones-homonyms/board-bored-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0414 | P2 | homophones_homonyms | brake | break/brake | yes | no | public/images/assessment/language/variants/homophones-homonyms/break-brake-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0415 | P2 | homophones_homonyms | break | break/brake | yes | no | public/images/assessment/language/variants/homophones-homonyms/break-brake-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0416 | P2 | homophones_homonyms | by | by/buy/bye | yes | no | public/images/assessment/language/variants/homophones-homonyms/by-buy-bye-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0417 | P2 | homophones_homonyms | bye | by/buy/bye | yes | no | public/images/assessment/language/variants/homophones-homonyms/by-buy-bye-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0418 | P2 | homophones_homonyms | cell | cell/sell | yes | no | public/images/assessment/language/variants/homophones-homonyms/cell-sell-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0419 | P2 | homophones_homonyms | cent | cent/sent/scent | yes | no | public/images/assessment/language/variants/homophones-homonyms/cent-sent-scent-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0420 | P2 | homophones_homonyms | clothes | close/clothes | yes | no | public/images/assessment/language/variants/homophones-homonyms/close-clothes-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0421 | P2 | homophones_homonyms | dye | die/dye | yes | no | public/images/assessment/language/variants/homophones-homonyms/die-dye-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0422 | P2 | homophones_homonyms | eight | ate/eight | yes | no | public/images/assessment/language/variants/homophones-homonyms/ate-eight-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0423 | P2 | homophones_homonyms | fare | fair/fare | yes | no | public/images/assessment/language/variants/homophones-homonyms/fair-fare-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0424 | P2 | homophones_homonyms | flour | flower/flour | yes | no | public/images/assessment/language/variants/homophones-homonyms/flower-flour-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0425 | P2 | homophones_homonyms | for | for/four/fore | yes | no | public/images/assessment/language/variants/homophones-homonyms/for-four-fore-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0426 | P2 | homophones_homonyms | fore | for/four/fore | yes | no | public/images/assessment/language/variants/homophones-homonyms/for-four-fore-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0427 | P2 | homophones_homonyms | grate | great/grate | yes | no | public/images/assessment/language/variants/homophones-homonyms/great-grate-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0428 | P2 | homophones_homonyms | great | great/grate | yes | no | public/images/assessment/language/variants/homophones-homonyms/great-grate-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0429 | P2 | homophones_homonyms | heal | heal/heel | yes | no | public/images/assessment/language/variants/homophones-homonyms/heal-heel-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0430 | P2 | homophones_homonyms | heard | heard/herd | yes | no | public/images/assessment/language/variants/homophones-homonyms/heard-herd-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0431 | P2 | homophones_homonyms | heel | heal/heel | yes | no | public/images/assessment/language/variants/homophones-homonyms/heal-heel-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0432 | P2 | homophones_homonyms | here | hear/here | yes | no | public/images/assessment/language/variants/homophones-homonyms/hear-here-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0433 | P2 | homophones_homonyms | hi | hi/high | yes | no | public/images/assessment/language/variants/homophones-homonyms/hi-high-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0434 | P2 | homophones_homonyms | hour | our/hour | yes | no | public/images/assessment/language/variants/homophones-homonyms/our-hour-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0435 | P2 | homophones_homonyms | i | eye/i | yes | no | public/images/assessment/language/variants/homophones-homonyms/eye-i-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0436 | P2 | homophones_homonyms | it's | its/it's | yes | no | public/images/assessment/language/variants/homophones-homonyms/its-it-s-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0437 | P2 | homophones_homonyms | knight | night/knight | yes | no | public/images/assessment/language/variants/homophones-homonyms/night-knight-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0438 | P2 | homophones_homonyms | know | no/know | yes | no | public/images/assessment/language/variants/homophones-homonyms/no-know-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0439 | P2 | homophones_homonyms | knows | nose/knows | yes | no | public/images/assessment/language/variants/homophones-homonyms/nose-knows-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0440 | P2 | homophones_homonyms | loan | loan/lone | yes | no | public/images/assessment/language/variants/homophones-homonyms/loan-lone-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0441 | P2 | homophones_homonyms | lone | loan/lone | yes | no | public/images/assessment/language/variants/homophones-homonyms/loan-lone-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0442 | P2 | homophones_homonyms | made | made/maid | yes | no | public/images/assessment/language/variants/homophones-homonyms/made-maid-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0443 | P2 | homophones_homonyms | maid | made/maid | yes | no | public/images/assessment/language/variants/homophones-homonyms/made-maid-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0444 | P2 | homophones_homonyms | mourning | morning/mourning | yes | no | public/images/assessment/language/variants/homophones-homonyms/morning-mourning-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0445 | P2 | homophones_homonyms | one | one/won | yes | no | public/images/assessment/language/variants/homophones-homonyms/one-won-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0446 | P2 | homophones_homonyms | our | our/hour | yes | no | public/images/assessment/language/variants/homophones-homonyms/our-hour-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0447 | P2 | homophones_homonyms | passed | passed/past | yes | no | public/images/assessment/language/variants/homophones-homonyms/passed-past-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0448 | P2 | homophones_homonyms | peace | piece/peace | yes | no | public/images/assessment/language/variants/homophones-homonyms/piece-peace-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0449 | P2 | homophones_homonyms | principal | principal/principle | yes | no | public/images/assessment/language/variants/homophones-homonyms/principal-principle-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0450 | P2 | homophones_homonyms | principle | principal/principle | yes | no | public/images/assessment/language/variants/homophones-homonyms/principal-principle-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0451 | P2 | homophones_homonyms | reign | rain/reign/rein | yes | no | public/images/assessment/language/variants/homophones-homonyms/rain-reign-rein-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0452 | P2 | homophones_homonyms | rein | rain/reign/rein | yes | no | public/images/assessment/language/variants/homophones-homonyms/rain-reign-rein-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0453 | P2 | homophones_homonyms | roe | row/roe | yes | no | public/images/assessment/language/variants/homophones-homonyms/row-roe-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0454 | P2 | homophones_homonyms | sale | sale/sail | yes | no | public/images/assessment/language/variants/homophones-homonyms/sale-sail-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0455 | P2 | homophones_homonyms | scene | scene/seen | yes | no | public/images/assessment/language/variants/homophones-homonyms/scene-seen-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0456 | P2 | homophones_homonyms | scent | cent/sent/scent | yes | no | public/images/assessment/language/variants/homophones-homonyms/cent-sent-scent-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0457 | P2 | homophones_homonyms | see | see/sea | yes | no | public/images/assessment/language/variants/homophones-homonyms/see-sea-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0458 | P2 | homophones_homonyms | sew | so/sew | yes | no | public/images/assessment/language/variants/homophones-homonyms/so-sew-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0459 | P2 | homophones_homonyms | some | some/sum | yes | no | public/images/assessment/language/variants/homophones-homonyms/some-sum-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0460 | P2 | homophones_homonyms | steel | steal/steel | yes | no | public/images/assessment/language/variants/homophones-homonyms/steal-steel-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0461 | P2 | homophones_homonyms | sum | some/sum | yes | no | public/images/assessment/language/variants/homophones-homonyms/some-sum-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0462 | P2 | homophones_homonyms | tale | tail/tale | yes | no | public/images/assessment/language/variants/homophones-homonyms/tail-tale-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0463 | P2 | homophones_homonyms | they're | there/their/they're | yes | no | public/images/assessment/language/variants/homophones-homonyms/there-their-they-re-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0464 | P2 | homophones_homonyms | throne | throne/thrown | yes | no | public/images/assessment/language/variants/homophones-homonyms/throne-thrown-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0465 | P2 | homophones_homonyms | thrown | throne/thrown | yes | no | public/images/assessment/language/variants/homophones-homonyms/throne-thrown-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0466 | P2 | homophones_homonyms | to | to/too/two | yes | no | public/images/assessment/language/variants/homophones-homonyms/to-too-two-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0467 | P2 | homophones_homonyms | waist | waist/waste | yes | no | public/images/assessment/language/variants/homophones-homonyms/waist-waste-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0468 | P2 | homophones_homonyms | waste | waist/waste | yes | no | public/images/assessment/language/variants/homophones-homonyms/waist-waste-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0469 | P2 | homophones_homonyms | weigh | way/weigh | yes | no | public/images/assessment/language/variants/homophones-homonyms/way-weigh-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0470 | P2 | homophones_homonyms | where | wear/where | yes | no | public/images/assessment/language/variants/homophones-homonyms/wear-where-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0471 | P2 | homophones_homonyms | whether | weather/whether | yes | no | public/images/assessment/language/variants/homophones-homonyms/weather-whether-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0472 | P2 | homophones_homonyms | who's | whose/who's | yes | no | public/images/assessment/language/variants/homophones-homonyms/whose-who-s-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0473 | P2 | homophones_homonyms | whole | hole/whole | yes | no | public/images/assessment/language/variants/homophones-homonyms/hole-whole-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0474 | P2 | homophones_homonyms | whose | whose/who's | yes | no | public/images/assessment/language/variants/homophones-homonyms/whose-who-s-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0475 | P2 | homophones_homonyms | witch | which/witch | yes | no | public/images/assessment/language/variants/homophones-homonyms/which-witch-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0476 | P2 | homophones_homonyms | won | one/won | yes | no | public/images/assessment/language/variants/homophones-homonyms/one-won-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0477 | P2 | homophones_homonyms | you're | your/you're | yes | no | public/images/assessment/language/variants/homophones-homonyms/your-you-re-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0478 | P2 | prefixes_suffixes | agreement |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/agreement-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0479 | P2 | prefixes_suffixes | benches |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/benches-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0480 | P2 | prefixes_suffixes | bicolor |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/bicolor-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0481 | P2 | prefixes_suffixes | biggest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/biggest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0482 | P2 | prefixes_suffixes | bilingual |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/bilingual-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0483 | P2 | prefixes_suffixes | bimonthly |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/bimonthly-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0484 | P2 | prefixes_suffixes | biplane |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/biplane-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0485 | P2 | prefixes_suffixes | birds |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/birds-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0486 | P2 | prefixes_suffixes | bisect |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/bisect-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0487 | P2 | prefixes_suffixes | blocks |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/blocks-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0488 | P2 | prefixes_suffixes | books |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/books-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0489 | P2 | prefixes_suffixes | boxes |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/boxes-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0490 | P2 | prefixes_suffixes | breakable |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/breakable-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0491 | P2 | prefixes_suffixes | brightest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/brightest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0492 | P2 | prefixes_suffixes | brightly |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/brightly-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0493 | P2 | prefixes_suffixes | brushes |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/brushes-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0494 | P2 | prefixes_suffixes | called |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/called-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0495 | P2 | prefixes_suffixes | careful |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/careful-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0496 | P2 | prefixes_suffixes | carefully |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/carefully-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0497 | P2 | prefixes_suffixes | careless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/careless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0498 | P2 | prefixes_suffixes | cats |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/cats-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0499 | P2 | prefixes_suffixes | cheerful |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/cheerful-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0500 | P2 | prefixes_suffixes | colorful |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/colorful-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0501 | P2 | prefixes_suffixes | colorless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/colorless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0502 | P2 | prefixes_suffixes | comfortable |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/comfortable-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0503 | P2 | prefixes_suffixes | countable |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/countable-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0504 | P2 | prefixes_suffixes | cups |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/cups-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0505 | P2 | prefixes_suffixes | darkness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/darkness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0506 | P2 | prefixes_suffixes | development |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/development-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0507 | P2 | prefixes_suffixes | disagree |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/disagree-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0508 | P2 | prefixes_suffixes | disappear |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/disappear-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0509 | P2 | prefixes_suffixes | discomfort |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/discomfort-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0510 | P2 | prefixes_suffixes | disconnect |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/disconnect-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0511 | P2 | prefixes_suffixes | discover |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/discover-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0512 | P2 | prefixes_suffixes | dishes |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/dishes-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0513 | P2 | prefixes_suffixes | dishonest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/dishonest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0514 | P2 | prefixes_suffixes | dislike |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/dislike-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0515 | P2 | prefixes_suffixes | disobey |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/disobey-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0516 | P2 | prefixes_suffixes | disorder |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/disorder-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0517 | P2 | prefixes_suffixes | disrespect |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/disrespect-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0518 | P2 | prefixes_suffixes | dogs |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/dogs-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0519 | P2 | prefixes_suffixes | drawing |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/drawing-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0520 | P2 | prefixes_suffixes | drinkable |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/drinkable-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0521 | P2 | prefixes_suffixes | endless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/endless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0522 | P2 | prefixes_suffixes | enjoyment |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/enjoyment-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0523 | P2 | prefixes_suffixes | excitement |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/excitement-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0524 | P2 | prefixes_suffixes | fairness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/fairness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0525 | P2 | prefixes_suffixes | fearless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/fearless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0526 | P2 | prefixes_suffixes | goodness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/goodness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0527 | P2 | prefixes_suffixes | happily |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/happily-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0528 | P2 | prefixes_suffixes | happiness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/happiness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0529 | P2 | prefixes_suffixes | helpful |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/helpful-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0530 | P2 | prefixes_suffixes | homeless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/homeless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0531 | P2 | prefixes_suffixes | hopeful |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/hopeful-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0532 | P2 | prefixes_suffixes | hopeless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/hopeless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0533 | P2 | prefixes_suffixes | hopped |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/hopped-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0534 | P2 | prefixes_suffixes | illness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/illness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0535 | P2 | prefixes_suffixes | joyful |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/joyful-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0536 | P2 | prefixes_suffixes | kids |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/kids-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0537 | P2 | prefixes_suffixes | kindest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/kindest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0538 | P2 | prefixes_suffixes | kindly |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/kindly-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0539 | P2 | prefixes_suffixes | kindness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/kindness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0540 | P2 | prefixes_suffixes | landed |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/landed-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0541 | P2 | prefixes_suffixes | loudly |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/loudly-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0542 | P2 | prefixes_suffixes | lovable |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/lovable-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0543 | P2 | prefixes_suffixes | matches |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/matches-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0544 | P2 | prefixes_suffixes | misbehave |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/misbehave-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0545 | P2 | prefixes_suffixes | miscount |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/miscount-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0546 | P2 | prefixes_suffixes | mishear |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/mishear-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0547 | P2 | prefixes_suffixes | mislead |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/mislead-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0548 | P2 | prefixes_suffixes | misplace |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/misplace-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0549 | P2 | prefixes_suffixes | misprint |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/misprint-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0550 | P2 | prefixes_suffixes | misread |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/misread-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0551 | P2 | prefixes_suffixes | misspell |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/misspell-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0552 | P2 | prefixes_suffixes | mistake |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/mistake-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0553 | P2 | prefixes_suffixes | misuse |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/misuse-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0554 | P2 | prefixes_suffixes | movement |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/movement-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0555 | P2 | prefixes_suffixes | nonfat |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/nonfat-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0556 | P2 | prefixes_suffixes | nonfiction |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/nonfiction-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0557 | P2 | prefixes_suffixes | nonliving |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/nonliving-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0558 | P2 | prefixes_suffixes | nonmetal |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/nonmetal-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0559 | P2 | prefixes_suffixes | nonsense |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/nonsense-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0560 | P2 | prefixes_suffixes | nonstick |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/nonstick-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0561 | P2 | prefixes_suffixes | nonstop |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/nonstop-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0562 | P2 | prefixes_suffixes | nonverbal |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/nonverbal-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0563 | P2 | prefixes_suffixes | oldest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/oldest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0564 | P2 | prefixes_suffixes | overcook |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/overcook-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0565 | P2 | prefixes_suffixes | overfill |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/overfill-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0566 | P2 | prefixes_suffixes | overgrown |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/overgrown-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0567 | P2 | prefixes_suffixes | overhead |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/overhead-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0568 | P2 | prefixes_suffixes | overlap |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/overlap-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0569 | P2 | prefixes_suffixes | overload |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/overload-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0570 | P2 | prefixes_suffixes | overlook |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/overlook-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0571 | P2 | prefixes_suffixes | overreact |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/overreact-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0572 | P2 | prefixes_suffixes | oversleep |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/oversleep-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0573 | P2 | prefixes_suffixes | overturn |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/overturn-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0574 | P2 | prefixes_suffixes | painter |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/painter-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0575 | P2 | prefixes_suffixes | payment |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/payment-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0576 | P2 | prefixes_suffixes | peaches |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/peaches-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0577 | P2 | prefixes_suffixes | player |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/player-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0578 | P2 | prefixes_suffixes | precut |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/precut-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0579 | P2 | prefixes_suffixes | preheat |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/preheat-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0580 | P2 | prefixes_suffixes | preorder |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/preorder-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0581 | P2 | prefixes_suffixes | prepack |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/prepack-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0582 | P2 | prefixes_suffixes | prepay |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/prepay-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0583 | P2 | prefixes_suffixes | preschool |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/preschool-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0584 | P2 | prefixes_suffixes | pretest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/pretest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0585 | P2 | prefixes_suffixes | preview |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/preview-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0586 | P2 | prefixes_suffixes | prewash |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/prewash-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0587 | P2 | prefixes_suffixes | prewrite |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/prewrite-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0588 | P2 | prefixes_suffixes | quickly |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/quickly-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0589 | P2 | prefixes_suffixes | quietly |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/quietly-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0590 | P2 | prefixes_suffixes | quietness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/quietness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0591 | P2 | prefixes_suffixes | readable |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/readable-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0592 | P2 | prefixes_suffixes | reader |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/reader-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0593 | P2 | prefixes_suffixes | rebuild |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/rebuild-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0594 | P2 | prefixes_suffixes | redo |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/redo-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0595 | P2 | prefixes_suffixes | reheat |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/reheat-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0596 | P2 | prefixes_suffixes | repaint |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/repaint-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0597 | P2 | prefixes_suffixes | replay |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/replay-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0598 | P2 | prefixes_suffixes | reread |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/reread-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0599 | P2 | prefixes_suffixes | restart |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/restart-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0600 | P2 | prefixes_suffixes | restless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/restless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0601 | P2 | prefixes_suffixes | retell |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/retell-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0602 | P2 | prefixes_suffixes | return |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/return-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0603 | P2 | prefixes_suffixes | reuse |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/reuse-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0604 | P2 | prefixes_suffixes | review |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/review-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0605 | P2 | prefixes_suffixes | rewrite |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/rewrite-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0606 | P2 | prefixes_suffixes | runner |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/runner-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0607 | P2 | prefixes_suffixes | sadly |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/sadly-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0608 | P2 | prefixes_suffixes | sadness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/sadness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0609 | P2 | prefixes_suffixes | shortest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/shortest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0610 | P2 | prefixes_suffixes | singer |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/singer-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0611 | P2 | prefixes_suffixes | slowest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/slowest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0612 | P2 | prefixes_suffixes | slowly |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/slowly-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0613 | P2 | prefixes_suffixes | smallest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/smallest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0614 | P2 | prefixes_suffixes | softly |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/softly-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0615 | P2 | prefixes_suffixes | softness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/softness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0616 | P2 | prefixes_suffixes | spotless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/spotless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0617 | P2 | prefixes_suffixes | statement |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/statement-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0618 | P2 | prefixes_suffixes | subheading |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/subheading-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0619 | P2 | prefixes_suffixes | submerge |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/submerge-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0620 | P2 | prefixes_suffixes | subsoil |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/subsoil-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0621 | P2 | prefixes_suffixes | subtitle |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/subtitle-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0622 | P2 | prefixes_suffixes | subtract |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/subtract-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0623 | P2 | prefixes_suffixes | subway |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/subway-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0624 | P2 | prefixes_suffixes | subzero |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/subzero-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0625 | P2 | prefixes_suffixes | tallest |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/tallest-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0626 | P2 | prefixes_suffixes | teachable |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/teachable-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0627 | P2 | prefixes_suffixes | thankful |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/thankful-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0628 | P2 | prefixes_suffixes | toothless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/toothless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0629 | P2 | prefixes_suffixes | treatment |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/treatment-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0630 | P2 | prefixes_suffixes | trees |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/trees-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0631 | P2 | prefixes_suffixes | tricolor |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/tricolor-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0632 | P2 | prefixes_suffixes | tricycle |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/tricycle-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0633 | P2 | prefixes_suffixes | trio |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/trio-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0634 | P2 | prefixes_suffixes | triple |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/triple-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0635 | P2 | prefixes_suffixes | tripod |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/tripod-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0636 | P2 | prefixes_suffixes | uncover |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/uncover-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0637 | P2 | prefixes_suffixes | underarm |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/underarm-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0638 | P2 | prefixes_suffixes | undercover |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/undercover-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0639 | P2 | prefixes_suffixes | underestimate |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/underestimate-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0640 | P2 | prefixes_suffixes | underfed |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/underfed-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0641 | P2 | prefixes_suffixes | underline |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/underline-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0642 | P2 | prefixes_suffixes | underpaid |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/underpaid-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0643 | P2 | prefixes_suffixes | underpass |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/underpass-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0644 | P2 | prefixes_suffixes | undersea |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/undersea-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0645 | P2 | prefixes_suffixes | underwater |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/underwater-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0646 | P2 | prefixes_suffixes | undo |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/undo-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0647 | P2 | prefixes_suffixes | unfair |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/unfair-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0648 | P2 | prefixes_suffixes | unfold |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/unfold-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0649 | P2 | prefixes_suffixes | unhappy |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/unhappy-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0650 | P2 | prefixes_suffixes | unkind |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/unkind-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0651 | P2 | prefixes_suffixes | unlock |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/unlock-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0652 | P2 | prefixes_suffixes | unpack |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/unpack-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0653 | P2 | prefixes_suffixes | unsafe |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/unsafe-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0654 | P2 | prefixes_suffixes | untie |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/untie-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0655 | P2 | prefixes_suffixes | unwell |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/unwell-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0656 | P2 | prefixes_suffixes | unzip |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/unzip-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0657 | P2 | prefixes_suffixes | usable |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/usable-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0658 | P2 | prefixes_suffixes | useful |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/useful-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0659 | P2 | prefixes_suffixes | useless |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/useless-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0660 | P2 | prefixes_suffixes | washable |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/washable-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0661 | P2 | prefixes_suffixes | weakness |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/weakness-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0662 | P2 | prefixes_suffixes | wonderful |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/wonderful-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0663 | P2 | prefixes_suffixes | writer |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/writer-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0664 | P2 | prefixes_suffixes | writing |  | yes | no | public/images/assessment/language/variants/prefixes-suffixes/writing-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0665 | P2 | prepositions | into |  | yes | no | public/images/assessment/language/variants/prepositions/into-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0666 | P2 | prepositions | out of |  | yes | no | public/images/assessment/language/variants/prepositions/out-of-01.webp |  | Common workbook term useful for near-term skill expansion. |
| wm-0667 | P4 | antonyms_synonyms | dead | dead/alive | yes | no | public/images/assessment/language/variants/antonyms-synonyms/dead-alive-01.webp |  | Do not request now: inappropriate or unsafe for K-5 assessment. |

## Import/QA Notes

- File existence is not approval. Returned media still needs visual/audio QA before being counted.
- Any image with text, letters, labels, brand marks, unreadable AI artifacts, strange hands/faces, or unclear target meaning should be rejected.
- Any audio that spells instead of says the word, sounds robotic, clips, has background noise, or uses the wrong pronunciation should be rejected.
- After importing, rerun the assessment contract and runtime variation validators before claiming coverage is fixed.
