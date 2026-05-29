import { useEffect, useMemo, useState } from "react";
import {
  EL_LEARN_SECTION_IDS,
  EL_LEARN_SECTION_LABELS,
  elSkillsBlockCycles,
  getElSkillsBlockCycle,
  getRecommendedElSkillsBlockCycle
} from "../data/elSkillsBlockCycles.js";

const WORKSHEET_TYPES = [
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

const LESSON_SECTION_IDS = [
  "overview",
  "letterLearning",
  "poemAndChant",
  "phonemicAwareness",
  "rhyming",
  "highFrequencyWords",
  "decoding",
  "writing",
  "worksheets"
];

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

function makeWorksheetItems(cycle, worksheetType, count) {
  const letters = cycle.sections?.letterLearning?.cards?.length
    ? cycle.sections.letterLearning.cards
    : [...(cycle.focusLetters || []), ...(cycle.reviewLetters || [])];
  const hfw = cycle.highFrequencyWords || [];
  const paItems = cycle.sections.phonemicAwareness.practiceItems || [];
  const examples = letters.flatMap(card => card.examples || []);
  const baseItems = {
    "letter tracing": letters.map(card => `Trace ${card.grapheme}. Write ${card.spelling}. Say ${card.sound || card.grapheme}.`),
    "letter/sound matching": letters.map(card => `Match ${card.grapheme} to ${card.sound || card.spelling}.`),
    "circle the beginning sound": examples.map(word => `Circle the first sound in ${word}.`),
    "circle the ending sound": examples.map(word => `Circle the ending sound in ${word}.`),
    "rhyme match": (cycle.sections.rhyming.activities?.[0]?.items || []).map(pair => `Do these rhyme? ${pair[0]} / ${pair[1]}`),
    "cut-and-paste HFW": hfw.map(word => `Cut and paste ${word} into the sentence: I see ${word}.`),
    "read/write HFW": hfw.map(word => `Read ${word}. Trace it. Write it.`),
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
  return Array.from({ length: count }, (_, index) => source[index % source.length]);
}

function VisualBadge({ sectionId, label }) {
  const visual = SECTION_VISUALS[sectionId] || SECTION_VISUALS.overview;
  return (
    <span className={`learn-visual-badge ${visual.color}`} aria-hidden="true">
      {label || visual.icon}
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
    makeWorksheetItems(cycle, worksheetType, Number(itemCount) || 8),
  [cycle, worksheetType, itemCount]);

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
          <span>{difficulty} practice - {itemCount} items</span>
        </div>
        <ol>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>
              <span>{item}</span>
              {includePictures && <b className="worksheet-picture-box" aria-hidden="true"></b>}
              {includeHandwritingLines && <i className="handwriting-lines" aria-hidden="true"></i>}
            </li>
          ))}
        </ol>
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
  return (
    <article className={lessonMode ? "learn-letter-card lesson-card" : "learn-letter-card"}>
      <div className="learn-letter-tile" aria-label={`${card.grapheme} letter tile`}>
        <strong>{upper}</strong>
        <span>{displayLower}</span>
      </div>
      <div className="learn-letter-body">
        <span className="learn-sound-bubble">{card.sound || "review"}</span>
        <p>{card.childExplanation}</p>
        <small>{card.articulation}</small>
        <div className="learn-word-chip-row">
          {(card.examples || []).map(word => <b key={word}>{word}</b>)}
        </div>
        <div className="learn-formation-steps">
          {(card.formation || []).map((line, index) => (
            <p className="formation-line" key={line}><span>{index + 1}</span>{line}</p>
          ))}
        </div>
        <p className="teacher-script">{card.teacherScript}</p>
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

export function LearnAreaPage({ assessmentSummary = null }) {
  const recommendedCycle = getRecommendedElSkillsBlockCycle({ assessmentSummary });
  const [selectedCycleId, setSelectedCycleId] = useState(recommendedCycle?.id || "cycle-1");
  const [activeSection, setActiveSection] = useState("overview");
  const [lessonSectionIndex, setLessonSectionIndex] = useState(0);
  const [isLessonMode, setIsLessonMode] = useState(false);
  const [search, setSearch] = useState("");
  const cycle = getElSkillsBlockCycle(selectedCycleId);
  const filteredCycles = elSkillsBlockCycles.filter(item =>
    !search.trim() || item.searchText.includes(search.trim().toLowerCase()) || item.title.toLowerCase().includes(search.trim().toLowerCase())
  );
  const groupedCycles = getGroupedCycles(filteredCycles);
  const letterCards = cycle.sections.letterLearning.cards || [];
  const lessonSectionId = LESSON_SECTION_IDS[lessonSectionIndex] || "overview";
  const youtubeSearchUrl = makeYouTubeSearchUrl(cycle);

  useEffect(() => {
    if (!isLessonMode) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsLessonMode(false);
      }
      if (event.key === "ArrowRight") {
        setLessonSectionIndex(index => Math.min(index + 1, LESSON_SECTION_IDS.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setLessonSectionIndex(index => Math.max(index - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLessonMode]);

  function openCycle(id) {
    setSelectedCycleId(id);
    setActiveSection("overview");
    setLessonSectionIndex(0);
  }

  function openLesson(sectionId = activeSection) {
    const nextIndex = Math.max(0, LESSON_SECTION_IDS.indexOf(sectionId));
    setLessonSectionIndex(nextIndex);
    setIsLessonMode(true);
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
          <div className="learn-daily-flow">
            {cycle.dailyFlow.map(day => (
              <article key={`${day.day}-${day.focus}`}>
                <strong>{day.day}</strong>
                <span>{day.focus}</span>
                <small>{day.description || day.lessonType}</small>
              </article>
            ))}
          </div>
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
              <p>Move from formation to word writing and a shared sentence.</p>
            </div>
          </div>
          <div className="learn-writing-grid">
            {cycle.sections.writing.formationPractice.map((item, index) => <article key={item}><span>{index + 1}</span><p>{item}</p><i className="handwriting-lines" aria-hidden="true"></i></article>)}
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
              <p>Create printable cycle practice from the selected cycle content.</p>
            </div>
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
      </div>
    );
  }

  return (
    <main className="learn-area-page page-stack">
      {isLessonMode && (
        <section className="learn-fullscreen-mode" aria-label={`${cycle.title} full screen lesson`}>
          <header className="learn-fullscreen-header">
            <div>
              <p>{cycle.title} - {EL_LEARN_SECTION_LABELS[lessonSectionId]}</p>
              <h2>{cycle.title}</h2>
            </div>
            <div className="learn-fullscreen-actions">
              <span>{lessonSectionIndex + 1} of {LESSON_SECTION_IDS.length}</span>
              <button className="lp-button lp-button-secondary" onClick={() => setIsLessonMode(false)} type="button">
                Exit Learn Mode
              </button>
            </div>
          </header>
          <div className="learn-progress-strip" aria-label={`Cycle lesson progress ${lessonSectionIndex + 1} of ${LESSON_SECTION_IDS.length}`}>
            {LESSON_SECTION_IDS.map((sectionId, index) => (
              <button
                className={index === lessonSectionIndex ? "active" : ""}
                key={sectionId}
                onClick={() => setLessonSectionIndex(index)}
                type="button"
                aria-label={`${EL_LEARN_SECTION_LABELS[sectionId]} ${index + 1} of ${LESSON_SECTION_IDS.length}`}
              >
                <span></span>
              </button>
            ))}
          </div>
          <div className="learn-fullscreen-stage">
            {renderSection(lessonSectionId, { lessonMode: true })}
          </div>
          <footer className="learn-fullscreen-footer">
            <button
              className="lp-button lp-button-secondary"
              disabled={lessonSectionIndex === 0}
              onClick={() => setLessonSectionIndex(index => Math.max(index - 1, 0))}
              type="button"
            >
              Previous Section
            </button>
            <strong>{cycle.title} - {EL_LEARN_SECTION_LABELS[lessonSectionId]} - {lessonSectionIndex + 1} of {LESSON_SECTION_IDS.length}</strong>
            <button
              className="lp-button lp-button-primary"
              disabled={lessonSectionIndex === LESSON_SECTION_IDS.length - 1}
              onClick={() => setLessonSectionIndex(index => Math.min(index + 1, LESSON_SECTION_IDS.length - 1))}
              type="button"
            >
              Next Section
            </button>
          </footer>
        </section>
      )}

      <section className="card page-card learn-hero">
        <div className="learn-hero-copy">
          <p className="panel-label">Learn</p>
          <h2>EL Skills Block Learn</h2>
          <p>Choose a Kindergarten Skills Block cycle and open a bright, teacher-led lesson with printable practice.</p>
          <div className="learn-hero-actions">
            <button className="lp-button lp-button-primary" onClick={() => openLesson("overview")} type="button">
              Open Full Screen Lesson
            </button>
            <button className="lp-button lp-button-secondary" onClick={() => setActiveSection("worksheets")} type="button">
              Create Worksheet
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
                <button className="lp-button lp-button-primary" onClick={() => openLesson(activeSection)} type="button">
                  Start Learning
                </button>
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
