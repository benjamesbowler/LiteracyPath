import { useEffect, useMemo } from "react";
import { createSoundSeekersAudioController } from "./soundSeekersAudioController.js";

const OPTION_KEYS = Object.freeze(["enabled", "progressScopeKey"]);

function canonicalOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)
    || Object.getPrototypeOf(options) !== Object.prototype
    || Reflect.ownKeys(options).some(key => typeof key !== "string" || !OPTION_KEYS.includes(key))) {
    throw new TypeError("Sound Seekers audio options must be a plain enabled/scope record");
  }
  const enabled = options.enabled ?? true;
  const progressScopeKey = options.progressScopeKey ?? "default";
  if (typeof enabled !== "boolean"
    || typeof progressScopeKey !== "string" || !progressScopeKey.trim()) {
    throw new TypeError("Sound Seekers audio needs a valid enabled flag and progress scope");
  }
  return { enabled, progressScopeKey };
}

export function useSoundSeekersAudioController(options = {}) {
  const { enabled, progressScopeKey } = canonicalOptions(options);
  const controller = useMemo(
    () => createSoundSeekersAudioController({ enabled, scopeKey: progressScopeKey }),
    [enabled, progressScopeKey]
  );

  useEffect(() => () => controller.dispose(), [controller]);
  return controller;
}
