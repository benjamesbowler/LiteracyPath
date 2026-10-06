import { useEffect, useRef } from 'react';
import { CAST } from '../v3/content/cast.js';
import { CAMPAIGN_MISSIONS } from '../v3/content/campaign.js';
import { campaignSlots } from './campaignPresentation.js';
import sceneArt from './campaignSceneArt.generated.json';
import { projectCampaignScene } from './campaignActivitySceneState.js';
import './campaign-activity-scene.css';

const missionResidents = new Map(CAMPAIGN_MISSIONS.map(mission => [mission.id, mission.residentId]));

function PaintedProp({ kind, left, height = 70, bottom = 12, className = '', children, style = {}, ...attributes }) {
  const prop = sceneArt[kind];
  if (!prop) return null;
  return <div className={`campaign-scene-object ${className}`} style={{ left: `${left}%`, height: `${height}%`, bottom: `${bottom}%`, aspectRatio: prop.aspect, ...style }} {...attributes}>
    <img src={prop.source} alt="" draggable="false" />{children}
  </div>;
}

function Pal({ id = 'bouncy', left, height = 76, bottom = 12, className = '', style = {} }) {
  const cast = CAST[id] || CAST.bouncy;
  return <div className={`campaign-scene-pal ${className}`} style={{ left: `${left}%`, height: `${height}%`, bottom: `${bottom}%`, aspectRatio: id === 'bouncy' ? '.55' : '1', ...style }}>
    <img src={cast.sprite} alt="" draggable="false" />
  </div>;
}

function Pieces({ scene, count, start = 36, span = 31, kind = 'scene-stepping-stone', height = 8, bottom = 12, className = '' }) {
  return Array.from({ length: count }, (_, index) => {
    const settled = index < Math.ceil(scene.fraction * count);
    return <PaintedProp key={index} kind={kind} left={start + index * span / (count - 1)} height={height} bottom={bottom}
      className={className} style={{ opacity: settled ? 1 : .35 }} data-scene-piece={index}
      data-settled={settled ? 'true' : 'false'} data-arriving={index === Math.ceil(scene.fraction * count) - 1 ? 'true' : 'false'} />;
  });
}

function Stones({ scene }) {
  const count = Math.max(3, Math.min(7, scene.total));
  const standing = scene.progress === 0 ? 18 : scene.fraction === 1 ? 80 : 32.2 + (Math.ceil(scene.fraction * count) - 1) * 35.2 / (count - 1);
  return <>
    <Pieces scene={scene} count={count} start={32.2} span={35.2} height={8} bottom={16} />
    <Pal left={standing} height={72} bottom={18} className="campaign-scene-stepper" />
    <PaintedProp kind="tree" left={91} height={88} bottom={13} />
  </>;
}

function Bridge({ scene }) {
  const count = Math.max(3, Math.min(10, scene.total));
  return <>
    <PaintedProp kind="scene-bridge-frame" left={50} height={80} bottom={9}>
      <Pieces scene={scene} count={count} start={18} span={64} kind="scene-plank" height={Math.min(8, 50 / count)} bottom={2} className="campaign-scene-bridge-piece" />
    </PaintedProp>
    <Pal left={scene.fraction === 1 ? 81 : 18} height={74} bottom={15} className="campaign-scene-bridge-walker" />
    <PaintedProp kind="tree" left={92} height={90} />
  </>;
}

function Bubbles({ scene }) {
  return <>
    <Pal left={17} height={76} />
    <PaintedProp kind="scene-bubble-machine" left={30} height={45} bottom={11} />
    {[0, 1, 2, 3, 4].map(index => {
      const settled = index < Math.ceil(scene.fraction * 5);
      return <PaintedProp key={index} kind={settled ? 'scene-pop' : 'scene-bubble'} left={50 + index * 7} bottom={64 - index % 2 * 18} height={15 + index % 2 * 3}
        className={`campaign-scene-bubble-target${settled ? ' is-cleared' : ''}`} style={{ aspectRatio: 1 }} data-scene-piece={index} data-settled={settled ? 'true' : 'false'} />;
    })}
    {scene.accepted && <PaintedProp key={scene.key} kind="scene-bubble" left={29} bottom={29} height={16} className="campaign-scene-launched-bubble" />}
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
    <Pieces scene={scene} count={4} start={39} span={9} height={5} />
  </>;
}

function Post({ scene }) {
  return <>
    <Pal left={17} height={74} />
    <PaintedProp kind="door" left={79} height={91} bottom={8} />
    <PaintedProp kind="scene-mailbox" left={68} height={65} />
    <PaintedProp kind="scene-parcel" left={28 + scene.fraction * 40} height={22} bottom={22 + scene.fraction * 20} className="campaign-scene-delivery" />
    <PaintedProp kind="hedge" left={93} height={36} />
  </>;
}

function Baskets({ scene }) {
  const positions = scene.basketCounts.length === 2 ? [48, 76] : [43, 62, 81];
  return <>
    <Pal left={17} height={74} />
    {positions.map((left, index) => <PaintedProp key={left} kind="basket" left={left} height={52} bottom={10}>
      {Array.from({ length: Math.min(6, scene.basketCounts[index] || 0) }, (_, item) => <img key={item} src={sceneArt['scene-berry'].source} alt="" className="campaign-scene-gathered" style={{ left: `${28 + item % 3 * 17}%`, top: `${24 + Math.floor(item / 3) * 12}%` }} />)}
    </PaintedProp>)}
    {scene.accepted && <PaintedProp key={scene.key} kind="scene-berry" left={positions[scene.arrivalBasket] || positions[0]} height={15} bottom={48} className="campaign-scene-gather-drop" />}
  </>;
}

function River({ scene }) {
  return <>
    <PaintedProp kind="dock" left={76} height={32} bottom={8} />
    <PaintedProp kind="raft" left={34 + scene.fraction * 27} height={20} bottom={11} className="campaign-scene-sailor">
      <Pal left={50} height={300} bottom={33} />
    </PaintedProp>
    <PaintedProp kind="tree" left={90} height={86} />
  </>;
}

function Train({ scene, slots }) {
  return <>
    {Array.from({length:22},(_,index)=><PaintedProp key={index} kind="scene-track" left={8+index*3.8} height={12} bottom={7} />)}
    <div className={`campaign-scene-train${scene.fraction === 1 ? ' is-ready' : ''}`}>
      <img className="campaign-scene-engine" src={sceneArt['scene-engine'].source} alt="" />
      {Array.from({ length: Math.max(3, Math.min(9, scene.total)) }, (_, index) => <div key={index} className={`campaign-scene-carriage${index < scene.progress ? ' is-loaded' : ''}`} data-scene-piece={index} data-settled={index < scene.progress ? 'true' : 'false'}>
        <img src={sceneArt['scene-carriage'].source} alt="" /><span>{slots[index]?.filled ? slots[index].label : ''}</span>
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
    <Pieces scene={scene} count={5} start={44} span={20} kind="scene-workshop-piece" height={15} bottom={40} />
    {scene.accepted && <PaintedProp key={scene.key} kind="scene-workshop-piece" left={57} height={14} bottom={64} className="campaign-scene-fit-piece" />}
  </>;
}

function Garden({ scene }) {
  return <>
    <Pal left={17} height={74} />
    <PaintedProp kind="workbench" left={64} height={64} />
    <PaintedProp kind="basket" left={38} height={40} bottom={8} />
    <PaintedProp kind="tray" left={66} height={24} bottom={52} />
    <PaintedProp kind="scene-seedling" left={90} height={38} bottom={8} />
    <Pieces scene={scene} count={5} start={63} span={4} kind="scene-seeds" height={5} bottom={58} />
    {scene.accepted && <PaintedProp key={scene.key} kind="scene-seeds" left={38} height={10} bottom={25} className="campaign-scene-garden-piece" />}
  </>;
}

function Lanterns({ scene }) {
  return <>
    <PaintedProp kind="tree" left={84} height={96} bottom={4} />
    <PaintedProp kind="hedge" left={46} height={35} bottom={9} />
    <Pal left={19 + scene.fraction * 25} height={73} className="campaign-scene-searcher" />
    <PaintedProp kind="lantern" left={29 + scene.fraction * 25} height={29} bottom={33} className="campaign-scene-searcher" />
    <div className="campaign-scene-lantern-beam" style={{ opacity: scene.progress ? .7 : .18, left: `${34 + scene.fraction * 25}%` }} />
    <Pieces scene={scene} count={5} start={52} span={25} kind="scene-star" height={10} bottom={20} />
  </>;
}

function Story({ scene, residentId }) {
  return <>
    <PaintedProp kind="door" left={76} height={90} bottom={8} />
    <Pal left={19 + scene.fraction * 40} height={72} className="campaign-scene-helper" />
    <Pal id={residentId || 'woolly'} left={84} height={58} bottom={11} />
    <Pieces scene={scene} count={4} start={33} span={27} height={6} />
  </>;
}

export default function CampaignActivityScene({ beat, state = {}, feedback = null, reducedMotion = false }) {
  const sceneRef = useRef(null), heldAnimations = useRef(new Set());
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
    update(); document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [scene.paused, scene.key]);
  const family = beat?.familyId, residentId = missionResidents.get(beat?.missionId);
  const landscape = family === 'lantern-search' ? 'night' : ['sound-steps', 'rescue-bridge', 'river-route'].includes(family) ? 'river' : 'day';
  const scenes = {
    'sound-steps': <Stones scene={scene} />, 'word-pop': <Bubbles scene={scene} />,
    'rescue-bridge': <Bridge scene={scene} />, 'tree-rescue': <TreeRescue scene={scene} residentId={residentId} />,
    'pals-post': <Post scene={scene} />, 'sound-herd': <Baskets scene={scene} />,
    'river-route': <River scene={scene} />, 'sentence-express': <Train scene={scene} slots={campaignSlots(beat, state)} />,
    'fix-it-workshop': <Workshop scene={scene} />, 'garden-kitchen': <Garden scene={scene} />,
    'lantern-search': <Lanterns scene={scene} />, 'story-rescue': <Story scene={scene} residentId={residentId} />
  };
  if (!scenes[family]) return null;
  return <div ref={sceneRef} className="rounded-family-scene campaign-activity-scene" aria-hidden="true"
    data-family={family} data-motion={scene.accepted ? 'accepted' : 'idle'} data-scene-progress={scene.progress} data-scene-total={scene.total}
    data-paused={scene.paused ? 'true' : 'false'} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
    <img className="campaign-scene-landscape" src={`/game-assets/sound-seekers/question-art/landscape-${landscape}.webp`} alt="" />
    {scenes[family]}
  </div>;
}
