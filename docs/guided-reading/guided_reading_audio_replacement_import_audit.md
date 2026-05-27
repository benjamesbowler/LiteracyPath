# Guided Reading Audio Replacement Import Audit

Generated: 2026-05-27T12:14:46.096Z

## Source

- Source folder: `/Users/benjaminbowler/Desktop/New Audio Replacements and New Word Audio`
- Imported First Facts replacement page/full-book audio from `public/guided-reading/nonfiction/first-facts/` in the source pack.
- Imported guided-reading word audio from `public/guided-reading/audio/words/` in the source pack.

## Imported Audio Counts

- First Facts page/full-book audio files now present: 167
- First Facts page audio files: 147
- First Facts full-book audio files: 20
- Guided Reading word audio files imported: 2251
- Unique guided-reading word audio paths referenced by current books: 2251
- Missing guided-reading word audio paths after import: 0
- Punctuation-only tokens skipped for word audio: 86

## First Facts Book Audio

| # | ID | Title | Pages | Page Audio | Full-Book Audio |
|---:|---|---|---:|---:|---:|
| 1 | first-facts-a-01-look-at-the-colours | Look at the Colours! | 7 | 7 | yes |
| 2 | first-facts-a-02-the-four-seasons | The Four Seasons | 9 | 9 | yes |
| 3 | first-facts-a-03-little-seeds-grow | Little Seeds Grow | 7 | 7 | yes |
| 4 | first-facts-a-04-what-is-weather | What is Weather? | 8 | 8 | yes |
| 5 | first-facts-a-05-flowers-and-trees | Flowers and Trees | 8 | 8 | yes |
| 6 | first-facts-a-06-baby-animals | Baby Animals | 8 | 8 | yes |
| 7 | first-facts-a-07-animals-on-the-farm | Animals on the Farm | 8 | 8 | yes |
| 8 | first-facts-a-08-animals-in-the-ocean | Animals in the Ocean | 8 | 8 | yes |
| 9 | first-facts-a-09-animals-at-night | Animals at Night | 6 | 6 | yes |
| 10 | first-facts-a-10-bugs-all-around-us | Bugs All Around Us | 8 | 8 | yes |
| 11 | first-facts-a-11-pets-we-love | Pets We Love | 7 | 7 | yes |
| 12 | first-facts-a-12-shapes-everywhere | Shapes Everywhere | 7 | 7 | yes |
| 13 | first-facts-a-13-big-and-small | Big and Small | 6 | 6 | yes |
| 14 | first-facts-a-14-hot-and-cold | Hot and Cold | 7 | 7 | yes |
| 15 | first-facts-a-15-things-that-float-and-sink | Things That Float and Sink | 7 | 7 | yes |
| 16 | first-facts-a-16-push-and-pull | Push and Pull | 7 | 7 | yes |
| 17 | first-facts-a-17-hello-sun | Hello, Sun! | 7 | 7 | yes |
| 18 | first-facts-a-18-the-moon | The Moon | 7 | 7 | yes |
| 19 | first-facts-a-19-day-and-night | Day and Night | 7 | 7 | yes |
| 20 | first-facts-a-20-my-five-senses | My Five Senses | 8 | 8 | yes |

## Runtime Wiring

- Guided Reading word helpers now generate `/guided-reading/audio/words/<word>.mp3` paths.
- Guided Reading click-to-hear playback now trusts the imported guided-reading word audio path before falling back to assessment audio preferences/browser voice.
- Assessment question banks and mastery/progression logic were not changed.

## Missing Word Audio Paths

None.

## QA Notes

- The pack manifests report ElevenLabs Bella voice generation for K-2 guided reading.
- Audio files were copied as MP3s without conversion.
- Punctuation-only tokens such as em dashes are intentionally not treated as playable words.
