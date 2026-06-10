# Teacher-Created Learn Slide Packs

## Purpose

Teacher-created PowerPoint decks are the visual source for Learn lessons because teachers can control slide layout, pacing, classroom language, and print/board consistency. LiteracyPath does not render `.pptx` files in the browser. Instead, each slide is exported as a local image and shown as the lesson stage.

This gives the lesson the look of the teacher-made deck while keeping video/resource support teacher-controlled. Resource links open only after a teacher click. There is no autoplay and no embedded copied video.

## Folder Structure

```text
public/
  learn-decks/
    cycle-01/
      lesson-01/
        Cycle-01-Lesson-01.pptx
        slide-01.webp
        slide-02.webp
        slide-03.webp
```

PPTX files are download-only. Slide images are the browser lesson visuals.

## Slide Image Naming

Use stable, ordered names:

```text
slide-01.webp
slide-02.webp
slide-03.webp
```

Use `.webp` where possible. If a slide image is missing, the Learn Deck player shows a placeholder instead of crashing.

## Deck Metadata

Decks live in `src/data/learnDecks.js`.

```js
{
  id: "cycle-01-lesson-01",
  cycleId: "cycle-1",
  cycleNumber: 1,
  lessonNumber: 1,
  title: "Meet A and M",
  type: "whole-group",
  pptxDownload: "/learn-decks/cycle-01/lesson-01/Cycle-01-Lesson-01.pptx",
  active: true,
  slides: []
}
```

If the PPTX is not available yet, leave `pptxDownload` blank. The UI will show that the PPTX file has not been added.

## Teacher Resource Links

When a source slide includes a safe external resource link, add it to the slide metadata:

```js
{
  id: "lesson-02-slide-04",
  type: "image",
  image: "/learn-decks/cycle-01/lesson-02/slide-04.webp",
  links: [
    { label: "Open teacher resource", url: "https://example.com/teacher-resource" }
  ]
}
```

Links render in the lesson controls outside the slide image so they do not cover the slide content. They must never autoplay.

## Optional App Games

The architecture still supports app-controlled overlays when a future teacher-created deck intentionally needs them.

## Reveal Game

Use `type: "turn-card-reveal"` for click-to-turn cards.

```js
{
  id: "slide-02",
  type: "turn-card-reveal",
  image: "/learn-decks/cycle-01/lesson-01/slide-02.webp",
  prompt: "Click a card. Say the sound.",
  cards: [
    { id: "apple", front: "A a", back: "apple", image: "/media/learn/images/cycle-01/apple.png" }
  ]
}
```

Cards show the front first. Clicking reveals the back, image, and manual audio button when audio exists.

## Sorting Game

Use `type: "sort-cards"` for click-to-select, click-zone sorting.

```js
{
  id: "slide-03",
  type: "sort-cards",
  prompt: "Sort the pictures.",
  zones: [
    { id: "a", label: "A /a/" },
    { id: "m", label: "M /m/" }
  ],
  cards: [
    { id: "apple", label: "apple", zone: "a", image: "/media/learn/images/cycle-01/apple.png" }
  ]
}
```

The app gives gentle correct/review feedback and includes a teacher reveal.

## Word Wall Game

Use `type: "word-wall"` for grouped words.

```js
{
  id: "slide-04",
  type: "word-wall",
  prompt: "Read the word wall.",
  groups: [
    { id: "a-words", label: "A /a/", words: [{ id: "ant", label: "ant" }] }
  ]
}
```

Click a word to highlight it. Audio and image reveal are optional and do not save progress.

## Sound Safari

Use `type: "sound-safari"` for target-sound picture hunts.

```js
{
  id: "slide-05",
  type: "sound-safari",
  prompt: "Find pictures that start with /a/.",
  targetSound: "/a/",
  cards: [
    { id: "apple", label: "apple", correct: true, image: "/media/learn/images/cycle-01/apple.png" }
  ]
}
```

Correct cards mark as found. Wrong clicks give gentle visual feedback.

## PPTX Rule

PPTX files are download-only. Do not embed PowerPoint files, use external PPT viewers, iframe Office viewers, or preview `.pptx` files in the browser.

## QA Checklist

- Open the cycle page and confirm the Teacher-Created Cycle 1 Slide Packs cards appear.
- Open the lesson and confirm Previous, Next, Exit, and slide counter work.
- Confirm arrow keys move slides and Escape exits.
- Confirm slide images use `object-fit: contain`.
- Confirm missing slide images show placeholders.
- Confirm teacher resource links appear only as click-to-open controls.
- Confirm reveal cards, sorting, word wall, and Sound Safari are usable.
- Confirm audio only plays after a button click.
- Confirm no autoplay, no external viewers, and no embedded PPTX preview.
- Confirm the lesson fits at 1366x768 and remains usable on tablet/mobile.
