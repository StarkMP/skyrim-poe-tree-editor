import { FederatedMouseEvent } from 'pixi.js';
import { useMemo } from 'react';

import { useStore } from '@/store';

import {
  handleMultiDragEnd,
  handleMultiDragMove,
  handleMultiDragStart,
  useDraggingNodesStore,
} from './dragging-nodes';
import { OrbitElement } from './tree-elements/orbit-element';

export const Orbits = ({
  onContextMenu,
}: {
  onContextMenu: (id: string, x: number, y: number) => void;
}) => {
  const orbits = useStore((state) => state.orbits);
  const selectedElement = useStore((state) => state.selectedElement);
  const selectedElements = useStore((state) => state.selectedElements);
  const isElementSelected = useStore((state) => state.isElementSelected);
  const selectElement = useStore((state) => state.selectElement);
  const toggleElementSelection = useStore((state) => state.toggleElementSelection);

  const isMultiDragLeader = useDraggingNodesStore((state) => state.isMultiDragLeader);

  const orbitsArray = useMemo(() => Object.entries(orbits), [orbits]);

  const isMultiSelectMode = selectedElements.size > 0;

  const handleOrbitClick = (orbitId: string, e?: FederatedMouseEvent) => {
    const isMultiSelectKey = e?.shiftKey || e?.ctrlKey;
    if (isMultiSelectKey) {
      if (
        selectedElement &&
        !selectedElements.has(selectedElement.id) &&
        selectedElement.type !== 'connection'
      ) {
        toggleElementSelection(selectedElement.id, selectedElement.type);
      }
      toggleElementSelection(orbitId, 'orbit');
    } else {
      selectElement(orbitId, 'orbit');
    }
  };

  return (
    <pixiContainer>
      {orbitsArray.map(([id, orbit]) => (
        <OrbitElement
          key={id}
          id={id}
          orbit={orbit}
          isSelected={isElementSelected(id, 'orbit')}
          onSelect={(e) => handleOrbitClick(id, e)}
          onContextMenu={onContextMenu}
          onDragStart={() => {
            if (isMultiSelectMode && isElementSelected(id, 'orbit')) {
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
