import { useApplication } from '@pixi/react';
import { FederatedEventHandler, FederatedPointerEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useEffect, useRef } from 'react';

import { VIEWPORT_WORLD_SIZE } from '@/constants';
import { useStore } from '@/store';

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

  const viewportCenterRequest = useStore((state) => state.viewportCenterRequest);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport
      .drag()
      .wheel({ smooth: 5, percent: 3 })
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
    viewport.hitArea = app.screen;
    const handleClick = (e: FederatedPointerEvent) => e.target === viewport && onClick(e);
    viewport.addEventListener('click', handleClick);
    return () => {
      viewport.removeEventListener('click', handleClick);
    };
  }, [app, onClick]);

  return (
    <pixiViewport
      ref={viewportRef}
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
      {children}
    </pixiViewport>
  );
};
