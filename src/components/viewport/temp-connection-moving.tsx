import { FederatedPointerEvent } from 'pixi.js';
import { useCallback, useEffect, useState } from 'react';

import { useViewport } from './context';
import { TempConnectionLine } from './tree-elements/temp-connection-line';

export const TempConnectionMoving = ({
  connectionStart,
}: {
  connectionStart: {
    nodeId: string;
    x: number;
    y: number;
  };
}) => {
  const viewport = useViewport();

  const [tempConnectionTo, setTempConnectionTo] = useState<{ x: number; y: number }>({
    x: connectionStart.x,
    y: connectionStart.y,
  });

  const handleStageGlobalPointerMoveForConnection = useCallback(
    (e: FederatedPointerEvent) => {
      if (!viewport) return;
      const canvasPos = e.getLocalPosition(viewport);
      setTempConnectionTo({ x: canvasPos.x, y: canvasPos.y });
    },
    [viewport]
  );

  useEffect(() => {
    if (!viewport) return;
    viewport.addEventListener('pointermove', handleStageGlobalPointerMoveForConnection);

    return () => {
      viewport.removeEventListener('pointermove', handleStageGlobalPointerMoveForConnection);
    };
  }, [viewport, handleStageGlobalPointerMoveForConnection]);

  return <TempConnectionLine from={connectionStart} to={tempConnectionTo} />;
};
