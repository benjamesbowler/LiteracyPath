# Kimi Video Test — Cycle 1 Phonics Song ("The Meadow Sounds Song")

A ~3:00 sung phonics music video to test Kimi's video generation. Cycle 1 teaches
the sounds **/ă/ (a)** and **/m/ (m)** and the sight words **"I"** and **"am"**,
with the **Meadow Pals**. If this passes QA it becomes the Cycle-1 letter-sound
video in Present mode.

---

## 1. Technical specs
- **Video:** 1920×1080 (16:9), 24 fps, H.264 MP4, ~180 seconds.
- **Audio:** 48 kHz stereo, AAC in the MP4 **and** a standalone `cycle-01-song.mp3`.
- **Style:** warm, bright, hand-drawn children's cartoon — match our Meadow Pals series.
- **Output paths (if approved):**
  - `public/videos/letter-songs/cycle-01.mp4`
  - `public/audio/letter-songs/cycle-01-song.mp3`

## 2. Voice & music spec
- **Singing voice:** warm, gentle female, same timbre as our **gold voice**
  (voice id `NLl76XZRVj1RVeXptX3h`). In-tune, simple nursery-song delivery.
  Attach reference clips: `public/audio/learn-games/poems/v2/cycle-01.mp3`,
  `public/audio/child-mode/clean-human/words/sing.mp3`.
- **Phoneme purity (critical):** when the sound is sung/spoken it is the **pure
  phoneme** — "/ă/" as in *apple* (a short clipped "a"), and "/m/" as a hummed
  "mmm". **Never** say the letter *name* ("ay", "em") when the phoneme is meant.
- **Music bed:** cheerful, uncluttered — ukulele + soft hand percussion +
  glockenspiel. **Tempo ~104 BPM, key of C major.** Leave space so the phonemes
  are clearly audible above the music.
- **SFX:** gentle, sparse (a soft "pop" when a word/letter appears, a light chime
  on correct rhymes). No loud or startling sounds.

## 3. Character bible (Meadow Pals — warm farm meadow: barn, pond, hill, log, hay bales, flowers)
- **Muddy** — friendly meadow pal who loves mud, cheerful, our host.
- **Woolly** — gentle sheep-like pal, soft and calm.
- **Clucky** — busy hen-like pal, tidy and bustling.
- **Bouncy** — energetic pal who hops with playful energy.
- **Tiny** — a very small pal (clear scale cues).
Keep each character's design identical across every shot.

## 4. On-screen text rules
- The **illustrated scenes themselves contain NO baked-in text.**
- Letters and words are a **separate clean overlay layer** added on top: large,
  high-contrast, rounded kid font (Fredoka/Andika style), centred or lower-third.
- Show the letter/word **exactly when it is sung**, then hold briefly.

---

## 5. Full song lyrics

**Intro**
> Hello, hello, it's Cycle One! / Come to the meadow, let's have fun! / I'm Muddy and these are my friends — / let's learn two sounds; the singing begins!

**Sound /ă/ — verse**
> /ă/, /ă/, /ă/ — open wide, / apple, ant, and ax inside. / /ă/ is the sound in "am", / a little "a" — yes, here I am!

**Sound /ă/ — chorus** (×2)
> A says /ă/! (clap, clap) / A says /ă/! / Muddy loves the /ă/ sound, / the happiest sound in the meadow ground!

**Sound /m/ — verse**
> /m/, /m/, /m/ — lips together, hum, / moon and mouse and map and mat. / /m/ is the sound where the hums all come — / a humming "m", imagine that!

**Sound /m/ — chorus** (×2)
> M says /m/! (hum, hum) / M says /m/! / Woolly loves the /m/ sound, / humming softly all around!

**Sight words — "I" and "am"**
> I… am… I am here! / I am Muddy — give a cheer! / I am Woolly, I am small, / "I am, I am" — one and all!

**Phonemic play — compound deletion + rhyme**
> Say "sunset"… now take "sun" away… (pause) …"set"! / Mat, cat, hat — they rhyme, you bet! / Map and nap and tap, that's right — / clap your hands when the words sound alike!

**Recap chorus (all the pals together)**
> /ă/ for apple, /m/ for moon, / "I am" singing this happy tune! / Cycle One — we did it — hooray! / Come back soon another day!

**Outro**
> Bye-bye Meadow Pals, see you soon… / waving goodnight to the /m/… moon!

---

## 6. Scene-by-scene storyboard

> Each scene = a continuous animated shot. "Keyframe" = the image prompt to
> generate/animate. "Overlay" = the clean text layer shown that moment.

**S1 — Intro · 0:00–0:14**
- Keyframe: sunny Meadow Pals farm — Muddy waving cheerfully in the foreground; Woolly, Clucky, Bouncy and Tiny behind by the barn and pond; flowers, gentle clouds.
- Motion: slow push-in; characters wave and bob to the beat.
- Overlay: title card "Cycle 1 — The Meadow Sounds" then fades.

**S2 — /ă/ verse · 0:14–0:34**
- Keyframe: Muddy opens his mouth wide saying "/ă/"; an apple, an ant, and an ax pop up beside him one at a time.
- Motion: each item pops in on the beat; Muddy points.
- Overlay: big **Aa**, then the words **apple · ant · ax** appear as each is named.

**S3 — /ă/ chorus · 0:34–0:52**
- Keyframe: the pals clapping and dancing in a row in the meadow; a giant friendly letter **A** shape made of flowers behind them (decorative, not text).
- Motion: rhythmic clapping; camera gently sways.
- Overlay: **A says /ă/** pulsing on each clap.

**S4 — /m/ verse · 0:52–1:12**
- Keyframe: Woolly hums "/m/" with lips together; a moon, a mouse, a map and a mat appear around her at the pond's edge at dusk-tint.
- Motion: each item floats in; soft glow on the moon.
- Overlay: big **Mm**, then **moon · mouse · map · mat**.

**S5 — /m/ chorus · 1:12–1:30**
- Keyframe: pals swaying and humming; little music notes drifting; hay bales behind.
- Motion: gentle sway; notes float up.
- Overlay: **M says /m/** pulsing on each hum.

**S6 — Sight words "I am" · 1:30–1:56**
- Keyframe: each pal steps forward in turn and gestures to themselves — Muddy, then Woolly (small, scale cue) — as if saying "I am".
- Motion: spotlight hop from pal to pal.
- Overlay: **I** … **am** … then **I am** held large; the pal's role word is NOT shown (kids read faces).

**S7 — Phonemic play · 1:56–2:24**
- Keyframe: Muddy holds up a picture of a sunset; the "sun" half playfully slides away leaving the rest; then mat/cat/hat images bounce in a rhyming row.
- Motion: the "sun" image slides off; rhyme images bounce together; a chime when they match.
- Overlay: **sunset → set**, then **mat · cat · hat** with a small ✔ on each rhyme.

**S8 — Recap chorus · 2:24–2:50**
- Keyframe: all five pals together centre-meadow, apple and moon icons on either side, confetti of petals.
- Motion: big group dance; petal confetti; camera slow pull-back.
- Overlay: **/ă/ apple** and **/m/ moon** flanking; **I am** in the middle.

**S9 — Outro · 2:50–3:00**
- Keyframe: night falls gently; pals wave from the meadow under a big calm **m**oon.
- Motion: characters wave; soft fade to the moon.
- Overlay: "See you next time!" then fades to the moon. No other text.

---

## 7. QA checklist (before it goes in the app)
- [ ] Total length 2:55–3:05.
- [ ] Every /ă/ and /m/ is the **pure phoneme**, never the letter name.
- [ ] Words sung match the on-screen word, and appear in time.
- [ ] Characters are on-model and consistent across all shots.
- [ ] No baked-in text inside the illustrations (overlay layer only).
- [ ] Audio is warm, in tune, gold-voice timbre; music never drowns the phonemes.
- [ ] Nothing loud/startling; calm night outro.
- [ ] Delivered as `cycle-01.mp4` (1080p) + `cycle-01-song.mp3`.
