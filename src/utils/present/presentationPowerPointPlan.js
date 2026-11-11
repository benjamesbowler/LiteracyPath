// PowerPoint uses native slide links for responses and repair. Keep the daily
// builder as the source of content, including its otherwise-hidden rounds.
export function buildPresentationPowerPointPlan(deck, document) {
  const sections = [...document.querySelectorAll('#deck > section')];
  const slides = [];
  const clean = node => node?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const unique = items => [...new Map(items.filter(item => item.src).map(item => [item.src, item])).values()];
  const push = (source, state, data = {}) => {
    const slide = { id: `${source.index}:${state}`, sourceIndex: source.index, title: source.title, text: '', prompt: '', images: [], audio: [], buttons: [], notes: Object.values(source.teacher || {}).filter(value => typeof value === 'string').join('\n'), ...data };
    slides.push(slide);
    return slide;
  };
  const choices = (source, key, data, options, explanation = source.answer) => {
    const question = push(source, key, { ...data, main: true });
    question.buttons = options.map((option, index) => ({ label: option.text, target: `${source.index}:${key}:choice${index}` }));
    options.forEach((option, index) => push(source, `${key}:choice${index}`, { ...data, text: option.correct ? (option.explanation || explanation) : `${option.text}\nTry again. Think, explain and repair.`, feedback: option.correct ? 'correct' : 'incorrect', buttons: [{ label: option.correct ? 'Try this round again' : 'Try again', target: question.id }], audio: option.correct ? data.answerAudio || data.audio || [] : data.audio || [] }));
    return question;
  };
  for (const source of deck.manifest.slides) {
    const section = sections[source.index];
    if (!section) throw new Error('The lesson is missing a slide.');
    const prompt = clean(section.querySelector('.p-teacher-prompt, .p-h2'));
    const images = unique([...section.querySelectorAll('img:not(.p-pal)')].map(node => ({ src: node.getAttribute('src'), label: node.getAttribute('alt') || source.media.find(item => item.src === node.getAttribute('src'))?.meaning || '' })));
    const audio = unique([...section.querySelectorAll('[data-play]')].map(node => ({ src: node.getAttribute('data-play'), label: clean(node) || 'Hear' })));
    const base = { prompt, images, audio };
    if (source.reviewItems?.length) {
      source.reviewItems.forEach((card, index) => push(source, `review${index}`, { main: true, ...base, text: card.text, images: card.imagePath ? [{ src: card.imagePath, label: card.anchorWord }] : [], audio: unique([{ src: card.audio, label: 'Hear sound or word' }, { src: card.anchorAudio, label: `Hear ${card.anchorWord}` }, ...(card.variants || []).map(item => ({ src: item.src, label: item.label }))]), prompt: card.anchorWord ? `Say the sound. Name ${card.anchorWord}. Give another spoken example.` : 'Read together. Use the word in a fresh spoken phrase.' }));
    } else if (source.construct === 'supported-sentence-picture-comparison') {
      source.rounds.forEach((round, index) => choices(source, `round${index}`, { ...base, title: `${source.title} · ${index + 1} of ${source.rounds.length}`, images: [{ src: round.imagePath, label: round.sceneRequirements }], text: round.sentence, audio: round.audioPath ? [{ src: round.audioPath, label: 'Hear sentence' }] : [], answerAudio: [{ src: round.correctAudioPath, label: 'Hear true sentence' }] }, [{ text: 'True', correct: round.matches }, { text: 'False', correct: !round.matches }], `${round.matches ? 'True.' : 'False.'}\n${round.correctSentence}`));
    } else if (source.construct === 'supported-sentence-ordering' || source.construct === 'encoding') {
      const rounds = source.rounds || [{ sentence: source.answer, imagePath: images[0]?.src, audioPath: audio[0]?.src }];
      rounds.forEach((round, index) => {
        const sentence = round.sentence;
        const parts = source.construct === 'encoding' ? source.materials.graphemes : sentence.split(/\s+/);
        const bank = parts.map((text, i) => ({ text, i })).sort((a, b) => (a.i * 7 + 3) % parts.length - (b.i * 7 + 3) % parts.length).reverse();
        const key = `build${index}`;
        const roundBase = { ...base, images: round.imagePath ? [{ src: round.imagePath, label: round.sceneRequirements || '' }] : [], title: `${source.title}${rounds.length > 1 ? ` · ${index + 1} of ${rounds.length}` : ''}` };
        if (source.construct !== 'encoding') push(source, `${key}:read`, { ...roundBase, main: true, text: sentence, prompt: 'Read together for 15 seconds. When ready, choose Mix the words.', audio: [{ src: round.audioPath, label: 'Hear sentence' }], buttons: [{ label: 'Mix the words', target: `${source.index}:${key}:0` }] });
        for (let step = 0; step <= parts.length; step++) {
          const done = step === parts.length;
          const node = push(source, `${key}:${step}`, { ...roundBase, main: source.construct === 'encoding' && step === 0, text: `${parts.slice(0, step).join(source.construct === 'encoding' ? '' : ' ')}${done ? '' : ' ___'}`, prompt: done ? 'Read and explain the complete word or sentence.' : 'Everyone proposes the next part. The teacher chooses. Use Undo to repair.', feedback: done ? 'correct' : '', audio: source.construct === 'encoding' || done ? [{ src: round.audioPath, label: source.construct === 'encoding' ? 'Hear word' : 'Hear sentence' }] : [], buttons: [] });
          if (!done) node.buttons.push(...bank.filter(item => item.i >= step).map(item => ({ label: item.text, target: `${source.index}:${key}:${item.text === parts[step] ? step + 1 : `wrong${step}-${item.i}`}` })));
          if (step) node.buttons.push({ label: 'Undo', target: `${source.index}:${key}:${step - 1}` });
          node.buttons.push({ label: 'Read it again', target: `${source.index}:${key}:${source.construct === 'encoding' ? '0' : 'read'}` });
          if (!done) bank.filter(item => item.i >= step && item.text !== parts[step]).forEach(item => push(source, `${key}:wrong${step}-${item.i}`, { ...roundBase, text: [...parts.slice(0, step), item.text].join(source.construct === 'encoding' ? '' : ' '), prompt: 'Read this draft. Compare its order with the sounds or meaning. Undo to repair.', audio: source.construct === 'encoding' ? [{ src: round.audioPath, label: 'Hear word' }] : [], feedback: 'incorrect', buttons: [{ label: 'Undo and try again', target: node.id }] }));
        }
      });
    } else if (source.rounds?.[0]?.items) {
      source.rounds.forEach((round, index) => {
        const key = `missing${index}`;
        push(source, key, { ...base, main: true, title: `${source.title} · ${index + 1} of ${source.rounds.length}`, text: round.items.map(item => item.text).join('     '), audio: unique(round.items.map(item => ({ src: item.audio, label: `Hear ${item.text}` }))), buttons: [{ label: 'Hide one', target: `${source.index}:${key}:hidden` }] });
        push(source, `${key}:hidden`, { ...base, text: round.items.map((item, i) => i === round.targetIndex ? '______' : item.text).join('     '), audio: [], prompt: 'What is missing? Say it. Use it in a fresh phrase.', buttons: [{ label: 'Reveal', target: `${source.index}:${key}:revealed` }] });
        push(source, `${key}:revealed`, { ...base, text: round.items.map(item => item.text).join('     '), audio: [], feedback: 'revealed', prompt: `Revealed: ${round.items[round.targetIndex].text}`, buttons: [{ label: 'Play this round again', target: `${source.index}:${key}` }] });
      });
    } else if (section.querySelector('[data-match-game]')) {
      const cards = [...section.querySelectorAll('[data-match-word]')].map(node => ({ value: node.getAttribute('data-match-word'), text: clean(node.querySelector('.p-card-word')) }));
      // Eight cards have only 256 reveal boards. Native links preserve each
      // visible card and let the teacher hide a mismatch or retain a matched pair.
      for (let mask = 0; mask < 2 ** cards.length; mask++) {
        const open = cards.filter((_, index) => mask & (1 << index));
        const matched = open.filter(card => open.filter(other => other.value === card.value).length > 1);
        push(source, `memory${mask}`, { main: mask === 0, ...base, images: [], audio: [], prompt: 'Choose numbered cards. Read the words. Keep pairs open. Hide cards that do not match.', cards: cards.map((card, index) => ({ label: mask & (1 << index) ? card.text : String(index + 1), revealed: Boolean(mask & (1 << index)), matched: matched.includes(card), target: `${source.index}:memory${mask ^ (1 << index)}` })), buttons: [{ label: 'Hide unmatched cards', target: `${source.index}:memory${cards.reduce((value, card, i) => matched.includes(card) ? value | (1 << i) : value, 0)}` }, { label: 'Play again', target: `${source.index}:memory0` }], feedback: matched.length === cards.length ? 'correct' : '' });
      }
    } else if (source.sort) {
      source.sort.items.forEach((item, index) => choices(source, `sort${index}`, { ...base, images: [{ src: section.querySelectorAll('[data-sort-item] img')[index]?.getAttribute('src'), label: item.word }], text: '', audio: audio.filter(cue => cue.label === `Hear picture ${index + 1}`), prompt: 'Name this picture. Choose its starting sound.' }, source.sort.headings.map((text, i) => ({ text, correct: i === item.group })), item.reason));
    } else if (source.choices?.length || source.options?.length) {
      const options = (source.choices || source.options).map(item => typeof item === 'string' ? { text: item, correct: item === source.answer } : { ...item, text: item.text || item.value, correct: item.correct ?? (item.text || item.value) === source.answer });
      const stem = clean(section.querySelector('.p-language-stem, .p-short-prompt'));
      const answer = clean(section.querySelector('[data-language-choice][data-language-correct="true"]'));
      const explanation = section.querySelector('[data-language-correct="true"]')?.getAttribute('data-language-explanation');
      choices(source, 'choice', { ...base, images: source.oralFamily === 'rhyme' ? images : images.slice(0, 1), text: stem || '', prompt, story: clean(section.querySelector('.p-short-reread')), audio }, options, explanation || [answer || source.answer, ...(source.evidence || [])].join('\n'));
    } else if (source.construct === 'letter-formation') {
      [...String(source.modelText || source.target)].forEach((letter, index) => {
        const group = section.querySelectorAll('[data-writing-letter]')[index];
        const paths = [...group.querySelectorAll('.p-ink-stroke')];
        const guides = paths.map(path => `<path d="${path.getAttribute('d')}" fill="none" stroke="#B2BDCF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
        const arrows = paths.map(path => {
          const length = path.getTotalLength();
          const start = path.getPointAtLength(0);
          const points = Array.from({ length: 7 }, (_, point) => {
            const position = path.getPointAtLength(length * (0.3 + point * 0.065));
            return `${point ? 'L' : 'M'}${position.x.toFixed(2)} ${position.y.toFixed(2)}`;
          }).join(' ');
          return `<circle cx="${start.x}" cy="${start.y}" r="2.8" fill="#3454C8"/><path d="${points}" fill="none" stroke="#3454C8" stroke-width="2.2" stroke-linecap="round" marker-end="url(#direction)"/>`;
        }).join('');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 100 140"><defs><marker id="direction" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#3454C8"/></marker></defs><rect width="100" height="140" fill="white"/><path d="M0 20H100 M0 70H100 M0 120H100" fill="none" stroke="#B9C2D2" stroke-width="1"/>${guides}${arrows}</svg>`;
        push(source, `letter${index}`, {
          ...base, main: true, formation: true,
          title: `Write ${letter === letter.toUpperCase() ? 'uppercase' : 'lowercase'} ${letter}`,
          images: [{ src: `data:image/svg+xml;base64,${btoa(svg)}`, label: `Formation model for ${letter}` }],
          prompt: 'Start at a dot and follow the arrows. Lift between strokes. Practise on paper or use PowerPoint’s pen.',
          audio: source.audioRoles.filter(item => item.src).map(item => ({ src: item.src, label: 'Hear instructions' }))
        });
      });
    } else {
      const text = [...section.querySelectorAll('.p-letter, .p-sight, .p-hfw-example, .p-shared-sentence, .p-title, .p-phase, .p-blurb, .p-short-story, .p-language-stem, .p-phoneme, .p-tile-btn, .p-made, .p-tile, .p-response')].filter(node => !node.closest('.p-answer')).map(clean).filter(Boolean).join('\n') || source.storyText || (section.querySelector('[data-reveal-toggle]') ? '' : source.target);
      const node = push(source, 'main', { ...base, main: true, text });
      if (section.querySelector('[data-memory-toggle]')) {
        node.buttons.push({ label: 'Hide and air-write', target: `${source.index}:hidden` });
        push(source, 'hidden', { ...base, text: '', images: [], audio: [], prompt: 'Air-write from memory. Compare with the model when ready.', buttons: [{ label: 'Show and compare', target: node.id }] });
      }
      if (section.querySelector('[data-reveal-toggle]')) {
        node.text = text.replace(clean(section.querySelector('.p-answer')), '').trim();
        node.buttons.push({ label: 'Show the answer', target: `${source.index}:answer` });
        push(source, 'answer', { ...base, text: clean(section.querySelector('.p-answer')) || source.answer, feedback: 'revealed', buttons: [{ label: 'Try again', target: node.id }] });
      }
    }
  }
  // Next always reaches the next actual classroom round, never a feedback
  // branch or a different memory-board state in the physical slide order.
  const mains = slides.filter(slide => slide.main);
  slides.forEach(slide => {
    const following = mains.find(main => slides.indexOf(main) > slides.indexOf(slide));
    slide.next = following?.id || 'end';
    const previous = mains.filter(main => slides.indexOf(main) < slides.indexOf(slide)).at(-1);
    slide.previous = previous?.id || 'start';
  });
  slides.unshift({ id: 'start', title: deck.title, text: 'Our daily lesson', prompt: 'Open Slide Show. On Mac, choose Pointer Options → Visible for the buttons. Click a speaker to hear its recording.', notes: 'Works offline after download. All pictures and recordings are embedded. Construction activities use linked word tiles. For writing, model with PowerPoint’s pen and invite air-writing. For memory, choose Hide unmatched cards after discussion. Reading time is teacher-paced. Supported participation is unscored.', images: [], audio: [], buttons: [{ label: 'Start lesson', target: mains[0]?.id || 'end' }], next: mains[0]?.id || 'end' });
  slides.push({ id: 'end', title: 'Lesson complete', text: 'Well done. Tell someone what you learned.', images: [], audio: [], buttons: [{ label: 'Start again', target: 'start' }], previous: mains.at(-1)?.id || 'start' });
  for (let page = 0; page < Math.ceil(mains.length / 9); page++) {
    const buttons = mains.slice(page * 9, page * 9 + 9).map((slide, i) => ({ label: `${page * 9 + i + 1}. ${slide.title}`, target: slide.id }));
    slides.push({ id: `overview${page}`, title: `Choose a lesson slide · ${page + 1} of ${Math.ceil(mains.length / 9)}`, text: '', images: [], audio: [], buttons, previous: page ? `overview${page - 1}` : 'start', next: page + 1 < Math.ceil(mains.length / 9) ? `overview${page + 1}` : 'end' });
  }
  return { title: deck.title, slides, sourceSlideCount: sections.length, activityCount: mains.length };
}
