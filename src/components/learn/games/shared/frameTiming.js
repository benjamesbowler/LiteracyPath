export function createPausableFrameTimer(nowProvider = () => performance.now()) {
  let previousFrameTime = null;
  let paused = false;
  let elapsed = 0;

  return {
    pause() {
      paused = true;
      previousFrameTime = null;
    },
    read(now) {
      if (paused) {
        previousFrameTime = null;
        return 0;
      }
      const currentTime = Number.isFinite(now) ? now : nowProvider();
      if (previousFrameTime === null) {
        previousFrameTime = currentTime;
        return 0;
      }
      const delta = Math.max(0, (currentTime - previousFrameTime) / 1000);
      previousFrameTime = currentTime;
      elapsed += delta;
      return delta;
    },
    reset() {
      previousFrameTime = null;
    },
    resume() {
      paused = false;
      previousFrameTime = null;
    },
    snapshot() {
      return { elapsed, paused, previousFrameTime };
    }
  };
}

export function neutralizeArcadeInput(keys = {}, pointer = {}) {
  Object.keys(keys).forEach(key => {
    keys[key] = false;
  });
  pointer.active = false;
  pointer.steer = 0;
  pointer.throttle = 0;
}
