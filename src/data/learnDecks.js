export const LEARN_DECK_INTERACTIVE_TYPES = [
  "turn-card-reveal",
  "sort-cards",
  "word-wall",
  "sound-safari"
];

const cycleOneLessonDecks = [
  {
    id: "cycle-01-lesson-01",
    lessonNumber: 1,
    title: "Cycle 1 Lesson 1: Introducing Poem Launch and Getting to Know Letters: Mm",
    slideCount: 25,
    // EL logo/title, EL learning target/red-text pages, and red check pages stay out of the in-app player.
    hiddenSlides: [1, 2, 3, 4, 25]
  },
  {
    id: "cycle-01-lesson-02",
    lessonNumber: 2,
    title: "Cycle 1 Lesson 2: Poem Launch and Getting to Know Letters: Aa",
    slideCount: 25,
    // EL logo/title, EL learning target/red-text pages, and red check pages stay out of the in-app player.
    hiddenSlides: [1, 2, 3, 4, 25],
    teacherLinks: {
      4: [
        {
          label: "Open teacher resource",
          url: "https://drive.google.com/file/d/1De5WBlPrUsIH4SxFfyBFtZ6q8x-Th7zw/view"
        }
      ],
      19: [
        {
          label: "Open teacher resource",
          url: "https://drive.google.com/file/d/1MR7WChxwvIq1cxXoVMzs1hnGu2PO_3l1/view"
        }
      ],
      21: [
        {
          label: "Open teacher resource",
          url: "https://drive.google.com/file/d/1MR7WChxwvIq1cxXoVMzs1hnGu2PO_3l1/view"
        }
      ]
    }
  },
  {
    id: "cycle-01-lesson-03",
    lessonNumber: 3,
    title: "Cycle 1 Lesson 3: Introducing Fluency and Call and Response",
    slideCount: 31,
    // EL logo/title, EL learning target/red-text pages, and red writing/check pages stay out of the in-app player.
    hiddenSlides: [1, 2, 3, 24, 25, 26, 27, 28, 29, 30, 31]
  }
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function buildCycleOneSlides(deck) {
  const lessonSlug = `lesson-${pad(deck.lessonNumber)}`;
  const hiddenSlides = new Set(deck.hiddenSlides || []);

  return Array.from({ length: deck.slideCount }, (_, index) => {
    const slideNumber = index + 1;
    if (hiddenSlides.has(slideNumber)) return null;
    const links = deck.teacherLinks?.[slideNumber];

    return {
      id: `${lessonSlug}-slide-${pad(slideNumber)}`,
      type: "image",
      image: `/learn-decks/cycle-01/${lessonSlug}/slide-${pad(slideNumber)}.webp`,
      alt: `${deck.title} slide ${slideNumber}`,
      originalSlideNumber: slideNumber,
      ...(links ? { prompt: "Teacher resource available for this slide.", links } : {})
    };
  }).filter(Boolean);
}

export const learnDecks = cycleOneLessonDecks.map(deck => ({
  id: deck.id,
  cycleId: "cycle-1",
  cycleNumber: 1,
  lessonNumber: deck.lessonNumber,
  title: deck.title,
  type: "whole-group",
  pptxDownload: `/learn-decks/cycle-01/lesson-${pad(deck.lessonNumber)}/Cycle-01-Lesson-${pad(deck.lessonNumber)}.pptx`,
  active: true,
  slides: buildCycleOneSlides(deck)
}));

export function getLearnDecksForCycle(cycleId) {
  return learnDecks.filter(deck => deck.active && deck.cycleId === cycleId);
}

export function countInteractiveSlides(deck) {
  return (deck?.slides || []).filter(slide => (
    LEARN_DECK_INTERACTIVE_TYPES.includes(slide.type) || slide.links?.length
  )).length;
}
