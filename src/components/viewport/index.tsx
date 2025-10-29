import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Layer, Stage } from 'react-konva';

import { MAX_ZOOM, MIN_ZOOM, VIEWPORT_BACKGROUND_COLOR, ZOOM_SPEED } from '@/constants';
import { useStore } from '@/store';
import { snapToRotatedGrid } from '@/utils/grid-helpers';

import { BackgroundImage } from './background-image';
import { ConnectionLine } from './connection-line';
import { ContextMenu } from './context-menu';
import { GridLayer } from './grid-layer';
import { NodeElement } from './node-element';
import { OrbitElement } from './orbit-element';
import { TempConnectionLine } from './temp-connection-line';

export const Viewport = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    targetId?: string;
    targetType?: 'node' | 'image' | 'orbit';
  } | null>(null);

  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingNodePos, setDraggingNodePos] = useState<{ x: number; y: number } | null>(null);

  // Multi-selection dragging state
  const [multiDragStartPositions, setMultiDragStartPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const [multiDragLeaderId, setMultiDragLeaderId] = useState<string | null>(null);
  const [multiDraggingNodeIds, setMultiDraggingNodeIds] = useState<Set<string>>(new Set());

  const {
    nodes,
    images,
    orbits,
    connections,
    selectedElement,
    selectedElements,
    multiSelectedElementsData,
    viewportCenterRequest,
    viewport,
    gridSettings,
    selectElement,
    toggleElementSelection,
    clearSelection,
    isElementSelected,
    addNode,
    addImage,
    addOrbit,
    deleteNode,
    deleteImage,
    deleteOrbit,
    addConnection,
    removeAllConnections,
    updateViewport,
    updateMultipleElements,
    clearCenterRequest,
  } = useStore();

  // Apply saved viewport state
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !viewport) return;

    stage.position({ x: viewport.x, y: viewport.y });
    stage.scale({ x: viewport.scale, y: viewport.scale });
    stage.batchDraw();
  }, [viewport, stageSize]);

  // Handle viewport centering requests
  useEffect(() => {
    if (!viewportCenterRequest || !stageRef.current) return;

    const { id, type } = viewportCenterRequest;
    const stage = stageRef.current;

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
    } else {
      return;
    }

    const scale = stage.scaleX();
    const newX = stageSize.width / 2 - elementX * scale;
    const newY = stageSize.height / 2 - elementY * scale;

    stage.position({ x: newX, y: newY });
    stage.batchDraw();

    // Clear the request after execution to prevent re-triggering
    clearCenterRequest();
  }, [viewportCenterRequest?.timestamp, nodes, images, orbits, stageSize, clearCenterRequest]);

  // Set initial size and handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldScale + direction * ZOOM_SPEED));

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);

    // Save viewport state
    updateViewport({
      x: newPos.x,
      y: newPos.y,
      scale: newScale,
    });
  };

  const handleDragEnd = () => {
    // Save viewport state after dragging
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.position();
      const scale = stage.scaleX();
      updateViewport({
        x: pos.x,
        y: pos.y,
        scale,
      });
    }
  };

  // Handle context menu
  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Transform screen coordinates to canvas coordinates
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPos = transform.point(pointerPos);

    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      canvasX: canvasPos.x,
      canvasY: canvasPos.y,
    });
  };

  // Handle mouse move for connection creation
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isCreatingConnection) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPos = transform.point(pointerPos);

    setMousePos(canvasPos);
  };

  // Handle click on stage (for connection creation)
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // If clicking on empty space, deselect
    if (e.target === e.target.getStage()) {
      selectElement(null, null);

      // Cancel connection creation if clicking on empty space
      if (isCreatingConnection) {
        setIsCreatingConnection(false);
        setConnectionStart(null);
      }
    }
  };

  // Context menu actions
  const handleCreateNode = () => {
    if (contextMenu) {
      let x = contextMenu.canvasX;
      let y = contextMenu.canvasY;

      // Apply snapping if grid is enabled
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

      // Apply snapping if grid is enabled
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

  const handleOrbitClick = (orbitId: string, e?: MouseEvent) => {
    const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
    if (isMultiSelectKey) {
      // If there's a single selected element, add it to multi-selection first
      if (
        selectedElement &&
        !selectedElements.has(selectedElement.id) &&
        selectedElement.type !== 'connection'
      ) {
        toggleElementSelection(
          selectedElement.id,
          selectedElement.type as 'node' | 'image' | 'orbit'
        );
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

  const handleNodeClick = (nodeId: string, e?: MouseEvent) => {
    if (isCreatingConnection && connectionStart && connectionStart.nodeId !== nodeId) {
      addConnection(connectionStart.nodeId, nodeId);
      setIsCreatingConnection(false);
      setConnectionStart(null);
    } else {
      // Check for Shift or Ctrl key for multi-selection
      const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
      if (isMultiSelectKey) {
        // If there's a single selected element, add it to multi-selection first
        if (
          selectedElement &&
          !selectedElements.has(selectedElement.id) &&
          selectedElement.type !== 'connection'
        ) {
          toggleElementSelection(
            selectedElement.id,
            selectedElement.type as 'node' | 'image' | 'orbit'
          );
        }
        toggleElementSelection(nodeId, 'node');
      } else {
        selectElement(nodeId, 'node');
      }
    }
  };

  const handleImageClick = (imageId: string, e?: MouseEvent) => {
    const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
    if (isMultiSelectKey) {
      // If there's a single selected element, add it to multi-selection first
      if (
        selectedElement &&
        !selectedElements.has(selectedElement.id) &&
        selectedElement.type !== 'connection'
      ) {
        toggleElementSelection(
          selectedElement.id,
          selectedElement.type as 'node' | 'image' | 'orbit'
        );
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

  // Multi-element drag handlers
  const handleMultiDragStart = (leaderId: string) => {
    const startPositions = new Map<string, { x: number; y: number }>();
    const draggingNodes = new Set<string>();

    // Store start positions for all selected elements
    for (const [id, elementData] of multiSelectedElementsData.entries()) {
      if (elementData.type === 'node' && nodes[id]) {
        startPositions.set(id, { x: nodes[id].x, y: nodes[id].y });
        draggingNodes.add(id);
      } else if (elementData.type === 'image' && images[id]) {
        startPositions.set(id, { x: images[id].x, y: images[id].y });
      } else if (elementData.type === 'orbit' && orbits[id]) {
        startPositions.set(id, { x: orbits[id].x, y: orbits[id].y });
      }
    }

    setMultiDragStartPositions(startPositions);
    setMultiDragLeaderId(leaderId);
    setMultiDraggingNodeIds(draggingNodes);
    setIsDraggingElement(true);
  };

  const handleMultiDragMove = (leaderId: string, newLeaderPos: { x: number; y: number }) => {
    const startPos = multiDragStartPositions.get(leaderId);
    if (!startPos) return;

    // Calculate offset from leader's start position
    const offsetX = newLeaderPos.x - startPos.x;
    const offsetY = newLeaderPos.y - startPos.y;

    // Update positions for all selected elements INCLUDING leader
    const updates: Array<{
      id: string;
      type: 'node' | 'image' | 'orbit';
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

  const handleMultiDragEnd = (leaderId: string, finalLeaderPos: { x: number; y: number }) => {
    const startPos = multiDragStartPositions.get(leaderId);
    if (!startPos) {
      setMultiDragStartPositions(new Map());
      setMultiDragLeaderId(null);
      setMultiDraggingNodeIds(new Set());
      setIsDraggingElement(false);
      return;
    }

    // Calculate final offset
    const offsetX = finalLeaderPos.x - startPos.x;
    const offsetY = finalLeaderPos.y - startPos.y;

    // Prepare final updates for all elements including leader
    const updates: Array<{
      id: string;
      type: 'node' | 'image' | 'orbit';
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

  // Determine if element is in multi-selection mode
  const isMultiSelectMode = selectedElements.size > 0;

  return (
    <div
      ref={containerRef}
      className="size-full"
      style={{ backgroundColor: VIEWPORT_BACKGROUND_COLOR }}
    >
      {stageSize.width > 0 && stageSize.height > 0 ? (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          draggable={!isDraggingElement}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onContextMenu={handleContextMenu}
          onMouseMove={handleMouseMove}
          onClick={handleStageClick}
        >
          <Layer>
            {/* Grid - lowest z-index */}
            <GridLayer
              gridSize={gridSettings.size}
              enabled={gridSettings.enabled}
              rotation={gridSettings.rotation}
              stagePos={stageRef.current?.position() || { x: 0, y: 0 }}
              stageSize={stageSize}
              scale={stageRef.current?.scaleX() || 1}
            />

            {/* Background Images */}
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
                onSelect={(e) => handleImageClick(id, e?.evt)}
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

            {/* Connections - middle z-index (hide if node is being dragged) */}
            {Object.entries(connections).map(([connectionId, connection]) => {
              const fromNode = nodes[connection.fromId];
              const toNode = nodes[connection.toId];
              if (!fromNode || !toNode) return null;

              // Hide connection if one of its nodes is being dragged (single or multi)
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

            {/* Temporary lines while dragging single node */}
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

                    // Check if we need to invert curvature based on direction
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

            {/* Temporary lines while dragging multiple nodes */}
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

                    // Use current positions from store (updated by handleMultiDragMove)
                    const fromPos = { x: fromNode.x, y: fromNode.y };
                    const toPos = { x: toNode.x, y: toNode.y };

                    return (
                      <TempConnectionLine
                        key={`temp-multi-${connId}`}
                        from={fromPos}
                        to={toPos}
                        curvature={connection.curvature ?? 0}
                      />
                    );
                  })
              : null}

            {/* Nodes */}
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
                onSelect={(e) => handleNodeClick(id, e?.evt)}
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

            {/* Orbits - highest z-index (above nodes) */}
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
                onSelect={(e) => handleOrbitClick(id, e?.evt)}
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

            {/* Temporary connection line */}
            {isCreatingConnection && connectionStart ? (
              <TempConnectionLine from={connectionStart} to={mousePos} />
            ) : null}
          </Layer>
        </Stage>
      ) : null}

      {/* Context Menu */}
      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetId={contextMenu.targetId}
          targetType={contextMenu.targetType}
          onCreateNode={handleCreateNode}
          onCreateImage={handleCreateImage}
          onCreateOrbit={handleCreateOrbit}
          onStartConnection={handleStartConnection}
          onRemoveAllConnections={handleRemoveAllConnections}
          onDeleteNode={handleDeleteNode}
          onDeleteImage={handleDeleteImage}
          onDeleteOrbit={handleDeleteOrbit}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  );
};
