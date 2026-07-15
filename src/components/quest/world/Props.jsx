// THE THINGS IN THE PATH — and what they become.
//
// "TURN MASTERY INTO WORLD REPAIR." The single best line in the research doc, and
// the thing that was still missing:
//
//   weak:   "Click the word that starts with /s/."
//   strong: the bridge is out. Every sound you get right becomes a plank. Then
//           your creature walks across it.
//
// So every prop has TWO states, and the change is the reward. A broken bridge
// becomes a bridge you cross. A dead flower patch blooms. A hungry beast sits
// down, full and friendly, and waves you past. A dark cave lights up.
//
// A star counter is not a reward. A star counter is a receipt. THIS is the reward.

import { HIGHLIGHT, MATERIALS } from "../../../data/questWorlds.js";
import { CREATURE_INK, CREATURE_PAPER } from "../../../data/creatureParts.js";

function Flowers({ done }) {
  return (
    <svg viewBox="0 0 150 120" className="qw-art" aria-hidden="true">
      {[18, 56, 94, 128].map((x, i) => (
        <g key={x} className={done ? "qw-grown" : ""} style={{ animationDelay: `${i * 110}ms` }}>
          <path d={`M${x},112 L${x},${done ? 62 : 92}`} stroke="var(--q-deep)" strokeWidth="5" strokeLinecap="round" fill="none" />
          {done ? (
            <>
              <circle cx={x} cy="48" r="10" fill="var(--q-accent)" />
              <circle cx={x - 11} cy="58" r="10" fill="var(--q-accent)" />
              <circle cx={x + 11} cy="58" r="10" fill="var(--q-accent)" />
              <circle cx={x} cy="68" r="10" fill="var(--q-accent)" />
              <circle cx={x} cy="58" r="7" fill={CREATURE_PAPER} />
            </>
          ) : (
            // Closed buds. The patch is waiting for you.
            <ellipse cx={x} cy="86" rx="7" ry="11" fill="var(--q-deep)" />
          )}
        </g>
      ))}
    </svg>
  );
}

function Bridge({ done }) {
  return (
    <svg viewBox="0 0 220 120" className="qw-art" aria-hidden="true">
      {/* The gap. Always there — this is why you stopped. */}
      <path d="M0,74 L28,74 L28,120 L0,120 Z" fill="var(--q-deep)" />
      <path d="M192,74 L220,74 L220,120 L192,120 Z" fill="var(--q-deep)" />
      <path d="M28,86 C60,116 160,116 192,86 L192,120 L28,120 Z" fill={CREATURE_INK} opacity="0.35" />

      {done
        ? [0, 1, 2, 3, 4].map(i => (
          <rect
            key={i}
            className="qw-plankdrop"
            style={{ animationDelay: `${i * 90}ms` }}
            x={30 + i * 33} y="64" width="30" height="14" rx="3"
            fill={MATERIALS.wood} stroke={MATERIALS.woodDark} strokeWidth="2"
          />
        ))
        : [0, 4].map(i => (
          <rect key={i} x={30 + i * 33} y="64" width="30" height="14" rx="3" fill={MATERIALS.dull} opacity="0.5" />
        ))}
      {done && <rect x="28" y="60" width="164" height="4" fill={HIGHLIGHT} opacity="0.35" />}
    </svg>
  );
}

function Beast({ done, big = false }) {
  return (
    <svg viewBox="0 0 130 120" className={`qw-art${done ? " qw-full" : ""}`} aria-hidden="true">
      <path d="M65,6 C102,6 124,32 124,66 C124,98 102,114 65,114 C28,114 6,98 6,66 C6,32 28,6 65,6 Z" fill="var(--q-accent)" />
      <path d="M6,74 C16,104 36,114 65,114 C94,114 114,104 124,74 C116,100 96,110 65,110 C34,110 14,100 6,74 Z" fill="var(--q-deep)" opacity="0.45" />
      <circle cx="44" cy="46" r={big ? 14 : 13} fill={CREATURE_PAPER} />
      <circle cx="86" cy="46" r={big ? 14 : 13} fill={CREATURE_PAPER} />
      {done ? (
        <>
          {/* Full and happy: eyes closed, contented smile. It waves you past. */}
          <path d="M34,46 C40,40 50,40 56,46" stroke={CREATURE_INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M76,46 C82,40 92,40 98,46" stroke={CREATURE_INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M44,80 C54,94 78,94 88,80" stroke={CREATURE_INK} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="47" cy="48" r="6" fill={CREATURE_INK} />
          <circle cx="89" cy="48" r="6" fill={CREATURE_INK} />
          {/* Open mouth: it is hungry, and it is in your way. */}
          <path className="qw-chomp" d="M38,78 C52,104 78,104 92,78 Z" fill={CREATURE_INK} />
        </>
      )}
    </svg>
  );
}

function Cave({ done }) {
  return (
    <svg viewBox="0 0 160 140" className="qw-art" aria-hidden="true">
      <path d="M12,140 C12,64 46,20 80,20 C114,20 148,64 148,140 Z" fill="var(--q-deep)" />
      <path d="M36,140 C36,82 56,50 80,50 C104,50 124,82 124,140 Z" fill={done ? "var(--q-accent)" : CREATURE_INK} opacity={done ? 0.85 : 1} />
      {done && (
        <>
          {/* Lit. You can see the way through now. */}
          <circle className="qw-glow" cx="80" cy="96" r="26" fill={HIGHLIGHT} opacity="0.5" />
          <circle cx="80" cy="96" r="12" fill={CREATURE_PAPER} />
        </>
      )}
    </svg>
  );
}

function Pens({ done }) {
  return (
    <svg viewBox="0 0 190 110" className="qw-art" aria-hidden="true">
      {[6, 102].map(x => (
        <g key={x}>
          <rect x={x} y="46" width="82" height="60" rx="6" fill="none" stroke={MATERIALS.rope} strokeWidth="5" />
          {done && [0, 1, 2].map(i => (
            <g key={i} className="qw-grown" style={{ animationDelay: `${i * 120}ms` }}>
              <ellipse cx={x + 20 + i * 22} cy="82" rx="11" ry="9" fill={CREATURE_PAPER} />
              <circle cx={x + 26 + i * 22} cy="78" r="5" fill={CREATURE_INK} />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

function SignpostProp({ done }) {
  return (
    <svg viewBox="0 0 110 150" className="qw-art" aria-hidden="true">
      <rect x="50" y="40" width="12" height="110" fill={MATERIALS.woodDark} rx="3" />
      <g className={done ? "qw-swing" : ""}>
        <rect x="10" y="30" width="92" height="40" rx="6" fill={MATERIALS.woodPale} stroke={MATERIALS.woodDark} strokeWidth="4" />
        {done
          ? <path d="M32,50 L46,62 L78,34" stroke={MATERIALS.good} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          : [0, 1, 2].map(i => <rect key={i} x={24 + i * 22} y="46" width="14" height="6" rx="3" fill={MATERIALS.woodDark} opacity="0.5" />)}
      </g>
    </svg>
  );
}

// The trail forks: two arrow boards on one post, pointing opposite ways. Done =
// one arrow drops away and the way through is clear.
function TrailForkProp({ done }) {
  return (
    <svg viewBox="0 0 130 150" className="qw-art" aria-hidden="true">
      <rect x="60" y="34" width="12" height="116" fill={MATERIALS.woodDark} rx="3" />
      <g className={done ? "qw-swing" : ""}>
        <path d="M14,26 L92,26 L112,42 L92,58 L14,58 Z" fill={MATERIALS.woodPale} stroke={MATERIALS.woodDark} strokeWidth="4" strokeLinejoin="round" />
      </g>
      {!done && (
        <path d="M118,66 L38,66 L20,82 L38,98 L118,98 Z" fill={MATERIALS.woodPale} stroke={MATERIALS.woodDark} strokeWidth="4" strokeLinejoin="round" opacity="0.85" />
      )}
      {done && <circle className="qw-glow" cx="66" cy="42" r="20" fill={HIGHLIGHT} opacity="0.5" />}
    </svg>
  );
}

function StoryRockProp({ done }) {
  return (
    <svg viewBox="0 0 150 110" className="qw-art" aria-hidden="true">
      <path d="M10,108 C6,60 34,20 76,20 C118,20 144,58 140,108 Z" fill={MATERIALS.stone} />
      <path d="M28,100 C26,64 46,38 76,38 C106,38 126,64 124,100 Z" fill={done ? "var(--q-accent)" : MATERIALS.stoneDark} />
      {done && <circle className="qw-glow" cx="76" cy="72" r="22" fill={HIGHLIGHT} opacity="0.45" />}
    </svg>
  );
}

const PROPS = {
  "flower-patch": Flowers,
  "broken-bridge": Bridge,
  "hungry-beast": Beast,
  "word-beast": p => Beast({ ...p, big: true }),
  "echo-cave": Cave,
  "sheep-pens": Pens,
  "trail-run": TrailForkProp,
  signpost: SignpostProp,
  "story-rock": StoryRockProp
};

export default function Prop({ kind, done }) {
  const View = PROPS[kind];
  if (!View) return null;
  return <View done={done} />;
}
