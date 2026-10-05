// Retained Railway.blend frames use one 512x320 viewport in a 4x2 sheet.
// These are actual opaque source pixels, not the dimensions of the full img
// element. The native renderer may change the viewport size or scroll it.
export const SENTENCE_EXPRESS_STOCK_CONTACTS = Object.freeze({
  wagon: Object.freeze({ leftCoupler: [26, 231], rightCoupler: [485, 231], sole: [130, 310] }),
  caboose: Object.freeze({ leftCoupler: [26, 231], rightCoupler: [485, 231], sole: [130, 310] })
});

const finite = rect => rect && ['left', 'top', 'width', 'height'].every(key => Number.isFinite(rect[key]))
  && rect.width > 0 && rect.height > 0;

export function sentenceExpressStockGeometry(viewport, kind, stage) {
  const measured = SENTENCE_EXPRESS_STOCK_CONTACTS[kind];
  if (!measured || !finite(viewport) || !finite(stage)) return null;
  const pixel = ([x, y]) => ({
    x: viewport.left - stage.left + x / 512 * viewport.width,
    y: viewport.top - stage.top + y / 320 * viewport.height
  });
  return { leftCoupler: pixel(measured.leftCoupler), rightCoupler: pixel(measured.rightCoupler),
    sole: pixel(measured.sole), viewport: {
      x: viewport.left - stage.left, y: viewport.top - stage.top, width: viewport.width, height: viewport.height
    }, representation: 'retained-rolling-stock-source-pixels' };
}

// Coupling ownership follows the last physically filled wagon. No model,
// answer label or selected word enters this query. An unloaded/ghost stock
// cannot establish a delivered source contact.
export function measureSentenceExpressRail(stage) {
  if (!stage?.getBoundingClientRect) return null;
  const bounds = stage.getBoundingClientRect();
  const filled = [...stage.querySelectorAll('.sx-train > .sx-carbox:not(.sx-ghostbox):not(.sx-kind-caboose)')];
  const last = filled.at(-1), stock = last?.querySelector('.sx-stock.is-ready');
  const kind = last?.classList.contains('sx-kind-engine') ? 'engine' : 'wagon';
  const contact = stock ? sentenceExpressStockGeometry(stock.getBoundingClientRect(), kind, bounds) : null;
  const rail = stage.querySelector('.sx-trackbed')?.getBoundingClientRect();
  return {
    width: bounds.width, height: bounds.height,
    railY: contact?.sole.y ?? (rail ? rail.top - bounds.top : bounds.height * .46),
    contact, filledCarriages: filled.length,
    sourceContactDelivery: contact ? 'delivered' : stock ? 'unregistered-kind' : 'unavailable',
    visible: contact ? contact.rightCoupler.x >= 0 && contact.rightCoupler.x <= bounds.width : false
  };
}
