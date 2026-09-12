// Overworld simulation: navigation never writes literacy evidence.
import { getCampaignHubLayout } from '../content/campaignLayouts.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const EXPLORER_RADIUS=23;
export const createExplorationLayout=stage=>getCampaignHubLayout(stage.id);

export function explorationBlocked(l,x,y,{shortcut=false,jumping=false}={}){
  const r=EXPLORER_RADIUS;
  if(x<r||y<180||x>l.width-r||y>l.height-90)return true;
  if(x+r>l.riverX&&x-r<l.riverX+l.riverWidth&&!l.bridges.some(b=>(!b.shortcut||shortcut)&&y-r>=b.y&&y+r<=b.y+b.height))return true;
  return l.blockers.some(b=>!(jumping&&b.jumpable)&&x+r>b.x&&x-r<b.x+b.width&&y+r>b.y&&y-r<b.y+b.height);
}
export function createExplorer(layout,saved){
  const s={...layout.spawn,vx:0,vy:0,facing:1,jumpTime:0,shortcut:Boolean(saved?.shortcut),discovered:Boolean(saved?.discovered),input:{left:false,right:false,up:false,down:false},path:[]};
  if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)&&!explorationBlocked(layout,saved.x,saved.y,s)){s.x=saved.x;s.y=saved.y;}return s;
}
export function releaseExplorer(s){for(const k of Object.keys(s.input))s.input[k]=false;s.path=[];s.vx=0;s.vy=0;s.jumpHeld=false;}
export function setExplorerInput(s,k,v){if(k==='jump'){if(v&&!s.jumpHeld&&s.jumpTime<=0)s.jumpTime=.55;s.jumpHeld=v;return;}if(k in s.input){s.input[k]=Boolean(v);if(v)s.path=[];}}
export function advanceExplorer(s,l,seconds){
  const total=clamp(Number.isFinite(seconds)?seconds:0,0,.1),steps=Math.max(1,Math.ceil(total*120)),dt=total/steps;
  for(let i=0;i<steps;i++){
    s.jumpTime=Math.max(0,s.jumpTime-dt);
    let dx=Number(s.input.right)-Number(s.input.left),dy=Number(s.input.down)-Number(s.input.up);
    if((dx||dy)&&s.heading){const x=dx;dx=x*Math.cos(s.heading)+dy*Math.sin(s.heading);dy=-x*Math.sin(s.heading)+dy*Math.cos(s.heading);}
    if(s.path.length&&!dx&&!dy){const p=s.path[0],d=Math.hypot(p.x-s.x,p.y-s.y);if(d<7)s.path.shift();else{dx=(p.x-s.x)/d;dy=(p.y-s.y)/d;}}
    const mag=Math.hypot(dx,dy)||1,k=1-Math.exp(-18*dt);s.vx+=(dx/mag*330-s.vx)*k;s.vy+=(dy/mag*330-s.vy)*k;
    const options={shortcut:s.shortcut,jumping:s.jumpTime>.08};
    if(!explorationBlocked(l,s.x+s.vx*dt,s.y,options))s.x+=s.vx*dt;else s.vx=0;
    if(!explorationBlocked(l,s.x,s.y+s.vy*dt,options))s.y+=s.vy*dt;else s.vy=0;
    if(Math.abs(s.vx)>5)s.facing=Math.sign(s.vx);
    if(!s.jumpTime&&explorationBlocked(l,s.x,s.y,options)){const log=l.blockers.find(b=>b.jumpable&&s.x>b.x-23&&s.x<b.x+b.width+23&&s.y>b.y-23&&s.y<b.y+b.height+23);if(log)s.y=s.y<log.y+log.height/2?log.y-23:log.y+log.height+23;}
  }
}
// Bounded four-neighbour search follows terrain for pointer and motor assistance.
export function findExplorationPath(l,from,to,options={}){
  const size=50,cols=Math.ceil(l.width/size),rows=Math.ceil(l.height/size),point=id=>({x:id%cols*size+size/2,y:Math.floor(id/cols)*size+size/2});
  const cell=p=>clamp(Math.floor(p.y/size),0,rows-1)*cols+clamp(Math.floor(p.x/size),0,cols-1);
  const free=id=>{const p=point(id);return !explorationBlocked(l,p.x,p.y,options);};
  const nearest=p=>{let best=-1,distance=Infinity;for(let id=0;id<cols*rows;id++)if(free(id)){const q=point(id),d=Math.hypot(p.x-q.x,p.y-q.y);if(d<distance){distance=d;best=id;}}return best;};
  const start=free(cell(from))?cell(from):nearest(from),end=free(cell(to))?cell(to):nearest(to),queue=[start],previous=new Map([[start,null]]);
  for(let n=0;n<queue.length;n++){const id=queue[n];if(id===end)break;const x=id%cols,y=Math.floor(id/cols);for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const next=ny*cols+nx;if(nx<0||ny<0||nx>=cols||ny>=rows||previous.has(next)||!free(next))continue;previous.set(next,id);queue.push(next);}}
  if(!previous.has(end))return [];const path=[];for(let id=end;id!==null;id=previous.get(id))path.unshift(point(id));
  if(!explorationBlocked(l,to.x,to.y,options))path.push({x:to.x,y:to.y});return path;
}
export const explorerSnapshot=s=>({x:s.x,y:s.y,facing:s.facing,shortcut:s.shortcut,discovered:s.discovered});
