// Pop-art currency icons. The 🪙 emoji renders as a dull grey ball at chip
// size, so coins get a real gold SVG (black outline, star emboss) and berries
// a matching cluster. Inline SVG = zero image requests, crisp at any size.

export function CoinIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10.5" fill="#F5A623" stroke="#101820" strokeWidth="2" />
      <circle cx="12" cy="12" r="7" fill="#FFC93C" stroke="#B8741A" strokeWidth="1.2" />
      <path
        d="M12 7.6l1.25 2.53 2.8.4-2.03 1.98.48 2.79L12 13.98l-2.5 1.32.48-2.79-2.03-1.98 2.8-.4L12 7.6z"
        fill="#B8741A"
      />
      <path d="M7 6.2a8 8 0 0 1 4-2" fill="none" stroke="#FFE9A0" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function BerryIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="9" cy="14" r="6" fill="#7A5FD0" stroke="#101820" strokeWidth="2" />
      <circle cx="16" cy="12" r="5" fill="#5B4B8A" stroke="#101820" strokeWidth="2" />
      <circle cx="7.5" cy="12.5" r="1.4" fill="#CBBCF2" />
      <path d="M14 7.5c.4-2 1.8-3.2 3.6-3.5" fill="none" stroke="#3E8948" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 7.5c-1.6-.5-2.4-1.5-2.6-2.8 1.9-.3 3.3.7 3.8 2.4z" fill="#4FA55B" stroke="#101820" strokeWidth="1.2" />
    </svg>
  );
}
