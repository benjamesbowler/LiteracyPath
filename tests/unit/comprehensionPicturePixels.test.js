import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {pictureColourStats} from '../../tools/comprehensionPicturePixels.mjs';

test('colouring illustrations accept neutral black-white-grey and reject a pink paint fill',async()=>{
 const grey=await sharp({create:{width:32,height:32,channels:3,background:{r:128,g:128,b:128}}}).png().toBuffer();
 assert.equal((await pictureColourStats(grey)).blackAndWhite,true);
 const pink=await sharp({create:{width:8,height:8,channels:3,background:{r:255,g:190,b:200}}}).png().toBuffer();
 const coloured=await sharp(grey).composite([{input:pink,left:12,top:12}]).png().toBuffer();
 const result=await pictureColourStats(coloured);
 assert.equal(result.blackAndWhite,false);
 assert.ok(result.chromaticRatio>0.05);
});
