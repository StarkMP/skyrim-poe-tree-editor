import { useApplication } from '@pixi/react';
import { FederatedEventHandler, FederatedPointerEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useEffect, useRef } from 'react';

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

  const viewportState = useStore(({ viewport }) => viewport);
  const updateViewport = useStore(({ updateViewport }) => updateViewport);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.drag().wheel({
      smooth: 5,
      percent: 3,
    });

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
    const viewport = viewportRef.current;
    if (!viewport || !onClick) return;
    viewport.hitArea = app.screen;
    const handleClick = (e: FederatedPointerEvent) => e.target === viewport && onClick(e);
    viewport.addEventListener('click', handleClick);
    return () => {
      viewport.removeEventListener('click', handleClick);
    };
  }, [app, onClick]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const currentPosition = viewport.position;
    const currentScale = viewport.scale.x;

    if (
      viewportState.x !== currentPosition.x ||
      viewportState.y !== currentPosition.y ||
      viewportState.scale !== currentScale
    ) {
      viewport.moveCenter(viewportState.x, viewportState.y);
      viewport.setZoom(viewportState.scale, true);
    }
  }, [viewportState]);

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
