import sharp from 'sharp';

// Atlas objects can have overlapping bounding rectangles without touching.
// Retain the largest connected alpha component, including its antialias edge,
// so an adjacent object never appears as a fragment in the extracted sprite.
export async function connectedAlphaCrop(input, rect) {
  const [left, top, width, height] = rect;
  const { data, info } = await sharp(input).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const labels = new Int32Array(width * height), areas = [0];
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] <= 24) continue;
    const label = areas.length, stack = [start];
    labels[start] = label;
    let area = 0;
    while (stack.length) {
      const pixel = stack.pop(), x = pixel % width, y = Math.floor(pixel / width);
      area++;
      for (const next of [x ? pixel - 1 : -1, x < width - 1 ? pixel + 1 : -1, y ? pixel - width : -1, y < height - 1 ? pixel + width : -1]) {
        if (next < 0 || labels[next] || data[next * 4 + 3] <= 24) continue;
        labels[next] = label;
        stack.push(next);
      }
    }
    areas.push(area);
  }
  const retained = areas.indexOf(Math.max(...areas));
  if (!retained) throw new Error('Empty atlas object');
  const keep = new Uint8Array(labels.length);
  for (let pixel = 0; pixel < labels.length; pixel++) {
    if (labels[pixel] !== retained) continue;
    const x = pixel % width, y = Math.floor(pixel / width);
    for (let yy = Math.max(0, y - 2); yy <= Math.min(height - 1, y + 2); yy++) {
      for (let xx = Math.max(0, x - 2); xx <= Math.min(width - 1, x + 2); xx++) keep[yy * width + xx] = 1;
    }
  }
  for (let pixel = 0; pixel < labels.length; pixel++) if (!keep[pixel]) data[pixel * 4 + 3] = 0;
  return sharp(data, { raw: info }).png().toBuffer();
}
