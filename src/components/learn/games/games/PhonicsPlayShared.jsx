import { useState } from 'react';
import { CAST, HEROES } from '../../../../features/soundSeekers/v3/content/cast.js';
import { getChildWordAsset } from '../../../../data/childAssets.js';
import { hasRecordedSpeech, speak } from '../../../../utils/learnGamesAudio.js';
import './phonics-play.css';


export function WordPicture({ word, label, className = '', secret = false }) {
  const asset = getChildWordAsset(word);
  const [failed, setFailed] = useState([]);
  const src = [asset?.image, asset?.fallbackImage].find(candidate => candidate && !failed.includes(candidate));
  if (!src) return secret ? null : <span className={`pp-picture-fallback ${className}`}>{word}</span>;
  return <img className={`pp-word-picture ${className}`} src={src} alt={secret ? '' : label || asset.alt || word} draggable="false" onError={() => setFailed(previous => [...new Set([...previous, src])])} />;
}

export function PlayHero({ difficulty = 'easy', className = '', style }) {
  const land = difficulty === 'hard' ? 'moonwood' : difficulty === 'medium' ? 'dino' : 'meadow';
  const hero = CAST[HEROES.find(item => item.land === land).id];
  return <img className={`pp-hero ${className}`} src={hero.heroSprite} alt={hero.name} style={style} draggable="false" />;
}

export function PhonicsPlayScene({ mode, children, prompt, cue, isSoundEnabled, progress, total, discovered = [], paused = false, className = '', tools, onReplay, canHearCue }) {
  const canHear = canHearCue ?? (isSoundEnabled && cue && hasRecordedSpeech(cue));
  return <section className={`pp-play pp-${mode} ${className}${paused ? ' pp-paused' : ''}`} data-phonics-mode={mode} aria-label={`${mode} game`}>
    <div className="pp-world-backdrop" aria-hidden="true" />
    <header className="pp-hud">
      <span className="pp-prompt">{prompt}</span>
      <span className="pp-progress" aria-label={`${progress} of ${total} completed`}>{progress}/{total}</span>
      {canHear && <button type="button" className="pp-replay" aria-label="Hear target" onClick={onReplay || (() => void speak(cue))}>♪</button>}
      {tools}
    </header>
    {children}
    {(mode === 'memory' || discovered.length > 0) && <div className="pp-collection" aria-label="Your completed creations">
      {discovered.map(item => <span key={item.id} className="pp-collected" title={item.word || item.sentence}>
        {item.word ? <WordPicture word={item.word} /> : <span aria-hidden="true">✓</span>}
        <small>{item.word || item.sentence}</small>
      </span>)}
    </div>}
  </section>;
}
