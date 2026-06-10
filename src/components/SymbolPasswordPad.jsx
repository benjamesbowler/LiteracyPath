import {
  SYMBOL_PASSWORD_ICONS,
  SYMBOL_PASSWORD_LENGTH,
  normalizeSymbolSequence,
  symbolIconByDigit
} from "../data/symbolPasswordIcons.js";

function SymbolIcon({ id, accent = "#0C6B65", size = 56 }) {
  const common = { stroke: accent, strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

  return (
    <svg aria-hidden="true" className="symbol-password-svg" height={size} viewBox="0 0 64 64" width={size}>
      {id === "cat" && (
        <>
          <path d="M16 28 L18 13 L29 23" {...common} />
          <path d="M48 28 L46 13 L35 23" {...common} />
          <circle cx="32" cy="34" r="18" fill={`${accent}18`} stroke={accent} strokeWidth="4" />
          <circle cx="25" cy="33" r="2.5" fill={accent} />
          <circle cx="39" cy="33" r="2.5" fill={accent} />
          <path d="M32 38 v5 M26 43 q6 5 12 0" {...common} />
        </>
      )}
      {id === "dog" && (
        <>
          <circle cx="32" cy="34" r="18" fill={`${accent}18`} stroke={accent} strokeWidth="4" />
          <path d="M16 28 q-8 8 -2 18 M48 28 q8 8 2 18" {...common} />
          <circle cx="25" cy="33" r="2.5" fill={accent} />
          <circle cx="39" cy="33" r="2.5" fill={accent} />
          <path d="M29 41 q3 3 6 0" {...common} />
        </>
      )}
      {id === "fish" && (
        <>
          <path d="M12 32 q18 -18 38 0 q-20 18 -38 0Z" fill={`${accent}18`} stroke={accent} strokeWidth="4" />
          <path d="M50 32 l9 -10 v20Z" fill={`${accent}18`} stroke={accent} strokeWidth="4" />
          <circle cx="25" cy="29" r="2.5" fill={accent} />
          <path d="M35 22 q-6 10 0 20" {...common} />
        </>
      )}
      {id === "sun" && (
        <>
          <circle cx="32" cy="32" r="13" fill={`${accent}22`} stroke={accent} strokeWidth="4" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <line key={angle} x1="32" x2="32" y1="6" y2="14" transform={`rotate(${angle} 32 32)`} {...common} />
          ))}
        </>
      )}
      {id === "star" && (
        <path d="M32 8 l7 15 16 2 -12 12 3 17 -14 -8 -14 8 3 -17 -12 -12 16 -2Z" fill={`${accent}22`} stroke={accent} strokeWidth="4" />
      )}
      {id === "apple" && (
        <>
          <path d="M32 21 c-15 -8 -24 8 -17 24 5 12 14 10 17 7 3 3 12 5 17 -7 7 -16 -2 -32 -17 -24Z" fill={`${accent}18`} stroke={accent} strokeWidth="4" />
          <path d="M34 18 q4 -9 13 -8 M31 20 q-2 -7 4 -12" {...common} />
        </>
      )}
      {id === "ball" && (
        <>
          <circle cx="32" cy="32" r="22" fill={`${accent}18`} stroke={accent} strokeWidth="4" />
          <path d="M15 25 q17 10 34 0 M15 39 q17 -10 34 0 M32 10 q-8 22 0 44 M32 10 q8 22 0 44" {...common} />
        </>
      )}
      {id === "tree" && (
        <>
          <path d="M32 46 v11" {...common} />
          <path d="M20 46 h24 l-7 -10 h5 l-10 -14 -10 14 h5Z" fill={`${accent}18`} stroke={accent} strokeWidth="4" />
          <path d="M32 11 l-12 19 h24Z" fill={`${accent}18`} stroke={accent} strokeWidth="4" />
        </>
      )}
      {id === "house" && (
        <>
          <path d="M12 30 L32 12 L52 30" {...common} />
          <path d="M18 28 v25 h28 V28" fill={`${accent}18`} stroke={accent} strokeWidth="4" />
          <path d="M28 53 V39 h8 v14" {...common} />
        </>
      )}
    </svg>
  );
}

export function SymbolSequence({ sequence = "", hidden = false, size = 24 }) {
  const digits = normalizeSymbolSequence(sequence).split("");
  if (!digits.length) return <span className="symbol-sequence-empty">Not set</span>;

  return (
    <span className="symbol-sequence" aria-label={hidden ? "Password hidden" : "Symbol password"}>
      {digits.map((digit, index) => {
        const icon = symbolIconByDigit[digit];
        return (
          <span className="symbol-sequence-icon" key={`${digit}-${index}`}>
            {hidden || !icon ? "•" : <SymbolIcon id={icon.id} accent={icon.accent} size={size} />}
          </span>
        );
      })}
    </span>
  );
}

export function SymbolPasswordPad({
  value = "",
  onChange,
  onComplete,
  disabled = false,
  label = "Choose three pictures",
  showBackspace = true
}) {
  const sequence = normalizeSymbolSequence(value);

  function appendDigit(digit) {
    if (disabled || sequence.length >= SYMBOL_PASSWORD_LENGTH) return;
    const next = normalizeSymbolSequence(`${sequence}${digit}`);
    onChange?.(next);
    if (next.length === SYMBOL_PASSWORD_LENGTH) onComplete?.(next);
  }

  function backspace() {
    if (disabled || !sequence.length) return;
    onChange?.(sequence.slice(0, -1));
  }

  return (
    <div className="symbol-password-pad" aria-label={label}>
      <div className="symbol-password-dots" aria-label={`${sequence.length} of ${SYMBOL_PASSWORD_LENGTH} symbols entered`}>
        {Array.from({ length: SYMBOL_PASSWORD_LENGTH }, (_, index) => (
          <span className={index < sequence.length ? "filled" : ""} key={index}></span>
        ))}
      </div>

      <div className="symbol-password-grid">
        {SYMBOL_PASSWORD_ICONS.map(icon => (
          <button
            className="symbol-password-tile"
            disabled={disabled || sequence.length >= SYMBOL_PASSWORD_LENGTH}
            key={icon.digit}
            onClick={() => appendDigit(icon.digit)}
            style={{ "--symbol-accent": icon.accent }}
            type="button"
          >
            <SymbolIcon id={icon.id} accent={icon.accent} />
            <span>{icon.label}</span>
          </button>
        ))}
      </div>

      {showBackspace && (
        <button className="symbol-password-backspace" disabled={disabled || !sequence.length} onClick={backspace} type="button">
          Back
        </button>
      )}
    </div>
  );
}
