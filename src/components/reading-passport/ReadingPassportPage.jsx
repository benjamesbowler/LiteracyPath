import { useMemo, useState } from "react";
import { buildReadingPassport, readReadingPassportProgress, READING_PASSPORT_REFLECTIONS, savePassportReflection } from "../../policy/readingPassportPolicy.js";
import { localProgressStorageKey } from "../../utils/progressKeys.js";
import { queueProgressSave } from "../../utils/progressSync.js";
import "../../styles/reading-passport.css";

export function ReadingPassportPage({ books, records, scopeKey, onClose }) {
  const passport = useMemo(() => buildReadingPassport({ books, records }), [books, records]);
  const [progress, setProgress] = useState(() => readReadingPassportProgress(scopeKey));

  function reflect(bookId, bookTitle, reflectionId) {
    const next = savePassportReflection(progress, { bookId, bookTitle, reflectionId });
    setProgress(next);
    try { window.localStorage.setItem(localProgressStorageKey("reading_passport", scopeKey), JSON.stringify(next)); } catch { /* cloud queue remains recoverable */ }
    queueProgressSave("reading_passport", "__all__", next, { scopeKey });
  }

  return <main className="reading-passport" aria-labelledby="reading-passport-title">
    <header><div><p>My reading journey</p><h1 id="reading-passport-title">Reading Passport</h1><span>Finished books appear here automatically. This is your collection, not a race or leaderboard.</span></div><button type="button" onClick={onClose}>Back to books</button></header>
    {passport.discoveries.length > 0 && <section className="passport-discoveries" aria-labelledby="passport-discoveries-title"><h2 id="passport-discoveries-title">Things you have discovered</h2><ul>{passport.discoveries.map(item => <li key={item.id}>✓ {item.label}</li>)}</ul></section>}
    {passport.stamps.length === 0 ? <section className="passport-empty"><h2>Your first stamp is waiting</h2><p>Finish a book and it will appear here. You never need to take a photo or record your voice.</p></section>
      : <section className="passport-stamps" aria-labelledby="passport-stamps-title"><h2 id="passport-stamps-title">Book stamps</h2><div>{passport.stamps.map(stamp => {const selected=progress.reflections[stamp.bookId]?.reflectionId;return <article key={stamp.bookId}><div className="passport-stamp-mark" aria-hidden="true">BOOK<br/>✓</div><div><span>{stamp.type} · Level {stamp.level}</span><h3>{stamp.title}</h3>{stamp.completedAt&&<small>Finished {new Date(stamp.completedAt).toLocaleDateString()}</small>}{stamp.buddyTurns>0&&<small>Read with Leda · {stamp.buddyTurns} turns</small>}<fieldset><legend>What do you remember?</legend>{READING_PASSPORT_REFLECTIONS.map(reflection=><button key={reflection.id} type="button" aria-pressed={selected===reflection.id} className={selected===reflection.id?"is-selected":""} onClick={()=>reflect(stamp.bookId,stamp.title,reflection.id)}>{reflection.label}</button>)}</fieldset></div></article>})}</div></section>}
  </main>;
}
