import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else { document.body.style.overflow = ""; setDragY(0); }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target === sheetRef.current || (e.target as HTMLElement).closest(".sheet-handle")) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = e.touches[0].clientY - startY.current;
    setDragY(Math.max(0, dy));
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragY > 100) onClose();
    setDragY(0);
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div
        ref={sheetRef}
        className="sheet"
        style={{ transform: `translateY(${dragY}px)`, transition: isDragging.current ? "none" : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)" }}
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
