// The original Rocket Run and Letter Leap backing-pixel ceiling is shared by
// every Arcade renderer. Graphics work may shrink; gameplay clocks and source
// artwork do not change with the device's pixel density.
export const ARCADE_BACKING_PIXEL_BUDGET = 1_600_000;

export function readArcadeDeviceSignals() {
  const nav = typeof navigator === 'undefined' ? {} : navigator;
  const view = typeof window === 'undefined' ? {} : window;
  return { userAgent: nav.userAgent || '', platform: nav.platform || '',
    maxTouchPoints: nav.maxTouchPoints || 0, devicePixelRatio: view.devicePixelRatio || 1,
    width: view.innerWidth || 1, height: view.innerHeight || 1 };
}

export function isAppleTouchDevice(signals = readArcadeDeviceSignals()) {
  return /iPad|iPhone|iPod/.test(signals.userAgent || '')
    || (/Mac/.test(signals.platform || signals.userAgent || '') && Number(signals.maxTouchPoints) > 1);
}

export function arcadePixelRatio(cap = 1.5, width, height, signals = readArcadeDeviceSignals()) {
  const area = Math.max(1, Number(width ?? signals.width) || 1) * Math.max(1, Number(height ?? signals.height) || 1);
  const density = Math.max(1, Number(signals.devicePixelRatio) || 1);
  const deviceCap = isAppleTouchDevice(signals) ? 1 : Math.max(1, Number(cap) || 1);
  return Math.min(density, deviceCap, Math.max(1, Math.sqrt(ARCADE_BACKING_PIXEL_BUDGET / area)));
}
