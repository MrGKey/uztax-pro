import { useRef, useState, useCallback, type ReactNode } from "react";
import { haptic } from "../utils/telegram";

interface Props {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "pulling" | "ready" | "loading">("idle");
  const startY = useRef(0);
  const pullDist = useRef(0);
  const triggered = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pullDist.current = 0;
      triggered.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === 0) return;
    const dist = e.touches[0].clientY - startY.current;
    if (dist > 0) {
      pullDist.current = dist;
      if (dist > 60 && !triggered.current) {
        setState("ready");
      } else if (dist <= 60) {
        setState("pulling");
      }
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDist.current > 60) {
      setState("loading");
      haptic("impact");
      triggered.current = true;
      try {
        await onRefresh();
      } finally {
        setState("idle");
      }
    } else {
      setState("idle");
    }
    startY.current = 0;
    pullDist.current = 0;
  }, [onRefresh]);

  const arrowRotation = Math.min(pullDist.current / 60, 1) * 180;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="ptr-container"
    >
      {state !== "idle" && (
        <div className="ptr-indicator" style={{ opacity: Math.min(pullDist.current / 40, 1) }}>
          {state === "loading" ? (
            <div className="ptr-spinner" />
          ) : (
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ transform: `rotate(${arrowRotation}deg)`, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              <polyline points="6 15 12 9 18 15" />
            </svg>
          )}
          {state === "pulling" && "Yangilash uchun torting"}
          {state === "ready" && "Qo'yib yuboring"}
          {state === "loading" && "Yangilanmoqda..."}
        </div>
      )}
      {children}
    </div>
  );
}
