import { useCallback, useEffect, useRef, useState } from 'react';
import Chapter from '../../../demos/sound-seekers/src/chapter/Chapter.jsx';
import { woodlandChapterStorageKey, localProgressStorageKeyForRow } from '../../utils/progressKeys.js';
import { queueProgressSave } from '../../utils/progressSync.js';
import { WOODLAND_PROGRESS_ROW, encodeWoodlandProgress } from './woodlandProgress.js';
import '../../../demos/sound-seekers/src/style.css';
import '../../../demos/sound-seekers/src/chapter/chapter.css';

export default function WoodlandChapter({ progressScopeKey, isSoundEnabled, onExit, accessibilitySettings, ephemeral }) {
  const [reset, setReset] = useState(0);
  const [cloudStatus, setCloudStatus] = useState('device');
  const lastQueued = useRef({ signature: '', at: 0 });
  const onProgress = useCallback(progress => {
    if (ephemeral) return;
    const signature = JSON.stringify([progress.jobs, progress.active, progress.mode, progress.fireflies, progress.settings, progress.resetEpoch, progress.lastAnsweredAt]);
    const now = Date.now();
    if (signature === lastQueued.current.signature && now - lastQueued.current.at < 10000) return;
    lastQueued.current = { signature, at: now };
    const packet = encodeWoodlandProgress(progress);
    try { window.localStorage.setItem(localProgressStorageKeyForRow('phonics_quest', WOODLAND_PROGRESS_ROW, progressScopeKey), JSON.stringify(packet)); }
    catch { /* the chapter already displays any local save failure */ }
    const queued = queueProgressSave('phonics_quest', WOODLAND_PROGRESS_ROW, packet, { scopeKey: progressScopeKey });
    if (queued) setCloudStatus('saving');
  }, [ephemeral, progressScopeKey]);
  useEffect(() => {
    const onHydrated = event => {
      if (event.detail?.studentId === progressScopeKey && (event.detail.resetApplied || event.detail.rows?.some(row => row.area === 'phonics_quest' && row.key === WOODLAND_PROGRESS_ROW))) {
        setReset(value => value + 1);
      }
    };
    const onSynced = event => {
      const detail = event.detail;
      if (detail?.studentId !== progressScopeKey || detail.area !== 'phonics_quest' || detail.key !== WOODLAND_PROGRESS_ROW) return;
      setCloudStatus(['saved', 'recovered'].includes(detail.status) ? 'saved' : detail.status === 'saving' ? 'saving' : 'device');
    };
    window.addEventListener('lp-progress-hydrated', onHydrated);
    window.addEventListener('lp-progress-sync-state', onSynced);
    return () => { window.removeEventListener('lp-progress-hydrated', onHydrated); window.removeEventListener('lp-progress-sync-state', onSynced); };
  }, [progressScopeKey]);
  return <Chapter
    key={reset}
    storageKey={woodlandChapterStorageKey(progressScopeKey)}
    childSurface="sound-seekers"
    ephemeral={ephemeral}
    onProgress={onProgress}
    cloudStatus={cloudStatus}
    onExit={onExit}
    initialSettings={{
      muted: !isSoundEnabled,
      reduced: accessibilitySettings.reducedMotion === true,
      low: accessibilitySettings.simplifiedScene === true,
    }}
  />;
}
