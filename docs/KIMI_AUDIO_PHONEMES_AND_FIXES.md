# Kimi Audio Request — Letter Sounds + Word Quality Fixes

Same narrator as all previous audio requests:

> Warm, clear British English female narrator, natural pace for young
> children, friendly but not babyish. Plain MP3, no music, no effects.

---

## 1. Letter SOUNDS (31 files) — most important

Folder: `public/audio/phonemes/`

These are phonics sounds, NOT letter names. Critical instructions for
every file: say ONLY the pure sound, never the letter name, never a label
like "short A". Keep consonants crisp with as little "uh" after them as
possible (say "b", not "buh"). Each file under 1 second.

The app is already wired: these recordings take priority everywhere the
moment they land.

| Filename | The sound to record (example word) |
|---|---|
| `short_a.mp3` | "a" as in **apple** |
| `short_e.mp3` | "e" as in **egg** |
| `short_i.mp3` | "i" as in **igloo** |
| `short_o.mp3` | "o" as in **octopus** |
| `short_u.mp3` | "u" as in **umbrella** |
| `b.mp3` | "b" as in **bat** |
| `c.mp3` | "c" as in **cat** |
| `d.mp3` | "d" as in **dog** |
| `f.mp3` | "f" as in **fish** |
| `g.mp3` | "g" as in **goat** |
| `h.mp3` | "h" as in **hat** |
| `j.mp3` | "j" as in **jam** |
| `k.mp3` | "k" as in **kite** |
| `l.mp3` | "l" as in **leg** |
| `m.mp3` | "m" as in **map** |
| `n.mp3` | "n" as in **net** |
| `p.mp3` | "p" as in **pig** |
| `q.mp3` | "qu" as in **queen** |
| `r.mp3` | "r" as in **run** |
| `s.mp3` | "s" as in **sun** |
| `t.mp3` | "t" as in **top** |
| `v.mp3` | "v" as in **van** |
| `w.mp3` | "w" as in **wet** |
| `x.mp3` | "ks" as in **box** |
| `y.mp3` | "y" as in **yes** |
| `z.mp3` | "z" as in **zip** |

---

## 2. Word re-records — suspect quality (41 files)

Folder: drop into `public/audio/child-mode/clean-human/words/`
(same filenames overwrite the bad recordings everywhere at once)

Each file: the narrator says the single word once, naturally.

`ant.mp3` `bat.mp3` `rat.mp3` `bath.mp3` `bit.mp3` `branch.mp3`
`bread.mp3` `chin.mp3` `crunch.mp3` `drink.mp3` `fast.mp3` `fig.mp3`
`fun.mp3` `glass.mp3` `got.mp3` `hug.mp3` `lot.mp3` `lunch.mp3`
`milk.mp3` `munch.mp3` `nest.mp3` `pet.mp3` `plan.mp3` `plant.mp3`
`pop.mp3` `ran.mp3` `sat.mp3` `shed.mp3` `shut.mp3` `sing.mp3`
`slept.mp3` `snap.mp3` `soft.mp3` `splash.mp3` `spot.mp3` `spring.mp3`
`swim.mp3` `tin.mp3` `trip.mp3` `wet.mp3` `win.mp3`

If you hear any OTHER word in the app that sounds odd, tell Claude the
word — replacements drop into the same folder with the same filename.

---

## Reminder: two earlier requests still pending

- `docs/KIMI_AUDIO_VOICE_AND_WORDS_REQUEST.md` — login voice prompts,
  333 missing words, 13 game sentences
- `docs/KIMI_AUDIO_NARRATION_REQUEST.md` — 30 books' narration
