import { useLayoutEffect, useRef, useState } from "react";
import ChildPageControls from "../ChildPageControls.jsx";
import { HopAndStopLibraryCard } from "../action-songs/HopAndStopLibraryCard.jsx";
import { APP_READING_LEVELS, APP_READING_LEVEL_DESCRIPTIONS } from "../../utils/guidedReading/bookLevelMetadata.js";
import { appReadingLevelLabel } from "../../utils/guidedReading/bookTextAnalysis.js";

const MODES = [
  ["for-you", "Books for you"], ["all", "All books"],
  ["read-again", "Read again"], ["together", "Read together"]
];

function BookFilter({ label, value, onChange, children }) {
  return <label>{label}<select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{children}</select></label>;
}

export default function ChildBookDiscovery({
  onClose, shelfMode, onMode, bookType, onType, collectionId, collections, onCollection,
  knowledgeJourneyId, knowledgeJourneys, onJourney, appReadingLevel, availableAppLevels,
  onLevel, search, onSearch, onReset, resultCount, onCycleShorts, onStoryQuests, onActionSong
}) {
  const dialog = useRef(null);
  const returnControl = useRef(null);
  const [view, setView] = useState("filters");
  const [guidePage, setGuidePage] = useState(0);
  const hasMoreReading = onCycleShorts || onStoryQuests || onActionSong;
  const hasFilters = shelfMode !== "all" || bookType !== "all" || collectionId !== "all"
    || Boolean(knowledgeJourneyId) || appReadingLevel !== "all" || Boolean(search);

  useLayoutEffect(() => { dialog.current.showModal(); }, []);

  function openView(viewName) {
    setView(viewName);
    requestAnimationFrame(() => returnControl.current?.focus({ preventScroll: true }));
  }

  return <dialog className="kg-glass kg-book-discovery" id="kg-book-discovery" aria-label="Find a book" data-view={view}
    ref={dialog} onCancel={event => {
      event.preventDefault();
      if (view === "filters") onClose();
      else openView("filters");
    }}>
    <header className="kg-book-discovery-head">
      <h2>{({ filters: "Find a book", search: "Find by title", guide: "About App levels A–H", reading: "More reading" })[view]}</h2>
      <button ref={returnControl} type="button" className="kg-button kg-glass" onClick={view === "filters" ? onClose : () => openView("filters")}>
        {view === "filters" ? "Back to shelf" : "Back to filters"}
      </button>
    </header>
    {view === "filters" && <>
      <div className="kg-book-discovery-modes" role="group" aria-label="Choose books">
        {MODES.map(([id, label]) => <button key={id} type="button" aria-pressed={shelfMode === id} onClick={() => onMode(id)}>{label}</button>)}
      </div>
      <div className="kg-book-discovery-filters" role="group" aria-label="Book filters">
        <BookFilter label="Stories or facts" value={bookType} onChange={onType}>
          <option value="all">Both</option><option value="fiction">Stories</option><option value="nonfiction">Facts</option>
        </BookFilter>
        <BookFilter label="Friends or topic" value={collectionId} onChange={onCollection}>
          <option value="all">All topics</option>
          {collections.map(collection => <option key={collection.id} value={collection.id}>{collection.label}</option>)}
        </BookFilter>
        <BookFilter label="Book level" value={appReadingLevel} onChange={onLevel}>
          <option value="all">All levels</option>
          {availableAppLevels.map(level => <option key={level} value={level}>{appReadingLevelLabel(level)}</option>)}
        </BookFilter>
        {knowledgeJourneys.length > 0 && <BookFilter label="Explore an idea" value={knowledgeJourneyId} onChange={onJourney}>
          <option value="">All ideas</option>
          {knowledgeJourneys.map(journey => <option key={journey.id} value={journey.id}>{journey.title}</option>)}
        </BookFilter>}
      </div>
      <nav className="kg-book-discovery-links" aria-label="Other book tools">
        <button type="button" onClick={() => openView("search")}>Find by title</button>
        <button type="button" onClick={() => { setGuidePage(0); openView("guide"); }}>About App levels A–H</button>
        {hasMoreReading && <button type="button" onClick={() => openView("reading")}>More reading</button>}
        {hasFilters && <button type="button" onClick={onReset}>Clear filters</button>}
      </nav>
    </>}
    {view === "search" && <form className="kg-book-title-search" onSubmit={event => { event.preventDefault(); onClose(); }}>
      <label>Book title<input type="search" value={search} onChange={event => onSearch(event.target.value)} placeholder="Type part of the title" /></label>
      <button type="submit" className="kg-button kg-glass-accent">See {resultCount} {resultCount === 1 ? "book" : "books"}</button>
    </form>}
    {view === "guide" && <div className="kg-book-discovery-guide">
      {guidePage === 0 ? <>
        <p>App levels describe the language and ideas in a book.</p>
        <p>A decodable book needs the right phonics knowledge. You can read together at any level.</p>
      </> : <dl>{APP_READING_LEVELS.slice((guidePage - 1) * 2, guidePage * 2).map(level => <div key={level}>
        <dt>{appReadingLevelLabel(level)}</dt><dd>{APP_READING_LEVEL_DESCRIPTIONS[level]}</dd>
      </div>)}</dl>}
      <ChildPageControls label="Book level guide pages" pageIndex={guidePage} pageCount={1 + Math.ceil(APP_READING_LEVELS.length / 2)} onPageChange={setGuidePage} />
    </div>}
    {view === "reading" && <div className="kg-book-discovery-reading" aria-label="More reading activities">
      {onCycleShorts && <button type="button" onClick={onCycleShorts}>Cycle Shorts</button>}
      {onStoryQuests && <button type="button" onClick={onStoryQuests}>Choose what happens in a story</button>}
      {onActionSong && <HopAndStopLibraryCard onOpen={onActionSong} />}
    </div>}
  </dialog>;
}
