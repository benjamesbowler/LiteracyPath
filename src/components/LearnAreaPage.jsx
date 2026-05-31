import { useEffect, useMemo, useState } from "react";
import {
  EL_LEARN_SECTION_IDS,
  EL_LEARN_SECTION_LABELS,
  elSkillsBlockCycles,
  getElSkillsBlockCycle,
  getRecommendedElSkillsBlockCycle
} from "../data/elSkillsBlockCycles.js";
import {
  formatGuidedReadingType,
  guidedReadingBooks,
  normalizeGuidedReadingType
} from "../data/guidedReadingBooks.js";
import { countInteractiveSlides, getLearnDecksForCycle } from "../data/learnDecks.js";
import { LearnDeckPlayer } from "./LearnDeckPlayer.jsx";

const WORKSHEET_TYPES = [
  "cycle worksheet pack",
  "clay mat",
  "vocabulary mat",
  "letter tracing",
  "letter/sound matching",
  "circle the beginning sound",
  "circle the ending sound",
  "rhyme match",
  "cut-and-paste HFW",
  "read/write HFW",
  "CVC decoding",
  "chaining practice",
  "dictation",
  "sentence writing",
  "pattern practice",
  "review worksheet",
  "cycle check worksheet"
];

const WORKSHEET_DIFFICULTY_LABELS = {
  support: "Support",
  core: "Core",
  challenge: "Challenge"
};

const WORKSHEET_DIRECTIONS_BY_DIFFICULTY = {
  support: "Say each sound with your teacher. Trace first, then write.",
  core: "Say each sound. Read each word. Use your best pencil work.",
  challenge: "Read carefully. Write clearly, then add one more word or sentence when asked."
};

const SECTION_VISUALS = {
  overview: { icon: "Map", color: "teal", title: "Plan" },
  letterLearning: { icon: "Aa", color: "rose", title: "Letters" },
  poemAndChant: { icon: "Clap", color: "amber", title: "Chant" },
  phonemicAwareness: { icon: "Ear", color: "sky", title: "Listen" },
  rhyming: { icon: "Rhyme", color: "violet", title: "Play" },
  highFrequencyWords: { icon: "Word", color: "lime", title: "Words" },
  decoding: { icon: "Chain", color: "indigo", title: "Blend" },
  writing: { icon: "Write", color: "orange", title: "Write" },
  worksheets: { icon: "Page", color: "slate", title: "Print" },
  teacherNotes: { icon: "Tip", color: "green", title: "Tips" }
};

const LEARN_IMAGE_BY_WORD = {
  alligator: "/media/learn/images/cycle-01/alligator.png",
  ant: "/media/learn/images/cycle-01/ant.png",
  apple: "/media/learn/images/cycle-01/apple.png",
  map: "/media/learn/images/cycle-01/map.png",
  mat: "/media/learn/images/cycle-01/mat.png",
  moon: "/media/learn/images/cycle-01/moon.png",
  mouse: "/media/learn/images/cycle-01/mouse.png",
  ball: "/media/learn/images/cycle-08/ball.png",
  bag: "/media/initial-sounds/images/b/bag.webp",
  bat: "/media/learn/images/cycle-08/bat.png",
  bear: "/media/learn/images/cycle-08/bear.png",
  bit: "/media/learn/images/cycle-08/bit.png",
  bell: "/media/initial-sounds/images/b/bell.webp",
  book: "/media/learn/images/cycle-08/book.png",
  watch: "/media/learn/images/cycle-08/watch.png",
  watermelon: "/media/learn/images/cycle-08/watermelon.png",
  wave: "/media/vocabulary/images/wave.webp",
  web: "/media/learn/images/cycle-08/web.png",
  wig: "/media/initial-sounds/images/w/wig.webp",
  wolf: "/media/learn/images/cycle-08/wolf.png",
  wag: "/media/vocabulary/images/wag.webp",
  chair: "/media/learn/images/cycle-15/chair.png",
  cheese: "/media/learn/images/cycle-15/cheese.png",
  chin: "/media/learn/images/cycle-15/chin.png",
  chip: "/media/learn/images/cycle-15/chip.png",
  chop: "/media/learn/images/cycle-15/chop.png",
  shark: "/media/learn/images/cycle-15/shark.png",
  sheep: "/media/learn/images/cycle-15/sheep.png",
  ship: "/media/learn/images/cycle-15/ship.png",
  shop: "/media/learn/images/cycle-15/shop.png",
  teeth: "/media/learn/images/cycle-15/teeth.png",
  thin: "/media/learn/images/cycle-15/thin.png",
  three: "/media/learn/images/cycle-15/three-objects.png",
  thumb: "/media/learn/images/cycle-15/thumb.png",
  bang: "/media/learn/images/cycle-23/bang.png",
  gong: "/media/learn/images/cycle-23/gong.png",
  hang: "/media/learn/images/cycle-23/hang.png",
  hung: "/media/learn/images/cycle-23/hung.png",
  king: "/media/learn/images/cycle-23/king.png",
  long: "/media/learn/images/cycle-23/long.png",
  only: "/media/learn/images/cycle-23/only.png",
  other: "/media/learn/images/cycle-23/other.png",
  rang: "/media/learn/images/cycle-23/rang.png",
  ring: "/media/learn/images/cycle-23/ring.png",
  rung: "/media/learn/images/cycle-23/rung.png",
  sang: "/media/learn/images/cycle-23/sang.png",
  sing: "/media/learn/images/cycle-23/sing.png",
  song: "/media/learn/images/cycle-23/song.png",
  sung: "/media/learn/images/cycle-23/sung.png"
};

const LEARN_IMAGE_ALIAS_BY_WORD = {
  sunshine: "/media/initial-sounds/images/s/sun.webp",
  rainbow: "/media/initial-sounds/images/r/rainbow.webp",
  cupcake: "/media/vocabulary/images/cupcake.webp",
  pancake: "/media/vocabulary/images/pancake.webp",
  cake: "/media/initial-sounds/images/c/cake.webp",
  cup: "/media/initial-sounds/images/c/cup.webp",
  bow: "/media/vocabulary/images/bow.webp"
};

const LEARN_AUDIO_BY_CYCLE = {
  1: {
    chant: "/media/learn/audio/cycle-01/ant-and-mouse-chant.mp3",
    cues: {
      a: "/media/learn/audio/cycle-01/a-short-sound.mp3",
      m: "/media/learn/audio/cycle-01/m-sound.mp3"
    }
  },
  8: {
    chant: "/media/learn/audio/cycle-08/bear-and-wave-chant.mp3",
    cues: {
      b: "/media/learn/audio/cycle-08/b-sound.mp3",
      w: "/media/learn/audio/cycle-08/w-sound.mp3"
    }
  },
  15: {
    chant: "/media/learn/audio/cycle-15/three-sound-friends-chant.mp3",
    cues: {
      sh: "/media/learn/audio/cycle-15/digraph-cues.mp3",
      ch: "/media/learn/audio/cycle-15/digraph-cues.mp3",
      th: "/media/learn/audio/cycle-15/digraph-cues.mp3"
    }
  },
  23: {
    chant: "/media/learn/audio/cycle-23/king-can-sing-chant.mp3",
    cues: {
      ng: "/media/learn/audio/cycle-23/ng-rime-cues.mp3",
      ang: "/media/learn/audio/cycle-23/ng-rime-cues.mp3",
      ing: "/media/learn/audio/cycle-23/ng-rime-cues.mp3",
      ong: "/media/learn/audio/cycle-23/ng-rime-cues.mp3",
      ung: "/media/learn/audio/cycle-23/ng-rime-cues.mp3"
    }
  }
};

const GUIDED_READER_OVERRIDES = {
  1: "first-facts-level-a-13-fruit",
  8: "first-facts-level-a-11-at-the-farm",
  15: "james-and-anna-03-shopping",
  23: "first-facts-level-a-17-a-seed-grows"
};

const CYCLE_GROUPS = [
  { id: "foundations", label: "BOY / Foundations", matcher: cycle => cycle.id === "boy-assessment" },
  { id: "cycles-1-4", label: "Cycles 1-4", matcher: cycle => cycle.cycleNumber >= 1 && cycle.cycleNumber <= 4 || cycle.id === "review-cycles-1-4" },
  { id: "cycles-5-7", label: "Cycles 5-7", matcher: cycle => cycle.cycleNumber >= 5 && cycle.cycleNumber <= 7 },
  { id: "cycles-8-14", label: "Cycles 8-14", matcher: cycle => cycle.cycleNumber >= 8 && cycle.cycleNumber <= 14 || cycle.id === "review-cycles-8-10" || cycle.id === "review-cycles-11-12" || cycle.id === "moy-assessment" },
  { id: "cycles-15-25", label: "Cycles 15-25", matcher: cycle => cycle.cycleNumber >= 15 && cycle.cycleNumber <= 25 },
  { id: "cycles-26-27", label: "Cycles 26-27 / EOY", matcher: cycle => cycle.cycleNumber >= 26 && cycle.cycleNumber <= 27 || cycle.id === "eoy-assessment" || cycle.id === "celebrate-learning" }
];

function listText(values = [], fallback = "None listed") {
  return values.length ? values.join(", ") : fallback;
}

function cleanSearchPart(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "+");
}

function makeYouTubeSearchUrl(cycle) {
  const focus = cycle.focusLetters.concat(cycle.reviewLetters)
    .map(card => card.grapheme)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
  const query = [
    "kindergarten phonics",
    focus || cycle.title,
    cycle.highFrequencyWords.length ? `sight words ${cycle.highFrequencyWords.slice(0, 3).join(" ")}` : ""
  ].filter(Boolean).map(cleanSearchPart).join("+");
  return `https://www.youtube.com/results?search_query=${query}`;
}

function makeYouTubeQueryUrl(query) {
  return `https://www.youtube.com/results?search_query=${cleanSearchPart(query)}`;
}

function getCycleLearnTitle(cycle) {
  if (cycle.cycleNumber === 1) return "Aa Sound Safari";
  const focus = cycle.focusLetters.concat(cycle.reviewLetters).map(card => card.grapheme).filter(Boolean).slice(0, 3).join(" ");
  return focus ? `${focus} Sound Safari` : `${cycle.title} Learning`;
}

function getDisplaySound(card = {}) {
  if (card.sound === "/ă/") return "/a/";
  return card.sound || card.grapheme || "";
}

function getTeacherSoundCue(card = {}) {
  if (card.sound === "/ă/") return "short a as in apple";
  if (card.sound) return `${card.sound} as in ${(card.examples || [])[0] || card.spelling}`;
  return `pattern ${card.grapheme || card.spelling}`;
}

function getLessonGoalCards(cycle) {
  const sounds = cycle.focusLetters.concat(cycle.reviewLetters)
    .map(card => `${card.grapheme} ${getDisplaySound(card)}`.trim())
    .filter(Boolean)
    .slice(0, 4);
  return [
    cycle.childFriendlyGoal || (sounds.length ? `I can read ${sounds.join(" and ")}.` : "I can learn today's reading routine."),
    sounds.length ? `Sound cards: ${sounds.join(", ")}` : "",
    cycle.highFrequencyWords.length ? `Quick words: ${cycle.highFrequencyWords.slice(0, 3).join(", ")}` : ""
  ].filter(Boolean);
}

function getLearnImageKey(value = "") {
  const text = String(value).toLowerCase().trim();
  if (!text) return "";
  if (text.includes("=")) return text.split("=").pop().replace(/[^a-z-]+/g, "").replace(/-/g, "");
  if (text.includes("->")) return text.split("->")[0].replace(/[^a-z-]+/g, "").replace(/-/g, "");
  return text.replace(/[^a-z-]+/g, "").replace(/-/g, "");
}

function getLearnImageSrc(value = "") {
  const key = getLearnImageKey(value);
  return LEARN_IMAGE_BY_WORD[key] || LEARN_IMAGE_ALIAS_BY_WORD[key] || "";
}

function getActionCardParts(value = "") {
  return String(value).split(/\s*(?:->|\+|=)\s*/).map(part => part.trim()).filter(Boolean);
}

function makeSoundSafariSlide(card, otherCard, index) {
  if (!card) return null;
  const targetWords = (card.examples || []).slice(0, 3);
  const distractors = (otherCard?.examples || []).slice(0, 2);
  const cards = [...targetWords.slice(0, 2), ...distractors].filter(Boolean);
  const displaySound = getDisplaySound(card);
  return {
    id: `sound-safari-${index}`,
    type: "game",
    title: `${displaySound} Sound Safari`,
    sectionId: "rhyming",
    game: {
      title: `${displaySound} Sound Safari`,
      prompt: `Choose the pictures that start with ${displaySound}.`,
      teacherInstruction: "Show the cards in one row. Say the target sound, then wait while children choose.",
      studentAction: "Choose a picture, say the word, and repeat the first sound.",
      cards,
      targetItems: targetWords.slice(0, 2),
      answer: `${displaySound}: ${targetWords.slice(0, 2).join(", ")}`,
      supportPrompt: `Stretch the first sound before naming the picture: ${targetWords[0] || "word"}.`,
      challengePrompt: `Ask children to name one more ${displaySound} word.`
    }
  };
}

function buildLessonSlides(cycle) {
  const cards = cycle.sections.letterLearning.cards || [];
  const hfwCards = cycle.sections.highFrequencyWords.cards || [];
  const games = cycle.sections.games || [];
  const letterSlides = cards.slice(0, 3).flatMap((card, index) => [
    { id: `letter-${index + 1}`, type: "letter", title: `Meet ${card.grapheme}`, sectionId: "letterLearning", card },
    { id: `examples-${index + 1}`, type: "examples", title: `${card.grapheme} picture words`, sectionId: "letterLearning", card },
    makeSoundSafariSlide(card, cards.find((item, itemIndex) => itemIndex !== index), index + 1)
  ]).filter(Boolean);
  const slides = [
    { id: "welcome", type: "title", title: `${cycle.title}: ${getCycleLearnTitle(cycle)}`, sectionId: "overview" },
    ...letterSlides,
    games[1] && { id: "letter-sort", type: "game", title: games[1].title, sectionId: "rhyming", game: games[1] },
    { id: "targets", type: "targets", title: "Today We Learn", sectionId: "overview" },
    { id: "quick-review", type: "review", title: "Quick Review", sectionId: "overview" },
    { id: "chant", type: "chant", title: cycle.sections.poemAndChant.title, sectionId: "poemAndChant" },
    ...hfwCards.slice(0, 3).map((card, index) => ({ id: `hfw-${index}`, type: "hfw", title: `High-Frequency Word: ${card.word}`, sectionId: "highFrequencyWords", card })),
    games[3] && { id: "beat-builder", type: "game", title: games[3].title, sectionId: "phonemicAwareness", game: games[3] },
    games.find(game => game.id === "word-chain") && { id: "word-chain", type: "game", title: "Chaining / Word Building", sectionId: "decoding", game: games.find(game => game.id === "word-chain") },
    { id: "guided-reader", type: "guidedReading", title: "Guided Reader", sectionId: "overview" },
    { id: "writing", type: "writing", title: "Writing Mission", sectionId: "writing" },
    { id: "ppt-games", type: "pptGames", title: "Lesson Games", sectionId: "rhyming" },
    { id: "activity-stations", type: "activities", title: "Activity Stations", sectionId: "worksheets" },
    { id: "celebrate", type: "celebrate", title: "Great learning!", sectionId: "overview" }
  ].filter(Boolean);
  return slides;
}

function formatWorksheetItemForDifficulty(item, difficulty) {
  if (difficulty === "support") {
    return `Teacher support: ${item}`;
  }
  if (difficulty === "challenge") {
    return `${item} Add one more example or a sentence.`;
  }
  return item;
}

function makeWorksheetItems(cycle, worksheetType, count, difficulty = "core") {
  const letters = cycle.sections?.letterLearning?.cards?.length
    ? cycle.sections.letterLearning.cards
    : [...(cycle.focusLetters || []), ...(cycle.reviewLetters || [])];
  const hfw = cycle.highFrequencyWords || [];
  const paItems = cycle.sections.phonemicAwareness.practiceItems || [];
  const examples = letters.flatMap(card => card.examples || []);
  const customTasks = cycle.sections.worksheets?.tasks?.[worksheetType] || [];
  const clayTasks = (cycle.sections.clayMat?.sections || []).flatMap(section => [
    `Clay build: ${section.outline}. Say ${section.label}.`,
    `Picture check: ${section.picturePrompts.join(", ")}.`,
    `Write on the line: ${section.handwriting.join(", ")}.`
  ]);
  const vocabularyTasks = (cycle.sections.vocabularyMat?.groups || []).flatMap(group => [
    `${group.label}: read ${group.words.join(", ")}.`
  ]);
  const baseItems = {
    "cycle worksheet pack": customTasks,
    "clay mat": clayTasks,
    "vocabulary mat": vocabularyTasks,
    "letter tracing": letters.map(card => `Use the stroke model for ${card.grapheme}. Write ${card.spelling}. Say ${card.sound || card.grapheme}.`),
    "letter/sound matching": letters.map(card => `Match ${card.grapheme} to ${card.sound || card.spelling}.`),
    "circle the beginning sound": examples.map(word => `Circle the first sound in ${word}.`),
    "circle the ending sound": examples.map(word => `Circle the ending sound in ${word}.`),
    "rhyme match": (cycle.sections.rhyming.activities?.[0]?.items || []).map(pair => `Do these rhyme? ${pair[0]} / ${pair[1]}`),
    "cut-and-paste HFW": hfw.map(word => `Cut and paste ${word} into the sentence: I see ${word}.`),
    "read/write HFW": hfw.map(word => `Read ${word}. Write it. Read it again.`),
    "CVC decoding": examples.map(word => `Tap the sounds and read: ${word}`),
    "chaining practice": (cycle.sections.decoding.chains || []).flatMap(chain => chain.steps.map(step => `${chain.start}: ${step}`)),
    "dictation": cycle.sections.writing.dictation.map(word => `Teacher says: ${word}. Student writes it.`),
    "sentence writing": [cycle.sections.writing.sentenceFrame, cycle.sections.writing.interactiveWritingPrompt],
    "pattern practice": letters.map(card => `Find ${card.spelling} in words: ${(card.examples || []).slice(0, 3).join(", ")}.`),
    "review worksheet": [...letters.map(card => `Review ${card.grapheme} ${card.sound || ""}`), ...hfw.map(word => `Read ${word}`)],
    "cycle check worksheet": [...letters.map(card => `Check ${card.grapheme} ${card.sound || ""}`), ...hfw.map(word => `Read ${word}`), ...paItems.map(item => item.prompt)]
  };
  const selected = baseItems[worksheetType] || baseItems["review worksheet"];
  const fallback = [
    `Read the focus letters: ${listText(letters.map(card => card.grapheme))}.`,
    `Read the high-frequency words: ${listText(hfw)}.`,
    cycle.phonemicAwareness?.[0] || "Practice the phonemic awareness focus."
  ];
  const source = selected.length ? selected : fallback;
  const adjustedSource = source.map(item => formatWorksheetItemForDifficulty(item, difficulty));
  return Array.from({ length: count }, (_, index) => adjustedSource[index % adjustedSource.length]);
}

function VisualBadge({ sectionId, label }) {
  const visual = SECTION_VISUALS[sectionId] || SECTION_VISUALS.overview;
  return (
    <span className={`learn-visual-badge ${visual.color}`} aria-hidden="true">
      {label || visual.icon}
    </span>
  );
}

function LessonPictureCard({ word, sound, className = "" }) {
  const text = String(word || "");
  const letter = text.slice(0, 1).toUpperCase();
  const imageSrc = getLearnImageSrc(text);
  const isActionCard = /->|\+|=/.test(text);
  const actionParts = isActionCard ? getActionCardParts(text) : [];
  const cardClassName = [
    "learn-picture-card",
    imageSrc ? "has-image" : "no-image",
    isActionCard ? "action-card" : "",
    className
  ].filter(Boolean).join(" ");
  return (
    <div className={cardClassName}>
      {imageSrc ? (
        <img alt="" aria-hidden="true" className="learn-picture-image" src={imageSrc} />
      ) : isActionCard && actionParts.length ? (
        <div className="learn-action-visual" aria-hidden="true">
          {actionParts.slice(0, 3).map((part, index) => (
            <span key={`${text}-${part}-${index}`}>{part.slice(0, 1).toUpperCase()}</span>
          ))}
        </div>
      ) : (
        <div className="learn-picture-placeholder" aria-hidden="true">
          <span>{letter}</span>
        </div>
      )}
      {!isActionCard && <b>{letter}</b>}
      <strong>{text}</strong>
      {sound && <small>{sound}</small>}
    </div>
  );
}

function StrokeDirectionCard({ card }) {
  const label = String(card?.grapheme || card?.spelling || "").replace("/", " ");
  const displaySound = getDisplaySound(card);
  return (
    <div className="learn-stroke-card" aria-label={`${label} stroke model`}>
      <div className="learn-stroke-canvas" aria-hidden="true">
        <span className="stroke-start one">1</span>
        <span className="stroke-arrow arrow-one"></span>
        <strong>{label}</strong>
        <span className="stroke-start two">2</span>
        <span className="stroke-arrow arrow-two"></span>
      </div>
      <div className="learn-stroke-caption">
        <strong>{label}</strong>
        <span>{displaySound}</span>
      </div>
    </div>
  );
}

function ResourcePictureToken({ word }) {
  const imageSrc = getLearnImageSrc(word);
  return (
    <span className={imageSrc ? "learn-resource-picture-token has-image" : "learn-resource-picture-token"} key={word}>
      {imageSrc && <img alt="" aria-hidden="true" src={imageSrc} />}
      <b>{word}</b>
    </span>
  );
}

function WorksheetGenerator({ cycle, compact = false }) {
  const [worksheetType, setWorksheetType] = useState(cycle.sections.worksheets.templates[0] || WORKSHEET_TYPES[0]);
  const [itemCount, setItemCount] = useState(8);
  const [difficulty, setDifficulty] = useState("core");
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeHandwritingLines, setIncludeHandwritingLines] = useState(true);
  const [includePictures, setIncludePictures] = useState(false);

  const items = useMemo(() =>
    makeWorksheetItems(cycle, worksheetType, Number(itemCount) || 8, difficulty),
  [cycle, worksheetType, itemCount, difficulty]);
  const difficultyLabel = WORKSHEET_DIFFICULTY_LABELS[difficulty] || WORKSHEET_DIFFICULTY_LABELS.core;
  const directions = WORKSHEET_DIRECTIONS_BY_DIFFICULTY[difficulty] || WORKSHEET_DIRECTIONS_BY_DIFFICULTY.core;

  return (
    <div className={compact ? "worksheet-generator compact" : "worksheet-generator"}>
      <div className="worksheet-controls">
        <label>
          Worksheet type
          <select value={worksheetType} onChange={event => setWorksheetType(event.target.value)}>
            {WORKSHEET_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label>
          Difficulty
          <select value={difficulty} onChange={event => setDifficulty(event.target.value)}>
            <option value="support">Support</option>
            <option value="core">Core</option>
            <option value="challenge">Challenge</option>
          </select>
        </label>
        <label>
          Items
          <input min="4" max="16" type="number" value={itemCount} onChange={event => setItemCount(event.target.value)} />
        </label>
        <label className="learn-checkbox">
          <input checked={includeAnswerKey} onChange={event => setIncludeAnswerKey(event.target.checked)} type="checkbox" />
          Answer key
        </label>
        <label className="learn-checkbox">
          <input checked={includeHandwritingLines} onChange={event => setIncludeHandwritingLines(event.target.checked)} type="checkbox" />
          Handwriting lines
        </label>
        <label className="learn-checkbox">
          <input checked={includePictures} onChange={event => setIncludePictures(event.target.checked)} type="checkbox" />
          Picture boxes
        </label>
        <button className="lp-button lp-button-primary" onClick={() => window.print()} type="button">
          Print Worksheet
        </button>
      </div>
      <div className="worksheet-preview" aria-label="Printable worksheet preview">
        <div className="worksheet-title">
          <strong>{cycle.title}: {worksheetType}</strong>
          <span>{difficultyLabel} practice - {itemCount} items</span>
          <div className="worksheet-student-line">
            <span>Name:</span>
            <span>Date:</span>
          </div>
        </div>
        <div className="worksheet-directions">
          <strong>Directions</strong>
          <p>{directions}</p>
        </div>
        <div className="worksheet-item-grid">
          {items.map((item, index) => (
            <article className="worksheet-task-card" key={`${item}-${index}`}>
              <strong>{index + 1}</strong>
              <p>{item}</p>
              {includePictures && <b className="worksheet-picture-box" aria-hidden="true"></b>}
              {includeHandwritingLines && <i className="handwriting-lines" aria-hidden="true"></i>}
            </article>
          ))}
        </div>
        {includeAnswerKey && (
          <details className="worksheet-answer-key">
            <summary>Answer Key</summary>
            {items.map((item, index) => <p key={`answer-${index}`}>{index + 1}. {item.replace(/^Teacher says: /, "")}</p>)}
          </details>
        )}
      </div>
    </div>
  );
}

function LetterCard({ card, lessonMode = false }) {
  const [upper = card.grapheme, lower = ""] = String(card.grapheme || "").split("/");
  const displayLower = lower || String(card.spelling || "").slice(0, 2);
  const displaySound = getDisplaySound(card);
  const teacherSoundCue = getTeacherSoundCue(card);
  if (lessonMode) {
    return (
      <article className="learn-letter-card lesson-card visual-letter-card">
        <StrokeDirectionCard card={card} />
        <div className="learn-letter-picture-bank">
          {(card.examples || []).slice(0, 4).map(word => <ResourcePictureToken key={`${card.grapheme}-${word}`} word={word} />)}
        </div>
        <div className="learn-sound-callout">
          <span>{displaySound || "review"}</span>
          <strong>{teacherSoundCue}</strong>
        </div>
      </article>
    );
  }
  return (
    <article className="learn-letter-card">
      <div className="learn-letter-tile" aria-label={`${card.grapheme} letter tile`}>
        <strong>{upper}</strong>
        <span>{displayLower}</span>
      </div>
      <div className="learn-letter-body">
        <span className="learn-sound-bubble">{displaySound || "review"}</span>
        <p>{lessonMode ? teacherSoundCue : card.childExplanation}</p>
        <small>{card.articulation}</small>
        <div className="learn-word-chip-row" aria-label="Example words">
          {(card.examples || []).map(word => <b key={word}>{word}</b>)}
        </div>
      </div>
    </article>
  );
}

function SectionCardButton({ sectionId, active, onClick }) {
  const visual = SECTION_VISUALS[sectionId] || SECTION_VISUALS.overview;
  return (
    <button
      className={active ? "learn-section-card active" : "learn-section-card"}
      onClick={onClick}
      type="button"
      aria-pressed={active}
    >
      <VisualBadge sectionId={sectionId} />
      <span>{EL_LEARN_SECTION_LABELS[sectionId]}</span>
      <small>{visual.title}</small>
    </button>
  );
}

function getCycleCardFocus(cycle) {
  return cycle.focusLetters.concat(cycle.reviewLetters)
    .map(card => `${card.grapheme} ${card.sound || ""}`.trim())
    .slice(0, 4)
    .join(", ") || cycle.phase.replace(/-/g, " ");
}

function getGroupedCycles(cycles) {
  return CYCLE_GROUPS.map(group => ({
    ...group,
    cycles: cycles.filter(group.matcher)
  })).filter(group => group.cycles.length);
}

function getRecommendationBook(recommendation) {
  if (!recommendation?.bookId) return null;
  return guidedReadingBooks.find(book => book.id === recommendation.bookId) || null;
}

function getBookCover(book) {
  return book?.coverImage || book?.cover || book?.coverUrl || "";
}

function getCardAudioSrc(cycle, card = {}) {
  const cycleAudio = LEARN_AUDIO_BY_CYCLE[cycle.cycleNumber];
  const key = String(card.spelling || card.grapheme || "").toLowerCase().replace(/[^a-z]+/g, "");
  return cycleAudio?.cues?.[key] || "";
}

function getChantAudioSrc(cycle) {
  return LEARN_AUDIO_BY_CYCLE[cycle.cycleNumber]?.chant || "";
}

function getBookSearchText(book = {}) {
  return [
    book.title,
    book.type,
    book.level,
    ...(book.targetSkills || []),
    ...(book.pages || []).map(page => page.text)
  ].join(" ").toLowerCase();
}

function getCycleReaderTerms(cycle) {
  return [
    ...cycle.highFrequencyWords,
    ...cycle.focusLetters.flatMap(card => [card.spelling, card.grapheme, ...(card.examples || [])]),
    ...cycle.reviewLetters.flatMap(card => [card.spelling, card.grapheme, ...(card.examples || [])])
  ]
    .map(term => String(term || "").toLowerCase().replace(/[^a-z]+/g, " ").trim())
    .filter(Boolean);
}

function scoreGuidedReader(book, cycle) {
  if (!book) return -1;
  const text = getBookSearchText(book);
  const terms = getCycleReaderTerms(cycle);
  let score = 0;
  terms.forEach(term => {
    if (!term || term.length < 2) return;
    const matches = text.match(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"));
    if (matches) score += matches.length * (term.length <= 2 ? 1 : 4);
  });
  if (book.level === "A") score += 3;
  if (book.level === "B") score += 2;
  if (book.active !== false) score += 1;
  return score;
}

function getBestGuidedReader(cycle, recommendations = {}) {
  const override = GUIDED_READER_OVERRIDES[cycle.cycleNumber];
  const overrideBook = override ? guidedReadingBooks.find(book => book.id === override) : null;
  if (overrideBook) return overrideBook;

  const recommendedBooks = [recommendations.nonfiction, recommendations.fiction]
    .map(getRecommendationBook)
    .filter(Boolean);
  const candidates = recommendedBooks.length ? recommendedBooks : guidedReadingBooks;
  return candidates
    .map(book => ({ book, score: scoreGuidedReader(book, cycle) }))
    .sort((a, b) => b.score - a.score)[0]?.book || null;
}

function getReaderMatchTags(book, cycle) {
  if (!book) return [];
  const text = getBookSearchText(book);
  const seen = new Set();
  return getCycleReaderTerms(cycle)
    .filter(term => term.length > 1 && text.includes(term) && !seen.has(term) && seen.add(term))
    .slice(0, 5);
}

function getGuidedReaderPages(book) {
  return (book?.pages || [])
    .filter(page => page.active !== false && page.qaStatus !== "rejected")
    .slice(0, 3);
}

function GuidedReadingRecommendationCard({ label, recommendation, onOpenGuidedReadingBook }) {
  const book = getRecommendationBook(recommendation);

  if (!recommendation) {
    return (
      <article className="learn-guided-book-card empty">
        <span>{label}</span>
        <strong>No strong match yet</strong>
        <p>Needs future guided-reading book.</p>
      </article>
    );
  }

  const cover = getBookCover(book);
  const typeLabel = formatGuidedReadingType(normalizeGuidedReadingType(book?.type || recommendation.type));
  return (
    <article className="learn-guided-book-card">
      <div className="learn-guided-cover" aria-hidden="true">
        {cover ? <img alt="" src={cover} /> : <span>{typeLabel.slice(0, 1)}</span>}
      </div>
      <div className="learn-guided-book-copy">
        <span>{label}</span>
        <strong>{book?.title || recommendation.title || "Guided Reading book"}</strong>
        <small>Level {book?.level || recommendation.level || "TBD"} · {typeLabel}</small>
        <p>{recommendation.reason}</p>
        <div className="learn-recommendation-tags">
          {(recommendation.skillConnections || []).slice(0, 4).map(item => <b key={`skill-${item}`}>{item}</b>)}
          {(recommendation.hfwConnections || []).slice(0, 4).map(item => <b key={`hfw-${item}`}>{item}</b>)}
          {(recommendation.patternConnections || []).slice(0, 4).map(item => <b key={`pattern-${item}`}>{item}</b>)}
        </div>
        {book ? (
          <button className="lp-button lp-button-primary" onClick={() => onOpenGuidedReadingBook?.(book.id)} type="button">
            Open Book
          </button>
        ) : (
          <p className="learn-guided-warning">Book registry match missing. Review this recommendation.</p>
        )}
      </div>
    </article>
  );
}

function EmbeddedGuidedReader({ book, cycle, onOpenGuidedReadingBook }) {
  const pages = getGuidedReaderPages(book);
  const cover = getBookCover(book);
  const typeLabel = formatGuidedReadingType(normalizeGuidedReadingType(book?.type));
  const matchTags = getReaderMatchTags(book, cycle);

  if (!book) {
    return (
      <div className="learn-reader-embed empty">
        <h1>Guided Reader</h1>
        <p>No local reader is matched yet for this cycle.</p>
      </div>
    );
  }

  return (
    <div className="learn-reader-embed">
      <div className="learn-reader-lead">
        <div className="learn-reader-cover" aria-hidden="true">
          {cover ? <img alt="" src={cover} /> : <span>{book.title.slice(0, 1)}</span>}
        </div>
        <div>
          <span>Read This Week · Best local match</span>
          <h1>{book.title}</h1>
          <p>Level {book.level} · {typeLabel}. Read with teacher control and listen for this cycle's sound or word pattern.</p>
          <div className="learn-reader-tags">
            {matchTags.length
              ? matchTags.map(tag => <b key={`reader-tag-${tag}`}>{tag}</b>)
              : cycle.focusLetters.slice(0, 4).map(card => <b key={`reader-tag-${card.spelling}`}>{card.grapheme}</b>)}
          </div>
          <button className="lp-button lp-button-primary" onClick={() => onOpenGuidedReadingBook?.(book.id)} type="button">
            Open Full Reader
          </button>
        </div>
      </div>
      <div className="learn-reader-page-strip">
        {pages.map(page => (
          <article key={`${book.id}-${page.pageNumber || page.storyPageNumber}`}>
            {page.image && <img alt="" src={page.image} />}
            <strong>Page {page.storyPageNumber || page.pageNumber}</strong>
            <p>{String(page.text || "").replace(/\s+/g, " ")}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function LessonAudioControl({ src, label }) {
  if (!src) return null;
  return (
    <div className="learn-audio-control">
      <span>{label}</span>
      <audio controls preload="none" src={src} />
    </div>
  );
}

function getActivityStations(cycle) {
  const letters = cycle.focusLetters.concat(cycle.reviewLetters);
  const firstLetters = letters.map(card => card.grapheme).slice(0, 4).join(" / ");
  const hfw = cycle.highFrequencyWords.slice(0, 3).join(", ");
  const games = cycle.sections.games || [];
  return [
    {
      title: "Picture Sound Sort",
      action: firstLetters ? `Sort picture cards under ${firstLetters}.` : "Sort review picture cards.",
      check: games.find(game => game.id === "letter-sort")?.answer || "Teacher checks the picture sort."
    },
    {
      title: "Hidden Picture Reveal",
      action: "Cover three pictures. Reveal one square at a time. Children name the picture and sound.",
      check: "Accept the target sound first, then the whole word."
    },
    {
      title: "High-Frequency Flash",
      action: hfw ? `Read, clap, and air-write ${hfw}.` : "Read, clap, and air-write review words.",
      check: "Children read the word without sounding it out."
    },
    {
      title: "Build and Blend",
      action: (games.find(game => game.id === "beat-builder")?.cards || cycle.sections.decoding.chains?.[0]?.steps || []).slice(0, 3).join("  ·  "),
      check: games.find(game => game.id === "beat-builder")?.answer || "Children say each part, then the whole word."
    },
    {
      title: "Clay or Marker Mat",
      action: "Build the target letter or pattern, say the sound, then match a picture.",
      check: "Teacher listens for the sound and checks the mat match."
    },
    {
      title: "Quick Exit",
      action: "One sound, one word, one picture before leaving the station.",
      check: "Record support needs for tomorrow's small group."
    }
  ];
}

function getPptGamePanels(cycle) {
  const games = cycle.sections.games || [];
  const soundCards = cycle.focusLetters.concat(cycle.reviewLetters).flatMap(card => card.examples || []).slice(0, 6);
  const chain = games.find(game => game.id === "word-chain");
  const hfw = games.find(game => game.id === "hfw-flash");
  return [
    {
      title: "Mystery Picture Reveal",
      prompt: "Click a covered picture. Children say the first sound, then name the picture.",
      cards: soundCards
    },
    {
      title: "Choose the Match",
      prompt: "Show three pictures. Children vote for the picture that matches the sound.",
      cards: soundCards.slice(0, 3)
    },
    {
      title: chain ? "Word Chain Click-Through" : "Word Beat Click-Through",
      prompt: chain ? chain.teacherInstruction : hfw?.teacherInstruction || "Click each card. Children read, clap, and answer.",
      cards: (chain?.cards || hfw?.cards || cycle.highFrequencyWords).slice(0, 6)
    }
  ];
}

function ChildLessonPath({ cycle, disabled = false, onStartLesson }) {
  const focusCards = cycle.sections.letterLearning.cards || [];
  const hfwWords = cycle.highFrequencyWords || [];
  return (
    <section className="learn-child-path" aria-label="Child lesson path">
      <article>
        <span>1</span>
        <strong>Look</strong>
        <p>{focusCards.length ? `Meet ${focusCards.map(card => card.grapheme).slice(0, 3).join(" and ")}.` : "Look at today's review cards."}</p>
      </article>
      <article>
        <span>2</span>
        <strong>Say</strong>
        <p>{focusCards.length ? `Say ${focusCards.map(card => card.sound || card.grapheme).slice(0, 3).join(" and ")}.` : "Say the review sounds."}</p>
      </article>
      <article>
        <span>3</span>
        <strong>Play</strong>
        <p>Point, sort, clap, and answer with your teacher.</p>
      </article>
      <article>
        <span>4</span>
        <strong>Read</strong>
        <p>{hfwWords.length ? `Read ${hfwWords.slice(0, 3).join(", ")} and this week's books.` : "Read this week's books."}</p>
      </article>
      <article>
        <span>5</span>
        <strong>Write</strong>
        <p>Sky-write first. Then pencil-write on the line.</p>
      </article>
      <button className="lp-button lp-button-primary" disabled={disabled} onClick={onStartLesson} type="button">
        Start Child Lesson Path
      </button>
    </section>
  );
}

function ClayMatPreview({ mat }) {
  if (!mat) return null;
  return (
    <section className="learn-resource-preview clay-mat-preview" aria-label={mat.title}>
      <div className="worksheet-title">
        <strong>{mat.title}</strong>
        <span>{mat.directions}</span>
        <div className="worksheet-student-line">
          <span>Name:</span>
          <span>Date:</span>
        </div>
      </div>
      <div className="learn-resource-grid">
        {mat.sections.map(section => (
          <article className="learn-resource-panel" key={section.label}>
            <strong>{section.label}</strong>
            <div className="clay-outline" aria-hidden="true">{section.outline}</div>
            <div className="learn-picture-box-row">
              {section.picturePrompts.map(prompt => <ResourcePictureToken key={`${section.label}-${prompt}`} word={prompt} />)}
            </div>
            <i className="handwriting-lines" aria-hidden="true"></i>
            <small>Write: {section.handwriting.join(", ")}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function VocabularyMatPreview({ mat }) {
  if (!mat) return null;
  return (
    <section className="learn-resource-preview vocabulary-mat-preview" aria-label={mat.title}>
      <div className="worksheet-title">
        <strong>{mat.title}</strong>
        <span>Read the word bank. Sort, say, and use the words with teacher support.</span>
      </div>
      <div className="learn-resource-grid">
        {mat.groups.map(group => (
          <article className="learn-resource-panel" key={group.label}>
            <strong>{group.label}</strong>
            <div className="learn-picture-box-row">
              {group.words.map(word => <ResourcePictureToken key={`${group.label}-${word}`} word={word} />)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LearnAreaPage({ assessmentSummary = null, onOpenGuidedReadingBook = null }) {
  const recommendedCycle = getRecommendedElSkillsBlockCycle({ assessmentSummary });
  const [selectedCycleId, setSelectedCycleId] = useState(recommendedCycle?.id || "cycle-1");
  const [activeSection, setActiveSection] = useState("overview");
  const [lessonSlideIndex, setLessonSlideIndex] = useState(0);
  const [isLessonMode, setIsLessonMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeLearnDeck, setActiveLearnDeck] = useState(null);
  const [search, setSearch] = useState("");
  const cycle = getElSkillsBlockCycle(selectedCycleId);
  const filteredCycles = elSkillsBlockCycles.filter(item =>
    !search.trim() || item.searchText.includes(search.trim().toLowerCase()) || item.title.toLowerCase().includes(search.trim().toLowerCase())
  );
  const groupedCycles = getGroupedCycles(filteredCycles);
  const letterCards = cycle.sections.letterLearning.cards || [];
  const lessonSlides = buildLessonSlides(cycle);
  const lessonSlide = lessonSlides[lessonSlideIndex] || lessonSlides[0];
  const youtubeSearchUrl = makeYouTubeSearchUrl(cycle);
  const guidedReadingRecommendations = cycle.guidedReadingRecommendations || {};
  const bestGuidedReader = getBestGuidedReader(cycle, guidedReadingRecommendations);
  const teacherCreatedDecks = getLearnDecksForCycle(cycle.id);
  const hasTeacherCreatedDecks = teacherCreatedDecks.length > 0;

  useEffect(() => {
    if (!isLessonMode) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsLessonMode(false);
      }
      if (event.key === "ArrowRight") {
        setLessonSlideIndex(index => Math.min(index + 1, lessonSlides.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setLessonSlideIndex(index => Math.max(index - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLessonMode, lessonSlides.length]);

  function openCycle(id) {
    setSelectedCycleId(id);
    setActiveSection("overview");
    setLessonSlideIndex(0);
    setActiveLearnDeck(null);
  }

  function openLesson({ preview = false } = {}) {
    setIsPreviewMode(preview);
    setLessonSlideIndex(0);

    if (hasTeacherCreatedDecks) {
      setIsLessonMode(false);
      setActiveLearnDeck(teacherCreatedDecks[0]);
      return;
    }

    setActiveLearnDeck(null);
    setIsLessonMode(true);
  }

  function renderTeacherCreatedDecks() {
    const deckHeading = cycle.cycleNumber
      ? `Teacher-Created ${cycle.title} Slide Packs`
      : "Teacher-Created Slide Packs";

    return (
      <section className="learn-created-decks-panel" aria-label={deckHeading}>
        <div className="learn-section-heading">
          <VisualBadge sectionId="overview" label="Deck" />
          <div>
            <h4>{deckHeading}</h4>
            <p>These in-app lessons use the original teacher-made PowerPoint slides as the full slide stage, with teacher-opened resource links only.</p>
          </div>
        </div>
        {teacherCreatedDecks.length ? (
          <div className="learn-created-deck-card-grid">
            {teacherCreatedDecks.map(deck => {
              const interactiveCount = countInteractiveSlides(deck);
              return (
                <article className="learn-created-deck-card" key={deck.id}>
                  <span>Cycle {deck.cycleNumber} · Lesson {deck.lessonNumber}</span>
                  <strong>{deck.title}</strong>
                  <small>{deck.slides.length} slides{interactiveCount ? ` · ${interactiveCount} teacher links` : ""}</small>
                  <div className="learn-created-deck-actions">
                    <button className="lp-button lp-button-primary" onClick={() => setActiveLearnDeck(deck)} type="button">Open Lesson</button>
                    {deck.pptxDownload ? (
                      <a className="lp-button lp-button-secondary" download href={deck.pptxDownload}>Download PPTX</a>
                    ) : (
                      <span className="learn-pptx-download-only">PPTX download-only: file not added yet</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="learn-created-deck-empty">
            <strong>No teacher-created deck yet for this cycle.</strong>
            <p>Add exported slide images and metadata in the Learn Decks data file.</p>
          </div>
        )}
      </section>
    );
  }

  function renderGameCards() {
    const games = cycle.sections.games || [];
    return (
      <div className="learn-game-grid">
        {games.map(game => (
          <article className="learn-game-card" key={game.id}>
            <VisualBadge sectionId={game.id === "hfw-flash" ? "highFrequencyWords" : "rhyming"} />
            <strong>{game.title}</strong>
            <p>{game.prompt}</p>
            {game.baskets && <div className="learn-game-baskets">{game.baskets.map(basket => <span key={basket}>{basket}</span>)}</div>}
            <div className="learn-word-chip-row">{(game.cards || []).map(card => <b key={`${game.id}-${card}`}>{card}</b>)}</div>
            <details>
              <summary>Teacher Reveal</summary>
              {game.teacherInstruction && <p><strong>Teacher move:</strong> {game.teacherInstruction}</p>}
              {game.studentAction && <p><strong>Child action:</strong> {game.studentAction}</p>}
              <p>{game.answer}</p>
              {game.supportPrompt && <p><strong>Support:</strong> {game.supportPrompt}</p>}
              {game.challengePrompt && <p><strong>Challenge:</strong> {game.challengePrompt}</p>}
            </details>
          </article>
        ))}
      </div>
    );
  }

  function renderVideoResources() {
    const resources = cycle.sections.videoResources || [];
    return (
      <div className="learn-video-grid">
        {resources.map(resource => (
          <a href={makeYouTubeQueryUrl(resource.query)} key={resource.label} target="_blank" rel="noreferrer">
            <VisualBadge sectionId="poemAndChant" />
            <span>{resource.label}</span>
            <small>Teacher opens in a new tab</small>
          </a>
        ))}
      </div>
    );
  }

  function renderGuidedReadingRecommendations({ deck = false } = {}) {
    return (
      <section className={deck ? "learn-guided-reading-week deck" : "learn-guided-reading-week"} aria-label="Guided Reading This Week">
        <div className="learn-section-heading">
          <VisualBadge sectionId="decoding" label="Book" />
          <div>
            <h4>Guided Reading This Week</h4>
            <p>Read one fiction and one non-fiction book this week. Listen for our cycle sounds and words.</p>
          </div>
        </div>
        <div className="learn-guided-book-grid">
          <GuidedReadingRecommendationCard
            label="Fiction Book"
            onOpenGuidedReadingBook={onOpenGuidedReadingBook}
            recommendation={guidedReadingRecommendations.fiction}
          />
          <GuidedReadingRecommendationCard
            label="Non-Fiction Book"
            onOpenGuidedReadingBook={onOpenGuidedReadingBook}
            recommendation={guidedReadingRecommendations.nonfiction}
          />
        </div>
        {guidedReadingRecommendations.note && <p className="learn-guided-warning">{guidedReadingRecommendations.note}</p>}
      </section>
    );
  }

  function renderLessonSlide(slide) {
    if (!slide) return null;
    if (slide.type === "title") {
      return (
        <article className="learn-deck-slide title-slide" data-slide-type="title">
          <VisualBadge sectionId="overview" label={cycle.cycleNumber ? String(cycle.cycleNumber) : "Go"} />
          <p>Eyes up. Voices ready.</p>
          <h1>{slide.title}</h1>
          <div className="learn-slide-focus">
            {cycle.focusLetters.concat(cycle.reviewLetters).slice(0, 4).map(card => <span key={`${card.grapheme}-${card.sound}`}>{card.grapheme} {getDisplaySound(card)}</span>)}
          </div>
          <p className="learn-slide-tip">We will see it, say it, find it, play it, read it, and write it.</p>
        </article>
      );
    }
    if (slide.type === "targets") {
      const lessonGoalCards = getLessonGoalCards(cycle);
      return (
        <article className="learn-deck-slide targets-slide">
          <h1>Today We Learn</h1>
          <div className="learn-slide-focus">
            {lessonGoalCards.map(goal => <span key={goal}>{goal}</span>)}
          </div>
          <p className="learn-slide-tip">First sounds and patterns first. High-frequency words get their own quick practice.</p>
        </article>
      );
    }
    if (slide.type === "review") {
      return (
        <article className="learn-deck-slide review-slide">
          <h1>Quick Review</h1>
          <p>Read the cards we already know. Then get ready for today's new sound.</p>
          <div className="learn-picture-card-grid">
            {cycle.highFrequencyWords.slice(0, 4).map(word => (
              <div className="learn-picture-card" key={`review-${word}`}>
                <span>Word</span>
                <strong>{word}</strong>
              </div>
            ))}
            {cycle.focusLetters.concat(cycle.reviewLetters).slice(0, 2).map(card => (
              <div className="learn-picture-card" key={`review-${card.grapheme}-${card.sound}`}>
                <span>Sound</span>
                <strong>{card.grapheme}</strong>
                <small>{getDisplaySound(card)}</small>
              </div>
            ))}
          </div>
        </article>
      );
    }
    if (slide.type === "letter") {
      const displaySound = getDisplaySound(slide.card);
      return (
        <article className="learn-deck-slide letter-slide" data-slide-type="letter">
          <div className="learn-slide-kicker">Meet {slide.card.grapheme} {displaySound}</div>
          <LetterCard card={slide.card} lessonMode />
          <LessonAudioControl label={`${slide.card.grapheme} sound cue`} src={getCardAudioSrc(cycle, slide.card)} />
          <div className="learn-slide-callout">
            <strong>Watch the stroke model. Say {displaySound}.</strong>
          </div>
        </article>
      );
    }
    if (slide.type === "examples") {
      return (
        <article className="learn-deck-slide examples-slide" data-slide-type="examples">
          <h1>{slide.title}</h1>
          <p>Listen for {getDisplaySound(slide.card)}. Choose the matching picture.</p>
          <div className="learn-picture-card-grid card-row">
            {(slide.card.examples || []).slice(0, 4).map(word => (
              <LessonPictureCard key={word} sound={getDisplaySound(slide.card)} word={word} />
            ))}
          </div>
        </article>
      );
    }
    if (slide.type === "game") {
      const gameCards = slide.game.cards || [];
      const gameClassName = ["learn-deck-slide", "game-slide", gameCards.length > 8 ? "dense-game" : ""].filter(Boolean).join(" ");
      return (
        <article className={gameClassName} data-slide-type="game">
          <h1>{slide.game.title}</h1>
          <div className="learn-game-instruction">
            <p>{slide.game.prompt}</p>
          </div>
          {slide.game.baskets && <div className="learn-game-baskets large">{slide.game.baskets.map(basket => <span key={basket}>{basket}</span>)}</div>}
          <div className="learn-picture-card-grid card-row">
            {gameCards.map((card, cardIndex) => (
              <LessonPictureCard key={`${slide.game.id || slide.id}-${card}-${cardIndex}`} word={card} />
            ))}
          </div>
          <details className="learn-teacher-reveal">
            <summary>Teacher Reveal</summary>
            {slide.game.teacherInstruction && <p><strong>Teacher move:</strong> {slide.game.teacherInstruction}</p>}
            {slide.game.studentAction && <p><strong>Child action:</strong> {slide.game.studentAction}</p>}
            <p>{slide.game.answer}</p>
            {slide.game.supportPrompt && <p>Support: {slide.game.supportPrompt}</p>}
            {slide.game.challengePrompt && <p>Challenge: {slide.game.challengePrompt}</p>}
          </details>
        </article>
      );
    }
    if (slide.type === "chant") {
      const chantAudio = getChantAudioSrc(cycle);
      return (
        <article className="learn-deck-slide chant-slide">
          <h1>{cycle.sections.poemAndChant.title}</h1>
          <div className="learn-poem deck-poem">
            {cycle.sections.poemAndChant.lines.map(line => <p key={line}>{line}</p>)}
          </div>
          <LessonAudioControl label="Teacher-controlled chant audio" src={chantAudio} />
          <p className="learn-slide-tip">{cycle.sections.poemAndChant.rhythm}</p>
        </article>
      );
    }
    if (slide.type === "hfw") {
      return (
        <article className="learn-deck-slide hfw-slide" data-slide-type="hfw">
          <p>Quick word. Read it as a whole word.</p>
          <strong>{slide.card.word}</strong>
          <span>{slide.card.spellIt}</span>
          <small>{slide.card.sentence} Read it. Spell it. Clap it. Write it in the air.</small>
        </article>
      );
    }
    if (slide.type === "guidedReading") {
      return (
        <article className="learn-deck-slide guided-reading-slide">
          <EmbeddedGuidedReader book={bestGuidedReader} cycle={cycle} onOpenGuidedReadingBook={onOpenGuidedReadingBook} />
        </article>
      );
    }
    if (slide.type === "writing") {
      return (
        <article className="learn-deck-slide writing-slide">
          <h1>Writing Mission</h1>
          <p>Watch the stroke model. Then write on the line.</p>
          <div className="learn-writing-stroke-grid">
            {cycle.focusLetters.concat(cycle.reviewLetters).slice(0, 4).map(card => <StrokeDirectionCard key={`${card.grapheme}-${card.spelling}`} card={card} />)}
          </div>
        </article>
      );
    }
    if (slide.type === "pptGames") {
      return (
        <article className="learn-deck-slide ppt-games-slide">
          <h1>Lesson Games</h1>
          <p>Teacher-led click-through games for this cycle.</p>
          <div className="learn-ppt-game-grid">
            {getPptGamePanels(cycle).map(panel => (
              <article key={panel.title}>
                <strong>{panel.title}</strong>
                <p>{panel.prompt}</p>
                <div className="learn-picture-card-grid mini">
                  {panel.cards.map((card, index) => <LessonPictureCard key={`${panel.title}-${card}-${index}`} word={card} />)}
                </div>
              </article>
            ))}
          </div>
        </article>
      );
    }
    if (slide.type === "activities") {
      return (
        <article className="learn-deck-slide activities-slide">
          <h1>Activity Stations</h1>
          <p>Use these during skills block rotation, small group, or partner practice.</p>
          <div className="learn-activity-station-grid">
            {getActivityStations(cycle).slice(0, 3).map((station, index) => (
              <article key={station.title}>
                <span>Station {index + 1}</span>
                <strong>{station.title}</strong>
                <p>{station.action}</p>
                <small>{station.check}</small>
              </article>
            ))}
          </div>
        </article>
      );
    }
    return (
      <article className="learn-deck-slide celebrate-slide">
        <VisualBadge sectionId="overview" label="Star" />
        <h1>Great learning!</h1>
        <p>Say your sounds, read your words, and show your best writing.</p>
      </article>
    );
  }

  function renderSection(sectionId, { lessonMode = false } = {}) {
    if (sectionId === "overview") {
      return (
        <div className={lessonMode ? "learn-section-panel lesson-panel" : "learn-section-panel"}>
          <div className="learn-section-heading">
            <VisualBadge sectionId="overview" />
            <div>
              <h4>Cycle Overview</h4>
              <p>Use this as the teacher map before starting the lesson.</p>
            </div>
          </div>
          <div className="learn-overview-grid visual">
            <article><VisualBadge sectionId="letterLearning" /><strong>Letters / Sounds</strong><p>{listText(cycle.focusLetters.concat(cycle.reviewLetters).map(card => `${card.grapheme} ${card.sound || ""}`.trim()))}</p></article>
            <article><VisualBadge sectionId="highFrequencyWords" /><strong>High-Frequency Words</strong><p>{listText(cycle.highFrequencyWords)}</p></article>
            <article><VisualBadge sectionId="phonemicAwareness" /><strong>Phonemic Awareness</strong><p>{listText(cycle.phonemicAwareness)}</p></article>
            <article><VisualBadge sectionId="decoding" /><strong>Routines</strong><p>{listText(cycle.routines)}</p></article>
          </div>
          <h5>Daily Flow</h5>
          <ChildLessonPath cycle={cycle} onStartLesson={() => openLesson()} />
          {renderTeacherCreatedDecks()}
          <div className="learn-daily-flow">
            {cycle.dailyFlow.map(day => (
              <article key={`${day.day}-${day.focus}`}>
                <strong>{day.day}</strong>
                <span>{day.focus}</span>
                <small>{day.description || day.lessonType}</small>
              </article>
            ))}
          </div>
          <h5>Quick Games</h5>
          {renderGameCards()}
          {renderGuidedReadingRecommendations()}
          <h5>Video Resources</h5>
          {renderVideoResources()}
        </div>
      );
    }

    if (sectionId === "letterLearning") {
      return (
        <div className={lessonMode ? "learn-section-panel lesson-panel" : "learn-section-panel"}>
          <div className="learn-section-heading">
            <VisualBadge sectionId="letterLearning" />
            <div>
              <h4>Letter & Sound Learning</h4>
              <p>Big tiles, clean sound bubbles, mouth notes, and example words.</p>
            </div>
          </div>
          {letterCards.length ? <div className="learn-letter-grid">{letterCards.map(card => <LetterCard card={card} key={`${card.grapheme}-${card.spelling}`} lessonMode={lessonMode} />)}</div> : <p>No new letter cards. Use this cycle for review, benchmark evidence, and small-group planning.</p>}
        </div>
      );
    }

    if (sectionId === "poemAndChant") {
      return (
        <div className={lessonMode ? "learn-section-panel lesson-panel" : "learn-section-panel"}>
          <div className="learn-section-heading">
            <VisualBadge sectionId="poemAndChant" />
            <div>
              <h4>{cycle.sections.poemAndChant.title}</h4>
              <p>{cycle.sections.poemAndChant.rhythm}</p>
            </div>
          </div>
          <div className="learn-poem">
            {cycle.sections.poemAndChant.lines.map(line => <p key={line}>{line}</p>)}
          </div>
          <h5>Call and Response</h5>
          <div className="learn-call-response">
            {cycle.sections.poemAndChant.callAndResponse.map(item => (
              <article key={item.teacher}>
                <span>Teacher reads</span>
                <strong>{item.teacher}</strong>
                <span>Students repeat</span>
                <p>{item.students}</p>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (sectionId === "phonemicAwareness") {
      return (
        <div className={lessonMode ? "learn-section-panel lesson-panel" : "learn-section-panel"}>
          <div className="learn-section-heading">
            <VisualBadge sectionId="phonemicAwareness" />
            <div>
              <h4>Phonemic Awareness</h4>
              <p>Listen, move one word part, then say the new word.</p>
            </div>
          </div>
          <div className="learn-teacher-script-card">
            <strong>Teacher script</strong>
            <p>{cycle.sections.phonemicAwareness.teacherWording}</p>
          </div>
          <div className="learn-practice-list reveal">
            {cycle.sections.phonemicAwareness.practiceItems.map(item => (
              <article key={item.prompt}>
                <span>{item.prompt}</span>
                <details>
                  <summary>Show answer</summary>
                  <strong>{item.answer}</strong>
                </details>
              </article>
            ))}
          </div>
          <div className="learn-tip-grid">
            <p><strong>Support:</strong> {cycle.sections.phonemicAwareness.supportPrompt}</p>
            <p><strong>Challenge:</strong> {cycle.sections.phonemicAwareness.challengePrompt}</p>
          </div>
        </div>
      );
    }

    if (sectionId === "rhyming") {
      return (
        <div className={lessonMode ? "learn-section-panel lesson-panel" : "learn-section-panel"}>
          <div className="learn-section-heading">
            <VisualBadge sectionId="rhyming" />
            <div>
              <h4>Rhyming / Word Play</h4>
              <p>{cycle.sections.rhyming.focus}</p>
            </div>
          </div>
          {cycle.sections.rhyming.activities.map(activity => (
            <article className="learn-activity-card visual" key={activity.name}>
              <strong>{activity.name}</strong>
              <p>{activity.teacherWording}</p>
              <div className="learn-rhyme-bubbles">{activity.items.map(pair => <span key={pair.join("-")}>{pair.join(" / ")}</span>)}</div>
            </article>
          ))}
        </div>
      );
    }

    if (sectionId === "highFrequencyWords") {
      return (
        <div className={lessonMode ? "learn-section-panel lesson-panel" : "learn-section-panel"}>
          <div className="learn-section-heading">
            <VisualBadge sectionId="highFrequencyWords" />
            <div>
              <h4>High-Frequency Words</h4>
              <p>Read it, spell it, write it, and use it in a simple sentence.</p>
            </div>
          </div>
          {cycle.sections.highFrequencyWords.cards.length ? <div className="hfw-learn-grid visual">{cycle.sections.highFrequencyWords.cards.map(card => (
            <article className="learn-hfw-card" key={card.word}>
              <strong>{card.word}</strong>
              <span>{card.spellIt}</span>
              <p>{card.sentence}</p>
              <small>{card.practice}</small>
            </article>
          ))}</div> : <p>No new HFW for this benchmark/review entry.</p>}
        </div>
      );
    }

    if (sectionId === "decoding") {
      return (
        <div className={lessonMode ? "learn-section-panel lesson-panel" : "learn-section-panel"}>
          <div className="learn-section-heading">
            <VisualBadge sectionId="decoding" />
            <div>
              <h4>Decoding / Chaining</h4>
              <p>{cycle.sections.decoding.note}</p>
            </div>
          </div>
          <div className="learn-chain-grid">
            {cycle.sections.decoding.chains.map(chain => (
              <article key={chain.start}>
                <strong>{chain.start}</strong>
                <div>{chain.steps.map(step => <span key={step}>{step}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (sectionId === "writing") {
      return (
        <div className={lessonMode ? "learn-section-panel lesson-panel" : "learn-section-panel"}>
          <div className="learn-section-heading">
            <VisualBadge sectionId="writing" />
            <div>
              <h4>Writing / Encoding Practice</h4>
              <p>Use the stroke model, then move to word writing and a shared sentence.</p>
            </div>
          </div>
          <div className="learn-writing-grid">
            {cycle.focusLetters.concat(cycle.reviewLetters).slice(0, 4).map(card => (
              <article className="learn-writing-model-card" key={`${card.grapheme}-${card.spelling}`}>
                <StrokeDirectionCard card={card} />
                <i className="handwriting-lines" aria-hidden="true"></i>
              </article>
            ))}
            {cycle.sections.writing.wordWriting.map(item => <article key={item}><span>W</span><p>{item}</p><i className="handwriting-lines" aria-hidden="true"></i></article>)}
            <article><span>S</span><p>Sentence frame: {cycle.sections.writing.sentenceFrame}</p><i className="handwriting-lines" aria-hidden="true"></i></article>
            <article><span>I</span><p>Interactive writing: {cycle.sections.writing.interactiveWritingPrompt}</p><i className="handwriting-lines" aria-hidden="true"></i></article>
          </div>
        </div>
      );
    }

    if (sectionId === "worksheets") {
      return (
        <div className={lessonMode ? "learn-section-panel lesson-panel" : "learn-section-panel"}>
          <div className="learn-section-heading">
            <VisualBadge sectionId="worksheets" />
            <div>
              <h4>Worksheet Generator</h4>
              <p>Create printable cycle practice, clay mats, and vocabulary mats from the selected cycle content.</p>
            </div>
          </div>
          <div className="learn-print-resource-stack">
            <ClayMatPreview mat={cycle.sections.clayMat} />
            <VocabularyMatPreview mat={cycle.sections.vocabularyMat} />
          </div>
          <WorksheetGenerator cycle={cycle} compact={lessonMode} />
        </div>
      );
    }

    return (
        <div className="learn-section-panel">
        <div className="learn-section-heading">
          <VisualBadge sectionId="teacherNotes" />
          <div>
            <h4>Teacher Notes / Differentiation</h4>
            <p>Small-group ideas and extension options for the current cycle.</p>
          </div>
        </div>
        <div className="learn-overview-grid visual">
          <article><strong>Small Group Support</strong><ul>{cycle.sections.teacherNotes.supportIdeas.map(item => <li key={item}>{item}</li>)}</ul></article>
          <article><strong>Extension</strong><ul>{cycle.sections.teacherNotes.extensionIdeas.map(item => <li key={item}>{item}</li>)}</ul></article>
          <article><strong>Reteach</strong><ul>{cycle.sections.teacherNotes.reteachSuggestions.map(item => <li key={item}>{item}</li>)}</ul></article>
          <article><strong>Progress Link</strong><p>{cycle.sections.teacherNotes.progressConnection}</p></article>
          <article className="learn-video-resource">
            <strong>Teacher video option</strong>
            <p>Use only teacher-approved videos. LiteracyPath does not autoplay or embed video inside lessons.</p>
            <a href={youtubeSearchUrl} target="_blank" rel="noreferrer">Find teacher-approved YouTube model</a>
          </article>
        </div>
        <h5>Little Fox / Teacher-Approved Video Searches</h5>
        {renderVideoResources()}
      </div>
    );
  }

  return (
    <main className="learn-area-page page-stack">
      {isLessonMode && (
        <section className="learn-fullscreen-mode learn-lesson-player" aria-label={`${cycle.title} full screen lesson`}>
          <header className="learn-fullscreen-header">
            <div>
              <p>{isPreviewMode ? "Preview Lesson" : "Full-Screen Lesson"}</p>
              <h2>{cycle.title}</h2>
            </div>
            <div className="learn-fullscreen-actions">
              <span>Slide {lessonSlideIndex + 1} of {lessonSlides.length}</span>
              <button className="lp-button lp-button-secondary" onClick={() => setIsLessonMode(false)} type="button">
                Exit Lesson
              </button>
            </div>
          </header>
          <div className="learn-progress-strip" aria-label={`Cycle lesson progress slide ${lessonSlideIndex + 1} of ${lessonSlides.length}`}>
            {lessonSlides.map((slide, index) => (
              <button
                className={index === lessonSlideIndex ? "active" : ""}
                key={slide.id}
                onClick={() => setLessonSlideIndex(index)}
                type="button"
                aria-label={`${slide.title} slide ${index + 1} of ${lessonSlides.length}`}
              >
                <span></span>
              </button>
            ))}
          </div>
          <div className="learn-fullscreen-stage">
            {renderLessonSlide(lessonSlide)}
          </div>
          <footer className="learn-fullscreen-footer">
            <button
              className="lp-button lp-button-secondary"
              disabled={lessonSlideIndex === 0}
              onClick={() => setLessonSlideIndex(index => Math.max(index - 1, 0))}
              type="button"
            >
              Previous Slide
            </button>
            <strong>{lessonSlide?.title || getCycleLearnTitle(cycle)}</strong>
            <button
              className="lp-button lp-button-primary"
              disabled={lessonSlideIndex === lessonSlides.length - 1}
              onClick={() => setLessonSlideIndex(index => Math.min(index + 1, lessonSlides.length - 1))}
              type="button"
            >
              Next Slide
            </button>
          </footer>
        </section>
      )}
      {activeLearnDeck && <LearnDeckPlayer deck={activeLearnDeck} onExit={() => setActiveLearnDeck(null)} />}

      <section className="card page-card learn-hero">
        <div className="learn-hero-copy">
          <p className="panel-label">Learn</p>
          <h2>EL Skills Block Learn</h2>
          <p>Choose a Kindergarten Skills Block cycle and open a bright, teacher-led lesson with printable practice.</p>
          <div className="learn-hero-actions">
            <button className="lp-button lp-button-primary" onClick={() => openLesson()} type="button">
              Start Full-Screen Lesson
            </button>
            <button className="lp-button lp-button-secondary" onClick={() => openLesson({ preview: true })} type="button">
              Preview Lesson
            </button>
            <button className="lp-button lp-button-secondary" onClick={() => setActiveSection("worksheets")} type="button">
              Generate Worksheets
            </button>
          </div>
        </div>
        <div className="learn-recommendation">
          <span>Recommended cycle</span>
          <strong>{recommendedCycle?.title || "Choose a cycle"}</strong>
          <small>{assessmentSummary?.attempts ? "Based on saved class/student assessment evidence." : "Choose a cycle to start teaching."}</small>
        </div>
      </section>

      <section className="card page-card learn-browser">
        <div className="learn-toolbar">
          <label>
            Search cycles, letters, sounds, HFW, or skills
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search: sh, am, rhyming, Cycle 15..." />
          </label>
          <label className="learn-mobile-cycle-select">
            Choose cycle
            <select value={selectedCycleId} onChange={event => openCycle(event.target.value)}>
              {elSkillsBlockCycles.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
        </div>

        <div className="learn-layout">
          <aside className="learn-cycle-groups" aria-label="EL Skills Block cycles">
            {groupedCycles.map(group => (
              <section className="learn-cycle-group" key={group.id}>
                <h3>{group.label}</h3>
                <div className="learn-cycle-grid">
                  {group.cycles.map(item => (
                    <article className={item.id === selectedCycleId ? "learn-cycle-card active" : "learn-cycle-card"} key={item.id}>
                      <button onClick={() => openCycle(item.id)} type="button">
                        <VisualBadge sectionId={item.type === "assessment" ? "overview" : "letterLearning"} label={item.cycleNumber ? String(item.cycleNumber) : "Go"} />
                        <span>{item.title}</span>
                        <strong>{getCycleCardFocus(item)}</strong>
                        <small>HFW: {listText(item.highFrequencyWords)}</small>
                        <small>{item.phonemicAwareness[0] || "Benchmark / review"}</small>
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </aside>

          <section className="learn-cycle-detail">
            <div className="learn-cycle-header visual">
              <div>
                <p className="panel-label">EL Skills Block</p>
                <h3>{cycle.title}</h3>
                <p>{cycle.phase.replace(/-/g, " ")} - {cycle.friday}</p>
                <div className="learn-hero-actions">
                  <button className="lp-button lp-button-primary" onClick={() => openLesson()} type="button">
                    Start Full-Screen Lesson
                  </button>
                  <button className="lp-button lp-button-secondary" onClick={() => openLesson({ preview: true })} type="button">
                    Preview Lesson
                  </button>
                  <button className="lp-button lp-button-secondary" onClick={() => setActiveSection("worksheets")} type="button">
                    Generate Worksheets
                  </button>
                </div>
              </div>
              <div className="learn-focus-tags">
                {cycle.focusLetters.concat(cycle.reviewLetters).slice(0, 8).map(card => <span key={`${card.grapheme}-${card.spelling}`}>{card.grapheme} {card.sound}</span>)}
                {cycle.highFrequencyWords.map(word => <span key={word}>{word}</span>)}
              </div>
            </div>

            <label className="learn-mobile-section-select">
              Choose learning section
              <select value={activeSection} onChange={event => setActiveSection(event.target.value)}>
                {EL_LEARN_SECTION_IDS.map(sectionId => <option key={sectionId} value={sectionId}>{EL_LEARN_SECTION_LABELS[sectionId]}</option>)}
              </select>
            </label>

            <nav className="learn-section-cards" aria-label="Cycle sections">
              {EL_LEARN_SECTION_IDS.map(sectionId => (
                <SectionCardButton
                  active={activeSection === sectionId}
                  key={sectionId}
                  onClick={() => setActiveSection(sectionId)}
                  sectionId={sectionId}
                />
              ))}
            </nav>

            {renderSection(activeSection)}
          </section>
        </div>
      </section>
    </main>
  );
}
