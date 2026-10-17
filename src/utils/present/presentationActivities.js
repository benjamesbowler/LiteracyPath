// Picture names have unambiguous initial sounds. Select from taught letters;
// early lessons can contrast their one letter with an unnamed “other sound”.
const INITIAL_PICTURES = {
  a: ['apple', 'ant'], m: ['map', 'mat'], t: ['tap', 'tent'], s: ['sun', 'sock'],
  n: ['net', 'nut'], i: ['insect', 'ink'], f: ['fan', 'fish'], d: ['dog', 'duck'],
  o: ['octopus', 'otter'], l: ['lamp', 'leaf'], r: ['rat', 'rug'], h: ['hat', 'hen'],
  b: ['bag', 'bus'], w: ['web', 'wig'], u: ['umbrella', 'up'], c: ['cat', 'cup'],
  g: ['goat', 'gum'], p: ['pig', 'pen'], y: ['yo-yo', 'yak'], e: ['egg', 'elephant'],
  v: ['van', 'vest'], k: ['kite', 'key'], j: ['jet', 'jug'], z: ['zip', 'zebra']
};

export function buildPresentActivityViews(c) {
  const { cycle, world, day, slide, esc, wordAudio, wordImage, audioButton, shuffle, review, initialSoundCards = [] } = c;
  const make = (inner, options) => slide(world, inner, options);
  const views = {};
  const spellings = review.cards.map(card => card.spelling);
  const usable = Object.entries(INITIAL_PICTURES).map(([letter, words]) => ({letter, words:words.filter(word => wordImage(word) && wordAudio(word))})).filter(group => group.words.length);
  const current = initialSoundCards.map(card => card.spelling);
  const known = usable.filter(group => spellings.includes(group.letter));
  const first = known.find(group => current.includes(group.letter)) || shuffle(known,`${cycle.id}:${day}:initial-first`)[0];
  if (first) {
    const second = shuffle(known.filter(group => group.letter !== first.letter && !(['c','k'].includes(group.letter) && ['c','k'].includes(first.letter))), `${cycle.id}:${day}:initial-second`)[0];
    const contrast = second || usable.find(group => group.letter !== first.letter);
    const groups = [first, contrast];
    const headings = [first.letter, second ? second.letter : 'Other sound'];
    const items = shuffle(groups.flatMap((group, index) => group.words.slice(0, 2).map(word => ({word,group:index,reason:index === 1 && !second ? `${word} starts with a different sound.` : `${word} starts with ${group.letter}.`}))), `${cycle.id}:${day}:initial-sort`);
    const sort = { id:`initial-${headings.join('-')}`, construct:'initial-phoneme', headings, items, prompt:'Name a picture. Choose its starting sound.' };
    views.sort = make(`<p class="p-kicker">Starting sound picture sort</p><p class="p-teacher-prompt">Tap a picture, then its starting letter.</p><div data-sort-game data-sort-construct="initial-phoneme"><div class="p-sort-items">${items.map((item,index) => `<div class="p-sort-choice"><button class="p-sort-item" type="button" data-sort-item="${index}" data-sort-group="${item.group}" data-sort-word="${esc(item.word)}" data-sort-reason="${esc(item.reason)}" aria-label="Picture ${index+1}" aria-pressed="false"><img src="${esc(wordImage(item.word))}" alt="Picture to name"/></button>${audioButton(wordAudio(item.word),`Hear picture ${index+1}`)}</div>`).join('')}</div><div class="p-sort-bins">${headings.map((heading,index) => `<button type="button" data-sort-bin="${index}"><strong>${esc(heading)}</strong><span data-sort-placed></span></button>`).join('')}</div><p data-sort-feedback role="status">Choose a picture.</p><button class="p-audio p-audio-ghost" type="button" data-sort-reset>Again</button></div>`,
      { cls:'p-cooperative-sort',section:'Review',meta:{target:sort.id,construct:sort.construct,sort,answer:items.map(item=>`${item.word}: ${headings[item.group]}`).join('; '),teacher:{model:sort.prompt,likelyError:'Sorting by meaning instead of starting sound.',correction:'Name the picture and stretch its first sound.',support:'Name unfamiliar pictures and model one sort.',stretch:'Give another example for a letter.'}} });
  }

  return views;
}
