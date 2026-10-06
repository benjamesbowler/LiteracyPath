import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {validateSportsSharpMetadata} from '../../src/components/learn/games/games/sportsSharpArt.js';
import {buildSportsSharpArtRegistry} from '../../tools/generateSportsSharpArtRegistry.mjs';

// Source/delivery integrity and actual opaque/contact registration, separate
// from native gameplay, animation likeness and device performance proof.
sharp.concurrency(1);
const root=new URL('../../',import.meta.url),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>fs.readFileSync(new URL(file,root));
const registry=buildSportsSharpArtRegistry();
for(const kind of ['driver','skater'])for(const [world,character]of [['meadow','bouncy'],['dino','chompy'],['moonwood','pip']]){
  test(`${kind} ${world} delivers all eight sharp original camera views with complete native phases and evaluated contacts`,async()=>{
    const game=kind==='driver'?'sound-racer':'spell-skate',actor=kind==='driver'?'kart':'skater';
    const modelHash=hash(read(`public/game-assets/${game}/models/${character}-${actor}-v2.glb`));
    const editableHash=hash(read(`source-art/arcade/${game}-3d/${character}-${actor}-v2.blend`));
    let deliveredBytes=0;
    for(let view=0;view<8;view++){
      const sourceFolder=`source-art/arcade/${game}-3d/recovery384/${character}/view-${view}`;
      const source=JSON.parse(read(`${sourceFolder}/view-${view}-sheet-v2.json`));
      const registered=registry[kind][world][view];
      const runtime=JSON.parse(read(`public${registered.metadata}`));
      assert.ok(validateSportsSharpMetadata(runtime,{kind,world,view,registered}),`${world}/${kind}/${view} actual runtime metadata`);
      assert.equal(source.modelSha256,modelHash);assert.equal(source.editableSha256,editableHash);
      assert.equal(source.recipeSha256,hash(read(source.sourceRecipe)),'exact native render source remains retained');
      assert.equal(source.packingRecipeSha256,hash(read(source.packingRecipe)));
      const webp=read(`public${runtime.runtime}`),png=read(source.sourceSheet);
      assert.equal(hash(webp),runtime.runtimeSha256);assert.equal(webp.length,runtime.runtimeBytes);
      assert.equal(source.runtimeSha256,runtime.runtimeSha256);assert.equal(hash(png),source.sourceSheetSha256);
      const pixels=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      const decoded=await sharp(webp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      assert.deepEqual([decoded.info.width,decoded.info.height],source.viewSheet);assert.equal(decoded.info.size,source.decodedBytes);
      let hasClear=false,hasOpaque=false;for(let i=3;i<decoded.data.length;i+=4){hasClear ||= decoded.data[i]===0;hasOpaque ||= decoded.data[i]===255;}
      assert.ok(hasClear&&hasOpaque,'true alpha and complete opaque actor content');
      assert.deepEqual(runtime.frames,source.frames);
      for(const frame of source.frames){
        assert.equal(hash(read(`${sourceFolder}/frames/${frame.source}`)),frame.sha256);
        const [left,top,right,bottom]=frame.opaqueBounds;
        assert.ok(left>=2&&top>=2&&right<=382&&bottom<=382&&right>left&&bottom>top,`${world}/${kind}/${view}/${frame.state}/${frame.phase} full body is uncropped`);
        assert.equal(frame.contactWorld.tyres.length,4);assert.equal(frame.contactWorld.soles.length,2);
        for(const point of [...frame.contactWorld.tyres,...frame.contactWorld.soles])assert.ok(point.length===3&&point.every(Number.isFinite));
        for(const point of frame.contactWorld.tyres)assert.ok(Math.abs(point[2])<(kind==='driver'?.035:.012),'actual ground tyre registration');
        const projected=[...frame.tyreContacts,...(frame.soleContacts||frame.pedalSoles),...(kind==='skater'?frame.palmAnchors:[])];
        assert.equal(projected.length,kind==='skater'?8:6);
        if(kind==='skater'){assert.equal(frame.contactWorld.palms.length,2);for(const point of frame.contactWorld.palms)assert.ok(point.length===3&&point.every(Number.isFinite));}
        const [sx,sy]=frame.cell;
        for(const [x,y]of projected){
          assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<384&&y>=0&&y<384);
          let opaque=false;
          // The original3px256 registration tolerance scales to5px at384.
          for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
            const px=sx+Math.round(x)+dx,py=sy+Math.round(y)+dy;
            if(px<sx||px>=sx+384||py<sy||py>=sy+384)continue;
            if(pixels.data[(py*pixels.info.width+px)*4+3]>0)opaque=true;
          }
          assert.ok(opaque,`${world}/${kind}/${view}/${frame.state}/${frame.phase}: projected evaluated contact reaches actual source silhouette`);
        }
      }
      deliveredBytes+=webp.length+read(`public${registered.metadata}`).length;
    }
    assert.ok(deliveredBytes>0);
  });
}
