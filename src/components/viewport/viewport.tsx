import { useApplication } from '@pixi/react';
import { FederatedEventHandler, FederatedPointerEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useEffect, useRef } from 'react';

export const AppViewport = ({
  children,
  onRightClick,
}: {
  children: React.ReactNode;
  onRightClick?: FederatedEventHandler<FederatedPointerEvent>;
}) => {
  const { app } = useApplication();
  const viewportRef = useRef<Viewport | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.drag().wheel({
      smooth: 5,
      percent: 3,
    });
  }, []);

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
