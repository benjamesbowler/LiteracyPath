import { canWalk } from '../rules.js';

export const CHAPTER_ROADS = [
  [[1,22],[1,18],[-3,12],[-12,7],[-9,3],[-5,1],[3,2],[10,0],[10,-4],[9,-10],[1,-13],[-11,-20],[-10,-26],[1,-31],[6,-33]],
  [[-12,7],[-18,10],[-17,14],[-9,16],[-3,12]],
  [[10,0],[17,3],[19,7]],
  [[-11,-20],[-18,-24],[-14,-28],[-7,-27],[1,-31]],
  [[1,-13],[8,-16],[16,-23],[20,-27],[15,-29],[8,-27],[1,-31]],
];
export function clearSegment(a, b, stage, obstacles) {
  const steps = Math.ceil(Math.hypot(a.x-b.x,a.z-b.z) / .18);
  for (let i=0;i<=steps;i++) { const f=steps?i/steps:0; if (!canWalk(a.x+(b.x-a.x)*f,a.z+(b.z-a.z)*f,stage,obstacles)) return false; }
  return true;
}
// A bounded walking grid also handles children starting away from the paths.
// Every diagonal is checked against the same collision rules as manual input.
export function walkingRoute(start, goal, stage, obstacles = []) {
  const step=.5, key=(x,z)=>x+','+z, startNode={x:Math.round(start.x/step),z:Math.round(start.z/step)};
  const queue=[startNode], seen=new Map([[key(startNode.x,startNode.z),null]]);
  const point=n=>({x:n.x*step,z:n.z*step});
  let end=null;
  for(let head=0;head<queue.length;head++) {
    const n=queue[head], p=point(n);
    if(Math.hypot(p.x-goal.x,p.z-goal.z)<1 && clearSegment(p,goal,stage,obstacles)){end=n;break;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const next={x:n.x+dx,z:n.z+dz}, id=key(next.x,next.z);
      if(seen.has(id)||!clearSegment(p,point(next),stage,obstacles))continue;
      seen.set(id,n);queue.push(next);
    }
  }
  if(!end)return [];
  const points=[goal];
  while(end){points.push(point(end));end=seen.get(key(end.x,end.z));}
  points.push(start);points.reverse();
  const simple=[];let anchor=0;
  while(anchor<points.length-1){let next=anchor+1;while(next+1<points.length&&clearSegment(points[anchor],points[next+1],stage,obstacles))next++;simple.push(points[next]);anchor=next;}
  return simple;
}
export function guideRoute(start, goal, stage, obstacles=[]) {
  const nodes=[], index=new Map(), edges=[];
  function node(x,z){const id=x+','+z;if(index.has(id))return index.get(id);const i=nodes.length;index.set(id,i);nodes.push({x,z});edges.push([]);return i;}
  function link(a,b){if(clearSegment(nodes[a],nodes[b],stage,obstacles)){const cost=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].z-nodes[b].z);edges[a].push([b,cost]);edges[b].push([a,cost]);}}
  for(const road of CHAPTER_ROADS)for(let i=1;i<road.length;i++)link(node(...road[i-1]),node(...road[i]));
  const s=node(start.x,start.z),g=node(goal.x,goal.z);
  for(const n of [s,g])nodes.map((p,i)=>({i,d:Math.hypot(p.x-nodes[n].x,p.z-nodes[n].z)})).filter(p=>p.i!==n&&p.i!==s&&p.i!==g).sort((a,b)=>a.d-b.d).slice(0,5).forEach(p=>link(n,p.i));
  const distance=nodes.map(()=>Infinity),previous=[],done=new Set();distance[s]=0;
  while(done.size<nodes.length){let n=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(n<0||distance[i]<distance[n]))n=i;if(n<0||!Number.isFinite(distance[n]))break;if(n===g){const route=[];for(let i=g;i!==s;i=previous[i])route.unshift(nodes[i]);return route;}done.add(n);for(const [to,cost] of edges[n])if(distance[n]+cost<distance[to]){distance[to]=distance[n]+cost;previous[to]=n;}}
  return walkingRoute(start,goal,stage,obstacles);
}
