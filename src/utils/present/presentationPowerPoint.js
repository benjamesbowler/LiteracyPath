import { buildCyclePresentation } from './presentationBuilder.js';
import { deduplicatePowerPointMedia } from './powerPointPackage.js';
import { buildPresentationPowerPointPlan } from './presentationPowerPointPlan.js';

const INK = '18263E', BLUE = '3454C8', MUTED = '5C677A';
const W = 13.333333;
const cacheKey = value => String(value || '');

function dataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('A lesson asset could not be read.'));
    reader.readAsDataURL(blob);
  });
}

async function imageData(src, signal) {
  // Inline formation drawings can load as images under the site's policy.
  // Fetching a data URL would instead be blocked by connect-src.
  const inline = src.startsWith('data:image/');
  let url = src;
  if (!inline) {
    const response = await fetch(src, { signal });
    if (!response.ok) throw new Error(`A lesson picture could not download (${response.status}). Please try again.`);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('A lesson picture is unavailable. Please try again.');
    url = URL.createObjectURL(blob);
  }
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(image.naturalWidth * scale); canvas.height = Math.ceil(image.naturalHeight * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
  } finally {
    if (!inline) URL.revokeObjectURL(url);
  }
}

async function loadFonts() {
  for (const [family, file] of [['Andika', 'andika'], ['Source Sans 3', 'source-sans-3']]) {
    for (const weight of [400, 700]) {
      const face = new FontFace(`Present Export ${family}`, `url(/fonts/present/${file}-latin-${weight}-normal.woff2)`, { weight: String(weight) });
      await face.load(); document.fonts.add(face);
    }
  }
}

// Learning print is rasterized with the bundled Andika. It therefore retains
// its single-storey a/g and barred I on an offline computer without that font.
function textPicture(text, width, height, { size = 64, color = INK, bold = false, align = 'center', teacher = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * 144); canvas.height = Math.round(height * 144);
  const ctx = canvas.getContext('2d');
  const family = teacher ? 'Present Export Source Sans 3' : 'Present Export Andika';
  let lines;
  for (; size >= 12; size -= 2) {
    ctx.font = `${bold ? 700 : 400} ${size}px "${family}"`;
    lines = [];
    for (const paragraph of String(text || '').split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width > canvas.width - 24 && line) { lines.push(line); line = word; } else line = candidate;
      }
      lines.push(line);
    }
    if (lines.length * size * 1.4 <= canvas.height - 12 && lines.every(line => ctx.measureText(line).width <= canvas.width - 24)) break;
  }
  ctx.fillStyle = `#${color}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  const lineHeight = size * 1.4, top = (canvas.height - (lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, align === 'center' ? canvas.width / 2 : 12, top + i * lineHeight));
  return canvas.toDataURL('image/png');
}

export async function createPresentationPowerPoint(cycleId, { day, signal, onProgress = () => {} } = {}) {
  onProgress('Preparing the lesson…');
  const deck = buildCyclePresentation(cycleId, { day });
  const parsed = new DOMParser().parseFromString(deck.html, 'text/html');
  const plan = buildPresentationPowerPointPlan(deck, parsed);
  const [{ default: PptxGenJS }] = await Promise.all([import('pptxgenjs'), loadFonts()]);
  const pictures = new Map(), recordings = new Map();
  const pictureSources = [...new Set(plan.slides.flatMap(slide => slide.images || []).map(item => item.src).filter(Boolean))];
  const audioSources = [...new Set(plan.slides.flatMap(slide => slide.audio || []).map(item => item.src).filter(Boolean))];
  const jobs = [...pictureSources.map(src => async () => pictures.set(cacheKey(src), await imageData(src, signal))), ...audioSources.map(src => async () => {
    const response = await fetch(src, { signal });
    if (!response.ok) throw new Error(`A lesson recording could not download (${response.status}). Please try again.`);
    const blob = await response.blob();
    if (!blob.type.startsWith('audio/') && !blob.type.includes('octet-stream')) throw new Error('A lesson recording is unavailable. Please try again.');
    recordings.set(cacheKey(src), await dataUrl(blob));
  })];
  let completed = 0, cursor = 0, failed = false;
  await Promise.all(Array.from({ length: Math.min(6, jobs.length) }, async () => {
    while (!failed && cursor < jobs.length) {
      signal?.throwIfAborted();
      try { await jobs[cursor++](); } catch (error) { failed = true; throw error; }
      completed += 1;
      if (!failed) onProgress(`Embedding pictures and sound… ${completed} of ${jobs.length}`);
    }
  }));
  signal?.throwIfAborted();
  onProgress('Building the PowerPoint…');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'Little Literacy Guides'; pptx.subject = 'Offline teacher-led daily literacy lesson'; pptx.title = plan.title; pptx.company = 'Little Literacy Guides'; pptx.lang = 'en-US';
  const indexes = new Map(plan.slides.map((slide, index) => [slide.id, index + 1]));
  const textCache = new Map();
  const putText = (slide, text, x, y, w, h, options = {}) => {
    if (!text) return;
    const key = JSON.stringify([text, w, h, options]);
    if (!textCache.has(key)) textCache.set(key, textPicture(text, w, h, options));
    slide.addImage({ data: textCache.get(key), x, y, w, h, altText: String(text), ...(options.hyperlink ? { hyperlink: options.hyperlink } : {}) });
  };
  const button = (slide, label, target, x, y, w, h, fill = 'FFFFFF', color = BLUE) => {
    const destination = indexes.get(target);
    if (!destination) throw new Error(`The lesson has a broken slide link: ${target}`);
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, radius: 0.1, rectRadius: 0.08, fill: { color: fill }, line: { color, width: 1 }, hyperlink: { slide: destination, tooltip: label } });
    putText(slide, label, x + 0.04, y + 0.02, w - 0.08, h - 0.04, { size: 36, color, teacher: true, hyperlink: { slide: destination, tooltip: label } });
  };
  for (let index = 0; index < plan.slides.length; index++) {
    signal?.throwIfAborted();
    const item = plan.slides[index], slide = pptx.addSlide();
    // Branches stay reachable by links, but arrow-key progression skips them.
    slide.hidden = item.id !== 'start' && item.id !== 'end' && !item.main;
    slide.background = { color: 'F7F8FA' };
    putText(slide, item.title, 0.45, 0.15, W - 0.9, 0.58, { size: 44, color: MUTED, teacher: true });
    if (item.feedback) {
      const correct = item.feedback !== 'incorrect';
      putText(slide, item.feedback === 'revealed' ? 'Revealed' : correct ? '✓ Correct. Read it together.' : '× Try again. Explain and repair.', 0.5, 0.78, 12.3, 0.5, { size: 42, color: correct ? '137333' : 'B3261E', bold: true });
    }
    if (item.formation) {
      const picture = item.images[0];
      const data = pictures.get(cacheKey(picture.src));
      const h = 4.8, w = h * data.width / data.height;
      slide.addImage({ data: data.data, x: (W - w) / 2, y: 1.05, w, h, altText: picture.label });
    } else if (item.cards) {
      const width = 2.85, gap = 0.25;
      const left = (W - 4 * width - 3 * gap) / 2;
      item.cards.forEach((card, i) => button(slide, card.label, card.target, left + i % 4 * (width + gap), 1.4 + Math.floor(i / 4) * 1.55, width, 1.3, card.matched ? 'E6F4EA' : card.revealed ? 'E9EDF9' : BLUE, card.revealed ? INK : 'FFFFFF'));
    } else {
      const images = (item.images || []).filter(image => image.src);
      const hasPicture = images.length > 0;
      const pictureW = hasPicture ? (item.story ? 3.1 : 4.3) : 0;
      images.forEach((image, i) => {
        const data = pictures.get(cacheKey(image.src));
        const box = { x: 0.65 + i % 2 * (pictureW / Math.min(2, images.length)), y: 1.35 + Math.floor(i / 2) * 1.65, w: pictureW / Math.min(2, images.length) - 0.1, h: images.length > 2 ? 1.4 : 3.65 };
        const ratio = Math.min(box.w / data.width, box.h / data.height);
        const w = data.width * ratio, h = data.height * ratio;
        slide.addImage({ data: data.data, x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h, altText: image.label || 'Lesson picture' });
        if (images.length > 1 && image.label && image.label.length < 30) putText(slide, image.label, box.x, box.y + box.h, box.w, 0.35, { size: 30 });
      });
      const x = hasPicture ? pictureW + 1 : 0.7, w = W - x - 0.7;
      putText(slide, item.story, x, 1.2, w, 1.65, { size: 36, align: 'left' });
      const y = item.story ? 3 : item.feedback ? 1.5 : 1.25;
      const buttonRows = Math.ceil((item.buttons?.length || 0) / ((item.buttons?.length || 0) > 4 ? 4 : 3));
      const h = Math.min(item.story ? 1.8 : 3.4, 5.45 - Math.max(0, buttonRows - 1) * 0.61 - y);
      putText(slide, item.text, x, y, w, h, { size: String(item.text).length < 8 ? 200 : String(item.text).length < 30 ? 104 : 72, bold: String(item.text).length < 8, color: item.feedback === 'incorrect' ? 'B3261E' : INK });
    }
    const buttons = item.buttons || [];
    const columns = Math.min(buttons.length, buttons.length > 4 ? 4 : 3), rows = Math.ceil(buttons.length / (columns || 1));
    const buttonW = Math.min(3.75, (12 - (columns - 1) * 0.2) / (columns || 1));
    buttons.forEach((control, i) => {
      const row = Math.floor(i / columns);
      const countInRow = Math.min(columns, buttons.length - row * columns);
      const left = (W - countInRow * buttonW - (countInRow - 1) * 0.2) / 2;
      button(slide, control.label, control.target, left + i % columns * (buttonW + 0.2), 5.58 - (rows - 1 - row) * 0.61, buttonW, 0.53);
    });
    putText(slide, item.prompt, 0.6, 6.16, 12.1, 0.53, { size: 29, teacher: true, color: MUTED });
    const audio = (item.audio || []).filter(cue => cue.src);
    // Each native speaker object contains its recording bytes. No URLs or
    // browser are required when it is clicked in PowerPoint Slide Show.
    audio.forEach((cue, i) => {
      const x = 0.5 + i * Math.min(1.55, 9 / Math.max(1, audio.length));
      slide.addMedia({ type: 'audio', data: recordings.get(cacheKey(cue.src)), extn: /\.(wav|ogg)(?:[?#]|$)/.exec(cue.src)?.[1] || 'mp3', x, y: 6.84, w: 0.35, h: 0.35, objectName: cue.label });
      putText(slide, cue.label, x + 0.36, 6.83, Math.min(1.15, 9 / Math.max(1, audio.length) - 0.4), 0.39, { size: 22, teacher: true, align: 'left', color: MUTED });
    });
    button(slide, 'Slides', 'overview0', 9.8, 6.86, 0.85, 0.4);
    if (item.previous) button(slide, 'Back', item.previous, 10.8, 6.86, 0.85, 0.4);
    if (item.next) button(slide, 'Next', item.next, 11.8, 6.86, 0.85, 0.4, BLUE, 'FFFFFF');
    slide.addNotes(`${item.notes || ''}\nOffline slide ${index + 1} of ${plan.slides.length}. Classroom activity source ${item.sourceIndex == null ? 'orientation' : item.sourceIndex + 1}. Use on-screen links to preserve the activity path. B pauses the screen. PowerPoint’s pen supports teacher modelling.`);
    if (index % 15 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }
  onProgress('Saving the PowerPoint…');
  const raw = await pptx.write({ outputType: 'blob', compression: true });
  const blob = await deduplicatePowerPointMedia(raw);
  signal?.throwIfAborted();
  return { blob, filename: `Literacy-Guide-${cycleId}-${day}.pptx`, slideCount: plan.slides.length, sourceSlideCount: plan.sourceSlideCount };
}

export async function downloadPresentationPowerPoint(cycleId, options = {}) {
  const result = await createPresentationPowerPoint(cycleId, options);
  options.signal?.throwIfAborted();
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a'); link.href = url; link.download = result.filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return result;
}
