# Kimi Whole-Book Audio Import Report

Generated: 2026-05-29T06:53:24.034Z

## Source

- Requested source folder: `/Users/benjaminbowler/Desktop/public/Kimi_Agent_Audio Narration Scope`
- Actual delivered source: `/Users/benjaminbowler/Desktop/public/Kimi_Agent_Audio Narration Scope.zip`
- Temporary inspected extraction: `/private/tmp/kimi-whole-book-audio-import-1780037402`

## Summary

- Required missing whole-book MP3 files before import: 116
- Source MP3 files found: 116
- Source sync JSON files found: 0
- Source metadata JSON files found: 2
- MP3 files imported: 116
- MP3 files skipped: 0
- MP3 files unmatched: 0
- Sync JSON files imported from Kimi: 0
- Invalid JSON files: 0
- Books with whole-book audio after audit: 176
- Books still missing whole-book audio after audit: 0
- Books with explicit timing after audit: 0
- Books with estimated timing after audit: 176
- Books still missing timing after audit: 0

## Sync Timing Note

The delivered pack did not include per-book sync JSON files. After MP3 import, `node tools/auditGuidedReadingWholeBookAudio.js` generated estimated sync JSON for the newly available whole-book audio. These files use `syncAccuracy: "estimated"`; no book was marked `explicit` because no Kimi-measured page-boundary timing files were supplied.

## Imported MP3 Files

| Book ID | Title | Destination | Audio exists | Sync JSON | Sync accuracy | Sync validation |
| --- | --- | --- | --- | --- | --- | --- |
| gr-a-26 | Pets | /guided-reading/audio/narration/gr-a-26-full-book.mp3 | yes | /guided-reading/sync/gr-a-26.json | estimated | ok |
| gr-a-27 | The Sun | /guided-reading/audio/narration/gr-a-27-full-book.mp3 | yes | /guided-reading/sync/gr-a-27.json | estimated | ok |
| gr-a-28 | Colors | /guided-reading/audio/narration/gr-a-28-full-book.mp3 | yes | /guided-reading/sync/gr-a-28.json | estimated | ok |
| gr-a-29 | My Body | /guided-reading/audio/narration/gr-a-29-full-book.mp3 | yes | /guided-reading/sync/gr-a-29.json | estimated | ok |
| gr-b-31 | Seasons | /guided-reading/audio/narration/gr-b-31-full-book.mp3 | yes | /guided-reading/sync/gr-b-31.json | estimated | ok |
| gr-b-32 | Fruits | /guided-reading/audio/narration/gr-b-32-full-book.mp3 | yes | /guided-reading/sync/gr-b-32.json | estimated | ok |
| gr-b-33 | Tools | /guided-reading/audio/narration/gr-b-33-full-book.mp3 | yes | /guided-reading/sync/gr-b-33.json | estimated | ok |
| gr-b-34 | Day and Night | /guided-reading/audio/narration/gr-b-34-full-book.mp3 | yes | /guided-reading/sync/gr-b-34.json | estimated | ok |
| gr-b-35 | Community Helpers | /guided-reading/audio/narration/gr-b-35-full-book.mp3 | yes | /guided-reading/sync/gr-b-35.json | estimated | ok |
| gr-c-37 | Water | /guided-reading/audio/narration/gr-c-37-full-book.mp3 | yes | /guided-reading/sync/gr-c-37.json | estimated | ok |
| gr-c-38 | Five Senses | /guided-reading/audio/narration/gr-c-38-full-book.mp3 | yes | /guided-reading/sync/gr-c-38.json | estimated | ok |
| gr-c-39 | Shapes | /guided-reading/audio/narration/gr-c-39-full-book.mp3 | yes | /guided-reading/sync/gr-c-39.json | estimated | ok |
| gr-d-42 | Our Earth | /guided-reading/audio/narration/gr-d-42-full-book.mp3 | yes | /guided-reading/sync/gr-d-42.json | estimated | ok |
| gr-d-43 | Healthy Habits | /guided-reading/audio/narration/gr-d-43-full-book.mp3 | yes | /guided-reading/sync/gr-d-43.json | estimated | ok |
| gr-d-44 | Animal Homes | /guided-reading/audio/narration/gr-d-44-full-book.mp3 | yes | /guided-reading/sync/gr-d-44.json | estimated | ok |
| gr-d-45 | Space | /guided-reading/audio/narration/gr-d-45-full-book.mp3 | yes | /guided-reading/sync/gr-d-45.json | estimated | ok |
| gr-e-46 | Reptiles | /guided-reading/audio/narration/gr-e-46-full-book.mp3 | yes | /guided-reading/sync/gr-e-46.json | estimated | ok |
| gr-e-47 | How Things Grow | /guided-reading/audio/narration/gr-e-47-full-book.mp3 | yes | /guided-reading/sync/gr-e-47.json | estimated | ok |
| gr-e-48 | Magnets | /guided-reading/audio/narration/gr-e-48-full-book.mp3 | yes | /guided-reading/sync/gr-e-48.json | estimated | ok |
| gr-e-49 | Clothes | /guided-reading/audio/narration/gr-e-49-full-book.mp3 | yes | /guided-reading/sync/gr-e-49.json | estimated | ok |
| gr-e-50 | Our Five Senses | /guided-reading/audio/narration/gr-e-50-full-book.mp3 | yes | /guided-reading/sync/gr-e-50.json | estimated | ok |
| first-facts-level-a-01-colors | Colors | /guided-reading/nonfiction/first-facts-level-a/book-01/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-01-colors.json | estimated | ok |
| first-facts-level-a-02-farm-animals | Farm Animals | /guided-reading/nonfiction/first-facts-level-a/book-02/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-02-farm-animals.json | estimated | ok |
| first-facts-level-a-03-big-and-little | Big and Little | /guided-reading/nonfiction/first-facts-level-a/book-03/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-03-big-and-little.json | estimated | ok |
| first-facts-level-a-04-water | Water | /guided-reading/nonfiction/first-facts-level-a/book-04/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-04-water.json | estimated | ok |
| first-facts-level-a-05-the-sky | The Sky | /guided-reading/nonfiction/first-facts-level-a/book-05/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-05-the-sky.json | estimated | ok |
| first-facts-level-a-06-animals-can | Animals Can! | /guided-reading/nonfiction/first-facts-level-a/book-06/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-06-animals-can.json | estimated | ok |
| first-facts-level-a-07-bugs | Bugs | /guided-reading/nonfiction/first-facts-level-a/book-07/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-07-bugs.json | estimated | ok |
| first-facts-level-a-08-my-pet | My Pet | /guided-reading/nonfiction/first-facts-level-a/book-08/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-08-my-pet.json | estimated | ok |
| first-facts-level-a-09-hot-and-cold | Hot and Cold | /guided-reading/nonfiction/first-facts-level-a/book-09/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-09-hot-and-cold.json | estimated | ok |
| first-facts-level-a-10-shapes | Shapes | /guided-reading/nonfiction/first-facts-level-a/book-10/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-10-shapes.json | estimated | ok |
| first-facts-level-a-11-at-the-farm | At the Farm | /guided-reading/nonfiction/first-facts-level-a/book-11/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-11-at-the-farm.json | estimated | ok |
| first-facts-level-a-12-in-the-sea | In the Sea | /guided-reading/nonfiction/first-facts-level-a/book-12/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-12-in-the-sea.json | estimated | ok |
| first-facts-level-a-13-fruit | Fruit | /guided-reading/nonfiction/first-facts-level-a/book-13/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-13-fruit.json | estimated | ok |
| first-facts-level-a-14-the-tree | The Tree | /guided-reading/nonfiction/first-facts-level-a/book-14/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-14-the-tree.json | estimated | ok |
| first-facts-level-a-15-baby-animals | Baby Animals | /guided-reading/nonfiction/first-facts-level-a/book-15/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-15-baby-animals.json | estimated | ok |
| first-facts-level-a-16-fast-and-slow | Fast and Slow | /guided-reading/nonfiction/first-facts-level-a/book-16/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-16-fast-and-slow.json | estimated | ok |
| first-facts-level-a-17-a-seed-grows | A Seed Grows | /guided-reading/nonfiction/first-facts-level-a/book-17/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-17-a-seed-grows.json | estimated | ok |
| first-facts-level-a-18-my-body | My Body | /guided-reading/nonfiction/first-facts-level-a/book-18/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-18-my-body.json | estimated | ok |
| first-facts-level-a-19-day-and-night | Day and Night | /guided-reading/nonfiction/first-facts-level-a/book-19/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-19-day-and-night.json | estimated | ok |
| first-facts-level-a-20-space | Space | /guided-reading/nonfiction/first-facts-level-a/book-20/audio/full-book.mp3 | yes | /guided-reading/sync/first-facts-level-a-20-space.json | estimated | ok |
| ab-c-01 | Aiden and Betty Start Grade 1 | /guided-reading/series/aiden-and-betty/book-01/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-01.json | estimated | ok |
| ab-c-02 | Aiden and Betty have a Yard Sale | /guided-reading/series/aiden-and-betty/book-02/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-02.json | estimated | ok |
| ab-c-03 | Aiden and Betty go on Holiday | /guided-reading/series/aiden-and-betty/book-03/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-03.json | estimated | ok |
| ab-c-04 | Aiden and Betty and Socks | /guided-reading/series/aiden-and-betty/book-04/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-04.json | estimated | ok |
| ab-c-05 | Socks Goes Missing | /guided-reading/series/aiden-and-betty/book-05/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-05.json | estimated | ok |
| ab-c-06 | Aiden and Betty and the Science Fair | /guided-reading/series/aiden-and-betty/book-06/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-06.json | estimated | ok |
| ab-c-07 | Aiden, Betty and Socks's Big Adventure | /guided-reading/series/aiden-and-betty/book-07/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-07.json | estimated | ok |
| ab-c-08 | Aiden and Betty and the Bully | /guided-reading/series/aiden-and-betty/book-08/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-08.json | estimated | ok |
| ab-c-09 | Aiden and Betty: New Teeth | /guided-reading/series/aiden-and-betty/book-09/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-09.json | estimated | ok |
| ab-c-10 | Aiden and Betty and the Castle | /guided-reading/series/aiden-and-betty/book-10/audio/full-book.mp3 | yes | /guided-reading/sync/ab-c-10.json | estimated | ok |
| bob-and-nan-01 | Bob and Nan | /guided-reading/series/bob-and-nan/book-01/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-01.json | estimated | ok |
| bob-and-nan-02-park | Bob and Nan go to the Park | /guided-reading/series/bob-and-nan/book-02/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-02-park.json | estimated | ok |
| bob-and-nan-03-fluff | Bob, Nan and Fluff | /guided-reading/series/bob-and-nan/book-03/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-03-fluff.json | estimated | ok |
| bob-and-nan-04-beach | Bob and Nan go to the Beach | /guided-reading/series/bob-and-nan/book-04/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-04-beach.json | estimated | ok |
| bob-and-nan-05-school | Bob and Nan's First Day at School | /guided-reading/series/bob-and-nan/book-05/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-05-school.json | estimated | ok |
| bob-and-nan-06-zoo | Nan and Bob go to the Zoo | /guided-reading/series/bob-and-nan/book-06/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-06-zoo.json | estimated | ok |
| bob-and-nan-07-birthday | Nan and Bob: Bob's Birthday Party | /guided-reading/series/bob-and-nan/book-07/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-07-birthday.json | estimated | ok |
| bob-and-nan-08-sick | Nan and Bob get Sick | /guided-reading/series/bob-and-nan/book-08/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-08-sick.json | estimated | ok |
| bob-and-nan-09-read | Nan and Bob Learn to Read | /guided-reading/series/bob-and-nan/book-09/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-09-read.json | estimated | ok |
| bob-and-nan-10-vet | Fluff Visits the Vet | /guided-reading/series/bob-and-nan/book-10/audio/full-book.mp3 | yes | /guided-reading/sync/bob-and-nan-10-vet.json | estimated | ok |
| dino-pals-01-chompys-big-lunch | Chompy's Big Lunch | /guided-reading/series/dino-pals/book-01/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-01-chompys-big-lunch.json | estimated | ok |
| dino-pals-02-sunnys-rainy-day | Sunny's Rainy Day | /guided-reading/series/dino-pals/book-02/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-02-sunnys-rainy-day.json | estimated | ok |
| dino-pals-03-dozy-wont-wake-up | Dozy Won't Wake Up | /guided-reading/series/dino-pals/book-03/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-03-dozy-wont-wake-up.json | estimated | ok |
| dino-pals-04-grumpy-needs-help | Grumpy Needs Help | /guided-reading/series/dino-pals/book-04/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-04-grumpy-needs-help.json | estimated | ok |
| dino-pals-05-bossy-makes-a-plan | Bossy Makes a Plan | /guided-reading/series/dino-pals/book-05/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-05-bossy-makes-a-plan.json | estimated | ok |
| dino-pals-06-bouncy-bumps-into-everything | Bouncy Bumps Into Everything | /guided-reading/series/dino-pals/book-06/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-06-bouncy-bumps-into-everything.json | estimated | ok |
| dino-pals-07-wigglys-messy-day | Wiggly's Messy Day | /guided-reading/series/dino-pals/book-07/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-07-wigglys-messy-day.json | estimated | ok |
| dino-pals-08-zippy-slows-down | Zippy Slows Down | /guided-reading/series/dino-pals/book-08/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-08-zippy-slows-down.json | estimated | ok |
| dino-pals-09-honkys-inside-voice | Honky's Inside Voice | /guided-reading/series/dino-pals/book-09/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-09-honkys-inside-voice.json | estimated | ok |
| dino-pals-10-cheekys-prank-goes-wrong | Cheeky's Prank Goes Wrong | /guided-reading/series/dino-pals/book-10/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-10-cheekys-prank-goes-wrong.json | estimated | ok |
| dino-pals-11-shys-secret-gift | Shy's Secret Gift | /guided-reading/series/dino-pals/book-11/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-11-shys-secret-gift.json | estimated | ok |
| dino-pals-12-fancys-bad-day | Fancy's Bad Day | /guided-reading/series/dino-pals/book-12/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-12-fancys-bad-day.json | estimated | ok |
| dino-pals-13-clumsy-to-the-rescue | Clumsy to the Rescue | /guided-reading/series/dino-pals/book-13/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-13-clumsy-to-the-rescue.json | estimated | ok |
| dino-pals-14-what-is-flappy | What is Flappy? | /guided-reading/series/dino-pals/book-14/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-14-what-is-flappy.json | estimated | ok |
| dino-pals-15-sneezy-and-the-waterfall | Sneezy and the Waterfall | /guided-reading/series/dino-pals/book-15/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-15-sneezy-and-the-waterfall.json | estimated | ok |
| dino-pals-16-chompy-and-grumpys-day-out | Chompy and Grumpy's Day Out | /guided-reading/series/dino-pals/book-16/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-16-chompy-and-grumpys-day-out.json | estimated | ok |
| dino-pals-17-the-sunny-hollow-games | The Sunny Hollow Games | /guided-reading/series/dino-pals/book-17/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-17-the-sunny-hollow-games.json | estimated | ok |
| dino-pals-18-dozys-wonderful-dream | Dozy's Wonderful Dream | /guided-reading/series/dino-pals/book-18/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-18-dozys-wonderful-dream.json | estimated | ok |
| dino-pals-19-zippys-race | Zippy's Race | /guided-reading/series/dino-pals/book-19/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-19-zippys-race.json | estimated | ok |
| dino-pals-20-the-big-storm | The Big Storm | /guided-reading/series/dino-pals/book-20/audio/full-book.mp3 | yes | /guided-reading/sync/dino-pals-20-the-big-storm.json | estimated | ok |
| james-and-anna-01-space | James and Anna go to Space | /guided-reading/series/james-and-anna/book-01/audio/full-book.mp3 | yes | /guided-reading/sync/james-and-anna-01-space.json | estimated | ok |
| james-and-anna-02-chips | James and Anna and Chips | /guided-reading/series/james-and-anna/book-02/audio/full-book.mp3 | yes | /guided-reading/sync/james-and-anna-02-chips.json | estimated | ok |
| james-and-anna-03-shopping | James and Anna go Shopping | /guided-reading/series/james-and-anna/book-03/audio/full-book.mp3 | yes | /guided-reading/sync/james-and-anna-03-shopping.json | estimated | ok |
| james-and-anna-04-dentist | James and Anna go to the Dentist | /guided-reading/series/james-and-anna/book-04/audio/full-book.mp3 | yes | /guided-reading/sync/james-and-anna-04-dentist.json | estimated | ok |
| james-and-anna-05-tree-house | James and Anna build a Tree House | /guided-reading/series/james-and-anna/book-05/audio/full-book.mp3 | yes | /guided-reading/sync/james-and-anna-05-tree-house.json | estimated | ok |
| ja-b-06 | James and Anna visit Grandma's Farm | /guided-reading/series/james-and-anna/book-06/audio/full-book.mp3 | yes | /guided-reading/sync/ja-b-06.json | estimated | ok |
| ja-b-07 | James and Anna and the School Play | /guided-reading/series/james-and-anna/book-07/audio/full-book.mp3 | yes | /guided-reading/sync/ja-b-07.json | estimated | ok |
| ja-b-08 | Chips's Play Date | /guided-reading/series/james-and-anna/book-08/audio/full-book.mp3 | yes | /guided-reading/sync/ja-b-08.json | estimated | ok |
| ja-b-09 | James and Anna's New Bikes | /guided-reading/series/james-and-anna/book-09/audio/full-book.mp3 | yes | /guided-reading/sync/ja-b-09.json | estimated | ok |
| ja-b-10 | James, Anna and Chips go Camping | /guided-reading/series/james-and-anna/book-10/audio/full-book.mp3 | yes | /guided-reading/sync/ja-b-10.json | estimated | ok |
| meadow-pals-01-muddy-has-a-bath | Muddy Has a Bath | /guided-reading/series/meadow-pals/book-01/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-01-muddy-has-a-bath.json | estimated | ok |
| meadow-pals-02-woolly-cant-sleep | Woolly Can't Sleep | /guided-reading/series/meadow-pals/book-02/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-02-woolly-cant-sleep.json | estimated | ok |
| meadow-pals-03-clucky-lays-an-egg | Clucky Lays an Egg | /guided-reading/series/meadow-pals/book-03/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-03-clucky-lays-an-egg.json | estimated | ok |
| meadow-pals-04-bouncy-wont-stop | Bouncy Won't Stop | /guided-reading/series/meadow-pals/book-04/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-04-bouncy-wont-stop.json | estimated | ok |
| meadow-pals-05-grumpy-gets-a-surprise | Grumpy Gets a Surprise | /guided-reading/series/meadow-pals/book-05/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-05-grumpy-gets-a-surprise.json | estimated | ok |
| meadow-pals-06-sleepy-cant-wake-up | Sleepy Can't Wake Up | /guided-reading/series/meadow-pals/book-06/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-06-sleepy-cant-wake-up.json | estimated | ok |
| meadow-pals-07-noisy-tries-to-be-quiet | Noisy Tries to Be Quiet | /guided-reading/series/meadow-pals/book-07/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-07-noisy-tries-to-be-quiet.json | estimated | ok |
| meadow-pals-08-tiny-is-very-small | Tiny is Very Small | /guided-reading/series/meadow-pals/book-08/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-08-tiny-is-very-small.json | estimated | ok |
| meadow-pals-09-shy-comes-out-to-play | Shy Comes Out to Play | /guided-reading/series/meadow-pals/book-09/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-09-shy-comes-out-to-play.json | estimated | ok |
| meadow-pals-10-giggly-has-the-hiccups | Giggly Has the Hiccups | /guided-reading/series/meadow-pals/book-10/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-10-giggly-has-the-hiccups.json | estimated | ok |
| meadow-pals-11-brave-climbs-the-hay-bale | Brave Climbs the Hay Bale | /guided-reading/series/meadow-pals/book-11/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-11-brave-climbs-the-hay-bale.json | estimated | ok |
| meadow-pals-12-hungry-eats-everything | Hungry Eats Everything | /guided-reading/series/meadow-pals/book-12/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-12-hungry-eats-everything.json | estimated | ok |
| meadow-pals-13-splashy-finds-a-puddle | Splashy Finds a Puddle | /guided-reading/series/meadow-pals/book-13/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-13-splashy-finds-a-puddle.json | estimated | ok |
| meadow-pals-14-speedy-slows-down | Speedy Slows Down | /guided-reading/series/meadow-pals/book-14/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-14-speedy-slows-down.json | estimated | ok |
| meadow-pals-15-cuddly-wants-a-hug | Cuddly Wants a Hug | /guided-reading/series/meadow-pals/book-15/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-15-cuddly-wants-a-hug.json | estimated | ok |
| meadow-pals-16-muddy-and-splashy-make-a-mess | Muddy and Splashy Make a Mess | /guided-reading/series/meadow-pals/book-16/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-16-muddy-and-splashy-make-a-mess.json | estimated | ok |
| meadow-pals-17-bouncy-and-speedy-have-a-race | Bouncy and Speedy Have a Race | /guided-reading/series/meadow-pals/book-17/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-17-bouncy-and-speedy-have-a-race.json | estimated | ok |
| meadow-pals-18-noisy-wakes-everyone-up | Noisy Wakes Everyone Up | /guided-reading/series/meadow-pals/book-18/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-18-noisy-wakes-everyone-up.json | estimated | ok |
| meadow-pals-19-tiny-and-brave-go-on-an-adventure | Tiny and Brave Go on an Adventure | /guided-reading/series/meadow-pals/book-19/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-19-tiny-and-brave-go-on-an-adventure.json | estimated | ok |
| meadow-pals-20-shy-and-cuddly-find-each-other | Shy and Cuddly Find Each Other | /guided-reading/series/meadow-pals/book-20/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-20-shy-and-cuddly-find-each-other.json | estimated | ok |
| meadow-pals-21-woolly-and-grumpy-are-stuck | Woolly and Grumpy Are Stuck | /guided-reading/series/meadow-pals/book-21/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-21-woolly-and-grumpy-are-stuck.json | estimated | ok |
| meadow-pals-22-sleepys-big-dream | Sleepy's Big Dream | /guided-reading/series/meadow-pals/book-22/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-22-sleepys-big-dream.json | estimated | ok |
| meadow-pals-23-giggly-and-clucky-bake-a-cake | Giggly and Clucky Bake a Cake | /guided-reading/series/meadow-pals/book-23/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-23-giggly-and-clucky-bake-a-cake.json | estimated | ok |
| meadow-pals-24-grumpys-secret | Grumpy's Secret | /guided-reading/series/meadow-pals/book-24/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-24-grumpys-secret.json | estimated | ok |
| meadow-pals-25-the-big-farm-party | The Big Farm Party | /guided-reading/series/meadow-pals/book-25/audio/full-book.mp3 | yes | /guided-reading/sync/meadow-pals-25-the-big-farm-party.json | estimated | ok |

## Skipped Files

No requested files were skipped.

## Unmatched Files

No MP3 or sync files were unmatched. The two JSON files in the pack were delivery metadata, not `/guided-reading/sync/{bookId}.json` timing files.

## Invalid JSON

No invalid JSON files were found.

## Manual Review Needed

No structural sync JSON issues were found. Timing remains estimated and should be verified if precise page-boundary highlighting is required.

## Validation Result

- `node tools/auditGuidedReadingWholeBookAudio.js` completed after import.
- Whole-book audio missing count is now 0.
- Estimated timing JSON count is now 176.
- Build and whitespace validation are recorded in the task summary after this report is generated.
