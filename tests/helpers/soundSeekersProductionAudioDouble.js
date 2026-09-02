const INSTALLATION = Symbol.for("literacy-path.sound-seekers.production-audio-double");

export function installSoundSeekersProductionAudioDouble() {
  if (globalThis[INSTALLATION]) return globalThis[INSTALLATION];
  const instances = [];
  class SoundSeekersProductionAudioDouble {
    constructor() {
      this.listeners = new Map();
      this.currentTime = 0;
      this.volume = 1;
      this.src = "";
      instances.push(this);
    }

    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }

    removeEventListener(type, listener) {
      this.listeners.set(type, (this.listeners.get(type) || [])
        .filter(candidate => candidate !== listener));
    }

    load() {}
    pause() {}
    play() {
      const audio = this;
      return {
        then(onStarted) {
          onStarted();
          for (const listener of [...(audio.listeners.get("ended") || [])]) listener();
          return { catch() {} };
        },
        catch() { return this; }
      };
    }
  }
  globalThis.Audio = SoundSeekersProductionAudioDouble;
  const installation = Object.freeze({ instances });
  Object.defineProperty(globalThis, INSTALLATION, {
    value: installation,
    configurable: true
  });
  return installation;
}
