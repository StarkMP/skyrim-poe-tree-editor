import { ReactNode, useCallback, useRef, useState } from 'react';
import { ClassNameValue } from 'tailwind-merge';

import { cn } from '@/lib/utils';

type ZoomPanWrapperProps = {
  scaleStep?: number;
  minScale?: number;
  maxScale?: number;
  className?: ClassNameValue;
  children: ReactNode;
};

export const ZoomPanWrapper = ({
  scaleStep = 1.05,
  minScale = 0.1,
  maxScale = 3,
  className,
  children,
}: ZoomPanWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      // e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldScale = scale;
      const mousePointTo = {
        x: (mouseX - position.x) / oldScale,
        y: (mouseY - position.y) / oldScale,
      };

      let newScale = e.deltaY > 0 ? oldScale / scaleStep : oldScale * scaleStep;
      newScale = Math.max(minScale, Math.min(newScale, maxScale));

      const newPos = {
        x: mouseX - mousePointTo.x * newScale,
        y: mouseY - mousePointTo.y * newScale,
      };

      setScale(newScale);
      setPosition(newPos);
    },
    [scale, position]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setMouseDownPos({ x: e.clientX, y: e.clientY });
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Начинаем драг только если мышь сдвинулась больше чем на 3 пикселя
      if (!isDragging && mouseDownPos.x !== 0) {
        const dx = Math.abs(e.clientX - mouseDownPos.x);
        const dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 3 || dy > 3) {
          setIsDragging(true);
        }
      }

      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, mouseDownPos]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setMouseDownPos({ x: 0, y: 0 });
  }, []);

  return (
    <div
      className={cn('size-full relative overflow-hidden', className)}
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        draggable={false}
        style={{
          position: 'absolute',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          userSelect: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};
