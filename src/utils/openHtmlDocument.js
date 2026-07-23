function makeHtmlUrl(html) {
  return URL.createObjectURL(new Blob([html], { type: "text/html" }));
}

function safelyRevoke(url) {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // The document is already loaded; revocation is best-effort cleanup.
  }
}

export function openHtmlDocument({
  html,
  name,
  features,
  autoPrint = false,
  keepUrlWhenBlocked = false
}) {
  if (typeof window === "undefined") {
    return { ok: false, url: "", window: null };
  }

  let url = "";
  try {
    url = makeHtmlUrl(html);
    const openedWindow = window.open(url, name, features);
    if (!openedWindow) {
      if (keepUrlWhenBlocked) return { ok: false, url, window: null };
      safelyRevoke(url);
      return { ok: false, url: "", window: null };
    }

    const afterLoad = () => {
      safelyRevoke(url);
      if (!autoPrint) return;
      window.setTimeout(() => {
        try {
          openedWindow.focus();
          openedWindow.print();
        } catch {
          // The print surface remains open even when the browser blocks printing.
        }
      }, 300);
    };

    openedWindow.addEventListener("load", afterLoad, { once: true });
    return { ok: true, url: "", window: openedWindow };
  } catch {
    if (url) safelyRevoke(url);
    return { ok: false, url: "", window: null };
  }
}
