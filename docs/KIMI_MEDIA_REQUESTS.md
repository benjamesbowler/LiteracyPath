# Kimi Media Generation Requests — Learn Area AAA Polish

Copy each request below into Kimi exactly as written. Save every file with
the exact filename given, then drop it into the folder shown. The app is
already wired to pick these up automatically — no code changes needed for
the game card art.

---

## Shared style guide (paste this at the top of EVERY image request)

> Children's educational app illustration, ages 4–7 — child-focused but
> not babyish. Realistic cartoon style: believable proportions, painterly
> detail, soft lighting, like a modern animated film still. Premium
> quality like "Teach Your Monster to Read" or "Raz-Kids". Themes:
> fantasy adventure, friendly sci-fi, and nature. Color palette: deep
> teal #0C6B65, warm amber #D68A11, coral #E2725B, sky blue #3B82C4,
> leaf green #2F9E62, violet #7C5CBF, cream #FFF9F0 — used selectively,
> never all at once, never rainbow arrangements. Absolutely NO text,
> letters, or numbers in the image. No humans. No faces or expressions
> on inanimate objects — only animals, dragons, robots, and creatures
> may have faces.

---

## 1. Game card artwork (10 images)

Folder: `public/images/learn-games/art/`
Format: PNG, 800 x 450 pixels (16:9), full-bleed scene (no transparency)

| Filename | Scene to request |
|---|---|
| `cvc-word-builder.png` | A young dragon stacking glowing rune stones on a castle workbench, warm torchlight |
| `sight-word-memory.png` | A wizard's study with two rows of face-down enchanted cards on an oak table, one card mid-flip with magical light spilling out |
| `sound-slide.png` | A friendly robot sending glowing orbs down a curved chrome slide into a collector basket, soft sci-fi lab |
| `blend-and-build.png` | A robot workshop where a conveyor belt sorts glowing parts into three colored crates |
| `rhyme-time.png` | Two songbirds perched on a forest branch at golden hour, musical notes drifting between them |
| `sight-word-fishing.png` | A bear in a small wooden boat on a calm lake, fishing rod pulling a glowing star from the water, fish visible below the surface |
| `cvc-train.png` | A bright steam train with three empty wagons crossing a stone viaduct through green hills, puffy white steam |
| `pop-the-word.png` | Floating magical bubbles drifting over a meadow at dusk, one bursting into a spray of light, fireflies around |
| `word-hopscotch.png` | A winding path of glowing stepping stones across a forest stream, a fox mid-leap between stones |
| `reading-race.png` | A rabbit and a tortoise racing along a storybook trail toward a checkered flag, rolling countryside |

---

## 2. Mascot poses — "Phinny" (5 images)

Folder: `public/images/learn-games/`
Format: PNG, 1024 x 1024, transparent background

Attach the existing `phinny-waving.png` to the request as the character
reference and add: "Match this exact character design, proportions and
colors."

| Filename | Pose |
|---|---|
| `phinny-thinking.png` | Tapping chin thoughtfully, eyes up, single star sparkle above head |
| `phinny-cheering.png` | Both arms up, confetti around, huge happy smile |
| `phinny-reading.png` | Holding an open book, content expression |
| `phinny-pointing.png` | Pointing forward encouragingly with one arm |
| `phinny-sleepy.png` | Yawning with droopy eyes, small star shapes drifting above |

---

## 3. Student home card art (3 images)

Folder: `public/images/learn-games/home/`
Format: PNG, 600 x 400, full-bleed

| Filename | Scene |
|---|---|
| `home-learn.png` | A wizard's desk with rune stones, a quill, and a softly glowing crystal, inviting warm light |
| `home-story-quests.png` | An open ancient book with a miniature path, mountains and a dragon-circled castle rising out of its pages |
| `home-guided-reading.png` | A cozy treehouse reading nook at dusk with cushions, a lantern, and a stack of adventure books |

---

## 4. Sound effects (8 audio files)

Folder: `public/audio/ui/`
Format: MP3, under 100 KB each

Request for Kimi: "Generate a short UI sound effect for a children's
reading app, soft and rounded, not harsh or arcade-like:"

| Filename | Sound | Length |
|---|---|---|
| `tap.mp3` | Soft wooden tap/click for button presses | 0.2 s |
| `correct.mp3` | Warm marimba two-note rise, satisfying | 0.5 s |
| `incorrect.mp3` | Gentle low "boop", kind not punishing | 0.4 s |
| `star.mp3` | Bright chime sparkle for earning a star | 0.7 s |
| `complete.mp3` | Short cheerful fanfare, xylophone and bells | 2 s |
| `pop.mp3` | Single soft bubble pop | 0.2 s |
| `whoosh.mp3` | Soft swoosh for screen transitions | 0.4 s |
| `card-flip.mp3` | Quick soft paper flip | 0.3 s |

---

## Delivery checklist

1. Generate, download, rename to the exact filenames above
2. Drop files into the exact folders listed (create `art/`, `home/`, and
   `audio/ui/` folders inside `public/` if they don't exist)
3. Commit and push as usual — the game cards will switch from icons to
   the new artwork automatically
4. Tell Claude when the files are in — the sound effects and new mascot
   poses need a small wiring step to start playing in the games
