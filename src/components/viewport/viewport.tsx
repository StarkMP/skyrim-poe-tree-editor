import { useApplication } from '@pixi/react';
import { FederatedEvent, FederatedEventHandler, FederatedPointerEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useCallback, useEffect, useRef, useState } from 'react';

import { VIEWPORT_WORLD_SIZE } from '@/constants';
import { useStore } from '@/store';

import { ViewportProvider } from './context';

export const AppViewport = ({
  children,
  onClick,
  onRightClick,
}: {
  children: React.ReactNode;
  onClick?: FederatedEventHandler<FederatedPointerEvent>;
  onRightClick?: FederatedEventHandler<FederatedPointerEvent>;
}) => {
  const { app } = useApplication();
  const viewportRef = useRef<Viewport | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);

  const viewportCenterRequest = useStore((state) => state.viewportCenterRequest);

  const handleViewportRef = useCallback((instance: Viewport | null) => {
    viewportRef.current = instance;
    setViewport(instance);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport
      .drag({ mouseButtons: 'left' })
      .wheel({ smooth: 5, percent: 1 })
      .clampZoom({
        maxWidth: VIEWPORT_WORLD_SIZE,
        minWidth: VIEWPORT_WORLD_SIZE / 100,
      });

    const { viewport: viewportState, updateViewport } = useStore.getState();

    const initState = () => {
      viewport.moveCenter(viewportState.x, viewportState.y);
      viewport.setZoom(viewportState.scale, true);
    };

    initState();

    const updateState = () =>
      updateViewport({
        x: viewport.center.x,
        y: viewport.center.y,
        scale: viewport.scale.x,
      });

    viewport.on('moved-end', updateState);
    viewport.on('zoomed-end', updateState);

    return () => {
      viewport.off('moved-end', updateState);
      viewport.off('zoomed-end', updateState);
    };
  }, []);

  useEffect(() => {
    if (!viewportCenterRequest || !viewportRef.current) return;

    const { id, type } = viewportCenterRequest;

    const { nodes, images, orbits, stoneSelection, clearCenterRequest } = useStore.getState();

    let elementX = 0;
    let elementY = 0;

    if (type === 'node' && nodes[id]) {
      elementX = nodes[id].x;
      elementY = nodes[id].y;
    } else if (type === 'image' && images[id]) {
      elementX = images[id].x + images[id].width / 2;
      elementY = images[id].y + images[id].height / 2;
    } else if (type === 'orbit' && orbits[id]) {
      elementX = orbits[id].x;
      elementY = orbits[id].y;
    } else if (type === 'stone' && stoneSelection) {
      elementX = stoneSelection.x + stoneSelection.width / 2;
      elementY = stoneSelection.y + stoneSelection.height / 2;
    } else {
      return;
    }

    const globalPoint = viewportRef.current.toGlobal({ x: elementX, y: elementY });

    const newPos = viewportRef.current.toWorld(globalPoint);

    viewportRef.current.animate({
      position: newPos,
      time: 300,
      callbackOnComplete: clearCenterRequest,
    });
  }, [viewportCenterRequest?.timestamp]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !onClick) return;

    // pixi-viewport emits its own click event: it is not emitted when the pointer
    // was moved between pointerdown and pointerup (camera pan or element drag)
    const handleClicked = ({ event }: { event: FederatedEvent }) => {
      const pointerEvent = event as FederatedPointerEvent;
      if (pointerEvent.button !== 0 || pointerEvent.target !== viewport) return;
      onClick(pointerEvent);
    };

    viewport.on('clicked', handleClicked);
    return () => {
      viewport.off('clicked', handleClicked);
    };
  }, [onClick]);

  return (
    <pixiViewport
      ref={handleViewportRef}
      screenWidth={app.screen.width}
      screenHeight={app.screen.height}
      // worldWidth={app.screen.width}
      // worldHeight={app.screen.height}
      allowPreserveDragOutside
      disableOnContextMenu
      threshold={3}
      events={app.renderer.events}
      ticker={app.ticker}
      onRightClick={onRightClick}
    >
      <ViewportProvider viewport={viewport}>{children}</ViewportProvider>
    </pixiViewport>
  );
};
