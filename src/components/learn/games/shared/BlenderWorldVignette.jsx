import { useEffect, useRef } from 'react';
import { createBlenderWorldSprite, BLENDER_SPRITE } from './arcadeBlenderWorlds.js';
import './blenderWorldVignette.css';

export default function BlenderWorldVignette({ gameId, isPaused, active = true }) {
  const canvas = useRef(null);
  const playback = useRef({ isPaused, active });
  useEffect(() => { playback.current = { isPaused, active }; }, [isPaused, active]);
  useEffect(() => {
    const node = canvas.current, ctx = node.getContext('2d');
    const sprite = createBlenderWorldSprite(gameId, node);
    let frame;
    const draw = time => {
      ctx.clearRect(0, 0, node.width, node.height);
      sprite.draw(ctx, 0, 0, node.width, node.height, time / 1000, {
        paused: !playback.current.active || playback.current.isPaused?.()
      });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); sprite.dispose(); };
  }, [gameId]);
  return <canvas ref={canvas} width={BLENDER_SPRITE.size} height={BLENDER_SPRITE.size} className={`blender-world-vignette blender-world-vignette--${gameId}`} aria-hidden="true" />;
}
