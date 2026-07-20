import Confetti from "react-confetti";
import { useEffect, useState } from "react";

export function ConfettiCelebration({ show, reducedMotion = false }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => Boolean(
    typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  ));

  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setPrefersReducedMotion(Boolean(query.matches));
    syncReducedMotion();
    if (query.addEventListener) query.addEventListener("change", syncReducedMotion);
    else query.addListener?.(syncReducedMotion);
    return () => {
      if (query.removeEventListener) query.removeEventListener("change", syncReducedMotion);
      else query.removeListener?.(syncReducedMotion);
    };
  }, []);

  // The in-app "Reduce motion" toggle reaches the confetti too - it used to
  // check only the OS query, so the Den setting quietly did nothing here.
  if (!show || prefersReducedMotion || reducedMotion) return null;
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
