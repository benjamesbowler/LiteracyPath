import { PRESENT_CHILD_READING_SENTENCES, getPresentChildReadingSentences } from '../../data/presentVocabulary.js';
import { PRESENT_RETELL_STORY } from '../../data/presentTeachingContent.js';

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
  const { cycle, world, day, slide, esc, wordAudio, wordImage, audioButton, sentenceAudio, shuffle, review, mediaUrl, initialSoundCards = [] } = c;
  const make = (inner, options) => slide(world, inner, options);
  const views = {};
  const spellings = review.cards.map(card => card.spelling);
  const sentences = PRESENT_CHILD_READING_SENTENCES.map(card => ({ ...card, imagePath: mediaUrl(card.imagePath), audioPath: sentenceAudio(card.sentence) }));
  const childReading = getPresentChildReadingSentences(spellings, review.words).length === sentences.length;
  views.studio = make(`<p class="p-kicker">Read together · change the verb</p><p class="p-teacher-prompt">Read the sentence. Change the action and read again.</p>
    <div data-sentence-studio data-studio-sentences="${esc(JSON.stringify(sentences))}"><p class="p-studio-print">${esc(sentences[0].sentence)}</p><img class="p-studio-scene" src="${esc(sentences[0].imagePath)}" alt="${esc(sentences[0].sceneRequirements)}"/>
    <div class="p-lesson-actions"><button type="button" class="p-audio" data-studio-hear>Hear</button><button type="button" class="p-audio" data-studio-change>Change verb</button></div><p class="p-teacher-prompt" data-studio-prompt>${esc(sentences[0].meaningPrompt)}</p></div>`,
    { cls: 'p-sentence-studio', section: 'Reading', meta: { target: 'A cat sat. → A cat ran.', sentences, construct: childReading ? 'code-controlled-child-reading' : 'supported-shared-reading-change', requiredAudio: sentences.map(card => ({src:card.audioPath,type:'audio',role:'sentence',transcript:card.sentence,required:true})), codeStatus: childReading ? 'all-running-words-taught' : 'adult-support-for-untaught-code', readingPurpose: childReading ? 'child-reading' : 'read-together', answer:'sat changes to ran; the picture changes from sitting to running.', teacher:{model:childReading ? 'Read the print, attend to the changed verb and explain its meaning.' : 'Teacher reads untaught spellings; children join in and explain the changed action.',likelyError:'Guessing a word from its picture.',correction:'Point to the letters and blend the verb; then compare the depicted action.',support:'Model the sentence after children try.',stretch:'Explain what the changed word changes.'} } });

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

  const story = {...PRESENT_RETELL_STORY,events:PRESENT_RETELL_STORY.events.map(event => ({...event,imagePath:mediaUrl(event.imagePath),audioPath:sentenceAudio(event.text)}))};
  const firstEvent = story.events[0];
  views.retell = make(`<p class="p-kicker">A seed grows · story</p><p class="p-teacher-prompt">Read and listen to one scene at a time. Then put the pictures in order.</p>
    <div data-retell-game data-story="${esc(JSON.stringify(story))}"><div class="p-story-panel" data-story-panel><img src="${esc(firstEvent.imagePath)}" alt="${esc(firstEvent.sceneRequirements)}"/><p data-story-text>${esc(firstEvent.text)}</p></div>
    <div class="p-lesson-actions" data-story-actions><button class="p-audio" type="button" data-story-hear>Hear</button><button class="p-audio" type="button" data-story-next>Next scene</button></div>
    <div data-story-sequence hidden><div class="p-retell-cards">${shuffle(story.events,`${cycle.id}:${day}:retell`).map(event => `<button type="button" data-retell-event="${event.id}" aria-label="${esc(event.text)}"><img src="${esc(event.imagePath)}" alt="${esc(event.sceneRequirements)}"/><span class="p-retell-text">${esc(event.text)}</span><span class="p-story-position"></span></button>`).join('')}</div><div class="p-retell-order" hidden></div><div class="p-lesson-actions"><button class="p-audio" type="button" data-retell-check disabled>Check order</button><button class="p-audio p-audio-ghost" type="button" data-retell-reset>Again</button></div></div><p data-retell-feedback role="status">First: plant the seed.</p></div>`,
    {cls:'p-retell-story',section:'Reading',meta:{target:story.title,construct:'oral-narrative',story,requiredAudio:story.events.map(event=>({src:event.audioPath,type:'audio',role:'story-event',transcript:event.text,required:true})),answer:story.teacherModel,teacher:{model:story.events.map(event=>event.text).join(' '),likelyError:'Putting the sprout before watering.',correction:'Look at what changed and retell first, next, later.',support:'Name each event with a gesture.',stretch:'Explain why watering came before the sprout.'},evidenceClaim:'teacher-sampled-oral-narrative'}});
  return views;
}
