import assert from "node:assert/strict";
import test from "node:test";
import { openHtmlDocument } from "../../src/utils/openHtmlDocument.js";

function installBrowserHarness({ blocked = false } = {}) {
  const originalWindow = globalThis.window;
  const originalUrl = globalThis.URL;
  const calls = {
    opened: [],
    revoked: [],
    focused: 0,
    printed: 0
  };
  let loadHandler = null;
  const openedWindow = {
    addEventListener(type, handler) {
      if (type === "load") loadHandler = handler;
    },
    focus() {
      calls.focused += 1;
    },
    print() {
      calls.printed += 1;
    }
  };

  globalThis.URL = {
    createObjectURL() {
      return "blob:literacy-path-print";
    },
    revokeObjectURL(url) {
      calls.revoked.push(url);
    }
  };
  globalThis.window = {
    open(...args) {
      calls.opened.push(args);
      return blocked ? null : openedWindow;
    },
    setTimeout(callback) {
      callback();
    }
  };

  return {
    calls,
    fireLoad() {
      loadHandler?.();
    },
    restore() {
      globalThis.window = originalWindow;
      globalThis.URL = originalUrl;
    }
  };
}

test("print documents load from a Blob URL, revoke it, then invoke print", () => {
  const harness = installBrowserHarness();
  try {
    const result = openHtmlDocument({
      html: "<!doctype html><title>Safe print</title>",
      name: "lp-print-test",
      features: "width=900,height=700",
      autoPrint: true
    });

    assert.equal(result.ok, true);
    assert.deepEqual(harness.calls.opened[0], [
      "blob:literacy-path-print",
      "lp-print-test",
      "width=900,height=700"
    ]);
    harness.fireLoad();
    assert.deepEqual(harness.calls.revoked, ["blob:literacy-path-print"]);
    assert.equal(harness.calls.focused, 1);
    assert.equal(harness.calls.printed, 1);
  } finally {
    harness.restore();
  }
});

test("a blocked ordinary print popup revokes its unused Blob URL", () => {
  const harness = installBrowserHarness({ blocked: true });
  try {
    const result = openHtmlDocument({
      html: "<!doctype html><title>Blocked</title>",
      name: "lp-blocked",
      features: ""
    });
    assert.deepEqual(result, { ok: false, url: "", window: null });
    assert.deepEqual(harness.calls.revoked, ["blob:literacy-path-print"]);
  } finally {
    harness.restore();
  }
});

test("a blocked presentation keeps a direct Blob URL for a real fallback link", () => {
  const harness = installBrowserHarness({ blocked: true });
  try {
    const result = openHtmlDocument({
      html: "<!doctype html><title>Presentation</title>",
      name: "lp-present",
      features: "",
      keepUrlWhenBlocked: true
    });
    assert.equal(result.ok, false);
    assert.equal(result.url, "blob:literacy-path-print");
    assert.equal(result.window, null);
    assert.deepEqual(harness.calls.revoked, []);
  } finally {
    harness.restore();
  }
});
