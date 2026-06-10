import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import SoundToggle from './SoundToggle';

interface LayoutProps {
  children: ReactNode;
  onScrollTo?: (id: string) => void;
  onSoundToggle?: (enabled: boolean) => void;
}

export default function Layout({ children, onScrollTo, onSoundToggle }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] font-body">
      <Navbar onScrollTo={onScrollTo} />
      <main>{children}</main>
      <Footer onScrollTo={onScrollTo} />
      <SoundToggle onToggle={onSoundToggle} />
    </div>
  );
}
