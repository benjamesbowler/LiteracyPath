import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import LanternLagoonGame from '../../src/components/learn/games/games/LanternLagoonGame.jsx';
import '@fontsource/lexend/400.css';
import '@fontsource/lexend/700.css';
import '@fontsource/andika/latin-700.css';

const params = new URLSearchParams(location.search);
const sheet = document.createElement('style');
sheet.textContent = 'html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}body{font-family:Lexend,system-ui,sans-serif}.fixture-shell{height:100%;display:grid;grid-template-rows:60px minmax(0,1fr)}.fixture-head{display:flex;gap:8px;align-items:center;padding:2px 8px;background:#fff}.fixture-head button{width:56px;height:56px;border:1px solid #abc;border-radius:10px;background:#fff;font:inherit}.fixture-head h1{font-size:16px;flex:1;margin:0}.fixture-main{min-height:0;overflow:hidden}';
document.head.append(sheet);
function Harness() {
  const [run, setRun] = useState(0);
  const [muted, setMuted] = useState(params.get('sound') === 'off');
  window.__lanternReceipts ||= []; window.__lanternCheckpoints ||= [];
  return <div className="fixture-shell"><div className="fixture-head"><h1>Lantern Lagoon</h1><button type="button" onClick={() => window.__lanternEngine?.pause()} aria-label="Pause game">Ⅱ</button><button type="button" onClick={() => window.__lanternEngine?.resume()} aria-label="Resume game">▶</button><button type="button" onClick={() => setMuted(!muted)} aria-label="Toggle sound">♪</button></div>
    <div className="fixture-main"><LanternLagoonGame key={run} difficulty={params.get('difficulty') || 'easy'} mode={params.get('mode') || 'reading'} taughtCycle={params.has('cycle') ? Number(params.get('cycle')) : null}
      startLevel={Number(params.get('start')) || 0} resumedCheckpoint={params.get('resumed') === 'true'} sessionSeed={Number(params.get('seed')) || 19} journey={{ index: Number(params.get('journey')) || 0 }}
      progressScopeKey="lantern-test-child" isSoundEnabled={!muted} onEngineReady={api => { window.__lanternEngine = api; }}
      onCheckpoint={(level, total) => window.__lanternCheckpoints.push({ level, total })}
      onResultReady={(...receipt) => window.__lanternEarly = receipt}
      onComplete={(...receipt) => { window.__lanternReceipts.push(receipt); }}
      onRequestReplay={() => setRun(run + 1)} onRequestNextLevel={() => setRun(run + 1)} onExit={() => { document.documentElement.dataset.exited = 'games'; }} />
    </div></div>;
}
createRoot(document.getElementById('root')).render(<Harness />);
