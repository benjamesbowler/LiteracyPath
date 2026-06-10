import { lazy } from "react";

export const DYNAMIC_IMPORT_ERROR_EVENT = "lp-dynamic-import-failed";
const RELOAD_SESSION_KEY = "lp-dynamic-import-reloaded";

export function isDynamicImportError(error) {
  const message = String(error?.message || error || "");
  return /failed to fetch dynamically imported module|importing a module script failed|loading chunk|chunkloaderror|vite:preloaderror/i.test(message);
}

function notifyDynamicImportFailure(error) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DYNAMIC_IMPORT_ERROR_EVENT, {
    detail: {
      message: String(error?.message || error || "A new version is available.")
    }
  }));
}

export function reloadOnceForNewVersion() {
  if (typeof window === "undefined") return false;

  try {
    if (window.sessionStorage?.getItem(RELOAD_SESSION_KEY) === "1") return false;
    window.sessionStorage?.setItem(RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export async function importWithRetry(importer) {
  try {
    return await importer();
  } catch (error) {
    if (!isDynamicImportError(error)) throw error;
  }

  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    return await importer();
  } catch (retryError) {
    if (!isDynamicImportError(retryError)) throw retryError;
    notifyDynamicImportFailure(retryError);
    if (reloadOnceForNewVersion()) {
      return new Promise(() => {});
    }
    throw retryError;
  }
}

export function lazyWithRetry(importer) {
  return lazy(() => importWithRetry(importer));
}
