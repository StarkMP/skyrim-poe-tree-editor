import { Application, type ApplicationRef, extend } from '@pixi/react';
import { Container, Graphics, Sprite } from 'pixi.js';
import { type FederatedMouseEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { RefCallback, useCallback, useMemo, useRef, useState } from 'react';

import { STONE_SELECTION_ID, VIEWPORT_BACKGROUND_COLOR } from '@/constants';
import { ElementType, useStore } from '@/store';
import { snapToRotatedGrid } from '@/utils/grid-helpers';

import { BackgroundImage } from './background-image';
import { ConnectionLine } from './connection-line';
import { ContextMenu } from './context-menu';
import { GridLayer } from './grid-layer';
import { NodeElement } from './node-element';
import { OrbitElement } from './orbit-element';
import { StoneSelectionElement } from './stone-selection-element';
import { TempConnectionLine } from './temp-connection-line';
import { TempConnectionMoving } from './temp-connection-moving';
import type { Position } from './use-element-drag';
import { AppViewport } from './viewport';
import { WebLayer } from './web-layer';

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

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingNodePos, setDraggingNodePos] = useState<Position | null>(null);

  const [multiDragStartPositions, setMultiDragStartPositions] = useState<Map<string, Position>>(
    new Map()
  );
  const [multiDragLeaderId, setMultiDragLeaderId] = useState<string | null>(null);
  const [multiDraggingNodeIds, setMultiDraggingNodeIds] = useState<Set<string>>(new Set());

  const nodes = useStore((state) => state.nodes);
  const images = useStore((state) => state.images);
  const orbits = useStore((state) => state.orbits);
  const stoneSelection = useStore((state) => state.stoneSelection);
  const connections = useStore((state) => state.connections);
  const selectedElement = useStore((state) => state.selectedElement);
  const selectedElements = useStore((state) => state.selectedElements);
  const multiSelectedElementsData = useStore((state) => state.multiSelectedElementsData);
  const gridSettings = useStore((state) => state.gridSettings);
  const webSettings = useStore((state) => state.webSettings);
  const selectElement = useStore((state) => state.selectElement);
  const toggleElementSelection = useStore((state) => state.toggleElementSelection);
  const isElementSelected = useStore((state) => state.isElementSelected);
  const addNode = useStore((state) => state.addNode);
  const addImage = useStore((state) => state.addImage);
  const addOrbit = useStore((state) => state.addOrbit);
  const addStoneSelection = useStore((state) => state.addStoneSelection);
  const deleteNode = useStore((state) => state.deleteNode);
  const deleteImage = useStore((state) => state.deleteImage);
  const deleteOrbit = useStore((state) => state.deleteOrbit);
  const deleteStoneSelection = useStore((state) => state.deleteStoneSelection);
  const addConnection = useStore((state) => state.addConnection);
  const removeAllConnections = useStore((state) => state.removeAllConnections);
  const updateMultipleElements = useStore((state) => state.updateMultipleElements);

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

  const checkElementSelected = (id: string, type: ElementType) => {
    if (isMultiSelectMode) return isElementSelected(id);
    return selectedElement?.id === id && selectedElement?.type === type;
  };

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

  const handleStoneClick = (e?: FederatedMouseEvent) => {
    const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
    if (isMultiSelectKey) {
      if (
        selectedElement &&
        !selectedElements.has(selectedElement.id) &&
        selectedElement.type !== 'connection'
      ) {
        toggleElementSelection(selectedElement.id, selectedElement.type as ElementType);
      }
      toggleElementSelection(STONE_SELECTION_ID, 'stone');
    } else {
      selectElement(STONE_SELECTION_ID, 'stone');
    }
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

  const handleOrbitClick = (orbitId: string, e?: FederatedMouseEvent) => {
    const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
    if (isMultiSelectKey) {
      if (
        selectedElement &&
        !selectedElements.has(selectedElement.id) &&
        selectedElement.type !== 'connection'
      ) {
        toggleElementSelection(selectedElement.id, selectedElement.type as ElementType);
      }
      toggleElementSelection(orbitId, 'orbit');
    } else {
      selectElement(orbitId, 'orbit');
    }
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

  const handleNodeClick = (nodeId: string, e?: FederatedMouseEvent) => {
    if (isCreatingConnection && connectionStart && connectionStart.nodeId !== nodeId) {
      addConnection(connectionStart.nodeId, nodeId);
      setIsCreatingConnection(false);
      setConnectionStart(null);
    } else {
      const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
      if (isMultiSelectKey) {
        if (
          selectedElement &&
          !selectedElements.has(selectedElement.id) &&
          selectedElement.type !== 'connection'
        ) {
          toggleElementSelection(selectedElement.id, selectedElement.type as ElementType);
        }
        toggleElementSelection(nodeId, 'node');
      } else {
        selectElement(nodeId, 'node');
      }
    }
  };

  const handleImageClick = (imageId: string, e?: FederatedMouseEvent) => {
    const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
    if (isMultiSelectKey) {
      if (
        selectedElement &&
        !selectedElements.has(selectedElement.id) &&
        selectedElement.type !== 'connection'
      ) {
        toggleElementSelection(selectedElement.id, selectedElement.type as ElementType);
      }
      toggleElementSelection(imageId, 'image');
    } else {
      selectElement(imageId, 'image');
    }
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

  const handleConnectionClick = (connectionId: string) => {
    selectElement(connectionId, 'connection');
  };

  const handleMultiDragStart = (leaderId: string) => {
    const startPositions = new Map<string, Position>();
    const draggingNodes = new Set<string>();

    for (const [id, elementData] of multiSelectedElementsData.entries()) {
      if (elementData.type === 'node' && nodes[id]) {
        startPositions.set(id, { x: nodes[id].x, y: nodes[id].y });
        draggingNodes.add(id);
      } else if (elementData.type === 'image' && images[id]) {
        startPositions.set(id, { x: images[id].x, y: images[id].y });
      } else if (elementData.type === 'orbit' && orbits[id]) {
        startPositions.set(id, { x: orbits[id].x, y: orbits[id].y });
      } else if (elementData.type === 'stone' && stoneSelection) {
        startPositions.set(id, { x: stoneSelection.x, y: stoneSelection.y });
      }
    }

    setMultiDragStartPositions(startPositions);
    setMultiDragLeaderId(leaderId);
    setMultiDraggingNodeIds(draggingNodes);
  };

  const handleMultiDragMove = (leaderId: string, newLeaderPos: Position) => {
    const startPos = multiDragStartPositions.get(leaderId);
    if (!startPos) return;

    const offsetX = newLeaderPos.x - startPos.x;
    const offsetY = newLeaderPos.y - startPos.y;

    const updates: Array<{
      id: string;
      type: ElementType;
      updates: { x: number; y: number };
    }> = [];

    for (const [id, elementData] of multiSelectedElementsData.entries()) {
      const startElementPos = multiDragStartPositions.get(id);
      if (!startElementPos) continue;

      updates.push({
        id,
        type: elementData.type,
        updates: {
          x: startElementPos.x + offsetX,
          y: startElementPos.y + offsetY,
        },
      });
    }

    if (updates.length > 0) {
      updateMultipleElements(updates);
    }
  };

  const handleMultiDragEnd = (leaderId: string, finalLeaderPos: Position) => {
    const startPos = multiDragStartPositions.get(leaderId);
    if (!startPos) {
      setMultiDragStartPositions(new Map());
      setMultiDragLeaderId(null);
      setMultiDraggingNodeIds(new Set());
      return;
    }

    const offsetX = finalLeaderPos.x - startPos.x;
    const offsetY = finalLeaderPos.y - startPos.y;

    const updates: Array<{
      id: string;
      type: ElementType;
      updates: { x: number; y: number };
    }> = [];

    for (const [id, elementData] of multiSelectedElementsData.entries()) {
      const startElementPos = multiDragStartPositions.get(id);
      if (!startElementPos) continue;

      updates.push({
        id,
        type: elementData.type,
        updates: {
          x: startElementPos.x + offsetX,
          y: startElementPos.y + offsetY,
        },
      });
    }

    if (updates.length > 0) {
      updateMultipleElements(updates);
    }

    setMultiDragStartPositions(new Map());
    setMultiDragLeaderId(null);
    setMultiDraggingNodeIds(new Set());
  };

  const isMultiSelectMode = selectedElements.size > 0;

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

            {Object.entries(images).map(([id, image]) => (
              <BackgroundImage
                key={id}
                id={id}
                image={image}
                isSelected={checkElementSelected(id, 'image')}
                onSelect={(e) => handleImageClick(id, e)}
                onContextMenu={handleImageContextMenu}
                onDragStart={() => {
                  if (isMultiSelectMode && isElementSelected(id)) {
                    handleMultiDragStart(id);
                  }
                }}
                onDragMove={(pos) => {
                  if (isMultiSelectMode && multiDragLeaderId === id) {
                    handleMultiDragMove(id, pos);
                  }
                }}
                onDragEnd={(finalPos) => {
                  if (isMultiSelectMode && multiDragLeaderId === id) {
                    handleMultiDragEnd(id, finalPos);
                  }
                }}
              />
            ))}

            {stoneSelection ? (
              <StoneSelectionElement
                stone={stoneSelection}
                isSelected={checkElementSelected(STONE_SELECTION_ID, 'stone')}
                onSelect={handleStoneClick}
                onContextMenu={handleStoneContextMenu}
                onDragStart={() => {
                  if (isMultiSelectMode && isElementSelected(STONE_SELECTION_ID)) {
                    handleMultiDragStart(STONE_SELECTION_ID);
                  }
                }}
                onDragMove={(pos) => {
                  if (isMultiSelectMode && multiDragLeaderId === STONE_SELECTION_ID) {
                    handleMultiDragMove(STONE_SELECTION_ID, pos);
                  }
                }}
                onDragEnd={(finalPos) => {
                  if (isMultiSelectMode && multiDragLeaderId === STONE_SELECTION_ID) {
                    handleMultiDragEnd(STONE_SELECTION_ID, finalPos);
                  }
                }}
              />
            ) : null}

            <pixiContainer>
              {Object.entries(connections).map(([connectionId, connection]) => {
                const fromNode = nodes[connection.fromId];
                const toNode = nodes[connection.toId];
                if (!fromNode || !toNode) return null;

                const isHidden =
                  (draggingNodeId &&
                    (connection.fromId === draggingNodeId || connection.toId === draggingNodeId)) ||
                  (multiDraggingNodeIds.size > 0 &&
                    (multiDraggingNodeIds.has(connection.fromId) ||
                      multiDraggingNodeIds.has(connection.toId)));

                return (
                  <ConnectionLine
                    key={connectionId}
                    from={fromNode}
                    to={toNode}
                    curvature={connection.curvature}
                    isSelected={
                      selectedElement?.id === connectionId
                        ? selectedElement?.type === 'connection'
                        : null
                    }
                    onSelect={() => handleConnectionClick(connectionId)}
                    opacity={isHidden ? 0 : 1}
                  />
                );
              })}
            </pixiContainer>

            {draggingNodeId && draggingNodePos
              ? Object.entries(connections)
                  .filter(
                    ([, conn]) => conn.fromId === draggingNodeId || conn.toId === draggingNodeId
                  )
                  .map(([connId, connection]) => {
                    const connectedId =
                      connection.fromId === draggingNodeId ? connection.toId : connection.fromId;
                    const connectedNode = nodes[connectedId];
                    if (!connectedNode) return null;

                    const shouldInvertCurvature =
                      connection.fromId === connectedId && connection.toId === draggingNodeId;

                    const curvature = connection.curvature ?? 0;
                    const adjustedCurvature = shouldInvertCurvature ? -curvature : curvature;

                    return (
                      <TempConnectionLine
                        key={`temp-${connId}`}
                        from={draggingNodePos}
                        to={{ x: connectedNode.x, y: connectedNode.y }}
                        curvature={adjustedCurvature}
                      />
                    );
                  })
              : null}

            {multiDraggingNodeIds.size > 0
              ? Object.entries(connections)
                  .filter(
                    ([, conn]) =>
                      multiDraggingNodeIds.has(conn.fromId) || multiDraggingNodeIds.has(conn.toId)
                  )
                  .map(([connId, connection]) => {
                    const fromNode = nodes[connection.fromId];
                    const toNode = nodes[connection.toId];
                    if (!fromNode || !toNode) return null;

                    return (
                      <TempConnectionLine
                        key={`temp-multi-${connId}`}
                        from={{ x: fromNode.x, y: fromNode.y }}
                        to={{ x: toNode.x, y: toNode.y }}
                        curvature={connection.curvature ?? 0}
                      />
                    );
                  })
              : null}

            <pixiContainer>
              {Object.entries(nodes).map(([id, node]) => (
                <NodeElement
                  key={id}
                  id={id}
                  node={node}
                  isSelected={checkElementSelected(id, 'node')}
                  onSelect={(e) => handleNodeClick(id, e)}
                  onContextMenu={handleNodeContextMenu}
                  onDragStart={() => {
                    if (isMultiSelectMode && isElementSelected(id)) {
                      handleMultiDragStart(id);
                    } else {
                      setDraggingNodeId(id);
                      setDraggingNodePos({ x: node.x, y: node.y });
                    }
                  }}
                  onDragMove={(pos) => {
                    if (isMultiSelectMode && multiDragLeaderId === id) {
                      handleMultiDragMove(id, pos);
                    }
                    setDraggingNodePos(pos);
                  }}
                  onDragEnd={(finalPos) => {
                    if (isMultiSelectMode && multiDragLeaderId === id) {
                      handleMultiDragEnd(id, finalPos);
                    } else {
                      setDraggingNodeId(null);
                      setDraggingNodePos(null);
                    }
                  }}
                />
              ))}
            </pixiContainer>

            <pixiContainer>
              {Object.entries(orbits).map(([id, orbit]) => (
                <OrbitElement
                  key={id}
                  id={id}
                  orbit={orbit}
                  isSelected={checkElementSelected(id, 'orbit')}
                  onSelect={(e) => handleOrbitClick(id, e)}
                  onContextMenu={handleOrbitContextMenu}
                  onDragStart={() => {
                    if (isMultiSelectMode && isElementSelected(id)) {
                      handleMultiDragStart(id);
                    }
                  }}
                  onDragMove={(pos) => {
                    if (isMultiSelectMode && multiDragLeaderId === id) {
                      handleMultiDragMove(id, pos);
                    }
                  }}
                  onDragEnd={(finalPos) => {
                    if (isMultiSelectMode && multiDragLeaderId === id) {
                      handleMultiDragEnd(id, finalPos);
                    }
                  }}
                />
              ))}
            </pixiContainer>

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
