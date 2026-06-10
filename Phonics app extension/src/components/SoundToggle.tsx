import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '@/lib/progress';

interface SoundToggleProps {
  onToggle?: (enabled: boolean) => void;
}

export default function SoundToggle({ onToggle }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    onToggle?.(next);
  };

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-[1000] w-12 h-12 rounded-full bg-white border-2 border-ocean-teal shadow-card flex items-center justify-center hover:scale-105 transition-transform duration-200"
      aria-label={enabled ? 'Turn sound off' : 'Turn sound on'}
    >
      {enabled ? (
        <Volume2 className="w-6 h-6 text-ocean-teal" />
      ) : (
        <VolumeX className="w-6 h-6 text-ocean-teal" />
      )}
    </button>
  );
}
