import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { GameArcadeHub } from '../../src/components/learn/games/GameArcadeHub.jsx';
import '../../src/index.css';
import '../../src/App.css';

export function mountSavedArcade() {
  createRoot(document.getElementById('root')).render(createElement(GameArcadeHub, { progressScopeKey: 'music-test' }));
}
