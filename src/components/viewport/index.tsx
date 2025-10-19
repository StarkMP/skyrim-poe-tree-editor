import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useState } from 'react';
import { Layer, Stage } from 'react-konva';

import { useStore } from '@/store';

import { BackgroundImage } from './background-image';
import { ConnectionLine } from './connection-line';
import { ContextMenu } from './context-menu';
import { NodeElement } from './node-element';
import { TempConnectionLine } from './temp-connection-line';

// Zoom constants
const ZOOM_SPEED = 0.025;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 1.2;

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
    targetType?: 'node' | 'image';
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

  const nodes = useStore((state) => state.nodes);
  const images = useStore((state) => state.images);
  const selectedElement = useStore((state) => state.selectedElement);
  const selectElement = useStore((state) => state.selectElement);
  const addNode = useStore((state) => state.addNode);
  const addImage = useStore((state) => state.addImage);
  const deleteNode = useStore((state) => state.deleteNode);
  const deleteImage = useStore((state) => state.deleteImage);
  const addConnection = useStore((state) => state.addConnection);
  const removeConnection = useStore((state) => state.removeConnection);
  const loadFromLocalStorage = useStore((state) => state.loadFromLocalStorage);

  // Load data from localStorage on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

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
      const id = addNode(contextMenu.canvasX, contextMenu.canvasY);
      selectElement(id, 'node');
    }
    setContextMenu(null);
  };

  const handleCreateImage = () => {
    if (contextMenu) {
      const id = addImage(contextMenu.canvasX, contextMenu.canvasY);
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

  const handleDeleteNode = (nodeId: string) => {
    deleteNode(nodeId);
    setContextMenu(null);
  };

  const handleDeleteImage = (imageId: string) => {
    deleteImage(imageId);
    setContextMenu(null);
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

  // Get all connections
  const connections: Array<{ id: string; fromId: string; toId: string }> = [];
  const processedPairs = new Set<string>();

  for (const [nodeId, node] of Object.entries(nodes)) {
    for (const connectedId of node.connections) {
      const pairKey = [nodeId, connectedId].toSorted().join('-');
      if (!processedPairs.has(pairKey)) {
        connections.push({
          id: pairKey,
          fromId: nodeId,
          toId: connectedId,
        });
        processedPairs.add(pairKey);
      }
    }
  }

  return (
    <div ref={containerRef} className="size-full bg-[#080B10]">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        draggable={!isDraggingElement}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Background Images - lowest z-index */}
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
          {connections.map((conn) => {
            const fromNode = nodes[conn.fromId];
            const toNode = nodes[conn.toId];
            if (!fromNode || !toNode) return null;

            // Hide connection if one of its nodes is being dragged
            const isHidden =
              draggingNodeId && (conn.fromId === draggingNodeId || conn.toId === draggingNodeId);

            return (
              <ConnectionLine
                key={conn.id}
                from={fromNode}
                to={toNode}
                onDelete={() => removeConnection(conn.fromId, conn.toId)}
                opacity={isHidden ? 0 : 1}
              />
            );
          })}

          {/* Temporary lines while dragging node */}
          {draggingNodeId && draggingNodePos && nodes[draggingNodeId]
            ? nodes[draggingNodeId].connections.map((connectedId) => {
                const connectedNode = nodes[connectedId];
                if (!connectedNode) return null;

                return (
                  <TempConnectionLine
                    key={`temp-${draggingNodeId}-${connectedId}`}
                    from={draggingNodePos}
                    to={{ x: connectedNode.x, y: connectedNode.y }}
                  />
                );
              })
            : null}

          {/* Nodes - highest z-index */}
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

          {/* Temporary connection line */}
          {isCreatingConnection && connectionStart ? (
            <TempConnectionLine from={connectionStart} to={mousePos} />
          ) : null}
        </Layer>
      </Stage>

      {/* Context Menu */}
      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetId={contextMenu.targetId}
          targetType={contextMenu.targetType}
          onCreateNode={handleCreateNode}
          onCreateImage={handleCreateImage}
          onStartConnection={handleStartConnection}
          onDeleteNode={handleDeleteNode}
          onDeleteImage={handleDeleteImage}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  );
};
