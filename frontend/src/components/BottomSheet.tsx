import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const dragY = useRef(0);
  const isDragging = useRef(false);
  const raf = useRef<number>();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; if (raf.current) cancelAnimationFrame(raf.current); };
  }, [open]);

  if (!open) return null;

  const setTransform = (y: number) => {
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${y}px)`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target === sheetRef.current || (e.target as HTMLElement).closest(".sheet-handle")) {
      startY.current = e.touches[0].clientY;
      dragY.current = 0;
      isDragging.current = true;
      if (sheetRef.current) sheetRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = Math.max(0, e.touches[0].clientY - startY.current);
    dragY.current = dy;
    cancelAnimationFrame(raf.current!);
    raf.current = requestAnimationFrame(() => setTransform(dy));
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragY.current > 100) onClose();
    else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)";
        setTransform(0);
      }
    }
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div
        ref={sheetRef}
        className="sheet"
        style={{ transform: "translateY(0)", transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sheet-handle" />
        {children}
      </div>
    </>
  );
}
