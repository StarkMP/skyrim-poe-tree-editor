import { FederatedMouseEvent } from 'pixi.js';

import { STONE_SELECTION_ID } from '@/constants';
import { useStore } from '@/store';

import {
  handleMultiDragEnd,
  handleMultiDragMove,
  handleMultiDragStart,
  useDraggingNodesStore,
} from './dragging-nodes';
import { StoneSelectionElement } from './tree-elements/stone-selection-element';

export const StoneSelection = ({
  onContextMenu,
}: {
  onContextMenu: (x: number, y: number) => void;
}) => {
  const stoneSelection = useStore((state) => state.stoneSelection);
  const selectedElement = useStore((state) => state.selectedElement);
  const selectedElements = useStore((state) => state.selectedElements);
  const isElementSelected = useStore((state) => state.isElementSelected);
  const selectElement = useStore((state) => state.selectElement);
  const toggleElementSelection = useStore((state) => state.toggleElementSelection);

  const isMultiDragLeader = useDraggingNodesStore((state) => state.isMultiDragLeader);

  const isMultiSelectMode = selectedElements.size > 0;

  if (!stoneSelection) return null;

  const handleStoneClick = (e?: FederatedMouseEvent) => {
    const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
    if (isMultiSelectKey) {
      if (
        selectedElement &&
        !selectedElements.has(selectedElement.id) &&
        selectedElement.type !== 'connection'
      ) {
        toggleElementSelection(selectedElement.id, selectedElement.type);
      }
      toggleElementSelection(STONE_SELECTION_ID, 'stone');
    } else {
      selectElement(STONE_SELECTION_ID, 'stone');
    }
  };

  return (
    <StoneSelectionElement
      stone={stoneSelection}
      isSelected={isElementSelected(STONE_SELECTION_ID, 'stone')}
      onSelect={handleStoneClick}
      onContextMenu={onContextMenu}
      onDragStart={() => {
        if (isMultiSelectMode && isElementSelected(STONE_SELECTION_ID, 'stone')) {
          handleMultiDragStart(STONE_SELECTION_ID);
        }
      }}
      onDragMove={(pos) => {
        if (isMultiSelectMode && isMultiDragLeader(STONE_SELECTION_ID)) {
          handleMultiDragMove(STONE_SELECTION_ID, pos);
        }
      }}
      onDragEnd={(finalPos) => {
        if (isMultiSelectMode && isMultiDragLeader(STONE_SELECTION_ID)) {
          handleMultiDragEnd(STONE_SELECTION_ID, finalPos);
        }
      }}
    />
  );
};
