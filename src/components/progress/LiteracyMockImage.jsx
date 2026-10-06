import '../../styles/literacy-mock-image.css';

/** Display a whole authored object from the original, unmodified 6 × 4 atlas. */
export function LiteracyMockImage({ src, alt = '', className = '', onLoad, onError, role = 'stimulus' }) {
  const match = /^\/images\/assessment\/literacy-mock\/object-atlas-v1\.webp#mock-cell=(\d+)$/.exec(src || '');
  const cell = match ? Number(match[1]) : -1;
  if (cell < 0 || cell > 22) return <img src={src} alt={alt} className={className} onLoad={onLoad} onError={onError} data-assessment-media-kind="evidence" data-assessment-media-role={role}/>;
  return <span className={`literacy-mock-art ${className}`} data-mock-image-cell={cell}>
    <img src={src.split('#')[0]} alt={alt} onLoad={onLoad} onError={onError} data-assessment-media-kind="evidence" data-assessment-media-role={role}
      style={{ position: 'absolute', width: '600%', height: '400%', maxWidth: 'none', maxHeight: 'none', left: `${-(cell % 6) * 100}%`, top: `${-Math.floor(cell / 6) * 100}%`, objectFit: 'fill', borderRadius: 0 }}/>
  </span>;
}
