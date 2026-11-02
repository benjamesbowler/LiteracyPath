import { useEffect, useRef } from 'react';
import { isMediaQaRuntimeAllowed } from '../../data/mediaQaManifest.js';
import { withRepairedImageVersion } from '../../utils/repairedImageVersion.js';
import '../../styles/literacy-mock-image.css';

/** Display a whole authored object from the original, unmodified 6 × 4 atlas. */
export function LiteracyMockImage({ src, mediaSource, alt = '', className = '', onLoad, onError, role = 'stimulus' }) {
  // Historical snapshots and retained offline blobs keep their original image
  // paths. Apply today's shared quarantine before displaying either source.
  const blocked = !isMediaQaRuntimeAllowed((src || '').split(/[?#]/)[0], 'image');
  const errorHandler = useRef(onError);
  const reportedSource = useRef(null);
  useEffect(() => { errorHandler.current = onError; }, [onError]);
  useEffect(() => {
    if (!blocked) { reportedSource.current = null; return; }
    if (reportedSource.current === src) return;
    reportedSource.current = src;
    errorHandler.current?.();
  }, [blocked, src]);
  // The existing parent onError path invalidates the whole item without an
  // answer or progress increment; do not turn missing evidence into text.
  if (blocked) return null;
  const match = /^\/images\/assessment\/literacy-mock\/object-atlas-v1\.webp#mock-cell=(\d+)$/.exec(src || '');
  const cell = match ? Number(match[1]) : -1;
  if (cell < 0 || cell > 22) return <img src={mediaSource || withRepairedImageVersion(src)} alt={alt} className={className} onLoad={onLoad} onError={onError} data-assessment-media-kind="evidence" data-assessment-media-role={role}/>;
  return <span className={`literacy-mock-art ${className}`} data-mock-image-cell={cell}>
    <img src={mediaSource || src.split('#')[0]} alt={alt} onLoad={onLoad} onError={onError} data-assessment-media-kind="evidence" data-assessment-media-role={role}
      style={{ position: 'absolute', width: '600%', height: '400%', maxWidth: 'none', maxHeight: 'none', left: `${-(cell % 6) * 100}%`, top: `${-Math.floor(cell / 6) * 100}%`, objectFit: 'fill', borderRadius: 0 }}/>
  </span>;
}
