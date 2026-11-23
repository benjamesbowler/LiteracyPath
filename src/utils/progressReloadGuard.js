let recovery;

export function registerProgressReloadGuard(handler) {
  recovery = handler;
}

export function hasVolatileProgress() {
  return Boolean(recovery?.hasVolatileProgress());
}

export async function retryVolatileProgress() {
  return recovery ? recovery.retry() : false;
}
