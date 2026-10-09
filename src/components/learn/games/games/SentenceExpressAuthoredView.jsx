import { arcadePixelRatio } from '../shared/arcadeRenderBudget.js';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { createRegisteredPalArtBank } from '../shared/registeredPalArt.js';
import { drawPhysicalPalFallback } from '../shared/physicalPalFallback.js';
import { sentenceExpressConductorAction, sentenceExpressConductorFrame, sentenceExpressCouplingPose } from './sentenceExpressConductorPose.js';
import { measureSentenceExpressRail } from './sentenceExpressRailGeometry.js';

const heroes = { meadow: 'bouncy-conductor', dino: 'chompy-conductor', moonwood: 'pip-conductor' };
const stops = { meadow: 'meadow-stops', dino: 'dino-stops', moonwood: 'moonwood-stops' };

// The train and all choices remain native DOM controls. This view paints the
// independently owned railway layers and actual conductor/tool contact around
// that unchanged rail. It never receives an expected sentence or answer.
export default function SentenceExpressAuthoredView({ stageRef, world, atlases, yards, state, inspectRef, onDelivery }) {
  const backdropRef = useRef(null), actorRef = useRef(null), stateRef = useRef(state), deliveryRef = useRef(onDelivery);
  useLayoutEffect(() => { stateRef.current = state; deliveryRef.current = onDelivery; }, [state, onDelivery]);
  useEffect(() => {
    const stage = stageRef.current, backdrop = backdropRef.current, actor = actorRef.current;
    const yard = yards?.[world], hero = heroes[world], stop = stops[world];
    if (!stage || !backdrop || !actor || !yard || !atlases?.[hero] || !atlases?.[stop]) return undefined;
    const yardKey = `${world}-yard`, yardAtlas = { runtime: yard.runtime, width: yard.width, height: yard.height,
      pixelsPerUnit: 1, nominalHeight: yard.height, frames: [{ cell: [0, 0, yard.width, yard.height], anchor: [0, 0], sockets: {} }] };
    const bank = createRegisteredPalArtBank({ [hero]: atlases[hero], [stop]: atlases[stop], [yardKey]: yardAtlas });
    const backContext = backdrop.getContext('2d'), actorContext = actor.getContext('2d');
    if (!backContext || !actorContext) { bank.dispose(); return undefined; }
    let alive = true, frame = 0, width = 0, height = 0, previousAt = performance.now(), clock = 0;
    let backgroundKey = '', snapshot = null;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const publication = () => {
      if (!alive) return;
      const delivery = bank.delivery();
      deliveryRef.current?.({ yard: delivery[yardKey], conductor: delivery[hero], stops: delivery[stop] });
    };
    bank.preload().then(publication);
    const resize = (nextWidth, nextHeight) => {
      if (width === nextWidth && height === nextHeight) return;
      width = nextWidth; height = nextHeight;
      const ratio = arcadePixelRatio(2, width, height);
      for (const canvas of [backdrop, actor]) {
        canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
        canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
        canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      backgroundKey = '';
    };
    const tick = at => {
      if (!alive) return;
      const current = stateRef.current, rail = measureSentenceExpressRail(stage);
      const paused = Boolean(current?.isPaused?.()), dt = Math.max(0, (at - previousAt) / 1000);
      previousAt = at;
      if (!paused) clock += dt;
      if (rail?.width && rail.height) {
        resize(rail.width, rail.height);
        const delivery = bank.delivery(), journey = motion.matches ? 0 : Math.max(0, Math.min(1, current.journey || 0));
        const sceneKey = `${width}:${height}:${rail.railY}:${journey.toFixed(4)}:${current.stopIndex}:${delivery[yardKey]}:${delivery[stop]}`;
        if (sceneKey !== backgroundKey) {
          backgroundKey = sceneKey; backContext.clearRect(0, 0, width, height);
          const landscapeHeight = Math.max(120, Math.min(height, rail.railY + 30));
          const landscapeWidth = Math.max(width * 1.18, landscapeHeight * yard.width / yard.height);
          const landscapeScale = landscapeWidth / yard.width;
          bank.draw(backContext, yardKey, 0, {
            x: -(landscapeWidth - width) * (.28 + journey * .44), y: rail.railY - landscapeScale * yard.height * .79,
            unitScale: landscapeScale
          });
          const stopHeight = Math.max(80, Math.min(210, rail.railY - 70));
          const sourceStop = Math.floor(current.stopIndex || 0) % atlases[stop].frames.length;
          bank.draw(backContext, stop, sourceStop, { x: width * .23 - journey * width * 1.05,
            y: rail.railY - 18, height: stopHeight });
          if (current.phase === 'depart') bank.draw(backContext, stop, (sourceStop + 1) % atlases[stop].frames.length,
            { x: width * 1.22 - journey * width * 1.02, y: rail.railY - 18, height: stopHeight });
        }
        actorContext.clearRect(0, 0, width, height);
        const action = sentenceExpressConductorAction({ departing: current.phase === 'depart',
          recovering: current.recovering, coupling: current.coupling,
          needsEngine: current.needsEngine, canSend: current.canSend });
        const selected = sentenceExpressConductorFrame(atlases, world, action);
        const contact = action === 'couple-low' && rail.visible && rail.contact
          ? sentenceExpressCouplingPose(atlases, world, { coupler: rail.contact.rightCoupler,
            railY: rail.railY, mirror: true }) : null;
        const figureHeight = Math.max(78, Math.min(132, rail.railY - 80));
        const placement = contact?.placement || { x: Math.max(52, Math.min(width - 54, rail.contact?.rightCoupler.x + 52 || width * .82)),
          y: rail.railY, height: figureHeight, mirror: true };
        const delivered = selected && bank.draw(actorContext, selected.key, selected.index, placement);
        if (!delivered && delivery[hero] === 'unavailable') drawPhysicalPalFallback(actorContext,
          { world, x: placement.x, y: placement.y, height: figureHeight, direction: 'left', time: clock,
            moving: false, action: action === 'recover' ? 'recover' : 'idle' });
        snapshot = { world, clock, paused, reducedMotion: motion.matches, action,
          art: { yard: delivery[yardKey], conductor: delivery[hero], stops: delivery[stop] },
          rail: structuredClone(rail), conductor: selected ? {
            action, height: contact?.height || figureHeight, placement: { ...placement },
            pose: structuredClone(contact?.pose || bank.pose(selected.key, selected.index, placement)),
            representation: delivered ? 'original-registered-art' : delivery[hero] === 'unavailable'
              ? 'procedural-art-unavailable' : 'pending',
            contact: contact && delivered ? structuredClone(contact.contact) : null
          } : null };
      }
      frame = requestAnimationFrame(tick);
    };
    inspectRef.current = () => snapshot ? structuredClone(snapshot) : null;
    frame = requestAnimationFrame(tick);
    return () => {
      alive = false; cancelAnimationFrame(frame); bank.dispose(); inspectRef.current = () => null;
      for (const canvas of [backdrop, actor]) { canvas.width = 1; canvas.height = 1; }
    };
  }, [atlases, yards, world, stageRef, inspectRef]);
  return <>
    <canvas className="sx-authored-landscape" ref={backdropRef} aria-hidden="true" />
    <canvas className="sx-authored-conductor" ref={actorRef} aria-hidden="true" />
  </>;
}
