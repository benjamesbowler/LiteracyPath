import sharp from 'sharp';

export async function pictureColourStats(bytes){
 const {data,info}=await sharp(bytes).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 let chromaticPixels=0;
 for(let i=0;i<data.length;i+=info.channels){
  if(Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])>8)chromaticPixels++;
 }
 const pixels=info.width*info.height;
 return {pixels,chromaticPixels,chromaticRatio:chromaticPixels/pixels,blackAndWhite:chromaticPixels/pixels<=0.0005};
}
