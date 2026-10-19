import { FederatedMouseEvent } from 'pixi.js';
import { useMemo } from 'react';

import { ElementType, useStore } from '@/store';

import {
  handleMultiDragEnd,
  handleMultiDragMove,
  handleMultiDragStart,
  useDraggingNodesStore,
} from './dragging-nodes';
import { NodeElement } from './tree-elements/node-element';

export const Nodes = ({
  isCreatingConnection,
  setIsCreatingConnection,
  connectionStart,
  setConnectionStart,
  onContextMenu,
}: {
  isCreatingConnection: boolean;
  setIsCreatingConnection: (isCreatingConnection: boolean) => void;
  connectionStart: { nodeId: string; x: number; y: number } | null;
  setConnectionStart: (connectionStart: { nodeId: string; x: number; y: number } | null) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
}) => {
  const nodes = useStore((state) => state.nodes);
  const selectedElement = useStore((state) => state.selectedElement);
  const selectedElements = useStore((state) => state.selectedElements);
  const isElementSelected = useStore((state) => state.isElementSelected);
  const selectElement = useStore((state) => state.selectElement);
  const toggleElementSelection = useStore((state) => state.toggleElementSelection);
  const addConnection = useStore((state) => state.addConnection);

  const isMultiDragLeader = useDraggingNodesStore((state) => state.isMultiDragLeader);
  const setDraggingNodeId = useDraggingNodesStore((state) => state.setDraggingNodeId);
  const setDraggingNodePos = useDraggingNodesStore((state) => state.setDraggingNodePos);

  const nodesArray = useMemo(() => Object.entries(nodes), [nodes]);

  const isMultiSelectMode = selectedElements.size > 0;

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

  return (
    <pixiContainer>
      {nodesArray.map(([id, node]) => (
        <NodeElement
          key={id}
          id={id}
          node={node}
          isSelected={isElementSelected(id, 'node')}
          onSelect={(e) => handleNodeClick(id, e)}
          onContextMenu={onContextMenu}
          onDragStart={() => {
            if (isMultiSelectMode && isElementSelected(id, 'node')) {
              handleMultiDragStart(id);
            } else {
              setDraggingNodeId(id);
              setDraggingNodePos({ x: node.x, y: node.y });
            }
          }}
          onDragMove={(pos) => {
            if (isMultiSelectMode && isMultiDragLeader(id)) {
              handleMultiDragMove(id, pos);
            }
            setDraggingNodePos(pos);
          }}
          onDragEnd={(finalPos) => {
            if (isMultiSelectMode && isMultiDragLeader(id)) {
              handleMultiDragEnd(id, finalPos);
            } else {
              setDraggingNodeId(null);
              setDraggingNodePos(null);
            }
          }}
        />
      ))}
    </pixiContainer>
  );
};
