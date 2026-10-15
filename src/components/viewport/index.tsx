import { Application, type ApplicationRef, extend } from '@pixi/react';
import { Container, Graphics, Sprite } from 'pixi.js';
import {
  type FederatedMouseEvent,
  type FederatedPointerEvent,
  type FederatedWheelEvent,
  Point,
} from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  MAX_ZOOM,
  MIN_ZOOM,
  STONE_SELECTION_ID,
  VIEWPORT_BACKGROUND_COLOR,
  VIEWPORT_WORLD_SIZE,
  ZOOM_SPEED,
} from '@/constants';
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
import type { Position } from './use-element-drag';
import { WebLayer } from './web-layer';

extend({ Container, Graphics, Sprite });

export const Viewport = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<ApplicationRef>(null);
  const [stageReady, setStageReady] = useState(false);
  const stage = useMemo(
    () => (stageReady ? appRef.current?.getApplication()?.stage : null),
    [stageReady]
  );
  const viewportUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingNodePos, setDraggingNodePos] = useState<Position | null>(null);

  const [multiDragStartPositions, setMultiDragStartPositions] = useState<Map<string, Position>>(
    new Map()
  );
  const [multiDragLeaderId, setMultiDragLeaderId] = useState<string | null>(null);
  const [multiDraggingNodeIds, setMultiDraggingNodeIds] = useState<Set<string>>(new Set());

  const {
    nodes,
    images,
    orbits,
    stoneSelection,
    connections,
    selectedElement,
    selectedElements,
    multiSelectedElementsData,
    viewportCenterRequest,
    viewport,
    gridSettings,
    webSettings,
    selectElement,
    toggleElementSelection,
    isElementSelected,
    addNode,
    addImage,
    addOrbit,
    addStoneSelection,
    deleteNode,
    deleteImage,
    deleteOrbit,
    deleteStoneSelection,
    addConnection,
    removeAllConnections,
    updateViewport,
    updateMultipleElements,
    clearCenterRequest,
  } = useStore();

  const clampViewportPosition = useCallback((x: number, y: number, scale: number) => {
    const halfWorld = VIEWPORT_WORLD_SIZE / 2;
    const width = containerRef.current?.offsetWidth ?? 0;
    const height = containerRef.current?.offsetHeight ?? 0;
    const maxX = halfWorld * scale;
    const minX = width - halfWorld * scale;
    const maxY = halfWorld * scale;
    const minY = height - halfWorld * scale;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, []);

  const handleWheel = useCallback(
    (e: FederatedWheelEvent) => {
      if (!stage) return;
      e?.preventDefault();

      const oldScale = stage.scale.x;
      const pointer = { x: e.global.x, y: e.global.y };

      const mousePointTo = {
        x: (e.global.x - stage.x) / stage.scale.x,
        y: (e.global.y - stage.y) / stage.scale.y,
      };

      const direction = e.deltaY > 0 ? -1 : 1;
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldScale + direction * ZOOM_SPEED));

      stage.scale.set(newScale);

      let newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      newPos = clampViewportPosition(newPos.x, newPos.y, newScale);

      stage.position.set(newPos.x, newPos.y);

      if (viewportUpdateTimerRef.current) {
        clearTimeout(viewportUpdateTimerRef.current);
      }

      viewportUpdateTimerRef.current = setTimeout(() => {
        updateViewport({
          x: newPos.x,
          y: newPos.y,
          scale: newScale,
        });
      }, 100);
    },
    [updateViewport, clampViewportPosition]
  );

  const panning = useRef(false);
  const panStartScreen = useRef(new Point());
  const panStartWorld = useRef(new Point());

  const handleStagePointerDown = useCallback((e: FederatedPointerEvent) => {
    if (!stage || e.target !== stage) return;
    panning.current = true;
    panStartScreen.current.set(e.global.x, e.global.y);
    panStartWorld.current.set(stage.x, stage.y);
    e.stopPropagation();
  }, []);

  const handleStageGlobalPointerMove = useCallback(
    (e: FederatedPointerEvent) => {
      if (!stage || !panning.current) return;

      const dx = (e.global.x - panStartScreen.current.x) / stage.scale.x;
      const dy = (e.global.y - panStartScreen.current.y) / stage.scale.y;

      let newPos = {
        x: panStartWorld.current.x + dx,
        y: panStartWorld.current.y + dy,
      };
      newPos = clampViewportPosition(newPos.x, newPos.y, stage.scale.x);
      stage.position.set(newPos.x, newPos.y);
    },
    [clampViewportPosition]
  );

  const handleStagePointerUp = useCallback(
    (e: FederatedPointerEvent) => {
      if (!panning.current) return;
      panning.current = false;

      if (!stage) return;

      const pos = { x: stage.x, y: stage.y };
      const scale = stage.scale.x;
      const clamped = clampViewportPosition(pos.x, pos.y, scale);
      stage.position.set(clamped.x, clamped.y);

      updateViewport({
        x: clamped.x,
        y: clamped.y,
        scale,
      });
    },
    [updateViewport, clampViewportPosition]
  );

  const handleStageRightClick = useCallback((e: FederatedMouseEvent) => {
    if (!stage || e.target !== stage) return;
    e.preventDefault();

    const canvasPos = {
      x: (e.global.x - stage.x) / stage.scale.x,
      y: (e.global.y - stage.y) / stage.scale.y,
    };

    setContextMenu({
      x: e.global.x,
      y: e.global.y,
      canvasX: canvasPos.x,
      canvasY: canvasPos.y,
    });
  }, []);

  const handleStageClick = useCallback(
    (e: FederatedPointerEvent) => {
      if (!stage || e.target !== stage) return;

      selectElement(null, null);

      if (isCreatingConnection) {
        setIsCreatingConnection(false);
        setConnectionStart(null);
      }
    },
    [isCreatingConnection, selectElement]
  );

  const handleStageGlobalPointerMoveForConnection = useCallback(
    (e: FederatedPointerEvent) => {
      if (!isCreatingConnection) return;

      if (!stage) return;

      const canvasPos = {
        x: (e.global.x - stage.x) / stage.scale.x,
        y: (e.global.y - stage.y) / stage.scale.y,
      };
      setMousePos({ x: canvasPos.x, y: canvasPos.y });
    },
    [isCreatingConnection]
  );

  useEffect(() => {
    if (!stage) return;

    stage.eventMode = 'static';

    stage.on('wheel', handleWheel);
    stage.on('pointerdown', handleStagePointerDown);
    stage.on('globalpointermove', handleStageGlobalPointerMove);
    stage.on('pointerup', handleStagePointerUp);
    stage.on('pointerupoutside', handleStagePointerUp);
    stage.on('rightclick', handleStageRightClick);
    stage.on('click', handleStageClick);
    stage.on('globalpointermove', handleStageGlobalPointerMoveForConnection);

    return () => {
      stage.off('wheel', handleWheel);
      stage.off('pointerdown', handleStagePointerDown);
      stage.off('globalpointermove', handleStageGlobalPointerMove);
      stage.off('pointerup', handleStagePointerUp);
      stage.off('pointerupoutside', handleStagePointerUp);
      stage.off('rightclick', handleStageRightClick);
      stage.off('click', handleStageClick);
      stage.off('globalpointermove', handleStageGlobalPointerMoveForConnection);
    };
  }, [
    stage,
    handleWheel,
    handleStagePointerDown,
    handleStageGlobalPointerMove,
    handleStagePointerUp,
    handleStageRightClick,
    handleStageClick,
    handleStageGlobalPointerMoveForConnection,
  ]);

  useEffect(() => {
    if (!stage) return;

    if (stage.x !== viewport.x || stage.y !== viewport.y || stage.scale.x !== viewport.scale) {
      stage.position.set(viewport.x, viewport.y);
      stage.scale.set(viewport.scale);
    }
  }, [viewport, stage]);

  useEffect(() => {
    if (!viewportCenterRequest || !stage) return;

    const { id, type } = viewportCenterRequest;

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

    const scale = stage.scale.x;
    const container = containerRef.current;
    if (!container) return;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const newX = width / 2 - elementX * scale;
    const newY = height / 2 - elementY * scale;

    stage.position.set(newX, newY);

    clearCenterRequest();
  }, [
    viewportCenterRequest?.timestamp,
    nodes,
    images,
    orbits,
    stoneSelection,
    clearCenterRequest,
    stageReady,
  ]);

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
    setIsDraggingElement(true);
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
      setIsDraggingElement(false);
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
    setIsDraggingElement(false);
  };

  const isMultiSelectMode = selectedElements.size > 0;

  return (
    <div ref={containerRef} className="size-full">
      <Application
        ref={appRef}
        resizeTo={containerRef}
        backgroundColor={VIEWPORT_BACKGROUND_COLOR}
        antialias
        eventMode="static"
        autoStart
        onInit={(app) => {
          (window as any).__PIXI_APP__ = app;
          setStageReady(true);
        }}
      >
        <pixiContainer
          eventMode="static"
          onWheel={handleWheel}
          // onContextMenu={handleContextMenu}
          // onMouseMove={handleMouseMove}
          // onDragEnd={handleDragEnd}
          onClick={handleStageClick}
        >
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
              isSelected={
                isMultiSelectMode
                  ? isElementSelected(id)
                  : selectedElement?.id === id
                    ? selectedElement?.type === 'image'
                    : null
              }
              onSelect={(e) => handleImageClick(id, e)}
              onContextMenu={handleImageContextMenu}
              onDragStart={() => {
                if (isMultiSelectMode && isElementSelected(id)) {
                  handleMultiDragStart(id);
                } else {
                  setIsDraggingElement(true);
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
                } else {
                  setIsDraggingElement(false);
                }
              }}
            />
          ))}

          {stoneSelection ? (
            <StoneSelectionElement
              stone={stoneSelection}
              isSelected={
                isMultiSelectMode
                  ? isElementSelected(STONE_SELECTION_ID)
                  : selectedElement?.id === STONE_SELECTION_ID
                    ? selectedElement?.type === 'stone'
                    : null
              }
              onSelect={handleStoneClick}
              onContextMenu={handleStoneContextMenu}
              onDragStart={() => {
                if (isMultiSelectMode && isElementSelected(STONE_SELECTION_ID)) {
                  handleMultiDragStart(STONE_SELECTION_ID);
                } else {
                  setIsDraggingElement(true);
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
                } else {
                  setIsDraggingElement(false);
                }
              }}
            />
          ) : null}

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

          {Object.entries(nodes).map(([id, node]) => (
            <NodeElement
              key={id}
              id={id}
              node={node}
              isSelected={
                isMultiSelectMode
                  ? isElementSelected(id)
                  : selectedElement?.id === id
                    ? selectedElement?.type === 'node'
                    : null
              }
              onSelect={(e) => handleNodeClick(id, e)}
              onContextMenu={handleNodeContextMenu}
              onDragStart={() => {
                if (isMultiSelectMode && isElementSelected(id)) {
                  handleMultiDragStart(id);
                } else {
                  setIsDraggingElement(true);
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
                  setIsDraggingElement(false);
                  setDraggingNodeId(null);
                  setDraggingNodePos(null);
                }
              }}
            />
          ))}

          {Object.entries(orbits).map(([id, orbit]) => (
            <OrbitElement
              key={id}
              id={id}
              orbit={orbit}
              isSelected={
                isMultiSelectMode
                  ? isElementSelected(id)
                  : selectedElement?.id === id
                    ? selectedElement?.type === 'orbit'
                    : null
              }
              onSelect={(e) => handleOrbitClick(id, e)}
              onContextMenu={handleOrbitContextMenu}
              onDragStart={() => {
                if (isMultiSelectMode && isElementSelected(id)) {
                  handleMultiDragStart(id);
                } else {
                  setIsDraggingElement(true);
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
                } else {
                  setIsDraggingElement(false);
                }
              }}
            />
          ))}

          {isCreatingConnection && connectionStart ? (
            <TempConnectionLine from={connectionStart} to={mousePos} />
          ) : null}
        </pixiContainer>
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
  );
};
