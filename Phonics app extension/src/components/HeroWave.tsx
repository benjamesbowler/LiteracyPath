import { memo } from 'react';

interface HeroWaveProps {
  fill?: string;
  className?: string;
  flip?: boolean;
}

const HeroWave = memo(function HeroWave({ fill = '#008080', className = '', flip = false }: HeroWaveProps) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={className}
      style={{ transform: flip ? 'rotate(180deg)' : undefined }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0,40 C240,100 480,0 720,40 C960,80 1200,0 1440,40 L1440,120 L0,120 Z"
        fill={fill}
      />
      <path
        d="M0,60 C360,110 720,10 1080,60 C1260,85 1350,50 1440,70 L1440,120 L0,120 Z"
        fill={fill}
        opacity="0.5"
      />
    </svg>
  );
});

export default HeroWave;
