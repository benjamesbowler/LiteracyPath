import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Cat } from 'lucide-react';

interface NavbarProps {
  onScrollTo?: (id: string) => void;
}

const navLinks = [
  { label: 'Games', id: 'games' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'For Teachers', id: 'teachers' },
  { label: 'Progress', id: 'progress' },
];

export default function Navbar({ onScrollTo }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleNav = (id: string) => {
    setMobileOpen(false);
    onScrollTo?.(id);
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`
          fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between
          transition-colors duration-300
          ${scrolled ? 'bg-[rgba(255,253,247,0.95)] backdrop-blur-md shadow-sm' : 'bg-transparent'}
        `}
      >
        {/* Logo */}
        <button
          onClick={() => onScrollTo?.('')}
          className="flex items-center gap-2 text-ocean-teal hover:scale-105 transition-transform"
        >
          <Cat className="w-6 h-6" />
          <span className="font-display text-[24px]">Phonics Fun House</span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className="font-body font-bold text-[16px] text-dark-text hover:text-ocean-teal transition-colors duration-200"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* CTA Button */}
        <button
          onClick={() => handleNav('games')}
          className="hidden sm:block px-6 py-2.5 bg-coral text-white rounded-full font-body font-bold text-[14px] shadow-button hover:shadow-button-hover hover:scale-105 active:scale-[0.98] transition-all duration-200"
        >
          Start Playing
        </button>

        {/* Mobile Hamburger */}
        <button
          className="sm:hidden w-10 h-10 flex items-center justify-center text-ocean-teal"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[200] bg-ocean-teal flex flex-col items-center justify-center gap-8"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white"
              aria-label="Close menu"
            >
              <X className="w-8 h-8" />
            </button>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className="font-body font-bold text-[32px] text-white"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleNav('games')}
              className="mt-4 px-8 py-3 bg-coral text-white rounded-full font-body font-bold text-[20px] shadow-button"
            >
              Start Playing
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
