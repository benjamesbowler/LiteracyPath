import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import './arcadeGuideDemo.css';

export default function ArcadeGuideDemo({ game, example }) {
  const reducedMotion = useReducedMotion();
  const [frame, setFrame] = useState(2);
  const [replay, setReplay] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setTimeout(() => {
      if (frame === 2) setPlaying(false);
      else setFrame(value => value + 1);
    }, example.frameMilliseconds || (reducedMotion ? 1400 : 1000));
    return () => window.clearTimeout(timer);
  }, [frame, playing, reducedMotion, replay, example.frameMilliseconds]);
  const matchedIndex = Number.isInteger(example.matchedIndex) ? example.matchedIndex : game.id === 'word-climb' ? 1 : game.id === 'rhyme-pop' && frame === 2 ? 2 : 0;
  const ordered = ['letter-leap', 'word-bridge', 'sound-beat', 'sound-safari', 'sentence-express', 'grammar-grind', 'soundkeys'].includes(game.id);
  return <section className="lg-action-demo" aria-label={`${game.title} example`} data-demo-kind={example.kind} data-demo-frame={frame}>
    <div className="lg-action-demo-picture" aria-hidden="true">
      <strong className="lg-action-demo-target">{example.target}</strong>
      <div className="lg-action-demo-pieces">{example.pieces.map((piece, index) => <span className={frame > 0 && (ordered ? frame === 2 || index === 0 : index === matchedIndex || game.id === 'rhyme-pop' && frame === 2 && index === 0) ? 'is-matched' : ''} key={`${index}-${piece}`}>{piece}</span>)}</div>
      <div className={`lg-action-demo-actor ${playing && !reducedMotion ? 'is-moving' : ''}`} key={replay}><img src={game.icon} alt="" /><span>{({ steer: '← →', jump: '→ ↑', climb: '↑ ↗', place: '→ ↓', beat: '● ● ●', aim: '↗', catch: '→ ↓', choose: '↓' })[example.kind]}</span></div>
    </div>
    <p role="status" aria-live="polite">{example.steps[frame]}</p>
    <button type="button" onClick={() => { setFrame(0); setReplay(value => value + 1); setPlaying(true); }}>Show me</button>
  </section>;
}
