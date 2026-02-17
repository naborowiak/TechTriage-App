import { useState, useEffect } from 'react';

/**
 * Animates a number from 0 to target using smoothstep easing.
 * Lightweight alternative to odometer/counter libraries.
 */
export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // smoothstep: 3t^2 - 2t^3
      const eased = t * t * (3 - 2 * t);
      setValue(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}
