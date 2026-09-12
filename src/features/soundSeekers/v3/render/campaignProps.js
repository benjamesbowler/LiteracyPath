import { drawPuzzleSprite,drawLearningSprite } from './puzzleSprites.js';
import { SOUND_SEEKERS_CAMPAIGN_PALETTE as P } from '../../visual/visualTokens.js';
// Canvas props use exact semantic roles from the authored learning inventories.
// x is the visual centre, y the feet. Size describes render scale; sizeVariant
// describes the actual comparison attribute. No correctness enters this API.
import { CAST } from '../content/cast.js';
import { getImage } from './sprites.js';

const INK = P['prop-tone-1'], WOOD = P['prop-tone-2'], LIGHT = P['prop-tone-3'], CREAM = P['prop-tone-4'], LEAF = P['prop-tone-5'];
const COLORS = { red: P['prop-tone-6'], blue: P['prop-tone-7'], yellow: P['prop-tone-8'], green: P['prop-tone-9'], white: P['prop-tone-10'], orange: P['prop-tone-11'], purple: P['prop-tone-12'], brown: WOOD };
const roleList = 'bank ring sun apple ball bag barn basket bay beam bed bench berry blanket boat book bread bridge brush bucket button camp card carrot cart cave cell city cloth cover crate cup cushion dock dome door egg feather fern flag flower frame garden gate gem glade handle hat head hedge island ladder lantern leaf ledge letter lever lily mat moss nest paint parcel path pillow plank plate pond post pot rack raft rail ramp reed reflector ribbon rock roof room root rope school scroll seat seed shade shelf shell sign stair stick stone stool soap towel tool tray tree wheel window';
export const CAMPAIGN_PROP_ROLES = Object.freeze(roleList.split(' '));
const shapes = {};
const poly = (c, points, fill) => { c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fillStyle=fill; c.fill(); c.stroke(); };
const box = (c,x,y,w,h,fill,r=7) => { c.beginPath(); c.roundRect(x,y,w,h,r); c.fillStyle=fill; c.fill(); c.stroke(); };
const oval = (c,x,y,rx,ry,fill) => { c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fillStyle=fill; c.fill(); c.stroke(); };
const line = (c,points,color=INK,width=4) => { c.save();c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore(); };
const stem = (c,x,y) => {line(c,[[x,y],[x+3,y-20]],P['prop-tone-13'],5);oval(c,x+11,y-15,11,5,LEAF);};
const legs = c => { box(c,-34,-45,10,45,WOOD,3);box(c,24,-45,10,45,WOOD,3); };
const water = (c,x=0,y=-12,w=50) => {oval(c,x,y,w,12,P['prop-tone-14']);line(c,[[x-w*.6,y],[x-w*.15,y+2]],P['prop-tone-15'],3);};
const woodLines = (c,x,y,w,count=3) => {for(let i=1;i<=count;i++)line(c,[[x,y+i*10],[x+w,y+i*10]],P['prop-tone-16'],2);};

shapes.towel = (c,o) => {box(c,-33,-95,66,91,o.color||P['prop-towel-1'],6);box(c,-33,-95,18,91,P['prop-towel-2'],4);line(c,[[-27,-16],[27,-16]],P['prop-towel-3'],6);for(let x=-25;x<30;x+=10)line(c,[[x,-4],[x,2]],P['prop-towel-4'],2);};
shapes.soap = (c,o) => {oval(c,0,-13,43,12,P['prop-soap-1']);box(c,-35,-42,70,32,o.color||P['prop-soap-2'],12);line(c,[[-20,-30],[17,-30]],P['prop-soap-3'],4);oval(c,28,-50,6,6,P['prop-soap-4']);oval(c,39,-63,4,4,P['prop-soap-4']);};
shapes.tray = (c,o) => {poly(c,[[-49,-29],[40,-29],[49,-5],[-40,-5]],o.color||P['prop-tray-1']);box(c,-43,-27,86,17,P['prop-tray-2'],5);line(c,[[-36,-15],[35,-15]],P['prop-tray-3'],3);};
shapes.stool = c => {legs(c);box(c,-43,-60,86,15,LIGHT,6);line(c,[[-30,-20],[30,-20]],WOOD,6);};
shapes.rail = c => {box(c,-42,-92,9,92,WOOD,3);box(c,33,-92,9,92,WOOD,3);box(c,-49,-90,98,12,LIGHT,5);};
shapes.ball = (c,o) => {oval(c,0,-35,34,34,o.color||P['prop-ball-1']);c.beginPath();c.arc(0,-35,34,-1.4,1.4);c.stroke();line(c,[[-30,-49],[30,-21]],P['prop-ball-2'],7);};
shapes.bucket = (c,o) => {c.beginPath();c.arc(0,-52,33,Math.PI,0);c.stroke();poly(c,[[-37,-52],[37,-52],[28,-4],[-28,-4]],o.color||P['prop-bucket-1']);oval(c,0,-52,37,9,P['prop-bucket-2']);line(c,[[-20,-40],[-17,-12]],P['prop-bucket-3'],5);if(o.filled)water(c,0,-50,30);};
shapes.brush = (c,o) => {box(c,-8,-93,16,52,WOOD,6);box(c,-30,-48,60,19,o.color||P['prop-brush-1'],7);for(let x=-25;x<30;x+=8)box(c,x,-28,6,27,P['prop-brush-2'],2);};
shapes.cloth = (c,o) => {poly(c,[[-43,-48],[31,-51],[44,-8],[-32,-3]],o.color||P['prop-cloth-1']);line(c,[[-28,-35],[24,-37]],P['prop-cloth-2'],3);};
shapes.blanket = (c,o) => {box(c,-47,-70,94,65,o.color||P['prop-blanket-1'],10);box(c,-47,-22,94,17,P['prop-blanket-2'],5);for(let x=-38;x<45;x+=16)line(c,[[x,-65],[x,-25]],P['prop-blanket-3'],3);};
shapes.pillow = (c,o) => {c.beginPath();c.moveTo(-45,-52);c.quadraticCurveTo(0,-68,45,-52);c.quadraticCurveTo(35,-28,45,-7);c.quadraticCurveTo(0,-17,-45,-7);c.quadraticCurveTo(-34,-27,-45,-52);c.closePath();c.fillStyle=o.color||P['prop-pillow-1'];c.fill();c.stroke();};
shapes.cushion = (c,o) => {box(c,-43,-49,86,43,o.color||P['prop-cushion-1'],16);oval(c,0,-27,3,3,P['prop-cushion-2']);};
shapes.mat = (c,o) => {oval(c,0,-16,48,16,o.color||P['prop-mat-1']);oval(c,0,-16,34,10,P['prop-mat-2']);};
shapes.plate = (c,o) => {oval(c,0,-17,44,17,o.color||P['prop-plate-1']);oval(c,0,-17,31,10,P['prop-plate-2']);};
shapes.cup = (c,o) => {oval(c,32,-34,14,17,o.color||P['prop-cup-1']);oval(c,32,-34,7,9,CREAM);box(c,-28,-57,55,50,o.color||P['prop-cup-1'],10);oval(c,0,-57,28,8,P['prop-cup-2']);if(o.filled)water(c,0,-55,22);};
shapes.basket = (c,o) => {if(o.shape==='round'){c.beginPath();c.arc(0,-40,28,Math.PI,0);c.stroke();oval(c,0,-25,37,25,o.color||P['prop-basket-1']);oval(c,0,-43,35,9,P['prop-basket-2']);woodLines(c,-25,-35,50,2);return;}c.beginPath();c.arc(0,-48,31,Math.PI,0);c.stroke();poly(c,[[-45,-48],[45,-48],[34,-5],[-34,-5]],o.color||P['prop-basket-1']);woodLines(c,-30,-39,60,3);line(c,[[-16,-43],[-13,-6]],P['prop-basket-3'],2);line(c,[[16,-43],[13,-6]],P['prop-basket-3'],2);};
shapes.crate = (c,o) => {box(c,-42,-75,84,72,o.color||WOOD,3);woodLines(c,-35,-65,70,5);line(c,[[-37,-69],[37,-10]],LIGHT,9);};
shapes.parcel = (c,o) => {if(o.shape==='round'){oval(c,0,-37,40,34,o.color||P['prop-parcel-1']);line(c,[[-37,-37],[37,-37]],P['prop-parcel-2'],6);line(c,[[0,-69],[0,-5]],P['prop-parcel-2'],6);return;}box(c,-38,-63,76,59,o.color||P['prop-parcel-1'],7);line(c,[[-38,-37],[38,-37]],P['prop-parcel-2'],7);line(c,[[0,-61],[0,-5]],P['prop-parcel-2'],7);poly(c,[[7,-59],[26,-69],[25,-49]],P['prop-parcel-3']);};
shapes.bag = shapes.parcel;
shapes.book = (c,o) => {poly(c,[[-40,-70],[32,-77],[40,-8],[-35,-3]],o.color||P['prop-book-1']);box(c,-29,-19,66,13,P['prop-book-2'],3);line(c,[[-29,-64],[-25,-26]],P['prop-book-3'],5);};
shapes.letter = c => {box(c,-44,-58,88,54,CREAM,4);line(c,[[-42,-54],[0,-24],[42,-54]],P['prop-letter-1'],3);line(c,[[-42,-8],[-16,-31]],P['prop-letter-1'],2);line(c,[[42,-8],[16,-31]],P['prop-letter-1'],2);};
shapes.card = (c,o) => {box(c,-31,-76,62,70,o.color||CREAM,5);line(c,[[-18,-55],[18,-55]],P['prop-card-1'],3);line(c,[[-18,-42],[12,-42]],P['prop-card-1'],3);};
shapes.scroll = c => {box(c,-34,-78,68,72,CREAM,9);oval(c,-27,-72,10,7,P['prop-scroll-1']);oval(c,27,-11,10,7,P['prop-scroll-1']);line(c,[[-18,-53],[19,-53]],P['prop-scroll-2'],3);line(c,[[-18,-40],[12,-40]],P['prop-scroll-2'],3);};
shapes.ribbon = (c,o) => {poly(c,[[-4,-50],[-28,-7],[-12,-14],[0,-3],[12,-47]],o.color||P['prop-ribbon-1']);poly(c,[[3,-50],[30,-8],[14,-16],[4,-4],[-10,-48]],o.color||P['prop-ribbon-1']);oval(c,-16,-59,22,12,o.color||P['prop-ribbon-1']);oval(c,16,-59,22,12,o.color||P['prop-ribbon-1']);oval(c,0,-59,8,9,P['prop-ribbon-2']);};
shapes.button = (c,o) => {oval(c,0,-35,31,31,o.color||P['prop-button-1']);for(const [x,y] of [[-8,-43],[8,-43],[-8,-27],[8,-27]])oval(c,x,y,3,3,INK);};
shapes.hat = (c,o) => {oval(c,0,-14,49,13,o.color||P['prop-hat-1']);box(c,-30,-63,60,47,o.color||P['prop-hat-1'],15);box(c,-30,-29,60,12,P['prop-hat-2'],3);};
shapes.egg = (c,o) => {c.beginPath();c.moveTo(0,-83);c.bezierCurveTo(29,-82,48,-14,16,-5);c.bezierCurveTo(-40,13,-39,-63,0,-83);c.fillStyle=o.color||P['prop-egg-1'];c.fill();c.stroke();};
shapes.feather = (c,o) => {c.beginPath();c.moveTo(-25,-3);c.bezierCurveTo(-46,-67,20,-106,33,-77);c.bezierCurveTo(48,-45,3,-28,-25,-3);c.fillStyle=o.color||P['prop-feather-1'];c.fill();c.stroke();line(c,[[-25,-3],[21,-78]],P['prop-feather-2'],3);};
shapes.rope = (c,o) => {for(let i=0;i<4;i++)oval(c,0,-20-i*8,35-i*3,14,o.color||P['prop-rope-1']);line(c,[[23,-31],[43,-5]],P['prop-rope-2'],6);};
shapes.plank = (c,o) => {box(c,-48,-34,96,27,o.color||WOOD,4);line(c,[[-36,-19],[34,-23]],P['prop-plank-1'],3);};
shapes.beam = (c,o) => {poly(c,[[-46,-80],[-20,-86],[45,-12],[20,-3]],o.color||WOOD);line(c,[[-30,-76],[28,-16]],LIGHT,3);};
shapes.stick = (c,o) => {if(o.shape==='straight'){line(c,[[0,-4],[0,-92]],o.color||WOOD,11);return;}line(c,[[-34,-7],[13,-74],[23,-90]],o.color||WOOD,11);line(c,[[3,-57],[32,-56]],o.color||WOOD,8);};
shapes.tool = c => {box(c,-7,-78,14,76,WOOD,5);poly(c,[[-36,-75],[-29,-94],[33,-94],[36,-75]],P['prop-tool-1']);};
shapes.handle = (c,o) => {if(o.shape==='straight'){box(c,-8,-87,16,77,WOOD,6);box(c,-28,-91,56,14,LIGHT,6);}else{oval(c,0,-56,29,32,WOOD);oval(c,0,-56,16,20,CREAM);box(c,-8,-28,16,25,WOOD,3);}};
shapes.cover = (c,o) => {if(o.shape==='round')oval(c,0,-32,42,29,o.color||P['prop-cover-1']);else box(c,-43,-64,86,58,o.color||P['prop-cover-1'],9);line(c,[[-13,-45],[13,-45]],INK,4);};
shapes.paint = (c,o) => {box(c,-31,-65,62,60,P['prop-paint-1'],5);oval(c,0,-65,31,8,o.color||P['prop-paint-2']);box(c,-23,-48,46,25,o.color||P['prop-paint-2'],4);};
shapes.pot = (c,o) => {poly(c,[[-39,-62],[39,-62],[29,-5],[-29,-5]],o.color||P['prop-pot-1']);box(c,-43,-68,86,15,P['prop-pot-2'],5);};
shapes.apple = (c,o) => {stem(c,0,-65);oval(c,-15,-38,25,33,o.color||P['prop-apple-1']);oval(c,15,-38,25,33,o.color||P['prop-apple-1']);line(c,[[-23,-51],[-26,-34]],P['prop-apple-2'],5);};
shapes.berry = (c,o) => {const n=Math.max(1,Math.min(3,o.count||3));for(let i=0;i<n;i++){const x=(i-(n-1)/2)*29;oval(c,x,-24,18,20,o.color||P['prop-berry-1']);stem(c,x,-42);}};
shapes.carrot = c => {poly(c,[[-24,-75],[27,-70],[-7,-2]],P['prop-carrot-1']);line(c,[[-5,-74],[-19,-100]],LEAF,8);line(c,[[3,-76],[12,-101]],LEAF,8);line(c,[[-14,-52],[4,-49]],P['prop-carrot-2'],3);};
shapes.bread = (c,o) => {if(o.shape==='round'){oval(c,0,-36,40,33,o.color||P['prop-bread-1']);line(c,[[-13,-53],[4,-30]],P['prop-bread-2'],5);return;}box(c,-45,-58,90,53,o.color||P['prop-bread-1'],23);for(let x=-25;x<=25;x+=25)line(c,[[x,-49],[x+9,-28]],P['prop-bread-2'],6);};
shapes.seed = (c,o) => {oval(c,0,-24,18,24,o.color||P['prop-seed-1']);line(c,[[-4,-42],[-4,-11]],P['prop-seed-2'],3);};
shapes.leaf = (c,o) => {if(o.shape==='round'){oval(c,0,-40,32,34,o.color||LEAF);line(c,[[0,-4],[0,-67]],P['prop-leaf-1'],3);return;}c.beginPath();c.moveTo(-27,-5);c.quadraticCurveTo(-51,-77,36,-91);c.quadraticCurveTo(54,-30,-27,-5);c.fillStyle=o.color||LEAF;c.fill();c.stroke();line(c,[[-27,-5],[29,-80]],P['prop-leaf-1'],3);};
shapes.flower = (c,o) => {line(c,[[0,-5],[0,-53]],LEAF,7);for(let i=0;i<6;i++){const a=i*Math.PI/3;oval(c,Math.cos(a)*20,-65+Math.sin(a)*20,14,14,o.color||P['prop-flower-1']);}oval(c,0,-65,13,13,P['prop-flower-2']);};
shapes.fern = c => {line(c,[[0,0],[0,-95]],P['prop-fern-1'],5);for(let i=0;i<5;i++){const y=-20-i*15;line(c,[[0,y],[27-i*3,y-16]],LEAF,9);line(c,[[0,y],[-27+i*3,y-16]],LEAF,9);}};
shapes.reed = c => {for(const [x,h] of [[-24,70],[0,100],[24,85]]){line(c,[[x,0],[x,-h]],P['prop-reed-1'],5);box(c,x-5,-h-15,10,31,P['prop-reed-2'],4);}};
shapes.lily = c => {water(c);oval(c,0,-17,30,11,LEAF);poly(c,[[0,-17],[23,-28],[30,-14]],P['prop-tone-14']);shapes.flower(c,{color:P['prop-lily-1']});};
shapes.tree = (c,o) => {poly(c,[[-14,-4],[-10,-80],[12,-80],[17,-4]],WOOD);oval(c,-23,-80,31,29,o.color||LEAF);oval(c,23,-81,32,28,o.color||LEAF);oval(c,0,-107,35,29,o.color||LEAF);};
shapes.hedge = (c,o) => {for(let i=0;i<4;i++)oval(c,-36+i*24,-35,23,33,o.color||P['prop-hedge-1']);};
shapes.moss = c => {for(let i=0;i<5;i++)oval(c,-36+i*18,-13,17,11,P['prop-moss-1']);};
shapes.root = c => {line(c,[[-46,-5],[-20,-20],[0,-70],[19,-18],[47,-7]],WOOD,19);line(c,[[0,-33],[33,-43]],WOOD,13);};
shapes.stone = (c,o) => {if(o.shape==='round'){oval(c,0,-32,39,31,o.color||P['prop-stone-1']);return;}if(o.shape==='flat'){oval(c,0,-17,46,16,o.color||P['prop-stone-1']);return;}poly(c,[[-44,-7],[-48,-34],[-25,-61],[16,-70],[43,-43],[47,-8]],o.color||P['prop-stone-1']);line(c,[[-27,-46],[-7,-56],[14,-53]],P['prop-stone-2'],4);};
shapes.rock = shapes.stone;
shapes.shell = (c,o) => {if(o.shape==='pointed'){poly(c,[[-43,-7],[29,-95],[43,-19],[13,-4]],o.color||P['prop-shell-1']);line(c,[[-24,-17],[31,-47],[15,-56]],P['prop-shell-2'],3);return;}c.beginPath();c.moveTo(0,-3);c.bezierCurveTo(-75,-29,-47,-96,0,-69);c.bezierCurveTo(47,-96,75,-29,0,-3);c.fillStyle=o.color||P['prop-shell-1'];c.fill();c.stroke();for(let i=-2;i<=2;i++)line(c,[[0,-7],[i*16,-60-Math.abs(i)*3]],P['prop-shell-2'],2);};
shapes.gem = (c,o) => {poly(c,[[-35,-46],[-16,-76],[18,-76],[38,-46],[0,-4]],o.color||P['prop-gem-1']);line(c,[[-35,-46],[38,-46],[0,-4],[-13,-46],[-16,-76]],P['prop-gem-2'],3);};
shapes.nest = c => {oval(c,0,-23,47,20,P['prop-nest-1']);oval(c,0,-30,34,10,P['prop-nest-2']);for(let i=0;i<4;i++)line(c,[[-36,-16-i*5],[35,-24+i*4]],P['prop-nest-3'],3);};
shapes.seat = (c,o) => {legs(c);box(c,-42,-56,84,14,o.color||WOOD,4);box(c,-40,-89,80,22,LIGHT,4);line(c,[[-32,-78],[-32,-46]],WOOD,7);line(c,[[32,-78],[32,-46]],WOOD,7);};
shapes.bench = (c,o) => {shapes.seat(c,o);line(c,[[-48,-45],[48,-45]],LIGHT,7);};
shapes.bed = (c,o) => {box(c,-48,-70,12,70,WOOD,4);box(c,36,-42,12,42,WOOD,4);box(c,-42,-46,84,25,o.color||P['prop-bed-1'],7);box(c,-35,-51,28,14,CREAM,5);};
shapes.shelf = c => {box(c,-48,-24,96,13,WOOD,3);poly(c,[[-31,-10],[-11,-10],[-31,10]],P['prop-shelf-1']);poly(c,[[31,-10],[11,-10],[31,10]],P['prop-shelf-1']);};
shapes.post = c => {box(c,-10,-100,20,100,WOOD,3);box(c,-14,-104,28,10,LIGHT,4);};
shapes.sign = (c,o) => {shapes.post(c);poly(c,[[-45,-96],[27,-96],[46,-74],[27,-52],[-45,-52]],o.color||LIGHT);};
shapes.flag = (c,o) => {line(c,[[-29,0],[-29,-109]],WOOD,7);poly(c,[[-26,-106],[41,-96],[22,-70],[-26,-78]],o.color||P['prop-flag-1']);};
shapes.ladder = c => {line(c,[[-30,0],[-24,-113]],WOOD,9);line(c,[[30,0],[24,-113]],WOOD,9);for(let i=0;i<5;i++)line(c,[[-25,-13-i*22],[25,-13-i*22]],LIGHT,7);};
shapes.stair = c => {poly(c,[[-49,0],[-49,-24],[-23,-24],[-23,-48],[1,-48],[1,-72],[25,-72],[25,-96],[49,-96],[49,0]],P['prop-stair-1']);line(c,[[-46,-22],[-24,-22]],P['prop-stair-2'],3);};
shapes.ramp = c => {poly(c,[[-48,0],[48,-68],[48,0]],WOOD);for(let i=0;i<4;i++)line(c,[[-33+i*23,-10-i*16],[-25+i*23,-6-i*16]],LIGHT,3);};
shapes.bridge = c => {line(c,[[-48,-16],[48,-16]],WOOD,12);line(c,[[-42,-16],[-42,-64]],WOOD,7);line(c,[[42,-16],[42,-64]],WOOD,7);line(c,[[-42,-56],[42,-56]],LIGHT,6);for(let i=-2;i<=2;i++)line(c,[[i*14,-52],[i*14,-19]],WOOD,4);};
shapes.dock = c => {poly(c,[[-48,-25],[32,-43],[49,-18],[-33,0]],WOOD);line(c,[[-33,-9],[-33,13]],WOOD,7);line(c,[[33,-29],[33,9]],WOOD,7);line(c,[[-32,-23],[31,-35]],LIGHT,3);};
shapes.raft = c => {for(let i=0;i<4;i++){box(c,-48,-39+i*9,96,12,WOOD,6);}line(c,[[-24,-40],[-24,0]],P['prop-raft-1'],5);line(c,[[24,-40],[24,0]],P['prop-raft-1'],5);};
shapes.boat = (c,o) => {poly(c,[[-49,-41],[49,-41],[29,-7],[-26,-7]],o.color||P['prop-boat-1']);line(c,[[-22,-42],[-22,-98]],WOOD,5);poly(c,[[-18,-95],[24,-49],[-18,-49]],CREAM);};
shapes.cart = (c,o) => {oval(c,-28,-12,12,12,P['prop-cart-1']);oval(c,28,-12,12,12,P['prop-cart-1']);box(c,-44,-62,88,38,o.color||WOOD,5);line(c,[[44,-36],[61,-51]],WOOD,6);};
shapes.wheel = c => {oval(c,0,-47,43,43,WOOD);oval(c,0,-47,31,31,LIGHT);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,[[0,-47],[Math.cos(a)*34,-47+Math.sin(a)*34]],WOOD,6);}oval(c,0,-47,9,9,P['prop-wheel-1']);};
shapes.lever = c => {poly(c,[[-27,-3],[0,-34],[28,-3]],P['prop-lever-1']);line(c,[[0,-28],[25,-87]],WOOD,10);oval(c,26,-90,13,13,P['prop-lever-2']);};
shapes.frame = c => {box(c,-45,-96,90,92,WOOD,3);box(c,-30,-80,60,61,CREAM,2);};
shapes.rack = c => {line(c,[[-38,0],[-32,-107]],WOOD,8);line(c,[[38,0],[32,-107]],WOOD,8);box(c,-44,-73,88,12,LIGHT,3);box(c,-46,-31,92,12,LIGHT,3);};
shapes.roof = c => {poly(c,[[-51,-10],[0,-86],[51,-10]],P['prop-roof-1']);poly(c,[[-39,-10],[0,-66],[39,-10]],CREAM);};
shapes.door = (c,o) => {box(c,-36,-101,72,98,o.color||WOOD,22);line(c,[[0,-90],[0,-6]],P['prop-door-1'],2);oval(c,22,-47,4,4,P['prop-door-2']);};
shapes.window = (c,o) => {if(o.shape==='round'){oval(c,0,-51,43,43,WOOD);oval(c,0,-51,33,33,P['prop-window-1']);}else{box(c,-42,-96,84,91,WOOD,5);box(c,-32,-84,64,66,P['prop-window-1'],3);}line(c,[[0,-82],[0,-20]],LIGHT,5);line(c,[[-31,-52],[31,-52]],LIGHT,5);};
shapes.gate = (c,o) => {box(c,-48,-87,12,87,WOOD,4);box(c,36,-87,12,87,WOOD,4);if(o.open){poly(c,[[-35,-70],[-7,-53],[-7,-15],[-35,-29]],LIGHT);}else{box(c,-36,-73,72,11,LIGHT,3);box(c,-36,-30,72,11,LIGHT,3);line(c,[[-28,-69],[28,-22]],WOOD,8);}};
shapes.lantern = (c,o) => {c.beginPath();c.arc(0,-92,13,Math.PI,0);c.stroke();poly(c,[[-28,-82],[28,-82],[35,-15],[-35,-15]],WOOD);box(c,-22,-75,44,52,o.filled===false?P['prop-lantern-1']:P['prop-lantern-2'],8);oval(c,0,-43,8,18,P['prop-lantern-3']);box(c,-32,-17,64,12,LIGHT,4);};
shapes.reflector = c => {line(c,[[0,0],[0,-64]],WOOD,8);poly(c,[[-34,-75],[4,-99],[38,-64],[0,-40]],P['prop-reflector-1']);line(c,[[-17,-73],[10,-88]],P['prop-reflector-2'],5);};
shapes.pond = c => {water(c,0,-17,51);line(c,[[-37,-5],[-13,0],[20,-2]],P['prop-pond-1'],6);};
shapes.bay = c => {water(c,0,-19,51);poly(c,[[-52,-36],[-32,-27],[-39,-5],[-55,2]],P['prop-bay-1']);poly(c,[[52,-36],[32,-27],[39,-5],[55,2]],P['prop-bay-1']);};
shapes.island = c => {water(c,0,-8,53);oval(c,0,-18,35,17,P['prop-island-1']);oval(c,0,-23,28,10,LEAF);};
shapes.path = (c,o) => {poly(c,[[-47,0],[-23,-80],[11,-99],[20,-80],[46,0]],o.color||P['prop-path-1']);line(c,[[-26,-22],[-16,-23]],P['prop-path-2'],2);line(c,[[9,-58],[17,-61]],P['prop-path-2'],2);};
shapes.glade = c => {oval(c,0,-17,49,18,P['prop-glade-1']);for(const x of [-40,40]){line(c,[[x,-10],[x,-64]],WOOD,8);oval(c,x,-77,20,25,LEAF);}};
shapes.garden = c => {poly(c,[[-46,-10],[-35,-53],[35,-53],[46,-10]],P['prop-garden-1']);for(let x=-23;x<25;x+=23){line(c,[[x,-14],[x,-57]],LEAF,5);oval(c,x-7,-39,10,5,P['prop-garden-2']);oval(c,x+7,-47,10,5,LEAF);}};
shapes.ledge = c => {poly(c,[[-50,-5],[-44,-41],[38,-49],[49,-5]],P['prop-ledge-1']);line(c,[[-37,-38],[29,-44]],P['prop-ledge-2'],4);};
shapes.shade = c => {line(c,[[0,0],[0,-92]],WOOD,6);poly(c,[[-51,-59],[-20,-95],[20,-95],[51,-59]],P['prop-shade-1']);};
shapes.camp = (c,o) => {poly(c,[[-51,-3],[0,-104],[51,-3]],o.color||P['prop-camp-1']);poly(c,[[-20,-3],[0,-68],[20,-3]],P['prop-camp-2']);line(c,[[-48,-3],[-58,6]],WOOD,3);};
shapes.cave = c => {poly(c,[[-53,-3],[-48,-61],[-23,-91],[16,-101],[46,-61],[53,-3]],P['prop-cave-1']);c.beginPath();c.moveTo(-29,-3);c.lineTo(-29,-43);c.bezierCurveTo(-26,-77,29,-77,29,-43);c.lineTo(29,-3);c.closePath();c.fillStyle=P['prop-cave-2'];c.fill();c.stroke();};
shapes.barn = c => {box(c,-43,-68,86,65,P['prop-barn-1'],3);poly(c,[[-51,-67],[0,-107],[51,-67]],P['prop-barn-2']);box(c,-22,-47,44,44,WOOD,3);line(c,[[-18,-43],[18,-7]],CREAM,4);line(c,[[18,-43],[-18,-7]],CREAM,4);};
shapes.room = c => {box(c,-46,-85,92,82,P['prop-room-1'],4);poly(c,[[-46,-3],[-17,-24],[46,-24],[46,-3]],P['prop-room-2']);box(c,5,-75,25,29,P['prop-room-3'],3);line(c,[[-17,-85],[-17,-24]],P['prop-room-4'],3);};
shapes.cell = c => {box(c,-46,-90,92,87,P['prop-cell-1'],4);box(c,-23,-72,46,69,P['prop-cell-2'],6);line(c,[[-11,-66],[-11,-9]],P['prop-cell-3'],4);line(c,[[11,-66],[11,-9]],P['prop-cell-3'],4);};
shapes.dome = c => {box(c,-45,-43,90,40,P['prop-dome-1'],3);c.beginPath();c.arc(0,-44,45,Math.PI,0);c.closePath();c.fillStyle=P['prop-dome-2'];c.fill();c.stroke();line(c,[[0,-86],[0,-46]],P['prop-dome-3'],8);box(c,-13,-35,26,32,WOOD,8);};
shapes.city = c => {for(const [x,h] of [[-45,57],[-16,98],[15,75]]){box(c,x,-h,28,h-3,P['prop-city-1'],3);for(let y=-h+10;y<-12;y+=20)box(c,x+7,y,11,10,P['prop-city-2'],1);}};
shapes.school = c => {box(c,-46,-65,92,62,P['prop-school-1'],3);poly(c,[[-51,-65],[0,-99],[51,-65]],P['prop-school-2']);box(c,-13,-39,26,36,WOOD,3);box(c,-36,-54,18,19,P['prop-school-3'],2);box(c,18,-54,18,19,P['prop-school-3'],2);oval(c,0,-76,8,8,P['prop-school-4']);};
shapes.head = c => {oval(c,0,-44,33,39,P['prop-head-1']);c.beginPath();c.arc(0,-51,34,Math.PI,0);c.fillStyle=P['prop-head-2'];c.fill();c.stroke();oval(c,-12,-43,3,4,INK);oval(c,12,-43,3,4,INK);c.beginPath();c.arc(0,-32,10,0,Math.PI);c.stroke();};

shapes.bank = c => {water(c,13,-13,39);poly(c,[[-54,-42],[-16,-42],[2,-22],[-13,-3],[-54,-3]],P['prop-bank-1']);line(c,[[-49,-42],[-20,-42]],LEAF,6);};
shapes.ring = (c,o) => {oval(c,0,-39,31,33,o.color||P['prop-ring-1']);oval(c,0,-39,20,22,CREAM);poly(c,[[-13,-75],[0,-90],[13,-75],[0,-59]],P['prop-ring-2']);};
shapes.sun = (c,o) => {oval(c,0,-49,28,28,o.color||P['prop-sun-1']);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,[[Math.cos(a)*36,-49+Math.sin(a)*36],[Math.cos(a)*47,-49+Math.sin(a)*47]],P['prop-sun-2'],5);}};

shapes.launcher = c => {line(c,[[0,-3],[0,-55]],WOOD,14);line(c,[[0,-48],[-31,-85]],WOOD,12);line(c,[[0,-48],[31,-85]],WOOD,12);line(c,[[-29,-84],[0,-67],[29,-84]],P['prop-launcher-1'],5);oval(c,0,-71,11,11,P['prop-launcher-2']);};

const KIT_ALIASES = {
  'camp-marker':'camp','listening-stone':'stone','stationary-sign-rack':'rack','seed-or-bubble-launcher':'launcher',
  'grapheme-plank-rack':'rack','construction-slots':'plank','ladder-or-vine':'ladder','recoverable-parcel':'parcel',
  'delivery-marker':'post','return-shortcut-sign':'sign','carrier-release':'gate','sound-routing-channel':'gate',
  'carrier-return-track':'path','safe-route-raft':'raft','decision-eddy':'pond','route-junction':'sign',
  'carryable-word-carts':'cart','wooden-assembly-rail':'rail','meaning-board':'sign','letter-part-rack':'rack',
  'changeable-word-workbench':'bench','instruction-object':'basket','horizontal-rail':'rail','open-tray':'tray',
  'stool-with-clear-under-space':'stool','inspectable-note':'letter','inspectable-story-message':'scroll','story-action-station':'bench',
  'oak-bath-corner':'bucket','fern-shelter':'bed','stone-wall-nest':'nest','two-bank-pond':'bridge','bramble-picnic-gate':'gate',
  'bluff-basket-hoist':'basket','lily-ferry-moorings':'boat','fishpool-picnic-tables':'plate','wheelhouse-ladder':'ladder',
  'weir-gathering-signals':'flag','amber-ridge-signs':'sign','cozy-stone-shelter':'cave','split-path-parcels':'parcel',
  'fern-counterweight-crossing':'bridge','claw-pass-drawbridge':'bridge','wooden-signal-arms':'lever','stone-supply-bays':'crate',
  'wooden-sign-workshop':'rack','handcart-convoy-yard':'cart','valley-two-span-crossing':'bridge','reed-floating-landing':'raft',
  'mica-illuminated-stair':'stair','fen-reflected-forks':'reflector','shell-shore-workbench':'bench','harbour-lighthouse-piers':'dock',
  'garden-root-walkway':'root','stone-wide-forest-route':'path','observatory-dome-stair':'dome','aster-message-archive':'book','three-community-skybridge':'bridge'
};

// Shared x-centre/y-feet authority for the pictured arrangement, destination
// target, carried-object motion and settled object. Callers add their scene
// node coordinates to the returned local offsets; no answer key is needed.
const RELATION_HOSTS = {
 shelf:{surface:-.24,top:-.24,lift:.52},bed:{surface:-.46,top:-.70,lift:.25},
 bench:{surface:-.56,top:-.89,lift:.14},seat:{surface:-.56,top:-.89,lift:.14},
 stool:{surface:-.60,top:-.60,lift:.10},rack:{surface:-.73,top:-1.07,lift:.16},
 dock:{surface:-.31,top:-.43,lift:.43},bridge:{surface:-.16,top:-.64,lift:.46},
 cart:{surface:-.62,top:-.62,lift:.24},ledge:{surface:-.45,top:-.49,lift:.52},
 stair:{surface:-.96,top:-.96,lift:.12},ladder:{surface:-1.13,top:-1.13,lift:0},
 rail:{surface:-.90,top:-.92,lift:0},gate:{surface:-.87,top:-.87,lift:.10},
 tree:{surface:-.80,top:-1.36,lift:0},basket:{surface:-.48,top:-.80,lift:0},
 nest:{surface:-.30,top:-.43,lift:0},tray:{surface:-.27,top:-.29,lift:0},
 bucket:{surface:-.52,top:-.85,lift:0},post:{surface:-1.04,top:-1.04,lift:0},
 rock:{surface:-.68,top:-.70,lift:0},stone:{surface:-.68,top:-.70,lift:0},
 root:{surface:-.43,top:-.80,lift:0},boat:{surface:-.41,top:-.98,lift:0}
};
const CLOSED_UNDER_HOSTS = new Set(['basket','nest','post','rock','stone','root','crate','cover']);
export function campaignRelationPlacement({relation,landmark,size=125,elevation,objectKind}={}) {
 const ref=typeof landmark==='string'?{kind:landmark}:landmark||{};
 const profile=RELATION_HOSTS[ref.kind]||{surface:-.46,top:-1,lift:0};
 const hostSize=size*.9;
 const hostVariant=({small:.68,little:.68,large:1.17,big:1.17}[ref.sizeVariant]||1);
 const hostHorizontalLong=ref.kind==='basket'&&ref.lengthVariant==='long';
 const hostStretch=hostHorizontalLong?1.45:({wide:1.25,narrow:.72}[ref.sizeVariant]||{wide:1.25,narrow:.72}[ref.widthVariant]||1);
 const hostVertical=({long:1.3,short:.72,tall:1.3}[ref.sizeVariant]||{tall:1.3,short:.72}[ref.heightVariant]||(!hostHorizontalLong&&{long:1.3,short:.72}[ref.lengthVariant])||1);
 const hostHeight=hostSize*hostVariant*hostVertical;
 const lift=(profile.lift+({high:.5,middle:.22,low:0}[ref.elevation||elevation]||0))*size;
 const hostY=relation==='below'?-(Math.max(.7,profile.lift)*size):-lift;
 const onY=hostY+profile.surface*hostHeight;
 let objectSize=size*.44;
 const offsets={on:[0,onY],above:[0,hostY+profile.top*hostHeight-size*.14],
  under:[0,-size*.03],below:[0,size*.05],beside:[Math.max(size*.78,hostSize*hostVariant*hostStretch*.55+size*.36),0],
  in:[0,hostY-size*.05],behind:[-size*.42,hostY-size*.22],
  beyond:[size*.65,hostY-size*.25],past:[size*.78,hostY]};
 if(relation==='under')objectSize=size*.28;
 if(relation==='in'){objectSize=size*.3;const height=({cloth:.51,pillow:.67,mat:.32,plate:.34,soap:.42,cushion:.50,letter:.58,card:.76,cover:.58,cup:.65,blanket:.70,bread:.60}[objectKind]||.95);offsets.in[1]=onY+objectSize*height*.35;}
 // A towel/cloth hangs down from a rail instead of balancing above it.
 if(relation==='on'&&ref.kind==='rail'&&['towel','cloth'].includes(objectKind))offsets.on[1]+=objectSize*(objectKind==='towel'?.94:.50);
 const [x,y]=offsets[relation]||[0,hostY];
 return {landmark:{...ref,kind:ref.kind,x:0,y:hostY,size:hostSize,elevation:null,
   groundSupport:profile.lift?lift:0},object:{x,y,size:objectSize},
   frontClip:relation==='in'?{x:-hostSize*hostVariant*hostStretch*.58,y:onY+hostHeight*.025,width:hostSize*hostVariant*hostStretch*1.16,height:-onY+hostHeight*.1}:null,
   supported:Boolean(ref.kind&&offsets[relation])&&!(relation==='under'&&CLOSED_UNDER_HOSTS.has(ref.kind))};
}

export function drawCampaignRelationForeground(ctx,placement,x=0,y=0) {
 const clip=placement?.frontClip,host=placement?.landmark;if(!clip||!host)return;
 ctx.save();ctx.beginPath();ctx.rect(x+clip.x,y+clip.y,clip.width,clip.height);ctx.clip();
 drawCampaignProp(ctx,host.kind,x+host.x,y+host.y,{...host,relation:null,landmark:null});ctx.restore();
}

export function drawCampaignProp(ctx, kind, x, y, options = {}) {
  const { size = 80, sizeVariant = 'regular', color, colour, shape, count, filled, relation, landmark, ...rest } = options;
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(size) || size <= 0) return false;
  const role = KIT_ALIASES[kind] || kind;
  // Rescue actors retain the exact book cast rather than a substitute cat icon.
  const castId = role === 'kitten' || role === 'cat' ? 'cuddly' : role === 'chick' ? 'brave' : null;
  if (castId) {
    const image = getImage(CAST[castId].sprite);
    if (!image) return false;
    const width = size * image.naturalWidth / image.naturalHeight;
    ctx.drawImage(image, x - width / 2, y - size, width, size);return true;
  }
  if (!shapes[role]) return false;
  const scale = size / 100 * ({ small:.68, little:.68, large:1.17, big:1.17 }[sizeVariant] || 1);
  const horizontalLong = role==='basket' && rest.lengthVariant==='long';
  const stretch = horizontalLong ? 1.45 : { wide:1.25, narrow:.72 }[sizeVariant] || ({wide:1.25,narrow:.72}[rest.widthVariant] || 1);
  const verticalStretch = {long:1.3,short:.72,tall:1.3}[sizeVariant] || ({tall:1.3,short:.72}[rest.heightVariant] || (!horizontalLong && {long:1.3,short:.72}[rest.lengthVariant]) || 1);
  const resolvedColor = COLORS[colour || color] || colour || color;
  // Relational scenes must receive explicit authored attributes. A label is
  // never parsed to guess art, and neither target ID nor correctness is read.
  if (landmark && relation) {
    const placement=campaignRelationPlacement({relation,landmark,size,elevation:rest.elevation,objectKind:role});
    const host=placement.landmark,object=placement.object;
    drawCampaignProp(ctx,host.kind,x+host.x,y+host.y,{...host,relation:null,landmark:null});
    const drawn=drawCampaignProp(ctx,role,x+object.x,y+object.y,{...rest,elevation:null,
      shape,count,filled,color:resolvedColor,size:object.size,sizeVariant,relation:null,landmark:null});
    drawCampaignRelationForeground(ctx,placement,x,y);return drawn;
  }
  if(!shape&&!filled&&!color&&!landmark&&!relation&&!colour&&!count&&['regular','small','little','large','big'].includes(sizeVariant)&&Object.keys(rest).every(k=>['kind','scenery'].includes(k))&&drawLearningSprite(ctx,role,x,y,size*({small:.68,little:.68,large:1.17,big:1.17}[sizeVariant]||1)))return true;
  const spriteRole={sign:'sign',bucket:'bucket',basket:'basket',crate:'crate',lantern:'lantern',wheel:'wheel',ladder:'ladder',hedge:'hedge'}[role];
  if(spriteRole&&!shape&&!filled&&!color&&!landmark&&!relation&&!colour&&!count&&sizeVariant==='regular'&&!Object.keys(rest).length&&drawPuzzleSprite(ctx,spriteRole,x,y,size))return true;
  ctx.save();ctx.translate(x,y);
  if(rest.elevation){
    // A common fixed-height post makes high/middle/low visually comparable.
    ctx.lineWidth=3;ctx.strokeStyle=INK;line(ctx,[[-size*.42,0],[-size*.42,-size*1.3]],WOOD,5);
    ctx.translate(0,({high:-.65,middle:-.28,low:.06}[rest.elevation]||0)*size);
  }
  ctx.scale(scale * stretch,scale * verticalStretch);
  ctx.lineWidth=3;ctx.strokeStyle=INK;ctx.lineJoin='round';ctx.lineCap='round';
  if(rest.groundSupport>0){
    const drop=rest.groundSupport/(scale*verticalStretch);
    const feet=role==='bed'?[-42,42]:role==='bench'||role==='seat'||role==='stool'?[-30,30]:[-34,34];
    for(const foot of feet)line(ctx,[[foot,0],[foot,drop]],WOOD,7);
  }
  shapes[role](ctx,{...rest,shape,count,filled,color:resolvedColor});
  if (rest.texture === 'rough' || rest.surface === 'rough') {
    for (const [px,py] of (shape==='flat' ? [[-24,-17],[-10,-22],[9,-13],[23,-18]] : [[-23,-27],[-11,-40],[8,-22],[22,-38],[0,-53]])) { line(ctx,[[px-3,py],[px+3,py-3]],P['prop-tone-17'],3); }
  }
  if (rest.stripe || rest.mark || rest.stripeColour) {
    const markColor = rest.stripeColour?.startsWith('#') ? rest.stripeColour : (rest.stripe || rest.mark || rest.stripeColour) === 'dark' ? P['prop-tone-18'] : P['prop-tone-19'];
    line(ctx,shape==='flat' ? [[-15,-17],[15,-22]] : (rest.stripe || rest.stripeColour) ? [[-23,-26],[3,-42],[24,-55]] : [[-11,-26],[11,-31]],markColor,(rest.stripe || rest.stripeColour)?7:5);
  }
  if (rest.material === 'stone') { line(ctx,[[-24,-35],[-8,-43],[15,-37]],P['prop-tone-20'],5); }
  if (rest.material === 'wood') { line(ctx,[[-26,-33],[21,-35]],P['prop-tone-21'],3); }
  if (['sun','sunny'].includes(rest.lighting)) { oval(ctx,38,-104,11,11,P['prop-tone-22']); }
  if (['shade','shady'].includes(rest.lighting)) { poly(ctx,[[-48,-101],[48,-101],[30,-82],[-30,-82]],P['prop-tone-23']); }
  if (rest.direction) { const angle={left:Math.PI,right:0,north:-Math.PI/2,south:Math.PI/2}[rest.direction]||0;ctx.save();ctx.translate(0,-92);ctx.rotate(angle);line(ctx,[[-17,0],[17,0],[6,-10]],INK,4);line(ctx,[[17,0],[6,10]],INK,4);ctx.restore(); }
  if (rest.ordinal) { const n=Number(rest.ordinal);if(Number.isFinite(n))for(let i=0;i<n;i++)oval(ctx,-12+i*12,-90,3,3,INK); }
  if (rest.worldId) {
    const marker={meadow:'flower',dino:'fern',moonwood:'lantern'}[rest.worldId];
    if(marker)drawCampaignProp(ctx,marker,30,-50,{size:34});
  }
  if (rest.residentId && CAST[rest.residentId]) {
    const image=getImage(CAST[rest.residentId].sprite);
    if(image){const portraitHeight=44;const portraitWidth=portraitHeight*image.naturalWidth/image.naturalHeight;ctx.drawImage(image,29-portraitWidth/2,-96,portraitWidth,portraitHeight);}
  }
  if (rest.accessory) {
    const accessory = typeof rest.accessory === 'string' ? {kind:rest.accessory} : rest.accessory;
    drawCampaignProp(ctx,accessory.kind,18,-19,{...accessory,size:35,landmark:null,relation:null});
  }
  ctx.restore();return true;
}
