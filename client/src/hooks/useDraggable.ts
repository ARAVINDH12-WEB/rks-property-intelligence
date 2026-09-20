import { useState, useEffect, useRef, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  storageKey: string;
  getDefaultPosition: () => Position;
  elementWidth?: number;
  elementHeight?: number;
}

export function useDraggable({
  storageKey,
  getDefaultPosition,
  elementWidth = 56,
  elementHeight = 56,
}: UseDraggableOptions) {
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const maxX = Math.max(8, window.innerWidth - elementWidth - 8);
          const maxY = Math.max(8, window.innerHeight - elementHeight - 8);
          return {
            x: Math.min(Math.max(8, parsed.x), maxX),
            y: Math.min(Math.max(8, parsed.y), maxY),
          };
        }
      }
    } catch {}
    return getDefaultPosition();
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    moved: false,
  });

  // Clamp position when window resizes
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = Math.max(8, window.innerWidth - elementWidth - 8);
        const maxY = Math.max(8, window.innerHeight - elementHeight - 8);
        return {
          x: Math.min(Math.max(8, prev.x), maxX),
          y: Math.min(Math.max(8, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [elementWidth, elementHeight]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: position.x,
        posY: position.y,
        moved: false,
      };

      setIsDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    },
    [position]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        dragStartRef.current.moved = true;
      }

      const maxX = Math.max(8, window.innerWidth - elementWidth - 8);
      const maxY = Math.max(8, window.innerHeight - elementHeight - 8);

      const newX = Math.min(Math.max(8, dragStartRef.current.posX + dx), maxX);
      const newY = Math.min(Math.max(8, dragStartRef.current.posY + dy), maxY);

      setPosition({ x: newX, y: newY });
    },
    [isDragging, elementWidth, elementHeight]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch {}
    },
    [isDragging, position, storageKey]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent, onActualClick?: () => void) => {
      if (dragStartRef.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (onActualClick) {
        onActualClick();
      }
    },
    []
  );

  return {
    position,
    isDragging,
    wasMoved: dragStartRef.current.moved,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      style: {
        position: 'fixed' as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none' as const,
        userSelect: 'none' as const,
        zIndex: 9990,
      },
    },
    handleClick,
  };
}
