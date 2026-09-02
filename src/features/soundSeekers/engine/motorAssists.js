export const MOTOR_ASSIST_KEYS = Object.freeze([
  "autoTravel",
  "slowerMovement",
  "noDamageTravel",
  "largerTargets",
  "simplifiedScene",
  "extendedResponse"
]);

const MOTOR_ASSIST_KEY_SET = new Set(MOTOR_ASSIST_KEYS);

export function normalizeMotorAssists(raw = {}) {
  const value = raw === undefined || raw === null ? {} : raw;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("motor assists must be an object");
  }
  for (const key of Object.keys(value)) {
    if (!MOTOR_ASSIST_KEY_SET.has(key)) throw new Error(`unknown motor assist: ${key}`);
    if (typeof value[key] !== "boolean") throw new Error(`${key} motor assist must be boolean`);
  }
  return Object.freeze(Object.fromEntries(MOTOR_ASSIST_KEYS.map(key => [key, value[key] === true])));
}

export function projectMotorPresentation(raw = {}) {
  const assists = normalizeMotorAssists(raw);
  return Object.freeze({
    travelMode: assists.autoTravel ? "automatic" : "manual",
    movementPace: assists.slowerMovement ? "slower" : "standard",
    travelConsequence: assists.noDamageTravel ? "protected" : "standard",
    targetScale: assists.largerTargets ? "large" : "standard",
    sceneDensity: assists.simplifiedScene ? "simplified" : "full",
    responsePacing: assists.extendedResponse ? "extended" : "standard"
  });
}
