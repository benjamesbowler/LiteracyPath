// A journey extends practice at the chosen learning level. It never promotes a
// child to harder phonics just because they completed a game or a motor task.
// Only the game's settled literacy result can stamp a trail as complete.
const journeys = {
  'sound-racer': ['Orchard Loop','River Bend','Hilltop Circuit','Harbour Sprint','Pinewood Rally','Garden Grand Prix'],
  'rocket-run': ['Cloud Islands','Ringed Moon','Crystal Belt','Comet Coast','Star Garden','Aurora Run'],
  'letter-leap': ['Bramble Path','Brook Crossing','Fern Valley','Windmill Hill','Treetop Trail','Lantern Hollow'],
  'word-climb': ['Lantern Oak','Fern Tower','Willow Lookout','Old Pine','Moonlit Maple','Cloud Canopy'],
  'word-bridge': ['Willow Brook','Millstream','Pebble Creek','Waterfall Crossing','Lily Bend','Harbour Bridge'],
  'sound-beat': ['Garden Stage','Treehouse Set','Riverside Band','Lantern Concert','Hilltop Session','Festival Finale'],
  'rhyme-pop': ['Garden Fair','Harbour Parade','Orchard Carnival','Lantern Festival','Hilltop Balloons','Big Top Party'],
  'sound-safari': ['Fern Meadow','Willow Marsh','Orchard Trail','Pine Clearing','Riverbank','Lantern Woods'],
  'reel-read': ['Willow Pond','Reed Inlet','Pebble Bay','Millstream','Lily Lagoon','Harbour Waters'],
  'star-gallery': ['Garden Gate','Birch Glade','Maple Walk','Fern Hollow','Orchard Grove','Lantern Garden'],
  'sentence-express': ['Garden Station','Orchard Line','River Crossing','Pinewood Halt','Hilltop Express','Harbour Terminal'],
  'grammar-grind': ['Garden Plaza','Riverside Park','Orchard Banks','Canal Street','Hilltop Bowl','Festival Park'],
  soundkeys: ['Garden Piano','Treehouse Tunes','River Melody','Lantern Studio','Hilltop Harmony','Festival Keys']
};

export const ARCADE_JOURNEYS = Object.freeze(Object.fromEntries(Object.entries(journeys).map(([id,places])=>[id,Object.freeze({
  chapterCount: 12,
  places:Object.freeze(places),
  label: id==='sound-racer'?'Circuit':id==='sound-beat'||id==='soundkeys'?'Set':id==='sentence-express'?'Line':'Trail'
})])));

export function validArcadeChapter(value) {
  return Number.isInteger(value) && value>=0 && value<12;
}

export function completedArcadeChapters(record, difficulty) {
  const completed=record?.journeys?.[difficulty]?.completed;
  return [...new Set((Array.isArray(completed)?completed:[]).filter(validArcadeChapter))].sort((a,b)=>a-b);
}

export function nextArcadeChapter(record, difficulty, after=-1) {
  const completed=completedArcadeChapters(record,difficulty);
  for(let step=1;step<=12;step++){
    const index=(after+step)%12;
    if(!completed.includes(index))return index;
  }
  return 0;
}

export function arcadeJourneyChapter(gameId,index=0) {
  const definition=ARCADE_JOURNEYS[gameId];if(!definition)return null;
  const chapter=validArcadeChapter(index)?index:0;
  return Object.freeze({
    index:chapter,total:definition.chapterCount,label:definition.label,
    name:definition.places[chapter%6]+(chapter>=6?' · Return journey':''),
    route:chapter%6,returnJourney:chapter>=6,
    // Route families change geometry/challenge order, not literacy difficulty.
    variation:chapter%3,reverse:chapter>=6
  });
}

export function finishArcadeChapter(record, gameId, difficulty, chapter) {
  if(!ARCADE_JOURNEYS[gameId]||!['easy','medium','hard'].includes(difficulty)||!validArcadeChapter(chapter))return record;
  const completed=[...new Set([...completedArcadeChapters(record,difficulty),chapter])].sort((a,b)=>a-b);
  return {...record,journeys:{...record.journeys,[difficulty]:{v:1,completed}}};
}
