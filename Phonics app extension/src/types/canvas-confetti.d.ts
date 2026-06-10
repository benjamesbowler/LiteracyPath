declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    spread?: number;
    ticks?: number;
    gravity?: number;
    decay?: number;
    startVelocity?: number;
    colors?: string[];
    scalar?: number;
    shapes?: ('circle' | 'square' | 'star')[];
    origin?: { x?: number; y?: number };
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }
  function confetti(options?: Options): Promise<null>;
  export = confetti;
}
