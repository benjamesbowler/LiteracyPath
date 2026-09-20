import ActivityButton from '../ActivityButton.jsx';
import './woodland-activity.css';

/** Shared presentation only. Each activity continues to own its learning rules. */
export function WoodlandIcon({ name = 'sound', size = 24 }) {
  const shapes = {
    sound: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8q6 4 0 8M18 4q10 8 0 16"/></>,
    back: <path d="M20 12H5m6-6-6 6 6 6"/>,
    pause: <path d="M8 5v14M16 5v14"/>,
    play: <path d="m8 4 12 8-12 8Z"/>,
    leaf: <><path d="M20 3C7 1 0 11 7 18 14 25 22 16 20 3Z"/><path d="M4 21 16 8"/></>,
    check: <path d="m4 12 5 5L20 6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name] || shapes.leaf}</svg>;
}

export function WoodlandAudioButton({ children = 'Listen', label = 'Hear the instructions again', className = '', ...props }) {
  return <ActivityButton type="button" className={`wa-audio ${className}`} aria-label={label} {...props}>
    <WoodlandIcon /><span>{children}</span>
  </ActivityButton>;
}

export function WoodlandProgress({ current = 0, total = 1, label = 'Activity progress', className = '' }) {
  const count = Math.max(1, Number(total) || 1);
  const completed = Math.min(count, Math.max(0, Number(current) || 0));
  return <div className={`wa-progress ${className}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={count} aria-valuenow={completed}>
    <span style={{ transform: `scaleX(${completed / count})` }} />
  </div>;
}
