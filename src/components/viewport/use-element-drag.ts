import { useApplication } from '@pixi/react';
import { type Container, type FederatedPointerEvent, Point } from 'pixi.js';
import { useCallback, useRef } from 'react';

export type Position = { x: number; y: number };

type DragCallbacks = {
  onDragStart?: () => void;
  onDragMove?: (pos: Position) => void;
  onDragEnd?: (finalPos: Position) => void;
};

type UseElementDragOptions = {
  isDraggable: boolean;
  snap: (pos: Position) => Position;
  finalize: (finalPos: Position) => void;
} & DragCallbacks;

const DRAG_THRESHOLD = 2;

export const useElementDrag = ({
  isDraggable,
  snap,
  finalize,
  onDragStart,
  onDragMove,
  onDragEnd,
}: UseElementDragOptions) => {
  const { app } = useApplication();
  const dragging = useRef(false);
  const startScreen = useRef(new Point());
  const startWorld = useRef(new Point());
  const startPos = useRef(new Point());
  const lastPos = useRef(new Point());

  const handlePointerDown = useCallback(
    (e: FederatedPointerEvent) => {
      if (!isDraggable) return;
      const group = e.target as Container;
      const stage = app?.stage;
      if (!group || !stage) return;
      const world = {
        x: (e.global.x - stage.x) / stage.scale.x,
        y: (e.global.y - stage.y) / stage.scale.y,
      };
      dragging.current = true;
      onDragStart?.();
      startScreen.current.set(e.global.x, e.global.y);
      startWorld.current.set(world.x, world.y);
      startPos.current.set(group.x, group.y);
      lastPos.current.set(group.x, group.y);
      e.stopPropagation();
    },
    [isDraggable, app]
  );

  const handleGlobalPointerMove = useCallback(
    (e: FederatedPointerEvent) => {
      if (!dragging.current) return;
      const stage = app?.stage;
      if (!stage) return;

      const dx = e.global.x - startScreen.current.x;
      const dy = e.global.y - startScreen.current.y;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

      const world = {
        x: (e.global.x - stage.x) / stage.scale.x,
        y: (e.global.y - stage.y) / stage.scale.y,
      };
      const dx2 = world.x - startWorld.current.x;
      const dy2 = world.y - startWorld.current.y;
      const newPos = snap({
        x: startPos.current.x + dx2,
        y: startPos.current.y + dy2,
      });
      const group = e.target as Container;
      if (!group) return;
      group.x = newPos.x;
      group.y = newPos.y;
      lastPos.current.set(newPos.x, newPos.y);
      onDragMove?.(newPos);
    },
    [app, snap, onDragMove]
  );

  const handlePointerUp = useCallback(
    (e: FederatedPointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      finalize(lastPos.current);
      onDragEnd?.(lastPos.current);
    },
    [finalize, onDragEnd]
  );

  return {
    onPointerDown: handlePointerDown,
    onGlobalPointerMove: handleGlobalPointerMove,
    onPointerUp: handlePointerUp,
    onPointerUpOutside: handlePointerUp,
  };
};
