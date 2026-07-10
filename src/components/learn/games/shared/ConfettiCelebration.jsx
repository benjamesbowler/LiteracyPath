import Confetti from "react-confetti";
import { useEffect, useState } from "react";

export function ConfettiCelebration({ show }) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const prefersReducedMotion = typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!show || prefersReducedMotion) return null;
  return (
    <Confetti
      width={size.width}
      height={size.height}
      recycle={false}
      numberOfPieces={180}
      gravity={0.22}
    />
  );
}

export default ConfettiCelebration;
