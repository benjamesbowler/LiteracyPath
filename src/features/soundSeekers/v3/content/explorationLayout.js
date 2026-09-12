// Shared authored overworld geometry used by rendering, navigation and checks.
// Optional loops belong to the existing places. Their logs offer a jump across
// the shorter route; the outer trail always remains walkable without jumping.
// No exploration route creates a learning action or changes mission access.
const PLACE_ROUTES = {
  'oak-bath-corner':          ['grove', 440, 620, 560],
  'fern-shelter':             ['switchback', 450, 730, 680],
  'stone-wall-nest':          ['ridge', 430, 650, 460],
  'two-bank-pond':            ['bank', 480, 650, 1010],
  'bramble-picnic-gate':      ['grove', 460, 640, 610],
  'bluff-basket-hoist':       ['ridge', 450, 660, 480],
  'lily-ferry-moorings':      ['bank', 460, 620, 1090],
  'fishpool-picnic-tables':   ['bank', 470, 680, 920],
  'wheelhouse-ladder':       ['switchback', 440, 750, 760],
  'weir-gathering-signals':   ['ridge', 460, 690, 1170],
  'amber-ridge-signs':       ['ridge', 440, 650, 490],
  'cozy-stone-shelter':      ['grove', 450, 670, 620],
  'split-path-parcels':      ['switchback', 460, 740, 790],
  'fern-counterweight-crossing': ['bank', 490, 660, 1070],
  'claw-pass-drawbridge':    ['ridge', 470, 680, 530],
  'wooden-signal-arms':      ['switchback', 430, 720, 850],
  'stone-supply-bays':       ['ridge', 460, 640, 600],
  'wooden-sign-workshop':    ['grove', 470, 650, 710],
  'handcart-convoy-yard':    ['switchback', 470, 760, 970],
  'valley-two-span-crossing': ['bank', 480, 690, 1140],
  'reed-floating-landing':   ['bank', 450, 640, 960],
  'mica-illuminated-stair':   ['ridge', 480, 670, 510],
  'fen-reflected-forks':     ['switchback', 480, 740, 870],
  'shell-shore-workbench':   ['bank', 490, 680, 1040],
  'harbour-lighthouse-piers': ['ridge', 490, 660, 580],
  'garden-root-walkway':    ['grove', 430, 640, 690],
  'stone-wide-forest-route': ['switchback', 490, 750, 830],
  'observatory-dome-stair':  ['ridge', 470, 630, 470],
  'aster-message-archive':   ['grove', 480, 660, 730],
  'three-community-skybridge': ['bank', 470, 670, 1120]
};

const segments = points => points.slice(1).map((point, index) => [points[index], point]);

function addPlaceRoutes({ paths, blockers, nodes, riverX, width, landmark, secret }, place) {
  const route=PLACE_ROUTES[place.landmark];
  if(!route)throw new Error(`Missing exploration routes for ${place.landmark}`);
  const [shape,x,logY,nookY]=route;
  const start=[x,850],north=[950,350];
  const upper=shape==='switchback' ? [[x,640],[240,500],[480,290],[790,350]]
    : shape==='ridge' ? [[x,490],[610,260],[790,280]]
      : shape==='bank' ? [[x,540],[370,360],[800,280]]
        : [[x,470],[650,350]];
  paths.push(...segments([[270,850],start,...upper,north]));
  blockers.push({id:'north-trail-log',kind:'log',x:x-70,y:logY,width:140,height:32,jumpable:true});
  // The detour rejoins above the log. It stays left of the grove and leaves
  // enough room for the same 50px navigation grid used by motor assistance.
  paths.push(...segments([[x,logY+110],[x-150,logY+110],[x-150,logY-100],[x,logY-100]]));

  // A bank-side branch reveals the repaired landmark without requiring a trip
  // around the outside of the entire eastern grove.
  const bankX=riverX+255;
  paths.push(...segments([[bankX,350],[bankX,950],[landmark.x,950],[landmark.x,1330]]));
  if(shape==='bank'||shape==='ridge'){
    blockers.push({id:'bank-trail-log',kind:'log',x:bankX-65,y:580,width:130,height:32,jumpable:true});
  }

  // The existing picnic nook is reached from two directions, framing a view of
  // the land. Its location varies with the place instead of repeating one corner.
  secret.y=nookY;
  paths.push(...segments([[width-350,nookY-140],[secret.x,nookY-140],[secret.x,nookY],[width-350,nookY+140]]));

  // Mission nodes retain their coordinates. These small spurs make each visible
  // entrance part of the painted, navigable network rather than isolated grass.
  paths.push(...segments([[790,350],[nodes[1].x,nodes[1].y]]));
  paths.push(...segments([[nodes[2].x,350],[nodes[2].x,nodes[2].y]]));
  paths.push(...segments([[width-350,nodes[3].y],[nodes[3].x,nodes[3].y]]));
  paths.push(...segments([[nodes[4].x,1330],[nodes[4].x,nodes[4].y]]));
  paths.push(...segments([[nodes[5].x,1330],[nodes[5].x,nodes[5].y]]));
  paths.push(...segments([[nodes[6].x,350],[nodes[6].x,nodes[6].y]]));
}

export function buildExplorationLayout(stage, place){
  const n=Number(stage.id.split('-').at(-1))-1,shift=n%5*35;
  const width=2400+n%3*100,height=1650,riverX=1125+shift,riverWidth=150;
  const bridges=[350,820,1330].map((y,i)=>({id:`crossing-${i}`,x:riverX-25,y:y-85,width:riverWidth+50,height:170,shortcut:i===1}));
  const nodes=[[560,850],[790,380+shift],[riverX+420,400],[width-450,1120-shift],[riverX+460,1350],[430+shift,1320],[width-350,320+shift]].map(([x,y],i)=>({id:[...stage.missionIds,...stage.optionalMissionIds][i],x,y}));
  const blockers=[{id:'grove-west',kind:'grove',x:580,y:570,width:260,height:190},{id:'grove-east',kind:'grove',x:riverX+320,y:650,width:310,height:220},{id:'ridge',kind:'rock',x:580+shift,y:1080,width:220,height:100},{id:'fallen-log',kind:'log',x:300,y:1040,width:180,height:32,jumpable:true}];
  const paths=[[[270,850],[950,850]],[[950,850],[950,350]],[[950,350],[width-350,350]],[[width-350,350],[width-350,1330]],[[width-350,1330],[330,1330]],[[330,1330],[270,850]],[[950,850],[riverX+270,850]],[[riverX+270,850],[riverX+270,1330]]];
  const landmark={x:riverX+490,y:960},secret={id:'hidden-nook',x:width-280,y:560};
  addPlaceRoutes({paths,blockers,nodes,riverX,width,landmark,secret},place);
  const dressing=[];
  const pathDistance=(x,y)=>Math.min(...paths.map(([a,b])=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);}));
  for(let i=0;i<75;i++){
    const x=(i*673)%(width+900)-450,y=(i*397)%(height+800)-400;
    if(pathDistance(x,y)<150||Math.abs(x-riverX-riverWidth/2)<180||nodes.some(n=>Math.hypot(n.x-x,n.y-y)<240)||Math.hypot(270-x,850-y)<480)continue;
    dressing.push({x,y,size:3.8+(i%5)*.5,rotation:i*2.4,bush:i%3===0});
    blockers.push({id:`tree-${i}`,kind:'trunk',x:x-13,y:y-13,width:26,height:26});
  }
  return {paths,dressing,stageId:stage.id,width,height,spawn:{x:270,y:850},riverX,riverWidth,bridges,nodes,blockers,camp:{x:240,y:850},landmark,switch:{id:'bridge-switch',x:riverX-145,y:820},secret,portal:{id:'next-land',x:width-150,y:1390},backdropKey:place.backdropKey};
}
