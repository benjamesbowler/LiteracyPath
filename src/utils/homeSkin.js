// The student-side skin flag.
//
// "sage" (default since 2026-07-15) is the calm shell — sage/cream/forest,
// see src/styles/home-sage.css + sage-subpages.css. "comic" is the original
// pop-art look, kept fully intact so anyone can switch back from the
// account menu ("Back to classic look"). The flag is presentation only;
// no behaviour may ever read it for anything but styling.
//
// Resolution order: ?homeSkin= query (one-off preview) > localStorage > sage.

const KEY = "lp-home-skin";
const EVENT = "lp-home-skin-changed";

export function readHomeSkin() {
  try {
    const fromQuery = new URLSearchParams(window.location.search).get("homeSkin");
    if (fromQuery === "sage" || fromQuery === "comic") return fromQuery;
    return window.localStorage.getItem(KEY) === "comic" ? "comic" : "sage";
  } catch {
    return "sage";
  }
}

export function setHomeSkin(next) {
  const value = next === "comic" ? "comic" : "sage";
  try { window.localStorage.setItem(KEY, value); } catch { /* best effort */ }
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: { skin: value } })); } catch { /* best effort */ }
  return value;
}

export function subscribeHomeSkin(listener) {
  const handler = () => listener(readHomeSkin());
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
