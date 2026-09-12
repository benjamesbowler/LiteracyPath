// Shared authored overworld geometry used by rendering, navigation and checks.
export function buildExplorationLayout(stage, place){
  const n=Number(stage.id.split('-').at(-1))-1,shift=n%5*35;
  const width=2400+n%3*100,height=1650,riverX=1125+shift,riverWidth=150;
  const bridges=[350,820,1330].map((y,i)=>({id:`crossing-${i}`,x:riverX-25,y:y-85,width:riverWidth+50,height:170,shortcut:i===1}));
  const nodes=[[560,850],[790,380+shift],[riverX+420,400],[width-450,1120-shift],[riverX+460,1350],[430+shift,1320],[width-350,320+shift]].map(([x,y],i)=>({id:[...stage.missionIds,...stage.optionalMissionIds][i],x,y}));
  const blockers=[{id:'grove-west',kind:'grove',x:580,y:570,width:260,height:190},{id:'grove-east',kind:'grove',x:riverX+320,y:650,width:310,height:220},{id:'ridge',kind:'rock',x:580+shift,y:1080,width:220,height:100},{id:'fallen-log',kind:'log',x:300,y:1040,width:180,height:32,jumpable:true}];
  const paths=[[[270,850],[950,850]],[[950,850],[950,350]],[[950,350],[width-350,350]],[[width-350,350],[width-350,1330]],[[width-350,1330],[330,1330]],[[330,1330],[270,850]],[[950,850],[riverX+270,850]],[[riverX+270,850],[riverX+270,1330]]];
  const dressing=[];
  const pathDistance=(x,y)=>Math.min(...paths.map(([a,b])=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);}));
  for(let i=0;i<75;i++){
    const x=(i*673)%(width+900)-450,y=(i*397)%(height+800)-400;
    if(pathDistance(x,y)<150||Math.abs(x-riverX-riverWidth/2)<180||nodes.some(n=>Math.hypot(n.x-x,n.y-y)<240)||Math.hypot(270-x,850-y)<480)continue;
    dressing.push({x,y,size:3.8+(i%5)*.5,rotation:i*2.4,bush:i%3===0});
    blockers.push({id:`tree-${i}`,kind:'trunk',x:x-13,y:y-13,width:26,height:26});
  }
  return {paths,dressing,stageId:stage.id,width,height,spawn:{x:270,y:850},riverX,riverWidth,bridges,nodes,blockers,camp:{x:240,y:850},landmark:{x:riverX+490,y:960},switch:{id:'bridge-switch',x:riverX-145,y:820},secret:{id:'hidden-nook',x:width-280,y:560},portal:{id:'next-land',x:width-150,y:1390},backdropKey:place.backdropKey};
}
