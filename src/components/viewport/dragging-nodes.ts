import { create } from 'zustand';

import { ElementType, useStore } from '@/store';

import { Position } from './use-element-drag';

export type DraggingNodesStore = {
  draggingNodeId: string | null;
  setDraggingNodeId: (nodeId: string | null) => void;
  draggingNodePos: Position | null;
  setDraggingNodePos: (pos: Position | null) => void;
  multiDragStartPositions: Map<string, Position>;
  setMultiDragStartPositions: (positions: Map<string, Position>) => void;
  multiDragLeaderId: string | null;
  setMultiDragLeaderId: (leaderId: string | null) => void;
  multiDraggingNodeIds: Set<string>;
  setMultiDraggingNodeIds: (nodeIds: Set<string>) => void;

  isMultiDragLeader: (nodeId: string) => boolean;
};

export const useDraggingNodesStore = create<DraggingNodesStore>((set, get) => ({
  draggingNodeId: null,
  setDraggingNodeId: (draggingNodeId) => set({ draggingNodeId }),
  draggingNodePos: null,
  setDraggingNodePos: (draggingNodePos) => set({ draggingNodePos }),
  multiDragStartPositions: new Map(),
  setMultiDragStartPositions: (multiDragStartPositions) => set({ multiDragStartPositions }),
  multiDragLeaderId: null,
  setMultiDragLeaderId: (multiDragLeaderId) => set({ multiDragLeaderId }),
  multiDraggingNodeIds: new Set<string>(),
  setMultiDraggingNodeIds: (multiDraggingNodeIds) => set({ multiDraggingNodeIds }),
  isMultiDragLeader: (nodeId: string) => get().multiDragLeaderId === nodeId,
}));

export const handleMultiDragStart = (leaderId: string) => {
  const startPositions = new Map<string, Position>();
  const draggingNodes = new Set<string>();

  const { multiSelectedElementsData, nodes, images, orbits, stoneSelection } = useStore.getState();

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

  const { setMultiDragStartPositions, setMultiDragLeaderId, setMultiDraggingNodeIds } =
    useDraggingNodesStore.getState();

  setMultiDragStartPositions(startPositions);
  setMultiDragLeaderId(leaderId);
  setMultiDraggingNodeIds(draggingNodes);
};

export const handleMultiDragMove = (leaderId: string, newLeaderPos: Position) => {
  const { multiDragStartPositions } = useDraggingNodesStore.getState();

  const startPos = multiDragStartPositions.get(leaderId);
  if (!startPos) return;

  const offsetX = newLeaderPos.x - startPos.x;
  const offsetY = newLeaderPos.y - startPos.y;

  const updates: Array<{
    id: string;
    type: ElementType;
    updates: { x: number; y: number };
  }> = [];

  const { multiSelectedElementsData, updateMultipleElements } = useStore.getState();

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

export const handleMultiDragEnd = (leaderId: string, finalLeaderPos: Position) => {
  const {
    multiDragStartPositions,
    setMultiDragStartPositions,
    setMultiDragLeaderId,
    setMultiDraggingNodeIds,
  } = useDraggingNodesStore.getState();

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

  const { multiSelectedElementsData, updateMultipleElements } = useStore.getState();

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
