import { useState, useEffect, useRef } from "react";

export function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef(value);
  const raf = useRef<number>();

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const t0 = performance.now();

    const tick = (now: number) => {
      const pct = Math.min((now - t0) / duration, 1);
      const eased = 1 - (1 - pct) * (1 - pct);
      setDisplay(Math.round(start + diff * eased));
      if (pct < 1) raf.current = requestAnimationFrame(tick);
    };

    ref.current = value;
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return <>{display.toLocaleString("uz-UZ")} so'm</>;
}
