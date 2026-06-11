// Sleek gradient gem used for collectibles. Pure SVG - crisp at any size.
const GEM_COLORS = {
  teal: ["#14B8A6", "#0C6B65"],
  amber: ["#FBBF24", "#B45309"],
  violet: ["#A78BFA", "#6D28D9"],
  blue: ["#60A5FA", "#1D4ED8"],
  rose: ["#FB7185", "#BE123C"],
  emerald: ["#34D399", "#047857"]
};

export function Gem({ color = "teal", size = 44 }) {
  const [light, dark] = GEM_COLORS[color] || GEM_COLORS.teal;
  const id = `gem-${color}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d="M14 6h20l9 12-19 26L5 18 14 6Z" fill={`url(#${id})`} />
      <path d="M14 6h20l9 12H5l9-12Z" fill="rgba(255,255,255,0.18)" />
      <path d="M24 44 15 18h18L24 44Z" fill="rgba(255,255,255,0.10)" />
      <path d="M16.5 8.5h9L20 16h-8l4.5-7.5Z" fill={`url(#${id}-shine)`} opacity="0.7" />
    </svg>
  );
}
