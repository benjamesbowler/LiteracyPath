import { useCallback, useEffect, useEffectEvent, useMemo, useState } from "react";

import { advanceArcadePosition } from "./maths2dArcadeEngine.js";

const LEFT_KEYS = new Set(["ArrowLeft", "a", "A"]);
const RIGHT_KEYS = new Set(["ArrowRight", "d", "D"]);

function isTypingTarget(target) {
  return target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

export function useArcadeXAxis({
  disabled = false,
  maximum = 95,
  minimum = 5,
  onArrive,
  paused = false,
  position,
  setPosition,
  speed = 34,
  target = null
}) {
  const [heldDirection, setHeldDirection] = useState(0);

  const start = useCallback(direction => {
    if (disabled || paused) return;
    const numericDirection = direction === "left" ? -1 : 1;
    setHeldDirection(numericDirection);
    setPosition(current => advanceArcadePosition(current, numericDirection, 28, { maximum, minimum, speed }));
  }, [disabled, maximum, minimum, paused, setPosition, speed]);

  const stop = useCallback(direction => {
    const numericDirection = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    setHeldDirection(current => !numericDirection || current === numericDirection ? 0 : current);
  }, []);

  useEffect(() => {
    const keyDown = event => {
      if (disabled || paused || event.repeat || isTypingTarget(event.target)) return;
      if (LEFT_KEYS.has(event.key)) {
        event.preventDefault();
        start("left");
      } else if (RIGHT_KEYS.has(event.key)) {
        event.preventDefault();
        start("right");
      }
    };
    const keyUp = event => {
      if (LEFT_KEYS.has(event.key)) stop("left");
      if (RIGHT_KEYS.has(event.key)) stop("right");
    };
    const blur = () => stop();
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
    };
  }, [disabled, paused, start, stop]);

  const moveFrame = useEffectEvent(elapsed => {
    let direction = heldDirection;
    if (!direction && Number.isFinite(target)) {
      const difference = target - position;
      if (Math.abs(difference) < 0.01) return;
      direction = difference < 0 ? -1 : 1;
    }
    if (!direction) return;
    const next = advanceArcadePosition(position, direction, elapsed, { maximum, minimum, speed });
    const arrived = Number.isFinite(target) && ((direction < 0 && next <= target) || (direction > 0 && next >= target));
    setPosition(arrived ? target : next);
    if (arrived) onArrive?.();
  });

  useEffect(() => {
    if (disabled || paused) return undefined;
    let animationFrame = 0;
    let previousTime = performance.now();
    const move = currentTime => {
      const elapsed = currentTime - previousTime;
      previousTime = currentTime;
      moveFrame(elapsed);
      animationFrame = window.requestAnimationFrame(move);
    };
    animationFrame = window.requestAnimationFrame(move);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [disabled, paused]);

  const pointerDown = useCallback(event => {
    const direction = event.currentTarget.dataset.arcadeDirection;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    start(direction);
  }, [start]);
  const pointerUp = useCallback(event => {
    const direction = event.currentTarget.dataset.arcadeDirection;
    event.preventDefault();
    stop(direction);
  }, [stop]);
  const pointerStop = useCallback(event => stop(event.currentTarget.dataset.arcadeDirection), [stop]);

  return useMemo(() => Object.freeze({
    left: Object.freeze({ "data-arcade-direction": "left", onLostPointerCapture: pointerStop, onPointerCancel: pointerStop, onPointerDown: pointerDown, onPointerUp: pointerUp }),
    right: Object.freeze({ "data-arcade-direction": "right", onLostPointerCapture: pointerStop, onPointerCancel: pointerStop, onPointerDown: pointerDown, onPointerUp: pointerUp }),
    stop
  }), [pointerDown, pointerStop, pointerUp, stop]);
}
