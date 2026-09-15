import { useEffect, useState } from 'react';
import Chapter from '../../../demos/sound-seekers/src/chapter/Chapter.jsx';
import { woodlandChapterStorageKey } from '../../utils/progressKeys.js';
import '../../../demos/sound-seekers/src/style.css';
import '../../../demos/sound-seekers/src/chapter/chapter.css';

export default function WoodlandChapter({ progressScopeKey, isSoundEnabled, onExit, accessibilitySettings, ephemeral }) {
  const [reset, setReset] = useState(0);
  useEffect(() => {
    const onHydrated = event => {
      if (event.detail?.studentId === progressScopeKey && event.detail.resetApplied) {
        setReset(value => value + 1);
      }
    };
    window.addEventListener('lp-progress-hydrated', onHydrated);
    return () => window.removeEventListener('lp-progress-hydrated', onHydrated);
  }, [progressScopeKey]);
  return <Chapter
    key={reset}
    storageKey={woodlandChapterStorageKey(progressScopeKey)}
    childSurface="sound-seekers"
    ephemeral={ephemeral}
    onExit={onExit}
    initialSettings={{
      muted: !isSoundEnabled,
      reduced: accessibilitySettings.reducedMotion === true,
      low: accessibilitySettings.simplifiedScene === true,
    }}
  />;
}
