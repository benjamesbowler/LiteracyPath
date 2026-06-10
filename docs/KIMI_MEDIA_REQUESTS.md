# Kimi Media Generation Requests — Learn Area AAA Polish

Copy each request below into Kimi exactly as written. Save every file with
the exact filename given, then drop it into the folder shown. The app is
already wired to pick these up automatically — no code changes needed for
the game card art.

---

## Shared style guide (paste this at the top of EVERY image request)

> Children's educational app illustration, ages 4–7. Flat 2D vector style
> with soft rounded shapes, gentle gradients, and subtle paper-grain
> texture. Warm and friendly, premium quality like "Teach Your Monster to
> Read" or "Raz-Kids". Color palette: deep teal #0C6B65, warm amber
> #D68A11, coral #E2725B, sky blue #3B82C4, leaf green #2F9E62, violet
> #7C5CBF, cream background #FFF9F0. Soft shadows, no harsh outlines.
> Absolutely NO text, letters, or numbers in the image. No humans.

---

## 1. Game card artwork (10 images)

Folder: `public/images/learn-games/art/`
Format: PNG, 800 x 450 pixels (16:9), full-bleed scene (no transparency)

| Filename | Scene to request |
|---|---|
| `cvc-word-builder.png` | A cheerful workbench with colorful wooden blocks being stacked by a small friendly lighthouse character, sparkles around the blocks |
| `sight-word-memory.png` | Two rows of face-down cards with glowing star backs on a soft table, one card mid-flip, magical light |
| `sound-slide.png` | A playful playground slide with colorful round tokens sliding down into a basket, motion lines, joyful |
| `blend-and-build.png` | Three crates in different colors being filled with round tokens by a conveyor belt, factory-of-fun feel |
| `rhyme-time.png` | Two singing birds on a branch with musical notes floating between them, matching color bows |
| `sight-word-fishing.png` | A small boat on a friendly pond, fishing rod pulling up a glowing star from the water, fish watching |
| `cvc-train.png` | A bright cartoon steam train with three colorful empty wagons, puffing heart-shaped smoke, rolling through green hills |
| `pop-the-word.png` | Floating soap bubbles in different colors over a meadow, one bubble popping with a star burst |
| `word-hopscotch.png` | A hopscotch course chalked on warm pavement with colorful stepping stones, a small character mid-hop |
| `reading-race.png` | A racetrack through a storybook landscape with a checkered flag, a friendly snail and rabbit racing |

---

## 2. Mascot poses — "Phinny" the lighthouse character (5 images)

Folder: `public/images/learn-games/`
Format: PNG, 1024 x 1024, transparent background

First, attach the existing `phinny-waving.png` to the request as the
character reference and add: "Match this exact character design,
proportions and colors."

| Filename | Pose |
|---|---|
| `phinny-thinking.png` | Tapping chin thoughtfully, eyes up, little question sparkle above head |
| `phinny-cheering.png` | Both arms up, confetti around, huge happy smile |
| `phinny-reading.png` | Holding an open book, content expression |
| `phinny-pointing.png` | Pointing forward encouragingly with one arm |
| `phinny-sleepy.png` | Yawning with droopy eyes, small "zzz" bubbles (no letters — use star shapes) |

---

## 3. Student home card art (3 images)

Folder: `public/images/learn-games/home/`
Format: PNG, 600 x 400, full-bleed

| Filename | Scene |
|---|---|
| `home-learn.png` | A sunny classroom desk with letter blocks and a magnifying glass, inviting |
| `home-story-quests.png` | An open magical storybook with a tiny path and castle rising out of the pages |
| `home-guided-reading.png` | A cozy reading nook with cushions, a lamp, and a stack of picture books |

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
