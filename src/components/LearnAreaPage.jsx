import { useMemo, useState } from "react";
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

function listText(values = [], fallback = "None listed") {
  return values.length ? values.join(", ") : fallback;
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

function WorksheetGenerator({ cycle }) {
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
    <div className="worksheet-generator">
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
          <span>{difficulty} practice · {itemCount} items</span>
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

function LetterCard({ card }) {
  return (
    <article className="learn-letter-card">
      <strong>{card.grapheme}</strong>
      <span>{card.sound || "review"}</span>
      <p>{card.childExplanation}</p>
      <small>{card.articulation}</small>
      <ul>
        {(card.examples || []).map(word => <li key={word}>{word}</li>)}
      </ul>
      {(card.formation || []).map(line => <p className="formation-line" key={line}>{line}</p>)}
      <p className="teacher-script">{card.teacherScript}</p>
    </article>
  );
}

export function LearnAreaPage({ assessmentSummary = null }) {
  const recommendedCycle = getRecommendedElSkillsBlockCycle({ assessmentSummary });
  const [selectedCycleId, setSelectedCycleId] = useState(recommendedCycle?.id || "cycle-1");
  const [activeSection, setActiveSection] = useState("overview");
  const [search, setSearch] = useState("");
  const cycle = getElSkillsBlockCycle(selectedCycleId);
  const filteredCycles = elSkillsBlockCycles.filter(item =>
    !search.trim() || item.searchText.includes(search.trim().toLowerCase()) || item.title.toLowerCase().includes(search.trim().toLowerCase())
  );
  const letterCards = cycle.sections.letterLearning.cards || [];

  function openCycle(id) {
    setSelectedCycleId(id);
    setActiveSection("overview");
  }

  return (
    <main className="learn-area-page page-stack">
      <section className="card page-card learn-hero">
        <div>
          <p className="panel-label">Learn</p>
          <h2>EL Skills Block Learn</h2>
          <p>Choose a Kindergarten Skills Block cycle. Dates are intentionally left out; the learning sequence is organized by cycle.</p>
        </div>
        <div className="learn-recommendation">
          <span>Recommended cycle</span>
          <strong>{recommendedCycle?.title || "Cycle 1"}</strong>
          <small>{assessmentSummary?.attempts ? "Based on saved class/student assessment evidence." : "Start here until progress data recommends a review cycle."}</small>
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
          <aside className="learn-cycle-grid" aria-label="EL Skills Block cycles">
            {filteredCycles.map(item => (
              <button
                className={item.id === selectedCycleId ? "learn-cycle-card active" : "learn-cycle-card"}
                key={item.id}
                onClick={() => openCycle(item.id)}
                type="button"
              >
                <span>{item.title}</span>
                <strong>{item.focusLetters.concat(item.reviewLetters).map(card => `${card.grapheme} ${card.sound || ""}`.trim()).slice(0, 4).join(", ") || item.phase}</strong>
                <small>HFW: {listText(item.highFrequencyWords)}</small>
                <small>{item.phonemicAwareness[0] || "Benchmark / review"}</small>
                <em>{item.friday}</em>
              </button>
            ))}
          </aside>

          <section className="learn-cycle-detail">
            <div className="learn-cycle-header">
              <div>
                <p className="panel-label">EL Skills Block</p>
                <h3>{cycle.title}</h3>
                <p>{cycle.phase.replace(/-/g, " ")} · {cycle.friday}</p>
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

            <nav className="learn-section-tabs" aria-label="Cycle sections">
              {EL_LEARN_SECTION_IDS.map(sectionId => (
                <button
                  className={activeSection === sectionId ? "active" : ""}
                  key={sectionId}
                  onClick={() => setActiveSection(sectionId)}
                  type="button"
                >
                  {EL_LEARN_SECTION_LABELS[sectionId]}
                </button>
              ))}
            </nav>

            {activeSection === "overview" && (
              <div className="learn-section-panel">
                <h4>Cycle Overview</h4>
                <div className="learn-overview-grid">
                  <article><strong>Letters / Sounds</strong><p>{listText(cycle.focusLetters.concat(cycle.reviewLetters).map(card => `${card.grapheme} ${card.sound || ""}`.trim()))}</p></article>
                  <article><strong>High-Frequency Words</strong><p>{listText(cycle.highFrequencyWords)}</p></article>
                  <article><strong>Phonemic Awareness</strong><p>{listText(cycle.phonemicAwareness)}</p></article>
                  <article><strong>Routines</strong><p>{listText(cycle.routines)}</p></article>
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
            )}

            {activeSection === "letterLearning" && (
              <div className="learn-section-panel">
                <h4>Letter & Sound Learning</h4>
                {letterCards.length ? <div className="learn-letter-grid">{letterCards.map(card => <LetterCard card={card} key={`${card.grapheme}-${card.spelling}`} />)}</div> : <p>No new letter cards. Use this cycle for review, benchmark evidence, and small-group planning.</p>}
              </div>
            )}

            {activeSection === "poemAndChant" && (
              <div className="learn-section-panel">
                <h4>{cycle.sections.poemAndChant.title}</h4>
                <p>{cycle.sections.poemAndChant.rhythm}</p>
                <div className="learn-poem">
                  {cycle.sections.poemAndChant.lines.map(line => <p key={line}>{line}</p>)}
                </div>
                <h5>Call and Response</h5>
                {cycle.sections.poemAndChant.callAndResponse.map(item => <p key={item.teacher}><strong>Teacher:</strong> {item.teacher} <br /><strong>Students:</strong> {item.students}</p>)}
              </div>
            )}

            {activeSection === "phonemicAwareness" && (
              <div className="learn-section-panel">
                <h4>Phonemic Awareness</h4>
                <p>{cycle.sections.phonemicAwareness.teacherWording}</p>
                <div className="learn-practice-list">
                  {cycle.sections.phonemicAwareness.practiceItems.map(item => <article key={item.prompt}><span>{item.prompt}</span><strong>{item.answer}</strong></article>)}
                </div>
                <p><strong>Support:</strong> {cycle.sections.phonemicAwareness.supportPrompt}</p>
                <p><strong>Challenge:</strong> {cycle.sections.phonemicAwareness.challengePrompt}</p>
              </div>
            )}

            {activeSection === "rhyming" && (
              <div className="learn-section-panel">
                <h4>Rhyming / Word Play</h4>
                <p>{cycle.sections.rhyming.focus}</p>
                {cycle.sections.rhyming.activities.map(activity => (
                  <article className="learn-activity-card" key={activity.name}>
                    <strong>{activity.name}</strong>
                    <p>{activity.teacherWording}</p>
                    <ul>{activity.items.map(pair => <li key={pair.join("-")}>{pair.join(" / ")}</li>)}</ul>
                  </article>
                ))}
              </div>
            )}

            {activeSection === "highFrequencyWords" && (
              <div className="learn-section-panel">
                <h4>High-Frequency Words</h4>
                {cycle.sections.highFrequencyWords.cards.length ? <div className="hfw-learn-grid">{cycle.sections.highFrequencyWords.cards.map(card => (
                  <article key={card.word}>
                    <strong>{card.word}</strong>
                    <span>{card.spellIt}</span>
                    <p>{card.sentence}</p>
                    <small>{card.practice}</small>
                  </article>
                ))}</div> : <p>No new HFW for this benchmark/review entry.</p>}
              </div>
            )}

            {activeSection === "decoding" && (
              <div className="learn-section-panel">
                <h4>Decoding / Chaining</h4>
                <p>{cycle.sections.decoding.note}</p>
                <div className="learn-practice-list">
                  {cycle.sections.decoding.chains.map(chain => <article key={chain.start}><strong>{chain.start}</strong><span>{chain.steps.join(" → ")}</span></article>)}
                </div>
              </div>
            )}

            {activeSection === "writing" && (
              <div className="learn-section-panel">
                <h4>Writing / Encoding Practice</h4>
                <ul>
                  {cycle.sections.writing.formationPractice.map(item => <li key={item}>{item}</li>)}
                  {cycle.sections.writing.wordWriting.map(item => <li key={item}>{item}</li>)}
                  <li>Sentence frame: {cycle.sections.writing.sentenceFrame}</li>
                  <li>Interactive writing: {cycle.sections.writing.interactiveWritingPrompt}</li>
                </ul>
              </div>
            )}

            {activeSection === "worksheets" && (
              <div className="learn-section-panel">
                <h4>Worksheet Generator</h4>
                <WorksheetGenerator cycle={cycle} />
              </div>
            )}

            {activeSection === "teacherNotes" && (
              <div className="learn-section-panel">
                <h4>Teacher Notes / Differentiation</h4>
                <div className="learn-overview-grid">
                  <article><strong>Small Group Support</strong><ul>{cycle.sections.teacherNotes.supportIdeas.map(item => <li key={item}>{item}</li>)}</ul></article>
                  <article><strong>Extension</strong><ul>{cycle.sections.teacherNotes.extensionIdeas.map(item => <li key={item}>{item}</li>)}</ul></article>
                  <article><strong>Reteach</strong><ul>{cycle.sections.teacherNotes.reteachSuggestions.map(item => <li key={item}>{item}</li>)}</ul></article>
                  <article><strong>Progress Link</strong><p>{cycle.sections.teacherNotes.progressConnection}</p></article>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
