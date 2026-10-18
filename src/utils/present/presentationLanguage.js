// Language choices use today's real shared-reading sentence and picture.
// The teacher models unfamiliar print; this is oral language and print awareness,
// not an independent decoding or grammar assessment.
export function presentLanguageActivity({card,kind,variant=0,world,slide,esc,mediaUrl,shuffle}) {
  const text=card.sentence;
  let prompt,stem,choices,explanation,objective;
  if(kind==='punctuation') {
    const mode=variant%3;
    if(mode===0) {
      prompt='Which sentence starts correctly?';
      stem='Start a sentence with a capital letter.';
      choices=[text,text[0].toLowerCase()+text.slice(1)];
      explanation=`A capital letter starts our sentence: ${text}`;
      objective='sentence-capital';
    } else if(mode===1) {
      const mark=text.endsWith('?')?'?':'.';
      prompt=mark==='?'?'Which mark ends a question?':'Which mark ends this telling sentence?';
      stem=text.replace(/[.!?]$/,'')+' ___';
      choices=[mark,mark==='?'?'.':'?'];
      explanation=mark==='?'?`A question mark ends a question. ${text}`:`A full stop ends a telling sentence. ${text}`;
      objective=mark==='?'?'question-mark':'full-stop';
    } else {
      prompt='Which sentence is easy to read?';
      stem='Leave a space between words.';
      choices=[text,text.replaceAll(' ','')];
      explanation=`Spaces separate the words: ${text}`;
      objective='word-spaces';
    }
  } else {
    const match=/\b(is|are|has|have|a|an)\b/.exec(text);
    if(match) {
      const word=match[0];
      const other={is:'are',are:'is',has:'have',have:'has',a:'an',an:'a'}[word];
      prompt='Which word completes our sentence?';
      stem=text.slice(0,match.index)+'___'+text.slice(match.index+word.length);
      choices=[word,other];
      const rule={is:'Use is with one person or thing.',are:'Use are with you or more than one.',has:'One person or thing has something.',have:'Use have with I, you, we or they.',a:'Use a before a consonant sound.',an:'Use an before a vowel sound.'}[word];
      explanation=`${rule} Read: ${text}`;
      objective=['is','are'].includes(word)?'is-and-are':['has','have'].includes(word)?'has-and-have':'a-and-an';
    } else {
      prompt='Which sentence is in the right order?';
      const tokens=text.split(' ');
      stem='Say a complete sentence about the picture.';
      choices=[text,[tokens[1],tokens[0],...tokens.slice(2)].join(' ')];
      explanation=`Read the complete sentence: ${text}`;
      objective='sentence-order';
    }
  }
  const answer=choices[0];
  const ordered=shuffle(choices.map((value,index)=>({value,correct:index===0})),`${card.id}:${kind}:${variant}`);
  return slide(world,`<p class="p-kicker">${kind==='punctuation'?'Sentence helpers':'Say it correctly'}</p><p class="p-teacher-prompt">${esc(prompt)} Think, tell a partner, then choose together.</p><div class="p-language-layout" data-language-activity><img class="p-language-picture" src="${esc(mediaUrl(card.imagePath))}" alt="${esc(card.sceneRequirements)}"/><div class="p-language-response"><p class="p-language-stem">${esc(stem)}</p><div class="p-language-choices">${ordered.map(choice=>`<button class="p-language-choice${/^[.?]$/.test(choice.value)?' p-language-mark':''}" type="button" data-language-choice data-language-correct="${choice.correct}" data-language-explanation="${esc(choice.correct?explanation:'Look at the sentence and try again.')}" aria-pressed="false">${esc(choice.value)}</button>`).join('')}</div><p class="p-class-feedback" data-language-feedback role="status">Say your choice before the teacher selects.</p></div></div>`,{
    cls:'p-language',section:'Reading',teacher:`Read all print aloud. Model: ${text} ${explanation} Ask everyone to explain the choice, then reread the full sentence. This is supported language practice, not a score.`,
    meta:{target:text,construct:kind==='punctuation'?'supported-print-conventions':'supported-basic-grammar',languageObjective:objective,answer,choices:ordered.map(choice=>({text:choice.value,correct:choice.correct})),imagePath:card.imagePath,imageRole:card.imageRole,sceneRequirements:card.sceneRequirements,codeStatus:'adult-supported',childReadingClaim:false,responseTurns:3}
  });
}
