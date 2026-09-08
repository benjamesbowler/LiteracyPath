import { useId } from 'react';
import { RACER_LANE_OFFSETS, RACER_ROAD_WIDTH, sampleRacerRoute } from '../../utils/soundRacerRoute.js';

const PALETTES = {
  easy: { grass: '#87ad70', field: '#a6bf80', leaf: '#47765a', roof: '#a95c4b' },
  medium: { grass: '#91ac72', field: '#bbca8b', leaf: '#4d7a64', roof: '#99744b' },
  hard: { grass: '#849a98', field: '#b0beb0', leaf: '#4c7171', roof: '#7b7188' }
};
const pointString = points => points.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');

function Tree({ x, y, scale = 1, leaf }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="8" rx="20" ry="10" fill="#173b31" opacity=".17" />
    <path d="M-4 5 L-3-30 L4-30 L5 5Z" fill="#795d42" />
    <path d="M0-68 C-16-65-24-48-22-39 C-37-19-18-9-1-15 C19-7 34-22 22-38 C28-51 13-67 0-68Z" fill={leaf} />
    <path d="M-3-59 C-16-49-21-33-15-25 C-8-34-4-45-3-59Z" fill="#d0d890" opacity=".24" />
  </g>;
}

function Cottage({ x, y, roof, flip = false }) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <ellipse cy="17" rx="60" ry="19" fill="#173b31" opacity=".16" />
    <path d="M-46-28 L27-37 L48-16 L47 26 L-44 17Z" fill="#e9d4a4" />
    <path d="M27-37 L48-16 L47 26 L27 15Z" fill="#c3aa7c" />
    <path d="M-56-25 L-15-67 L27-58 L57-16 L25-21 L-15-52 L-38-24Z" fill={roof} />
    <path d="M-15-67 L27-58 L57-16 L25-21Z" fill="#142e40" opacity=".18" />
    <path d="M-8 19 L-8-7 Q2-21 12-7 L12 21Z" fill="#456775" />
    <path d="M-33-6 H-20 V7 H-33Z M28-4 H39 V9 H28Z" fill="#fae8b5" stroke="#607675" strokeWidth="3" />
    <path d="M-50 20 L-37 23 M-32 24 L-19 26" stroke="#617b58" strokeWidth="5" strokeLinecap="round" />
  </g>;
}

/** Illustration only. The parent owns the one semantic mission and all inputs. */
export default function RacerFallback({ mission, snapshot = {}, reducedMotion = false }) {
  const unique = useId().replace(/:/g, '');
  const carPaint = `${unique}-paint`, glass = `${unique}-glass`, badge = `${unique}-badge`;
  const distance = Math.max(0, Number(snapshot.distance) || 0);
  const lateral = Number.isFinite(snapshot.lateral) ? snapshot.lateral : RACER_LANE_OFFSETS[snapshot.lane] || 0;
  const phase = snapshot.phase || 'approach';
  const palette = PALETTES[mission?.difficulty] || PALETTES.easy;
  const rounds = mission?.rounds || [];
  const finishDistance = Math.max(1, mission?.finishDistance || 100);
  const round = rounds[snapshot.roundIndex ?? 0];
  // The road, scenery and vehicle use the renderer's analytic route anchors.
  // A bounded distance window gives the fallback a complete moving rally map.
  const cameraDistance = reducedMotion ? (round?.distance ?? finishDistance) : distance;
  const center = sampleRacerRoute(cameraDistance).position;
  const project = (s, side = 0) => {
    const position = sampleRacerRoute(s, side).position;
    return { x: 400 + (position.x - center.x) * 17, y: 465 + (position.z + cameraDistance) * 9 };
  };
  const start = cameraDistance - 20, end = cameraDistance + 58;
  const samples = Array.from({ length: 65 }, (_, index) => start + (end - start) * index / 64);
  const road = side => samples.map(s => project(s, side));
  const strip = (left, right) => pointString([...road(left), ...road(right).reverse()]);
  const carDistance = reducedMotion ? cameraDistance : distance;
  const car = project(carDistance, lateral);
  const carAhead = project(carDistance + 1, lateral);
  const angle = Math.atan2(carAhead.x - car.x, car.y - carAhead.y) * 180 / Math.PI;
  const moving = !reducedMotion && ['approach', 'transition'].includes(phase);
  const isOpen = phase === 'transition' || phase === 'finished';
  const gateDistance = round ? round.distance + 8 : finishDistance;
  const gate = project(gateDistance);
  const progress = Math.min(1, distance / finishDistance);
  const landmarkDistances = [0, finishDistance * .33, finishDistance * .66, finishDistance];
  const scenery = Array.from({ length: Math.ceil((end - start) / 12) + 1 }, (_, index) => (Math.floor(start / 12) + index) * 12)
    .filter(s => s >= 0 && s <= finishDistance + 24);

  return <svg className="sr-fallback" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"
    aria-hidden="true" focusable="false" style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none', background: palette.grass }}>
    <defs>
      <linearGradient id={carPaint} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f17874" /><stop offset=".52" stopColor="#d74f52" /><stop offset="1" stopColor="#95343f" /></linearGradient>
      <linearGradient id={glass} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9fc6cf" /><stop offset="1" stopColor="#254c61" /></linearGradient>
      <clipPath id={badge}><circle cx="0" cy="-5" r="15" /></clipPath>
    </defs>
    <path d="M0 0 H800 V600 H0Z" fill={palette.grass} />
    <path d="M0 80 Q130 5 245 120 T800 70 V210 Q690 262 610 195 T220 265 T0 237Z" fill={palette.field} opacity=".6" />
    <polygon points={strip(-RACER_ROAD_WIDTH / 2 - 1.2, RACER_ROAD_WIDTH / 2 + 1.2)} fill="#c5c896" />
    <polygon points={strip(-RACER_ROAD_WIDTH / 2, RACER_ROAD_WIDTH / 2)} fill="#3e4e58" />
    {[-RACER_ROAD_WIDTH / 2 + .25, RACER_ROAD_WIDTH / 2 - .25].map(side => <polyline key={side} points={pointString(road(side))} fill="none" stroke="#f3e6bf" strokeWidth="3" />)}
    {[-1.5, 1.5].map(side => <polyline key={side} points={pointString(road(side))} fill="none" stroke="#ece3bf" strokeWidth="2" strokeDasharray="14 18" opacity=".65" />)}
    {scenery.map(s => {
      const index = Math.floor(s / 12);
      const side = index % 2 ? -10 : 10;
      const point = project(s, side);
      return index % 3 === 0
        ? <Cottage key={s} x={point.x} y={point.y} roof={palette.roof} flip={side < 0} />
        : <Tree key={s} x={point.x} y={point.y} scale={index % 2 ? .86 : 1.05} leaf={palette.leaf} />;
    })}
    {landmarkDistances.map((s, index) => {
      const point = project(s + (index === 3 ? 5 : 0));
      if (point.y < -100 || point.y > 700) return null;
      if (index === 1 || index === 2) return <g key={index} transform={`translate(${point.x} ${point.y})`}>
        <path d="M-104-22 Q0-5 104-22 M-104 30 Q0 47 104 30" fill="none" stroke="#d8c49d" strokeWidth="10" />
        {[-101, 101].map(x => <path key={x} d={`M${x}-35 V43`} stroke="#76826d" strokeWidth="12" />)}
      </g>;
      return <g key={index} transform={`translate(${point.x} ${point.y})`}>
        <path d="M-109 32 V-34 H109 V32" fill="none" stroke="#214d53" strokeWidth="8" />
        {Array.from({ length: 9 }, (_, j) => <path key={j} d={`M${-99 + j * 23}-34 h20 l-10 22Z`} fill={j % 2 ? '#f0be59' : '#f4edd7'} />)}
        <path d="M-91-34 V-46 H91 V-34" fill="#183b48" />
      </g>;
    })}
    {round && gate.y > -30 && gate.y < 630 && <g transform={`translate(${gate.x} ${gate.y})`}>
      <path d="M-91 0 H91" stroke="#f4ead2" strokeWidth="5" strokeDasharray="8 7" />
      {[0, 1, 2].map(lane => <g key={lane} transform={`translate(${RACER_LANE_OFFSETS[lane] * 17} 0)`}>
        <circle cy="-7" r="5" fill="#ecd598" />
        <path d={isOpen && snapshot.lane === lane ? 'M-22-7 L-30-38' : 'M-22-7 H22'} fill="none" stroke="#e6b852" strokeWidth="7" strokeLinecap="round" />
      </g>)}
    </g>}
    <g transform={`translate(${car.x} ${car.y}) rotate(${reducedMotion ? 0 : angle})`}>
      <ellipse cy="16" rx="46" ry="59" fill="#102c35" opacity=".26" />
      {[-39, 39].map(x => <g key={x}><rect x={x - 6} y="-39" width="12" height="27" rx="5" fill="#182b36" /><rect x={x - 6} y="21" width="12" height="27" rx="5" fill="#182b36" /></g>)}
      <path d="M-30-59 Q0-69 30-59 Q42-53 40-25 L37 44 Q35 59 21 61 H-21 Q-35 59-37 44 L-40-25 Q-42-53-30-59Z" fill={`url(#${carPaint})`} stroke="#123e49" strokeWidth="3" />
      <path d="M-26-44 Q0-54 26-44 L30-18 Q0-11-30-18Z" fill={`url(#${glass})`} stroke="#204759" strokeWidth="3" />
      <path d="M-26 25 Q0 31 26 25 L25 44 Q0 49-25 44Z" fill={`url(#${glass})`} stroke="#204759" strokeWidth="2" />
      <path d="M-29-12 L-27 23 M29-12 L27 23" stroke="#f6a58d" strokeWidth="3" opacity=".65" />
      <path d="M-26-53 L-13-55 M13-55 L26-53" stroke="#fff0b4" strokeWidth="6" strokeLinecap="round" />
      <path d="M-29 51 H-20 M20 51 H29" stroke={moving ? '#ae6260' : '#f4a180'} strokeWidth="5" strokeLinecap="round" />
      <circle cy="-5" r="17" fill="#f4e1ad" stroke="#183e4b" strokeWidth="2" />
      <image href="/images/companions/muddy.webp" x="-15" y="-20" width="30" height="30" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${badge})`} />
      {moving && <path d="M-23 73 V81 M23 73 V81" stroke="#e9e5bd" strokeWidth="3" strokeLinecap="round" opacity=".55" />}
    </g>
    <g transform="translate(280 27)">
      <path d="M0 0 H240" stroke="#173c46" strokeWidth="9" strokeLinecap="round" opacity=".45" />
      <path d={`M0 0 H${240 * progress}`} stroke="#f1c561" strokeWidth="6" strokeLinecap="round" />
      {rounds.map(item => <circle key={item.id} cx={240 * item.distance / finishDistance} r="3" fill={distance >= item.distance ? '#f8e6b5' : '#365958'} />)}
      <path d="M239-9 V9 M239-9 H250 V-2 H239" fill="#f3e7cb" stroke="#173c46" strokeWidth="2" />
    </g>
  </svg>;
}
