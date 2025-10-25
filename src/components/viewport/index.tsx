import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useState } from 'react';
import { Layer, Stage } from 'react-konva';

import { MAX_ZOOM, MIN_ZOOM, ZOOM_SPEED } from '@/constants';
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

  const {
    nodes,
    images,
    orbits,
    connections,
    selectedElement,
    viewportCenterRequest,
    viewport,
    gridSettings,
    selectElement,
    addNode,
    addImage,
    addOrbit,
    deleteNode,
    deleteImage,
    deleteOrbit,
    addConnection,
    removeAllConnections,
    updateViewport,
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

  const handleOrbitClick = (orbitId: string) => {
    selectElement(orbitId, 'orbit');
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

  const handleNodeClick = (nodeId: string) => {
    if (isCreatingConnection && connectionStart && connectionStart.nodeId !== nodeId) {
      addConnection(connectionStart.nodeId, nodeId);
      setIsCreatingConnection(false);
      setConnectionStart(null);
    } else {
      selectElement(nodeId, 'node');
    }
  };

  const handleImageClick = (imageId: string) => {
    selectElement(imageId, 'image');
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

  return (
    <div ref={containerRef} className="size-full bg-[#080B10]">
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
                isSelected={selectedElement?.id === id ? selectedElement?.type === 'image' : null}
                onSelect={() => handleImageClick(id)}
                onContextMenu={handleImageContextMenu}
                onDragStart={() => setIsDraggingElement(true)}
                onDragEnd={() => setIsDraggingElement(false)}
              />
            ))}

            {/* Connections - middle z-index (hide if node is being dragged) */}
            {Object.entries(connections).map(([connectionId, connection]) => {
              const fromNode = nodes[connection.fromId];
              const toNode = nodes[connection.toId];
              if (!fromNode || !toNode) return null;

              // Hide connection if one of its nodes is being dragged
              const isHidden =
                draggingNodeId &&
                (connection.fromId === draggingNodeId || connection.toId === draggingNodeId);

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

            {/* Temporary lines while dragging node */}
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
                    // If the stored connection goes from connectedId to draggingNodeId,
                    // but we're drawing from draggingNodeId to connectedId, invert curvature
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

            {/* Nodes */}
            {Object.entries(nodes).map(([id, node]) => (
              <NodeElement
                key={id}
                id={id}
                node={node}
                isSelected={selectedElement?.id === id ? selectedElement?.type === 'node' : null}
                onSelect={() => handleNodeClick(id)}
                onContextMenu={handleNodeContextMenu}
                onDragStart={() => {
                  setIsDraggingElement(true);
                  setDraggingNodeId(id);
                  setDraggingNodePos({ x: node.x, y: node.y });
                }}
                onDragMove={(pos) => setDraggingNodePos(pos)}
                onDragEnd={() => {
                  setIsDraggingElement(false);
                  setDraggingNodeId(null);
                  setDraggingNodePos(null);
                }}
              />
            ))}

            {/* Orbits - highest z-index (above nodes) */}
            {Object.entries(orbits).map(([id, orbit]) => (
              <OrbitElement
                key={id}
                id={id}
                orbit={orbit}
                isSelected={selectedElement?.id === id ? selectedElement?.type === 'orbit' : null}
                onSelect={() => handleOrbitClick(id)}
                onContextMenu={handleOrbitContextMenu}
                onDragStart={() => setIsDraggingElement(true)}
                onDragEnd={() => setIsDraggingElement(false)}
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
