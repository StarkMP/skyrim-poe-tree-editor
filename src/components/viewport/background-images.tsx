import { FederatedMouseEvent } from 'pixi.js';
import { useMemo } from 'react';

import { useStore } from '@/store';

import {
  handleMultiDragEnd,
  handleMultiDragMove,
  handleMultiDragStart,
  useDraggingNodesStore,
} from './dragging-nodes';
import { BackgroundImage } from './tree-elements/background-image';

export const BackgroundImages = ({
  onContextMenu,
}: {
  onContextMenu: (id: string, x: number, y: number) => void;
}) => {
  const images = useStore((state) => state.images);
  const selectedElement = useStore((state) => state.selectedElement);
  const selectedElements = useStore((state) => state.selectedElements);
  const isElementSelected = useStore((state) => state.isElementSelected);
  const selectElement = useStore((state) => state.selectElement);
  const toggleElementSelection = useStore((state) => state.toggleElementSelection);
  const imagesArray = useMemo(() => Object.entries(images), [images]);

  const isMultiDragLeader = useDraggingNodesStore((state) => state.isMultiDragLeader);

  const isMultiSelectMode = selectedElements.size > 0;

  const handleImageClick = (imageId: string, e?: FederatedMouseEvent) => {
    const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
    if (isMultiSelectKey) {
      if (
        selectedElement &&
        !selectedElements.has(selectedElement.id) &&
        selectedElement.type !== 'connection'
      ) {
        toggleElementSelection(selectedElement.id, selectedElement.type);
      }
      toggleElementSelection(imageId, 'image');
    } else {
      selectElement(imageId, 'image');
    }
  };

  return (
    <pixiContainer>
      {imagesArray.map(([id, image]) => (
        <BackgroundImage
          key={id}
          id={id}
          image={image}
          isSelected={isElementSelected(id, 'image')}
          onSelect={(e) => handleImageClick(id, e)}
          onContextMenu={onContextMenu}
          onDragStart={() => {
            if (isMultiSelectMode && isElementSelected(id, 'image')) {
              handleMultiDragStart(id);
            }
          }}
          onDragMove={(pos) => {
            if (isMultiSelectMode && isMultiDragLeader(id)) {
              handleMultiDragMove(id, pos);
            }
          }}
          onDragEnd={(finalPos) => {
            if (isMultiSelectMode && isMultiDragLeader(id)) {
              handleMultiDragEnd(id, finalPos);
            }
          }}
        />
      ))}
    </pixiContainer>
  );
};
