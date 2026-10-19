import { Application, type ApplicationRef, extend } from '@pixi/react';
import { Container, Graphics, Sprite } from 'pixi.js';
import { type FederatedMouseEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { RefCallback, useCallback, useMemo, useRef, useState } from 'react';

import { STONE_SELECTION_ID, VIEWPORT_BACKGROUND_COLOR } from '@/constants';
import { useStore } from '@/store';
import { snapToRotatedGrid } from '@/utils/grid-helpers';

import { BackgroundImages } from './background-images';
import { Connections } from './connections';
import { ContextMenu } from './context-menu';
import { Nodes } from './nodes';
import { Orbits } from './orbits';
import { StoneSelection } from './stone-selection';
import { TempConnectionMoving } from './temp-connection-moving';
import { TempConnectionsDragging } from './temp-connections-dragging';
import { GridLayer } from './tree-elements/grid-layer';
import { WebLayer } from './tree-elements/web-layer';
import { AppViewport } from './viewport';

extend({ Viewport, Container, Graphics, Sprite });

const preventDefaultWheelRefCallback: RefCallback<HTMLDivElement> = (element) => {
  if (!element) return;
  const prevent = (e: WheelEvent) => e.preventDefault();
  element.addEventListener('wheel', prevent);
  return () => element.removeEventListener('wheel', prevent);
};

export const Stage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<ApplicationRef>(null);
  const [stageReady, setStageReady] = useState(false);
  const stage = useMemo(
    () => (stageReady ? appRef.current?.getApplication()?.stage : null),
    [stageReady]
  );

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    targetId?: string;
    targetType?: 'node' | 'image' | 'orbit' | 'stone';
  } | null>(null);

  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);

  const stoneSelection = useStore((state) => state.stoneSelection);
  const gridSettings = useStore((state) => state.gridSettings);
  const webSettings = useStore((state) => state.webSettings);
  const selectElement = useStore((state) => state.selectElement);
  const addNode = useStore((state) => state.addNode);
  const addImage = useStore((state) => state.addImage);
  const addOrbit = useStore((state) => state.addOrbit);
  const addStoneSelection = useStore((state) => state.addStoneSelection);
  const deleteNode = useStore((state) => state.deleteNode);
  const deleteImage = useStore((state) => state.deleteImage);
  const deleteOrbit = useStore((state) => state.deleteOrbit);
  const deleteStoneSelection = useStore((state) => state.deleteStoneSelection);
  const removeAllConnections = useStore((state) => state.removeAllConnections);

  const handleStageRightClick = useCallback((e: FederatedMouseEvent) => {
    const viewport = e.target;
    if (!viewport) return;

    const canvasPos = e.getLocalPosition(viewport);

    setContextMenu({
      x: e.client.x,
      y: e.client.y,
      canvasX: canvasPos.x,
      canvasY: canvasPos.y,
    });
  }, []);

  const handleStageClick = useCallback(() => {
    selectElement(null, null);

    if (isCreatingConnection) {
      setIsCreatingConnection(false);
      setConnectionStart(null);
    }
  }, [isCreatingConnection, selectElement]);

  const handleCreateNode = () => {
    if (contextMenu) {
      let x = contextMenu.canvasX;
      let y = contextMenu.canvasY;

      if (gridSettings.enabled) {
        const snapped = snapToRotatedGrid(x, y, gridSettings.size, gridSettings.rotation);
        x = snapped.x;
        y = snapped.y;
      }

      const id = addNode(x, y);
      selectElement(id, 'node');
    }
    setContextMenu(null);
  };

  const handleCreateImage = () => {
    if (contextMenu) {
      let x = contextMenu.canvasX;
      let y = contextMenu.canvasY;

      if (gridSettings.enabled) {
        const snapped = snapToRotatedGrid(x, y, gridSettings.size, gridSettings.rotation);
        x = snapped.x;
        y = snapped.y;
      }

      const id = addImage(x, y);
      selectElement(id, 'image');
    }
    setContextMenu(null);
  };

  const handleStartConnection = (nodeId: string) => {
    const { nodes } = useStore.getState();
    const node = nodes[nodeId];
    if (!node) return;

    setIsCreatingConnection(true);
    setConnectionStart({ nodeId, x: node.x, y: node.y });
    setContextMenu(null);
  };

  const handleRemoveAllConnections = (nodeId: string) => {
    removeAllConnections(nodeId);
    setContextMenu(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    deleteNode(nodeId);
    setContextMenu(null);
  };

  const handleDeleteImage = (imageId: string) => {
    deleteImage(imageId);
    setContextMenu(null);
  };

  const handleCreateOrbit = () => {
    if (contextMenu) {
      const id = addOrbit(contextMenu.canvasX, contextMenu.canvasY);
      selectElement(id, 'orbit');
    }
    setContextMenu(null);
  };

  const handleDeleteOrbit = (orbitId: string) => {
    deleteOrbit(orbitId);
    setContextMenu(null);
  };

  const handleCreateStoneSelection = () => {
    if (contextMenu) {
      let x = contextMenu.canvasX;
      let y = contextMenu.canvasY;

      if (gridSettings.enabled) {
        const snapped = snapToRotatedGrid(x, y, gridSettings.size, gridSettings.rotation);
        x = snapped.x;
        y = snapped.y;
      }

      addStoneSelection(x, y);
      selectElement(STONE_SELECTION_ID, 'stone');
    }
    setContextMenu(null);
  };

  const handleDeleteStoneSelection = () => {
    deleteStoneSelection();
    setContextMenu(null);
  };

  const handleStoneContextMenu = (x: number, y: number) => {
    setContextMenu({
      x,
      y,
      canvasX: 0,
      canvasY: 0,
      targetId: STONE_SELECTION_ID,
      targetType: 'stone',
    });
  };

  const handleOrbitContextMenu = (orbitId: string, x: number, y: number) => {
    setContextMenu({
      x,
      y,
      canvasX: 0,
      canvasY: 0,
      targetId: orbitId,
      targetType: 'orbit',
    });
  };

  const handleNodeContextMenu = (nodeId: string, x: number, y: number) => {
    setContextMenu({
      x,
      y,
      canvasX: 0,
      canvasY: 0,
      targetId: nodeId,
      targetType: 'node',
    });
  };

  const handleImageContextMenu = (imageId: string, x: number, y: number) => {
    setContextMenu({
      x,
      y,
      canvasX: 0,
      canvasY: 0,
      targetId: imageId,
      targetType: 'image',
    });
  };

  return (
    <div ref={preventDefaultWheelRefCallback} className="size-full">
      <div ref={containerRef} className="size-full">
        <Application
          ref={appRef}
          resizeTo={containerRef}
          backgroundColor={VIEWPORT_BACKGROUND_COLOR}
          antialias
          autoStart
          onInit={(app) => {
            (window as any).__PIXI_APP__ = app;
            setStageReady(true);
          }}
        >
          <AppViewport onClick={handleStageClick} onRightClick={handleStageRightClick}>
            <WebLayer
              enabled={webSettings.enabled}
              size={webSettings.size}
              spokes={webSettings.spokes}
              rotation={webSettings.rotation}
              innerRadius={webSettings.innerRadius}
              concentricCircles={webSettings.concentricCircles}
            />

            <GridLayer
              gridSize={gridSettings.size}
              enabled={gridSettings.enabled}
              rotation={gridSettings.rotation}
              stagePos={{ x: stage?.x ?? 0, y: stage?.y ?? 0 }}
              stageSize={{
                width: containerRef.current?.offsetWidth ?? 0,
                height: containerRef.current?.offsetHeight ?? 0,
              }}
              scale={stage?.scale.x ?? 1}
            />

            <BackgroundImages onContextMenu={handleImageContextMenu} />

            <StoneSelection onContextMenu={handleStoneContextMenu} />

            <Connections />

            <TempConnectionsDragging />

            <Nodes
              isCreatingConnection={isCreatingConnection}
              setIsCreatingConnection={setIsCreatingConnection}
              connectionStart={connectionStart}
              setConnectionStart={setConnectionStart}
              onContextMenu={handleNodeContextMenu}
            />

            <Orbits onContextMenu={handleOrbitContextMenu} />

            {isCreatingConnection && connectionStart ? (
              <TempConnectionMoving connectionStart={connectionStart} />
            ) : null}
          </AppViewport>
        </Application>

        {contextMenu ? (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            targetId={contextMenu.targetId}
            targetType={contextMenu.targetType}
            hasStoneSelection={!!stoneSelection}
            onCreateNode={handleCreateNode}
            onCreateImage={handleCreateImage}
            onCreateOrbit={handleCreateOrbit}
            onCreateStoneSelection={handleCreateStoneSelection}
            onStartConnection={handleStartConnection}
            onRemoveAllConnections={handleRemoveAllConnections}
            onDeleteNode={handleDeleteNode}
            onDeleteImage={handleDeleteImage}
            onDeleteOrbit={handleDeleteOrbit}
            onDeleteStoneSelection={handleDeleteStoneSelection}
            onClose={() => setContextMenu(null)}
          />
        ) : null}
      </div>
    </div>
  );
};
