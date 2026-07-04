# Kimi Audio Request — FULL REDO of every letter sound + letter name (gold voice)

The ear-audit on 2026-07-04 found the letter-audio banks are systematically
wrong: many "sound" files actually say the letter NAME ("Kay" for c), the
label ("short a" instead of the sound), or are garbled. The app currently
BLOCKS the worst clips (`src/data/knownBadWordAudio.js` →
`KNOWN_BAD_AUDIO_PATHS`) and falls back to word cues. This request replaces
the whole bank in one pass: **63 recordings**.

**Attach these reference clips so the voice matches exactly (verified good):**
- `public/audio/child-mode/clean-human/graphemes/consonants/m.mp3`
- `public/audio/child-mode/clean-human/graphemes/consonants/d.mp3`
- `public/audio/letter-names/a.mp3`

## THE THREE IRON RULES

> 1. A **SOUND** file contains ONLY the letter's phonic sound. NEVER the
>    letter's name. NEVER the words "short", "letter", or anything else.
>    If the file for "c" contains "see" or "kay", it is WRONG.
> 2. A **NAME** file contains ONLY the letter's name ("ay", "bee", "see"...).
> 3. One clean take per file, warm female gold narrator, quiet room,
>    ~1 second total, MP3, same loudness as the reference clips.

## Part 1 — Letter SOUNDS (26 files)

**Stop sounds** (b c d g j k p q t): say the sound ONCE, clipped and clean,
with as little "uh" after it as possible. NOT "buh-buh-buh", just one crisp /b/.
**Continuous sounds** (f h l m n r s v w y z + vowels): hold the sound gently
for about half a second ("mmm", "sss").

| File | Letter | Record EXACTLY this sound | NEVER say |
|---|---|---|---|
| `short_a.mp3` | a | "a" as at the start of **apple** ("aaa") | "ay", "short a" |
| `b.mp3` | b | /b/ as at the start of **bat** — one crisp "b" | "bee", "buh-uh" |
| `c.mp3` | c | /k/ as at the start of **cat** — one crisp "k" | "see", "kay" |
| `d.mp3` | d | /d/ as at the start of **dog** | "dee" |
| `short_e.mp3` | e | "e" as at the start of **egg** ("eh") | "ee", "he" |
| `f.mp3` | f | /f/ held: "fff" | "eff" |
| `g.mp3` | g | /g/ (hard) as in **goat** | "jee" |
| `h.mp3` | h | /h/ — a soft breath "hhh" | "aitch" |
| `short_i.mp3` | i | "i" as at the start of **igloo** ("ih") | "eye" |
| `j.mp3` | j | /j/ as at the start of **jam** | "jay" |
| `k.mp3` | k | /k/ as at the start of **kite** | "kay" |
| `l.mp3` | l | /l/ held: "lll" | "el" |
| `m.mp3` | m | /m/ held: "mmm" | "em" |
| `n.mp3` | n | /n/ held: "nnn" | "en" |
| `short_o.mp3` | o | "o" as at the start of **octopus** ("o" as in hot) | "oh" |
| `p.mp3` | p | /p/ — one crisp "p" | "pee" |
| `q.mp3` | q | /kw/ as at the start of **queen** | "cue" |
| `r.mp3` | r | /r/ held: "rrr" (as in **run**) | "ar" |
| `s.mp3` | s | /s/ held: "sss" | "ess" |
| `t.mp3` | t | /t/ — one crisp "t" | "tee" |
| `short_u.mp3` | u | "u" as at the start of **umbrella** ("uh" as in cup) | "you" |
| `v.mp3` | v | /v/ held: "vvv" | "vee" |
| `w.mp3` | w | /w/ as at the start of **web** | "double-you" |
| `x.mp3` | x | /ks/ as at the END of **box** ("ks") | "ex" |
| `y.mp3` | y | /y/ as at the start of **yes** | "why" |
| `z.mp3` | z | /z/ held: "zzz" | "zed", "zee" |

**Save each sound to BOTH paths** (identical copy):
1. `public/audio/phonemes/<file>` (e.g. `public/audio/phonemes/short_a.mp3`, `public/audio/phonemes/b.mp3`)
2. the matching bank copy:
   - vowels → `public/audio/child-mode/clean-human/graphemes/short_vowels/short_<v>.mp3`
   - consonants → `public/audio/child-mode/clean-human/graphemes/consonants/<c>.mp3`

## Part 2 — Digraph SOUNDS (6 files)

| File | Record EXACTLY | NEVER say |
|---|---|---|
| `sh.mp3` | "shhh" as in **ship** | "ess-aitch" |
| `ch.mp3` | /ch/ as in **chat** | "see-aitch" |
| `th.mp3` | /th/ as in **thumb** (soft, unvoiced) | "tee-aitch" |
| `ng.mp3` | /ng/ as at the end of **ring** | "en-jee" |
| `qu.mp3` | /kw/ as in **queen** | "cue-you" |
| `ck.mp3` | /k/ as at the end of **duck** | "see-kay" |

**Save to BOTH:** `public/audio/phonemes/<file>` and
`public/audio/child-mode/clean-human/graphemes/digraphs_blends/<file>`.

## Part 3 — Letter NAMES (26 files, a–z)

Say the NAME of the letter, once, clearly: "ay", "bee", "see", "dee", "ee",
"eff", "jee", "aitch", "eye", "jay", "kay", "el", "em", "en", "oh", "pee",
"cue", "ar", "ess", "tee", "you", "vee", "double-you", "ex", "why", "zee".

**Save to:** `public/audio/letter-names/<letter>.mp3` (a.mp3 … z.mp3).

## After import (Claude does this)
1. Open `docs/previews/letter_audio_audit.html` — Benjamin ear-checks every row.
2. Empty `KNOWN_BAD_AUDIO_PATHS` in `src/data/knownBadWordAudio.js`.
3. Point the Letter Islands lessons (`src/data/phonicsLessons.js`) at the new bank.
4. Regenerate the audio manifest and run the final gate.
