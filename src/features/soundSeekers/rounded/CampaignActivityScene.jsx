import { useEffect, useId, useRef } from 'react';
import { CAST } from '../v3/content/cast.js';
import { CAMPAIGN_MISSIONS } from '../v3/content/campaign.js';
import { campaignSlots } from './campaignPresentation.js';
import { PUZZLE_SPRITES, LEARNING_SPRITES } from '../v3/render/puzzleSprites.js';
import './campaign-activity-scene.css';
import { projectCampaignScene } from './campaignActivitySceneState.js';

const missionResidents = new Map(CAMPAIGN_MISSIONS.map(mission => [mission.id, mission.residentId]));

// Existing painted atlas assets retain their canonical authored rectangles.
// Nested viewBoxes show the whole object without recolouring or stretching it.
const PROPS = {
  tree: { source: LEARNING_SPRITES, rect: [993, 24, 290, 326], size: [1312, 1199] },
  tray: { source: LEARNING_SPRITES, rect: [973, 427, 317, 179], size: [1312, 1199] },
  lever: { source: PUZZLE_SPRITES, rect: [356, 329, 223, 281], size: [1254, 1254] },
  door: { source: PUZZLE_SPRITES, rect: [958, 19, 282, 287], size: [1254, 1254] },
  basket: { source: PUZZLE_SPRITES, rect: [983, 332, 227, 266], size: [1254, 1254] },
  lantern: { source: PUZZLE_SPRITES, rect: [77, 627, 150, 282], size: [1254, 1254] },
  crate: { source: PUZZLE_SPRITES, rect: [655, 347, 261, 255], size: [1254, 1254] },
  ladder: { source: PUZZLE_SPRITES, rect: [690, 940, 167, 289], size: [1254, 1254] },
  workbench: { source: PUZZLE_SPRITES, rect: [943, 966, 297, 235], size: [1254, 1254] },
  hedge: { source: PUZZLE_SPRITES, rect: [15, 979, 292, 219], size: [1254, 1254] }
};

function PaintedProp({ kind, left, height = 70, bottom = 12, className = '', children }) {
  const prop = PROPS[kind];
  if (!prop) return null;
  return <div className={`campaign-scene-object ${className}`} style={{ left: `${left}%`, height: `${height}%`, bottom: `${bottom}%`, aspectRatio: `${prop.rect[2]} / ${prop.rect[3]}` }}>
    <svg viewBox={prop.rect.join(' ')} aria-hidden="true"><image href={prop.source} width={prop.size[0]} height={prop.size[1]} /></svg>{children}
  </div>;
}

function Pal({ id = 'bouncy', left, height = 76, bottom = 12, className = '', style = {} }) {
  const cast = CAST[id] || CAST.bouncy;
  return <div className={`campaign-scene-pal ${className}`} style={{ left: `${left}%`, height: `${height}%`, bottom: `${bottom}%`, aspectRatio: id === 'bouncy' ? '.55' : '1', ...style }}>
    <span className="campaign-scene-contact" /><img src={cast.sprite} alt="" draggable="false" />
  </div>;
}

function Landscape({ id, night, water = false }) {
  return <svg className="campaign-scene-landscape" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={night ? 'var(--rounded-234b73)' : 'var(--rounded-d5eeee)'} /><stop offset="1" stopColor={night ? 'var(--rounded-637c93)' : 'var(--rounded-f9f3e8)'} /></linearGradient>
      <linearGradient id={`${id}-water`} x2="0" y2="1"><stop stopColor="var(--rounded-a7cecf)" /><stop offset="1" stopColor="var(--rounded-75a8af)" /></linearGradient>
      <linearGradient id={`${id}-grass`} x2="0" y2="1"><stop stopColor={night ? 'var(--rounded-799b88)' : 'var(--rounded-c6d7b7)'} /><stop offset="1" stopColor={night ? 'var(--rounded-587268)' : 'var(--rounded-acbb78)'} /></linearGradient>
    </defs>
    <path fill={`url(#${id}-sky)`} d="M0 0H1000V300H0Z" />
    <path d="M30 55c15-14 32-16 47-7 10-22 49-24 63-4 21-6 43 5 44 20H30Z" fill="var(--rounded-fffbef)" opacity=".78" />
    <path d="M625 80c16-12 32-13 43-5 6-18 37-21 50-4 17-4 34 5 36 15H625Z" fill="var(--rounded-fffbef)" opacity=".72" />
    <path d="M0 145Q130 77 295 131T550 120T820 115T1000 119V300H0Z" fill={night ? 'var(--rounded-657f83)' : 'var(--rounded-b1c8ae)'} opacity=".65" />
    <path d="M0 183Q190 112 390 172T690 151T1000 164V300H0Z" fill={night ? 'var(--rounded-506d61)' : 'var(--rounded-9db995)'} opacity=".75" />
    <path d="M0 205Q220 169 385 220T1000 190V300H0Z" fill={`url(#${id}-grass)`} />
    {water ? <>
      <path d="M248 300Q354 247 341 201Q480 178 652 199Q625 249 742 300Z" fill={`url(#${id}-water)`} />
      <path d="M370 232h75m92 20h58m-218 22h93m100 9h74" stroke="var(--rounded-dceee0)" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <path d="M339 200q-25 65-91 100m404-102q-2 55 89 102" stroke="var(--rounded-749d70)" strokeWidth="6" fill="none" />
    </> : <path d="M84 300Q258 222 528 225T950 300Z" fill="var(--rounded-e1cfa8)" opacity=".75" />}
    <path d="M0 283Q125 260 215 276M816 278q101-25 184-9" stroke="var(--rounded-8ba579)" strokeWidth="9" fill="none" />
    {[50, 80, 930, 954].map((x, i) => <g key={x} transform={`translate(${x},${265 + i % 2 * 10})`}>
      <path d="M0 0q-2-16-9-21m9 21q2-20 9-26m-9 26v-30" stroke="var(--rounded-718965)" strokeWidth="3" fill="none" />
      <circle cy="-32" r="5" fill={i % 2 ? 'var(--rounded-f1e3c3)' : 'var(--rounded-c6b781)'} /><circle cy="-32" r="1.5" fill="var(--rounded-b48a5c)" />
    </g>)}
  </svg>;
}

function SceneDrawing({ children, className = '', style = {} }) {
  return <svg className={`campaign-scene-drawing ${className}`} style={style} viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">{children}</svg>;
}

function Stones({ scene }) {
  const count = Math.max(3, Math.min(7, scene.total));
  const standing = scene.progress === 0 ? 18 : scene.fraction === 1 ? 80
    : 32.2 + (Math.ceil(scene.fraction * count) - 1) * 35.2 / (count - 1);
  return <>
    <SceneDrawing>
      {Array.from({ length: count }, (_, i) => {
        const x = 322 + i * 352 / (count - 1), active = i < Math.ceil(scene.fraction * count);
        return <g key={i} className={active ? 'is-restored' : ''} data-scene-piece={i} data-settled={active ? 'true' : 'false'}>
          <ellipse cx={x} cy="252" rx="32" ry="10" fill="var(--rounded-558b75)" opacity=".3" />
          <path d={`M${x - 29} 244l7-22 35-5 19 12-3 17Z`} fill={active ? 'var(--rounded-d8c8a7)' : 'var(--rounded-afbaa3)'} stroke="var(--rounded-758576)" strokeWidth="2" />
          <path d={`M${x - 17} 225l25-3 13 7`} stroke="var(--rounded-f3eddc)" strokeWidth="3" fill="none" />
        </g>;
      })}
    </SceneDrawing>
    <Pal left={standing} height={72} bottom={18} className="campaign-scene-stepper" />
    <PaintedProp kind="tree" left={91} height={88} bottom={13} />
  </>;
}

function Bridge({ scene }) {
  const count = Math.max(3, Math.min(10, scene.total));
  return <>
    <SceneDrawing>
      <path d="M292 181Q500 232 708 181M292 195Q500 246 708 195" fill="none" stroke="var(--rounded-95643c)" strokeWidth="6" />
      {[286, 714].map(x => <g key={x}><path d={`M${x} 171v85`} stroke="var(--rounded-867044)" strokeWidth="16" strokeLinecap="round" /><path d={`M${x - 5} 178v66`} stroke="var(--rounded-b48a5c)" strokeWidth="5" strokeLinecap="round" /></g>)}
      {Array.from({ length: count }, (_, i) => {
        const x = 300 + i * 400 / count, width = 400 / count - 3, settled = i < Math.ceil(scene.fraction * count);
        return <g key={`${i}:${settled}`} className={settled ? 'campaign-scene-bridge-piece is-restored' : ''} data-scene-piece={i} data-settled={settled ? 'true' : 'false'} data-arriving={i === Math.ceil(scene.fraction * count) - 1 ? 'true' : 'false'}>
          {settled ? <>
            <path d={`M${x} 235l${width} 0 6 16-${width + 12} 0Z`} fill="var(--rounded-b78450)" stroke="var(--rounded-95643c)" strokeWidth="2" />
            <path d={`M${x + 3} 237h${width - 6}m-${width - 7} 6h${width - 5}`} stroke="var(--rounded-e2ba77)" strokeWidth="2" />
            <path d={`M${x + width / 2} 204v30`} stroke="var(--rounded-a67b4c)" strokeWidth="3" />
          </> : <path d={`M${x + 3} 247h${width - 6}`} stroke="var(--rounded-9fa787)" strokeWidth="2" strokeDasharray="3 5" />}
        </g>;
      })}
    </SceneDrawing>
    <Pal left={scene.fraction === 1 ? 81 : 18} height={74} bottom={15} className="campaign-scene-bridge-walker" />
    <PaintedProp kind="tree" left={92} height={90} />
  </>;
}

function Bubbles({ scene }) {
  return <>
    <Pal left={17} height={76} />
    <PaintedProp kind="lever" left={30} height={45} bottom={11} />
    <div className="campaign-scene-nozzle" />
    {[0, 1, 2, 3, 4].map(i => {
      const settled = i < Math.ceil(scene.fraction * 5);
      return <div key={`${i}:${settled}`} className={`campaign-scene-bubble-target${settled ? ' is-cleared' : ''}`}
        style={{ left: `${50 + i * 7}%`, bottom: `${64 - i % 2 * 18}%`, height: `${15 + i % 2 * 3}%` }}
        data-scene-piece={i} data-settled={settled ? 'true' : 'false'} />;
    })}
    {scene.accepted && <div key={scene.key} className="campaign-scene-launched-bubble" />}
    <PaintedProp kind="hedge" left={91} height={43} />
  </>;
}

function TreeRescue({ scene, residentId }) {
  return <>
    <PaintedProp kind="tree" left={71} height={97} bottom={3} />
    <PaintedProp kind="ladder" left={57} height={80} bottom={9} />
    <Pal id={residentId || 'brave'} left={75} height={30} bottom={59} />
    <Pal left={53} height={49} bottom={10 + scene.fraction * 37} className="campaign-scene-climber" />
    <PaintedProp kind="basket" left={20} height={30} />
    <SceneDrawing>{Array.from({ length: 4 }, (_, i) => <circle key={i} cx={390 + i * 30} cy="257" r="7" fill={i < Math.ceil(scene.fraction * 4) ? 'var(--rounded-e2ba77)' : 'var(--rounded-c6d7b7)'} stroke="var(--rounded-9fa787)" />)}</SceneDrawing>
  </>;
}

function Post({ scene }) {
  return <>
    <Pal left={17} height={74} />
    <PaintedProp kind="door" left={79} height={91} bottom={8} />
    <SceneDrawing><path d="M700 180h45v77h-45Z" fill="var(--rounded-ac8151)" stroke="var(--rounded-867044)" strokeWidth="3" /><path d="M680 171q40-28 85 0v37h-85Z" fill="var(--rounded-69898c)" stroke="var(--rounded-506d61)" strokeWidth="3" /><path d="M702 184h39" stroke="var(--rounded-184f61)" strokeWidth="5" strokeLinecap="round" /><path d="M707 164v-29l26 7-26 8" fill="var(--rounded-b48a5c)" stroke="var(--rounded-95643c)" strokeWidth="2" /></SceneDrawing>
    <div className="campaign-scene-parcel campaign-scene-delivery" style={{ left: `${28 + scene.fraction * 43}%`, bottom: `${22 + scene.fraction * 20}%` }}><span /><i /></div>
    <PaintedProp kind="hedge" left={93} height={36} />
  </>;
}

function Baskets({ scene }) {
  const positions = scene.basketCounts.length === 2 ? [48, 76] : [43, 62, 81];
  return <>
    <Pal left={17} height={74} />
    {positions.map((left, i) => <PaintedProp key={left} kind="basket" left={left} height={52} bottom={10}>
      {Array.from({ length: Math.min(6, scene.basketCounts[i] || 0) }, (_, index) => <span key={index} className="campaign-scene-gathered" style={{ left: `${28 + index % 3 * 17}%`, top: `${24 + Math.floor(index / 3) * 12}%` }} />)}
    </PaintedProp>)}
    {scene.accepted && <div key={scene.key} className="campaign-scene-gather-drop" style={{ left: `${positions[scene.arrivalBasket] || positions[0]}%` }} />}
  </>;
}

function River({ scene }) {
  return <>
    <SceneDrawing><path d="M676 230l81-22 20 54h-107Z" fill="var(--rounded-b48a5c)" stroke="var(--rounded-867044)" strokeWidth="3" /><path d="M684 232l-6 25m22-30-2 26m22-34 7 26m14-34 11 27" stroke="var(--rounded-e2ba77)" strokeWidth="3" /><path d="M769 235v-52" stroke="var(--rounded-867044)" strokeWidth="6" strokeLinecap="round" /></SceneDrawing>
    <div className="campaign-scene-raft campaign-scene-sailor" style={{ left: `${34 + scene.fraction * 27}%` }}>
      <Pal left={50} height={300} bottom={33} />
      <svg viewBox="0 0 160 50" aria-hidden="true"><path d="M4 14l146-7 6 23L14 46Z" fill="var(--rounded-a67b4c)" stroke="var(--rounded-774622)" strokeWidth="3" /><path d="M11 20l134-8M16 28l132-8M18 36l132-8" stroke="var(--rounded-e2ba77)" strokeWidth="5" /><path d="M37 15l7 24m70-29 5 25" stroke="var(--rounded-617569)" strokeWidth="4" /></svg>
    </div>
    <PaintedProp kind="tree" left={90} height={86} />
  </>;
}

function Train({ scene, slots }) {
  return <>
    <SceneDrawing><path d="M75 261h850m-850 15h850" stroke="var(--rounded-938579)" strokeWidth="5" />{Array.from({ length: 19 }, (_, i) => <path key={i} d={`M${90 + i * 44} 258v23`} stroke="var(--rounded-ad946a)" strokeWidth="7" />)}</SceneDrawing>
    <div className={`campaign-scene-train${scene.fraction === 1 ? ' is-ready' : ''}`}>
      <div className="campaign-scene-engine"><i /><span /><b /><em /></div>
      {Array.from({ length: Math.max(3, Math.min(9, scene.total)) }, (_, i) => <div key={i} className={`campaign-scene-carriage${i < scene.progress ? ' is-loaded' : ''}`} data-scene-piece={i} data-settled={i < scene.progress ? 'true' : 'false'}>
        <span>{slots[i]?.filled ? slots[i].label : ''}</span><i /><b />
      </div>)}
    </div>
    <PaintedProp kind="tree" left={93} height={82} bottom={9} />
  </>;
}

function Workshop({ scene }) {
  return <>
    <Pal left={19} height={75} />
    <PaintedProp kind="workbench" left={57} height={72} bottom={11} />
    <PaintedProp kind="crate" left={82} height={38} bottom={9} />
    <SceneDrawing>
      <path d="M415 126h267" stroke="var(--rounded-94734e)" strokeWidth="9" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map(i => <g key={i} data-scene-piece={i} data-settled={i < Math.ceil(scene.fraction * 5) ? 'true' : 'false'}><path d={`M${453 + i * 47} 131v22`} stroke="var(--rounded-867044)" strokeWidth="3" /><path d={`M${442 + i * 47} 159h24v27h-24Z`} fill={i < Math.ceil(scene.fraction * 5) ? 'var(--rounded-e2ba77)' : 'var(--rounded-b5bca1)'} stroke="var(--rounded-867044)" strokeWidth="2" /><path d={`M${447 + i * 47} 167h14`} stroke="var(--rounded-efd0a0)" strokeWidth="2" /></g>)}
    </SceneDrawing>
    {scene.accepted && <div key={scene.key} className="campaign-scene-fit-piece" />}
  </>;
}

function Garden({ scene }) {
  return <>
    <Pal left={17} height={74} />
    <PaintedProp kind="workbench" left={64} height={64} />
    <PaintedProp kind="basket" left={38} height={40} bottom={8} />
    <PaintedProp kind="tray" left={66} height={24} bottom={52} />
    <SceneDrawing>
      <path d="M854 238h90l-8 39h-73Z" fill="var(--rounded-b58f72)" stroke="var(--rounded-94734e)" strokeWidth="3" />
      <path d="M900 238v-60m0 33q-29-4-31-28 28-4 31 28m0-12q29-4 31-28-28-4-31 28" fill="var(--rounded-8ba579)" stroke="var(--rounded-718965)" strokeWidth="3" />
      {Array.from({ length: 5 }, (_, i) => i < Math.ceil(scene.fraction * 5) && <circle key={i} cx={640 + i * 10} cy={120 - i % 2 * 5} r="7" fill="var(--rounded-bca172)" stroke="var(--rounded-94734e)" strokeWidth="2" />)}
    </SceneDrawing>
    {scene.accepted && <div key={scene.key} className="campaign-scene-garden-piece" />}
  </>;
}

function Lanterns({ scene }) {
  return <>
    <PaintedProp kind="tree" left={84} height={96} bottom={4} />
    <PaintedProp kind="hedge" left={46} height={35} bottom={9} />
    <Pal left={19 + scene.fraction * 25} height={73} className="campaign-scene-searcher" />
    <PaintedProp kind="lantern" left={29 + scene.fraction * 25} height={29} bottom={33} className="campaign-scene-searcher" />
    <div className="campaign-scene-lantern-beam" style={{ opacity: scene.progress ? .7 : .18, left: `${34 + scene.fraction * 25}%` }} />
    <SceneDrawing>{Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${510 + i * 53} ${220 - i % 2 * 33}l4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z`} fill={i < Math.ceil(scene.fraction * 5) ? 'var(--rounded-e2ba77)' : 'var(--rounded-c9ddbc)'} />)}</SceneDrawing>
  </>;
}

function Story({ scene, residentId }) {
  return <>
    <PaintedProp kind="door" left={76} height={90} bottom={8} />
    <Pal left={19 + scene.fraction * 40} height={72} className="campaign-scene-helper" />
    <Pal id={residentId || 'woolly'} left={84} height={58} bottom={11} />
    <SceneDrawing>
      <path d="M240 273q195-41 453-12" stroke="var(--rounded-c6b884)" strokeWidth="18" fill="none" />
      {Array.from({ length: 4 }, (_, i) => <g key={i} data-scene-piece={i} data-settled={i < Math.ceil(scene.fraction * 4) ? 'true' : 'false'}><path d={`M${325 + i * 89} 256l16-9 19 7-2 11-31 1Z`} fill={i < Math.ceil(scene.fraction * 4) ? 'var(--rounded-d8c8a7)' : 'var(--rounded-afbaa3)'} stroke="var(--rounded-879b7b)" strokeWidth="2" /></g>)}
    </SceneDrawing>
  </>;
}

export default function CampaignActivityScene({ beat, state = {}, feedback = null, reducedMotion = false }) {
  const id = useId().replace(/:/g, '');
  const sceneRef = useRef(null);
  const heldAnimations = useRef(new Set());
  const scene = projectCampaignScene(beat, state, feedback);
  useEffect(() => {
    const held = heldAnimations.current;
    const update = () => {
      if (scene.paused || document.hidden) {
        for (const animation of sceneRef.current?.getAnimations({ subtree: true }) || []) {
          if (animation.playState === 'running') { animation.pause(); held.add(animation); }
        }
      } else {
        for (const animation of held) if (animation.playState === 'paused') animation.play();
        held.clear();
      }
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [scene.paused, scene.key]);
  const family = beat?.familyId;
  const residentId = missionResidents.get(beat?.missionId);
  const night = family === 'lantern-search';
  const water = ['sound-steps', 'rescue-bridge', 'river-route'].includes(family);
  let content;
  switch (family) {
    case 'sound-steps': content = <Stones scene={scene} />; break;
    case 'word-pop': content = <Bubbles scene={scene} />; break;
    case 'rescue-bridge': content = <Bridge scene={scene} />; break;
    case 'tree-rescue': content = <TreeRescue scene={scene} residentId={residentId} />; break;
    case 'pals-post': content = <Post scene={scene} />; break;
    case 'sound-herd': content = <Baskets scene={scene} />; break;
    case 'river-route': content = <River scene={scene} />; break;
    case 'sentence-express': content = <Train scene={scene} slots={campaignSlots(beat, state)} />; break;
    case 'fix-it-workshop': content = <Workshop scene={scene} />; break;
    case 'garden-kitchen': content = <Garden scene={scene} />; break;
    case 'lantern-search': content = <Lanterns scene={scene} />; break;
    case 'story-rescue': content = <Story scene={scene} residentId={residentId} />; break;
    default: return null;
  }
  return <div ref={sceneRef} className="rounded-family-scene campaign-activity-scene" aria-hidden="true"
    data-family={family} data-motion={scene.accepted ? 'accepted' : 'idle'}
    data-scene-progress={scene.progress} data-scene-total={scene.total}
    data-paused={scene.paused ? 'true' : 'false'} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
    <Landscape id={id} night={night} water={water} />
    <span className={`campaign-scene-sun${night ? ' is-moon' : ''}`} />
    {content}
  </div>;
}
