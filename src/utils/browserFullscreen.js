export function getBrowserFullscreenElement(doc = globalThis.document) {
  return doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
}

export async function requestBrowserFullscreen(
  element = globalThis.document?.documentElement
) {
  const request = element?.requestFullscreen || element?.webkitRequestFullscreen;
  if (typeof request !== "function") return false;
  try {
    await Promise.resolve(request.call(element));
    return true;
  } catch {
    return false;
  }
}

export async function exitBrowserFullscreen(doc = globalThis.document) {
  const exit = doc?.exitFullscreen || doc?.webkitExitFullscreen;
  if (typeof exit !== "function") return false;
  try {
    await Promise.resolve(exit.call(doc));
    return true;
  } catch {
    return false;
  }
}

export function addBrowserFullscreenListener(doc, listener) {
  if (!doc?.addEventListener || typeof listener !== "function") return () => {};
  doc.addEventListener("fullscreenchange", listener);
  doc.addEventListener("webkitfullscreenchange", listener);
  return () => {
    doc.removeEventListener("fullscreenchange", listener);
    doc.removeEventListener("webkitfullscreenchange", listener);
  };
}
