import { memo } from 'react';

interface CloudDecorationProps {
  className?: string;
  style?: React.CSSProperties;
}

const CloudDecoration = memo(function CloudDecoration({ className = '', style }: CloudDecorationProps) {
  return (
    <svg
      viewBox="0 0 200 120"
      className={className}
      style={style}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="60" cy="70" rx="50" ry="35" />
      <ellipse cx="110" cy="60" rx="55" ry="40" />
      <ellipse cx="150" cy="75" rx="45" ry="30" />
      <ellipse cx="90" cy="50" rx="40" ry="35" />
    </svg>
  );
});

export default CloudDecoration;
