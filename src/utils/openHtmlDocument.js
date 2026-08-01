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
  prepareHtml,
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
    if (typeof prepareHtml === "function") {
      // Open the window while we are still inside the user's click. Waiting for
      // images before window.open() would cause browsers to treat the finished
      // print surface as an unsolicited popup and block it.
      const openedWindow = window.open("about:blank", name, features);
      if (!openedWindow) return { ok: false, url: "", window: null, ready: null };

      const ready = Promise.resolve()
        .then(() => prepareHtml())
        .then(preparedHtml => new Promise((resolve, reject) => {
          if (openedWindow.closed) {
            reject(new Error("The print window was closed before it was ready."));
            return;
          }

          url = makeHtmlUrl(preparedHtml);
          const afterLoad = () => {
            // A newly opened about:blank window can still deliver its own load
            // event. Ignore that event and wait for the prepared Blob document.
            try {
              if (openedWindow.location.href && openedWindow.location.href !== url) return;
            } catch { /* the final document load is still authoritative */ }
            try { openedWindow.removeEventListener("load", afterLoad); } catch { /* best effort */ }
            safelyRevoke(url);
            url = "";
            if (!autoPrint) {
              resolve(true);
              return;
            }
            window.setTimeout(() => {
              try {
                openedWindow.focus();
                openedWindow.print();
                resolve(true);
              } catch (error) {
                reject(error);
              }
            }, 300);
          };

          openedWindow.addEventListener("load", afterLoad);
          try {
            openedWindow.location.replace(url);
          } catch (error) {
            safelyRevoke(url);
            url = "";
            reject(error);
          }
        }))
        .catch(error => {
          if (url) safelyRevoke(url);
          try { openedWindow.close(); } catch { /* best-effort cleanup */ }
          throw error;
        });

      return { ok: true, url: "", window: openedWindow, ready };
    }

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
