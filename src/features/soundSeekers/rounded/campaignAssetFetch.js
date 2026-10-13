const RETRY_DELAY_MS = 200;

function abortReason(signal) {
  return signal.reason ?? new DOMException('The place was closed', 'AbortError');
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortReason(signal);
}

async function fetchOnce(url, fetcher, signal) {
  if (!signal) return fetcher(url, { signal });
  let onAbort;
  const cancelled = new Promise((resolve, reject) => {
    onAbort = () => reject(abortReason(signal));
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    // The real fetch receives the same signal to cancel network work. The race
    // also prevents a late transport result from keeping a closed place alive.
    return await Promise.race([fetcher(url, { signal }), cancelled]);
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}

function waitForRetry(signal) {
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(abortReason(signal));
    };
    const timer = setTimeout(finish, RETRY_DELAY_MS);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

/** Fetch the exact canonical asset with one transient retry, within its owner's
 * existing loading deadline. HTTP validation, body reading and GLB parsing stay
 * with the caller: missing or corrupt art must retain the supported fallback. */
export async function fetchCampaignAsset(url, { signal, fetcher = fetch } = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    throwIfAborted(signal);
    let response;
    try {
      response = await fetchOnce(url, fetcher, signal);
    } catch (error) {
      throwIfAborted(signal);
      const networkFailure = error?.name === 'TypeError' || error?.name === 'NetworkError';
      if (attempt || !networkFailure) throw error;
      await waitForRetry(signal);
      continue;
    }
    throwIfAborted(signal);
    const transient = response.status === 408 || response.status === 429
      || (response.status >= 500 && response.status < 600);
    if (attempt || !transient) return response;
    // Do not retain an unread error body while another request is pending.
    response.body?.cancel().catch(() => {});
    await waitForRetry(signal);
  }
}
