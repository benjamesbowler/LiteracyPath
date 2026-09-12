// World guidance reads mission availability only; it never sees answer keys.
export function visibleAdventureNodes(nodes,completed,isAvailable){
 return nodes.filter(node=>node.mission&&isAvailable(node.id)&&!completed[node.id]);
}
export function adventureResidents(nodes,heroId){
 const seen=new Set();
 return nodes.filter(node=>{const id=node.mission.residentId===heroId?node.mission.residentAlternateId:node.mission.residentId;if(seen.has(id))return false;seen.add(id);return true;});
}
export function adventureNavigation(nodes,stage,player,yaw){
 const node=nodes.find(n=>stage.missionIds.includes(n.id))||nodes[0];
 if(!node)return null;
 const dx=node.x-player.x,dy=node.y-player.y,distance=Math.hypot(dx,dy);
 const right=dx*Math.cos(yaw)-dy*Math.sin(yaw),forward=-dx*Math.sin(yaw)-dy*Math.cos(yaw);
 return {id:node.id,label:node.mission.title,optional:!stage.missionIds.includes(node.id),bearing:Math.round(Math.atan2(right,forward)*180/Math.PI/5)*5,distance:Math.round(distance/30),near:distance<145};
}
