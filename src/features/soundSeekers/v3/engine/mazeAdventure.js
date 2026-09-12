// A connected maze with authored-size variants. All answer destinations are
// reachable; its generator never sees the challenge key or correct choice.
export const MAZE_CELL=150;
export function createActivityMaze(seedText,variant=0){
  const cols=9+variant%2*2,rows=7,grid=Array.from({length:rows},()=>Array(cols).fill(1));let seed=2166136261;
  for(const char of seedText)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
  const stack=[[1,1]];grid[1][1]=0;
  while(stack.length){const [x,y]=stack.at(-1),next=[[x+2,y],[x-2,y],[x,y+2],[x,y-2]].filter(([xx,yy])=>xx>0&&yy>0&&xx<cols-1&&yy<rows-1&&grid[yy][xx]);
    if(!next.length){stack.pop();continue;}const [xx,yy]=next[Math.floor(random()*next.length)];grid[(y+yy)/2][(x+xx)/2]=0;grid[yy][xx]=0;stack.push([xx,yy]);}
  // A small loop permits a different return route instead of forced backtracking.
  for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(grid[y][x]&&random()<.09&&((!grid[y][x-1]&&!grid[y][x+1])||(!grid[y-1][x]&&!grid[y+1][x])))grid[y][x]=0;
  const point=(x,y)=>({x:(x+.5)*MAZE_CELL,y:(y+.5)*MAZE_CELL}),spawn=point(1,1),spaces=[];
  for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(!grid[y][x]&&(x!==1||y!==1))spaces.push({...point(x,y),cellX:x,cellY:y});
  spaces.sort((a,b)=>Math.hypot(b.x-spawn.x,b.y-spawn.y)-Math.hypot(a.x-spawn.x,a.y-spawn.y));
  const destinations=[];for(const p of spaces)if(destinations.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>MAZE_CELL*1.7)){destinations.push(p);if(destinations.length===5)break;}
  return {grid,cols,rows,width:cols*MAZE_CELL,height:rows*MAZE_CELL,spawn,destinations,point};
}
export function mazeBlocked(maze,x,y,radius=23){
  return [[x-radius,y-radius],[x+radius,y-radius],[x-radius,y+radius],[x+radius,y+radius]].some(([xx,yy])=>maze.grid[Math.floor(yy/MAZE_CELL)]?.[Math.floor(xx/MAZE_CELL)]!==0);
}
export function mazePath(maze,from,to){
  const cell=p=>[Math.floor(p.x/MAZE_CELL),Math.floor(p.y/MAZE_CELL)],start=cell(from),end=cell(to),key=p=>p.join(','),queue=[start],prev=new Map([[key(start),null]]);
  for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===key(end))break;for(const q of [[p[0]+1,p[1]],[p[0]-1,p[1]],[p[0],p[1]+1],[p[0],p[1]-1]])if(maze.grid[q[1]]?.[q[0]]===0&&!prev.has(key(q))){prev.set(key(q),p);queue.push(q);}}
  if(!prev.has(key(end)))return [];const route=[];for(let p=end;p;p=prev.get(key(p)))route.unshift(maze.point(...p));route.push({x:to.x,y:to.y});return route;
}
export function advanceMazeWalker(player,maze,seconds){
  const total=Math.min(.1,Math.max(0,seconds)),steps=Math.max(1,Math.ceil(total*120)),dt=total/steps;
  for(let i=0;i<steps;i++){
    let x=Number(player.input.right)-Number(player.input.left),y=Number(player.input.down)-Number(player.input.up);
    if(!x&&!y){x=player.analogX||0;y=player.analogY||0;}
    if(player.path.length&&!x&&!y){const p=player.path[0],d=Math.hypot(p.x-player.x,p.y-player.y);if(d<8)player.path.shift();else{x=(p.x-player.x)/d;y=(p.y-player.y)/d;}}
    const length=Math.max(1,Math.hypot(x,y)),k=1-Math.exp(-22*dt),speed=player.sprint?410:300;player.vx+=(x/length*speed-player.vx)*k;player.vy+=(y/length*speed-player.vy)*k;
    if(!mazeBlocked(maze,player.x+player.vx*dt,player.y))player.x+=player.vx*dt;else player.vx=0;
    if(!mazeBlocked(maze,player.x,player.y+player.vy*dt))player.y+=player.vy*dt;else player.vy=0;
    if(Math.abs(player.vx)>4)player.facing=Math.sign(player.vx);
  }
}
