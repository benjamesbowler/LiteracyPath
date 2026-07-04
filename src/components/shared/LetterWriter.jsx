import { useEffect, useMemo, useRef, useState } from "react";
import { LETTER_STROKES, LETTER_GUIDES } from "../../data/letterStrokes.js";

// Animated "watch the letter being written" demonstration. Every stroke is
// drawn stroke-by-stroke in real pedagogic order while a pencil tip follows
// the line, exactly like a teacher modelling on the board.
//
// Usage: <LetterWriter text="Nn" height={240} />  (replays on `playKey` change)

const CHAR_W = LETTER_GUIDES.width; // 100
const CHAR_H = 140;
const PX_PER_SECOND = 130;          // writing speed along the stroke
const STROKE_GAP_MS = 260;          // pencil "lift" pause between strokes

export function LetterWriter({
  text = "",
  height = 220,
  color = "var(--lp-color-primary, #2C7A4B)",
  guideColor = "rgba(31, 63, 42, 0.16)",
  showGuides = true,
  playKey = 0,
  onDone
}) {
  const svgRef = useRef(null);
  const [drawn, setDrawn] = useState(false);
  const chars = useMemo(
    () => String(text).split("").filter(ch => LETTER_STROKES[ch]),
    [text]
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !chars.length) return undefined;
    setDrawn(false);

    const paths = Array.from(svg.querySelectorAll("[data-stroke]"));
    const pencil = svg.querySelector("[data-pencil]");
    let raf = 0;
    let cancelled = false;

    // Hide all ink, then draw each stroke in order with a moving pencil tip.
    const plan = paths.map(path => {
      const length = Math.max(path.getTotalLength(), 0.6);
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      return { path, length, duration: Math.max(260, (length / PX_PER_SECOND) * 1000) };
    });

    let strokeIndex = 0;
    let strokeStart = 0;   // timestamp the current stroke began
    let pauseUntil = 0;    // pencil-lift pause between strokes

    function step(now) {
      if (cancelled) return;
      const item = plan[strokeIndex];
      if (!item) {
        if (pencil) pencil.style.opacity = "0";
        setDrawn(true);
        onDone?.();
        return;
      }
      if (pauseUntil && now < pauseUntil) { raf = requestAnimationFrame(step); return; }
      if (pauseUntil) { pauseUntil = 0; strokeStart = 0; }
      if (!strokeStart) strokeStart = now;

      const t = Math.min(1, (now - strokeStart) / item.duration);
      const eased = t * (2 - t); // ease-out so strokes land softly
      item.path.style.strokeDashoffset = `${item.length * (1 - eased)}`;
      if (pencil) {
        const point = item.path.getPointAtLength(item.length * eased);
        // getPointAtLength is in the path's local units - add the letter's
        // horizontal offset so the pencil sits on the right character.
        const offset = Number(item.path.dataset.charOffset || 0);
        pencil.setAttribute("transform", `translate(${point.x + offset}, ${point.y})`);
        pencil.style.opacity = "1";
      }
      if (t >= 1) {
        strokeIndex += 1;
        pauseUntil = now + STROKE_GAP_MS;
      }
      raf = requestAnimationFrame(step);
    }

    if (pencil) pencil.style.opacity = "0";
    raf = requestAnimationFrame(step);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [chars, playKey, onDone]);

  if (!chars.length) return null;
  const width = chars.length * CHAR_W;
  const g = LETTER_GUIDES;

  return (
    <svg
      ref={svgRef}
      className={`letter-writer${drawn ? " is-done" : ""}`}
      viewBox={`0 0 ${width} ${CHAR_H}`}
      style={{ height, maxWidth: "100%" }}
      role="img"
      aria-label={`Watch how to write ${text}`}
    >
      {showGuides && (
        <g aria-hidden="true">
          <line x1="0" y1={g.top} x2={width} y2={g.top} stroke={guideColor} strokeWidth="1.5" />
          <line x1="0" y1={g.mid} x2={width} y2={g.mid} stroke={guideColor} strokeWidth="1.5" strokeDasharray="6 5" />
          <line x1="0" y1={g.base} x2={width} y2={g.base} stroke={guideColor} strokeWidth="2" />
        </g>
      )}
      {chars.map((ch, index) => (
        <g key={`${ch}-${index}`} transform={`translate(${index * CHAR_W}, 0)`}>
          {LETTER_STROKES[ch].map((d, n) => (
            <path key={n} d={d} fill="none" stroke="rgba(20, 17, 12, 0.10)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {LETTER_STROKES[ch].map((d, n) => (
            <path
              key={`ink-${n}`}
              d={d}
              data-stroke=""
              data-char-offset={index * CHAR_W}
              fill="none"
              stroke={color}
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      ))}
      <g data-pencil="" style={{ opacity: 0, transition: "opacity 160ms ease" }} aria-hidden="true">
        <circle r="7" fill="#F4A83C" stroke="#8A5A1D" strokeWidth="2.5" />
        <path d="M2 -4 L20 -34 L30 -28 L14 4 Z" fill="#F8C97E" stroke="#8A5A1D" strokeWidth="2.5" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
