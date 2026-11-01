import { interpolateArcadeMotion } from '../shared/arcadeMotion.js';
const FIELDS=['x','y','vx','vy','anim','life'];
export function createWordBridgeMotion(){
  let previous=new WeakMap(),outputs=new WeakMap(),view=null;
  const camera={};
  return {
    reset(){previous=new WeakMap();outputs=new WeakMap();view=null;},
    capture(cameraX,sceneTime,actors){
      view={cameraX,sceneTime};
      for(const actor of actors){
        let sample=previous.get(actor);if(!sample){sample={};previous.set(actor,sample);}
        for(const key of FIELDS)sample[key]=actor[key];
      }
    },
    view(cameraX,sceneTime,alpha){return interpolateArcadeMotion(view,{cameraX,sceneTime},alpha,camera,['cameraX','sceneTime']);},
    actor(actor,alpha){
      let output=outputs.get(actor);if(!output){output={};outputs.set(actor,output);}
      Object.assign(output,actor);
      return interpolateArcadeMotion(previous.get(actor),actor,alpha,output,FIELDS);
    }
  };
}
