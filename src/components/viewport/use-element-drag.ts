import { type FederatedPointerEvent, Point } from 'pixi.js';
import { useCallback, useEffect, useRef } from 'react';

import { useViewport } from './context';

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
  const viewport = useViewport();
  const dragging = useRef(false);
  const moved = useRef(false);
  const draggedClick = useRef(false);
  const finishDragRef = useRef<() => void>(() => {});
  const startScreen = useRef(new Point());
  const startWorld = useRef(new Point());
  const startPos = useRef(new Point());
  const lastPos = useRef(new Point());

  const resumeViewportDrag = useCallback(() => {
    viewport?.plugins.resume('drag');
  }, [viewport]);

  // The pointer can leave the document (e.g. released over the browser UI),
  // in that case the drag has to be finished manually, otherwise the element
  // would keep following the cursor and the camera would stay frozen
  const handleDocumentPointerLeave = useCallback((e: PointerEvent) => {
    if (e.relatedTarget) return;
    finishDragRef.current();
  }, []);

  const finishDrag = useCallback(() => {
    if (!dragging.current) return;

    const wasMoved = moved.current;

    dragging.current = false;
    moved.current = false;

    document.documentElement.removeEventListener('pointerleave', handleDocumentPointerLeave);

    // Unfreeze the camera: the viewport drag plugin must be active again
    resumeViewportDrag();

    if (wasMoved) {
      // A click event follows the drag, it must not affect the selection
      draggedClick.current = true;
      finalize(lastPos.current);
      onDragEnd?.(lastPos.current);
    }
  }, [handleDocumentPointerLeave, resumeViewportDrag, finalize, onDragEnd]);

  useEffect(() => {
    finishDragRef.current = finishDrag;
  }, [finishDrag]);

  useEffect(
    () => () => {
      if (dragging.current) {
        dragging.current = false;
        resumeViewportDrag();
      }
    },
    [resumeViewportDrag]
  );

  const handlePointerDown = useCallback(
    (e: FederatedPointerEvent) => {
      if (!isDraggable || !viewport || e.button !== 0) return;

      const group = e.currentTarget;
      if (!group) return;

      dragging.current = true;
      moved.current = false;
      draggedClick.current = false;
      startScreen.current.set(e.global.x, e.global.y);
      startWorld.current.copyFrom(viewport.toWorld(e.global));
      startPos.current.set(group.x, group.y);
      lastPos.current.set(group.x, group.y);

      // While the element is dragged the camera must stay still,
      // so the viewport drag plugin is paused
      viewport.plugins.pause('drag');

      // The viewport keeps the state of the previous gesture, which would make it
      // emit its own "clicked" event on the release and reset the selection
      viewport.input.clear();

      document.documentElement.addEventListener('pointerleave', handleDocumentPointerLeave, {
        once: true,
      });

      // The gesture belongs to the element, the viewport must not handle it
      e.stopPropagation();
    },
    [isDraggable, viewport, handleDocumentPointerLeave]
  );

  const handleGlobalPointerMove = useCallback(
    (e: FederatedPointerEvent) => {
      if (!dragging.current || !viewport) return;

      const group = e.currentTarget;
      if (!group) return;

      const screenDx = e.global.x - startScreen.current.x;
      const screenDy = e.global.y - startScreen.current.y;
      if (Math.hypot(screenDx, screenDy) < DRAG_THRESHOLD) return;

      // The element lives in world coordinates, so the pointer position
      // must be converted through the viewport transform
      const world = viewport.toWorld(e.global);
      const newPos = snap({
        x: startPos.current.x + (world.x - startWorld.current.x),
        y: startPos.current.y + (world.y - startWorld.current.y),
      });

      if (!moved.current) {
        moved.current = true;
        onDragStart?.();
      }

      group.x = newPos.x;
      group.y = newPos.y;
      lastPos.current.set(newPos.x, newPos.y);
      onDragMove?.(newPos);
    },
    [viewport, snap, onDragStart, onDragMove]
  );

  const handlePointerUp = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const wasDragged = useCallback(() => {
    if (!draggedClick.current) return false;
    draggedClick.current = false;
    return true;
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onGlobalPointerMove: handleGlobalPointerMove,
    onPointerUp: handlePointerUp,
    onPointerUpOutside: handlePointerUp,
    onPointerCancel: handlePointerUp,
    wasDragged,
  };
};
