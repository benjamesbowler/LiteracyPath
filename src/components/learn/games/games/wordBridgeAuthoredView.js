import { createRegisteredPalArtBank, registeredPalCanvasPose } from '../shared/registeredPalArt.js';
import { wordBridgeCharacterPose, wordBridgeCarriedSurface } from './wordBridgePose.js';
import { wordBridgeSceneryPose } from './wordBridgeSceneryPose.js';
import { wordBridgeRecoveryAtlas,wordBridgeRecoveryPose,wordBridgeSingleHandSurface } from './wordBridgeRecoveryArt.js';

export function createWordBridgeAuthoredView({ characters, scenery, horizons, world }) {
  const horizon = horizons[world], horizonAtlas = { runtime: horizon, width: 1672, height: 941, pixelsPerUnit: 941 / 2.2, nominalHeight: 2.2,
    frames: [{ id: 'river-vista', cell: [0, 0, 1672, 941], anchor: [836, 470.5], sockets: {} }] };
  const atlases = { ...characters, ...scenery, ...(horizon ? { horizon: horizonAtlas } : {}) };
  const bank = createRegisteredPalArtBank(atlases), hero = { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' }[world] || 'bouncy';
  const selectedIds = Object.keys(characters).filter(key => key.startsWith(hero));
  const recoveryAtlas=wordBridgeRecoveryAtlas(hero),recoveryBank=createRegisteredPalArtBank({carry:recoveryAtlas});
  const kitKey = `${world}-construction-kit`;
  let disposed = false, contact = null;
  const findProp = action => {
    const atlas = scenery[kitKey], index = atlas?.frames.findIndex(frame => frame.action === action) ?? -1;
    return index < 0 ? null : { atlas, index, frame: atlas.frames[index] };
  };
  const propAspect = action => {
    const selected = findProp(action);
    if (disposed || !selected || bank.delivery()[kitKey] !== 'delivered') return null;
    return (selected.frame.cell[2] - selected.frame.cell[0]) / (selected.frame.cell[3] - selected.frame.cell[1]);
  };
  const api = {
    ready: bank.preload([...selectedIds, ...(scenery[kitKey] ? [kitKey] : []), ...(horizon ? ['horizon'] : [])]).then(async images=>{
      if(!disposed&&selectedIds.some(id=>bank.delivery()[id]==='unavailable'))await recoveryBank.preload(['carry']);
      return images;
    }),
    propAspect,
    drawBackground(ctx, width, height, camera = 0) {
      if (disposed || !horizon) return false;
      const scale = Math.max(width / 1672, height / 941), extra = Math.max(0, 1672 * scale - width);
      return bank.draw(ctx, 'horizon', 0, { x: width / 2 - Math.min(extra / 2, camera * .025), y: height / 2,
        unitScale: scale * horizonAtlas.pixelsPerUnit });
    },
    drawProp(ctx, action, { x, y, width, height }) {
      const selected = findProp(action);
      if (disposed || !selected || bank.delivery()[kitKey] !== 'delivered') return false;
      const base = registeredPalCanvasPose(selected.atlas, selected.frame, { x: 0, y: 0, unitScale: 1 });
      const sx = width / base.destination.width, sy = height ? height / base.destination.height : sx;
      const scale = Math.min(sx, sy);
      ctx.save(); ctx.translate(x + width / 2, y + (height || base.destination.height * scale) / 2); ctx.scale(scale, scale);
      const drawn = bank.draw(ctx, kitKey, selected.index, { x: -base.destination.x - base.destination.width / 2,
        y: -base.destination.y - base.destination.height / 2, unitScale: 1 });
      ctx.restore(); return drawn;
    },
    drawAnchoredProp(ctx, action, placement) {
      const selected = findProp(action);
      if (disposed || !selected || bank.delivery()[kitKey] !== 'delivered') return false;
      const attached = wordBridgeSceneryPose(selected.atlas, selected.frame, placement);
      return attached ? bank.draw(ctx, kitKey, selected.index, attached.placement) : false;
    },
    drawHero(ctx, { x, footY, height, time, moving, carrying, reaching, celebrating, mirror }, drawHeld) {
      const selected = wordBridgeCharacterPose(characters, { world, x, y: footY, height, time, moving, carrying: Boolean(carrying), reaching, celebrating, mirror });
      if(disposed){contact=null;return false;}
      const aspectRatio = propAspect('plank');
      if(!selected||bank.delivery()[selected.atlasKey]!=='delivered'){
        const retained=wordBridgeRecoveryPose(recoveryAtlas,{x,y:footY,height,mirror});
        if(recoveryBank.delivery().carry!=='delivered'||!retained){contact=null;return false;}
        const surface=carrying?wordBridgeSingleHandSurface(retained.pose,{width:carrying.w,height:carrying.h,aspectRatio,facing:mirror?-1:1}):null;
        if(carrying&&!surface){contact=null;return false;}
        const shown=surface?drawHeld(surface,carrying):null;
        recoveryBank.draw(ctx,'carry',retained.index,{x,y:footY,height});
        contact={action:'retained-static-carry',representation:'retained-canonical-tools-recovery',feet:structuredClone(retained.pose.sockets.feet),soleBaseline:footY,
          sockets:structuredClone(retained.pose.sockets),handSurface:surface?structuredClone(surface):null,
          surface:shown?.surface?structuredClone(shown.surface):surface?structuredClone(surface):null,
          attachedToMeasuredPalms:shown?.attachedToMeasuredPalms??Boolean(surface),physicalId:carrying?.physicalId??null,delivery:'delivered'};
        return true;
      }
      const surface = carrying ? wordBridgeCarriedSurface(selected.pose, { width: carrying.w, height: carrying.h, aspectRatio }) : null;
      if (carrying && !surface) { contact = null; return false; }
      const shown=surface?drawHeld(surface, carrying):null;
      const index = characters[selected.atlasKey].frames.indexOf(selected.frame);
      bank.draw(ctx, selected.atlasKey, index, { x, y: footY, height, mirror });
      contact = { action: selected.action, feet: structuredClone(selected.pose.sockets.feet), soleBaseline: footY, sockets: structuredClone(selected.pose.sockets),
        handSurface:surface?structuredClone(surface):null,surface:shown?.surface?structuredClone(shown.surface):surface?structuredClone(surface):null,
        attachedToMeasuredPalms:shown?.attachedToMeasuredPalms??Boolean(surface),physicalId:carrying?.physicalId??null,delivery: 'delivered' };
      return true;
    },
    inspect: () => ({ delivery: bank.delivery(),recovery:{representation:'retained-canonical-tools-recovery',delivery:recoveryBank.delivery()}, contact: contact ? structuredClone(contact) : null, disposed }),
    dispose() { disposed = true; contact = null; bank.dispose();recoveryBank.dispose(); }
  };
  return api;
}
